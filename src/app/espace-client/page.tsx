"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, Clock, Star, Calendar, Users, Award } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface Client {
  id: string;
  nom: string;
  points_fidelite: number;
  auth_user_id: string;
  role: string;
  created_at: string;
}

interface Reservation {
  id: string;
  date_debut: string;
  date_fin: string;
  nb_personnes: number;
  montant_total: number;
  rabais_applique: number;
  date_reservation: string;
  demandes_speciales: string;
  statut: string;
  chambre: {
    id: string;
    numero: string;
    type_chambre: string;
    vue: string;
    etage: number;
    photos: string[];
  };
}

export default function EspaceClientPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour déterminer le niveau de fidélité
  const getFidelityTier = (points: number) => {
    if (points >= 1000) return { name: "Or", color: "#FFD700", icon: "🥇", nextLevel: "Platine", nextThreshold: 2000 };
    if (points >= 500) return { name: "Argent", color: "#C0C0C0", icon: "🥈", nextLevel: "Or", nextThreshold: 1000 };
    return { name: "Bronze", color: "#CD7F32", icon: "🥉", nextLevel: "Argent", nextThreshold: 500 };
  };

  // Charger les données client
  useEffect(() => {
    const loadClientData = async () => {
      try {
        // Vérifier l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Récupérer les données client
        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (clientError || !clientData) {
          console.error("Erreur client:", clientError);
          router.push("/login");
          return;
        }

        setClient(clientData);

        // Récupérer les réservations avec les détails des chambres
        const { data: reservationData, error: reservationError } = await supabase
          .from("reservation")
          .select(`
            *,
            chambre:id_chambre (
              id,
              numero,
              type_chambre,
              vue,
              etage,
              photos
            )
          `)
          .eq("id_client", clientData.id)
          .order("date_reservation", { ascending: false });

        if (reservationError) {
          console.error("Erreur réservations:", reservationError);
        } else {
          setReservations(reservationData || []);
        }

      } catch (error) {
        console.error("Erreur de chargement:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Chargement de votre espace...</h2>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Accès refusé</h2>
            <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page</p>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Se connecter
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const fidelityTier = getFidelityTier(client.points_fidelite);
  const totalSpent = reservations.reduce((sum, res) => sum + res.montant_total, 0);
  const totalSavings = reservations.reduce((sum, res) => sum + res.rabais_applique, 0);
  const memberSince = new Date(client.created_at).getFullYear();
  const upcomingReservations = reservations.filter(r => new Date(r.date_debut) > new Date());

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* En-tête de bienvenue */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Espace Client
                </h1>
                <p className="text-lg text-gray-600">Bonjour, {client.nom}</p>
                <p className="text-sm text-gray-500">Membre depuis {memberSince}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{client.points_fidelite}</div>
                <div className="text-sm text-gray-500">Points fidélité</div>
              </div>
            </div>
          </div>

          {/* Statut de fidélité */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Statut de fidélité</h2>
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Badge niveau */}
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: fidelityTier.color }}
                >
                  {fidelityTier.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold" style={{ color: fidelityTier.color }}>
                    {fidelityTier.name}
                  </div>
                  <div className="text-sm text-gray-500">Niveau actuel</div>
                </div>
              </div>

              {/* Progression */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progression</span>
                  <span>{fidelityTier.nextThreshold - (client.points_fidelite % fidelityTier.nextThreshold)} pts pour {fidelityTier.nextLevel}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((client.points_fidelite % fidelityTier.nextThreshold) / fidelityTier.nextThreshold) * 100)}%`,
                      backgroundColor: fidelityTier.color
                    }}
                  ></div>
                </div>
              </div>

              {/* Avantages */}
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {fidelityTier.name === "Bronze" ? "5%" : fidelityTier.name === "Argent" ? "10%" : "15%"}
                </div>
                <div className="text-sm text-gray-500">Réduction sur vos réservations</div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
              <div className="text-sm text-gray-500">Réservations totales</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(0)}</div>
              <div className="text-sm text-gray-500">Économies réalisées</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">${totalSpent.toFixed(0)}</div>
              <div className="text-sm text-gray-500">Total dépensé</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{upcomingReservations.length}</div>
              <div className="text-sm text-gray-500">Séjours à venir</div>
            </div>
          </div>

          {/* Historique des réservations */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Mes réservations</h2>
            </div>

            <div className="overflow-x-auto">
              {reservations.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chambre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((reservation) => {
                      const isUpcoming = new Date(reservation.date_debut) > new Date();
                      const nights = Math.ceil((new Date(reservation.date_fin).getTime() - new Date(reservation.date_debut).getTime()) / (1000 * 3600 * 24));
                      
                      return (
                        <tr key={reservation.id} className={isUpcoming ? "bg-blue-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.chambre.type_chambre} #{reservation.chambre.numero}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.chambre.vue} - Étage {reservation.chambre.etage}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(reservation.date_debut).toLocaleDateString("fr-FR")} -<br/>
                              {new Date(reservation.date_fin).toLocaleDateString("fr-FR")}
                            </div>
                            <div className="text-sm text-gray-500">{nights} nuit{nights > 1 ? 's' : ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.nb_personnes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">${reservation.montant_total.toFixed(2)}</div>
                            {reservation.rabais_applique > 0 && (
                              <div className="text-sm text-green-600">-${reservation.rabais_applique.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-amber-600">
                              <Star className="w-4 h-4 mr-1 fill-current" />
                              <span className="text-sm font-medium">+{Math.floor(reservation.montant_total)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              reservation.statut === "confirmee" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {reservation.statut === "confirmee" ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Confirmée</>
                              ) : (
                                <><Clock className="w-3 h-3 mr-1" /> En attente</>
                              )}
                            </span>
                            {isUpcoming && (
                              <div className="text-xs text-blue-600 mt-1">À venir</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
                  <p className="text-gray-500 mb-4">Vous n'avez pas encore effectué de réservation</p>
                  <button
                    onClick={() => router.push("/rooms")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Découvrir nos chambres
                  </button>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
      
      <Footer />
    </>
  );
}