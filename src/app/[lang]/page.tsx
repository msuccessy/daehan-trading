import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import NewsGrid from '@/components/NewsGrid';
import GlobalNetwork from '@/components/GlobalNetwork';
import ContactInfo from '@/components/ContactInfo';
import Footer from '@/components/Footer';
import { hasLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export const revalidate = 3600; // Revalidate at most every hour

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const locale: Locale = lang;
  const dict = await getDictionary(locale);

  return (
    <main>
      <Navbar dict={dict} locale={locale} />
      <HeroSlider dict={dict.hero} />
      <NewsGrid dict={dict.news} />
      <GlobalNetwork dict={dict.global} />
      <ContactInfo dict={dict.contact} />
      <Footer dict={dict.footer} navDict={dict.nav} locale={locale} />
    </main>
  );
}
