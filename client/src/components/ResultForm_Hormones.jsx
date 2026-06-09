import React from 'react'

// Result entry form for "hormones" report type.
// Same column layout as standard but normal value is multi-line pre-wrapped text.
// Props:
//   templateData — { fields: [{ name, unit, normal_value_text }] }
//   resultData   — { fields: [{ name, result, unit, normal_value_text }] } or null
//   onChange     — called with updated result_data whenever any field changes
export default function ResultForm_Hormones({ templateData, resultData, onChange }) {
  const fields = resultData?.fields || templateData.fields.map((field) => ({
    name:              field.name,
    result:            '',
    unit:              field.unit,
    normal_value_text: field.normal_value_text,
  }))

  function handleResultChange(fieldIndex, newValue) {
    const updatedFields = fields.map((field, index) => {
      if (index !== fieldIndex) return field
      return { ...field, result: newValue }
    })
    onChange({ fields: updatedFields })
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border border-gray-200">
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-1/3">Test Name</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-1/6">Result</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-1/8">Unit</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 w-1/3">Normal Value</th>
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
              {/* white-space: pre-line preserves the \n line breaks in normal_value_text */}
              <td className="px-3 py-1.5 text-gray-600 text-xs" style={{ whiteSpace: 'pre-line' }}>
                {field.normal_value_text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
