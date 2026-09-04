export default function SDGBadge({ id, name, colorHex }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: colorHex || '#6B7280' }}
      title={name}
    >
      SDG {id} · {name}
    </span>
  );
}
