import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Sparkles,
  Zap,
  Building2,
  Users,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'forever',
    description: 'Perfect for personal research and learning',
    icon: Sparkles,
    color: 'flame',
    features: [
      { name: '50 research queries/month', included: true },
      { name: '5 knowledge graph nodes', included: true },
      { name: 'Basic source verification', included: true },
      { name: 'Web search', included: true },
      { name: 'Email support', included: true },
      { name: 'Export to Markdown', included: true },
      { name: 'API access', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom integrations', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For power users and researchers',
    icon: Zap,
    color: 'electric',
    features: [
      { name: '500 research queries/month', included: true },
      { name: 'Unlimited knowledge graph', included: true },
      { name: 'Advanced fact verification', included: true },
      { name: 'Web + Paper + GitHub search', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Export to PDF & Markdown', included: true },
      { name: 'API access', included: true },
      { name: 'Team collaboration (up to 5)', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom integrations', included: false },
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: 79,
    period: 'month',
    description: 'For teams and organizations',
    icon: Users,
    color: 'mint',
    features: [
      { name: 'Unlimited research queries', included: true },
      { name: 'Unlimited knowledge graph', included: true },
      { name: 'Advanced fact verification', included: true },
      { name: 'All search sources', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Export to all formats', included: true },
      { name: 'Full API access', included: true },
      { name: 'Team collaboration (unlimited)', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'custom',
    description: 'For large organizations',
    icon: Building2,
    color: 'silver',
    features: [
      { name: 'Everything in Team', included: true },
      { name: 'Custom AI models', included: true },
      { name: 'On-premise deployment', included: true },
      { name: 'Advanced security & SSO', included: true },
      { name: 'Custom SLAs', included: true },
      { name: 'Dedicated infrastructure', included: true },
      { name: 'White-label options', included: true },
      { name: 'Training & onboarding', included: true },
      { name: 'Custom contracts', included: true },
      { name: 'Unlimited everything', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const comparisons = [
  { feature: 'Research Queries', starter: '50/mo', pro: '500/mo', team: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Knowledge Graph', starter: '5 nodes', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Source Verification', starter: 'Basic', pro: 'Advanced', team: 'Advanced', enterprise: 'Custom' },
  { feature: 'API Access', starter: false, pro: true, team: true, enterprise: true },
  { feature: 'Team Size', starter: '1 user', pro: '1 user', team: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Support', starter: 'Email', pro: 'Priority Email', team: '24/7 Priority', enterprise: 'Dedicated' },
  { feature: 'Export Formats', starter: 'Markdown', pro: 'PDF + Markdown', team: 'All Formats', enterprise: 'Custom' },
];

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      {/* Background */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-flame/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-electric/10 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="relative z-10 pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="flame" className="mb-6">Pricing</Badge>
            <h1 className="display-lg font-display font-bold text-chalk mb-4">
              Choose your research power
            </h1>
            <p className="text-lg text-silver max-w-2xl mx-auto mb-8">
              Start free, scale as you grow. No credit card required to begin.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 cut-card bg-slate border border-smoke">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-flame text-void' 
                    : 'text-silver hover:text-chalk'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-flame text-void' 
                    : 'text-silver hover:text-chalk'
                }`}
              >
                Yearly
                <Badge variant="success" className="text-xs">Save 20%</Badge>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PricingCard plan={plan} billingCycle={billingCycle} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="display-md font-display font-bold text-chalk mb-4">
              Compare plans
            </h2>
          </div>

          <Card className="overflow-hidden cut-card cut-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-smoke">
                    <th className="text-left p-4 text-silver font-medium">Feature</th>
                    <th className="text-center p-4 text-flame font-medium">Starter</th>
                    <th className="text-center p-4 text-electric font-medium">Pro</th>
                    <th className="text-center p-4 text-mint font-medium">Team</th>
                    <th className="text-center p-4 text-silver font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr key={index} className="border-b border-smoke/50">
                      <td className="p-4 text-chalk">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check className="w-5 h-5 text-mint mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-ash mx-auto" />
                          )
                        ) : (
                          <span className="text-silver">{row.starter}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-mint mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-ash mx-auto" />
                          )
                        ) : (
                          <span className="text-silver">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.team === 'boolean' ? (
                          row.team ? (
                            <Check className="w-5 h-5 text-mint mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-ash mx-auto" />
                          )
                        ) : (
                          <span className="text-silver">{row.team}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <Check className="w-5 h-5 text-mint mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-ash mx-auto" />
                          )
                        ) : (
                          <span className="text-silver">{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 px-6 pb-24 bg-slate/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="display-md font-display font-bold text-chalk mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            <FaqItem 
              question="Can I change plans anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate your billing."
            />
            <FaqItem 
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, and wire transfers for Enterprise plans."
            />
            <FaqItem 
              question="Is there a free trial for Pro?"
              answer="Yes, Pro comes with a 14-day free trial. No credit card required to start."
            />
            <FaqItem 
              question="What happens if I exceed my monthly queries?"
              answer="We'll notify you when you're approaching your limit. You can upgrade or purchase additional queries at any time."
            />
            <FaqItem 
              question="Do you offer refunds?"
              answer="We offer a 30-day money-back guarantee for all paid plans. No questions asked."
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <Card variant="elevated" className="p-12 relative overflow-hidden cut-card cut-border">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-flame/10 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="display-md font-display font-bold text-chalk mb-4">
                Ready to start researching smarter?
              </h2>
              <p className="text-lg text-silver mb-8">
                Join thousands of researchers, engineers, and knowledge workers using Nexus.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="electric" size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="lg">
                  Talk to Sales
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ 
  plan, 
  billingCycle 
}: { 
  plan: typeof plans[0]; 
  billingCycle: 'monthly' | 'yearly';
}) {
  const isYearly = billingCycle === 'yearly';
  const price = plan.price === null ? 'Custom' : isYearly ? Math.round(plan.price * 0.8) : plan.price;
  const Icon = plan.icon;

  return (
    <Card 
      className={`h-full flex flex-col relative cut-card cut-border ${plan.popular ? 'border-flame shadow-lg shadow-flame/10' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="flame" className="text-xs">Most Popular</Badge>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className={`w-12 h-12 rounded-xl bg-${plan.color}/10 flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 text-${plan.color}`} />
        </div>

        <h3 className="text-lg font-display font-semibold text-chalk mb-1">{plan.name}</h3>
        <p className="text-sm text-ash mb-4">{plan.description}</p>

        <div className="mb-6">
          <span className="display-md font-display font-bold text-chalk">
            {plan.price === null ? 'Custom' : `$${price}`}
          </span>
          {plan.price !== null && (
            <span className="text-silver">/{plan.period === 'yearly' && isYearly ? 'mo (billed yearly)' : plan.period}</span>
          )}
        </div>

        <Button 
          variant={plan.popular ? 'electric' : 'secondary'}
          className="w-full mb-6"
        >
          {plan.cta}
        </Button>

        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              {feature.included ? (
                <Check className="w-4 h-4 text-mint flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-ash flex-shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${feature.included ? 'text-silver' : 'text-ash'}`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-0 overflow-hidden cut-card cut-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-chalk">{question}</span>
        <ChevronRight className={`w-5 h-5 text-ash transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="px-4 pb-4"
        >
          <p className="text-silver">{answer}</p>
        </motion.div>
      )}
    </Card>
  );
}
