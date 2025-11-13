import { brand } from "./brand";

export default function Highlights() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl font-bold mb-6">Pourquoi choisir notre hôtel ?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Emplacement idéal", desc: "Au bord de la plage  avec vue panoramique sur la mer." },
          { title: "Confort moderne", desc: "Des chambres élégantes équipées de la meilleure technologie." },
          { title: "Service premium", desc: "Un personnel dédié 24/7 pour vos besoins." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl p-6 shadow " style={{ backgroundColor: brand.light }}>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
