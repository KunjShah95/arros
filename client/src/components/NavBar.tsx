import { useState, useEffect } from 'react';
import { cn } from '../components/ui';

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
  ];

  const authLinks = [
    { label: 'Log In', href: '/signin', primary: false },
    { label: 'Get Started', href: '/signup', primary: true },
  ];

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled 
        ? 'bg-white border-b border-[#E5E5E0] shadow-sm' 
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="font-display text-xl font-medium text-[#1A1A1A] tracking-tight">
            ARROS
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map(link => (
              <a 
                key={link.label}
                href={link.href} 
                className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-6">
            {authLinks.map(link => (
              <a 
                key={link.label}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  link.primary 
                    ? 'bg-[#C45A3B] text-white px-6 py-2.5 hover:bg-[#B36B4D]' 
                    : 'text-[#6B7B6B] hover:text-[#1A1A1A]'
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-[#1A1A1A]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden py-6 border-t border-[#E5E5E0]">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => (
                <a 
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-[#E5E5E0] my-2" />
              {authLinks.map(link => (
                <a 
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'text-sm',
                    link.primary 
                      ? 'text-[#C45A3B] font-medium' 
                      : 'text-[#6B7B6B]'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}