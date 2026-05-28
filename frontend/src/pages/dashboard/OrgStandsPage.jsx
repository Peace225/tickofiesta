import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { Plus, Image as ImageIcon, Loader2, MapPin, Tag, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgStandsPage() {
  const user = useSelector(s => s.auth.user);
  const fileRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    nom: '', description: '', prix_location: '', taille_m2: '', emplacement: '', type: 'standard'
  });

  useEffect(() => { if (user?.id) fetchEvents(); }, [user?.id]);
  useEffect(() => { fetchStands(); }, [selectedEvent, user?.id]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('id, titre').eq('organisateur_id', user.id);
    setEvents(data || []);
  };

  const fetchStands = async () => {
    if (!user?.id || !selectedEvent) { setStands([]); return; }
    let query = supabase.from('stands').select('*').eq('organisateur_id', user.id);
    query = selectedEvent === 'none' ? query.is('event_id', null) : query.eq('event_id', selectedEvent);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) toast.error("Erreur chargement stands");
    else setStands(data || []);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return toast.error("Sélectionnez un événement");
    
    setLoading(true);
    try {
      let publicUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('stands').upload(fileName, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('stands').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // Construction de l'objet d'insertion en respectant strictement vos colonnes
      const standData = {
        nom: form.nom,
        description: form.description || null,
        type: form.type,
        prix_location: form.prix_location ? parseFloat(form.prix_location) : 0,
        taille_m2: form.taille_m2 ? parseFloat(form.taille_m2) : null,
        emplacement: form.emplacement || null,
        event_id: selectedEvent === 'none' ? null : selectedEvent,
        organisateur_id: user.id,
        image_url: publicUrl,
        statut: 'disponible'
      };

      const { error: insertErr } = await supabase.from('stands').insert([standData]);

      if (insertErr) throw insertErr;

      toast.success('Stand ajouté !');
      setShowForm(false);
      setForm({ nom: '', description: '', prix_location: '', taille_m2: '', emplacement: '', type: 'standard' });
      setPreview(null);
      setFile(null);
      fetchStands();
    } catch (err) {
      console.error(err);
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion des Stands</h1>
      
      <select className="mb-6 p-2 border rounded-lg w-full md:w-64 bg-white" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
        <option value="">Sélectionnez un contexte</option>
        <option value="none">Hors événement</option>
        {events.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}
      </select>

      <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-6">
        <Plus size={20} /> Ajouter un stand
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border rounded-2xl bg-white shadow-sm space-y-4 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nom du stand" className="p-2 border rounded" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
            <input type="number" placeholder="Prix (FCFA)" className="p-2 border rounded" value={form.prix_location} onChange={e => setForm({...form, prix_location: e.target.value})} required />
            <select className="p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="corner">Corner</option>
            </select>
            <input type="number" placeholder="Taille (m²)" className="p-2 border rounded" value={form.taille_m2} onChange={e => setForm({...form, taille_m2: e.target.value})} />
          </div>
          <input type="text" placeholder="Emplacement / Zone" className="w-full p-2 border rounded" value={form.emplacement} onChange={e => setForm({...form, emplacement: e.target.value})} />
          <textarea placeholder="Description..." className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          
          <button type="button" onClick={() => fileRef.current.click()} className="flex items-center gap-2 text-violet-600">
            <ImageIcon size={20} /> {file ? "Changer l'image" : "Choisir une image"}
          </button>
          <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          {preview && <img src={preview} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg" />}
          
          <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Valider l'ajout"}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stands.map(s => (
          <div key={s.id} className="border rounded-2xl p-4 bg-white shadow-sm">
            {s.image_url && <img src={s.image_url} alt={s.nom} className="w-full h-32 object-cover rounded-xl mb-3" />}
            <h3 className="font-bold text-lg">{s.nom}</h3>
            <div className="text-xs text-gray-500 space-y-1 mt-2">
              <p className="flex items-center gap-1"><Tag size={12}/> {s.type}</p>
              <p className="flex items-center gap-1"><MapPin size={12}/> {s.emplacement || 'Non défini'}</p>
              <p className="flex items-center gap-1"><Ruler size={12}/> {s.taille_m2 || 0} m²</p>
            </div>
            <p className="text-violet-600 font-bold mt-3">{s.prix_location?.toLocaleString()} FCFA</p>
          </div>
        ))}
      </div>
    </div>
  );
}