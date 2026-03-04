import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('sidebar.dashboard')}</h1>
      <p className="text-muted-foreground mt-2">Em breve — análises e métricas.</p>
    </div>
  );
}
