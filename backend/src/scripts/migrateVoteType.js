require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Les événements qui ont vote_actif: true sont des concours/votes
  const result = await Event.updateMany({ vote_actif: true }, { $set: { type: 'vote' } });
  console.log(`Migration done — ${result.modifiedCount} concours mis à jour en type: 'vote'`);
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
