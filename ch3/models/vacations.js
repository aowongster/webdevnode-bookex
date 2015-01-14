var mongoose = require("mongoose");
var vacationSchema = new mongoose.Schema({
  name: String,
  category: String,
  sku: String,
  description: String,
  priceInCents: Number,
  tags: [String],
  inSeason: Boolean,
  available: Boolean,
  notes: String,
  packagesSold: Number,
});

vacationSchema.methods.getDisplayPrice = function(){
  return '$' + (this.priceInCents / 100).toFixed(2);
};

module.exports = mongoose.model('Vacation', vacationSchema);
