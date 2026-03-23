/**
 * Validação de NIF - Número de Identificação Fiscal (Portugal)
 * 
 * NIF é um identificador de 9 dígitos com validação de check digit.
 * Algoritmo conforme regulamentações portuguesas.
 * 
 * Exemplos válidos para teste: 162397635, 202002013, 239017434
 */

/**
 * Validar NIF português
 * @param nif - String contendo o NIF (pode ter espaços ou hífens)
 * @returns boolean - true se válido, false caso contrário
 */
export function validatePortugueseNIF(nif: string): boolean {
  // Limpar espaços, hífens e outros caracteres
  const nifClean = nif.trim().replace(/[\s\-]/g, '');

  // Deve ter exatamente 9 dígitos
  if (nifClean.length !== 9) {
    return false;
  }

  // Deve conter apenas dígitos
  if (!/^\d{9}$/.test(nifClean)) {
    return false;
  }

  // Não pode começar com 0
  if (nifClean[0] === '0') {
    return false;
  }

  // Calcular o dígito de verificação usando o algoritmo português
  // Multiplicadores: 9,8,7,6,5,4,3,2 para os primeiros 8 dígitos
  let sum = 0;
  const multipliers = [9, 8, 7, 6, 5, 4, 3, 2];

  for (let i = 0; i < 8; i++) {
    const digit = parseInt(nifClean[i], 10);
    sum += digit * multipliers[i];
  }

  // Calcular dígito de verificação
  let checkDigit = sum % 11;
  if (checkDigit === 0) {
    checkDigit = 0;
  } else if (checkDigit === 1) {
    checkDigit = 0; // Caso especial para NIF português
  } else {
    checkDigit = 11 - checkDigit;
  }

  // Comparar com o 9º dígito fornecido
  const providedCheckDigit = parseInt(nifClean[8], 10);
  return providedCheckDigit === checkDigit;
}

/**
 * Formatar NIF com máscara visual
 * @param nif - String com 9 dígitos
 * @returns String formatada (ex: 123 456 789)
 */
export function formatNIF(nif: string): string {
  const clean = nif.replace(/\D/g, '');
  
  if (clean.length !== 9) {
    return clean; // Retorna como está se não tem 9 dígitos
  }

  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}

/**
 * Desformatar NIF (remover formatação)
 * @param nif - String formatada
 * @returns String com apenas os 9 dígitos
 */
export function unformatNIF(nif: string): string {
  return nif.replace(/\D/g, '');
}

/**
 * Gerar exemplos de NIF válidos (apenas para teste/demo)
 * NÃO use em produção para gerar NIFs reais!
 */
export function generateValidNIFForDemo(): string {
  // Geradores comuns de NIF para teste em Portugal
  const validTestNIFs = ['162397635', '202002013', '239017434', '278942854'];
  return validTestNIFs[Math.floor(Math.random() * validTestNIFs.length)];
}

/**
 * Validar e retornar mensagem de erro específica
 */
export function validateNIFWithError(nif: string): { valid: boolean; error?: string } {
  const clean = nif.trim().replace(/[\s\-]/g, '');

  if (!nif || nif.trim().length === 0) {
    return { valid: false, error: 'NIF é obrigatório' };
  }

  if (clean.length !== 9) {
    return { valid: false, error: 'NIF deve ter 9 dígitos' };
  }

  if (!/^\d{9}$/.test(clean)) {
    return { valid: false, error: 'NIF deve conter apenas números' };
  }

  if (clean[0] === '0') {
    return { valid: false, error: 'NIF não pode começar com 0' };
  }

  if (!validatePortugueseNIF(nif)) {
    return { valid: false, error: 'NIF inválido (falha na validação)' };
  }

  return { valid: true };
}

/**
 * Padrões comuns de NIF em Portugal
 * Para referência e testes
 */
export const NIF_PATTERNS = {
  // Profissional liberal (1-3)
  professional: /^[1-3]\d{8}$/,
  
  // Pessoa singular (1-2)
  individual: /^[1-2]\d{8}$/,
  
  // Pessoa coletiva (5-9, 91-98)
  company: /^([5-9]|\d{2})\d{7}$/,
  
  // Organização não-governamental (97-98)
  ngo: /^9[7-8]\d{7}$/,
  
  // Estado/Entidade pública (99)
  government: /^99\d{7}$/,
} as const;

/**
 * Identificar tipo de entidade baseado no NIF
 */
export function getNIFType(
  nif: string
): 'professional' | 'individual' | 'company' | 'ngo' | 'government' | 'unknown' {
  const clean = nif.replace(/\D/g, '');

  if (NIF_PATTERNS.government.test(clean)) return 'government';
  if (NIF_PATTERNS.ngo.test(clean)) return 'ngo';
  if (NIF_PATTERNS.company.test(clean)) return 'company';
  if (NIF_PATTERNS.professional.test(clean)) return 'professional';
  if (NIF_PATTERNS.individual.test(clean)) return 'individual';

  return 'unknown';
}

export default {
  validate: validatePortugueseNIF,
  validateWithError: validateNIFWithError,
  format: formatNIF,
  unformat: unformatNIF,
  getNIFType,
  generateValidNIFForDemo,
};
