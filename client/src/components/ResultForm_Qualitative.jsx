import React from 'react'

// Result entry form for "qualitative" report type.
// Renders a table where each row has a Test Name and a dropdown of options.
// Props:
//   templateData — { fields: [{ name, options: [...] }] }
//   resultData   — { fields: [{ name, result }] } or null
//   onChange     — called with updated result_data whenever a dropdown changes
export default function ResultForm_Qualitative({ templateData, resultData, onChange }) {
  const fields = resultData?.fields || templateData.fields.map((field) => ({
    name:   field.name,
    result: '',
  }))

  function handleResultChange(fieldIndex, newValue) {
    const updatedFields = fields.map((field, index) => {
      if (index !== fieldIndex) return field
      return { ...field, result: newValue }
    })
    onChange({ fields: updatedFields })
  }

  function getOptionsForField(fieldIndex) {
    return templateData.fields[fieldIndex]?.options || []
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border border-gray-200">
            <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200 w-2/3">Test Name</th>
            <th className="text-left px-3 py-2 font-medium text-gray-700 w-1/3">Result</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.name} className="border border-gray-200 hover:bg-gray-50">
              <td className="px-3 py-1.5 border-r border-gray-200 text-gray-800">{field.name}</td>
              <td className="px-2 py-1">
                <select
                  value={field.result}
                  onChange={(e) => handleResultChange(index, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select --</option>
                  {getOptionsForField(index).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
