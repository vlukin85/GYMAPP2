PAIRS = [
    ('  const { lang, t } = useLanguage();',
     '  const { lang, t } = useLanguage();\n  // Даты и поиск форматируются по выбранному языку, а не жёстко по ru-RU.\n  const locale = lang === "en" ? "en-US" : "ru-RU";'),
    ('const filtered = useMemo(() => { const locale = lang === "en" ? "en-US" : "ru-RU"; const needle',
     'const filtered = useMemo(() => { const needle'),
]
