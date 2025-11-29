import { useState, useEffect } from 'react';
import FieldConfigurator from '../components/FieldConfigurater';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function FormBuilderPage() {
  const [bases, setBases] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState([]);
  const [formName, setFormName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [loadingSomething, setLoadingSomething] = useState('');

  useEffect(() => {
    setLoadingSomething('Loading bases...');
    fetch(`${API_BASE_URL}/api/bases`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log("bases:", data.bases);
        setLoadingSomething('');
        setBases(data.bases);
      });
  }, []);

  useEffect(() => {
    if (selectedBase) {
      setLoadingSomething('Loading tables.....');
      fetch(`${API_BASE_URL}/api/bases/${selectedBase}/tables`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setTables(data.tables);
          console.log("tables:", data.tables);
          setLoadingSomething('');
        });
    }
  }, [selectedBase]);

  useEffect(() => {
    if (selectedBase && selectedTable) {
      setLoadingSomething('Loading fields.....');
      fetch(`${API_BASE_URL}/api/bases/${selectedBase}/tables/${selectedTable}/fields`,
        { credentials: 'include' }
      )
        .then(res => res.json())
        .then(data => {
          setFields(data.fields);
          console.log("fields:", data.fields);
          setLoadingSomething('');
        });
    }
  }, [selectedBase, selectedTable]);

  const handleFieldToggle = (field) => {
    setSelectedFields(prev => {
      const exists = prev.find(f => f.questionKey === field.id);
      if (exists) {
        return prev.filter(f => f.questionKey !== field.id);
      }
      return [
        ...prev,
        {
          questionKey: field.id,
          airtableFieldId: field.id,
          label: field.name,
          type: field.type,
          required: false,
          options: field.options?.choices?.map(c => c.name) || [],
          conditionalRules: null
        }
      ];
    });
  };

  const updateField = (index, updatedField) => {
    const newFields = [...selectedFields];
    newFields[index] = updatedField;
    setSelectedFields(newFields);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      alert('please enter form name');
      return;
    }
    if (!selectedBase || !selectedTable) {
      alert('please select base and table');
      return;
    }
    if (selectedFields.length === 0) {
      alert('Please select at least one field');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formName,
          airtableBaseId: selectedBase,
          airtableTableId: selectedTable,
          questions: selectedFields
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Form created successfully!');
        console.log('form created:', data);

        setFormName('');
        setSelectedBase('');
        setSelectedTable('');
        setSelectedFields([]);

      } else {
        alert('Failed to create form');
      }
    } catch (error) {

      console.error('Error creating form:', error);
      alert('Error creating form');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Create Form</h2>

      <div className='text-red-500' >{loadingSomething}</div>

      <div className="mb-4">
        <label className="text-sm font-medium">Form Name</label>
        <input
          className="mt-1 w-full px-3 py-2 border"
          placeholder="Enter form name"
          value={formName}
          onChange={e => setFormName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">Select Base</label>
        <select
          className="mt-1 w-full px-3 py-2 border bg-white"
          onChange={e => setSelectedBase(e.target.value)}
          value={selectedBase}
        >
          <option value="">-- Choose Base --</option>
          {bases.map(base => (
            <option key={base.id} value={base.id}>{base.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium">Select Table</label>
        <select
          className="mt-1 w-full px-3 py-2 border"
          onChange={e => setSelectedTable(e.target.value)}
          value={selectedTable}
        >
          <option value="">-- Choose Table --</option>
          {tables.map(table => (
            <option key={table.id} value={table.id}>{table.name}</option>
          ))}
        </select>
      </div>

      {fields.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 ">Select Fields</h3>
          <div className="border p-4">

            {fields.map(field => (
              <label
                key={field.id}
                className="flex items-center gap-2 mb-2 "
              >
                <input
                  type="checkbox"
                  checked={selectedFields.some(f => f.questionKey === field.id)}
                  onChange={() => handleFieldToggle(field)}
                />
                <span>
                  {field.name}{' '}
                  <span className="text-gray-500 text-sm">({field.type})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedFields.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Configure Fields</h3>
          <div>
            {selectedFields.map((field, index) => (
              // here creating each fields configuration dynamically for each quesiton field as per the user requirements
              <FieldConfigurator
                key={field.questionKey}
                field={field}
                index={index}
                allFields={selectedFields}
                onUpdate={updateField}
              />
            ))}
          </div>
        </div>
      )}

      {selectedFields.length > 0 && (
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
        >
          Create Form
        </button>
      )}
    </div>
  );
}