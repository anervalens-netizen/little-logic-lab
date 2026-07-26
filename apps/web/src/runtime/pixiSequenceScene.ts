import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  type Ticker,
} from "pixi.js";
import { loadSvgTexture } from "./svgTexture";
import {
  attachPixiPerformanceDiagnostics,
  markInputForDiagnostics,
} from "./performanceMetrics";

export interface PixiSequenceCard {
  readonly id: string;
  readonly svg: string;
  readonly label: string;
}

export interface PixiSequenceSceneOptions {
  readonly cards: readonly PixiSequenceCard[];
  readonly slotCount: number;
  readonly reducedMotion: boolean;
  readonly onSelect: (id: string) => void;
}

export interface PixiSequenceScene {
  readonly readyElement: HTMLElement;
  readonly accept: (id: string, slotIndex: number) => Promise<void>;
  readonly markIncorrect: (id: string) => void;
  readonly emphasize: (id: string) => void;
  readonly destroy: () => void;
}

interface CardVisual {
  readonly id: string;
  readonly container: Container;
  readonly plate: Graphics;
  readonly sprite: Sprite;
  readonly button: HTMLButtonElement;
  homeX: number;
  homeY: number;
  size: number;
  slotIndex: number | null;
}

function drawCardPlate(
  plate: Graphics,
  size: number,
  state: "idle" | "hint" | "placed",
): void {
  const border =
    state === "hint" ? 0xffb63c : state === "placed" ? 0x7fc86b : 0xd8cdbb;
  plate
    .clear()
    .roundRect(-size / 2 + 4, -size / 2 + 8, size - 8, size - 8, 28)
    .fill({ color: 0x6f6256, alpha: 0.15 })
    .roundRect(-size / 2, -size / 2, size, size - 8, 28)
    .fill({ color: 0xfffdf7, alpha: 0.96 })
    .stroke({
      color: border,
      width: state === "hint" ? 11 : 5,
      alpha: state === "idle" ? 0.45 : 0.9,
    });
}

export async function createPixiSequenceScene(
  host: HTMLElement,
  options: PixiSequenceSceneOptions,
): Promise<PixiSequenceScene> {
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

  const accessibility = document.createElement("div");
  accessibility.className = "pixi-sequence-accessibility";
  accessibility.setAttribute("role", "group");
  accessibility.setAttribute("aria-label", "Pune imaginile în ordine");
  host.append(accessibility);

  const releases: Array<() => void> = [];
  const tickerCallbacks = new Set<(ticker: Ticker) => void>();
  const slotsLayer = new Container();
  app.stage.addChild(slotsLayer);
  const slotPlates = Array.from({ length: options.slotCount }, (_, index) => {
    const slot = new Container();
    const plate = new Graphics();
    const number = new Text({
      text: String(index + 1),
      style: new TextStyle({
        fill: 0x7b6a58,
        fontFamily: "system-ui, sans-serif",
        fontSize: 30,
        fontWeight: "800",
      }),
    });
    number.anchor.set(0.5);
    number.alpha = 0.55;
    slot.addChild(plate, number);
    slotsLayer.addChild(slot);
    return { slot, plate, number, x: 0, y: 0, size: 0 };
  });

  const cards: CardVisual[] = [];
  let destroyed = false;
  let enabled = false;

  for (const definition of options.cards) {
    const loaded = await loadSvgTexture(definition.svg);
    releases.push(loaded.release);
    const container = new Container();
    container.eventMode = "static";
    container.cursor = "pointer";
    const plate = new Graphics();
    const sprite = new Sprite(loaded.texture);
    sprite.anchor.set(0.5);
    container.addChild(plate, sprite);
    app.stage.addChild(container);

    const button = document.createElement("button");
    button.className = "pixi-sequence-card";
    button.type = "button";
    button.setAttribute("aria-label", definition.label);
    accessibility.append(button);

    const card: CardVisual = {
      id: definition.id,
      container,
      plate,
      sprite,
      button,
      homeX: 0,
      homeY: 0,
      size: 0,
      slotIndex: null,
    };
    const press = () => {
      if (!enabled || card.slotIndex !== null) return;
      markInputForDiagnostics();
      card.container.scale.set(0.94);
    };
    const release = () => {
      if (!enabled || card.slotIndex !== null) return;
      card.container.scale.set(1);
    };
    const select = () => {
      if (!enabled || card.slotIndex !== null) return;
      card.container.scale.set(1);
      options.onSelect(card.id);
    };
    container.on("pointerdown", press);
    container.on("pointerup", select);
    container.on("pointerupoutside", release);
    container.on("pointercancel", release);
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointercancel", release);
    button.addEventListener("click", select);
    cards.push(card);
  }

  const layout = () => {
    if (destroyed) return;
    const width = app.screen.width;
    const height = app.screen.height;
    const gap = Math.max(14, Math.min(32, width * 0.035));
    const slotColumns = Math.min(
      options.slotCount,
      width < 600 ? 3 : 6,
    );
    const cardColumns = Math.min(options.cards.length, width < 600 ? 3 : 6);
    const slotRows = Math.ceil(options.slotCount / slotColumns);
    const cardRows = Math.ceil(options.cards.length / cardColumns);
    const totalRows = slotRows + cardRows;
    const size = Math.max(
      96,
      Math.min(
        180,
        (width - gap * (Math.max(slotColumns, cardColumns) + 1)) /
          Math.max(slotColumns, cardColumns),
        (height * 0.86 - gap * (totalRows + 1)) / totalRows,
      ),
    );
    const slotTotal = size * slotColumns + gap * (slotColumns - 1);
    const slotStart = (width - slotTotal) / 2 + size / 2;
    slotPlates.forEach((entry, index) => {
      const row = Math.floor(index / slotColumns);
      const column = index % slotColumns;
      entry.x = slotStart + column * (size + gap);
      entry.y = height * 0.07 + row * (size + gap) + size / 2;
      entry.size = size;
      entry.slot.position.set(entry.x, entry.y);
      entry.plate
        .clear()
        .roundRect(-size / 2, -size / 2, size, size, 28)
        .fill({ color: 0xffffff, alpha: 0.38 })
        .stroke({ color: 0xd8cdbb, width: 5, alpha: 0.55 });
      entry.number.style.fontSize = Math.max(28, size * 0.24);
    });

    const cardTotal = size * cardColumns + gap * (cardColumns - 1);
    const cardStart = (width - cardTotal) / 2 + size / 2;
    const cardTop =
      height * 0.07 + slotRows * (size + gap) + gap + size / 2;
    cards.forEach((card, index) => {
      const row = Math.floor(index / cardColumns);
      const column = index % cardColumns;
      card.size = size;
      card.homeX = cardStart + column * (size + gap);
      card.homeY = cardTop + row * (size + gap);
      const slot =
        card.slotIndex === null ? null : slotPlates[card.slotIndex] ?? null;
      const x = slot?.x ?? card.homeX;
      const y = slot?.y ?? card.homeY;
      card.container.position.set(x, y);
      card.container.hitArea = new Rectangle(
        -size / 2 - 10,
        -size / 2 - 10,
        size + 20,
        size + 20,
      );
      drawCardPlate(
        card.plate,
        size,
        card.slotIndex === null ? "idle" : "placed",
      );
      card.sprite.width = size * 0.68;
      card.sprite.height = size * 0.68;
      card.button.style.left = `${x - size / 2}px`;
      card.button.style.top = `${y - size / 2}px`;
      card.button.style.width = `${size}px`;
      card.button.style.height = `${size}px`;
    });
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
        if (progress < 1) return;
        app.ticker.remove(tick);
        tickerCallbacks.delete(tick);
        complete?.();
        resolve();
      };
      tickerCallbacks.add(tick);
      app.ticker.add(tick);
    });
  const byId = (id: string) => cards.find((card) => card.id === id);
  enabled = true;

  return {
    readyElement: accessibility,
    async accept(id, slotIndex) {
      const card = byId(id);
      const slot = slotPlates[slotIndex];
      if (!card || !slot || card.slotIndex !== null) return;
      card.slotIndex = slotIndex;
      card.button.disabled = true;
      card.container.cursor = "default";
      drawCardPlate(card.plate, card.size, "placed");
      const fromX = card.container.x;
      const fromY = card.container.y;
      await tween(420, (progress) => {
        const eased = 1 - Math.pow(1 - progress, 3);
        card.container.position.set(
          fromX + (slot.x - fromX) * eased,
          fromY + (slot.y - fromY) * eased,
        );
        card.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.08);
        card.button.style.left = `${card.container.x - card.size / 2}px`;
        card.button.style.top = `${card.container.y - card.size / 2}px`;
      });
      card.container.scale.set(1);
      card.button.style.left = `${slot.x - card.size / 2}px`;
      card.button.style.top = `${slot.y - card.size / 2}px`;
    },
    markIncorrect(id) {
      const card = byId(id);
      if (!card || card.slotIndex !== null) return;
      const startX = card.container.x;
      void tween(360, (progress) => {
        card.container.x =
          startX + Math.sin(progress * Math.PI * 4) * (1 - progress) * 11;
      }, () => {
        card.container.x = startX;
      });
    },
    emphasize(id) {
      const card = byId(id);
      if (!card || card.slotIndex !== null) return;
      drawCardPlate(card.plate, card.size, "hint");
      void tween(560, (progress) => {
        card.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.09);
      }, () => {
        card.container.scale.set(1);
        drawCardPlate(card.plate, card.size, "idle");
      });
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
