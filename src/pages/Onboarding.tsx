import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserCircle2, ArrowRight, Briefcase, Users, Store, Bike, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

type OnboardingStep = 'profile' | 'size' | 'logistics' | 'done';

export default function Onboarding() {
    const { user } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Redirect if already completed
    useEffect(() => {
        if (!profileLoading && profile?.onboarding_completed) {
            navigate('/dashboard', { replace: true });
        }
    }, [profile, profileLoading, navigate]);

    const [step, setStep] = useState<OnboardingStep>('profile');
    const [loading, setLoading] = useState(false);

    // Form State
    const [profileType, setProfileType] = useState<'owner' | 'worker' | null>(null);
    const [businessName, setBusinessName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const [businessType, setBusinessType] = useState<'solo' | 'team' | null>(null);
    const [teamSize, setTeamSize] = useState<string>(''); // Vazio, '2-5', '6-10', etc

    const [logisticsType, setLogisticsType] = useState<'unit' | 'home' | 'hybrid' | null>(null);
    const [mobilityForm, setMobilityForm] = useState({ base_fee: '5', price_per_km: '0.50', coverage_radius_km: '10' });

    // Create Unit and finish flow
    const handleFinishOwner = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Create Unit
            const { data: unit, error: unitError } = await supabase
                .from('units')
                .insert({
                    owner_id: user.id,
                    name: businessName,
                    business_type: businessType,
                    logistics_type: logisticsType,
                    accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid',
                    coverage_radius_km: (logisticsType === 'home' || logisticsType === 'hybrid') ? parseFloat(mobilityForm.coverage_radius_km) || 0 : 0,
                })
                .select()
                .single();

            if (unitError) throw unitError;

            // 2. Add as Team Member (Owner is also a professional by default)
            await supabase.from('team_members').insert({
                unit_id: unit.id,
                user_id: user.id,
                name: profile?.full_name || 'Owner',
                role: 'Owner/Professional',
                accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid'
            });

            // 3. Mark Onboarding as Completed + save profile preferences
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    business_type: businessType,
                    service_model: logisticsType,
                    team_size: businessType === 'team' ? teamSize : null,
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Create mobility settings if home/hybrid
            if (logisticsType === 'home' || logisticsType === 'hybrid') {
                await supabase.from('mobility_settings').insert({
                    unit_id: unit.id,
                    base_fee: parseFloat(mobilityForm.base_fee) || 0,
                    price_per_km: parseFloat(mobilityForm.price_per_km) || 0,
                });
            }

            // Invalidate queries & redirect
            await queryClient.invalidateQueries();
            setStep('done');
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao configurar a conta', description: 'Por favor, tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFinishWorker = async () => {
        // In a real scenario, this would send an invite request.
        // For now, marks onboarding as complete to unblock.
        if (!user) return;
        setLoading(true);
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            await queryClient.invalidateQueries();
            setStep('done');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro' });
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading || profile?.onboarding_completed) {
        return <div className="min-h-screen bg-background flex flex-col items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header Progress */}
                {step !== 'done' && (
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">LUMINA OS</h1>
                        <div className="flex items-center justify-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", step === 'profile' ? "bg-primary w-6 transition-all" : "bg-primary/20")} />
                            <div className={cn("w-2 h-2 rounded-full", step === 'size' ? "bg-primary w-6 transition-all" : (step === 'logistics' ? "bg-primary" : "bg-primary/20"))} />
                            <div className={cn("w-2 h-2 rounded-full", step === 'logistics' ? "bg-primary w-6 transition-all" : "bg-primary/20")} />
                        </div>
                    </div>
                )}

                {/* STEP 1: Profile */}
                {step === 'profile' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">Bem-vindo(a) ao seu novo sistema</h2>
                            <p className="text-muted-foreground text-sm">Como pretende usar o LUMINA OS?</p>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={() => setProfileType('owner')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                    profileType === 'owner' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", profileType === 'owner' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Criar conta comercial</h3>
                                    <p className="text-xs text-muted-foreground">Sou o dono/gestor de um negócio</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setProfileType('worker')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                    profileType === 'worker' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", profileType === 'worker' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                    <UserCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Participar de empresa existente</h3>
                                    <p className="text-xs text-muted-foreground">Sou um colaborador/prestador</p>
                                </div>
                            </button>
                        </div>

                        {profileType === 'owner' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Label>Nome do seu novo negócio</Label>
                                <Input placeholder="Ex: Barbearia Silva" value={businessName} onChange={e => setBusinessName(e.target.value)} className="h-12" />
                                <Button className="w-full h-12" disabled={!businessName} onClick={() => setStep('size')}>
                                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {profileType === 'worker' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Label>Código da Empresa ou Email do Gestor</Label>
                                <Input placeholder="Pesquisar..." value={joinCode} onChange={e => setJoinCode(e.target.value)} className="h-12" />
                                <Button className="w-full h-12" disabled={!joinCode || loading} onClick={handleFinishWorker}>
                                    {loading ? 'A enviar pedido...' : 'Enviar Pedido para Entrar'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: Size */}
                {step === 'size' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <button onClick={() => setStep('profile')} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                        </button>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">Qual é o tamanho da sua operação?</h2>
                            <p className="text-muted-foreground text-sm">Isto vai organizar o seu menu lateral</p>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={() => setBusinessType('solo')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                    businessType === 'solo' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", businessType === 'solo' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Sou Independente</h3>
                                    <p className="text-xs text-muted-foreground">Trabalho sozinho</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setBusinessType('team')}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                    businessType === 'team' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", businessType === 'team' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Tenho Equipa</h3>
                                    <p className="text-xs text-muted-foreground">Gerir comissões e horários múltiplos</p>
                                </div>
                            </button>
                        </div>

                        {businessType === 'team' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Label>Quantas pessoas na equipa?</Label>
                                <div className="flex gap-2">
                                    {['2-5', '6-10', '11+'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setTeamSize(size)}
                                            className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-colors", teamSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button className="w-full h-12" disabled={!businessType || (businessType === 'team' && !teamSize)} onClick={() => setStep('logistics')}>
                            Continuar <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* STEP 3: Logistics */}
                {step === 'logistics' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <button onClick={() => setStep('size')} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                        </button>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">Onde presta os seus serviços?</h2>
                            <p className="text-muted-foreground text-sm">Configuramos o seu Dashboard com base disto</p>
                        </div>

                        <div className="grid gap-3">
                            <button onClick={() => setLogisticsType('unit')} className={cn("flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left", logisticsType === 'unit' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", logisticsType === 'unit' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-semibold">Meu Espaço (Unidade Física)</h3>
                                </div>
                                <p className="text-xs text-muted-foreground pl-11">Modelo standard. Clientes vêm até si.</p>
                            </button>

                            <button onClick={() => setLogisticsType('home')} className={cn("flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left", logisticsType === 'home' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", logisticsType === 'home' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                        <Bike className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-semibold">Apenas Domicílio (Delivery)</h3>
                                </div>
                                <p className="text-xs text-muted-foreground pl-11">Agendamentos pedem morada. Raio de distância.</p>
                            </button>

                            <button onClick={() => setLogisticsType('hybrid')} className={cn("flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left", logisticsType === 'hybrid' ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", logisticsType === 'hybrid' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-semibold">Híbrido (Ambos)</h3>
                                </div>
                                <p className="text-xs text-muted-foreground pl-11">Oferece serviços nas duas modalidades.</p>
                            </button>
                        </div>

                        <Button className="w-full h-12" disabled={!logisticsType || loading} onClick={handleFinishOwner}>
                            {loading ? 'A preparar a sua conta...' : 'Finalizar Setup'} <CheckCircle2 className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* DONE */}
                {step === 'done' && (
                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold">Tudo Pronto!</h2>
                        <p className="text-muted-foreground">A redirecionar para o seu novo Dashboard...</p>
                    </div>
                )}

            </div>
        </div>
    );
}
