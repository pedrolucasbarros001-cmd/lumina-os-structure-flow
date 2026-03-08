import { useState, useEffect, useRef } from 'react';
import { Building2, Phone, MapPin, Clock, Save, Globe, Link, Copy, CheckCheck, ExternalLink, Star, FileText, Camera, ImagePlus } from 'lucide-react';
import { useUnit } from '@/hooks/useUnit';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const DAYS = [
  { key: 'mon', label: 'Seg' }, { key: 'tue', label: 'Ter' }, { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' }, { key: 'fri', label: 'Sex' }, { key: 'sat', label: 'Sáb' }, { key: 'sun', label: 'Dom' },
];

type BusinessHours = Record<string, { open: boolean; start: string; end: string }>;
const defaultHours = (): BusinessHours =>
  Object.fromEntries(DAYS.map(d => [d.key, { open: !['sat', 'sun'].includes(d.key), start: '09:00', end: '18:00' }]));

// ─────────────────────────────────────────
// BOOKING LINK CARD
// ─────────────────────────────────────────
function BookingLinkCard({ slug, isPublished, onPublish }: { slug: string; isPublished: boolean; onPublish: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const bookingUrl = slug ? `${window.location.origin}/s/${slug}` : '';

  const handleCopy = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({ title: '✅ Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Vitrine Online</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isPublished ? '🟢 Online' : '🔴 Offline'}</span>
          <Switch checked={isPublished} onCheckedChange={onPublish} />
        </div>
      </div>
      <div className={cn(
        'bg-card border rounded-2xl p-4 space-y-4 transition-all',
        isPublished ? 'border-primary/30 bg-primary/5' : 'border-border/50 opacity-60'
      )}>
        {isPublished && slug ? (
          <>
            <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Link de Agendamento Público</p>
                <p className="text-sm font-mono font-medium truncate text-primary">/s/{slug}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="rounded-xl">
                {copied ? <CheckCheck className="w-4 h-4 mr-1.5 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(bookingUrl, '_blank')} className="rounded-xl">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Visualizar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-2 space-y-2">
            <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">Vitrine Offline</p>
            <p className="text-xs text-muted-foreground">
              {!slug ? 'Defina um slug (URL) abaixo para ativar a vitrine.' : 'Ative o interruptor para tornar a página pública.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// MAIN UNIT PAGE
// ─────────────────────────────────────────
export default function Unit() {
  const { data: unit, isLoading } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', phone: '', address: '', bio: '',
    accepts_home_visits: false, is_published: false, slug: '',
  });
  const [mobility, setMobility] = useState({ base_fee: '0', price_per_km: '0', coverage_radius_km: '10' });
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultHours());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (unit) {
      setForm({
        name: unit.name || '',
        phone: (unit as any).phone || '',
        address: unit.address || '',
        bio: (unit as any).bio || '',
        accepts_home_visits: unit.accepts_home_visits || false,
        is_published: unit.is_published || false,
        slug: unit.slug || '',
      });
      if (unit.business_hours && typeof unit.business_hours === 'object') {
        setBusinessHours({ ...defaultHours(), ...(unit.business_hours as BusinessHours) });
      }
      setCoverPreview(unit.cover_url || null);
      setLogoPreview(unit.logo_url || null);
      setMobility({
        coverage_radius_km: String(unit.coverage_radius_km || 10),
        base_fee: '0',
        price_per_km: '0',
      });
      // Load mobility settings
      supabase.from('mobility_settings').select('*').eq('unit_id', unit.id).maybeSingle().then(({ data }) => {
        if (data) {
          setMobility({
            base_fee: String(data.base_fee || 0),
            price_per_km: String(data.price_per_km || 0),
            coverage_radius_km: String(unit.coverage_radius_km || 10),
          });
        }
      });
    }
  }, [unit]);

  const uploadImage = async (file: File, type: 'cover' | 'logo') => {
    if (!unit) return;
    const setUploading = type === 'cover' ? setUploadingCover : setUploadingLogo;
    const setPreview = type === 'cover' ? setCoverPreview : setLogoPreview;
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${unit.id}/${type}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('unit-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('unit-assets')
        .getPublicUrl(path);

      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const updateField = type === 'cover' ? 'cover_url' : 'logo_url';
      await supabase.from('units').update({ [updateField]: urlWithCache }).eq('id', unit.id);

      setPreview(urlWithCache);
      queryClient.invalidateQueries({ queryKey: ['unit'] });
      toast({ title: `${type === 'cover' ? 'Capa' : 'Logo'} atualizado! ✅` });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao fazer upload.' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, type);
    e.target.value = '';
  };

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
      toast({ title: 'Informações guardadas! ✅' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao guardar.' });
    } finally { setSaving(false); }
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
    <div className="max-w-xl mx-auto px-4 py-4 space-y-6 pb-28">
      {/* Hidden file inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'cover')} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'logo')} />

      {/* ── GOOGLE MY BUSINESS PREVIEW ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pré-visualização</h2>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Cover — clickable */}
          <button
            onClick={() => unit && coverInputRef.current?.click()}
            disabled={!unit || uploadingCover}
            className="w-full h-28 bg-gradient-to-br from-primary/40 to-accent/40 relative group cursor-pointer disabled:cursor-not-allowed"
          >
            {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className={cn('opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-sm font-medium', uploadingCover && 'opacity-100')}>
                {uploadingCover ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ImagePlus className="w-5 h-5" /> Alterar Capa</>
                )}
              </div>
            </div>
            {/* Logo overlay — clickable */}
            <div
              onClick={e => { e.stopPropagation(); unit && logoInputRef.current?.click(); }}
              className="absolute -bottom-6 left-4 w-14 h-14 rounded-2xl border-2 border-background bg-muted flex items-center justify-center overflow-hidden group/logo cursor-pointer"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/40 transition-colors flex items-center justify-center">
                <Camera className={cn('w-4 h-4 text-white opacity-0 group-hover/logo:opacity-100 transition-opacity', uploadingLogo && 'opacity-100 animate-spin')} />
              </div>
            </div>
          </button>
          <div className="pt-8 pb-4 px-4 space-y-1">
            <h3 className="font-bold text-lg">{form.name || 'Nome do Negócio'}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {form.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{form.address}</span>}
              {form.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{form.phone}</span>}
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 5.0</span>
            </div>
            {form.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{form.bio}</p>}
          </div>
        </div>
      </section>

      {/* ── BOOKING LINK ── */}
      <BookingLinkCard
        slug={form.slug}
        isPublished={form.is_published}
        onPublish={v => setForm(f => ({ ...f, is_published: v }))}
      />

      {/* ── Business Info ── */}
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
            <Label className="flex items-center gap-2"><FileText className="w-4 h-4" />Bio / Descrição</Label>
            <Textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Descreva brevemente o seu negócio..."
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Link className="w-4 h-4" />URL do Negócio (Slug)</Label>
            <div className="flex gap-2">
              <div className="flex items-center flex-1 bg-muted rounded-xl border border-border/50 px-3 gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/s/</span>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="barbearia-silva"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>
            {form.slug && <p className="text-xs text-muted-foreground pl-1">✅ {window.location.origin}/s/{form.slug}</p>}
          </div>
        </div>
      </section>

      {/* ── Modality ── */}
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
        </div>
      </section>

      {/* ── Business Hours ── */}
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
