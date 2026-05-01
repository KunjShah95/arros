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
  ChevronDown
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-[#E07A5F]/10 text-[#E07A5F] text-sm font-medium rounded-full mb-6">
            Pricing
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Choose your research power
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Start free, scale as you grow. No credit card required to begin.
          </p>

          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="text-xs text-[#E07A5F] font-medium">Save 20%</span>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="px-4 md:px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <PricingCard plan={plan} billingCycle={billingCycle} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-16 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Compare plans
            </h2>
          </div>

          <Card className="overflow-hidden border border-gray-200 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 text-gray-500 font-medium text-sm">Feature</th>
                    <th className="text-center p-4 text-gray-900 font-medium text-sm">Starter</th>
                    <th className="text-center p-4 text-gray-900 font-medium text-sm">Pro</th>
                    <th className="text-center p-4 text-gray-900 font-medium text-sm">Team</th>
                    <th className="text-center p-4 text-gray-900 font-medium text-sm">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-4 text-gray-700 text-sm">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check className="w-5 h-5 text-[#E07A5F] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600 text-sm">{row.starter}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-[#E07A5F] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600 text-sm">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.team === 'boolean' ? (
                          row.team ? (
                            <Check className="w-5 h-5 text-[#E07A5F] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600 text-sm">{row.team}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <Check className="w-5 h-5 text-[#E07A5F] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-600 text-sm">{row.enterprise}</span>
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

      <div className="px-4 md:px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
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

      <div className="px-4 md:px-6 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="p-10 md:p-14 border border-gray-200 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Ready to start researching smarter?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of researchers, engineers, and knowledge workers building with ARROS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button className="bg-[#E07A5F] hover:bg-[#d06a4f] text-white gap-2 px-6">
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Talk to Sales
              </Button>
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
    <div className="h-full">
      <div className={`relative h-full ${plan.popular ? 'ring-2 ring-[#E07A5F]/30 rounded-xl' : ''}`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-block px-3 py-1 bg-[#E07A5F] text-white text-xs font-medium rounded-full">
              Most Popular
            </span>
          </div>
        )}
        
        <Card className={`h-full flex flex-col border ${plan.popular ? 'border-[#E07A5F]/30' : 'border-gray-200'} rounded-xl`}>
          <div className="p-6 flex-1">
            <div className="w-10 h-10 rounded-lg bg-[#E07A5F]/10 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[#E07A5F]" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

            <div className="mb-5">
              <span className="text-3xl font-semibold text-gray-900">
                {plan.price === null ? 'Custom' : `$${price}`}
              </span>
              {plan.price !== null && (
                <span className="text-gray-500 text-sm ml-1">/{plan.period === 'yearly' && isYearly ? 'mo (billed yearly)' : plan.period}</span>
              )}
            </div>

            <Button 
              className={`w-full mb-5 ${plan.popular ? 'bg-[#E07A5F] hover:bg-[#d06a4f] text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
            >
              {plan.cta}
            </Button>

            <div className="space-y-2.5">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-[#E07A5F] flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-gray-600' : 'text-gray-400'}`}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="p-0 border border-gray-200 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <button
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">{question}</span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: isOpen ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <p className="px-4 pb-4 text-gray-600">{answer}</p>
        </motion.div>
      </Card>
    </motion.div>
  );
}

export default PricingPage;