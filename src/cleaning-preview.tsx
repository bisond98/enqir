import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { CleaningTypeMultiSelect } from '@/components/CleaningTypeMultiSelect';

/** Live demo of the shipped component; the description is fully independent. */
function Demo() {
  const [types, setTypes] = useState<string[]>([]);
  const [desc, setDesc] = useState('');

  return (
    <div style={{ maxWidth: 480, margin: '24px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ fontSize: 14, marginBottom: 8 }}>Cleaning Services — multi-select (live component)</h2>
      <CleaningTypeMultiSelect value={types} onChange={setTypes} />
      <p style={{ fontSize: 11, color: '#64748b', margin: '14px 0 4px' }}>
        Description (independent input):
      </p>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={{ width: '100%', height: 90, border: '1.5px solid #cbd5e1', borderRadius: 10, padding: 10, fontSize: 13 }}
        placeholder="Description…"
      />
      <p style={{ fontSize: 11, color: '#64748b' }}>Selected: {JSON.stringify(types)}</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Demo />);
