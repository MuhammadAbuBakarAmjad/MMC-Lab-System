-- Mashallah Medical Complex Lab System — Database Schema
-- Run via: node server/db/init.js

-- Drop tables in reverse dependency order to avoid FK errors
DROP TABLE IF EXISTS report_results CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS test_templates CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS lab_settings CASCADE;

-- Lab identity — always exactly ONE row
CREATE TABLE lab_settings (
  id           SERIAL PRIMARY KEY,
  lab_name     VARCHAR(255) NOT NULL DEFAULT 'Mashallah Medical Complex, Multan',
  address      TEXT,
  department   VARCHAR(255) DEFAULT 'Department of Pathology',
  footer_note  TEXT
);

-- Patients
CREATE TABLE patients (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  age        VARCHAR(50),
  gender     VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
  phone      VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_name  ON patients (name);
CREATE INDEX idx_patients_phone ON patients (phone);

-- Doctors — "Self" is seeded as id=1 for walk-in patients
CREATE TABLE doctors (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_name ON doctors (name);

-- Test templates — pre-seeded from Excel, manageable from Settings
CREATE TABLE test_templates (
  id            SERIAL PRIMARY KEY,
  test_name     VARCHAR(255) NOT NULL,
  category      VARCHAR(255) NOT NULL,
  report_type   VARCHAR(50)  NOT NULL CHECK (report_type IN ('standard', 'qualitative', 'descriptive', 'hormones')),
  template_data JSONB        NOT NULL,
  display_order INTEGER      DEFAULT 0,
  is_active     BOOLEAN      DEFAULT TRUE
);

CREATE INDEX idx_templates_category ON test_templates (category);
CREATE INDEX idx_templates_active   ON test_templates (is_active);

-- Lab reports — one row per issued report
CREATE TABLE reports (
  id          SERIAL PRIMARY KEY,
  lab_no      VARCHAR(50) NOT NULL UNIQUE,
  patient_id  INTEGER NOT NULL REFERENCES patients(id),
  doctor_id   INTEGER REFERENCES doctors(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status      VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_lab_no     ON reports (lab_no);
CREATE INDEX idx_reports_patient_id ON reports (patient_id);
CREATE INDEX idx_reports_doctor_id  ON reports (doctor_id);
CREATE INDEX idx_reports_date       ON reports (report_date);

-- Report results — filled-in test data per report, JSONB shape varies by report_type
CREATE TABLE report_results (
  id            SERIAL PRIMARY KEY,
  report_id     INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  template_id   INTEGER NOT NULL REFERENCES test_templates(id),
  result_data   JSONB   NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_results_report_id ON report_results (report_id);
