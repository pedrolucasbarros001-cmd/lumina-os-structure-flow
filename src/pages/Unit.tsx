import { useState, useEffect } from 'react';
import { Building2, Phone, MapPin, Clock, Save, Globe, Link } from 'lucide-react';
import { useUnit } from '@/hooks/useUnit';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const DAYS = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

type BusinessHours = Record<string, { open: boolean; start: string; end: string }>;

const defaultHours = (): BusinessHours =>
  Object.fromEntries(
    DAYS.map(d => [d.key, { open: !['sat', 'sun'].includes(d.key), start: '09:00', end: '18:00' }])
  );

export default function Unit() {
  const { data: unit, isLoading } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    accepts_home_visits: false,
    is_published: false,
    slug: '',
  });
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultHours());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name || '',
        phone: unit.phone || '',
        address: unit.address || '',
        accepts_home_visits: unit.accepts_home_visits || false,
        is_published: unit.is_published || false,
        slug: unit.slug || '',
      });
      if (unit.business_hours && typeof unit.business_hours === 'object') {
        setBusinessHours({ ...defaultHours(), ...(unit.business_hours as BusinessHours) });
      }
    }
  }, [unit]);

  const handleSave = async () => {
    if (!unit && !user) return;
    setSaving(true);
    try {
      const payload = { ...form, business_hours: businessHours, updated_at: new Date().toISOString() };
      if (unit) {
        await supabase.from('units').update(payload).eq('id', unit.id);
      } else {
        await supabase.from('units').insert({ ...payload, owner_id: user!.id });
      }
      queryClient.invalidateQueries({ queryKey: ['unit'] });
      toast({ title: 'Informações guardadas!' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const setDay = (key: string, field: string, value: boolean | string) =>
    setBusinessHours(h => ({ ...h, [key]: { ...h[key], [field]: value } }));

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Business Info */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Informações do Negócio</h2>
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4" />Nome do Negócio</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Barbearia Silva" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />Telefone</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+351 912 345 678" />
          </div>
          {unit?.logistics_type !== 'home' && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />Endereço</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, número, cidade" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Link className="w-4 h-4" />Slug (URL)</Label>
            <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="barbearia-silva" />
            {form.slug && <p className="text-xs text-muted-foreground">lumina.app/{form.slug}</p>}
          </div>
        </div>
      </section>

      {/* Modality */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Modalidade</h2>
        <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/50">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Aceita Visitas ao Domicílio</p>
              <p className="text-xs text-muted-foreground">Serviço com deslocação ao cliente</p>
            </div>
            <Switch checked={form.accepts_home_visits} onCheckedChange={v => setForm(f => ({ ...f, accepts_home_visits: v }))} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Perfil Público</p>
              <p className="text-xs text-muted-foreground">Visível na vitrine online</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Horários de Funcionamento</h2>
        <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/50">
          {DAYS.map(d => {
            const day = businessHours[d.key] || { open: false, start: '09:00', end: '18:00' };
            return (
              <div key={d.key} className={cn('p-3 transition-colors', !day.open && 'opacity-40')}>
                <div className="flex items-center gap-3">
                  <Switch checked={day.open} onCheckedChange={v => setDay(d.key, 'open', v)} />
                  <span className="w-8 text-sm font-medium shrink-0">{d.label}</span>
                  {day.open && (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={day.start} onChange={e => setDay(d.key, 'start', e.target.value)}
                        className="flex-1 bg-muted rounded-lg px-2 py-1 text-sm text-center outline-none border border-border/50 focus:border-primary" />
                      <span className="text-muted-foreground text-xs">→</span>
                      <input type="time" value={day.end} onChange={e => setDay(d.key, 'end', e.target.value)}
                        className="flex-1 bg-muted rounded-lg px-2 py-1 text-sm text-center outline-none border border-border/50 focus:border-primary" />
                    </div>
                  )}
                  {!day.open && <span className="text-sm text-muted-foreground">Fechado</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'A guardar...' : 'Guardar Alterações'}
      </Button>
    </div>
  );
}
