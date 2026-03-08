import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'receptionist' | 'staff';
  commission_rate: number;
}

interface Subscription {
  id: string;
  plan_type: 'monthly' | 'annual';
  status: string;
  expires_at: string | null;
}

interface CompanyContextType {
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string) => void;
  companies: Array<{ id: string; name: string; logo_url: string | null; role: string }>;
  userRole: string | null;
  subscription: Subscription | null;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  activeCompanyId: null,
  setActiveCompanyId: () => {},
  companies: [],
  userRole: null,
  subscription: null,
  isLoading: true,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  // Fetch all companies user belongs to
  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['company_members', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('company_members')
        .select('id, company_id, role, commission_rate')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as CompanyMember[];
    },
    enabled: !!user,
  });

  // Fetch unit details for each membership
  const companyIds = memberships.map(m => m.company_id);
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['company_units', companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('units')
        .select('id, name, logo_url')
        .in('id', companyIds);
      if (error) throw error;
      return data;
    },
    enabled: companyIds.length > 0,
  });

  // Fetch subscription
  const { data: subscription = null } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('owner_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const companies = units.map(u => {
    const membership = memberships.find(m => m.company_id === u.id);
    return { id: u.id, name: u.name, logo_url: u.logo_url, role: membership?.role || 'staff' };
  });

  // Auto-select first company or restore from localStorage
  useEffect(() => {
    if (companies.length > 0 && !activeCompanyId) {
      const stored = localStorage.getItem('lumina_active_company');
      if (stored && companies.some(c => c.id === stored)) {
        setActiveCompanyId(stored);
      } else {
        setActiveCompanyId(companies[0].id);
      }
    }
  }, [companies, activeCompanyId]);

  // Persist selection
  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem('lumina_active_company', activeCompanyId);
    }
  }, [activeCompanyId]);

  const activeMembership = memberships.find(m => m.company_id === activeCompanyId);

  return (
    <CompanyContext.Provider value={{
      activeCompanyId,
      setActiveCompanyId,
      companies,
      userRole: activeMembership?.role || null,
      subscription,
      isLoading: membershipsLoading || unitsLoading,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
