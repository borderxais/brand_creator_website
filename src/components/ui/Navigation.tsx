'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(true); // Start with desktop view by default

  // Calculate view on mount and window resize
  useEffect(() => {
    const calculateView = () => {
      if (typeof window === 'undefined') return;
      
      const logoWidth = 150;
      const findCreatorsWidth = 120;
      const campaignsWidth = 100;
      const howItWorksWidth = 120;
      const loginWidth = 80;
      const creatorButtonWidth = 140;
      const brandButtonWidth = 140;
      const spacing = 120;
      const minWidth = logoWidth + findCreatorsWidth + campaignsWidth + howItWorksWidth + 
                      loginWidth + creatorButtonWidth + brandButtonWidth + spacing;
      
      setIsDesktopView(window.innerWidth >= minWidth);
    };

    calculateView();
    window.addEventListener('resize', calculateView);
    return () => window.removeEventListener('resize', calculateView);
  }, []);

  // Close menu when screen size changes to desktop view
  useEffect(() => {
    if (isDesktopView) {
      setIsMenuOpen(false);
    }
  }, [isDesktopView]);

  // Don't show navigation in portals
  if (pathname?.startsWith('/brandportal') || pathname?.startsWith('/creatorportal')) {
    return null;
  }

  // Only hide navigation for authenticated users with specific roles
  if (session?.user && (session.user.role === 'BRAND' || session.user.role === 'CREATOR')) {
    return null;
  }

  const navLinks = [
    { href: '/find-creators', label: 'Find Creators', width: '120px' },
    { href: '/campaigns', label: 'Campaigns', width: '100px' },
    { href: '/advertiserservice', label: 'Advertiser Service', width: '150px' },
    { href: '/how-it-works', label: 'How it Works', width: '120px' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="BorderX Logo"
                className="w-6 h-6"
              />
              <span className="text-2xl font-bold text-gray-600 whitespace-nowrap">BorderX</span>
            </Link>
          </div>

          {isDesktopView && (
            <>
              <div className="flex items-center w-full space-x-6 ml-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-base font-medium whitespace-nowrap overflow-hidden ${
                      isActive(link.href)
                        ? 'text-purple-600'
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                    style={{
                      width: link.width,
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {!session && (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-base font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap overflow-hidden text-center"
                    style={{
                      width: '80px',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/join-creator"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap overflow-hidden"
                    style={{
                      width: '140px',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Join as Creator
                  </Link>
                  <Link
                    href="/join-brand"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap overflow-hidden"
                    style={{
                      width: '140px',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Join as Brand
                  </Link>
                </div>
              )}
            </>
          )}

          {!isDesktopView && (
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {!isDesktopView && isMenuOpen && (
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.href)
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!session && (
            <>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/join-creator"
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Join as Creator
              </Link>
              <Link
                href="/join-brand"
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Join as Brand
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
