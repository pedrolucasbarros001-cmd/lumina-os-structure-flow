import { ChevronDown, Building2, Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { PaywallModal } from '@/components/PaywallModal';
import { LuminaLogo } from '@/components/LuminaLogo';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CompanySwitcher({ collapsed }: { collapsed: boolean }) {
  const { companies, activeCompanyId, setActiveCompanyId, subscription } = useCompany();
  const [open, setOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const active = companies.find(c => c.id === activeCompanyId);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (companies.length === 0) return null;

  const planLabel = subscription?.plan_type === 'annual' ? 'Anual' : 'Mensal';
  const maxCompanies = subscription?.plan_type === 'annual' ? 3 : 1;
  const ownerCompanies = companies.filter(c => c.role === 'owner').length;
  const canAddMore = ownerCompanies < maxCompanies;

  const handleAddCompany = () => {
    if (!canAddMore) {
      setPaywallOpen(true);
      setOpen(false);
      return;
    }
    setOpen(false);
    navigate('/onboarding?new_unit=true');
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white haptic-press lumina-gradient"
        title={active?.name}
      >
        L
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => companies.length > 1 || canAddMore ? setOpen(!open) : null}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all haptic-press",
          "hover:bg-sidebar-accent/50",
          open && "bg-sidebar-accent/50"
        )}
      >
        <div className="w-8 h-8 rounded-lg lumina-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">
          L
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold truncate">{active?.name || 'Empresa'}</p>
          <p className="text-[10px] text-muted-foreground">
            {active?.role === 'owner' ? 'Proprietário' : 'Colaborador'} · {planLabel}
          </p>
        </div>
        {(companies.length > 1 || canAddMore) && (
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 glass-card p-1.5 shadow-xl">
          {companies.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveCompanyId(c.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all haptic-press",
                c.id === activeCompanyId ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white",
                c.id === activeCompanyId
                  ? "lumina-gradient"
                  : "bg-muted text-muted-foreground"
              )}>
                L
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {c.role === 'owner' ? 'Dono' : c.role === 'receptionist' ? 'Receção' : 'Equipa'}
                </p>
              </div>
            </button>
          ))}

          {canAddMore && (
            <button
              onClick={handleAddCompany}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all haptic-press text-muted-foreground mt-1 border-t border-border/30 pt-2"
            >
              <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm">Nova empresa</span>
            </button>
          )}

          {!canAddMore && (
            <button
              onClick={handleAddCompany}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-all haptic-press text-destructive/70 mt-1 border-t border-border/30 pt-2"
            >
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm">Nova empresa (bloqueado)</span>
            </button>
          )}
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        type="units"
        currentPlan={subscription?.plan_type || 'monthly'}
        current={ownerCompanies}
        limit={maxCompanies}
      />
    </div>
  );
}
