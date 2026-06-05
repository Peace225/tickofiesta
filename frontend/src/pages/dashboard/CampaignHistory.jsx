import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useSelector } from 'react-redux';
import { Calendar, Mail, MousePointer2, Loader2 } from 'lucide-react';

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dark = useSelector((state) => state.theme?.dark) ?? false;

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('organisateur_id', user.id)
        .order('created_at', { ascending: false });
      
      setCampaigns(data || []);
      setLoading(false);
    };
    fetchCampaigns();
  }, [user.id]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className={`text-2xl font-black mb-6 ${dark ? 'text-white' : 'text-slate-900'}`}>Historique des campagnes</h2>
      
      {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <div className="grid gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className={`p-6 rounded-3xl border flex items-center justify-between ${dark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl"><Mail size={20}/></div>
                <div>
                  <h4 className="font-bold">{camp.campaign_name}</h4>
                  <p className="text-xs text-slate-400"><Calendar className="inline mr-1" size={12}/> {new Date(camp.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Envoyés</p>
                  <p className="font-black text-lg">{camp.emails_sent}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Clics</p>
                  <p className="font-black text-lg text-emerald-500">{camp.clicks || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}