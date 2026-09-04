import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, User, Search } from 'lucide-react';
import { getEvents, createEvent } from '../api/client';
import StatusBadge from '../components/StatusBadge';

const emptyForm = { name: '', event_date: '', location: '', organizer: '', description: '' };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = (q) => getEvents(q).then(setEvents).catch((err) => setError(err.response?.data?.error || err.message));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createEvent(form);
      setForm(emptyForm);
      setShowForm(false);
      load(search);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Events</h2>
          <p className="text-gray-500 mt-1">Create events, then upload attendance and survey data for each one.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> New event
        </button>
      </header>

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search events by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate">Event name</label>
            <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate">Date</label>
            <input required type="date" className="input mt-1" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate">Location</label>
            <input className="input mt-1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate">Organizer</label>
            <input className="input mt-1" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate">Description</label>
            <textarea className="input mt-1" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Create event'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">{new Date(event.event_date).toDateString()}</p>
                <h3 className="font-semibold text-ink truncate">{event.name}</h3>
              </div>
              <StatusBadge status={event.status} />
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              {event.location && (
                <p className="flex items-center gap-1.5">
                  <MapPin size={14} /> {event.location}
                </p>
              )}
              {event.organizer && (
                <p className="flex items-center gap-1.5">
                  <User size={14} /> {event.organizer}
                </p>
              )}
              <p className="text-xs text-gray-400 pt-1">
                {event.participantCount} participant{event.participantCount === 1 ? '' : 's'}
                {event.report_count > 0 ? ` · ${event.report_count} report${event.report_count === 1 ? '' : 's'} generated` : ''}
              </p>
            </div>
            {event.sdgs?.length > 0 && (
              <p className="text-xs text-brand-600 mt-3">{event.sdgs.length} SDG{event.sdgs.length > 1 ? 's' : ''} linked</p>
            )}
          </Link>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-gray-500">
            {search ? `No events match "${search}".` : 'No events yet — create your first one above.'}
          </p>
        )}
      </div>
    </div>
  );
}
