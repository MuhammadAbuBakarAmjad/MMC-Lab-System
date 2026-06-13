import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPatient, updatePatient, getPatientReports } from '../api/patients'
import { formatDateForDisplay } from '../utils/dates'
import AgeInput from '../components/AgeInput'

// Patient detail page — shows patient info and their full report history
export default function PatientDetail() {
  const { id } = useParams()

  const [patient, setPatient]         = useState(null)
  const [reports, setReports]         = useState([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState('')

  // Edit form state
  const [isEditing, setIsEditing]     = useState(false)
  const [isSaving, setIsSaving]       = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [editName, setEditName]       = useState('')
  const [editAge, setEditAge]         = useState('')
  const [editGender, setEditGender]   = useState('')
  const [editPhone, setEditPhone]     = useState('')

  useEffect(() => {
    loadPatientData()
  }, [id])

  async function loadPatientData() {
    setIsLoading(true)
    setError('')
    try {
      const [patientData, reportsData] = await Promise.all([
        getPatient(id),
        getPatientReports(id),
      ])
      setPatient(patientData)
      setReports(reportsData)
    } catch (err) {
      console.error('Failed to load patient data:', err)
      setError('Could not load patient information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleStartEdit() {
    setEditName(patient.name)
    setEditAge(patient.age || '')
    setEditGender(patient.gender || '')
    setEditPhone(patient.phone)
    setIsEditing(true)
    setSaveError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setSaveError('')
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    setSaveError('')

    if (!editName.trim()) {
      setSaveError('Name is required')
      return
    }
    if (!editPhone.trim()) {
      setSaveError('Phone is required')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updatePatient(id, {
        name:   editName.trim(),
        age:    editAge.trim() || null,
        gender: editGender || null,
        phone:  editPhone.trim(),
      })
      setPatient(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update patient:', err)
      setSaveError(err.message || 'Could not update patient. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!patient) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/patients" className="text-sm text-blue-600 hover:underline">
          ← Back to Patients
        </Link>
      </div>

      {/* Patient info card */}
      <div className="bg-white border border-gray-200 rounded-md p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Patient' : patient.name}
          </h1>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <AgeInput value={editAge} onChange={setEditAge} size="md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-gray-500">Patient ID</div>
            <div className="text-gray-900">{patient.id}</div>
            <div className="text-gray-500">Age</div>
            <div className="text-gray-900">{patient.age || '—'}</div>
            <div className="text-gray-500">Gender</div>
            <div className="text-gray-900">{patient.gender || '—'}</div>
            <div className="text-gray-500">Phone</div>
            <div className="text-gray-900">{patient.phone}</div>
          </div>
        )}
      </div>

      {/* Report history */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Report History</h2>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Lab No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Referred By</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Tests</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No reports yet for this patient.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{report.lab_no}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {formatDateForDisplay(report.report_date)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{report.doctor_name || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-xs">
                    {report.test_names && report.test_names[0]
                      ? report.test_names.filter(Boolean).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/reports/${report.id}`}
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
    </div>
  )
}

// Status badge — Draft = amber, Final = green
function StatusBadge({ status }) {
  if (status === 'final') {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Final
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
      Draft
    </span>
  )
}
