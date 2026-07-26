import type { Ticker } from "pixi.js";
import { resourceDiagnostics } from "./resourceDiagnostics";

interface PerformanceSnapshot {
  readonly frameSamples: number;
  readonly frameP95Ms: number;
  readonly inputSamples: number;
  readonly inputP95Ms: number;
  readonly longTasksOver100Ms: number;
  readonly activePixiCanvases: number;
  readonly activeAccessibilityLayers: number;
  readonly activeDragClones: number;
  readonly activeAudioTones: number;
  readonly activeVoiceElements: number;
  readonly svgTextureCacheEntries: number;
  readonly activeSvgTextureReferences: number;
  readonly maxIdleSvgTextureEntries: number;
}

interface PerformanceDiagnostics {
  readonly snapshot: () => PerformanceSnapshot;
  readonly reset: () => void;
}

declare global {
  interface Window {
    __logicLabPerformance?: PerformanceDiagnostics;
  }
}

const enabled = new URLSearchParams(window.location.search).has("diagnostics");
const frameTimes: number[] = [];
const inputTimes: number[] = [];
let pendingInputAt: number | null = null;
let longTasksOver100Ms = 0;

function appendSample(samples: number[], value: number): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1_000) return;
  samples.push(value);
  if (samples.length > 240) samples.shift();
}

function percentile95(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0;
}

if (enabled) {
  window.__logicLabPerformance = {
    snapshot: () => {
      const resources = resourceDiagnostics();
      return {
        frameSamples: frameTimes.length,
        frameP95Ms: percentile95(frameTimes),
        inputSamples: inputTimes.length,
        inputP95Ms: percentile95(inputTimes),
        longTasksOver100Ms,
        activePixiCanvases:
          document.querySelectorAll("canvas.pixi-stage").length,
        activeAccessibilityLayers: document.querySelectorAll(
          [
            ".pixi-accessibility",
            ".pixi-drag-accessibility",
            ".pixi-sequence-accessibility",
            ".pixi-trace-accessibility",
          ].join(","),
        ).length,
        activeDragClones:
          document.querySelectorAll(".lll-drag-clone").length,
        ...resources,
      };
    },
    reset: () => {
      frameTimes.length = 0;
      inputTimes.length = 0;
      pendingInputAt = null;
      longTasksOver100Ms = 0;
    },
  };

  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        longTasksOver100Ms += list
          .getEntries()
          .filter((entry) => entry.duration > 100).length;
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Long Task API nu este disponibilă în toate motoarele.
    }
  }
}

export function markInputForDiagnostics(): void {
  if (enabled) pendingInputAt = performance.now();
}

export function attachPixiPerformanceDiagnostics(
  ticker: Ticker,
): () => void {
  if (!enabled) return () => undefined;
  const sample = (current: Ticker) => {
    appendSample(frameTimes, current.deltaMS);
    if (pendingInputAt !== null) {
      appendSample(inputTimes, performance.now() - pendingInputAt);
      pendingInputAt = null;
    }
  };
  ticker.add(sample);
  return () => ticker.remove(sample);
}
