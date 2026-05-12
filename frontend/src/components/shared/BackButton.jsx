import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to, label = 'Retour' }) {
  const navigate = useNavigate();
  // On récupère le thème pour que le bouton s'adapte parfaitement partout
  const { dark } = useSelector((s) => s.theme); 

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button 
      onClick={handleClick}
      className={`group flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 backdrop-blur-md border ${
        dark 
          ? 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
          : 'bg-white/60 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-300'
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-x-1 ${
        dark 
          ? 'bg-white/10 text-white group-hover:bg-[#6c47ff]' 
          : 'bg-gray-100 text-gray-700 group-hover:bg-[#6c47ff] group-hover:text-white'
      }`}>
        <ArrowLeft size={14} strokeWidth={2.5} />
      </div>
      {label}
    </button>
  );
}