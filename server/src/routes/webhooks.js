import express from 'express';
import Response from '../models/Response.js';
import Form from '../models/Form.js';

const router = express.Router();

router.post('/airtable', async (req, res) => {
  try {
    const webhook = req.body;
    const userId = req.query.userId;
    
    console.log('received webhool for user:', userId);
    
    res.status(200).json({ message: 'received' });
    
    processWebhook(webhook, userId);
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ message: 'Something went wrong in webhook' });
  }
});

async function processWebhook(webhook, userId) {
  try {
    const payloads = webhook.payloads || [];
    
    for (const payload of payloads) {
      const { changedTablesById } = payload;
      
      if (!changedTablesById) continue;
      
      for (const [tableId, changes] of Object.entries(changedTablesById)) {
        
        if (changes.changedRecordsById) {
          for (const [recordId, recordChanges] of Object.entries(changes.changedRecordsById)) {
            await handleUpdate(recordId, recordChanges);
          }
        }
        
        if (changes.destroyedRecordIds) {
          for (const recordId of changes.destroyedRecordIds) {
            await handleDelete(recordId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}

async function handleUpdate(recordId, changes) {
  const response = await Response.findOne({ airtableRecordId: recordId }).populate('formId');
  
  if (!response) {
    console.log('Response not found:', recordId);
    return;
  }
  
  if (changes.current?.cellValuesByFieldId) {
    const form = response.formId;
    
    for (const [fieldId, newValue] of Object.entries(changes.current.cellValuesByFieldId)) {
      const question = form.questions.find(q => q.airtableFieldId === fieldId);
      if (question) {
        response.answers[question.questionKey] = newValue;
      }
    }
    
    response.updatedAt = new Date();
    response.markModified('answers'); 
    await response.save();
    
    // console.log('updated:', response._id);
  }
}

async function handleDelete(recordId) {
  const response = await Response.findOne({ airtableRecordId: recordId });
  
  if (!response) {
    console.log('Response not found:', recordId);
    return;
  }
  
  response.deletedInAirtable = true;
  response.updatedAt = new Date();
  await response.save();
  
  console.log('marked deleted:', response._id);
}

export default router;