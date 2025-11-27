"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/rooms");
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      setErrorMsg("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        switch (error.message) {
          case "Invalid login credentials":
            setErrorMsg("Identifiants incorrects. Vérifiez votre email et mot de passe.");
            break;
          case "Email not confirmed":
            setErrorMsg("Veuillez confirmer votre email avant de vous connecter.");
            break;
          case "Too many requests":
            setErrorMsg("Trop de tentatives. Veuillez réessayer plus tard.");
            break;
          default:
            setErrorMsg("Erreur de connexion. Veuillez réessayer.");
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Petit délai pour l'effet visuel
        setTimeout(() => {
          router.push("/rooms");
        }, 1000);
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setErrorMsg("Une erreur inattendue s'est produite");
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Overlay de floutage */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-md z-50 flex items-center justify-center transition-all duration-300">
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connexion en cours...</h3>
            <p className="text-sm text-gray-600">Veuillez patienter</p>
          </div>
        </div>
      )}

      {/* Arrière-plan authentique avec image d'hôtel */}
      <div 
        className="min-h-screen relative flex items-center justify-center px-4 py-12"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(30, 58, 138, 0.6)), url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMUU0MDhCIi8+CjxwYXRoIGQ9Ik0wIDU0MEwxOTIwIDEwODBWMEwwIDU0MFoiIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iMC4zIi8+CjxwYXRoIGQ9Ik0xOTIwIDU0MEwwIDBWMTA4MEwxOTIwIDU0MFoiIGZpbGw9IiM2MzY2RjEiIGZpbGwtb3BhY2l0eT0iMC4yIi8+Cjwvc3ZnPgo=')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        {/* Particules décoratives */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-16 w-1 h-1 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-20 w-3 h-3 bg-indigo-300 bg-opacity-40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-60 right-32 w-1 h-1 bg-white bg-opacity-50 rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* En-tête authentique */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-6">
              <h1 className="text-5xl font-light text-white mb-3 tracking-wide">
                MEERBLICK
              </h1>
              <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4"></div>
              <p className="text-blue-100 text-lg font-light tracking-wide">H Ô T E L</p>
            </div>
            <p className="text-blue-100 text-base font-light">Bienvenue dans votre espace privé</p>
          </div>

          {/* Formulaire de connexion */}
          <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 backdrop-blur-sm">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-800">{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-300 transform ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Connexion...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Se connecter
                  </div>
                )}
              </button>
            </form>

            {/* Lien de retour */}
            <div className="text-center mt-6">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
