import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Building2 } from 'lucide-react';
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

type InviteStep = 'loading' | 'welcome' | 'register' | 'done' | 'error';

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
            units:unit_id (id, name, logo_url),
            invited_by_profile:profiles!invited_by (full_name)
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

        // Check if expired
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
        
        // If user is already logged in, skip to dashboard
        if (user) {
          await acceptInvite(data);
          return;
        }

        // Pre-fill form with invitation data
        setForm(prev => ({ 
          ...prev, 
          name: data.name || '' 
        }));
        
        setStep('welcome');
      } catch (error) {
        console.error('Error loading invitation:', error);
        setStep('error');
      }
    };

    loadInvitation();
  }, [token, user, toast]);

  const acceptInvite = async (inv: StaffInvitation) => {
    try {
      // Update profile to staff type and link to unit
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'staff',
          invited_via: token,
          linked_unit_id: inv.unit_id,
          onboarding_completed: true,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create team member entry
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          unit_id: inv.unit_id,
          user_id: user?.id,
          name: inv.name || user?.user_metadata?.full_name || form.name,
          role: inv.role,
          is_active: true,
        });

      if (teamError) throw teamError;

      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('staff_invitations')
        .update({ status: 'accepted' })
        .eq('id', inv.id);

      if (inviteError) throw inviteError;

      setStep('done');
      setTimeout(() => navigate('/agenda'), 2000);
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao aceitar convite',
        description: 'Por favor, tente novamente.' 
      });
    }
  };

  const handleRegister = async () => {
    if (!invitation || !form.name || !form.password) return;
    
    setLoading(true);
    try {
      // Create account
      await signUp(invitation.email, form.password, form.name);
      
      // Wait for auth state to update, then accept invite
      // The accept invite logic will run in the useEffect when user is available
      setStep('done');
      setTimeout(() => navigate('/agenda'), 2000);
      
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
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

        {/* Welcome State */}
        {step === 'welcome' && invitation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              {invitation.units?.logo_url ? (
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src={invitation.units.logo_url} 
                    alt={invitation.units.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold mb-2">Bem-vindo à equipa!</h1>
                <p className="text-muted-foreground">
                  Foi convidado por <span className="font-semibold">{invitation.invited_by_profile?.full_name}</span> para integrar a equipa da{' '}
                  <span className="font-semibold text-primary">{invitation.units?.name}</span>
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Função:</span>
                <span className="font-medium">{invitation.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{invitation.email}</span>
              </div>
              {invitation.commission_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comissão:</span>
                  <span className="font-medium">{invitation.commission_rate}%</span>
                </div>
              )}
            </div>

            <Button 
              className="w-full h-12" 
              onClick={() => setStep('register')}
            >
              Aceitar Convite
            </Button>
          </div>
        )}

        {/* Register State */}
        {step === 'register' && invitation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Complete o seu registo</h2>
              <p className="text-muted-foreground text-sm">
                Crie a sua conta para começar a trabalhar
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input 
                  value={invitation.email} 
                  disabled 
                  className="bg-muted/50" 
                />
              </div>

              <div className="space-y-1">
                <Label>Nome Completo</Label>
                <Input 
                  placeholder="O seu nome completo"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <Input 
                  type="password"
                  placeholder="Criar password segura"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button 
              className="w-full h-12" 
              disabled={!form.name || !form.password || loading}
              onClick={handleRegister}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {loading ? 'A criar conta...' : 'Criar Conta e Entrar'}
            </Button>
          </div>
        )}

        {/* Done State */}
        {step === 'done' && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 mx-auto rounded-full bg-success flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
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