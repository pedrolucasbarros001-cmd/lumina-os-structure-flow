import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePortugueseNIF, formatNIF, unformatNIF, validateNIFWithError } from '@/lib/nif-validator';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NIFInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  showValidationMessage?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Input de NIF (Número de Identificação Fiscal) com validação portuguesa
 * - Máscara visual automática (123 456 789)
 * - Validação de dígito verificador
 * - Feedback visual em tempo real
 */
export function NIFInput({
  value,
  onChange,
  label = 'NIF (Número de Identificação Fiscal)',
  placeholder = '123 456 789',
  required = false,
  disabled = false,
  error: externalError,
  showValidationMessage = true,
  onValidationChange,
}: NIFInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isTouched, setIsTouched] = useState(false);

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    if (value) {
      setDisplayValue(formatNIF(value));
    } else {
      setDisplayValue('');
      setIsValid(null);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir apenas números, espaços e hífens
    const cleanValue = inputValue.replace(/[^\d\s\-]/g, '');
    const unformatted = unformatNIF(cleanValue);

    // Limitar a 9 dígitos
    const limitedValue = unformatted.slice(0, 9);

    // Atualizar o campo de exibição
    setDisplayValue(formatNIF(limitedValue));

    // Enviar o valor sem formatação para o parent
    onChange(limitedValue);

    // Validar em tempo real se tem 9 dígitos
    if (limitedValue.length === 9) {
      const valid = validatePortugueseNIF(limitedValue);
      setIsValid(valid);
      
      if (!valid) {
        setValidationError('NIF inválido');
      } else {
        setValidationError('');
      }

      onValidationChange?.(valid);
    } else {
      setIsValid(null);
      setValidationError('');
      onValidationChange?.(false);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    
    if (value.length === 9) {
      const validation = validateNIFWithError(value);
      if (!validation.valid) {
        setValidationError(validation.error || 'NIF inválido');
        setIsValid(false);
        onValidationChange?.(false);
      }
    }
  };

  const errorMessage = externalError || validationError;
  const showError = errorMessage && isTouched;
  const showSuccess = isValid === true && isTouched;

  return (
    <div className="space-y-2">
      {label && (
        <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "transition-colors",
            showError && "border-red-500 focus-visible:ring-red-500",
            showSuccess && "border-emerald-500 focus-visible:ring-emerald-500",
            isValid === false && isTouched && "bg-red-50 dark:bg-red-950/20"
          )}
          maxLength={11} // 9 dígitos + 2 espaços
        />

        {/* Ícone de validação */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {showSuccess && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          {showError && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Mensagem de validação */}
      {showValidationMessage && (
        <>
          {showError && (
            <p className="text-xs text-red-600 dark:text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errorMessage}
            </p>
          )}
          
          {showSuccess && (
            <p className="text-xs text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              NIF válido
            </p>
          )}

          {isTouched && !showError && !showSuccess && displayValue.length > 0 && displayValue.length < 11 && (
            <p className="text-xs text-muted-foreground">
              {9 - unformatNIF(displayValue).length} dígito(s) faltando
            </p>
          )}
        </>
      )}

      {/* Ajuda/Informação */}
      <p className="text-xs text-muted-foreground">
        Formato: XXX XXX XXX (9 dígitos)
      </p>
    </div>
  );
}

export default NIFInput;
