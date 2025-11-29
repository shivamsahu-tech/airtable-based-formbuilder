import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  airtableRecordId: { 
    type: String, 
    required: true 
  },
  answers: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  deletedInAirtable: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

responseSchema.index({ formId: 1, createdAt: -1 });
responseSchema.index({ airtableRecordId: 1 });

export default mongoose.model('Response', responseSchema);