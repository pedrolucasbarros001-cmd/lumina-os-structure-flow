#!/usr/bin/env python3
"""
DIAGNOSTIC SCRIPT - Lumina OS
Verifica o estado do banco de dados e da aplicação
"""

import os
import sys
import json
from pathlib import Path

def print_header(text):
    print()
    print("╔" + "=" * 78 + "╗")
    print("║ " + text.center(76) + " ║")
    print("╚" + "=" * 78 + "╝")
    print()

def print_section(text):
    print()
    print(f"▶ {text}")
    print("─" * 80)

def check_env_file():
    """Verifica .env e credenciais"""
    print_section("1. VERIFICAR VARIÁVEIS DE AMBIENTE")
    
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ Arquivo .env não encontrado!")
        return False
    
    env_vars = {}
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                env_vars[key] = value[:20] + "..." if len(value) > 20 else value
    
    print(f"✓ Arquivo .env encontrado ({len(env_vars)} variáveis)")
    for k, v in env_vars.items():
        print(f"   {k}: {v}")
    
    required_vars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PROJECT_ID", "VITE_SUPABASE_PUBLISHABLE_KEY"]
    missing = [v for v in required_vars if v not in env_vars]
    
    if missing:
        print(f"❌ Variáveis faltando: {missing}")
        return False
    
    print(f"✓ Variáveis obrigatórias presentes")
    return True

def check_project_structure():
    """Verifica estrutura do projeto"""
    print_section("2. VERIFICAR ESTRUTURA DO PROJETO")
    
    required_dirs = ["src", "supabase", "public"]
    required_files = ["package.json", "vite.config.ts", "tsconfig.json"]
    
    for d in required_dirs:
        if Path(d).exists():
            print(f"✓ {d}/ encontrado")
        else:
            print(f"❌ {d}/ NÃO encontrado")
    
    for f in required_files:
        if Path(f).exists():
            print(f"✓ {f} encontrado")
        else:
            print(f"❌ {f} NÃO encontrado")

def check_dependencies():
    """Verifica se node_modules existe"""
    print_section("3. VERIFICAR DEPENDÊNCIAS")
    
    node_modules = Path("node_modules")
    lock_file = Path("bun.lockb")
    
    if node_modules.exists():
        num_deps = len(list(node_modules.glob("*")))
        print(f"✓ node_modules/ existe ({num_deps} pastas)")
        return True
    
    if lock_file.exists():
        print(f"⚠️  bun.lockb existe mas node_modules não está instalado")
        print("   Execute: bun install (ou npm install)")
        return False
    
    print("❌ Dependências não instaladas")
    print("   Execute: npm install (ou bun install)")
    return False

def check_supabase_types():
    """Verifica geração de tipos TypeScript"""
    print_section("4. VERIFICAR TIPOS TYPESCRIPT (Supabase)")
    
    types_path = Path("src/integrations/supabase/types.ts")
    
    if types_path.exists():
        size = types_path.stat().st_size
        with open(types_path) as f:
            lines = len(f.readlines())
        print(f"✓ types.ts existe ({lines} linhas, {size} bytes)")
        
        # Contar tabelas
        with open(types_path) as f:
            content = f.read()
            table_count = content.count("Database:")
        
        if table_count > 0:
            print(f"  → Schema carregado com tables")
            return True
        else:
            print(f"  ⚠️  Schema pode estar vazio")
            return False
    
    print("❌ types.ts não existe")
    print("   Execute: supabase gen types typescript --local > src/integrations/supabase/types.ts")
    return False

def check_migrations():
    """Verifica arquivo de migração"""
    print_section("5. VERIFICAR MIGRAÇÕES SQL")
    
    migration_file = Path("supabase/migrations/20260321_000_CREATE_COMPLETE_SCHEMA.sql")
    
    if migration_file.exists():
        size = migration_file.stat().st_size
        with open(migration_file) as f:
            lines = len(f.readlines())
            f.seek(0)
            content = f.read()
            
        table_count = content.count("CREATE TABLE")
        enum_count = content.count("CREATE TYPE")
        
        print(f"✓ Migration SQL existe ({lines} linhas, {size} bytes)")
        print(f"  → CREATE TABLE statements: {table_count}")
        print(f"  → CREATE TYPE statements: {enum_count}")
        print(f"  → Status: {'Idempotente' if 'IF NOT EXISTS' in content else 'NÃO idempotente'}")
        return True
    
    print("❌ Migration SQL não existe")
    return False

def main():
    print_header("LUMINA OS - DIAGNOSTIC REPORT")
    print(f"Data: 23 de Março de 2026")
    print()
    
    results = {
        "env": check_env_file(),
        "structure": check_project_structure(),
        "dependencies": check_dependencies(),
        "types": check_supabase_types(),
        "migrations": check_migrations(),
    }
    
    print_section("RESUMO DO DIAGNÓSTICO")
    
    checks = [
        ("✓ Variáveis de Ambiente", results["env"]),
        ("✓ Estrutura do Projeto", results["structure"]),
        ("✓ Dependências Instaladas", results["dependencies"]),
        ("✓ Tipos TypeScript (Supabase)", results["types"]),
        ("✓ Migrações SQL", results["migrations"]),
    ]
    
    passed = sum(1 for _, r in checks if r)
    total = len(checks)
    
    for check, result in checks:
        status = "✓" if result else "❌"
        print(f"{status} {check}")
    
    print()
    print(f"RESULTADO: {passed}/{total} verificações passaram")
    
    print_section("PRÓXIMOS PASSOS")
    
    if not results["dependencies"]:
        print("1. Instale dependências:")
        print("   npm install (ou 'bun install')")
        print()
    
    if results["dependencies"] and not results["types"]:
        print("2. Gere tipos TypeScript:")
        print("   npx supabase gen types typescript --local > src/integrations/supabase/types.ts")
        print()
    
    if all(results.values()):
        print("✓ Projeto pronto para rodar!")
        print()
        print("Para iniciar o servidor de desenvolvimento:")
        print("   npm run dev (ou 'bun run dev')")
        print()
        print("Em seguida acesse: http://localhost:5173")
    
    print()

if __name__ == "__main__":
    main()
