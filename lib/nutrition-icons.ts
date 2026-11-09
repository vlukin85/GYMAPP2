/**
 * Цветные иллюстративные SVG-миниатюры продуктов питания.
 *
 * Единый стиль с lib/exercise-art.ts: круглая плашка-фон со скруглением rx=20
 * и мягким градиентом (палитра детерминирована по id), плоский силуэт продукта
 * тёплым светлым тоном с 1–2 акцентными заливками. Файл самодостаточен:
 * только строки-SVG, никаких внешних ресурсов. 96×96 viewBox 0 0 96 96.
 * getFoodIllustration используют app/(tabs)/nutrition.tsx и тесты.
 */

const palettes: string[][] = [
  ["#F97316", "#7C2D12"], ["#E11D48", "#4C0519"], ["#22C55E", "#14532D"], ["#0EA5E9", "#0C4A6E"],
  ["#A855F7", "#3B0764"], ["#EAB308", "#713F12"], ["#14B8A6", "#134E4A"], ["#F43F5E", "#881337"],
  ["#6366F1", "#1E1B4B"], ["#84CC16", "#365314"],
];

/** Тёплый светлый тон силуэтов продуктов. */
const L = "#F8FAFC";

function hash(value: string) {
  return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

/* ---------- Примитивы единого визуального языка ---------- */

const c = (cx: number, cy: number, r: number, fill: string, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`;
const box = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const shape = (d: string, fill: string, extra = "") => `<path d="${d}" fill="${fill}"${extra}/>`;
const line = (d: string, color: string, width: number, extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${extra}/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${extra}/>`;

/* ---------- Библиотека композиций (55 силуэтов продуктов) ---------- */

const compositions: Record<string, (a: string, s: string) => string> = {
  // Яблоко/груша: плод с хвостиком и акцентным листиком.
  apple: (a, s) =>
    line("M48 28c0-5 2-8 5-11", s, 3) +
    shape("M53 18c4-2 8-2 11 1-3 4-8 5-12 4z", a) +
    shape("M48 32c-11-7-25-2-25 13 0 15 11 27 25 27s25-12 25-27c0-15-14-20-25-13z", L),
  // Банан: серповидный плод с акцентными кончиками.
  banana: (a) =>
    shape("M25 30c0 24 15 40 39 40 5 0 7-5 3-8-18-8-28-19-31-34-1-6-11-4-11 2z", L) +
    c(25, 31, 3.5, a) + c(66, 66, 3.5, a),
  // Цитрус/киви/авокадо: целый фрукт с листиком и половинка с дольками или семенами.
  citrus: (a, s) =>
    c(36, 52, 17, L) +
    shape("M28 36c2-5 6-7 10-7-1 5-5 8-10 7z", a) +
    c(67, 52, 16, L) + c(67, 52, 11, a) +
    line("M67 43v18M58 52h18M61 46l12 12M73 46L61 58", s, 2),
  // Ягоды и сухофрукты: гроздь округлых ягод с акцентным листиком.
  berries: (a, s) =>
    shape("M40 26c6-6 14-6 18 0-6 4-12 4-18 0z", a) +
    c(34, 42, 9, L) + c(52, 40, 10, L) + c(42, 58, 10, L) + c(60, 56, 8, L) +
    c(30, 39, 2, s) + c(49, 37, 2, s) + c(39, 55, 2, s) + c(57, 53, 2, s),
  // Виноград: гроздь ягод с веточкой и листом.
  grapes: (a, s) =>
    line("M48 30V22", s, 3) +
    shape("M48 24c8-6 16-6 22-2-6 6-14 8-22 6z", a) +
    c(38, 40, 6, L) + c(50, 38, 6, L) + c(62, 40, 6, L) + c(33, 50, 6, L) + c(45, 49, 6, L) + c(57, 50, 6, L) + c(40, 59, 6, L) + c(52, 59, 6, L) + c(46, 68, 6, L),
  // Арбуз/дыня/тыква: долька с коркой и семечками.
  "watermelon-slice": (a, s) =>
    shape("M20 62a28 28 0 0 1 56 0z", a) +
    shape("M26 62a22 22 0 0 1 44 0z", L) +
    c(38, 52, 2, s) + c(48, 46, 2, s) + c(58, 52, 2, s) + c(43, 58, 2, s) + c(53, 58, 2, s),
  // Косточковые (персик, слива, манго, гранат) и лук/чеснок: плод-луковица с бороздкой и листом.
  "stone-fruit": (a, s) =>
    line("M48 30v-8", s, 3) +
    shape("M50 24c5-4 11-4 15 0-4 4-10 5-15 3z", a) +
    c(48, 54, 21, L) +
    line("M48 37c-4 6-4 28 0 34M40 39c-2 8-2 24 1 30M56 39c2 8 2 24-1 30", s, 1.8),
  // Ананас: шишка с перекрёстной штриховкой и короной листьев.
  pineapple: (a, s) =>
    shape("M40 30l-8-10 10 4 6-12 6 12 10-4-8 10z", a) +
    ell(48, 58, 17, 21, L) +
    line("M36 50l24 16M38 62l20-14M48 40v36M34 56l28 4M62 56l-28 4", s, 1.8),
  // Огурец/кабачок/баклажан: вытянутый плод с пупырышками.
  cucumber: (a, s) =>
    ell(48, 52, 11, 27, L, ' transform="rotate(28 48 52)"') +
    c(42, 38, 1.5, s) + c(53, 45, 1.5, s) + c(44, 56, 1.5, s) + c(53, 65, 1.5, s) +
    c(61, 29, 3, a) + c(35, 75, 3, a),
  // Помидор/перец: круглый плод с чашелистиками.
  tomato: (a) =>
    c(48, 54, 21, L) +
    line("M48 33v6M40 34l4 7M56 34l-4 7M34 41l8 4M62 41l-8 4", a, 2.5) +
    c(48, 33, 3, a),
  // Морковь/свёкла/редис: корнеплод с ботвой.
  carrot: (a, s) =>
    shape("M43 32h16L50 74z", L) +
    line("M48 32v-11M41 32l-6-9M56 32l6-9", a, 3.5) +
    line("M45 40l10 3M44 48l10 3", s, 2),
  // Картофель: пара клубней с глазками и ростком.
  potato: (a, s) =>
    ell(38, 50, 14, 11, L) + ell(58, 56, 15, 12, L) +
    c(34, 47, 1.6, s) + c(42, 53, 1.6, s) + c(54, 52, 1.6, s) + c(62, 58, 1.6, s) +
    line("M58 44c1-4 4-6 8-7", a, 2.5),
  // Капуста/брокколи: кочан с верхним листом и прожилками.
  cabbage: (a, s) =>
    c(48, 52, 23, L) +
    shape("M27 50c6-12 20-16 30-8-8 2-12 6-14 12-8-2-12-2-16-4z", a) +
    line("M30 58c10 6 26 6 36 0M34 66c8 4 20 4 28 0", s, 2),
  // Листовая зелень: три листа с прожилкой.
  leafy: (a, s) =>
    shape("M46 76c-2-16-2-30 2-44 4 14 4 28 2 44z", L) +
    shape("M44 74C32 68 26 56 28 42c10 8 16 20 16 32z", L) +
    shape("M52 74c12-6 18-18 16-32-10 8-16 20-16 32z", L) +
    line("M48 78V42", s, 2) +
    c(30, 40, 2.5, a) + c(66, 40, 2.5, a),
  // Гриб: шляпка с акцентными пятнами и ножка.
  mushroom: (a) =>
    shape("M25 54c0-15 10-24 23-24s23 9 23 24z", L) +
    box(41, 54, 14, 16, L, 5) +
    c(38, 42, 3, a) + c(50, 38, 3.5, a) + c(60, 46, 3, a),
  // Горошек/фасоль/кукуруза: стручок с зернами.
  "peas-pod": (a, s) =>
    shape("M24 46c10-12 38-12 48 0-10 12-38 12-48 0z", L) +
    c(36, 46, 5, a) + c(48, 44, 5, a) + c(60, 46, 5, a) +
    line("M24 46l-4-4M72 46l4-4", s, 3),
  // Куриная грудка: филе с приправами.
  "chicken-breast": (a) =>
    shape("M42 28c14-4 26 6 26 20 0 16-12 26-27 24-9-1-13-9-11-19 2-11 4-21 12-25z", L) +
    line("M44 42l14 5M42 52l16 5", a, 2.5),
  // Окорок/бедро/крылья: ножка с косточкой.
  "chicken-leg": (a) =>
    ell(42, 50, 17, 15, L) +
    line("M55 60L68 72", L, 9) +
    c(72, 69, 4.5, L) + c(67, 75, 4.5, L) +
    line("M34 42c6-4 14-4 20 2", a, 2.5),
  // Стейк/мякоть: порция мяса с жирной кромкой и прожилками.
  steak: (a, s) =>
    box(24, 40, 46, 26, L, 12) +
    line("M30 44c8-4 28-4 34 0", a, 4) +
    line("M36 53h20M36 59h20", s, 2.5),
  // Котлета/наггетс/тефтели: овальная панированная котлета.
  cutlet: (a, s) =>
    ell(48, 54, 22, 15, L) +
    line("M32 46c8-6 24-6 32 0", a, 3) +
    c(38, 52, 1.6, s) + c(48, 48, 1.6, s) + c(58, 54, 1.6, s) + c(44, 60, 1.6, s) + c(56, 60, 1.6, s),
  // Колбасная нарезка: ломтики с сердцевиной и сосиска.
  "sausage-platter": (a, s) =>
    c(34, 38, 10, L) + c(34, 38, 5, a) + c(58, 34, 8, L) + c(58, 34, 4, a) +
    ell(48, 66, 24, 9, L, ' transform="rotate(-8 48 66)"') +
    c(27, 62, 3, a) + c(69, 68, 3, a),
  // Бекон/сало/шпик: полоски с мясными прожилками.
  bacon: (a, s) =>
    shape("M22 34c6-5 12-5 18 0s12 5 18 0 12-5 18 0v8c-6 5-12 5-18 0s-12-5-18 0-12 5-18 0z", L) +
    line("M28 37c4 3 8 3 12 0M46 37c4 3 8 3 12 0M64 37c4 3 8 3 12 0", s, 1.8) +
    shape("M22 56c6-5 12-5 18 0s12 5 18 0 12-5 18 0v8c-6 5-12 5-18 0s-12-5-18 0-12 5-18 0z", L) +
    line("M28 59c4 3 8 3 12 0M46 59c4 3 8 3 12 0M64 59c4 3 8 3 12 0", s, 1.8) +
    line("M30 42v6M50 42v6M70 42v6", a, 2),
  // Рыба целиком: туловище, хвост, плавник и жабры.
  "fish-whole": (a, s) =>
    shape("M22 50c8-11 20-17 32-17 14 0 22 9 26 17-4 8-12 17-26 17-12 0-24-6-32-17z", L) +
    shape("M74 50l12-9c-2 4-2 14 0 18z", L) +
    shape("M50 34c4-6 10-8 14-8-2 6-6 10-12 12z", a) +
    c(34, 46, 3, a) +
    line("M40 38c2 8 2 18 0 24", s, 2),
  // Стейк рыбы/сашими: порция с секторами и шкуркой.
  "fish-steak": (a, s) =>
    box(24, 42, 48, 22, L, 11) +
    line("M36 44v18M48 44v18M60 44v18", a, 3) +
    line("M27 46h42", s, 3),
  // Креветка/мидии/кальмар: изогнутое тельце с хвостом и лапками.
  shrimp: (a, s) =>
    shape("M30 56c-4-16 8-30 24-30 13 0 22 9 22 18 0 11-11 18-24 17-9-1-16-2-22-5z", L) +
    shape("M70 34l10-6c-1 6-3 9-7 12z", a) +
    c(40, 40, 2.5, s) +
    line("M34 62l-6 6M40 64l-4 7M47 65l-2 8", s, 2.5),
  // Икра: икорница с горкой икринок.
  caviar: (a, s) =>
    c(36, 48, 4.5, a) + c(46, 45, 4.5, a) + c(56, 48, 4.5, a) + c(41, 53, 4.5, a) + c(51, 53, 4.5, a) +
    shape("M26 54h44l-4 12c-1 3-3 4-6 4H36c-3 0-5-1-6-4z", L) +
    c(66, 44, 2.5, s),
  // Яйцо/яичница: яйцо и разбитое с желтком.
  egg: (a, s) =>
    shape("M42 22c9 0 16 12 16 25 0 13-7 21-16 21s-16-8-16-21c0-13 7-25 16-25z", L) +
    shape("M68 56c7 0 10 8 10 14 0 8-5 12-10 12s-10-4-10-12c0-6 3-14 10-14z", s) +
    c(68, 72, 4, a),
  // Молоко/сливки: бутылка с крышкой и этикеткой.
  "milk-bottle": (a, s) =>
    box(40, 24, 16, 10, a, 3) +
    shape("M42 34h12v8c6 3 9 9 9 16v18c0 5-4 8-9 8H42c-5 0-9-3-9-8V58c0-7 3-13 9-16z", L) +
    box(33, 58, 30, 9, s, 2),
  // Кефир/йогурт/сметана: стаканчик с фольгой.
  "yogurt-cup": (a, s) =>
    shape("M34 40h28l-4 30c0 3-3 5-6 5H44c-3 0-6-2-6-5z", L) +
    box(31, 33, 34, 8, a, 3) +
    line("M42 56h12", s, 2.5),
  // Творог/рикотта: пачка с шапкой-этикеткой.
  "cottage-pack": (a, s) =>
    box(30, 36, 36, 34, L, 4) +
    box(30, 36, 36, 11, a, 4) +
    line("M38 60h20M38 65h13", s, 2.5),
  // Сыр: клин с дырками и коркой.
  cheese: (a, s) =>
    shape("M24 64l20-30c3-4 9-4 12 0l20 30z", L) +
    c(44, 50, 3.5, s) + c(54, 56, 3, s) + c(48, 60, 2.5, s) +
    line("M24 64h52", a, 4),
  // Масло сливочное: пачка с обёрткой.
  butter: (a, s) =>
    box(28, 38, 40, 32, L, 4) +
    box(28, 31, 40, 9, a, 4) +
    line("M38 58h20M38 63h14", s, 2.5),
  // Крупы/мука: миска с горкой зёрен.
  "grain-bowl": (a, s) =>
    shape("M25 50h46c0 13-10 21-23 21s-23-8-23-21z", L) +
    c(48, 46, 13, a) +
    c(42, 44, 1.6, s) + c(50, 42, 1.6, s) + c(55, 47, 1.6, s) + c(45, 50, 1.6, s),
  // Макароны/лапша: гнездо спагетти.
  pasta: (a, s) =>
    c(48, 54, 20, L) +
    c(48, 54, 13, a) +
    line("M38 50c6-6 14-6 20 0M36 58c8 6 16 6 24 0M42 66c4 2 8 2 12 0", s, 2),
  // Хлеб: буханка с надрезами.
  "bread-loaf": (a, s) =>
    shape("M25 62c0-13 10-21 23-21s23 8 23 21z", L) +
    box(23, 60, 50, 10, L, 3) +
    line("M36 50l8-6M46 52l8-6", a, 3),
  // Багет/чиабатта: вытянутый батон с надрезами.
  baguette: (a) =>
    `<rect x="20" y="46" width="56" height="16" rx="8" fill="${L}" transform="rotate(-18 48 54)"/>` +
    line("M34 52l7-6M44 54l7-6M54 56l7-6", a, 3),
  // Выпечка/круассан/бублик: изделие с рогами и акцентными концами.
  pastry: (a, s) =>
    shape("M24 56c-2-16 10-28 24-28s26 12 24 28c-4-9-13-14-24-14s-20 5-24 14z", L) +
    line("M40 34c-2 8-2 16 0 22M56 34c2 8 2 16 0 22", s, 2) +
    c(48, 28, 4, a) + c(27, 56, 4, a) + c(69, 56, 4, a),
  // Блины/сырники: стопка с маслом и сиропом.
  pancake: (a, s) =>
    ell(48, 66, 24, 7, L) + ell(48, 59, 24, 7, L) + ell(48, 52, 24, 7, L) +
    box(42, 44, 12, 6, a, 2) +
    shape("M40 51c2 2 14 2 16 0-2 4-14 4-16 0z", s),
  // Орехи: ядра с скорлупой.
  nuts: (a, s) =>
    shape("M32 44c0-7 7-12 16-12s16 5 16 12c0 10-7 22-16 22s-16-12-16-22z", L) +
    c(48, 46, 5, a) +
    c(36, 60, 6, L) + c(60, 60, 6, L) + c(36, 60, 2.5, a) + c(60, 60, 2.5, a) +
    line("M30 40c4-6 12-9 18-9", s, 2),
  // Масло растительное: бутылка с крышкой и этикеткой.
  "oil-bottle": (a, s) =>
    box(43, 22, 10, 7, a, 2) +
    shape("M44 29h8l1 6c6 3 9 8 9 14v22c0 5-4 8-9 8H43c-5 0-9-3-9-8V49c0-6 3-11 9-14z", L) +
    box(35, 54, 26, 9, s, 2),
  // Соусы/мёд/джем: банка с крышкой и этикеткой.
  "sauce-jar": (a, s) =>
    box(36, 26, 24, 8, a, 3) +
    box(33, 34, 30, 36, L, 5) +
    box(33, 48, 30, 12, s) +
    line("M40 42h16", s, 2),
  // Шоколад/протеиновый батончик: плитка с дольками.
  chocolate: (a, s) =>
    box(26, 34, 44, 30, L, 4) +
    line("M48 34v30M26 49h44", s, 2) +
    box(30, 38, 14, 8, a, 2) + box(52, 38, 14, 8, a, 2) + box(30, 51, 14, 8, a, 2) + box(52, 51, 14, 8, a, 2),
  // Мороженое: рожок с шариком.
  "ice-cream": (a, s) =>
    shape("M36 48h24L50 78h-4z", L) +
    line("M40 58l14-6M39 64l17-7", s, 2) +
    c(48, 38, 13, a) +
    c(43, 33, 2.5, L) + c(53, 36, 2.5, L),
  // Печенье/крекер: круглое с крошками и кусочками.
  cookie: (a, s) =>
    c(48, 52, 20, L) +
    c(40, 46, 3, a) + c(54, 44, 2.5, a) + c(56, 58, 3, a) + c(44, 60, 2.5, a) +
    c(48, 52, 2, s) + c(35, 55, 1.6, s),
  // Протеин/гейнер: банка спортпита с крышкой.
  "protein-jar": (a, s) =>
    box(34, 32, 28, 42, L, 6) +
    box(32, 26, 32, 10, a, 3) +
    box(34, 50, 28, 10, s) +
    line("M40 68h16", s, 2),
  // Кофе/чай/какао: чашка с паром на блюдце.
  "coffee-cup": (a, s) =>
    shape("M32 44h28v16c0 7-6 11-14 11s-14-4-14-11z", L) +
    `<circle cx="64" cy="51" r="6" fill="none" stroke="${L}" stroke-width="4"/>` +
    line("M40 34c2-4-2-6 0-10M50 34c2-4-2-6 0-10", a, 2.5) +
    box(26, 74, 44, 4, s, 2),
  // Напитки/соки/вода: стакан с напитком и трубочкой.
  glass: (a, s) =>
    shape("M33 26h30l-4 42c0 3-4 4-11 4s-11-1-11-4z", L) +
    shape("M35 42h26l-1 10H36z", a) +
    line("M56 26l6-12", s, 3) +
    c(42, 62, 1.5, s) + c(48, 66, 1.5, s),
  // Кола/лимонад: бутылка с этикеткой.
  "cola-bottle": (a, s) =>
    box(42, 20, 12, 7, a, 2) +
    shape("M43 27h10l1 7c7 3 10 9 10 16v20c0 6-6 8-16 8s-16-2-16-8V50c0-7 3-13 10-16z", L) +
    box(31, 52, 34, 9, s, 2),
  // Горячие блюда/гарниры: тарелка с порцией и паром.
  "hot-plate": (a, s) =>
    c(48, 58, 26, L) + ell(48, 58, 17, 10, s, ' opacity=".55"') +
    shape("M36 56c0-8 5-13 12-13s12 5 12 13z", a) +
    line("M42 38c2-4-2-6 0-10M54 36c2-4-2-6 0-10", L, 2.5),
  // Супы: пиала с содержимым, паром и подставкой.
  "soup-bowl": (a, s) =>
    shape("M26 46h44c0 14-10 22-22 22s-22-8-22-22z", L) +
    ell(48, 46, 16, 4, a) +
    line("M40 34c2-4-2-6 0-10M54 32c2-4-2-6 0-10", a, 2.5) +
    box(40, 68, 16, 5, s, 2),
  // Салаты: миска с листьями и овощами.
  "salad-bowl": (a, s) =>
    shape("M26 48h44c0 13-10 21-22 21s-22-8-22-21z", L) +
    shape("M36 48c-4-8-2-16 4-20 2 8 0 14-4 20z", a) +
    shape("M48 48c0-9 4-15 10-17-1 8-4 13-10 17z", a) +
    c(58, 46, 3, s) + c(40, 45, 3, s),
  // Суши/роллы: два ролла и нигири.
  sushi: (a, s) =>
    c(36, 58, 12, L) + c(36, 58, 6, a) +
    c(62, 58, 12, L) + c(62, 58, 6, a) +
    box(44, 28, 26, 10, L, 5) + box(46, 23, 22, 7, a, 3),
  // Бургеры/хот-доги/сэндвичи: булка, котлета, салат.
  burger: (a, s) =>
    shape("M28 46c0-11 9-18 20-18s20 7 20 18z", L) +
    c(44, 38, 1.6, s) + c(54, 36, 1.6, s) +
    box(28, 48, 40, 7, a, 3) +
    box(28, 57, 40, 5, s, 2) +
    box(30, 62, 36, 9, L, 4),
  // Пицца/хачапури: долька с бортиком и начинкой.
  "pizza-slice": (a, s) =>
    shape("M25 40a24 24 0 0 1 46 0L48 78z", L) +
    shape("M25 40a24 24 0 0 1 46 0l-5 3a19 19 0 0 0-36 0z", a) +
    c(42, 50, 3.5, s) + c(52, 58, 3.5, s) + c(46, 64, 3, s),
  // Шаурма/буррито/роллы: свёрток с начинкой.
  shawarma: (a, s) =>
    `<rect x="24" y="42" width="48" height="20" rx="10" fill="${L}" transform="rotate(18 48 52)"/>` +
    line("M36 46l24 6M38 54l24 4", a, 3) +
    line("M27 45l-2 8M71 51l-2 8", s, 2.5),
};

/** Явная карта для ходовых продуктов каталога. */
const explicitCompositions: Record<string, string> = {
  apple: "apple", pear: "apple", banana: "banana", orange: "citrus", grapefruit: "citrus", lemon: "citrus", lime: "citrus", mandarin: "citrus", kiwi: "citrus", avocado: "citrus",
  grape: "grapes", watermelon: "watermelon-slice", melon: "watermelon-slice", pumpkin: "watermelon-slice", pineapple: "pineapple",
  peach: "stone-fruit", apricot: "stone-fruit", plum: "stone-fruit", fig: "stone-fruit", persimmon: "stone-fruit", mango: "stone-fruit", pomegranate: "stone-fruit",
  strawberry: "berries", blueberry: "berries", cherry: "berries", raspberry: "berries", blackberry: "berries", cranberry: "berries", currant: "berries", gooseberry: "berries",
  raisins: "berries", prunes: "berries", "dried-apricot": "berries", "dried-apple": "berries",
  cucumber: "cucumber", zucchini: "cucumber", eggplant: "cucumber", daikon: "cucumber", tomato: "tomato", "bell-pepper": "tomato", carrot: "carrot", beet: "carrot", radish: "carrot",
  potato: "potato", cabbage: "cabbage", broccoli: "cabbage", cauliflower: "cabbage", sauerkraut: "cabbage", spinach: "leafy", lettuce: "leafy", celery: "leafy", mushrooms: "mushroom",
  onion: "stone-fruit", garlic: "stone-fruit", corn: "peas-pod", "green-peas": "peas-pod", "green-beans": "peas-pod", asparagus: "peas-pod",
  "chicken-breast": "chicken-breast", turkey: "chicken-breast", "chicken-thigh": "chicken-leg", duck: "chicken-leg", "chicken-wings": "chicken-leg",
  beef: "steak", pork: "steak", veal: "steak", lamb: "steak", rabbit: "steak", liver: "steak", "pork-loin": "steak", "beef-steak": "steak", "pork-kebab": "steak", kebab: "steak",
  salmon: "fish-steak", tuna: "fish-steak", "salmon-steak": "fish-steak", sashimi: "fish-steak", cod: "fish-whole", mackerel: "fish-whole", herring: "fish-whole", pollock: "fish-whole", "pink-salmon": "fish-whole",
  shrimp: "shrimp", "battered-shrimp": "shrimp", mussels: "shrimp", squid: "shrimp", "red-caviar": "caviar", egg: "egg", "egg-c0": "egg", "egg-c2": "egg", "quail-egg": "egg",
  milk: "milk-bottle", cream: "milk-bottle", "soy-milk": "milk-bottle", "oat-milk": "milk-bottle", "baked-milk": "milk-bottle", "condensed-milk": "milk-bottle",
  kefir: "yogurt-cup", yogurt: "yogurt-cup", "greek-yogurt": "yogurt-cup", ryazhenka: "yogurt-cup", "sour-milk": "yogurt-cup", snezhok: "yogurt-cup", "sour-cream": "yogurt-cup", "curd-dessert": "yogurt-cup", "yogurt-dessert": "yogurt-cup",
  "cottage-cheese": "cottage-pack", "cottage-zero": "cottage-pack", skyr: "cottage-pack", ricotta: "cottage-pack", "cream-cheese": "cottage-pack",
  cheese: "cheese", mozzarella: "cheese", brie: "cheese", feta: "cheese", parmesan: "cheese", "goat-cheese": "cheese", "processed-cheese": "cheese", camembert: "cheese", tofu: "cheese", tempeh: "cheese", seitan: "cheese",
  butter: "butter", oats: "grain-bowl", buckwheat: "grain-bowl", rice: "grain-bowl", "brown-rice": "grain-bowl", quinoa: "grain-bowl", couscous: "grain-bowl", bulgur: "grain-bowl", barley: "grain-bowl", millet: "grain-bowl",
  semolina: "grain-bowl", "wheat-groats": "grain-bowl", "corn-grits": "grain-bowl", "rye-flakes": "grain-bowl", spelt: "grain-bowl", amaranth: "grain-bowl", polenta: "grain-bowl",
  "corn-flakes": "grain-bowl", muesli: "grain-bowl", granola: "grain-bowl", "oatmeal-cooked": "grain-bowl", "buckwheat-cooked": "grain-bowl", "rice-porridge": "grain-bowl", "semolina-porridge": "grain-bowl",
  flour: "grain-bowl", starch: "grain-bowl", breadcrumbs: "grain-bowl", gelatin: "grain-bowl", pasta: "pasta", noodles: "pasta", soba: "pasta", "rice-noodles": "pasta", bolognese: "pasta", carbonara: "pasta", "pad-thai": "pasta", "pasta-cooked": "pasta",
  "white-bread": "bread-loaf", "rye-bread": "bread-loaf", "whole-bread": "bread-loaf", "black-bread": "bread-loaf", "toast-bread": "bread-loaf",
  baguette: "baguette", ciabatta: "baguette", breadsticks: "baguette", lavash: "bread-loaf", pita: "bread-loaf", tortilla: "bread-loaf",
  croissant: "pastry", bagel: "pastry", brioche: "pastry", pretzel: "pastry", waffle: "pastry", cheesecake: "pastry", donut: "pastry", brownie: "pastry", khachapuri: "pastry",
  pancake: "pancake", syrniki: "pancake", "french-toast": "pancake", cracker: "cookie", "rice-cakes": "cookie", cookie: "cookie", "oat-cookies": "cookie", "protein-cookie": "cookie",
  almonds: "nuts", walnut: "nuts", cashew: "nuts", peanut: "nuts", pistachio: "nuts", hazelnut: "nuts", "brazil-nut": "nuts", macadamia: "nuts", pecan: "nuts", "pine-nut": "nuts",
  "sunflower-seeds": "nuts", "pumpkin-seeds": "nuts", chia: "nuts", flax: "nuts", sesame: "nuts",
  "olive-oil": "oil-bottle", "vegetable-oil": "oil-bottle", "coconut-oil": "oil-bottle", "flax-oil": "oil-bottle", "sesame-oil": "oil-bottle",
  mayonnaise: "sauce-jar", ketchup: "sauce-jar", mustard: "sauce-jar", "soy-sauce": "sauce-jar", tahini: "sauce-jar", pesto: "sauce-jar", "tomato-paste": "sauce-jar", "tomato-adjika": "sauce-jar", "squash-caviar": "sauce-jar", jam: "sauce-jar", honey: "sauce-jar", hummus: "sauce-jar", "peanut-butter": "sauce-jar", "protein-spread": "sauce-jar",
  "dark-chocolate": "chocolate", "milk-chocolate": "chocolate", "white-chocolate": "chocolate", "protein-bar": "chocolate",
  "ice-cream": "ice-cream", marshmallow: "chocolate", marmalade: "chocolate", halva: "chocolate", pastila: "chocolate", sugar: "grain-bowl",
  whey: "protein-jar", casein: "protein-jar", gainer: "protein-jar", creatine: "protein-jar", bcaa: "protein-jar", "plant-protein": "protein-jar",
  coffee: "coffee-cup", americano: "coffee-cup", latte: "coffee-cup", cappuccino: "coffee-cup", tea: "coffee-cup", cocoa: "coffee-cup",
  juice: "glass", kvass: "glass", compote: "glass", "fruit-drink": "glass", "coconut-water": "glass", tonic: "glass", "energy-drink": "glass", water: "glass", isotonic: "glass", "recovery-drink": "glass", electrolyte: "glass", cola: "cola-bottle",
  "baked-potato": "hot-plate", "mashed-potato": "hot-plate", "french-fries": "hot-plate", "country-potato": "hot-plate", pelmeni: "hot-plate", lasagna: "hot-plate", pilaf: "hot-plate", risotto: "hot-plate", "beef-stew": "hot-plate", "cabbage-rolls": "hot-plate", "buckwheat-chicken": "hot-plate", "chicken-curry": "hot-plate", dumplings: "hot-plate", khinkali: "hot-plate", manti: "hot-plate",
  "chicken-soup": "soup-bowl", borscht: "soup-bowl", shchi: "soup-bowl", rassolnik: "soup-bowl", "meatball-soup": "soup-bowl", "mushroom-soup": "soup-bowl", "vegetable-soup": "soup-bowl", solyanka: "soup-bowl", gazpacho: "soup-bowl", "noodle-soup": "soup-bowl", minestrone: "soup-bowl", "cheese-soup": "soup-bowl", "lentil-soup": "soup-bowl", "fish-soup": "soup-bowl", ramen: "soup-bowl", pho: "soup-bowl",
  caesar: "salad-bowl", "greek-salad": "salad-bowl", olivier: "salad-bowl", vinaigrette: "salad-bowl", "tuna-salad": "salad-bowl", coleslaw: "salad-bowl", "beet-salad": "salad-bowl", poke: "salad-bowl",
  sushi: "sushi", "spring-roll": "sushi", burger: "burger", cheeseburger: "burger", fishburger: "burger", "veggie-burger": "burger", "chicken-sandwich": "burger", hotdog: "burger", "sausage-dough": "burger",
  pizza: "pizza-slice", shawarma: "shawarma", burrito: "shawarma", quesadilla: "shawarma", tacos: "shawarma", "chicken-wrap": "shawarma",
  "chicken-cutlet": "cutlet", "fish-cutlet": "cutlet", meatballs: "cutlet", nuggets: "cutlet", "fried-chicken": "cutlet", "onion-rings": "cutlet", falafel: "cutlet",
  lentils: "peas-pod", chickpeas: "peas-pod", beans: "peas-pod", "dried-peas": "peas-pod", "red-beans": "peas-pod", "green-lentils": "peas-pod", soybeans: "peas-pod", edamame: "peas-pod",
  "boiled-sausage": "sausage-platter", sausages: "sausage-platter", "sausages-thick": "sausage-platter", ham: "sausage-platter", salami: "sausage-platter", "hunter-sausage": "sausage-platter",
  bacon: "bacon", salo: "bacon", shpik: "bacon", "smoked-carbonad": "bacon",
};

/**
 * Подбор композиции по категории и ключевым словам названия — для позиций
 * вне явной карты (пользовательские продукты, новые позиции каталога).
 */
function selectComposition(id: string, name: string, category: string): string {
  const key = `${id} ${name}`.toLowerCase();
  const has = (...words: string[]) => words.some((word) => key.includes(word));
  switch (category) {
    case "Фрукты":
      if (has("яблок", "pear", "груш")) return "apple";
      if (has("банан")) return "banana";
      if (has("цитрус", "апельсин", "лимон", "лайм", "грейпфрут", "мандарин")) return "citrus";
      if (has("виноград")) return "grapes";
      if (has("арбуз", "дыня", "тыкв")) return "watermelon-slice";
      if (has("ананас")) return "pineapple";
      if (has("киви", "авокадо")) return "citrus";
      return "stone-fruit";
    case "Ягоды":
      return "berries";
    case "Сухофрукты":
      return "berries";
    case "Овощи":
      if (has("огурц", "кабачк", "баклаж", "дайкон")) return "cucumber";
      if (has("капуст")) return "cabbage";
      if (has("лук", "чеснок")) return "stone-fruit";
      if (has("салат", "зелень", "шпинат", "сельдер", "укроп", "петрушк", "щавел", "лист")) return "leafy";
      if (has("гриб")) return "mushroom";
      if (has("морков", "свёкл", "свекл", "редьк", "редис")) return "carrot";
      if (has("горошек", "кукуруз", "спарж", "стручк")) return "peas-pod";
      if (has("картоф")) return "potato";
      if (has("помидор", "томат", "перец")) return "tomato";
      return "leafy";
    case "Мясо и рыба":
      if (has("икра")) return "caviar";
      if (has("яйц")) return "egg";
      if (has("креветк", "мидии", "кальмар", "морепродукт")) return "shrimp";
      if (has("рыб", "лосос", "семг", "тун", "треск", "минтай", "скумбр", "сельд", "горбуш", "камбал", "хек", "судак", "карп")) return has("стейк", "филе", "кусок") ? "fish-steak" : "fish-whole";
      if (has("колбас", "сосиск", "сардельк", "ветчин", "салями")) return "sausage-platter";
      if (has("бекон", "сало", "шпик", "карбонад")) return "bacon";
      if (has("грудк")) return "chicken-breast";
      if (has("бедр", "окороч", "крыл", "ножк", "утк", "гус")) return "chicken-leg";
      if (has("котлет", "наггетс", "шницель", "тефтел", "фрикадел")) return "cutlet";
      return "steak";
    case "Молочные":
      if (has("сыр")) return "cheese";
      if (has("творог", "рикотта", "скир")) return "cottage-pack";
      if (has("йогурт", "кефир", "ряженк", "простокваш", "снежок", "сметан", "сливки", "десерт")) return "yogurt-cup";
      if (has("масло сливоч")) return "butter";
      return "milk-bottle";
    case "Крупы":
      return has("макарон", "лапш", "спагетти", "паста", "соба", "увон") ? "pasta" : "grain-bowl";
    case "Хлеб":
      if (has("багет", "палочк", "чиабатт")) return "baguette";
      if (has("лаваш", "пита", "тортил", "лепёшк", "лепешк")) return "bread-loaf";
      return "bread-loaf";
    case "Выпечка":
      if (has("блин", "оладь", "сырник", "гренки", "тост")) return "pancake";
      if (has("крекер", "печень", "хлебц")) return "cookie";
      return "pastry";
    case "Орехи":
      return "nuts";
    case "Масла":
      return has("сливоч") ? "butter" : "oil-bottle";
    case "Соусы":
      return "sauce-jar";
    case "Сладкое":
      if (has("шоколад", "батончик")) return "chocolate";
      if (has("мороженое", "эскимо")) return "ice-cream";
      if (has("печень", "вафл")) return "cookie";
      if (has("чизкейк", "брауни", "тирамису", "пирог", "рулет")) return "pastry";
      return "chocolate";
    case "Спортпит":
      if (has("батончик")) return "chocolate";
      if (has("паста")) return "sauce-jar";
      if (has("напиток", "изотоник", "электролит")) return "glass";
      return "protein-jar";
    case "Напитки":
      if (has("кофе", "чай", "какао", "латте", "капуч", "америк")) return "coffee-cup";
      if (has("кола", "пепси", "лимонад")) return "cola-bottle";
      return "glass";
    case "Супы":
      return "soup-bowl";
    case "Бобовые":
      return "peas-pod";
    case "Фастфуд":
      if (has("бургер", "булк", "сэндвич", "сендвич", "хот-дог", "хотдог")) return "burger";
      if (has("шаурм", "буррито", "ролл", "кесадил", "тако")) return "shawarma";
      if (has("пицц")) return "pizza-slice";
      if (has("наггетс", "котлет", "кольц", "крыл")) return "cutlet";
      return "hot-plate";
    case "Салаты и роллы":
      return has("ролл", "суши", "сашими", "поке") ? "sushi" : "salad-bowl";
    case "Мировая кухня":
      if (has("суп", "рамен", "фо бо")) return "soup-bowl";
      if (has("паста", "спагетти", "лапш", "пад")) return "pasta";
      if (has("суши", "ролл")) return "sushi";
      if (has("бургер")) return "burger";
      if (has("шаурм", "буррито", "такос", "кесадил", "фахит")) return "shawarma";
      if (has("пицц")) return "pizza-slice";
      if (has("котлет", "фалафел", "наггетс")) return "cutlet";
      return "hot-plate";
    case "Завтрак":
      if (has("яичниц", "омлет", "яйц")) return "egg";
      if (has("сырник", "блин", "гренки", "тост")) return "pancake";
      if (has("каш", "хлопь", "мюсли", "гранол")) return "grain-bowl";
      return "hot-plate";
    case "Готовые блюда":
      if (has("суп", "борщ", "щи", "уха")) return "soup-bowl";
      if (has("салат")) return "salad-bowl";
      if (has("суши", "ролл")) return "sushi";
      if (has("бургер")) return "burger";
      if (has("шаурм", "буррито", "кесадил")) return "shawarma";
      if (has("паста", "макарон", "спагетти", "болоньез", "карбонар")) return "pasta";
      if (has("котлет", "наггетс", "тефтел", "фрикадел", "люля")) return "cutlet";
      if (has("пицц")) return "pizza-slice";
      if (has("яичниц", "омлет")) return "egg";
      return "hot-plate";
    case "Ингредиенты":
      return "grain-bowl";
    case "Колбасные изделия":
      return has("бекон", "сало", "шпик", "карбонад") ? "bacon" : "sausage-platter";
    default:
      return "";
  }
}

/** Нейтральная тарелка для «Мои продукты» и неизвестных категорий: тарелка плюс мини-силуэт по категории. */
const fallbackMinis: Record<string, string> = {
  "Фрукты": "apple", "Ягоды": "berries", "Сухофрукты": "berries", "Овощи": "carrot", "Мясо и рыба": "chicken-leg",
  "Молочные": "milk-bottle", "Крупы": "grain-bowl", "Хлеб": "bread-loaf", "Выпечка": "pastry", "Орехи": "nuts",
  "Масла": "oil-bottle", "Соусы": "sauce-jar", "Сладкое": "chocolate", "Спортпит": "protein-jar", "Напитки": "glass",
  "Готовые блюда": "soup-bowl", "Бобовые": "peas-pod", "Завтрак": "grain-bowl", "Фастфуд": "burger",
  "Салаты и роллы": "salad-bowl", "Мировая кухня": "soup-bowl", "Ингредиенты": "grain-bowl", "Супы": "soup-bowl", "Колбасные изделия": "sausage-platter",
};

function fallbackBody(accent: string, secondary: string, category: string) {
  const plate = c(48, 62, 25, L) + ell(48, 62, 16, 9, secondary, ' opacity=".55"');
  const miniKey = fallbackMinis[category];
  const glyph = miniKey ? compositions[miniKey](accent, secondary) : line("M44 30v16M40 30v8M48 30v8", L, 2.5) + c(44, 54, 3, accent);
  return plate + `<g transform="translate(17 6) scale(.64)">${glyph}</g>`;
}

/** Единая рамка: плашка со скруглением rx=20 и мягким градиентом. */
function wrap(pair: string[], body: string, seed: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${pair[0]}"/><stop offset="1" stop-color="${pair[1]}"/></linearGradient></defs>` +
    `<rect width="96" height="96" rx="20" fill="url(#g)"/>` +
    `<circle cx="48" cy="48" r="38" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/>` +
    `<circle cx="${14 + ((seed >>> 5) % 7)}" cy="${74 + ((seed >>> 9) % 7)}" r="${(2 + ((seed >>> 13) % 3) * 0.7).toFixed(1)}" fill="#FDE68A" opacity=".45"/>` +
    body +
    `</svg>`;
  return svg;
}

const cache = new Map<string, string>();

/** Data URI-обёртка (для expo-image на web и там, где SVG поддержан). */
export function getFoodIllustration(id: string, category: string, name: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(getFoodIllustrationXml(id, category, name))}`;
}

/** Миниатюра продукта: детерминированная SVG-иллюстрация по id, категории и названию. */
export function getFoodIllustrationXml(id: string, category: string, name: string): string {
  const key = `${id}\n${category}\n${name ?? ""}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const seed = hash(id);
  // Фон и акценты берутся из независимых хэшей, чтобы пары продуктов не совпадали целиком.
  const toneSeed = hash(`${category}|${name ?? ""}`);
  const pair = palettes[seed % palettes.length];
  const accents = palettes.map((item) => item[0]);
  const accent = accents[(toneSeed >>> 3) % accents.length];
  let secondary = accents[(toneSeed >>> 7) % accents.length];
  if (secondary === accent) secondary = accents[((toneSeed >>> 7) + 1) % accents.length];
  const compositionKey = explicitCompositions[id] ?? selectComposition(id, name ?? "", category);
  const composition = compositionKey ? compositions[compositionKey] : undefined;
  const body = composition ? composition(accent, secondary) : fallbackBody(accent, secondary, category);
  const value = wrap(pair, body, seed);
  cache.set(key, value);
  return value;
}
