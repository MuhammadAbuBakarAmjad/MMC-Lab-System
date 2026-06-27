import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getReportById } from '../api/reports'
import { getSettings } from '../api/settings'
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dates'

const DISCLAIMER =
  'All tests are performed on advanced and appropriate state-of-the-art instruments under strict ' +
  'quality control conditions. However, the above results are not a diagnosis and should be correlated ' +
  'with the patient’s clinical findings, history, signs and symptoms, and other diagnostic tests. ' +
  'Laboratory-to-laboratory variations may occur. This document is not valid for legal/court proceedings.'

// ─── Result display components (read-only, for the printed report) ────────────

// Standard and hormones: four-column table (Test Name | Result | Unit | Normal Value)
function ResultTable({ result }) {
  const { report_type, result_data } = result;
  const isHormones = report_type === 'hormones';
  const fields = result_data.fields || [];

  return (
    <table className="w-full border-collapse" style={{ fontSize: 'inherit' }}>
      <thead>
        <tr className="border-b-2 border-gray-400">
          <th className="text-left py-1.5 pr-3 font-semibold text-gray-800 w-[38%]">TEST NAME</th>
          <th className="text-left py-1.5 pr-3 font-semibold text-gray-800 w-[15%]">RESULT</th>
          <th className="text-left py-1.5 pr-3 font-semibold text-gray-800 w-[15%]">UNIT</th>
          <th className="text-left py-1.5 font-semibold text-gray-800 w-[32%]">NORMAL VALUE</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={index} className="border-b border-gray-200">
            <td className="py-1.5 pr-3 text-gray-800">{field.name}</td>
            <td className="py-1.5 pr-3 font-semibold text-gray-900">{field.result || ''}</td>
            <td className="py-1.5 pr-3 text-gray-600">{field.unit || ''}</td>
            <td className="py-1.5 text-gray-600">
              {isHormones
                ? <NormalValueHormones text={field.normal_value_text} />
                : <NormalValueStandard male={field.normal_male} female={field.normal_female} />
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Shows M:/F: split when values differ, single value when they match
function NormalValueStandard({ male, female }) {
  if (!male && !female) return null;
  if (male === female) return <span>{male}</span>;
  return (
    <span className="whitespace-pre-line">
      {'M: ' + (male || '—') + '\nF: ' + (female || '—')}
    </span>
  );
}

// Hormone normal values may be multi-line — preserve line breaks
function NormalValueHormones({ text }) {
  if (!text) return null;
  return <span className="whitespace-pre-line">{text}</span>;
}

// Qualitative: two-column table (Test Name | Result)
function QualitativeTable({ result }) {
  const fields = result.result_data.fields || [];

  return (
    <table className="w-full border-collapse" style={{ fontSize: 'inherit' }}>
      <thead>
        <tr className="border-b-2 border-gray-400">
          <th className="text-left py-1.5 pr-3 font-semibold text-gray-800 w-[60%]">TEST NAME</th>
          <th className="text-left py-1.5 font-semibold text-gray-800 w-[40%]">RESULT</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={index} className="border-b border-gray-200">
            <td className="py-1.5 pr-3 text-gray-800">{field.name}</td>
            <td className="py-1.5 font-semibold text-gray-900">{field.result || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Descriptive: sub-sections each with their own rows (Urine R/E, Stool, Semen)
function DescriptiveTable({ result }) {
  const sections = result.result_data.sections || [];

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 px-2 py-0.5 mb-1">
            {section.heading}
          </div>
          <table className="w-full border-collapse" style={{ fontSize: 'inherit' }}>
            <tbody>
              {(section.fields || []).map((field, fieldIndex) => (
                <tr key={fieldIndex} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 text-gray-800 w-[50%]">{field.name}</td>
                  <td className="py-1.5 font-semibold text-gray-900">
                    {field.result || ''}
                    {field.unit
                      ? <span className="text-gray-500 ml-1 font-normal">{field.unit}</span>
                      : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// Picks the right display component based on report_type
function ResultDisplay({ result }) {
  switch (result.report_type) {
    case 'standard':
    case 'hormones':
      return <ResultTable result={result} />;
    case 'qualitative':
      return <QualitativeTable result={result} />;
    case 'descriptive':
      return <DescriptiveTable result={result} />;
    default:
      return <p className="text-gray-400 text-sm">Unknown result type.</p>;
  }
}

// ─── Report layout components ─────────────────────────────────────────────────

// Lab identity block + patient info — prints only on page 1 (lives in tbody, not thead)
function ReportHeader({ report, settings }) {
  const labName    = settings?.lab_name   || 'Mashallah Medical Complex, Multan';
  const department = settings?.department || 'Department of Pathology';
  const contactNo  = settings?.contact_no || '';
  const { patient, doctor, lab_no, report_date, specimen, finalized_at } = report;

  const finalizedTime = formatTimeForDisplay(finalized_at);

  return (
    <div className="mb-3">
      {/* ── Lab identity: logo left, text right ── */}
      <div className="flex items-center gap-4 mb-3">
        <img
          src="/logo.png"
          alt="Lab Logo"
          className="h-24 w-auto object-contain flex-shrink-0"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-gray-900 uppercase tracking-wide leading-tight">
            {labName}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">{department}</div>
          {contactNo && (
            <div className="text-sm text-gray-500 mt-0.5">
              <span className="font-semibold">Contact No:</span> {contactNo}
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-500 mb-3" />

      {/* ── Patient info: left column demographics, right column report metadata ── */}
      <div className="grid grid-cols-2 gap-x-6 text-sm">
        {/* Left: patient demographics — one field per line */}
        <div className="space-y-1">
          <div>
            <span className="font-semibold text-gray-700">Patient Name:&nbsp;</span>
            <span className="text-gray-900 font-medium">{patient.name}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Age:&nbsp;</span>
            <span className="text-gray-900">{patient.age || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Sex:&nbsp;</span>
            <span className="text-gray-900">{patient.gender || '—'}</span>
          </div>
          {patient.father_husband_name && (
            <div>
              <span className="font-semibold text-gray-700">F/H Name:&nbsp;</span>
              <span className="text-gray-900">{patient.father_husband_name}</span>
            </div>
          )}
          {patient.cnic && (
            <div>
              <span className="font-semibold text-gray-700">CNIC:&nbsp;</span>
              <span className="text-gray-900">{patient.cnic}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-gray-700">Referred By:&nbsp;</span>
            <span className="text-gray-900">
              {!doctor?.name || doctor.name === 'Self' ? 'Self' : `Dr. ${doctor.name}`}
            </span>
          </div>
        </div>

        {/* Right: report metadata — one field per line */}
        <div className="space-y-1">
          <div>
            <span className="font-semibold text-gray-700">Lab No:&nbsp;</span>
            <span className="text-gray-900 font-bold">{lab_no}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Date:&nbsp;</span>
            <span className="text-gray-900">{formatDateForDisplay(report_date)}</span>
          </div>
          {finalizedTime && (
            <div>
              <span className="font-semibold text-gray-700">Time of Generation:&nbsp;</span>
              <span className="text-gray-900">{finalizedTime}</span>
            </div>
          )}
          {specimen && (
            <div>
              <span className="font-semibold text-gray-700">Specimen:&nbsp;</span>
              <span className="text-gray-900">{specimen}</span>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-500 mt-3" />
    </div>
  );
}

// Groups results by category, renders each section with a shaded heading
function ReportBody({ results }) {
  // Group by category, preserving first-appearance order
  const categoryOrder = [];
  const groupedByCategory = {};

  for (const result of results) {
    const cat = result.category;
    if (!groupedByCategory[cat]) {
      groupedByCategory[cat] = [];
      categoryOrder.push(cat);
    }
    groupedByCategory[cat].push(result);
  }

  return (
    <div className="space-y-4">
      {categoryOrder.map((category) => (
        <div key={category} className="report-section">
          {/* Shaded section heading — visually separates test groups */}
          <div className="font-bold text-gray-900 uppercase tracking-wide px-3 py-1.5 bg-gray-200 mb-2">
            {category}
          </div>
          <div className="space-y-3 px-1">
            {groupedByCategory[category].map((result) => (
              <div key={result.id}>
                {/* Show individual test name only when multiple tests share a category */}
                {groupedByCategory[category].length > 1 && (
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {result.template_name}
                  </div>
                )}
                <ResultDisplay result={result} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Footer — repeats on every printed page via tfoot
// printTime is set just before window.print() is called; it shows "Reported On" only on the printout
function ReportFooter({ settings, printTime }) {
  const footerNote = settings?.footer_note || '';

  return (
    <tfoot>
      <tr>
        <td className="pb-8">
          <div className="mt-6 pt-3 border-t border-gray-400 space-y-2">
            {/* User-configurable footer note from Settings */}
            {footerNote && (
              <div className="text-xs text-gray-600 leading-relaxed">{footerNote}</div>
            )}

            {/* Electronic verification notice */}
            <div className="text-xs text-gray-500 font-medium">
              Electronically Verified &mdash; No Signature Required
            </div>

            {/* Legal disclaimer — very small but readable */}
            <div className="text-[10px] text-gray-400 leading-relaxed">
              {DISCLAIMER}
            </div>

            {/* Reported On — only appears on actual printout, not on screen before printing */}
            {printTime && (
              <div className="text-xs text-gray-500 text-right pt-1">
                Reported On: {printTime}
              </div>
            )}
          </div>
        </td>
      </tr>
    </tfoot>
  );
}

// ─── Main ViewReport page ─────────────────────────────────────────────────────

export default function ViewReport() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [report, setReport]         = useState(null);
  const [settings, setSettings]     = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  // printTime is stamped when the user clicks Print — appears in footer only on the printout
  const [printTime, setPrintTime]   = useState('');

  useEffect(() => {
    loadReportData();
  }, [id]);

  async function loadReportData() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Load report and settings in parallel — both needed before rendering
      const [reportData, settingsData] = await Promise.all([
        getReportById(id),
        getSettings(),
      ]);
      setReport(reportData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load report:', error);
      setErrorMessage('Could not load this report. It may have been deleted.');
    } finally {
      setIsLoading(false);
    }
  }

  // Stamp the print time, then open the print dialog after React re-renders
  function handlePrint() {
    const now = new Date();
    setPrintTime(
      formatDateForDisplay(now.toISOString()) + '  ' + formatTimeForDisplay(now.toISOString())
    );
    setTimeout(() => window.print(), 80);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-red-600 mb-4">{errorMessage}</p>
        <Link to="/reports" className="text-blue-600 hover:underline text-sm">← Back to Reports</Link>
      </div>
    );
  }

  if (!report) return null;

  const isDraft = report.status === 'draft';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Action bar — hidden when printing */}
      <div className="no-print flex items-center justify-between mb-6 gap-3">
        <Link
          to="/reports"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Reports
        </Link>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {isDraft ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Draft
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Final
            </span>
          )}

          {/* Edit — only for drafts */}
          {isDraft && (
            <button
              onClick={() => navigate(`/reports/${id}/edit`)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report content — this is what gets printed */}
      <div className="report-container bg-white p-8 shadow-sm border border-gray-200 print:shadow-none print:border-none">
        {/*
          Outer table structure makes the tfoot repeat on every printed page.
          ReportHeader is in tbody row 1 (NOT thead) so it only prints on page 1.
          ReportFooter renders a <tfoot> which repeats on every page automatically.
        */}
        <table className="w-full">
          {/*
            print-top-spacer repeats at the top of every continuation page via
            table-header-group — giving ~1cm breathing room so content never
            hits the very top of the paper. Hidden on screen (height 0).
          */}
          {/* Repeats at top of every continuation page — invisible on screen */}
          <thead className="print-top-spacer">
            <tr><td style={{ height: '1cm' }}></td></tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-0">
                <ReportHeader report={report} settings={settings} />
              </td>
            </tr>
            <tr>
              <td className="pt-3">
                <ReportBody results={report.results} />
              </td>
            </tr>
          </tbody>

          <ReportFooter settings={settings} printTime={printTime} />
        </table>
      </div>
    </div>
  );
}
