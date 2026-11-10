import sys, textwrap
path = sys.argv[1]
start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
end = int(sys.argv[3]) if len(sys.argv) > 3 else 10**9
with open(path, encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines, 1):
    if i < start or i > end: continue
    line = line.rstrip('\n')
    if len(line) <= 170:
        print(f"{i}\t{line}")
    else:
        chunks = [line[j:j+170] for j in range(0, len(line), 170)]
        for k, c in enumerate(chunks):
            print(f"{i}\t{'' if k==0 else '  +'}{c}")
