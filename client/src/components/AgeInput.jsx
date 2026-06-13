import React, { useState } from 'react'

// Controlled age input: a number box + Years/Months selector.
// Always produces a string like "35 Years" or "6 Months" (or '' if empty).
//
// Props:
//   value    — current age string, e.g. "35 Years" (or '' / null)
//   onChange — called with the new age string whenever either part changes
//   size     — 'sm' (default) | 'md' — controls padding/font to match surrounding form
export default function AgeInput({ value, onChange, size = 'sm' }) {
  // Parse the incoming value into a number part and a unit part
  const [number, unit] = parseAge(value)

  const [ageNumber, setAgeNumber] = useState(number)
  const [ageUnit, setAgeUnit]     = useState(unit)

  const inputClass = size === 'md'
    ? 'px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
    : 'px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500'

  function handleNumberChange(e) {
    const newNumber = e.target.value
    setAgeNumber(newNumber)
    onChange(buildAgeString(newNumber, ageUnit))
  }

  function handleUnitChange(e) {
    const newUnit = e.target.value
    setAgeUnit(newUnit)
    onChange(buildAgeString(ageNumber, newUnit))
  }

  return (
    <div className="flex">
      <input
        type="number"
        min="0"
        max="150"
        value={ageNumber}
        onChange={handleNumberChange}
        placeholder="Age"
        className={`w-20 rounded-l-md border-r-0 ${inputClass}`}
      />
      <select
        value={ageUnit}
        onChange={handleUnitChange}
        className={`rounded-r-md bg-gray-50 text-gray-700 ${inputClass}`}
      >
        <option value="Years">Years</option>
        <option value="Months">Months</option>
      </select>
    </div>
  )
}

// Returns [numberString, unitString] from a stored age like "35 Years" or "6 Months"
function parseAge(ageString) {
  if (!ageString) return ['', 'Years']
  const match = String(ageString).match(/^(\d+)\s*(Years|Months)$/i)
  if (match) return [match[1], match[2]]
  // Bare number with no unit — treat as Years (handles any remaining legacy values)
  const bareNumber = String(ageString).match(/^(\d+)$/)
  if (bareNumber) return [bareNumber[1], 'Years']
  return ['', 'Years']
}

// Combines number + unit into the canonical storage string, or '' if number is empty
function buildAgeString(number, unit) {
  const trimmed = String(number).trim()
  if (!trimmed) return ''
  return `${trimmed} ${unit}`
}
