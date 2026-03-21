// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUnitPublicProfile } from '@/hooks/useUnitPublicProfile';
import { useUserContext } from '@/hooks/useUserContext';
import { Instagram, Save } from 'lucide-react';

export function PublicProfileSection() {
  const { unit } = useUserContext();
  const { data: profile, updateProfile } = useUnitPublicProfile(unit?.id);
  const { toast } = useToast();

  const [form, setForm] = useState({
    about: profile?.about || '',
    instagram_url: profile?.instagram_url || '',
    cancellation_policy: profile?.cancellation_policy || '',
    min_booking_notice_hours: profile?.min_booking_notice_hours || 0,
    max_advance_booking_days: profile?.max_advance_booking_days || 60,
    buffer_minutes: profile?.buffer_minutes || 0,
    allow_any_staff: profile?.allow_any_staff ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile.mutateAsync(form);
      toast({ title: 'Sucesso', description: 'Perfil público atualizado!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar perfil', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-2xl border border-border/30">
      <div>
        <h2 className="text-2xl font-bold mb-4">Vitrine Pública</h2>
        <p className="text-sm text-muted-foreground">Configure como seu negócio aparece para clientes</p>
      </div>

      {/* About */}
      <div className="space-y-2">
        <Label htmlFor="about">Sobre o Negócio</Label>
        <Textarea
          id="about"
          value={form.about}
          onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
          placeholder="Descreva seu negócio, especialidades, experiência..."
          className="h-24"
        />
      </div>

      {/* Instagram */}
      <div className="space-y-2">
        <Label htmlFor="instagram" className="flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          Instagram
        </Label>
        <Input
          id="instagram"
          value={form.instagram_url}
          onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
          placeholder="https://instagram.com/seu_perfil"
        />
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-2">
        <Label htmlFor="cancellation">Política de Cancelamento</Label>
        <Textarea
          id="cancellation"
          value={form.cancellation_policy}
          onChange={(e) => setForm((f) => ({ ...f, cancellation_policy: e.target.value }))}
          placeholder="Ex: Cancelamento até 24h antes sem multa..."
          className="h-20"
        />
      </div>

      {/* Booking Policies */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_notice">Aviso Mínimo (horas)</Label>
          <Input
            id="min_notice"
            type="number"
            value={form.min_booking_notice_hours}
            onChange={(e) => setForm((f) => ({ ...f, min_booking_notice_hours: parseInt(e.target.value) }))}
            min="0"
            max="168"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_advance">Máx. Antecedência (dias)</Label>
          <Input
            id="max_advance"
            type="number"
            value={form.max_advance_booking_days}
            onChange={(e) => setForm((f) => ({ ...f, max_advance_booking_days: parseInt(e.target.value) }))}
            min="1"
            max="365"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buffer">Buffer entre Agendamentos (min)</Label>
          <Input
            id="buffer"
            type="number"
            value={form.buffer_minutes}
            onChange={(e) => setForm((f) => ({ ...f, buffer_minutes: parseInt(e.target.value) }))}
            min="0"
            max="120"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allow_any" className="flex items-center gap-2">
            <input
              id="allow_any"
              type="checkbox"
              checked={form.allow_any_staff}
              onChange={(e) => setForm((f) => ({ ...f, allow_any_staff: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            Qualquer Profissional
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSaving} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  );
}
