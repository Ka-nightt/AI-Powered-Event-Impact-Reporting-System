import { useEffect, useState } from 'react';
import { getSdgGoals } from '../api/client';

export default function SdgReference() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    getSdgGoals().then(setGoals);
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-ink">SDG Reference</h2>
        <p className="text-gray-500 mt-1">The 17 UN Sustainable Development Goals available for event tagging.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => (
          <div key={g.id} className="card p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: g.color_hex }}
            >
              {g.id}
            </div>
            <p className="text-sm font-medium text-ink">{g.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
