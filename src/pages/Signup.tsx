import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Signup() {
  const { t } = useTranslation();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'monthly';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already logged in, send to onboarding (ProtectedRoute will handle the rest)
  if (user) {
    return <Navigate to="/onboarding" replace />;
  }

  const planLabel = plan === 'annual' ? 'Anual' : 'Mensal';
  const planPrice = plan === 'annual' ? '€64,75/mês' : '€69/mês';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Criar conta
      await signUp(email, password, fullName);
      
      // 2. Guardar plano
      localStorage.setItem('pending_plan', plan);
      
      // 3. Tentar fazer login automático
      try {
        await signIn(email, password);
        // Se login bem-sucedido, ir direto para Onboarding
        toast({
          title: 'Bem-vindo!',
          description: 'A redirecioná-lo para a configuração...',
        });
        navigate('/onboarding', { replace: true });
      } catch (loginError) {
        // Se login falhar (email não confirmado), pedir para confirmar
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu e-mail para confirmar a conta, depois faça login.',
        });
        navigate('/login', { replace: true });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl glass-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LUMINA OS
            </h1>
          </div>
          <CardTitle className="text-xl">{t('auth.signupTitle')}</CardTitle>
          <CardDescription>{t('auth.signupSubtitle')}</CardDescription>
          <Badge variant="secondary" className="mx-auto mt-2">
            Plano {planLabel} • {planPrice}
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.signup')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
