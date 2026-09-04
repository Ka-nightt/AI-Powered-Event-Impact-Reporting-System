const SECTIONS = [
  { key: 'executiveSummary', title: 'Executive Summary', type: 'text' },
  { key: 'attendanceAnalysis', title: 'Attendance Analysis', type: 'text' },
  { key: 'surveyFindings', title: 'Survey Findings', type: 'text' },
  { key: 'keyStrengths', title: 'Key Strengths', type: 'list' },
  { key: 'areasOfConcern', title: 'Areas of Concern', type: 'list' },
  { key: 'recommendations', title: 'Recommendations', type: 'list' },
  { key: 'conclusion', title: 'Conclusion', type: 'text' },
];

export default function AiReportSections({ sections }) {
  if (!sections) return null;

  return (
    <div className="space-y-5">
      {SECTIONS.map(({ key, title, type }) => {
        const value = sections[key];
        const isEmpty = type === 'list' ? !value || value.length === 0 : !value;
        return (
          <div key={key}>
            <h4 className="text-sm font-semibold text-ink mb-1.5">{title}</h4>
            {isEmpty ? (
              <p className="text-sm text-gray-400">Not available.</p>
            ) : type === 'list' ? (
              <ul className="text-sm text-slate space-y-1 list-disc pl-5">
                {value.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate leading-relaxed">{value}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
