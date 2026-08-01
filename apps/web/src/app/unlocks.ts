import type { StoredProfile } from "./storage";
import { GAME_IDS } from "../generated/game-registry";

export function unlockedGameIds(
  _profile: StoredProfile,
  implementedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(
    GAME_IDS.filter((gameId) => implementedIds.has(gameId)),
  );
}
