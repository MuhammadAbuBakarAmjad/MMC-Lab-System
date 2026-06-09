# Database Schema

## Overview
6 tables total. No more. Do not add tables without a clear reason.
Database: PostgreSQL

---

## Table: lab_settings
Stores the lab's identity. Always has exactly ONE row. Never deleted.

```sql
CREATE TABLE lab_settings (
  id           SERIAL PRIMARY KEY,
  lab_name     VARCHAR(255) NOT NULL DEFAULT 'Mashallah Medical Complex, Multan',
  address      TEXT,
  department   VARCHAR(255) DEFAULT 'Department of Pathology',
  footer_note  TEXT
);
```

Seed with one row on first run:
```sql
INSERT INTO lab_settings (lab_name, address, department, footer_note)
VALUES (
  'Mashallah Medical Complex, Multan',
  'Multan, Pakistan',
  'Department of Pathology',
  'This report is confidential and intended for the referred physician only.'
);
```

---

## Table: patients
```sql
CREATE TABLE patients (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  age          VARCHAR(50),
  gender       VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
  phone        VARCHAR(20) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_name  ON patients (name);
CREATE INDEX idx_patients_phone ON patients (phone);
```

Notes:
- `age` is VARCHAR not INTEGER because the client sometimes writes "35 Years", "6 Months", "2 Days" — store as-is
- `phone` is required — it is used as a secondary identifier when searching
- No address, no CNIC — out of scope, keep it simple

---

## Table: doctors
```sql
CREATE TABLE doctors (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_name ON doctors (name);
```

Notes:
- `phone` is optional for doctors
- "Self" / "Walk-in" should be handled by a special doctor record seeded at startup (name: "Self", id: 1), not by nullable doctor_id on reports

---

## Table: test_templates
Defines every available test. Pre-seeded from the client's Excel. Lab staff can add new ones from Settings.

```sql
CREATE TABLE test_templates (
  id             SERIAL PRIMARY KEY,
  test_name      VARCHAR(255) NOT NULL,
  category       VARCHAR(255) NOT NULL,
  report_type    VARCHAR(50)  NOT NULL CHECK (report_type IN ('standard', 'qualitative', 'descriptive', 'hormones')),
  template_data  JSONB        NOT NULL,
  display_order  INTEGER      DEFAULT 0,
  is_active      BOOLEAN      DEFAULT TRUE
);

CREATE INDEX idx_templates_category ON test_templates (category);
CREATE INDEX idx_templates_active   ON test_templates (is_active);
```

### report_type Values and Their template_data Shapes

**standard** — numeric result with unit and reference range
```json
{
  "fields": [
    {
      "name": "Haemoglobin",
      "unit": "g/dl",
      "normal_male": "13.0 - 17.5",
      "normal_female": "11.5 - 14.5"
    },
    {
      "name": "TLC",
      "unit": "x10*3/cmm",
      "normal_male": "4.0 - 11.0",
      "normal_female": "4.0 - 11.0"
    }
  ]
}
```
Rule: if normal_male === normal_female, display one value. If different, display both with M:/F: prefix.

**qualitative** — dropdown result, no unit, no range
```json
{
  "fields": [
    {
      "name": "HBsAg (Screening)",
      "options": ["Reactive", "Non-Reactive"]
    }
  ]
}
```

**descriptive** — Urine RE, Stool Analysis, Semen Analysis. Sub-sections with mixed input types.
```json
{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        { "name": "Color",      "type": "dropdown", "options": ["Light Yellow", "Yellow", "Dark Yellow", "Amber", "Red", "Brown", "Colorless"] },
        { "name": "Turbidity",  "type": "dropdown", "options": ["Nil", "Slight", "Turbid"] },
        { "name": "Sp. Gravity","type": "text",     "default": "1.025" },
        { "name": "Deposit",    "type": "dropdown", "options": ["Nil", "Present"] }
      ]
    },
    {
      "heading": "CHEMICAL EXAMINATION",
      "fields": [
        { "name": "pH",           "type": "dropdown", "options": ["Acidic", "Neutral", "Alkaline"] },
        { "name": "Sugar",        "type": "dropdown", "options": ["Nil", "Trace", "+", "++", "+++"] },
        { "name": "Protein",      "type": "dropdown", "options": ["Nil", "Trace", "+", "++", "+++"] },
        { "name": "Ketone",       "type": "dropdown", "options": ["Nil", "Present"] },
        { "name": "Urobilinogen", "type": "dropdown", "options": ["Normal", "Increased"] },
        { "name": "Bilirubin",    "type": "dropdown", "options": ["Nil", "Present"] },
        { "name": "Blood",        "type": "dropdown", "options": ["Nil", "Present"] }
      ]
    },
    {
      "heading": "MICROSCOPIC EXAMINATION",
      "fields": [
        { "name": "Pus Cells",        "type": "text", "unit": "/HPF" },
        { "name": "Red Blood Cells",  "type": "text", "unit": "/HPF" },
        { "name": "Epithelial Cells", "type": "text", "unit": "/HPF" },
        { "name": "Crystals",         "type": "text", "unit": "/HPF" },
        { "name": "Normal Casts",     "type": "text", "unit": "/LPF" },
        { "name": "Amorphous",        "type": "text", "unit": "/HPF" },
        { "name": "Organisms",        "type": "dropdown", "options": ["Nil", "Present"] }
      ]
    }
  ]
}
```

**hormones** — same as standard but normal_value is a multi-line text block, not a range
```json
{
  "fields": [
    {
      "name": "TSH",
      "unit": "uUI/ml",
      "normal_value_text": "0.25 – 5.0"
    },
    {
      "name": "FSH",
      "unit": "mlU/ml",
      "normal_value_text": "M: 1.7-12.0\nFollicular phase: 3.9-12.0\nLuteal phase: 1.5-7.0\nMenopause: 17.0-95.0"
    }
  ]
}
```

---

## Table: reports
One row per lab report issued.

```sql
CREATE TABLE reports (
  id           SERIAL PRIMARY KEY,
  lab_no       VARCHAR(50) NOT NULL UNIQUE,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  doctor_id    INTEGER REFERENCES doctors(id),
  report_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status       VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_lab_no     ON reports (lab_no);
CREATE INDEX idx_reports_patient_id ON reports (patient_id);
CREATE INDEX idx_reports_doctor_id  ON reports (doctor_id);
CREATE INDEX idx_reports_date       ON reports (report_date);
```

Notes:
- `lab_no` is a string, not auto-increment integer, because the client assigns it sequentially but may want to prefix it (e.g. "2026-001"). Keep it flexible.
- `status` draft = still being filled in, final = locked and printable
- When a report is finalized, do not allow editing of results

---

## Table: report_results
Stores the actual filled-in results for each test in a report.

```sql
CREATE TABLE report_results (
  id            SERIAL PRIMARY KEY,
  report_id     INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  template_id   INTEGER NOT NULL REFERENCES test_templates(id),
  result_data   JSONB   NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_results_report_id ON report_results (report_id);
```

### result_data Shapes Per report_type

**standard**
```json
{
  "fields": [
    { "name": "Haemoglobin", "result": "13.5", "unit": "g/dl", "normal_male": "13.0 - 17.5", "normal_female": "11.5 - 14.5" },
    { "name": "TLC",         "result": "7.2",  "unit": "x10*3/cmm", "normal_male": "4.0 - 11.0", "normal_female": "4.0 - 11.0" }
  ]
}
```

**qualitative**
```json
{
  "fields": [
    { "name": "HBsAg (Screening)", "result": "Non-Reactive" }
  ]
}
```

**descriptive**
```json
{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        { "name": "Color",     "result": "Light Yellow" },
        { "name": "Turbidity", "result": "Nil" }
      ]
    },
    {
      "heading": "CHEMICAL EXAMINATION",
      "fields": [
        { "name": "pH",    "result": "Acidic" },
        { "name": "Sugar", "result": "Nil" }
      ]
    }
  ]
}
```

**hormones**
```json
{
  "fields": [
    { "name": "TSH", "result": "2.5", "unit": "uUI/ml", "normal_value_text": "0.25 – 5.0" }
  ]
}
```

---

## Indexes Summary
```sql
-- patients
CREATE INDEX idx_patients_name  ON patients (name);
CREATE INDEX idx_patients_phone ON patients (phone);

-- doctors
CREATE INDEX idx_doctors_name ON doctors (name);

-- test_templates
CREATE INDEX idx_templates_category ON test_templates (category);
CREATE INDEX idx_templates_active   ON test_templates (is_active);

-- reports
CREATE INDEX idx_reports_lab_no     ON reports (lab_no);
CREATE INDEX idx_reports_patient_id ON reports (patient_id);
CREATE INDEX idx_reports_doctor_id  ON reports (doctor_id);
CREATE INDEX idx_reports_date       ON reports (report_date);

-- report_results
CREATE INDEX idx_results_report_id ON report_results (report_id);
```

---

## Key Rules for the Agent
1. Never store files or images in the database. Paths only if ever needed.
2. All JSON columns use JSONB (not JSON) — PostgreSQL indexes JSONB efficiently.
3. ON DELETE CASCADE on report_results — deleting a report deletes its results.
4. The lab_settings table always has exactly one row. Seed it on first run. The settings page updates that row, never inserts a new one.
5. lab_no is assigned by the system auto-incrementing from the last used number, but stored as VARCHAR for flexibility.
6. "Self" doctor must be seeded with id=1 on first run for walk-in patients.
