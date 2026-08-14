export type ExerciseReplacement = { originalId: string; replacementId: string };

let listener: ((replacement: ExerciseReplacement) => void) | null = null;
let openListener: ((originalId: string) => void) | null = null;

export function subscribeToExerciseReplacement(nextListener: (replacement: ExerciseReplacement) => void) {
  listener = nextListener;
  return () => { if (listener === nextListener) listener = null; };
}

export function selectReplacementExercise(replacement: ExerciseReplacement) {
  listener?.(replacement);
}

export function subscribeToReplacementPicker(nextListener: (originalId: string) => void) {
  openListener = nextListener;
  return () => { if (openListener === nextListener) openListener = null; };
}

export function openReplacementPicker(originalId: string) {
  openListener?.(originalId);
}
