import { useState, useEffect } from 'react';
import { Plus, Clock, Home, Building2, ToggleLeft, ToggleRight, Scissors, Package, AlertTriangle, Search } from 'lucide-react';
import { useServices, Service, useCreateService, useUpdateService } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product } from '@/hooks/useProducts';
import { SheetFooter } from '@/components/ui/sheet';

// ─────────────────────────────────────────
// ADD/EDIT SERVICE SHEET
// ─────────────────────────────────────────
function ServiceSheet({ open, onClose, service }: { open: boolean; onClose: () => void; service?: Service | null }) {
    const createService = useCreateService();
    const updateService = useUpdateService();
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: '', price: '', duration: '60', description: '',
        is_active: true, allows_home: false, allows_unit: true,
    });

    useEffect(() => {
        if (service) {
            setForm({
                name: service.name,
                price: service.price.toString(),
                duration: service.duration.toString(),
                description: service.description || '',
                is_active: service.is_active,
                allows_home: service.allows_home,
                allows_unit: service.allows_unit,
            });
        } else {
            setForm({ name: '', price: '', duration: '60', description: '', is_active: true, allows_home: false, allows_unit: true });
        }
    }, [service, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                name: form.name,
                price: parseFloat(form.price),
                duration: parseInt(form.duration),
                description: form.description,
                is_active: form.is_active,
                allows_home: form.allows_home,
                allows_unit: form.allows_unit,
            };

            if (service) {
                await updateService.mutateAsync({ id: service.id, ...data });
                toast({ title: 'Serviço atualizado!' });
            } else {
                await createService.mutateAsync(data);
                toast({ title: 'Serviço criado!' });
            }
            onClose();
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao salvar serviço.' });
        }
    };

    return (
        <Sheet open={open} onOpenChange={o => !o && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col bg-black border-zinc-800">
                <SheetHeader className="p-6 border-b border-zinc-800">
                    <SheetTitle className="text-xl font-black text-white px-2">
                        {service ? 'Editar Serviço' : 'Novo Serviço'}
                    </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Serviço</Label>
                        <Input required placeholder="ex: Corte de Cabelo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-12 bg-zinc-900 border-zinc-800 rounded-xl focus:ring-primary/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preço (€)</Label>
                            <Input required type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="h-12 bg-zinc-900 border-zinc-800 rounded-xl focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Duração (min)</Label>
                            <Input required type="number" min="5" placeholder="60" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="h-12 bg-zinc-900 border-zinc-800 rounded-xl focus:ring-primary/20" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição</Label>
                        <Textarea placeholder="Detalhes do serviço..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="bg-zinc-900 border-zinc-800 rounded-xl focus:ring-primary/20 resize-none" />
                    </div>

                    <div className="space-y-4 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Modalidades de Atendimento</p>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Presencial</span>
                                    <span className="text-[10px] text-zinc-500">No estabelecimento</span>
                                </div>
                            </div>
                            <Switch checked={form.allows_unit} onCheckedChange={v => setForm(f => ({ ...f, allows_unit: v }))} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent/10"><Home className="w-4 h-4 text-accent" /></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Ao Domicílio</span>
                                    <span className="text-[10px] text-zinc-500">Vai até o cliente</span>
                                </div>
                            </div>
                            <Switch checked={form.allows_home} onCheckedChange={v => setForm(f => ({ ...f, allows_home: v }))} />
                        </div>
                    </div>
                </form>
                <div className="p-6 border-t border-zinc-800 bg-black">
                    <Button type="submit" onClick={handleSubmit} className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-xs shadow-2xl shadow-primary/20" disabled={createService.isPending || updateService.isPending}>
                        {service ? 'Atualizar Serviço' : 'Criar Serviço'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─────────────────────────────────────────
// SERVICE CARD
// ─────────────────────────────────────────
function ServiceCard({ service, onClick }: { service: any; onClick: () => void }) {
    const updateService = useUpdateService();
    const { toast } = useToast();

    const toggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateService.mutateAsync({ id: service.id, is_active: !service.is_active });
        toast({ title: service.is_active ? 'Serviço desativado.' : 'Serviço ativado.' });
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative rounded-3xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden',
                service.is_active
                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-primary/50 hover:bg-zinc-900'
                    : 'bg-zinc-950/50 border-zinc-900 opacity-60'
            )}
        >
            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 font-black uppercase tracking-tight">
                        <h3 className="text-white text-base truncate">{service.name}</h3>
                        {!service.is_active && <span className="text-[8px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">OFF</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mb-4 line-clamp-1 italic">{service.description || 'Sem descrição'}</p>

                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>{service.duration} MIN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {service.allows_unit && <div className="w-1.5 h-1.5 rounded-full bg-primary" title="Presencial" />}
                            {service.allows_home && <div className="w-1.5 h-1.5 rounded-full bg-accent" title="Domicílio" />}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full gap-4 shrink-0">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-black text-primary">€</span>
                        <span className="text-2xl font-black text-white tracking-tighter">{service.price.toFixed(0)}</span>
                        <span className="text-sm font-black text-zinc-500">.{(service.price % 1).toFixed(2).slice(2)}</span>
                    </div>
                    <button onClick={toggle} className="transition-all hover:scale-110 active:scale-95">
                        {service.is_active ? <ToggleRight className="w-8 h-8 text-primary fill-primary/10" /> : <ToggleLeft className="w-8 h-8 text-zinc-700" />}
                    </button>
                </div>
            </div>

            {service.is_active && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
            )}
        </div>
    );
}

// ─────────────────────────────────────────
// ADD/EDIT PRODUCT SHEET
// ─────────────────────────────────────────
function ProductSheet({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product | null }) {
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: '', brand: '', price: '', stock: '0', low_stock: '5', category: '',
    });

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                brand: product.brand || '',
                price: product.price.toString(),
                stock: product.stock_quantity.toString(),
                low_stock: product.low_stock_threshold.toString(),
                category: product.category || '',
            });
        } else {
            setForm({ name: '', brand: '', price: '', stock: '0', low_stock: '5', category: '' });
        }
    }, [product, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                name: form.name,
                brand: form.brand,
                price: parseFloat(form.price),
                stock_quantity: parseInt(form.stock),
                low_stock_threshold: parseInt(form.low_stock),
                category: form.category,
            };

            if (product) {
                await updateProduct.mutateAsync({ id: product.id, ...data });
                toast({ title: 'Produto atualizado!' });
            } else {
                await createProduct.mutateAsync(data);
                toast({ title: 'Produto criado!' });
            }
            onClose();
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao salvar produto.' });
        }
    };

    return (
        <Sheet open={open} onOpenChange={o => !o && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{product ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1"><Label>Nome do Produto</Label><Input required placeholder="ex: Pomada Premium" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Marca</Label><Input placeholder="ex: Uppercut" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Preço (€)</Label><Input required type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                        <div className="space-y-1"><Label>Stock Atual</Label><Input required type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Aviso de Stock Baixo</Label><Input required type="number" min="0" value={form.low_stock} onChange={e => setForm(f => ({ ...f, low_stock: e.target.value }))} /></div>
                        <div className="space-y-1"><Label>Categoria</Label><Input placeholder="ex: Cabelo" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={createProduct.isPending || updateProduct.isPending}>
                        {product ? 'Salvar Alterações' : 'Criar Produto'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function ProductsTab() {
    const { data: products = [], isLoading } = useProducts();
    const [search, setSearch] = useState('');
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const updateProduct = useUpdateProduct();
    const { toast } = useToast();

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()));

    const toggleActive = async (p: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        await updateProduct.mutateAsync({ id: p.id, is_active: !p.is_active });
        toast({ title: p.is_active ? 'Produto desativado.' : 'Produto ativado.' });
    };

    if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 rounded-3xl bg-zinc-900/50 animate-pulse" />)}</div>;

    return (
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <Input className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 rounded-2xl focus:border-primary/50" placeholder="Pesquisar produto ou marca..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-zinc-950 rounded-3xl border border-zinc-900/50 border-dashed">
                    <div className="p-4 rounded-full bg-zinc-900/50">
                        <Package className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-black uppercase tracking-tight text-white">Nenhum produto</p>
                        <p className="text-xs text-zinc-500">Comece a gerir o seu stock agora.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-zinc-800 font-bold" onClick={() => { setEditProduct(null); setSheetOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />Adicionar Produto
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => { setEditProduct(p); setSheetOpen(true); }}
                            className={cn(
                                'group relative rounded-3xl border p-5 flex items-center gap-5 transition-all duration-300 cursor-pointer',
                                p.is_active
                                    ? (p.stock_quantity <= p.low_stock_threshold ? 'border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10' : 'bg-zinc-900/40 border-zinc-800 hover:border-primary/50 hover:bg-zinc-900')
                                    : 'bg-zinc-950/50 border-zinc-900 opacity-60'
                            )}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50 group-hover:scale-105 transition-transform">
                                <Package className={cn("w-7 h-7", p.stock_quantity <= p.low_stock_threshold ? "text-orange-500" : "text-zinc-500")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="font-black text-white truncate uppercase tracking-tight">{p.name}</p>
                                    {!p.is_active && <span className="text-[8px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">OFF</span>}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{p.brand || 'Marca genérica'}</p>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-3">
                                <p className="font-black text-white text-lg tracking-tighter">€{p.price.toFixed(2)}</p>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border',
                                        p.stock_quantity <= p.low_stock_threshold
                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    )}>
                                        {p.stock_quantity} UN
                                    </div>
                                    <button onClick={(e) => toggleActive(p, e)} className="transition-all hover:scale-110 active:scale-95">
                                        {p.is_active ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-zinc-700" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-800 bg-zinc-900/20 text-zinc-400 font-bold hover:bg-zinc-900 hover:text-white transition-all border-dashed mt-2" onClick={() => { setEditProduct(null); setSheetOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Mais Produto
                    </Button>
                </div>
            )}

            <ProductSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product={editProduct} />
        </div>
    );
}

// ─────────────────────────────────────────
// CATÁLOGO PAGE
// ─────────────────────────────────────────
export default function Catalogo() {
    const { data: services = [], isLoading } = useServices();
    const [editService, setEditService] = useState<Service | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

    const active = services.filter(s => s.is_active);

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            {/* Header / Tabs */}
            <header className="px-6 pt-10 pb-6 border-b border-zinc-900 bg-black/80 backdrop-blur-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tighter">Catálogo Estratégico</h1>
                    <p className="text-zinc-500 text-sm font-medium">Configure sua oferta de serviços e produtos.</p>
                </div>

                <div className="flex p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={cn(
                            'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2',
                            activeTab === 'services' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        <Scissors className="w-4 h-4" /> Serviços
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={cn(
                            'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2',
                            activeTab === 'products' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        <Package className="w-4 h-4" /> Produtos
                    </button>
                </div>
            </header>

            {/* Content Body */}
            <main className="flex-1 overflow-y-auto p-6 pb-24">
                {activeTab === 'services' ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                {active.length} Serviços Ativos
                            </p>
                            <Button size="sm" className="rounded-xl h-10 px-4 font-bold gap-2" onClick={() => { setEditService(null); setSheetOpen(true); }}>
                                <Plus className="w-4 h-4" /> Novo Serviço
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-zinc-900/50 animate-pulse" />)}
                            </div>
                        ) : services.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-950 rounded-[40px] border border-zinc-900/50 border-dashed gap-6">
                                <div className="p-6 rounded-full bg-zinc-900/50">
                                    <Scissors className="w-12 h-12 text-zinc-700" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black text-white uppercase tracking-tighter">Nenhum serviço criado</p>
                                    <p className="text-sm text-zinc-500">Defina os seus serviços para começar a agendar.</p>
                                </div>
                                <Button onClick={() => { setEditService(null); setSheetOpen(true); }} className="h-12 px-8 rounded-2xl font-bold">
                                    <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Serviço
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {active.map(s => <ServiceCard key={s.id} service={s} onClick={() => { setEditService(s); setSheetOpen(true); }} />)}

                                {services.filter(s => !s.is_active).length > 0 && (
                                    <div className="pt-6 space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Serviços Desativados</p>
                                        {services.filter(s => !s.is_active).map(s => (
                                            <ServiceCard key={s.id} service={s} onClick={() => { setEditService(s); setSheetOpen(true); }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <ServiceSheet open={sheetOpen} onClose={() => setSheetOpen(false)} service={editService} />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <ProductsTab />
                    </div>
                )}
            </main>
        </div>
    );
}
