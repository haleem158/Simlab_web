// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { BarChart3, Menu, X } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIMLAB - Tokenomics Simulation Suite',
  description: 'Design, test, and visualize token economies with data-driven models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">SIMLAB</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/token-supply"
              className="text-slate-700 hover:text-blue-600 font-medium transition"
            >
              Token Supply
            </Link>
            <Link
              href="/vesting"
              className="text-slate-700 hover:text-blue-600 font-medium transition"
            >
              Vesting
            </Link>
            <Link
              href="/token-impact"
              className="text-slate-700 hover:text-blue-600 font-medium transition"
            >
              Price Impact
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-blue-600 font-medium transition"
            >
              API Docs
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      </div>
    </nav>
  );
}