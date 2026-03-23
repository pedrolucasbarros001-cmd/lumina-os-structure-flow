#!/usr/bin/env python3
"""
Script ONE-CLICK para executar a migração Lumina OS
Copia o SQL para clipboard e abre o Supabase Dashboard
"""

import os
import sys
import subprocess
from pathlib import Path

def read_migration_file():
    """Lê o arquivo da migração SQL"""
    migration_path = Path(__file__).parent / "supabase" / "migrations" / "20260321_000_CREATE_COMPLETE_SCHEMA.sql"
    try:
        with open(migration_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {migration_path}")
        sys.exit(1)

def copy_to_clipboard(text):
    """Copia texto para clipboard macOS"""
    try:
        process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        process.communicate(text.encode('utf-8'))
        return True
    except Exception as e:
        print(f"⚠️  Não foi possível copiar para clipboard: {e}")
        return False

def open_supabase_dashboard():
    """Abre o Supabase Dashboard no navegador"""
    url = "https://supabase.com/dashboard/project/iyjqjeosooqqpuvceyqy/sql/new"
    try:
        subprocess.run(['open', url])
        return True
    except Exception as e:
        print(f"⚠️  Não foi possível abrir o navegador: {e}")
        print(f"   Abra manualmente: {url}")
        return False

def main():
    print()
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         LUMINA OS - ONE-CLICK MIGRATION EXECUTOR               ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # Lê o arquivo SQL
    print("📖 Lendo arquivo de migração...")
    sql_content = read_migration_file()
    sql_lines = len(sql_content.split('\n'))
    print(f"✓ {sql_lines} linhas de SQL carregadas")
    print()
    
    # Copia para clipboard
    print("📋 Copiando SQL para clipboard...")
    if copy_to_clipboard(sql_content):
        print("✓ SQL copiado com sucesso!")
    else:
        print("⚠️  Não foi possível copiar automáticamente")
    print()
    
    # Abre dashboard
    print("🌐 Abrindo Supabase Dashboard...")
    if open_supabase_dashboard():
        print("✓ Dashboard aberto no navegador")
    print()
    
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║ PRÓXIMAS AÇÕES NO DASHBOARD SUPABASE:                         ║")
    print("║                                                                ║")
    print("║ 1️⃣  Você será levado à página SQL Editor                      ║")
    print("║ 2️⃣  O SQL já está no seu clipboard (Cmd+V para colar)        ║")
    print("║ 3️⃣  Cle em 'Create Query' ou limpe o editor                  ║")
    print("║ 4️⃣  Cole o SQL com Cmd+V                                     ║")
    print("║ 5️⃣  Clique no botão verde ▶️  'Run'                           ║")
    print("║ 6️⃣  Aguarde a mensagem: 'LUMINA OS Schema criado!'            ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    print("✨ Tudo pronto! A migração será executada em segundos...")
    print()

if __name__ == "__main__":
    main()
