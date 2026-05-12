require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('../models/User');
  const email = process.argv[2];
  if (!email) { console.log('Usage: node src/scripts/makeAdmin.js <email>'); process.exit(); }
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) { console.log('Utilisateur introuvable'); process.exit(); }
  console.log(`✓ ${user.email} est maintenant admin`);
  process.exit();
}).catch(e => { console.error(e.message); process.exit(1); });
