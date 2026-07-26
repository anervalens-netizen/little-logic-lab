import "pixi.js/unsafe-eval";
import { Texture } from "pixi.js";

interface CachedTexture {
  readonly texture: Texture;
  readonly canvas: HTMLCanvasElement;
  references: number;
  lastUsed: number;
}

const MAX_IDLE_TEXTURES = 64;
const cache = new Map<string, Promise<CachedTexture>>();

async function rasterize(svg: string): Promise<CachedTexture> {
  const standaloneSvg = svg.includes('xmlns="http://www.w3.org/2000/svg"')
    ? svg
    : svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  const url = URL.createObjectURL(
    new Blob([standaloneSvg], { type: "image/svg+xml" }),
  );
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error("SVG texture failed")),
        { once: true },
      );
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      texture: Texture.from(canvas),
      canvas,
      references: 0,
      lastUsed: performance.now(),
    };
  } finally {
    image.removeAttribute("src");
    URL.revokeObjectURL(url);
  }
}

function evictIdleTextures(): void {
  const idle = [...cache.entries()]
    .map(([key, pending]) => ({ key, pending }));
  if (idle.length <= MAX_IDLE_TEXTURES) return;
  void Promise.all(
    idle.map(async ({ key, pending }) => ({
      key,
      entry: await pending,
    })),
  ).then((resolved) => {
    const removable = resolved
      .filter(({ entry }) => entry.references === 0)
      .sort((left, right) => left.entry.lastUsed - right.entry.lastUsed);
    while (cache.size > MAX_IDLE_TEXTURES && removable.length > 0) {
      const candidate = removable.shift();
      if (!candidate || candidate.entry.references !== 0) continue;
      const current = cache.get(candidate.key);
      if (!current) continue;
      cache.delete(candidate.key);
      candidate.entry.texture.destroy();
      candidate.entry.canvas.width = 1;
      candidate.entry.canvas.height = 1;
    }
  });
}

/** Rasterizează și reutilizează arta SVG locală cu un cache GPU limitat. */
export async function loadSvgTexture(svg: string): Promise<{
  texture: Texture;
  release: () => void;
}> {
  let pending = cache.get(svg);
  if (!pending) {
    pending = rasterize(svg);
    cache.set(svg, pending);
    void pending.catch(() => cache.delete(svg));
  }
  const entry = await pending;
  entry.references += 1;
  entry.lastUsed = performance.now();
  let released = false;
  return {
    texture: entry.texture,
    release() {
      if (released) return;
      released = true;
      entry.references = Math.max(0, entry.references - 1);
      entry.lastUsed = performance.now();
      evictIdleTextures();
    },
  };
}
