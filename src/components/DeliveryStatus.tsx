// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Delivery } from '@/hooks/useDelivery';

interface DeliveryStatusProps {
  delivery: Delivery;
  isLoading?: boolean;
  canStart?: boolean;
  canComplete?: boolean;
  onStart?: (id: string) => void;
  onCheckIn?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export default function DeliveryStatus({
  delivery,
  isLoading = false,
  canStart = true,
  canComplete = true,
  onStart,
  onCheckIn,
  onComplete,
}: DeliveryStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_route':
        return 'bg-blue-100 text-blue-800';
      case 'arrived':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'en_route':
        return 'Em Trajeto';
      case 'arrived':
        return 'Chegou';
      case 'completed':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Entrega para {delivery.customer_name}
          </CardTitle>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(delivery.status)}`}>
            {getStatusLabel(delivery.status)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
            Informações do Cliente
          </h3>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <a href={`tel:${delivery.customer_phone}`} className="font-medium text-blue-600 hover:underline">
                {delivery.customer_phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Endereço</p>
              <p className="font-medium">{delivery.customer_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">ID do Agendamento</p>
              <p className="font-mono text-sm">{delivery.appointment_id.substring(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
            Timeline
          </h3>

          <div className="space-y-2">
            {delivery.started_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">
                  Iniciado em{' '}
                  <span className="font-medium">
                    {new Date(delivery.started_at).toLocaleTimeString('pt-BR')}
                  </span>
                </span>
              </div>
            )}

            {delivery.completed_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">
                  Concluído em{' '}
                  <span className="font-medium">
                    {new Date(delivery.completed_at).toLocaleTimeString('pt-BR')}
                  </span>
                </span>
              </div>
            )}

            {!delivery.started_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-gray-600">
                  Criado em{' '}
                  <span className="font-medium">
                    {new Date(delivery.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {canStart && !delivery.started_at && (
            <Button
              onClick={() => onStart?.(delivery.id)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? 'Carregando...' : 'Iniciar Entrega'}
            </Button>
          )}

          {delivery.status === 'en_route' && (
            <Button
              onClick={() => onCheckIn?.(delivery.id)}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? 'Carregando...' : 'Check-in (Chegou)'}
            </Button>
          )}

          {canComplete && delivery.status === 'arrived' && (
            <Button
              onClick={() => onComplete?.(delivery.id)}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isLoading ? 'Carregando...' : 'IR para App de Checkout'}
            </Button>
          )}
        </div>

        {/* Warning */}
        {!delivery.started_at && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              Clique em "Iniciar Entrega" para ativar GPS e começar a rastrear a localização.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
