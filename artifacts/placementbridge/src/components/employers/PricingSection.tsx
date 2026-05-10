import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  CheckCircle2, Sparkles, Users, Building2, ArrowRight,
  Zap, BarChart3, MessageSquare, Globe, ShieldCheck,
  HeadphonesIcon, Infinity
} from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for startups testing the platform",
    icon: Sparkles,
    gradient: "from-gray-500 to-gray-400",
    features: [
      "Post up to 3 jobs",
      "Basic AI matching",
      "10 candidate views/month",
      "Email support",
      "Basic analytics",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "per month",
    description: "For growing companies hiring regularly",
    icon: Building2,
    gradient: "from-blue-600 to-indigo-500",
    popular: true,
    features: [
      "Unlimited job posts",
      "Advanced AI matching",
      "500 candidate views/month",
      "Verified candidate access",
      "Pipeline management",
      "Interview scheduling",
      "Priority support",
      "Basic analytics & reports",
      "Team collaboration (3 seats)",
    ],
    cta: "Start Professional",
    href: "/register?plan=professional",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored pricing",
    description: "For large-scale workforce deployment",
    icon: Globe,
    gradient: "from-purple-600 to-pink-500",
    features: [
      "Unlimited everything",
      "Full AI suite",
      "Unlimited candidate views",
      "Bulk hiring tools",
      "International recruitment",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced analytics & reports",
      "API access",
      "White-label options",
      "Unlimited team seats",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-surface relative overflow-hidden" id="pricing">
      <div className="absolute inset-0 bg-grid-blue opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-400lue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Simple, transparent{" "}
            <span className="text-gradient-blue">pricing</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl border-2 p-8 transition-all duration-500 ${
                plan.highlighted
                  ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-105 bg-surface"
                  : "border-[#2C2C2E] hover:border-blue-200 bg-elevated/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-full px-6 py-1.5 text-xs font-bold shadow-lg shadow-blue-600/25">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5`}>
                <plan.icon className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-100 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-gray-100">{plan.price}</span>
                <span className="text-sm text-gray-400">/{plan.period}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={
                  plan.highlighted
                    ? "w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-full h-12 font-bold shadow-lg shadow-blue-600/25 group"
                    : "w-full bg-elevated text-gray-700 hover:bg-gray-200 rounded-full h-12 font-bold group"
                }
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-elevated rounded-3xl p-10 border border-[#2C2C2E] max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Zap, label: "No Setup Fee", desc: "Start immediately" },
              { icon: Infinity, label: "Cancel Anytime", desc: "No lock-in contracts" },
              { icon: HeadphonesIcon, label: "24/7 Support", desc: "We're here to help" },
              { icon: ShieldCheck, label: "99.9% Uptime", desc: "Enterprise reliability" },
            ].map((item) => (
              <div key={item.label}>
                <item.icon className="h-6 w-6 text-blue-400lue-600 mx-auto mb-2" />
                <div className="font-bold text-gray-100 text-sm">{item.label}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
