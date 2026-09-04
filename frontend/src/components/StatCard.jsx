export default function StatCard({ label, value, icon: Icon, accent = 'brand' }) {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-600',
    pink: 'bg-pink-50 text-accent',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-ink leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
