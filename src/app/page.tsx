import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Highlights from "@/components/highlights";
import Amenities from "@/components/amenities";
import Testimonials from "@/components/testimonials";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar/>
      <Hero/>
      <Highlights/>
      <Amenities/>
      <Testimonials/>
      <Footer/>
    </>
  );
}
