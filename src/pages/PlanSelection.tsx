import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PlanSelection() {
    const navigate = useNavigate();

    const handleSelectPlan = (planId: string) => {
        // Navigate to signup with the plan in the query string or state
        navigate(`/signup?plan=${planId}`);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-5xl z-10 space-y-12">
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">Lumina OS</h1>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                        Escolha sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Jornada</span>
                    </h2>
                    <p className="text-zinc-500 font-medium max-w-xl mx-auto text-lg">
                        Sistema de gestão inteligente para salões, barbearias e profissionais de beleza. Elevando a sua operação ao próximo nível.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Starter Plan */}
                    <div className="relative group p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Lumina Essencial</h3>
                                <p className="text-zinc-500 font-medium text-sm h-10">
                                    Perfeito para profissionais liberais e negócios em fase inicial.
                                </p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black tracking-tighter text-white">€0</span>
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">/mês</span>
                            </div>
                            <ul className="space-y-4 py-6 border-y border-zinc-800 text-sm font-medium">
                                {[
                                    'Agendamentos ilimitados',
                                    'Gestão básica de clientes',
                                    'Agenda digital e lembretes',
                                    'Página de agendamento online',
                                    'Atendimento a 1 profissional'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-zinc-600" />
                                        <span className="text-zinc-400">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => handleSelectPlan('free')}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
                            >
                                Começar Grátis
                            </Button>
                        </div>
                    </div>

                    {/* Pro Max Plan */}
                    <div className="relative group p-8 rounded-[2.5rem] bg-zinc-900/60 border border-primary/50 shadow-2xl shadow-primary/10 transition-all duration-300 transform md:-translate-y-4 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                        <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            Mais Escolhido
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">Lumina Pro Max</h3>
                                <p className="text-zinc-400 font-medium text-sm h-10">
                                    Cockpit completo para equipas, automações e escala máxima da operação.
                                </p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black tracking-tighter text-white">€39</span>
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">/mês</span>
                            </div>
                            <ul className="space-y-4 py-6 border-y border-zinc-800 text-sm font-medium">
                                {[
                                    'Tudo do Essencial',
                                    'Gestão multi-profissionais e equipas',
                                    'Painel Financeiro e relatórios complexos',
                                    'Automações e marketing integrado',
                                    'Gestão de estoque e vendas de produtos',
                                    'Catálogo interativo via QR Code'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-primary" />
                                        <span className="text-white">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => handleSelectPlan('promax')}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-white hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                Elevar Minha Empresa <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
