import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default function TrendChartCard({ title, labels, registered, attended }) {
  const chartData = {
    labels,
    datasets: [
      { label: 'Registered', data: registered, borderColor: '#2563EB', backgroundColor: '#2563EB', tension: 0.3 },
      { label: 'Attended', data: attended, borderColor: '#DB2777', backgroundColor: '#DB2777', tension: 0.3 },
    ],
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate mb-3">{title}</h3>
      <Line data={chartData} options={{ scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}
