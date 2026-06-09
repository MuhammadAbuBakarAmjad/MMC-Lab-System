import React from 'react'

// Result entry form for "descriptive" report type (e.g. Urine R/E, Stool Analysis).
// Renders each section as a sub-heading, with fields as dropdown or text inputs.
// Props:
//   templateData — { sections: [{ heading, fields: [{ name, type, options?, unit?, default? }] }] }
//   resultData   — { sections: [{ heading, fields: [{ name, result }] }] } or null
//   onChange     — called with updated result_data whenever any field changes
export default function ResultForm_Descriptive({ templateData, resultData, onChange }) {
  // Build initial sections from template if resultData not yet set
  const sections = resultData?.sections || templateData.sections.map((section) => ({
    heading: section.heading,
    fields:  section.fields.map((field) => ({
      name:   field.name,
      result: field.default || '',
    })),
  }))

  function handleFieldChange(sectionIndex, fieldIndex, newValue) {
    const updatedSections = sections.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section
      return {
        ...section,
        fields: section.fields.map((field, fIdx) => {
          if (fIdx !== fieldIndex) return field
          return { ...field, result: newValue }
        }),
      }
    })
    onChange({ sections: updatedSections })
  }

  function getTemplateField(sectionIndex, fieldIndex) {
    return templateData.sections[sectionIndex]?.fields[fieldIndex] || {}
  }

  function renderFieldInput(sectionIndex, fieldIndex, field) {
    const templateField = getTemplateField(sectionIndex, fieldIndex)

    if (templateField.type === 'dropdown') {
      return (
        <select
          value={field.result}
          onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select --</option>
          {(templateField.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )
    }

    // type === "text" (default)
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={field.result}
          onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {templateField.unit && (
          <span className="text-xs text-gray-500 whitespace-nowrap">{templateField.unit}</span>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-3">
      {sections.map((section, sectionIndex) => (
        <div key={section.heading} className="border border-gray-200 rounded">
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {section.heading}
            </span>
          </div>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {section.fields.map((field, fieldIndex) => (
                <tr key={field.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-800 w-2/5 border-r border-gray-100">{field.name}</td>
                  <td className="px-2 py-1 w-3/5">
                    {renderFieldInput(sectionIndex, fieldIndex, field)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
