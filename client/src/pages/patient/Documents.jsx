import { useState } from 'react';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DocumentList from '../../components/DocumentList';
import { Page, Card, Field, Loading, ErrorMsg, inputCls, btnCls } from '../../components/UI';

const url = '/patients/me/documents';
const categories = ['Report', 'Prescription', 'Test result', 'Other'];

export default function Documents() {
  const { data, loading, error, reload } = useFetch(url);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      // FormData is how a browser sends a file together with normal fields
      const form = new FormData();
      form.append('title', title);
      form.append('category', category);
      form.append('file', file);
      await api.post(url, form);

      setTitle('');
      setFile(null);
      e.target.reset(); // clears the file input
      reload();
    } catch (err) {
      setFormError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setFormError('');
    try {
      await api.delete(`${url}/${id}`);
      reload();
    } catch (err) {
      setFormError(getError(err));
    }
  }

  return (
    <Page title="My documents">
      <p className="text-sm text-slate-600">
        Keep your reports, prescriptions and test results here. A doctor can see them only while
        you have given that doctor access.
      </p>

      <Card title="Upload a document">
        <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
          <Field label="Title (e.g. Blood test, March 2026)">
            <input required className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="File (PDF, JPG or PNG, up to 5 MB)">
              <input type="file" required accept=".pdf,.jpg,.jpeg,.png" className={inputCls}
                onChange={(e) => setFile(e.target.files[0])} />
            </Field>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <ErrorMsg>{formError}</ErrorMsg>
            <button className={btnCls} disabled={busy}>{busy ? 'Uploading...' : 'Upload'}</button>
          </div>
        </form>
      </Card>

      <Card title="Uploaded documents">
        {loading && <Loading />}
        <ErrorMsg>{error}</ErrorMsg>
        {data && <DocumentList documents={data} url={url} onRemove={remove} />}
      </Card>
    </Page>
  );
}
