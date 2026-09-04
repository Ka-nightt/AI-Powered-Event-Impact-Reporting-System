import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ValidationPreview({ preview, fileLabel, onConfirm, onCancel, confirming }) {
  const { rowCount, columns, duplicateRecords, missingValues } = preview;
  const missingTotal = Object.values(missingValues).reduce((a, b) => a + b, 0);

  return (
    <div className="card p-5 border-brand-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate">Review before analyzing</h4>
          <p className="text-xs text-gray-500 mt-0.5">{fileLabel}</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Participants" value={rowCount} />
        <MiniStat label="Columns detected" value={columns.length} />
        <MiniStat
          label="Duplicate records"
          value={duplicateRecords}
          warn={duplicateRecords > 0}
        />
        <MiniStat label="Missing values" value={missingTotal} warn={missingTotal > 0} />
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-1.5">Detected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((c) => (
            <span key={c} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
              {c}
            </span>
          ))}
        </div>
      </div>

      {missingTotal > 0 && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="font-medium flex items-center gap-1.5 mb-1">
            <AlertTriangle size={13} /> Some fields are missing values
          </p>
          <ul className="space-y-0.5 pl-5 list-disc">
            {Object.entries(missingValues)
              .filter(([, count]) => count > 0)
              .map(([field, count]) => (
                <li key={field}>
                  {count} row{count === 1 ? '' : 's'} missing <span className="font-medium">{field}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {duplicateRecords > 0 && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} /> {duplicateRecords} duplicate record{duplicateRecords === 1 ? '' : 's'} found
          </p>
        </div>
      )}

      {missingTotal === 0 && duplicateRecords === 0 && (
        <div className="mb-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-1.5">
          <CheckCircle2 size={13} /> No issues detected — data looks clean.
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Analyzing…' : 'Confirm & analyze'}
        </button>
        <button className="btn-secondary" onClick={onCancel} disabled={confirming}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, warn }) {
  return (
    <div className={`rounded-lg border p-3 ${warn ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
      <p className={`text-lg font-display font-bold ${warn ? 'text-amber-700' : 'text-ink'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
