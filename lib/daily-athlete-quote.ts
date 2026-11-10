export type AthleteQuote = {
  quote: string;
  /** Английский текст цитаты: показывается при lang === "en". */
  quoteEn: string;
  athlete: string;
  athleteEn: string;
  discipline: string;
  disciplineEn: string;
};

// Русский текст — значение по умолчанию (его читают старые вызовы), английские
// пары выбираются через athleteQuoteText()/athleteQuoteAuthor() по языку.
const quotes: AthleteQuote[] = [
  { quote: "Сила рождается не из побед. Её развивают трудности, которые ты не бросаешь.", quoteEn: "Strength does not come from winning. Your struggles develop your strengths.", athlete: "Арнольд Шварценеггер", athleteEn: "Arnold Schwarzenegger", discipline: "бодибилдинг", disciplineEn: "bodybuilding" },
  { quote: "Нет коротких путей: всё решают повторения, повторения, повторения.", quoteEn: "There are no shortcuts — everything is reps, reps, reps.", athlete: "Арнольд Шварценеггер", athleteEn: "Arnold Schwarzenegger", discipline: "бодибилдинг", disciplineEn: "bodybuilding" },
  { quote: "Я терпел неудачу снова и снова. Поэтому я и преуспел.", quoteEn: "I have failed over and over again in my life. And that is why I succeed.", athlete: "Майкл Джордан", athleteEn: "Michael Jordan", discipline: "баскетбол", disciplineEn: "basketball" },
  { quote: "Я могу принять неудачу. Но не могу принять то, что даже не попытался.", quoteEn: "I can accept failure, but I cannot accept not trying.", athlete: "Майкл Джордан", athleteEn: "Michael Jordan", discipline: "баскетбол", disciplineEn: "basketball" },
  { quote: "Удача ни при чём: я провела бесчисленные часы, работая ради одного момента.", quoteEn: "Luck has nothing to do with it: I have spent countless hours working for one moment.", athlete: "Серена Уильямс", athleteEn: "Serena Williams", discipline: "теннис", disciplineEn: "tennis" },
  { quote: "Мне приходилось бороться всю жизнь — и учиться сохранять улыбку.", quoteEn: "I have had to fight my whole life and learn to keep smiling.", athlete: "Серена Уильямс", athleteEn: "Serena Williams", discipline: "теннис", disciplineEn: "tennis" },
];

/** Текст цитаты под выбранный язык. */
export function athleteQuoteText(quote: AthleteQuote, lang: "ru" | "en"): string {
  return lang === "en" ? (quote.quoteEn || quote.quote) : quote.quote;
}

/** Автор и вид спорта под выбранный язык: «Athlete · discipline». */
export function athleteQuoteAuthor(quote: AthleteQuote, lang: "ru" | "en"): { athlete: string; discipline: string } {
  return lang === "en"
    ? { athlete: quote.athleteEn || quote.athlete, discipline: quote.disciplineEn || quote.discipline }
    : { athlete: quote.athlete, discipline: quote.discipline };
}

export function getDailyAthleteQuote(date = new Date()): AthleteQuote {
  const localDay = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000);
  return quotes[Math.abs(localDay) % quotes.length];
}

export const DAILY_QUOTE_SOURCES = [
  "Goodreads — цитаты Арнольда Шварценеггера: https://www.goodreads.com/author/quotes/67084.Arnold_Schwarzenegger",
  "Goodreads — цитаты Майкла Джордана: https://www.goodreads.com/author/quotes/16823.Michael_Jordan",
  "BrainyQuote — цитаты Серены Уильямс: https://www.brainyquote.com/authors/serena-williams-quotes",
] as const;
