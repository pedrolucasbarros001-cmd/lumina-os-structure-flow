import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useServiceGallery } from '@/hooks/useServiceGallery';

interface ServiceImageUploadProps {
  serviceId: string;
}

export function ServiceImageUpload({ serviceId }: ServiceImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: images = [], uploadImage, deleteImage, reorderImages } = useServiceGallery(serviceId);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadImage.mutateAsync({
          file: files[i],
          display_order: images.length + i,
        });
      }
      toast({ title: 'Sucesso', description: 'Imagens adicionadas!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao fazer upload', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await deleteImage.mutateAsync(imageId);
      toast({ title: 'Removido', description: 'Imagem deletada' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover imagem', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:border-border/50'
        }`}
      >
        <label className="flex flex-col items-center gap-3 cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">Arraste imagens aqui</p>
            <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/30 p-4">
          <h4 className="font-semibold mb-3">Galeria ({images.length})</h4>
          <div className="grid grid-cols-3 gap-3">
            {images.map((image, idx) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted group hover:shadow-lg transition-shadow"
              >
                {image.url && (
                  <img
                    src={image.url}
                    alt={`Serviço ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Delete button on hover */}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="absolute top-2 right-2 bg-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Order badge */}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
