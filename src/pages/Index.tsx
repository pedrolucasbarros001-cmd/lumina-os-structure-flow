// Update this page (the content is just a fallback if you fail to update the page)

import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-black tracking-tighter uppercase italic">Lumina OS</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" className="rounded-2xl font-bold uppercase tracking-wider text-xs px-6" onClick={() => navigate('/login')}>
            Entrar
          </Button>
        </div>
      </nav>

      <main className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 mt-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          A Revolução Chegou
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-white">
          A Evolução do <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Seu Negócio</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
          O sistema de gestão definitivo. Automação, agendamentos inteligentes e controle total para marcas do segmento de beleza.
        </p>

        <div className="pt-8">
          <Button
            onClick={() => navigate('/plans')}
            className="h-16 px-10 rounded-[2rem] bg-primary text-white font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-primary/30 flex items-center gap-3 mx-auto"
          >
            Começar Agora <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </main>
    </div>
  );
}
