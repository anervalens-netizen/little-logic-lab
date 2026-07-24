import { chooseOne, createRng } from "./rng.js";
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
}

function weightedChoice(
  candidates: readonly GameCandidate[],
  seed: string,
): GameCandidate | null {
  if (candidates.length === 0) return null;
  const rng = createRng(seed);
  const expanded: GameCandidate[] = [];
  for (const candidate of candidates) {
    const copies = Math.max(1, Math.min(8, Math.round(candidate.dueScore * 4) + 1));
    for (let index = 0; index < copies; index += 1) {
      expanded.push(candidate);
    }
  }
  return chooseOne(expanded, rng);
}

export function buildSessionPlan(
  candidates: readonly GameCandidate[],
  options: SessionPlannerOptions,
): SessionPlan {
  const maxGames = Math.max(1, Math.min(6, options.maxGames ?? 4));
  const eligible = candidates.filter(
    (candidate) =>
      candidate.ageEligible &&
      (options.includeHybrid !== false || candidate.mode !== "hybrid"),
  );

  const used = new Set<string>();
  const entries: SessionPlanEntry[] = [];

  const addFrom = (
    pool: readonly GameCandidate[],
    role: SessionRole,
    salt: string,
  ): void => {
    if (entries.length >= maxGames) return;
    const available = pool.filter((candidate) => !used.has(candidate.gameId));
    const chosen = weightedChoice(available, `${options.seed}:${salt}`);
    if (chosen === null) return;
    used.add(chosen.gameId);
    entries.push({ gameId: chosen.gameId, skillId: chosen.skillId, role });
  };

  const warmups = eligible.filter(
    (candidate) => candidate.timesPlayed > 0 && candidate.masteryMean >= 0.76,
  );
  const growth = eligible.filter(
    (candidate) =>
      candidate.timesPlayed > 0 &&
      candidate.masteryMean >= 0.42 &&
      candidate.masteryMean < 0.84,
  );
  const novelty = eligible.filter((candidate) => candidate.timesPlayed === 0);
  const transfer = eligible.filter((candidate) => candidate.mode === "hybrid");

  addFrom(warmups, "warmup", "warmup");
  addFrom(growth, "growth", "growth-1");
  addFrom(growth, "growth", "growth-2");

  if (transfer.length > 0 && maxGames >= 4) {
    addFrom(transfer, "transfer", "transfer");
  } else {
    addFrom(novelty, "novelty", "novelty");
  }

  let fallbackIndex = 0;
  while (entries.length < maxGames) {
    const fallback = eligible.filter((candidate) => !used.has(candidate.gameId));
    if (fallback.length === 0) break;
    addFrom(fallback, fallback[0]?.timesPlayed === 0 ? "novelty" : "growth", `fallback-${fallbackIndex}`);
    fallbackIndex += 1;
  }

  return { seed: options.seed, entries, maxGames };
}
