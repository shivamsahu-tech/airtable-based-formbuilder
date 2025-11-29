import axios from 'axios';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';


export async function existWebhook(user, baseId) {
  try {
    const existingWebhook = user.webhooks?.find(w => w.baseId === baseId);
    
    if (existingWebhook) {
      console.log('already exists for this base:', baseId);
      return existingWebhook.webhookId;
    }
    
    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/airtable?userId=${user._id}`;
    
    const response = await axios.post(
      `${AIRTABLE_API_BASE}/bases/${baseId}/webhooks`,
      {
        notificationUrl: webhookUrl,
        specification: {
          options: {
            filters: {
              dataTypes: ['tableData']
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const webhookId = response.data.id;
    
    console.log('created new webhook:', webhookId);
    
    return webhookId;
    
  } catch (error) {
    console.error('webhook creation failed:', error.response?.data || error.message);
    throw error;
  }
}