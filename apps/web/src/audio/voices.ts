/**
 * Vocile sintetice ale obiectelor au fost dezactivate în v2.
 *
 * Oscilatoarele procedurale pentru animale și vehicule produceau timbre aspre și
 * se suprapuneau cu feedback-ul verbal. API-ul rămâne stabil până când există un
 * pachet local de clipuri revizuite (de exemplu, exportat din Higgs Audio).
 */

let itemVoicesEnabled = false;

export function setItemVoicesEnabled(value: boolean): void {
  // Nu activăm un fallback sintetic. Flag-ul va controla viitorul asset registry.
  itemVoicesEnabled = value;
}

export function playItemVoice(_itemId: string): void {
  if (!itemVoicesEnabled) return;
  // Intenționat fără fallback: vocea principală și SFX-ul comun rămân curate.
}

export function hasVoice(_itemId: string): boolean {
  return false;
}
