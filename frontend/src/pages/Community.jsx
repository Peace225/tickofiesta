import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, Eye, Image as ImageIcon, Mic, Square, Trash2, Heart, Smile, Flame, BadgeCheck, X, Pencil, Reply, AtSign } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

// Son de notification (URL publique Google sécurisée)
const POP_SOUND_URL = 'https://actions.google.com/sounds/v1/ui/pop_up_01.ogg';

export default function Community() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États : Réponses & Éditions
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // États : Mentions (@)
  const [mentionSearch, setMentionSearch] = useState(null);

  // Temps Réel (Typing)
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  // Médias
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Références
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const formatDate = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  
  const formatDaySeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  // --- INITIALISATION ---
  useEffect(() => {
    fetchPosts();
    const room = supabase.channel('tickolive_room');

    room.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId !== user?.id) {
        setTypingUser(payload.payload.nom);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
      }
    });

    room.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
      // 🔊 Jouer le son si ce n'est pas notre propre message
      if (payload.new.user_id !== user?.id) {
        try {
          const audio = new Audio(POP_SOUND_URL);
          audio.volume = 0.4; // Volume doux
          audio.play();
        } catch (e) { console.log("Erreur audio silencieuse"); }
      }
      fetchPosts();
    });

    room.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_posts' }, () => fetchPosts());
    room.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, () => fetchPosts());

    room.subscribe();
    channelRef.current = room;

    return () => supabase.removeChannel(room);
  }, [user]);

  useEffect(() => {
    if (!editingId && !replyingTo) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [posts, typingUser, editingId]);

  const fetchPosts = async () => {
    const { data } = await supabase.from('community_posts')
      .select('id, content, image_url, audio_url, views_count, created_at, user_id, likes_count, reply_to, profiles:user_id(nom, avatar_url)')
      .order('created_at', { ascending: true });
    setPosts(data || []);
  };

  const handleLike = async (postId, currentLikes) => {
    await supabase.from('community_posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    setPosts(posts.filter(p => p.id !== postId));
    await supabase.from('community_posts').delete().eq('id', postId);
  };

  const handleEditSubmit = async (postId) => {
    if (!editValue.trim()) return;
    setPosts(posts.map(p => p.id === postId ? { ...p, content: editValue.trim() } : p));
    setEditingId(null);
    setEditValue('');
    await supabase.from('community_posts').update({ content: editValue.trim() }).eq('id', postId);
  };

  // --- GESTION DES MENTIONS ET DE LA FRAPPE ---
  const handleTyping = (e) => {
    const val = e.target.value;
    setNewPost(val);
    
    // Détection du @ pour le tag
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setMentionSearch(lastWord.substring(1).toLowerCase());
    } else {
      setMentionSearch(null);
    }

    // Broadcast Typing
    if (user && channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, nom: user.user_metadata?.nom || 'Un VIP' }});
    }
  };

  const insertMention = (nom) => {
    const words = newPost.split(' ');
    words.pop(); // Retire la recherche partielle
    setNewPost([...words, `@${nom} `].join(' '));
    setMentionSearch(null);
    inputRef.current?.focus();
  };

  // Rendu du texte avec les Mentions en surbrillance
  const renderTextWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_À-ÿ-]+)/g);
    return parts.map((part, i) => 
      part.startsWith('@') 
        ? <span key={i} className="text-[#00d4aa] font-black">{part}</span> 
        : part
    );
  };

  // Extraction des VIPs actifs pour la liste de suggestion
  const uniqueUsers = Array.from(new Map(posts.map(p => [p.profiles?.nom, p.profiles])).values()).filter(Boolean);
  const filteredMentions = uniqueUsers.filter(u => u.nom && u.nom.toLowerCase().includes(mentionSearch || ''));

  // --- LOGIQUE VOCALE ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { toast.error("Microphone non autorisé."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // --- ENVOI ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if ((!newPost.trim() && !imageFile && !audioBlob) || !user) return;
    
    setIsSubmitting(true);
    let uploadedImageUrl = null;
    let uploadedAudioUrl = null;

    try {
      if (imageFile) {
        const fileName = `${Date.now()}_img.${imageFile.name.split('.').pop()}`;
        await supabase.storage.from('community_media').upload(`images/${fileName}`, imageFile);
        uploadedImageUrl = supabase.storage.from('community_media').getPublicUrl(`images/${fileName}`).data.publicUrl;
      }
      if (audioBlob) {
        const fileName = `${Date.now()}_audio.webm`;
        await supabase.storage.from('community_media').upload(`audio/${fileName}`, audioBlob);
        uploadedAudioUrl = supabase.storage.from('community_media').getPublicUrl(`audio/${fileName}`).data.publicUrl;
      }

      const replyData = replyingTo ? {
        id: replyingTo.id, nom: replyingTo.profiles?.nom, content: replyingTo.content, hasMedia: !!(replyingTo.image_url || replyingTo.audio_url)
      } : null;

      await supabase.from('community_posts').insert([{ 
        user_id: user.id, content: newPost.trim(), image_url: uploadedImageUrl, audio_url: uploadedAudioUrl, reply_to: replyData
      }]);

      setNewPost('');
      setImageFile(null);
      setImagePreview(null);
      setAudioBlob(null);
      setShowEmojiPicker(false);
      setReplyingTo(null);
      setMentionSearch(null);
    } catch (error) {
      toast.error("Erreur d'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-80px)] overflow-hidden ${dark ? 'bg-[#0a0a16]' : 'bg-[#f7f8fa]'}`}>
      
      {/* HEADER SOCIAL PROOF */}
      <div className={`shrink-0 p-4 md:p-6 z-40 border-b backdrop-blur-xl flex items-center justify-between ${dark ? 'bg-[#0a0a16]/80 border-white/5' : 'bg-white/90 border-gray-100 shadow-sm'}`}>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ticko<span className="text-[#6c47ff]">Live</span></h1>
          <div className="flex items-center gap-1 mt-1">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">En direct</span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex -space-x-3 mr-3">
            <img className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0a0a16]" src="https://ui-avatars.com/api/?name=B&background=6c47ff&color=fff" alt="" />
            <img className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0a0a16]" src="https://ui-avatars.com/api/?name=S&background=00d4aa&color=fff" alt="" />
            <img className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0a0a16]" src="https://ui-avatars.com/api/?name=K&background=f43f5e&color=fff" alt="" />
          </div>
          <div className="text-xs font-bold bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full">+124 VIPs</div>
        </div>
      </div>

      {/* ZONE DE MESSAGES */}
      <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 pt-6 pb-4 scrollbar-hide">
        
        <div className={`flex items-center gap-4 p-5 rounded-3xl border mb-8 ${dark ? 'bg-[#151522] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] text-white shadow-lg shadow-[#6c47ff]/30"><Flame size={24} /></div>
          <div>
            <h2 className="font-black text-lg leading-tight">Le salon VIP est ouvert</h2>
            <p className="text-sm opacity-60">Réagissez et échangez avec les autres membres.</p>
          </div>
        </div>

        {(() => {
          let lastDate = null;
          return posts.map((post) => {
            const currentDate = new Date(post.created_at).toDateString();
            const showDateSeparator = currentDate !== lastDate;
            lastDate = currentDate;
            const isMyMessage = user && post.user_id === user.id;

            return (
              <React.Fragment key={post.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-6">
                    <span className="text-[10px] font-bold bg-black/5 dark:bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-widest opacity-60">
                      {formatDaySeparator(post.created_at)}
                    </span>
                  </div>
                )}

                <div className={`group flex gap-3 mb-6 ${isMyMessage ? 'justify-end' : ''}`}>
                  {!isMyMessage && <img src={post.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=U'} className="w-9 h-9 rounded-full object-cover shadow-sm" alt="avatar" />}
                  
                  <div className={`relative p-4 rounded-2xl max-w-[80%] border ${isMyMessage ? 'bg-[#6c47ff] text-white rounded-br-sm border-transparent shadow-[0_4px_20px_rgba(108,71,255,0.2)]' : dark ? 'bg-[#1e1e2d] text-gray-200 border-white/5 rounded-bl-sm' : 'bg-white text-gray-800 border-gray-100 rounded-bl-sm shadow-sm'}`}>
                    
                    {!isMyMessage && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <p className="text-[11px] font-black opacity-80 uppercase tracking-wide">{post.profiles?.nom}</p>
                        <BadgeCheck size={14} className="text-[#00d4aa]" />
                      </div>
                    )}

                    {post.reply_to && (
                      <div className={`p-2 mb-3 rounded-lg text-[11px] border-l-2 ${isMyMessage ? 'bg-black/10 border-white/50' : 'bg-black/5 dark:bg-white/5 border-[#00d4aa]'}`}>
                        <span className="font-bold block opacity-90">{post.reply_to.nom}</span>
                        <span className="opacity-70 truncate block mt-0.5">
                          {post.reply_to.content || (post.reply_to.hasMedia ? '📸 Média partagé' : 'Message vocal')}
                        </span>
                      </div>
                    )}
                    
                    {post.image_url && <img src={post.image_url} className="rounded-xl mb-3 w-full object-cover" alt="Media" />}
                    {post.audio_url && <audio controls className="w-full h-8 mb-3" src={post.audio_url} />}
                    
                    {editingId === post.id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-white/20 text-white placeholder-white/50 rounded-lg p-2 text-[14px] outline-none resize-none focus:ring-1 focus:ring-white/50" rows={2} autoFocus />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-bold transition-colors">Annuler</button>
                          <button onClick={() => handleEditSubmit(post.id)} className="px-3 py-1 bg-[#00d4aa] text-[#0a0a16] hover:bg-emerald-400 rounded-md text-[10px] font-black transition-colors shadow-lg">Sauver</button>
                        </div>
                      </div>
                    ) : (
                      // 🟢 Affichage du texte avec les Mentions mises en forme
                      post.content && <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{renderTextWithMentions(post.content)}</p>
                    )}
                    
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 mt-3 pt-3 border-t text-[10px] font-bold ${isMyMessage ? 'text-white/80 border-white/20' : 'text-gray-400 border-black/5 dark:border-white/5'}`}>
                      <span>{formatDate(post.created_at)}</span>
                      
                      {isMyMessage ? (
                        <div className="flex items-center gap-3 ml-2">
                          <button onClick={() => setReplyingTo(post)} className="hover:text-blue-300 transition-colors" title="Répondre"><Reply size={12} /></button>
                          <button onClick={() => { setEditingId(post.id); setEditValue(post.content || ''); }} className="hover:text-emerald-300 transition-colors" title="Modifier"><Pencil size={12} /></button>
                          <button onClick={() => handleDeletePost(post.id)} className="hover:text-red-300 transition-colors" title="Supprimer"><Trash2 size={12} /></button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setReplyingTo(post)} className="hover:text-blue-400 transition-colors" title="Répondre"><Reply size={14} /></button>
                          <button onClick={() => handleLike(post.id, post.likes_count)} className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white transition-colors">
                            <Heart size={12}/> {post.likes_count > 0 ? post.likes_count : 'J\'aime'}
                          </button>
                        </>
                      )}
                      
                      <span className="flex items-center gap-1 ml-auto">
                        <Eye size={12}/> {post.views_count > 10 ? `Vu par ${post.views_count}` : 'Lu'}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          });
        })()}

        {typingUser && (
          <div className="flex items-center gap-3 opacity-60 pb-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex gap-1 bg-gray-200 dark:bg-white/10 px-3 py-2 rounded-full">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span className="text-[11px] font-bold">{typingUser} est en train d'écrire...</span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* BARRE DE SAISIE */}
      <div className={`shrink-0 w-full px-4 pb-6 pt-2 flex justify-center z-50 relative ${dark ? 'bg-gradient-to-t from-[#0a0a16] to-transparent' : 'bg-gradient-to-t from-[#f7f8fa] to-transparent'}`}>
        <div className="w-full max-w-2xl relative">
          
          {/* MENU DES MENTIONS FLOTTANT */}
          {mentionSearch !== null && filteredMentions.length > 0 && (
            <div className={`absolute bottom-full left-12 mb-3 w-64 max-h-40 overflow-y-auto rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50 ${dark ? 'bg-[#1e1e2d] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="p-2 text-[10px] font-black uppercase text-gray-500 tracking-wider">Membres VIP</div>
              {filteredMentions.map(u => (
                <button 
                  key={u.id || u.nom} 
                  onClick={() => insertMention(u.nom)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${dark ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-800'}`}
                >
                  <img src={u.avatar_url || 'https://ui-avatars.com/api/?name=U'} className="w-6 h-6 rounded-full" alt="" />
                  <span className="text-sm font-bold">{u.nom}</span>
                </button>
              ))}
            </div>
          )}

          {replyingTo && (
            <div className={`absolute bottom-full left-0 w-full mb-3 p-3 rounded-2xl border-l-4 border-[#00d4aa] flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 ${dark ? 'bg-[#1e1e2d]/95' : 'bg-white/95'}`}>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-[#00d4aa] mb-0.5">Réponse à {replyingTo.profiles?.nom}</p>
                <p className={`text-[12px] truncate opacity-70 ${dark ? 'text-white' : 'text-gray-800'}`}>
                  {replyingTo.content || (replyingTo.image_url ? '📷 Image' : '🎤 Note vocale')}
                </p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1.5 bg-black/5 dark:bg-white/10 rounded-full hover:bg-rose-500 hover:text-white transition-colors"><X size={14} /></button>
            </div>
          )}

          {imagePreview && (
            <div className="absolute bottom-full left-4 mb-3">
              <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-xl border-2 border-[#6c47ff] object-cover shadow-2xl" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full"><X size={14} /></button>
            </div>
          )}

          <div className={`rounded-full p-2 flex items-center gap-2 shadow-2xl border backdrop-blur-2xl ${dark ? 'bg-[#151522]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
            
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-4 text-red-500 font-bold text-sm">
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping" /> {formatTime(recordingTime)}</div>
                <button onClick={stopRecording} className="p-2.5 bg-red-500/10 rounded-full"><Square size={16} className="fill-red-500" /></button>
              </div>
            ) : audioBlob ? (
              <div className="flex-1 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-[#00d4aa] font-bold text-sm"><Mic size={16} /> Note vocale</div>
                <button onClick={() => setAudioBlob(null)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-400 hover:text-[#6c47ff]"><Smile size={22} /></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-[#6c47ff]">
                  <ImageIcon size={22} />
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { setImageFile(e.target.files[0]); setImagePreview(URL.createObjectURL(e.target.files[0])); }} className="hidden" />
                </button>
                <input 
                  ref={inputRef}
                  value={newPost} 
                  onChange={handleTyping} 
                  className="flex-1 bg-transparent p-2 outline-none text-[15px]" 
                  placeholder={replyingTo ? `Répondre à ${replyingTo.profiles?.nom}...` : "Votre message..."} 
                  autoComplete="off"
                />
              </>
            )}

            {(!newPost.trim() && !imageFile && !audioBlob && !isRecording) ? (
              <button onClick={startRecording} className="p-3.5 text-gray-400 hover:text-[#6c47ff] hover:bg-[#6c47ff]/10 rounded-full"><Mic size={22} /></button>
            ) : (
              <button onClick={handlePostSubmit} disabled={isSubmitting} className="p-3.5 bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white rounded-full shadow-lg hover:scale-105"><Send size={20} /></button>
            )}
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-20 right-0 shadow-2xl">
              <EmojiPicker onEmojiClick={(e) => { setNewPost(p => p + e.emoji); inputRef.current?.focus(); }} theme={dark ? 'dark' : 'light'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}