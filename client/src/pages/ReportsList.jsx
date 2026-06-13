import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getReports, deleteReport } from '../api/reports'
import { getAllDoctors } from '../api/doctors'
import { formatDateForDisplay } from '../utils/dates'

// Debounce helper — delays calling fn until the user stops typing for `delay` ms
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Status badge: amber for draft, green for final
function StatusBadge({ status }) {
  if (status === 'final') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Final
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      Draft
    </span>
  );
}

// Confirmation dialog for delete action
function DeleteConfirmDialog({ reportLabNo, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Report</h3>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete report <span className="font-bold">#{reportLabNo}</span>?
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsList() {
  const navigate = useNavigate();

  // Filter state
  const [searchText, setSearchText]   = useState('');
  const [searchBy, setSearchBy]       = useState('name'); // 'name' | 'phone' | 'lab_no'
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus]     = useState('');
  const [currentPage, setCurrentPage]           = useState(1);

  // Data state
  const [reports, setReports]           = useState([]);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const [doctors, setDoctors]           = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Delete dialog state
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting]         = useState(false);

  // Debounce search so we don't fire on every keystroke
  const debouncedSearch = useDebounce(searchText, 300);

  // Load doctors once on mount for the filter dropdown
  useEffect(() => {
    loadDoctors();
  }, []);

  // Reload reports whenever any filter or page changes
  useEffect(() => {
    loadReports();
  }, [debouncedSearch, searchBy, fromDate, toDate, selectedDoctorId, selectedStatus, currentPage]);

  // Reset to page 1 whenever filters change (not pagination itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, searchBy, fromDate, toDate, selectedDoctorId, selectedStatus]);

  async function loadDoctors() {
    try {
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load doctors for filter:', error);
      // Non-critical — filter just won't have doctor options
    }
  }

  async function loadReports() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await getReports({
        q:         debouncedSearch,
        search_by: searchBy,
        from:      fromDate,
        to:        toDate,
        doctor_id: selectedDoctorId,
        status:    selectedStatus,
        page:      currentPage,
        limit:     20,
      });
      setReports(data.reports || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setErrorMessage('Could not load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteClick(report) {
    setReportToDelete(report);
  }

  async function handleDeleteConfirm() {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      await deleteReport(reportToDelete.id);
      setReportToDelete(null);
      loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      setErrorMessage('Could not delete the report. Please try again.');
      setReportToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleClearFilters() {
    setSearchText('');
    setSearchBy('name');
    setFromDate('');
    setToDate('');
    setSelectedDoctorId('');
    setSelectedStatus('');
    setCurrentPage(1);
  }

  const hasActiveFilters = searchText || fromDate || toDate || selectedDoctorId || selectedStatus;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
        <Link
          to="/reports/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          + New Report
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Search input with mode selector */}
          <div className="col-span-2 md:col-span-2">
            <label htmlFor="search-reports" className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="flex">
              {/* Mode selector — attached to the left of the input */}
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 border-r-0 rounded-l-md bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
              >
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="lab_no">Lab No</option>
              </select>
              <input
                id="search-reports"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={
                  searchBy === 'phone'  ? 'Search by phone number...' :
                  searchBy === 'lab_no' ? 'Search by lab number...'   :
                  'Search by patient name...'
                }
                className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Doctor filter */}
          <div>
            <label htmlFor="filter-doctor" className="block text-xs font-medium text-gray-700 mb-1">
              Doctor
            </label>
            <select
              id="filter-doctor"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label htmlFor="filter-from" className="block text-xs font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="filter-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="filter-to" className="block text-xs font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              id="filter-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Results table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">
              {hasActiveFilters ? 'No reports match your filters.' : 'No reports yet.'}
            </p>
            {!hasActiveFilters && (
              <Link to="/reports/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Create the first report →
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Lab No</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Patient Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Age</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Gender</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Referred By</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{report.lab_no}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/patients/${report.patient_id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {report.patient_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{report.patient_age || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{report.patient_gender || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{report.doctor_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{formatDateForDisplay(report.report_date)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/reports/${report.id}`}
                          className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                        >
                          View
                        </Link>
                        {report.status === 'draft' && (
                          <Link
                            to={`/reports/${report.id}/edit`}
                            className="text-xs px-2.5 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium"
                          >
                            Edit
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteClick(report)}
                          className="text-xs px-2.5 py-1 border border-red-200 hover:bg-red-50 text-red-600 rounded font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500">
                Showing {reports.length} of {totalCount} reports
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {reportToDelete && (
        <DeleteConfirmDialog
          reportLabNo={reportToDelete.lab_no}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setReportToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
