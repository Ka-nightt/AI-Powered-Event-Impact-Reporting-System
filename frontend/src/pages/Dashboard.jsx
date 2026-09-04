import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, FileText, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import TrendChartCard from '../components/charts/TrendChartCard';
import { getDashboardStats, getAttendanceTrend } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAttendanceTrend()])
      .then(([s, t]) => {
        setStats(s);
        setTrend(t);
      })
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
        <p className="text-gray-500 mt-1">An overview of your events and reporting activity.</p>
      </header>

      {error && (
        <div className="card p-4 mb-6 border-red-200 bg-red-50 text-red-700 text-sm">
          Couldn't reach the API: {error}. Make sure the backend is running and VITE_API_BASE_URL is set correctly.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total events" value={stats?.totalEvents ?? '—'} icon={CalendarDays} accent="brand" />
        <StatCard label="Total participants" value={stats?.totalParticipants ?? '—'} icon={Users} accent="pink" />
        <StatCard label="Reports generated" value={stats?.reportsGenerated ?? '—'} icon={FileText} accent="amber" />
        <StatCard label="Recent activity" value={stats?.recentActivity?.length ?? '—'} icon={Activity} accent="green" />
      </div>

      {trend && trend.labels.length > 0 && (
        <div className="mb-8">
          <TrendChartCard title="Attendance trend across events" labels={trend.labels} registered={trend.registered} attended={trend.attended} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate mb-3">Recent events</h3>
          {!stats?.recentEvents?.length ? (
            <p className="text-sm text-gray-500">No events yet — create one to get started.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentEvents.map((e) => (
                <li key={e.id}>
                  <Link to={`/events/${e.id}`} className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{e.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(e.event_date).toDateString()} · {e.participantCount} participant{e.participantCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate mb-3">Recent activity</h3>
          {!stats?.recentActivity?.length ? (
            <p className="text-sm text-gray-500">Nothing yet — create an event and upload data to see activity here.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentActivity.map((a, i) => (
                <li key={i} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-ink truncate">
                    <span className="font-medium capitalize">{a.type}</span>
                    {a.detail ? ` · ${a.detail}` : ''} — {a.event_name}
                  </span>
                  <span className="text-gray-400 shrink-0 ml-3">{new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
