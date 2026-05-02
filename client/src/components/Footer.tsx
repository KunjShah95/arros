export function Footer() {
  const links = ['About', 'Docs', 'Privacy', 'Terms'];

  return (
    <footer className="py-16 px-6 lg:px-12 bg-[#FAFAF5] border-t border-[#E5E5E0]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-medium">ARROS</span>
          </div>

          <div className="flex items-center gap-6">
            {links.map(link => (
              <a 
                key={link}
                href="#" 
                className="text-sm text-[#6B7B6B] hover:text-[#1A1A1A] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <p className="text-sm text-[#6B7B6B]">
            © 2026 ARROS
          </p>
        </div>
      </div>
    </footer>
  );
}