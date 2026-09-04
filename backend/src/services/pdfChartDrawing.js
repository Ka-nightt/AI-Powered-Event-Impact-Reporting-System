const PALETTE = ['#2563EB', '#DB2777', '#F59E0B', '#9CA3AF', '#10B981', '#7C3AED'];

/**
 * Draws a pie chart with a legend at the given top-left origin.
 * Returns the y-coordinate immediately below the drawn chart.
 */
function drawPieChart(doc, { x, y, width, title, labels, data }) {
  const radius = Math.min(width, 220) / 2.6;
  const cx = x + radius + 10;
  const cy = y + radius + 20;
  const total = data.reduce((a, b) => a + b, 0) || 1;

  if (title) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title, x, y);
  }

  let startAngle = -Math.PI / 2;
  data.forEach((value, i) => {
    if (value <= 0) return;
    const sliceAngle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const steps = Math.max(2, Math.ceil((sliceAngle / (Math.PI * 2)) * 60));

    doc.save();
    doc.moveTo(cx, cy);
    for (let s = 0; s <= steps; s++) {
      const angle = startAngle + (sliceAngle * s) / steps;
      doc.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    doc.closePath();
    doc.fillColor(PALETTE[i % PALETTE.length]).fill();
    doc.restore();

    startAngle = endAngle;
  });

  // Legend to the right of the pie
  const legendX = cx + radius + 30;
  let legendY = cy - radius;
  doc.font('Helvetica').fontSize(9);
  labels.forEach((label, i) => {
    const pct = total > 0 ? ((data[i] / total) * 100).toFixed(1) : '0.0';
    doc.rect(legendX, legendY + 2, 8, 8).fillColor(PALETTE[i % PALETTE.length]).fill();
    doc.fillColor('#374151').text(`${label}: ${data[i]} (${pct}%)`, legendX + 14, legendY);
    legendY += 16;
  });

  return cy + radius + 20;
}

/**
 * Draws a simple vertical bar chart. Returns the y-coordinate below the chart.
 */
function drawBarChart(doc, { x, y, width, height = 160, title, labels, data }) {
  if (title) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title, x, y);
    y += 20;
  }

  const max = Math.max(...data, 1);
  const gap = 12;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  // baseline
  doc.moveTo(x, y + height).lineTo(x + width, y + height).strokeColor('#E5E7EB').stroke();

  data.forEach((value, i) => {
    const barHeight = (value / max) * (height - 20);
    const bx = x + i * (barWidth + gap);
    const by = y + height - barHeight;
    doc.rect(bx, by, barWidth, barHeight).fillColor(PALETTE[0]).fill();
    doc.font('Helvetica').fontSize(8).fillColor('#374151').text(String(value), bx, by - 12, { width: barWidth, align: 'center' });
    doc.text(labels[i], bx - 4, y + height + 4, { width: barWidth + 8, align: 'center' });
  });

  return y + height + 24;
}

module.exports = { drawPieChart, drawBarChart };
