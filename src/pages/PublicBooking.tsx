import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Public booking page for clients.
// Accessible at /s/:slug — no auth required.
// Displays the unit's services, team, and a fixed bottom booking bar.

const MOCK_SERVICES = [
    { id: '1', name: 'Corte de Cabelo', duration: 45, price: 25, popular: true },
    { id: '2', name: 'Barba Completa', duration: 30, price: 18 },
    { id: '3', name: 'Corte + Barba', duration: 60, price: 38, popular: true },
    { id: '4', name: 'Tratamento Capilar', duration: 50, price: 35 },
];

const MOCK_TEAM = [
    { id: '1', name: 'Pedro Silva', role: 'Barbeiro Sénior', rating: 4.9 },
    { id: '2', name: 'Ana Costa', role: 'Estilista', rating: 4.7 },
];

export default function PublicBooking() {
    const { slug } = useParams<{ slug: string }>();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedPro, setSelectedPro] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    const canBook = selectedService && selectedDate && selectedTime;

    return (
        <div className="min-h-screen bg-background pb-36">
            {/* ── HERO HEADER ── */}
            <div className="relative h-52 bg-gradient-to-br from-primary/80 to-accent/80 overflow-hidden">
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-4 left-4 text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 border border-white/30">
                        <span className="text-2xl font-black text-white">L</span>
                    </div>
                    <h1 className="text-2xl font-bold">Barbearia {slug || 'Lumina'}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.9 (128 avaliações)</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Lisboa</span>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
                {/* ── SERVICES CAROUSEL ── */}
                <section>
                    <h2 className="text-base font-bold mb-3">Escolha o Serviço</h2>
                    <div className="space-y-2">
                        {MOCK_SERVICES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedService(s.id)}
                                className={cn(
                                    'w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left',
                                    selectedService === s.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'
                                )}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{s.name}</p>
                                        {s.popular && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">Popular</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration} min</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary">€{s.price}</span>
                                    {selectedService === s.id && <ChevronRight className="w-4 h-4 text-primary" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── PROFESSIONAL CAROUSEL ── */}
                <section>
                    <h2 className="text-base font-bold mb-3">Escolha o Profissional</h2>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                        {/* Any pro option */}
                        <button
                            onClick={() => setSelectedPro('any')}
                            className={cn('flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-24', selectedPro === 'any' ? 'border-primary bg-primary/5' : 'border-border/50 bg-card')}
                        >
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">✨</div>
                            <p className="text-xs font-medium text-center">Qualquer</p>
                        </button>
                        {MOCK_TEAM.map(pro => (
                            <button
                                key={pro.id}
                                onClick={() => setSelectedPro(pro.id)}
                                className={cn('flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-24', selectedPro === pro.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card')}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-white">
                                    {pro.name.charAt(0)}
                                </div>
                                <p className="text-xs font-medium text-center leading-tight">{pro.name.split(' ')[0]}</p>
                                <span className="text-[10px] text-muted-foreground">⭐ {pro.rating}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── FIXED BOTTOM BOOKING BAR (THE MAGIC) ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-50">
                <div className="max-w-lg mx-auto space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">Data</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full mt-1 h-11 rounded-xl border border-border/50 bg-muted px-3 text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">Hora</label>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                                className="w-full mt-1 h-11 rounded-xl border border-border/50 bg-muted px-3 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    <Button
                        className={cn('w-full h-14 text-base font-bold rounded-2xl transition-all', canBook ? 'bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30' : '')}
                        disabled={!canBook}
                    >
                        <Calendar className="w-5 h-5 mr-2" />
                        {canBook ? 'Confirmar Agendamento' : 'Selecione Serviço, Data e Hora'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
