/**
 * Script de migration — recalcule les commissions sur les achats existants
 * Usage : node src/scripts/recalcCommissions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Event = require('../models/Event');
// Importer tous les modèles pour que Mongoose les enregistre
require('../models/User');
require('../models/Ticket');
require('../models/Vote');
require('../models/Candidat');

function getCommissionRate(montantTotal) {
  if (montantTotal <= 500000) return 5;       // 0 - 500 000 FCFA
  if (montantTotal <= 2000000) return 3.5;    // 500 001 - 2 000 000 FCFA
  return 2;                                   // 2 000 001+ FCFA
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connecte a MongoDB');

  // 1. Pour chaque organisateur, trouver son 1er evenement (par date de creation)
  const events = await Event.find().sort({ createdAt: 1 });
  
  // Map organisateur_id -> premier event_id
  const firstEventByOrg = {};
  for (const ev of events) {
    const orgId = ev.organisateur_id?._id?.toString();
    if (orgId && !firstEventByOrg[orgId]) {
      firstEventByOrg[orgId] = ev._id.toString();
    }
  }

  // 2. Marquer les premiers evenements
  for (const [orgId, eventId] of Object.entries(firstEventByOrg)) {
    await Event.findByIdAndUpdate(eventId, { is_first_event: true, commission_rate: 0 });
    console.log(`1er evenement marque: ${eventId}`);
  }

  // 3. Pour chaque evenement non-premier, recalculer les commissions sur ses achats
  const purchases = await Purchase.find({ status: 'completed' });
  
  // Grouper par event_id
  const byEvent = {};
  for (const p of purchases) {
    const eid = p.event_id?.toString();
    if (!byEvent[eid]) byEvent[eid] = [];
    byEvent[eid].push(p);
  }

  let updated = 0;
  for (const [eventId, eventPurchases] of Object.entries(byEvent)) {
    const event = await Event.findById(eventId);
    if (!event) continue;

    const isFirst = event.is_first_event;
    if (isFirst) {
      // 0% — s'assurer que commission = 0
      for (const p of eventPurchases) {
        if (p.commission_rate !== 0 || p.commission_amount !== 0) {
          await Purchase.findByIdAndUpdate(p._id, { commission_rate: 0, commission_amount: 0 });
          updated++;
        }
      }
      continue;
    }

    // Calculer le montant total généré par cet événement
    const montantTotal = eventPurchases.reduce((acc, p) => acc + (p.montant || 0), 0);
    const rate = getCommissionRate(montantTotal);

    for (const p of eventPurchases) {
      const commissionAmount = Math.round((p.montant * rate) / 100);
      await Purchase.findByIdAndUpdate(p._id, {
        commission_rate: rate,
        commission_amount: commissionAmount,
      });
      updated++;
    }

    // Mettre a jour le taux sur l'evenement
    await Event.findByIdAndUpdate(eventId, { commission_rate: rate });
    console.log(`Event "${event.titre}" — ${montantTotal.toLocaleString('fr-FR')} FCFA — taux: ${rate}% — ${eventPurchases.length} achats mis a jour`);
  }

  console.log(`\nMigration terminee — ${updated} achats mis a jour`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
