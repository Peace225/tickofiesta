import { supabase } from '../config/supabaseClient';

export const authService = {
  // 1. Inscription (crée le compte + le profil public)
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    // Création du profil public lié
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email, full_name: fullName }]);
      
      if (profileError) throw profileError;
    }
    return data;
  },

  // 2. Connexion
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // On récupère aussi les infos du profil (nom, avatar) pour Redux
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { user: data.user, profile };
  },

  // 3. Déconnexion
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 4. Uploader une photo de profil (Avatar)
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    // Envoi de l'image dans le bucket 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Récupération de l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Mise à jour de la table profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return avatarUrl;
  }
};