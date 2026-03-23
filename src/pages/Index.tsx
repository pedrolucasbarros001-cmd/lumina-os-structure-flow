import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LuminaLogo } from '@/components/LuminaLogo';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="flex items-center">
          <LuminaLogo variant="full" size="md" showGradient={true} />
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" className="rounded-2xl font-bold uppercase tracking-wider text-xs px-6" onClick={() => navigate('/login')}>
            Entrar
          </Button>
        </div>
      </nav>

      <main className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 mt-16">
        {/* Logo principal em destaque */}
        <div className="flex justify-center mb-8">
          <LuminaLogo variant="icon-only" size="xl" showGradient={true} />
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
