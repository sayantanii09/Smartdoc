# Comprehensive Medical Drug Database
# This mirrors the frontend database but in Python format for backend processing

COMPREHENSIVE_DRUG_DATABASE = {
    # Cardiovascular Medications
    "warfarin": {
        "class": "Anticoagulant",
        "interactions": ["aspirin", "ibuprofen", "naproxen", "celecoxib", "clopidogrel", "heparin", "amiodarone", "fluconazole", "metronidazole", "clarithromycin", "erythromycin", "ciprofloxacin", "sulfamethoxazole"],
        "foodInteractions": ["green leafy vegetables", "cranberry juice", "alcohol", "grapefruit juice", "garlic supplements", "ginger", "ginseng"],
        "warnings": "Increased bleeding risk. Monitor INR closely.",
        "contraindications": ["active bleeding", "severe liver disease", "pregnancy"],
        "sideEffects": ["bleeding", "bruising", "hair loss", "skin necrosis"]
    },
    "aspirin": {
        "class": "Antiplatelet/NSAID",
        "interactions": ["warfarin", "heparin", "clopidogrel", "ibuprofen", "naproxen", "methotrexate", "ace inhibitors", "furosemide"],
        "foodInteractions": ["alcohol", "ginger", "garlic supplements", "turmeric"],
        "warnings": "Increased bleeding risk, GI irritation. Use with caution in peptic ulcer disease.",
        "contraindications": ["active GI bleeding", "severe asthma", "children with viral infections (Reye syndrome)"],
        "sideEffects": ["GI bleeding", "tinnitus", "nausea", "heartburn"]
    },
    "lisinopril": {
        "class": "ACE Inhibitor",
        "interactions": ["potassium supplements", "spironolactone", "amiloride", "nsaids", "lithium", "aliskiren"],
        "foodInteractions": ["salt substitutes", "potassium-rich foods", "alcohol"],
        "warnings": "Monitor potassium levels. Risk of hyperkalemia and acute kidney injury.",
        "contraindications": ["pregnancy", "bilateral renal artery stenosis", "angioedema history"],
        "sideEffects": ["dry cough", "hyperkalemia", "angioedema", "hypotension"]
    },
    "atorvastatin": {
        "class": "HMG-CoA Reductase Inhibitor",
        "interactions": ["clarithromycin", "erythromycin", "itraconazole", "ketoconazole", "cyclosporine", "gemfibrozil", "niacin", "digoxin"],
        "foodInteractions": ["grapefruit juice", "alcohol"],
        "warnings": "Monitor liver enzymes and creatine kinase. Risk of myopathy and rhabdomyolysis.",
        "contraindications": ["active liver disease", "pregnancy", "breastfeeding"],
        "sideEffects": ["myalgia", "elevated liver enzymes", "headache", "nausea"]
    },
    "amlodipine": {
        "class": "Calcium Channel Blocker",
        "interactions": ["simvastatin", "cyclosporine", "tacrolimus"],
        "foodInteractions": ["grapefruit juice", "high sodium foods"],
        "warnings": "Monitor blood pressure. May cause peripheral edema.",
        "contraindications": ["severe aortic stenosis", "cardiogenic shock"],
        "sideEffects": ["peripheral edema", "fatigue", "dizziness", "flushing"]
    },

    # Diabetes Medications
    "metformin": {
        "class": "Biguanide",
        "interactions": ["contrast agents", "cimetidine", "furosemide", "nifedipine", "topiramate"],
        "foodInteractions": ["alcohol", "high fiber meals"],
        "warnings": "Risk of lactic acidosis. Discontinue before contrast procedures.",
        "contraindications": ["severe kidney disease", "metabolic acidosis", "severe dehydration"],
        "sideEffects": ["GI upset", "nausea", "diarrhea", "metallic taste", "vitamin B12 deficiency"]
    },
    "insulin": {
        "class": "Hormone",
        "interactions": ["ace inhibitors", "beta blockers", "octreotide", "lanreotide"],
        "foodInteractions": ["alcohol", "carbohydrate timing"],
        "warnings": "Risk of hypoglycemia. Monitor blood glucose closely.",
        "contraindications": ["hypoglycemia"],
        "sideEffects": ["hypoglycemia", "weight gain", "injection site reactions"]
    },
    "glipizide": {
        "class": "Sulfonylurea",
        "interactions": ["warfarin", "fluconazole", "clarithromycin", "beta blockers"],
        "foodInteractions": ["alcohol"],
        "warnings": "Risk of hypoglycemia, especially in elderly.",
        "contraindications": ["type 1 diabetes", "diabetic ketoacidosis"],
        "sideEffects": ["hypoglycemia", "weight gain", "nausea"]
    },

    # Antibiotics
    "amoxicillin": {
        "class": "Penicillin Antibiotic",
        "interactions": ["warfarin", "methotrexate", "oral contraceptives"],
        "foodInteractions": [],
        "warnings": "Risk of allergic reactions. May reduce oral contraceptive effectiveness.",
        "contraindications": ["penicillin allergy"],
        "sideEffects": ["diarrhea", "nausea", "rash", "candidiasis"]
    },
    "clarithromycin": {
        "class": "Macrolide Antibiotic",
        "interactions": ["warfarin", "statins", "digoxin", "theophylline", "carbamazepine", "cyclosporine"],
        "foodInteractions": ["grapefruit juice"],
        "warnings": "QT prolongation risk. Multiple drug interactions via CYP3A4.",
        "contraindications": ["history of QT prolongation", "severe liver disease"],
        "sideEffects": ["nausea", "diarrhea", "taste disturbance", "QT prolongation"]
    },
    "ciprofloxacin": {
        "class": "Fluoroquinolone Antibiotic",
        "interactions": ["warfarin", "theophylline", "tizanidine", "dairy products", "iron supplements"],
        "foodInteractions": ["dairy products", "calcium supplements", "iron supplements"],
        "warnings": "Tendon rupture risk. C. diff colitis risk.",
        "contraindications": ["tendon disorders", "myasthenia gravis"],
        "sideEffects": ["nausea", "diarrhea", "tendinitis", "CNS effects"]
    },

    # Gastrointestinal
    "omeprazole": {
        "class": "Proton Pump Inhibitor",
        "interactions": ["warfarin", "clopidogrel", "digoxin", "ketoconazole", "iron supplements"],
        "foodInteractions": [],
        "warnings": "Long-term use may increase risk of fractures and C. diff.",
        "contraindications": ["hypersensitivity to PPIs"],
        "sideEffects": ["headache", "nausea", "diarrhea", "vitamin B12 deficiency"]
    },
    "ranitidine": {
        "class": "H2 Receptor Antagonist",
        "interactions": ["warfarin", "ketoconazole", "atazanavir"],
        "foodInteractions": ["alcohol"],
        "warnings": "Note: Ranitidine recalled due to NDMA contamination.",
        "contraindications": ["hypersensitivity"],
        "sideEffects": ["headache", "dizziness", "constipation"]
    },

    # Respiratory
    "albuterol": {
        "class": "Beta-2 Agonist",
        "interactions": ["beta blockers", "digoxin", "tricyclic antidepressants"],
        "foodInteractions": ["caffeine"],
        "warnings": "May cause paradoxical bronchospasm. Monitor heart rate.",
        "contraindications": ["hypersensitivity"],
        "sideEffects": ["tachycardia", "tremor", "nervousness", "headache"]
    },
    "theophylline": {
        "class": "Methylxanthine",
        "interactions": ["ciprofloxacin", "erythromycin", "cimetidine", "phenytoin", "carbamazepine"],
        "foodInteractions": ["caffeine", "alcohol", "charcoal-broiled foods"],
        "warnings": "Narrow therapeutic index. Monitor serum levels.",
        "contraindications": ["uncontrolled seizures", "active peptic ulcer"],
        "sideEffects": ["nausea", "tachycardia", "seizures", "arrhythmias"]
    },

    # Neurological
    "phenytoin": {
        "class": "Anticonvulsant",
        "interactions": ["warfarin", "digoxin", "oral contraceptives", "folic acid", "carbamazepine"],
        "foodInteractions": ["enteral nutrition", "folic acid rich foods"],
        "warnings": "Narrow therapeutic index. Monitor serum levels and signs of toxicity.",
        "contraindications": ["sinus bradycardia", "heart block"],
        "sideEffects": ["gingival hyperplasia", "hirsutism", "ataxia", "nystagmus"]
    },
    "carbamazepine": {
        "class": "Anticonvulsant",
        "interactions": ["warfarin", "oral contraceptives", "clarithromycin", "fluoxetine", "diltiazem"],
        "foodInteractions": ["grapefruit juice"],
        "warnings": "Risk of aplastic anemia. Monitor CBC regularly.",
        "contraindications": ["bone marrow suppression", "AV block"],
        "sideEffects": ["diplopia", "ataxia", "nausea", "rash", "hyponatremia"]
    },

    # Pain/Inflammation
    "ibuprofen": {
        "class": "NSAID",
        "interactions": ["warfarin", "ace inhibitors", "lithium", "methotrexate", "digoxin"],
        "foodInteractions": ["alcohol"],
        "warnings": "Increased cardiovascular and GI risks. Use lowest effective dose.",
        "contraindications": ["active GI bleeding", "severe heart failure", "CABG surgery"],
        "sideEffects": ["GI upset", "hypertension", "fluid retention", "kidney dysfunction"]
    },
    "naproxen": {
        "class": "NSAID",
        "interactions": ["warfarin", "ace inhibitors", "lithium", "methotrexate", "cyclosporine"],
        "foodInteractions": ["alcohol"],
        "warnings": "Increased cardiovascular risk. Monitor kidney function.",
        "contraindications": ["active GI bleeding", "severe kidney disease"],
        "sideEffects": ["GI bleeding", "hypertension", "edema", "dizziness"]
    },
    "morphine": {
        "class": "Opioid Analgesic",
        "interactions": ["mao inhibitors", "cns depressants", "muscle relaxants", "sedatives"],
        "foodInteractions": ["alcohol"],
        "warnings": "Risk of respiratory depression and dependence.",
        "contraindications": ["respiratory depression", "paralytic ileus"],
        "sideEffects": ["respiratory depression", "constipation", "nausea", "sedation"]
    },

    # Psychiatric
    "sertraline": {
        "class": "SSRI Antidepressant",
        "interactions": ["mao inhibitors", "warfarin", "digoxin", "triptans", "tramadol"],
        "foodInteractions": ["alcohol"],
        "warnings": "Serotonin syndrome risk. Monitor for suicidal thoughts.",
        "contraindications": ["mao inhibitor use", "pimozide use"],
        "sideEffects": ["nausea", "diarrhea", "insomnia", "sexual dysfunction"]
    },
    "fluoxetine": {
        "class": "SSRI Antidepressant",
        "interactions": ["mao inhibitors", "warfarin", "phenytoin", "carbamazepine", "triptans"],
        "foodInteractions": ["alcohol"],
        "warnings": "Long half-life. Serotonin syndrome risk.",
        "contraindications": ["mao inhibitor use", "thioridazine use"],
        "sideEffects": ["nausea", "headache", "insomnia", "anxiety"]
    },

    # Thyroid
    "levothyroxine": {
        "class": "Thyroid Hormone",
        "interactions": ["warfarin", "digoxin", "insulin", "iron supplements", "calcium supplements"],
        "foodInteractions": ["soy products", "fiber", "coffee", "calcium-rich foods"],
        "warnings": "Take on empty stomach. Monitor TSH levels.",
        "contraindications": ["uncorrected adrenal insufficiency", "acute MI"],
        "sideEffects": ["palpitations", "tremor", "insomnia", "weight loss"]
    },

    # Diuretics
    "furosemide": {
        "class": "Loop Diuretic",
        "interactions": ["lithium", "digoxin", "aminoglycosides", "nsaids", "ace inhibitors"],
        "foodInteractions": ["alcohol", "licorice"],
        "warnings": "Monitor electrolytes, kidney function, and hearing. Risk of dehydration.",
        "contraindications": ["anuria", "severe electrolyte depletion"],
        "sideEffects": ["hypokalemia", "hyponatremia", "dehydration", "ototoxicity", "hyperuricemia"]
    },
    "hydrochlorothiazide": {
        "class": "Thiazide Diuretic",
        "interactions": ["lithium", "digoxin", "nsaids", "corticosteroids"],
        "foodInteractions": ["alcohol", "licorice"],
        "warnings": "Monitor electrolytes and blood glucose. May worsen diabetes.",
        "contraindications": ["anuria", "severe kidney disease"],
        "sideEffects": ["hypokalemia", "hyperglycemia", "hyperuricemia", "photosensitivity"]
    },
    "spironolactone": {
        "class": "Potassium-Sparing Diuretic",
        "interactions": ["ace inhibitors", "potassium supplements", "nsaids", "lithium"],
        "foodInteractions": ["salt substitutes", "potassium-rich foods"],
        "warnings": "Monitor potassium levels. Risk of hyperkalemia.",
        "contraindications": ["hyperkalemia", "severe kidney disease", "addison disease"],
        "sideEffects": ["hyperkalemia", "gynecomastia", "menstrual irregularities"]
    },

    # Beta Blockers
    "metoprolol": {
        "class": "Beta-1 Selective Blocker",
        "interactions": ["verapamil", "diltiazem", "clonidine", "insulin", "epinephrine"],
        "foodInteractions": ["alcohol"],
        "warnings": "Do not stop abruptly. Monitor heart rate and blood pressure.",
        "contraindications": ["severe bradycardia", "heart block", "cardiogenic shock"],
        "sideEffects": ["bradycardia", "hypotension", "fatigue", "depression"]
    },
    "propranolol": {
        "class": "Non-Selective Beta Blocker",
        "interactions": ["verapamil", "diltiazem", "insulin", "theophylline", "lidocaine"],
        "foodInteractions": ["alcohol"],
        "warnings": "Do not stop abruptly. Avoid in asthma patients.",
        "contraindications": ["severe asthma", "severe bradycardia", "heart failure"],
        "sideEffects": ["bradycardia", "bronchospasm", "fatigue", "depression"]
    },

    # Additional Common Drugs
    "prednisone": {
        "class": "Corticosteroid",
        "interactions": ["nsaids", "warfarin", "diabetes medications", "vaccines"],
        "foodInteractions": ["alcohol", "grapefruit juice"],
        "warnings": "Do not stop abruptly. Monitor blood glucose and bone density.",
        "contraindications": ["systemic fungal infections", "live vaccines"],
        "sideEffects": ["hyperglycemia", "osteoporosis", "immunosuppression", "mood changes"]
    },
    "digoxin": {
        "class": "Cardiac Glycoside",
        "interactions": ["diuretics", "amiodarone", "quinidine", "verapamil", "erythromycin"],
        "foodInteractions": ["high fiber foods", "st john wort"],
        "warnings": "Narrow therapeutic index. Monitor digoxin levels.",
        "contraindications": ["ventricular fibrillation", "heart block"],
        "sideEffects": ["nausea", "visual disturbances", "arrhythmias", "confusion"]
    },
    "losartan": {
        "class": "ARB (Angiotensin Receptor Blocker)",
        "interactions": ["potassium supplements", "nsaids", "lithium", "rifampin"],
        "foodInteractions": ["salt substitutes", "potassium-rich foods"],
        "warnings": "Monitor kidney function and potassium levels.",
        "contraindications": ["pregnancy", "bilateral renal artery stenosis"],
        "sideEffects": ["hyperkalemia", "hypotension", "dizziness", "fatigue"]
    },
    "clopidogrel": {
        "class": "Antiplatelet Agent",
        "interactions": ["warfarin", "omeprazole", "aspirin", "nsaids"],
        "foodInteractions": ["grapefruit juice"],
        "warnings": "Increased bleeding risk. Avoid proton pump inhibitors.",
        "contraindications": ["active bleeding", "severe liver disease"],
        "sideEffects": ["bleeding", "bruising", "headache", "diarrhea"]
    },
    "simvastatin": {
        "class": "HMG-CoA Reductase Inhibitor",
        "interactions": ["grapefruit juice", "amlodipine", "diltiazem", "verapamil", "clarithromycin"],
        "foodInteractions": ["grapefruit juice", "alcohol"],
        "warnings": "Monitor liver enzymes and creatine kinase. Risk of myopathy.",
        "contraindications": ["active liver disease", "pregnancy"],
        "sideEffects": ["myalgia", "elevated liver enzymes", "headache"]
    }
}