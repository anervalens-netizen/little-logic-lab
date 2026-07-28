export type AgeBandId = "A30_36" | "B36_48" | "C48_60" | "D60_72";

export type SkillDomain =
  | "visual_attention"
  | "classification"
  | "working_memory"
  | "inhibition_flexibility"
  | "sequencing_patterns"
  | "spatial_planning"
  | "numeracy"
  | "language_social"
  | "fine_motor_creativity"
  | "hybrid_transfer";

export type GameMode = "digital" | "hybrid" | "open_ended";
export type Scalar = string | number | boolean;
export type DifficultyVector = Record<string, Scalar>;

export interface LocalizedText {
  readonly ro: string;
  readonly en: string;
}

export interface GameDefinition {
  readonly id: string;
  readonly title: LocalizedText;
  readonly domain: SkillDomain;
  readonly secondarySkills: readonly string[];
  readonly minAgeMonths: number;
  readonly maxAgeMonths: number;
  readonly entryBand: AgeBandId;
  readonly implementationPriority: "P0" | "P1" | "P2" | "P3";
  readonly mode: GameMode;
  readonly interaction: string;
  readonly archetype: string;
  readonly learningGoal: string;
  readonly mechanic: string;
  readonly difficultyAxes: readonly string[];
  readonly progression: string;
  readonly guardrails: readonly string[];
  readonly coPlayPrompt: string;
  readonly offlineTransfer: string;
  readonly requiresReading: false;
  readonly requiresMicrophone: false;
  readonly requiresCamera: false;
  readonly requiresNetwork: false;
  readonly scored: boolean;
  readonly generatorStatus: "sample_implemented" | "specified";
}

export interface AttemptOutcome {
  readonly completed: boolean;
  readonly correctFirstTry: boolean;
  readonly correctEventually: boolean;
  readonly hintsUsed: number;
  readonly wrongAttempts: number;
  readonly responseMs?: number;
  readonly abandoned?: boolean;
  readonly distressSignal?: boolean;
}

export interface SkillMastery {
  readonly alpha: number;
  readonly beta: number;
  readonly evidenceCount: number;
  readonly lastPracticedAtLocal: string | null;
}

export type MasteryStatus =
  | "insufficient_evidence"
  | "emerging"
  | "developing"
  | "strong";

export interface DifficultyAxisSpec {
  readonly name: string;
  readonly values: readonly Scalar[];
}

export interface DifficultyStep {
  readonly vector: DifficultyVector;
  readonly changedAxis: string | null;
  readonly direction: -1 | 0 | 1;
}

export interface GameCandidate {
  readonly gameId: string;
  readonly skillId: string;
  readonly mode: GameMode;
  readonly masteryMean: number;
  readonly evidenceCount: number;
  readonly timesPlayed: number;
  readonly dueScore: number;
  readonly ageEligible: boolean;
  /** Metadate opționale pentru un scheduler mai variat, fără a rupe consumatorii vechi. */
  readonly domain?: SkillDomain;
  readonly lastPracticedAtLocal?: string | null;
  readonly recentSupportLoad?: number;
  readonly recentAbandonRate?: number;
}

export type SessionRole = "warmup" | "growth" | "novelty" | "transfer";

export interface SessionPlanEntry {
  readonly gameId: string;
  readonly skillId: string;
  readonly role: SessionRole;
}

export interface SessionPlan {
  readonly seed: string;
  readonly entries: readonly SessionPlanEntry[];
  readonly maxGames: number;
}

export type SupportAction =
  | "continue"
  | "specific_feedback"
  | "show_hint"
  | "simplify_level"
  | "end_level_successfully"
  | "end_session";

export interface GeneratedLevel<TPayload = unknown> {
  readonly id: string;
  readonly gameId: string;
  readonly seed: string;
  readonly difficulty: DifficultyVector;
  readonly payload: TPayload;
}

export interface Evaluation {
  readonly completed: boolean;
  readonly correct: boolean;
  readonly score01: number;
  readonly strategyTag?: string;
}

export interface GamePlugin<TConfig, TState, TAction, TPayload = unknown> {
  readonly gameId: string;
  generate(seed: string, config: TConfig): GeneratedLevel<TPayload>;
  initialize(level: GeneratedLevel<TPayload>): TState;
  reduce(state: TState, action: TAction): TState;
  evaluate(state: TState): Evaluation;
  getHint(state: TState, hintIndex: number): unknown;
}
