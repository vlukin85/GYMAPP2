/**
 * Карты иллюстраций эпохи Manus очищены: файлы /manus-storage/* в репозиторий
 * не входили и не существуют — их «мёртвые» URL стояли ПЕРВЫМИ в цепочке
 * картинок упражнений и перекрывали реальные фото free-exercise-db.
 * Теперь цепочка: пользовательское фото → фото из офлайн-бандла (140/140)
 * → SVG-иллюстрация (fallback для пользовательских упражнений).
 */
export const individualAiExerciseIllustrations: Record<string, string> = {};
export const generatedTechniqueImages: Record<string, string> = {};
export const aiGroupExerciseIllustrations: Record<string, string> = {};
export const aiArmsExerciseIllustration: string | undefined = undefined;


export const bundledAiExerciseAssetCoverage = {
  individual: Object.keys(individualAiExerciseIllustrations).length,
  technique: Object.keys(generatedTechniqueImages).length,
  groupFallbacks: Object.keys(aiGroupExerciseIllustrations).length, // 0 — карты эпохи Manus очищены
  auxiliary: 1,
} as const;
