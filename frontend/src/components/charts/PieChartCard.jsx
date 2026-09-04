import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const COLORS = ['#2563EB', '#DB2777', '#F59E0B', '#9CA3AF'];

export default function PieChartCard({ title, labels, data }) {
  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: COLORS, borderWidth: 0 }],
  };
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate mb-3">{title}</h3>
      <Pie data={chartData} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }} />
    </div>
  );
}
