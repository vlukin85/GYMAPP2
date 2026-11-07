/**
 * Цветные иллюстративные SVG-иконки упражнений.
 *
 * Каждое упражнение получает узнаваемую композицию: поза фигуры подбирается по типу
 * движения (жим, тяга, присед и т.д.), оборудование рисуется отдельными формами,
 * акцентные цвета детерминированы по id. Файл самодостаточен: только строки-SVG,
 * никаких внешних ресурсов. Сигнатура getExerciseIllustration зафиксирована —
 * её используют lib/workout-data.ts и app/exercise/[id].tsx.
 */

const palette = ["#7C3AED", "#DB2777", "#0EA5E9", "#F97316", "#14B8A6", "#E11D48", "#4F46E5", "#CA8A04", "#059669", "#D946EF"];

/** Тёплый светлый тон силуэтов и оборудования-акцентов. */
const LIGHT = "#F8FAFC";
const LIGHT_SOFT = "#FDE68A";

function hash(value: string) {
  return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

/* ---------- Примитивы единого визуального языка ---------- */

const limb = (d: string, opacity = 1) =>
  `<path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : ""}/>`;
const torso = (d: string, opacity = 1) =>
  `<path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : ""}/>`;
const head = (x: number, y: number, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LIGHT}"/>`;
const bar = (d: string, width = 5) => `<path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="${width}" stroke-linecap="round"/>`;
const plate = (x: number, y: number, w: number, h: number, color: string, rx = 4, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${color}"${opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : ""}/>`;
const arc = (d: string, color = LIGHT) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="7 7" stroke-linecap="round" opacity=".55"/>`;
/** Повёрнутый прямоугольник без transform-атрибута — corners считаются заранее, чтобы SVG читался любым парсером. */
const rotRect = (cx: number, cy: number, w: number, h: number, angleDeg: number, fill: string) => {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = w / 2;
  const hh = h / 2;
  const points = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]
    .map(([dx, dy]) => `${(cx + dx * cos - dy * sin).toFixed(1)},${(cy + dx * sin + dy * cos).toFixed(1)}`)
    .join(" ");
  return `<polygon points="${points}" fill="${fill}"/>`;
};
const dumbbell = (x: number, y: number, angle: number, color: string) => {
  const rad = (angle * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  return rotRect(x - 18.5 * ux, y - 18.5 * uy, 11, 18, angle, color) +
    rotRect(x + 18.5 * ux, y + 18.5 * uy, 11, 18, angle, color) +
    rotRect(x, y, 26, 8, angle, LIGHT);
};

/* ---------- Библиотека композиций ---------- */
/** Каждая композиция — узнаваемая поза плюс рисованная форма оборудования. */
const compositions: Record<string, (accent: string, secondary: string) => string> = {
  // Жим штанги лёжа: скамья, тело вдоль скамьи, гриф с блинами над грудью.
  "bench-barbell": (a, s) =>
    `${plate(46, 150, 132, 12, s, 6)}` +
    `<path d="M62 162v42M162 162v42" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    head(70, 137) +
    torso("M84 146L164 142") +
    limb("M164 142L192 158L190 198") +
    limb("M96 142L114 90") +
    limb("M104 145L124 93", .65) +
    bar("M80 86L172 86") +
    plate(70, 62, 14, 50, a) +
    plate(160, 62, 14, 50, a) +
    plate(86, 70, 8, 34, s, 3) +
    plate(146, 70, 8, 34, s, 3),
  // Жим гантелей на наклонной: скамья с наклонной спинкой, голова сверху, гантели над плечами.
  "incline-db-press": (a, s) =>
    `<path d="M56 176L156 120" stroke="${s}" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M152 122L184 118" stroke="${s}" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M80 162v38M170 122v78" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    head(150, 108, 11) +
    torso("M142 118L96 148") +
    limb("M96 148L74 160L70 196") +
    limb("M140 116L158 78") +
    limb("M148 118L172 86", .65) +
    dumbbell(160, 74, -25, a) +
    dumbbell(174, 86, -25, a),
  // Жим гантелей лёжа: скамья, гантели вертикально над грудью.
  "db-press": (a, s) =>
    `${plate(46, 150, 132, 12, s, 6)}` +
    `<path d="M62 162v42M162 162v42" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    head(70, 137) +
    torso("M84 146L164 142") +
    limb("M164 142L192 158L190 198") +
    limb("M96 142L108 98") +
    limb("M106 145L124 104", .65) +
    dumbbell(110, 92, 75, a) +
    dumbbell(128, 100, 75, a),
  // Сведения/разводка: фигура анфас, руки в стороны, дуга движения.
  fly: (a) =>
    head(120, 66) +
    torso("M120 82L120 134") +
    limb("M120 134L100 196") +
    limb("M120 134L141 196") +
    limb("M120 98L76 108") +
    limb("M120 98L164 108") +
    dumbbell(72, 112, 8, a) +
    dumbbell(168, 112, -8, a) +
    arc("M78 142C106.0 126.0 134.0 126.0 162 142"),
  // Отжимания: прогнутая линия тела, согнутые руки в упоре.
  "push-up": () =>
    head(62, 146, 11) +
    torso("M76 152L156 182") +
    limb("M156 182L188 197") +
    limb("M84 155L80 178L94 199") +
    limb("M96 158L92 180L104 200", .6),
  // Тяга верхнего блока: рама с тросом, фигура сидя тянет рукоять вниз.
  "lat-pulldown": (a, s) =>
    plate(184, 48, 28, 158, s, 10, .95) +
    `<path d="M188 66h20M188 86h20M188 106h20M188 126h20M188 146h20" stroke="${LIGHT}" stroke-width="4" opacity=".55"/>` +
    bar("M184 58L152 58", 8) +
    `<circle cx="150" cy="60" r="7" fill="${a}"/>` +
    `<path d="M148 66L124 98" stroke="${LIGHT}" stroke-width="4" fill="none"/>` +
    bar("M96 98L152 98", 6) +
    plate(84, 152, 50, 10, s, 5) +
    `<path d="M92 162v38" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    head(114, 84) +
    torso("M112 100L108 148") +
    limb("M108 148L142 154L142 194") +
    limb("M112 106L100 98") +
    limb("M112 106L136 98", .65),
  // Горизонтальная тяга: трос спереди, фигура сидя тянет рукоять к животу.
  "cable-row": (a, s) =>
    plate(34, 70, 24, 120, s, 8, .95) +
    bar("M58 76L92 76", 8) +
    `<circle cx="94" cy="78" r="6" fill="${a}"/>` +
    `<path d="M94 84L102 122" stroke="${LIGHT}" stroke-width="4" fill="none"/>` +
    bar("M92 122L116 122", 6) +
    plate(58, 166, 28, 8, LIGHT, 4, .35) +
    plate(128, 152, 46, 10, s, 5) +
    head(150, 94) +
    torso("M150 108L142 150") +
    limb("M142 150L106 158L102 172") +
    limb("M148 112L118 120") +
    limb("M144 114L114 124", .65),
  // Тяга штанги в наклоне: корпус наклонён, гриф с блинами у колен.
  "barbell-row": (a) =>
    head(84, 90) +
    torso("M96 102L146 140") +
    limb("M146 140L150 172L148 198") +
    limb("M140 142L128 174L134 198", .75) +
    limb("M104 112L118 152") +
    limb("M114 116L128 154", .65) +
    bar("M76 152L168 152") +
    plate(66, 128, 14, 50, a) +
    plate(158, 128, 14, 50, a),
  // Становая/румынская тяга: гриф у голеней, руки прямые вниз.
  deadlift: (a, s) =>
    head(112, 60) +
    torso("M114 74L118 140") +
    limb("M112 92L104 170") +
    limb("M122 94L132 170", .65) +
    limb("M118 140L104 170L106 198") +
    limb("M120 140L136 170L134 198", .85) +
    bar("M72 170L166 170") +
    plate(60, 132, 16, 76, a, 5) +
    plate(158, 132, 16, 76, a, 5) +
    plate(78, 142, 8, 56, s, 3) +
    plate(146, 142, 8, 56, s, 3),
  // Присед со штангой: гриф на плечах, глубокий подсед.
  squat: (a) =>
    head(122, 58) +
    torso("M122 72L114 118") +
    bar("M86 72L160 72") +
    plate(76, 48, 14, 50, a) +
    plate(156, 48, 14, 50, a) +
    limb("M116 78L96 74") +
    limb("M126 78L150 74", .65) +
    limb("M114 118L84 134L90 190") +
    limb("M114 118L150 136L144 192", .85),
  // Жим ногами: наклонные салазки, ноги выжимают платформу от сиденья.
  "leg-press": (a, s) =>
    `<path d="M40 196L176 74" stroke="${s}" stroke-width="10" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M48 190L92 172" stroke="${s}" stroke-width="12" stroke-linecap="round"/>` +
    head(64, 142) +
    torso("M78 154L114 158") +
    limb("M114 158L152 124L172 92") +
    limb("M118 160L156 128L176 98", .7) +
    rotRect(182, 84, 48, 24, 48, a),
  // Сгибания/разгибания ног: скамья, рычаг с валиком у стопы.
  "leg-machine": (a, s) =>
    plate(54, 146, 122, 11, s, 5) +
    `<path d="M66 157v40M160 157v40" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
    head(70, 134) +
    torso("M84 142L150 142") +
    `<path d="M176 150L198 112" stroke="${s}" stroke-width="9" stroke-linecap="round"/>` +
    `<circle cx="176" cy="150" r="7" fill="${a}"/>` +
    `<circle cx="196" cy="106" r="10" fill="${a}"/>` +
    limb("M150 142L170 138L188 116") +
    limb("M150 144L172 142L190 120", .6),
  // Икры: подъём на носки на платформе со стрелками амплитуды.
  "calf-raise": (s) =>
    plate(94, 190, 64, 14, s, 4) +
    head(126, 56) +
    torso("M126 70L126 128") +
    limb("M126 128L122 190") +
    limb("M126 128L136 170L132 190", .6) +
    bar("M122 190L138 192", 6) +
    `<path d="M88 138L88 112M80 120l8-8 8 8" stroke="${LIGHT}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>` +
    `<path d="M168 112L168 138M160 130l8 8 8-8" stroke="${LIGHT}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`,
  // Выпады: переднее колено согнуто, задняя нога отставлена, гантели в руках.
  lunge: (a) =>
    head(124, 62) +
    torso("M126 76L132 136") +
    limb("M132 136L100 140L96 194") +
    limb("M132 136L158 162L176 196", .85) +
    limb("M124 92L108 134") +
    limb("M134 92L148 136", .8) +
    dumbbell(106, 142, 90, a) +
    dumbbell(150, 144, 90, a),
  // Жим вверх: снаряд над головой на прямых руках.
  "overhead-press": (a) =>
    head(120, 68) +
    torso("M120 82L120 134") +
    limb("M120 134L102 196") +
    limb("M120 134L140 196") +
    bar("M78 44L162 44") +
    plate(68, 22, 13, 46, a) +
    plate(158, 22, 13, 46, a) +
    limb("M120 88L98 48") +
    limb("M120 88L142 48", .8),
  // Махи в стороны: руки до уровня плеч, гантели, дуга движения.
  "lateral-raise": (a) =>
    head(120, 64) +
    torso("M120 80L120 134") +
    limb("M120 134L102 196") +
    limb("M120 134L139 196") +
    limb("M120 96L76 104") +
    limb("M120 96L164 104") +
    dumbbell(70, 108, 10, a) +
    dumbbell(170, 108, -10, a) +
    arc("M82 82C107.3 67.3 132.7 67.3 158 82"),
  // Бицепс: локти у корпуса, предплечья согнуты, гриф у груди.
  "biceps-curl": (a) =>
    head(120, 62) +
    torso("M120 78L120 132") +
    limb("M120 132L102 196") +
    limb("M120 132L139 196") +
    limb("M116 96L108 116L102 90") +
    limb("M124 96L132 116L138 90", .8) +
    bar("M94 84L146 84", 6) +
    plate(86, 74, 9, 26, a, 3) +
    plate(146, 74, 9, 26, a, 3),
  // Трицепс на блоке: трос сверху, руки разгибаются вниз к рукояти.
  "triceps-pushdown": (a, s) =>
    plate(166, 48, 30, 152, s, 10, .95) +
    `<path d="M170 66h22M170 86h22M170 106h22M170 126h22M170 146h22" stroke="${LIGHT}" stroke-width="4" opacity=".55"/>` +
    bar("M166 58L120 58", 8) +
    `<circle cx="118" cy="60" r="6" fill="${a}"/>` +
    `<path d="M118 66L118 96" stroke="${LIGHT}" stroke-width="4" fill="none"/>` +
    bar("M104 100L134 100", 6) +
    head(94, 72) +
    torso("M94 86L98 138") +
    limb("M98 138L90 194") +
    limb("M98 138L116 194", .85) +
    limb("M96 92L104 112L120 102"),
  // Брусья: стойка на прямых руках, корпус над брусьями, ноги поджаты назад.
  dips: (s) =>
    bar("M40 150L200 150", 9) +
    `<path d="M64 150v56M176 150v56" stroke="${s}" stroke-width="7" opacity=".8"/>` +
    head(106, 84) +
    torso("M108 98L114 148") +
    limb("M108 102L112 150") +
    limb("M116 104L120 150", .6) +
    limb("M114 148L142 158L146 178") +
    limb("M114 148L138 162L142 182", .6),
  // Планка: прямая линия тела на предплечьях.
  plank: () =>
    head(64, 142, 11) +
    torso("M78 148L150 170") +
    limb("M150 170L192 190") +
    limb("M88 150L78 184L108 190") +
    limb("M96 152L88 184L116 190", .55),
  // Скручивания: лопатки оторваны от мата, колени согнуты.
  crunch: (s) =>
    plate(44, 188, 152, 10, s, 5, .9) +
    head(76, 156, 11) +
    torso("M88 164L132 184") +
    limb("M132 184L164 158L170 186") +
    limb("M132 184L158 164L166 188", .5) +
    limb("M92 162L120 168"),
  // Беговая дорожка: полотно с консолью, фигура в фазе шага.
  treadmill: (a, s) =>
    plate(46, 176, 156, 10, s, 5) +
    `<circle cx="54" cy="192" r="7" fill="${s}" opacity=".8"/><circle cx="194" cy="192" r="7" fill="${s}" opacity=".8"/>` +
    `<path d="M60 176L60 78" stroke="${s}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M60 78L96 78" stroke="${s}" stroke-width="9" stroke-linecap="round"/>` +
    plate(64, 64, 26, 12, a, 4, .9) +
    head(126, 72) +
    torso("M128 86L122 128") +
    limb("M122 128L144 148L138 172") +
    limb("M122 128L102 154L86 168", .8) +
    limb("M128 94L146 112") +
    limb("M128 94L110 118", .8),
  // Гребной тренажёр: рейка, маховик, фигура тянет рукоять к груди.
  rower: (a, s) =>
    bar("M34 178L206 178", 8) +
    `<circle cx="186" cy="148" r="22" fill="${s}" opacity=".95"/>` +
    `<circle cx="186" cy="148" r="9" fill="${a}"/>` +
    bar("M164 156L146 150", 5) +
    plate(150, 166, 26, 8, LIGHT, 3, .5) +
    plate(88, 166, 34, 9, a, 4) +
    head(94, 108) +
    torso("M98 122L112 162") +
    limb("M112 162L146 154L168 166") +
    limb("M102 130L128 146") +
    limb("M100 134L126 150", .6) +
    bar("M122 142L148 142", 6),
  // Подтягивания: перекладина сверху, руки согнуты, корпус подтянут.
  "pull-up": (s) =>
    bar("M64 40L176 40", 9) +
    `<path d="M64 40L64 58M176 40L176 58" stroke="${s}" stroke-width="7" opacity=".7"/>` +
    head(120, 74) +
    torso("M120 88L118 126") +
    limb("M118 126L142 138L138 160") +
    limb("M118 126L98 140L102 162", .8) +
    limb("M118 92L98 68L106 46") +
    limb("M122 92L142 68L134 46", .8),
  // Велотренажёр: колёса, рама, фигура в наклоне за рулём.
  "exercise-bike": (a, s) =>
    `<circle cx="76" cy="176" r="24" fill="none" stroke="${LIGHT}" stroke-width="7"/>` +
    `<circle cx="164" cy="176" r="24" fill="none" stroke="${LIGHT}" stroke-width="7"/>` +
    `<circle cx="76" cy="176" r="5" fill="${s}"/><circle cx="164" cy="176" r="5" fill="${s}"/>` +
    `<path d="M76 176L118 134L164 176M118 134L142 134L164 176" stroke="${s}" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<circle cx="124" cy="162" r="7" fill="${a}"/>` +
    `<path d="M110 130L100 108" stroke="${s}" stroke-width="8" stroke-linecap="round"/>` +
    plate(88, 102, 22, 8, s, 4) +
    `<path d="M142 134L152 108" stroke="${s}" stroke-width="8" stroke-linecap="round"/>` +
    bar("M142 106L164 106", 6) +
    head(122, 62) +
    torso("M124 76L104 108") +
    limb("M122 84L148 104") +
    limb("M104 110L134 138L128 164") +
    limb("M104 110L118 142L140 168", .5) +
    `<circle cx="128" cy="166" r="5" fill="${a}"/><circle cx="140" cy="170" r="5" fill="${a}"/>`,
  // Скакалка/динамика: прыжок над дугой каната.
  "jump-rope": (a) =>
    `<path d="M42 156C94.0 68.0 146.0 68.0 198 156" stroke="${a}" stroke-width="4" fill="none" stroke-dasharray="9 7" opacity=".9" stroke-linecap="round"/>` +
    head(120, 64) +
    torso("M120 78L120 130") +
    limb("M120 130L102 156L112 180") +
    limb("M120 130L138 156L128 180", .85) +
    limb("M120 94L92 118") +
    limb("M120 94L148 118", .85) +
    `<circle cx="90" cy="122" r="5" fill="${a}"/><circle cx="150" cy="122" r="5" fill="${a}"/>`,
  // Подъёмы ног в висе: перекладина, ноги подняты горизонтально.
  "hanging-leg-raise": (s) =>
    bar("M64 42L176 42", 9) +
    `<path d="M64 42L64 60M176 42L176 60" stroke="${s}" stroke-width="7" opacity=".7"/>` +
    head(120, 74) +
    torso("M120 88L118 128") +
    limb("M108 48L116 90") +
    limb("M132 48L120 92", .7) +
    limb("M118 128L146 124L166 118") +
    limb("M118 128L144 132L164 130", .6),
};

/** Явная карта для базовых упражнений каталога. */
const explicitCompositions: Record<string, string> = {
  "bench-press": "bench-barbell",
  "incline-db-press": "incline-db-press",
  "lat-pulldown": "lat-pulldown",
  "barbell-row": "barbell-row",
  squat: "squat",
  "leg-press": "leg-press",
  "shoulder-press": "overhead-press",
  "lateral-raise": "lateral-raise",
  "biceps-curl": "biceps-curl",
  "triceps-pushdown": "triceps-pushdown",
  plank: "plank",
  treadmill: "treadmill",
  "dumbbell-row": "barbell-row",
  "romanian-deadlift": "deadlift",
  "walking-lunge": "lunge",
  dips: "dips",
  "leg-curl": "leg-machine",
  "calf-raise": "calf-raise",
  "cable-crunch": "crunch",
  rower: "rower",
};

/**
 * Устойчивый подбор композиции для расширенного каталога: по ключевым словам id
 * (у них говорящие идентификаторы), затем по группе мышц и оборудованию.
 */
function selectComposition(id: string, group: string, equipment: string): string | undefined {
  const key = id.toLowerCase().replace(/[-_]/g, " ");
  const has = (...words: string[]) => words.some((word) => key.includes(word));
  if (key.includes("program")) {
    if (equipment.includes("Штанга")) return "deadlift";
    if (equipment.includes("Гантел")) return "overhead-press";
    if (equipment.includes("Тренажёр")) return "lat-pulldown";
    if (equipment.includes("Кардио") || equipment.includes("Дорожка")) return "treadmill";
    return undefined;
  }
  switch (group) {
    case "Грудь":
      if (has("fly", "разводк", "сведени", "pec deck", "pec-deck", "svend", "pullover")) return "fly";
      if (has("push")) return "push-up";
      if (has("incline")) return "incline-db-press";
      return "bench-barbell";
    case "Спина":
      if (has("pull up", "pullup", "inverted", "chin up", "chinup")) return "pull-up";
      if (has("pulldown", "pull down")) return "lat-pulldown";
      if (has("row", "shrug")) return equipment.includes("Штанга") ? "barbell-row" : "cable-row";
      if (has("deadlift", "rack pull", "rack-pull", "good morning")) return "deadlift";
      if (has("pullover")) return "fly";
      if (has("extension", "hyper")) return "crunch";
      return "cable-row";
    case "Ноги":
      if (has("calf")) return "calf-raise";
      if (has("lunge", "step", "split", "farmer", "carry")) return "lunge";
      if (has("leg press", "hack")) return "leg-press";
      if (has("curl", "extension", "adductor", "abductor")) return "leg-machine";
      if (has("deadlift", "thrust", "bridge", "sumo", "swing", "kettlebell")) return "deadlift";
      return "squat";
    case "Плечи":
      if (has("face pull", "face-pull", "upright")) return "cable-row";
      if (has("external", "rotation", "cuban", "raise", "fly")) return "lateral-raise";
      return "overhead-press";
    case "Бицепс":
      return "biceps-curl";
    case "Трицепс":
      if (has("dip")) return "dips";
      if (has("push up", "pushup", "push-up")) return "push-up";
      if (has("bench", "french", "lying", "close grip", "close-grip", "floor press")) return "bench-barbell";
      return "triceps-pushdown";
    case "Корпус":
      if (has("hanging", "leg raise", "knee raise", "toe to bar")) return "hanging-leg-raise";
      if (has("plank", "hollow", "wheel", "roller", "rollout")) return "plank";
      if (has("woodchop", "pallof")) return "triceps-pushdown";
      return "crunch";
    case "Кардио":
      if (has("row", "erg", "ski")) return "rower";
      if (has("bike", "velo")) return "exercise-bike";
      if (has("kettlebell", "swing")) return "deadlift";
      if (has("sled")) return "push-up";
      if (has("rope", "boxing", "shadow", "jump", "jack", "burpee", "swim", "climber")) return "jump-rope";
      return "treadmill";
    default:
      return undefined;
  }
}

/** Fallback для неизвестных и пользовательских id: обобщённая фигура с оборудованием по строке equipment. */
function legacyFallback(seed: number, accent: string, secondary: string, equipment: string) {
  const lean = (seed % 17) - 8;
  const arm = 92 + ((seed >>> 4) % 32);
  const leg = 172 + ((seed >>> 9) % 23);
  const equipmentMark = equipment.includes("Штанга")
    ? `<path d="M38 88h164M50 74v28M190 74v28" stroke="${LIGHT}" stroke-width="7" stroke-linecap="round"/><rect x="34" y="70" width="12" height="36" rx="4" fill="${secondary}"/><rect x="194" y="70" width="12" height="36" rx="4" fill="${secondary}"/>`
    : equipment.includes("Гантел")
      ? `<path d="M44 96h35M171 96h35" stroke="${LIGHT}" stroke-width="7" stroke-linecap="round"/><rect x="35" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="74" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="162" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="201" y="82" width="14" height="28" rx="4" fill="${secondary}"/>`
      : equipment.includes("Тренажёр")
        ? `<rect x="34" y="76" width="48" height="96" rx="10" fill="${secondary}" opacity=".9"/><rect x="45" y="90" width="26" height="18" rx="6" fill="${LIGHT}"/><path d="M178 54v130M154 184h48" stroke="${LIGHT}" stroke-width="8" stroke-linecap="round"/>`
        : `<circle cx="54" cy="104" r="22" fill="${secondary}" opacity=".9"/><path d="M44 104h20M54 94v20" stroke="${LIGHT}" stroke-width="5" stroke-linecap="round"/>`;
  return `${equipmentMark}<g transform="rotate(${lean} 120 132)" stroke="${LIGHT}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="120" cy="66" r="15" fill="${LIGHT}" stroke="none"/><path d="M120 84L120 132M120 99L${arm} 122M120 99L${240 - arm} 122M120 132L89 ${leg}M120 132L151 ${leg}"/><path d="M104 111L136 111" stroke="${secondary}" stroke-width="6"/></g>`;
}

/** Единая рамка: цветная плашка с мягким градиентом, декоративное кольцо, линия пола. */
function wrap(accent: string, secondary: string, body: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 240 240">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="#10101D"/></linearGradient></defs>` +
    `<rect width="240" height="240" rx="28" fill="url(#g)"/>` +
    `<circle cx="120" cy="120" r="92" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>` +
    `<circle cx="34" cy="196" r="5" fill="${LIGHT_SOFT}" opacity=".55"/>` +
    body +
    `<path d="M30 211h180" stroke="#fff" stroke-opacity=".2" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="206" cy="34" r="8" fill="${secondary}"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A self-contained local SVG illustration. Each exercise has its own color, pose and equipment composition. */
export function getExerciseIllustration(id: string, group: string, equipment: string) {
  const seed = hash(id);
  const accentIndex = seed % palette.length;
  const accent = palette[accentIndex];
  // Вторичный цвет всегда отличается от акцента: смещение по кольцу палитры из другого диапазона бит хэша.
  const secondary = palette[(accentIndex + 1 + ((seed >>> 4) % (palette.length - 1))) % palette.length];
  const compositionKey = explicitCompositions[id] ?? selectComposition(id, group, equipment);
  const composition = compositionKey ? compositions[compositionKey] : undefined;
  const body = composition ? composition(accent, secondary) : legacyFallback(seed, accent, secondary, equipment);
  return wrap(accent, secondary, body);
}
