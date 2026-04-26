with open(r'd:\hello\market-place\src\components\layouts\Sidebar.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = 221 
end = 419   

stack_p = []
stack_b = []

for i in range(start, end + 1):
    line = lines[i]
    for char in line:
        if char == '(':
            stack_p.append((i + 1, char))
        elif char == ')':
            if stack_p:
                stack_p.pop()
            else:
                print(f"Extra closing parenthesis at line {i + 1}")
        elif char == '{':
            stack_b.append((i + 1, char))
        elif char == '}':
            if stack_b:
                stack_b.pop()
            else:
                print(f"Extra closing brace at line {i + 1}")

if stack_p:
    for l, c in stack_p:
        print(f"Unclosed parenthesis started at line {l}: {lines[l-1].strip()}")
if stack_b:
    for l, c in stack_b:
        print(f"Unclosed brace started at line {l}: {lines[l-1].strip()}")
