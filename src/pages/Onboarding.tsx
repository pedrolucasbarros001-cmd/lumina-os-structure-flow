import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Users, Store, Bike, MapPin, CheckCircle2, ChevronLeft, Scissors, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

type OnboardingStep = 'identity' | 'size' | 'categories' | 'logistics' | 'service' | 'hours' | 'done';

const businessCategories = [
  'Cabelo', 'Barbearia', 'Estética', 'Massagem', 'Tatuagem', 
  'Unhas', 'Maquilhagem', 'Sobrancelhas', 'Depilação', 'Spa',
  'Fisioterapia', 'Osteopatia', 'Podologia', 'Nutrição'
];

const DAYS = [
  { key: 'mon', label: 'Seg' }, { key: 'tue', label: 'Ter' }, { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' }, { key: 'fri', label: 'Sex' }, { key: 'sat', label: 'Sáb' }, { key: 'sun', label: 'Dom' },
];

type BusinessHours = Record<string, { open: boolean; start: string; end: string }>;
const defaultHours = (): BusinessHours =>
  Object.fromEntries(DAYS.map(d => [d.key, { open: !['sat', 'sun'].includes(d.key), start: '09:00', end: '18:00' }]));

const ALL_STEPS: OnboardingStep[] = ['identity', 'size', 'categories', 'logistics', 'service', 'hours'];

export default function Onboarding() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profileLoading && profile?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  const [step, setStep] = useState<OnboardingStep>('identity');
  const [loading, setLoading] = useState(false);

  // Step 1: Identity
  const [businessName, setBusinessName] = useState('');

  // Step 2: Size
  const [businessType, setBusinessType] = useState<'solo' | 'team' | null>(null);
  const [teamSize, setTeamSize] = useState('');

  // Step 3: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 4: Logistics
  const [logisticsType, setLogisticsType] = useState<'unit' | 'home' | 'hybrid' | null>(null);
  const [radius, setRadius] = useState([10]);
  const [baseFee, setBaseFee] = useState('5.00');
  const [pricePerKm, setPricePerKm] = useState('0.50');

  // Step 5: First Service
  const [service, setService] = useState({ name: '', price: '', duration: '60' });

  // Step 6: Business Hours
  const [hours, setHours] = useState<BusinessHours>(defaultHours());

  // Track created unit for later steps
  const [createdUnitId, setCreatedUnitId] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const stepIndex = ALL_STEPS.indexOf(step);

  // After logistics, create the unit, then proceed to service step
  const handleLogisticsNext = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const slugBase = businessName
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
      const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

      const { data: unit, error: unitError } = await supabase
        .from('units')
        .insert({
          owner_id: user.id, name: businessName, slug,
          business_type: businessType, logistics_type: logisticsType,
          accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid',
          coverage_radius_km: (logisticsType === 'home' || logisticsType === 'hybrid') ? radius[0] : 0,
          categories: selectedCategories, is_published: false,
        })
        .select().single();

      if (unitError) throw unitError;
      setCreatedUnitId(unit.id);

      // Owner membership
      await supabase.from('company_members').insert({
        company_id: unit.id, user_id: user.id, role: 'owner', commission_rate: 0,
      });

      // Owner as team member
      await supabase.from('team_members').insert({
        unit_id: unit.id, user_id: user.id,
        name: profile?.full_name || 'Owner', role: 'Owner/Professional',
        accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid',
      });

      // Mobility settings
      if (logisticsType === 'home' || logisticsType === 'hybrid') {
        await supabase.from('mobility_settings').insert({
          unit_id: unit.id, base_fee: parseFloat(baseFee) || 0, price_per_km: parseFloat(pricePerKm) || 0,
        });
      }

      setStep('service');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({ variant: 'destructive', title: 'Erro ao configurar a conta' });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceNext = async () => {
    if (!createdUnitId) return;
    setLoading(true);
    try {
      await supabase.from('services').insert({
        unit_id: createdUnitId, name: service.name,
        price: parseFloat(service.price), duration: parseInt(service.duration), is_active: true,
      });
      setStep('hours');
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao criar serviço.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!user || !createdUnitId) return;
    setLoading(true);
    try {
      // Save hours
      await supabase.from('units').update({ business_hours: hours }).eq('id', createdUnitId);

      // Mark BOTH flags complete
      await supabase.from('profiles').update({
        onboarding_completed: true,
        setup_completed: true,
        business_type: businessType,
        service_model: logisticsType,
        team_size: businessType === 'team' ? teamSize : null,
        user_type: 'owner',
        linked_unit_id: createdUnitId,
      }).eq('id', user.id);

      await queryClient.invalidateQueries();
      setStep('done');
      setTimeout(() => navigate('/agenda', { replace: true }), 2000);
    } catch (error) {
      console.error('Finish error:', error);
      toast({ variant: 'destructive', title: 'Erro ao guardar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading || profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header Progress */}
        {step !== 'done' && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              LUMINA OS
            </h1>
            <div className="flex items-center justify-center gap-2">
              {ALL_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === stepIndex ? "bg-primary w-6" : i < stepIndex ? "bg-primary w-2" : "bg-primary/20 w-2"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Passo {stepIndex + 1} de {ALL_STEPS.length}
            </p>
          </div>
        )}

        {/* STEP 1: Identity */}
        {step === 'identity' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Bem-vindo(a) ao seu novo sistema</h2>
              <p className="text-muted-foreground text-sm">Qual é o nome do seu negócio?</p>
            </div>
            <div className="space-y-3">
              <Label>Nome do negócio</Label>
              <Input placeholder="Ex: Barbearia Silva" value={businessName} onChange={e => setBusinessName(e.target.value)} className="h-12" autoFocus />
              <Button className="w-full h-12" disabled={!businessName.trim()} onClick={() => setStep('size')}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Team Size */}
        {step === 'size' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <button onClick={() => setStep('identity')} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </button>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Qual é o tamanho da sua operação?</h2>
              <p className="text-muted-foreground text-sm">Isto vai organizar o seu menu lateral</p>
            </div>
            <div className="grid gap-3">
              <button onClick={() => setBusinessType('solo')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01]", businessType === 'solo' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", businessType === 'solo' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div><h3 className="font-semibold">Sou Independente</h3><p className="text-xs text-muted-foreground">Trabalho sozinho</p></div>
              </button>
              <button onClick={() => setBusinessType('team')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01]", businessType === 'team' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", businessType === 'team' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Users className="w-5 h-5" />
                </div>
                <div><h3 className="font-semibold">Tenho Equipa</h3><p className="text-xs text-muted-foreground">Gerir comissões e horários múltiplos</p></div>
              </button>
            </div>
            {businessType === 'team' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <Label>Quantas pessoas na equipa?</Label>
                <div className="flex gap-2">
                  {['2-5', '6-10', '11+'].map(size => (
                    <button key={size} onClick={() => setTeamSize(size)} className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105", teamSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full h-12" disabled={!businessType || (businessType === 'team' && !teamSize)} onClick={() => setStep('categories')}>
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 3: Categories */}
        {step === 'categories' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <button onClick={() => setStep('size')} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </button>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Selecione as categorias do seu negócio</h2>
              <p className="text-muted-foreground text-sm">Escolha pelo menos 1 categoria</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {businessCategories.map((category, i) => (
                <button key={category} onClick={() => toggleCategory(category)} className={cn("p-3 rounded-xl text-sm font-medium transition-all hover:scale-105 animate-in fade-in", selectedCategories.includes(category) ? "bg-primary text-primary-foreground border-2 border-primary" : "bg-card border border-border hover:border-primary/40 text-muted-foreground")} style={{ animationDelay: `${i * 40}ms` }}>
                  {category}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">{selectedCategories.length} categoria{selectedCategories.length !== 1 ? 's' : ''} selecionada{selectedCategories.length !== 1 ? 's' : ''}</p>
            <Button className="w-full h-12" disabled={selectedCategories.length === 0} onClick={() => setStep('logistics')}>
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 4: Logistics */}
        {step === 'logistics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <button onClick={() => setStep('categories')} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </button>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Onde presta os seus serviços?</h2>
              <p className="text-muted-foreground text-sm">Configuramos o seu Dashboard com base disto</p>
            </div>
            <div className="grid gap-3">
              {([
                { key: 'unit' as const, icon: Store, title: 'Meu Espaço (Unidade Física)', desc: 'Modelo standard. Clientes vêm até si.' },
                { key: 'home' as const, icon: Bike, title: 'Apenas Domicílio (Delivery)', desc: 'Agendamentos pedem morada. Raio de distância.' },
                { key: 'hybrid' as const, icon: MapPin, title: 'Híbrido (Os Dois)', desc: 'Flexibilidade total. Unidade + Domicílio.' },
              ]).map(opt => (
                <button key={opt.key} onClick={() => setLogisticsType(opt.key)} className={cn("flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01]", logisticsType === opt.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", logisticsType === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold">{opt.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground pl-11">{opt.desc}</p>
                </button>
              ))}
            </div>

            {(logisticsType === 'home' || logisticsType === 'hybrid') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="space-y-2">
                  <Label>Raio de Cobertura</Label>
                  <div className="px-3">
                    <Slider value={radius} onValueChange={setRadius} max={50} min={1} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1 km</span><span className="font-semibold">{radius[0]} km</span><span>50 km</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Taxa Base</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                      <Input value={baseFee} onChange={e => setBaseFee(e.target.value)} className="pl-7" placeholder="5.00" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço/Km</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                      <Input value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} className="pl-7" placeholder="0.50" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full h-12" disabled={!logisticsType || loading} onClick={handleLogisticsNext}>
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              {loading ? 'A configurar...' : 'Continuar'}
            </Button>
          </div>
        )}

        {/* STEP 5: First Service */}
        {step === 'service' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Crie o seu primeiro serviço</h2>
              <p className="text-sm text-muted-foreground">Adicione pelo menos 1 serviço para começar</p>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do Serviço *</Label>
                <Input placeholder="ex: Corte de Cabelo" value={service.name} onChange={e => setService(s => ({ ...s, name: e.target.value }))} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Preço (€) *</Label>
                  <Input type="number" placeholder="25.00" value={service.price} onChange={e => setService(s => ({ ...s, price: e.target.value }))} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>Duração (min)</Label>
                  <Input type="number" placeholder="60" value={service.duration} onChange={e => setService(s => ({ ...s, duration: e.target.value }))} className="h-11" />
                </div>
              </div>
            </div>
            <Button className="w-full h-12" disabled={!service.name || !service.price || loading} onClick={handleServiceNext}>
              {loading ? 'A criar...' : 'Continuar'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 6: Business Hours */}
        {step === 'hours' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Horários de Funcionamento</h2>
              <p className="text-sm text-muted-foreground">Quando está disponível para clientes?</p>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/30">
              {DAYS.map(d => {
                const day = hours[d.key] || { open: false, start: '09:00', end: '18:00' };
                return (
                  <div key={d.key} className={cn('p-3 flex items-center gap-3', !day.open && 'opacity-50')}>
                    <Switch checked={day.open} onCheckedChange={v => setHours(h => ({ ...h, [d.key]: { ...h[d.key], open: v } }))} />
                    <span className="text-sm font-medium w-8">{d.label}</span>
                    {day.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={day.start} onChange={e => setHours(h => ({ ...h, [d.key]: { ...h[d.key], start: e.target.value } }))} className="flex-1 bg-muted rounded-lg px-2 py-1 text-xs text-center outline-none border border-border/50" />
                        <span className="text-muted-foreground text-xs">→</span>
                        <input type="time" value={day.end} onChange={e => setHours(h => ({ ...h, [d.key]: { ...h[d.key], end: e.target.value } }))} className="flex-1 bg-muted rounded-lg px-2 py-1 text-xs text-center outline-none border border-border/50" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
            <Button className="w-full h-12 bg-gradient-to-r from-primary to-accent" disabled={loading} onClick={handleFinish}>
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {loading ? 'A finalizar...' : 'Concluir e Abrir Agenda'}
            </Button>
          </div>
        )}

        {/* Done State */}
        {step === 'done' && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Tudo configurado! 🎉</h2>
              <p className="text-muted-foreground">A abrir a sua Agenda...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
