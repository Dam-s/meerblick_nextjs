"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Chambre } from "@/lib/type";
import RoomCard from "@/components/roomcard";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";



export default function roomsPage() {
    const [chambres, setChambres] = useState<Chambre[]>([]);

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
            }
        };

        fetchChambres();
    }, []);

    return (
       <>
        <Navbar />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-2xl font-bold">Chambres</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {chambres.map((chambre) => (
                    <RoomCard key={chambre.id} room={chambre} />
                ))}
            </div>
        </section>
        <Footer />
       </>
    );
}