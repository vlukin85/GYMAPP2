export type ExerciseReplacement = { originalId: string; replacementId: string };

let listener: ((replacement: ExerciseReplacement) => void) | null = null;

export function subscribeToExerciseReplacement(nextListener: (replacement: ExerciseReplacement) => void) {
  listener = nextListener;
  return () => { if (listener === nextListener) listener = null; };
}

export function selectReplacementExercise(replacement: ExerciseReplacement) {
  listener?.(replacement);
}
