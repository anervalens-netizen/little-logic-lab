import { Application, type ContainerChild } from "pixi.js";

interface PooledApplication {
  readonly app: Application;
  active: boolean;
}

const applications = new WeakMap<HTMLElement, PooledApplication>();

function destroyChildren(children: readonly ContainerChild[]): void {
  children.forEach((child) => child.destroy({ children: true }));
}

/** Refolosește contextul WebGL cât timp același shell de joc rămâne montat. */
export async function acquirePixiApplication(
  host: HTMLElement,
): Promise<Application> {
  let pooled = applications.get(host);
  if (!pooled) {
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
    host.append(app.canvas);
    pooled = { app, active: false };
    applications.set(host, pooled);
  }
  if (pooled.active) {
    throw new Error("Pixi host already has an active scene");
  }
  pooled.active = true;
  if (pooled.app.canvas.parentElement !== host) {
    host.prepend(pooled.app.canvas);
  }
  pooled.app.canvas.style.touchAction = "";
  pooled.app.stage.sortableChildren = false;
  pooled.app.resize();
  host.classList.add("pixi-host");
  return pooled.app;
}

/** Eliberează scena, dar păstrează rendererul pentru nivelul următor. */
export function releasePixiApplication(
  host: HTMLElement,
  app: Application,
): void {
  const pooled = applications.get(host);
  if (!pooled || pooled.app !== app || !pooled.active) return;
  destroyChildren(app.stage.removeChildren());
  pooled.active = false;
}

/** Închide definitiv contextul când shell-ul părăsește ecranul. */
export function destroyPixiApplication(host: HTMLElement): void {
  const pooled = applications.get(host);
  if (!pooled) return;
  applications.delete(host);
  pooled.active = false;
  pooled.app.destroy({ removeView: true }, { children: true });
  host.classList.remove("pixi-host");
}
