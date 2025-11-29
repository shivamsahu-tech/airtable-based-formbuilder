import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function FormDetailPage() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/forms/${formId}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setForm(data.form));
  }, [formId]);

  if (!form) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">{form.name}</h1>

      <div className="p-5 shadow rounded-lg border">
        <h2 className="text-lg font-medium mb-3">Questions</h2>
        <div className="space-y-2">
          {form.questions.map(q => (
            <div key={q.questionKey} className="p-3 border rounded bg-gray-50">
              <p className="font-medium">{q.label}</p>
              <p className="text-sm text-gray-500">{q.type}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Link
          to={`/forms/${formId}/submit`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer"
        >
          Fill Form
        </Link>
        <Link
          to={`/forms/${formId}/responses`}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 hover:cursor-pointer "
        >
          View Responses
        </Link>
      </div>
    </div>
  );
}
