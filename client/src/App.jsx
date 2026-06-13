import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'

// Lazy-load all pages so each page's code only loads when visited
const Dashboard     = lazy(() => import('./pages/Dashboard.jsx'))
const ReportsList   = lazy(() => import('./pages/ReportsList.jsx'))
const NewReport     = lazy(() => import('./pages/NewReport.jsx'))
const EditReport    = lazy(() => import('./pages/EditReport.jsx'))
const ViewReport    = lazy(() => import('./pages/ViewReport.jsx'))
const Patients      = lazy(() => import('./pages/Patients.jsx'))
const PatientDetail = lazy(() => import('./pages/PatientDetail.jsx'))
const Settings      = lazy(() => import('./pages/Settings.jsx'))

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Pages with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/reports"           element={<ReportsList />} />
          <Route path="/reports/new"       element={<NewReport />} />
          <Route path="/patients"           element={<Patients />} />
          <Route path="/patients/:id"      element={<PatientDetail />} />
          <Route path="/settings"          element={<Settings />} />
        </Route>

        {/* Report view and edit are full-width (no sidebar on print) */}
        <Route path="/reports/:id"      element={<ViewReport />} />
        <Route path="/reports/:id/edit" element={<EditReport />} />
      </Routes>
    </Suspense>
  )
}
