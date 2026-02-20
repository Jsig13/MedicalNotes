-- Seed default templates

INSERT INTO templates (name, description, category, is_default, sections) VALUES
(
  'Pre-Retirement Records Review',
  'Full SOAP with custom ROS and BLUF Assessment & Plan',
  'custom',
  false,
  '[
    {"id":"hpi","group":"Subjective","title":"History of Present Illness","format":"paragraph","order":0,"instructions":""},
    {"id":"pbhpi","group":"Subjective","title":"Problem-Based History of Present Illness","format":"paragraph","order":1,"instructions":""},
    {"id":"meds","group":"Subjective","title":"Medications and Supplements","format":"paragraph","order":2,"instructions":""},
    {"id":"ros","group":"Subjective","title":"ROS","format":"custom-ros","order":3,"instructions":"(This is the structure I want. Please change anything we talk about to the correct option in the ROS, for example ''mild'' back pain, ''severe'' neck pain. Please have a focused ROS at the top specifically about things discussed at the visit.)"},
    {"id":"pe","group":"Objective","title":"Physical Examination","format":"paragraph","order":4,"instructions":""},
    {"id":"labs","group":"Objective","title":"Laboratory, Imaging, and Diagnostic Test Results","format":"bullet","order":5,"instructions":""},
    {"id":"ap","group":"Assessment & Plan","title":"Assessment & Plan","format":"bluf-ap","order":6,"instructions":"(For EACH diagnosis discussed, generate ONE BLUF block. Do not combine diagnoses. Keep the BLUF summary to 1-2 short sentences total. Each Diagnosis requires a complete overview of at least 5 full sentences.)"},
    {"id":"orders","group":"Orders","title":"Orders","format":"orders","order":7,"instructions":"[Capture any orders due out by the clinician from this appointment][list all medication prescribed][list radiology orders with ICD10][lab orders][Referrals with ICD10 and explanation]"}
  ]'::jsonb
),
(
  'SOAP Note',
  'Standard Subjective/Objective/Assessment/Plan format',
  'soap',
  true,
  '[
    {"id":"subjective","group":"Subjective","title":"Subjective","format":"paragraph","order":0,"instructions":""},
    {"id":"objective","group":"Objective","title":"Objective","format":"paragraph","order":1,"instructions":""},
    {"id":"assessment","group":"Assessment & Plan","title":"Assessment","format":"paragraph","order":2,"instructions":""},
    {"id":"plan","group":"Assessment & Plan","title":"Plan","format":"paragraph","order":3,"instructions":""}
  ]'::jsonb
),
(
  'New Patient',
  'Comprehensive new patient evaluation',
  'hp',
  true,
  '[
    {"id":"hpi","group":"Subjective","title":"History of Present Illness","format":"paragraph","order":0,"instructions":""},
    {"id":"pmh","group":"Subjective","title":"Past Medical History","format":"paragraph","order":1,"instructions":""},
    {"id":"meds","group":"Subjective","title":"Medications and Supplements","format":"paragraph","order":2,"instructions":""},
    {"id":"allergies","group":"Subjective","title":"Allergies","format":"bullet","order":3,"instructions":""},
    {"id":"fh","group":"Subjective","title":"Family History","format":"paragraph","order":4,"instructions":""},
    {"id":"sh","group":"Subjective","title":"Social History","format":"paragraph","order":5,"instructions":""},
    {"id":"ros","group":"Subjective","title":"ROS","format":"custom-ros","order":6,"instructions":""},
    {"id":"pe","group":"Objective","title":"Physical Examination","format":"paragraph","order":7,"instructions":""},
    {"id":"labs","group":"Objective","title":"Laboratory, Imaging, and Diagnostic Test Results","format":"bullet","order":8,"instructions":""},
    {"id":"ap","group":"Assessment & Plan","title":"Assessment & Plan","format":"bluf-ap","order":9,"instructions":""},
    {"id":"orders","group":"Orders","title":"Orders","format":"orders","order":10,"instructions":""}
  ]'::jsonb
),
(
  'Returning Patient',
  'Follow-up visit documentation',
  'progress',
  true,
  '[
    {"id":"hpi","group":"Subjective","title":"History of Present Illness","format":"paragraph","order":0,"instructions":""},
    {"id":"meds","group":"Subjective","title":"Medications and Supplements","format":"paragraph","order":1,"instructions":""},
    {"id":"ros","group":"Subjective","title":"ROS","format":"custom-ros","order":2,"instructions":""},
    {"id":"pe","group":"Objective","title":"Physical Examination","format":"paragraph","order":3,"instructions":""},
    {"id":"labs","group":"Objective","title":"Laboratory, Imaging, and Diagnostic Test Results","format":"bullet","order":4,"instructions":""},
    {"id":"ap","group":"Assessment & Plan","title":"Assessment & Plan","format":"bluf-ap","order":5,"instructions":""},
    {"id":"orders","group":"Orders","title":"Orders","format":"orders","order":6,"instructions":""}
  ]'::jsonb
),
(
  'DoxGPT Diagnostic Narrative',
  'VA nexus / medical-legal narrative (6-paragraph format)',
  'doxgpt',
  false,
  '[
    {"id":"context","group":"Narrative","title":"Service Context and Clinical Onset","format":"paragraph","order":0,"instructions":"(Describe service timeframe, operational context, and circumstances relevant to disease onset. Approx 7 sentences)"},
    {"id":"course","group":"Narrative","title":"Clinical Course and Pattern","format":"paragraph","order":1,"instructions":"(Describe persistence, recurrence, progression, and functional impact. Approx 7 sentences)"},
    {"id":"va_reg","group":"Narrative","title":"VA Regulatory Framework","format":"paragraph","order":2,"instructions":"(Reference 38 C.F.R. § 3.303, § 3.306, § 3.317, PACT Act. Approx 7 sentences)"},
    {"id":"patho","group":"Narrative","title":"Pathophysiology and Biologic Plausibility","format":"paragraph","order":3,"instructions":"(Explain accepted medical mechanisms. Cite peer-reviewed literature conceptually. Approx 10 sentences)"},
    {"id":"linkage","group":"Narrative","title":"Problem List Linkage","format":"paragraph","order":4,"instructions":"(Link diagnosis to relevant conditions from supplied problem list. Approx 7 sentences)"},
    {"id":"conclusion","group":"Narrative","title":"Medical-Legal Conclusion","format":"paragraph","order":5,"instructions":"(Clear neutral conclusion. Reference VA frameworks. Approx 7 sentences)"}
  ]'::jsonb
),
(
  'DoxGPT Exposure Narrative',
  'VA exposure nexus documentation',
  'doxgpt',
  false,
  '[
    {"id":"exp_context","group":"Narrative","title":"Service and Exposure Context","format":"paragraph","order":0,"instructions":"(Describe timeframe, locations, duties. Emphasize why exposure was unavoidable. 7 sentences)"},
    {"id":"exp_mech","group":"Narrative","title":"Exposure Mechanism and Pattern","format":"paragraph","order":1,"instructions":"(Detail exposure source, route, frequency, duration. Address absence of monitoring. 7 sentences)"},
    {"id":"exp_va","group":"Narrative","title":"VA Regulatory Framework","format":"paragraph","order":2,"instructions":"(Reference 38 C.F.R. § 3.303, § 3.317, PACT Act provisions. 7 sentences)"},
    {"id":"exp_bio","group":"Narrative","title":"Biologic Plausibility","format":"paragraph","order":3,"instructions":"(Explain known biologic mechanisms. Cite peer-reviewed literature conceptually. 10 sentences)"},
    {"id":"exp_link","group":"Narrative","title":"Problem List Linkage","format":"paragraph","order":4,"instructions":"(Link diagnoses or symptom clusters to exposure using biologic rationale. 7 sentences)"},
    {"id":"exp_conc","group":"Narrative","title":"Medical-Legal Conclusion","format":"paragraph","order":5,"instructions":"(Clear statement that exposure is credible and relevant for VA consideration. 7 sentences)"}
  ]'::jsonb
);
