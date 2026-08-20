export type AthleteQuote = {
  quote: string;
  athlete: string;
  discipline: string;
};

const quotes: AthleteQuote[] = [
  { quote: "Сила рождается не из побед. Её развивают трудности, которые ты не бросаешь.", athlete: "Арнольд Шварценеггер", discipline: "бодибилдинг" },
  { quote: "Нет коротких путей: всё решают повторения, повторения, повторения.", athlete: "Арнольд Шварценеггер", discipline: "бодибилдинг" },
  { quote: "Я терпел неудачу снова и снова. Поэтому я и преуспел.", athlete: "Майкл Джордан", discipline: "баскетбол" },
  { quote: "Я могу принять неудачу. Но не могу принять то, что даже не попытался.", athlete: "Майкл Джордан", discipline: "баскетбол" },
  { quote: "Удача ни при чём: я провела бесчисленные часы, работая ради одного момента.", athlete: "Серена Уильямс", discipline: "теннис" },
  { quote: "Мне приходилось бороться всю жизнь — и учиться сохранять улыбку.", athlete: "Серена Уильямс", discipline: "теннис" },
];

export function getDailyAthleteQuote(date = new Date()): AthleteQuote {
  const localDay = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000);
  return quotes[Math.abs(localDay) % quotes.length];
}

export const DAILY_QUOTE_SOURCES = [
  "Goodreads — цитаты Арнольда Шварценеггера: https://www.goodreads.com/author/quotes/67084.Arnold_Schwarzenegger",
  "Goodreads — цитаты Майкла Джордана: https://www.goodreads.com/author/quotes/16823.Michael_Jordan",
  "BrainyQuote — цитаты Серены Уильямс: https://www.brainyquote.com/authors/serena-williams-quotes",
] as const;
