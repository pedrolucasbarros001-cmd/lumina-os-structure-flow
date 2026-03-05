import { useState } from 'react';
import { User, Globe, Bell, Shield, ChevronRight, LogOut, Palette } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Profile Block */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="font-bold text-lg">{profile?.full_name || 'Utilizador'}</p>
          <p className="text-sm text-muted-foreground">{profile?.language === 'pt' ? 'Português' : profile?.language || 'pt'}</p>
        </div>
      </div>

      {/* Preferences */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Preferências</p>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          <SettingsRow
            icon={Bell}
            label="Notificações"
            sub="Alertas de agendamento"
            right={<Switch checked={notifications} onCheckedChange={setNotifications} />}
          />
          <SettingsRow icon={Globe} label="Idioma" sub="Português" />
          <SettingsRow icon={Palette} label="Aparência" sub="Tema escuro (padrão)" />
        </div>
      </section>

      {/* Account */}
      <section>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">Conta</p>
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
          <SettingsRow icon={User} label="Perfil" sub="Editar nome e avatar" />
          <SettingsRow icon={Shield} label="Segurança" sub="Alterar palavra-passe" />
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
    </div>
  );
}
