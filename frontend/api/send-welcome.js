import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, nom, type } = req.body; 
  // 'type' sera soit 'success' (pour la vérification) soit 'welcome' (pour le bienvenue complet)

  const isWelcome = type === 'welcome';

  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eaebed;">
      
      <!-- En-tête -->
      <div style="background-color: #080812; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">TICKOFIESTA</h1>
      </div>

      <!-- Corps du message -->
      <div style="padding: 40px 30px; color: #1d1d1f; text-align: center;">
        ${isWelcome ? `
          <!-- Modèle Bienvenue Complet -->
          <h2 style="color: #e60000; font-size: 24px; font-weight: 800; margin-bottom: 25px;">Bienvenue sur TICKOFIESTA</h2>
          <p style="margin-bottom: 20px;">Quelle bonne nouvelle ! Votre compte vient d'être créé avec succès.</p>
          
          <div style="border: 2px solid #e60000; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
            <h3 style="color: #e60000; margin-top: 0;">En tant que participant</h3>
            <ul style="font-size: 14px;"><li>Achat 24h/24, tickets instantanés, réductions exclusives.</li></ul>
          </div>

          <div style="border: 2px solid #e60000; padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
            <h3 style="color: #e60000; margin-top: 0;">En tant qu'organisateur</h3>
            <ul style="font-size: 14px;"><li>Mise en vente rapide, gestion participants, stats temps réel.</li></ul>
          </div>
        ` : `
          <!-- Modèle Succès Vérification -->
          <h2 style="color: #34C759; font-size: 24px; font-weight: 800; margin-bottom: 25px;">Email vérifié avec succès</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">Félicitations <strong>${nom}</strong>, votre adresse e-mail a été validée. Votre compte est maintenant pleinement activé.</p>
        `}

        <a href="https://tickofiesta.com/dashboard" style="display: inline-block; background-color: #6c47ff; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; box-shadow: 0 4px 15px rgba(108, 71, 255, 0.3);">
          ${isWelcome ? 'DÉCOUVRIR LES ÉVÉNEMENTS' : 'Accéder à mon Espace Pro'}
        </a>
      </div>

      <!-- Pied de page -->
      <div style="background-color: #f5f5f7; padding: 30px; text-align: center; border-top: 1px solid #eaebed;">
        <div style="margin-bottom: 20px;">
          <a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" style="width: 120px; margin: 5px;"></a>
          <a href="#"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" style="width: 120px; margin: 5px;"></a>
        </div>
        <p style="font-size: 12px; color: #86868b;">© 2026 TICKOFIESTA, tous droits réservés.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'TickoFiesta <contact@tickofiesta.com>',
      to: email,
      subject: isWelcome ? 'Bienvenue sur TickoFiesta !' : '🎉 Compte activé avec succès !',
      html: emailHtml
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}