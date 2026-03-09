import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Building2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StaffInvitation {
  id: string;
  unit_id: string;
  email: string;
  name?: string;
  role: string;
  commission_rate: number;
  status: string;
  invited_by: string;
  expires_at: string;
  units: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

type InviteStep = 'loading' | 'welcome' | 'register' | 'accepting' | 'done' | 'error';

export default function StaffInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();

  const [step, setStep] = useState<InviteStep>('loading');
  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', password: '' });

  // Load invitation data
  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setStep('error');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('staff_invitations')
          .select(`
            *,
            units:unit_id (id, name, logo_url)
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({ 
            variant: 'destructive', 
            title: 'Convite inválido',
            description: 'Este convite pode ter expirado ou já foi usado.' 
          });
          setStep('error');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          toast({ 
            variant: 'destructive', 
            title: 'Convite expirado',
            description: 'Este convite já não é válido.' 
          });
          setStep('error');
          return;
        }

        setInvitation(data);
        setForm(prev => ({ ...prev, name: data.name || '' }));
        setStep('welcome');
      } catch (error) {
        console.error('Error loading invitation:', error);
        setStep('error');
      }
    };

    loadInvitation();
  }, [token, toast]);

  // When user becomes available after signup, accept the invite
  useEffect(() => {
    if (user && invitation && step === 'accepting') {
      acceptInvite();
    }
  }, [user, invitation, step]);

  const acceptInvite = async () => {
    if (!user || !invitation || !token) return;

    try {
      const { data, error } = await supabase.rpc('accept_staff_invitation', {
        _token: token,
        _user_id: user.id,
        _user_name: form.name || invitation.name || user.user_metadata?.full_name || '',
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
        setStep('error');
        return;
      }

      setStep('done');
      setTimeout(() => navigate('/agenda'), 2000);
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao aceitar convite',
        description: 'Por favor, tente novamente.' 
      });
      setStep('error');
    }
  };

  const handleRegister = async () => {
    if (!invitation || !form.name || !form.password) return;
    
    setLoading(true);
    try {
      await signUp(invitation.email, form.password, form.name);
      // Set step to 'accepting' — the useEffect will fire acceptInvite when user becomes available
      setStep('accepting');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro no registo',
        description: error.message || 'Por favor, tente novamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptExisting = () => {
    if (user && invitation) {
      setStep('accepting');
      acceptInvite();
    } else {
      setStep('register');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Loading State */}
        {step === 'loading' && (
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">A carregar convite...</p>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Convite Inválido</h2>
              <p className="text-muted-foreground mb-4">
                Este convite pode ter expirado ou já foi usado.
              </p>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>
          </div>
        )}

        {/* Welcome State — The Red Carpet */}
        {step === 'welcome' && invitation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Logo / Brand */}
            <div className="text-center space-y-5">
              <div className="relative mx-auto w-20 h-20">
                {invitation.units?.logo_url ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden glow-card">
                    <img 
                      src={invitation.units.logo_url} 
                      alt={invitation.units.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-card">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center border-2 border-background">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold mb-2">Bem-vindo à equipa!</h1>
                <p className="text-muted-foreground">
                  Foi convidado para integrar a equipa da{' '}
                  <span className="font-semibold text-foreground">{invitation.units?.name}</span>
                </p>
              </div>
            </div>

            {/* Invitation Details Card */}
            <div className="frosted-glass p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Função</span>
                <span className="font-medium text-foreground">{invitation.role}</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{invitation.email}</span>
              </div>
              {invitation.commission_rate > 0 && (
                <>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão</span>
                    <span className="font-semibold text-accent">{invitation.commission_rate}%</span>
                  </div>
                </>
              )}
            </div>

            <Button 
              className="w-full h-12 text-base"
              onClick={handleAcceptExisting}
            >
              Aceitar Convite
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ao aceitar, concorda com os termos de utilização.
            </p>
          </div>
        )}

        {/* Register State — Friction-Free */}
        {step === 'register' && invitation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Complete o seu registo</h2>
              <p className="text-muted-foreground text-sm">
                Crie a sua conta para começar a trabalhar na{' '}
                <span className="font-semibold text-foreground">{invitation.units?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input 
                  value={invitation.email} 
                  disabled 
                  className="bg-muted/50 h-12" 
                />
              </div>

              <div className="space-y-1.5">
                <Label>Nome Completo</Label>
                <Input 
                  placeholder="O seu nome completo"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input 
                  type="password"
                  placeholder="Criar password segura"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="h-12"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base" 
              disabled={!form.name || !form.password || form.password.length < 6 || loading}
              onClick={handleRegister}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {loading ? 'A criar conta...' : 'Criar Conta e Entrar'}
            </Button>
          </div>
        )}

        {/* Accepting State */}
        {step === 'accepting' && (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">A configurar a sua conta...</p>
          </div>
        )}

        {/* Done State — Green Check Laser */}
        {step === 'done' && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 mx-auto rounded-full bg-accent/20 flex items-center justify-center glow-card">
              <CheckCircle2 className="w-12 h-12 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Bem-vindo à equipa!</h2>
              <p className="text-muted-foreground">
                A redirecioná-lo para a sua agenda pessoal...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
