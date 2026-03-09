import { useState } from 'react';
import { Plus, UserCog, Phone, Home, Building2, Users, Mail, Send, Copy, Check } from 'lucide-react';
import { useTeamMembers, TeamMember, useCreateTeamMember } from '@/hooks/useTeamMembers';
import { useAppointments } from '@/hooks/useAppointments';
import { useUnit } from '@/hooks/useUnit';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Generate random token
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function AddMemberSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMember = useCreateTeamMember();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', role: 'Técnico', accepts_home_visits: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync(form);
      toast({ title: 'Membro adicionado!' });
      onClose();
      setForm({ name: '', role: 'Técnico', accepts_home_visits: false });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao adicionar membro.' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-4"><SheetTitle>Novo Membro</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Nome</Label><Input required placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Função</Label><Input placeholder="Técnico, Rececionista..." value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} /></div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50">
            <div>
              <p className="text-sm font-medium">Aceita Visitas ao Domicílio</p>
              <p className="text-xs text-muted-foreground">Aparece nos agendamentos delivery</p>
            </div>
            <Switch checked={form.accepts_home_visits} onCheckedChange={v => setForm(f => ({ ...f, accepts_home_visits: v }))} />
          </div>
          <Button type="submit" className="w-full" disabled={createMember.isPending}>Adicionar Membro</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: unit } = useUnit();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    email: '', 
    name: '', 
    role: 'Profissional', 
    commission_rate: [40] 
  });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !user) return;
    
    setLoading(true);
    try {
      const token = generateToken();
      
      const { error } = await supabase
        .from('staff_invitations')
        .insert({
          unit_id: unit.id,
          email: form.email,
          name: form.name || null,
          role: form.role,
          commission_rate: form.commission_rate[0],
          token,
          invited_by: user.id,
        });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      toast({ title: 'Convite criado!' });
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({ variant: 'destructive', title: 'Erro ao criar convite' });
    } finally {
      setLoading(false);
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
    setForm({ email: '', name: '', role: 'Profissional', commission_rate: [40] });
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Convidar Colaborador
          </SheetTitle>
        </SheetHeader>
        
        {!inviteLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input 
                type="email" 
                required 
                placeholder="colaborador@email.com" 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              />
            </div>
            
            <div className="space-y-1">
              <Label>Nome (opcional)</Label>
              <Input 
                placeholder="Nome do colaborador" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              />
            </div>
            
            <div className="space-y-1">
              <Label>Função</Label>
              <Input 
                placeholder="Profissional, Técnico, etc." 
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
            
            <Button type="submit" className="w-full" disabled={loading || !form.email}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Gerar Convite
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Link de Convite:</p>
              <div className="flex items-center gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="text-xs bg-background"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={copyLink}
                >
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
        )}
      </SheetContent>
    </Sheet>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const { data: appointments = [] } = useAppointments();
  const memberAppts = appointments.filter(a => a.team_member_id === member.id && a.status === 'completed');
  const revenue = memberAppts.reduce((s, a) => s + (a.value || 0), 0);
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
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
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
              <Mail className="w-4 h-4 mr-1.5" />Convidar
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Adicionar
            </Button>
          </div>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setInviteOpen(true)}>
                <Mail className="w-4 h-4 mr-2" />Convidar
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
          </div>
        ) : (
          teamMembers.map(m => <MemberCard key={m.id} member={m} />)
        )}
      </div>

      <AddMemberSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}