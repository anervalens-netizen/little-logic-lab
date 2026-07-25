/**
 * Politica de suport uniformă (din core/session):
 * 1 eroare → feedback specific blând;
 * 2 erori → indiciu;
 * 3 erori → simplifică / încheie cu succes.
 */

import { nextSupportAction, type SupportAction } from "@core";
import { speak } from "../audio/speech";
import { gentleNo } from "../ui/feedback";

export type SupportVerdict = "feedback" | "hint" | "simplify";

export class SupportTracker {
  private consecutiveErrors = 0;
  private hintsShown = 0;
  private simplified = false;
  wrongAttempts = 0;
  hintsUsed = 0;

  /** Ce să facă jocul după o greșeală. */
  registerError(element?: HTMLElement | null): SupportVerdict {
    this.consecutiveErrors += 1;
    this.wrongAttempts += 1;
    const action: SupportAction = nextSupportAction({
      consecutiveErrors: this.consecutiveErrors,
      hintsAlreadyShown: this.hintsShown,
      levelAlreadySimplified: this.simplified,
      distressSignal: false,
      sessionMinutesElapsed: 0,
      sessionMinuteLimit: Number.POSITIVE_INFINITY,
    });
    gentleNo(element ?? null);
    switch (action) {
      case "show_hint":
        this.hintsShown += 1;
        this.hintsUsed += 1;
        return "hint";
      case "simplify_level":
      case "end_level_successfully":
        this.simplified = true;
        return "simplify";
      default: {
        const encouragements = ["Aproape! Mai încearcă.", "Uită-te încă o dată.", "Mai încearcă o dată!"];
        speak(encouragements[Math.floor(Math.random() * encouragements.length)] ?? "Mai încearcă.", { rate: 1 });
        return "feedback";
      }
    }
  }

  registerSuccess(): void {
    this.consecutiveErrors = 0;
  }

  get wasFirstTryClean(): boolean {
    return this.wrongAttempts === 0 && this.hintsUsed === 0;
  }
}
