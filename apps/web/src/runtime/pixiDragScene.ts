import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  type Ticker,
} from "pixi.js";
import { loadSvgTexture } from "./svgTexture";
import {
  attachPixiPerformanceDiagnostics,
  markInputForDiagnostics,
} from "./performanceMetrics";

export interface PixiDragItem {
  readonly id: string;
  readonly svg: string;
  readonly label: string;
}

export interface PixiDropTarget {
  readonly id: string;
  readonly label: string;
  readonly color?: string;
  readonly svg?: string;
}

export type DropVerdict = "correct" | "incorrect" | "ignore";

export interface PixiDragSceneOptions {
  readonly items: readonly PixiDragItem[];
  readonly targets: readonly PixiDropTarget[];
  readonly presentation: "bins" | "holes";
  readonly reducedMotion: boolean;
  /** Core/runtime decide correctness; rendererul doar prezintă verdictul. */
  readonly onDrop: (itemId: string, targetId: string) => DropVerdict;
}

export interface PixiDragScene {
  readonly readyElement: HTMLElement;
  readonly emphasizeTarget: (targetId: string) => void;
  readonly autoPlace: (itemId: string, targetId: string) => Promise<void>;
  readonly destroy: () => void;
}

interface ItemVisual {
  readonly id: string;
  readonly container: Container;
  readonly halo: Graphics;
  readonly sprite: Sprite;
  readonly button: HTMLButtonElement;
  homeX: number;
  homeY: number;
  size: number;
  placed: boolean;
}

interface TargetVisual {
  readonly id: string;
  readonly container: Container;
  readonly plate: Graphics;
  readonly sprite: Sprite | null;
  readonly button: HTMLButtonElement;
  readonly color: number;
  x: number;
  y: number;
  width: number;
  height: number;
  placedCount: number;
  highlighted: boolean;
}

function hexColor(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value.replace("#", ""), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function drawTarget(
  target: TargetVisual,
  presentation: PixiDragSceneOptions["presentation"],
): void {
  const { plate, width, height, color, highlighted } = target;
  plate.clear();
  if (presentation === "bins") {
    plate
      .roundRect(-width / 2, -height * 0.32, width, height * 0.72, 26)
      .fill({ color, alpha: 0.82 })
      .stroke({
        color: highlighted ? 0xffd35c : color,
        width: highlighted ? 13 : 6,
        alpha: 1,
      })
      .ellipse(0, -height * 0.3, width * 0.5, height * 0.18)
      .fill({ color: 0x4a3f35, alpha: 0.18 })
      .stroke({ color: 0xffffff, width: 5, alpha: 0.65 });
  } else {
    plate
      .roundRect(-width / 2, -height / 2, width, height, 30)
      .fill({ color: 0xfffdf7, alpha: 0.78 })
      .stroke({
        color: highlighted ? 0xffb63c : 0xd8cdbb,
        width: highlighted ? 12 : 6,
        alpha: highlighted ? 0.9 : 0.55,
      });
  }
}

export async function createPixiDragScene(
  host: HTMLElement,
  options: PixiDragSceneOptions,
): Promise<PixiDragScene> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    backgroundAlpha: 0,
    preference: "webgl",
    powerPreference: "high-performance",
  });

  app.canvas.className = "pixi-stage";
  app.canvas.setAttribute("aria-hidden", "true");
  host.classList.add("pixi-host");
  host.append(app.canvas);
  const stopPerformanceDiagnostics = attachPixiPerformanceDiagnostics(
    app.ticker,
  );
  app.stage.sortableChildren = true;
  app.stage.eventMode = "static";

  const accessibility = document.createElement("div");
  accessibility.className = "pixi-drag-accessibility";
  accessibility.setAttribute("role", "group");
  accessibility.setAttribute(
    "aria-label",
    options.presentation === "bins"
      ? "Sortează obiectele în coșuri"
      : "Potrivește formele",
  );
  host.append(accessibility);

  const releases: Array<() => void> = [];
  const tickerCallbacks = new Set<(ticker: Ticker) => void>();
  const items: ItemVisual[] = [];
  const targets: TargetVisual[] = [];
  let destroyed = false;
  let enabled = false;
  let selectedId: string | null = null;
  let active:
    | {
        item: ItemVisual;
        offsetX: number;
        offsetY: number;
        startX: number;
        startY: number;
        moved: boolean;
      }
    | null = null;

  for (const definition of options.targets) {
    const container = new Container();
    const plate = new Graphics();
    let sprite: Sprite | null = null;
    if (definition.svg) {
      const loaded = await loadSvgTexture(definition.svg);
      releases.push(loaded.release);
      sprite = new Sprite(loaded.texture);
      sprite.anchor.set(0.5);
      container.addChild(plate, sprite);
    } else {
      container.addChild(plate);
    }
    const button = document.createElement("button");
    button.className = "pixi-drop-target";
    button.type = "button";
    button.setAttribute("aria-label", definition.label);
    accessibility.append(button);

    const target: TargetVisual = {
      id: definition.id,
      container,
      plate,
      sprite,
      button,
      color: hexColor(definition.color, 0x7fc86b),
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      placedCount: 0,
      highlighted: false,
    };
    button.addEventListener("click", () => {
      if (!enabled || selectedId === null) return;
      const item = items.find((candidate) => candidate.id === selectedId);
      if (item && !item.placed) resolveDrop(item, target);
    });
    targets.push(target);
    app.stage.addChild(container);
  }

  for (const definition of options.items) {
    const loaded = await loadSvgTexture(definition.svg);
    releases.push(loaded.release);
    const container = new Container();
    container.eventMode = "static";
    container.cursor = "grab";
    container.zIndex = 5;
    const halo = new Graphics();
    const sprite = new Sprite(loaded.texture);
    sprite.anchor.set(0.5);
    container.addChild(halo, sprite);

    const button = document.createElement("button");
    button.className = "pixi-drag-item";
    button.type = "button";
    button.setAttribute("aria-label", definition.label);
    button.setAttribute("aria-pressed", "false");
    accessibility.append(button);

    const item: ItemVisual = {
      id: definition.id,
      container,
      halo,
      sprite,
      button,
      homeX: 0,
      homeY: 0,
      size: 0,
      placed: false,
    };

    container.on("pointerdown", (event: FederatedPointerEvent) => {
      if (!enabled || item.placed) return;
      markInputForDiagnostics();
      const local = app.stage.toLocal(event.global);
      active = {
        item,
        offsetX: item.container.x - local.x,
        offsetY: item.container.y - local.y,
        startX: local.x,
        startY: local.y,
        moved: false,
      };
      selectedId = item.id;
      updateSelection();
      item.container.zIndex = 20;
      item.container.scale.set(1.07);
      item.container.cursor = "grabbing";
    });
    button.addEventListener("click", () => {
      if (!enabled || item.placed) return;
      selectedId = selectedId === item.id ? null : item.id;
      updateSelection();
    });
    button.addEventListener("pointerdown", markInputForDiagnostics);

    items.push(item);
    app.stage.addChild(container);
  }

  function updateSelection(): void {
    items.forEach((item) => {
      const selected = selectedId === item.id;
      item.button.setAttribute("aria-pressed", String(selected));
      item.halo.alpha = selected ? 1 : 0.55;
    });
  }

  const layout = () => {
    if (destroyed) return;
    const width = app.screen.width;
    const height = app.screen.height;
    app.stage.hitArea = new Rectangle(0, 0, width, height);

    const targetGap = Math.max(16, Math.min(40, width * 0.04));
    const targetWidth = Math.min(
      options.presentation === "bins" ? 230 : 205,
      (width - targetGap * (targets.length + 1)) / targets.length,
      height * 0.34,
    );
    const targetHeight =
      targetWidth * (options.presentation === "bins" ? 0.82 : 1);
    const targetTotal =
      targetWidth * targets.length + targetGap * (targets.length - 1);
    const targetStart = (width - targetTotal) / 2 + targetWidth / 2;
    const targetY = height * 0.3;
    targets.forEach((target, index) => {
      target.x = targetStart + index * (targetWidth + targetGap);
      target.y = targetY;
      target.width = targetWidth;
      target.height = targetHeight;
      target.container.position.set(target.x, target.y);
      target.container.hitArea = new Rectangle(
        -targetWidth / 2 - 18,
        -targetHeight / 2 - 18,
        targetWidth + 36,
        targetHeight + 36,
      );
      drawTarget(target, options.presentation);
      if (target.sprite) {
        const artSize = targetWidth * 0.72;
        target.sprite.width = artSize;
        target.sprite.height = artSize;
      }
      target.button.style.left = `${target.x - targetWidth / 2}px`;
      target.button.style.top = `${target.y - targetHeight / 2}px`;
      target.button.style.width = `${targetWidth}px`;
      target.button.style.height = `${targetHeight}px`;
    });

    const itemGap = Math.max(12, Math.min(28, width * 0.025));
    const itemSize = Math.min(
      150,
      (width - itemGap * (items.length + 1)) / items.length,
      height * 0.25,
    );
    const itemTotal = itemSize * items.length + itemGap * (items.length - 1);
    const itemStart = (width - itemTotal) / 2 + itemSize / 2;
    const itemY = height * 0.75;
    items.forEach((item, index) => {
      item.size = itemSize;
      if (!item.placed) {
        item.homeX = itemStart + index * (itemSize + itemGap);
        item.homeY = itemY;
        item.container.position.set(item.homeX, item.homeY);
      }
      item.container.hitArea = new Rectangle(
        -itemSize / 2 - 12,
        -itemSize / 2 - 12,
        itemSize + 24,
        itemSize + 24,
      );
      item.halo
        .clear()
        .ellipse(0, itemSize * 0.32, itemSize * 0.42, itemSize * 0.14)
        .fill({ color: 0x4a3f35, alpha: 0.16 })
        .circle(0, 0, itemSize * 0.48)
        .fill({ color: 0xffffff, alpha: 0.45 });
      item.sprite.width = itemSize * 0.78;
      item.sprite.height = itemSize * 0.78;
      item.button.style.left = `${item.homeX - itemSize / 2}px`;
      item.button.style.top = `${item.homeY - itemSize / 2}px`;
      item.button.style.width = `${itemSize}px`;
      item.button.style.height = `${itemSize}px`;
    });
    updateSelection();
  };

  app.renderer.on("resize", layout);
  layout();

  const tween = (
    duration: number,
    update: (progress: number) => void,
    complete?: () => void,
  ): Promise<void> =>
    new Promise((resolve) => {
      if (options.reducedMotion || destroyed) {
        update(1);
        complete?.();
        resolve();
        return;
      }
      let elapsed = 0;
      const tick = (ticker: Ticker) => {
        elapsed += ticker.deltaMS;
        const progress = Math.min(1, elapsed / duration);
        update(progress);
        if (progress >= 1) {
          app.ticker.remove(tick);
          tickerCallbacks.delete(tick);
          complete?.();
          resolve();
        }
      };
      tickerCallbacks.add(tick);
      app.ticker.add(tick);
    });

  const returnHome = (item: ItemVisual): void => {
    const fromX = item.container.x;
    const fromY = item.container.y;
    item.container.zIndex = 5;
    item.container.cursor = "grab";
    void tween(
      430,
      (progress) => {
        const eased = 1 - Math.pow(1 - progress, 3);
        item.container.position.set(
          fromX + (item.homeX - fromX) * eased,
          fromY + (item.homeY - fromY) * eased,
        );
        item.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.05);
      },
      () => item.container.scale.set(1),
    );
  };

  const place = async (
    item: ItemVisual,
    target: TargetVisual,
  ): Promise<void> => {
    item.placed = true;
    item.button.disabled = true;
    selectedId = null;
    updateSelection();
    const fromX = item.container.x;
    const fromY = item.container.y;
    const slotOffset =
      options.presentation === "bins"
        ? (target.placedCount - 1) * Math.min(24, target.width * 0.13)
        : 0;
    const destinationX = target.x + slotOffset;
    const destinationY =
      target.y + (options.presentation === "bins" ? target.height * 0.07 : 0);
    target.placedCount += 1;
    await tween(360, (progress) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      item.container.position.set(
        fromX + (destinationX - fromX) * eased,
        fromY + (destinationY - fromY) * eased,
      );
      const finalScale = options.presentation === "bins" ? 0.48 : 0.72;
      item.container.scale.set(1 + (finalScale - 1) * eased);
      item.container.rotation = Math.sin(progress * Math.PI) * 0.08;
    });
    item.container.rotation = 0;
    item.container.zIndex = options.presentation === "bins" ? 0 : 3;
  };

  function resolveDrop(item: ItemVisual, target: TargetVisual): void {
    if (!enabled || item.placed) return;
    const verdict = options.onDrop(item.id, target.id);
    if (verdict === "correct") {
      void place(item, target);
    } else if (verdict === "incorrect") {
      returnHome(item);
    }
  }

  const nearestTarget = (x: number, y: number): TargetVisual | null => {
    let best: { target: TargetVisual; distance: number } | null = null;
    for (const target of targets) {
      const dx = x - target.x;
      const dy = y - target.y;
      const distance = Math.hypot(dx, dy);
      const magneticRadius = Math.max(target.width, target.height) * 0.72 + 36;
      if (distance <= magneticRadius && (!best || distance < best.distance)) {
        best = { target, distance };
      }
    }
    return best?.target ?? null;
  };

  const clearTargetHighlights = () => {
    targets.forEach((target) => {
      if (!target.highlighted) return;
      target.highlighted = false;
      drawTarget(target, options.presentation);
    });
  };

  app.stage.on("globalpointermove", (event: FederatedPointerEvent) => {
    if (!active || destroyed) return;
    const local = app.stage.toLocal(event.global);
    active.moved ||= Math.hypot(
      local.x - active.startX,
      local.y - active.startY,
    ) > 7;
    active.item.container.position.set(
      local.x + active.offsetX,
      local.y + active.offsetY,
    );
    const nearest = nearestTarget(
      active.item.container.x,
      active.item.container.y,
    );
    targets.forEach((target) => {
      const highlighted = target === nearest;
      if (target.highlighted === highlighted) return;
      target.highlighted = highlighted;
      drawTarget(target, options.presentation);
    });
  });

  const endDrag = () => {
    if (!active) return;
    const dragging = active;
    active = null;
    clearTargetHighlights();
    dragging.item.container.scale.set(1);
    dragging.item.container.cursor = "grab";
    const target = nearestTarget(
      dragging.item.container.x,
      dragging.item.container.y,
    );
    if (dragging.moved && target) resolveDrop(dragging.item, target);
    else if (dragging.moved) returnHome(dragging.item);
  };
  app.stage.on("pointerup", endDrag);
  app.stage.on("pointerupoutside", endDrag);
  app.stage.on("pointercancel", endDrag);

  enabled = true;

  return {
    readyElement: accessibility,
    emphasizeTarget(targetId) {
      const target = targets.find((candidate) => candidate.id === targetId);
      if (!target) return;
      target.highlighted = true;
      drawTarget(target, options.presentation);
      void tween(650, (progress) => {
        target.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.08);
      }, () => {
        target.container.scale.set(1);
        target.highlighted = false;
        drawTarget(target, options.presentation);
      });
    },
    async autoPlace(itemId, targetId) {
      const item = items.find((candidate) => candidate.id === itemId);
      const target = targets.find((candidate) => candidate.id === targetId);
      if (!item || !target || item.placed) return;
      await place(item, target);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      app.renderer.off("resize", layout);
      tickerCallbacks.forEach((callback) => app.ticker.remove(callback));
      tickerCallbacks.clear();
      stopPerformanceDiagnostics();
      accessibility.remove();
      app.destroy({ removeView: true }, { children: true });
      releases.forEach((release) => release());
      host.classList.remove("pixi-host");
    },
  };
}
