#!/usr/bin/env python3
"""
LUMINA OS - Execute Migration
Copia SQL e abre Supabase Dashboard para você colar tudo
"""

import os
import sys
import webbrowser
import time
import subprocess

# Encontra o arquivo SQL
sql_file = "/Users/pedrolucas/LUMINA OS/VSCODE Lumina OS/lumina-os-structure-flow/supabase/migrations/20260323_LUMINA_COMPLETE_FINAL.sql"

print("=" * 80)
print("🔧 LUMINA OS - EXECUTE MIGRATION")
print("=" * 80)
print()

# Lê o SQL
if not os.path.exists(sql_file):
    print(f"❌ Arquivo não encontrado: {sql_file}")
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"✅ SQL carregado: {len(sql_content)} caracteres")
print()

# Copia para clipboard
try:
    # Usa pbcopy (macOS)
    process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
    process.communicate(sql_content.encode('utf-8'))
    print("✅ SQL copiado para clipboard!")
except Exception as e:
    print(f"⚠️  Erro ao copiar: {e}")
    print("Tente copiar manualmente do arquivo aberto no VS Code")

print()
print("=" * 80)
print("USANDO O DASHBOARD:")
print("=" * 80)
print()
print("1. Abrindo Supabase Dashboard...")
print()

# Abre o Supabase Dashboard SQL Editor
dashboard_url = "https://supabase.com/dashboard/project/iyjqjeosooqqpuvceyqy/sql/new"
webbrowser.open(dashboard_url)

print()
time.sleep(2)
print("2. Cole o SQL (Cmd+V):")
print("   - Clique em 'New Query' ou abra o SQL Editor")
print("   - Cola o SQL (o clipboard já tem!)")
print("   - Clique em 'Run' (Ctrl+Enter)")
print()
print("3. Espera que termine (✅ Success)")
print()
print("4. Depois:")
print("   npm run dev")
print()
print("=" * 80)
