const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    },

    patientName: String,

    type: String,

    templateName: String,

    content: String,

    direction: String,

    status: String,

    sentAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);