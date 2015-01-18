var mongoose = require('mongoose');
var vacationInSeasonListenerSchema = new mongoose.Schema({
  email: String,
  skus: [String],
});
module.exports = mongoose.model('VacationInSeasonListener', vacationInSeasonListenerSchema);
