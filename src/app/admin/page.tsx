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
  
  // Statistiques
  const [stats, setStats] = useState({
    revenuTotal: 0,
    totalClients: 0,
    tauxOccupation: 0,
    reservationsCeMois: 0
  });
  
  // Upload de photos
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newEquipement, setNewEquipement] = useState('');

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
      loadReservations(),
      calculateStats()
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
      setNewEquipement('');
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
        // Préparer les données de la chambre avec la date de création
        const chambreData = {
          ...chambreForm,
          created_at: modalType === 'create' ? new Date().toISOString() : undefined
        };
        
        // Enlever created_at si c'est une mise à jour
        if (modalType === 'edit') {
          delete chambreData.created_at;
        }
        
        if (modalType === 'create') {
          await supabase.from("chambre").insert([chambreData]);
        } else if (modalType === 'edit') {
          await supabase.from("chambre").update(chambreData).eq('id', selectedItem.id);
        }
        await loadChambres();
        await calculateStats(); // Recalculer les stats après modification
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

  // Upload de photos vers le bucket
  const uploadPhotos = async (files: FileList) => {
    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('photos_chambres')
          .upload(fileName, file);
        
        if (error) {
          console.error('Erreur upload:', error);
          continue;
        }
        
        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('photos_chambres')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setUploadingPhotos(false);
    }
    
    return uploadedUrls;
  };
  
  // Supprimer une photo du bucket
  const deletePhoto = async (photoUrl: string) => {
    try {
      // Extraire le nom du fichier de l'URL
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('photos_chambres')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Erreur suppression photo:', error);
    }
  };

  // Calculer les statistiques
  const calculateStats = async () => {
    try {
      // 1. Revenus totaux (somme des montants des réservations confirmées)
      const { data: revenusData } = await supabase
        .from('reservation')
        .select('montant_total')
        .eq('statut', 'confirmee');
      
      const revenuTotal = revenusData?.reduce((sum, res) => sum + res.montant_total, 0) || 0;

      // 2. Nombre total de clients
      const { count: totalClients } = await supabase
        .from('client')
        .select('*', { count: 'exact', head: true });

      // 3. Taux d'occupation (chambres occupées vs total)
      const { data: chambresData } = await supabase
        .from('chambre')
        .select('isDisponible');
      
      const totalChambres = chambresData?.length || 0;
      const chambresOccupees = chambresData?.filter(c => !c.isDisponible).length || 0;
      const tauxOccupation = totalChambres > 0 ? (chambresOccupees / totalChambres) * 100 : 0;

      // 4. Réservations ce mois-ci
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
      
      const { count: reservationsCeMois } = await supabase
        .from('reservation')
        .select('*', { count: 'exact', head: true })
        .gte('date_reservation', startOfMonth)
        .lte('date_reservation', endOfMonth);

      setStats({
        revenuTotal,
        totalClients: totalClients || 0,
        tauxOccupation: Math.round(tauxOccupation),
        reservationsCeMois: reservationsCeMois || 0
      });
    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
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

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenus totaux */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-3xl font-bold text-green-600">${stats.revenuTotal.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total clients */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total clients</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalClients}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Taux d'occupation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.tauxOccupation}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bed className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Réservations ce mois */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réservations ce mois</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.reservationsCeMois}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
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
                <div className="space-y-6">
                  {/* Informations de base */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro *
                      </label>
                      <input
                        type="text"
                        value={chambreForm.numero}
                        onChange={(e) => setChambreForm({ ...chambreForm, numero: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de chambre *
                      </label>
                      <select
                        value={chambreForm.type_chambre}
                        onChange={(e) => setChambreForm({ ...chambreForm, type_chambre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="Chambre Standard">Chambre Standard</option>
                        <option value="Suite Deluxe">Suite Deluxe</option>
                        <option value="Penthouse Premium">Penthouse Premium</option>
                        <option value="Suite Jardin">Suite Jardin</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={chambreForm.capacite}
                        onChange={(e) => setChambreForm({ ...chambreForm, capacite: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Étage
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={chambreForm.etage}
                        onChange={(e) => setChambreForm({ ...chambreForm, etage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vue
                      </label>
                      <select
                        value={chambreForm.vue}
                        onChange={(e) => setChambreForm({ ...chambreForm, vue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une vue</option>
                        <option value="Mer">Mer</option>
                        <option value="Montagne">Montagne</option>
                        <option value="Jardin">Jardin</option>
                        <option value="Ville">Ville</option>
                        <option value="Cour intérieure">Cour intérieure</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Tarification */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarif par nuit ($) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={chambreForm.tarif}
                        onChange={(e) => setChambreForm({ ...chambreForm, tarif: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points par nuit
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={chambreForm.point_par_nuits}
                        onChange={(e) => setChambreForm({ ...chambreForm, point_par_nuits: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={chambreForm.description || ''}
                      onChange={(e) => setChambreForm({ ...chambreForm, description: e.target.value })}
                      rows={3}
                      placeholder="Décrivez la chambre, ses caractéristiques..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Équipements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Équipements
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEquipement}
                        onChange={(e) => setNewEquipement(e.target.value)}
                        placeholder="Ajouter un équipement"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newEquipement.trim()) {
                            setChambreForm({ 
                              ...chambreForm, 
                              equipements: [...(chambreForm.equipements || []), newEquipement.trim()]
                            });
                            setNewEquipement('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newEquipement.trim()) {
                            setChambreForm({ 
                              ...chambreForm, 
                              equipements: [...(chambreForm.equipements || []), newEquipement.trim()]
                            });
                            setNewEquipement('');
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Liste des équipements */}
                    <div className="flex flex-wrap gap-2">
                      {chambreForm.equipements?.map((equipement, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {equipement}
                          <button
                            type="button"
                            onClick={() => {
                              const newEquipements = chambreForm.equipements?.filter((_, i) => i !== index) || [];
                              setChambreForm({ ...chambreForm, equipements: newEquipements });
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos de la chambre
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const uploadedUrls = await uploadPhotos(files);
                          setChambreForm({
                            ...chambreForm,
                            photos: [...(chambreForm.photos || []), ...uploadedUrls]
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={uploadingPhotos}
                    />
                    
                    {uploadingPhotos && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        Upload en cours...
                      </div>
                    )}
                    
                    {/* Aperçu des photos */}
                    {chambreForm.photos && chambreForm.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {chambreForm.photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await deletePhoto(photo);
                                const newPhotos = chambreForm.photos?.filter((_, i) => i !== index) || [];
                                setChambreForm({ ...chambreForm, photos: newPhotos });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Statut */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="disponible"
                        checked={chambreForm.isDisponible}
                        onChange={(e) => setChambreForm({ ...chambreForm, isDisponible: e.target.checked })}
                        className="mr-2 rounded"
                      />
                      <label htmlFor="disponible" className="text-sm font-medium text-gray-700">
                        Chambre disponible
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Vue détaillée Chambre */}
              {activeTab === 'chambres' && modalType === 'view' && selectedItem && (
                <div className="space-y-6">
                  {/* Informations de base */}
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
                      <p className="text-gray-900">{selectedItem.vue || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className={`font-medium ${selectedItem.isDisponible ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedItem.isDisponible ? 'Disponible' : 'Occupée'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {selectedItem.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{selectedItem.description}</p>
                    </div>
                  )}
                  
                  {/* Équipements */}
                  {selectedItem.equipements && selectedItem.equipements.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Équipements:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedItem.equipements.map((equipement: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                          >
                            {equipement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Photos */}
                  {selectedItem.photos && selectedItem.photos.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Photos:</span>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {selectedItem.photos.map((photo: string, index: number) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div>
                    <span className="font-medium text-gray-700">Créé le:</span>
                    <p className="text-gray-900">{new Date(selectedItem.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
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
