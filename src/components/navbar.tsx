"use client"

import {Menu, X} from "lucide-react";
import { brand } from "./brand";
import Link from "next/link";
import Image from "next/image";
import logo_meerblick from "../../public/assets/logo_meerblick.png"
import { useState } from "react";


export default function Navbar() {
  
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2  mt-4 w-20 h-20">
            <Image
             src={logo_meerblick}
             alt="logo meerblick"
            />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:opacity-80">Accueil</Link>
            <Link href="/rooms" className="hover:opacity-80">Chambres</Link>
            <Link href="/client" className="hover:opacity-80">Espace Client</Link>
            <Link href="/admin" className="hover:opacity-80">Admin</Link>
            <button
              className="connecter-btn px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: brand.primary }}
            >
              Se connecter
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
            onClick={() => setMobileOpen && setMobileOpen((v)=>!v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/90 backdrop-blur">
            <nav className="px-4 py-4 space-y-3">
              <Link 
                href="/" 
                className="block py-2 text-base font-medium text-gray-900 hover:opacity-80"
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                Accueil
              </Link>
              <Link 
                href="/rooms" 
                className="block py-2 text-base font-medium text-gray-900 hover:opacity-80"
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                Chambres
              </Link>
              <Link 
                href="/client" 
                className="block py-2 text-base font-medium text-gray-900 hover:opacity-80"
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                Espace Client
              </Link>
              <Link 
                href="/admin" 
                className="block py-2 text-base font-medium text-gray-900 hover:opacity-80"
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                Admin
              </Link>
              <button
                className="connecter-btn w-full px-4 py-2 text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.primary }}
                onClick={() => setMobileOpen && setMobileOpen(false)}
              >
                Se connecter
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}