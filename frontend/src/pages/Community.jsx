import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, Eye, Image as ImageIcon, Mic, Square, Trash2, Heart, Smile, Flame, BadgeCheck, X, Pencil, Reply, MapPin } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

const POP_SOUND_URL = 'https://actions.google.com/sounds/v1/ui/pop_up_01.ogg';

export default function Community() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [mentionSearch, setMentionSearch] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const formatDate = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const formatDay = (d) => {
    const date = new Date(d), today = new Date(), y = new Date(today); y.setDate(y.getDate()-1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === y.toDateString()) return "Hier";
    return date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  };

  useEffect(() => {
    fetchPosts();
    const room = supabase.channel('tickolive_room');
    room.on('broadcast', { event: 'typing' }, (p) => {
      if (p.payload.userId!== user?.id) {
        setTypingUser(p.payload.nom);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
      }
    });
    room.on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (p) => {
      if (p.eventType === 'INSERT' && p.new.user_id!== user?.id) {
        try { new Audio(POP_SOUND_URL).play().catch(()=>{}); } catch {}
      }
      fetchPosts();
    });
    room.subscribe(); channelRef.current = room;
    return () => supabase.removeChannel(room);
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [posts, typingUser]);

  const fetchPosts = async () => {
    const { data } = await supabase.from('community_posts')
     .select('id, content, image_url, audio_url, views_count, created_at, user_id, likes_count, reply_to, profiles:user_id(nom, avatar_url)')
     .order('created_at', { ascending: true });
    setPosts(data || []);
  };

  const handleLike = async (id, l) => { await supabase.from('community_posts').update({ likes_count: l+1 }).eq('id', id); };
  const handleDeletePost = async (id) => { if(!confirm("Supprimer?")) return; setPosts(posts.filter(p=>p.id!==id)); await supabase.from('community_posts').delete().eq('id', id); };
  const handleEditSubmit = async (id) => { if(!editValue.trim()) return; setPosts(posts.map(p=>p.id===id?{...p,content:editValue.trim()}:p)); setEditingId(null); await supabase.from('community_posts').update({content:editValue.trim()}).eq('id',id); };

  const handleTyping = (e) => {
    const val = e.target.value; setNewPost(val);
    const last = val.split(' ').pop();
    setMentionSearch(last.startsWith('@')? last.slice(1).toLowerCase() : null);
    if (user && channelRef.current) channelRef.current.send({ type:'broadcast', event:'typing', payload:{ userId:user.id, nom:user.user_metadata?.nom||'VIP' }});
  };

  const insertMention = (nom) => { const w=newPost.split(' '); w.pop(); setNewPost([...w, `@${nom} `].join(' ')); setMentionSearch(null); inputRef.current?.focus(); };
  const renderTextWithMentions = (t) => t?.split(/(@[\wÀ-ÿ-]+)/g).map((p,i)=>p.startsWith('@')?<span key={i} className="text-[#00d4aa] font-bold">{p}</span>:p);

  const startRecording = async () => { try{ const s=await navigator.mediaDevices.getUserMedia({audio:true}); mediaRecorderRef.current=new MediaRecorder(s); audioChunksRef.current=[]; mediaRecorderRef.current.ondataavailable=e=>e.data.size&&audioChunksRef.current.push(e.data); mediaRecorderRef.current.onstop=()=>{setAudioBlob(new Blob(audioChunksRef.current,{type:'audio/webm'})); s.getTracks().forEach(t=>t.stop())}; mediaRecorderRef.current.start(); setIsRecording(true); setRecordingTime(0); timerRef.current=setInterval(()=>setRecordingTime(p=>p+1),1000);}catch{toast.error("Micro refusé")} };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); clearInterval(timerRef.current); };

  const handlePostSubmit = async (e) => {
    e.preventDefault(); if((!newPost.trim()&&!imageFile&&!audioBlob)||!user) return; setIsSubmitting(true);
    let img=null,aud=null;
    try{
      if(imageFile){ const f=`${Date.now()}_img.${imageFile.name.split('.').pop()}`; await supabase.storage.from('community_media').upload(`images/${f}`, imageFile); img=supabase.storage.from('community_media').getPublicUrl(`images/${f}`).data.publicUrl; }
      if(audioBlob){ const f=`${Date.now()}_audio.webm`; await supabase.storage.from('community_media').upload(`audio/${f}`, audioBlob); aud=supabase.storage.from('community_media').getPublicUrl(`audio/${f}`).data.publicUrl; }
      const reply = replyingTo? { id:replyingTo.id, nom:replyingTo.profiles?.nom, content:replyingTo.content, hasMedia:!!(replyingTo.image_url||replyingTo.audio_url) } : null;
      await supabase.from('community_posts').insert([{ user_id:user.id, content:newPost.trim(), image_url:img, audio_url:aud, reply_to:reply }]);
      setNewPost(''); setImageFile(null); setImagePreview(null); setAudioBlob(null); setReplyingTo(null); setShowEmojiPicker(false);
    }catch{ toast.error("Erreur") } finally{ setIsSubmitting(false) }
  };

  const uniqueUsers = Array.from(new Map(posts.map(p=>[p.profiles?.nom,p.profiles])).values()).filter(Boolean);
  const filteredMentions = uniqueUsers.filter(u=>u.nom?.toLowerCase().includes(mentionSearch||''));

  return (
    <div className={`flex flex-col h-[calc(100vh-80px)] ${dark?'bg-[#050510]':'bg-[#f9fafb]'}`}>
      {/* HEADER ÉVÉNEMENTIEL */}
      <div className={`shrink-0 px-5 py-4 border-b backdrop-blur-xl ${dark?'bg-[#050510]/80 border-white/5':'bg-white/80 border-gray-200'}`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] grid place-items-center shadow-lg shadow-violet-500/20"><Flame className="text-white" size={20}/></div>
            <div>
              <h1 className="font-black text-xl tracking-tight">Ticko<span className="text-[#6c47ff]">Live</span></h1>
              <div className="flex items-center gap-1.5 text- text-emerald-600 font-bold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> COMMUNAUTÉ EN DIRECT</div>
            </div>
          </div>
          <div className="text-right"><div className="text- text-gray-500">Abidjan • Maintenant</div><div className="text-xs font-bold">127 connectés</div></div>
        </div>
      </div>

      {/* MESSAGES - UNIVERS BULLES */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {posts.map((post) => {
            const isMe = user && post.user_id === user.id;
            const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.nom||'U'}&background=6c47ff&color=fff`;

            return (
              <div key={post.id} className={`flex items-end gap-3 ${isMe?'flex-row-reverse':''} animate-in fade-in zoom-in-50 duration-300`}>
                {/* AVATAR SOURCE */}
                <div className="relative shrink-0">
                  <img src={avatar} className="w-11 h-11 rounded-full object-cover ring-2 ring-white dark:ring-[#050510] shadow-lg" alt=""/>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#050510]"/>
                </div>

                {/* BULLE QUI SORT */}
                <div className="max-w-[75%]">
                  <div className={`relative px-4 py-3 shadow-md ${isMe? 'bg-[#6c47ff] text-white rounded- rounded-br-' : dark? 'bg-[#151522] text-gray-100 rounded- rounded-bl- border border-white/5' : 'bg-white text-gray-900 rounded- rounded-bl- border border-gray-100'}`}>
                    {/* Queue de bulle */}
                    <div className={`absolute bottom-0 w-3 h-3 ${isMe? '-right-1 bg-[#6c47ff] [clip-path:polygon(0_0,100%_100%,0_100%)]' : '-left-1 ' + (dark? 'bg-[#151522]' : 'bg-white') + ' [clip-path:polygon(100%_0,0_100%,100%_100%)]'}`}/>

                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-black text-">{post.profiles?.nom}</span>
                        <BadgeCheck size={14} className="text-[#00d4aa]"/>
                      </div>
                    )}

                    {post.reply_to && (
                      <div className={`mb-2 p-2 rounded-lg text- border-l-2 ${isMe?'bg-black/10 border-white/30':'bg-black/5 dark:bg-white/5 border-[#00d4aa]'}`}>
                        <span className="font-bold">{post.reply_to.nom}</span>
                        <p className="opacity-70 truncate">{post.reply_to.content || 'Média'}</p>
                      </div>
                    )}

                    {post.image_url && <img src={post.image_url} className="rounded-xl mb-2 max-h-64 w-full object-cover"/>}
                    {post.audio_url && <audio controls src={post.audio_url} className="w-full h-9 mb-2"/>}

                    {editingId===post.id? (
                      <textarea value={editValue} onChange={e=>setEditValue(e.target.value)} className="w-full bg-black/10 rounded p-2 text-sm outline-none" autoFocus/>
                    ) : (
                      post.content && <p className="text- leading-[1.5] whitespace-pre-wrap">{renderTextWithMentions(post.content)}</p>
                    )}
                  </div>

                  {/* ÉTAT : date, heure, lieu */}
                  <div className={`flex items-center gap-1.5 mt-1.5 px-1 text- ${isMe?'justify-end':''} text-gray-500`}>
                    <span className="font-medium">{formatDate(post.created_at)}</span>
                    <span>•</span>
                    <span>{formatDay(post.created_at)}</span>
                    <span>•</span>
                    <MapPin size={11}/>
                    <span className="font-medium">Abidjan Live</span>
                    {isMe? (
                      <div className="flex gap-2 ml-2 opacity-0 hover:opacity-100 group-hover:opacity-100">
                        <button onClick={()=>{setEditingId(post.id);setEditValue(post.content)}}><Pencil size={12}/></button>
                        <button onClick={()=>handleDeletePost(post.id)}><Trash2 size={12}/></button>
                      </div>
                    ) : (
                      <button onClick={()=>setReplyingTo(post)} className="ml-2 hover:text-[#6c47ff]"><Reply size={12}/></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typingUser && (
            <div className="flex items-end gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse"/>
              <div className="bg-gray-100 dark:bg-[#151522] px-4 py-3 rounded-2xl">
                <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"/><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"/></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>
      </div>

      {/* INPUT */}
      <div className={`shrink-0 border-t ${dark?'bg-[#050510]/90 border-white/5':'bg-white/90 border-gray-200'} backdrop-blur-xl`}>
        <div className="max-w-3xl mx-auto p-3">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between bg-[#6c47ff]/10 px-3 py-2 rounded-xl text-xs">
              <span>Réponse à <b>{replyingTo.profiles?.nom}</b></span>
              <button onClick={()=>setReplyingTo(null)}><X size={14}/></button>
            </div>
          )}
          <form onSubmit={handlePostSubmit} className={`flex items-end gap-2 p-2 rounded-2xl ${dark?'bg-[#151522]':'bg-gray-100'}`}>
            <button type="button" onClick={()=>setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-gray-500 hover:text-[#6c47ff]"><Smile size={20}/></button>
            <input ref={inputRef} value={newPost} onChange={handleTyping} placeholder="Partage ton vibe..." className="flex-1 bg-transparent outline-none py-2.5 text-" />
            <button type="button" onClick={()=>fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-[#6c47ff]"><ImageIcon size={20}/><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e=>{setImageFile(e.target.files[0]); setImagePreview(URL.createObjectURL(e.target.files[0]))}}/></button>
            {isRecording? (
              <button type="button" onClick={stopRecording} className="p-2.5 bg-red-500 text-white rounded-xl"><Square size={20}/></button>
            ) : audioBlob? (
              <button type="button" onClick={()=>setAudioBlob(null)} className="p-2.5 text-red-500"><Trash2 size={20}/></button>
            ) : newPost.trim()||imageFile? (
              <button type="submit" disabled={isSubmitting} className="p-2.5 bg-[#6c47ff] text-white rounded-xl hover:scale-105 transition"><Send size={20}/></button>
            ) : (
              <button type="button" onClick={startRecording} className="p-2.5 text-gray-500 hover:text-[#6c47ff]"><Mic size={20}/></button>
            )}
          </form>
          {showEmojiPicker && <div className="absolute bottom-20 right-4"><EmojiPicker onEmojiClick={e=>setNewPost(p=>p+e.emoji)} theme={dark?'dark':'light'}/></div>}
        </div>
      </div>
    </div>
  );
}