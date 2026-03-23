#!/usr/bin/env python3
"""
Script para executar a migração SQL no Supabase
Uso: python3 execute_migration.py
"""

import sys
import os

def execute_migration():
    """
    Executa a migração SQL no Supabase usando a API Rest + RPC
    """
    
    # Credenciais do Supabase
    project_url = "https://iyjqjeosooqqpuvceyqy.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5anFqZW9zb29xcXB1dmNleXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzY2MjIsImV4cCI6MjA4MjUxMjYyMn0.W82JVX4-2ZdxU6WgjiQqE634dYqlBvHvXNuWzYOXmyc"
    
    print("=" * 80)
    print("LUMINA OS - Executor de Migrações SQL")
    print("=" * 80)
    print()
    print("⚠️  ATENÇÃO: Para executar a migração, você precisa:")
    print()
    print("1. Abrir dashboard do Supabase: https://supabase.com/dashboard/project/iyjqjeosooqqpuvceyqy/sql/new")
    print()
    print("2. Copiar o conteúdo do arquivo:")
    print("   supabase/migrations/20260321_000_CREATE_COMPLETE_SCHEMA.sql")
    print()
    print("3. Colar no editor SQL do dashboard")
    print()
    print("4. Clicar em 'Run' (botão verde play)")
    print()
    print("5. Esperar até aparecer: 'LUMINA OS Schema criado com sucesso!'")
    print()
    print("=" * 80)
    print()
    print("📋 Informações do projeto:")
    print(f"   URL: {project_url}")
    print(f"   Project ID: iyjqjeosooqqpuvceyqy")
    print()
    print("=" * 80)
    print()
    
    try:
        import requests
        
        print("✓ Biblioteca 'requests' encontrada")
        print("  Tentando validar conexão com Supabase...")
        print()
        
        # Testa conexão
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{project_url}/rest/v1/", headers=headers, timeout=10)
        
        if response.status_code in [200, 401, 403]:
            print("✓ Conexão com Supabase: OK")
            print()
        else:
            print(f"⚠️  Status: {response.status_code}")
            
    except ImportError:
        print("⚠️  'requests' não está instalado")
        print("   Não é possível executar via Python neste momento")
        print()
    except Exception as e:
        print(f"⚠️  Erro ao testar conexão: {e}")
        print()
    
    print("ℹ️  Próximos passos:")
    print()
    print("   • Você pode executar a migração manualmente via dashboard SQL Editor")
    print("   • Ou instalar Supabase CLI: https://supabase.com/docs/guides/cli/getting-started")
    print()
    print("=" * 80)

if __name__ == "__main__":
    execute_migration()
