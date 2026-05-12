require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await Event.updateMany({ type: { $exists: false } }, { $set: { type: 'evenement' } });
  console.log(`Migration done — ${result.modifiedCount} événements mis à jour`);
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
