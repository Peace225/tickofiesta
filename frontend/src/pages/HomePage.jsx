import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../config/supabaseClient";
import { fetchEvents } from "../store/slices/eventsSlice";

import HeroSection from "../components/home/HeroSection";
import EventsSection from "../components/home/EventsSection";
import VotesSection from "../components/home/VotesSection";
import AdsManager from "../components/home/AdsManager";
import SocialProof from '../components/home/SocialProof';
import PartnersSection from "../components/home/PartnersSection";
import CTASection from "../components/home/CTASection";
import { useInView } from "../hooks/useInView";

export default function HomePage() {
  const dispatch = useDispatch();
  const { dark } = useSelector((s) => s.theme);
  const { list } = useSelector((s) => s.events);

  const [votes, setVotes] = useState([]);
  const [ads, setAds] = useState([]);
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");

  const [heroRef, heroInView] = useInView(0.05);
  const [eventsRef, eventsInView] = useInView(0.05);
  const [votesRef, votesInView] = useInView(0.05);
  const [ctaRef, ctaInView] = useInView(0.05);

  useEffect(() => {
    // 1. Charger les événements via Redux
    dispatch(fetchEvents({ limit: 50 }));

    const fetchHomeData = async () => {
      try {
        // --- A. RÉCUPÉRATION DES VOTES ---
        const { data: vData, error: vErr } = await supabase
          .from('votes')
          .select('*')
          .eq('statut', 'actif') 
          .gte('date_fin', new Date().toISOString()) 
          .order('total_votes', { ascending: false })
          .limit(6);
          
        if (vErr) console.error("Erreur votes:", vErr);
        setVotes(vData || []);

        // --- B. RÉCUPÉRATION DES PARTENAIRES ---
        // On utilise 'partenaires' pour correspondre au bucket Supabase
        const { data: pData, error: pErr } = await supabase
          .from('partenaires') 
          .select('*')
          .eq('actif', true); // On suppose que la colonne est 'actif'
          
        if (pErr && pErr.code !== '42P01') console.error("Erreur partenaires:", pErr);
        setPartners(pData || []);

        // --- C. RÉCUPÉRATION DES PUBLICITÉS ---
        const { data: aData, error: aErr } = await supabase
          .from('publicites')
          .select('*')
          .eq('actif', true);
          
        if (aErr && aErr.code !== '42P01') console.error("Erreur publicités:", aErr);
        setAds(aData || []);

      } catch (err) {
        console.error("Erreur critique HomePage:", err);
      }
    };

    fetchHomeData();
  }, [dispatch]);

  // Calculer le nombre d'événements validés pour les stats du Hero
  const totalValidEvents = useMemo(() => {
    if (!list) return 0;
    return list.filter(event => event.statut === 'validé').length;
  }, [list]);

  // Fonction pour scroller vers la section événements lors d'une recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const section = document.getElementById('events-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${dark ? "bg-[#080812]" : "bg-[#fafafe]"}`}>

      {/* SECTION HERO */}
      <HeroSection
        heroRef={heroRef}
        heroInView={heroInView}
        search={search}
        setSearch={setSearch}
        handleSearch={handleSearchSubmit}
        stats={[
          { val: totalValidEvents, label: "Événements", color: "text-[#6c47ff]" },
          { val: (votes || []).length, label: "Votes actifs", color: "text-[#f5a623]" }
        ]}
      />

      {/* GESTIONNAIRE DE PUBS (Slider ou Bannière) */}
      <AdsManager ads={ads} />

      {/* SECTION ÉVÉNEMENTS (ANCRE DE RECHERCHE) */}
      <div id="events-section">
        <EventsSection
          eventsRef={eventsRef}
          eventsInView={eventsInView}
          dark={dark}
          searchQuery={search}
        />
      </div>

      {/* PREUVE SOCIALE (Compteurs, témoignages, etc.) */}
      <SocialProof />
      
      {/* SECTION VOTES / CONCOURS */}
      <VotesSection
        votes={votes}
        dark={dark}
        votesRef={votesRef}
        votesInView={votesInView}
      />

      {/* SECTION APPEL À L'ACTION */}
      <CTASection
        ctaRef={ctaRef}
        ctaInView={ctaInView}
      />

      {/* SECTION PARTENAIRES */}
      <PartnersSection partners={partners} dark={dark} />

    </div>
  );
}