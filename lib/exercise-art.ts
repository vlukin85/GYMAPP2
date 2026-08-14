const palette = ["#7C3AED", "#DB2777", "#0EA5E9", "#F97316", "#14B8A6", "#E11D72", "#4F46E5"];

function hash(value: string) {
  return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

/** A self-contained local SVG illustration. Each exercise has its own color, pose and equipment composition. */
export function getExerciseIllustration(id: string, group: string, equipment: string) {
  const seed = hash(id);
  const accent = palette[seed % palette.length];
  const secondary = palette[(seed >>> 3) % palette.length];
  const lean = (seed % 17) - 8;
  const arm = 92 + ((seed >>> 4) % 32);
  const leg = 172 + ((seed >>> 9) % 23);
  const equipmentMark = equipment.includes("Штанга") ? `<path d="M38 88h164M50 74v28M190 74v28" stroke="#F8FAFC" stroke-width="7" stroke-linecap="round"/><rect x="34" y="70" width="12" height="36" rx="4" fill="${secondary}"/><rect x="194" y="70" width="12" height="36" rx="4" fill="${secondary}"/>` : equipment.includes("Гантел") ? `<path d="M44 96h35M171 96h35" stroke="#F8FAFC" stroke-width="7" stroke-linecap="round"/><rect x="35" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="74" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="162" y="82" width="14" height="28" rx="4" fill="${secondary}"/><rect x="201" y="82" width="14" height="28" rx="4" fill="${secondary}"/>` : equipment.includes("Тренажёр") ? `<rect x="34" y="76" width="48" height="96" rx="10" fill="${secondary}" opacity=".9"/><rect x="45" y="90" width="26" height="18" rx="6" fill="#F8FAFC"/><path d="M178 54v130M154 184h48" stroke="#F8FAFC" stroke-width="8" stroke-linecap="round"/>` : `<circle cx="54" cy="104" r="22" fill="${secondary}" opacity=".9"/><path d="M44 104h20M54 94v20" stroke="#F8FAFC" stroke-width="5" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="#10101D"/></linearGradient></defs><rect width="240" height="240" rx="28" fill="url(#g)"/><circle cx="120" cy="120" r="92" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>${equipmentMark}<g transform="rotate(${lean} 120 132)" stroke="#F8FAFC" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="120" cy="66" r="15" fill="#F8FAFC" stroke="none"/><path d="M120 84L120 132M120 99L${arm} 122M120 99L${240 - arm} 122M120 132L89 ${leg}M120 132L151 ${leg}"/><path d="M104 111L136 111" stroke="${secondary}" stroke-width="6"/></g><path d="M30 211h180" stroke="#fff" stroke-opacity=".2" stroke-width="3" stroke-linecap="round"/><circle cx="206" cy="34" r="8" fill="${secondary}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
