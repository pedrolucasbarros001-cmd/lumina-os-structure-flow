#!/usr/bin/env python3
"""
Verifica estado real do banco de dados Supabase
"""

import os
from pathlib import Path
from datetime import datetime

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

def get_env_vars():
    """Lê variáveis do .env"""
    env_path = Path(".env")
    env_vars = {}
    
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                env_vars[key] = value.strip('"\'')
    
    return env_vars

def test_supabase_connection():
    """Testa conexão com Supabase"""
    print_section("TESTANDO CONEXÃO SUPABASE")
    
    try:
        import requests
        
        env = get_env_vars()
        url = env.get("VITE_SUPABASE_URL")
        key = env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        
        if not url or not key:
            print("❌ Credenciais não encontradas em .env")
            return False
        
        print(f"📍 URL: {url}")
        print(f"🔑 Key: {key[:20]}...")
        print()
        
        # Testa conexão básica
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{url}/rest/v1/", headers=headers, timeout=5)
        
        if response.status_code in [200, 401, 403]:
            print(f"✓ Conexão OK (status: {response.status_code})")
            return True
        else:
            print(f"❌ Status inesperado: {response.status_code}")
            return False
            
    except ImportError:
        print("⚠️  'requests' não está instalado")
        print("   Instale com: pip install requests")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return False

def check_supabase_schema():
    """Verifica schema do Supabase via API"""
    print_section("VERIFICANDO SCHEMA DO BANCO")
    
    try:
        import requests
        
        env = get_env_vars()
        url = env.get("VITE_SUPABASE_URL")
        key = env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        
        # Tenta listar tabelas via information_schema
        sql_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
        """
        
        # Nota: Supabase REST API não expõe information_schema diretamente
        # Tentaremos via um endpoint customizado
        
        print("⚠️  Verificação completa via API REST requer RPC customizada")
        print()
        print("Alternativa: Use o Supabase Dashboard para verificar as tabelas")
        print(f"🔗 {url}/project/default/sql")
        print()
        
        # Tenta acessar uma tabela comum para ver se existe
        response = requests.get(
            f"{url}/rest/v1/profiles?select=id&limit=1",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print("✓ Tabela 'profiles' existe no banco")
            return True
        elif response.status_code == 404:
            print("❌ Tabela 'profiles' NÃO existe no banco")
            print("   As migrações NÃO foram executadas!")
            return False
        else:
            print(f"⚠️  Status: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def check_types_file():
    """Verifica arquivo de tipos gerado"""
    print_section("VERIFICANDO ARQUIVO DE TIPOS (types.ts)")
    
    types_path = Path("src/integrations/supabase/types.ts")
    
    if not types_path.exists():
        print("❌ types.ts não existe")
        return False
    
    with open(types_path) as f:
        content = f.read()
    
    # Procura por definições de tabelas
    tables = [
        "profiles", "units", "services", "team_members",
        "clients", "appointments", "deliveries"
    ]
    
    found_tables = []
    for table in tables:
        # Procura por export interface ou type para cada tabela
        if f"'{table}'" in content or f'"{table}"' in content or f"table: '{table}" in content:
            found_tables.append(table)
    
    print(f"Tipo file tamanho: {len(content)} bytes")
    print(f"Tabelas encontradas no schema: {len(found_tables)}/7")
    
    if found_tables:
        print()
        print("Tabelas detectadas:")
        for table in found_tables:
            print(f"  ✓ {table}")
    else:
        print()
        print("❌ Nenhuma tabela encontrada!")
        print("   O arquivo types.ts está vazio!")
        print()
        print("SOLUÇÃO: Execute a migração SQL no Supabase Dashboard:")
        print("  1. Abra: https://supabase.com/dashboard/project/iyjqjeosooqqpuvceyqy/sql/new")
        print("  2. Cole o conteúdo de: supabase/migrations/20260321_000_CREATE_COMPLETE_SCHEMA.sql")
        print("  3. Clique 'Run' e aguarde a mensagem de sucesso")
        return False
    
    return len(found_tables) > 0

def main():
    print_header("SUPABASE STATE INSPECTOR")
    print(f"Data: {datetime.now().strftime('%d de %B de %Y - %H:%M:%S')}")
    print()
    
    try:
        print("1️⃣  Testando conexão...")
        conn_ok = test_supabase_connection()
        print()
        
        if conn_ok:
            print("2️⃣  Verificando schema...")
            schema_ok = check_supabase_schema()
            print()
        
        print("3️⃣  Verificando types.ts...")
        types_ok = check_types_file()
        print()
        
        print_section("RESUMO")
        
        if conn_ok and schema_ok and types_ok:
            print("✅ TUDO OK! Banco de dados está pronto for usar!")
            print()
            print("Próximo passo: Rodar aplicação localmente")
            print("   npm run dev (ou bun run dev)")
        elif conn_ok and not schema_ok:
            print("❌ PROBLEMA: As tabelas NÃO foram criadas no banco!")
            print()
            print("AÇÃO NECESSÁRIA:")
            print("1. Abra o Supabase Dashboard SQL Editor")
            print("2. Cole a migração: supabase/migrations/20260321_000_CREATE_COMPLETE_SCHEMA.sql")
            print("3. Execute (Run) e aguarde sucesso")
        else:
            print("⚠️  Não foi possível verificar o estado completo")
        
        print()
        print()
        
    except Exception as e:
        print(f"❌ Erro durante diagnóstico: {e}")

if __name__ == "__main__":
    main()
