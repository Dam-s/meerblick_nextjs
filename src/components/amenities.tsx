import { brand } from "./brand";

export default function Amenities() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl font-bold mb-6">Commodités & Services</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Spa", desc: "Relaxation et bien-être" },
          { title: "Fitness", desc: "Salle ouverte 24/7" },
          { title: "Canoe", desc: "belles pirogues disponibles" },
          { title: "Restaurant", desc: "Saveurs du monde" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl p-4" style={{ backgroundColor: brand.neutral }}>
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}