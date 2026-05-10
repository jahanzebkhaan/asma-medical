const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    whatsappNumber: {
        type: String,
        required: true
    },

    age: Number,

    expectedDeliveryDate: Date,

    bloodType: String,

    assignedDoctor: String,

    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },

    medicalHistory: String,

    pregnancyWeek: Number,

    trimester: String,

    optedIn: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Patient', patientSchema);