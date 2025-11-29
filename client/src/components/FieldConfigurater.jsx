import { useState } from 'react';

export default function FieldConfigurator({ field, index, allFields, onUpdate }) {
  const [showConditions, setShowConditions] = useState(!!field.conditionalRules);

  const updateField = (updates) => {
    onUpdate(index, { ...field, ...updates });
  };

  const addCondition = () => {
    const newRules = field.conditionalRules || {
      logic: 'AND',
      conditions: []
    };
    
    newRules.conditions.push({
      questionKey: '',
      operator: 'equals',
      value: ''
    });

    updateField({ conditionalRules: newRules });
    setShowConditions(true);
  };

  const updateCondition = (condIndex, updates) => {
    const newRules = { ...field.conditionalRules };
    newRules.conditions[condIndex] = {
      ...newRules.conditions[condIndex],
      ...updates
    };
    updateField({ conditionalRules: newRules });
  };

  const removeCondition = (condIndex) => {
    const newRules = { ...field.conditionalRules };
    newRules.conditions.splice(condIndex, 1);
    
    if (newRules.conditions.length === 0) {
      updateField({ conditionalRules: null });
      setShowConditions(false);
    } else {
      updateField({ conditionalRules: newRules });
    }
  };

  const updateLogic = (logic) => {
    const newRules = { ...field.conditionalRules, logic };
    updateField({ conditionalRules: newRules });
  };

  const availableFields = allFields.filter(f => f.questionKey !== field.questionKey);

  return (
    <div className="border p-4 mb-4">
      <div className="mb-3">
        <label className="block text-sm mb-1">Label</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={field.label}
          onChange={e => updateField({ label: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={e => updateField({ required: e.target.checked })}
          />
          <span className="text-sm">Required</span>
        </label>
      </div>

      <div className="border-t pt-3">
        {!showConditions ? (
          <button
            type="button"
            className="text-blue-600 text-sm"
            onClick={() => {
              addCondition();
            }}
          >
            + Add Conditional Logic
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Show this field when:</span>
              <button
                type="button"
                className="text-red-600 text-sm"
                onClick={() => {
                  updateField({ conditionalRules: null });
                  setShowConditions(false);
                }}
              >
                remove all
              </button>
            </div>

            {field.conditionalRules?.conditions?.length > 1 && (
              <div className="mb-2">
                <select
                  className="border px-2 py-1 text-sm"
                  value={field.conditionalRules.logic}
                  onChange={e => updateLogic(e.target.value)}
                >
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                </select>
              </div>
            )}

            {field.conditionalRules?.conditions?.map((condition, condIndex) => (
              <div key={condIndex} className="border p-2 mb-2 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs">Condition {condIndex + 1}</span>
                  <button
                    type="button"
                    className="text-red-600 text-xs"
                    onClick={() => removeCondition(condIndex)}
                  >
                    remove
                  </button>
                </div>

                <div className="mb-2">
                  <label className="text-xs block mb-1">Depends on</label>
                  <select
                    className="w-full border px-2 py-1 text-sm"
                    value={condition.questionKey}
                    onChange={e => updateCondition(condIndex, { questionKey: e.target.value })}
                  >
                    <option value="">-- Select Field --</option>
                    {availableFields.map(f => (
                      <option key={f.questionKey} value={f.questionKey}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-xs block mb-1">Operator</label>
                  <select
                    className="w-full border px-2 py-1 text-sm"
                    value={condition.operator}
                    onChange={e => updateCondition(condIndex, { operator: e.target.value })}
                  >
                    <option value="equals">Equals</option>
                    <option value="notEquals">Not Equals</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs block mb-1">Value</label>
                  <input
                    type="text"
                    className="w-full border px-2 py-1 text-sm"
                    value={condition.value}
                    onChange={e => updateCondition(condIndex, { value: e.target.value })}
                    placeholder="Enter value"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="text-blue-600 text-sm mt-2"
              onClick={addCondition}
            >
              + add another condition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}