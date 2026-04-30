// @ts-nocheck
import { useState, useEffect } from 'react';
import { User, Bell, Shield, ChevronRight, LogOut, Save, X, Smartphone, Moon, DollarSign, Info, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/hooks/useUnit';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

function SettingsRow({
  icon: Icon,
  label,
  sub,
  right,
  onClick,
  className,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left',
        !onClick && 'cursor-default',
        className
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right ?? (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />)}
    </button>
  );
}

export default function SettingsPage() {
  const { data: profile } = useProfile();
  const { data: unit } = useUnit();
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const CURRENCIES = [
    { code: 'EUR', symbol: '€', label: 'Euro (Portugal)' },
    { code: 'BRL', symbol: 'R$', label: 'Real Brasileiro' },
    { code: 'GBP', symbol: '£', label: 'Libra Esterlina' },
    { code: 'USD', symbol: '$', label: 'Dólar Americano' },
  ];

  const { data: sub } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('subscriptions')
        .select('plan_type, status, trial_ends_at')
        .eq('owner_id', user.id)
        .in('status', ['trialing', 'active'])
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const planLabel = sub?.status === 'trialing'
    ? 'Trial (5 dias)'
    : sub?.plan_type === 'annual'
      ? 'Lumina Enterprise ✨'
      : sub?.plan_type === 'monthly'
        ? 'Lumina Pro'
        : 'Sem plano ativo';

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [currency, setCurrency] = useState('EUR');
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  // Carregar preferências guardadas
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : true;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    if (profile?.notifications_enabled !== undefined) {
      setNotifications(profile.notifications_enabled ?? true);
    }
    if ((profile as any)?.currency) {
      setCurrency((profile as any).currency);
    }
  }, [profile]);

  const handleNotificationsChange = async (v: boolean) => {
    setNotifications(v);
    if (!user) return;
    await supabase.from('profiles').update({ notifications_enabled: v } as any).eq('id', user.id);
  };

  const handleDarkModeChange = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
  };

  const handleCurrencyChange = async (code: string) => {
    setCurrency(code);
    setCurrencySheetOpen(false);
    if (!user) return;
    await supabase.from('profiles').update({ currency: code } as any).eq('id', user.id);
  };

  const handleEditProfile = () => {
    setFullName(profile?.full_name || '');
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Perfil atualizado! ✅' });
      setEditingProfile(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast({ title: 'Email de redefinição enviado! 📧', description: 'Verifique a sua caixa de entrada.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao enviar email.' });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Profile Block */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="font-bold text-lg">{profile?.full_name || 'Utilizador'}</p>
          <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
        </div>
      </div>

      {/* Inline profile edit */}
      {editingProfile && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Editar Perfil</p>
            <button onClick={() => setEditingProfile(false)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Nome completo"
          />
          <Button className="w-full" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? 'A guardar...' : 'Guardar'}
          </Button>
        </div>
      )}

      {/* Preferences */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Preferências</p>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          <SettingsRow
            icon={Bell}
            label="Notificações"
            sub="Alertas de agendamento"
            right={<Switch checked={notifications} onCheckedChange={handleNotificationsChange} />}
          />
          <SettingsRow
            icon={Moon}
            label="Modo Escuro"
            sub={`Tema atual: ${darkMode ? 'Escuro' : 'Claro'}`}
            right={<Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />}
          />
          <SettingsRow
            icon={DollarSign}
            label="Moeda"
            sub={`${CURRENCIES.find(c => c.code === currency)?.symbol} ${currency}`}
            onClick={() => setCurrencySheetOpen(true)}
          />
        </div>
      </section>

      {/* Company Info (if owner) */}
      {profile?.user_type === 'owner' && (
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Empresa</p>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            {(unit?.cover_url || unit?.logo_url) && (
              <div className="relative h-24 bg-muted">
                {unit.cover_url && (
                  <img src={unit.cover_url} alt="" className="w-full h-full object-cover" />
                )}
                {unit.logo_url && (
                  <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-xl border-2 border-background overflow-hidden bg-muted">
                    <img src={unit.logo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
            <div className={cn('p-4 space-y-2', (unit?.cover_url || unit?.logo_url) && 'pt-8')}>
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm font-medium">{unit?.name || 'Sua Empresa'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Negócio</p>
                <p className="text-sm font-medium">
                  {unit?.business_type === 'team' ? 'Com Equipa' : 'Independente'}
                  {unit?.logistics_type === 'home' ? ' · Domícilio' :
                   unit?.logistics_type === 'hybrid' ? ' · Híbrido' : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="text-sm font-medium">{planLabel}</p>
              </div>
              <button
                onClick={() => navigate('/unit')}
                className="w-full mt-2 text-xs text-primary font-medium flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-primary/5 transition-colors"
              >
                Gerir empresa <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Account */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Conta</p>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          <SettingsRow icon={User} label="Perfil" sub="Editar nome e informações" onClick={handleEditProfile} />
          <SettingsRow
            icon={Shield}
            label="Segurança"
            sub={sendingReset ? 'A enviar...' : 'Alterar palavra-passe'}
            onClick={handleResetPassword}
          />
          <SettingsRow
            icon={Smartphone}
            label="E-mail"
            sub={user?.email || 'Sem email'}
          />
        </div>
      </section>

      {/* About */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Sobre</p>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          <SettingsRow
            icon={Info}
            label="Versão"
            sub="LUMINA OS v1.0.0"
          />
        </div>
      </section>

      {/* Logout */}
      <div className="bg-card border border-destructive/20 rounded-2xl overflow-hidden">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-destructive/5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-sm font-medium text-destructive">Sair da conta</span>
        </button>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">LUMINA OS v1.0</p>
      </div>

      {/* Currency Sheet */}
      <Sheet open={currencySheetOpen} onOpenChange={setCurrencySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle>Selecionar Moeda</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8 space-y-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all',
                  currency === c.code ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8">{c.symbol}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                </div>
                {currency === c.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
