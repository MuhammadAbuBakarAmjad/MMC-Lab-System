import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientSearch from '../components/PatientSearch.jsx'
import DoctorSearch  from '../components/DoctorSearch.jsx'
import ResultForm_Standard    from '../components/ResultForm_Standard.jsx'
import ResultForm_Qualitative from '../components/ResultForm_Qualitative.jsx'
import ResultForm_Descriptive from '../components/ResultForm_Descriptive.jsx'
import ResultForm_Hormones    from '../components/ResultForm_Hormones.jsx'
import { getActiveTemplatesGrouped } from '../api/templates.js'
import { getNextLabNo, createReport } from '../api/reports.js'
import { getTodayAsInputValue } from '../utils/dates.js'

// New Report page — lets the user create a lab report for a patient.
// Workflow: pick patient → pick doctor → fill report details → select tests → enter results → save.
export default function NewReport() {
  const navigate = useNavigate()

  // Step 1 & 2 — patient and doctor
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedDoctor,  setSelectedDoctor]  = useState(null)

  // Step 3 — report details
  const [reportDate, setReportDate] = useState(getTodayAsInputValue())
  const [labNo,      setLabNo]      = useState('')
  const [specimen,   setSpecimen]   = useState('')

  // Step 4 — test selection: Set of template IDs that are checked
  const [checkedTemplateIds, setCheckedTemplateIds] = useState(new Set())

  // Whether each category accordion section is expanded or collapsed
  const [expandedCategories, setExpandedCategories] = useState({})

  // Step 5 — result data keyed by template_id
  // resultDataMap[templateId] = the result_data object for that test
  const [resultDataMap, setResultDataMap] = useState({})

  // Template groups loaded from server
  const [templateGroups, setTemplateGroups] = useState([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Save state
  const [isSaving, setIsSaving]       = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  // Load templates and next lab number on mount
  useEffect(() => {
    loadTemplates()
    loadNextLabNo()
  }, [])

  async function loadTemplates() {
    setIsLoadingTemplates(true)
    setLoadError('')
    try {
      const groups = await getActiveTemplatesGrouped()
      setTemplateGroups(groups)
    } catch (error) {
      console.error('Failed to load templates:', error)
      setLoadError('Could not load test templates. Please refresh the page.')
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  async function loadNextLabNo() {
    try {
      const data = await getNextLabNo()
      setLabNo(data.lab_no)
    } catch (error) {
      console.error('Failed to load next lab number:', error)
      // Leave the field empty — user can type it in manually
    }
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

  // Build the results array for the API payload from all checked templates
  function buildResultsPayload() {
    const results = []
    let displayOrder = 1

    for (const group of templateGroups) {
      for (const template of group.templates) {
        if (!checkedTemplateIds.has(template.id)) continue

        // If the user never touched this form, build default empty result_data from template
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

  // Build a default (empty) result_data structure from template_data so even
  // unedited tests are stored with the correct shape in the database
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
    if (!selectedPatient) {
      return 'Please select a patient before saving.'
    }
    if (!labNo || labNo.trim() === '') {
      return 'Lab number is required.'
    }
    if (checkedTemplateIds.size === 0) {
      return 'Please select at least one test.'
    }
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
      specimen:    specimen.trim() || null,
      results:     buildResultsPayload(),
    }

    try {
      const createdReport = await createReport(payload)

      if (status === 'final') {
        navigate(`/reports/${createdReport.id}`)
      } else {
        // Draft: stay on page and show success message
        setSaveSuccess(`Draft saved. Lab No: ${createdReport.lab_no}`)
        // Refresh lab number so the next new report auto-increments correctly
        loadNextLabNo()
      }
    } catch (error) {
      console.error('Failed to save report:', error)
      setSaveError(error.message || 'Could not save report. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">New Report</h1>

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

        {/* ── Report date + Lab No + Specimen ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
              placeholder="Auto-generated"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specimen <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={specimen}
              onChange={(e) => setSpecimen(e.target.value)}
              placeholder="e.g. Blood, Urine"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Test Picker ── */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Select Tests</h2>

        {isLoadingTemplates && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading tests…
          </div>
        )}

        {loadError && (
          <p className="text-sm text-red-600">{loadError}</p>
        )}

        {!isLoadingTemplates && !loadError && templateGroups.length === 0 && (
          <p className="text-sm text-gray-500">No active test templates found. Add templates in Settings.</p>
        )}

        {!isLoadingTemplates && !loadError && templateGroups.map((group) => (
          <div key={group.category} className="mb-2 border border-gray-200 rounded-md overflow-hidden">
            {/* Category accordion header */}
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

            {/* Tests inside category — only shown when expanded */}
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

                      {/* Result entry form appears inline when the test is checked */}
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
          {isSaving ? 'Saving…' : 'Save as Draft'}
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
