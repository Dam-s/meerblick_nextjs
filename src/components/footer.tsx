import { brand } from "./brand";

export default function Footer() {
  return (
    <footer id="contact" className="mt-16 border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-4 text-center text-base text-gray-700 font-semibold">
                "Il n'y a rien de plus merveilleux que l'apaisement des vagues et le chant des oiseaux marins."
                </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">© {new Date().getFullYear()} {brand.name}. Tous droits réservés.</p>
                    <div className="text-sm text-gray-500">Contact: meerblick@hotel.com</div>
                </div>
        </div>
    </footer>
  );
}