import { useState } from 'react';
import { Search, Plus, ChevronRight, UserCircle2, Phone, Mail, Trash2, Pencil, Calendar, X } from 'lucide-react';
import { useClients, Client, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useUserContext } from '@/hooks/useUserContext';
import { useClientAppointments } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

function AddClientSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createClient = useCreateClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient.mutateAsync(form);
      toast({ title: 'Cliente adicionado!' });
      onClose();
      setForm({ name: '', phone: '', email: '' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao adicionar cliente.' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Novo Cliente</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Nome</Label><Input required placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Telefone</Label><Input placeholder="+351 912 345 678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="space-y-1"><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <Button type="submit" className="w-full" disabled={createClient.isPending}>Guardar Cliente</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{client.name}</p>
        <p className="text-xs text-muted-foreground truncate">{client.phone || client.email || 'Sem contacto'}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function ClientDetailSheet({ client, onClose, isStaff }: { client: Client | null; onClose: () => void; isStaff: boolean }) {
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { data: appointments = [], isLoading: apptLoading } = useClientAppointments(client?.id ?? null);
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const handleEdit = () => {
    if (!client) return;
    setForm({ name: client.name, phone: client.phone || '', email: client.email || '' });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      await updateClient.mutateAsync({ id: client.id, name: form.name, phone: form.phone || null, email: form.email || null });
      toast({ title: 'Cliente atualizado!' });
      setEditing(false);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao atualizar cliente.' });
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    try {
      await deleteClient.mutateAsync(client.id);
      toast({ title: 'Cliente removido.' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao remover cliente.' });
    }
  };

  if (!client) return null;

  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Sheet open={!!client} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border/30">
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{client.name}</p>
            <p className="text-xs text-muted-foreground truncate">{client.phone || client.email || 'Sem contacto'}</p>
          </div>
          {!isStaff && (
            <div className="flex gap-1">
              <button onClick={handleEdit} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Edit form */}
          {editing && !isStaff && (
            <form onSubmit={handleSave} className="px-4 py-4 space-y-3 border-b border-border/30 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Editar cliente</p>
              <div className="space-y-1"><Label>Nome</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={updateClient.isPending}>Guardar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          {/* Confirm delete */}
          {confirmDelete && !isStaff && (
            <div className="px-4 py-4 space-y-3 border-b border-border/30 bg-destructive/5">
              <p className="text-sm font-semibold">Remover <span className="text-destructive">{client.name}</span>?</p>
              <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteClient.isPending}>Confirmar</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="px-4 py-4 space-y-2 border-b border-border/30">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Contacto</p>
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {!client.phone && !client.email && (
              <p className="text-sm text-muted-foreground">Sem contacto registado</p>
            )}
          </div>

          {/* Appointment history */}
          <div className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Histórico de Marcações
            </p>
            {apptLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)}</div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem marcações registadas</p>
            ) : (
              <div className="space-y-2">
                {appointments.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {format(parseISO(appt.datetime), "d 'de' MMM yyyy, HH:mm", { locale: pt })}
                      </p>
                      <p className="text-xs text-muted-foreground">{appt.type === 'home' ? '🏠 Ao Domicílio' : '🏪 No Espaço'} · {appt.status}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">€{(appt.value ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { isStaff } = useUserContext();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.includes(query) ||
    c.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Sticky search header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar clientes..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {!isStaff && (
            <Button size="icon" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <UserCircle2 className="w-12 h-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">Sem clientes</p>
              <p className="text-sm text-muted-foreground">
                {isStaff ? 'Nenhum cliente encontrado' : 'Adicione o primeiro cliente'}
              </p>
            </div>
            {!isStaff && (
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Novo Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(client => (
              <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
            ))}
          </div>
        )}
      </div>

      {!isStaff && <AddClientSheet open={addOpen} onClose={() => setAddOpen(false)} />}
      <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} isStaff={isStaff} />
    </div>
  );
}