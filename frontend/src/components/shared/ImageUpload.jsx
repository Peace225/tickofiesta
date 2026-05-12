import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { UploadCloud, X, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CLOUD_NAME = 'ddqb2tfvn';
const UPLOAD_PRESET = 'billetvote';

export default function ImageUpload({ value, onChange, label = "Image de couverture" }) {
  const { dark } = useSelector((s) => s.theme);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const processUpload = async (file) => {
    if (!file) return;
    
    // Vérification basique du type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image valide.", { icon: '🖼️' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setPreview(data.secure_url);
        onChange(data.secure_url);
        toast.success("Image importée avec succès !", {
          style: { borderRadius: '10px', background: dark ? '#0f0e1a' : '#fff', color: dark ? '#fff' : '#000' }
        });
      } else {
        throw new Error("Erreur de réponse Cloudinary");
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      toast.error("Impossible d'importer l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    processUpload(e.target.files[0]);
  };

  // --- GESTION DU DRAG & DROP ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault(); // Empêche la soumission du formulaire parent
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // --- STYLES PREMIUM ---
  const theme = {
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    dropzone: dark 
      ? 'bg-[#0f0e1a]/50 border-white/10 hover:border-[#6c47ff]/50 hover:bg-[#6c47ff]/5' 
      : 'bg-gray-50 border-gray-200 hover:border-[#6c47ff]/50 hover:bg-violet-50',
    dragActive: dark 
      ? 'border-[#6c47ff] bg-[#6c47ff]/10 shadow-[0_0_30px_rgba(108,71,255,0.15)]' 
      : 'border-[#6c47ff] bg-violet-100 shadow-inner',
  };

  return (
    <div className="w-full space-y-2">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.sub}`}>{label}</label>}

      {preview ? (
        <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden group border shadow-xl transition-all duration-500" style={{ borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
          <img src={preview} alt="Aperçu" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          
          {/* Overlay sombre au survol */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
            <button 
              type="button" 
              onClick={handleRemove}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95"
            >
              <X size={16} strokeWidth={3} /> Supprimer
            </button>
          </div>

          {/* Badge Succès (toujours visible si non survolé) */}
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-100 group-hover:opacity-0 transition-opacity">
            <CheckCircle2 size={12} className="text-[#00d4aa]" />
            <span className="text-[9px] font-black uppercase tracking-widest">Image chargée</span>
          </div>
        </div>
      ) : (
        <label 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-48 sm:h-56 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 overflow-hidden ${
            dragActive ? theme.dragActive : theme.dropzone
          } ${loading ? 'pointer-events-none opacity-70' : ''}`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3 animate-pulse z-10">
              <div className="w-12 h-12 rounded-full bg-[#6c47ff]/20 flex items-center justify-center">
                <Loader2 size={24} className="text-[#6c47ff] animate-spin" />
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Importation...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 z-10 text-center px-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${dragActive ? 'bg-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/30' : dark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-400 shadow-sm'}`}>
                {dragActive ? <UploadCloud size={24} /> : <ImageIcon size={24} />}
              </div>
              <div>
                <span className={`text-sm font-bold block mb-1 ${theme.text}`}>
                  Cliquez ou glissez-déposez
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>
                  JPG, PNG, WEBP (Max 5MB)
                </span>
              </div>
            </div>
          )}
          <input 
            ref={inputRef}
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={loading} 
          />
        </label>
      )}
    </div>
  );
}