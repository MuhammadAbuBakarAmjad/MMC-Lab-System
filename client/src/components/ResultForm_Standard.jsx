import React from 'react'

// Result entry form for "standard" report type.
// Renders a table with Test Name | Result (number input) | Unit | Normal Value.
// Tab key naturally moves through inputs in DOM order.
// Props:
//   templateData — the template's template_data object: { fields: [...] }
//   resultData   — current result state: { fields: [...] } — or null on first render
//   onChange     — called with updated result_data whenever any field changes
export default function ResultForm_Standard({ templateData, resultData, onChange }) {
  // Build initial fields from template if resultData not yet set
  const fields = resultData?.fields || templateData.fields.map((field) => ({
    name:          field.name,
    result:        '',
    unit:          field.unit,
    normal_male:   field.normal_male,
    normal_female: field.normal_female,
  }))

  function handleResultChange(fieldIndex, newValue) {
    const updatedFields = fields.map((field, index) => {
      if (index !== fieldIndex) return field
      return { ...field, result: newValue }
    })
    onChange({ fields: updatedFields })
  }

  function formatNormalValue(field) {
    if (field.normal_male === field.normal_female) {
      return field.normal_male || ''
    }
    return `M: ${field.normal_male || '-'}\nF: ${field.normal_female || '-'}`
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border border-gray-200">
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-2/5">Test Name</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-1/6">Result</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-1/6">Unit</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 w-1/4">Normal Value</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.name} className="border border-gray-200 hover:bg-gray-50">
              <td className="px-3 py-1.5 border-r border-gray-200 text-gray-800">{field.name}</td>
              <td className="px-2 py-1 border-r border-gray-200">
                <input
                  type="number"
                  step="any"
                  value={field.result}
                  onChange={(e) => handleResultChange(index, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="px-3 py-1.5 border-r border-gray-200 text-gray-600 text-xs">{field.unit}</td>
              <td className="px-3 py-1.5 text-gray-600 text-xs whitespace-pre-line">{formatNormalValue(field)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
