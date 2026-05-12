require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const all = await Event.find({}).select('titre statut type vote_actif');
  console.log('Tous les événements:');
  all.forEach(e => console.log(`- ${e.titre} | statut: ${e.statut} | type: ${e.type} | vote_actif: ${e.vote_actif}`));
  process.exit();
});
