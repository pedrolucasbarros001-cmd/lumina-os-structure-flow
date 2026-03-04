import { useTranslation } from 'react-i18next';

export default function Services() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('sidebar.services')}</h1>
      <p className="text-muted-foreground mt-2">Em breve.</p>
    </div>
  );
}
