import json
import sys

try:
    with open('unused_report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    # Try UTF-16 if UTF-8 fails
    with open('unused_report.json', 'r', encoding='utf-16') as f:
        data = json.load(f)

results = []
for entry in data:
    filepath = entry['filePath']
    for msg in entry['messages']:
        if msg.get('ruleId') == '@typescript-eslint/no-unused-vars':
            results.append({
                'file': filepath,
                'line': msg['line'],
                'column': msg['column'],
                'message': msg['message']
            })

for res in results:
    print(f"{res['file']}:{res['line']}:{res['column']}: {res['message']}")
