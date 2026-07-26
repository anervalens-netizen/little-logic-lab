import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  type Ticker,
} from "pixi.js";
import type {
  TraceGuideStrength,
  TracePathWidth,
  TracePoint,
} from "@core";
import {
  acquirePixiApplication,
  releasePixiApplication,
} from "./pixiApplication";
import { loadSvgTexture } from "./svgTexture";
import {
  attachPixiPerformanceDiagnostics,
  markInputForDiagnostics,
} from "./performanceMetrics";

export interface PixiTraceSceneOptions {
  readonly points: readonly TracePoint[];
  readonly pathWidth: TracePathWidth;
  readonly guideStrength: TraceGuideStrength;
  readonly walkerSvg: string;
  readonly goalSvg: string;
  readonly reducedMotion: boolean;
  readonly onAdvance: (pointIndex: number) => boolean;
}

export interface PixiTraceScene {
  readonly readyElement: HTMLElement;
  readonly emphasizeNext: () => void;
  readonly autoAdvance: (pointIndex: number) => Promise<void>;
  readonly destroy: () => void;
}

interface PixelPoint {
  x: number;
  y: number;
}

const WIDTH_BY_LEVEL: Readonly<Record<TracePathWidth, number>> = {
  very_wide: 92,
  wide: 76,
  medium: 60,
  narrow: 46,
};

function distanceToSegment(
  point: PixelPoint,
  start: PixelPoint,
  end: PixelPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );
  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.y - (start.y + projection * dy),
  );
}

export async function createPixiTraceScene(
  host: HTMLElement,
  options: PixiTraceSceneOptions,
): Promise<PixiTraceScene> {
  if (options.points.length < 2) {
    throw new Error("A trace scene needs at least two points.");
  }
  const app = await acquirePixiApplication(host);
  app.canvas.style.touchAction = "none";
  const stopPerformanceDiagnostics = attachPixiPerformanceDiagnostics(
    app.ticker,
  );

  const accessibility = document.createElement("div");
  accessibility.className = "pixi-trace-accessibility";
  accessibility.setAttribute("role", "group");
  accessibility.setAttribute(
    "aria-label",
    `Urmează drumul în ${options.points.length - 1} pași`,
  );
  host.append(accessibility);

  const releases: Array<() => void> = [];
  const tickerCallbacks = new Set<(ticker: Ticker) => void>();
  const background = new Graphics();
  const roadBorder = new Graphics();
  const road = new Graphics();
  const progressRoad = new Graphics();
  const guides = new Graphics();
  const highlight = new Graphics();
  const goalTexture = await loadSvgTexture(options.goalSvg);
  releases.push(goalTexture.release);
  const walkerTexture = await loadSvgTexture(options.walkerSvg);
  releases.push(walkerTexture.release);
  const goal = new Sprite(goalTexture.texture);
  const walker = new Sprite(walkerTexture.texture);
  goal.anchor.set(0.5);
  walker.anchor.set(0.5);
  const artLayer = new Container();
  artLayer.addChild(goal, walker);
  app.stage.addChild(
    background,
    roadBorder,
    road,
    progressRoad,
    guides,
    highlight,
    artLayer,
  );
  app.stage.eventMode = "static";

  const buttons = options.points.slice(1).map((_, index) => {
    const button = document.createElement("button");
    button.className = "pixi-trace-checkpoint";
    button.type = "button";
    button.setAttribute("aria-label", `pasul ${index + 1} spre casă`);
    accessibility.append(button);
    return button;
  });

  const pixelPoints: PixelPoint[] = options.points.map(() => ({ x: 0, y: 0 }));
  let progressIndex = 0;
  let activePointer = false;
  let animating = false;
  let destroyed = false;
  let roadWidth = WIDTH_BY_LEVEL[options.pathWidth];

  const drawPolyline = (
    graphics: Graphics,
    points: readonly PixelPoint[],
    width: number,
    color: number,
    alpha: number,
  ) => {
    graphics.clear();
    const first = points[0];
    if (!first) return;
    graphics.moveTo(first.x, first.y);
    for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.stroke({ color, width, alpha });
  };

  const updateButtons = () => {
    accessibility.dataset.traceProgress = String(progressIndex);
    buttons.forEach((button, index) => {
      const point = pixelPoints[index + 1];
      if (!point) return;
      const size = 96;
      button.style.left = `${point.x - size / 2}px`;
      button.style.top = `${point.y - size / 2}px`;
      button.style.width = `${size}px`;
      button.style.height = `${size}px`;
      button.disabled = index + 1 !== progressIndex + 1;
    });
  };

  const redrawProgress = () => {
    drawPolyline(
      progressRoad,
      pixelPoints.slice(0, progressIndex + 1),
      Math.max(12, roadWidth * 0.2),
      0x7fc86b,
      0.95,
    );
  };

  const layout = () => {
    if (destroyed) return;
    const width = app.screen.width;
    const height = app.screen.height;
    app.stage.hitArea = new Rectangle(0, 0, width, height);
    const padX = Math.max(54, width * 0.08);
    const padY = Math.max(52, height * 0.08);
    options.points.forEach((point, index) => {
      const pixel = pixelPoints[index];
      if (!pixel) return;
      pixel.x = padX + point.x * (width - padX * 2);
      pixel.y = padY + point.y * (height - padY * 2);
    });
    roadWidth = Math.min(
      WIDTH_BY_LEVEL[options.pathWidth],
      Math.max(42, Math.min(width, height) * 0.16),
    );
    background
      .clear()
      .circle(width * 0.18, height * 0.22, 15)
      .fill({ color: 0xffd35c, alpha: 0.16 })
      .circle(width * 0.82, height * 0.72, 20)
      .fill({ color: 0x7fc86b, alpha: 0.18 })
      .circle(width * 0.7, height * 0.16, 10)
      .fill({ color: 0x4fa8e8, alpha: 0.14 });
    drawPolyline(roadBorder, pixelPoints, roadWidth + 12, 0xbcae99, 0.55);
    drawPolyline(
      road,
      pixelPoints,
      roadWidth,
      0xf7eddb,
      options.guideStrength === "on_request"
        ? 0.5
        : options.guideStrength === "faint"
          ? 0.65
          : 0.9,
    );
    guides.clear();
    const guideAlpha = {
      full: 0.82,
      partial: 0.52,
      faint: 0.26,
      on_request: 0,
    }[options.guideStrength];
    pixelPoints.slice(1, -1).forEach((point) => {
      guides
        .circle(point.x, point.y, Math.max(7, roadWidth * 0.11))
        .fill({ color: 0xffd35c, alpha: guideAlpha })
        .stroke({ color: 0xffffff, width: 3, alpha: guideAlpha });
    });
    const start = pixelPoints[progressIndex] ?? pixelPoints[0]!;
    const end = pixelPoints.at(-1)!;
    const routeStart = pixelPoints[0]!;
    accessibility.dataset.traceStartX = String(routeStart.x);
    accessibility.dataset.traceStartY = String(routeStart.y);
    const artSize = Math.min(108, Math.max(76, roadWidth * 1.2));
    walker.width = artSize;
    walker.height = artSize;
    walker.position.set(start.x, start.y);
    goal.width = artSize * 1.08;
    goal.height = artSize * 1.08;
    goal.position.set(end.x, end.y);
    redrawProgress();
    updateButtons();
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

  const advance = async (pointIndex: number): Promise<void> => {
    if (
      destroyed ||
      animating ||
      pointIndex !== progressIndex + 1 ||
      !options.onAdvance(pointIndex)
    ) {
      return;
    }
    animating = true;
    const from = { x: walker.x, y: walker.y };
    const destination = pixelPoints[pointIndex];
    if (!destination) {
      animating = false;
      return;
    }
    progressIndex = pointIndex;
    updateButtons();
    await tween(300, (progress) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      walker.position.set(
        from.x + (destination.x - from.x) * eased,
        from.y + (destination.y - from.y) * eased,
      );
      walker.scale.set(1 + Math.sin(progress * Math.PI) * 0.08);
    });
    walker.scale.set(1);
    redrawProgress();
    animating = false;
  };

  buttons.forEach((button, index) => {
    button.addEventListener("pointerdown", markInputForDiagnostics);
    button.addEventListener("click", () => void advance(index + 1));
  });

  const pointerPosition = (event: PointerEvent): PixelPoint => {
    const bounds = app.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * app.screen.width,
      y: ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * app.screen.height,
    };
  };
  const onPointerDown = (event: PointerEvent) => {
    if (animating || destroyed) return;
    markInputForDiagnostics();
    activePointer = true;
    try {
      app.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be unavailable for synthetic accessibility events.
    }
    const point = pointerPosition(event);
    const current = pixelPoints[progressIndex];
    const next = pixelPoints[progressIndex + 1];
    if (current && next && distanceToSegment(point, current, next) <= roadWidth) {
      walker.position.set(point.x, point.y);
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!activePointer || animating || destroyed) return;
    const point = pointerPosition(event);
    const current = pixelPoints[progressIndex];
    const next = pixelPoints[progressIndex + 1];
    if (!current || !next) return;
    const tolerance = Math.max(54, roadWidth * 0.9);
    if (distanceToSegment(point, current, next) <= tolerance) {
      walker.position.set(point.x, point.y);
      if (Math.hypot(point.x - next.x, point.y - next.y) <= tolerance) {
        void advance(progressIndex + 1);
      }
    }
  };
  const endPointer = () => {
    activePointer = false;
    if (animating) return;
    const current = pixelPoints[progressIndex];
    if (current) walker.position.set(current.x, current.y);
  };
  app.canvas.addEventListener("pointerdown", onPointerDown);
  app.canvas.addEventListener("pointermove", onPointerMove);
  app.canvas.addEventListener("pointerup", endPointer);
  app.canvas.addEventListener("pointercancel", endPointer);

  return {
    readyElement: accessibility,
    emphasizeNext() {
      const next = pixelPoints[progressIndex + 1];
      if (!next) return;
      highlight
        .clear()
        .circle(next.x, next.y, Math.max(48, roadWidth * 0.75))
        .stroke({ color: 0xffb63c, width: 10, alpha: 0.9 });
      void tween(720, (progress) => {
        highlight.alpha = 1 - progress;
        highlight.scale.set(0.85 + progress * 0.25);
      }, () => {
        highlight.clear();
        highlight.alpha = 1;
        highlight.scale.set(1);
      });
    },
    async autoAdvance(pointIndex) {
      await advance(pointIndex);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      activePointer = false;
      app.canvas.removeEventListener("pointerdown", onPointerDown);
      app.canvas.removeEventListener("pointermove", onPointerMove);
      app.canvas.removeEventListener("pointerup", endPointer);
      app.canvas.removeEventListener("pointercancel", endPointer);
      app.renderer.off("resize", layout);
      tickerCallbacks.forEach((callback) => app.ticker.remove(callback));
      tickerCallbacks.clear();
      stopPerformanceDiagnostics();
      accessibility.remove();
      releasePixiApplication(host, app);
      releases.forEach((release) => release());
    },
  };
}
