"""Применяет список замен (old, new[, count]) к файлу с проверкой числа вхождений.

Использование: python3 .tmp/apply.py <файл> <файл-замен.py>
Файл-замен — python-модуль с переменной PAIRS = [(old, new[, count]), ...].
"""
import importlib.util
import sys

target = sys.argv[1]
spec = importlib.util.spec_from_file_location("pairs", sys.argv[2])
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

src = open(target, encoding="utf-8").read()
errors = []
applied = 0
for item in mod.PAIRS:
    old, new = item[0], item[1]
    expected = item[2] if len(item) > 2 else 1
    found = src.count(old)
    if found != expected:
        errors.append((repr(old[:100]), found, expected))
        continue
    src = src.replace(old, new)
    applied += 1

if errors:
    print("FAILED — замены не применены:")
    for old, found, expected in errors:
        print(f"  вхождений {found}, ожидалось {expected}: {old}")
    sys.exit(1)

open(target, "w", encoding="utf-8").write(src)
print(f"OK: {applied} замен -> {target}")
