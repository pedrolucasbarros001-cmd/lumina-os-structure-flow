import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Calendar, Truck, Users, Check } from 'lucide-react';

export default function Index() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Calendar,
      title: 'Booking Fluido',
      description: 'Agendamentos inteligentes que se adaptam ao seu fluxo de trabalho.',
    },
    {
      icon: Truck,
      title: 'Motor Delivery',
      description: 'Atendimento ao domicílio com cálculo automático de deslocação.',
    },
    {
      icon: Users,
      title: 'CRM de Equipa',
      description: 'Gestão completa de colaboradores, comissões e performance.',
    },
  ];

  const plans = [
    {
      name: 'Mensal',
      price: '69',
      period: '/mês',
      features: ['1 unidade', 'Até 5 colaboradores', 'Agenda ilimitada', 'Motor Delivery'],
      href: '/signup?plan=monthly',
      popular: false,
    },
    {
      name: 'Anual',
      price: '64,75',
      period: '/mês',
      subtext: 'Faturado anualmente (€777)',
      features: ['Até 3 unidades', 'Colaboradores ilimitados', 'Agenda ilimitada', 'Motor Delivery', 'Suporte prioritário'],
      href: '/signup?plan=annual',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto stagger-container">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            A gestão do seu salão,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              onde quer que o cliente esteja.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Agendamentos, equipa, delivery e pagamentos. Tudo numa plataforma elegante e poderosa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <a href="#pricing">Começar</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Tudo o que precisa para escalar
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="glass-card p-8 text-center group hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 scroll-mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            14 dias grátis. Sem cartão de crédito.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative glass-card p-8 flex flex-col ${
                  plan.popular ? 'glow-card ring-2 ring-primary/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.subtext && (
                  <p className="text-sm text-muted-foreground mb-6">{plan.subtext}</p>
                )}
                {!plan.subtext && <div className="mb-6" />}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Link to={plan.href}>Começar Grátis</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} LUMINA OS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
