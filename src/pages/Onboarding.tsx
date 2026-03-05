import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, UserCircle2, ArrowRight, Briefcase,
    Users, Store, Bike, MapPin, CheckCircle2,
    ChevronLeft, Sparkles, ShieldCheck
} from 'lucide-react';
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
    const [teamSize, setTeamSize] = useState<string>('');
    const [logisticsType, setLogisticsType] = useState<'unit' | 'home' | 'hybrid' | null>(null);

    const handleFinishOwner = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: unit, error: unitError } = await supabase
                .from('units')
                .insert({
                    owner_id: user.id,
                    name: businessName,
                    business_type: businessType,
                    logistics_type: logisticsType,
                    accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid'
                })
                .select()
                .single();

            if (unitError) throw unitError;

            await supabase.from('team_members').insert({
                unit_id: unit.id,
                user_id: user.id,
                name: profile?.full_name || 'Owner',
                role: 'Owner/Professional',
                accepts_home_visits: logisticsType === 'home' || logisticsType === 'hybrid'
            });

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            if (profileError) throw profileError;

            await queryClient.invalidateQueries();
            setStep('done');
            setTimeout(() => navigate('/dashboard'), 2500);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na configuração', description: 'Não foi possível criar sua empresa. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading || profile?.onboarding_completed) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg z-10">
                {step !== 'done' && (
                    <div className="mb-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Lumina OS</h1>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <div className={cn("h-1 rounded-full transition-all duration-500", step === 'profile' ? "w-12 bg-primary" : "w-4 bg-zinc-800")} />
                            <div className={cn("h-1 rounded-full transition-all duration-500", step === 'size' ? "w-12 bg-primary" : "w-4 bg-zinc-800")} />
                            <div className={cn("h-1 rounded-full transition-all duration-500", step === 'logistics' ? "w-12 bg-primary" : "w-4 bg-zinc-800")} />
                        </div>
                    </div>
                )}

                {step === 'profile' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter">BOAS-VINDAS À ELITE.</h2>
                            <p className="text-zinc-500 font-medium">Como deseja gerir sua operação hoje?</p>
                        </div>

                        <div className="grid gap-4">
                            <OnboardingCard
                                active={profileType === 'owner'}
                                onClick={() => setProfileType('owner')}
                                icon={Building2}
                                title="Criar Minha Empresa"
                                sub="Sou o dono e quero controle total"
                            />
                            <OnboardingCard
                                active={profileType === 'worker'}
                                onClick={() => setProfileType('worker')}
                                icon={UserCircle2}
                                title="Sou Colaborador"
                                sub="Recebi um convite da minha equipa"
                            />
                        </div>

                        {profileType === 'owner' && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Comercial do Negócio</Label>
                                    <Input
                                        placeholder="Ex: Studio High-End"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        className="h-16 bg-zinc-900 border-zinc-800 rounded-2xl text-lg font-bold focus:ring-primary/20 px-6"
                                    />
                                </div>
                                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={!businessName} onClick={() => setStep('size')}>
                                    Continuar para Configurações <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}

                        {profileType === 'worker' && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Código de Acesso</Label>
                                    <Input
                                        placeholder="Digite o código enviado..."
                                        value={joinCode}
                                        onChange={e => setJoinCode(e.target.value)}
                                        className="h-16 bg-zinc-900 border-zinc-800 rounded-2xl text-lg font-bold focus:ring-primary/20 px-6"
                                    />
                                </div>
                                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-widest border border-zinc-800 hover:bg-zinc-900" disabled={!joinCode || loading}>
                                    Validar Acesso <ShieldCheck className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 'size' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                        <button onClick={() => setStep('profile')} className="text-zinc-500 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>

                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter uppercase">Escalabilidade.</h2>
                            <p className="text-zinc-500 font-medium">Qual a dimensão da sua operação?</p>
                        </div>

                        <div className="grid gap-4">
                            <OnboardingCard
                                active={businessType === 'solo'}
                                onClick={() => setBusinessType('solo')}
                                icon={Briefcase}
                                title="Operação Solo"
                                sub="Trabalho de forma independente"
                            />
                            <OnboardingCard
                                active={businessType === 'team'}
                                onClick={() => setBusinessType('team')}
                                icon={Users}
                                title="Gestão de Equipa"
                                sub="Múltiplos profissionais e comissões"
                            />
                        </div>

                        {businessType === 'team' && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-4">
                                {['2-5', '6-10', '11+'].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setTeamSize(size)}
                                        className={cn(
                                            "flex-1 py-4 rounded-2xl border-2 font-black transition-all",
                                            teamSize === size ? "bg-primary border-primary text-white shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}

                        <Button
                            className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                            disabled={!businessType || (businessType === 'team' && !teamSize)}
                            onClick={() => setStep('logistics')}
                        >
                            Definir Logística <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {step === 'logistics' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                        <button onClick={() => setStep('size')} className="text-zinc-500 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>

                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter uppercase">Logística.</h2>
                            <p className="text-zinc-500 font-medium">Onde mágica acontece?</p>
                        </div>

                        <div className="grid gap-4">
                            <OnboardingCard
                                active={logisticsType === 'unit'}
                                onClick={() => setLogisticsType('unit')}
                                icon={Store}
                                title="No Local (Espaço Fixo)"
                                sub="Modelo fixo. Clientes vêm ao espaço."
                            />
                            <OnboardingCard
                                active={logisticsType === 'home'}
                                onClick={() => setLogisticsType('home')}
                                icon={Bike}
                                title="Ao Domicílio"
                                sub="100% Mobile. Vou até o cliente."
                            />
                            <OnboardingCard
                                active={logisticsType === 'hybrid'}
                                onClick={() => setLogisticsType('hybrid')}
                                icon={MapPin}
                                title="Híbrido (Ambos)"
                                sub="Atendimento fixo e entregas/visitas."
                            />
                        </div>

                        <Button
                            className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                            disabled={!logisticsType || loading}
                            onClick={handleFinishOwner}
                        >
                            {loading ? 'Preparando Cockpit...' : 'Ativar Sistema Agora'} <CheckCircle2 className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {step === 'done' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in-95 duration-1000">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-40 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-[40px] bg-emerald-500 flex items-center justify-center shadow-2xl">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Operação Ativa</h2>
                            <p className="text-zinc-500 font-medium max-w-[280px]">Estamos configurando seu Cockpit Real-Time...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function OnboardingCard({ active, onClick, icon: Icon, title, sub }: { active: boolean, onClick: () => void, icon: any, title: string, sub: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-5 p-6 rounded-[32px] border-2 transition-all duration-300 text-left relative overflow-hidden group",
                active
                    ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-zinc-900 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
            )}
        >
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                active ? "bg-primary text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
            )}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-black text-white uppercase tracking-tight">{title}</h3>
                <p className="text-xs text-zinc-500 font-medium">{sub}</p>
            </div>
            {active && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-2xl" />
            )}
        </button>
    );
}
