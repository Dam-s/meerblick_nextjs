"use client";

import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { Chambre } from "@/lib/type";
import styles from "./roomcard.module.css";

interface RoomModalProps {
  room: Chambre | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve?: (room: Chambre) => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, isOpen, onClose, onReserve }) => {
  if (!isOpen || !room) return null;

  const sliderSettings = {
    dots: true,
    infinite: room.photos && room.photos.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
    lazyLoad: 'ondemand' as const,
    cssEase: 'ease-in-out',
  };

  const handleReserve = () => {
    if (onReserve && room) {
      onReserve(room);
    }
    onClose();
  };

  // Fermer la modal en cliquant sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Gérer la touche Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in duration-300">
        {/* Header avec fermeture */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{room.type_chambre}</h2>
              <p className="text-gray-600 mt-1 text-sm">Chambre #{room.numero} • Étage {room.etage}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Section Photos */}
            <div className="space-y-4">
              <div className={styles.carouselContainer} style={{ height: '320px' }}>
                {room.photos && room.photos.length > 0 ? (
                  <Slider {...sliderSettings}>
                    {room.photos.map((photo, index) => (
                      <div key={index}>
                        <div className={styles.slideImage} style={{ height: '320px' }}>
                          <Image
                            src={photo}
                            alt={`${room.type_chambre} - Photo ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority={index === 0}
                          />
                        </div>
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <div className="h-80 bg-gray-200 flex items-center justify-center rounded-lg">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Aucune photo disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Informations */}
            <div className="space-y-4">
              {/* Prix et Disponibilité */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">${room.tarif}</p>
                    <p className="text-gray-600">par nuit</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                      room.isDisponible
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {room.isDisponible ? "✓ Disponible" : "✗ Indisponible"}
                  </span>
                </div>

                {/* Points de fidélité */}
                <div className="flex items-center text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Gagnez {room.point_par_nuits} points de fidélité par nuit
                  </span>
                </div>
              </div>

              {/* Caractéristiques principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <svg className="w-6 h-6 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-semibold text-gray-800">{room.capacite}</p>
                  <p className="text-sm text-gray-600">Personnes</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="font-semibold text-gray-800 capitalize">{room.vue}</p>
                  <p className="text-sm text-gray-600">Vue</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg text-sm">
                  {room.description}
                </p>
              </div>

              {/* Équipements */}
              {room.equipements && room.equipements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipements & Services
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.equipements.map((equipement, index) => (
                      <div key={index} className="flex items-center text-gray-700 bg-white p-2 rounded-md border border-gray-200 shadow-sm">
                        <svg className="w-3 h-3 mr-2 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs">{equipement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec boutons d'action */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105"
            >
              Fermer
            </button>
            <button
              onClick={handleReserve}
              disabled={!room.isDisponible}
              className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 ${
                room.isDisponible
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {room.isDisponible ? "Réserver maintenant" : "❌ Indisponible"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;