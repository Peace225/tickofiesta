import { useSelector } from 'react-redux';
import { CreditCard, ArrowUpRight } from 'lucide-react';

export default function ClientTransactions() {
  const { dark } = useSelector((s) => s.theme);
  
  const theme = {
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-lg mx-auto lg:max-w-4xl">
      <div className="mb-8">
        <h1 className={`text-3xl font-black tracking-tighter ${theme.text}`}>Paiements</h1>
        <p className={`text-xs uppercase font-bold tracking-widest mt-1 ${theme.sub}`}>Historique des transactions</p>
      </div>

      <div className="space-y-3">
        {/* Placeholder pour une transaction vide */}
        <div className={`flex flex-col items-center justify-center py-20 rounded-[2rem] border border-dashed ${theme.card}`}>
          <CreditCard size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
          <p className={`text-sm font-black ${theme.text}`}>Aucun achat récent</p>
        </div>
      </div>
    </div>
  );
}