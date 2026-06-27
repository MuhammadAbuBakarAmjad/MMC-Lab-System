import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { searchPatients } from '../api/patients'

// Patients list page — search and browse all patients
export default function Patients() {
  const [patients, setPatients]     = useState([])
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy]     = useState('name') // 'name' | 'phone' | 'id' | 'cnic' | 'father'
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState('')

  const debounceTimer = useRef(null)

  // Load all patients on mount
  useEffect(() => {
    loadPatients('', 'name')
  }, [])

  async function loadPatients(query, mode) {
    setIsLoading(true)
    setError('')
    try {
      const results = await searchPatients(query, mode)
      setPatients(results)
    } catch (err) {
      console.error('Failed to load patients:', err)
      setError('Could not load patients. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearchInput(event) {
    const value = event.target.value
    setSearchText(value)

    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      loadPatients(value.trim(), searchBy)
    }, 300)
  }

  function handleSearchByChange(event) {
    const newMode = event.target.value
    setSearchBy(newMode)
    // Re-run search immediately with the new mode
    clearTimeout(debounceTimer.current)
    loadPatients(searchText.trim(), newMode)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
      </div>

      {/* Search bar with mode selector */}
      <div className="mb-4">
        <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Patients
        </label>
        <div className="flex max-w-md">
          <select
            value={searchBy}
            onChange={handleSearchByChange}
            className="px-2 py-2 text-sm border border-gray-300 border-r-0 rounded-l-md bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
          >
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="id">ID</option>
            <option value="father">F/H Name</option>
            <option value="cnic">CNIC</option>
          </select>
          <input
            id="patient-search"
            type="text"
            value={searchText}
            onChange={handleSearchInput}
            placeholder={
              searchBy === 'phone'  ? 'Search by phone number...'       :
              searchBy === 'id'     ? 'Search by patient ID...'         :
              searchBy === 'cnic'   ? 'Search by CNIC...'               :
              searchBy === 'father' ? 'Search by father/husband name...' :
              'Search by patient name...'
            }
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Age</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Gender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Reports</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchText ? 'No patients match your search.' : 'No patients yet. Search above to find or add patients.'}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500">{patient.id}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {patient.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{patient.age || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{patient.gender || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{patient.phone}</td>
                    <td className="px-4 py-2.5 text-gray-600">{patient.report_count ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
