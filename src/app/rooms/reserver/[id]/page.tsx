"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Chambre } from "@/lib/type";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Image from "next/image";

interface Client {
  id: string;
  nom: string;
  points_fidelite: number;
  auth_user_id: string;
}

export default function ReservationPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Chambre | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Données de réservation
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [demandes, setDemandes] = useState("");

  // Calculs
  const [nights, setNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [pointsToEarn, setPointsToEarn] = useState(0);

  // Vérification de l'authentification et récupération des données
  useEffect(() => {
    const initializeData = async () => {
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

        if (clientError) {
          console.error("Erreur client:", clientError);
          // Créer un client s'il n'existe pas
          const { data: newClient, error: createError } = await supabase
            .from("client")
            .insert({
              nom: user.email?.split('@')[0] || "Client",
              points_fidelite: 0,
              auth_user_id: user.id,
              role: "client"
            })
            .select()
            .single();

          if (createError) {
            console.error("Erreur création client:", createError);
          } else {
            setClient(newClient);
          }
        } else {
          setClient(clientData);
        }

        // Récupérer les données de la chambre
        const { data: roomData, error: roomError } = await supabase
          .from("chambre")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError || !roomData) {
          console.error("Chambre non trouvée:", roomError);
          router.push("/rooms");
          return;
        }

        setRoom(roomData);

        // Vérifier la disponibilité
        if (!roomData.isDisponible) {
          router.push("/rooms");
          return;
        }

      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        router.push("/rooms");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [roomId, router]);

  // Calcul automatique des prix et points
  useEffect(() => {
    if (!room || !dateDebut || !dateFin) return;

    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      setNights(0);
      setSubtotal(0);
      setTotal(0);
      return;
    }

    setNights(diffDays);

    const nightlyRate = room.tarif;
    const subtotalAmount = diffDays * nightlyRate;
    setSubtotal(subtotalAmount);

    // Système de rabais basé sur les points de fidélité
    let discountPercent = 0;
    if (client) {
      const points = client.points_fidelite;
      if (points >= 1000) discountPercent = 15; // 15% pour 1000+ points
      else if (points >= 500) discountPercent = 10; // 10% pour 500+ points
      else if (points >= 250) discountPercent = 5;  // 5% pour 250+ points
    }

    const discountAmount = (subtotalAmount * discountPercent) / 100;
    setDiscount(discountAmount);
    
    const finalTotal = subtotalAmount - discountAmount;
    setTotal(finalTotal);

    // Points gagnés (1 point par euro dépensé)
    const pointsEarned = Math.floor(finalTotal);
    setPointsToEarn(pointsEarned);

  }, [dateDebut, dateFin, room, client]);

  // Fonction de réservation
  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !client || !room) return;

    if (!dateDebut || !dateFin || nights <= 0) {
      alert("Veuillez sélectionner des dates valides");
      return;
    }

    if (nbPersonnes > room.capacite) {
      alert(`Le nombre de personnes ne peut pas dépasser ${room.capacite}`);
      return;
    }

    setSubmitting(true);

    try {
      // Insérer la réservation
      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .insert({
          date_debut: dateDebut,
          date_fin: dateFin,
          nb_personnes: nbPersonnes,
          montant_total: total,
          rabais_applique: discount,
          date_reservation: new Date().toISOString(),
          statut: "confirmee",
          id_client: client.id,
          id_chambre: room.id
        })
        .select()
        .single();

      if (reservationError) {
        console.error("Erreur de réservation:", reservationError);
        alert("Erreur lors de la réservation. Veuillez réessayer.");
        return;
      }

      // Mettre à jour les points de fidélité du client
      const { error: updateError } = await supabase
        .from("client")
        .update({ 
          points_fidelite: client.points_fidelite + pointsToEarn 
        })
        .eq("id", client.id);

      if (updateError) {
        console.error("Erreur mise à jour points:", updateError);
      }

      // Marquer la chambre comme occupée (optionnel)
      await supabase
        .from("chambre")
        .update({ isDisponible: false })
        .eq("id", room.id);

      // Redirection avec message de succès
      alert("Réservation confirmée ! Merci pour votre confiance.");
      router.push("/rooms");

    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur inattendue s'est produite");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Chargement...</h2>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!room) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Chambre non trouvée</h2>
            <button
              onClick={() => router.push("/rooms")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Retour aux chambres
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      {/* Arrière-plan élégant */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Finaliser votre réservation
            </h1>
            <p className="text-lg text-gray-600">
              Complétez les détails de votre séjour à l'hôtel MEERBLICK
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Informations de la chambre */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-6">
                {/* Image principale */}
                <div className="relative h-64">
                  {room.photos && room.photos.length > 0 ? (
                    <Image
                      src={room.photos[0]}
                      alt={room.type_chambre ?? "Chambre"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Aucune photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold">{room.type_chambre}</h3>
                    <p className="text-sm opacity-90">Chambre #{room.numero}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Caractéristiques */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{room.capacite}</div>
                      <div className="text-sm text-gray-600">Personnes</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">${room.tarif}</div>
                      <div className="text-sm text-gray-600">Par nuit</div>
                    </div>
                  </div>

                  {/* Vue et étage */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Vue: <span className="font-medium text-gray-800">{room.vue}</span></span>
                    <span>Étage: <span className="font-medium text-gray-800">{room.etage}</span></span>
                  </div>

                  {/* Points de fidélité du client */}
                  {client && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-amber-700">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium">Vos points</span>
                        </div>
                        <span className="text-lg font-bold text-amber-800">{client.points_fidelite}</span>
                      </div>
                      {discount > 0 && (
                        <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                          🎉 Rabais fidélité appliqué: ${discount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Formulaire de réservation */}
            <div className="lg:col-span-2">
              <form onSubmit={handleReservation} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Détails de la réservation</h2>
                  <p className="text-gray-600">Veuillez remplir les informations de votre séjour</p>
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date d'arrivée
                    </label>
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de départ
                    </label>
                    <input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      min={dateDebut || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Nombre de personnes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de personnes
                  </label>
                  <select
                    value={nbPersonnes}
                    onChange={(e) => setNbPersonnes(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  >
                    {Array.from({ length: room.capacite }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num} personne{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Demandes spéciales */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Demandes spéciales (optionnel)
                  </label>
                  <textarea
                    value={demandes}
                    onChange={(e) => setDemandes(e.target.value)}
                    placeholder="Lit bébé, vue spécifique, allergies alimentaires..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                {/* Résumé des coûts */}
                {nights > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la réservation</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>{nights} nuit{nights > 1 ? 's' : ''} × ${room.tarif}</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Rabais fidélité</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Points à gagner
                        </span>
                        <span className="font-bold">+{pointsToEarn} points</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || nights <= 0}
                    className={`flex-1 font-semibold py-4 px-6 rounded-lg transition-all duration-300 ${
                      submitting || nights <= 0
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Confirmation...
                      </span>
                    ) : (
                      `Confirmer la réservation - $${total.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
