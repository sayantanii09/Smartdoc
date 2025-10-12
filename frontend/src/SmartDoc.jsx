import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, AlertTriangle, CheckCircle, Stethoscope, Sparkles, UserCircle2, Settings, Link, Unlink, LogIn, LogOut, User, Download, Send, Save, Plus, Pill } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Comprehensive Drug Database (Medscape-like data)
// In production, this would be fetched from a medical database API
const COMPREHENSIVE_DRUG_DATABASE = {
  // Cardiovascular Medications
  warfarin: {
    class: 'Anticoagulant',
    interactions: ['aspirin', 'ibuprofen', 'naproxen', 'celecoxib', 'clopidogrel', 'heparin', 'amiodarone', 'fluconazole', 'metronidazole', 'clarithromycin', 'erythromycin', 'ciprofloxacin', 'sulfamethoxazole'],
    foodInteractions: ['green leafy vegetables', 'cranberry juice', 'alcohol', 'grapefruit juice', 'garlic supplements', 'ginger', 'ginseng'],
    warnings: 'Increased bleeding risk. Monitor INR closely.',
    contraindications: ['active bleeding', 'severe liver disease', 'pregnancy'],
    sideEffects: ['bleeding', 'bruising', 'hair loss', 'skin necrosis']
  },
  aspirin: {
    class: 'Antiplatelet/NSAID',
    interactions: ['warfarin', 'heparin', 'clopidogrel', 'ibuprofen', 'naproxen', 'methotrexate', 'ace inhibitors', 'furosemide'],
    foodInteractions: ['alcohol', 'ginger', 'garlic supplements', 'turmeric'],
    warnings: 'Increased bleeding risk, GI irritation. Use with caution in peptic ulcer disease.',
    contraindications: ['active GI bleeding', 'severe asthma', 'children with viral infections (Reye syndrome)'],
    sideEffects: ['GI bleeding', 'tinnitus', 'nausea', 'heartburn']
  },
  lisinopril: {
    class: 'ACE Inhibitor',
    interactions: ['potassium supplements', 'spironolactone', 'amiloride', 'nsaids', 'lithium', 'aliskiren'],
    foodInteractions: ['salt substitutes', 'potassium-rich foods', 'alcohol'],
    warnings: 'Monitor potassium levels. Risk of hyperkalemia and acute kidney injury.',
    contraindications: ['pregnancy', 'bilateral renal artery stenosis', 'angioedema history'],
    sideEffects: ['dry cough', 'hyperkalemia', 'angioedema', 'hypotension']
  },
  atorvastatin: {
    class: 'HMG-CoA Reductase Inhibitor',
    interactions: ['clarithromycin', 'erythromycin', 'itraconazole', 'ketoconazole', 'cyclosporine', 'gemfibrozil', 'niacin', 'digoxin'],
    foodInteractions: ['grapefruit juice', 'alcohol'],
    warnings: 'Monitor liver enzymes and creatine kinase. Risk of myopathy and rhabdomyolysis.',
    contraindications: ['active liver disease', 'pregnancy', 'breastfeeding'],
    sideEffects: ['myalgia', 'elevated liver enzymes', 'headache', 'nausea']
  },
  amlodipine: {
    class: 'Calcium Channel Blocker',
    interactions: ['simvastatin', 'cyclosporine', 'tacrolimus'],
    foodInteractions: ['grapefruit juice', 'high sodium foods'],
    warnings: 'Monitor blood pressure. May cause peripheral edema.',
    contraindications: ['severe aortic stenosis', 'cardiogenic shock'],
    sideEffects: ['peripheral edema', 'fatigue', 'dizziness', 'flushing']
  },

  // Diabetes Medications
  metformin: {
    class: 'Biguanide',
    interactions: ['contrast agents', 'cimetidine', 'furosemide', 'nifedipine', 'topiramate'],
    foodInteractions: ['alcohol', 'high fiber meals'],
    warnings: 'Risk of lactic acidosis. Discontinue before contrast procedures.',
    contraindications: ['severe kidney disease', 'metabolic acidosis', 'severe dehydration'],
    sideEffects: ['GI upset', 'nausea', 'diarrhea', 'metallic taste', 'vitamin B12 deficiency']
  },
  insulin: {
    class: 'Hormone',
    interactions: ['ace inhibitors', 'beta blockers', 'octreotide', 'lanreotide'],
    foodInteractions: ['alcohol', 'carbohydrate timing'],
    warnings: 'Risk of hypoglycemia. Monitor blood glucose closely.',
    contraindications: ['hypoglycemia'],
    sideEffects: ['hypoglycemia', 'weight gain', 'injection site reactions']
  },
  glipizide: {
    class: 'Sulfonylurea',
    interactions: ['warfarin', 'fluconazole', 'clarithromycin', 'beta blockers'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of hypoglycemia, especially in elderly.',
    contraindications: ['type 1 diabetes', 'diabetic ketoacidosis'],
    sideEffects: ['hypoglycemia', 'weight gain', 'nausea']
  },

  // Antibiotics
  amoxicillin: {
    class: 'Penicillin Antibiotic',
    interactions: ['warfarin', 'methotrexate', 'oral contraceptives'],
    foodInteractions: [],
    warnings: 'Risk of allergic reactions. May reduce oral contraceptive effectiveness.',
    contraindications: ['penicillin allergy'],
    sideEffects: ['diarrhea', 'nausea', 'rash', 'candidiasis']
  },
  clarithromycin: {
    class: 'Macrolide Antibiotic',
    interactions: ['warfarin', 'statins', 'digoxin', 'theophylline', 'carbamazepine', 'cyclosporine'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'QT prolongation risk. Multiple drug interactions via CYP3A4.',
    contraindications: ['history of QT prolongation', 'severe liver disease'],
    sideEffects: ['nausea', 'diarrhea', 'taste disturbance', 'QT prolongation']
  },
  ciprofloxacin: {
    class: 'Fluoroquinolone Antibiotic',
    interactions: ['warfarin', 'theophylline', 'tizanidine', 'dairy products', 'iron supplements'],
    foodInteractions: ['dairy products', 'calcium supplements', 'iron supplements'],
    warnings: 'Tendon rupture risk. C. diff colitis risk.',
    contraindications: ['tendon disorders', 'myasthenia gravis'],
    sideEffects: ['nausea', 'diarrhea', 'tendinitis', 'CNS effects']
  },

  // Gastrointestinal
  omeprazole: {
    class: 'Proton Pump Inhibitor',
    interactions: ['warfarin', 'clopidogrel', 'digoxin', 'ketoconazole', 'iron supplements'],
    foodInteractions: [],
    warnings: 'Long-term use may increase risk of fractures and C. diff.',
    contraindications: ['hypersensitivity to PPIs'],
    sideEffects: ['headache', 'nausea', 'diarrhea', 'vitamin B12 deficiency']
  },
  ranitidine: {
    class: 'H2 Receptor Antagonist',
    interactions: ['warfarin', 'ketoconazole', 'atazanavir'],
    foodInteractions: ['alcohol'],
    warnings: 'Note: Ranitidine recalled due to NDMA contamination.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['headache', 'dizziness', 'constipation']
  },

  // Respiratory
  albuterol: {
    class: 'Beta-2 Agonist',
    interactions: ['beta blockers', 'digoxin', 'tricyclic antidepressants'],
    foodInteractions: ['caffeine'],
    warnings: 'May cause paradoxical bronchospasm. Monitor heart rate.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['tachycardia', 'tremor', 'nervousness', 'headache']
  },
  theophylline: {
    class: 'Methylxanthine',
    interactions: ['ciprofloxacin', 'erythromycin', 'cimetidine', 'phenytoin', 'carbamazepine'],
    foodInteractions: ['caffeine', 'alcohol', 'charcoal-broiled foods'],
    warnings: 'Narrow therapeutic index. Monitor serum levels.',
    contraindications: ['uncontrolled seizures', 'active peptic ulcer'],
    sideEffects: ['nausea', 'tachycardia', 'seizures', 'arrhythmias']
  },

  // Neurological
  phenytoin: {
    class: 'Anticonvulsant',
    interactions: ['warfarin', 'digoxin', 'oral contraceptives', 'folic acid', 'carbamazepine'],
    foodInteractions: ['enteral nutrition', 'folic acid rich foods'],
    warnings: 'Narrow therapeutic index. Monitor serum levels and signs of toxicity.',
    contraindications: ['sinus bradycardia', 'heart block'],
    sideEffects: ['gingival hyperplasia', 'hirsutism', 'ataxia', 'nystagmus']
  },
  carbamazepine: {
    class: 'Anticonvulsant',
    interactions: ['warfarin', 'oral contraceptives', 'clarithromycin', 'fluoxetine', 'diltiazem'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Risk of aplastic anemia. Monitor CBC regularly.',
    contraindications: ['bone marrow suppression', 'AV block'],
    sideEffects: ['diplopia', 'ataxia', 'nausea', 'rash', 'hyponatremia']
  },

  // Pain/Inflammation
  ibuprofen: {
    class: 'NSAID',
    interactions: ['warfarin', 'ace inhibitors', 'lithium', 'methotrexate', 'digoxin'],
    foodInteractions: ['alcohol'],
    warnings: 'Increased cardiovascular and GI risks. Use lowest effective dose.',
    contraindications: ['active GI bleeding', 'severe heart failure', 'CABG surgery'],
    sideEffects: ['GI upset', 'hypertension', 'fluid retention', 'kidney dysfunction']
  },
  naproxen: {
    class: 'NSAID',
    interactions: ['warfarin', 'ace inhibitors', 'lithium', 'methotrexate', 'cyclosporine'],
    foodInteractions: ['alcohol'],
    warnings: 'Increased cardiovascular risk. Monitor kidney function.',
    contraindications: ['active GI bleeding', 'severe kidney disease'],
    sideEffects: ['GI bleeding', 'hypertension', 'edema', 'dizziness']
  },
  morphine: {
    class: 'Opioid Analgesic',
    interactions: ['mao inhibitors', 'cns depressants', 'muscle relaxants', 'sedatives'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of respiratory depression and dependence.',
    contraindications: ['respiratory depression', 'paralytic ileus'],
    sideEffects: ['respiratory depression', 'constipation', 'nausea', 'sedation']
  },

  // Psychiatric
  sertraline: {
    class: 'SSRI Antidepressant',
    interactions: ['mao inhibitors', 'warfarin', 'digoxin', 'triptans', 'tramadol'],
    foodInteractions: ['alcohol'],
    warnings: 'Serotonin syndrome risk. Monitor for suicidal thoughts.',
    contraindications: ['mao inhibitor use', 'pimozide use'],
    sideEffects: ['nausea', 'diarrhea', 'insomnia', 'sexual dysfunction']
  },
  fluoxetine: {
    class: 'SSRI Antidepressant',
    interactions: ['mao inhibitors', 'warfarin', 'phenytoin', 'carbamazepine', 'triptans'],
    foodInteractions: ['alcohol'],
    warnings: 'Long half-life. Serotonin syndrome risk.',
    contraindications: ['mao inhibitor use', 'thioridazine use'],
    sideEffects: ['nausea', 'headache', 'insomnia', 'anxiety']
  },

  // Thyroid
  levothyroxine: {
    class: 'Thyroid Hormone',
    interactions: ['warfarin', 'digoxin', 'insulin', 'iron supplements', 'calcium supplements'],
    foodInteractions: ['soy products', 'fiber', 'coffee', 'calcium-rich foods'],
    warnings: 'Take on empty stomach. Monitor TSH levels.',
    contraindications: ['uncorrected adrenal insufficiency', 'acute MI'],
    sideEffects: ['palpitations', 'tremor', 'insomnia', 'weight loss']
  },

  // Diuretics
  furosemide: {
    class: 'Loop Diuretic',
    interactions: ['lithium', 'digoxin', 'aminoglycosides', 'nsaids', 'ace inhibitors'],
    foodInteractions: ['alcohol', 'licorice'],
    warnings: 'Monitor electrolytes, kidney function, and hearing. Risk of dehydration.',
    contraindications: ['anuria', 'severe electrolyte depletion'],
    sideEffects: ['hypokalemia', 'hyponatremia', 'dehydration', 'ototoxicity', 'hyperuricemia']
  },
  hydrochlorothiazide: {
    class: 'Thiazide Diuretic',
    interactions: ['lithium', 'digoxin', 'nsaids', 'corticosteroids'],
    foodInteractions: ['alcohol', 'licorice'],
    warnings: 'Monitor electrolytes and blood glucose. May worsen diabetes.',
    contraindications: ['anuria', 'severe kidney disease'],
    sideEffects: ['hypokalemia', 'hyperglycemia', 'hyperuricemia', 'photosensitivity']
  },
  spironolactone: {
    class: 'Potassium-Sparing Diuretic',
    interactions: ['ace inhibitors', 'potassium supplements', 'nsaids', 'lithium'],
    foodInteractions: ['salt substitutes', 'potassium-rich foods'],
    warnings: 'Monitor potassium levels. Risk of hyperkalemia.',
    contraindications: ['hyperkalemia', 'severe kidney disease', 'addison disease'],
    sideEffects: ['hyperkalemia', 'gynecomastia', 'menstrual irregularities']
  },

  // Beta Blockers
  metoprolol: {
    class: 'Beta-1 Selective Blocker',
    interactions: ['verapamil', 'diltiazem', 'clonidine', 'insulin', 'epinephrine'],
    foodInteractions: ['alcohol'],
    warnings: 'Do not stop abruptly. Monitor heart rate and blood pressure.',
    contraindications: ['severe bradycardia', 'heart block', 'cardiogenic shock'],
    sideEffects: ['bradycardia', 'hypotension', 'fatigue', 'depression']
  },
  propranolol: {
    class: 'Non-Selective Beta Blocker',
    interactions: ['verapamil', 'diltiazem', 'insulin', 'theophylline', 'lidocaine'],
    foodInteractions: ['alcohol'],
    warnings: 'Do not stop abruptly. Avoid in asthma patients.',
    contraindications: ['severe asthma', 'severe bradycardia', 'heart failure'],
    sideEffects: ['bradycardia', 'bronchospasm', 'fatigue', 'depression']
  },

  // Additional Common Drugs
  prednisone: {
    class: 'Corticosteroid',
    interactions: ['nsaids', 'warfarin', 'diabetes medications', 'vaccines'],
    foodInteractions: ['alcohol', 'grapefruit juice'],
    warnings: 'Do not stop abruptly. Monitor blood glucose and bone density.',
    contraindications: ['systemic fungal infections', 'live vaccines'],
    sideEffects: ['hyperglycemia', 'osteoporosis', 'immunosuppression', 'mood changes']
  },
  digoxin: {
    class: 'Cardiac Glycoside',
    interactions: ['diuretics', 'amiodarone', 'quinidine', 'verapamil', 'erythromycin'],
    foodInteractions: ['high fiber foods', 'st john wort'],
    warnings: 'Narrow therapeutic index. Monitor digoxin levels.',
    contraindications: ['ventricular fibrillation', 'heart block'],
    sideEffects: ['nausea', 'visual disturbances', 'arrhythmias', 'confusion']
  },
  losartan: {
    class: 'ARB (Angiotensin Receptor Blocker)',
    interactions: ['potassium supplements', 'nsaids', 'lithium', 'rifampin'],
    foodInteractions: ['salt substitutes', 'potassium-rich foods'],
    warnings: 'Monitor kidney function and potassium levels.',
    contraindications: ['pregnancy', 'bilateral renal artery stenosis'],
    sideEffects: ['hyperkalemia', 'hypotension', 'dizziness', 'fatigue']
  },
  clopidogrel: {
    class: 'Antiplatelet Agent',
    interactions: ['warfarin', 'omeprazole', 'aspirin', 'nsaids'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Increased bleeding risk. Avoid proton pump inhibitors.',
    contraindications: ['active bleeding', 'severe liver disease'],
    sideEffects: ['bleeding', 'bruising', 'headache', 'diarrhea']
  },
  simvastatin: {
    class: 'HMG-CoA Reductase Inhibitor',
    interactions: ['grapefruit juice', 'amlodipine', 'diltiazem', 'verapamil', 'clarithromycin'],
    foodInteractions: ['grapefruit juice', 'alcohol'],
    warnings: 'Monitor liver enzymes and creatine kinase. Risk of myopathy.',
    contraindications: ['active liver disease', 'pregnancy'],
    sideEffects: ['myalgia', 'elevated liver enzymes', 'headache']
  },

  // More Antibiotics
  azithromycin: {
    class: 'Macrolide Antibiotic',
    interactions: ['warfarin', 'digoxin', 'ergotamine', 'cyclosporine'],
    foodInteractions: ['antacids'],
    warnings: 'QT prolongation risk. Monitor in patients with cardiac conditions.',
    contraindications: ['history of cholestatic jaundice', 'severe liver disease'],
    sideEffects: ['diarrhea', 'nausea', 'abdominal pain', 'QT prolongation']
  },
  doxycycline: {
    class: 'Tetracycline Antibiotic',
    interactions: ['warfarin', 'antacids', 'iron supplements', 'penicillins', 'barbiturates'],
    foodInteractions: ['dairy products', 'calcium supplements', 'iron supplements'],
    warnings: 'Photosensitivity. Tooth discoloration in children.',
    contraindications: ['pregnancy', 'children under 8 years'],
    sideEffects: ['photosensitivity', 'esophagitis', 'nausea', 'diarrhea']
  },
  cephalexin: {
    class: 'Cephalosporin Antibiotic',
    interactions: ['warfarin', 'metformin', 'probenecid'],
    foodInteractions: [],
    warnings: 'Cross-reactivity with penicillin allergies (5-10%).',
    contraindications: ['severe penicillin allergy'],
    sideEffects: ['diarrhea', 'nausea', 'rash', 'vaginitis']
  },
  metronidazole: {
    class: 'Nitroimidazole Antibiotic',
    interactions: ['warfarin', 'lithium', 'phenytoin', 'busulfan', 'disulfiram'],
    foodInteractions: ['alcohol'],
    warnings: 'Disulfiram-like reaction with alcohol. Avoid alcohol during and 3 days after treatment.',
    contraindications: ['first trimester pregnancy', 'alcohol use'],
    sideEffects: ['metallic taste', 'nausea', 'headache', 'dark urine']
  },
  levofloxacin: {
    class: 'Fluoroquinolone Antibiotic',
    interactions: ['warfarin', 'nsaids', 'antacids', 'iron supplements', 'theophylline'],
    foodInteractions: ['dairy products', 'calcium supplements'],
    warnings: 'Tendon rupture risk. QT prolongation. C. diff risk.',
    contraindications: ['myasthenia gravis', 'tendon disorders'],
    sideEffects: ['nausea', 'diarrhea', 'tendinitis', 'QT prolongation']
  },

  // More Diabetes Medications
  glyburide: {
    class: 'Sulfonylurea',
    interactions: ['warfarin', 'fluconazole', 'miconazole', 'beta blockers'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of severe hypoglycemia, especially in elderly.',
    contraindications: ['type 1 diabetes', 'diabetic ketoacidosis'],
    sideEffects: ['hypoglycemia', 'weight gain', 'nausea']
  },
  sitagliptin: {
    class: 'DPP-4 Inhibitor',
    interactions: ['digoxin', 'insulin', 'sulfonylureas'],
    foodInteractions: [],
    warnings: 'Risk of pancreatitis. Adjust dose in renal impairment.',
    contraindications: ['type 1 diabetes'],
    sideEffects: ['nasopharyngitis', 'headache', 'pancreatitis']
  },
  empagliflozin: {
    class: 'SGLT2 Inhibitor',
    interactions: ['insulin', 'diuretics', 'hypotensive agents'],
    foodInteractions: [],
    warnings: 'Risk of DKA, genital infections, dehydration. Monitor kidney function.',
    contraindications: ['severe renal impairment', 'dialysis'],
    sideEffects: ['genital infections', 'UTI', 'dehydration', 'DKA']
  },

  // More Cardiovascular
  diltiazem: {
    class: 'Calcium Channel Blocker',
    interactions: ['simvastatin', 'beta blockers', 'digoxin', 'cyclosporine'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Monitor heart rate and blood pressure. AV block risk.',
    contraindications: ['sick sinus syndrome', 'severe bradycardia', 'acute MI'],
    sideEffects: ['bradycardia', 'edema', 'dizziness', 'headache']
  },
  verapamil: {
    class: 'Calcium Channel Blocker',
    interactions: ['beta blockers', 'digoxin', 'simvastatin', 'cyclosporine'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Monitor heart rate. Severe bradycardia risk with beta blockers.',
    contraindications: ['severe heart failure', 'sick sinus syndrome', 'AV block'],
    sideEffects: ['constipation', 'bradycardia', 'hypotension', 'edema']
  },
  enalapril: {
    class: 'ACE Inhibitor',
    interactions: ['potassium supplements', 'nsaids', 'lithium', 'aliskiren'],
    foodInteractions: ['salt substitutes', 'potassium-rich foods'],
    warnings: 'Monitor kidney function and potassium. Risk of angioedema.',
    contraindications: ['pregnancy', 'angioedema history'],
    sideEffects: ['dry cough', 'hyperkalemia', 'hypotension', 'dizziness']
  },
  carvedilol: {
    class: 'Alpha/Beta Blocker',
    interactions: ['diltiazem', 'verapamil', 'rifampin', 'insulin', 'diabetes medications'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Take with food. Monitor blood pressure and heart rate.',
    contraindications: ['severe bradycardia', 'heart block', 'decompensated heart failure'],
    sideEffects: ['bradycardia', 'hypotension', 'dizziness', 'fatigue']
  },
  isosorbide: {
    class: 'Nitrate',
    interactions: ['phosphodiesterase inhibitors', 'alcohol', 'antihypertensives'],
    foodInteractions: ['alcohol'],
    warnings: 'Severe hypotension with PDE5 inhibitors. Tolerance with continuous use.',
    contraindications: ['use of PDE5 inhibitors', 'severe anemia'],
    sideEffects: ['headache', 'hypotension', 'dizziness', 'flushing']
  },

  // More Pain Medications
  tramadol: {
    class: 'Opioid-like Analgesic',
    interactions: ['ssris', 'mao inhibitors', 'warfarin', 'carbamazepine', 'cns depressants'],
    foodInteractions: ['alcohol'],
    warnings: 'Serotonin syndrome risk. Seizure risk. Dependence potential.',
    contraindications: ['acute intoxication', 'mao inhibitor use'],
    sideEffects: ['nausea', 'constipation', 'dizziness', 'seizures']
  },
  acetaminophen: {
    class: 'Analgesic/Antipyretic',
    interactions: ['warfarin', 'isoniazid', 'phenytoin', 'carbamazepine'],
    foodInteractions: ['alcohol'],
    warnings: 'Hepatotoxicity with overdose. Maximum 4g/day. Caution with alcohol.',
    contraindications: ['severe liver disease', 'acute liver failure'],
    sideEffects: ['hepatotoxicity', 'rash', 'nausea']
  },
  celecoxib: {
    class: 'COX-2 Selective NSAID',
    interactions: ['warfarin', 'ace inhibitors', 'lithium', 'fluconazole'],
    foodInteractions: ['alcohol'],
    warnings: 'Increased cardiovascular risk. Monitor blood pressure.',
    contraindications: ['sulfa allergy', 'CABG surgery', 'active GI bleeding'],
    sideEffects: ['hypertension', 'edema', 'GI upset', 'cardiovascular events']
  },

  // More Psychiatric Medications
  escitalopram: {
    class: 'SSRI Antidepressant',
    interactions: ['mao inhibitors', 'warfarin', 'triptans', 'tramadol', 'nsaids'],
    foodInteractions: ['alcohol'],
    warnings: 'Serotonin syndrome risk. QT prolongation. Suicidal thoughts monitoring.',
    contraindications: ['mao inhibitor use', 'pimozide use'],
    sideEffects: ['nausea', 'insomnia', 'sexual dysfunction', 'fatigue']
  },
  venlafaxine: {
    class: 'SNRI Antidepressant',
    interactions: ['mao inhibitors', 'triptans', 'warfarin', 'aspirin', 'tramadol'],
    foodInteractions: ['alcohol'],
    warnings: 'Serotonin syndrome risk. Monitor blood pressure. Withdrawal symptoms.',
    contraindications: ['mao inhibitor use', 'uncontrolled hypertension'],
    sideEffects: ['nausea', 'hypertension', 'insomnia', 'sexual dysfunction']
  },
  lorazepam: {
    class: 'Benzodiazepine',
    interactions: ['opioids', 'alcohol', 'cns depressants', 'valproate'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of dependence. Respiratory depression with opioids. Avoid abrupt discontinuation.',
    contraindications: ['severe respiratory insufficiency', 'myasthenia gravis'],
    sideEffects: ['sedation', 'dependence', 'confusion', 'respiratory depression']
  },
  alprazolam: {
    class: 'Benzodiazepine',
    interactions: ['opioids', 'alcohol', 'ketoconazole', 'itraconazole', 'cns depressants'],
    foodInteractions: ['grapefruit juice', 'alcohol'],
    warnings: 'High abuse potential. Severe withdrawal. Respiratory depression with opioids.',
    contraindications: ['narrow-angle glaucoma', 'ketoconazole use'],
    sideEffects: ['sedation', 'dependence', 'memory impairment', 'confusion']
  },
  quetiapine: {
    class: 'Atypical Antipsychotic',
    interactions: ['cns depressants', 'antihypertensives', 'azole antifungals', 'erythromycin'],
    foodInteractions: ['alcohol', 'grapefruit juice'],
    warnings: 'QT prolongation. Weight gain. Metabolic syndrome. Orthostatic hypotension.',
    contraindications: ['dementia-related psychosis'],
    sideEffects: ['sedation', 'weight gain', 'hyperglycemia', 'orthostatic hypotension']
  },

  // Anticoagulants/Antiplatelets
  apixaban: {
    class: 'Direct Oral Anticoagulant (DOAC)',
    interactions: ['aspirin', 'nsaids', 'other anticoagulants', 'ketoconazole', 'rifampin'],
    foodInteractions: [],
    warnings: 'Bleeding risk. No routine monitoring needed. Avoid in severe liver disease.',
    contraindications: ['active bleeding', 'severe liver disease', 'mechanical heart valve'],
    sideEffects: ['bleeding', 'anemia', 'nausea', 'bruising']
  },
  rivaroxaban: {
    class: 'Direct Oral Anticoagulant (DOAC)',
    interactions: ['aspirin', 'nsaids', 'other anticoagulants', 'ketoconazole', 'rifampin'],
    foodInteractions: [],
    warnings: 'Take 15mg and 20mg doses with food. Bleeding risk. Renal dose adjustment.',
    contraindications: ['active bleeding', 'severe renal impairment'],
    sideEffects: ['bleeding', 'anemia', 'nausea']
  },
  enoxaparin: {
    class: 'Low Molecular Weight Heparin',
    interactions: ['anticoagulants', 'antiplatelets', 'nsaids'],
    foodInteractions: [],
    warnings: 'Monitor platelets. Bleeding risk. Renal dose adjustment.',
    contraindications: ['active bleeding', 'heparin-induced thrombocytopenia'],
    sideEffects: ['bleeding', 'thrombocytopenia', 'injection site reactions']
  },

  // Respiratory Medications
  montelukast: {
    class: 'Leukotriene Receptor Antagonist',
    interactions: ['phenobarbital', 'rifampin'],
    foodInteractions: [],
    warnings: 'Neuropsychiatric events reported. Monitor mood changes.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['headache', 'abdominal pain', 'neuropsychiatric events']
  },
  fluticasone: {
    class: 'Inhaled Corticosteroid',
    interactions: ['ketoconazole', 'ritonavir', 'itraconazole'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Rinse mouth after use to prevent thrush. Adrenal suppression with high doses.',
    contraindications: ['primary treatment of status asthmaticus'],
    sideEffects: ['thrush', 'hoarseness', 'cough', 'adrenal suppression']
  },
  budesonide: {
    class: 'Inhaled Corticosteroid',
    interactions: ['ketoconazole', 'itraconazole', 'clarithromycin'],
    foodInteractions: ['grapefruit juice'],
    warnings: 'Rinse mouth after use. Monitor growth in children.',
    contraindications: ['acute bronchospasm'],
    sideEffects: ['thrush', 'hoarseness', 'cough', 'growth suppression']
  },

  // Proton Pump Inhibitors
  esomeprazole: {
    class: 'Proton Pump Inhibitor',
    interactions: ['clopidogrel', 'warfarin', 'digoxin', 'ketoconazole', 'atazanavir'],
    foodInteractions: [],
    warnings: 'Long-term use increases fracture risk. C. diff risk. Monitor magnesium.',
    contraindications: ['hypersensitivity to PPIs'],
    sideEffects: ['headache', 'nausea', 'diarrhea', 'hypomagnesemia']
  },
  pantoprazole: {
    class: 'Proton Pump Inhibitor',
    interactions: ['warfarin', 'digoxin', 'ketoconazole', 'atazanavir'],
    foodInteractions: [],
    warnings: 'Long-term use risks include fractures and infections.',
    contraindications: ['hypersensitivity to PPIs'],
    sideEffects: ['headache', 'diarrhea', 'nausea', 'vitamin B12 deficiency']
  },

  // Antihistamines
  cetirizine: {
    class: 'Second Generation Antihistamine',
    interactions: ['cns depressants', 'alcohol'],
    foodInteractions: ['alcohol'],
    warnings: 'May cause drowsiness despite being second generation.',
    contraindications: ['severe renal impairment'],
    sideEffects: ['drowsiness', 'fatigue', 'dry mouth', 'headache']
  },
  loratadine: {
    class: 'Second Generation Antihistamine',
    interactions: ['ketoconazole', 'erythromycin', 'cimetidine'],
    foodInteractions: [],
    warnings: 'Minimal sedation. Safe in most patients.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['headache', 'drowsiness', 'fatigue', 'dry mouth']
  },
  diphenhydramine: {
    class: 'First Generation Antihistamine',
    interactions: ['mao inhibitors', 'cns depressants', 'anticholinergics'],
    foodInteractions: ['alcohol'],
    warnings: 'Significant sedation. Anticholinergic effects. Avoid in elderly.',
    contraindications: ['narrow-angle glaucoma', 'urinary retention'],
    sideEffects: ['sedation', 'dry mouth', 'urinary retention', 'confusion']
  },

  // Antifungals
  fluconazole: {
    class: 'Azole Antifungal',
    interactions: ['warfarin', 'statins', 'sulfonylureas', 'phenytoin', 'cyclosporine'],
    foodInteractions: [],
    warnings: 'QT prolongation. Hepatotoxicity. Multiple drug interactions.',
    contraindications: ['hypersensitivity', 'terfenadine use'],
    sideEffects: ['nausea', 'headache', 'rash', 'hepatotoxicity']
  },
  ketoconazole: {
    class: 'Azole Antifungal',
    interactions: ['statins', 'warfarin', 'cyclosporine', 'digoxin', 'rifampin'],
    foodInteractions: ['antacids', 'proton pump inhibitors'],
    warnings: 'Severe hepatotoxicity. QT prolongation. Many drug interactions.',
    contraindications: ['acute or chronic liver disease'],
    sideEffects: ['hepatotoxicity', 'nausea', 'QT prolongation', 'adrenal insufficiency']
  },

  // Antivirals
  acyclovir: {
    class: 'Antiviral',
    interactions: ['nephrotoxic drugs', 'probenecid'],
    foodInteractions: [],
    warnings: 'Maintain hydration. Adjust dose in renal impairment.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['nausea', 'headache', 'renal impairment', 'neurological effects']
  },
  oseltamivir: {
    class: 'Neuraminidase Inhibitor',
    interactions: ['live attenuated influenza vaccine'],
    foodInteractions: [],
    warnings: 'Start within 48 hours of symptom onset. Neuropsychiatric events reported.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['nausea', 'vomiting', 'headache', 'neuropsychiatric events']
  },

  // Muscle Relaxants
  cyclobenzaprine: {
    class: 'Muscle Relaxant',
    interactions: ['mao inhibitors', 'tramadol', 'ssris', 'cns depressants'],
    foodInteractions: ['alcohol'],
    warnings: 'Anticholinergic effects. Sedation. Avoid with MAOIs.',
    contraindications: ['mao inhibitor use', 'acute MI', 'hyperthyroidism'],
    sideEffects: ['drowsiness', 'dry mouth', 'dizziness', 'confusion']
  },
  baclofen: {
    class: 'Muscle Relaxant',
    interactions: ['cns depressants', 'tricyclic antidepressants'],
    foodInteractions: ['alcohol'],
    warnings: 'Do not discontinue abruptly. Risk of seizures with withdrawal.',
    contraindications: ['hypersensitivity'],
    sideEffects: ['drowsiness', 'weakness', 'dizziness', 'seizures on withdrawal']
  },

  // Corticosteroids
  hydrocortisone: {
    class: 'Corticosteroid',
    interactions: ['nsaids', 'warfarin', 'diabetes medications', 'vaccines'],
    foodInteractions: ['alcohol'],
    warnings: 'Do not stop abruptly. Monitor blood glucose and bone density.',
    contraindications: ['systemic fungal infections'],
    sideEffects: ['hyperglycemia', 'hypertension', 'immunosuppression', 'osteoporosis']
  },
  dexamethasone: {
    class: 'Corticosteroid',
    interactions: ['nsaids', 'warfarin', 'phenytoin', 'rifampin', 'vaccines'],
    foodInteractions: ['alcohol'],
    warnings: 'Potent corticosteroid. Monitor blood glucose. Avoid abrupt discontinuation.',
    contraindications: ['systemic fungal infections', 'live vaccines'],
    sideEffects: ['hyperglycemia', 'immunosuppression', 'mood changes', 'osteoporosis']
  },

  // Antiemetics
  ondansetron: {
    class: 'Serotonin 5-HT3 Receptor Antagonist',
    interactions: ['apomorphine', 'tramadol', 'ssris', 'qt prolonging drugs'],
    foodInteractions: [],
    warnings: 'QT prolongation risk. Avoid with apomorphine.',
    contraindications: ['concomitant apomorphine use'],
    sideEffects: ['headache', 'constipation', 'QT prolongation', 'dizziness']
  },
  metoclopramide: {
    class: 'Dopamine Antagonist',
    interactions: ['cns depressants', 'anticholinergics', 'mao inhibitors'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of tardive dyskinesia with long-term use. Avoid in GI obstruction.',
    contraindications: ['GI obstruction', 'pheochromocytoma', 'seizure disorders'],
    sideEffects: ['tardive dyskinesia', 'drowsiness', 'restlessness', 'depression']
  }
};

const COMMON_DRUGS = Object.keys(COMPREHENSIVE_DRUG_DATABASE);

// Medical Abbreviations Mapping
const MEDICAL_ABBREVIATIONS = {
  // Frequency abbreviations
  'od': 'Once daily',
  'once daily': 'Once daily',
  'qd': 'Once daily',
  'bd': 'Twice daily',
  'bid': 'Twice daily', 
  'twice daily': 'Twice daily',
  'tds': 'Three times daily',
  'tid': 'Three times daily',
  'three times daily': 'Three times daily',
  'qds': 'Four times daily',
  'qid': 'Four times daily',
  'four times daily': 'Four times daily',
  'prn': 'As needed',
  'as needed': 'As needed',
  'hs': 'At bedtime',
  'at bedtime': 'At bedtime',
  'q4h': 'Every 4 hours',
  'q6h': 'Every 6 hours',
  'q8h': 'Every 8 hours',
  'q12h': 'Every 12 hours',
  
  // Route abbreviations
  'po': 'Oral',
  'oral': 'Oral',
  'by mouth': 'Oral',
  'iv': 'Intravenous',
  'intravenous': 'Intravenous',
  'im': 'Intramuscular',
  'intramuscular': 'Intramuscular',
  'sc': 'Subcutaneous',
  'sq': 'Subcutaneous',
  'subcutaneous': 'Subcutaneous',
  'sl': 'Sublingual',
  'sublingual': 'Sublingual',
  'pr': 'Rectal',
  'rectal': 'Rectal',
  'pv': 'Vaginal',
  'vaginal': 'Vaginal',
  'topical': 'Topical',
  'ng': 'Nasogastric',
  'nasogastric': 'Nasogastric',
  'inhaled': 'Inhalation',
  'inhalation': 'Inhalation',
  
  // Food timing abbreviations
  'ac': 'Before meals',
  'before meals': 'Before meals',
  'pc': 'After meals'
};

// Comprehensive Drug Interaction Database (CIMS/MedRA Style)
const DRUG_INTERACTIONS = {
  // ACE Inhibitors
  'lisinopril': {
    'potassium': { severity: 'major', description: 'Risk of hyperkalemia' },
    'lithium': { severity: 'major', description: 'Increased lithium levels' },
    'nsaids': { severity: 'moderate', description: 'Reduced antihypertensive effect' },
    'alcohol': { severity: 'moderate', description: 'Enhanced hypotensive effect' }
  },
  'enalapril': {
    'potassium': { severity: 'major', description: 'Risk of hyperkalemia' },
    'lithium': { severity: 'major', description: 'Increased lithium levels' }
  },
  
  // Beta Blockers
  'metoprolol': {
    'verapamil': { severity: 'major', description: 'Risk of severe bradycardia and heart block' },
    'insulin': { severity: 'moderate', description: 'May mask hypoglycemic symptoms' },
    'alcohol': { severity: 'moderate', description: 'Enhanced hypotensive effect' }
  },
  'atenolol': {
    'verapamil': { severity: 'major', description: 'Risk of severe bradycardia' },
    'clonidine': { severity: 'major', description: 'Rebound hypertension on withdrawal' }
  },
  
  // Calcium Channel Blockers
  'amlodipine': {
    'simvastatin': { severity: 'moderate', description: 'Increased risk of myopathy' },
    'grapefruit': { severity: 'moderate', description: 'Increased drug levels' },
    'alcohol': { severity: 'moderate', description: 'Enhanced hypotensive effect' }
  },
  'verapamil': {
    'digoxin': { severity: 'major', description: 'Increased digoxin levels' },
    'metoprolol': { severity: 'major', description: 'Risk of severe bradycardia' },
    'grapefruit': { severity: 'major', description: 'Significantly increased drug levels' }
  },
  
  // Antibiotics
  'amoxicillin': {
    'warfarin': { severity: 'moderate', description: 'Enhanced anticoagulant effect' },
    'methotrexate': { severity: 'major', description: 'Increased methotrexate toxicity' },
    'alcohol': { severity: 'mild', description: 'May reduce effectiveness' }
  },
  'azithromycin': {
    'warfarin': { severity: 'moderate', description: 'Enhanced anticoagulant effect' },
    'digoxin': { severity: 'moderate', description: 'Increased digoxin levels' },
    'antacids': { severity: 'moderate', description: 'Reduced absorption' }
  },
  'ciprofloxacin': {
    'theophylline': { severity: 'major', description: 'Increased theophylline levels and toxicity' },
    'warfarin': { severity: 'major', description: 'Enhanced anticoagulant effect' },
    'caffeine': { severity: 'moderate', description: 'Increased caffeine levels' },
    'dairy': { severity: 'moderate', description: 'Reduced absorption with calcium' }
  },
  
  // Anticoagulants
  'warfarin': {
    'aspirin': { severity: 'major', description: 'Increased bleeding risk' },
    'amoxicillin': { severity: 'moderate', description: 'Enhanced anticoagulant effect' },
    'paracetamol': { severity: 'moderate', description: 'Enhanced anticoagulant effect with high doses' },
    'alcohol': { severity: 'major', description: 'Increased bleeding risk' },
    'cranberry': { severity: 'moderate', description: 'Enhanced anticoagulant effect' },
    'vitamin_k': { severity: 'major', description: 'Antagonizes anticoagulant effect' }
  },
  
  // NSAIDs
  'aspirin': {
    'warfarin': { severity: 'major', description: 'Increased bleeding risk' },
    'methotrexate': { severity: 'major', description: 'Increased methotrexate toxicity' },
    'lisinopril': { severity: 'moderate', description: 'Reduced antihypertensive effect' },
    'alcohol': { severity: 'major', description: 'Increased GI bleeding risk' }
  },
  'ibuprofen': {
    'warfarin': { severity: 'major', description: 'Increased bleeding risk' },
    'lithium': { severity: 'major', description: 'Increased lithium levels' },
    'methotrexate': { severity: 'major', description: 'Increased methotrexate toxicity' },
    'lisinopril': { severity: 'moderate', description: 'Reduced antihypertensive effect' }
  },
  
  // Diabetes Medications
  'metformin': {
    'alcohol': { severity: 'major', description: 'Increased risk of lactic acidosis' },
    'contrast_dye': { severity: 'major', description: 'Risk of lactic acidosis' }
  },
  'insulin': {
    'alcohol': { severity: 'major', description: 'Risk of severe hypoglycemia' },
    'metoprolol': { severity: 'moderate', description: 'May mask hypoglycemic symptoms' }
  },
  'glipizide': {
    'alcohol': { severity: 'major', description: 'Risk of hypoglycemia' },
    'fluconazole': { severity: 'moderate', description: 'Increased hypoglycemic risk' }
  },
  
  // Statins
  'simvastatin': {
    'amlodipine': { severity: 'moderate', description: 'Increased risk of myopathy' },
    'grapefruit': { severity: 'major', description: 'Significantly increased drug levels and myopathy risk' },
    'gemfibrozil': { severity: 'major', description: 'Severe myopathy and rhabdomyolysis risk' }
  },
  'atorvastatin': {
    'grapefruit': { severity: 'moderate', description: 'Increased drug levels' },
    'gemfibrozil': { severity: 'major', description: 'Increased myopathy risk' }
  },
  
  // Analgesics
  'paracetamol': {
    'warfarin': { severity: 'moderate', description: 'Enhanced anticoagulant effect with high doses' },
    'alcohol': { severity: 'major', description: 'Increased hepatotoxicity risk' }
  },
  'tramadol': {
    'sertraline': { severity: 'major', description: 'Increased serotonin syndrome risk' },
    'alcohol': { severity: 'major', description: 'Enhanced CNS depression' }
  },
  
  // Antidepressants
  'sertraline': {
    'tramadol': { severity: 'major', description: 'Serotonin syndrome risk' },
    'warfarin': { severity: 'moderate', description: 'Enhanced anticoagulant effect' },
    'alcohol': { severity: 'major', description: 'Enhanced CNS effects' }
  },
  'fluoxetine': {
    'tramadol': { severity: 'major', description: 'Serotonin syndrome risk' },
    'warfarin': { severity: 'major', description: 'Enhanced anticoagulant effect' }
  }
};

// Food-Drug Interaction Database
const FOOD_DRUG_INTERACTIONS = {
  'warfarin': ['vitamin_k', 'cranberry', 'alcohol', 'grapefruit'],
  'simvastatin': ['grapefruit', 'alcohol'],
  'atorvastatin': ['grapefruit'],
  'verapamil': ['grapefruit'],
  'amlodipine': ['grapefruit', 'alcohol'],
  'ciprofloxacin': ['dairy', 'caffeine'],
  'metformin': ['alcohol'],
  'insulin': ['alcohol'],
  'glipizide': ['alcohol'],
  'aspirin': ['alcohol'],
  'ibuprofen': ['alcohol'],
  'paracetamol': ['alcohol'],
  'tramadol': ['alcohol'],
  'sertraline': ['alcohol'],
  'lisinopril': ['alcohol'],
  'metoprolol': ['alcohol']
};

// Recent Patients Component
const RecentPatientsComponent = ({ authToken, onPatientSelect, selectedPatientMRN }) => {
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/search-patients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ search_term: '' }), // Empty search gets all patients
        });

        if (response.ok) {
          const data = await response.json();
          setRecentPatients(data.patients.slice(0, 6)); // Show last 6 patients
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchPatients();
    }
  }, [authToken]);

  if (loading) {
    return <div className="text-slate-400 text-center py-4">Loading recent patients...</div>;
  }

  if (recentPatients.length === 0) {
    return (
      <div className="text-center py-6">
        <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">No recent patients yet</p>
        <p className="text-slate-500 text-sm">Save your first patient to see them here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recentPatients.map((patient) => (
        <div 
          key={patient.mrn} 
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedPatientMRN === patient.mrn 
              ? 'bg-green-500/20 border-green-500/50' 
              : 'bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/40'
          }`}
          onClick={() => onPatientSelect(patient)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-white text-sm">{patient.patient_info?.name}</h4>
            {selectedPatientMRN === patient.mrn && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className="text-slate-400 text-xs mb-1">MRN: {patient.mrn}</p>
          <p className="text-slate-400 text-xs mb-1">
            {patient.patient_info?.age}yr, {patient.patient_info?.gender}
          </p>
          <p className="text-slate-400 text-xs">
            Visits: {patient.total_visits} | Last: {new Date(patient.latest_visit_date).toLocaleDateString()}
          </p>
        </div>
      ))}
      
      <div 
        className="p-4 rounded-lg border border-dashed border-slate-500/50 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col items-center justify-center text-center min-h-[100px]"
        onClick={() => {
          // Clear form for new patient
          window.location.reload(); // Simple way to reset form
        }}
      >
        <Plus className="w-6 h-6 text-slate-400 mb-2" />
        <span className="text-slate-400 text-sm font-medium">New Patient</span>
        <span className="text-slate-500 text-xs">Start fresh</span>
      </div>
    </div>
  );
};
// Quick Template Loader Component
const QuickTemplateLoader = ({ diagnosis, authToken, onLoadTemplate }) => {
  const [matchingTemplates, setMatchingTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchingTemplates = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ disease_condition: diagnosis }),
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both direct templates array and StandardResponse format
          const templates = data.templates || data.data?.templates || [];
          setMatchingTemplates(templates.slice(0, 3)); // Show top 3 matches
        } else {
          console.error('Template search failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authToken && diagnosis) {
      fetchMatchingTemplates();
    }
  }, [authToken, diagnosis]);

  if (loading) {
    return <div className="text-orange-400 text-sm">Searching templates for "{diagnosis}"...</div>;
  }

  if (matchingTemplates.length === 0) {
    return (
      <div className="text-orange-400 text-sm">
        No templates found for "{diagnosis}". You can create one!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-orange-300 text-sm font-medium">Found {matchingTemplates.length} template(s) for "{diagnosis}":</p>
      {matchingTemplates.map((template) => (
        <div key={template._id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
          <div>
            <span className="text-white font-medium text-sm">{template.name}</span>
            <span className="text-orange-400 text-xs ml-2">({template.medications.length} meds)</span>
          </div>
          <button
            onClick={() => onLoadTemplate(template._id)}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs transition-all"
          >
            Load
          </button>
        </div>
      ))}
    </div>
  );
};

// Formulation types
const FORMULATION_TYPES = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 
  'Drops', 'Inhaler', 'Patch', 'Gel', 'Lotion', 'Powder', 'Solution', 
  'Suppository', 'Spray', 'Film', 'Granules'
];

// Route options
const ROUTE_OPTIONS = [
  'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 
  'Sublingual', 'Rectal', 'Vaginal', 'Inhalation', 'Nasogastric', 
  'Intradermal', 'Transdermal', 'Ophthalmic', 'Otic', 'Nasal'
];

// Food instruction options
const FOOD_INSTRUCTIONS = [
  'Before meals', 'After meals', 'With food', 'Without food', 
  'On empty stomach', 'Before breakfast', 'After breakfast',
  'Before lunch', 'After lunch', 'Before dinner', 'After dinner'
];

const Shrutapex = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    degree: '',
    registrationNumber: '',
    organization: '',
    email: '',
    phone: '',
    specialization: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [authToken, setAuthToken] = useState(localStorage.getItem('shrutapex_token'));
  
  // Doctor profile state
  const [doctorProfile, setDoctorProfile] = useState({
    name: '',
    degree: '',
    registrationNumber: '',
    organization: '',
    username: '',
    password: ''
  });

  // Existing state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([]);
  const [prognosis, setPrognosis] = useState('');
  const [interactions, setInteractions] = useState([]);
  const [currentView, setCurrentView] = useState('login');
  
  // Enhanced patient information
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [patientHeight, setPatientHeight] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientBP, setPatientBP] = useState('');
  const [patientId, setPatientId] = useState('');
  
  // Medical history
  const [allergies, setAllergies] = useState('');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [pastMedications, setPastMedications] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [smokingStatus, setSmokingStatus] = useState('');
  const [alcoholUse, setAlcoholUse] = useState('');
  const [drugUse, setDrugUse] = useState('');
  const [exerciseLevel, setExerciseLevel] = useState('');
  
  // Vitals
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  
  // EHR integration
  const [showEHRImport, setShowEHRImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEHRConfig, setShowEHRConfig] = useState(false);
  const [ehrSystem, setEhrSystem] = useState('');
  const [ehrApiKey, setEhrApiKey] = useState('');
  const [ehrEndpoint, setEhrEndpoint] = useState('');
  const [isEhrConnected, setIsEhrConnected] = useState(false);
  const [ehrProviders, setEhrProviders] = useState([]);
  const [ehrConfigurations, setEhrConfigurations] = useState([]);
  const [selectedEhrProvider, setSelectedEhrProvider] = useState('');
  const [ehrConnectionStatus, setEhrConnectionStatus] = useState('disconnected');
  const [ehrSubmissions, setEhrSubmissions] = useState([]);
  const [isSubmittingToEHR, setIsSubmittingToEHR] = useState(false);
  const [ehrConfigData, setEhrConfigData] = useState({
    provider: '',
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    scope: 'patient/*.read patient/*.write',
    useOauth: true,
    apiKey: '',
    organizationId: '',
    facilityId: '',
    timeout: 30,
    verifySsl: true
  });

  // Enhanced Speech Recognition Settings
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [speechQuality, setSpeechQuality] = useState('high');
  const [enableNoiseReduction, setEnableNoiseReduction] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [showSpeechSettings, setShowSpeechSettings] = useState(false);
  
  // Medication recognition feedback
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [lastCorrectedMeds, setLastCorrectedMeds] = useState([]);
  
  // Manual correction and learning system
  const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [userCorrections, setUserCorrections] = useState([]);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [dynamicMedicationDB, setDynamicMedicationDB] = useState({});

  
  // Medical Documentation Fields
  const [labTests, setLabTests] = useState('');
  const [referrals, setReferrals] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  // Patient Storage System
  const [showPatientStorage, setShowPatientStorage] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [savedPatients, setSavedPatients] = useState([]);
  const [searchPatientCode, setSearchPatientCode] = useState('');
  const [showSavePatientDialog, setShowSavePatientDialog] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  // NEW Patient Management System
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPatientMRN, setCurrentPatientMRN] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [showNewVsExisting, setShowNewVsExisting] = useState(false);

  // Medication Templates System  
  const [showMedicationTemplates, setShowMedicationTemplates] = useState(false);
  const [medicationTemplates, setMedicationTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    disease_condition: '',
    description: '',
    is_public: false
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  // Enhanced template creation state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    disease_condition: '',
    custom_disease: '',
    medications: [],
    description: '',
    is_public: false
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    form: '',
    route: 'Oral',
    frequency: '',
    duration: '',
    foodInstruction: 'With or without food',
    instructions: ''
  });
  
  
  // Helper function to detect medical terms
  const isMedicalTerm = (text) => {
    const lowerText = text.toLowerCase();
    const medicalKeywords = [
      'mg', 'ml', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
      'hypertension', 'diabetes', 'asthma', 'fever', 'pain', 'infection',
      'blood', 'pressure', 'sugar', 'cholesterol', 'heart', 'kidney', 'liver',
      'diagnosis', 'symptoms', 'treatment', 'prescription', 'medication'
    ];
    
    return medicalKeywords.some(keyword => lowerText.includes(keyword)) ||
           Object.keys(MEDICATION_DATABASE).some(med => 
             calculateSimilarity(lowerText, med) > 0.6
           );
  };
  const recognitionRef = useRef(null);
  const [supportStatus, setSupportStatus] = useState('checking');

  // Demo doctors for testing (In production, this would be stored in database)
  const DEMO_DOCTORS = [
    {
      username: 'drsmith',
      password: 'password123',
      name: 'Dr. John Smith',
      degree: 'MBBS, MD (Internal Medicine)',
      registrationNumber: 'MED12345',
      organization: 'City General Hospital',
      email: 'john.smith@hospital.com',
      phone: '+1-555-0101',
      specialization: 'Internal Medicine'
    },
    {
      username: 'drjohnson',
      password: 'password123', 
      name: 'Dr. Sarah Johnson',
      degree: 'MBBS, MS (Surgery)',
      registrationNumber: 'MED67890',
      organization: 'Metropolitan Medical Center',
      email: 'sarah.johnson@medcenter.com',
      phone: '+1-555-0102',
      specialization: 'General Surgery'
    }
  ];

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '/api';
  
  // API Helper Functions
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    // Remove /api prefix if it already exists in endpoint to avoid double prefix
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = API_BASE_URL === '/api' ? cleanEndpoint : `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add auth token if available
    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add body for POST/PUT requests
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.detail || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error(`API Error (${method} ${url}):`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupportStatus('supported');
        recognitionRef.current = new SpeechRecognition();
        
        // Enhanced speech recognition configuration
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = speechLanguage;
        recognitionRef.current.maxAlternatives = 5; // Get more alternatives for better accuracy
        
        // Improve recognition quality based on settings
        if (speechQuality === 'high') {
          recognitionRef.current.serviceURI = undefined; // Use default high-quality service
        }
        
        // Add grammars for medical terms if supported
        try {
          if (recognitionRef.current.grammars) {
            const grammar = '#JSGF V1.0; grammar medications; public <medication> = ' + 
              Object.keys(MEDICATION_DATABASE).join(' | ') + ';';
            const speechRecognitionList = new window.webkitSpeechGrammarList();
            speechRecognitionList.addFromString(grammar, 1);
            recognitionRef.current.grammars = speechRecognitionList;
          }
        } catch (e) {
          console.log('Grammar not supported, using default recognition');
        }

        // Setup event handlers using the new function
        setupSpeechRecognitionHandlers();
      } else {
        setSupportStatus('not-supported');
        console.log('Speech recognition not available in this browser');
      }
    }
  }, [isListening]);

  // Check for existing token on component mount
  useEffect(() => {
    if (authToken) {
      // Verify token and get user info
      apiCall('/api/auth/me')
        .then(user => {
          setCurrentDoctor(user);
          setIsLoggedIn(true);
          setCurrentView('input');
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('shrutapex_token');
          setAuthToken(null);
        });
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await apiCall('/api/auth/login', 'POST', {
        username: loginCredentials.username,
        password: loginCredentials.password
      });

      // Store token and user data
      localStorage.setItem('shrutapex_token', response.access_token);
      setAuthToken(response.access_token);
      setCurrentDoctor(response.user);
      setIsLoggedIn(true);
      setCurrentView('input');
      
      alert(`Welcome, ${response.user.name}!`);
      
      // Clear login form
      setLoginCredentials({ username: '', password: '' });
      
    } catch (error) {
      console.error('Login failed:', error);
      alert(`Login failed: ${error.message}\n\nTry demo accounts:\n• drsmith / password123\n• drjohnson / password123\n\nOr create a new account.`);
    }
  };

  const handleRegistration = async () => {
    // Validation
    if (!registrationData.name || !registrationData.degree || !registrationData.registrationNumber || 
        !registrationData.organization || !registrationData.username || !registrationData.password) {
      alert('Please fill in all required fields.');
      return;
    }

    if (registrationData.password !== registrationData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (registrationData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      // Prepare registration data for API
      const registrationPayload = {
        name: registrationData.name,
        degree: registrationData.degree,
        registration_number: registrationData.registrationNumber,
        organization: registrationData.organization,
        email: registrationData.email || null,
        phone: registrationData.phone || null,
        specialization: registrationData.specialization || null,
        username: registrationData.username,
        password: registrationData.password
      };

      const response = await apiCall('/api/auth/register', 'POST', registrationPayload);
      
      alert(`Account created successfully!\n\nWelcome to Shrutapex!\nYou can now login with your credentials.`);
      setShowRegistration(false);
      
      // Reset registration form
      setRegistrationData({
        name: '', degree: '', registrationNumber: '', organization: '', 
        email: '', phone: '', specialization: '', username: '', password: '', confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Registration failed:', error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await apiCall('/api/auth/logout', 'POST');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API fails
    }
    
    // Clear local storage and state
    localStorage.removeItem('shrutapex_token');
    setAuthToken(null);
    setIsLoggedIn(false);
    setCurrentDoctor(null);
    setCurrentView('login');
    
    // Reset all forms
    resetAllFields();
  };

  const resetAllFields = () => {
    setTranscript('');
    setDiagnosis('');
    setMedications([]);
    setPrognosis('');
    setInteractions([]);
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setPatientHeight('');
    setPatientWeight('');
    setPatientBP('');
    setPatientId('');
    setAllergies('');
    setPastMedicalHistory('');
    setPastMedications('');
    setFamilyHistory('');
    setSmokingStatus('');
    setAlcoholUse('');
    setDrugUse('');
    setExerciseLevel('');
    setTemperature('');
    setHeartRate('');
    setRespiratoryRate('');
    setOxygenSaturation('');
  };

  const expandAbbreviation = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    
    const words = text.toLowerCase().split(/\s+/);
    const expandedWords = words.map(word => {
      // Remove punctuation for matching
      const cleanWord = word.replace(/[^\w]/g, '');
      return MEDICAL_ABBREVIATIONS[cleanWord] || word;
    });
    return expandedWords.join(' ');
  };

  const extractMedicationsFromText = (text) => {
    const medications = [];
    const lowerText = text.toLowerCase();
    
    console.log('Extracting medications from text:', text);
    
    // First, extract only text after "new prescription:" or "prescribe" keywords to avoid picking up "currently taking" medications
    let prescriptionText = text;
    const prescriptionMarkers = ['new prescription:', 'prescribe', 'start on', 'treatment plan:'];
    const avoidMarkers = ['currently taking', 'previous medications', 'past medications', 'current medications'];
    
    // Find if there's a prescription marker
    let prescriptionStartIndex = -1;
    prescriptionMarkers.forEach(marker => {
      const index = text.toLowerCase().indexOf(marker);
      if (index !== -1 && (prescriptionStartIndex === -1 || index < prescriptionStartIndex)) {
        prescriptionStartIndex = index;
      }
    });
    
    // If prescription marker found, only use text after it
    if (prescriptionStartIndex !== -1) {
      prescriptionText = text.substring(prescriptionStartIndex);
      console.log('Extracting medications from prescription section only');
    }
    
    // Enhanced pattern matching for medications with all details
    const medicationPatterns = [
      // Pattern: drug name dosage unit formulation route frequency food_instruction
      /(?:prescribe|give|start|administer|needs?|prescribed?|new prescription:|treatment plan:)\s*(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?|iu)\s+(?:as\s+)?(\w+)?\s*(?:via\s+|through\s+|by\s+)?(\w+)?\s+(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn|q\d+h|every \d+ hours)\s*(?:ac|pc|before meals|after meals|with food|without food|on empty stomach)?/gi,
      // Pattern with tablet/capsule between dosage and route
      /(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?)\s+(?:tablet|capsule|injection|syrup|drops?)\s+(\w+)\s+(once daily|twice daily|three times daily|four times daily|od|bd|tds|qds|as needed|prn)/gi,
      // Simpler pattern: drug dosage frequency
      /(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?)\s+(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn)/gi
    ];

    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(prescriptionText)) !== null) {
        const [fullMatch, drugName, dosage, unit, formulation, route, frequency, foodInstruction] = match;
        
        // Validate that drugName is actually a medication, not a unit or frequency
        const excludeWords = [
          'milligrams', 'mg', 'mcg', 'grams', 'ml', 'units', 'iu',
          'once', 'twice', 'daily', 'od', 'bd', 'tds', 'qds',
          'tablet', 'capsule', 'injection', 'syrup', 'drops',
          'oral', 'before', 'after', 'with', 'without', 'food',
          'prescribed', 'prescribe', 'give', 'take', 'patient'
        ];
        
        if (drugName && !excludeWords.includes(drugName.toLowerCase())) {
          // Check if it's a real medication name
          const isValidMedication = Object.keys(dynamicMedicationDB).some(medName => 
            medName.toLowerCase() === drugName.toLowerCase() || 
            calculateSimilarity(drugName.toLowerCase(), medName.toLowerCase()) > 0.8
          );
          
          if (isValidMedication || drugName.length > 6) { // Allow longer words that might be medications
            medications.push({
              name: drugName.toUpperCase(), // CAPITALIZE medicine names
              dosage: `${dosage}${unit}`,
              formulation: formulation ? (formulation.charAt(0).toUpperCase() + formulation.slice(1).toLowerCase()) : 'Tablet',
              route: expandAbbreviation(route || 'oral'),
              frequency: expandAbbreviation(frequency),
              foodInstruction: expandAbbreviation(foodInstruction || 'with food'),
              duration: '30 days' // Default duration
            });
            
            console.log(`Valid medication extracted: ${drugName}`);
          } else {
            console.log(`Rejected non-medication word: ${drugName}`);
          }
        }
      }
    });

    // Enhanced fallback using comprehensive medication database with proper filtering
    if (medications.length === 0) {
      // Define words that should NOT be considered medication names
      const excludeWords = [
        'milligrams', 'mg', 'mcg', 'grams', 'ml', 'units', 'iu',
        'once', 'twice', 'daily', 'od', 'bd', 'tds', 'qds', 
        'tablet', 'capsule', 'injection', 'syrup', 'drops',
        'oral', 'before', 'after', 'with', 'without', 'food',
        'morning', 'evening', 'night', 'bedtime', 'meals',
        'prescribed', 'prescribe', 'give', 'take', 'patient',
        'suffering', 'migraine', 'headache', 'pain', 'fever'
      ];
      
      const lowerPrescriptionText = prescriptionText.toLowerCase();
      
      Object.keys(dynamicMedicationDB).forEach(medName => {
        if (lowerPrescriptionText.includes(medName) && !excludeWords.includes(medName.toLowerCase())) {
          console.log(`Found valid medication: ${medName} in prescription text`);
          
          // Look for dosage, frequency, and route patterns in prescription text only
          const dosagePattern = new RegExp(`${medName}\\s+(\\d+\\.?\\d*)\\s?(mg|mcg|g|ml|units?)`, 'i');
          const frequencyPattern = new RegExp(`${medName}.*?(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn)`, 'i');
          const routePattern = new RegExp(`${medName}.*?(oral|iv|im|sc|topical|sublingual|by mouth|intravenous)`, 'i');
          
          const dosageMatch = dosagePattern.exec(prescriptionText);
          const frequencyMatch = frequencyPattern.exec(prescriptionText);
          const routeMatch = routePattern.exec(prescriptionText);
          
          medications.push({
            name: medName.toUpperCase(), // CAPITALIZE medicine names
            dosage: dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '25mg',
            formulation: 'Tablet',
            route: expandAbbreviation(routeMatch ? routeMatch[1] : 'oral'),
            frequency: expandAbbreviation(frequencyMatch ? frequencyMatch[1] : 'twice daily'),
            foodInstruction: 'With food',
            duration: '30 days'
          });
        }
      });
    }
    
    // Additional smart detection for medication patterns - only if no medications found yet
    if (medications.length === 0) {
      // Look for any word followed by dosage pattern, but be very selective
      const genericMedicationPattern = /(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?)\s+(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn)/gi;
      let match;
      while ((match = genericMedicationPattern.exec(prescriptionText)) !== null) {
        const [fullMatch, drugName, dosage, unit, frequency] = match;
        
        // Strict filtering - only allow if it matches known medications
        const possibleMed = Object.keys(dynamicMedicationDB).find(med => 
          calculateSimilarity(drugName.toLowerCase(), med) > 0.7
        );
        
        // Additional check - exclude common non-medication words
        const commonWords = ['patient', 'prescribed', 'give', 'take', 'before', 'after', 'with', 'without'];
        
        if (possibleMed && !commonWords.includes(drugName.toLowerCase())) {
          medications.push({
            name: possibleMed.toUpperCase(), // CAPITALIZE medicine names
            dosage: `${dosage}${unit}`,
            formulation: 'Tablet',
            route: 'Oral',
            frequency: expandAbbreviation(frequency),
            foodInstruction: 'With food',
            duration: '30 days'
          });
          
          console.log(`Smart detection: "${drugName}" -> "${possibleMed}"`);
        } else {
          console.log(`Rejected generic pattern: "${drugName}" (not a valid medication)`);
        }
      }
    }

    return medications;
  };

  const processTranscript = (text) => {
    if (!text.trim()) return;

    console.log('Processing transcript:', text);

    // Apply medication corrections first
    const cleanedText = cleanTranscript(text);
    const correctedText = correctMedicalTerms(cleanedText);
    
    // Show medication corrections if any were made
    if (cleanedText !== correctedText) {
      const corrections = findMedicationCorrections(cleanedText, correctedText);
      if (corrections.length > 0) {
        setLastCorrectedMeds(corrections);
        setMedicationSuggestions(prev => [...corrections, ...prev.slice(0, 4)]);
        console.log('Medication corrections applied during processing:', corrections);
      }
    }

    const lowerText = correctedText.toLowerCase();
    
    // Update transcript with corrected version if changes were made
    if (text !== correctedText) {
      setTranscript(correctedText);
    }

    // Extract information using trigger words
    const extractedInfo = extractInformationByTriggers(correctedText);
    console.log('Extracted information:', extractedInfo);

    // Populate fields based on trigger word extraction
    if (extractedInfo.diagnosis.length > 0) {
      const diagnosisText = extractedInfo.diagnosis.join(', ');
      setDiagnosis(prev => prev ? `${prev}, ${diagnosisText}` : diagnosisText);
      console.log('Diagnosis updated:', diagnosisText);
    }

    if (extractedInfo.prognosis.length > 0) {
      const prognosisText = extractedInfo.prognosis.join(', ');
      setPrognosis(prev => prev ? `${prev}, ${prognosisText}` : prognosisText);
      console.log('Prognosis updated:', prognosisText);
    }

    if (extractedInfo.familyHistory.length > 0) {
      const familyHistoryText = extractedInfo.familyHistory.join(', ');
      setFamilyHistory(prev => prev ? `${prev}, ${familyHistoryText}` : familyHistoryText);
      console.log('Family history updated:', familyHistoryText);
    }

    if (extractedInfo.allergies.length > 0) {
      const allergiesText = extractedInfo.allergies.join(', ');
      setAllergies(prev => prev ? `${prev}, ${allergiesText}` : allergiesText);
      console.log('Allergies updated:', allergiesText);
    }

    // Extract past medical history
    if (extractedInfo.pastMedicalHistory.length > 0) {
      const pastMedHistoryText = extractedInfo.pastMedicalHistory.join(', ');
      setPastMedicalHistory(prev => prev ? `${prev}, ${pastMedHistoryText}` : pastMedHistoryText);
      console.log('Past medical history updated:', pastMedHistoryText);
    }

    // Extract past medications/surgeries
    if (extractedInfo.pastMedications.length > 0) {
      const pastMedsText = extractedInfo.pastMedications.join(', ');
      setPastMedications(prev => prev ? `${prev}, ${pastMedsText}` : pastMedsText);
      console.log('Past medications updated:', pastMedsText);
    }

    if (extractedInfo.socialHistory.length > 0) {
      const socialHistoryText = extractedInfo.socialHistory.join(', ');
      // Update social history fields based on content
      extractedInfo.socialHistory.forEach(item => {
        if (item.includes('smok')) {
          setSmokingStatus(item);
        } else if (item.includes('drink') || item.includes('alcohol')) {
          setAlcoholConsumption(item);
        } else if (item.includes('exercis') || item.includes('physical')) {
          setExerciseFrequency(item);
        }
      });
      console.log('Social history updated:', socialHistoryText);
    }

    // Extract vitals information
    if (extractedInfo.vitals.length > 0) {
      extractedInfo.vitals.forEach(vital => {
        if (vital.match(/\d+\/\d+/) || vital.includes('blood pressure') || vital.includes('bp')) {
          const bpMatch = vital.match(/(\d+)\/(\d+)/);
          if (bpMatch) {
            setPatientBP(`${bpMatch[1]}/${bpMatch[2]}`);
          }
        } else if (vital.includes('heart rate') || vital.includes('hr') || vital.includes('bpm')) {
          const hrMatch = vital.match(/(\d+)/);
          if (hrMatch) {
            setHeartRate(hrMatch[1]);
          }
        } else if (vital.includes('temperature') || vital.includes('temp')) {
          const tempMatch = vital.match(/(\d+\.?\d*)/);
          if (tempMatch) {
            setTemperature(tempMatch[1]);
          }
        }
      });
    }

    // DISABLED: Extract medications from trigger words - causes false positives
    // Medications are now ONLY extracted by extractMedicationsFromText function
    // which has better context filtering (line 1812)
    /*if (extractedInfo.medications.length > 0) {
      const medicationTexts = extractedInfo.medications;
      const extractedMeds = [];
      
      medicationTexts.forEach(medText => {
        // This was extracting "once daily" and "after meals" as medicines
        // Disabled in favor of extractMedicationsFromText
      });
      
      if (extractedMeds.length > 0) {
        setMedications(prev => [...prev, ...extractedMeds]);
      }
    }*/
    
    // Extract diagnosis (fallback to original pattern matching)
    let extractedDiagnosis = '';
    if (lowerText.includes('diabetes') || lowerText.includes('diabetic')) {
      extractedDiagnosis = 'Type 2 Diabetes Mellitus';
    } else if (lowerText.includes('hypertension') || lowerText.includes('high blood pressure')) {
      extractedDiagnosis = 'Essential Hypertension';
    } else if (lowerText.includes('infection') || lowerText.includes('fever')) {
      extractedDiagnosis = 'Upper Respiratory Tract Infection';
    } else if (lowerText.includes('asthma')) {
      extractedDiagnosis = 'Bronchial Asthma';
    } else {
      extractedDiagnosis = 'Clinical assessment pending';
    }
    setDiagnosis(extractedDiagnosis);

    // Extract medications with enhanced parsing from corrected text
    const extractedMeds = extractMedicationsFromText(correctedText);
    setMedications(extractedMeds);
    
    console.log('Medications extracted from corrected text:', extractedMeds);

    // Extract prognosis
    let extractedPrognosis = '';
    if (lowerText.includes('good') || lowerText.includes('improving')) {
      extractedPrognosis = 'Good prognosis with medication compliance and lifestyle modifications';
    } else if (lowerText.includes('monitor') || lowerText.includes('follow up')) {
      extractedPrognosis = 'Requires monitoring. Follow-up in 2 weeks';
    } else {
      extractedPrognosis = 'Favorable prognosis with appropriate treatment adherence';
    }
    setPrognosis(extractedPrognosis);
    
    // Extract lab tests - ONLY if lab test keywords are present
    if (extractedInfo.labTests && extractedInfo.labTests.length > 0) {
      const labTestsText = extractedInfo.labTests.join(', ');
      setLabTests(prev => prev ? `${prev}, ${labTestsText}` : labTestsText);
      console.log('Lab tests updated:', labTestsText);
    }
    
    // Extract referrals - ONLY if referral keywords are present
    if (extractedInfo.referrals && extractedInfo.referrals.length > 0) {
      const referralsText = extractedInfo.referrals.join(', ');
      setReferrals(prev => prev ? `${prev}, ${referralsText}` : referralsText);
      console.log('Referrals updated:', referralsText);
    }
    
    // Extract follow-up instructions - ONLY if follow-up keywords are present
    if (extractedInfo.followUp && extractedInfo.followUp.length > 0) {
      const followUpText = extractedInfo.followUp.join(', ');
      setFollowUpInstructions(prev => prev ? `${prev}, ${followUpText}` : followUpText);
      console.log('Follow-up updated:', followUpText);
    }
    
    // Extract medications with enhanced parsing from corrected text
    const extractedMeds = extractMedicationsFromText(correctedText);
    setMedications(extractedMeds);
    
    console.log('Medications extracted from corrected text:', extractedMeds);
    
    checkInteractions(extractedMeds);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      // Stop listening
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('🛑 Speech recognition stopped');
    } else {
      try {
        // Ensure clean restart by recreating the recognition object if needed
        if (recognitionRef.current.readyState !== undefined && recognitionRef.current.readyState !== 0) {
          console.log('🔄 Recreating speech recognition object for clean restart');
          
          // Reinitialize speech recognition
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          
          // Reapply all settings
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = speechLanguage;
          recognitionRef.current.maxAlternatives = 3;
          
          // Reattach all event handlers
          setupSpeechRecognitionHandlers();
        }
        
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      } catch (e) {
        console.error('Speech recognition start error:', e);
        alert(`Failed to start speech recognition: ${e.message}\n\nTry refreshing the page or use Demo Mode instead.`);
      }
    }
  };

  // Separate function to setup speech recognition event handlers
  const setupSpeechRecognitionHandlers = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onstart = () => {
      console.log('Enhanced speech recognition started');
      // DON'T clear transcript on restart - preserve existing content
      console.log('🎤 Speech recognition session started');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        let bestTranscript = '';
        let bestAlternativeConfidence = 0;
        
        // Check all alternatives and pick the one with highest confidence
        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (alternative.confidence > bestAlternativeConfidence) {
            bestAlternativeConfidence = alternative.confidence;
            bestTranscript = alternative.transcript;
          }
        }
        
        // Use more lenient confidence threshold for medical terms
        const dynamicThreshold = isMedicalTerm(bestTranscript) ? 0.3 : confidenceThreshold;
        
        if (bestAlternativeConfidence >= dynamicThreshold) {
          if (result.isFinal) {
            finalTranscript += bestTranscript + ' ';
            bestConfidence = bestAlternativeConfidence;
          } else {
            interimTranscript += bestTranscript + ' ';
          }
        } else if (bestAlternativeConfidence > 0.2) {
          // Include low confidence words but mark them for review
          const markedTranscript = `[${bestTranscript}?] `;
          if (result.isFinal) {
            finalTranscript += markedTranscript;
          } else {
            interimTranscript += markedTranscript;
          }
        }
      }
      
      // Update live transcript for manual correction
      if (showLiveTranscript) {
        if (finalTranscript) {
          setLiveTranscript(prev => {
            const updated = prev + finalTranscript;
            console.log('Live transcript updated (final):', updated.slice(-50));
            return updated;
          });
        } else if (interimTranscript) {
          setLiveTranscript(prev => {
            // Find the last complete sentence and append interim
            const sentences = prev.split(/[.!?]\s*/);
            if (sentences.length > 0) {
              const lastComplete = sentences.slice(0, -1).join('. ');
              const withInterim = lastComplete + (lastComplete ? '. ' : '') + interimTranscript;
              return withInterim;
            }
            return prev + interimTranscript;
          });
        }
      }
      
      if (finalTranscript) {
        // Clean and correct the transcript using dynamic database
        const cleanedTranscript = cleanTranscript(finalTranscript);
        const originalTranscript = cleanedTranscript;
        
        // Apply user corrections first, then built-in corrections
        const userCorrectedTranscript = applyCorrectionToText(cleanedTranscript, userCorrections);
        const correctedTranscript = correctMedicalTermsWithDynamicDB(userCorrectedTranscript);
        
        // Track medication corrections for user feedback
        if (originalTranscript !== correctedTranscript) {
          const corrections = findMedicationCorrections(originalTranscript, correctedTranscript);
          if (corrections.length > 0) {
            setLastCorrectedMeds(corrections);
            setMedicationSuggestions(prev => [...corrections, ...prev.slice(0, 4)]); // Keep last 5
          }
        }
        
        setTranscript(prev => {
          const newTranscript = prev + correctedTranscript + ' ';
          // Process in real-time for continuous updates
          processTranscript(newTranscript);
          return newTranscript;
        });
        
        console.log(`Speech processed with confidence: ${(bestConfidence * 100).toFixed(1)}%`);
        if (originalTranscript !== correctedTranscript) {
          console.log(`Medication corrected: "${originalTranscript}" → "${correctedTranscript}"`);
        }
      }
      
      // Show interim results for better user feedback
      if (interimTranscript && !finalTranscript && showLiveTranscript) {
        console.log('Interim:', cleanTranscript(interimTranscript));
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = 'Speech recognition error occurred.';
      let suggestions = '';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Microphone might be muted or too quiet.';
          suggestions = 'Try speaking louder, closer to microphone, or check microphone settings.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Hardware or driver issue.';
          suggestions = 'Check if microphone is connected and working in other applications.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied by browser or system.';
          suggestions = 'Click the microphone icon in address bar to allow access, or check system privacy settings.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Speech recognition requires internet.';
          suggestions = 'Check internet connection and try again. Use Demo Mode if offline.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service blocked.';
          suggestions = 'Try refreshing the page or use a different browser (Chrome recommended).';
          break;
        case 'aborted':
          // Don't show error for intentional stops
          return;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
          suggestions = 'Try refreshing the page or use Demo Mode instead.';
      }
      
      console.log(`🎤 ${errorMessage} | ${suggestions}`);
      // Show non-intrusive error notification instead of alert
      setTranscript(prev => prev + `\n\n[🎤 Error: ${errorMessage}]`);
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart if it was supposed to be continuous
      if (isListening) {
        console.log('🔄 Auto-restarting speech recognition...');
        setTimeout(() => {
          if (isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Auto-restart failed:', e);
              setIsListening(false);
            }
          }
        }, 100);
      }
    };
  };

  const runDemo = () => {
    const demoText = 'Patient has type 2 diabetes and hypertension. Blood sugar is elevated. Past medical history includes coronary artery disease and myocardial infarction in 2020. Patient is allergic to penicillin and has family history of diabetes. Currently taking aspirin and atorvastatin. New prescription: metformin 500mg tablet oral twice daily after meals for 30 days and lisinopril 5mg tablet oral once daily before breakfast for 30 days. Lab tests: fasting blood sugar, HbA1c, lipid profile. Follow up in two weeks for monitoring blood pressure and glucose levels.';
    setTranscript(demoText);
    setTimeout(() => processTranscript(demoText), 500);
  };

  const checkInteractions = (meds) => {
    const foundInteractions = [];
    const medNames = meds.map(m => m.name.toLowerCase());

    medNames.forEach((med, index) => {
      if (COMPREHENSIVE_DRUG_DATABASE[med]) {
        const drugData = COMPREHENSIVE_DRUG_DATABASE[med];
        
        // Check drug-drug interactions
        medNames.forEach((otherMed, otherIndex) => {
          if (index !== otherIndex && drugData.interactions.includes(otherMed)) {
            foundInteractions.push({
              type: 'drug-drug',
              severity: 'high',
              drug1: meds[index].name,
              drug2: meds[otherIndex].name,
              warning: drugData.warnings,
              class1: drugData.class,
              class2: COMPREHENSIVE_DRUG_DATABASE[otherMed]?.class || 'Unknown'
            });
          }
        });

        // Check drug-food interactions
        if (drugData.foodInteractions.length > 0) {
          foundInteractions.push({
            type: 'drug-food',
            severity: 'moderate',
            drug: meds[index].name,
            foods: drugData.foodInteractions,
            warning: drugData.warnings,
            class: drugData.class
          });
        }

        // Check contraindications
        if (drugData.contraindications.length > 0) {
          foundInteractions.push({
            type: 'contraindication',
            severity: 'critical',
            drug: meds[index].name,
            contraindications: drugData.contraindications,
            warning: `Critical: Review contraindications for ${meds[index].name}`,
            class: drugData.class
          });
        }
      }
    });

    setInteractions(foundInteractions);
  };

  const updateMedication = (index, field, value) => {
    const updatedMeds = [...medications];
    updatedMeds[index][field] = value;
    setMedications(updatedMeds);
    checkInteractions(updatedMeds);
  };

  const removeMedication = (index) => {
    const updatedMeds = medications.filter((_, i) => i !== index);
    setMedications(updatedMeds);
    checkInteractions(updatedMeds);
  };

  const addMedicationToReview = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.form || !newMedication.route || !newMedication.frequency || !newMedication.duration) {
      return;
    }

    const medicationToAdd = {
      name: newMedication.name.toUpperCase(), // CAPITALIZE medicine names
      dosage: newMedication.dosage,
      formulation: newMedication.form,
      route: newMedication.route,
      frequency: newMedication.frequency,
      foodInstruction: newMedication.foodInstruction,
      duration: newMedication.duration,
      instructions: newMedication.instructions
    };

    const updatedMeds = [...medications, medicationToAdd];
    setMedications(updatedMeds);
    checkInteractions(updatedMeds);
    
    // Reset form
    setNewMedication({
      name: '',
      dosage: '',
      form: '',
      route: 'Oral',
      frequency: '',
      duration: '',
      foodInstruction: 'With or without food',
      instructions: ''
    });

    // Check interactions
    checkInteractions([...medications, medicationToAdd]);
  };
  const addMedication = () => {
    setMedications([...medications, { 
      name: '', 
      dosage: '', 
      formulation: 'Tablet',
      route: 'Oral',
      frequency: '', 
      foodInstruction: 'With food',
      duration: '30 days' 
    }]);
  };

  // EHR API Functions
  const fetchEhrProviders = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/providers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEhrProviders(data.data.providers);
      } else {
        console.error('Failed to fetch EHR providers');
      }
    } catch (error) {
      console.error('Error fetching EHR providers:', error);
    }
  };

  const fetchEhrConfigurations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/configurations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEhrConfigurations(data.data.configurations);
        setIsEhrConnected(data.data.configurations.length > 0);
      } else {
        console.error('Failed to fetch EHR configurations');
      }
    } catch (error) {
      console.error('Error fetching EHR configurations:', error);
    }
  };

  const saveEhrConfiguration = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: ehrConfigData.provider,
          base_url: ehrConfigData.baseUrl,
          client_id: ehrConfigData.clientId,
          client_secret: ehrConfigData.clientSecret,
          auth_url: ehrConfigData.authUrl,
          token_url: ehrConfigData.tokenUrl,
          scope: ehrConfigData.scope,
          use_oauth: ehrConfigData.useOauth,
          api_key: ehrConfigData.apiKey,
          organization_id: ehrConfigData.organizationId,
          facility_id: ehrConfigData.facilityId,
          timeout: ehrConfigData.timeout,
          verify_ssl: ehrConfigData.verifySsl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ EHR configuration saved successfully!');
        setShowEHRConfig(false);
        setShowSettings(true);
        await fetchEhrConfigurations();
        
        // Reset form
        setEhrConfigData({
          provider: '',
          baseUrl: '',
          clientId: '',
          clientSecret: '',
          authUrl: '',
          tokenUrl: '',
          scope: 'patient/*.read patient/*.write',
          useOauth: true,
          apiKey: '',
          organizationId: '',
          facilityId: '',
          timeout: 30,
          verifySsl: true
        });
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to save EHR configuration: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving EHR configuration:', error);
      alert('❌ Error saving EHR configuration. Please try again.');
    }
  };

  const testEhrConnection = async (config = null) => {
    try {
      const testConfig = config || ehrConfigData;
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: testConfig.provider,
          base_url: testConfig.baseUrl,
          client_id: testConfig.clientId,
          client_secret: testConfig.clientSecret,
          auth_url: testConfig.authUrl,
          token_url: testConfig.tokenUrl,
          scope: testConfig.scope,
          use_oauth: testConfig.useOauth,
          api_key: testConfig.apiKey,
          organization_id: testConfig.organizationId,
          facility_id: testConfig.facilityId,
          timeout: testConfig.timeout,
          verify_ssl: testConfig.verifySsl
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ EHR Connection Test Successful!\n\nProvider: ${testConfig.provider}\nStatus: ${data.data.status}\nResponse Time: ${data.data.response_time?.toFixed(2)}s\nFHIR Version: ${data.data.fhir_version || 'Unknown'}\nCapabilities: ${data.data.capabilities?.length || 0} resources supported`);
        setEhrConnectionStatus('connected');
      } else {
        alert(`❌ EHR Connection Test Failed!\n\nError: ${data.message}`);
        setEhrConnectionStatus('error');
      }
      
      return data.success;
    } catch (error) {
      console.error('Error testing EHR connection:', error);
      alert('❌ Error testing EHR connection. Please check your configuration and try again.');
      setEhrConnectionStatus('error');
      return false;
    }
  };

  const submitPrescriptionToEHR = async (prescriptionId = null) => {
    if (!selectedEhrProvider) {
      alert('⚠️ Please select an EHR provider first.');
      return;
    }

    setIsSubmittingToEHR(true);
    
    try {
      // First, save the prescription if it doesn't exist
      let currentPrescriptionId = prescriptionId;
      
      if (!currentPrescriptionId) {
        const prescriptionData = {
          patient_info: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
            height: patientHeight,
            weight: patientWeight,
            bp: patientBP,
            heart_rate: heartRate,
            temperature: temperature,
            oxygen_saturation: oxygenSaturation
          },
          medical_history: {
            past_conditions: pastMedicalHistory,
            past_surgeries: pastMedications,
            family_history: familyHistory,
            social_history: {
              smoking: smokingStatus,
              alcohol: alcoholConsumption,
              exercise: exerciseFrequency
            },
            allergies: allergies
          },
          diagnosis: diagnosis,
          medications: medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            formulation: med.formulation,
            route: med.route,
            frequency: med.frequency,
            duration: med.duration,
            food_instruction: med.foodInstruction
          })),
          prognosis: prognosis,
          doctor_notes: transcript
        };

        const prescriptionResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/prescriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prescriptionData),
        });

        if (prescriptionResponse.ok) {
          const prescriptionResult = await prescriptionResponse.json();
          currentPrescriptionId = prescriptionResult.data.prescription_id;
        } else {
          throw new Error('Failed to save prescription');
        }
      }

      // Submit to EHR
      const ehrResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/submit-prescription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescription_id: currentPrescriptionId,
          provider: selectedEhrProvider
        }),
      });

      const ehrResult = await ehrResponse.json();
      
      if (ehrResult.success) {
        alert(`✅ Prescription submitted to EHR successfully!\n\nProvider: ${selectedEhrProvider}\nSubmission ID: ${ehrResult.data.submission_id}\nPatient FHIR ID: ${ehrResult.data.patient_fhir_id || 'N/A'}`);
        
        setCurrentView('submitted');
        setTimeout(() => {
          setCurrentView('input');
          resetAllFields();
        }, 3000);
        
        await fetchEhrSubmissions();
      } else {
        throw new Error(ehrResult.detail || 'EHR submission failed');
      }
      
    } catch (error) {
      console.error('Error submitting to EHR:', error);
      alert(`❌ Failed to submit prescription to EHR!\n\nError: ${error.message}`);
    } finally {
      setIsSubmittingToEHR(false);
    }
  };

  const fetchEhrSubmissions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ehr/submissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEhrSubmissions(data.data.submissions);
      } else {
        console.error('Failed to fetch EHR submissions');
      }
    } catch (error) {
      console.error('Error fetching EHR submissions:', error);
    }
  };

  // Load EHR data on authentication
  useEffect(() => {
    if (authToken && isLoggedIn) {
      fetchEhrProviders();
      fetchEhrConfigurations();
      fetchEhrSubmissions();
      fetchSavedPatients();
      fetchMedicationTemplates();
    }
  }, [authToken, isLoggedIn]);

  // Patient Storage Functions
  const saveCurrentPatient = async () => {
    setIsSavingPatient(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_info: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
            height: patientHeight,
            weight: patientWeight,
            bp: patientBP,
            heart_rate: heartRate,
            temperature: temperature,
            oxygen_saturation: oxygenSaturation
          },
          medical_history: {
            past_conditions: pastMedicalHistory,
            past_surgeries: pastMedications,
            family_history: familyHistory,
            social_history: {
              smoking: smokingStatus,
              alcohol: alcoholConsumption,
              exercise: exerciseFrequency
            },
            allergies: allergies
          },
          diagnosis: diagnosis,
          prognosis: prognosis,
          notes: transcript
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPatientCode(data.data.patient_code);
        alert(`✅ Patient saved successfully!\n\nPatient Code: ${data.data.patient_code}\n\n🔍 Use this code to retrieve patient information in future visits.`);
        setShowSavePatientDialog(false);
        await fetchSavedPatients();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to save patient: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('❌ Error saving patient. Please try again.');
    } finally {
      setIsSavingPatient(false);
    }
  };

  const searchPatientByCode = async () => {
    if (!searchPatientCode.trim()) {
      alert('Please enter a patient code');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_code: searchPatientCode.toUpperCase()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const patient = data.data.patient;
        
        // Populate form with patient data
        setPatientName(patient.patient_info.name || '');
        setPatientAge(patient.patient_info.age || '');
        setPatientGender(patient.patient_info.gender || '');
        setPatientHeight(patient.patient_info.height || '');
        setPatientWeight(patient.patient_info.weight || '');
        setPatientBP(patient.patient_info.bp || '');
        setHeartRate(patient.patient_info.heart_rate || '');
        setTemperature(patient.patient_info.temperature || '');
        setOxygenSaturation(patient.patient_info.oxygen_saturation || '');
        
        setPastMedicalHistory(patient.medical_history.past_conditions || '');
        setPastMedications(patient.medical_history.past_surgeries || '');
        setFamilyHistory(patient.medical_history.family_history || '');
        setAllergies(patient.medical_history.allergies || '');
        setSmokingStatus(patient.medical_history.social_history?.smoking || 'Never');
        setAlcoholConsumption(patient.medical_history.social_history?.alcohol || 'Never');
        setExerciseFrequency(patient.medical_history.social_history?.exercise || 'Rarely');
        
        setDiagnosis(patient.diagnosis || '');
        setPrognosis(patient.prognosis || '');
        
        alert(`✅ Patient loaded successfully!\n\nPatient: ${patient.patient_info.name}\nLast Visit: ${new Date(patient.visit_date).toLocaleDateString()}`);
        setShowPatientStorage(false);
        
      } else {
        const errorData = await response.json();
        alert(`❌ Patient not found: ${errorData.detail || 'Invalid patient code'}`);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('❌ Error searching patient. Please try again.');
    }
  };

  const fetchSavedPatients = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/my-patients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedPatients(data.data.patients);
      }
    } catch (error) {
      console.error('Error fetching saved patients:', error);
    }
  };
  // Fetch recent patients for main dashboard
  const fetchRecentPatients = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/search-patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_term: '' // Empty search to get all patients
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.patients.slice(0, 8); // Return last 8 patients
      }
      return [];
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      return [];
    }
  };

  // Load existing patient data into form
  const loadPatientIntoForm = async (patient) => {
    try {
      setSelectedPatient(patient);
      setCurrentPatientMRN(patient.mrn);
      setIsNewPatient(false);
      
      // Load patient info into form
      setPatientName(patient.patient_info.name || '');
      setPatientAge(patient.patient_info.age || '');
      setPatientGender(patient.patient_info.gender || '');
      setPatientHeight(patient.patient_info.height || '');
      setPatientWeight(patient.patient_info.weight || '');
      setPatientBP(patient.patient_info.blood_pressure || '');
      setHeartRate(patient.patient_info.heart_rate || '');
      setTemperature(patient.patient_info.temperature || '');
      setOxygenSaturation(patient.patient_info.oxygen_saturation || '');
      
      alert(`✅ Loaded existing patient: ${patient.patient_info.name}\nMRN: ${patient.mrn}\nReady to add new visit`);
      
    } catch (error) {
      console.error('Error loading patient:', error);
      alert('❌ Error loading patient data');
    }
  };
  
  // ============ NEW PATIENT MANAGEMENT FUNCTIONS ============
  
  const searchPatients = async () => {
    if (!patientSearchTerm.trim()) {
      alert('Please enter a patient name, MRN, or phone number');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/search-patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_term: patientSearchTerm.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.patients || []);
        
        if (data.patients.length === 0) {
          alert(`No patients found matching "${patientSearchTerm}"`);
        }
      } else {
        const errorData = await response.json();
        alert(`❌ Search failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      alert('❌ Search failed: Network error');
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectExistingPatient = async (patient) => {
    try {
      setSelectedPatient(patient);
      setCurrentPatientMRN(patient.mrn);
      setIsNewPatient(false);
      
      // Load patient info into form
      setPatientName(patient.patient_info.name || '');
      setPatientAge(patient.patient_info.age || '');
      setPatientGender(patient.patient_info.gender || '');
      setPatientHeight(patient.patient_info.height || '');
      setPatientWeight(patient.patient_info.weight || '');
      setPatientBP(patient.patient_info.blood_pressure || '');
      setHeartRate(patient.patient_info.heart_rate || '');
      setTemperature(patient.patient_info.temperature || '');
      setOxygenSaturation(patient.patient_info.oxygen_saturation || '');
      
      // Show patient selected message
      alert(`✅ Selected existing patient: ${patient.patient_info.name}\nMRN: ${patient.mrn}\nTotal visits: ${patient.total_visits}\nLast visit: ${new Date(patient.latest_visit_date).toLocaleDateString()}`);
      
      // Close search modal
      setShowPatientSearch(false);
      setSearchResults([]);
      setPatientSearchTerm('');
      
    } catch (error) {
      console.error('Error selecting patient:', error);
      alert('❌ Error selecting patient');
    }
  };
  
  const createNewPatientWithVisit = async () => {
    setIsSavingPatient(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/create-new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_info: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
            height: patientHeight,
            weight: patientWeight,
            blood_pressure: patientBP,
            heart_rate: heartRate,
            temperature: temperature,
            oxygen_saturation: oxygenSaturation
          },
          medical_history: {
            past_conditions: pastMedicalHistory,
            past_surgeries: pastMedications,
            family_history: familyHistory,
            allergies: allergies,
            social_history: {
              smoking: smokingStatus,
              alcohol: alcoholUse,
              exercise: exerciseLevel,
              drugs: drugUse
            }
          },
          diagnosis: diagnosis,
          prognosis: prognosis,
          lab_tests: labTests,
          referrals: referrals,
          follow_up_instructions: followUpInstructions,
          notes: ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPatientMRN(data.data.mrn);
        
        alert(`✅ New patient created successfully!\n\nPatient: ${data.data.patient_name}\nMRN: ${data.data.mrn}\nVisit Code: ${data.data.visit_code}\n\n🔍 Use MRN for future visits.`);
        
        setShowSavePatientDialog(false);
        await fetchSavedPatients();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to create patient: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating new patient:', error);
      alert('❌ Failed to create patient: Network error');
    } finally {
      setIsSavingPatient(false);
    }
  };
  
  const addVisitToExistingPatient = async () => {
    if (!currentPatientMRN) {
      alert('No patient selected');
      return;
    }
    
    setIsSavingPatient(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/add-visit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_mrn: currentPatientMRN,
          medical_history: {
            past_conditions: pastMedicalHistory,
            past_surgeries: pastMedications,
            family_history: familyHistory,
            allergies: allergies,
            social_history: {
              smoking: smokingStatus,
              alcohol: alcoholUse,
              exercise: exerciseLevel,
              drugs: drugUse
            }
          },
          diagnosis: diagnosis,
          prognosis: prognosis,
          lab_tests: labTests,
          referrals: referrals,
          follow_up_instructions: followUpInstructions,
          notes: ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        alert(`✅ New visit added successfully!\n\nPatient MRN: ${currentPatientMRN}\nVisit Code: ${data.data.visit_code}\n\n📋 Visit recorded as follow-up.`);
        
        setShowSavePatientDialog(false);
        await fetchSavedPatients();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to add visit: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding visit:', error);
      alert('❌ Failed to add visit: Network error');
    } finally {
      setIsSavingPatient(false);
    }
  };
  
  const handleSavePatient = () => {
    if (currentPatientMRN) {
      // Existing patient - add new visit
      addVisitToExistingPatient();
    } else {
      // New patient - create patient and first visit
      createNewPatientWithVisit();
    }
  };
  
  const proceedWithNewPatient = () => {
    setIsNewPatient(true);
    setShowNewVsExisting(false);
    setShowSavePatientDialog(true);
  };
  
  const proceedWithExistingPatient = () => {
    setIsNewPatient(false);
    setShowNewVsExisting(false);
    setShowSavePatientDialog(true);
  };

  // Medication Template Functions
  const saveMedicationTemplate = async () => {
    if (!templateData.name || !templateData.disease_condition || medications.length === 0) {
      alert('Please provide template name, disease condition, and at least one medication');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateData.name,
          disease_condition: templateData.disease_condition,
          description: templateData.description,
          medications: medications,
          is_public: templateData.is_public
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Medication template saved successfully!\n\nTemplate: ${templateData.name}\nFor: ${templateData.disease_condition}`);
        
        setTemplateData({
          name: '',
          disease_condition: '',
          description: '',
          is_public: false
        });
        setShowCreateTemplate(false);
        await fetchMedicationTemplates();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to save template: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('❌ Error saving template. Please try again.');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // Enhanced template creation function
  const createMedicationTemplate = async () => {
    const diseaseCondition = newTemplate.disease_condition === 'Custom' ? newTemplate.custom_disease : newTemplate.disease_condition;
    
    if (!newTemplate.name || !diseaseCondition || newTemplate.medications.length === 0) {
      alert('Please provide template name, disease condition, and at least one medication');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplate.name,
          disease_condition: diseaseCondition,
          description: newTemplate.description,
          medications: newTemplate.medications.map(medString => {
            // Parse medication string back to object format
            const parts = medString.split(' ');
            const name = parts[0];
            const dosage = parts[1];
            const frequency = parts.slice(2).join(' ');
            
            return {
              name: name,
              dosage: dosage,
              formulation: 'Tablet',
              route: 'Oral',
              frequency: frequency,
              foodInstruction: 'With food',
              duration: '30 days'
            };
          }),
          is_public: newTemplate.is_public
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Medication template created successfully!\n\nTemplate: ${newTemplate.name}\nFor: ${diseaseCondition}\nMedications: ${newTemplate.medications.length}`);
        
        // Reset form
        setNewTemplate({
          name: '',
          disease_condition: '',
          custom_disease: '',
          medications: [],
          description: '',
          is_public: false
        });
        setNewMedication({
          name: '',
          dosage: '',
          form: '',
          frequency: '',
          duration: '',
          foodInstruction: 'With or without food',
          instructions: ''
        });
        setShowCreateTemplate(false);
        setShowMedicationTemplates(true);
        await fetchMedicationTemplates();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to create template: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Error creating template. Please try again.');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const loadMedicationTemplate = async (templateId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/use/${templateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const templateMedications = data.data.medications;
        
        setMedications(templateMedications);
        alert(`✅ Template loaded successfully!\n\nLoaded ${templateMedications.length} medications from "${data.data.template.name}"`);
        setShowMedicationTemplates(false);
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to load template: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('❌ Error loading template. Please try again.');
    }
  };

  const fetchMedicationTemplates = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disease_condition: null // Get all templates
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMedicationTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const searchTemplatesByDisease = async (diseaseCondition) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/templates/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disease_condition: diseaseCondition
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMedicationTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Error searching templates:', error);
    }
  };

  // Update speech recognition settings when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLanguage;
      console.log(`Speech language updated to: ${speechLanguage}`);
    }
  }, [speechLanguage]);

  // Save speech settings to localStorage
  useEffect(() => {
    const speechSettings = {
      language: speechLanguage,
      quality: speechQuality,
      noiseReduction: enableNoiseReduction,
      confidenceThreshold: confidenceThreshold
    };
    localStorage.setItem('shrutapex_speech_settings', JSON.stringify(speechSettings));
  }, [speechLanguage, speechQuality, enableNoiseReduction, confidenceThreshold]);

  // Load speech settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('shrutapex_speech_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSpeechLanguage(settings.language || 'en-US');
        setSpeechQuality(settings.quality || 'high');
        setEnableNoiseReduction(settings.noiseReduction !== false);
        setConfidenceThreshold(settings.confidenceThreshold || 0.7);
      } catch (error) {
        console.error('Error loading speech settings:', error);
      }
    }
    
    // Initialize dynamic medication database
    setDynamicMedicationDB({...MEDICATION_DATABASE});
    
    // Load user corrections and training history
    loadUserCorrections();
    loadTrainingHistory();
  }, []);

  // Learning System Functions
  const loadUserCorrections = () => {
    const savedCorrections = localStorage.getItem('shrutapex_user_corrections');
    if (savedCorrections) {
      try {
        const corrections = JSON.parse(savedCorrections);
        setUserCorrections(corrections);
        
        // Update dynamic medication database with user corrections
        const updatedDB = {...MEDICATION_DATABASE};
        corrections.forEach(correction => {
          if (correction.type === 'medication') {
            if (!updatedDB[correction.corrected]) {
              updatedDB[correction.corrected] = [];
            }
            if (!updatedDB[correction.corrected].includes(correction.original)) {
              updatedDB[correction.corrected].push(correction.original);
            }
          }
        });
        setDynamicMedicationDB(updatedDB);
        console.log('Loaded user corrections and updated medication database');
      } catch (error) {
        console.error('Error loading user corrections:', error);
      }
    }
  };

  const loadTrainingHistory = () => {
    const savedHistory = localStorage.getItem('shrutapex_training_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setTrainingHistory(history);
      } catch (error) {
        console.error('Error loading training history:', error);
      }
    }
  };

  const saveUserCorrection = (original, corrected, type = 'medication', context = '') => {
    const correction = {
      id: Date.now(),
      original: original.toLowerCase().trim(),
      corrected: corrected.toLowerCase().trim(),
      type: type,
      context: context,
      timestamp: new Date().toISOString(),
      confidence: calculateSimilarity(original, corrected)
    };
    
    // Check if this correction already exists
    const exists = userCorrections.some(c => 
      c.original === correction.original && 
      c.corrected === correction.corrected && 
      c.type === correction.type
    );
    
    if (!exists) {
      const updatedCorrections = [...userCorrections, correction];
      setUserCorrections(updatedCorrections);
      localStorage.setItem('shrutapex_user_corrections', JSON.stringify(updatedCorrections));
      
      // Update dynamic medication database
      if (type === 'medication') {
        const updatedDB = {...dynamicMedicationDB};
  // Enhanced text difference detection
  const findTextDifferences = (original, corrected) => {
    const corrections = [];
    
    // Split into sentences for better context
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim());
    const correctedSentences = corrected.split(/[.!?]+/).filter(s => s.trim());
    
    // Process each sentence pair
    for (let i = 0; i < Math.max(originalSentences.length, correctedSentences.length); i++) {
      const origSentence = originalSentences[i] ? originalSentences[i].trim() : '';
      const corrSentence = correctedSentences[i] ? correctedSentences[i].trim() : '';
      
      if (origSentence && corrSentence && origSentence !== corrSentence) {
        // Find word-level differences within sentences
        const origWords = origSentence.toLowerCase().split(/\s+/);
        const corrWords = corrSentence.toLowerCase().split(/\s+/);
        
        // Use edit distance algorithm for better matching
        const wordCorrections = findWordCorrections(origWords, corrWords);
        corrections.push(...wordCorrections);
      }
    }
    
    return corrections;
  };
  
  // Advanced word-level correction detection
  const findWordCorrections = (originalWords, correctedWords) => {
    const corrections = [];
    let i = 0, j = 0;
    
    while (i < originalWords.length && j < correctedWords.length) {
      const origWord = originalWords[i];
      const corrWord = correctedWords[j];
      
      if (origWord === corrWord) {
        // Words match, move to next
        i++; j++;
      } else {
        // Look for substitution, insertion, or deletion
        const similarity = calculateSimilarity(origWord, corrWord);
        
        if (similarity > 0.4) {
          // Likely substitution
          corrections.push({
            original: origWord,
            corrected: corrWord,
            type: 'substitution',
            confidence: similarity
          });
          i++; j++;
        } else {
          // Check if it's an insertion in corrected text
          if (j + 1 < correctedWords.length && 
              calculateSimilarity(origWord, correctedWords[j + 1]) > 0.7) {
            corrections.push({
              original: '',
              corrected: corrWord,
              type: 'insertion',
              confidence: 0.8
            });
            j++;
          } else if (i + 1 < originalWords.length && 
                     calculateSimilarity(originalWords[i + 1], corrWord) > 0.7) {
            corrections.push({
              original: origWord,
              corrected: '',
              type: 'deletion',
              confidence: 0.8
            });
            i++;
          } else {
            // Default substitution
            corrections.push({
              original: origWord,
              corrected: corrWord,
              type: 'substitution',
              confidence: similarity
            });
            i++; j++;
          }
        }
      }
    }
    
    return corrections;
  };
        if (!updatedDB[correction.corrected]) {
          updatedDB[correction.corrected] = [];
        }
        if (!updatedDB[correction.corrected].includes(correction.original)) {
          updatedDB[correction.corrected].push(correction.original);
        }
        setDynamicMedicationDB(updatedDB);
      }
      
      // Add to training history
      const trainingEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'User Correction Added',
        details: `"${original}" → "${corrected}" (${type})`,
        improvement: `App will now recognize "${original}" as "${corrected}"`
      };
      
      const updatedHistory = [trainingEntry, ...trainingHistory.slice(0, 49)]; // Keep last 50
      setTrainingHistory(updatedHistory);
      localStorage.setItem('shrutapex_training_history', JSON.stringify(updatedHistory));
      
      console.log('✅ User correction saved and app trained:', correction);
      alert(`✅ App Trained! "${original}" will now be recognized as "${corrected}"`);
      
      return true;
    }
    
    return false;
  };

  const applyCorrectionToText = (text, corrections) => {
    let correctedText = text.toLowerCase();
    
    corrections.forEach(correction => {
      const regex = new RegExp(`\\b${correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correction.corrected);
    });
    
    return correctedText;
  };

  const processManualCorrection = () => {
    if (!liveTranscript || !correctedTranscript) {
      alert('Please provide both original and corrected text');
      return;
    }
    
    // Enhanced difference detection using fuzzy matching
    const corrections = findTextDifferences(liveTranscript, correctedTranscript);
    
    if (corrections.length === 0) {
      alert('No significant differences found between original and corrected text');
      return;
    }
    
    // Process each correction
    const validCorrections = [];
    
    corrections.forEach(correction => {
      // Check if it's likely a medication name or significant word
      const isMedication = Object.keys(MEDICATION_DATABASE).some(med => 
        med.includes(correction.corrected) || calculateSimilarity(correction.corrected, med) > 0.7
      );
      
      // Only learn significant corrections
      if (isMedication || 
          correction.corrected.length > 3 || 
          correction.type === 'substitution' && correction.confidence > 0.5) {
        validCorrections.push(correction);
      }
    });
    
    if (validCorrections.length > 0) {
      validCorrections.forEach(correction => {
        saveUserCorrection(correction.original, correction.corrected, 'medical_term', liveTranscript);
      });
      
      // Update the transcript with corrections and process it
      setTranscript(correctedTranscript);
      processTranscript(correctedTranscript);
      
      // Clear the correction interface
      setLiveTranscript('');
      setCorrectedTranscript('');
      setShowLiveTranscript(false);
      
    } else {
      alert('No significant corrections detected to learn from.');
    }
  };

  const clearTrainingHistory = () => {
    if (confirm('⚠️ Are you sure you want to clear all training history? This cannot be undone.')) {
      setTrainingHistory([]);
      setUserCorrections([]);
      setDynamicMedicationDB({...MEDICATION_DATABASE});
      localStorage.removeItem('shrutapex_training_history');
      localStorage.removeItem('shrutapex_user_corrections');
      alert('✅ Training history cleared. App reset to default state.');
    }
  };

  // Enhanced transcript cleaning function
  const cleanTranscript = (text) => {
    if (!text) return '';
    
    // Convert to lowercase for processing
    let cleaned = text.toLowerCase();
    
    // Remove repeated words (common speech recognition issue)
    const words = cleaned.split(' ');
    const cleanedWords = [];
    let lastWord = '';
    
    words.forEach(word => {
      const trimmedWord = word.trim();
      if (trimmedWord && trimmedWord !== lastWord) {
        cleanedWords.push(trimmedWord);
        lastWord = trimmedWord;
      }
    });
    
    cleaned = cleanedWords.join(' ');
    
    // Remove common speech recognition artifacts
    cleaned = cleaned
      .replace(/\buh\b|\buhm\b|\bum\b/g, '') // Remove filler words
      .replace(/\ber\b|\bah\b|\boh\b/g, '') // Remove hesitation sounds
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/([.!?])\s*\1+/g, '$1') // Remove repeated punctuation
      .trim();
    
    // Capitalize first letter of sentences
    cleaned = cleaned.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    return cleaned;
  };

  // Context-aware extraction using trigger words
  const extractInformationByTriggers = (text) => {
    const lowerText = text.toLowerCase();
    const extracted = {
      diagnosis: [],
      medications: [],
      prognosis: [],
      familyHistory: [],
      pastMedicalHistory: [],
      pastMedications: [],
      referrals: [],
      labTests: [],
      followUp: [],
      vitals: [],
      allergies: [],
      socialHistory: []
    };

    // Trigger word patterns for different medical information
    const triggerPatterns = {
      diagnosis: [
        /(?:diagnosis|diagnosed with|suffering from|presents with|chief complaint|cc):?\s*([^.;,]+)/gi,
        /(?:patient has|patient is|condition is|condition):?\s*([^.;,]+)/gi
      ],
      pastMedicalHistory: [
        /(?:past medical history|medical history|history of|previous history|past history):?\s*([^.;,]+)/gi,
        /(?:previously diagnosed|previous diagnosis|past diagnosis|history includes):?\s*([^.;,]+)/gi,
        /(?:past conditions|previous conditions|chronic conditions|comorbidities):?\s*([^.;,]+)/gi,
        /(?:has a history of|history of|previously had|past medical|medical background):?\s*([^.;,]+)/gi
      ],
      pastMedications: [
        /(?:past medications|previous medications|medication history|previously on|past meds):?\s*([^.;,]+)/gi,
        /(?:previous surgery|past surgery|surgical history|operations):?\s*([^.;,]+)/gi,
        /(?:previously taking|was taking|used to take|past treatment):?\s*([^.;,]+)/gi,
        /(?:hospitalizations|previous admission|past admission):?\s*([^.;,]+)/gi
      ],
      medications: [
        /(?:medications?|prescribe|prescribed|give|start|medication list|meds?):?\s*([^.;,]+)/gi,
        /(?:take|taking|on):?\s*([^.;,]*(?:mg|mcg|ml|tablet|capsule)[^.;,]*)/gi
      ],
      prognosis: [
        /(?:prognosis|outlook|expected outcome|recovery):?\s*([^.;,]+)/gi,
        /(?:expected to|likely to|should):?\s*([^.;,]+)/gi
      ],
      familyHistory: [
        /(?:family history)\s+(?:of\s+)?([^.;,\sand]+(?:\s+(?!and\s)[^.;,\sand]+)*)/gi,
        /(?:father|mother|parent|sibling|brother|sister|grandfather|grandmother)\s+(?:has|had|with)\s+([^.;,]+)/gi,
        /(?:runs in family|genetic|hereditary):?\s*([^.;,]+)/gi
      ],
      referrals: [
        /(?:refer|referral|refer to|see|consult|consultation):?\s*([^.;,]+)/gi,
        /(?:specialist|cardiologist|neurologist|dermatologist|psychiatrist):?\s*([^.;,]+)/gi
      ],
      labTests: [
        /(?:lab|laboratory|test|blood test|urine test|investigation|workup):?\s*([^.;,]+)/gi,
        /(?:CBC|LFT|RFT|lipid profile|HbA1c|TSH|x-ray|CT|MRI|ultrasound|ECG|EKG):?\s*([^.;,]*)/gi,
        /(?:order|request|get|do|perform):?\s*(blood|urine|stool|imaging|scan|test)?\s*([^.;,]+)/gi
      ],
      followUp: [
        /(?:follow.*up|next visit|return|come back|revisit|review):?\s*([^.;,]+)/gi,
        /(?:after|in)\s*(\d+\s*(?:days?|weeks?|months?)):?\s*([^.;,]*)/gi,
        /(?:schedule|book|arrange):?\s*([^.;,]+)/gi
      ],
      vitals: [
        /(?:vitals?|blood pressure|bp|heart rate|hr|temperature|temp|pulse|respiration|oxygen saturation):?\s*([^.;,]+)/gi,
        /(?:systolic|diastolic|\d+\/\d+|\d+\s*mmhg|\d+\s*bpm|\d+\s*degrees?):?\s*([^.;,]*)/gi
      ],
      allergies: [
        /(?:allergies?|allergic to|allergy|adverse reaction):?\s*([^.;,\sand]+(?:\s+and\s+[^.;,\sand]+)*)/gi,
        /(?:cannot take|avoid|sensitive to):?\s*([^.;,\sand]+)/gi
      ],
      socialHistory: [
        /(?:social history|smoking|alcohol|drinking|exercise|occupation|job):?\s*([^.;,]+)/gi,
        /(?:works as|employed as|drinks|smokes|exercises):?\s*([^.;,]+)/gi
      ]
    };

    // Extract information based on trigger patterns
    Object.entries(triggerPatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(lowerText)) !== null) {
          const extractedText = match[1]?.trim();
          if (extractedText && extractedText.length > 2) {
            extracted[category].push(extractedText);
            console.log(`Extracted ${category}: "${extractedText}"`);
          }
        }
      });
    });

    return extracted;
  };

  // Comprehensive medical terminology database with phonetic matching
  const MEDICATION_DATABASE = {
    // Cardiovascular medications
    'cinnarizine': ['scenarizine', 'cinarizine', 'sinarizine', 'cinnarizon', 'scenarizon', 'stugeron', 'innerism', 'inerism', 'cinarism', 'cinerizin', 'sinnarizin'],
    'amlodipine': ['amlodapine', 'amladipine', 'norvasc', 'amlodippin'],
    'atorvastatin': ['atorvastin', 'atorvastaten', 'lipitor', 'atorvastat'],
    'lisinopril': ['lysinopril', 'lisinoprel', 'prinivil', 'zestril', 'lysine april'],
    'losartan': ['lozartan', 'losarten', 'cozaar', 'losaarten'],
    'metoprolol': ['metoprrolol', 'metaprolol', 'lopressor', 'toprol'],
    'propranolol': ['propanolol', 'propranelol', 'inderal'],
    'diltiazem': ['diltiazen', 'diltiazam', 'cardizem', 'tiazac'],
    'verapamil': ['verapamel', 'verapamyl', 'calan', 'isoptin'],
    'hydrochlorothiazide': ['hctz', 'hydrochlorthiazide', 'microzide', 'aquazide'],
    'furosemide': ['furosemaid', 'furosemyde', 'lasix'],
    'warfarin': ['warfaren', 'warfarin', 'coumadin', 'jantoven'],
    'clopidogrel': ['clopidagrel', 'clopidogryl', 'plavix'],
    'aspirin': ['asperen', 'asprin', 'bayer', 'ecotrin'],
    'simvastatin': ['simvastin', 'simvastaten', 'zocor'],
    'rosuvastatin': ['rosuvastin', 'rosuvastaten', 'crestor'],

    // Diabetes medications
    'metformin': ['metfromin', 'metforman', 'glucophage', 'fortamet'],
    'glipizide': ['glipazide', 'glimpizide', 'glucotrol'],
    'glyburide': ['glyburaid', 'glybride', 'diabeta', 'micronase'],
    'pioglitazone': ['pioglitazin', 'pioglitazon', 'actos'],
    'sitagliptin': ['sitaglipten', 'sitaglyptin', 'januvia'],
    'insulin': ['insulen', 'insulyn', 'humalog', 'novolog', 'lantus'],

    // Antibiotics
    'amoxicillin': ['amoxicilin', 'amoxacillin', 'amoxyl', 'trimox'],
    'azithromycin': ['azithromicin', 'azithromycen', 'zithromax', 'z-pak'],
    'ciprofloxacin': ['ciprofloxacen', 'ciprofloxasin', 'cipro'],
    'doxycycline': ['doxycyclin', 'doxicicline', 'vibramycin'],
    'levofloxacin': ['levofloxacen', 'levofloxasin', 'levaquin'],
    'cephalexin': ['cephalexen', 'cefalexin', 'keflex'],
    'clarithromycin': ['clarithromicin', 'clarithromycen', 'biaxin'],
    'erythromycin': ['erithromycin', 'erythromicin'],
    'penicillin': ['penicilin', 'penicilen'],

    // Pain medications  
    'acetaminophen': ['acetamenophen', 'acetaminaphen', 'tylenol', 'paracetamol'],
    'ibuprofen': ['ibuprophen', 'ibupropen', 'advil', 'motrin'],
    'naproxen': ['naproxin', 'naproxyn', 'aleve', 'naprosyn'],
    'diclofenac': ['diclofanak', 'diclofenak', 'voltaren'],
    'tramadol': ['tramodol', 'tramadal', 'ultram'],
    'codeine': ['codeen', 'codeein'],
    'morphine': ['morfine', 'morpheen'],
    'oxycodone': ['oxycodon', 'oxycoden', 'oxycontin', 'percocet'],
    'hydrocodone': ['hydrocodon', 'hydrocoden', 'vicodin', 'norco'],

    // Gastrointestinal
    'omeprazole': ['omeprazol', 'omeprazole', 'prilosec'],
    'lansoprazole': ['lansoprazol', 'lansaprazole', 'prevacid'],
    'esomeprazole': ['esomeprazol', 'esomaprazole', 'nexium'],
    'pantoprazole': ['pantoprazol', 'pantaprazole', 'protonix'],
    'ranitidine': ['rantidine', 'ranatidine', 'zantac'],
    'famotidine': ['famotideen', 'famatidine', 'pepcid'],
    'simethicone': ['simethicon', 'simethiconee', 'gas-x'],

    // Respiratory
    'albuterol': ['albutrol', 'albuterel', 'proventil', 'ventolin'],
    'salmeterol': ['salmeterel', 'salmaterol', 'serevent'],
    'fluticasone': ['fluticason', 'fluticasone', 'flovent', 'flonase'],
    'montelukast': ['monteleukast', 'montelucast', 'singulair'],
    'cetirizine': ['cetirizin', 'cetrizine', 'zyrtec'],
    'loratadine': ['loratadin', 'loratadeen', 'claritin'],
    'pseudoephedrine': ['pseudoephedrin', 'pseudoephedreen', 'sudafed'],

    // Neurological
    'gabapentin': ['gabapenten', 'gabapantin', 'neurontin'],
    'pregabalin': ['pregabaleen', 'pregabalen', 'lyrica'],
    'phenytoin': ['phenytoen', 'phenytoyn', 'dilantin'],
    'carbamazepine': ['carbamazepin', 'carbamazepeen', 'tegretol'],
    'valproic acid': ['valproate', 'valproik acid', 'depakote'],
    'lamotrigine': ['lamotrigin', 'lamotrigeen', 'lamictal'],

    // Psychiatric
    'sertraline': ['sertralin', 'sertraleen', 'zoloft'],
    'fluoxetine': ['fluoxetin', 'fluoxeteen', 'prozac'],
    'paroxetine': ['paroxetin', 'paroxeteen', 'paxil'],
    'escitalopram': ['escitalapram', 'escitaloprem', 'lexapro'],
    'alprazolam': ['alprazalam', 'alprazolam', 'xanax'],
    'lorazepam': ['lorazapam', 'lorazepem', 'ativan'],
    'clonazepam': ['clonazapam', 'clonazepem', 'klonopin'],

    // Endocrine
    'levothyroxine': ['levothyroxin', 'levothyroxeen', 'synthroid', 'levoxyl'],
    'liothyronine': ['liothyronin', 'liothyroneen', 'cytomel'],
    'prednisone': ['prednizon', 'prednisone', 'deltasone'],
    'prednisolone': ['prednisolon', 'prednisolonee'],
    'dexamethasone': ['dexamethason', 'dexamethasone'],

    // Vitamins and supplements
    'vitamin d': ['vitamin dee', 'vitamen d', 'cholecalciferol'],
    'vitamin b12': ['vitamin b twelve', 'vitamen b12', 'cyanocobalamin'],
    'folic acid': ['folik acid', 'folate', 'folacin'],
    'calcium': ['calcium', 'calcyum'],
    'magnesium': ['magneesium', 'magnesyum'],
    'iron': ['iron', 'ferrous sulfate'],

    // Medical terms and dosage
    'milligrams': ['mg', 'milligram', 'miligrams'],
    'micrograms': ['mcg', 'microgram', 'mikrograms'],
    'milliliters': ['ml', 'milliliter', 'mililiter'],
    'tablet': ['tab', 'pill', 'tablets'],
    'capsule': ['cap', 'caps', 'capsules'],
    'once daily': ['od', 'once a day', 'daily', 'one time daily'],
    'twice daily': ['bid', 'twice a day', 'two times daily', 'b.i.d'],
    'three times daily': ['tid', 'three times a day', 't.i.d'],
    'four times daily': ['qid', 'four times a day', 'q.i.d'],
    'as needed': ['prn', 'as required', 'when needed', 'p.r.n'],
    'before meals': ['ac', 'ante cibum', 'a.c'],
    'after meals': ['pc', 'post cibum', 'p.c'],
    'at bedtime': ['hs', 'hora somni', 'h.s', 'bedtime'],
    'by mouth': ['po', 'per os', 'p.o', 'orally'],
    'intravenous': ['iv', 'i.v', 'intravenously'],
    'intramuscular': ['im', 'i.m', 'intramuscularly'],
    'subcutaneous': ['sc', 'subq', 's.c', 'subcutaneously']
  };

  // Enhanced medical terminology correction with phonetic matching
  const correctMedicalTerms = (text) => {
    return correctMedicalTermsWithDynamicDB(text);
  };

  const correctMedicalTermsWithDynamicDB = (text) => {
    let corrected = text;
    
    // ONLY perform direct replacements using AI Learning System's trained data
    // NO fuzzy matching, NO auto-corrections except for exact matches in learned corrections
    Object.entries(dynamicMedicationDB).forEach(([correct, variants]) => {
      variants.forEach(variant => {
        // Only replace if variant is actually a misspelling (not a number, unit, or medical term)
        // Skip if variant looks like: numbers (5mg, 10), units (mg, ml), or common medical words
        const skipPatterns = /^\d+$|^\d+mg$|^\d+mcg$|^mg$|^mcg$|^ml$|^oral$|^tablet$|^capsule$|^once$|^twice$|^daily$/i;
        
        if (!skipPatterns.test(variant)) {
          const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          corrected = corrected.replace(regex, correct);
        }
      });
    });

    // NO FUZZY MATCHING - Completely removed
    // Auto-correction should ONLY happen for:
    // 1. Exact matches in dynamicMedicationDB (user-learned corrections)
    // 2. Exact matches in MEDICATION_CORRECTIONS (known common misspellings)
    
    return corrected;
  };

  // Levenshtein distance for fuzzy matching
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Find medication corrections for user feedback
  const findMedicationCorrections = (original, corrected) => {
    const originalWords = original.toLowerCase().split(' ');
    const correctedWords = corrected.toLowerCase().split(' ');
    const corrections = [];
    
    for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
      if (originalWords[i] !== correctedWords[i] && 
          Object.keys(MEDICATION_DATABASE).includes(correctedWords[i])) {
        corrections.push({
          original: originalWords[i],
          corrected: correctedWords[i],
          timestamp: new Date().toLocaleTimeString(),
          confidence: calculateSimilarity(originalWords[i], correctedWords[i])
        });
      }
    }
    
    return corrections;
  };

  const handleEHRImport = () => {
    if (!patientId.trim()) {
      alert('Please enter a Patient ID');
      return;
    }
    
    if (!isEhrConnected) {
      const setup = confirm('⚠️ EHR system not configured!\n\nWould you like to:\n• OK = Go to Settings to configure EHR\n• Cancel = Load demo data for testing');
      if (setup) {
        setShowSettings(true);
        setShowEHRImport(false);
        return;
      }
    }
    
    const confirmImport = confirm(`Fetching data for Patient ID: ${patientId}\n\n${isEhrConnected ? `From: ${ehrSystem}\nEndpoint: ${ehrEndpoint}` : 'Using demo data (EHR not connected)'}\n\nLoad data?`);
    
    if (confirmImport) {
      // Demo data
      setPatientName('Priya Sharma');
      setPatientAge('45');
      setPatientGender('Female');
      setPatientHeight('165 cm');
      setPatientWeight('68 kg');
      setPatientBP('130/85 mmHg');
      setPastMedicalHistory('• Type 2 Diabetes Mellitus (diagnosed 2018)\n• Essential Hypertension (diagnosed 2020)\n• Hyperlipidemia\n• Family history of cardiovascular disease');
      setAllergies('• Penicillin (causes rash)\n• Sulfa drugs (anaphylaxis)\n• Shellfish (mild reaction)');
      setPastMedications('• Metformin 500mg - Twice daily (ongoing)\n• Lisinopril 5mg - Once daily (ongoing)\n• Atorvastatin 20mg - Once daily at bedtime');
      alert('✅ Sample data loaded for Patient ID: ' + patientId + '\n\n' + (isEhrConnected ? 'Connected via: ' + ehrSystem : 'Demo mode - configure EHR in Settings'));
    }
    
    setShowEHRImport(false);
  };

  const handleEhrConnect = () => {
    if (!ehrSystem || !ehrEndpoint) {
      alert('Please fill in EHR System and API Endpoint');
      return;
    }
    setIsEhrConnected(true);
    alert('✅ EHR System Connected!\n\nSystem: ' + ehrSystem + '\nEndpoint: ' + ehrEndpoint + '\n\nYou can now import patient data.');
    setShowSettings(false);
  };

  const handleEhrDisconnect = () => {
    setIsEhrConnected(false);
    setEhrSystem('');
    setEhrApiKey('');
    setEhrEndpoint('');
    alert('EHR system disconnected');
  };

  const handleReview = () => setCurrentView('review');

  const handlePrintPDF = async () => {
    try {
      // Create PDF content
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Header with doctor information
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MEDICAL PRESCRIPTION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Doctor details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Dr. ${currentDoctor.name}`, 20, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${currentDoctor.degree}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Registration: ${currentDoctor.registration_number || currentDoctor.registrationNumber}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`${currentDoctor.organization}`, 20, yPosition);
      yPosition += 10;
      
      // Date and time
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      pdf.text(`Time: ${new Date().toLocaleTimeString()}`, 120, yPosition);
      yPosition += 5;
      
      // Prescription ID (generate unique ID for this prescription)
      const prescriptionId = 'RX' + Date.now().toString().slice(-8);
      pdf.text(`Prescription ID: ${prescriptionId}`, 20, yPosition);
      yPosition += 10;
      
      // Patient Information
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION:', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${patientName || 'Not specified'}`, 20, yPosition);
      yPosition += 5;
      
      // Add MRN and Visit Code if available
      if (currentPatientMRN) {
        pdf.text(`Medical Record No.: ${currentPatientMRN}`, 20, yPosition);
        yPosition += 5;
      }
      if (patientCode) {
        pdf.text(`Visit Code: ${patientCode}`, 20, yPosition);
        yPosition += 5;
      }
      pdf.text(`Age: ${patientAge || 'N/A'}   Gender: ${patientGender || 'N/A'}   Height: ${patientHeight || 'N/A'}   Weight: ${patientWeight || 'N/A'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Blood Pressure: ${patientBP || 'N/A'}   Temperature: ${temperature || 'N/A'}`, 20, yPosition);
      if (heartRate || oxygenSaturation) {
        yPosition += 5;
        pdf.text(`Heart Rate: ${heartRate || 'N/A'}   O2 Saturation: ${oxygenSaturation || 'N/A'}%`, 20, yPosition);
      }
      yPosition += 15;
      
      // Allergies (if any)
      if (allergies) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALLERGIES:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const allergiesLines = pdf.splitTextToSize(allergies, pageWidth - 40);
        pdf.text(allergiesLines, 20, yPosition);
        yPosition += allergiesLines.length * 5 + 10;
      }
      
      // Diagnosis
      if (diagnosis) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('DIAGNOSIS:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const diagnosisLines = pdf.splitTextToSize(diagnosis, pageWidth - 40);
        pdf.text(diagnosisLines, 20, yPosition);
        yPosition += diagnosisLines.length * 5 + 10;
      }
      
      // Medications/Prescriptions
      if (medications.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('PRESCRIPTIONS:', 20, yPosition);
        yPosition += 8;
        
        medications.forEach((med, index) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${med.name} - ${med.dosage}`, 25, yPosition);
          yPosition += 5;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`   Formulation: ${med.formulation}   Route: ${med.route}`, 25, yPosition);
          yPosition += 4;
          pdf.text(`   Frequency: ${med.frequency}   Food: ${med.foodInstruction}`, 25, yPosition);
          yPosition += 4;
          pdf.text(`   Duration: ${med.duration}`, 25, yPosition);
          yPosition += 8;
          
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
      
      // Prognosis
      if (prognosis) {
        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('PROGNOSIS & ADVICE:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const prognosisLines = pdf.splitTextToSize(prognosis, pageWidth - 40);
        pdf.text(prognosisLines, 20, yPosition);
        yPosition += prognosisLines.length * 5 + 15;
      }
      
      // Lab Tests & Investigations
      if (labTests && labTests.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('LAB TESTS & INVESTIGATIONS:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const labTestsLines = pdf.splitTextToSize(labTests, pageWidth - 40);
        pdf.text(labTestsLines, 20, yPosition);
        yPosition += labTestsLines.length * 5 + 10;
      }
      
      // Referrals
      if (referrals && referrals.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('REFERRALS & CONSULTATIONS:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const referralsLines = pdf.splitTextToSize(referrals, pageWidth - 40);
        pdf.text(referralsLines, 20, yPosition);
        yPosition += referralsLines.length * 5 + 10;
      }
      
      // Follow-up Instructions
      if (followUpInstructions && followUpInstructions.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('FOLLOW-UP INSTRUCTIONS:', 20, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const followUpLines = pdf.splitTextToSize(followUpInstructions, pageWidth - 40);
        pdf.text(followUpLines, 20, yPosition);
        yPosition += followUpLines.length * 5 + 10;
      }
      
      // Doctor signature area
      yPosition = Math.max(yPosition, pageHeight - 40);
      pdf.line(120, yPosition, 180, yPosition); // Signature line
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Dr. ${currentDoctor.name}`, 120, yPosition);
      yPosition += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${currentDoctor.degree}`, 120, yPosition);
      
      // Save the PDF
      const fileName = `Prescription_${patientName || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert(`✅ PDF Generated Successfully!\n\nFile: ${fileName}\nThe prescription has been downloaded to your device.`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`❌ PDF Generation Failed\n\nError: ${error.message}\nPlease try again or contact support.`);
    }
  };

  const handleSubmitToEHR = async () => {
    if (!isEhrConnected || ehrConfigurations.length === 0) {
      alert('⚠️ EHR system not configured. Please configure EHR settings first.');
      setShowEHRConfig(true);
      return;
    }
    
    // If no EHR provider is selected, show selection dialog
    if (!selectedEhrProvider && ehrConfigurations.length > 1) {
      const providerOptions = ehrConfigurations.map((config, index) => 
        `${index + 1}. ${config.provider} (${config.base_url})`
      ).join('\n');
      
      const selection = prompt(`Multiple EHR systems configured. Select one:\n\n${providerOptions}\n\nEnter number (1-${ehrConfigurations.length}):`);
      
      if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < ehrConfigurations.length) {
          setSelectedEhrProvider(ehrConfigurations[index].provider);
          await submitPrescriptionToEHR();
        } else {
          alert('Invalid selection');
        }
      }
      return;
    }
    
    // Use the selected provider or the first available one
    const providerToUse = selectedEhrProvider || ehrConfigurations[0]?.provider;
    setSelectedEhrProvider(providerToUse);
    
    await submitPrescriptionToEHR();
  };

  const handleBothActions = () => {
    handlePrintPDF();
    setTimeout(() => {
      if (isEhrConnected) {
        handleSubmitToEHR();
      } else {
        alert('✅ PDF Generated\n⚠️ EHR submission skipped (not connected)');
      }
    }, 1000);
  };

  // Registration Screen
  if (showRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10"></div>
          <div className="relative">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-emerald-500 to-blue-500 p-4 rounded-xl shadow-lg mx-auto w-20 h-20 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mt-4 mb-2">Create Doctor Account</h1>
              <p className="text-blue-200">Join Shrutapex Professional Network</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Full Name *"
                value={registrationData.name}
                onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Degree (e.g., MBBS, MD) *"
                value={registrationData.degree}
                onChange={(e) => setRegistrationData({...registrationData, degree: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Medical Registration Number *"
                value={registrationData.registrationNumber}
                onChange={(e) => setRegistrationData({...registrationData, registrationNumber: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Organization/Hospital *"
                value={registrationData.organization}
                onChange={(e) => setRegistrationData({...registrationData, organization: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={registrationData.email}
                onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData({...registrationData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="mb-6">
              <select
                value={registrationData.specialization}
                onChange={(e) => setRegistrationData({...registrationData, specialization: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{color: 'white'}}
              >
                <option value="" style={{color: 'black', backgroundColor: 'white'}}>Select Specialization</option>
                <option value="Internal Medicine" style={{color: 'black', backgroundColor: 'white'}}>Internal Medicine</option>
                <option value="General Surgery" style={{color: 'black', backgroundColor: 'white'}}>General Surgery</option>
                <option value="Cardiology" style={{color: 'black', backgroundColor: 'white'}}>Cardiology</option>
                <option value="Neurology" style={{color: 'black', backgroundColor: 'white'}}>Neurology</option>
                <option value="Orthopedics" style={{color: 'black', backgroundColor: 'white'}}>Orthopedics</option>
                <option value="Pediatrics" style={{color: 'black', backgroundColor: 'white'}}>Pediatrics</option>
                <option value="Gynecology" style={{color: 'black', backgroundColor: 'white'}}>Gynecology</option>
                <option value="Dermatology" style={{color: 'black', backgroundColor: 'white'}}>Dermatology</option>
                <option value="Psychiatry" style={{color: 'black', backgroundColor: 'white'}}>Psychiatry</option>
                <option value="Emergency Medicine" style={{color: 'black', backgroundColor: 'white'}}>Emergency Medicine</option>
                <option value="Family Medicine" style={{color: 'black', backgroundColor: 'white'}}>Family Medicine</option>
                <option value="Other" style={{color: 'black', backgroundColor: 'white'}}>Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Username *"
                value={registrationData.username}
                onChange={(e) => setRegistrationData({...registrationData, username: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div></div>
              <input
                type="password"
                placeholder="Password *"
                value={registrationData.password}
                onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="password"
                placeholder="Confirm Password *"
                value={registrationData.confirmPassword}
                onChange={(e) => setRegistrationData({...registrationData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <button
              onClick={handleRegistration}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg mb-4"
            >
              Create Doctor Account
            </button>
            
            <div className="text-center">
              <button
                onClick={() => setShowRegistration(false)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Already have an account? Sign In
              </button>
            </div>

            <div className="bg-emerald-900/30 rounded-lg p-4 text-left mt-6">
              <p className="text-emerald-300 text-sm mb-2">Account Verification:</p>
              <p className="text-emerald-200 text-xs">✓ All accounts are instantly activated for demo purposes</p>
              <p className="text-emerald-200 text-xs">✓ In production, medical credentials would be verified</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient Storage Modal
  if (showPatientStorage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <User className="w-8 h-8 text-blue-400" />
                  Patient Storage System
                </h2>
                <button 
                  onClick={() => setShowPatientStorage(false)} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  ← Back
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Patient */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">🔍 Load Patient Data</h3>
                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-2">Patient Code</label>
                    <input
                      type="text"
                      value={searchPatientCode}
                      onChange={(e) => setSearchPatientCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-8 character patient code (e.g., AB1234)"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    onClick={searchPatientByCode}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all"
                  >
                    Load Patient Data
                  </button>
                </div>

                {/* Recent Patients */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">📋 Recent Patients</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedPatients.length > 0 ? (
                      savedPatients.slice(0, 8).map((patient) => (
                        <div key={patient.id} className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-all"
                             onClick={() => {
                               setSearchPatientCode(patient.patient_code);
                               searchPatientByCode();
                             }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{patient.patient_info.name}</p>
                              <p className="text-slate-400 text-sm">Code: {patient.patient_code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-300 text-sm">{new Date(patient.visit_date).toLocaleDateString()}</p>
                              <p className="text-slate-500 text-xs">{patient.diagnosis || 'No diagnosis'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        No saved patients yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h4 className="text-blue-300 font-semibold mb-2">💡 How Patient Storage Works:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Each patient gets a unique 6-8 character code (e.g., AB1234)</li>
                  <li>• Use "Save Patient" after completing documentation to store all information</li>
                  <li>• Enter the patient code here to instantly load all previous data</li>
                  <li>• Perfect for follow-up visits and continuing care</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Medication Templates Modal
  if (showMedicationTemplates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Pill className="w-8 h-8 text-orange-400" />
                  Medication Templates
                </h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowMedicationTemplates(false);
                      setShowCreateTemplate(true);
                    }}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-medium"
                  >
                    + Create Template
                  </button>
                  <button 
                    onClick={() => setShowMedicationTemplates(false)} 
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {medicationTemplates.length > 0 ? (
                  medicationTemplates.map((template) => (
                    <div key={template.id} className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{template.name}</h4>
                          <p className="text-orange-300 text-sm capitalize">{template.disease_condition}</p>
                        </div>
                        <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                          {template.medications.length} meds
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-slate-400 text-xs mb-2">Medications:</p>
                        <div className="space-y-1">
                          {template.medications.slice(0, 3).map((med, idx) => (
                            <p key={idx} className="text-slate-300 text-xs">
                              • {med.name} {med.dosage} {med.frequency}
                            </p>
                          ))}
                          {template.medications.length > 3 && (
                            <p className="text-slate-500 text-xs">+ {template.medications.length - 3} more...</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Used {template.usage_count} times
                          {template.is_public && <span className="ml-2 text-blue-400">• Public</span>}
                        </div>
                        <button
                          onClick={() => loadMedicationTemplate(template.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-all"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center bg-slate-800/30 border border-slate-600/30 rounded-xl">
                    <Pill className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No medication templates yet</p>
                    <p className="text-slate-500 text-sm">Create your first template to speed up prescriptions</p>
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <h4 className="text-orange-300 font-semibold mb-2">💊 Medication Templates Benefits:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Save time by creating preset medication combinations for common conditions</li>
                  <li>• Ensure consistency in treatment protocols across patients</li>
                  <li>• Share public templates with other doctors in the system</li>
                  <li>• Most-used templates appear first for quick access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Template Modal - Enhanced Version
  if (showCreateTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Plus className="w-8 h-8 text-emerald-400" />
                Create Disease-Specific Medication Template
              </h2>
              
              {/* Template Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-emerald-300 font-semibold text-sm mb-2 uppercase tracking-wide">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="e.g., HTN First Line Treatment"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-emerald-300 font-semibold text-sm mb-2 uppercase tracking-wide">Disease/Condition</label>
                  <select
                    value={newTemplate.disease_condition}
                    onChange={(e) => setNewTemplate({...newTemplate, disease_condition: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" style={{color: 'black', backgroundColor: 'white'}}>Select Disease</option>
                    <option value="Hypertension" style={{color: 'black', backgroundColor: 'white'}}>Hypertension</option>
                    <option value="Type 2 Diabetes" style={{color: 'black', backgroundColor: 'white'}}>Type 2 Diabetes</option>
                    <option value="Upper Respiratory Infection" style={{color: 'black', backgroundColor: 'white'}}>Upper Respiratory Infection</option>
                    <option value="Urinary Tract Infection" style={{color: 'black', backgroundColor: 'white'}}>Urinary Tract Infection</option>
                    <option value="Bronchial Asthma" style={{color: 'black', backgroundColor: 'white'}}>Bronchial Asthma</option>
                    <option value="Gastritis/GERD" style={{color: 'black', backgroundColor: 'white'}}>Gastritis/GERD</option>
                    <option value="Anxiety/Depression" style={{color: 'black', backgroundColor: 'white'}}>Anxiety/Depression</option>
                    <option value="Arthritis/Joint Pain" style={{color: 'black', backgroundColor: 'white'}}>Arthritis/Joint Pain</option>
                    <option value="Custom" style={{color: 'black', backgroundColor: 'white'}}>Custom (Enter below)</option>
                  </select>
                  
                  {newTemplate.disease_condition === 'Custom' && (
                    <input
                      type="text"
                      value={newTemplate.custom_disease}
                      onChange={(e) => setNewTemplate({...newTemplate, custom_disease: e.target.value})}
                      placeholder="Enter custom disease/condition"
                      className="w-full mt-2 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* Add Medications from Scratch */}
              <div className="mb-6">
                <label className="block text-emerald-300 font-semibold text-sm mb-3 uppercase tracking-wide">
                  Add Medications to Template
                </label>
                
                {/* Add New Medication Form */}
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-600/50 mb-4">
                  <p className="text-slate-300 font-medium mb-3">➕ Add New Medication</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                      placeholder="Drug name"
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <input
                      type="text"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                      placeholder="Dosage (e.g., 5mg)"
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <select
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="" style={{color: 'black', backgroundColor: 'white'}}>Frequency</option>
                      <option value="Once daily" style={{color: 'black', backgroundColor: 'white'}}>Once daily</option>
                      <option value="Twice daily" style={{color: 'black', backgroundColor: 'white'}}>Twice daily</option>
                      <option value="Three times daily" style={{color: 'black', backgroundColor: 'white'}}>Three times daily</option>
                      <option value="Four times daily" style={{color: 'black', backgroundColor: 'white'}}>Four times daily</option>
                      <option value="As needed" style={{color: 'black', backgroundColor: 'white'}}>As needed</option>
                    </select>
                    <button
                      onClick={() => {
                        if (newMedication.name && newMedication.dosage && newMedication.frequency) {
                          const templateMed = `${newMedication.name} ${newMedication.dosage} ${newMedication.frequency}`;
                          setNewTemplate({
                            ...newTemplate,
                            medications: [...newTemplate.medications, templateMed]
                          });
                          setNewMedication({
          name: '',
          dosage: '',
          form: '',
          frequency: '',
          duration: '',
          foodInstruction: 'With or without food',
          instructions: ''
        });
                        }
                      }}
                      disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
                    >
                      Add Med
                    </button>
                  </div>
                </div>

                {/* Copy from Current Prescription */}
                {medications.length > 0 && (
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-600/50 mb-4">
                    <p className="text-slate-300 font-medium mb-3">📋 Copy from Current Prescription</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                      {medications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium text-sm truncate block">{med.name}</span>
                            <span className="text-slate-400 text-xs">{med.dosage} - {med.frequency}</span>
                          </div>
                          <button
                            onClick={() => {
                              const templateMed = `${med.name} ${med.dosage} ${med.frequency}`;
                              if (!newTemplate.medications.includes(templateMed)) {
                                setNewTemplate({
                                  ...newTemplate,
                                  medications: [...newTemplate.medications, templateMed]
                                });
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-all ml-2"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Medications List */}
                {newTemplate.medications.length > 0 && (
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                    <p className="text-emerald-300 font-medium mb-3">💊 Template Medications ({newTemplate.medications.length})</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {newTemplate.medications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span className="text-white text-sm">{med}</span>
                          <button
                            onClick={() => {
                              setNewTemplate({
                                ...newTemplate,
                                medications: newTemplate.medications.filter((_, i) => i !== index)
                              });
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Template Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-emerald-300 font-semibold text-sm mb-2 uppercase tracking-wide">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="Template usage notes, special instructions, or contraindications..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-emerald-300 font-semibold text-sm mb-2 uppercase tracking-wide">Template Visibility</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.is_public}
                        onChange={(e) => setNewTemplate({...newTemplate, is_public: e.target.checked})}
                        className="mr-3 w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">Make template public (accessible to other doctors)</span>
                    </label>
                    <p className="text-slate-400 text-xs ml-7">Public templates help build a community knowledge base</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowCreateTemplate(false);
                    setShowMedicationTemplates(true);
                    setNewTemplate({
                      name: '',
                      disease_condition: '',
                      custom_disease: '',
                      medications: [],
                      description: '',
                      is_public: false
                    });
                    setNewMedication({
          name: '',
          dosage: '',
          form: '',
          frequency: '',
          duration: '',
          foodInstruction: 'With or without food',
          instructions: ''
        });
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
                >
                  ← Back to Templates
                </button>
                <button
                  onClick={createMedicationTemplate}
                  disabled={!newTemplate.name || (!newTemplate.disease_condition || newTemplate.disease_condition === 'Custom' && !newTemplate.custom_disease) || newTemplate.medications.length === 0 || isCreatingTemplate}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-bold transition-all disabled:cursor-not-allowed"
                >
                  {isCreatingTemplate ? 'Creating Template...' : `Create Template (${newTemplate.medications.length} medications)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  // ============ NEW PATIENT MANAGEMENT MODALS ============
  
  // New vs Existing Patient Choice Modal
  if (showNewVsExisting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5"></div>
            <div className="relative text-center">
              
              <div className="mb-8">
                <User className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">Save Patient Information</h2>
                <p className="text-slate-300 text-lg">Is this a new patient or an existing patient with a new visit?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="text-center mb-4">
                    <Plus className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">New Patient</h3>
                    <p className="text-slate-300 text-sm">Create a new patient record with unique Medical Record Number (MRN)</p>
                  </div>
                  <button
                    onClick={proceedWithNewPatient}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    Create New Patient
                  </button>
                </div>

                <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="text-center mb-4">
                    <User className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Existing Patient</h3>
                    <p className="text-slate-300 text-sm">Add a new visit to an existing patient record</p>
                  </div>
                  <button
                    onClick={proceedWithExistingPatient}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all"
                  >
                    Add Visit to Existing
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowNewVsExisting(false)}
                  className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPatientSearch(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all"
                >
                  🔍 Search Patients First
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Patient Search Modal
  if (showPatientSearch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
            <div className="relative">
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <User className="w-8 h-8 text-purple-400" />
                  Search Existing Patients
                </h2>
                <button 
                  onClick={() => {
                    setShowPatientSearch(false);
                    setShowNewVsExisting(true);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  ← Back
                </button>
              </div>

              <div className="mb-8">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    placeholder="Enter patient name, MRN (e.g., MRN1234567), or phone number..."
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  />
                  <button
                    onClick={searchPatients}
                    disabled={isSearching || !patientSearchTerm.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : '🔍 Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Search Results</h3>
                {searchResults.length > 0 ? (
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {searchResults.map((patient, index) => (
                      <div key={patient.mrn || index} className="p-4 bg-slate-800/30 border border-slate-600/30 rounded-xl hover:bg-slate-700/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{patient.patient_info?.name}</h4>
                            <p className="text-slate-400 text-sm">MRN: {patient.mrn}</p>
                            <p className="text-slate-400 text-sm">
                              Age: {patient.patient_info?.age} | Gender: {patient.patient_info?.gender}
                            </p>
                            <p className="text-slate-400 text-sm">
                              Total Visits: {patient.total_visits} | Last Visit: {new Date(patient.latest_visit_date).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => selectExistingPatient(patient)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold transition-all"
                          >
                            Select Patient
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-800/30 border border-slate-600/30 rounded-xl">
                    <User className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">
                      {patientSearchTerm ? `No patients found matching "${patientSearchTerm}"` : 'Enter search criteria above to find existing patients'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowPatientSearch(false);
                    setShowNewVsExisting(true);
                  }}
                  className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  ← Back to Options
                </button>
                <button
                  onClick={proceedWithNewPatient}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all"
                >
                  Create New Patient Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Save Patient Dialog
  if (showSavePatientDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Save className="w-8 h-8 text-green-400" />
                  {currentPatientMRN ? `Add Visit to ${selectedPatient?.patient_info?.name}` : 'Create New Patient Record'}
                </h2>
                <button 
                  onClick={() => setShowSavePatientDialog(false)} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  ✕ Cancel
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <h4 className="text-blue-300 font-semibold mb-3">📋 Patient Information Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white ml-2">{patientName || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Age:</span>
                      <span className="text-white ml-2">{patientAge || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Gender:</span>
                      <span className="text-white ml-2">{patientGender || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Diagnosis:</span>
                      <span className="text-white ml-2">{diagnosis || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <h4 className="text-emerald-300 font-semibold mb-2">🔑 Unique Patient Code</h4>
                  <p className="text-slate-300 text-sm mb-2">
                    A unique 6-8 character code will be generated for this patient. 
                    Use this code to retrieve all patient information in future visits.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Example codes:</span>
                    <span className="bg-slate-700 px-2 py-1 rounded">AB1234</span>
                    <span className="bg-slate-700 px-2 py-1 rounded">CD56789</span>
                  </div>
                </div>

                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <h4 className="text-orange-300 font-semibold mb-2">💾 What Will Be Saved:</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>• Complete patient demographics and vitals</li>
                    <li>• Medical history, allergies, and social history</li>
                    <li>• Current diagnosis and prognosis</li>
                    <li>• All consultation notes and transcript</li>
                    <li>• Visit date and time</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowSavePatientDialog(false)}
                    className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={currentPatientMRN ? addVisitToExistingPatient : createNewPatientWithVisit}
                    disabled={isSavingPatient || !patientName}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed"
                  >
                    {isSavingPatient ? 
                      (currentPatientMRN ? 'Adding Visit...' : 'Creating Patient...') : 
                      (currentPatientMRN ? `Add Visit to ${currentPatientMRN}` : 'Create New Patient')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-12 max-w-md w-full border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
          <div className="relative text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-xl shadow-lg mx-auto w-20 h-20 flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mt-4 mb-2">Shrutapex</h1>
              <p className="text-blue-200">Professional Medical Documentation System</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Username"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg mb-4"
            >
              <LogIn className="w-5 h-5 inline mr-2" />
              Login to Shrutapex
            </button>

            <button
              onClick={() => setShowRegistration(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg mb-6"
            >
              <User className="w-5 h-5 inline mr-2" />
              Create New Account
            </button>
            
            <div className="bg-slate-900/30 rounded-lg p-4 text-left">
              <p className="text-slate-300 text-sm mb-2">Demo Accounts:</p>
              <p className="text-slate-400 text-xs">👨‍⚕️ drsmith / password123 (Internal Medicine)</p>
              <p className="text-slate-400 text-xs">👩‍⚕️ drjohnson / password123 (Surgery)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same but with enhanced features...
  // [The component continues with all the existing views but enhanced with the new features]

  if (currentView === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-12 text-center max-w-md border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10"></div>
          <div className="relative">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
              <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto animate-pulse" style={{ filter: 'drop-shadow(0 0 20px rgba(52, 211, 153, 0.6))' }} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Prescription Completed!</h2>
            <p className="text-slate-300 mb-6 text-lg">Clinical documentation submitted to EHR</p>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/50 mb-6">
              <p className="text-sm text-slate-400 mb-1">Prescribed by</p>
              <p className="text-white font-semibold text-lg">{currentDoctor.name}</p>
              <p className="text-slate-400 text-sm">{currentDoctor.degree}</p>
              <p className="text-slate-400 text-sm">Reg: {currentDoctor.registrationNumber}</p>
            </div>
            <div className="pt-6 border-t border-slate-700/50">
              <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Preparing for next patient...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Settings className="w-8 h-8 text-blue-400" />
                  EHR Integration Settings
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowEHRConfig(true); setShowSettings(false); }} 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                  >
                    + Configure EHR
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)} 
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              {/* EHR Configurations List */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Configured EHR Systems</h3>
                
                {ehrConfigurations.length > 0 ? (
                  <div className="space-y-4">
                    {ehrConfigurations.map((config, index) => (
                      <div key={config.id} className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Link className="w-6 h-6 text-emerald-400" />
                            <div>
                              <p className="text-white font-semibold">{config.provider}</p>
                              <p className="text-slate-400 text-sm">{config.base_url}</p>
                              <p className="text-slate-500 text-xs">
                                Created: {new Date(config.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => testEhrConnection(config)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
                            >
                              Test
                            </button>
                            <input
                              type="radio"
                              name="selectedProvider"
                              value={config.provider}
                              checked={selectedEhrProvider === config.provider}
                              onChange={(e) => setSelectedEhrProvider(e.target.value)}
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-800/30 border border-slate-600/30 rounded-xl">
                    <Unlink className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">No EHR systems configured</p>
                    <p className="text-slate-500 text-sm">Configure your first EHR connection to enable prescription submission</p>
                  </div>
                )}

                {/* EHR Submission History */}
                {ehrSubmissions.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Recent EHR Submissions</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {ehrSubmissions.slice(0, 5).map((submission) => (
                        <div key={submission.id} className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-medium">
                                {submission.ehr_provider} - {submission.prescription_id.substring(0, 8)}...
                              </p>
                              <p className="text-slate-400 text-xs">
                                {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              submission.status === 'success' 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : submission.status === 'failed'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speech Recognition Settings */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Speech Recognition Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">Language & Accent</label>
                      <select 
                        value={speechLanguage}
                        onChange={(e) => setSpeechLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="en-AU">English (Australia)</option>
                        <option value="en-IN">English (India)</option>
                        <option value="es-ES">Spanish (Spain)</option>
                        <option value="es-MX">Spanish (Mexico)</option>
                        <option value="fr-FR">French (France)</option>
                        <option value="de-DE">German</option>
                        <option value="pt-BR">Portuguese (Brazil)</option>
                        <option value="hi-IN">Hindi (India)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">Recognition Quality</label>
                      <select 
                        value={speechQuality}
                        onChange={(e) => setSpeechQuality(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="high">High Quality (Recommended)</option>
                        <option value="balanced">Balanced</option>
                        <option value="fast">Fast (Lower Quality)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">Confidence Threshold</label>
                      <select 
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="0.5">50% - Very Permissive</option>
                        <option value="0.6">60% - Permissive</option>
                        <option value="0.7">70% - Balanced (Recommended)</option>
                        <option value="0.8">80% - Strict</option>
                        <option value="0.9">90% - Very Strict</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="noiseReduction"
                        checked={enableNoiseReduction}
                        onChange={(e) => setEnableNoiseReduction(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="noiseReduction" className="ml-2 text-sm text-purple-300">
                        Enable Noise Reduction
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-slate-400 text-xs mb-2">
                      <strong>Tips for better recognition:</strong> Speak clearly, use a quiet environment, 
                      and pause between sentences. Medical terms are automatically corrected.
                    </p>
                    <div className="space-y-1">
                      <p className="text-emerald-400 text-xs">
                        <strong>✅ Base Database:</strong> {Object.keys(MEDICATION_DATABASE).length} medications supported including generic and brand names
                      </p>
                      <p className="text-purple-400 text-xs">
                        <strong>🧠 User Trained:</strong> {userCorrections.length} custom corrections | {Math.max(0, Object.keys(dynamicMedicationDB).length - Object.keys(MEDICATION_DATABASE).length)} new medications learned
                      </p>
                      <p className="text-blue-400 text-xs">
                        <strong>📚 Training History:</strong> {trainingHistory.length} learning sessions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Integration Details
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>• <strong>HL7 FHIR R4:</strong> Standard REST API for healthcare data exchange</li>
                    <li>• <strong>OAuth 2.0:</strong> Secure authentication method</li>
                    <li>• <strong>Multiple Providers:</strong> Epic, Cerner, Allscripts, and more</li>
                    <li>• <strong>Prescription Export:</strong> Send prescriptions directly to EHR systems</li>
                    <li>• <strong>Audit Trail:</strong> Complete submission history and status tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EHR Configuration Modal
  if (showEHRConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Link className="w-8 h-8 text-emerald-400" />
                  Configure EHR System
                </h2>
                <button 
                  onClick={() => { setShowEHRConfig(false); setShowSettings(true); }} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">EHR Provider</label>
                  <select 
                    value={ehrConfigData.provider}
                    onChange={(e) => setEhrConfigData({...ehrConfigData, provider: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select EHR Provider</option>
                    {ehrProviders.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">FHIR Base URL</label>
                  <input
                    type="text"
                    value={ehrConfigData.baseUrl}
                    onChange={(e) => setEhrConfigData({...ehrConfigData, baseUrl: e.target.value})}
                    placeholder="https://fhir.ehr-system.com/api/FHIR/R4"
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={ehrConfigData.useOauth}
                        onChange={(e) => setEhrConfigData({...ehrConfigData, useOauth: e.target.checked})}
                        className="rounded"
                      />
                      Use OAuth 2.0
                    </label>
                  </div>
                </div>

                {ehrConfigData.useOauth ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Client ID</label>
                      <input
                        type="text"
                        value={ehrConfigData.clientId}
                        onChange={(e) => setEhrConfigData({...ehrConfigData, clientId: e.target.value})}
                        placeholder="OAuth Client ID"
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Client Secret</label>
                      <input
                        type="password"
                        value={ehrConfigData.clientSecret}
                        onChange={(e) => setEhrConfigData({...ehrConfigData, clientSecret: e.target.value})}
                        placeholder="OAuth Client Secret"
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Authorization URL</label>
                      <input
                        type="text"
                        value={ehrConfigData.authUrl}
                        onChange={(e) => setEhrConfigData({...ehrConfigData, authUrl: e.target.value})}
                        placeholder="https://fhir.ehr-system.com/oauth/authorize"
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Token URL</label>
                      <input
                        type="text"
                        value={ehrConfigData.tokenUrl}
                        onChange={(e) => setEhrConfigData({...ehrConfigData, tokenUrl: e.target.value})}
                        placeholder="https://fhir.ehr-system.com/oauth/token"
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">API Key</label>
                    <input
                      type="password"
                      value={ehrConfigData.apiKey}
                      onChange={(e) => setEhrConfigData({...ehrConfigData, apiKey: e.target.value})}
                      placeholder="API Key for authentication"
                      className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Organization ID</label>
                    <input
                      type="text"
                      value={ehrConfigData.organizationId}
                      onChange={(e) => setEhrConfigData({...ehrConfigData, organizationId: e.target.value})}
                      placeholder="Organization identifier (optional)"
                      className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Facility ID</label>
                    <input
                      type="text"
                      value={ehrConfigData.facilityId}
                      onChange={(e) => setEhrConfigData({...ehrConfigData, facilityId: e.target.value})}
                      placeholder="Facility identifier (optional)"
                      className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => testEhrConnection()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                  >
                    Test Connection
                  </button>
                  <button 
                    onClick={saveEhrConfiguration}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review Screen with Enhanced Actions
  if (currentView === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative">
              
              {/* Doctor Header */}
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-4 mb-4">
                  <User className="w-8 h-8 text-blue-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentDoctor.name}</h2>
                    <p className="text-blue-200">{currentDoctor.degree}</p>
                    <p className="text-blue-300 text-sm">Registration: {currentDoctor.registrationNumber}</p>
                    <p className="text-blue-300 text-sm">{currentDoctor.organization}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-sm">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-slate-300 text-sm">Time: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                Final Prescription Review
              </h2>

              {/* Patient Information */}
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <UserCircle2 className="w-6 h-6 text-blue-400" />
                  <p className="text-sm text-blue-300 font-semibold uppercase tracking-wide">Patient Information</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><p className="text-sm text-slate-400 mb-1">Name</p><p className="text-xl font-bold text-white">{patientName || 'Not specified'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Patient ID</p><p className="text-lg text-white">{patientId || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Age</p><p className="text-lg text-white">{patientAge || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Gender</p><p className="text-lg text-white">{patientGender || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Height</p><p className="text-lg text-white">{patientHeight || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Weight</p><p className="text-lg text-white">{patientWeight || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Blood Pressure</p><p className="text-lg text-white">{patientBP || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Temperature</p><p className="text-lg text-white">{temperature || 'N/A'}</p></div>
                </div>
                {(heartRate || respiratoryRate || oxygenSaturation) && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {heartRate && <div><p className="text-sm text-slate-400 mb-1">Heart Rate</p><p className="text-lg text-white">{heartRate} bpm</p></div>}
                    {respiratoryRate && <div><p className="text-sm text-slate-400 mb-1">Respiratory Rate</p><p className="text-lg text-white">{respiratoryRate}</p></div>}
                    {oxygenSaturation && <div><p className="text-sm text-slate-400 mb-1">O2 Saturation</p><p className="text-lg text-white">{oxygenSaturation}%</p></div>}
                  </div>
                )}
              </div>

              {/* Comprehensive Medical History */}
              {(pastMedicalHistory || allergies || pastMedications || familyHistory || smokingStatus || alcoholUse || exerciseLevel || drugUse) && (
                <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30">
                  <h3 className="font-semibold text-purple-300 mb-4 uppercase tracking-wide text-sm">Comprehensive Medical History</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {pastMedicalHistory && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Past Medical History</p>
                          <p className="text-white text-sm whitespace-pre-line bg-slate-900/30 p-3 rounded-lg">{pastMedicalHistory}</p>
                        </div>
                      )}
                      {allergies && (
                        <div>
                          <p className="text-xs text-red-400 mb-2 uppercase flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Allergies
                          </p>
                          <p className="text-red-200 text-sm whitespace-pre-line bg-red-900/20 p-3 rounded-lg border border-red-500/20">{allergies}</p>
                        </div>
                      )}
                      {pastMedications && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Current Medications</p>
                          <p className="text-white text-sm whitespace-pre-line bg-slate-900/30 p-3 rounded-lg">{pastMedications}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {familyHistory && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Family History</p>
                          <p className="text-white text-sm whitespace-pre-line bg-slate-900/30 p-3 rounded-lg">{familyHistory}</p>
                        </div>
                      )}
                      
                      {(smokingStatus || alcoholUse || exerciseLevel || drugUse) && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Social History</p>
                          <div className="bg-slate-900/30 p-3 rounded-lg space-y-2">
                            {smokingStatus && <p className="text-white text-sm"><span className="text-slate-400">Smoking:</span> {smokingStatus}</p>}
                            {alcoholUse && <p className="text-white text-sm"><span className="text-slate-400">Alcohol:</span> {alcoholUse}</p>}
                            {exerciseLevel && <p className="text-white text-sm"><span className="text-slate-400">Exercise:</span> {exerciseLevel}</p>}
                            {drugUse && <p className="text-white text-sm"><span className="text-slate-400">Recreational Drugs:</span> {drugUse}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div className="mb-8">
                <h3 className="font-semibold text-emerald-300 mb-3 uppercase tracking-wide text-sm">Diagnosis</h3>
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                  <p className="text-white text-lg leading-relaxed">{diagnosis}</p>
                </div>
              </div>

              {/* Comprehensive Prescription Form */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-blue-300 uppercase tracking-wide text-sm">Prescription Management</h3>
                  <button
                    onClick={() => setShowMedicationTemplates(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-all"
                  >
                    📋 Load Template
                  </button>
                </div>

                {/* Add New Medication Form */}
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30">
                  <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Medication
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Medicine Name */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Medicine Name *</label>
                      <input
                        type="text"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                        placeholder="e.g., Paracetamol, Amoxicillin"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Dosage */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Dosage *</label>
                      <input
                        type="text"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                        placeholder="e.g., 500mg, 250mg"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Dosage Form */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Dosage Form *</label>
                      <select
                        value={newMedication.form}
                        onChange={(e) => setNewMedication({...newMedication, form: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" style={{color: 'black'}}>Select Form</option>
                        <option value="Tablet" style={{color: 'black'}}>Tablet</option>
                        <option value="Capsule" style={{color: 'black'}}>Capsule</option>
                        <option value="Syrup" style={{color: 'black'}}>Syrup</option>
                        <option value="Suspension" style={{color: 'black'}}>Suspension</option>
                        <option value="Injection" style={{color: 'black'}}>Injection</option>
                        <option value="Cream" style={{color: 'black'}}>Cream</option>
                        <option value="Ointment" style={{color: 'black'}}>Ointment</option>
                        <option value="Drops" style={{color: 'black'}}>Drops</option>
                        <option value="Inhaler" style={{color: 'black'}}>Inhaler</option>
                      </select>
                    </div>

                    {/* Route of Administration */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Route of Administration *</label>
                      <select
                        value={newMedication.route}
                        onChange={(e) => setNewMedication({...newMedication, route: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Oral" style={{color: 'black'}}>Oral</option>
                        <option value="Intravenous (IV)" style={{color: 'black'}}>Intravenous (IV)</option>
                        <option value="Intramuscular (IM)" style={{color: 'black'}}>Intramuscular (IM)</option>
                        <option value="Subcutaneous (SC)" style={{color: 'black'}}>Subcutaneous (SC)</option>
                        <option value="Inhalation" style={{color: 'black'}}>Inhalation</option>
                        <option value="Nebulization" style={{color: 'black'}}>Nebulization</option>
                        <option value="Topical" style={{color: 'black'}}>Topical</option>
                        <option value="Sublingual" style={{color: 'black'}}>Sublingual</option>
                        <option value="Rectal" style={{color: 'black'}}>Rectal</option>
                        <option value="Transdermal" style={{color: 'black'}}>Transdermal</option>
                        <option value="Nasal" style={{color: 'black'}}>Nasal</option>
                        <option value="Ophthalmic" style={{color: 'black'}}>Ophthalmic</option>
                        <option value="Otic" style={{color: 'black'}}>Otic</option>
                        <option value="Vaginal" style={{color: 'black'}}>Vaginal</option>
                      </select>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Frequency *</label>
                      <select
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" style={{color: 'black'}}>Select Frequency</option>
                        <option value="Once daily (OD)" style={{color: 'black'}}>Once daily (OD)</option>
                        <option value="Twice daily (BD)" style={{color: 'black'}}>Twice daily (BD)</option>
                        <option value="Three times daily (TDS)" style={{color: 'black'}}>Three times daily (TDS)</option>
                        <option value="Four times daily (QDS)" style={{color: 'black'}}>Four times daily (QDS)</option>
                        <option value="Every 4 hours" style={{color: 'black'}}>Every 4 hours</option>
                        <option value="Every 6 hours" style={{color: 'black'}}>Every 6 hours</option>
                        <option value="Every 8 hours" style={{color: 'black'}}>Every 8 hours</option>
                        <option value="As needed (PRN)" style={{color: 'black'}}>As needed (PRN)</option>
                        <option value="At bedtime (HS)" style={{color: 'black'}}>At bedtime (HS)</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Duration *</label>
                      <input
                        type="text"
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                        placeholder="e.g., 7 days, 2 weeks, 1 month"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Food Instructions */}
                    <div>
                      <label className="block text-blue-200 text-sm font-medium mb-2">Food Instructions</label>
                      <select
                        value={newMedication.foodInstruction}
                        onChange={(e) => setNewMedication({...newMedication, foodInstruction: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="With or without food" style={{color: 'black'}}>With or without food</option>
                        <option value="Before meals" style={{color: 'black'}}>Before meals</option>
                        <option value="After meals" style={{color: 'black'}}>After meals</option>
                        <option value="With food" style={{color: 'black'}}>With food</option>
                        <option value="On empty stomach" style={{color: 'black'}}>On empty stomach</option>
                        <option value="Before breakfast" style={{color: 'black'}}>Before breakfast</option>
                        <option value="After breakfast" style={{color: 'black'}}>After breakfast</option>
                        <option value="Before dinner" style={{color: 'black'}}>Before dinner</option>
                        <option value="After dinner" style={{color: 'black'}}>After dinner</option>
                        <option value="With milk" style={{color: 'black'}}>With milk</option>
                        <option value="Avoid dairy" style={{color: 'black'}}>Avoid dairy</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="mb-4">
                    <label className="block text-blue-200 text-sm font-medium mb-2">Special Instructions</label>
                    <textarea
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                      placeholder="Additional instructions, warnings, or precautions..."
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                  </div>

                  <button
                    onClick={addMedicationToReview}
                    disabled={!newMedication.name || !newMedication.dosage || !newMedication.form || !newMedication.route || !newMedication.frequency || !newMedication.duration}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                  >
                    Add Medication
                  </button>
                </div>

                {/* Current Medications List */}
                <div className="space-y-4">
                  {medications.map((med, i) => (
                    <div key={i} className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="font-bold text-white text-lg mb-1">{med.name} - {med.dosage}</p>
                              <p className="text-slate-400 text-sm">{med.formulation || med.form} • {med.route || 'Oral'}</p>
                            </div>
                            <div>
                              <p className="text-white font-medium">{med.frequency}</p>
                              <p className="text-slate-400 text-sm">{med.foodInstruction} • {med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-yellow-200 text-sm">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeMedication(i)}
                          className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {medications.length === 0 && (
                    <div className="p-8 text-center bg-slate-800/30 border border-slate-600/30 rounded-xl">
                      <Pill className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400 mb-2">No medications added yet</p>
                      <p className="text-slate-500 text-sm">Add medications using the form above or load from templates</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prognosis */}
              <div className="mb-8">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Prognosis</h3>
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                  <p className="text-white text-lg leading-relaxed">{prognosis}</p>
                </div>
              </div>

              {/* Drug Interactions */}
              {interactions.length > 0 && (
                <div className="mb-8 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Interactions Acknowledged
                  </h3>
                  <ul className="space-y-2">
                    {interactions.map((int, i) => (
                      <li key={i} className="text-amber-200 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                        {int.type === 'drug-drug' ? `${int.drug1} + ${int.drug2}` : `${int.drug} + Food Interactions`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setCurrentView('input')} 
                  className="py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all border border-slate-600"
                >
                  ← Back to Edit
                </button>
                <button 
                  onClick={() => setShowSavePatientDialog(true)}
                  className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Save Patient
                </button>
                <button 
                  onClick={handlePrintPDF} 
                  className="py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Print PDF
                </button>
                <button 
                  onClick={isEhrConnected ? handleSubmitToEHR : () => alert('Please configure EHR connection in Settings')} 
                  className={`py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isEhrConnected 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white' 
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={!isEhrConnected || isSubmittingToEHR}
                >
                  {isSubmittingToEHR ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit to EHR
                    </>
                  )}
                </button>
              </div>
              
              {/* Combined Action */}
              <button 
                onClick={handleBothActions} 
                className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                style={{ boxShadow: '0 10px 40px rgba(147, 51, 234, 0.4)' }}
              >
                🎯 Print PDF & Submit to EHR (Both Actions)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Doctor Info and Logout */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                  Shrutapex<Sparkles className="w-6 h-6 text-yellow-300" />
                </h1>
                <p className="text-blue-100 text-sm md:text-base">Professional Medical Documentation System</p>
                <p className="text-blue-200 text-sm">Dr. {currentDoctor.name} • {currentDoctor.organization}</p>
              </div>
            </div>
            
            {/* Patient Information Panel - Enhanced */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[320px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="w-5 h-5 text-blue-200" />
                  <p className="text-sm text-blue-200 font-semibold">Patient Information</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLogout} 
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg text-red-300 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-white transition-all"
                    title="Settings"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => setShowEHRImport(!showEHRImport)} 
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-white transition-all"
                  >
                    Import EHR
                  </button>
                </div>
              </div>
              
              {showEHRImport && (
                <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20">
                  <input 
                    type="text" 
                    value={patientId} 
                    onChange={(e) => setPatientId(e.target.value)} 
                    placeholder="Enter Patient ID" 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 mb-2 text-sm" 
                  />
                  <button 
                    onClick={handleEHRImport} 
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Fetch Data
                  </button>
                </div>
              )}
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)} 
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" 
                  placeholder="Patient Name" 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={patientAge} 
                    onChange={(e) => setPatientAge(e.target.value)} 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" 
                    placeholder="Age" 
                  />
                  <select 
                    value={patientGender} 
                    onChange={(e) => setPatientGender(e.target.value)} 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                    style={{color: 'white'}}
                  >
                    <option value="" style={{color: 'black', backgroundColor: 'white'}}>Gender</option>
                    <option value="Male" style={{color: 'black', backgroundColor: 'white'}}>Male</option>
                    <option value="Female" style={{color: 'black', backgroundColor: 'white'}}>Female</option>
                    <option value="Other" style={{color: 'black', backgroundColor: 'white'}}>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    value={patientHeight} 
                    onChange={(e) => setPatientHeight(e.target.value)} 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" 
                    placeholder="Height" 
                  />
                  <input 
                    type="text" 
                    value={patientWeight} 
                    onChange={(e) => setPatientWeight(e.target.value)} 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" 
                    placeholder="Weight" 
                  />
                  <input 
                    type="text" 
                    value={patientBP} 
                    onChange={(e) => setPatientBP(e.target.value)} 
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" 
                    placeholder="BP" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Documentation Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 mb-6 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative text-center mb-6">
            <div className="inline-block relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30"></div>
                  <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20"></div>
                </>
              )}
              <button 
                onClick={toggleListening} 
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl ${
                  isListening 
                    ? 'bg-gradient-to-br from-red-500 to-red-600' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`} 
                style={{ 
                  boxShadow: isListening 
                    ? '0 0 60px rgba(239, 68, 68, 0.6)' 
                    : '0 0 60px rgba(59, 130, 246, 0.6)' 
                }}
                title={isListening ? "Stop Recording" : "Start Recording"}
              >
                {isListening ? <MicOff className="w-14 h-14 text-white" /> : <Mic className="w-14 h-14 text-white" />}
              </button>
            </div>
            <div className="mt-6">
              <p className="text-xl md:text-2xl font-bold text-white mb-2">
                {isListening ? 'Recording Consultation...' : 'Start Voice Documentation'}
              </p>
              <p className="text-slate-400 mb-1">
                {isListening 
                  ? 'Click microphone again to STOP recording and process' 
                  : 'Click the microphone to begin recording'
                }
              </p>
              
              {/* Trigger Words Guide */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 text-sm font-medium">Smart Trigger Words - Speak Naturally</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-blue-400 font-medium">📋 Diagnosis:</span>
                    <span className="text-slate-300 ml-1">"Patient has hypertension"</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-medium">💊 Medications:</span>
                    <span className="text-slate-300 ml-1">"Prescribe cinnarizine 25mg"</span>
                  </div>
                  <div>
                    <span className="text-purple-400 font-medium">🔮 Prognosis:</span>
                    <span className="text-slate-300 ml-1">"Expected outcome is good"</span>
                  </div>
                  <div>
                    <span className="text-yellow-400 font-medium">👨‍👩‍👧 Family History:</span>
                    <span className="text-slate-300 ml-1">"Father had diabetes"</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-medium">⚠️ Allergies:</span>
                    <span className="text-slate-300 ml-1">"Allergic to penicillin"</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-medium">📊 Vitals:</span>
                    <span className="text-slate-300 ml-1">"Blood pressure 120/80"</span>
                  </div>
                </div>
              </div>
              
              {/* Speech Quality Indicator removed per user request */}

              {/* Medication Correction Feedback */}
              {lastCorrectedMeds.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-300 text-sm font-medium">Medication Auto-Corrected</span>
                  </div>
                  {lastCorrectedMeds.slice(0, 3).map((correction, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-emerald-200">
                      <span className="text-slate-400">"{correction.original}"</span>
                      <span className="text-emerald-400">→</span>
                      <span className="font-medium">"{correction.corrected}"</span>
                      <span className="text-slate-500">({(correction.confidence * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Transcript & Manual Correction Panel */}
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-purple-300 text-sm font-medium">AI Learning System</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLiveTranscript(!showLiveTranscript)}
                      className={`px-3 py-1 text-xs rounded-lg transition-all ${
                        showLiveTranscript 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                      }`}
                    >
                      {showLiveTranscript ? '🔴 Live Mode ON' : '⚪ Live Mode OFF'}
                    </button>
                    <button
                      onClick={() => setShowTrainingPanel(!showTrainingPanel)}
                      className="px-3 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs rounded-lg transition-all"
                    >
                      📚 Training History ({trainingHistory.length})
                    </button>
                  </div>
                </div>
                
                {showLiveTranscript && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-purple-300 mb-1">Live Transcript (Auto-captured)</label>
                      <textarea
                        value={liveTranscript}
                        onChange={(e) => setLiveTranscript(e.target.value)}
                        placeholder="Live transcript will appear here as you speak..."
                        className="w-full h-24 p-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-purple-300 mb-1">Manual Correction (Edit above text)</label>
                      <textarea
                        value={correctedTranscript}
                        onChange={(e) => setCorrectedTranscript(e.target.value)}
                        placeholder="Make corrections here (e.g., change 'innerism' to 'cinnarizine')..."
                        className="w-full h-24 p-3 bg-slate-900/50 border border-emerald-500/30 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={processManualCorrection}
                        disabled={!liveTranscript || !correctedTranscript}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white text-sm rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        🧠 Train App with Corrections
                      </button>
                      <button
                        onClick={() => {
                          setLiveTranscript('');
                          setCorrectedTranscript('');
                        }}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-all"
                      >
                        🗑️ Clear
                      </button>
                    </div>
                  </div>
                )}
                
                {showTrainingPanel && (
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">Training History</h4>
                      <button
                        onClick={clearTrainingHistory}
                        className="px-2 py-1 bg-red-600/20 text-red-300 hover:bg-red-600/30 text-xs rounded transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {trainingHistory.length > 0 ? (
                        trainingHistory.slice(0, 10).map(entry => (
                          <div key={entry.id} className="p-2 bg-slate-700/30 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-300 font-medium">{entry.action}</span>
                              <span className="text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-slate-300 mt-1">{entry.details}</div>
                            <div className="text-emerald-400 mt-1">{entry.improvement}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-center py-4">
                          No training history yet. Make corrections to start training the app!
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs text-blue-300">
                      <strong>💡 How it works:</strong> When you correct transcripts, the app learns and adds your corrections to its database. Future recognition will use your corrections automatically!
                    </div>
                  </div>
                )}
              </div>
              
              {supportStatus === 'not-supported' && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3 text-yellow-200 text-sm">
                  ⚠️ Voice not available in this browser. Use Demo Mode or Chrome/Edge.
                </div>
              )}
              
              <div className="flex gap-3 mb-8 flex-wrap justify-center">
                <button 
                  onClick={runDemo} 
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  🎬 Run Demo Consultation
                </button>
                
                <button 
                  onClick={() => setShowMedicationTemplates(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  💊 Med Templates
                </button>
                
                {isListening && (
                  <button 
                    onClick={toggleListening} 
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg"
                  >
                    ⏹️ Stop & Process Recording
                  </button>
                )}
              </div>

              {/* Recent Patients Section */}
              <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/30">
                  <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Recent Patients {currentPatientMRN && <span className="text-green-400 text-sm">({selectedPatient?.patient_info?.name} - {currentPatientMRN})</span>}
                  </h3>
                  
                  <RecentPatientsComponent 
                    authToken={authToken}
                    onPatientSelect={loadPatientIntoForm}
                    selectedPatientMRN={currentPatientMRN}
                  />
                </div>
              </div>
              {/* Additional Vitals Section */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/30">
                  <h3 className="text-indigo-300 font-semibold mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Additional Vitals & Assessment
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input 
                      type="text" 
                      value={temperature} 
                      onChange={(e) => setTemperature(e.target.value)} 
                      placeholder="Temperature (°F)" 
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    />
                    <input 
                      type="text" 
                      value={heartRate} 
                      onChange={(e) => setHeartRate(e.target.value)} 
                      placeholder="Heart Rate (bpm)" 
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    />
                    <input 
                      type="text" 
                      value={respiratoryRate} 
                      onChange={(e) => setRespiratoryRate(e.target.value)} 
                      placeholder="Respiratory Rate" 
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    />
                    <input 
                      type="text" 
                      value={oxygenSaturation} 
                      onChange={(e) => setOxygenSaturation(e.target.value)} 
                      placeholder="O2 Saturation (%)" 
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {transcript && (
              <div className="mt-8 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white text-lg">Live Transcript</h3>
                </div>
                <p className="text-slate-200 leading-relaxed text-lg">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Medical History Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-6 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-7 h-7 text-purple-400" />
              Comprehensive Medical History
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-red-300 font-semibold text-sm mb-2 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    ⚠️ Known Allergies
                  </label>
                  <textarea 
                    value={allergies} 
                    onChange={(e) => setAllergies(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" 
                    placeholder="e.g., Penicillin, Latex, Shellfish" 
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-blue-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                    📋 Past Medical History
                  </label>
                  <textarea 
                    value={pastMedicalHistory} 
                    onChange={(e) => setPastMedicalHistory(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" 
                    placeholder="Previous diagnoses, surgeries, hospitalizations" 
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                    💊 Current Medications
                  </label>
                  <textarea 
                    value={pastMedications} 
                    onChange={(e) => setPastMedications(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" 
                    placeholder="Name, dosage, frequency" 
                    rows="3"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-yellow-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                    👥 Family History
                  </label>
                  <textarea 
                    value={familyHistory} 
                    onChange={(e) => setFamilyHistory(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none" 
                    placeholder="Hereditary conditions, family medical history" 
                    rows="3"
                  />
                </div>
                
                {/* Social History Section */}
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-600/50">
                  <p className="text-purple-300 font-semibold text-sm mb-3 uppercase tracking-wide">Social History</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={smokingStatus} 
                      onChange={(e) => setSmokingStatus(e.target.value)} 
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      style={{color: 'white'}}
                    >
                      <option value="" style={{color: 'black', backgroundColor: 'white'}}>Smoking Status</option>
                      <option value="Never smoker" style={{color: 'black', backgroundColor: 'white'}}>Never smoker</option>
                      <option value="Current smoker" style={{color: 'black', backgroundColor: 'white'}}>Current smoker</option>
                      <option value="Former smoker" style={{color: 'black', backgroundColor: 'white'}}>Former smoker</option>
                      <option value="Social smoker" style={{color: 'black', backgroundColor: 'white'}}>Social smoker</option>
                    </select>
                    <select 
                      value={alcoholUse} 
                      onChange={(e) => setAlcoholUse(e.target.value)} 
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      style={{color: 'white'}}
                    >
                      <option value="" style={{color: 'black', backgroundColor: 'white'}}>Alcohol Use</option>
                      <option value="None" style={{color: 'black', backgroundColor: 'white'}}>None</option>
                      <option value="Occasional" style={{color: 'black', backgroundColor: 'white'}}>Occasional</option>
                      <option value="Moderate" style={{color: 'black', backgroundColor: 'white'}}>Moderate</option>
                      <option value="Heavy" style={{color: 'black', backgroundColor: 'white'}}>Heavy</option>
                    </select>
                    <select 
                      value={exerciseLevel} 
                      onChange={(e) => setExerciseLevel(e.target.value)} 
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      style={{color: 'white'}}
                    >
                      <option value="" style={{color: 'black', backgroundColor: 'white'}}>Exercise Level</option>
                      <option value="Sedentary" style={{color: 'black', backgroundColor: 'white'}}>Sedentary</option>
                      <option value="Light activity" style={{color: 'black', backgroundColor: 'white'}}>Light activity</option>
                      <option value="Moderate activity" style={{color: 'black', backgroundColor: 'white'}}>Moderate activity</option>
                      <option value="Very active" style={{color: 'black', backgroundColor: 'white'}}>Very active</option>
                    </select>
                    <input 
                      type="text" 
                      value={drugUse} 
                      onChange={(e) => setDrugUse(e.target.value)} 
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
                      placeholder="Recreational drugs" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Management Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-6 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Pill className="w-7 h-7 text-blue-400" />
                Prescription Management
              </h2>
              <button
                onClick={() => setShowMedicationTemplates(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-all"
              >
                📋 Load Template
              </button>
            </div>

            {/* Add New Medication Form */}
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30">
              <h4 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Medication
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Medicine Name */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Medicine Name *</label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    placeholder="e.g., Paracetamol, Amoxicillin"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Dosage *</label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    placeholder="e.g., 500mg, 250mg"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dosage Form */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Dosage Form *</label>
                  <select
                    value={newMedication.form}
                    onChange={(e) => setNewMedication({...newMedication, form: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" style={{color: 'black'}}>Select Form</option>
                    <option value="Tablet" style={{color: 'black'}}>Tablet</option>
                    <option value="Capsule" style={{color: 'black'}}>Capsule</option>
                    <option value="Syrup" style={{color: 'black'}}>Syrup</option>
                    <option value="Suspension" style={{color: 'black'}}>Suspension</option>
                    <option value="Injection" style={{color: 'black'}}>Injection</option>
                    <option value="Cream" style={{color: 'black'}}>Cream</option>
                    <option value="Ointment" style={{color: 'black'}}>Ointment</option>
                    <option value="Drops" style={{color: 'black'}}>Drops</option>
                    <option value="Inhaler" style={{color: 'black'}}>Inhaler</option>
                  </select>
                </div>

                {/* Route of Administration */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Route of Administration *</label>
                  <select
                    value={newMedication.route}
                    onChange={(e) => setNewMedication({...newMedication, route: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Oral" style={{color: 'black'}}>Oral</option>
                    <option value="Intravenous (IV)" style={{color: 'black'}}>Intravenous (IV)</option>
                    <option value="Intramuscular (IM)" style={{color: 'black'}}>Intramuscular (IM)</option>
                    <option value="Subcutaneous (SC)" style={{color: 'black'}}>Subcutaneous (SC)</option>
                    <option value="Inhalation" style={{color: 'black'}}>Inhalation</option>
                    <option value="Nebulization" style={{color: 'black'}}>Nebulization</option>
                    <option value="Topical" style={{color: 'black'}}>Topical</option>
                    <option value="Sublingual" style={{color: 'black'}}>Sublingual</option>
                    <option value="Rectal" style={{color: 'black'}}>Rectal</option>
                    <option value="Transdermal" style={{color: 'black'}}>Transdermal</option>
                    <option value="Nasal" style={{color: 'black'}}>Nasal</option>
                    <option value="Ophthalmic" style={{color: 'black'}}>Ophthalmic</option>
                    <option value="Otic" style={{color: 'black'}}>Otic</option>
                    <option value="Vaginal" style={{color: 'black'}}>Vaginal</option>
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Frequency *</label>
                  <select
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" style={{color: 'black'}}>Select Frequency</option>
                    <option value="Once daily (OD)" style={{color: 'black'}}>Once daily (OD)</option>
                    <option value="Twice daily (BD)" style={{color: 'black'}}>Twice daily (BD)</option>
                    <option value="Three times daily (TDS)" style={{color: 'black'}}>Three times daily (TDS)</option>
                    <option value="Four times daily (QDS)" style={{color: 'black'}}>Four times daily (QDS)</option>
                    <option value="Every 4 hours" style={{color: 'black'}}>Every 4 hours</option>
                    <option value="Every 6 hours" style={{color: 'black'}}>Every 6 hours</option>
                    <option value="Every 8 hours" style={{color: 'black'}}>Every 8 hours</option>
                    <option value="As needed (PRN)" style={{color: 'black'}}>As needed (PRN)</option>
                    <option value="At bedtime (HS)" style={{color: 'black'}}>At bedtime (HS)</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Duration *</label>
                  <input
                    type="text"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                    placeholder="e.g., 7 days, 2 weeks, 1 month"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Food Instructions */}
                <div>
                  <label className="block text-blue-200 text-sm font-medium mb-2">Food Instructions</label>
                  <select
                    value={newMedication.foodInstruction}
                    onChange={(e) => setNewMedication({...newMedication, foodInstruction: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="With or without food" style={{color: 'black'}}>With or without food</option>
                    <option value="Before meals" style={{color: 'black'}}>Before meals</option>
                    <option value="After meals" style={{color: 'black'}}>After meals</option>
                    <option value="With food" style={{color: 'black'}}>With food</option>
                    <option value="On empty stomach" style={{color: 'black'}}>On empty stomach</option>
                    <option value="Before breakfast" style={{color: 'black'}}>Before breakfast</option>
                    <option value="After breakfast" style={{color: 'black'}}>After breakfast</option>
                    <option value="Before dinner" style={{color: 'black'}}>Before dinner</option>
                    <option value="After dinner" style={{color: 'black'}}>After dinner</option>
                    <option value="With milk" style={{color: 'black'}}>With milk</option>
                    <option value="Avoid dairy" style={{color: 'black'}}>Avoid dairy</option>
                  </select>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-4">
                <label className="block text-blue-200 text-sm font-medium mb-2">Special Instructions</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                  placeholder="Additional instructions, warnings, or precautions..."
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>

              <button
                onClick={addMedicationToReview}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.form || !newMedication.route || !newMedication.frequency || !newMedication.duration}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                Add Medication
              </button>
            </div>

            {/* Current Medications List */}
            <div className="space-y-4">
              {medications.map((med, i) => (
                <div key={i} className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="font-bold text-white text-lg mb-1">{med.name} - {med.dosage}</p>
                          <p className="text-slate-400 text-sm">{med.formulation || med.form} • {med.route || 'Oral'}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{med.frequency}</p>
                          <p className="text-slate-400 text-sm">{med.foodInstruction} • {med.duration}</p>
                        </div>
                      </div>
                      {med.instructions && (
                        <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-200 text-sm">{med.instructions}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeMedication(i)}
                      className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              {medications.length === 0 && (
                <div className="p-8 text-center bg-slate-800/30 border border-slate-600/30 rounded-xl">
                  <Pill className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">No medications added yet</p>
                  <p className="text-slate-500 text-sm">Add medications using the form above or load from templates</p>
                </div>
              )}
            </div>

            {/* Drug Interactions Display */}
            {interactions.length > 0 && (
              <div className="mt-6 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6">
                <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Drug Interactions Detected
                </h3>
                <div className="space-y-3">
                  {interactions.map((int, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-amber-500/20">
                      {int.type === 'drug-drug' ? (
                        <div>
                          <p className="text-amber-200 font-semibold">
                            🚨 Drug-Drug Interaction: <span className="text-white">{int.drug1}</span> + <span className="text-white">{int.drug2}</span>
                          </p>
                          <p className="text-slate-300 text-sm mt-1">Classes: {int.class1} + {int.class2}</p>
                          <p className="text-amber-300 text-sm mt-2">{int.warning}</p>
                        </div>
                      ) : int.type === 'contraindication' ? (
                        <div>
                          <p className="text-red-300 font-semibold">
                            ⛔ Contraindications: <span className="text-white">{int.drug}</span>
                          </p>
                          <p className="text-slate-300 text-sm mt-1">Class: {int.class}</p>
                          <p className="text-red-200 text-sm mt-2">Review: {int.contraindications.join(', ')}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-amber-200 font-semibold">
                            🥗 Drug-Food Interaction: <span className="text-white">{int.drug}</span>
                          </p>
                          <p className="text-slate-300 text-sm mt-1">Class: {int.class}</p>
                          <p className="text-amber-200 text-sm mt-2">Avoid/Monitor: {int.foods.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>Database:</strong> {Object.keys(COMPREHENSIVE_DRUG_DATABASE).length} drugs with comprehensive interaction data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Documentation Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-6 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-7 h-7 text-teal-400" />
              Clinical Documentation
              <span className="text-sm font-normal text-slate-400 ml-2">(Auto-populated from voice)</span>
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lab Tests & Investigations */}
              <div>
                <label className="block text-teal-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                  🔬 Lab Tests & Investigations
                </label>
                <textarea 
                  value={labTests} 
                  onChange={(e) => setLabTests(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none" 
                  placeholder="CBC, LFT, RFT, X-ray chest, ECG, etc." 
                  rows="4"
                />
              </div>
              
              {/* Referrals */}
              <div>
                <label className="block text-cyan-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                  🏥 Referrals & Consultations
                </label>
                <textarea 
                  value={referrals} 
                  onChange={(e) => setReferrals(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none" 
                  placeholder="Cardiology, Neurology, Orthopedics, etc." 
                  rows="4"
                />
              </div>
              
              {/* Follow-up Instructions */}
              <div>
                <label className="block text-blue-300 font-semibold text-sm mb-2 uppercase tracking-wide">
                  📅 Follow-up Instructions
                </label>
                <textarea 
                  value={followUpInstructions} 
                  onChange={(e) => setFollowUpInstructions(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" 
                  placeholder="Follow-up in 2 weeks, Monitor BP, Return if symptoms worsen, etc." 
                  rows="4"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-teal-500/10 rounded-lg border border-teal-500/30">
              <p className="text-teal-300 text-sm">
                💡 <strong>Auto-Detection:</strong> These fields are automatically populated from your voice consultation using AI pattern recognition
              </p>
            </div>
          </div>
        </div>

        {/* AI-Extracted Clinical Data section REMOVED - redundant with other fields */}

        {/* Remaining content continues below */}
        
        {/* Load Disease Template section removed */}
      </div>
    </div>
  );
};

export default Shrutapex;