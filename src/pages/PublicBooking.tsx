import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Check, Building2, Car, ChevronLeft, User, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePublicUnit } from '@/hooks/usePublicUnit';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import AddressAutocomplete from '@/components/AddressAutocomplete';

type ServiceItem = { id: string; name: string; duration: number; price: number; is_home_service: boolean };

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const { unit, services, team, mobility, isLoading } = usePublicUnit(slug);

  const [step, setStep] = useState(1);
  const [logistics, setLogistics] = useState<'unit' | 'home' | null>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientLat, setClientLat] = useState<number>(0);
  const [clientLng, setClientLng] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [travelFee, setTravelFee] = useState<number>(0);
  const [addressError, setAddressError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<{ start: number, end: number }[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isHome = logistics === 'home';
  const totalSteps = isHome ? 6 : 5;

  // Auto-skip step 1 if unit doesn't accept home visits
  const effectiveStep = (!unit?.accepts_home_visits && step === 1) ? 2 : step;

  // Map step to logical step for home vs unit flows
  // Unit: 1=Logistics, 2=Services, 3=Pro, 4=DateTime, 5=Confirmation
  // Home: 1=Logistics, 2=Services, 3=Pro, 4=DateTime, 5=Address, 6=Confirmation
  const getStepLabel = (s: number) => {
    if (isHome) {
      return ['Logística', 'Serviços', 'Profissional', 'Data & Hora', 'Morada', 'Confirmação'][s - 1];
    }
    return ['Logística', 'Serviços', 'Profissional', 'Data & Hora', 'Confirmação'][s - 1];
  };

  const subtotal = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const grandTotal = subtotal + (isHome ? travelFee : 0);
  const totalDuration = selectedServices.reduce((s, sv) => s + sv.duration, 0);

  // Fetch occupied slots when datetime step is reached
  useEffect(() => {
    if (!unit || effectiveStep !== 4 || !selectedDate) return;
    (async () => {
      setFetchingSlots(true);
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        let query = supabase
          .from('appointments')
          .select('datetime, duration')
          .eq('unit_id', unit.id)
          .in('status', ['pending_approval', 'confirmed', 'en_route', 'arrived'])
          .gte('datetime', startOfDay.toISOString())
          .lte('datetime', endOfDay.toISOString());

        if (selectedPro && selectedPro !== 'any') {
          query = query.eq('team_member_id', selectedPro);
        }

        const { data, error } = await query;
        if (!error && data) {
          const slots = data.map(appt => {
            const d = new Date(appt.datetime);
            const start = d.getHours() * 60 + d.getMinutes();
            const dur = appt.duration || 60;
            return { start, end: start + dur };
          });
          setOccupiedSlots(slots);
        }
      } finally {
        setFetchingSlots(false);
      }
    })();
  }, [unit, selectedDate, selectedPro, effectiveStep]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (logistics === 'home') return services.filter(s => s.is_home_service);
    return services;
  }, [services, logistics]);

  const filteredTeam = useMemo(() => {
    if (!team || selectedServices.length === 0) return team;
    const serviceIds = selectedServices.map(s => s.id);
    return team.filter(m => {
      const memberServiceIds = (m.team_member_services || []).map((ts: any) => ts.service_id);
      return serviceIds.every(sid => memberServiceIds.includes(sid));
    });
  }, [team, selectedServices]);

  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 14; i++) result.push(addDays(new Date(), i));
    return result;
  }, []);

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

    const isTodaySelected = isSameDay(selectedDate, new Date());
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    while (current + totalDuration <= end) {
      if (isTodaySelected && current <= nowMins) {
        current += 30;
        continue;
      }
      const slotEnd = current + totalDuration;
      const overlaps = occupiedSlots.some(occ => current < occ.end && slotEnd > occ.start);
      if (!overlaps) {
        slots.push(`${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`);
      }
      current += 30;
    }
    return slots;
  }, [unit, selectedDate, totalDuration, occupiedSlots]);

  const toggleService = (s: any) => {
    setSelectedServices(prev =>
      prev.find(x => x.id === s.id)
        ? prev.filter(x => x.id !== s.id)
        : [...prev, { id: s.id, name: s.name, duration: s.duration, price: Number(s.price), is_home_service: s.is_home_service }]
    );
  };

  const handleAddressSelect = (result: { address: string; lat: number; lng: number }) => {
    setClientAddress(result.address);
    setClientLat(result.lat);
    setClientLng(result.lng);
    setAddressError('');

    if (unit?.latitude && unit?.longitude && result.lat !== 0) {
      const dist = haversineKm(Number(unit.latitude), Number(unit.longitude), result.lat, result.lng);
      setDistanceKm(Math.round(dist * 10) / 10);

      if (unit.coverage_radius_km && dist > Number(unit.coverage_radius_km)) {
        setAddressError('Fora da zona de cobertura');
        setTravelFee(0);
        return;
      }

      if (mobility) {
        const fee = Number(mobility.base_fee) + dist * Number(mobility.price_per_km);
        setTravelFee(Math.round(fee * 100) / 100);
      }
    }
  };

  const canAdvance = () => {
    switch (effectiveStep) {
      case 1: return !!logistics;
      case 2: return selectedServices.length > 0;
      case 3: return !!selectedPro;
      case 4: return !!selectedDate && !!selectedTime;
      case 5:
        if (isHome) return clientAddress.trim().length > 0 && !addressError;
        return clientName.trim().length > 0;
      case 6: return clientName.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    const confirmStep = isHome ? 6 : 5;
    if (effectiveStep === confirmStep) return handleSubmit();
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (effectiveStep <= 1) return;
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!unit) return;
    setSubmitting(true);
    setError('');
    try {
      const datetime = `${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`;

      // Check if client already exists (by email or phone)
      let clientId: string | null = null;
      if (clientEmail || clientPhone) {
        let query = supabase
          .from('clients')
          .select('id')
          .eq('unit_id', unit.id);

        if (clientEmail) {
          query = query.eq('email', clientEmail);
        } else if (clientPhone) {
          query = query.eq('phone', clientPhone);
        }

        const { data: existing } = await query.limit(1).maybeSingle();
        clientId = existing?.id || null;
      }

      // Create client if doesn't exist
      if (!clientId && clientName) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            unit_id: unit.id,
            name: clientName,
            email: clientEmail || null,
            phone: clientPhone || null,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient?.id || null;
      }

      // Create appointment
      const { error: insertError } = await supabase.from('appointments').insert({
        unit_id: unit.id,
        client_id: clientId,
        service_ids: selectedServices.map(s => s.id),
        team_member_id: selectedPro === 'any' ? null : selectedPro,
        datetime,
        duration: totalDuration,
        value: subtotal,
        type: isHome ? 'home' : 'unit',
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        address: isHome ? clientAddress : null,
        displacement_fee: isHome ? travelFee : 0,
        distance_km: isHome ? distanceKm : null,
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

  const isConfirmStep = effectiveStep === (isHome ? 6 : 5);

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
            Passo {effectiveStep} de {totalSteps} — {getStepLabel(effectiveStep)}
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

        {/* ── Step 5 (Home): Morada ── */}
        {effectiveStep === 5 && isHome && (
          <div className="space-y-4">
            <AddressAutocomplete
              onSelect={handleAddressSelect}
              defaultValue={clientAddress}
              placeholder="Rua, nº, cidade..."
            />

            {addressError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
                {addressError}
              </div>
            )}

            {distanceKm > 0 && !addressError && (
              <div className="frosted-glass p-4 space-y-2 rounded-2xl">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distância</span>
                  <span className="font-medium">{distanceKm} km</span>
                </div>
                {travelFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de deslocação</span>
                    <span className="font-bold">€{travelFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Static map preview */}
            {clientLat !== 0 && clientLng !== 0 && import.meta.env.VITE_GOOGLE_MAPS_KEY && (
              <div className="rounded-2xl overflow-hidden border border-border/50">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${clientLat},${clientLng}&zoom=15&size=600x200&markers=color:red|${clientLat},${clientLng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
                  alt="Localização"
                  className="w-full h-[150px] object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Confirmation Step ── */}
        {isConfirmStep && (
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
              {isHome && travelFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de deslocação ({distanceKm} km)</span>
                  <span className="font-medium">€{travelFee.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>€{grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })} às {selectedTime} · {totalDuration} min
              </p>
              {isHome && clientAddress && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {clientAddress}
                </p>
              )}
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
            <p className="text-lg font-bold">€ {grandTotal.toFixed(2)}</p>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canAdvance() || submitting}
            className="h-12 px-8 rounded-2xl text-sm font-bold"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isConfirmStep ? 'Confirmar Agendamento' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
