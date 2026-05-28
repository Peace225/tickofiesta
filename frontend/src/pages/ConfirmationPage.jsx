import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, Receipt } from 'lucide-react';

export default function ConfirmationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f7ff] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        {/* Icône de succès */}
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Paiement réussi !</h1>
        <p className="text-slate-500 mb-8">
          Votre réservation a bien été enregistrée. Vous recevrez un e-mail de confirmation sous peu.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Home size={20} /> Retour à l'accueil
          </button>
          
          <button 
            onClick={() => navigate('/mes-reservations')} 
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Receipt size={20} /> Voir mes réservations
          </button>
        </div>
      </div>
    </div>
  );
}