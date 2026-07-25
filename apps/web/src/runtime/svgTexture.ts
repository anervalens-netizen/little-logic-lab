import "pixi.js/unsafe-eval";
import { Texture } from "pixi.js";

/** Rasterizează arta SVG locală într-o textură GPU predictibilă. */
export async function loadSvgTexture(svg: string): Promise<{
  texture: Texture;
  release: () => void;
}> {
  const standaloneSvg = svg.includes('xmlns="http://www.w3.org/2000/svg"')
    ? svg
    : svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  const url = URL.createObjectURL(
    new Blob([standaloneSvg], { type: "image/svg+xml" }),
  );
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => reject(new Error("SVG texture failed")), {
      once: true,
    });
  });
  image.src = url;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const texture = Texture.from(canvas);

  return {
    texture,
    release() {
      texture.destroy();
      canvas.width = 1;
      canvas.height = 1;
      image.removeAttribute("src");
      URL.revokeObjectURL(url);
    },
  };
}
