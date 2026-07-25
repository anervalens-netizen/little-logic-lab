import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  type Ticker,
} from "pixi.js";
import { loadSvgTexture } from "./svgTexture";

export interface PixiChoiceOption {
  readonly id: string;
  readonly svg: string;
  readonly label: string;
}

export interface PixiChoiceSceneOptions {
  readonly targetSvg: string;
  readonly targetLabel: string;
  readonly options: readonly PixiChoiceOption[];
  readonly reducedMotion: boolean;
  readonly onSelect: (id: string) => void;
}

export interface PixiChoiceScene {
  readonly readyElement: HTMLElement;
  readonly markCorrect: (id: string) => void;
  readonly markIncorrect: (id: string) => void;
  readonly emphasize: (id: string) => void;
  readonly dimExcept: (id: string) => void;
  readonly destroy: () => void;
}

interface CardVisual {
  readonly id: string;
  readonly container: Container;
  readonly plate: Graphics;
  readonly sprite: Sprite;
  readonly button: HTMLButtonElement;
  width: number;
  height: number;
  baseX: number;
  baseY: number;
  selected: boolean;
}

function drawPlate(
  graphics: Graphics,
  width: number,
  height: number,
  state: "idle" | "correct" | "hint",
): void {
  const border =
    state === "correct" ? 0x4e9a51 : state === "hint" ? 0xffb63c : 0xd8cdbb;
  const glow =
    state === "correct" ? 0xbee8ae : state === "hint" ? 0xffe09a : 0xe8ddcb;
  graphics
    .clear()
    .roundRect(-width / 2 + 5, -height / 2 + 9, width - 10, height - 8, 30)
    .fill({ color: 0x6f6256, alpha: 0.16 })
    .roundRect(-width / 2, -height / 2, width, height - 8, 30)
    .fill({ color: 0xfffdf7 })
    .stroke({ color: glow, width: state === "idle" ? 6 : 13, alpha: 0.55 })
    .roundRect(-width / 2, -height / 2, width, height - 8, 30)
    .stroke({ color: border, width: 5, alpha: state === "idle" ? 0.38 : 1 });
}

export async function createPixiChoiceScene(
  host: HTMLElement,
  options: PixiChoiceSceneOptions,
): Promise<PixiChoiceScene> {
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

  const accessibility = document.createElement("div");
  accessibility.className = "choice-row pixi-accessibility";
  accessibility.setAttribute("role", "group");
  accessibility.setAttribute("aria-label", `Găsește ${options.targetLabel}`);
  host.append(accessibility);

  const targetDescription = document.createElement("span");
  targetDescription.className = "sr-only";
  targetDescription.textContent = `Model: ${options.targetLabel}`;
  accessibility.append(targetDescription);

  const releases: Array<() => void> = [];
  const tickerCallbacks = new Set<(ticker: Ticker) => void>();
  let destroyed = false;
  let enabled = false;

  const targetTexture = await loadSvgTexture(options.targetSvg);
  releases.push(targetTexture.release);
  if (destroyed) {
    releases.forEach((release) => release());
    app.destroy({ removeView: true }, true);
    throw new Error("Pixi scene destroyed while loading");
  }

  const target = new Container();
  const targetHalo = new Graphics();
  const targetSprite = new Sprite(targetTexture.texture);
  targetSprite.anchor.set(0.5);
  target.addChild(targetHalo, targetSprite);
  app.stage.addChild(target);

  const cards: CardVisual[] = [];
  for (const option of options.options) {
    const loaded = await loadSvgTexture(option.svg);
    releases.push(loaded.release);
    const container = new Container();
    const plate = new Graphics();
    const sprite = new Sprite(loaded.texture);
    sprite.anchor.set(0.5);
    container.addChild(plate, sprite);
    container.eventMode = "static";
    container.cursor = "pointer";

    const button = document.createElement("button");
    button.className = "choice-card pixi-accessibility-choice";
    button.type = "button";
    button.setAttribute("aria-label", option.label);
    accessibility.append(button);

    const card: CardVisual = {
      id: option.id,
      container,
      plate,
      sprite,
      button,
      width: 0,
      height: 0,
      baseX: 0,
      baseY: 0,
      selected: false,
    };

    const press = () => {
      if (!enabled || card.selected) return;
      card.container.scale.set(0.94);
    };
    const release = () => {
      if (!enabled || card.selected) return;
      card.container.scale.set(1);
    };
    const select = () => {
      if (!enabled || card.selected) return;
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
    app.stage.addChild(container);
  }

  const layout = () => {
    if (destroyed) return;
    const width = app.screen.width;
    const height = app.screen.height;
    const compact = height < 430;
    const targetSize = Math.min(width * 0.24, height * (compact ? 0.3 : 0.28), 190);
    target.position.set(width / 2, height * (compact ? 0.24 : 0.27));
    targetSprite.width = targetSize;
    targetSprite.height = targetSize;
    targetHalo
      .clear()
      .circle(0, 0, targetSize * 0.58)
      .fill({ color: 0xffffff, alpha: 0.7 })
      .stroke({ color: 0xffd35c, alpha: 0.6, width: 9 });

    const gap = Math.max(18, Math.min(40, width * 0.035));
    const cardWidth = Math.min(
      250,
      (width - gap * (cards.length + 1)) / cards.length,
      height * (compact ? 0.47 : 0.4),
    );
    const cardHeight = cardWidth;
    const totalWidth = cardWidth * cards.length + gap * (cards.length - 1);
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const cardY = height * (compact ? 0.69 : 0.7);

    cards.forEach((card, index) => {
      card.width = cardWidth;
      card.height = cardHeight;
      card.baseX = startX + index * (cardWidth + gap);
      card.baseY = cardY;
      card.container.position.set(card.baseX, card.baseY);
      card.container.hitArea = new Rectangle(
        -cardWidth / 2 - 10,
        -cardHeight / 2 - 10,
        cardWidth + 20,
        cardHeight + 20,
      );
      drawPlate(card.plate, cardWidth, cardHeight, "idle");
      const artSize = cardWidth * 0.66;
      card.sprite.width = artSize;
      card.sprite.height = artSize;

      card.button.style.left = `${card.baseX - cardWidth / 2}px`;
      card.button.style.top = `${card.baseY - cardHeight / 2}px`;
      card.button.style.width = `${cardWidth}px`;
      card.button.style.height = `${cardHeight}px`;
    });
  };

  app.renderer.on("resize", layout);
  layout();

  if (!options.reducedMotion) {
    const ambient = (ticker: Ticker) => {
      target.y +=
        Math.sin(performance.now() / 650) * Math.min(0.12, ticker.deltaTime * 0.012);
    };
    tickerCallbacks.add(ambient);
    app.ticker.add(ambient);
  }

  const tween = (
    duration: number,
    update: (progress: number) => void,
    complete?: () => void,
  ) => {
    if (options.reducedMotion || destroyed) {
      update(1);
      complete?.();
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
      }
    };
    tickerCallbacks.add(tick);
    app.ticker.add(tick);
  };

  const byId = (id: string) => cards.find((card) => card.id === id);
  enabled = true;

  return {
    readyElement: accessibility,
    markCorrect(id) {
      const card = byId(id);
      if (!card) return;
      enabled = false;
      card.selected = true;
      drawPlate(card.plate, card.width, card.height, "correct");
      tween(650, (progress) => {
        const bounce = Math.sin(progress * Math.PI);
        card.container.scale.set(1 + bounce * 0.13);
        card.container.rotation = Math.sin(progress * Math.PI * 2) * 0.055;
      }, () => {
        card.container.scale.set(1);
        card.container.rotation = 0;
      });

      for (let index = 0; index < 10; index += 1) {
        const sparkle = new Graphics()
          .circle(0, 0, 5 + (index % 3))
          .fill({ color: [0xffd35c, 0x7fc86b, 0x4fa8e8][index % 3] });
        sparkle.position.copyFrom(card.container.position);
        app.stage.addChild(sparkle);
        const angle = (Math.PI * 2 * index) / 10;
        tween(700, (progress) => {
          const distance = progress * Math.min(card.width * 0.72, 130);
          sparkle.position.set(
            card.baseX + Math.cos(angle) * distance,
            card.baseY + Math.sin(angle) * distance,
          );
          sparkle.alpha = 1 - progress;
          sparkle.scale.set(1 - progress * 0.5);
        }, () => sparkle.destroy());
      }
    },
    markIncorrect(id) {
      const card = byId(id);
      if (!card) return;
      const startX = card.baseX;
      tween(380, (progress) => {
        card.container.x =
          startX + Math.sin(progress * Math.PI * 4) * (1 - progress) * 10;
      }, () => {
        card.container.x = startX;
      });
    },
    emphasize(id) {
      const card = byId(id);
      if (!card) return;
      drawPlate(card.plate, card.width, card.height, "hint");
      tween(520, (progress) => {
        card.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.08);
      }, () => card.container.scale.set(1));
    },
    dimExcept(id) {
      cards.forEach((card) => {
        if (card.id !== id) {
          card.container.alpha = 0.3;
          card.button.disabled = true;
        }
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      app.renderer.off("resize", layout);
      tickerCallbacks.forEach((callback) => app.ticker.remove(callback));
      tickerCallbacks.clear();
      accessibility.remove();
      app.destroy({ removeView: true }, { children: true });
      releases.forEach((release) => release());
      host.classList.remove("pixi-host");
    },
  };
}
