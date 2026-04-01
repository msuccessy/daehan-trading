import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import NewsGrid from '@/components/NewsGrid';
import GlobalNetwork from '@/components/GlobalNetwork';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

export const revalidate = 3600; // Revalidate at most every hour

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSlider />
      <NewsGrid />
      <GlobalNetwork />
      <ContactForm />
      <Footer />
    </main>
  );
}
