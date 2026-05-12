require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Ticket = require('../models/Ticket');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const purchases = await Purchase.find({ quantite: { $gt: 1 } });
  console.log(`${purchases.length} ancien(s) achat(s) à corriger`);

  for (const p of purchases) {
    const ticket = await Ticket.findById(p.ticket_id);
    // Si ticket existe, utiliser son prix. Sinon, diviser le montant par la quantité
    const prixUnitaire = ticket ? ticket.prix : Math.round(p.montant / p.quantite);
    await Purchase.findByIdAndUpdate(p._id, { montant: prixUnitaire, quantite: 1 });
    console.log(`Corrigé: ${p.transaction_ref} → ${prixUnitaire} FCFA`);
  }

  console.log('Done');
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
