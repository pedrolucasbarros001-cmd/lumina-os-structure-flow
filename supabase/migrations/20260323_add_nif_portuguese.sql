-- ============================================================================
-- LUMINA OS - ADICIONAR NIF PORTUGUÊS
-- Data: 23 de Março de 2026
-- Descrição: Adiciona suporte para NIF (Número de Identificação Fiscal)
-- Portugal - Conformidade RGPD
-- ============================================================================

BEGIN;

-- ============================================================================
-- ADICIONAR COLUNA NIF (Número de Identificação Fiscal)
-- ============================================================================

-- Adicionar NIF a profiles (Usuários)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif VARCHAR(9) UNIQUE;

-- Adicionar NIF a clients (Clientes)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS nif VARCHAR(9) UNIQUE;

-- Adicionar NIF a team_members (Profissionais)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS nif VARCHAR(9) UNIQUE;

-- ============================================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_nif ON public.profiles(nif);
CREATE INDEX IF NOT EXISTS idx_clients_nif ON public.clients(nif);
CREATE INDEX IF NOT EXISTS idx_team_members_nif ON public.team_members(nif);

-- ============================================================================
-- CRIAR FUNÇÃO DE VALIDAÇÃO DE NIF PORTUGUÊS
-- ============================================================================

-- Função para validar NIF português (9 dígitos com check digit)
CREATE OR REPLACE FUNCTION public.validate_portuguese_nif(nif_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  nif_clean TEXT;
  multiplier INT;
  sum_value INT := 0;
  check_digit INT;
  calculated_check_digit INT;
  i INT;
  digit INT;
BEGIN
  -- Limpar espaços e hífens
  nif_clean := TRIM(REGEXP_REPLACE(nif_input, '[- ]', '', 'g'));
  
  -- Validar comprimento (9 dígitos)
  IF LENGTH(nif_clean) != 9 THEN
    RETURN FALSE;
  END IF;
  
  -- Validar que todos são dígitos
  IF NOT nif_clean ~ '^\d{9}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Validar que não começa com 0
  IF SUBSTRING(nif_clean, 1, 1) = '0' THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular dígito de verificação (algoritmo NIF português)
  -- Multiplicadores: 9,8,7,6,5,4,3,2 para primeiros 8 dígitos
  FOR i IN 1..8 LOOP
    digit := (SUBSTRING(nif_clean, i, 1))::INT;
    multiplier := 10 - i;
    sum_value := sum_value + (digit * multiplier);
  END LOOP;
  
  -- Calcular check digit
  check_digit := sum_value % 11;
  IF check_digit = 0 THEN
    calculated_check_digit := 0;
  ELSIF check_digit = 1 THEN
    calculated_check_digit := 0; -- Especial para NIF
  ELSE
    calculated_check_digit := 11 - check_digit;
  END IF;
  
  -- Comparar com o 9º dígito fornecido
  RETURN (SUBSTRING(nif_clean, 9, 1))::INT = calculated_check_digit;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Criar constraint para validar NIF automaticamente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_nif_valid;
ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_nif_valid 
  CHECK (nif IS NULL OR validate_portuguese_nif(nif));

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_clients_nif_valid;
ALTER TABLE public.clients ADD CONSTRAINT check_clients_nif_valid 
  CHECK (nif IS NULL OR validate_portuguese_nif(nif));

ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS check_team_members_nif_valid;
ALTER TABLE public.team_members ADD CONSTRAINT check_team_members_nif_valid 
  CHECK (nif IS NULL OR validate_portuguese_nif(nif));

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN public.profiles.nif IS 'Número de Identificação Fiscal (NIF) português - 9 dígitos com validação';
COMMENT ON COLUMN public.clients.nif IS 'Número de Identificação Fiscal (NIF) do cliente - 9 dígitos';
COMMENT ON COLUMN public.team_members.nif IS 'Número de Identificação Fiscal (NIF) do profissional - 9 dígitos';

COMMIT;

-- Mensagem de sucesso
SELECT 'LUMINA OS - NIF Português adicionado com sucesso!' as status;
