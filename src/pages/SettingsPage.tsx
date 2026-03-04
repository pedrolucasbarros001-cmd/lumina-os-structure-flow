import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('sidebar.settings')}</h1>
      <p className="text-muted-foreground mt-2">Em breve.</p>
    </div>
  );
}
