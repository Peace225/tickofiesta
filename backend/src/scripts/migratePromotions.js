require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const col = mongoose.connection.db.collection('promotionrequests');

  // Corriger statuts avec accents → sans accents
  const r1 = await col.updateMany({ statut: 'approuvé' }, { $set: { statut: 'approuve' } });
  const r2 = await col.updateMany({ statut: 'refusé' }, { $set: { statut: 'refuse' } });
  console.log('Statuts corrigés:', r1.modifiedCount + r2.modifiedCount);

  // Corriger champs manquants
  const r3 = await col.updateMany(
    { $or: [{ type_pub: { $exists: false } }, { type_pub: null }] },
    { $set: { type_pub: 'popup' } }
  );
  const r4 = await col.updateMany(
    { $or: [{ nb_jours: { $exists: false } }, { nb_jours: null }] },
    { $set: { nb_jours: 1, montant: 1000 } }
  );
  console.log('Champs manquants corrigés:', r3.modifiedCount + r4.modifiedCount);

  const docs = await col.find({}).toArray();
  docs.forEach(d => console.log(d._id, '| statut:', d.statut, '| type_pub:', d.type_pub, '| nb_jours:', d.nb_jours, '| montant:', d.montant));

  mongoose.disconnect();
  console.log('Migration terminée');
}).catch(e => { console.error(e); process.exit(1); });
