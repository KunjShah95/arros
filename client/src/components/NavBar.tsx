import { useState, useEffect } from 'react';
import { cn } from '../components/ui';

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled 
        ? 'bg-white border-b border-[#E5E5E0]' 
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="font-display text-xl font-medium text-[#1A1A1A]">
            ARROS
          </a>

          {/* Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#architecture" className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors">
              Architecture
            </a>
            <a href="#capabilities" className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors">
              Capabilities
            </a>
            <a href="#sutras" className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors">
              Sutras
            </a>
          </div>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="/signin" className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors">
              Sign In
            </a>
            <a 
              href="/app"
              className="bg-[#C45A3B] text-white px-6 py-2.5 text-sm hover:bg-[#B36B4D] transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}