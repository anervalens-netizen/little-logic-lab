export type TargetSizePreference = "large" | "extra_large";
export type DemonstrationSpeed = "normal" | "slow";

let demonstrationSpeed: DemonstrationSpeed = "normal";

export function applyAccessibilityPreferences(options: {
  readonly highContrast: boolean;
  readonly targetSize: TargetSizePreference;
  readonly speed: DemonstrationSpeed;
}): void {
  document.documentElement.dataset.highContrast = String(options.highContrast);
  document.documentElement.dataset.targetSize = options.targetSize;
  document.documentElement.dataset.demonstrationSpeed = options.speed;
  demonstrationSpeed = options.speed;
}

/** Scalează numai momentele explicative, niciodată dificultatea sau timing-ul. */
export function demonstrationDelay(milliseconds: number): number {
  return demonstrationSpeed === "slow"
    ? Math.round(milliseconds * 1.5)
    : milliseconds;
}
