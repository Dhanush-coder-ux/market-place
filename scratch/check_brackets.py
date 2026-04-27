with open(r'd:\hello\market-place\src\components\layouts\Sidebar.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = 221 # 1-indexed line 222
end = 419   # 1-indexed line 420

content = "".join(lines[start:end+1])

open_p = content.count('(')
close_p = content.count(')')
open_b = content.count('{')
close_b = content.count('}')

print(f"Parentheses: {open_p} open, {close_p} close")
print(f"Braces: {open_b} open, {close_b} close")

# Detailed check for balance
stack_p = []
stack_b = []

for i, char in enumerate(content):
    if char == '(': stack_p.append(i)
    elif char == ')':
        if stack_p: stack_p.pop()
        else: print(f"Extra closing parenthesis at index {i}")
    elif char == '{': stack_b.append(i)
    elif char == '}':
        if stack_b: stack_b.pop()
        else: print(f"Extra closing brace at index {i}")

if stack_p: print(f"Unclosed parentheses at indices: {stack_p}")
if stack_b: print(f"Unclosed braces at indices: {stack_b}")
