import axios from "axios";

const SUPPORTED_FIELD_TYPES = [
  'singleLineText',
  'multilineText', 
  'singleSelect',
  'multipleSelects',
  'multipleAttachments'
];

export async function getUserBases(accessToken) {
  try {

    const response = await axios.get(
      "https://api.airtable.com/v0/meta/bases",
      { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      }
    );
    return response.data.bases;
  } catch (error) {
    return [];
  }
}

export async function getBaseTables(accessToken, baseId) {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      }
    );
    return response.data.tables;
  } catch (error) {
    return [];
  }
}

export async function getTableFields(accessToken, baseId, tableId) {
 try {
   const tables = await getBaseTables(accessToken, baseId);
   const table = tables.find(t => t.id === tableId);
  //  console.log(table)
   if (!table) throw new Error('Table not found');
   
   return table.fields.filter(field => 
     SUPPORTED_FIELD_TYPES.includes(field.type)
   );
 } catch (error) {
  return [];
 }
}

export async function createAirtableRecord(accessToken, baseId, tableId, fields) {
 try {
   const response = await axios.post(
     `https://api.airtable.com/v0/${baseId}/${tableId}`,
     { fields },
     { 
       headers: { 
         Authorization: `Bearer ${accessToken}`,
         'Content-Type': 'application/json'
       } 
     }
   );
  //  console.log(response.data)
   return response.data;
 } catch (error) {
  throw new Error('Failed to create Airtable record');
 }
}

export async function updateAirtableRecord(accessToken, baseId, tableId, recordId, fields) {
  try {
    const response = await axios.patch(
      `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
      { fields },
      { 
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    // console.log("airtable record : ", response.data);
    return response.data;
  } catch (error) {
    return null;
  }
}