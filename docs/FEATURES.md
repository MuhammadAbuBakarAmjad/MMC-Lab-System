# Features Specification

## Application Pages

The app has 5 pages. A persistent sidebar handles navigation.

```
/dashboard        → Dashboard
/reports          → Reports List
/reports/new      → Create New Report
/reports/:id      → View Report
/reports/:id/edit → Edit Report (draft only)
/patients         → Patients List
/patients/:id     → Patient Detail (their report history)
/settings         → Settings
```

---

## Page 1: Dashboard (`/dashboard`)

### Purpose
Quick overview when the lab opens in the morning.

### Content
- **Stat cards (top row):**
  - Reports Today
  - Reports This Month
  - Total Patients
  - Total Doctors

- **Recent Reports table:**
  - Columns: Lab No | Patient Name | Age | Gender | Doctor | Date | Status | Action
  - Shows last 10 reports
  - Each row has a "View" button linking to /reports/:id
  - Status badge: Draft (yellow) / Final (green)

- **Top Referring Doctors (this month):**
  - Simple ranked list: Doctor Name → number of reports
  - Top 5 only

### Behaviour
- All data loads on page mount
- No filters on dashboard — keep it simple
- Clicking a patient name anywhere navigates to /patients/:id

---

## Page 2: Reports List (`/reports`)

### Purpose
Find any report by any detail.

### Filters (all optional, combinable)
- Search text input → searches lab_no, patient name, patient phone simultaneously
- Date range → from date / to date (default: current month)
- Doctor dropdown → filter by referring doctor
- Status dropdown → All / Draft / Final

### Table Columns
Lab No | Patient Name | Age | Gender | Referred By | Date | Status | Actions

### Actions per row
- View → /reports/:id
- Edit → /reports/:id/edit (only shown if status = draft)
- Delete → confirmation dialog, hard delete

### Pagination
- 20 rows per page
- Simple prev/next pagination

### Performance Note
All filter queries must use indexed columns only (lab_no, patient name, report_date, doctor_id). Do not do full table scans.

---

## Page 3: Create New Report (`/reports/new`)

This is the most important and most complex page. Read carefully.

### Step 1: Patient Selection
- A search box at the top: "Search patient by name, ID, or phone"
- As the user types (debounced 300ms), show a dropdown of matching patients
- Each result in the dropdown shows: **Name** | ID: 123 | Phone: 03xx-xxxxxxx
- Showing all three lets the user confirm they picked the right person
- If patient not found: show "Add New Patient" option in the dropdown
- Clicking "Add New Patient" opens an inline form (not a separate page):
  - Name (required)
  - Age (text field, e.g. "35 Years")
  - Gender (dropdown: Male / Female / Other)
  - Phone (required)
  - Save button → creates patient, auto-selects them

### Step 2: Doctor Selection
- Same search-as-you-type pattern as patient
- Each result shows: **Name** | Phone (if exists)
- "Self" is always the first option (pre-seeded)
- If not found: "Add New Doctor" inline form:
  - Name (required)
  - Phone (optional)

### Step 3: Report Details
- Report Date: date picker, defaults to today
- Lab No: auto-generated (last lab_no + 1), but editable by the user
- Lab No must be unique — validate before saving, show error if duplicate

### Step 4: Test Selection
- Heading: "Select Tests"
- Tests are grouped by category in collapsible sections
- Each category shows as a section header (e.g. HAEMATOLOGY) with an expand/collapse toggle
- All categories are collapsed by default
- Inside each category: a checkbox list of test names
- Checking a test immediately renders its result entry form below the checkbox

### Step 5: Result Entry (inline, per test)
Each checked test shows its result entry form immediately below its checkbox. Form appearance depends on report_type:

**standard:**
```
[Test Group Name]
┌─────────────────┬──────────┬──────────┬─────────────────────┐
│ Test Name       │ Result   │ Unit     │ Normal Value        │
├─────────────────┼──────────┼──────────┼─────────────────────┤
│ Haemoglobin     │ [      ] │ g/dl     │ M:13-17.5 F:11.5-14.5│
│ TLC             │ [      ] │ x10³/cmm │ 4.0 - 11.0          │
└─────────────────┴──────────┴──────────┴─────────────────────┘
```
- Result column: number input
- Unit column: static text (from template)
- Normal Value: static text (from template, shows both M/F if different)

**qualitative:**
```
│ HBsAg (Screening) │ [Reactive ▼] │ - │ - │
```
- Result column: dropdown with options from template

**descriptive (Urine RE, Stool):**
```
PHYSICAL EXAMINATION
│ Color     │ [Light Yellow ▼] │
│ Turbidity │ [Nil ▼]          │
│ Sp.Gravity│ [1.025          ]│

CHEMICAL EXAMINATION
│ pH        │ [Acidic ▼]       │
│ Sugar     │ [Nil ▼]          │

MICROSCOPIC EXAMINATION
│ Pus Cells       │ [   ] /HPF │
│ Red Blood Cells │ [   ] /HPF │
```

**hormones:**
```
│ TSH  │ [      ] │ uUI/ml │ 0.25 – 5.0           │
│ FSH  │ [      ] │ mlU/ml │ (full multi-line text)│
```

### Step 6: Save
- "Save as Draft" button — saves, stays on page for continued editing
- "Finalize Report" button — saves with status=final, redirects to /reports/:id (view page)
- Validation before save:
  - Patient must be selected
  - At least one test must be selected
  - Lab No must be filled and unique
  - No other required validation — results can be empty (they may enter results later)

---

## Page 4: View Report (`/reports/:id`)

### Purpose
The print-ready report view. This is what gets printed or saved as PDF.

### Layout
The report renders exactly as it would print. No sidebar visible in this view. Full width.

```
┌─────────────────────────────────────────────────────┐
│           MASHALLAH MEDICAL COMPLEX, MULTAN          │
│               Department of Pathology                │
├──────────────────────────────────────────────────────┤
│ Patient: [Name]          Lab No: [lab_no]            │
│ Age: [age]  Sex: [gender]  Date: [DD/MM/YYYY]        │
│ Referred By: Dr. [doctor name]                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [SECTION HEADING — e.g. HAEMATOLOGY]                │
│  ┌───────────────┬────────┬──────────┬─────────────┐ │
│  │ TEST NAME     │ REPORT │ UNIT     │ NORMAL VALUE│ │
│  ├───────────────┼────────┼──────────┼─────────────┤ │
│  │ Haemoglobin   │ 13.5   │ g/dl     │ M:13-17.5   │ │
│  │               │        │          │ F:11.5-14.5 │ │
│  └───────────────┴────────┴──────────┴─────────────┘ │
│                                                      │
│  [NEXT SECTION — e.g. LIVER FUNCTION TESTS]          │
│  ...                                                 │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [footer_note from lab_settings]                      │
│                                           Signature: │
│                                           __________ │
└─────────────────────────────────────────────────────┘
```

### Section Grouping Logic
- Tests are grouped by their `category` field from test_templates
- Category heading rendered in uppercase, bold
- Within a category, tests rendered in display_order
- Categories rendered in the order their first test appears in display_order

### Normal Value Display Rule
- If normal_male === normal_female: show single value
- If different: show "M: [value]" on first line, "F: [value]" on second line
- For hormones: show the full normal_value_text as-is (may be multi-line)
- For qualitative: normal value column is blank

### Multi-Page Print Rules (CSS)
```css
@media print {
  .no-print { display: none; }
  .report-section { page-break-inside: avoid; }
  thead { display: table-header-group; } /* repeats on each page */
  tfoot { display: table-footer-group; } /* repeats on each page */
}
```
- Each section has page-break-inside: avoid
- Header (lab name, patient info) is NOT repeated on subsequent pages — it only appears on page 1
- Footer (footer_note + signature) repeats on every page via tfoot

### Action Buttons (screen only, hidden on print)
- Top right of page:
  - "Edit" button → only visible if status = draft → navigates to /reports/:id/edit
  - "Print / Save PDF" button → calls window.print()
  - "Back to Reports" link

---

## Page 5: Patient Detail (`/patients/:id`)

### Content
- Patient info card at top: Name, Age, Gender, Phone, Patient ID
- "Edit" button for updating patient details
- Complete report history table:
  - Columns: Lab No | Date | Referred By | Tests (comma-separated test names) | Status | View
  - Sorted newest first
- No pagination needed — patients rarely have more than 20-30 reports

---

## Page 6: Settings (`/settings`)

### Sections

**Lab Information**
- Lab Name (text input)
- Address (textarea)
- Department (text input)
- Footer Note (textarea)
- Save button → updates the single lab_settings row

**Test Templates**
- Table of all templates: Test Name | Category | Type | Active | Edit
- Toggle active/inactive (inactive tests don't appear in test picker)
- "Add New Template" button → opens a form:
  - Test Name
  - Category (dropdown of existing categories + "New Category" option)
  - Report Type (dropdown: standard / qualitative / descriptive / hormones)
  - Template Data: a dynamic form builder based on selected report type
  - Save

Note: editing existing template_data is for advanced use. Keep the edit form simple — name, category, active toggle are the main editable fields. Full template_data editing is a raw JSON textarea for now.

---

## Patient Search — Detailed Behaviour
Used on: New Report page, Reports List filter

1. User starts typing in search box
2. After 300ms debounce, fire GET /api/patients/search?q={query}
3. Backend searches: name ILIKE '%query%' OR phone LIKE '%query%' OR id = query (if numeric)
4. Return max 10 results
5. Each result displayed as: **Full Name** (ID: 123) — 03xx-xxxxxxx
6. User clicks result → patient selected, search box replaced by patient name chip with an X to deselect
7. If no results: show "No patient found — Add New Patient"

---

## Lab Number Auto-Generation
- On page load of /reports/new, fetch GET /api/reports/next-lab-no
- Backend queries: SELECT MAX(CAST(lab_no AS INTEGER)) FROM reports
- Returns max + 1 as string
- Pre-fills the Lab No field
- User can override — it's just a default
- On save, validate uniqueness server-side

---

## Key Rules for the Agent
1. Patient search dropdown must show all three identifiers (name, ID, phone) so staff can confirm correct patient
2. Never navigate away when saving as draft — stay on the create/edit page
3. Print view must have zero UI chrome — no sidebar, no buttons visible when printing
4. All dates display as DD/MM/YYYY throughout the app
5. "Self" / walk-in is a real doctor record, not a null value
6. Finalized reports cannot be edited — the Edit button must not appear for final reports
7. Debounce all search inputs at 300ms — do not fire API on every keystroke
