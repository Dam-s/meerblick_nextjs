import {Star} from "lucide-react";
import { brand } from "./brand";

export default function Testimonials() {
  return (
    <section className="py-16" style={{ backgroundColor: brand.light }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Ils nous font confiance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { name: "Marie", review: "Un séjour incroyable, service impeccable !" },
                { name: "Jean", review: "Des chambres spacieuses et un accueil chaleureux." },
                { name: "Sophie", review: "La meilleure expérience hôtelière que j’ai eue." },
            ].map((item) => (
                <div key={item.name} className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400" />
                    ))}
                </div>
                <p className="italic mb-2">“{item.review}”</p>
                <p className="text-sm font-semibold">- {item.name}</p>
                </div>
            ))}
            </div>
        </div>
    </section>
  );
}
