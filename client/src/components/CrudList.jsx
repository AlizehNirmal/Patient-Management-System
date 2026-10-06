import { useState } from 'react';
import api, { getError, dropEmpty } from '../api/axios';
import useFetch from '../hooks/useFetch';
import { Card, Field, Loading, ErrorMsg, Empty, inputCls, btnCls } from './UI';

// A list with an "add" form and a remove button per item.
// fields = [{ name, label, type }], show(item) = text to display
export default function CrudList({ title, url, fields, show }) {
  const { data, loading, error, reload } = useFetch(url);
  const empty = Object.fromEntries(fields.map((f) => [f.name, '']));
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');

  async function add(e) {
    e.preventDefault();
    setFormError('');
    try {
      await api.post(url, dropEmpty(form));
      setForm(empty);
      reload();
    } catch (err) {
      setFormError(getError(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`${url}/${id}`);
      reload();
    } catch (err) {
      setFormError(getError(err));
    }
  }

  return (
    <Card title={title}>
      {loading && <Loading />}
      <ErrorMsg>{error}</ErrorMsg>
      {data && data.length === 0 && <Empty>Nothing added yet.</Empty>}
      <ul className="divide-y divide-slate-100">
        {data?.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 text-sm">
            <span>{show(item)}</span>
            <button onClick={() => remove(item.id)} className="text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.name} label={f.label}>
            <input
              type={f.type || 'text'}
              required={f.required}
              className={inputCls}
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
            />
          </Field>
        ))}
        <div className="sm:col-span-2">
          <ErrorMsg>{formError}</ErrorMsg>
          <button className={`${btnCls} mt-2`}>Add</button>
        </div>
      </form>
    </Card>
  );
}
