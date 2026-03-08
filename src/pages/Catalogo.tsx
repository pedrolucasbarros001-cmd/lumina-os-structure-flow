import { useState } from 'react';
import { Plus, Clock, ToggleLeft, ToggleRight, Scissors, Home, Building2, Search } from 'lucide-react';
import { useServices, Service, useCreateService, useUpdateService } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// ADD SERVICE SHEET
// ─────────────────────────────────────────
function AddServiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const createService = useCreateService();
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: '', price: '', duration: '60', description: '',
        is_active: true, allows_home: false, allows_unit: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createService.mutateAsync({
                name: form.name,
                price: parseFloat(form.price),
                duration: parseInt(form.duration),
                description: form.description,
                is_active: form.is_active,
            });
            toast({ title: 'Serviço criado!' });
            onClose();
            setForm({ name: '', price: '', duration: '60', description: '', is_active: true, allows_home: false, allows_unit: true });
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao criar serviço.' });
        }
    };

    return (
        <Sheet open={open} onOpenChange={o => !o && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Novo Serviço</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1"><Label>Nome do Serviço</Label><Input required placeholder="ex: Corte de Cabelo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Preço (€)</Label><Input required type="number" step="0.01" min="0" placeholder="25.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                        <div className="space-y-1"><Label>Duração (min)</Label><Input required type="number" min="5" placeholder="60" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-1"><Label>Descrição (opcional)</Label><Textarea placeholder="Descrição do serviço..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>

                    {/* Modality toggles */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Modalidade</p>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" /><span>Presencial</span></div>
                            <Switch checked={form.allows_unit} onCheckedChange={v => setForm(f => ({ ...f, allows_unit: v }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-sm"><Home className="w-4 h-4 text-muted-foreground" /><span>Ao Domicílio</span></div>
                            <Switch checked={form.allows_home} onCheckedChange={v => setForm(f => ({ ...f, allows_home: v }))} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={createService.isPending}>Criar Serviço</Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}

// ─────────────────────────────────────────
// SERVICE CARD
// ─────────────────────────────────────────
function ServiceCard({ service }: { service: Service }) {
    const updateService = useUpdateService();
    const { toast } = useToast();
    const toggle = async () => {
        await updateService.mutateAsync({ id: service.id, is_active: !service.is_active });
        toast({ title: service.is_active ? 'Serviço desativado.' : 'Serviço ativado.' });
    };

    return (
        <div className={cn('rounded-2xl border p-4 transition-all', service.is_active ? 'bg-card border-border/50 hover:border-primary/30' : 'bg-muted/20 border-border/30 opacity-60')}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{service.name}</h3>
                        {!service.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-medium">Inativo</span>}
                    </div>
                    {service.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{service.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration}min</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-primary">€{service.price.toFixed(2)}</span>
                    <button onClick={toggle} className="text-muted-foreground hover:text-foreground transition-colors">
                        {service.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
// CATÁLOGO PAGE (Services only)
// ─────────────────────────────────────────
export default function Catalogo() {
    const { data: services = [], isLoading } = useServices();
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const active = filtered.filter(s => s.is_active);
    const inactive = filtered.filter(s => !s.is_active);

    return (
        <div className="flex flex-col h-[calc(100vh-56px)]">
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{active.length} ativo{active.length !== 1 ? 's' : ''}</p>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />Novo Serviço
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Pesquisar serviço..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                        <Scissors className="w-12 h-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-semibold">Sem serviços no catálogo</p>
                            <p className="text-sm text-muted-foreground">Crie o primeiro serviço do seu negócio</p>
                        </div>
                        <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Criar Serviço</Button>
                    </div>
                ) : (
                    <>
                        {active.map(s => <ServiceCard key={s.id} service={s} />)}
                        {inactive.length > 0 && (
                            <>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest pt-2">Inativos</p>
                                {inactive.map(s => <ServiceCard key={s.id} service={s} />)}
                            </>
                        )}
                    </>
                )}
            </div>

            <AddServiceSheet open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
    );
}
