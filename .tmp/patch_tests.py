import re, sys

DOMAIN = {
    "app/(tabs)/body.tsx": "body",
    "components/body-visuals.tsx": "body",
    "app/(tabs)/calendar.tsx": "calendar",
    "app/(tabs)/stats.tsx": "stats",
    "app/(tabs)/index.tsx": "tabs",
    "app/(tabs)/nutrition.tsx": "nutrition",
    "app/(tabs)/programs.tsx": "programs",
    "app/(tabs)/exercises.tsx": "catalog",
}

files = sys.argv[1:]
for path in files:
    src = open(path, encoding="utf-8").read()
    original = src
    for screen, domain in DOMAIN.items():
        escaped = re.escape(screen)
        # readFileSync(resolve(process.cwd(), "<screen>"), "utf8")
        pattern = re.compile(
            r'readFileSync\(\s*resolve\(process\.cwd\(\),\s*"' + escaped + r'"\),\s*"utf8",?\s*\)'
        )
        if not pattern.search(src):
            continue
        def repl(match):
            text = match.group(0)
            if f'domains/{domain}.ts' in text:
                return text
            return text + f' + readFileSync(resolve(process.cwd(), "lib/i18n/domains/{domain}.ts"), "utf8")'
        src = pattern.sub(repl, src)
    if src != original:
        open(path, "w", encoding="utf-8").write(src)
        print("patched", path)
    else:
        print("no change", path)
