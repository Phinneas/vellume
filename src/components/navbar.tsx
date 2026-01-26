"use client";

import { useAuthStore } from "@/lib/store";
import { authService } from "@/lib/auth-service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, Sparkles, Crown } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { user, token, subscription, setSubscription, setUsage, logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isPremium = subscription?.status === 'active';

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      try {
        const data = await authService.getUserMe(token);
        setSubscription(data.subscription);
        setUsage(data.usage);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, [token, setSubscription, setUsage]);

  const handleSignOut = async () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-[#F4EBD9] border-b-2 border-[#2C3E50] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/write" className="text-2xl font-bold text-[#2C3E50]">
            Vellume
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            <Link
              href="/write"
              className="text-[#2C3E50] hover:font-bold transition-all"
            >
              Write
            </Link>
            <Link
              href="/gallery"
              className="text-[#2C3E50] hover:font-bold transition-all"
            >
              Gallery
            </Link>
            <Link
              href="/settings"
              className="text-[#2C3E50] hover:font-bold transition-all"
            >
              Settings
            </Link>
            
            {/* Premium/Upgrade Button */}
            {isPremium ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-[#2C3E50] rounded-full text-sm font-bold">
                <Crown className="w-4 h-4" />
                Premium
              </div>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-1 px-3 py-1 bg-[#2C3E50] text-[#F4EBD9] rounded-full text-sm font-medium hover:bg-[#1a252f] transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded border border-[#2C3E50] hover:bg-white transition-colors"
            >
              <div className="w-8 h-8 bg-[#2C3E50] rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-[#2C3E50] text-sm">{user?.name || 'User'}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#2C3E50] rounded shadow-lg">
                <div className="px-4 py-2 border-b border-[#2C3E50] text-sm text-[#2C3E50]">
                  {user?.email}
                </div>
                {isPremium && (
                  <div className="px-4 py-2 border-b border-[#2C3E50] text-xs text-amber-600 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium Member
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-[#2C3E50] hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#2C3E50]"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#2C3E50]">
            <Link
              href="/write"
              className="block py-2 px-4 text-[#2C3E50] hover:font-bold"
            >
              Write
            </Link>
            <Link
              href="/gallery"
              className="block py-2 px-4 text-[#2C3E50] hover:font-bold"
            >
              Gallery
            </Link>
            <Link
              href="/settings"
              className="block py-2 px-4 text-[#2C3E50] hover:font-bold"
            >
              Settings
            </Link>
            
            {/* Mobile Premium/Upgrade */}
            {isPremium ? (
              <div className="py-2 px-4 flex items-center gap-1 text-amber-600">
                <Crown className="w-4 h-4" />
                <span className="font-bold">Premium Member</span>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="block py-2 px-4 text-[#2C3E50] hover:font-bold flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            )}
            
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-4 text-[#2C3E50] hover:font-bold flex items-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
