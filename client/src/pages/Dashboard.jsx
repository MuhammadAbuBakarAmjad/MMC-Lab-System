import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboardStats, getRecentReports, getTopDoctors } from '../api/dashboard.js'
import { formatDateForDisplay } from '../utils/dates.js'

// One stat card — label on top, big number below
function StatCard({ label, value, isLoading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-5">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <div className="text-3xl font-bold text-gray-900">{value ?? '—'}</div>
      )}
    </div>
  )
}

// Status badge pill — amber for draft, green for final
function StatusBadge({ status }) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        Draft
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Final
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [stats,         setStats]         = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [topDoctors,    setTopDoctors]    = useState([])

  const [isLoadingStats,   setIsLoadingStats]   = useState(true)
  const [isLoadingRecent,  setIsLoadingRecent]  = useState(true)
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)

  const [statsError,   setStatsError]   = useState('')
  const [recentError,  setRecentError]  = useState('')
  const [doctorsError, setDoctorsError] = useState('')

  useEffect(() => {
    // Load all three sections concurrently — they are independent
    loadStats()
    loadRecentReports()
    loadTopDoctors()
  }, [])

  async function loadStats() {
    setIsLoadingStats(true)
    setStatsError('')
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      setStatsError('Could not load stats.')
    } finally {
      setIsLoadingStats(false)
    }
  }

  async function loadRecentReports() {
    setIsLoadingRecent(true)
    setRecentError('')
    try {
      const data = await getRecentReports()
      setRecentReports(data)
    } catch (error) {
      console.error('Failed to load recent reports:', error)
      setRecentError('Could not load recent reports.')
    } finally {
      setIsLoadingRecent(false)
    }
  }

  async function loadTopDoctors() {
    setIsLoadingDoctors(true)
    setDoctorsError('')
    try {
      const data = await getTopDoctors()
      setTopDoctors(data)
    } catch (error) {
      console.error('Failed to load top doctors:', error)
      setDoctorsError('Could not load top doctors.')
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* ── Stat cards ── */}
      {statsError ? (
        <p className="text-sm text-red-600 mb-6">{statsError}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Reports Today"      value={stats?.reports_today}      isLoading={isLoadingStats} />
          <StatCard label="Reports This Month" value={stats?.reports_this_month} isLoading={isLoadingStats} />
          <StatCard label="Total Patients"     value={stats?.total_patients}     isLoading={isLoadingStats} />
          <StatCard label="Total Doctors"      value={stats?.total_doctors}      isLoading={isLoadingStats} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent Reports (2/3 width) ── */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Reports</h2>

          {isLoadingRecent && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {recentError && (
            <p className="text-sm text-red-600">{recentError}</p>
          )}

          {!isLoadingRecent && !recentError && recentReports.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-md px-4 py-8 text-center text-sm text-gray-400">
              No reports yet. <Link to="/reports/new" className="text-blue-600 hover:underline">Create the first one.</Link>
            </div>
          )}

          {!isLoadingRecent && !recentError && recentReports.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Lab No</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{report.lab_no}</td>
                      <td className="px-4 py-2.5">
                        {/* Clicking patient name goes to their detail page */}
                        <Link
                          to={`/patients/${report.patient_id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {report.patient_name}
                        </Link>
                        <div className="text-xs text-gray-400">{report.patient_age} · {report.patient_gender}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                        {formatDateForDisplay(report.report_date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Top Referring Doctors (1/3 width) ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Top Referring Doctors</h2>
          <div className="text-xs text-gray-400 mb-2">This month</div>

          {isLoadingDoctors && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {doctorsError && (
            <p className="text-sm text-red-600">{doctorsError}</p>
          )}

          {!isLoadingDoctors && !doctorsError && topDoctors.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-md px-4 py-8 text-center text-sm text-gray-400">
              No referrals recorded this month.
            </div>
          )}

          {!isLoadingDoctors && !doctorsError && topDoctors.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              {topDoctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank number */}
                    <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                    <span className="text-sm text-gray-800">{doctor.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {doctor.report_count}
                    <span className="text-xs text-gray-400 font-normal ml-1">reports</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
