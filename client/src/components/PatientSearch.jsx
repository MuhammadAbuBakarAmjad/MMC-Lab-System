import React, { useState, useEffect, useRef } from 'react'
import { searchPatients, createPatient } from '../api/patients'

// Reusable patient search component with inline "Add New" form.
// Used on New Report page and anywhere a patient must be selected.
// Props:
//   selectedPatient — currently selected patient object (or null)
//   onPatientSelect — called with patient object when user selects one
//   onPatientClear  — called when user removes the selected patient
export default function PatientSearch({ selectedPatient, onPatientSelect, onPatientClear }) {
  const [searchText, setSearchText]       = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSearching, setIsSearching]     = useState(false)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [isSaving, setIsSaving]           = useState(false)
  const [saveError, setSaveError]         = useState('')

  // New patient form state
  const [newName, setNewName]     = useState('')
  const [newAge, setNewAge]       = useState('')
  const [newGender, setNewGender] = useState('')
  const [newPhone, setNewPhone]   = useState('')

  const debounceTimer = useRef(null)
  const dropdownRef   = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search — fires 300ms after the user stops typing
  function handleSearchInput(event) {
    const value = event.target.value
    setSearchText(value)

    clearTimeout(debounceTimer.current)

    if (value.trim().length < 2) {
      setSearchResults([])
      setIsDropdownOpen(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchPatients(value.trim())
        setSearchResults(results)
        setIsDropdownOpen(true)
      } catch (error) {
        console.error('Failed to search patients:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  function handleSelectPatient(patient) {
    onPatientSelect(patient)
    setSearchText('')
    setSearchResults([])
    setIsDropdownOpen(false)
    setShowAddForm(false)
  }

  function handleShowAddForm() {
    setShowAddForm(true)
    setIsDropdownOpen(false)
    // Pre-fill name from whatever they searched
    setNewName(searchText)
  }

  function handleCancelAdd() {
    setShowAddForm(false)
    setSaveError('')
    setNewName('')
    setNewAge('')
    setNewGender('')
    setNewPhone('')
  }

  async function handleSubmitNewPatient(event) {
    event.preventDefault()
    setSaveError('')

    if (!newName.trim()) {
      setSaveError('Name is required')
      return
    }
    if (!newPhone.trim()) {
      setSaveError('Phone is required')
      return
    }

    setIsSaving(true)
    try {
      const patient = await createPatient({
        name:   newName.trim(),
        age:    newAge.trim() || null,
        gender: newGender || null,
        phone:  newPhone.trim(),
      })
      handleSelectPatient(patient)
      handleCancelAdd()
    } catch (error) {
      console.error('Failed to create patient:', error)
      setSaveError(error.message || 'Could not save patient. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // If a patient is already selected, show a chip instead of the search input
  if (selectedPatient) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 font-medium">
          {selectedPatient.name}
          <span className="text-blue-500 font-normal text-xs">ID: {selectedPatient.id}</span>
          <button
            type="button"
            onClick={onPatientClear}
            className="ml-1 text-blue-400 hover:text-blue-700 font-bold leading-none"
            aria-label="Remove selected patient"
          >
            ×
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchText}
          onChange={handleSearchInput}
          placeholder="Search by name, phone, or ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No patients found</div>
          ) : (
            searchResults.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelectPatient(patient)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-sm text-gray-900">{patient.name}</span>
                <span className="text-xs text-gray-500 ml-2">ID: {patient.id} — {patient.phone}</span>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleShowAddForm}
            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 font-medium"
          >
            + Add New Patient
          </button>
        </div>
      )}

      {/* Inline add new patient form */}
      {showAddForm && (
        <div className="mt-2 p-4 border border-blue-200 rounded-md bg-blue-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Add New Patient</h4>
          {saveError && (
            <p className="text-xs text-red-600 mb-2">{saveError}</p>
          )}
          <form onSubmit={handleSubmitNewPatient} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="text"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="e.g. 35 Years"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save Patient'}
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
