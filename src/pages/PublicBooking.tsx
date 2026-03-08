import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Check, Building2, Car, ChevronLeft, User, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePublicUnit } from '@/hooks/usePublicUnit';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';

type ServiceItem = { id: string; name: string; duration: number; price: number; is_home_service: boolean };

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const { unit, services, team, isLoading } = usePublicUnit(slug);

  const [step, setStep] = useState(1);
  const [logistics, setLogistics] = useState<'unit' | 'home' | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-skip step 1 if unit doesn't accept home visits
  const effectiveStep = (!unit?.accepts_home_visits && step === 1) ? 2 : step;

  const subtotal = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const totalDuration = selectedServices.reduce((s, sv) => s + sv.duration, 0);

  // Filtered services based on logistics
  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (logistics === 'home') return services.filter(s => s.is_home_service);
    return services;
  }, [services, logistics]);

  // Filtered team based on selected services
  const filteredTeam = useMemo(() => {
    if (!team || selectedServices.length === 0) return team;
    const serviceIds = selectedServices.map(s => s.id);
    return team.filter(m => {
      const memberServiceIds = (m.team_member_services || []).map((ts: any) => ts.service_id);
      return serviceIds.every(sid => memberServiceIds.includes(sid));
    });
  }, [team, selectedServices]);

  // Generate next 14 days
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 14; i++) result.push(addDays(new Date(), i));
    return result;
  }, []);

  // Generate time slots from business hours
  const timeSlots = useMemo(() => {
    if (!unit?.business_hours || !selectedDate) return [];
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayKeys[selectedDate.getDay()];
    const hours = (unit.business_hours as any)?.[dayKey];
    if (!hours?.open) return [];
    const slots: string[] = [];
    const [startH, startM] = hours.start.split(':').map(Number);
    const [endH, endM] = hours.end.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current + totalDuration <= end) {
      slots.push(`${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`);
      current += 30;
    }
    return slots;
  }, [unit, selectedDate, totalDuration]);

  const toggleService = (s: any) => {
    setSelectedServices(prev =>
      prev.find(x => x.id === s.id)
        ? prev.filter(x => x.id !== s.id)
        : [...prev, { id: s.id, name: s.name, duration: s.duration, price: Number(s.price), is_home_service: s.is_home_service }]
    );
  };

  const canAdvance = () => {
    switch (effectiveStep) {
      case 1: return !!logistics;
      case 2: return selectedServices.length > 0;
      case 3: return !!selectedPro;
      case 4: return !!selectedDate && !!selectedTime;
      case 5: return clientName.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (effectiveStep === 5) return handleSubmit();
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (effectiveStep <= 1) return;
    setStep(s => s - 1);
  };

  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!unit) return;
    setSubmitting(true);
    setError('');
    try {
      const datetime = `${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`;
      const { error: insertError } = await supabase.from('appointments').insert({
        unit_id: unit.id,
        service_ids: selectedServices.map(s => s.id),
        team_member_id: selectedPro === 'any' ? null : selectedPro,
        datetime,
        duration: totalDuration,
        value: subtotal,
        type: logistics === 'home' ? 'home' : 'unit',
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        status: 'pending_approval',
        payment_status: 'unpaid',
      });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Ocorreu um erro ao agendar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Building2 className="w-12 h-12 opacity-40" />
        <p>Página não encontrada</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-scale-in">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold">Agendamento Confirmado!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Receberá uma confirmação em breve. Obrigado por agendar connosco.
        </p>
      </div>
    );
  }

  const stepLabels = ['Logística', 'Serviços', 'Profissional', 'Data & Hora', 'Confirmação'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── STATIC HEADER ── */}
      <div className="relative h-[35vh] min-h-[200px] shrink-0 overflow-hidden">
        {unit.cover_url ? (
          <img src={unit.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-accent/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          {unit.logo_url && (
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-background mb-2 bg-background">
              <img src={unit.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-xl font-bold">{unit.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {unit.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {unit.address}</span>}
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 5.0</span>
          </div>
        </div>
      </div>

      {/* ── MAGIC CONTAINER ── */}
      <div className="flex-1 px-4 py-5 overflow-y-auto pb-32">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-5">
          {effectiveStep > 1 && (
            <button onClick={handleBack} className="mr-2 p-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Passo {effectiveStep} de 5 — {stepLabels[effectiveStep - 1]}
          </span>
        </div>

        {/* ── Step 1: Logística ── */}
        {effectiveStep === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'unit' as const, icon: Building2, label: 'Você vem até nós', sub: 'No estabelecimento' },
              { key: 'home' as const, icon: Car, label: 'Nós vamos até si', sub: 'Serviço ao domicílio' },
            ].map((opt, i) => (
              <button
                key={opt.key}
                onClick={() => setLogistics(opt.key)}
                className={cn(
                  'stagger-child flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all text-center',
                  logistics === opt.key ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/50 bg-card hover:border-primary/30'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <opt.icon className={cn('w-8 h-8', logistics === opt.key ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Serviços ── */}
        {effectiveStep === 2 && (
          <div className="space-y-2">
            {filteredServices.map((s, i) => {
              const isSelected = selectedServices.some(x => x.id === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s as ServiceItem)}
                  className={cn(
                    'stagger-child w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left',
                    isSelected ? 'border-emerald-500/60 bg-emerald-500/10 scale-[1.01]' : 'border-border/50 bg-card hover:border-primary/30'
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm">€{Number(s.price).toFixed(0)}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 3: Profissional ── */}
        {effectiveStep === 3 && (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedPro('any')}
              className={cn(
                'stagger-child flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                selectedPro === 'any' ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
              )}
              style={{ animationDelay: '0ms' }}
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl">✨</div>
              <p className="text-xs font-medium">Qualquer</p>
            </button>
            {filteredTeam.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedPro(m.id)}
                className={cn(
                  'stagger-child flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                  selectedPro === m.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
                )}
                style={{ animationDelay: `${(i + 1) * 50}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-primary-foreground overflow-hidden">
                  {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> : m.name.charAt(0)}
                </div>
                <p className="text-xs font-medium text-center leading-tight">{m.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 4: Data & Hora ── */}
        {effectiveStep === 4 && (
          <div className="space-y-5">
            {/* Day ribbon */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {days.map((d, i) => {
                const isSelected = selectedDate && isSameDay(d, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                    className={cn(
                      'stagger-child flex-shrink-0 flex flex-col items-center gap-1 w-14 py-3 rounded-2xl border-2 transition-all',
                      isSelected ? 'border-primary bg-primary/10' : 'border-border/50 bg-card'
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="text-[10px] uppercase text-muted-foreground">{format(d, 'EEE', { locale: pt })}</span>
                    <span className={cn('text-lg font-bold', isSelected && 'text-primary')}>{format(d, 'd')}</span>
                  </button>
                );
              })}
            </div>

            {/* Time pills */}
            {selectedDate && (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.length === 0 && (
                  <p className="col-span-4 text-center text-sm text-muted-foreground py-6">Sem horários disponíveis neste dia.</p>
                )}
                {timeSlots.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={cn(
                      'stagger-child py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                      selectedTime === t ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' : 'border-border/50 bg-card hover:border-primary/30'
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Checkout ── */}
        {effectiveStep === 5 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="frosted-glass p-4 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Resumo</h3>
              {selectedServices.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium">€{s.price}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })} às {selectedTime} · {totalDuration} min
              </p>
            </div>

            {/* Client fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Nome *</label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="O seu nome" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@exemplo.com" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telemóvel</label>
                <Input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+351 912 345 678" className="rounded-xl" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 -mt-2 mb-2">
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-[30px] bg-background/80 border-t border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-lg font-bold">€ {subtotal.toFixed(2)}</p>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canAdvance() || submitting}
            className="h-12 px-8 rounded-2xl text-sm font-bold"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {effectiveStep === 5 ? 'Confirmar Agendamento' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
