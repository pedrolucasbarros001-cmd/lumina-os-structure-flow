import { useState } from 'react';
import { Search, Plus, Phone, Mail, ChevronRight, UserCircle2 } from 'lucide-react';
import { useClients, Client, useCreateClient } from '@/hooks/useClients';
import { useUserContext } from '@/hooks/useUserContext';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { isStaff } = useUserContext();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

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
          {/* Hide add button for staff */}
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
              <ClientCard key={client.id} client={client} onClick={() => { }} />
            ))}
          </div>
        )}
      </div>

      {/* Only show sheet for non-staff */}
      {!isStaff && <AddClientSheet open={addOpen} onClose={() => setAddOpen(false)} />}
    </div>
  );
}