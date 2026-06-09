import React, { useState, useEffect, useRef } from 'react'
import { searchDoctors, createDoctor } from '../api/doctors'

// Reusable doctor search component with inline "Add New" form.
// "Self" doctor always appears first in results.
// Props:
//   selectedDoctor — currently selected doctor object (or null)
//   onDoctorSelect — called with doctor object when user selects one
//   onDoctorClear  — called when user removes the selected doctor
export default function DoctorSearch({ selectedDoctor, onDoctorSelect, onDoctorClear }) {
  const [searchText, setSearchText]         = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSearching, setIsSearching]       = useState(false)
  const [showAddForm, setShowAddForm]       = useState(false)
  const [isSaving, setIsSaving]             = useState(false)
  const [saveError, setSaveError]           = useState('')

  // New doctor form state
  const [newName, setNewName]   = useState('')
  const [newPhone, setNewPhone] = useState('')

  const debounceTimer = useRef(null)
  const dropdownRef   = useRef(null)

  // Load "Self" as default option on mount so clicking the field shows it immediately
  useEffect(() => {
    loadInitialResults()
  }, [])

  async function loadInitialResults() {
    try {
      const results = await searchDoctors('')
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to load initial doctors:', error)
    }
  }

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

  function handleSearchInput(event) {
    const value = event.target.value
    setSearchText(value)

    clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchDoctors(value.trim())
        setSearchResults(results)
        setIsDropdownOpen(true)
      } catch (error) {
        console.error('Failed to search doctors:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  function handleFocus() {
    if (searchResults.length > 0) {
      setIsDropdownOpen(true)
    }
  }

  function handleSelectDoctor(doctor) {
    onDoctorSelect(doctor)
    setSearchText('')
    setIsDropdownOpen(false)
    setShowAddForm(false)
  }

  function handleShowAddForm() {
    setShowAddForm(true)
    setIsDropdownOpen(false)
    setNewName(searchText)
  }

  function handleCancelAdd() {
    setShowAddForm(false)
    setSaveError('')
    setNewName('')
    setNewPhone('')
  }

  async function handleSubmitNewDoctor(event) {
    event.preventDefault()
    setSaveError('')

    if (!newName.trim()) {
      setSaveError('Doctor name is required')
      return
    }

    setIsSaving(true)
    try {
      const doctor = await createDoctor({
        name:  newName.trim(),
        phone: newPhone.trim() || null,
      })
      handleSelectDoctor(doctor)
      handleCancelAdd()
    } catch (error) {
      console.error('Failed to create doctor:', error)
      setSaveError(error.message || 'Could not save doctor. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // If a doctor is already selected, show a chip
  if (selectedDoctor) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 font-medium">
          {selectedDoctor.name}
          <button
            type="button"
            onClick={onDoctorClear}
            className="ml-1 text-blue-400 hover:text-blue-700 font-bold leading-none"
            aria-label="Remove selected doctor"
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
          onFocus={handleFocus}
          placeholder="Search by doctor name"
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
            <div className="px-3 py-2 text-sm text-gray-500">No doctors found</div>
          ) : (
            searchResults.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => handleSelectDoctor(doctor)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-sm text-gray-900">{doctor.name}</span>
                {doctor.phone && (
                  <span className="text-xs text-gray-500 ml-2">{doctor.phone}</span>
                )}
                {doctor.id === 1 && (
                  <span className="text-xs text-gray-400 ml-2">(walk-in)</span>
                )}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleShowAddForm}
            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 font-medium"
          >
            + Add New Doctor
          </button>
        </div>
      )}

      {/* Inline add new doctor form */}
      {showAddForm && (
        <div className="mt-2 p-4 border border-blue-200 rounded-md bg-blue-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Add New Doctor</h4>
          {saveError && (
            <p className="text-xs text-red-600 mb-2">{saveError}</p>
          )}
          <form onSubmit={handleSubmitNewDoctor} className="space-y-2">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save Doctor'}
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
