#!/usr/bin/env python3
"""
COMPLETE REMAINING TABLES - One Click Executor
Copia SQL das 12 tabelas faltando para clipboard e abre dashboard
"""

import subprocess
from pathlib import Path

def main():
    print()
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║             LUMINA OS - COMPLETAR TABELAS FALTANDO (12/17)                 ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print()
    
    sql_file = Path("supabase/migrations/20260323_COMPLETE_REMAINING_SCHEMA.sql")
    
    if not sql_file.exists():
        print("❌ Arquivo não encontrado: supabase/migrations/20260323_COMPLETE_REMAINING_SCHEMA.sql")
        return
    
    print("📖 Lendo arquivo SQL...")
    with open(sql_file) as f:
        sql_content = f.read()
    
    lines = len(sql_content.split('\n'))
    tables = sql_content.count("CREATE TABLE")
    
    print(f"✓ {lines} linhas de SQL")
    print(f"✓ {tables} tabelas a criar")
    print()
    
    print("📋 Copiando para clipboard...")
    try:
        process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        process.communicate(sql_content.encode('utf-8'))
        print("✓ SQL copiado!")
    except Exception as e:
        print(f"❌ Erro ao copiar: {e}")
        return
    
    print()
    print("🌐 Abrindo Supabase Dashboard...")
    subprocess.run(['open', 'https://supabase.com/dashboard/project/iyjqjeosooqqpuvceyqy/sql/new'])
    
    print()
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                         PRÓXIMAS AÇÕES NO DASHBOARD:                        ║")
    print("╠════════════════════════════════════════════════════════════════════════════╣")
    print("║                                                                            ║")
    print("║ 1️⃣  SQL já está no clipboard!                                              ║")
    print("║ 2️⃣  Clique em 'Create Query' ou limpe o SQL existente                     ║")
    print("║ 3️⃣  Cole com: Cmd+V                                                       ║")
    print("║ 4️⃣  Clique no botão verde ▶️  'Run'                                        ║")
    print("║ 5️⃣  Aguarde mensagem: 'Tabelas faltando criadas com sucesso!'             ║")
    print("║ 6️⃣  Volte aqui e execute: python3 regenerate_types.py                    ║")
    print("║                                                                            ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print()

if __name__ == "__main__":
    main()
