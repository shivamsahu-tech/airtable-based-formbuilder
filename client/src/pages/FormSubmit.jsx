import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shouldShowQuestion } from '../utils/conditionalLogic';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function FormDetailsPage() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/forms/${formId}`)
      .then(res => res.json())
      .then(data => {
        setForm(data.form);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading form:', err);
        setLoading(false);
      });
  }, [formId]);

  const handleInputChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
    if (errors[questionKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionKey];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    form.questions.forEach(question => {
      const isVisible = shouldShowQuestion(question.conditionalRules, answers);
      
      if (!isVisible) return;

      if (question.required) {
        const answer = answers[question.questionKey];
        
        if (answer === undefined || answer === null || answer === '') {
          newErrors[question.questionKey] = `${question.label} is required`;
        }
        
        if (Array.isArray(answer) && answer.length === 0) {
          newErrors[question.questionKey] = `${question.label} requires at least one selection`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        alert('Form submitted successfully!');
        setAnswers({});
      } else {
        const data = await response.json();
        alert(data.message || 'something went wrong in form submit');
      }
    } catch (error) {
      console.error('error in submitting form:', error);
      alert('error in submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (question) => {
    const { questionKey, label, type, required, options } = question;
    const value = answers[questionKey] || '';
    const error = errors[questionKey];

    const isVisible = shouldShowQuestion(question.conditionalRules, answers);
    
    if (!isVisible) return null;

    return (
      <div key={questionKey} className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>

        {type === 'singleLineText' && (
          <input
            type="text"
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : ''}`}
            value={value}
            onChange={e => handleInputChange(questionKey, e.target.value)}
            placeholder={`Enter ${label}`}
          />
        )}

        {type === 'multilineText' && (
          <textarea
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : ''}`}
            rows={4}
            value={value}
            onChange={e => handleInputChange(questionKey, e.target.value)}
            placeholder={`Enter ${label}`}
          />
        )}

        {type === 'singleSelect' && (
          <select
            className={`w-full px-3 py-2 border bg-white ${error ? 'border-red-500' : ''}`}
            value={value}
            onChange={e => handleInputChange(questionKey, e.target.value)}
          >
            <option value="">Select</option>
            {options.map(option => (

              <option key={option} value={option}>
                {option}
              </option>

            ))}
          </select>
        )}

        {type === 'multipleSelects' && (
          <div className="space-y-2">
            {options.map(option => (
              <label key={option} className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={e => {

                    const currentValues = value || [];
                    if (e.target.checked) {
                      handleInputChange(questionKey, [...currentValues, option]);
                    } else {
                      handleInputChange(questionKey, currentValues.filter(v => v !== option));
                    }
                    
                  }}
                />

                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )}

        {type === 'multipleAttachments' && (
          <input
            type="file"
            multiple
            className={`w-full border px-3 py-2 ${error ? 'border-red-500' : ''}`}
            onChange={e => {
              const files = Array.from(e.target.files);
              handleInputChange(questionKey, files);
            }}
          />
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">Loading form...</div>;
  }

  if (!form) {
    return <div className="p-6">Form not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="border p-6">
        <h1 className="text-2xl font-bold mb-2">{form.name}</h1>
        <p className="text-sm text-gray-600 mb-6">
          * Required fields
        </p>

        <form onSubmit={handleSubmit}>
          {form.questions.map(question => renderField(question))}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="px-6 py-2 border"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}