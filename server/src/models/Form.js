import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  questionKey: String,
  operator: { type: String, enum: ['equals', 'notEquals', 'contains'] },

  value: mongoose.Schema.Types.Mixed
  
}, { _id: false });

const conditionalRulesSchema = new mongoose.Schema({
  logic: { type: String, enum: ['AND', 'OR'] },
  conditions: [conditionSchema]
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionKey: String,
  airtableFieldId: String,
  label: String,
  type: { 
    type: String, 
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments']
  },
  required: { type: Boolean, default: false },
  options: [String],
  conditionalRules: conditionalRulesSchema
}, { _id: false });

const formSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  airtableBaseId: { type: String, required: true },
  airtableTableId: { type: String, required: true },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Form', formSchema);