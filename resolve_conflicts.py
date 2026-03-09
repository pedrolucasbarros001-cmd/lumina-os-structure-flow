import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. App.tsx
app_content = read_file('src/App.tsx')
app_content = re.sub(
r'<<<<<<< HEAD\nimport PlanSelection from "./pages/PlanSelection";\n=======\nimport StaffInvite from "./pages/StaffInvite";\nimport Vendas from "./pages/Vendas";\n>>>>>>> [a-f0-9]+\n',
'import PlanSelection from "./pages/PlanSelection";\nimport StaffInvite from "./pages/StaffInvite";\nimport Vendas from "./pages/Vendas";\n',
app_content, flags=re.MULTILINE)
write_file('src/App.tsx', app_content)

# 2. AgendaTutorialOverlay.tsx
overlay_content = read_file('src/components/AgendaTutorialOverlay.tsx')
overlay_content = re.sub(
r'<<<<<<< HEAD\n    const \[show, setShow\] = useState\(\(\) => \{\n        if \(typeof window !== \'undefined\'\) \{\n            return !localStorage.getItem\(SEEN_KEY\);\n        \}\n        return false;\n    \}\);\n\n    const dismiss = \(\) => \{\n        localStorage.setItem\(SEEN_KEY, \'true\'\);\n        setShow\(false\);\n    \};\n=======\n  const \[show, setShow\] = useState\(false\);\n\n  useEffect\(\(\) => \{\n    const seen = localStorage.getItem\(SEEN_KEY\);\n    if \(!seen\) setShow\(true\);\n  \}, \[\]\);\n\n  const dismiss = \(\) => setShow\(false\);\n>>>>>>> [a-f0-9]+\n',
'''  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem(SEEN_KEY);
    }
    return false;
  });

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, 'true');
    setShow(false);
  };
''',
overlay_content, flags=re.MULTILINE)
write_file('src/components/AgendaTutorialOverlay.tsx', overlay_content)

# 3. Index.tsx
index_content = read_file('src/pages/Index.tsx')
# The user wants their local index with the cool design. Let's just take HEAD.
index_content = re.sub(
r'<<<<<<< HEAD\n(.*?)=======\n.*?>>>>>>> [a-f0-9]+\n',
r'\1',
index_content, flags=re.DOTALL)
write_file('src/pages/Index.tsx', index_content)


