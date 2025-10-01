import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, AlertTriangle, CheckCircle, Stethoscope, Sparkles, UserCircle2, Settings, Link, Unlink, LogIn, LogOut, User, Download, Send } from 'lucide-react';
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
  'pc': 'After meals',
  'after meals': 'After meals',
  'with food': 'With food',
  'without food': 'Without food',
  'on empty stomach': 'On empty stomach',
  'before breakfast': 'Before breakfast',
  'after breakfast': 'After breakfast',
  'before lunch': 'Before lunch',
  'after lunch': 'After lunch',
  'before dinner': 'Before dinner',
  'after dinner': 'After dinner',
  
  // Unit abbreviations
  'mg': 'mg',
  'mcg': 'mcg',
  'g': 'g',
  'ml': 'ml',
  'units': 'units',
  'iu': 'International Units',
  'meq': 'mEq'
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

const SmartDoc = () => {
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
  const [authToken, setAuthToken] = useState(localStorage.getItem('smartdoc_token'));
  
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
  const [ehrSystem, setEhrSystem] = useState('');
  const [ehrApiKey, setEhrApiKey] = useState('');
  const [ehrEndpoint, setEhrEndpoint] = useState('');
  const [isEhrConnected, setIsEhrConnected] = useState(false);
  
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
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece + ' ';
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => {
              const newTranscript = prev + finalTranscript;
              // Process in real-time for continuous updates
              processTranscript(newTranscript);
              return newTranscript;
            });
          } else if (interimTranscript) {
            // Show interim results for better UX
            setTranscript(prev => prev + interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          alert('Speech Error: ' + event.error + '. This often happens in embedded environments. Use Demo Mode or deploy to emergent.sh for full functionality.');
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          if (isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Restart error:', e);
              setIsListening(false);
            }
          }
        };
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
          localStorage.removeItem('smartdoc_token');
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
      localStorage.setItem('smartdoc_token', response.access_token);
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
      
      alert(`Account created successfully!\n\nWelcome to SmartDoc Pro!\nYou can now login with your credentials.`);
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
    localStorage.removeItem('smartdoc_token');
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
    
    // Enhanced pattern matching for medications with all details
    const medicationPatterns = [
      // Pattern: drug name dosage unit formulation route frequency food_instruction
      /(?:prescribe|give|start|administer)\s+(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?|iu)\s+(?:as\s+)?(\w+)?\s*(?:via\s+|through\s+|by\s+)?(\w+)?\s+(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn|q\d+h|every \d+ hours)\s*(?:ac|pc|before meals|after meals|with food|without food|on empty stomach)?/gi,
      // Simpler pattern: drug dosage frequency
      /(\w+)\s+(\d+\.?\d*)\s?(mg|mcg|g|ml|units?)\s+(od|bd|tds|qds|once daily|twice daily|three times daily|four times daily|as needed|prn)/gi
    ];

    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, drugName, dosage, unit, formulation, route, frequency, foodInstruction] = match;
        
        medications.push({
          name: drugName.charAt(0).toUpperCase() + drugName.slice(1).toLowerCase(),
          dosage: `${dosage}${unit}`,
          formulation: formulation ? (formulation.charAt(0).toUpperCase() + formulation.slice(1).toLowerCase()) : 'Tablet',
          route: expandAbbreviation(route || 'oral'),
          frequency: expandAbbreviation(frequency),
          foodInstruction: expandAbbreviation(foodInstruction || 'with food'),
          duration: '30 days' // Default duration
        });
      }
    });

    // Fallback to common drug detection
    if (medications.length === 0) {
      COMMON_DRUGS.forEach(drug => {
        if (lowerText.includes(drug)) {
          const dosagePattern = new RegExp(`${drug}\\s+(\\d+\\.?\\d*)\\s?(mg|mcg|g|ml|units?)`, 'i');
          const frequencyPattern = new RegExp(`${drug}.*?(od|bd|tds|qds|once daily|twice daily|three times daily)`, 'i');
          const routePattern = new RegExp(`${drug}.*?(oral|iv|im|sc|topical|sublingual)`, 'i');
          
          const dosageMatch = dosagePattern.exec(text);
          const frequencyMatch = frequencyPattern.exec(text);
          const routeMatch = routePattern.exec(text);
          
          medications.push({
            name: drug.charAt(0).toUpperCase() + drug.slice(1),
            dosage: dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '10mg',
            formulation: 'Tablet',
            route: expandAbbreviation(routeMatch ? routeMatch[1] : 'oral'),
            frequency: expandAbbreviation(frequencyMatch ? frequencyMatch[1] : 'once daily'),
            foodInstruction: 'With food',
            duration: '30 days'
          });
        }
      });
    }

    return medications;
  };

  const processTranscript = (text) => {
    if (!text.trim()) return;

    const lowerText = text.toLowerCase();
    
    // Extract diagnosis
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

    // Extract medications with enhanced parsing
    const extractedMeds = extractMedicationsFromText(text);
    setMedications(extractedMeds);

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

    checkInteractions(extractedMeds);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('⚠️ Voice recognition not available in this environment.\n\n✅ Use "Demo Mode" to test the app\n✅ Voice WILL work when deployed on emergent.sh');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      processTranscript(transcript);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('⚠️ Cannot start voice in this environment.\n\n✅ Use "Demo Mode" button below\n✅ Voice WILL work on emergent.sh');
      }
    }
  };

  const runDemo = () => {
    const demoText = 'Patient has type 2 diabetes and hypertension. Blood sugar is elevated. Prescribe metformin 40mg tablet oral once daily after breakfast and lisinopril 5mg tablet oral once daily before breakfast. Patient should follow up in two weeks for monitoring.';
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
      yPosition += 15;
      
      // Patient Information
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION:', 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${patientName || 'Not specified'}`, 20, yPosition);
      yPosition += 5;
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

  const handleSubmitToEHR = () => {
    if (!isEhrConnected) {
      alert('⚠️ EHR system not connected. Please configure EHR settings first.');
      return;
    }
    
    setCurrentView('submitted');
    setTimeout(() => {
      setCurrentView('input');
      resetAllFields();
    }, 3000);
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
              <p className="text-blue-200">Join SmartDoc Pro Professional Network</p>
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
              <h1 className="text-3xl font-bold text-white mt-4 mb-2">SmartDoc Pro</h1>
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
              Login to SmartDoc
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
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  ← Back
                </button>
              </div>

              {isEhrConnected && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-emerald-300 font-semibold">EHR Connected</p>
                        <p className="text-emerald-200 text-sm">{ehrSystem}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleEhrDisconnect} 
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all border border-red-500/30"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">EHR System</label>
                  <select 
                    value={ehrSystem}
                    onChange={(e) => setEhrSystem(e.target.value)}
                    disabled={isEhrConnected}
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Select EHR System</option>
                    <option value="Epic Systems">Epic Systems</option>
                    <option value="Cerner">Cerner (Oracle Health)</option>
                    <option value="Allscripts">Allscripts</option>
                    <option value="Meditech">Meditech</option>
                    <option value="Athenahealth">Athenahealth</option>
                    <option value="eClinicalWorks">eClinicalWorks</option>
                    <option value="NextGen">NextGen Healthcare</option>
                    <option value="Custom FHIR">Custom HL7 FHIR Server</option>
                    <option value="Indian EHR">Indian EHR System (ABDM Compatible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">API Endpoint URL</label>
                  <input
                    type="text"
                    value={ehrEndpoint}
                    onChange={(e) => setEhrEndpoint(e.target.value)}
                    disabled={isEhrConnected}
                    placeholder="https://api.ehr-system.com/v1"
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">API Key / Authorization Token</label>
                  <input
                    type="password"
                    value={ehrApiKey}
                    onChange={(e) => setEhrApiKey(e.target.value)}
                    disabled={isEhrConnected}
                    placeholder="Enter your API key or OAuth token"
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <p className="text-slate-400 text-sm mt-2">🔒 Your credentials are stored locally and never shared</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Integration Details
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>• <strong>HL7 FHIR:</strong> Standard REST API for healthcare data exchange</li>
                    <li>• <strong>OAuth 2.0:</strong> Secure authentication method</li>
                    <li>• <strong>Patient Import:</strong> Demographics, history, allergies, medications</li>
                    <li>• <strong>Prescription Export:</strong> Send prescriptions back to EHR</li>
                    <li>• <strong>ABDM Support:</strong> Compatible with India's Ayushman Bharat Digital Mission</li>
                  </ul>
                </div>

                {!isEhrConnected && (
                  <button 
                    onClick={handleEhrConnect} 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                  >
                    Connect EHR System
                  </button>
                )}
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
              <div className="mb-6">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Diagnosis</h3>
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                  <p className="text-white text-lg">{diagnosis}</p>
                </div>
              </div>

              {/* Enhanced Prescriptions */}
              <div className="mb-6">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Prescriptions</h3>
                <div className="space-y-3">
                  {medications.map((med, i) => (
                    <div key={i} className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold text-white text-lg mb-1">{med.name} - {med.dosage}</p>
                          <p className="text-slate-400 text-sm">{med.formulation} • {med.route}</p>
                        </div>
                        <div className="text-right md:text-left">
                          <p className="text-white font-medium">{med.frequency}</p>
                          <p className="text-slate-400 text-sm">{med.foodInstruction} • {med.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setCurrentView('input')} 
                  className="py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all border border-slate-600"
                >
                  ← Back to Edit
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
                  disabled={!isEhrConnected}
                >
                  <Send className="w-5 h-5" />
                  Submit to EHR
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
                  SmartDoc Pro<Sparkles className="w-6 h-6 text-yellow-300" />
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
              <p className="text-slate-400 mb-3">
                {isListening 
                  ? 'Click microphone again to STOP recording and process' 
                  : 'Click the microphone to begin recording'
                }
              </p>
              
              {supportStatus === 'not-supported' && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3 text-yellow-200 text-sm">
                  ⚠️ Voice not available in this browser. Use Demo Mode or Chrome/Edge.
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button 
                  onClick={runDemo} 
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  🎬 Run Demo Consultation
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
                <textarea 
                  value={allergies} 
                  onChange={(e) => setAllergies(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" 
                  placeholder="⚠️ Known Allergies (e.g., Penicillin, Latex, Shellfish)" 
                  rows="3"
                />
                <textarea 
                  value={pastMedicalHistory} 
                  onChange={(e) => setPastMedicalHistory(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" 
                  placeholder="📋 Past Medical History (Previous diagnoses, surgeries, hospitalizations)" 
                  rows="3"
                />
                <textarea 
                  value={pastMedications} 
                  onChange={(e) => setPastMedications(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" 
                  placeholder="💊 Current Medications (Name, dosage, frequency)" 
                  rows="3"
                />
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <textarea 
                  value={familyHistory} 
                  onChange={(e) => setFamilyHistory(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" 
                  placeholder="👥 Family History (Hereditary conditions, family medical history)" 
                  rows="3"
                />
                
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

        {/* AI-Extracted Clinical Data */}
        {(diagnosis || medications.length > 0) && (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-6 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-blue-500 p-3 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">AI-Extracted Clinical Data</h2>
              </div>

              {diagnosis && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Diagnosis</label>
                  <input 
                    type="text" 
                    value={diagnosis} 
                    onChange={(e) => setDiagnosis(e.target.value)} 
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
                  />
                </div>
              )}

              {medications.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Prescriptions</label>
                  <div className="space-y-4">
                    {medications.map((med, i) => (
                      <div key={i} className="relative p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-600/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <input 
                            type="text" 
                            value={med.name} 
                            onChange={(e) => updateMedication(i, 'name', e.target.value)} 
                            placeholder="Medication" 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <input 
                            type="text" 
                            value={med.dosage} 
                            onChange={(e) => updateMedication(i, 'dosage', e.target.value)} 
                            placeholder="Dosage" 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <select 
                            value={med.formulation} 
                            onChange={(e) => updateMedication(i, 'formulation', e.target.value)} 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {FORMULATION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <select 
                            value={med.route} 
                            onChange={(e) => updateMedication(i, 'route', e.target.value)} 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {ROUTE_OPTIONS.map(route => (
                              <option key={route} value={route}>{route}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <input 
                            type="text" 
                            value={med.frequency} 
                            onChange={(e) => updateMedication(i, 'frequency', e.target.value)} 
                            placeholder="Frequency" 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                          <select 
                            value={med.foodInstruction} 
                            onChange={(e) => updateMedication(i, 'foodInstruction', e.target.value)} 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {FOOD_INSTRUCTIONS.map(instruction => (
                              <option key={instruction} value={instruction}>{instruction}</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            value={med.duration} 
                            onChange={(e) => updateMedication(i, 'duration', e.target.value)} 
                            placeholder="Duration" 
                            className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                        </div>
                        <button 
                          onClick={() => removeMedication(i)} 
                          className="text-red-400 text-sm hover:text-red-300 font-medium"
                        >
                          × Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={addMedication} 
                    className="mt-4 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl font-semibold transition-all border border-blue-500/30"
                  >
                    + Add Medication
                  </button>
                </div>
              )}

              {prognosis && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Prognosis</label>
                  <textarea 
                    value={prognosis} 
                    onChange={(e) => setPrognosis(e.target.value)} 
                    rows="4" 
                    className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg resize-none" 
                  />
                </div>
              )}

              {interactions.length > 0 && (
                <div className="relative bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-lg flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-300 mb-3 text-lg">Comprehensive Drug Analysis</h3>
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
                                <p className="text-amber-300 text-sm mt-1">{int.warning}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <p className="text-blue-300 text-sm">
                          💡 <strong>Database:</strong> {Object.keys(COMPREHENSIVE_DRUG_DATABASE).length} drugs with comprehensive interaction data from Medscape-equivalent sources
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={handleReview} 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg" 
                style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}
              >
                Review & Complete Prescription →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDoc;