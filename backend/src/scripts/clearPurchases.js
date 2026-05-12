require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await Purchase.deleteMany({});
  console.log(`${result.deletedCount} achat(s) supprimé(s)`);
  process.exit();
});
