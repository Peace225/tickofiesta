import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function SuccessPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);

  const purchaseId = searchParams.get('purchase_id');
  const transactionId = searchParams.get('transaction_id') || localStorage.getItem('pending_transaction_id');
  const tarifId = localStorage.getItem('pending_tarif_id');
  const montant = localStorage.getItem('pending_montant');

  useEffect(() => {
    // Si pas d'utilisateur connecté, on arrête (sécurité)
    if (!user) {
        toast.error("Vous devez être connecté pour finaliser cette transaction.");
        navigate('/login');
        return;
    }

    // Le but est de créer le billet si on a les infos en cache (suite à un retour de GeniusPay)
    // OU d'afficher le billet existant si on revient avec un purchaseId.
    const processAndFetchTickets = async () => {
      try {
        setLoading(true);
        let finalPurchaseId = purchaseId;

        // --- ÉTAPE 1 : GÉNÉRATION DU BILLET (Si retour direct de paiement) ---
        if (!finalPurchaseId && tarifId) {
            
            // 1a. Création de l'achat
            const { data: purchaseData, error: purchaseErr } = await supabase
              .from('purchases')
              .insert([{
                user_id: user.id,
                montant: parseFloat(montant || 0),
                status: 'completed',
                transaction_ref: transactionId || `GEN-${Date.now()}`
              }])
              .select()
              .single();

            if (purchaseErr) throw purchaseErr;
            finalPurchaseId = purchaseData.id;

            // 1b. Création du billet dans le portefeuille client
            const { error: ticketErr } = await supabase
              .from('user_tickets')
              .insert([{
                user_id: user.id,
                ticket_type_id: tarifId,
                purchase_id: finalPurchaseId,
                scanned: false
              }]);

            if (ticketErr) throw ticketErr;

            // 1c. Mise à jour de la table tarifs (incrément des ventes)
            // Si vous n'avez pas de fonction RPC, on met à jour via un select puis update
            const { data: currentTarif } = await supabase.from('tarifs').select('quantite_vendue, quantite_disponible').eq('id', tarifId).single();
            if (currentTarif) {
                await supabase.from('tarifs')
                .update({ 
                    quantite_vendue: (currentTarif.quantite_vendue || 0) + 1,
                    quantite_disponible: Math.max((currentTarif.quantite_disponible || 0) - 1, 0)
                })
                .eq('id', tarifId);
            }

            // Nettoyage après succès
            localStorage.removeItem('pending_tarif_id');
            localStorage.removeItem('pending_montant');
            localStorage.removeItem('pending_transaction_id');
        }

        if (!finalPurchaseId) {
            throw new Error("Identifiant d'achat introuvable.");
        }

        // --- ÉTAPE 2 : RÉCUPÉRATION POUR AFFICHAGE ET PDF ---
        
        // 2a. Récupération des tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('user_tickets')
          .select('id, ticket_type_id')
          .eq('purchase_id', finalPurchaseId);

        if (ticketsError) throw ticketsError;
        setTickets(ticketsData || []);

        // 2b. Récupération des détails liés à l'événement
        if (ticketsData && ticketsData.length > 0) {
          const { data: typeData, error: typeError } = await supabase
            .from('tarifs') // IMPORTANT: Mise à jour du nom de la table selon vos captures d'écran
            .select('nom, prix, events:event_id(titre, date, lieu, image)') // Ajustement des relations
            .eq('id', ticketsData[0].ticket_type_id)
            .single();

          if (typeError) throw typeError;
          setEventDetails(typeData);
        }

      } catch (err) {
        console.error("Erreur de traitement:", err.message);
        toast.error("Une erreur s'est produite lors de la finalisation.");
      } finally {
        setLoading(false);
      }
    };

    processAndFetchTickets();
  }, [purchaseId, tarifId, montant, user, navigate, transactionId]);

  // Fonction pour pré-charger l'image de l'événement et éviter les bugs de rendu PDF
  const preloadImage = (path) => {
    return new Promise((resolve) => {
      if (!path) return resolve(null);
      const { data } = supabase.storage.from('events').getPublicUrl(path);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = data.publicUrl;
      img.onload = () => resolve(data.publicUrl);
      img.onerror = () => resolve(null);
    });
  };

  const handleDownloadPDF = async () => {
    if (tickets.length === 0) return;
    
    setDownloading(true);
    const loader = toast.loading('Génération du PDF en cours...');

    try {
      await preloadImage(eventDetails?.events?.image);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [380, 640] });

      for (let i = 0; i < tickets.length; i++) {
        const element = document.getElementById(`ticket-card-${tickets[i].id}`);
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0A0A12'
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([380, 640], 'portrait');
        pdf.addImage(imgData, 'PNG', 0, 0, 380, 640);
      }

      pdf.save(`Ticket-${(purchaseId || 'Gen').substring(0, 8)}.pdf`);
      toast.success('Téléchargé avec succès !', { id: loader });
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur lors de la génération.', { id: loader });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4aa]"></div>
        <p className="mt-4 text-xs uppercase tracking-widest text-slate-400">Finalisation de la commande...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] text-white py-12 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <CheckCircle2 size={64} className="text-[#00d4aa] mx-auto animate-bounce" />
        <h1 className="text-3xl font-black">Paiement Réussi !</h1>
        
        <div className="flex justify-center gap-4">
          <button onClick={handleDownloadPDF} disabled={downloading} className="bg-[#00d4aa] text-black px-8 py-4 rounded-xl font-black uppercase text-xs hover:bg-[#00b390] transition-colors">
            {downloading ? 'Génération...' : 'Télécharger mes billets'}
          </button>
          <button onClick={() => navigate('/mes-billets')} className="bg-white/10 px-8 py-4 rounded-xl font-black uppercase text-xs hover:bg-white/20 transition-all border border-white/20">
            Voir le portefeuille
          </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto mt-12 space-y-8">
        {tickets.map((ticket) => (
          <div key={ticket.id} id={`ticket-card-${ticket.id}`} className="bg-[#0A0A12] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="w-full h-40 bg-slate-900">
               {eventDetails?.events?.image && (
                 <img 
                    src={supabase.storage.from('events').getPublicUrl(eventDetails.events.image).data.publicUrl} 
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous" 
                    alt="event" 
                 />
               )}
            </div>
            <div className="p-6 text-center">
              <h2 className="font-black text-xl mb-2">{eventDetails?.events?.titre}</h2>
              <div className="my-6 bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={ticket.id} size={150} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">ID Billet: {ticket.id.substring(0, 12)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}