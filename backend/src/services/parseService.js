const xlsx = require('xlsx');
const { parse } = require('csv-parse/sync');
const path = require('path');

/**
 * Reads a spreadsheet (.xlsx/.xls) or CSV file from disk and returns
 * an array of plain row objects keyed by (lower-cased, trimmed) header.
 */
function readRows(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    return records.map(normalizeKeys);
  }

  // .xlsx / .xls
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map(normalizeKeys);
}

function normalizeKeys(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    normalized[key.toString().trim().toLowerCase().replace(/\s+/g, '_')] = row[key];
  }
  return normalized;
}

const AGE_BANDS = [
  { max: 17, label: 'under_18' },
  { max: 24, label: '18_24' },
  { max: 34, label: '25_34' },
  { max: 44, label: '35_44' },
  { max: 54, label: '45_54' },
  { max: Infinity, label: '55_plus' },
];

function bucketAge(age) {
  const n = Number(age);
  if (Number.isNaN(n)) return null;
  const band = AGE_BANDS.find((b) => n <= b.max);
  return band ? band.label : null;
}

function normalizeGender(value) {
  if (!value) return 'prefer_not_to_say';
  const v = value.toString().trim().toLowerCase();
  if (['m', 'male', 'man'].includes(v)) return 'male';
  if (['f', 'female', 'woman'].includes(v)) return 'female';
  if (['other', 'non-binary', 'nonbinary', 'nb'].includes(v)) return 'other';
  return 'prefer_not_to_say';
}

/**
 * Maps a raw attendance row (flexible column names) to the attendance table shape.
 * Accepts common header variants: name/full_name, gender/sex, age/age_group,
 * attended/present/status.
 */
function mapAttendanceRow(row) {
  const fullName = row.full_name || row.name || row.participant_name || '';
  const gender = normalizeGender(row.gender || row.sex);
  let ageGroup = row.age_group || null;
  if (!ageGroup && row.age !== undefined && row.age !== '') {
    ageGroup = bucketAge(row.age);
  }
  const attendedRaw = (row.attended || row.present || row.status || '').toString().toLowerCase();
  const attended = ['yes', 'y', 'true', '1', 'present', 'attended'].includes(attendedRaw) || row.attended === true;

  return {
    full_name: fullName,
    gender,
    age_group: ageGroup,
    registered: true,
    attended,
    raw_row: row,
  };
}

/**
 * Maps a raw survey row to the survey_responses table shape. Looks for a
 * numeric satisfaction/rating column and a free-text feedback column.
 */
function mapSurveyRow(row) {
  const scoreKey = Object.keys(row).find((k) => /satisfaction|rating|score|nps/.test(k));
  const feedbackKey = Object.keys(row).find((k) => /feedback|comment|suggestion/.test(k));

  let score = scoreKey ? Number(row[scoreKey]) : null;
  if (Number.isNaN(score)) score = null;

  return {
    satisfaction_score: score,
    feedback_text: feedbackKey ? String(row[feedbackKey]) : null,
    raw_row: row,
  };
}

/**
 * Builds a lightweight validation summary for an uploaded sheet before it's
 * committed to the database: row/participant count, detected columns,
 * duplicate record count, and missing-value counts for the fields that
 * matter most for analytics.
 */
function buildPreview(rawRows, mappedRows, type) {
  const columns = rawRows.length ? Object.keys(rawRows[0]) : [];

  const seen = new Set();
  let duplicateRecords = 0;
  for (const row of rawRows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) duplicateRecords += 1;
    else seen.add(key);
  }

  const missingValues = {};
  if (type === 'attendance') {
    missingValues.name = mappedRows.filter((r) => !r.full_name).length;
    missingValues.gender = rawRows.filter((r) => !(r.gender || r.sex)).length;
    missingValues.age = mappedRows.filter((r) => !r.age_group).length;
  } else {
    missingValues.satisfaction_score = mappedRows.filter((r) => r.satisfaction_score === null).length;
    missingValues.feedback = mappedRows.filter((r) => !r.feedback_text).length;
  }

  return {
    rowCount: rawRows.length,
    columns,
    duplicateRecords,
    missingValues,
  };
}

module.exports = { readRows, mapAttendanceRow, mapSurveyRow, normalizeGender, bucketAge, buildPreview };
