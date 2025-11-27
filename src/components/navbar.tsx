"use client"

import {Menu, X, LogOut, User} from "lucide-react";
import { brand } from "./brand";
import Link from "next/link";
import Image from "next/image";
import logo_meerblick from "../../public/assets/logo_meerblick.png"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";



export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);     
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier l'état de connexion au chargement
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fonction de déconnexion
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
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
            <Link href="/espace-client" className="hover:opacity-80">Espace Client</Link>
            <Link href="/admin" className="hover:opacity-80">Admin</Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <User size={16} />
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="connecter-btn px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {/* {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <LogOut size={16} />
                  )} */}
                  Se déconnecter
                </button>
              </div>
            ) : (
              <Link
                className="connecter-btn px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.primary }}
                href="/login"
              > 
                Se connecter
              </Link>
            )}
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
                href="/espace-client" 
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
              
              {user ? (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 py-2 text-base text-gray-600">
                    <User size={18} />
                    <span>{user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    disabled={loading}
                    className="connecter-btn w-full px-4 py-2 text-base font-semibold text-white transition hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <LogOut size={18} />
                    )}
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="connecter-btn w-full px-4 py-2 text-base font-semibold text-white transition hover:opacity-90 block text-center"
                  style={{ backgroundColor: brand.primary }}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                >
                  Se connecter
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}