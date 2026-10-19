import { useState } from 'react';
import { downloadFile, getError } from '../api/axios';
import { ErrorMsg, Empty, fmtDate } from './UI';

// Shows uploaded documents with a Download button.
// url = where the documents live, onRemove(id) is optional (only the patient can remove).
export default function DocumentList({ documents, url, onRemove }) {
  const [error, setError] = useState('');

  async function download(doc) {
    setError('');
    try {
      await downloadFile(`${url}/${doc.id}/file`, doc.fileName);
    } catch (err) {
      setError(getError(err));
    }
  }

  if (documents.length === 0) return <Empty>No documents uploaded yet.</Empty>;

  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>
      <ul className="divide-y divide-slate-100 text-sm">
        {documents.map((doc) => (
          <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <strong>{doc.title}</strong>{' '}
              <span className="text-slate-500">
                {doc.category} - {fmtDate(doc.uploadedAt)} - {Math.ceil(doc.size / 1024)} KB
              </span>
            </span>
            <span className="space-x-4">
              <button onClick={() => download(doc)} className="text-teal-700 hover:underline">
                Download
              </button>
              {onRemove && (
                <button onClick={() => onRemove(doc.id)} className="text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
