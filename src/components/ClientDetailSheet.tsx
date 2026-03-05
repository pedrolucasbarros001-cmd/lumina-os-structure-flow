import { useState } from 'react';
import { X, Phone, MessageSquare, Calendar, FileText, ImageIcon, History, Plus, Save } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateClient, useClientAppointments, useClientPhotos, Client } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
    client: Client;
    open: boolean;
    onClose: () => void;
}

export default function ClientDetailSheet({ client, open, onClose }: Props) {
    const [notes, setNotes] = useState(client.notes || '');
    const [preferences, setPreferences] = useState(client.preferences || '');
    const updateClient = useUpdateClient();
    const { data: appointments = [] } = useClientAppointments(client.id);
    const { data: photos = [] } = useClientPhotos(client.id);
    const { toast } = useToast();

    const handleSaveCRM = async () => {
        try {
            await updateClient.mutateAsync({
                id: client.id,
                notes,
                preferences
            });
            toast({ title: 'CRM atualizado!' });
        } catch {
            toast({ variant: 'destructive', title: 'Erro ao salvar notas.' });
        }
    };

    const handleWhatsApp = () => {
        if (!client.phone) return;
        const phone = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
    };

    return (
        <Sheet open={open} onOpenChange={o => !o && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">{client.name}</SheetTitle>
                        <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Visitas</p>
                            <p className="text-xl font-black text-white">{appointments.length}</p>
                        </div>
                        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Faltas</p>
                            <p className={cn("text-xl font-black", appointments.filter(a => a.status === 'no_show').length > 0 ? "text-red-500" : "text-white")}>
                                {appointments.filter(a => a.status === 'no_show').length}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 border-zinc-800 hover:bg-zinc-900 transition-all font-bold" onClick={handleWhatsApp}>
                            <MessageSquare className="w-4 h-4 text-green-500 fill-green-500/10" /> WhatsApp
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 border-zinc-800 hover:bg-zinc-900 transition-all font-bold" onClick={() => window.open(`tel:${client.phone}`, '_self')}>
                            <Phone className="w-4 h-4 text-blue-500 fill-blue-500/10" /> Ligar
                        </Button>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="history" className="flex-1 flex flex-col">
                    <TabsList className="grid grid-cols-3 w-full rounded-none border-b border-border/50 bg-transparent h-12">
                        <TabsTrigger value="history" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent"><History className="w-4 h-4 mr-2" /> Histórico</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent"><FileText className="w-4 h-4 mr-2" /> Notas</TabsTrigger>
                        <TabsTrigger value="gallery" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary bg-transparent"><ImageIcon className="w-4 h-4 mr-2" /> Galeria</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto bg-black">
                        <TabsContent value="history" className="m-0 p-4 space-y-4 outline-none">
                            {appointments.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground bg-zinc-950 rounded-3xl border border-zinc-900/50">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                    <p className="text-sm font-medium">Nenhum histórico encontrado</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.map(appt => (
                                        <div key={appt.id} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 transition-colors space-y-3 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white">{format(parseISO(appt.datetime), "d 'de' MMM", { locale: pt })}</span>
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{format(parseISO(appt.datetime), "EEEE, HH:mm", { locale: pt })}</span>
                                                </div>
                                                <div className={cn('text-[9px] uppercase font-black px-2.5 py-1 rounded-full border',
                                                    appt.status === 'completed' || appt.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        appt.status === 'no_show' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                )}>
                                                    {appt.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-[11px] font-bold text-zinc-400">Ver detalhes</span>
                                                </div>
                                                <span className="text-sm font-black text-white">€{appt.value.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="notes" className="m-0 p-4 space-y-6 outline-none">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Ficha Técnica / Notas
                                </label>
                                <Textarea
                                    placeholder="Procedimentos realizados, fórmulas de cor, etc..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="min-h-[180px] rounded-2xl border-zinc-800 bg-zinc-900/50 focus:border-primary/50 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Scissors className="w-3.5 h-3.5" /> Preferências do Cliente
                                </label>
                                <Textarea
                                    placeholder="Gostos do cliente, café, estilo..."
                                    value={preferences}
                                    onChange={e => setPreferences(e.target.value)}
                                    className="min-h-[100px] rounded-2xl border-zinc-800 bg-zinc-900/50 focus:border-primary/50 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>
                            <Button className="w-full h-14 rounded-2xl gap-2 shadow-2xl shadow-primary/20 font-black uppercase tracking-wider text-xs" onClick={handleSaveCRM}>
                                <Save className="w-4 h-4" /> Atualizar Ficha CRM
                            </Button>
                        </TabsContent>

                        <TabsContent value="gallery" className="m-0 p-4 outline-none">
                            <div className="grid grid-cols-2 gap-3">
                                {photos.map(p => (
                                    <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group relative">
                                        <img src={p.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-[10px] font-bold text-white truncate">{p.description || format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                ))}
                                <button className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-primary/50 hover:text-primary transition-all bg-zinc-900/20 active:scale-95">
                                    <div className="p-3 rounded-full bg-zinc-900">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase">Adicionar Foto</span>
                                </button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}

function Scissors(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="6" cy="6" r="3" />
            <path d="M8.12 8.12 12 12" />
            <path d="M20 4 8.12 15.88" />
            <circle cx="6" cy="18" r="3" />
            <path d="M14.8 14.8 20 20" />
        </svg>
    )
}
