import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BarChart3, Users, MousePointerClick, DollarSign, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

export default function Analytics() {
  const [stats, setStats] = useState({ opens: 0, clicks: 0, revenue: 0 });
  const dark = useSelector((state) => state.theme?.dark) ?? false;

  useEffect(() => {
    // Ici, vous récupérerez vos données de la table 'campaign_stats'
    // Pour l'instant, voici des données simulées pour la structure
    setStats({ opens: 1240, clicks: 450, revenue: 8900 });
  }, []);

  const kpis = [
    { label: "Emails Ouverts", value: stats.opens, icon: Users, color: "text-blue-500" },
    { label: "Clics sur Liens", value: stats.clicks, icon: MousePointerClick, color: "text-violet-500" },
    { label: "Revenu Généré", value: `${stats.revenue} €`, icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className={`p-8 max-w-7xl mx-auto ${dark ? 'text-white' : 'text-gray-900'}`}>
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <BarChart3 className="text-violet-600" /> Analytics de Campagnes
      </h1>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {kpis.map((kpi, i) => (
          <div key={i} className={`p-6 rounded-3xl border ${dark ? 'bg-[#18181b] border-zinc-800' : 'bg-white'}`}>
            <div className={`p-3 rounded-2xl inline-block ${dark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase mt-4">{kpi.label}</p>
            <h3 className="text-3xl font-black mt-1">{kpi.value}</h3>
          </div>
        ))}
      </div>
      
      {/* Ici nous intégrerons votre graphique de performance */}
    </div>
  );
}