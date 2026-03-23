import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Percent, Clock, Briefcase, Save, Trash2, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateTeamMember } from '@/hooks/useTeamMembers';
import { useTeamMemberServices, useUpdateTeamMemberServices } from '@/hooks/useTeamMemberServices';
import { useTeamMemberShifts, useUpdateTeamShift, DAYS_LABELS } from '@/hooks/useTeamMemberShifts';
import { useServices } from '@/hooks/useServices';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface EditTeamMemberSheetProps {
  open: boolean;
  onClose: () => void;
  member: any;
}

const MODALITY_OPTIONS = [
  { value: 'unit', label: 'Presencial (Unidade)', description: 'Apenas no local da empresa' },
  { value: 'home', label: 'Domicílio', description: 'Atendimentos em casa do cliente' },
  { value: 'hybrid', label: 'Híbrido', description: 'Presencial + Domicílio' },
];

export default function EditTeamMemberSheet({ open, onClose, member }: EditTeamMemberSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMember = useUpdateTeamMember();
  const { data: services = [] } = useServices();
  const { data: memberServices = [] } = useTeamMemberServices(member?.id);
  const { data: shifts = [] } = useTeamMemberShifts(member?.id);
  const updateServices = useUpdateTeamMemberServices();
  const updateShift = useUpdateTeamShift();

  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    role: '',
    address: '',
    lat: '',
    lng: '',
    commission_rate: [0],
    modality: 'unit',
    accepts_home_visits: false,
  });

  // Shifts state - local
  const [shiftForm, setShiftForm] = useState<Record<string, { is_working: boolean; start_time: string; end_time: string }>>({});

  useEffect(() => {
    if (member && open) {
      setForm({
        name: member.name || '',
        role: member.role || '',
        address: member.address || '',
        lat: member.lat || '',
        lng: member.lng || '',
        commission_rate: [member.commission_rate || 0],
        modality: member.modality || 'unit',
        accepts_home_visits: member.accepts_home_visits || false,
      });
      setSelectedServices(memberServices);

      // Initialize shifts
      const shiftsObj: Record<string, any> = {};
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      days.forEach(day => {
        const shift = shifts.find(s => s.day_of_week === day);
        shiftsObj[day] = {
          is_working: shift?.is_working ?? (day !== 'sat' && day !== 'sun'),
          start_time: shift?.start_time || '09:00',
          end_time: shift?.end_time || '18:00',
        };
      });
      setShiftForm(shiftsObj);
    }
  }, [member, open, memberServices, shifts]);

  const handleSaveInfo = async () => {
    if (!member || !form.name.trim()) {
      toast({ variant: 'destructive', title: 'Por favor preencha o nome' });
      return;
    }

    setSaving(true);
    try {
      await updateMember.mutateAsync({
        id: member.id,
        name: form.name,
        role: form.role,
        address: form.address,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        commission_rate: form.commission_rate[0],
        modality: form.modality,
        accepts_home_visits: form.modality !== 'unit' && form.accepts_home_visits,
      });
      toast({ title: 'Informações guardadas!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao guardar informações' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServices = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await updateServices.mutateAsync({
        teamMemberId: member.id,
        serviceIds: selectedServices,
      });
      toast({ title: 'Serviços atualizados!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar serviços' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShifts = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const shiftsToUpdate = Object.entries(shiftForm).map(([day, shift]) => ({
        day_of_week: day as any,
        ...shift,
      }));

      for (const shift of shiftsToUpdate) {
        const existing = shifts.find(s => s.day_of_week === shift.day_of_week);
        if (existing) {
          await updateShift.mutateAsync({
            id: existing.id,
            is_working: shift.is_working,
            start_time: shift.start_time,
            end_time: shift.end_time,
          });
        }
      }
      toast({ title: 'Horários guardados!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao guardar horários' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] flex flex-col">
        <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur -mx-6 px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Editar Colaborador
          </SheetTitle>
          <SheetDescription>
            {member?.name} — Gerir todos os detalhes profissionais
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-0 -mx-6 mb-4 rounded-none border-b">
            <TabsTrigger value="info" className="rounded-none">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-none">
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="rounded-none">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Horários</span>
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Name & Role */}
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input
                  placeholder="Escreva aqui"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="text-base"
                />
              </div>

              <div className="space-y-1">
                <Label>Função/Título</Label>
                <Input
                  placeholder="Profissional, Técnico, Consultor..."
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="text-base"
                />
              </div>

              {/* Modality Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Modalidade de Trabalho</Label>
                <p className="text-xs text-muted-foreground">Selecione onde este colaborador pode trabalhar</p>
                <div className="space-y-2">
                  {MODALITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setForm(f => ({
                        ...f,
                        modality: option.value,
                        accepts_home_visits: option.value !== 'unit',
                      }))}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border-2 transition-all',
                        form.modality === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/30 bg-muted/20 hover:border-primary/50'
                      )}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Domicílio - Only for home/hybrid */}
              {form.modality !== 'unit' && (
                <>
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <Label className="text-base font-semibold">Endereço Principal</Label>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Endereço</Label>
                        <Input
                          placeholder="Rua, número, cidade"
                          value={form.address}
                          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                          className="text-base"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Latitude</Label>
                          <Input
                            placeholder="Ex: 38.7223"
                            type="number"
                            step="0.0001"
                            value={form.lat}
                            onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Longitude</Label>
                          <Input
                            placeholder="Ex: -9.1393"
                            type="number"
                            step="0.0001"
                            value={form.lng}
                            onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                            className="text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Commission Rate */}
              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label className="text-base font-semibold">Taxa de Comissão</Label>
                    <p className="text-xs text-muted-foreground">Percentagem de ganho do colaborador</p>
                  </div>
                  <div className="text-lg font-bold text-primary">{form.commission_rate[0]}%</div>
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
            </div>

            <Button onClick={handleSaveInfo} disabled={saving} className="w-full mt-6">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Informações'}
            </Button>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 overflow-y-auto space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione os serviços que este colaborador pode prestar
              </p>
              <div className="space-y-2">
                {services.filter(s => s.is_active).map(service => (
                  <div
                    key={service.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border border-border/50 transition-all',
                      selectedServices.includes(service.id)
                        ? 'bg-primary/10 border-primary/50'
                        : 'hover:bg-muted/30'
                    )}
                  >
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedServices([...selectedServices, service.id]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service.id));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.duration}min • €{service.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {services.filter(s => s.is_active).length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Nenhum serviço ativo disponível</p>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSaveServices} disabled={saving} className="w-full mt-6">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Serviços'}
            </Button>
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts" className="flex-1 overflow-y-auto space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-4">
                Defina o horário disponível para cada dia da semana
              </p>
              <div className="space-y-3">
                {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => (
                  <div key={day} className="p-3 rounded-xl border border-border/30 bg-card/50 space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={shiftForm[day]?.is_working ?? true}
                        onCheckedChange={v =>
                          setShiftForm(prev => ({
                            ...prev,
                            [day]: { ...prev[day], is_working: v },
                          }))
                        }
                      />
                      <span className="font-medium text-sm flex-1">{DAYS_LABELS[day]}</span>
                    </div>

                    {shiftForm[day]?.is_working && (
                      <div className="grid grid-cols-2 gap-2 ml-8">
                        <div className="space-y-1">
                          <Label className="text-xs">Início</Label>
                          <Input
                            type="time"
                            value={shiftForm[day]?.start_time || '09:00'}
                            onChange={e =>
                              setShiftForm(prev => ({
                                ...prev,
                                [day]: { ...prev[day], start_time: e.target.value },
                              }))
                            }
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Fim</Label>
                          <Input
                            type="time"
                            value={shiftForm[day]?.end_time || '18:00'}
                            onChange={e =>
                              setShiftForm(prev => ({
                                ...prev,
                                [day]: { ...prev[day], end_time: e.target.value },
                              }))
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveShifts} disabled={saving} className="w-full mt-6">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Horários'}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
