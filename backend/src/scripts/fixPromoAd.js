require('dotenv').config();
const mongoose = require('mongoose');
require('../models/User');
require('../models/Event');
require('../models/Ticket');
require('../models/Vote');
require('../models/Candidat');
const Ad = require('../models/Ad');
const PromotionRequest = require('../models/PromotionRequest');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Trouver toutes les promos approuvées
  const promos = await PromotionRequest.find().populate('event_id', 'titre image _id');
  
  for (const promo of promos) {
    // Statut approuvé (avec ou sans accent)
    const isApproved = promo.statut && (promo.statut.includes('approuv') || promo.statut === 'approuvé');
    if (!isApproved || !promo.event_id) continue;

    const existing = await Ad.findOne({ lien: '/events/' + promo.event_id._id });
    if (existing) {
      console.log('Pub deja existante pour:', promo.event_id.titre);
      continue;
    }

    const ad = await Ad.create({
      titre: promo.event_id.titre,
      image: promo.event_id.image || '',
      lien: '/events/' + promo.event_id._id,
      position: 'homepage',
      actif: true,
    });
    console.log('Pub creee:', ad.titre);
  }

  console.log('Termine');
  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
