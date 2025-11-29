import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function FormResponsesPage() {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [questionId, setQuestionId] = useState({});

  const exportInCsv = () => {
  if (!responses.length) return;

  const keys = Object.keys(responses[0].answers);
  const headers = keys.map(k => questionId[k] || k);
  
  let csv = headers.join(",") + "\n";
  
  responses.forEach(r => {
    const row = keys.map(k => {
      const val = r.answers[k];
      if (typeof val === "object") return "";
      return val || "";
    });
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "responses.csv";
  a.click();
};


  useEffect(() => {

    fetch(`${API_URL}/api/forms/${formId}/responses`, { credentials: "include" })
    .then(res => res.json())
    .then(data => {      
      console.log("Fetched Data:", data); 
      
      const questions = data?.form?.questions || [];
      
      for (const question of questions) {
        setQuestionId(state => ({
          ...state,
          [question.questionKey]: question.label,
        }))
      }
      
      console.log("question ids list: ", questionId);
      setResponses(data?.responses || []);
    })
    .catch(error => {
      console.error("error:", error);
    });

    
  }, [formId]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-semibold mb-4">Form Responses</h1>
      <button 
      onClick={exportInCsv}
      className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
       >Export</button>
      </div>


      <div className="space-y-4">
        {responses.map(r => (
          <div
            key={r._id}
            className="p-4 rounded border shadow"
          >
            <p className="text-sm text-gray-600 mb-3">Record ID: {r.airtableRecordId}</p>

            <div className="space-y-1">
              {Object.entries(r.answers).map(([key, value]) => (
                <p key={key} className="text-sm">
                  <span className="font-medium">{questionId[key]}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
