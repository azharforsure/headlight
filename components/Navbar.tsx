import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  if (location.pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 h-[76px] flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-gray-900 group-hover:text-black transition-colors">
            <circle cx="9" cy="16" r="5" fill="currentColor" />
            <path d="M17 11H27" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 16H31" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 21H27" stroke="#F5364E" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-heading font-extrabold text-xl text-gray-900 tracking-wider uppercase">Headlight</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-wide">
            <Link to="/" className="hover:text-brand-red transition-colors">Home</Link>
            <Link to="/agency" className="hover:text-brand-red transition-colors">Agency</Link>
            <Link to="/pricing" className="hover:text-brand-red transition-colors">SaaS Pricing</Link>
            <Link to="/dashboard" className="hover:text-brand-red transition-colors">Platform</Link>
            <Link to="/board" className="hover:text-brand-red transition-colors">Investors</Link>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth" className="text-sm font-bold text-gray-500 hover:text-brand-red uppercase tracking-wide">Log in</Link>
          <Link to="/auth?mode=signup">
            <Button size="sm" variant="red">Start Free Trial</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[76px] left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 md:hidden shadow-lg animate-in slide-in-from-top-5">
          <Link to="/" className="text-gray-600 font-bold uppercase tracking-wide py-2">Home</Link>
          <Link to="/agency" className="text-gray-600 font-bold uppercase tracking-wide py-2">Agency Services</Link>
          <Link to="/pricing" className="text-gray-600 font-bold uppercase tracking-wide py-2">SaaS Pricing</Link>
          <Link to="/dashboard" className="text-gray-600 font-bold uppercase tracking-wide py-2">Platform Demo</Link>
          <Link to="/board" className="text-gray-600 font-bold uppercase tracking-wide py-2">Investor Board</Link>
          <div className="flex flex-col gap-3 mt-4">
            <Link to="/auth" className="text-center py-3 text-gray-600 font-bold uppercase tracking-wide border-b border-gray-100">Log in</Link>
            <Link to="/auth?mode=signup">
              <Button className="w-full" variant="red">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};