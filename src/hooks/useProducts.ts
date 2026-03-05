import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';

export interface Product {
    id: string;
    unit_id: string;
    name: string;
    price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    image_url: string | null;
    brand: string | null;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type CreateProductInput = {
    name: string;
    price: number;
    stock_quantity?: number;
    low_stock_threshold?: number;
    brand?: string;
    category?: string;
    image_url?: string;
};

export type UpdateProductInput = Partial<CreateProductInput> & {
    id: string;
    is_active?: boolean;
};

export function useProducts() {
    const { data: unit } = useUnit();
    return useQuery({
        queryKey: ['products', unit?.id],
        queryFn: async () => {
            if (!unit?.id) return [];
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('unit_id', unit.id)
                .order('name');
            if (error) throw error;
            return data as Product[];
        },
        enabled: !!unit?.id,
    });
}

export function useCreateProduct() {
    const { data: unit } = useUnit();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateProductInput) => {
            if (!unit?.id) throw new Error('No unit');
            const { data, error } = await supabase
                .from('products')
                .insert({ ...input, unit_id: unit.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    });
}

export function useUpdateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: UpdateProductInput) => {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    });
}

export function useDeleteProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    });
}
