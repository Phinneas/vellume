'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vellume-api.buzzuw2.workers.dev';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'premium_monthly' | 'premium_yearly';
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  savings?: string;
}

const plans: Plan[] = [
  {
    id: 'premium_monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    description: 'Perfect for trying out Premium',
    features: [
      { text: 'Unlimited pixel art generations', included: true },
      { text: 'Priority processing', included: true },
      { text: 'High-resolution exports', included: true },
      { text: 'Cancel anytime', included: true },
    ],
  },
  {
    id: 'premium_yearly',
    name: 'Yearly',
    price: '$39.99',
    period: '/year',
    description: 'Best value for committed creators',
    features: [
      { text: 'Unlimited pixel art generations', included: true },
      { text: 'Priority processing', included: true },
      { text: 'High-resolution exports', included: true },
      { text: 'Cancel anytime', included: true },
    ],
    popular: true,
    savings: 'Save 33%',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: 'premium_monthly' | 'premium_yearly') => {
    if (!token) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EBD9] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#2C3E50] text-[#F4EBD9] px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-mono">Upgrade to Premium</span>
          </div>
          <h1 className="text-4xl font-mono font-bold text-[#2C3E50] mb-4">
            Unlock Unlimited Creativity
          </h1>
          <p className="text-lg text-[#2C3E50]/70 font-mono max-w-2xl mx-auto">
            Free users get 3 pixel art generations per week. Upgrade to Premium for unlimited
            creations and exclusive features.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center font-mono">
            {error}
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-8 transition-all hover:shadow-lg ${
                plan.popular
                  ? 'border-[#2C3E50] shadow-md'
                  : 'border-[#2C3E50]/20'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-[#2C3E50] text-[#F4EBD9] px-4 py-1 rounded-full text-sm font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-mono font-bold text-[#2C3E50] mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-mono font-bold text-[#2C3E50]">
                    {plan.price}
                  </span>
                  <span className="text-[#2C3E50]/60 font-mono">{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-mono">
                    {plan.savings}
                  </div>
                )}
                <p className="mt-3 text-sm text-[#2C3E50]/60 font-mono">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-[#2C3E50] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#F4EBD9]" />
                    </div>
                    <span className="text-sm font-mono text-[#2C3E50]">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Subscribe button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 px-6 rounded-lg font-mono font-medium transition-all ${
                  plan.popular
                    ? 'bg-[#2C3E50] text-[#F4EBD9] hover:bg-[#1a252f]'
                    : 'bg-[#2C3E50]/10 text-[#2C3E50] hover:bg-[#2C3E50]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Free tier info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#2C3E50]/60 font-mono">
            Currently on Free tier? You get 3 pixel art generations per week.
          </p>
          <button
            onClick={() => router.push('/write')}
            className="mt-4 text-[#2C3E50] font-mono underline hover:no-underline"
          >
            Continue with Free
          </button>
        </div>
      </div>
    </div>
  );
}
