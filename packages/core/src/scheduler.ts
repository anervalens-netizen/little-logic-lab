import { createRng } from "./rng.js";
import type {
  GameCandidate,
  SessionPlan,
  SessionPlanEntry,
  SessionRole,
} from "./types.js";

export interface SessionPlannerOptions {
  readonly seed: string;
  readonly maxGames?: number;
  readonly includeHybrid?: boolean;
  readonly nowLocal?: string;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function daysSince(value: string | null | undefined, nowMs: number): number {
  if (!value) return 30;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(0, (nowMs - parsed) / 86_400_000);
}

function candidateWeight(
  candidate: GameCandidate,
  role: SessionRole,
  nowMs: number,
): number {
  const recency = clamp01(daysSince(candidate.lastPracticedAtLocal, nowMs) / 10);
  const due = clamp01(candidate.dueScore);
  const support = clamp01(candidate.recentSupportLoad ?? 0);
  const abandonPenalty = 1 - clamp01(candidate.recentAbandonRate ?? 0) * 0.65;
  const novelty = candidate.timesPlayed === 0 ? 1 : 0;

  let roleFit = 0.35;
  if (role === "warmup") {
    roleFit = clamp01(
      candidate.masteryMean * 0.65 + (1 - support) * 0.25 + recency * 0.1,
    );
  } else if (role === "growth") {
    const zone = 1 - Math.min(1, Math.abs(candidate.masteryMean - 0.64) / 0.36);
    roleFit = clamp01(zone * 0.55 + due * 0.3 + recency * 0.15);
  } else if (role === "novelty") {
    roleFit = novelty === 1 ? 1 : clamp01(recency * 0.35);
  } else if (role === "transfer") {
    roleFit = candidate.mode === "hybrid" ? 1 : 0.1;
  }

  return Math.max(
    0.01,
    (0.25 + roleFit * 0.75) * (0.55 + due * 0.45) * abandonPenalty,
  );
}

function weightedChoice(
  candidates: readonly GameCandidate[],
  seed: string,
  role: SessionRole,
  nowMs: number,
): GameCandidate | null {
  if (candidates.length === 0) return null;
  const rng = createRng(seed);
  const weighted = candidates.map((candidate) => ({
    candidate,
    weight: candidateWeight(candidate, role, nowMs),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rng() * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.candidate;
  }
  return weighted.at(-1)?.candidate ?? null;
}

export function buildSessionPlan(
  candidates: readonly GameCandidate[],
  options: SessionPlannerOptions,
): SessionPlan {
  const maxGames = Math.max(1, Math.min(6, options.maxGames ?? 4));
  const nowMs = Date.parse(options.nowLocal ?? new Date().toISOString());
  const eligible = candidates.filter(
    (candidate) =>
      candidate.ageEligible &&
      (options.includeHybrid !== false || candidate.mode !== "hybrid"),
  );

  const used = new Set<string>();
  const usedDomains = new Set<string>();
  const entries: SessionPlanEntry[] = [];

  const addFrom = (
    pool: readonly GameCandidate[],
    role: SessionRole,
    salt: string,
  ): void => {
    if (entries.length >= maxGames) return;
    const available = pool.filter((candidate) => !used.has(candidate.gameId));
    const varied = available.filter(
      (candidate) => !candidate.domain || !usedDomains.has(candidate.domain),
    );
    const selectionPool = varied.length > 0 ? varied : available;
    const chosen = weightedChoice(
      selectionPool,
      `${options.seed}:${salt}`,
      role,
      Number.isFinite(nowMs) ? nowMs : Date.now(),
    );
    if (chosen === null) return;
    used.add(chosen.gameId);
    if (chosen.domain) usedDomains.add(chosen.domain);
    entries.push({ gameId: chosen.gameId, skillId: chosen.skillId, role });
  };

  const warmups = eligible.filter(
    (candidate) =>
      candidate.timesPlayed > 0 &&
      candidate.masteryMean >= 0.68 &&
      (candidate.recentSupportLoad ?? 0) <= 0.55,
  );
  const growth = eligible.filter(
    (candidate) =>
      candidate.timesPlayed > 0 &&
      candidate.masteryMean >= 0.38 &&
      candidate.masteryMean < 0.86,
  );
  const novelty = eligible.filter((candidate) => candidate.timesPlayed === 0);
  const transfer = eligible.filter((candidate) => candidate.mode === "hybrid");

  addFrom(warmups, "warmup", "warmup");
  addFrom(growth, "growth", "growth-1");

  if (entries.length < maxGames) {
    addFrom(novelty, "novelty", "novelty");
  }
  if (entries.length < maxGames) {
    addFrom(growth, "growth", "growth-2");
  }
  if (transfer.length > 0 && maxGames >= 4) {
    addFrom(transfer, "transfer", "transfer");
  }

  let fallbackIndex = 0;
  while (entries.length < maxGames) {
    const fallback = eligible.filter((candidate) => !used.has(candidate.gameId));
    if (fallback.length === 0) break;
    const role: SessionRole = fallback.some((candidate) => candidate.timesPlayed === 0)
      ? "novelty"
      : "growth";
    addFrom(fallback, role, `fallback-${fallbackIndex}`);
    fallbackIndex += 1;
  }

  return { seed: options.seed, entries, maxGames };
}
