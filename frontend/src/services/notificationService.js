import { supabase } from '../config/supabaseClient';

/**
 * Envoie une notification In-App (Cloche) et un Email (Resend) simultanément
 * 
 * @param {string} userId - L'ID Supabase du destinataire (pour la cloche)
 * @param {string} userEmail - L'email du destinataire (pour Resend)
 * @param {string} title - Le titre de la notification
 * @param {string} message - Le contenu du message
 * @param {string} type - 'info' | 'success' | 'warning' | 'promo' | 'ticket'
 */
export const sendFullNotification = async (userId, userEmail, title, message, type = 'info') => {
  try {
    // 1. Enregistrement dans la base de données (Déclenche la notification In-App)
    const { error: dbError } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: title,
        message: message,
        type: type
      }]);

    if (dbError) {
      console.error("Erreur d'insertion BDD:", dbError);
      throw dbError;
    }

    // 2. Déclenchement de l'Edge Function pour envoyer le vrai mail via Resend
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: { 
        email: userEmail, 
        title: title, 
        message: message 
      }
    });

    if (emailError) {
      console.warn("La notification in-app a marché, mais l'email a échoué:", emailError);
    }

    return { success: true };
    
  } catch (error) {
    console.error("Erreur fatale lors de l'envoi de la notification:", error);
    return { success: false, error };
  }
};