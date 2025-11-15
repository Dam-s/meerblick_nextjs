"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useMemo } from "react";
import { Chambre } from "@/lib/type";
import RoomCard from "@/components/roomcard";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import RoomModal from "@/components/modalroom";

interface Filters {
    priceRange: [number, number];
    typeChambres: string[];
    capacite: number[];
    vue: string[];
    etage: number[];
    disponibleOnly: boolean;
}

export default function roomsPage() {
    const [chambres, setChambres] = useState<Chambre[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Chambre | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // États pour les filtres
    const [filters, setFilters] = useState<Filters>({
        priceRange: [0, 1000],
        typeChambres: [],
        capacite: [],
        vue: [],
        etage: [],
        disponibleOnly: false,
    });

    const handleShowDetails = (room: Chambre) => {
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRoom(null);
    };

    const handleReserve = (room: Chambre) => {
        console.log('Réserver la chambre:', room);
    };

    // Récupération des données des chambres depuis Supabase
    useEffect(() => {
        const fetchChambres = async () => {
            const { data, error } = await supabase
                .from("chambre")
                .select("*");
            if (error) {
                console.log("Erreur lors de la récupération des chambres:", error);
            } else {
                setChambres(data);
                if (data && data.length > 0) {
                    const prices = data.map(c => c.tarif);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    setFilters(prev => ({
                        ...prev,
                        priceRange: [minPrice, maxPrice]
                    }));
                }
            }
        };

        fetchChambres();
    }, []);

    // Obtenir les options de filtres uniques
    const filterOptions = useMemo(() => {
        if (!chambres.length) return {
            typeChambres: [],
            vues: [],
            etages: [],
            capacites: [],
            minPrice: 0,
            maxPrice: 1000
        };

        const prices = chambres.map(c => c.tarif);
        return {
            typeChambres: [...new Set(chambres.map(c => c.type_chambre).filter((t): t is string => Boolean(t)))],
            vues: [...new Set(chambres.map(c => c.vue).filter((v): v is string => Boolean(v)))],
            etages: [...new Set(chambres.map(c => c.etage).filter((e): e is number => e !== null && e !== undefined))].sort((a, b) => a - b),
            capacites: [...new Set(chambres.map(c => c.capacite).filter((c): c is number => c !== null && c !== undefined))].sort((a, b) => a - b),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices)
        };
    }, [chambres]);

    // Filtrer les chambres en temps réel
    const filteredChambres = useMemo(() => {
        return chambres.filter(chambre => {
            if (chambre.tarif < filters.priceRange[0] || chambre.tarif > filters.priceRange[1]) {
                return false;
            }
            if (filters.typeChambres.length > 0 && chambre.type_chambre && !filters.typeChambres.includes(chambre.type_chambre)) {
                return false;
            }
            if (filters.capacite.length > 0 && chambre.capacite && !filters.capacite.includes(chambre.capacite)) {
                return false;
            }
            if (filters.vue.length > 0 && chambre.vue && !filters.vue.includes(chambre.vue)) {
                return false;
            }
            if (filters.etage.length > 0 && chambre.etage && !filters.etage.includes(chambre.etage)) {
                return false;
            }
            if (filters.disponibleOnly && !chambre.isDisponible) {
                return false;
            }
            return true;
        });
    }, [chambres, filters]);

    // Fonctions de gestion des filtres
    const handlePriceRangeChange = (newRange: [number, number]) => {
        setFilters(prev => ({ ...prev, priceRange: newRange }));
    };

    const handleCheckboxFilter = (filterKey: keyof Filters, value: string | number) => {
        setFilters(prev => {
            const currentValues = prev[filterKey] as (string | number)[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            
            return { ...prev, [filterKey]: newValues };
        });
    };

    const handleDisponibleToggle = () => {
        setFilters(prev => ({ ...prev, disponibleOnly: !prev.disponibleOnly }));
    };

    const resetFilters = () => {
        setFilters({
            priceRange: [filterOptions.minPrice, filterOptions.maxPrice],
            typeChambres: [],
            capacite: [],
            vue: [],
            etage: [],
            disponibleOnly: false,
        });
    };

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar des filtres */}
                <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white shadow-lg`}>
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full lg:hidden"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                        >
                            Réinitialiser tout
                        </button>
                    </div>

                    <div className="p-6 space-y-8 max-h-screen overflow-y-auto">
                        {/* Filtre par prix avec slider range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">
                                Prix par nuit
                            </label>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>${filters.priceRange[0]}</span>
                                    <span>${filters.priceRange[1]}</span>
                                </div>
                                
                                {/* Double Range Slider */}
                                <div className="relative">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="range"
                                            min={filterOptions.minPrice}
                                            max={filterOptions.maxPrice}
                                            value={filters.priceRange[0]}
                                            onChange={(e) => {
                                                const newMin = parseInt(e.target.value);
                                                if (newMin <= filters.priceRange[1]) {
                                                    handlePriceRangeChange([newMin, filters.priceRange[1]]);
                                                }
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                                            style={{
                                                background: `linear-gradient(to right, #e5e7eb 0%, #3b82f6 ${((filters.priceRange[0] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) * 100}%, #3b82f6 ${((filters.priceRange[1] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) * 100}%, #e5e7eb 100%)`
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min={filterOptions.minPrice}
                                        max={filterOptions.maxPrice}
                                        value={filters.priceRange[1]}
                                        onChange={(e) => {
                                            const newMax = parseInt(e.target.value);
                                            if (newMax >= filters.priceRange[0]) {
                                                handlePriceRangeChange([filters.priceRange[0], newMax]);
                                            }
                                        }}
                                        className="w-full h-2 bg-transparent appearance-none cursor-pointer absolute top-0 slider-thumb"
                                    />
                                </div>
                                
                                {/* Inputs manuels */}
                                <div className="flex space-x-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Min</label>
                                        <input
                                            type="number"
                                            value={filters.priceRange[0]}
                                            onChange={(e) => {
                                                const newMin = parseInt(e.target.value) || 0;
                                                if (newMin <= filters.priceRange[1]) {
                                                    handlePriceRangeChange([newMin, filters.priceRange[1]]);
                                                }
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Max</label>
                                        <input
                                            type="number"
                                            value={filters.priceRange[1]}
                                            onChange={(e) => {
                                                const newMax = parseInt(e.target.value) || 0;
                                                if (newMax >= filters.priceRange[0]) {
                                                    handlePriceRangeChange([filters.priceRange[0], newMax]);
                                                }
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filtre par type de chambre */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">Type de chambre</label>
                            <div className="space-y-2">
                                {filterOptions.typeChambres.map((type) => (
                                    <label key={type} className="flex items-center group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.typeChambres.includes(type)}
                                            onChange={() => handleCheckboxFilter('typeChambres', type)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Filtre par capacité */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">Capacité</label>
                            <div className="grid grid-cols-2 gap-2">
                                {filterOptions.capacites.map((cap) => (
                                    <button
                                        key={cap}
                                        onClick={() => handleCheckboxFilter('capacite', cap)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                                            filters.capacite.includes(cap)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                    >
                                        {cap} pers.
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filtre par vue */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">Vue</label>
                            <div className="space-y-2">
                                {filterOptions.vues.map((vue) => vue && (
                                    <label key={vue} className="flex items-center group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.vue.includes(vue)}
                                            onChange={() => handleCheckboxFilter('vue', vue)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 capitalize">{vue}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Filtre par étage */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">Étage</label>
                            <div className="grid grid-cols-3 gap-2">
                                {filterOptions.etages.map((etage) => (
                                    <button
                                        key={etage}
                                        onClick={() => handleCheckboxFilter('etage', etage)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                                            filters.etage.includes(etage)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                    >
                                        {etage}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filtre disponibilité */}
                        <div>
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.disponibleOnly}
                                    onChange={handleDisponibleToggle}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm font-semibold text-gray-800 group-hover:text-gray-900">
                                    Chambres disponibles uniquement
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="flex-1 p-6">
                    {/* Header avec toggle sidebar et résultats */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {!sidebarOpen && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-all duration-200 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                                    </svg>
                                    Filtres
                                </button>
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">Chambres</h2>
                        </div>
                        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
                            {filteredChambres.length} chambre{filteredChambres.length > 1 ? 's' : ''} trouvée{filteredChambres.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Grille des chambres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredChambres.length > 0 ? (
                            filteredChambres.map((chambre) => (
                                <RoomCard 
                                    key={chambre.id} 
                                    room={chambre} 
                                    onDetails={() => handleShowDetails(chambre)} 
                                    onReserve={() => handleReserve(chambre)} 
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <div className="max-w-md mx-auto">
                                    <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune chambre trouvée</h3>
                                    <p className="text-gray-600 mb-6">Aucune chambre ne correspond à vos critères de recherche</p>
                                    <button
                                        onClick={resetFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedRoom && (
                <RoomModal
                    room={selectedRoom}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onReserve={handleReserve}
                />
            )}
            <Footer />
        </>
    );
}