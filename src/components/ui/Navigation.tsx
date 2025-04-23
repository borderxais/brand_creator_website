'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname() || ''; // Ensure pathname is never undefined
  const router = useRouter();
  const { data: session, status } = useSession(); // Get status too
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(true);

  // Determine current language from URL path - with non-null pathname
  const isChinesePath = pathname.startsWith('/zh');

  // Function to switch language
  const switchLanguage = () => {
    if (isChinesePath) {
      // Switch from Chinese to English
      const englishPath = pathname.replace(/^\/zh/, '') || '/';
      router.push(englishPath);
    } else {
      // Switch from English to Chinese
      const chinesePath = `/zh${pathname}`;
      router.push(chinesePath);
    }
  };

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
      const minWidth =
        logoWidth +
        findCreatorsWidth +
        campaignsWidth +
        howItWorksWidth +
        loginWidth +
        creatorButtonWidth +
        brandButtonWidth +
        spacing;

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

  // Loading state - show placeholder instead of nothing
  if (status === 'loading') {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Don't show navigation in portals - more defensive check
  if (pathname && (pathname.startsWith('/brandportal') || pathname.startsWith('/creatorportal'))) {
    return null;
  }

  // Define navigation links for both languages
  const navLinks = {
    en: [
      { href: '/find-creators', label: 'Find Creators', width: '120px' },
      { href: '/campaigns', label: 'Campaigns', width: '100px' },
      { href: '/advertiserservice', label: 'Advertiser Service', width: '150px' },
      { href: '/how-it-works', label: 'How it Works', width: '120px' },
    ],
    zh: [
      { href: '/zh/find-creators', label: '寻找创作者', width: '120px' },
      { href: '/zh/campaigns', label: '广告活动', width: '100px' },
      { href: '/zh/advertiser-services', label: '广告主服务', width: '150px' },
      { href: '/zh/about', label: '关于我们', width: '120px' },
    ],
  };

  // Select current language navigation items
  const currentNavLinks = isChinesePath ? navLinks.zh : navLinks.en;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href={isChinesePath ? '/zh' : '/'} className="flex items-center gap-3">
              <img src="/logo.jpg" alt="BorderX Logo" className="w-6 h-6" />
              <span className="text-2xl font-bold text-gray-600 whitespace-nowrap">BorderX</span>
            </Link>
          </div>

          {isDesktopView && (
            <>
              <div className="flex items-center w-full space-x-6 ml-8">
                {currentNavLinks.map((link) => (
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
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                {/* Language switcher button */}
                <button
                  onClick={switchLanguage}
                  className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-purple-600 border border-gray-200 rounded"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  {isChinesePath ? 'English' : '中文'}
                </button>

                {/* Show different buttons based on authentication state */}
                {!session ? (
                  // For unauthenticated users - show login and join buttons
                  <>
                    <Link
                      href={isChinesePath ? '/zh/login' : '/login'}
                      className="text-base font-medium text-gray-600 hover:text-purple-600 whitespace-nowrap overflow-hidden text-center"
                      style={{
                        width: '80px',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isChinesePath ? '登录' : 'Log in'}
                    </Link>
                    <Link
                      href={isChinesePath ? '/zh/join-creator' : '/join-creator'}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap overflow-hidden"
                      style={{
                        width: '140px',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isChinesePath ? '成为创作者' : 'Join as Creator'}
                    </Link>
                    <Link
                      href={isChinesePath ? '/zh/join-brand' : '/join-brand'}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap overflow-hidden"
                      style={{
                        width: '140px',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isChinesePath ? '成为品牌' : 'Join as Brand'}
                    </Link>
                  </>
                ) : (
                  // For authenticated users - show user info and dashboard link
                  <>
                    <span className="text-sm text-gray-600">
                      {isChinesePath ? '欢迎，' : 'Welcome, '} 
                      {session.user?.name || (isChinesePath ? '用户' : 'User')}
                    </span>
                    <Link
                      href={session.user?.role === 'BRAND' ? '/brandportal/dashboard' : '/creatorportal/dashboard'}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      {isChinesePath ? '仪表板' : 'Dashboard'}
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {!isDesktopView && (
            <div className="flex items-center">
              {/* Mobile language switcher */}
              <button
                onClick={switchLanguage}
                className="mr-2 p-2 text-gray-400 hover:text-gray-500"
              >
                <Globe className="h-6 w-6" />
              </button>

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
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {!isDesktopView && isMenuOpen && (
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {currentNavLinks.map((link) => (
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
          
          {/* Update mobile menu with authenticated user options */}
          {!session ? (
            <>
              <Link
                href={isChinesePath ? '/zh/login' : '/login'}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {isChinesePath ? '登录' : 'Log in'}
              </Link>
              <Link
                href={isChinesePath ? '/zh/join-creator' : '/join-creator'}
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {isChinesePath ? '成为创作者' : 'Join as Creator'}
              </Link>
              <Link
                href={isChinesePath ? '/zh/join-brand' : '/join-brand'}
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {isChinesePath ? '成为品牌' : 'Join as Brand'}
              </Link>
            </>
          ) : (
            <>
              <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-600">
                {isChinesePath ? '欢迎，' : 'Welcome, '} 
                {session.user?.name || (isChinesePath ? '用户' : 'User')}
              </div>
              <Link
                href={session.user?.role === 'BRAND' ? '/brandportal/dashboard' : '/creatorportal/dashboard'}
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {isChinesePath ? '仪表板' : 'Dashboard'}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
