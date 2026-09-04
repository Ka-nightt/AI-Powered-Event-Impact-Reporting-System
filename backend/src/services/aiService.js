const ollama = require('../config/ollama');

const SECTION_ORDER = [
  ['EXECUTIVE_SUMMARY', 'executiveSummary'],
  ['ATTENDANCE_ANALYSIS', 'attendanceAnalysis'],
  ['SURVEY_FINDINGS', 'surveyFindings'],
  ['KEY_STRENGTHS', 'keyStrengths'],
  ['AREAS_OF_CONCERN', 'areasOfConcern'],
  ['RECOMMENDATIONS', 'recommendations'],
  ['CONCLUSION', 'conclusion'],
];

/**
 * Builds a structured prompt from an event's analytics + context and asks
 * the local model for a full impact-report write-up broken into named
 * sections. Returns an object keyed by section (camelCase), where
 * keyStrengths/areasOfConcern/recommendations are string arrays and the
 * rest are plain paragraphs.
 */
async function generateEventInsights({ event, analytics, sdgs }) {
  const prompt = `You are an impact-reporting analyst. Write a factual, structured report for the event below.
Do not invent numbers that are not given. Base every claim only on the data provided.

Event: ${event.name}
Date: ${event.event_date}
Location: ${event.location || 'N/A'}
Organizer: ${event.organizer || 'N/A'}
Linked SDGs: ${sdgs.map((s) => `${s.id}. ${s.name}`).join(', ') || 'None mapped'}

Attendance:
- Registered: ${analytics.totals.registered}
- Attended: ${analytics.totals.attended}
- Absent: ${analytics.totals.absent}
- Attendance rate: ${analytics.totals.attendanceRate}%
Gender split: Male ${analytics.genderBreakdown.data[0]}, Female ${analytics.genderBreakdown.data[1]}, Other ${analytics.genderBreakdown.data[2]}

Survey:
- Responses collected: ${analytics.totals.surveyResponses}
- Response rate: ${analytics.totals.responseRate ?? 'N/A'}%
- Average satisfaction (0-10, if available): ${analytics.totals.avgSatisfaction ?? 'N/A'}

Respond in EXACTLY this format, with each section header on its own line followed by its content,
and bullet sections using "- " for each line:

EXECUTIVE_SUMMARY:
<2-4 sentence high-level overview of the event's reach and impact>
ATTENDANCE_ANALYSIS:
<2-3 sentences analyzing the attendance numbers and demographic split>
SURVEY_FINDINGS:
<2-3 sentences analyzing survey response rate and satisfaction, or noting data is unavailable>
KEY_STRENGTHS:
- <strength 1>
- <strength 2>
AREAS_OF_CONCERN:
- <concern 1>
- <concern 2>
RECOMMENDATIONS:
- <recommendation 1>
- <recommendation 2>
- <recommendation 3>
CONCLUSION:
<1-2 sentence closing statement>`;

  const raw = await ollama.generate(prompt);
  return parseSections(raw);
}

function parseSections(raw) {
  const result = {};
  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const [marker, key] = SECTION_ORDER[i];
    const nextMarker = SECTION_ORDER[i + 1]?.[0];
    const pattern = nextMarker
      ? new RegExp(`${marker}:\\s*([\\s\\S]*?)${nextMarker}:`, 'i')
      : new RegExp(`${marker}:\\s*([\\s\\S]*)`, 'i');
    const match = raw.match(pattern);
    const content = match ? match[1].trim() : '';

    if (['keyStrengths', 'areasOfConcern', 'recommendations'].includes(key)) {
      result[key] = content
        .split('\n')
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
    } else {
      result[key] = content;
    }
  }

  // Fallback: if parsing failed entirely (model ignored the format), put
  // everything raw into the executive summary rather than losing it.
  const hasAnyContent = Object.values(result).some((v) => (Array.isArray(v) ? v.length : v));
  if (!hasAnyContent) {
    result.executiveSummary = raw.trim();
  }

  return result;
}

module.exports = { generateEventInsights };
