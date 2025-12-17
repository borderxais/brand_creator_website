'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Briefcase, Menu, ChevronDown } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import '@/styles/portals.css';

const mainNavigation = [
  { name: 'Dashboard', href: '/brandportal/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/brandportal/campaigns', icon: Briefcase },
  { name: 'Creators', href: '/brandportal/creators', icon: Users },
  { name: 'Analysis', href: '/brandportal/analysis', icon: Briefcase },
];

const dropdownNavigation = [
  { name: 'Messages', href: '/brandportal/messages', icon: MessageSquare },
  { name: 'Settings', href: '/brandportal/settings', icon: Settings },
  { name: 'Sign out', icon: LogOut, onClick: () => signOut({ callbackUrl: '/' }) },
];

export default function BrandPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'BRAND') {
      router.push('/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <Loading />;
  }

  return (
    <div className="brand-portal min-h-screen bg-white">
      <nav className="nav-container bg-white shadow-sm pt-4">
        <div className="nav-content">
          <div className="flex h-16 items-center">
            {/* Logo */}
            <Link href="/" className="portal-logo">
              <img
                src="/logo.jpg"
                alt="Cricher AI Logo"
                className="w-6 h-6"
              />
              <span className="text-xl font-bold text-gray-600 whitespace-nowrap">Cricher AI<br />BrandHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="nav-links ml-8">
              {mainNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex items-center ${pathname === item.href ? 'active' : ''}`}
                >
                  <item.icon className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="nav-text">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="ml-4 p-2 text-gray-600 hover:text-gray-900 block lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* User Profile */}
            <div className="ml-auto">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  {session?.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="h-8 w-8 rounded-full ring-2 ring-blue-100"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session?.user?.name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50 border border-gray-100">
                    {dropdownNavigation.map((item) =>
                      item.onClick ? (
                        <button
                          key={item.name}
                          onClick={item.onClick}
                          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm w-full"
                        >
                          <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                          {item.name}
                        </button>
                      ) : (
                        <Link
                          href={item.href!}
                          key={item.href}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          <item.icon className="h-4 w-4 mr-2 text-blue-500" />
                          {item.name}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
              <div className={`mobile-menu py-2 lg:hidden ${showMobileMenu ? 'show' : ''}`}>
                {mainNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link flex items-center ${pathname === item.href ? 'active' : ''}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <item.icon className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="nav-text">{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
