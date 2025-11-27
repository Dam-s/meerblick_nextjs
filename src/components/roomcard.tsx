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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-xs">
      {/* Carousel de photos - Réduit */}
      <div className={styles.carouselContainer} style={{ height: '200px' }}>
        {room.photos && room.photos.length > 0 ? (
          <Slider {...sliderSettings}>
            {room.photos.map((photo, index) => (
              <div key={index}>
                <div className={styles.slideImage} style={{ height: '200px' }}>
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
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Aucune photo</span>
          </div>
        )}
        
        {/* Badge de disponibilité */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              room.isDisponible
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {room.isDisponible ? "Libre" : "Occupé"}
          </span>
        </div>
      </div>

      {/* Contenu simplifié */}
      <div className="p-4">
        {/* Type et prix */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {room.type_chambre}
            </h3>
            <p className="text-xs text-gray-500">#{room.numero}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">${room.tarif}</p>
            <p className="text-xs text-gray-500">par nuit</p>
          </div>
        </div>

        {/* Infos essentielles seulement */}
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{room.capacite} pers.</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{room.vue}</span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={handleDetails}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded text-sm transition-colors duration-200"
          >
            Détails
          </button>
          <a
            href={room.isDisponible ? `/rooms/reserver/${room.id}` : undefined}
            className={`flex-1 font-medium py-2 px-3 rounded text-sm transition-colors duration-200 text-center inline-block ${
              room.isDisponible
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
            }`}
          >
            Réserver
          </a>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
