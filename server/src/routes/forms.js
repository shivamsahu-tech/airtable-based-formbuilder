import express from 'express';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import User from '../models/User.js';
import {getBaseTables, getTableFields, getUserBases, createAirtableRecord} from '../services/airtableService.js';
import { existWebhook } from '../services/webhookService.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}


// all airtable related routes
router.get('/bases', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const bases = await getUserBases(user.accessToken);
  res.json({ bases });
});

router.get('/bases/:baseId/tables', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const tables = await getBaseTables(user.accessToken, req.params.baseId);
  res.json({ tables });
});

router.get('/bases/:baseId/tables/:tableId/fields', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const fields = await getTableFields(
    user.accessToken, 
    req.params.baseId, 
    req.params.tableId
  );
  res.json({ fields });
});





// all form related routes here

router.post('/forms', requireAuth, async (req, res) => {
  try {
    const { name, airtableBaseId, airtableTableId, questions } = req.body;
    
    console.log("form data: ", req.body);
    
    if (!airtableBaseId || !airtableTableId || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'missing credentials' });
    }
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'empty form' });
    }

    const supportedTypes = [
      'singleLineText',
      'multilineText',
      'singleSelect',
      'multipleSelects',
      'multipleAttachments'
    ];

    const invalidFields = questions.filter(q => !supportedTypes.includes(q.type));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: 'Unsupported field types',
        invalidFields: invalidFields.map(f => ({ label: f.label, type: f.type }))
      });
    }

    for (const question of questions) {
      if (question.conditionalRules) {
        const { logic, conditions } = question.conditionalRules;


        if (!Array.isArray(conditions) || conditions.length === 0) {
          return res.status(400).json({
            message: `Invalid conditions for ${question.label}`
          });
        }

        for (const condition of conditions) {
          if (!condition.questionKey || !condition.operator) {
            return res.status(400).json({
              message: `Incomplete condition in ${question.label}`
            });
          }

          const referencedQuestion = questions.find(q => q.questionKey === condition.questionKey);
          if (!referencedQuestion) {
            return res.status(400).json({
              message: `Condition in ${question.label} references non-existent field`
            });
          }

          if (condition.questionKey === question.questionKey) {
            return res.status(400).json({
              message: `Field ${question.label} cannot reference itself`
            });
          }
        }
      }
    }

    const form = new Form({
      userId: req.session.userId,
      name: name || 'Untitled Form',
      airtableBaseId,
      airtableTableId,
      questions
    });
    
    await form.save();


     try {
      const user = await User.findById(req.session.userId);
      const webhookId = await existWebhook(user, airtableBaseId);
      
      const webhookExists = user.webhooks?.some(w => w.baseId === airtableBaseId);
      if (!webhookExists) {
        if (!user.webhooks) user.webhooks = [];
        user.webhooks.push({
          baseId: airtableBaseId,
          webhookId: webhookId
        });
        await user.save();
        console.log('saved webhook to user');
      }
    } catch (webhookError) {
      console.error('Webhook setup failed (non-critical):', webhookError.message);
    }

    
    res.json({ form });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/forms', requireAuth, async (req, res) => {
  const forms = await Form.find({ userId: req.session.userId });
  res.json({ forms });
});

router.get('/forms/:formId', async (req, res) => {
  const form = await Form.findById(req.params.formId);
  if (!form) return res.status(404).json({ message: 'form not found' });
  res.json({ form });
});

router.post('/forms/:formId/submit', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ message: 'form not found' });
    
    const { answers } = req.body;
    
    for (const question of form.questions) {
      const isVisible = shouldShowQuestion(question.conditionalRules, answers);
      
      if (!isVisible) continue;
      
      if (question.required) {
        const answer = answers[question.questionKey];
        
        if (answer === undefined || answer === null || answer === '') {
          return res.status(400).json({
            message: `${question.label} is required`
          });
        }
        
        if (Array.isArray(answer) && answer.length === 0) {
          return res.status(400).json({
            message: `${question.label} requires at least one selection`
          });
        }
      }
    }
    
    const user = await User.findById(form.userId);
    
    const airtableFields = {};
    form.questions.forEach(q => {
      // avoiding the file upload for now, i can integrate cloudinary but for assignment avoiding it, because there are other main funcitonality to do (i already integrated cloudinary in many project)
      if (answers[q.questionKey] !== undefined && q.type !== 'multipleAttachments' ) {
        airtableFields[q.airtableFieldId] = answers[q.questionKey];
      }
    });
    
    const airtableRecord = await createAirtableRecord(
      user.accessToken,
      form.airtableBaseId,
      form.airtableTableId,
      airtableFields
    );
    
    const response = new Response({
      formId: form._id,
      airtableRecordId: airtableRecord.id,
      answers: answers
    });
    
    await response.save();
    res.json({ response });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/forms/:formId/responses', requireAuth, async (req, res) => {
  const form = await Form.findById(req.params.formId);
  const responses = await Response.find({ 
    formId: req.params.formId,
    deletedInAirtable: false 
  });
  res.json({ responses, form });
});

function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const { logic, conditions } = rules;

  const results = conditions.map(condition => {
    const { questionKey, operator, value } = condition;
    const answer = answersSoFar[questionKey];

    if (answer === undefined || answer === null || answer === '') {
      return false;
    }

    switch (operator) {
      case 'equals':
        return String(answer).toLowerCase() === String(value).toLowerCase();
      case 'notEquals':
        return String(answer).toLowerCase() !== String(value).toLowerCase();
      case 'contains':
        return String(answer).toLowerCase().includes(String(value).toLowerCase());
      default:
        return false;
    }
  });

  if (logic === 'AND') {
    return results.every(result => result === true);
  } else if (logic === 'OR') {
    return results.some(result => result === true);
  }

  return true;
}

export default router;