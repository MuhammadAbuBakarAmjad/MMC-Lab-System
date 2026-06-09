import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getReportById } from '../api/reports'
import { getSettings } from '../api/settings'
import { formatDateForDisplay } from '../utils/dates'

// ─── Result display components (read-only, for the printed report) ────────────

// Displays standard and hormones result rows as a full-width table
function ResultTable({ result }) {
  const { report_type, result_data, template_name } = result;
  const isHormones = report_type === 'hormones';
  const fields = result_data.fields || [];

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-[40%]">TEST NAME</th>
          <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-[15%]">REPORT</th>
          <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-[15%]">UNIT</th>
          <th className="text-left py-1 font-semibold text-gray-700 w-[30%]">NORMAL VALUE</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={index} className="border-b border-gray-100">
            <td className="py-1 pr-3 text-gray-800">{field.name}</td>
            <td className="py-1 pr-3 font-medium text-gray-900">{field.result || ''}</td>
            <td className="py-1 pr-3 text-gray-600">{field.unit || ''}</td>
            <td className="py-1 text-gray-600">
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

// Shows M:/F: split if values differ, single value if they match
function NormalValueStandard({ male, female }) {
  if (!male && !female) return null;
  if (male === female) return <span>{male}</span>;
  return (
    <span className="whitespace-pre-line">
      {'M: ' + (male || '-') + '\nF: ' + (female || '-')}
    </span>
  );
}

// Hormone normal values may be multi-line — preserve line breaks
function NormalValueHormones({ text }) {
  if (!text) return null;
  return <span className="whitespace-pre-line">{text}</span>;
}

// Qualitative result: two-column table (Test Name | Result)
function QualitativeTable({ result }) {
  const fields = result.result_data.fields || [];

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="text-left py-1 pr-3 font-semibold text-gray-700 w-[60%]">TEST NAME</th>
          <th className="text-left py-1 font-semibold text-gray-700 w-[40%]">REPORT</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={index} className="border-b border-gray-100">
            <td className="py-1 pr-3 text-gray-800">{field.name}</td>
            <td className="py-1 font-medium text-gray-900">{field.result || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Descriptive result: sub-sections each with their own field rows
function DescriptiveTable({ result }) {
  const sections = result.result_data.sections || [];

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {section.heading}
          </div>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {(section.fields || []).map((field, fieldIndex) => (
                <tr key={fieldIndex} className="border-b border-gray-100">
                  <td className="py-1 pr-3 text-gray-800 w-[50%]">{field.name}</td>
                  <td className="py-1 font-medium text-gray-900">
                    {field.result || ''}
                    {field.unit ? <span className="text-gray-500 ml-1 font-normal">{field.unit}</span> : null}
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

// Lab name, department, and patient info block at the top of the report
function ReportHeader({ report, settings }) {
  const labName   = settings?.lab_name   || 'Mashallah Medical Complex, Multan';
  const department = settings?.department || 'Department of Pathology';
  const { patient, doctor, lab_no, report_date } = report;

  return (
    <div className="mb-4">
      {/* Lab identity */}
      <div className="text-center mb-3">
        <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">{labName}</div>
        <div className="text-sm text-gray-600">{department}</div>
      </div>

      <hr className="border-gray-400 mb-3" />

      {/* Patient and report details */}
      <div className="grid grid-cols-2 gap-x-4 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Patient Name: </span>
          <span className="text-gray-900">{patient.name}</span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-gray-700">Lab No: </span>
          <span className="text-gray-900 font-bold">{lab_no}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Age: </span>
          <span className="text-gray-900">{patient.age || '—'}</span>
          <span className="mx-3">
            <span className="font-semibold text-gray-700">Sex: </span>
            <span className="text-gray-900">{patient.gender || '—'}</span>
          </span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-gray-700">Date: </span>
          <span className="text-gray-900">{formatDateForDisplay(report_date)}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Referred By: </span>
          <span className="text-gray-900">
            {doctor?.name ? `Dr. ${doctor.name}` : '—'}
          </span>
        </div>
      </div>

      <hr className="border-gray-400 mt-3" />
    </div>
  );
}

// Groups results by category and renders each as a section
function ReportBody({ results }) {
  // Group results by category, maintaining first-appearance order
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
    <div className="space-y-5">
      {categoryOrder.map((category) => (
        <div key={category} className="report-section">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">
            {category}
          </div>
          <div className="space-y-4">
            {groupedByCategory[category].map((result) => (
              <div key={result.id}>
                {/* Only show test name sub-heading if multiple tests are in the same category */}
                {groupedByCategory[category].length > 1 && (
                  <div className="text-xs font-semibold text-gray-500 mb-1">{result.template_name}</div>
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

// Footer with lab note and signature line
function ReportFooter({ settings }) {
  const footerNote = settings?.footer_note || '';

  return (
    <tfoot>
      <tr>
        <td>
          <div className="mt-6 pt-3 border-t border-gray-400">
            <div className="flex justify-between items-end text-sm">
              <div className="text-gray-600 max-w-[60%] text-xs leading-relaxed">{footerNote}</div>
              <div className="text-right">
                <div className="text-gray-700 font-medium mb-4">Signature</div>
                <div className="border-b border-gray-800 w-36"></div>
              </div>
            </div>
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
  const [report, setReport]     = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadReportData();
  }, [id]);

  async function loadReportData() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Load report and settings in parallel — both are needed before rendering
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

          {/* Edit button — only for draft reports */}
          {isDraft && (
            <button
              onClick={() => navigate(`/reports/${id}/edit`)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report content — this is what gets printed */}
      <div className="report-container bg-white p-8 shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        {/*
          Outer table structure enables the tfoot footer-repeat-on-every-page trick.
          ReportHeader goes in tbody row 1 (NOT in thead) so it prints only on page 1.
          ReportFooter renders a <tfoot> which repeats on every printed page.
        */}
        <table className="w-full">
          <tbody>
            <tr>
              <td className="p-0">
                <ReportHeader report={report} settings={settings} />
              </td>
            </tr>
            <tr>
              <td className="pt-4">
                <ReportBody results={report.results} />
              </td>
            </tr>
          </tbody>

          <ReportFooter settings={settings} />
        </table>
      </div>
    </div>
  );
}
