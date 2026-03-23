#!/usr/bin/env python3
import subprocess
from pathlib import Path

sql_file = Path("supabase/migrations/20260323_COMPLETE_REMAINING_SCHEMA.sql").read_text()
process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
process.communicate(sql_file.encode())
print("✓ SQL corrigido copiado para clipboard!")
print("✓ Agora cole no Supabase Dashboard com Cmd+V")
