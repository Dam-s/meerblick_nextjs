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
  const [client, setClient] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Vérifier l'état de connexion au chargement
  useEffect(() => {
    const checkUser = async () => {
      if (sessionChecked) return; // Éviter les vérifications multiples
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // Ne pas traiter 'Auth session missing' comme une erreur critique
          if (!error.message.includes('Auth session missing')) {
            console.error("Erreur lors de la vérification de l'utilisateur:", error);
          }
          setUser(null);
          setClient(null);
          setSessionChecked(true);
          return;
        }
        
        setUser(user);
        
        if (user) {
          // Récupérer les données client pour vérifier le rôle
          const { data: clientData, error: clientError } = await supabase
            .from("client")
            .select("*")
            .eq("auth_user_id", user.id)
            .single();
          
          if (!clientError && clientData) {
            setClient(clientData);
          } else {
            setClient(null);
          }
        } else {
          setClient(null);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
        setUser(null);
        setClient(null);
      } finally {
        setSessionChecked(true);
      }
    };
    
    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Ne traiter que les événements importants
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            // Déconnexion : nettoyer immédiatement l'état
            setUser(null);
            setClient(null);
            return;
          }
          
          setUser(session?.user ?? null);
          
          if (session?.user) {
            try {
              // Récupérer les données client pour vérifier le rôle
              const { data: clientData, error } = await supabase
                .from("client")
                .select("*")
                .eq("auth_user_id", session.user.id)
                .single();
              
              if (!error && clientData) {
                setClient(clientData);
              } else {
                setClient(null);
              }
            } catch (error: any) {
              console.error("Erreur lors de la récupération des données client:", error);
              // Ne pas traiter comme une erreur critique si c'est juste une session manquante
              if (!error.message?.includes('Auth session missing')) {
                setClient(null);
              }
            }
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    setLoading(true);
    try {
      // Nettoyer l'état local d'abord pour éviter les erreurs de session
      setUser(null);
      setClient(null);
      setSessionChecked(false);
      
      // Essayer de se déconnecter de Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // Ne pas lever d'erreur si la session était déjà expirée
      if (error && error.message !== 'Auth session missing!') {
        console.error("Erreur lors de la déconnexion:", error);
        // Ne pas afficher d'erreur à l'utilisateur pour les problèmes de session manquante
      }
      
      // Rediriger vers la page d'accueil dans tous les cas
      router.push("/");
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      // Nettoyer l'état même en cas d'erreur
      setUser(null);
      setClient(null);
      setSessionChecked(false);
      
      // Seules certaines erreurs méritent d'être affichées à l'utilisateur
      if (error.message && !error.message.includes('Auth session missing')) {
        alert("Erreur lors de la déconnexion. Vous avez été déconnecté localement.");
      }
      
      // Rediriger même en cas d'erreur
      router.push("/");
    } finally {
      setLoading(false);
    }
  };
  
  
  // Afficher un loading pendant la vérification de session initiale
  if (!sessionChecked) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur supports-backdrop-filter:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 mt-4 w-20 h-20">
              <Image src={logo_meerblick} alt="logo meerblick" />
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

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
            {client && client.role === 'admin' && (
              <Link href="/admin" className="hover:opacity-80">Admin</Link>
            )}
            
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
              {client && client.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="block py-2 text-base font-medium text-gray-900 hover:opacity-80"
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                >
                  Admin
                </Link>
              )}
              
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