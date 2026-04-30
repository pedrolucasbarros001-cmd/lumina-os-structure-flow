// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useServiceGallery(serviceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query: Get all images for this service
  const query = useQuery({
    queryKey: ['serviceGallery', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unit_gallery')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation: Upload image
  const uploadImage = useMutation({
    mutationFn: async ({ file, display_order }: { file: File; display_order: number }) => {
      // 1. Upload to Supabase Storage
      const fileName = `${serviceId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(uploadData.path);

      // 3. Save to database
      const { data, error } = await supabase.from('unit_gallery').insert([
        {
          service_id: serviceId,
          url: urlData.publicUrl,
          display_order,
        },
      ]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceGallery', serviceId] });
    },
  });

  // Mutation: Delete image
  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from('unit_gallery').delete().eq('id', imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceGallery', serviceId] });
    },
  });

  // Mutation: Reorder images
  const reorderImages = useMutation({
    mutationFn: async (images: Array<{ id: string; display_order: number }>) => {
      for (const img of images) {
        const { error } = await supabase
          .from('unit_gallery')
          .update({ display_order: img.display_order })
          .eq('id', img.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceGallery', serviceId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    uploadImage,
    deleteImage,
    reorderImages,
  };
}
