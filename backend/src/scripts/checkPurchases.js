require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const purchases = await Purchase.find({})
    .populate('event_id', 'titre image')
    .populate('ticket_id', 'type prix');

  purchases.forEach(p => {
    console.log(`${p.transaction_ref} | event: ${p.event_id?.titre || 'NULL'} | image: ${p.event_id?.image ? 'OUI' : 'NON'} | ticket: ${p.ticket_id?.type || 'NULL'}`);
  });

  process.exit();
});
