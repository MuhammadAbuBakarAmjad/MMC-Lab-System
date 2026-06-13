import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PatientSearch from '../components/PatientSearch.jsx'
import DoctorSearch  from '../components/DoctorSearch.jsx'
import ResultForm_Standard    from '../components/ResultForm_Standard.jsx'
import ResultForm_Qualitative from '../components/ResultForm_Qualitative.jsx'
import ResultForm_Descriptive from '../components/ResultForm_Descriptive.jsx'
import ResultForm_Hormones    from '../components/ResultForm_Hormones.jsx'
import { getActiveTemplatesGrouped } from '../api/templates.js'
import { getReportById, updateReport } from '../api/reports.js'

// Edit Report page — same form as New Report, but pre-populated from an existing draft.
// Forbidden for finalized reports (server returns 403 on PUT, and we check status on load).
export default function EditReport() {
  const navigate  = useNavigate()
  const { id }    = useParams()

  // Patient and doctor selections
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedDoctor,  setSelectedDoctor]  = useState(null)

  // Report header fields
  const [reportDate, setReportDate] = useState('')
  const [labNo,      setLabNo]      = useState('')

  // Set of checked template IDs
  const [checkedTemplateIds, setCheckedTemplateIds] = useState(new Set())

  // Accordion open/close state per category
  const [expandedCategories, setExpandedCategories] = useState({})

  // Result data keyed by template_id
  const [resultDataMap, setResultDataMap] = useState({})

  // Template groups from server (needed to render the test picker)
  const [templateGroups, setTemplateGroups] = useState([])

  // Page state
  const [isLoading, setIsLoading]     = useState(true)
  const [loadError, setLoadError]     = useState('')
  const [isSaving,  setIsSaving]      = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => {
    loadPageData()
  }, [id])

  // Load both the existing report and all templates in parallel
  async function loadPageData() {
    setIsLoading(true)
    setLoadError('')
    try {
      const [report, templateData] = await Promise.all([
        getReportById(id),
        getActiveTemplatesGrouped(),
      ])

      if (report.status === 'final') {
        setLoadError('This report has been finalized and cannot be edited.')
        return
      }

      setTemplateGroups(templateData)
      populateFormFromReport(report)
    } catch (error) {
      console.error('Failed to load edit page data:', error)
      setLoadError('Could not load report. It may have been deleted.')
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-fill all form fields from the existing report data
  function populateFormFromReport(report) {
    // Header fields
    setLabNo(report.lab_no)
    setReportDate(report.report_date?.split('T')[0] || '')

    // Patient and doctor — shape must match what PatientSearch/DoctorSearch expect
    setSelectedPatient({
      id:     report.patient.id,
      name:   report.patient.name,
      age:    report.patient.age,
      gender: report.patient.gender,
      phone:  report.patient.phone,
    })

    if (report.doctor?.id) {
      setSelectedDoctor({
        id:   report.doctor.id,
        name: report.doctor.name,
      })
    }

    // Pre-check every template that already has a result, and load its result_data
    const checkedIds  = new Set()
    const dataMap     = {}
    const expanded    = {}

    for (const result of report.results) {
      checkedIds.add(result.template_id)
      dataMap[result.template_id] = result.result_data
      // Auto-expand the category so the user can see what's already entered
      expanded[result.category] = true
    }

    setCheckedTemplateIds(checkedIds)
    setResultDataMap(dataMap)
    setExpandedCategories(expanded)
  }

  function toggleCategory(categoryName) {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }))
  }

  function handleTemplateCheck(template, isChecked) {
    setCheckedTemplateIds((prev) => {
      const next = new Set(prev)
      if (isChecked) {
        next.add(template.id)
      } else {
        next.delete(template.id)
      }
      return next
    })
  }

  function handleResultChange(templateId, newResultData) {
    setResultDataMap((prev) => ({
      ...prev,
      [templateId]: newResultData,
    }))
  }

  // Build the result entry component for the given template
  function renderResultForm(template) {
    const currentResultData = resultDataMap[template.id] || null

    const sharedProps = {
      templateData: template.template_data,
      resultData:   currentResultData,
      onChange:     (data) => handleResultChange(template.id, data),
    }

    switch (template.report_type) {
      case 'standard':
        return <ResultForm_Standard    {...sharedProps} />
      case 'qualitative':
        return <ResultForm_Qualitative {...sharedProps} />
      case 'descriptive':
        return <ResultForm_Descriptive {...sharedProps} />
      case 'hormones':
        return <ResultForm_Hormones    {...sharedProps} />
      default:
        return <p className="text-sm text-red-500 mt-2">Unknown report type: {template.report_type}</p>
    }
  }

  // Assemble results array in display_order for the API payload
  function buildResultsPayload() {
    const results = []
    let displayOrder = 1

    for (const group of templateGroups) {
      for (const template of group.templates) {
        if (!checkedTemplateIds.has(template.id)) continue

        const existingResultData = resultDataMap[template.id]
        const resultData = existingResultData || buildDefaultResultData(template)

        results.push({
          template_id:   template.id,
          display_order: displayOrder++,
          result_data:   resultData,
        })
      }
    }

    return results
  }

  // Build a default empty result_data structure from template_data
  function buildDefaultResultData(template) {
    if (template.report_type === 'standard') {
      return {
        fields: template.template_data.fields.map((f) => ({
          name:          f.name,
          result:        '',
          unit:          f.unit,
          normal_male:   f.normal_male,
          normal_female: f.normal_female,
        })),
      }
    }

    if (template.report_type === 'qualitative') {
      return {
        fields: template.template_data.fields.map((f) => ({
          name:   f.name,
          result: '',
        })),
      }
    }

    if (template.report_type === 'descriptive') {
      return {
        sections: template.template_data.sections.map((section) => ({
          heading: section.heading,
          fields:  section.fields.map((f) => ({
            name:   f.name,
            result: f.default || '',
          })),
        })),
      }
    }

    if (template.report_type === 'hormones') {
      return {
        fields: template.template_data.fields.map((f) => ({
          name:              f.name,
          result:            '',
          unit:              f.unit,
          normal_value_text: f.normal_value_text,
        })),
      }
    }

    return {}
  }

  function validateForm() {
    if (!selectedPatient) return 'Please select a patient before saving.'
    if (!labNo || labNo.trim() === '') return 'Lab number is required.'
    if (checkedTemplateIds.size === 0) return 'Please select at least one test.'
    return null
  }

  async function handleSaveDraft() {
    const validationError = validateForm()
    if (validationError) {
      setSaveError(validationError)
      return
    }
    await saveReport('draft')
  }

  async function handleFinalize() {
    const validationError = validateForm()
    if (validationError) {
      setSaveError(validationError)
      return
    }
    await saveReport('final')
  }

  async function saveReport(status) {
    setSaveError('')
    setSaveSuccess('')
    setIsSaving(true)

    const payload = {
      lab_no:      labNo.trim(),
      patient_id:  selectedPatient.id,
      doctor_id:   selectedDoctor?.id || null,
      report_date: reportDate,
      status,
      results:     buildResultsPayload(),
    }

    try {
      await updateReport(id, payload)

      if (status === 'final') {
        navigate(`/reports/${id}`)
      } else {
        setSaveSuccess('Draft saved successfully.')
      }
    } catch (error) {
      console.error('Failed to save report:', error)
      setSaveError(error.message || 'Could not save report. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-red-600 mb-4">{loadError}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit Report</h1>

      {/* ── Patient + Doctor row ── */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient <span className="text-red-500">*</span>
            </label>
            <PatientSearch
              selectedPatient={selectedPatient}
              onPatientSelect={setSelectedPatient}
              onPatientClear={() => setSelectedPatient(null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
            <DoctorSearch
              selectedDoctor={selectedDoctor}
              onDoctorSelect={setSelectedDoctor}
              onDoctorClear={() => setSelectedDoctor(null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={labNo}
              onChange={(e) => setLabNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Test Picker ── */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Select Tests</h2>

        {templateGroups.length === 0 && (
          <p className="text-sm text-gray-500">No active test templates found.</p>
        )}

        {templateGroups.map((group) => (
          <div key={group.category} className="mb-2 border border-gray-200 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {group.category}
              </span>
              <span className="text-gray-400 text-xs">
                {expandedCategories[group.category] ? '▲' : '▼'}
              </span>
            </button>

            {expandedCategories[group.category] && (
              <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                {group.templates.map((template) => {
                  const isChecked = checkedTemplateIds.has(template.id)
                  return (
                    <div key={template.id}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleTemplateCheck(template, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-800 font-medium">{template.test_name}</span>
                        <span className="text-xs text-gray-400 capitalize">({template.report_type})</span>
                      </label>

                      {isChecked && (
                        <div className="ml-6 mt-1">
                          {renderResultForm(template)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Feedback messages ── */}
      {saveError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {saveSuccess}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSaving}
          className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Finalize Report'}
        </button>
      </div>
    </div>
  )
}
