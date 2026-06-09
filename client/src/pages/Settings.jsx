import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api/settings.js'
import { getAllTemplates, createTemplate, updateTemplate } from '../api/templates.js'

// Human-readable labels for the report_type column
const REPORT_TYPE_LABELS = {
  standard:    'Standard',
  qualitative: 'Qualitative',
  descriptive: 'Descriptive',
  hormones:    'Hormones',
}

export default function Settings() {
  return (
    <div className="space-y-10">
      <LabInfoSection />
      <TemplatesSection />
    </div>
  )
}

// ─── Section 1: Lab Information ──────────────────────────────────────────────

function LabInfoSection() {
  const [labName,    setLabName]    = useState('')
  const [address,    setAddress]    = useState('')
  const [department, setDepartment] = useState('')
  const [footerNote, setFooterNote] = useState('')
  const [isLoading,  setIsLoading]  = useState(true)
  const [isSaving,   setIsSaving]   = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await getSettings()
      setLabName(data.lab_name    || '')
      setAddress(data.address     || '')
      setDepartment(data.department  || '')
      setFooterNote(data.footer_note || '')
    } catch (error) {
      console.error('Failed to load settings:', error)
      setErrorMsg('Could not load settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await updateSettings({ lab_name: labName, address, department, footer_note: footerNote })
      setSuccessMsg('Lab information saved successfully.')
    } catch (error) {
      console.error('Failed to save settings:', error)
      setErrorMsg(error.message || 'Could not save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lab Information</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading…
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Lab Information</h2>

      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="labName" className="block text-sm font-medium text-gray-700 mb-1">
            Lab Name
          </label>
          <input
            id="labName"
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="footerNote" className="block text-sm font-medium text-gray-700 mb-1">
            Footer Note
          </label>
          <textarea
            id="footerNote"
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-sm text-green-600">{successMsg}</p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {isSaving ? 'Saving…' : 'Save Lab Information'}
        </button>
      </form>
    </section>
  )
}

// ─── Section 2: Test Templates ────────────────────────────────────────────────

function TemplatesSection() {
  const [templates,       setTemplates]       = useState([])
  const [isLoading,       setIsLoading]       = useState(true)
  const [errorMsg,        setErrorMsg]        = useState('')
  const [isAddFormOpen,   setIsAddFormOpen]   = useState(false)
  const [togglingId,      setTogglingId]      = useState(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await getAllTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
      setErrorMsg('Could not load templates. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle the is_active flag on a template immediately when the switch is clicked
  async function handleToggleActive(template) {
    setTogglingId(template.id)
    try {
      const updated = await updateTemplate(template.id, { is_active: !template.is_active })
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      )
    } catch (error) {
      console.error('Failed to toggle template:', error)
      alert(error.message || 'Could not update template.')
    } finally {
      setTogglingId(null)
    }
  }

  function handleTemplateCreated(newTemplate) {
    setTemplates((prev) => [...prev, newTemplate])
    setIsAddFormOpen(false)
  }

  // Collect unique categories from the loaded templates
  const existingCategories = [...new Set(templates.map((t) => t.category))].sort()

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Test Templates</h2>
        <button
          onClick={() => setIsAddFormOpen((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded"
        >
          {isAddFormOpen ? 'Cancel' : '+ Add New Template'}
        </button>
      </div>

      {isAddFormOpen && (
        <AddTemplateForm
          existingCategories={existingCategories}
          onCreated={handleTemplateCreated}
          onCancel={() => setIsAddFormOpen(false)}
        />
      )}

      {errorMsg && (
        <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading templates…
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-500">No templates found.</p>
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Test Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Category</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  isToggling={togglingId === template.id}
                  onToggle={handleToggleActive}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ─── Single row in the templates table ───────────────────────────────────────

function TemplateRow({ template, isToggling, onToggle }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 text-gray-900">{template.test_name}</td>
      <td className="px-4 py-2 text-gray-600">{template.category}</td>
      <td className="px-4 py-2 text-gray-600">
        {REPORT_TYPE_LABELS[template.report_type] || template.report_type}
      </td>
      <td className="px-4 py-2">
        <ToggleSwitch
          isOn={template.is_active}
          isDisabled={isToggling}
          onToggle={() => onToggle(template)}
        />
      </td>
    </tr>
  )
}

// ─── Toggle switch for active/inactive ───────────────────────────────────────

function ToggleSwitch({ isOn, isDisabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      aria-label={isOn ? 'Deactivate' : 'Activate'}
      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
        isOn ? 'bg-green-500' : 'bg-gray-300'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
          isOn ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Add New Template form ────────────────────────────────────────────────────

function AddTemplateForm({ existingCategories, onCreated, onCancel }) {
  const [testName,      setTestName]      = useState('')
  const [categoryMode,  setCategoryMode]  = useState('existing') // 'existing' | 'new'
  const [selectedCategory, setSelectedCategory] = useState(existingCategories[0] || '')
  const [newCategory,   setNewCategory]   = useState('')
  const [reportType,    setReportType]    = useState('standard')
  const [templateJson,  setTemplateJson]  = useState(DEFAULT_TEMPLATE_JSON.standard)
  const [isSaving,      setIsSaving]      = useState(false)
  const [errorMsg,      setErrorMsg]      = useState('')

  // Update the template JSON placeholder when report type changes
  function handleReportTypeChange(newType) {
    setReportType(newType)
    setTemplateJson(DEFAULT_TEMPLATE_JSON[newType])
  }

  function resolvedCategory() {
    return categoryMode === 'new' ? newCategory.trim().toUpperCase() : selectedCategory
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMsg('')

    const category = resolvedCategory()
    if (!category) {
      setErrorMsg('Category is required.')
      return
    }

    // Validate that the JSON textarea has valid JSON before sending
    let parsedData
    try {
      parsedData = JSON.parse(templateJson)
    } catch {
      setErrorMsg('Template data is not valid JSON. Please fix it before saving.')
      return
    }

    setIsSaving(true)
    try {
      const created = await createTemplate({
        test_name:     testName,
        category,
        report_type:   reportType,
        template_data: parsedData,
      })
      onCreated(created)
    } catch (error) {
      console.error('Failed to create template:', error)
      setErrorMsg(error.message || 'Could not create template.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-blue-200 bg-blue-50 rounded p-4 mb-4 space-y-4 max-w-xl"
    >
      <h3 className="text-sm font-semibold text-gray-800">Add New Template</h3>

      <div>
        <label htmlFor="newTestName" className="block text-sm font-medium text-gray-700 mb-1">
          Test Name
        </label>
        <input
          id="newTestName"
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="categoryMode"
              value="existing"
              checked={categoryMode === 'existing'}
              onChange={() => setCategoryMode('existing')}
            />
            Existing
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="categoryMode"
              value="new"
              checked={categoryMode === 'new'}
              onChange={() => setCategoryMode('new')}
            />
            New Category
          </label>
        </div>

        {categoryMode === 'existing' ? (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. MICROBIOLOGY"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            required={categoryMode === 'new'}
          />
        )}
      </div>

      <div>
        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
          Report Type
        </label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => handleReportTypeChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="standard">Standard</option>
          <option value="qualitative">Qualitative</option>
          <option value="descriptive">Descriptive</option>
          <option value="hormones">Hormones</option>
        </select>
      </div>

      <div>
        <label htmlFor="templateJson" className="block text-sm font-medium text-gray-700 mb-1">
          Template Data (JSON)
          <span className="ml-2 text-xs font-normal text-amber-600">Edit with care</span>
        </label>
        <textarea
          id="templateJson"
          value={templateJson}
          onChange={(e) => setTemplateJson(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {isSaving ? 'Saving…' : 'Save Template'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 hover:border-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// Default template JSON stubs shown when the user picks a report type
// Helps the user understand the expected shape without reading docs
const DEFAULT_TEMPLATE_JSON = {
  standard: JSON.stringify(
    {
      fields: [
        { name: 'Field Name', unit: 'unit', normal_male: '0 - 0', normal_female: '0 - 0' },
      ],
    },
    null,
    2
  ),
  qualitative: JSON.stringify(
    {
      fields: [
        { name: 'Field Name', options: ['Reactive', 'Non-Reactive'] },
      ],
    },
    null,
    2
  ),
  descriptive: JSON.stringify(
    {
      sections: [
        {
          heading: 'SECTION HEADING',
          fields: [
            { name: 'Field Name', type: 'dropdown', options: ['Option 1', 'Option 2'] },
            { name: 'Field Name', type: 'text', unit: 'unit' },
          ],
        },
      ],
    },
    null,
    2
  ),
  hormones: JSON.stringify(
    {
      fields: [
        { name: 'Field Name', unit: 'unit', normal_value_text: 'Normal range here' },
      ],
    },
    null,
    2
  ),
}
