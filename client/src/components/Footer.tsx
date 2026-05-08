export function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Research Demo', href: '#demo' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      title: 'For Students',
      links: [
        { label: 'Literature Review Guide', href: '#' },
        { label: 'Citation Templates', href: '#' },
        { label: 'PRISMA Checklist', href: '#' },
        { label: 'IEEE Format Guide', href: '#' },
      ],
    },
    {
      title: 'Integrations',
      links: [
        { label: 'Zotero', href: '#' },
        { label: 'Mendeley', href: '#' },
        { label: 'Overleaf', href: '#' },
        { label: 'Notion', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Privacy', href: '#' },
      ],
    },
  ];

  return (
    <footer className="py-16 px-6 lg:px-12 bg-[#1A1A2E] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Top: Brand + CTA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-display text-xl font-medium">ARROS</span>
              <span className="px-2 py-0.5 bg-[#2D4A6F] text-xs rounded">Academic</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              The AI-powered research companion that helps students and researchers write peer-reviewed papers faster.
            </p>
          </div>
          <div className="flex gap-4">
            <a href="/signup" className="px-6 py-2 bg-white text-[#1A1A2E] text-sm font-medium hover:bg-gray-100 rounded">
              Start Free
            </a>
            <a href="#" className="px-6 py-2 border border-white/30 text-sm hover:bg-white/10 rounded">
              Contact Sales
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 ARROS Academic Research OS</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
