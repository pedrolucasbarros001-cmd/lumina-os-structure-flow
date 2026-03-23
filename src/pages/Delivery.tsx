// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DeliveryGPSModal } from '@/components/DeliveryGPSModal';
import {
  useDelivery,
  useStartDelivery,
} from '@/hooks/useDelivery';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Delivery() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: delivery, isLoading, error } = useDelivery(deliveryId || '');
  const startDeliveryMutation = useStartDelivery();
  const [showGPSModal, setShowGPSModal] = useState(false);

  // Abre o modal de GPS automaticamente quando o delivery carrega
  useEffect(() => {
    if (delivery && delivery.status === 'en_route') {
      setShowGPSModal(true);
    }
  }, [delivery]);

  const handleCloseModal = () => {
    setShowGPSModal(false);
    // Redireciona para a página anterior após fechar o modal
    setTimeout(() => {
      navigate(-1);
    }, 500);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-900 mb-2">Entrega não encontrada</h1>
          <p className="text-red-700 text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando entrega...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de GPS dedicado */}
      <DeliveryGPSModal 
        delivery={delivery} 
        isOpen={showGPSModal}
        onClose={handleCloseModal}
      />

      {/* Página de fallback (se modal fechar) */}
      {!showGPSModal && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      )}
    </>
  );
}
