import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
    console.log("Rendering FormListPage...");
  useEffect(() => {
    console.log("Fetching forms...");
    fetch(`${API_URL}/api/forms`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setForms(data.forms || []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Forms</h1>

      <div className="space-y-4">
        {forms.map(f => (
          <Link
            key={f._id}
            to={`/forms/${f._id}`}
            className="block p-4 rounded-lg border"
          >
            <h2 className="text-xl font-medium">{f.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Form ID: {f._id}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
