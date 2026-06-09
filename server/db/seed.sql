-- Seed data for Mashallah Medical Complex Lab System
-- Run after schema.sql via: node server/db/init.js

-- Lab settings — always one row
INSERT INTO lab_settings (lab_name, address, department, footer_note) VALUES (
  'Mashallah Medical Complex, Multan',
  'Multan, Pakistan',
  'Department of Pathology',
  'This report is confidential and intended for the referred physician only.'
);

-- "Self" doctor — id=1, used for walk-in patients, doctor_id is never NULL
INSERT INTO doctors (name, phone) VALUES ('Self', NULL);

-- Test templates seeded from Excel (TEST_TEMPLATES_SEED.json)
-- HAEMATOLOGY
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('CBC (Complete Blood Count)', 'HAEMATOLOGY', 'standard', 1, '{
  "fields": [
    {"name": "T.L.C.",              "unit": "x10*3/cmm",  "normal_male": "4.0 - 11.0",  "normal_female": "4.0 - 11.0"},
    {"name": "Haemoglobin",         "unit": "g/dl",       "normal_male": "13.0 - 17.5", "normal_female": "11.5 - 14.5"},
    {"name": "RBC",                 "unit": "x10*12/l",   "normal_male": "4.2 - 6.0",   "normal_female": "4.2 - 6.0"},
    {"name": "HCT",                 "unit": "%",          "normal_male": "38.7 - 50.7", "normal_female": "38.7 - 50.7"},
    {"name": "MCH",                 "unit": "pg",         "normal_male": "25.1 - 31.6", "normal_female": "25.1 - 31.6"},
    {"name": "MCHC",                "unit": "g/dl",       "normal_male": "30 - 36",     "normal_female": "30 - 36"},
    {"name": "Platelets",           "unit": "x10*3/cmm",  "normal_male": "150 - 450",   "normal_female": "150 - 450"},
    {"name": "DLC - Neutrophils",   "unit": "%",          "normal_male": "35.0 - 76.0", "normal_female": "35.0 - 76.0"},
    {"name": "DLC - Lymphocytes",   "unit": "%",          "normal_male": "18.0 - 45.0", "normal_female": "18.0 - 45.0"},
    {"name": "DLC - Monocytes",     "unit": "%",          "normal_male": "4.0 - 10.0",  "normal_female": "4.0 - 10.0"},
    {"name": "DLC - Eosinophils",   "unit": "%",          "normal_male": "1.0 - 6.0",   "normal_female": "1.0 - 6.0"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('ESR', 'HAEMATOLOGY', 'standard', 2, '{
  "fields": [
    {"name": "E.S.R.", "unit": "mm/1st Hour", "normal_male": "0 - 10", "normal_female": "0 - 15"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Haemoglobin (HB)', 'HAEMATOLOGY', 'standard', 3, '{
  "fields": [
    {"name": "Haemoglobin", "unit": "g/dl", "normal_male": "13.0 - 17.5", "normal_female": "11.5 - 14.5"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Blood Group', 'HAEMATOLOGY', 'qualitative', 4, '{
  "fields": [
    {"name": "Blood Group", "options": ["A Positive", "A Negative", "B Positive", "B Negative", "O Positive", "O Negative", "AB Positive", "AB Negative"]},
    {"name": "Rh Factor",   "options": ["Positive", "Negative"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Malarial Parasite (MP)', 'HAEMATOLOGY', 'qualitative', 5, '{
  "fields": [
    {"name": "Malarial Parasite", "options": ["Not Seen", "P. Vivax Seen", "P. Falciparum Seen"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('HB + RPM', 'HAEMATOLOGY', 'standard', 6, '{
  "fields": [
    {"name": "Haemoglobin",      "unit": "g/dl",  "normal_male": "13.0 - 17.5", "normal_female": "11.5 - 14.5"},
    {"name": "Blood Urea",       "unit": "mg/dl", "normal_male": "20 - 45",     "normal_female": "20 - 45"},
    {"name": "Serum Creatinine", "unit": "mg/dl", "normal_male": "0.6 - 1.5",   "normal_female": "0.6 - 1.1"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('PT-APTT', 'HAEMATOLOGY', 'standard', 7, '{
  "fields": [
    {"name": "Prothrombin Time (PT)", "unit": "seconds", "normal_male": "11 - 14",   "normal_female": "11 - 14"},
    {"name": "Control",               "unit": "seconds", "normal_male": "11 - 14",   "normal_female": "11 - 14"},
    {"name": "INR",                   "unit": "",        "normal_male": "0.9 - 1.1", "normal_female": "0.9 - 1.1"},
    {"name": "APTT",                  "unit": "seconds", "normal_male": "25 - 35",   "normal_female": "25 - 35"},
    {"name": "APTT Control",          "unit": "seconds", "normal_male": "25 - 35",   "normal_female": "25 - 35"}
  ]
}');

-- BLOOD GLUCOSE
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Fasting Blood Sugar (FBS)', 'BLOOD GLUCOSE', 'standard', 10, '{
  "fields": [
    {"name": "Fasting Blood Sugar", "unit": "mg/dl", "normal_male": "70 - 110", "normal_female": "70 - 110"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Random Blood Sugar (RBS)', 'BLOOD GLUCOSE', 'standard', 11, '{
  "fields": [
    {"name": "Random Blood Sugar", "unit": "mg/dl", "normal_male": "90 - 150", "normal_female": "90 - 150"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('HbA1c', 'BLOOD GLUCOSE', 'standard', 12, '{
  "fields": [
    {"name": "HbA1c", "unit": "%", "normal_male": "4.0 - 6.0", "normal_female": "4.0 - 6.0"}
  ]
}');

-- LIVER FUNCTION TESTS
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('LFT (Liver Function Tests)', 'LIVER FUNCTION TESTS', 'standard', 20, '{
  "fields": [
    {"name": "Bilirubin Total",   "unit": "mg/dl", "normal_male": "Upto 1.0", "normal_female": "Upto 1.0"},
    {"name": "ALT (S.G.P.T)",    "unit": "U/l",   "normal_male": "10 - 41",  "normal_female": "10 - 37"},
    {"name": "AST (S.G.O.T)",    "unit": "U/l",   "normal_male": "10 - 38",  "normal_female": "10 - 31"},
    {"name": "Alk. Phosphatase", "unit": "U/l",   "normal_male": "65 - 306", "normal_female": "65 - 306"}
  ]
}');

-- RENAL FUNCTION TESTS
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('RPM (Renal Function Tests)', 'RENAL FUNCTION TESTS', 'standard', 30, '{
  "fields": [
    {"name": "Blood Urea",       "unit": "mg/dl", "normal_male": "20 - 45",   "normal_female": "20 - 45"},
    {"name": "Serum Creatinine", "unit": "mg/dl", "normal_male": "0.6 - 1.5", "normal_female": "0.6 - 1.1"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Electrolytes', 'RENAL FUNCTION TESTS', 'standard', 31, '{
  "fields": [
    {"name": "Sodium (Na)",   "unit": "mEq/L", "normal_male": "136 - 145", "normal_female": "136 - 145"},
    {"name": "Potassium (K)", "unit": "mEq/L", "normal_male": "3.5 - 5.6", "normal_female": "3.5 - 5.6"},
    {"name": "Chloride (Cl)", "unit": "mEq/L", "normal_male": "98 - 107",  "normal_female": "98 - 107"}
  ]
}');

-- BIOCHEMISTRY
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Lipid Profile', 'BIOCHEMISTRY', 'standard', 40, '{
  "fields": [
    {"name": "Triglycerides",      "unit": "mg/dl", "normal_male": "50 - 150",     "normal_female": "50 - 150"},
    {"name": "Cholesterol",        "unit": "mg/dl", "normal_male": "150 - 200",    "normal_female": "150 - 200"},
    {"name": "H.D.L. Cholesterol", "unit": "mg/dl", "normal_male": "More than 35", "normal_female": "More than 35"},
    {"name": "L.D.L. Cholesterol", "unit": "mg/dl", "normal_male": "Upto 150",     "normal_female": "Upto 150"},
    {"name": "V.L.D.L.",           "unit": "mg/dl", "normal_male": "Upto 25",      "normal_female": "Upto 25"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Serum Uric Acid', 'BIOCHEMISTRY', 'standard', 41, '{
  "fields": [
    {"name": "Serum Uric Acid", "unit": "mg/dl", "normal_male": "3.4 - 7.0", "normal_female": "2.4 - 5.7"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Albumin', 'BIOCHEMISTRY', 'standard', 42, '{
  "fields": [
    {"name": "Albumin", "unit": "g/dl", "normal_male": "3.5 - 5.0", "normal_female": "3.5 - 5.0"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Calcium', 'BIOCHEMISTRY', 'standard', 43, '{
  "fields": [
    {"name": "Calcium", "unit": "mg/dl", "normal_male": "8.5 - 10.5", "normal_female": "8.5 - 10.5"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Total Protein', 'BIOCHEMISTRY', 'standard', 44, '{
  "fields": [
    {"name": "Total Protein", "unit": "g/dl", "normal_male": "6.0 - 8.3", "normal_female": "6.0 - 8.3"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Vitamin D3 + B12', 'BIOCHEMISTRY', 'standard', 45, '{
  "fields": [
    {"name": "Vitamin D3 (25-OH)", "unit": "ng/ml", "normal_male": "30 - 100",  "normal_female": "30 - 100"},
    {"name": "Vitamin B12",        "unit": "pg/ml", "normal_male": "200 - 900", "normal_female": "200 - 900"}
  ]
}');

-- SEROLOGY
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Serology Panel (HBsAg, Anti-HCV)', 'SEROLOGY', 'qualitative', 50, '{
  "fields": [
    {"name": "HBsAg (Screening)",    "options": ["Reactive", "Non-Reactive"]},
    {"name": "Anti-HCV (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('HBsAg', 'SEROLOGY', 'qualitative', 51, '{
  "fields": [
    {"name": "HBsAg (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Anti-HCV', 'SEROLOGY', 'qualitative', 52, '{
  "fields": [
    {"name": "Anti-HCV (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Anti-HIV', 'SEROLOGY', 'qualitative', 53, '{
  "fields": [
    {"name": "Anti-HIV (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('H. Pylori', 'SEROLOGY', 'qualitative', 54, '{
  "fields": [
    {"name": "H. Pylori (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('VDRL', 'SEROLOGY', 'qualitative', 55, '{
  "fields": [
    {"name": "V.D.R.L. (Screening)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('CRP (C-Reactive Protein)', 'SEROLOGY', 'qualitative', 56, '{
  "fields": [
    {"name": "CRP", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('RA Factor', 'SEROLOGY', 'qualitative', 57, '{
  "fields": [
    {"name": "RA Factor", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('ASO (Anti-Streptolysin O)', 'SEROLOGY', 'qualitative', 58, '{
  "fields": [
    {"name": "ASO Titre", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('ANA', 'SEROLOGY', 'qualitative', 59, '{
  "fields": [
    {"name": "ANA (Anti-Nuclear Antibody)", "options": ["Reactive", "Non-Reactive"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Typhoid (ICT)', 'SEROLOGY', 'qualitative', 60, '{
  "fields": [
    {"name": "Typhoid (ICT)", "options": ["Positive", "Negative"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('HCG (Pregnancy Test)', 'SEROLOGY', 'qualitative', 61, '{
  "fields": [
    {"name": "HCG (Pregnancy Test)", "options": ["Positive", "Negative"]}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Beta-HCG', 'SEROLOGY', 'standard', 62, '{
  "fields": [
    {"name": "Beta-HCG", "unit": "mIU/ml", "normal_male": "< 5.0", "normal_female": "< 5.0 (non-pregnant)"}
  ]
}');

-- URINE ANALYSIS
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Urine R/E (Urine Analysis)', 'URINE ANALYSIS', 'descriptive', 70, '{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        {"name": "Color",       "type": "dropdown", "options": ["Light Yellow", "Yellow", "Dark Yellow", "Amber", "Red", "Brown", "Colorless", "Pale Yellow"]},
        {"name": "Turbidity",   "type": "dropdown", "options": ["Nil", "Slight", "Turbid", "Clear"]},
        {"name": "Sp. Gravity", "type": "text",     "default": "1.025"},
        {"name": "Deposit",     "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    },
    {
      "heading": "CHEMICAL EXAMINATION",
      "fields": [
        {"name": "pH",           "type": "dropdown", "options": ["Acidic", "Neutral", "Alkaline"]},
        {"name": "Sugar",        "type": "dropdown", "options": ["Nil", "Trace", "+", "++", "+++"]},
        {"name": "Protein",      "type": "dropdown", "options": ["Nil", "Trace", "+", "++", "+++"]},
        {"name": "Ketone",       "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Urobilinogen", "type": "dropdown", "options": ["Normal", "Increased"]},
        {"name": "Bilirubin",    "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Blood",        "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    },
    {
      "heading": "MICROSCOPIC EXAMINATION",
      "fields": [
        {"name": "Pus Cells",        "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Red Blood Cells",  "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Epithelial Cells", "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Crystals",         "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Normal Casts",     "type": "text", "unit": "/LPF", "default": "Nil"},
        {"name": "Amorphous",        "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Organisms",        "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    }
  ]
}');

-- STOOL ANALYSIS
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Stool Analysis', 'STOOL ANALYSIS', 'descriptive', 80, '{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        {"name": "Appearance",  "type": "dropdown", "options": ["Light Brown", "Brown", "Dark Brown", "Yellow", "Green", "Black", "Red"]},
        {"name": "Consistency", "type": "dropdown", "options": ["Semiformed", "Formed", "Soft", "Loose", "Watery"]},
        {"name": "Odour",       "type": "dropdown", "options": ["Foul", "Normal"]},
        {"name": "Mucous",      "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Blood",       "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    },
    {
      "heading": "MICROSCOPIC EXAMINATION",
      "fields": [
        {"name": "Pus Cells",       "type": "text",     "unit": "/HPF", "default": "Nil"},
        {"name": "Red Blood Cells", "type": "text",     "unit": "/HPF", "default": "Nil"},
        {"name": "Bacteria",        "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Ova",             "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Cysts",           "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Vegetative Form", "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Mucous",          "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    }
  ]
}');

-- SEMEN ANALYSIS
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Semen Analysis', 'SEMEN ANALYSIS', 'descriptive', 90, '{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        {"name": "Specimen",          "type": "dropdown", "options": ["Post Masturbation", "Post Coitus"], "default": "Post Masturbation"},
        {"name": "Volume",            "type": "text", "unit": "ml",      "normal": "1 - 5"},
        {"name": "Colour",            "type": "dropdown", "options": ["Off White", "White", "Yellow"]},
        {"name": "pH",                "type": "dropdown", "options": ["Alkaline", "Neutral", "Acidic"]},
        {"name": "Viscosity",         "type": "dropdown", "options": ["Normal", "Increased", "Decreased"]},
        {"name": "Liquefaction Time", "type": "text", "unit": "minutes", "normal": "< 30"}
      ]
    },
    {
      "heading": "MICROSCOPIC EXAMINATION",
      "fields": [
        {"name": "Agglutination",     "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Total Sperm Count", "type": "text", "unit": "millions/ml", "normal": "> 60"}
      ]
    },
    {
      "heading": "SPERM MOTILITY",
      "fields": [
        {"name": "Rapid Progressive", "type": "text", "unit": "%", "normal": "> 50"},
        {"name": "Slow Progressive",  "type": "text", "unit": "%", "normal": "> 25"},
        {"name": "Non Progressive",   "type": "text", "unit": "%", "normal": ""}
      ]
    },
    {
      "heading": "MORPHOLOGY",
      "fields": [
        {"name": "Normal",   "type": "text", "unit": "%", "normal": "> 80"},
        {"name": "Abnormal", "type": "text", "unit": "%", "normal": "< 20"}
      ]
    },
    {
      "heading": "OTHER CELLS",
      "fields": [
        {"name": "Pus Cells",        "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Epithelial Cells", "type": "text", "unit": "/HPF", "default": "Nil"},
        {"name": "Red Blood Cells",  "type": "text", "unit": "/HPF", "default": "Nil"}
      ]
    }
  ]
}');

-- FLUID EXAMINATION
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Fluid Examination', 'FLUID EXAMINATION', 'descriptive', 95, '{
  "sections": [
    {
      "heading": "PHYSICAL EXAMINATION",
      "fields": [
        {"name": "Nature of Fluid", "type": "text",     "default": ""},
        {"name": "Colour",          "type": "text",     "default": ""},
        {"name": "Turbidity",       "type": "dropdown", "options": ["Clear", "Slight", "Turbid"]},
        {"name": "Coagulum",        "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Volume",          "type": "text",     "unit": "ml"}
      ]
    },
    {
      "heading": "CHEMICAL EXAMINATION",
      "fields": [
        {"name": "Sugar",   "type": "dropdown", "options": ["Nil", "Present"]},
        {"name": "Protein", "type": "dropdown", "options": ["Nil", "Present"]}
      ]
    },
    {
      "heading": "MICROSCOPIC EXAMINATION",
      "fields": [
        {"name": "T.L.C.",          "type": "text", "default": "Nil"},
        {"name": "Polymorphs",      "type": "text", "unit": "%", "default": "Nil"},
        {"name": "Lymphocytes",     "type": "text", "unit": "%", "default": "Nil"},
        {"name": "Red Blood Cells", "type": "text", "default": "Nil"}
      ]
    }
  ]
}');

-- HORMONES
INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Hormones (TSH, FSH, LH, Prolactin)', 'HORMONES', 'hormones', 100, '{
  "fields": [
    {"name": "TSH",          "unit": "uUI/ml", "normal_value_text": "0.25 – 5.0"},
    {"name": "FSH",          "unit": "mlU/ml", "normal_value_text": "M: 1.7-12.0\nF Follicular (1st half): 3.9-12.0\nF Follicular (2nd half): 2.9-9.0\nF Luteal: 1.5-7.0\nMenopause: 17.0-95.0"},
    {"name": "LH",           "unit": "mlU/ml", "normal_value_text": "M: 1.1-7.0\nF Ovulation Peak: 9.6-80.0\nF Follicular: 1.5-8.0\nF Luteal: 0.2-6.5\nMenopause: 8.0-33.0"},
    {"name": "S. Prolactin", "unit": "ng/ml",  "normal_value_text": "Men: 3-25\nFemale: 5-35"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('TSH', 'HORMONES', 'hormones', 101, '{
  "fields": [
    {"name": "TSH", "unit": "uUI/ml", "normal_value_text": "0.25 – 5.0"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('FSH', 'HORMONES', 'hormones', 102, '{
  "fields": [
    {"name": "FSH", "unit": "mlU/ml", "normal_value_text": "M: 1.7-12.0\nF Follicular (1st half): 3.9-12.0\nF Follicular (2nd half): 2.9-9.0\nF Luteal: 1.5-7.0\nMenopause: 17.0-95.0"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('LH', 'HORMONES', 'hormones', 103, '{
  "fields": [
    {"name": "LH", "unit": "mlU/ml", "normal_value_text": "M: 1.1-7.0\nF Ovulation Peak: 9.6-80.0\nF Follicular: 1.5-8.0\nF Luteal: 0.2-6.5\nMenopause: 8.0-33.0"}
  ]
}');

INSERT INTO test_templates (test_name, category, report_type, display_order, template_data) VALUES
('Prolactin', 'HORMONES', 'hormones', 104, '{
  "fields": [
    {"name": "S. Prolactin", "unit": "ng/ml", "normal_value_text": "Men: 3-25\nFemale: 5-35"}
  ]
}');
