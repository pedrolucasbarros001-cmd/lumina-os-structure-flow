import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    CheckCircle,
    Home,
    Store,
    Calendar as CalendarIcon,
    User,
    ArrowRight,
    Instagram,
    MessageCircle,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Step = 'service' | 'professional' | 'datetime' | 'confirm' | 'success';

interface UnitData {
    id: string;
    name: string;
    cover_image_url?: string | null;
    logo_url?: string | null;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    accepts_home_visits?: boolean;
    slug: string;
    business_hours?: any;
    instagram_url?: string | null;
    whatsapp?: string | null;
}

interface ServiceData {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    description?: string;
    allows_home?: boolean;
    allows_unit?: boolean;
}

interface TeamMemberData {
    id: string;
    name: string;
    photo_url?: string | null;
    role?: string;
}

export default function PublicBooking() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('service');
    const [unit, setUnit] = useState<UnitData | null>(null);
    const [services, setServices] = useState<ServiceData[]>([]);
    const [team, setTeam] = useState<TeamMemberData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selections
    const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
    const [selectedPro, setSelectedPro] = useState<TeamMemberData | { id: '__any'; name: 'Qualquer Profissional' } | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [saving, setSaving] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    const [occupiedSlots, setOccupiedSlots] = useState<{ start: number, end: number }[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                const { data: unitData, error: uErr } = await supabase
                    .from('units')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (uErr || !unitData) {
                    setError('Página não encontrada ou URL inválida.');
                    return;
                }
                setUnit(unitData as UnitData);

                const { data: svcData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('unit_id', unitData.id)
                    .eq('is_active', true)
                    .order('name');
                setServices((svcData || []) as ServiceData[]);

                const { data: teamData } = await supabase
                    .from('team_members')
                    .select('*')
                    .eq('unit_id', unitData.id)
                    .eq('is_active', true)
                    .order('name');
                setTeam((teamData || []) as TeamMemberData[]);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    // Fetch occupied slots when datetime step is reached and specific date/pro is selected
    useEffect(() => {
        if (!unit || step !== 'datetime') return;
        (async () => {
            setFetchingSlots(true);
            try {
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                let query = supabase
                    .from('appointments')
                    .select('datetime, duration_minutes')
                    .eq('unit_id', unit.id)
                    .in('status', ['pending_approval', 'confirmed', 'in_transit', 'arrived']) // exclude cancelled or completed history if they don't block
                    .gte('datetime', startOfDay.toISOString())
                    .lte('datetime', endOfDay.toISOString());

                if (selectedPro && 'id' in selectedPro && selectedPro.id !== '__any') {
                    query = query.eq('team_member_id', selectedPro.id);
                }

                const { data, error } = await query;
                if (!error && data) {
                    const slots = data.map(appt => {
                        const d = new Date(appt.datetime);
                        const start = d.getHours() * 60 + d.getMinutes();
                        const dur = appt.duration_minutes || 60;
                        return { start, end: start + dur };
                    });
                    setOccupiedSlots(slots);
                }
            } finally {
                setFetchingSlots(false);
            }
        })();
    }, [unit, selectedDate, selectedPro, step]);

    const handleBook = async () => {
        if (!unit || !selectedService || !selectedDate || !selectedTime || !clientName) return;
        setSaving(true);
        try {
            const [h, m] = selectedTime.split(':').map(Number);
            const dt = new Date(selectedDate);
            dt.setHours(h, m, 0, 0);

            await supabase.from('appointments').insert({
                unit_id: unit.id,
                client_name: clientName,
                client_phone: clientPhone || null,
                datetime: dt.toISOString(),
                status: 'pending_approval',
                value: selectedService.price,
                type: isDelivery ? 'home' : 'in_person',
                address: isDelivery ? deliveryAddress : null,
                service_ids: [selectedService.id],
                team_member_id: selectedPro && 'id' in selectedPro && selectedPro.id !== '__any' ? selectedPro.id : null,
                duration_minutes: selectedService.duration_minutes || 60,
            });
            setStep('success');
        } finally {
            setSaving(false);
        }
    };

    const STEPS: Step[] = ['service', 'professional', 'datetime', 'confirm'];
    const currentIdx = STEPS.indexOf(step);

    const canBack = currentIdx > 0;
    const canNext = () => {
        if (step === 'service') return !!selectedService;
        if (step === 'professional') return !!selectedPro;
        if (step === 'datetime') return !!selectedDate && !!selectedTime;
        return true;
    };

    const goNext = () => {
        if (canNext()) {
            const next = STEPS[currentIdx + 1];
            if (next) setStep(next);
        }
    };

    const goBack = () => {
        const prev = STEPS[currentIdx - 1];
        if (prev) setStep(prev);
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i));

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-zinc-500 font-medium animate-pulse">Carregando experiência...</p>
        </div>
    );

    if (error || !unit) return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                <Info className="w-10 h-10 text-zinc-700" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ops!</h2>
            <p className="text-zinc-500 mb-8 max-w-xs">{error || 'Este negócio ainda não configurou sua página pública.'}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="rounded-2xl border-zinc-800 text-zinc-400">Voltar ao Início</Button>
        </div>
    );

    if (step === 'success') return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center relative z-10 shadow-2xl shadow-primary/40">
                    <CheckCircle className="w-12 h-12 text-white" />
                </div>
            </div>

            <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">SOLICITADO!</h2>
                <p className="text-zinc-400 max-w-xs mx-auto">Tudo pronto! <b>{unit.name}</b> recebeu o seu agendamento e vai confirmar em breve.</p>
            </div>

            <div className="w-full max-w-sm bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 uppercase font-black tracking-widest text-[10px]">Serviço</span>
                    <span className="text-white font-bold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 uppercase font-black tracking-widest text-[10px]">Data</span>
                    <span className="text-white font-bold">{format(selectedDate, "d MMMM", { locale: pt })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 uppercase font-black tracking-widest text-[10px]">Horário</span>
                    <span className="text-primary font-black">{selectedTime}</span>
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-between items-baseline">
                    <span className="text-zinc-500 uppercase font-black tracking-widest text-[10px]">Total</span>
                    <span className="text-2xl font-black text-white">€{selectedService?.price.toFixed(2)}</span>
                </div>
            </div>

            <Button onClick={() => setStep('service')} className="w-full max-w-sm h-14 rounded-2xl bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-all font-bold">
                Fazer outro agendamento
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-primary/30">
            {/* BRANDING */}
            <header className="relative shrink-0 overflow-hidden">
                <div className="h-64 relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent z-10" />
                    {unit.cover_image_url ? (
                        <img src={unit.cover_image_url} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                            <span className="text-9xl font-black text-white/5 tracking-tighter select-none">{unit.name[0]}</span>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {unit.instagram_url && (
                        <a href={unit.instagram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                            <Instagram className="w-5 h-5" />
                        </a>
                    )}
                    {unit.whatsapp && (
                        <a href={`https://wa.me/${unit.whatsapp}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                    )}
                </div>

                <div className="px-6 -mt-20 relative z-20 space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-950 border-4 border-[#09090b] shadow-2xl overflow-hidden flex items-center justify-center text-primary font-black text-4xl">
                            {unit.logo_url ? (
                                <img src={unit.logo_url} alt="logo" className="w-full h-full object-cover" />
                            ) : (
                                <span>{unit.name[0]}</span>
                            )}
                        </div>
                        <div className="pb-2">
                            <h1 className="text-3xl font-black tracking-tighter leading-none mb-2">{unit.name.toUpperCase()}</h1>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Aberto Agora
                                </div>
                                {unit.address && (
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate max-w-[150px]">
                                        <MapPin className="w-3 h-3 text-primary" />
                                        {unit.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* PROGRESS STEPPER */}
            <div className="px-6 py-6 sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-30 border-b border-zinc-900/50">
                <div className="flex items-center gap-2 mb-4">
                    {STEPS.map((s, i) => (
                        <div key={s} className={cn(
                            'h-1.5 rounded-full transition-all duration-500',
                            i < currentIdx ? 'bg-primary flex-[2]' : i === currentIdx ? 'bg-primary flex-[3]' : 'bg-zinc-800 flex-1'
                        )} />
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                        {step === 'service' && 'Escolha o Serviço'}
                        {step === 'professional' && 'Profissional'}
                        {step === 'datetime' && 'Data e Horário'}
                        {step === 'confirm' && 'Seus Dados'}
                    </h2>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Passo {currentIdx + 1}/{STEPS.length}</span>
                </div>
            </div>

            {/* STEP CONTENT */}
            <main className="flex-1 px-6 py-8 pb-32">
                {step === 'service' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        {services.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedService(s)}
                                className={cn(
                                    'group relative w-full p-6 rounded-[2rem] border transition-all duration-300 transform active:scale-[0.98]',
                                    selectedService?.id === s.id
                                        ? 'bg-zinc-900 border-primary shadow-2xl shadow-primary/10'
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                )}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-black text-lg tracking-tight uppercase leading-none">{s.name}</p>
                                            {selectedService?.id === s.id && <CheckCircle className="w-4 h-4 text-primary" />}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {s.duration_minutes} MIN</span>
                                            {s.allows_home && <span className="flex items-center gap-1 text-accent"><Home className="w-3 h-3" /> Domicílio</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-2xl font-black group-hover:text-primary transition-colors tracking-tighter">€{s.price.toFixed(0)}<span className="text-sm">.{(s.price % 1).toFixed(2).slice(2)}</span></p>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {unit.accepts_home_visits && selectedService?.allows_home && (
                            <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                            <Home className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight">Atendimento ao Domicílio?</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Nós vamos até você</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsDelivery(!isDelivery)}
                                        className={cn(
                                            'w-14 h-8 rounded-full relative transition-all duration-300 p-1',
                                            isDelivery ? 'bg-accent' : 'bg-zinc-800'
                                        )}
                                    >
                                        <div className={cn('w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md', isDelivery ? 'translate-x-6' : 'translate-x-0')} />
                                    </button>
                                </div>
                                {isDelivery && (
                                    <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            placeholder="A sua morada completa..."
                                            className="w-full bg-zinc-950 border border-accent/30 rounded-2xl px-4 py-4 text-sm outline-none focus:border-accent text-white"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === 'professional' && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => setSelectedPro({ id: '__any', name: 'Qualquer Profissional' })}
                            className={cn(
                                'col-span-2 p-6 rounded-[2.5rem] border transition-all duration-300 flex items-center gap-4',
                                selectedPro?.id === '__any' ? 'bg-zinc-900 border-primary shadow-2xl shadow-primary/10' : 'bg-zinc-900/40 border-zinc-800'
                            )}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-lg">✨</div>
                            <div className="text-left">
                                <p className="font-black text-lg uppercase tracking-tight">Qualquer Profissional</p>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Próxima disponibilidade</p>
                            </div>
                        </button>

                        {team.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedPro(m)}
                                className={cn(
                                    'p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center gap-4 text-center active:scale-95',
                                    selectedPro?.id === m.id ? 'bg-zinc-900 border-primary shadow-2xl shadow-primary/10' : 'bg-zinc-900/40 border-zinc-800'
                                )}
                            >
                                <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 p-0.5 overflow-hidden">
                                    {m.photo_url ? (
                                        <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover rounded-[1.8rem]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-zinc-700 bg-zinc-900">{m.name[0]}</div>
                                    )}
                                </div>
                                <p className="font-black text-sm uppercase tracking-tight truncate w-full">{m.name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 'datetime' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black text-white uppercase tracking-tighter">{format(weekDays[0], 'MMMM yyyy', { locale: pt })}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={() => setWeekOffset(w => w + 1)} className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {weekDays.map((d) => (
                                    <button
                                        key={d.toISOString()}
                                        onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                                        className={cn(
                                            'min-w-[55px] flex flex-col items-center py-4 rounded-2xl border transition-all',
                                            isSameDay(selectedDate, d) ? 'bg-primary border-primary text-white scale-105 shadow-xl shadow-primary/20' : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                                        )}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest mb-1">{format(d, 'EEE', { locale: pt })}</span>
                                        <span className="text-lg font-black tracking-tighter">{format(d, 'd')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 relative min-h-[100px]">
                            {fetchingSlots && (
                                <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            )}

                            {(() => {
                                const ALL_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00'];
                                const availableTimes = ALL_TIMES.filter(t => {
                                    const [h, m] = t.split(':').map(Number);
                                    const startMins = h * 60 + m;
                                    const dur = selectedService?.duration_minutes || 60;
                                    const endMins = startMins + dur;

                                    if (isSameDay(selectedDate, new Date())) {
                                        const now = new Date();
                                        const nowMins = now.getHours() * 60 + now.getMinutes();
                                        if (startMins <= nowMins) return false;
                                    }

                                    const overlaps = occupiedSlots.some(occ => startMins < occ.end && endMins > occ.start);
                                    return !overlaps;
                                });

                                if (availableTimes.length === 0 && !fetchingSlots) {
                                    return <div className="col-span-4 text-center py-8 text-zinc-500 font-bold text-sm">Nenhum horário disponível para este dia.</div>;
                                }

                                return availableTimes.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTime(t)}
                                        className={cn(
                                            'py-4 rounded-2xl border text-xs font-black tracking-tight transition-all',
                                            selectedTime === t ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                                        )}
                                    >
                                        {t}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] space-y-4">
                            <h3 className="text-zinc-600 font-black uppercase tracking-[0.2em] text-[10px]">Resumo do Pedido</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><span className="text-zinc-500 text-xs">Serviço:</span><span className="font-black text-sm uppercase">{selectedService?.name}</span></div>
                                <div className="flex items-center justify-between"><span className="text-zinc-500 text-xs">Data:</span><span className="font-black text-sm uppercase">{format(selectedDate, "d 'de' MMMM", { locale: pt })}</span></div>
                                <div className="flex items-center justify-between"><span className="text-zinc-500 text-xs">Horário:</span><span className="font-black text-sm text-primary uppercase">{selectedTime}</span></div>
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-500 text-xs font-black">TOTAL:</span><span className="font-black text-xl text-white">€{selectedService?.price.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <input
                                required
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="O seu nome completo..."
                                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl px-5 py-5 text-sm outline-none focus:border-primary text-white"
                            />
                            <input
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="Seu telemóvel / whatsapp..."
                                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl px-5 py-5 text-sm outline-none focus:border-primary text-white"
                            />
                        </div>
                    </div>
                )}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#09090b] to-transparent z-40">
                <div className="max-w-screen-md mx-auto flex gap-3">
                    {canBack && (
                        <button onClick={goBack} className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"><ChevronLeft className="w-6 h-6" /></button>
                    )}
                    <button
                        onClick={step === 'confirm' ? handleBook : goNext}
                        disabled={!canNext() || (step === 'confirm' && (!clientName || saving))}
                        className={cn(
                            'flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all',
                            canNext() ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-zinc-900 text-zinc-700 border border-zinc-800 opacity-50'
                        )}
                    >
                        {step === 'confirm' ? (saving ? 'Enviando...' : 'Finalizar Agendamento') : 'Continuar'} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
