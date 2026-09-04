const STYLES = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
  analyzed: { label: 'Attendance analyzed', className: 'bg-amber-50 text-amber-700' },
  report_ready: { label: 'Report ready', className: 'bg-emerald-50 text-emerald-700' },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
