const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Patient = require('../models/Patient');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

function calcStage(edd) {
  const days = Math.floor((new Date(edd) - new Date()) / 864e5);
  const weeks = Math.floor((280 - days) / 7);

  if (weeks < 0) {
    return {
      stage: 'postnatal',
      pregnancyWeek: null
    };
  }

  if (weeks < 13) {
    return {
      stage: 'first_trimester',
      pregnancyWeek: weeks
    };
  }

  if (weeks < 27) {
    return {
      stage: 'second_trimester',
      pregnancyWeek: weeks
    };
  }

  return {
    stage: 'third_trimester',
    pregnancyWeek: weeks
  };
}

// GET ALL PATIENTS
router.get('/', async (req, res) => {
  try {
    const { stage, riskLevel, search } = req.query;

    let query = {};

    if (stage) {
      query.trimester = stage;
    }

    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          whatsappNumber: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 });

    const formattedPatients = patients.map(patient => ({
      ...patient.toObject(),
      id: patient._id.toString()
    }));

    res.json(formattedPatients);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch patients'
    });
  }
});

// GET SINGLE PATIENT
router.get('/:id', async (req, res) => {

  try {

    const patient = await Patient.findById(req.params.id);

    if (!patient) {

      return res.status(404).json({

        error: 'Patient not found'

      });

    }

    res.json({
      ...patient.toObject(),
      id: patient._id.toString()
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      error: 'Failed to fetch patient'

    });

  }

});

// CREATE PATIENT
router.post('/', async (req, res) => {
  try {
    const {
      name,
      whatsappNumber,
      age,
      edd,
      medicalHistory,
      bloodType,
      assignedDoctor,
      riskLevel
    } = req.body;

    if (!name || !whatsappNumber || !age || !edd) {
      return res.status(400).json({
        error: 'name, whatsappNumber, age, edd required'
      });
    }

    const { stage, pregnancyWeek } = calcStage(edd);

    const patient = new Patient({
      name,
      whatsappNumber,
      age: parseInt(age),
      expectedDeliveryDate: edd,
      pregnancyWeek,
      trimester: stage,
      riskLevel: riskLevel || 'low',
      bloodType: bloodType || '',
      medicalHistory: medicalHistory || '',
      optedIn: true,
      assignedDoctor: assignedDoctor || ''
    });

    await patient.save();

    res.status(201).json({
      ...patient.toObject(),
      id: patient._id.toString()
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to create patient'
    });
  }
});

// BULK CREATE PATIENTS
router.post('/bulk', async (req, res) => {
  try {
    const { patients: list } = req.body;

    if (!Array.isArray(list)) {
      return res.status(400).json({
        error: 'patients array required'
      });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < list.length; i++) {
      const p = list[i];

      if (!p.name || !p.whatsappNumber || !p.age || !p.edd) {
        errors.push({
          row: i + 1,
          error: 'Missing required fields'
        });

        continue;
      }

      const { stage, pregnancyWeek } = calcStage(p.edd);

      const patient = new Patient({
        name: p.name,
        whatsappNumber: p.whatsappNumber,
        age: parseInt(p.age),
        expectedDeliveryDate: p.edd,
        pregnancyWeek,
        trimester: stage,
        riskLevel: p.riskLevel || 'low',
        bloodType: p.bloodType || '',
        medicalHistory: p.medicalHistory || '',
        optedIn: true,
        assignedDoctor: p.assignedDoctor || ''
      });

      await patient.save();

      created.push(patient);
    }

    res.json({
      created: created.length,
      errors,
      patients: created
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Bulk upload failed'
    });
  }
});

// EXCEL / CSV FILE UPLOAD
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: 'buffer'
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet);

    const created = [];
    const errors = [];
    const skipped = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        const name = row.name || row.Name;
        const whatsappNumber = row.whatsappNumber || row.Phone || row.phone || row.whatsapp;
        const age = row.age || row.Age;
        const edd = row.edd || row.EDD || row.expectedDeliveryDate;

        if (!name || !whatsappNumber || !age || !edd) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields'
          });

          continue;
        }

        const existingPatient = await Patient.findOne({
          whatsappNumber
        });

        if (existingPatient) {
          skipped.push({
            row: i + 1,
            whatsappNumber,
            reason: 'Duplicate number'
          });

          continue;
        }

        const { stage, pregnancyWeek } = calcStage(edd);

        const patient = new Patient({
          name,
          whatsappNumber,
          age: parseInt(age),
          expectedDeliveryDate: edd,
          pregnancyWeek,
          trimester: stage,
          riskLevel: String(row.riskLevel || row.Risk || 'low').toLowerCase(),
          bloodType: row.bloodType || row.BloodType || '',
          medicalHistory: row.medicalHistory || row.MedicalHistory || '',
          optedIn: true,
          assignedDoctor: row.assignedDoctor || row.Doctor || ''
        });

        await patient.save();

        created.push(patient);

      } catch (err) {
        errors.push({
          row: i + 1,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      errors,
      patients: created
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'File upload failed'
    });
  }
});

// UPDATE PATIENT
router.put('/:id', async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    res.json(updatedPatient);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to update patient'
    });
  }
});

// OPT OUT
router.put('/:id/optout', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        optedIn: false
      },
      {
        new: true
      }
    );

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    res.json({
      message: 'Patient opted out'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to opt out patient'
    });
  }
});

// DELETE PATIENT
router.delete('/:id', async (req, res) => {
  try {
    await Message.deleteMany({ patientId: req.params.id });
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    res.json({
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to delete patient'
    });
  }
});

module.exports = router;