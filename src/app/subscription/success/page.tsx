'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/gallery');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4EBD9] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#2C3E50] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F4EBD9]" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-mono font-bold text-[#2C3E50] mb-4">
          Welcome to Premium! 🎉
        </h1>
        <p className="text-lg text-[#2C3E50]/70 font-mono mb-8">
          You now have unlimited access to pixel art generation and all premium features.
        </p>

        {/* Features unlocked */}
        <div className="bg-white rounded-lg border-2 border-[#2C3E50]/20 p-6 mb-8">
          <h2 className="text-sm font-mono font-bold text-[#2C3E50] mb-4 uppercase tracking-wide">
            Features Unlocked
          </h2>
          <ul className="space-y-3 text-left">
            <li className="flex items-center gap-3 font-mono text-[#2C3E50]">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              Unlimited pixel art generations
            </li>
            <li className="flex items-center gap-3 font-mono text-[#2C3E50]">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              Priority processing
            </li>
            <li className="flex items-center gap-3 font-mono text-[#2C3E50]">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              High-resolution exports
            </li>
          </ul>
        </div>

        {/* Redirect notice */}
        <p className="text-sm text-[#2C3E50]/60 font-mono">
          Redirecting to your gallery in {countdown}...
        </p>

        {/* Manual redirect button */}
        <button
          onClick={() => router.push('/gallery')}
          className="mt-4 text-[#2C3E50] font-mono underline hover:no-underline"
        >
          Go to Gallery now
        </button>
      </div>
    </div>
  );
}
