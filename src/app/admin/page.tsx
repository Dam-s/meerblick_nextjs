"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Chambre } from "@/lib/type";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Bed, 
  Calendar, 
  Search,
  Save,
  X,
  Eye
} from "lucide-react";

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
  id_client: string;
  id_chambre: string;
  chambre?: {
    numero: string;
    type_chambre: string;
  };
  client?: {
    nom: string;
  };
}

type ActiveTab = 'clients' | 'chambres' | 'reservations';
type ModalType = 'create' | 'edit' | 'view' | null;

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('clients');
  
  // Données
  const [clients, setClients] = useState<Client[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Modal
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Formulaires
  const [clientForm, setClientForm] = useState({
    nom: '',
    points_fidelite: 0,
    role: 'client'
  });
  
  const [chambreForm, setChambreForm] = useState({
    numero: '',
    type_chambre: '',
    capacite: 1,
    vue: '',
    etage: 1,
    tarif: 0,
    description: '',
    point_par_nuits: 0,
    isDisponible: true,
    equipements: [] as string[],
    photos: [] as string[]
  });
  
  const [reservationForm, setReservationForm] = useState({
    date_debut: '',
    date_fin: '',
    nb_personnes: 1,
    montant_total: 0,
    rabais_applique: 0,
    demandes_speciales: '',
    statut: 'confirmee',
    id_client: '',
    id_chambre: ''
  });

  // Recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');

  // Vérification admin et chargement des données
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push("/login");
          return;
        }

        // Vérifier si l'utilisateur est admin
        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (clientError || !clientData || clientData.role !== 'admin') {
          router.push("/");
          return;
        }

        setUser(user);
        await loadAllData();
      } catch (error) {
        console.error("Erreur:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [router]);

  // Charger toutes les données
  const loadAllData = async () => {
    await Promise.all([
      loadClients(),
      loadChambres(),
      loadReservations()
    ]);
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from("client")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setClients(data || []);
  };

  const loadChambres = async () => {
    const { data, error } = await supabase
      .from("chambre")
      .select("*")
      .order("numero");
    
    if (!error) setChambres(data || []);
  };

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from("reservation")
      .select(`
        *,
        client:id_client(nom),
        chambre:id_chambre(numero, type_chambre)
      `)
      .order("date_reservation", { ascending: false });
    
    if (!error) setReservations(data || []);
  };

  // Gestion des modals
  const openModal = (type: ModalType, item?: any) => {
    setModalType(type);
    setSelectedItem(item);
    
    if (type === 'edit' && item) {
      if (activeTab === 'clients') {
        setClientForm(item);
      } else if (activeTab === 'chambres') {
        setChambreForm(item);
      } else if (activeTab === 'reservations') {
        setReservationForm(item);
      }
    } else if (type === 'create') {
      // Reset forms
      setClientForm({ nom: '', points_fidelite: 0, role: 'client' });
      setChambreForm({
        numero: '',
        type_chambre: '',
        capacite: 1,
        vue: '',
        etage: 1,
        tarif: 0,
        description: '',
        point_par_nuits: 0,
        isDisponible: true,
        equipements: [],
        photos: []
      });
      setReservationForm({
        date_debut: '',
        date_fin: '',
        nb_personnes: 1,
        montant_total: 0,
        rabais_applique: 0,
        demandes_speciales: '',
        statut: 'confirmee',
        id_client: '',
        id_chambre: ''
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  // CRUD Operations
  const handleSave = async () => {
    try {
      if (activeTab === 'clients') {
        if (modalType === 'create') {
          await supabase.from("client").insert([clientForm]);
        } else if (modalType === 'edit') {
          await supabase.from("client").update(clientForm).eq('id', selectedItem.id);
        }
        await loadClients();
      } else if (activeTab === 'chambres') {
        if (modalType === 'create') {
          await supabase.from("chambre").insert([chambreForm]);
        } else if (modalType === 'edit') {
          await supabase.from("chambre").update(chambreForm).eq('id', selectedItem.id);
        }
        await loadChambres();
      } else if (activeTab === 'reservations') {
        if (modalType === 'create') {
          await supabase.from("reservation").insert([reservationForm]);
        } else if (modalType === 'edit') {
          await supabase.from("reservation").update(reservationForm).eq('id', selectedItem.id);
        }
        await loadReservations();
      }
      
      closeModal();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    
    try {
      if (activeTab === 'clients') {
        await supabase.from("client").delete().eq('id', id);
        await loadClients();
      } else if (activeTab === 'chambres') {
        await supabase.from("chambre").delete().eq('id', id);
        await loadChambres();
      } else if (activeTab === 'reservations') {
        await supabase.from("reservation").delete().eq('id', id);
        await loadReservations();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Filtrage des données
  const filterData = (data: any[]) => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      if (activeTab === 'clients') {
        return item.nom?.toLowerCase().includes(searchLower);
      } else if (activeTab === 'chambres') {
        return item.numero?.toLowerCase().includes(searchLower) ||
               item.type_chambre?.toLowerCase().includes(searchLower);
      } else if (activeTab === 'reservations') {
        return item.client?.nom?.toLowerCase().includes(searchLower) ||
               item.chambre?.numero?.toLowerCase().includes(searchLower);
      }
      
      return false;
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Chargement...</h2>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* En-tête */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Administration
            </h1>
            <p className="text-gray-600">
              Gestion des clients, chambres et réservations
            </p>
          </div>

          {/* Onglets */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'clients'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Clients ({clients.length})
                </button>
                <button
                  onClick={() => setActiveTab('chambres')}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'chambres'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Bed className="w-5 h-5 mr-2" />
                  Chambres ({chambres.length})
                </button>
                <button
                  onClick={() => setActiveTab('reservations')}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'reservations'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Réservations ({reservations.length})
                </button>
              </nav>
            </div>

            {/* Barre d'actions */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => openModal('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau {activeTab === 'clients' ? 'Client' : activeTab === 'chambres' ? 'Chambre' : 'Réservation'}
                </button>
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {/* Table Clients */}
              {activeTab === 'clients' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterData(clients).map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.points_fidelite}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.role === 'admin' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {client.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(client.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal('view', client)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('edit', client)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Chambres */}
              {activeTab === 'chambres' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarif</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points/nuit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterData(chambres).map((chambre) => (
                        <tr key={chambre.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{chambre.numero}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{chambre.type_chambre}</div>
                            <div className="text-sm text-gray-500">{chambre.vue} - Étage {chambre.etage}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {chambre.capacite} pers.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${chambre.tarif}/nuit
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {chambre.point_par_nuits} pts
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              chambre.isDisponible 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {chambre.isDisponible ? 'Disponible' : 'Occupée'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal('view', chambre)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('edit', chambre)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(chambre.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Réservations */}
              {activeTab === 'reservations' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chambre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterData(reservations).map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{reservation.client?.nom}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">#{reservation.chambre?.numero}</div>
                            <div className="text-sm text-gray-500">{reservation.chambre?.type_chambre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(reservation.date_debut).toLocaleDateString("fr-FR")} -<br/>
                              {new Date(reservation.date_fin).toLocaleDateString("fr-FR")}
                            </div>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              reservation.statut === 'confirmee' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reservation.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal('view', reservation)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('edit', reservation)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(reservation.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'create' && `Nouveau ${activeTab === 'clients' ? 'Client' : activeTab === 'chambres' ? 'Chambre' : 'Réservation'}`}
                {modalType === 'edit' && `Modifier ${activeTab === 'clients' ? 'Client' : activeTab === 'chambres' ? 'Chambre' : 'Réservation'}`}
                {modalType === 'view' && `Détails ${activeTab === 'clients' ? 'Client' : activeTab === 'chambres' ? 'Chambre' : 'Réservation'}`}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Formulaire Client */}
              {activeTab === 'clients' && modalType !== 'view' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={clientForm.nom}
                      onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points de fidélité
                    </label>
                    <input
                      type="number"
                      value={clientForm.points_fidelite}
                      onChange={(e) => setClientForm({ ...clientForm, points_fidelite: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <select
                      value={clientForm.role}
                      onChange={(e) => setClientForm({ ...clientForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Vue détaillée Client */}
              {activeTab === 'clients' && modalType === 'view' && selectedItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Nom:</span>
                      <p className="text-gray-900">{selectedItem.nom}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Points:</span>
                      <p className="text-gray-900">{selectedItem.points_fidelite}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rôle:</span>
                      <p className="text-gray-900">{selectedItem.role}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Créé le:</span>
                      <p className="text-gray-900">{new Date(selectedItem.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire Chambre */}
              {activeTab === 'chambres' && modalType !== 'view' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro
                      </label>
                      <input
                        type="text"
                        value={chambreForm.numero}
                        onChange={(e) => setChambreForm({ ...chambreForm, numero: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de chambre
                      </label>
                      <input
                        type="text"
                        value={chambreForm.type_chambre}
                        onChange={(e) => setChambreForm({ ...chambreForm, type_chambre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacité
                      </label>
                      <input
                        type="number"
                        value={chambreForm.capacite}
                        onChange={(e) => setChambreForm({ ...chambreForm, capacite: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Étage
                      </label>
                      <input
                        type="number"
                        value={chambreForm.etage}
                        onChange={(e) => setChambreForm({ ...chambreForm, etage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarif par nuit ($)
                      </label>
                      <input
                        type="number"
                        value={chambreForm.tarif}
                        onChange={(e) => setChambreForm({ ...chambreForm, tarif: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points par nuit
                      </label>
                      <input
                        type="number"
                        value={chambreForm.point_par_nuits}
                        onChange={(e) => setChambreForm({ ...chambreForm, point_par_nuits: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vue
                    </label>
                    <input
                      type="text"
                      value={chambreForm.vue}
                      onChange={(e) => setChambreForm({ ...chambreForm, vue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={chambreForm.description}
                      onChange={(e) => setChambreForm({ ...chambreForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chambreForm.isDisponible}
                      onChange={(e) => setChambreForm({ ...chambreForm, isDisponible: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Disponible
                    </label>
                  </div>
                </div>
              )}

              {/* Vue détaillée Chambre */}
              {activeTab === 'chambres' && modalType === 'view' && selectedItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Numéro:</span>
                      <p className="text-gray-900">#{selectedItem.numero}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-900">{selectedItem.type_chambre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Capacité:</span>
                      <p className="text-gray-900">{selectedItem.capacite} personnes</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Étage:</span>
                      <p className="text-gray-900">{selectedItem.etage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tarif:</span>
                      <p className="text-gray-900">${selectedItem.tarif}/nuit</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Points/nuit:</span>
                      <p className="text-gray-900">{selectedItem.point_par_nuits} points</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vue:</span>
                      <p className="text-gray-900">{selectedItem.vue}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className="text-gray-900">{selectedItem.isDisponible ? 'Disponible' : 'Occupée'}</p>
                    </div>
                  </div>
                  {selectedItem.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900">{selectedItem.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Formulaire Réservation */}
              {activeTab === 'reservations' && modalType !== 'view' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client
                      </label>
                      <select
                        value={reservationForm.id_client}
                        onChange={(e) => setReservationForm({ ...reservationForm, id_client: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chambre
                      </label>
                      <select
                        value={reservationForm.id_chambre}
                        onChange={(e) => setReservationForm({ ...reservationForm, id_chambre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une chambre</option>
                        {chambres.map(chambre => (
                          <option key={chambre.id} value={chambre.id}>#{chambre.numero} - {chambre.type_chambre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date début
                      </label>
                      <input
                        type="date"
                        value={reservationForm.date_debut}
                        onChange={(e) => setReservationForm({ ...reservationForm, date_debut: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date fin
                      </label>
                      <input
                        type="date"
                        value={reservationForm.date_fin}
                        onChange={(e) => setReservationForm({ ...reservationForm, date_fin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de personnes
                      </label>
                      <input
                        type="number"
                        value={reservationForm.nb_personnes}
                        onChange={(e) => setReservationForm({ ...reservationForm, nb_personnes: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant total ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={reservationForm.montant_total}
                        onChange={(e) => setReservationForm({ ...reservationForm, montant_total: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rabais appliqué ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={reservationForm.rabais_applique}
                        onChange={(e) => setReservationForm({ ...reservationForm, rabais_applique: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut
                      </label>
                      <select
                        value={reservationForm.statut}
                        onChange={(e) => setReservationForm({ ...reservationForm, statut: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="confirmee">Confirmée</option>
                        <option value="en_attente">En attente</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Demandes spéciales
                    </label>
                    <textarea
                      value={reservationForm.demandes_speciales}
                      onChange={(e) => setReservationForm({ ...reservationForm, demandes_speciales: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Vue détaillée Réservation */}
              {activeTab === 'reservations' && modalType === 'view' && selectedItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Client:</span>
                      <p className="text-gray-900">{selectedItem.client?.nom}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Chambre:</span>
                      <p className="text-gray-900">#{selectedItem.chambre?.numero} - {selectedItem.chambre?.type_chambre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date début:</span>
                      <p className="text-gray-900">{new Date(selectedItem.date_debut).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date fin:</span>
                      <p className="text-gray-900">{new Date(selectedItem.date_fin).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Personnes:</span>
                      <p className="text-gray-900">{selectedItem.nb_personnes}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Montant total:</span>
                      <p className="text-gray-900">${selectedItem.montant_total.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Rabais:</span>
                      <p className="text-gray-900">${selectedItem.rabais_applique.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Statut:</span>
                      <p className="text-gray-900">{selectedItem.statut}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Réservé le:</span>
                      <p className="text-gray-900">{new Date(selectedItem.date_reservation).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  {selectedItem.demandes_speciales && (
                    <div>
                      <span className="font-medium text-gray-700">Demandes spéciales:</span>
                      <p className="text-gray-900">{selectedItem.demandes_speciales}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions du modal */}
            {modalType !== 'view' && (
              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}
