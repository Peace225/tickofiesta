import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Trophy, Lock, Plus, Calendar, Type, Tag } from "lucide-react";
import { supabase } from "../../config/supabaseClient";

const CATEGORIES = [
  { value: "awards", label: "Awards / Célébrités", desc: "Pour élire une personnalité (Miss, Mister, Influenceur)." },
  { value: "beaute", label: "Beauté / Mode", desc: "Concours de beauté, mannequinat, style." },
  { value: "sport", label: "Sport / Compétition", desc: "Tournois, MVP, meilleur athlète." },
  { value: "entreprise", label: "Business / Entreprise", desc: "Employé du mois, meilleure startup." },
  { value: "culture", label: "Culture / Art", desc: "Musique, danse, peinture, théâtre." },
  { value: "education", label: "Éducation", desc: "Meilleur élève, concours scolaire." },
  { value: "cuisine", label: "Cuisine / Gastronomie", desc: "Meilleur chef, recette populaire." },
  { value: "autre", label: "Autre", desc: "Catégorie personnalisée." },
];

// ✅ FONCTION DE GÉNÉRATION DE SLUG (URL propre et unique)
const generateSlug = (titre) => {
  const baseSlug = titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-")     // Remplace les espaces par des tirets
    .replace(/(^-|-$)+/g, "");       // Nettoie les bords

  // Ajoute un identifiant court pour garantir l'unicité
  const uniqueId = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${uniqueId}`;
};

export default function OrgVoteCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSecuring, setIsSecuring] = useState(true);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("awards");
  const [description, setDescription] = useState("");
  const [endAt, setEndAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsSecuring(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Image max 5Mo");
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveVote = async () => {
    if (!title.trim()) throw new Error("Nom du concours requis");
    if (!endAt) throw new Error("Date de clôture requise");

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Vous devez être connecté");

      let imageUrl = null;
      if (image) {
        const ext = image.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
        .from("concours")
        .upload(fileName, image, { upsert: false, contentType: image.type });

        if (upErr) throw new Error("Upload image échoué: " + upErr.message);

        const { data } = supabase.storage.from("concours").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // ✅ Génération du slug unique à partir du titre
      const voteSlug = generateSlug(title);

      const { data: vote, error } = await supabase
      .from("votes")
      .insert({
          title: title.trim(),
          slug: voteSlug, // ✅ Insertion du slug
          description: description.trim() || null,
          category,
          end_at: endAt,
          image_url: imageUrl,
          organizer_id: user.id,
          status: "draft"
        })
      .select()
      .single();

      if (error) throw new Error(error.message);
      return vote;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveVote();
      navigate("/dashboard/votes", { replace: true });
    } catch(err){
      console.error(err);
      alert(err.message);
    }
  };

  const handleAddParticipants = async (e) => {
    e.preventDefault();
    try {
      const v = await saveVote();
      if (!v?.id) throw new Error("ID vote manquant");
      navigate(`/dashboard/votes/${v.id}/candidats/create`);
    } catch(err){
      console.error(err);
      alert(err.message);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.value === category);

  if (isSecuring) return <div className="min-h-screen grid place-items-center bg-slate-50"><p className="text-violet-600 animate-pulse font-bold">Initialisation...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-200">
            <Trophy className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-4">Nouveau Challenge</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <div className="group cursor-pointer" onClick={() =>!submitting && fileInputRef.current?.click()}>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Affiche du concours</label>
            <div className="relative h-48 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 hover:border-violet-400 transition">
              {preview? <img src={preview} alt="" className="h-full w-full object-cover" /> : (
                <div className="text-center p-4">
                  <Upload className="mx-auto text-violet-500 mb-2" size={24}/>
                  <p className="font-bold text-sm text-slate-600">Ajouter une affiche</p>
                  <p className="text-xs text-slate-400">PNG, JPG - 5Mo max</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={submitting} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Type className="absolute left-3.5 top-3.5 text-slate-400" size={18}/>
              <input value={title} onChange={e=>setTitle(e.target.value)} disabled={submitting} placeholder="Nom du concours (Ex: Miss CI 2026)" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 outline-none disabled:opacity-60" />
            </div>

            <div className="relative">
              <Tag className="absolute left-3.5 top-3.5 text-slate-400" size={18}/>
              <select value={category} onChange={e => setCategory(e.target.value)} disabled={submitting} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 outline-none appearance-none disabled:opacity-60">
                {CATEGORIES.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
              </select>
            </div>

            {selectedCat && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-50 border border-violet-100">
                <Trophy size={14} className="text-violet-600 mt-0.5 shrink-0"/>
                <p className="text-xs text-violet-800"><span className="font-bold">{selectedCat.label} :</span> {selectedCat.desc}</p>
              </div>
            )}

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={18}/>
              <input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} disabled={submitting} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 focus:bg-white border-slate-200 focus:border-violet-500 outline-none disabled:opacity-60" />
            </div>

            <textarea value={description} onChange={e=>setDescription(e.target.value)} disabled={submitting} placeholder="Description, règles, prix à gagner..." rows={3} className="w-full p-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 outline-none resize-none disabled:opacity-60" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={handleSave} disabled={submitting} className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50">
              <Lock size={16}/> {submitting? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" onClick={handleAddParticipants} disabled={submitting} className="flex-1 py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50">
              <Plus size={16}/> {submitting? "Création..." : "Ajouter Candidats"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}