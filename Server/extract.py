import re

with open('clean.diff', 'r', encoding='utf-8') as f:
    diff = f.read()

assistant_diff = diff.split('diff --git a/Server/services/assistantService.js b/Server/services/assistantService.js')[1].split('diff --git')[0]

with open('assistant_patch.diff', 'w', encoding='utf-8') as f:
    f.write('--- a/Server/services/assistantService.js\n+++ b/Server/services/assistantService.js\n' + assistant_diff[assistant_diff.find('@@'):])

