import { brand } from "./brand";
import Link from "next/link";
// import SearchBar from './searchbar';


export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white border-solid "> 
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bloc gauche : texte */}
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-2">Bienvenue chez {brand.name}</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-2">
              <span
                className="inline-block px-2 -rotate-1 rounded mr-2"
                style={{ backgroundColor: brand.secondary }}
              >
                Réservez
              </span>
              <span className="inline-block">des séjours merveilleux</span>
              <br />
              <span className="inline-block">au bord de la mer</span>
            </h1>
            <p className="mt-4 max-w-xl text-gray-600">
              Entre horizon bleu et instants précieux, vivez le luxe discret d’un séjour sur mesure au bord de l’eau.
            </p>
            {/* SearchBar superposé */}
            {/* <div className="mt-10">
              <SearchBar onSearch={onGoRooms} />
            </div> */}
            <Link
              href="/rooms"
              className="inline-block mt-6 px-6 py-3  font-semibold  shadow-md "
              style={{ backgroundColor: brand.secondary }}
            >
              Voir les chambres
            </Link>
          </div>
          {/* Bloc droit : image */}

           <div className="relative ml-12">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/594077/pexels-photo-594077.jpeg"
                alt="image hotel "
                className="w-full h-[400px] object-cover rounded-2xl"
              />
      
              {/* Stats overlay */}
              <div className="absolute top-6 left-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-linear-to-r from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-linear-to-r from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-linear-to-r from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Trouvé par plus de</div>
                    <div className="text-gray-600">500+ personnes</div>
                  </div>
                </div>
              </div>
            </div>
        </div>


          
        </div>
      </div>
    </section>
  );
}

       