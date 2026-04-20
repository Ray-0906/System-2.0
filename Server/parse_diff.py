with open('patch.diff', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

clean_lines = []
in_diff = False
for line in lines:
    if line.startswith('diff --git'):
        in_diff = True
    if line.startswith('PS C:') or line.startswith('Note:') or line.startswith('Command exited'):
        continue
    if in_diff:
        clean_lines.append(line)

with open('clean.diff', 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)
