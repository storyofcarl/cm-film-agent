import { useEffect, useState } from 'react';
import { getClientConfig, setClientConfig } from '../../utils/film/suiteConfig';
import { providerModel } from '../../utils/providerModels';
export default function ReasoningModelSelector() {
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState('');
  useEffect(() => {
    let alive = true;
    fetch('/api/film/config').then((r) => r.ok ? r.json() : null).then((data) => {
      if (!alive || !data) return;
      const ids = [...new Set(['reasoner', 'claudeSonnet', 'claudeOpus', 'seedReasoner'].map((key) => data.models[key]).filter(Boolean))];
      setOptions(ids);
      const saved = getClientConfig().models?.reasoner;
      setValue(ids.includes(saved) ? saved : data.models.reasoner);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!options.length) return null;
  return <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', margin: '6px 12px', fontSize: 12 }}>
    Writing &amp; planning
    <select aria-label="Writing and planning model" value={value} onChange={(e) => { setValue(e.target.value); setClientConfig({ models: { reasoner: e.target.value } }); }}
      style={{ background: '#172234', color: '#e6edf7', border: '1px solid #354257', padding: '5px 8px', borderRadius: 6 }}>
      {options.map((id) => <option key={id} value={id}>{providerModel(id)?.label || 'Seed reasoner'}</option>)}
    </select>
  </label>;
}
