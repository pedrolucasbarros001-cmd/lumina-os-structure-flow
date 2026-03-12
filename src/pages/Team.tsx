import { useState } from 'react';
import { Plus, Home, Users, Mail, Send, Copy, Check, Lock, Crown, Clock, X } from 'lucide-react';
import { useTeamMembers, TeamMember, useCreateTeamMember } from '@/hooks/useTeamMembers';
import { useAppointments } from '@/hooks/useAppointments';
import { useUnit } from '@/hooks/useUnit';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Hook to check pending invitations
function usePendingInvitations() {
  const { data: unit } = useUnit();

  return useQuery({
    queryKey: ['pending_invitations', unit?.id],
    queryFn: async () => {
      if (!unit) return [];

      const { data, error } = await supabase
        .from('staff_invitations')
        .select('id, email, name, role, token, expires_at, commission_rate, created_at')
        .eq('unit_id', unit.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!unit,
  });
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hook to check staff limits based on subscription
function useStaffLimit() {
  const { user } = useAuth();
  const { data: unit } = useUnit();

  return useQuery({
    queryKey: ['staff_limit', user?.id, unit?.id],
    queryFn: async () => {
      if (!user || !unit) return { canInvite: false, current: 0, limit: 0, plan: 'monthly' };

      // Get subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('owner_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const plan = sub?.plan_type || 'monthly';

      // Count current staff (excluding owner)
      const { count } = await supabase
        .from('company_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', unit.id)
        .neq('role', 'owner');

      const currentStaff = count || 0;
      const staffLimit = plan === 'annual' ? Infinity : 4; // Monthly: 4 staff, Annual: unlimited

      return {
        canInvite: currentStaff < staffLimit,
        current: currentStaff,
        limit: staffLimit,
        plan,
      };
    },
    enabled: !!user && !!unit,
  });
}

function PaywallModal({ open, onClose, current, limit }: { open: boolean; onClose: () => void; current: number; limit: number }) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="frosted-glass max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-warning" />
          </div>
          <DialogTitle className="text-xl">Limite de equipa atingido</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            O seu plano Mensal permite até {limit} colaboradores.
            Atualmente tem {current} membro{current !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold">Plano Anual</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Colaboradores ilimitados</p>
            <p className="text-2xl font-bold text-primary">€64,75<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
          </div>
          <Button className="w-full" onClick={onClose}>
            Fazer Upgrade
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewMemberSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMember = useCreateTeamMember();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: unit } = useUnit();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'details' | 'access'>('details');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Profissional',
    commission_rate: [40],
    accepts_home_visits: false,
    email: '',
  });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    setStep('access');
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !user || !form.email.trim()) return;

    setLoading(true);
    try {
      const token = generateToken();

      const { error } = await supabase
        .from('staff_invitations')
        .insert({
          unit_id: unit.id,
          email: form.email,
          name: form.name,
          role: form.role,
          commission_rate: form.commission_rate[0],
          token,
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      toast({ title: 'Convite criado!' });
      queryClient.invalidateQueries({ queryKey: ['pending_invitations', unit.id] });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar convite' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWithoutAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync({
        name: form.name,
        role: form.role,
        accepts_home_visits: form.accepts_home_visits,
      });
      toast({ title: 'Membro adicionado!' });
      handleClose();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao adicionar membro' });
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copiado!' });
    }
  };

  const handleClose = () => {
    setStep('details');
    setForm({ name: '', role: 'Profissional', commission_rate: [40], accepts_home_visits: false, email: '' });
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Novo Membro
          </SheetTitle>
        </SheetHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Link de Convite:</p>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs bg-background" />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Envie este link para <strong>{form.email}</strong>.
              <br />O convite expira em 7 dias.
            </p>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        ) : step === 'details' ? (
          <form onSubmit={handleStepOne} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome completo *</Label>
              <Input
                required
                placeholder="Nome do colaborador"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Função</Label>
              <Input
                placeholder="Profissional, Técnico, Rececionista..."
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Taxa de Comissão</Label>
                <span className="text-sm font-semibold text-primary">{form.commission_rate[0]}%</span>
              </div>
              <Slider
                value={form.commission_rate}
                onValueChange={v => setForm(f => ({ ...f, commission_rate: v }))}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50">
              <div>
                <p className="text-sm font-medium">Aceita Visitas ao Domicílio</p>
                <p className="text-xs text-muted-foreground">Aparece nos agendamentos delivery</p>
              </div>
              <Switch
                checked={form.accepts_home_visits}
                onCheckedChange={v => setForm(f => ({ ...f, accepts_home_visits: v }))}
              />
            </div>

            <Button type="submit" className="w-full">
              Continuar →
            </Button>
          </form>
        ) : (
          <form className="space-y-4">
            <div className="font-semibold text-center">Como este membro vai aceder?</div>

            {/* Option A: Invite by email */}
            <div className="glass-card p-4 rounded-2xl border border-border/50">
              <div className="flex items-start gap-3 mb-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Enviar Convite por Email</p>
                  <p className="text-xs text-muted-foreground">O membro recebe um link para criar conta</p>
                </div>
              </div>

              <Input
                type="email"
                placeholder="Email do colaborador"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="mb-3"
              />

              <Button
                onClick={handleInviteByEmail}
                className="w-full"
                disabled={loading || !form.email.trim()}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Convite
              </Button>
            </div>

            {/* Option B: Add without access */}
            <div className="glass-card p-4 rounded-2xl border border-border/50">
              <div className="flex items-start gap-3 mb-3">
                <Users className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Adicionar sem Acesso ao Sistema</p>
                  <p className="text-xs text-muted-foreground">O membro aparece na agenda mas não tem login</p>
                </div>
              </div>

              <Button
                onClick={handleAddWithoutAccess}
                variant="outline"
                className="w-full"
                disabled={createMember.isPending}
              >
                {createMember.isPending ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Adicionar Mesmo Assim
              </Button>
            </div>

            <Button onClick={() => setStep('details')} variant="ghost" className="w-full">
              ← Voltar
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PendingInvitationCard({ invitation }: { invitation: any }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const expiresIn = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  const copyLink = () => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copiado!' });
  };

  const displayName = invitation.name || invitation.email;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning/40 to-orange-400/40 flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold truncate">{displayName}</p>
          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-600 shrink-0">
            Pendente
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{invitation.role}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Expira em {expiresIn} dia{expiresIn !== 1 ? 's' : ''}
        </div>
      </div>
      <Button size="icon" variant="outline" onClick={copyLink}>
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const { data: appointments = [] } = useAppointments();
  const memberAppts = appointments.filter(a => a.team_member_id === member.id && a.status === 'completed');
  const revenue = memberAppts.reduce((s, a) => s + (a.value || 0), 0);
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{member.name}</p>
          {member.accepts_home_visits && (
            <Home className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{member.role}</p>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-muted-foreground">{memberAppts.length} atendimentos</span>
          {revenue > 0 && <span className="text-primary font-semibold">€{revenue.toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { data: pendingInvitations = [] } = usePendingInvitations();
  const { data: staffLimit } = useStaffLimit();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const handleNewMemberClick = () => {
    if (staffLimit && !staffLimit.canInvite) {
      setPaywallOpen(true);
    } else {
      setSheetOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''}
            {pendingInvitations.length > 0 && ` • ${pendingInvitations.length} convite${pendingInvitations.length !== 1 ? 's' : ''} pendente${pendingInvitations.length !== 1 ? 's' : ''}`}
          </p>
          <Button size="sm" onClick={handleNewMemberClick}>
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Membro
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">Sem membros de equipa</p>
              <p className="text-sm text-muted-foreground">Adicione a sua equipa para começar</p>
            </div>
            <Button onClick={handleNewMemberClick}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Membro
            </Button>
          </div>
        ) : (
          <>
            {/* Active Members Section */}
            <div className="mb-6">
              {teamMembers.map(m => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">
                  CONVITES PENDENTES ({pendingInvitations.length})
                </p>
                <div className="space-y-3">
                  {pendingInvitations.map(invitation => (
                    <PendingInvitationCard key={invitation.id} invitation={invitation} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NewMemberSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        current={staffLimit?.current || 0}
        limit={staffLimit?.limit || 4}
      />
    </div>
  );
}
