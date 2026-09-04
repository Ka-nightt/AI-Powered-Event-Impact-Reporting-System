import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getEvent,
  getSdgGoals,
  updateEvent,
  previewAttendance,
  confirmAttendance,
  previewSurvey,
  confirmSurvey,
  getUploads,
  getEventAnalytics,
  generateReport,
  getReports,
  downloadReportFile,
  getPhotos,
  uploadPhotos,
  deletePhoto,
} from "../api/client";
import PieChartCard from "../components/charts/PieChartCard";
import BarChartCard from "../components/charts/BarChartCard";
import SDGBadge from "../components/SDGBadge";
import PhotoGallery from "../components/PhotoGallery";
import ValidationPreview from "../components/ValidationPreview";
import AiReportSections from "../components/AiReportSections";

const TABS = ["Overview", "Data Upload", "Analytics", "AI Report", "Gallery"];

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [sdgGoals, setSdgGoals] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);

  // Pending validation state, keyed by 'attendance' | 'survey'
  const [pendingPreview, setPendingPreview] = useState(null); // { type, tempFile, originalName, preview }
  const [validating, setValidating] = useState(null); // 'attendance' | 'survey' | null while parsing
  const [confirming, setConfirming] = useState(false);

  function refreshAll() {
    getEvent(id).then(setEvent);
    getUploads(id).then(setUploads);
    getEventAnalytics(id)
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
    getReports(id).then(setReports);
    getPhotos(id).then(setPhotos);
  }

  useEffect(() => {
    getSdgGoals().then(setSdgGoals);
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleSdg(sdgId) {
    const current = event.sdgs.map((s) => s.id);
    const next = current.includes(sdgId)
      ? current.filter((x) => x !== sdgId)
      : [...current, sdgId];
    const updated = await updateEvent(id, { sdgIds: next });
    setEvent(updated);
  }

  // ---- Step 1: parse the file and show a validation preview, don't analyze yet ----
  async function handleSelectFile(type, file) {
    if (!file) return;
    setValidating(type);
    setMessage(null);
    setPendingPreview(null);
    try {
      const fn = type === "attendance" ? previewAttendance : previewSurvey;
      const res = await fn(id, file);
      setPendingPreview({ type, ...res });
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setValidating(null);
    }
  }

  // ---- Step 2: user confirms, now it actually gets analyzed/inserted ----
  async function handleConfirmPreview() {
    if (!pendingPreview) return;
    setConfirming(true);
    setMessage(null);
    try {
      const { type, tempFile, originalName } = pendingPreview;
      const fn = type === "attendance" ? confirmAttendance : confirmSurvey;
      const res = await fn(id, tempFile, originalName);
      setMessage(`${res.rowsProcessed} rows analyzed from ${type} sheet.`);
      setPendingPreview(null);
      refreshAll();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setConfirming(false);
    }
  }

  function handleCancelPreview() {
    setPendingPreview(null);
  }

  async function handleGenerateReport() {
    setGenerating(true);
    setMessage(null);
    try {
      await generateReport(id);
      getReports(id).then(setReports);
      setMessage("Report generated successfully.");
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(reportId) {
    setDownloadingId(reportId);
    setMessage(null);
    try {
      await downloadReportFile(
        reportId,
        `${event.name.replace(/\s+/g, "-")}-report.pdf`,
      );
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  if (!event) return <p className="text-gray-500">Loading event…</p>;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs text-gray-400 mb-1">
          {new Date(event.event_date).toDateString()} ·{" "}
          {event.location || "No location set"}
        </p>
        <h2 className="text-2xl font-bold text-ink">{event.name}</h2>
        {event.sdgs?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {event.sdgs.map((s) => (
              <SDGBadge
                key={s.id}
                id={s.id}
                name={s.name}
                colorHex={s.color_hex}
              />
            ))}
          </div>
        )}
      </header>

      <div className="border-b border-gray-200 mb-6 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message && (
        <div className="card p-3 mb-6 text-sm text-slate bg-brand-50 border-brand-100">
          {message}
        </div>
      )}

      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate mb-3">
              Event details
            </h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Organizer</dt>
                <dd>{event.organizer || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Location</dt>
                <dd>{event.location || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd>{new Date(event.event_date).toDateString()}</dd>
              </div>
            </dl>
            {event.description && (
              <p className="text-sm text-gray-600 mt-4">{event.description}</p>
            )}
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate mb-3">
              SDG mapping
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Tap a goal to link or unlink it from this event.
            </p>
            <div className="flex flex-wrap gap-2">
              {sdgGoals.map((g) => {
                const active = event.sdgs.some((s) => s.id === g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleSdg(g.id)}
                    className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                      active
                        ? "text-white border-transparent"
                        : "text-gray-500 border-gray-300 hover:border-gray-400"
                    }`}
                    style={active ? { backgroundColor: g.color_hex } : {}}
                  >
                    {g.id}. {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "Data Upload" && (
        <div className="space-y-6">
          {pendingPreview ? (
            <ValidationPreview
              preview={pendingPreview.preview}
              fileLabel={`${pendingPreview.originalName} (${pendingPreview.type})`}
              onConfirm={handleConfirmPreview}
              onCancel={handleCancelPreview}
              confirming={confirming}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UploadCard
                title="Attendance sheet"
                hint="Columns like name, gender, age (or age_group), attended — .csv or .xlsx"
                validating={validating === "attendance"}
                onFile={(f) => handleSelectFile("attendance", f)}
              />
              <UploadCard
                title="Survey responses"
                hint="Include a satisfaction/rating column and an optional feedback column"
                validating={validating === "survey"}
                onFile={(f) => handleSelectFile("survey", f)}
              />
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate mb-3">
              Upload history
            </h3>
            {uploads.length === 0 ? (
              <p className="text-sm text-gray-500">No files uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {uploads.map((u) => (
                  <li
                    key={u.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <span>
                      {u.filename}{" "}
                      <span className="text-gray-400">· {u.upload_type}</span>
                    </span>
                    <span
                      className={
                        u.status === "processed"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {u.status === "processed"
                        ? `${u.row_count} rows`
                        : "failed"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "Analytics" && (
        <div>
          {!analytics ? (
            <p className="text-sm text-gray-500">
              No analytics yet — upload an attendance sheet first.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate mb-4">
                  Attendance overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatMini
                    label="Total registered"
                    value={analytics.totals.registered}
                  />
                  <StatMini label="Present" value={analytics.totals.attended} />
                  <StatMini label="Absent" value={analytics.totals.absent} />
                  <StatMini
                    label="Attendance rate"
                    value={`${analytics.totals.attendanceRate}%`}
                  />
                </div>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate mb-4">
                  Survey overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatMini
                    label="Responses"
                    value={analytics.totals.surveyResponses}
                  />
                  <StatMini
                    label="Response rate"
                    value={
                      analytics.totals.responseRate != null
                        ? `${analytics.totals.responseRate}%`
                        : "—"
                    }
                  />
                  <StatMini
                    label="Avg. satisfaction"
                    value={analytics.totals.avgSatisfaction ?? "—"}
                    span
                  />
                </div>
              </div>
            </div>
          )}
          {analytics &&
            (analytics.genderBreakdown.data.some((v) => v > 0) ||
              analytics.ageBreakdown.data.some((v) => v > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PieChartCard
                  title="Gender breakdown"
                  labels={analytics.genderBreakdown.labels}
                  data={analytics.genderBreakdown.data}
                />
                <BarChartCard
                  title="Age group breakdown"
                  labels={analytics.ageBreakdown.labels}
                  data={analytics.ageBreakdown.data}
                />
              </div>
            )}
        </div>
      )}

      {tab === "AI Report" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate">
                AI-generated report
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Uses your local Ollama model to write a full impact report, then
                bundles everything into a PDF.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={handleGenerateReport}
              disabled={generating}
            >
              {generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generating ? "Generating…" : "Generate report"}
            </button>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports generated yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {reports.map((r) => {
                const expanded = expandedReportId === r.id;
                return (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <button
                        className="flex items-center gap-1.5 text-ink font-medium"
                        onClick={() =>
                          setExpandedReportId(expanded ? null : r.id)
                        }
                      >
                        {expanded ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                        Generated {new Date(r.generated_at).toLocaleString()}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDownload(r.id)}
                        disabled={downloadingId === r.id}
                      >
                        <Download size={14} />{" "}
                        {downloadingId === r.id
                          ? "Downloading…"
                          : "Download PDF"}
                      </button>
                    </div>
                    {expanded && (
                      <div className="mt-4 pl-6 border-l-2 border-gray-100">
                        <AiReportSections sections={r.ai_sections} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "Gallery" && (
        <div className="card p-5">
          <PhotoGallery
            photos={photos}
            onUpload={(files) =>
              uploadPhotos(id, files).then(() => getPhotos(id).then(setPhotos))
            }
            onDelete={(photoId) =>
              deletePhoto(photoId).then(() => getPhotos(id).then(setPhotos))
            }
          />
        </div>
      )}
    </div>
  );
}

function UploadCard({ title, hint, validating, onFile }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">{hint}</p>
      <label className="btn-secondary cursor-pointer inline-flex">
        <FileSpreadsheet size={16} />
        {validating ? "Reading file…" : "Choose file"}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          disabled={validating}
          onChange={(e) => onFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}

function StatMini({ label, value, span }) {
  return (
    <div className={`card p-4 ${span ? "col-span-2" : ""}`}>
      <p className="text-xl font-display font-bold text-ink">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
