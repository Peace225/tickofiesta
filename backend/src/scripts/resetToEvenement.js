require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await Event.updateMany({}, { $set: { type: 'evenement' } });
  console.log(`Done — ${result.modifiedCount} événements remis en type: 'evenement'`);
  process.exit();
});
