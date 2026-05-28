import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { Upload, Plus, Trash2, ArrowLeft } from "lucide-react";

export default function OrgCandidatsCreatePage() {
  const { id: voteId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [candidats, setCandidats] = useState([]);
  const [nom, setNom] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Charge les candidats déjà créés
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
       .from("candidats")
       .select("*")
       .eq("vote_id", voteId)
       .order("numero", { ascending: true });
      if (data) setCandidats(data);
    };
    if (voteId) load();
  }, [voteId]);

  // Nettoie l'URL blob
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Max 5Mo");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const addCandidat = async () => {
    if (!nom.trim()) return alert("Nom requis");
    if (!voteId) return alert("Vote introuvable");

    setLoading(true);
    try {
      let photoUrl = null;
      let photoPath = null;

      if (photo) {
        const ext = photo.name.split('.').pop();
        photoPath = `candidats/${voteId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("concours").upload(photoPath, photo, { upsert: false });
        if (upErr) throw upErr;
        photoUrl = supabase.storage.from("concours").getPublicUrl(photoPath).data.publicUrl;
      }

      const nextNumero = (candidats.at(-1)?.numero || 0) + 1;

      const { data, error } = await supabase
       .from("candidats")
       .insert({
          vote_id: voteId,
          nom: nom.trim(),
          description: bio.trim() || null,
          photo_url: photoUrl,
          photo_path: photoPath, // ← ajoute cette colonne dans ta table pour supprimer facilement
          numero: nextNumero
        })
       .select()
       .single();

      if (error) throw error;

      setCandidats([...candidats, data]);
      setNom(""); setBio(""); setPhoto(null); setPreview("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCandidat = async (c) => {
    if (!confirm(`Supprimer ${c.nom}?`)) return;
    try {
      await supabase.from("candidats").delete().eq("id", c.id);
      if (c.photo_path) {
        await supabase.storage.from("concours").remove([c.photo_path]);
      }
      setCandidats(candidats.filter(x => x.id!== c.id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-600 mb-4 hover:text-slate-900">
          <ArrowLeft size={16}/> Retour
        </button>

        <h1 className="text-2xl font-black mb-6">Ajouter les candidats</h1>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Formulaire */}
          <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm h-fit">
            <h2 className="font-bold mb-4">Nouveau candidat</h2>

            <div onClick={() => fileRef.current?.click()} className="h-32 rounded-xl border-2 border-dashed grid place-items-center cursor-pointer mb-3 bg-slate-50 hover:border-violet-400 transition">
              {preview? <img src={preview} alt="" className="h-full w-full object-cover rounded-xl"/> : (
                <div className="text-center">
                  <Upload size={20} className="text-violet-500 mx-auto"/>
                  <p className="text-xs mt-1">Photo</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
            </div>

            <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom complet" className="w-full h-10 px-3 rounded-lg bg-slate-50 mb-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"/>

            <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Bio courte (optionnel)" rows={2} className="w-full p-2 rounded-lg bg-slate-50 mb-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"/>

            <button onClick={addCandidat} disabled={loading ||!nom.trim()} className="w-full h-10 bg-violet-600 text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-violet-700">
              <Plus size={16}/> {loading? "Ajout..." : "Ajouter"}
            </button>
          </div>

          {/* Liste */}
          <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold mb-4">Candidats ({candidats.length})</h2>
            <div className="space-y-2 max-h- overflow-y-auto pr-1">
              {candidats.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 group">
                  <img src={c.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nom)}&background=8b5cf6&color=fff`} alt={c.nom} className="w-10 h-10 rounded-lg object-cover"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.numero}. {c.nom}</p>
                    <p className="text-xs text-slate-500 truncate">{c.description || "—"}</p>
                  </div>
                  <button onClick={()=>deleteCandidat(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
              {candidats.length===0 && <p className="text-center text-slate-400 py-8 text-sm">Aucun candidat ajouté</p>}
            </div>

            {candidats.length > 0 && (
              <button onClick={()=>navigate(`/dashboard/votes/${voteId}`)} className="w-full mt-4 h-10 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700">
                Terminer et publier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}