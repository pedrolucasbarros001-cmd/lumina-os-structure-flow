import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/hooks/useUnit';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CheckCircle2, Scissors, Users, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

type SetupStep = 1 | 2 | 3;

const DAYS = [
    { key: 'mon', label: 'Seg' }, { key: 'tue', label: 'Ter' }, { key: 'wed', label: 'Qua' },
    { key: 'thu', label: 'Qui' }, { key: 'fri', label: 'Sex' }, { key: 'sat', label: 'Sáb' }, { key: 'sun', label: 'Dom' },
];

type BusinessHours = Record<string, { open: boolean; start: string; end: string }>;
const defaultHours = (): BusinessHours =>
    Object.fromEntries(DAYS.map(d => [d.key, { open: !['sat', 'sun'].includes(d.key), start: '09:00', end: '18:00' }]));

export default function ProgressiveSetup() {
    const { user } = useAuth();
    const { data: unit } = useUnit();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [step, setStep] = useState<SetupStep>(1);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    // Step 1: Service
    const [service, setService] = useState({ name: '', price: '', duration: '60', allows_unit: true, allows_home: false });

    // Step 2: Team member (if team)
    const [member, setMember] = useState({ name: '', role: 'Professional' });
    const isTeam = unit?.business_type === 'team';

    // Step 3: Business hours
    const [hours, setHours] = useState<BusinessHours>(defaultHours());

    const totalSteps = isTeam ? 3 : 2;
    const stepTitles = ['Catálogo', isTeam ? 'Equipa' : null, 'Horários'].filter(Boolean) as string[];

    const handleFinish = async () => {
        if (!user || !unit) return;
        setLoading(true);
        try {
            // Save hours to unit
            await supabase.from('units').update({ business_hours: hours }).eq('id', unit.id);

            // Mark setup_completed on profile
            await supabase.from('profiles').update({ setup_completed: true } as any).eq('id', user.id);

            await queryClient.invalidateQueries();
            setDone(true);
            setTimeout(() => navigate('/agenda'), 2500);
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao guardar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    const handleStep1Next = async () => {
        if (!user || !unit) return;
        setLoading(true);
        try {
            await supabase.from('services').insert({
                unit_id: unit.id,
                name: service.name,
                price: parseFloat(service.price),
                duration: parseInt(service.duration),
                is_active: true,
            });
            setStep(isTeam ? 2 : 3);
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao criar serviço.' });
        } finally { setLoading(false); }
    };

    const handleStep2Next = async () => {
        if (!user || !unit) return;
        setLoading(true);
        try {
            if (member.name) {
                await supabase.from('team_members').insert({ unit_id: unit.id, name: member.name, role: member.role });
            }
            setStep(3);
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao adicionar membro.' });
        } finally { setLoading(false); }
    };

    if (done) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-in zoom-in-50 duration-500">
                    <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold mb-2">Tudo Pronto! 🎉</h1>
                    <p className="text-muted-foreground">O seu sistema está configurado.<br />A abrir a Agenda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent mb-1">
                        LUMINA OS
                    </h1>
                    <p className="text-sm text-muted-foreground">Vamos preparar o seu negócio</p>
                    {/* Step progress */}
                    <div className="flex items-center justify-center gap-2 mt-5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i + 1 === step ? 'w-8 bg-primary' : i + 1 < step ? 'w-4 bg-primary/60' : 'w-4 bg-muted')} />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Passo {step} de {totalSteps}: {stepTitles[step - 1]}</p>
                </div>

                {/* STEP 1: Create first service */}
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center space-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Scissors className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">Crie o seu Catálogo</h2>
                            <p className="text-sm text-muted-foreground">Adicione pelo menos 1 serviço para começar</p>
                        </div>

                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
                            <div className="space-y-1.5"><Label>Nome do Serviço *</Label><Input placeholder="ex: Corte de Cabelo" value={service.name} onChange={e => setService(s => ({ ...s, name: e.target.value }))} className="h-11" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><Label>Preço (€) *</Label><Input type="number" placeholder="25.00" value={service.price} onChange={e => setService(s => ({ ...s, price: e.target.value }))} className="h-11" /></div>
                                <div className="space-y-1.5"><Label>Duração (min)</Label><Input type="number" placeholder="60" value={service.duration} onChange={e => setService(s => ({ ...s, duration: e.target.value }))} className="h-11" /></div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Modalidade</p>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                                    <span className="text-sm">Presencial</span>
                                    <Switch checked={service.allows_unit} onCheckedChange={v => setService(s => ({ ...s, allows_unit: v }))} />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                                    <span className="text-sm">Ao Domicílio</span>
                                    <Switch checked={service.allows_home} onCheckedChange={v => setService(s => ({ ...s, allows_home: v }))} />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full h-12" disabled={!service.name || !service.price || loading} onClick={handleStep1Next}>
                            Continuar <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}

                {/* STEP 2: Team member (conditional) */}
                {step === 2 && isTeam && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center space-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">Adicione a sua Equipa</h2>
                            <p className="text-sm text-muted-foreground">Convide pelo menos 1 colaborador</p>
                        </div>

                        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
                            <div className="space-y-1.5"><Label>Nome do Colaborador</Label><Input placeholder="ex: Ana Silva" value={member.name} onChange={e => setMember(m => ({ ...m, name: e.target.value }))} className="h-11" /></div>
                            <div className="space-y-1.5">
                                <Label>Função</Label>
                                <select className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 text-sm" value={member.role} onChange={e => setMember(m => ({ ...m, role: e.target.value }))}>
                                    <option value="Professional">Profissional</option>
                                    <option value="Receptionist">Recepcionista</option>
                                    <option value="Manager">Gestor</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            <Button className="flex-1 h-12" disabled={loading} onClick={handleStep2Next}>
                                Continuar <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                        <button onClick={() => setStep(3)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                            Saltar por agora
                        </button>
                    </div>
                )}

                {/* STEP 3: Business Hours */}
                {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
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

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(isTeam ? 2 : 1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            <Button className="flex-1 h-12 bg-gradient-to-r from-primary to-accent" disabled={loading} onClick={handleFinish}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir Setup
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
