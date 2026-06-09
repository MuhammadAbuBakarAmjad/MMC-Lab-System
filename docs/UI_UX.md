# UI/UX Specification

## General Principles
- Desktop-first. Primary use is on a PC at the lab. Must not break on tablet.
- Clean, minimal, clinical aesthetic. No flashy animations or decorative elements.
- Every action should take as few clicks as possible.
- Error states must be visible and clear — lab staff are not technical.
- All form inputs must have visible labels, not just placeholder text.

---

## Layout

### Sidebar (persistent, all pages except print view)
```
┌──────────────┐
│  Lab Logo /  │
│  Lab Name    │
├──────────────┤
│ 🏠 Dashboard │
│ 📋 Reports   │
│ 👤 Patients  │
│ ⚙️  Settings  │
├──────────────┤
│ + New Report │  ← primary action button, always visible
└──────────────┘
```
- Sidebar width: 220px
- On tablet (< 768px): sidebar collapses to icons only, or hamburger menu
- "New Report" button is always visible and prominent — it is the most used action

### Main Content Area
- Left margin: sidebar width (220px)
- Max content width: 1100px
- Padding: 24px

### Print View (`/reports/:id`)
- NO sidebar
- NO navigation
- Full width
- White background always (even if user has dark mode — use explicit white/black for print)

---

## Typography
- Font: System font stack (no Google Fonts — works offline)
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  ```
- Base font size: 14px for data-dense views (tables, forms)
- Headings: 18px (page title), 16px (section), 14px (table header)
- Report print font: 12px for table data, 14px for headings — keeps it compact

---

## Color Palette
Keep it simple and clinical:

```
Primary:        #2563EB  (blue — buttons, links, active states)
Primary Hover:  #1D4ED8
Success:        #16A34A  (green — Final status badge)
Warning:        #D97706  (amber — Draft status badge)
Danger:         #DC2626  (red — delete, errors)
Text Primary:   #111827
Text Secondary: #6B7280
Border:         #E5E7EB
Background:     #F9FAFB
White:          #FFFFFF
```

---

## Components

### Status Badges
```
Draft  → amber background (#FEF3C7), amber text (#92400E), rounded pill
Final  → green background (#DCFCE7), green text (#166534), rounded pill
```

### Patient/Doctor Search Dropdown
```
┌─────────────────────────────────────┐
│ 🔍 Search patient...                │
├─────────────────────────────────────┤
│ Muhammad Ali    ID: 123  03001234567 │  ← bold name, muted ID and phone
│ Ali Hassan      ID: 456  03009876543 │
│ ─────────────────────────────────── │
│ + Add New Patient                   │  ← always at bottom if no exact match
└─────────────────────────────────────┘
```
- Max height: 240px with scroll
- Keyboard navigable (arrow keys + enter)
- Selected patient shows as a chip:
  ```
  [Muhammad Ali (ID: 123)  ×]
  ```

### Test Picker
```
▶ HAEMATOLOGY (3 tests)          ← collapsed by default, click to expand
▼ LIVER FUNCTION TESTS            ← expanded
    ☑ LFT
    ☐ Bilirubin Only
▶ SEROLOGY
▶ URINE ANALYSIS
```
- Clicking a category header toggles it open/closed
- Checked tests show their result form immediately below — no need to scroll away

### Result Entry Tables
Standard result entry table styling:
```
┌─────────────────────┬──────────────┬──────────────┬──────────────────────┐
│ TEST NAME           │ RESULT       │ UNIT         │ NORMAL VALUE         │
├─────────────────────┼──────────────┼──────────────┼──────────────────────┤
│ Haemoglobin         │ [13.5      ] │ g/dl         │ M: 13.0-17.5         │
│                     │              │              │ F: 11.5-14.5         │
├─────────────────────┼──────────────┼──────────────┼──────────────────────┤
│ TLC                 │ [7.2       ] │ x10³/cmm     │ 4.0 - 11.0           │
└─────────────────────┴──────────────┴──────────────┴──────────────────────┘
```
- Result input: border on focus, no border at rest (table cell style)
- Tab key moves to next result input
- Column widths: Test Name 35% | Result 20% | Unit 15% | Normal Value 30%

### Buttons
```
Primary:    Blue fill, white text       → Save, Finalize, Search
Secondary:  White fill, border          → Cancel, Back, Edit
Danger:     Red fill, white text        → Delete (only after confirmation)
```
- All buttons: 36px height, 12px horizontal padding, rounded-md

### Form Inputs
- Height: 36px
- Border: 1px solid #E5E7EB
- Border on focus: 2px solid #2563EB
- Border radius: 6px
- Always have a visible label above the input (not just placeholder)

---

## Report Print Layout

The printed report must look professional and match what they're used to from Excel.

### Print Stylesheet Rules
```css
@media print {
  /* Hide everything that is not the report */
  .sidebar, .action-buttons, .no-print { display: none !important; }

  /* Reset margins */
  body { margin: 0; padding: 0; }
  .report-container { width: 100%; }

  /* Section page break */
  .report-section { page-break-inside: avoid; }

  /* Table header repeats on every page */
  thead { display: table-header-group; }

  /* Footer repeats on every page */
  tfoot { display: table-footer-group; }

  /* Force white background and black text regardless of browser theme */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: white !important; color: black !important; }
}
```

### Report Header (page 1 only)
```
        MASHALLAH MEDICAL COMPLEX, MULTAN         ← 16px, bold, centered
           Department of Pathology                ← 13px, centered
─────────────────────────────────────────────────
Patient Name: Muhammad Ali      Lab No: 1234
Age: 35 Years    Sex: Male      Date: 08/06/2026
Referred By: Dr. Kamran Ahmed
─────────────────────────────────────────────────
```

### Report Section
```
HAEMATOLOGY                                       ← section heading, uppercase, bold, 13px
─────────────────────────────────────────────────
TEST NAME          REPORT    UNIT      NORMAL VALUE
Haemoglobin        13.5      g/dl      M: 13.0-17.5
                                       F: 11.5-14.5
TLC                7.2       x10³/cmm  4.0 - 11.0
─────────────────────────────────────────────────
```

### Report Footer (every page)
```
─────────────────────────────────────────────────
This report is confidential...     Signature: ____
```

---

## Date Format
- Display everywhere: DD/MM/YYYY (e.g. 08/06/2026)
- Store in database: ISO format YYYY-MM-DD (PostgreSQL DATE type)
- Date picker input: use HTML `<input type="date">` — browsers handle formatting
- Display conversion: always format on the frontend before showing

---

## Responsive Breakpoints
```
Desktop  ≥ 1024px  →  full sidebar + content
Tablet   768-1023px →  icon-only sidebar (48px wide)
Mobile   < 768px   →  hamburger menu, sidebar as drawer
```
Note: Mobile is low priority. This system lives on a lab PC. But it should not be broken on mobile.

---

## Accessibility
- All inputs have associated `<label>` elements (not just placeholders)
- Buttons have descriptive text (not just icons)
- Tab order follows visual order
- Focus rings visible on all interactive elements
- Sufficient contrast: all text meets WCAG AA (4.5:1 ratio minimum)

---

## Empty States
Every list/table must have an empty state:
- Reports List (no reports): "No reports found. Create your first report."
- Patients List (no patients): "No patients yet. Create a new report to add a patient."
- Search results (no match): "No results for '[query]'. Try a different search."

---

## Loading States
- Use a simple spinner for data fetching
- Search dropdown: show "Searching..." while debounce is pending
- Save button: show "Saving..." and disable during API call to prevent double-submit

---

## Error States
- API errors: show a red banner at top of page "Something went wrong. Please try again."
- Validation errors: show inline below the relevant field in red text
- Duplicate Lab No: "Lab number [X] already exists. Please use a different number."
- Network error (server down): "Cannot connect to server. Please check the system is running."
