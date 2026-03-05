import { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Phone,
    MapPin,
    Clock,
    Save,
    Globe,
    Link,
    Copy,
    CheckCheck,
    ExternalLink,
    Camera,
    Instagram,
    MessageCircle,
    Info,
    Layout,
    QrCode,
    Upload,
    Home,
    ChevronLeft,
    ChevronRight,
    Search,
    User,
    ArrowRight
} from 'lucide-react';
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
    { key: 'mon', label: 'Segunda-feira' },
    { key: 'tue', label: 'Terça-feira' },
    { key: 'wed', label: 'Quarta-feira' },
    { key: 'thu', label: 'Quinta-feira' },
    { key: 'fri', label: 'Sexta-feira' },
    { key: 'sat', label: 'Sábado' },
    { key: 'sun', label: 'Domingo' },
];

type BusinessHours = Record<string, { open: boolean; start: string; end: string }>;

const defaultHours = (): BusinessHours =>
    Object.fromEntries(DAYS.map(d => [d.key, { open: !['sat', 'sun'].includes(d.key), start: '09:00', end: '18:00' }]));

// ─────────────────────────────────────────
// PHOTO UPLOAD COMPONENT (PREMIUM)
// ─────────────────────────────────────────
function PhotoUpload({ label, value, onUpload, aspect = 'cover' }: {
    label: string; value?: string | null; onUpload: (url: string) => void; aspect?: 'cover' | 'logo';
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.id}/${aspect}-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from('unit-images').upload(path, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage.from('unit-images').getPublicUrl(data.path);
            onUpload(urlData.publicUrl);
            toast({ title: `${label} atualizada com sucesso! ✨` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative">
            {label && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 ml-1">{label}</p>}
            <div
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'relative overflow-hidden cursor-pointer group transition-all duration-500',
                    aspect === 'cover'
                        ? 'w-full h-48 rounded-[2rem] border-2 border-dashed border-zinc-800 hover:border-primary/50'
                        : 'w-24 h-24 rounded-[2rem] border-4 border-zinc-950 shadow-2xl bg-zinc-900 flex items-center justify-center'
                )}
            >
                {value ? (
                    <img src={value} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-primary transition-colors">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                </div>

                {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    );
}

// ─────────────────────────────────────────
// MAIN EMPRESA COMPONENT (PRO MAX)
// ─────────────────────────────────────────
export default function Empresa() {
    const { data: unit, isLoading } = useUnit();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [form, setForm] = useState({
        name: '', phone: '', address: '', description: '', slug: '',
        accepts_home_visits: false, is_published: false,
        instagram_url: '', whatsapp: '',
        cover_image_url: '', logo_url: '',
    });
    const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultHours());
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        if (unit) {
            setForm({
                name: unit.name || '',
                phone: (unit as any).phone || '',
                address: unit.address || '',
                description: (unit as any).description || '',
                slug: unit.slug || '',
                accepts_home_visits: unit.accepts_home_visits || false,
                is_published: unit.is_published || false,
                instagram_url: (unit as any).instagram_url || '',
                whatsapp: (unit as any).whatsapp || '',
                cover_image_url: (unit as any).cover_image_url || '',
                logo_url: (unit as any).logo_url || '',
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
            if (unit) await supabase.from('units').update(payload).eq('id', unit.id);
            else await supabase.from('units').insert({ ...payload, owner_id: user!.id });

            queryClient.invalidateQueries({ queryKey: ['unit'] });
            toast({ title: 'Minha Empresa atualizada! ✅', description: 'As alterações já estão ao vivo.' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao guardar', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = () => {
        const url = `${window.location.origin}/s/${form.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: 'Link copiado! 📋' });
        setTimeout(() => setCopied(false), 2000);
    };

    const setDay = (key: string, field: string, value: boolean | string) =>
        setBusinessHours(h => ({ ...h, [key]: { ...h[key], [field]: value } }));

    if (isLoading) return (
        <div className="max-w-2xl mx-auto p-8 space-y-8 animate-pulse">
            <div className="h-48 bg-zinc-900 rounded-[2rem]" />
            <div className="space-y-4">
                <div className="h-12 bg-zinc-900 rounded-2xl w-3/4" />
                <div className="h-32 bg-zinc-900 rounded-2xl" />
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            {/* ── COVER & LOGO SECTIONS ── */}
            <div className="relative group px-4">
                <PhotoUpload
                    label="Imagem da Capa"
                    value={form.cover_image_url}
                    aspect="cover"
                    onUpload={url => setForm(f => ({ ...f, cover_image_url: url }))}
                />
                <div className="absolute -bottom-8 left-10 z-10 scale-110">
                    <PhotoUpload
                        label=""
                        value={form.logo_url}
                        aspect="logo"
                        onUpload={url => setForm(f => ({ ...f, logo_url: url }))}
                    />
                </div>
            </div>

            <div className="px-6 pt-4 space-y-10">
                {/* ── ONLINE STOREFRONT (PREMIUM CARD) ── */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Página Pública</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn('text-[10px] font-black uppercase tracking-widest', form.is_published ? 'text-emerald-500' : 'text-zinc-500')}>
                                {form.is_published ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                    </div>

                    <div className={cn(
                        'relative overflow-hidden rounded-[2.5rem] border-2 p-8 transition-all duration-500',
                        form.is_published
                            ? 'bg-zinc-900 border-primary/20 shadow-2xl shadow-primary/5'
                            : 'bg-zinc-950 border-zinc-900 opacity-60'
                    )}>
                        {form.is_published ? (
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Seu Link de Agendamentos</p>
                                    <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                        <Link className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-mono text-primary font-black truncate flex-1 tracking-tight">/s/{form.slug || 'seu-negocio'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="secondary" onClick={handleCopy} className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]">
                                        {copied ? <CheckCheck className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                        Copiar Link
                                    </Button>
                                    <Button variant="outline" onClick={() => window.open(`${window.location.origin}/s/${form.slug}`, '_blank')} className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-zinc-800">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Ver Loja
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowQR(true)}
                                    className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-zinc-800 text-zinc-400 hover:text-primary transition-all"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Gerar QR Code para Balcão
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-4">
                                <Info className="w-8 h-8 text-zinc-800 mx-auto" />
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{!form.slug ? 'Defina um endereço (slug) para ativar' : 'Sua loja está oculta para clientes'}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── QR CODE MODAL ── */}
                {showQR && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Seu QR Code</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aponte a camera para agendar</p>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] aspect-square flex items-center justify-center mx-auto shadow-2xl">
                                <img
                                    src={`https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(window.location.origin + '/s/' + form.slug)}&chs=300x300&choe=UTF-8&chld=L|2`}
                                    alt="QR Code"
                                    className="w-full h-full"
                                />
                            </div>

                            <p className="font-mono text-[10px] text-zinc-500 bg-zinc-950 py-2 px-4 rounded-full inline-block">/s/{form.slug}</p>

                            <div className="grid grid-cols-1 gap-4 pt-4">
                                <Button className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => window.print()}>
                                    Imprimir QR Code
                                </Button>
                                <Button variant="ghost" className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-500" onClick={() => setShowQR(false)}>
                                    FECHAR
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BASIC INFO ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Sobre a Minha Empresa</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-900">
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Comercial</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl focus:border-primary transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Descrição do Negócio</Label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm outline-none focus:border-primary transition-all resize-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Telefone Principal</Label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl pl-12 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Endereço (Slug) do Link</Label>
                            <div className="relative">
                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    value={form.slug}
                                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                    className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl pl-12 focus:border-primary transition-all font-mono lowercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Localização Física</Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <Input
                                    value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    placeholder="Rua, nº, Cidade, Código Postal"
                                    className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl pl-12 focus:border-primary transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SOCIAL ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Presença Digital</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-900 group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                                    <Instagram className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Instagram</span>
                            </div>
                            <Input
                                value={form.instagram_url}
                                onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))}
                                placeholder="@seu_perfil"
                                className="h-12 bg-zinc-950 border-zinc-800 rounded-xl focus:border-pink-500 transition-all font-bold"
                            />
                        </div>

                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-900 group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">WhatsApp</span>
                            </div>
                            <Input
                                value={form.whatsapp}
                                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                                placeholder="+351 912 000 000"
                                className="h-12 bg-zinc-950 border-zinc-800 rounded-xl focus:border-emerald-500 transition-all font-bold"
                            />
                        </div>
                    </div>
                </section>

                {/* ── LOGISTICS ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Logística & Atendimento</h2>
                    </div>

                    <div className="bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 overflow-hidden divide-y divide-zinc-900">
                        <div className="flex items-center justify-between p-8 group">
                            <div className="space-y-1">
                                <p className="font-black text-sm uppercase tracking-tight text-white group-hover:text-primary transition-colors">Permitir Atendimento ao Domicílio</p>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Os clientes poderão solicitar visitas</p>
                            </div>
                            <Switch checked={form.accepts_home_visits} onCheckedChange={v => setForm(f => ({ ...f, accepts_home_visits: v }))} className="data-[state=checked]:bg-primary" />
                        </div>
                    </div>
                </section>

                {/* ── BUSINESS HOURS (PREMIUM GRID) ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Horário de Funcionamento</h2>
                    </div>

                    <div className="bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 overflow-hidden divide-y divide-zinc-900">
                        {DAYS.map(d => {
                            const day = businessHours[d.key] || { open: false, start: '09:00', end: '18:00' };
                            return (
                                <div key={d.key} className={cn('p-6 transition-all duration-300', !day.open && 'bg-zinc-950/40 opacity-40')}>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                        <div className="flex items-center gap-4 min-w-[150px]">
                                            <Switch checked={day.open} onCheckedChange={v => setDay(d.key, 'open', v)} className="data-[state=checked]:bg-emerald-500" />
                                            <span className="font-black text-xs uppercase tracking-widest text-white">{d.label}</span>
                                        </div>

                                        {day.open ? (
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        value={day.start}
                                                        onChange={e => setDay(d.key, 'start', e.target.value)}
                                                        className="bg-zinc-950 text-white rounded-xl px-4 py-2 text-xs font-black border border-zinc-800 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <span className="text-zinc-700 font-bold">→</span>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        value={day.end}
                                                        onChange={e => setDay(d.key, 'end', e.target.value)}
                                                        className="bg-zinc-950 text-white rounded-xl px-4 py-2 text-xs font-black border border-zinc-800 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Fechado para Descanso</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── SAVE ACTION ── */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
                    <Button
                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                A GUARDAR...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                GUARDAR ALTERAÇÕES
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
