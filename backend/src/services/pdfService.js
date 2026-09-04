const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { drawPieChart, drawBarChart } = require('./pdfChartDrawing');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

/**
 * Generates a full PDF impact report for one event and writes it to disk.
 * Returns the absolute file path.
 */
async function generateEventReportPdf({ event, analytics, sdgs, aiInsights, photos = [] }) {
  const fileName = `report-${event.id}-${Date.now()}.pdf`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ---- Cover page ----
  doc.fontSize(10).fillColor('#6B7280').text('EVENT IMPACT REPORT', { align: 'center' });
  doc.moveDown(4);
  doc.fillColor('#111827').fontSize(26).font('Helvetica-Bold').text(event.name, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(13).font('Helvetica').fillColor('#374151').text(
    `${new Date(event.event_date).toDateString()}  •  ${event.location || 'Location not specified'}`,
    { align: 'center' }
  );
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#6B7280').text(`Organized by ${event.organizer || 'N/A'}`, { align: 'center' });
  doc.moveDown(6);
  doc.fontSize(9).fillColor('#9CA3AF').text(`Generated ${new Date().toDateString()}`, { align: 'center' });

  // ---- Event details ----
  doc.addPage();
  sectionHeader(doc, 'Event Details');
  doc.fontSize(11).fillColor('#111827');
  addKeyValue(doc, 'Event name', event.name);
  addKeyValue(doc, 'Date', new Date(event.event_date).toDateString());
  addKeyValue(doc, 'Location', event.location || 'N/A');
  addKeyValue(doc, 'Organizer', event.organizer || 'N/A');
  if (event.description) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Description');
    doc.font('Helvetica').text(event.description);
  }
  if (sdgs.length) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Sustainable Development Goals');
    doc.font('Helvetica').text(sdgs.map((s) => `${s.id}. ${s.name}`).join('   |   '));
  }

  // ---- Attendance summary ----
  doc.moveDown(1.5);
  sectionHeader(doc, 'Attendance Summary');
  addKeyValue(doc, 'Registered', String(analytics.totals.registered));
  addKeyValue(doc, 'Attended', String(analytics.totals.attended));
  addKeyValue(doc, 'Absent', String(analytics.totals.absent));
  addKeyValue(doc, 'Attendance rate', `${analytics.totals.attendanceRate}%`);
  addKeyValue(doc, 'Survey responses', String(analytics.totals.surveyResponses));
  if (analytics.totals.responseRate != null) {
    addKeyValue(doc, 'Survey response rate', `${analytics.totals.responseRate}%`);
  }
  if (analytics.totals.avgSatisfaction != null) {
    addKeyValue(doc, 'Average satisfaction (0-10)', String(analytics.totals.avgSatisfaction));
  }

  // ---- Charts page ----
  doc.addPage();
  sectionHeader(doc, 'Participant Demographics');
  let chartY = drawPieChart(doc, {
    x: doc.page.margins.left,
    y: doc.y,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    title: 'Gender Breakdown',
    labels: analytics.genderBreakdown.labels,
    data: analytics.genderBreakdown.data,
  });
  doc.y = chartY + 20;
  drawBarChart(doc, {
    x: doc.page.margins.left,
    y: doc.y,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    height: 160,
    title: 'Age Group Breakdown',
    labels: analytics.ageBreakdown.labels,
    data: analytics.ageBreakdown.data,
  });

  // ---- AI insights ----
  doc.addPage();
  sectionHeader(doc, 'AI-Generated Impact Report');

  renderSubsection(doc, 'Executive Summary', aiInsights.executiveSummary);
  renderSubsection(doc, 'Attendance Analysis', aiInsights.attendanceAnalysis);
  renderSubsection(doc, 'Survey Findings', aiInsights.surveyFindings);
  renderSubsectionList(doc, 'Key Strengths', aiInsights.keyStrengths);
  renderSubsectionList(doc, 'Areas of Concern', aiInsights.areasOfConcern);
  renderSubsectionList(doc, 'Recommendations', aiInsights.recommendations);
  renderSubsection(doc, 'Conclusion', aiInsights.conclusion);

  // ---- Photo gallery ----
  if (photos.length) {
    doc.addPage();
    sectionHeader(doc, 'Photo Gallery');
    let x = doc.page.margins.left;
    let y = doc.y;
    const imgSize = 150;
    photos.slice(0, 9).forEach((photo, i) => {
      if (fs.existsSync(photo.file_path)) {
        if (x + imgSize > doc.page.width - doc.page.margins.right) {
          x = doc.page.margins.left;
          y += imgSize + 10;
        }
        if (y + imgSize > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.page.margins.top;
        }
        doc.image(photo.file_path, x, y, { width: imgSize, height: imgSize, fit: [imgSize, imgSize] });
        x += imgSize + 10;
      }
    });
  }

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
}

function sectionHeader(doc, text) {
  ensureSpace(doc, 60);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#111827').text(text);
  doc.moveDown(0.5);
  doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#E5E7EB').stroke();
  doc.moveDown(0.5);
}

function addKeyValue(doc, key, value) {
  doc.font('Helvetica-Bold').fontSize(11).text(`${key}: `, { continued: true }).font('Helvetica').text(value);
}

function ensureSpace(doc, minHeight) {
  if (doc.y + minHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function renderSubsection(doc, title, content) {
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10.5).fillColor('#374151').text(content || 'Not available.');
}

function renderSubsectionList(doc, title, items) {
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10.5).fillColor('#374151');
  if (!items || !items.length) {
    doc.text('Not available.');
    return;
  }
  items.forEach((item) => {
    ensureSpace(doc, 20);
    doc.text(`•  ${item}`);
  });
}

module.exports = { generateEventReportPdf };
