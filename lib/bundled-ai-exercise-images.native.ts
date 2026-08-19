const storage = (filename: string) => `/manus-storage/${filename}`;

/** URL-карта применяется во всех средах; крупные исходники хранятся вне репозитория. */
export const individualAiExerciseIllustrations: Record<string, string> = {
  "bench-press": storage("ai-bench-press_756cc228.jpg"),
  "incline-db-press": storage("ai-incline-db-press_7a539224.jpg"),
  "lat-pulldown": storage("ai-lat-pulldown_cc21da0f.jpg"),
  "barbell-row": storage("ai-barbell-row_a89f2a77.jpg"),
  squat: storage("ai-squat_0c5c6809.jpg"),
  "leg-press": storage("ai-leg-press_934bf838.jpg"),
  "shoulder-press": storage("ai-shoulder-press_29292814.jpg"),
  "lateral-raise": storage("ai-lateral-raise_e8e3b233.jpg"),
  "biceps-curl": storage("ai-biceps-curl_72e5630b.jpg"),
  "triceps-pushdown": storage("ai-triceps-pushdown_905e9bc9.jpg"),
};

export const generatedTechniqueImages: Record<string, string> = {
  "bench-press": storage("bench-press-generated_cf86ab4c.jpg"),
  "incline-db-press": storage("incline-db-press-generated_b616826b.jpg"),
  "lat-pulldown": storage("lat-pulldown-generated_0d30afee.jpg"),
  "barbell-row": storage("barbell-row-generated_42731093.jpg"),
  squat: storage("squat-generated_641bb3fc.jpg"),
  "leg-press": storage("leg-press-generated_dfcf2f0c.jpg"),
  "shoulder-press": storage("shoulder-press-generated_e9bc1122.jpg"),
  "lateral-raise": storage("lateral-raise-generated_58a12e78.jpg"),
  "biceps-curl": storage("biceps-curl-generated_fd515260.jpg"),
  "triceps-pushdown": storage("triceps-pushdown-generated_1c2829f4.jpg"),
};

export const aiGroupExerciseIllustrations: Record<string, string> = {
  "Грудь": storage("gym-ai-chest_72d19524.jpg"),
  "Спина": storage("gym-ai-back_38bf7525.jpg"),
  "Ноги": storage("gym-ai-legs_e26a7490.jpg"),
  "Плечи": storage("gym-ai-shoulders_539dae84.jpg"),
  "Бицепс": individualAiExerciseIllustrations["biceps-curl"],
  "Трицепс": individualAiExerciseIllustrations["triceps-pushdown"],
  "Корпус": storage("gym-ai-core_443dab3b.jpg"),
  "Кардио": storage("gym-ai-functional_59960858.jpg"),
};

export const aiArmsExerciseIllustration = individualAiExerciseIllustrations["biceps-curl"];

export const bundledAiExerciseAssetCoverage = {
  individual: Object.keys(individualAiExerciseIllustrations).length,
  technique: Object.keys(generatedTechniqueImages).length,
  groupFallbacks: Object.keys(aiGroupExerciseIllustrations).length,
  auxiliary: 1,
} as const;
