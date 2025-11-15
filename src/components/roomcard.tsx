"use client";

import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { Chambre } from "@/lib/type";
import styles from "./roomcard.module.css";

interface RoomCardProps {
  room: Chambre;
  onReserve?: (room: Chambre) => void;
  onDetails?: (room: Chambre) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onReserve, onDetails }) => {
  const sliderSettings = {
    dots: true,
    infinite: room.photos && room.photos.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: true,
    lazyLoad: 'ondemand' as const,
    cssEase: 'ease-in-out',
  };

  const handleReserve = () => {
    if (onReserve) {
      onReserve(room);
    }
  };

  const handleDetails = () => {
    if (onDetails) {
      onDetails(room);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-sm">
      {/* Carousel de photos */}
      <div className={styles.carouselContainer}>
        {room.photos && room.photos.length > 0 ? (
          <Slider {...sliderSettings}>
            {room.photos.map((photo, index) => (
              <div key={index}>
                <div className={styles.slideImage}>
                  <Image
                    src={photo}
                    alt={`${room.type_chambre} - Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}
          </Slider>
        ) : (
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Aucune photo disponible</span>
          </div>
        )}
        
        {/* Badge de disponibilité */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              room.isDisponible
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {room.isDisponible ? "Disponible" : "Indisponible"}
          </span>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="p-6">
        {/* Type et numéro de chambre */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {room.type_chambre}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">${room.tarif}</p>
            <p className="text-xs text-gray-500">par nuit</p>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{room.capacite} personnes</span>
          </div>
          <div className="flex items-center text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>Étage {room.etage}</span>
          </div>
          <div className="flex items-center text-gray-600 col-span-2">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Vue {room.vue}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {room.description}
        </p>

        {/* Équipements */}
        {room.equipements && room.equipements.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {room.equipements.slice(0, 3).map((equipement, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {equipement}
                </span>
              ))}
              {room.equipements.length > 3 && (
                <span className="text-gray-500 text-xs py-1">
                  +{room.equipements.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}

        {/* Points de fidélité */}
        <div className="flex items-center text-amber-600 text-sm mb-4">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>{room.point_par_nuits} points par nuit</span>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <button
            onClick={handleDetails}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded transition-colors duration-200"
          >
            Détails
          </button>
          <button
            onClick={handleReserve}
            disabled={!room.isDisponible}
            className={`flex-1 font-semibold py-2 px-4 rounded transition-colors duration-200 ${
              room.isDisponible
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
