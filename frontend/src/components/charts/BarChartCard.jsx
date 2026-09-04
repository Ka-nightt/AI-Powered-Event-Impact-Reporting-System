import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default function BarChartCard({ title, labels, data }) {
  const chartData = {
    labels,
    datasets: [{ label: title, data, backgroundColor: '#2563EB', borderRadius: 4 }],
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate mb-3">{title}</h3>
      <Bar data={chartData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}
