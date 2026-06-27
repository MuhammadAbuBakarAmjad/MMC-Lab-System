-- Migration 001: father_husband_name, cnic, finalized_at, specimen, contact_no
-- Safe to run on an existing database — ADD COLUMN IF NOT EXISTS is idempotent.
-- Run via: psql -U postgres -d labsystem -f server/db/migrate_001.sql
-- Or run the helper script: node server/db/migrate_001.js

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS father_husband_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cnic                VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_patients_cnic ON patients (cnic);

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS specimen     TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

ALTER TABLE lab_settings
  ADD COLUMN IF NOT EXISTS contact_no VARCHAR(50);
