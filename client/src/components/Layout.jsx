import React from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'

// Nav item — highlights when active, uses NavLink for automatic active class
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Lab name header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="text-sm font-bold text-gray-900 leading-tight">Mashallah Medical Complex</div>
          <div className="text-xs text-gray-500 mt-0.5">Lab Report System</div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/reports"   label="Reports" />
          <NavItem to="/patients"  label="Patients" />
          <NavItem to="/settings"  label="Settings" />
        </nav>

        {/* New Report — primary action, always visible */}
        <div className="px-3 py-4 border-t border-gray-200">
          <Link
            to="/reports/new"
            className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            + New Report
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 p-6 max-w-[1100px]">
        <Outlet />
      </main>
    </div>
  )
}
