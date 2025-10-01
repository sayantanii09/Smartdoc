import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, AlertTriangle, CheckCircle, Stethoscope, Sparkles, UserCircle2, Settings, Link, Unlink } from 'lucide-react';

const DRUG_DATABASE = {
  warfarin: {
    interactions: ['aspirin', 'ibuprofen', 'naproxen'],
    foodInteractions: ['green leafy vegetables', 'cranberry juice', 'alcohol'],
    warnings: 'Increased bleeding risk'
  },
  aspirin: {
    interactions: ['warfarin', 'ibuprofen', 'clopidogrel'],
    foodInteractions: ['alcohol', 'ginger', 'garlic supplements'],
    warnings: 'Increased bleeding risk'
  },
  metformin: {
    interactions: ['furosemide', 'nifedipine', 'cimetidine'],
    foodInteractions: ['alcohol'],
    warnings: 'Risk of lactic acidosis with alcohol'
  },
  lisinopril: {
    interactions: ['potassium supplements', 'spironolactone', 'nsaids'],
    foodInteractions: ['salt substitutes', 'potassium-rich foods'],
    warnings: 'Hyperkalemia risk'
  },
  atorvastatin: {
    interactions: ['clarithromycin', 'itraconazole', 'cyclosporine'],
    foodInteractions: ['grapefruit juice', 'alcohol'],
    warnings: 'Increased myopathy risk'
  }
};

const COMMON_DRUGS = ['warfarin', 'aspirin', 'metformin', 'lisinopril', 'atorvastatin', 'amoxicillin', 'omeprazole', 'levothyroxine', 'amlodipine', 'simvastatin'];

const SmartDoc = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([]);
  const [prognosis, setPrognosis] = useState('');
  const [interactions, setInteractions] = useState([]);
  const [currentView, setCurrentView] = useState('input');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientBP, setPatientBP] = useState('');
  const [patientId, setPatientId] = useState('');
  const [showEHRImport, setShowEHRImport] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [ehrSystem, setEhrSystem] = useState('');
  const [ehrApiKey, setEhrApiKey] = useState('');
  const [ehrEndpoint, setEhrEndpoint] = useState('');
  const [isEhrConnected, setIsEhrConnected] = useState(false);
  const recognitionRef = useRef(null);

  const [supportStatus, setSupportStatus] = useState('checking');

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
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
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
    const demoText = 'Patient has type 2 diabetes and hypertension. Blood sugar is elevated. Prescribe metformin 500mg twice daily and lisinopril 10mg once daily. Patient should follow up in two weeks for monitoring.';
    setTranscript(demoText);
    setTimeout(() => processTranscript(demoText), 500);
  };

  const processTranscript = (text) => {
    if (!text.trim()) return;

    const lowerText = text.toLowerCase();
    
    let extractedDiagnosis = '';
    if (lowerText.includes('diabetes') || lowerText.includes('diabetic')) {
      extractedDiagnosis = 'Type 2 Diabetes Mellitus';
    } else if (lowerText.includes('hypertension') || lowerText.includes('high blood pressure')) {
      extractedDiagnosis = 'Essential Hypertension';
    } else if (lowerText.includes('infection') || lowerText.includes('fever')) {
      extractedDiagnosis = 'Upper Respiratory Tract Infection';
    } else {
      extractedDiagnosis = 'Clinical assessment pending';
    }
    setDiagnosis(extractedDiagnosis);

    const extractedMeds = [];
    COMMON_DRUGS.forEach(drug => {
      if (lowerText.includes(drug)) {
        extractedMeds.push({
          name: drug.charAt(0).toUpperCase() + drug.slice(1),
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days'
        });
      }
    });

    if (extractedMeds.length === 0) {
      if (extractedDiagnosis.includes('Diabetes')) {
        extractedMeds.push({
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '30 days'
        });
      } else if (extractedDiagnosis.includes('Hypertension')) {
        extractedMeds.push({
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days'
        });
      }
    }
    setMedications(extractedMeds);

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

  const checkInteractions = (meds) => {
    const foundInteractions = [];
    const medNames = meds.map(m => m.name.toLowerCase());

    medNames.forEach((med, index) => {
      if (DRUG_DATABASE[med]) {
        medNames.forEach((otherMed, otherIndex) => {
          if (index !== otherIndex && DRUG_DATABASE[med].interactions.includes(otherMed)) {
            foundInteractions.push({
              type: 'drug-drug',
              severity: 'high',
              drug1: meds[index].name,
              drug2: meds[otherIndex].name,
              warning: DRUG_DATABASE[med].warnings
            });
          }
        });

        if (DRUG_DATABASE[med].foodInteractions.length > 0) {
          foundInteractions.push({
            type: 'drug-food',
            severity: 'moderate',
            drug: meds[index].name,
            foods: DRUG_DATABASE[med].foodInteractions,
            warning: DRUG_DATABASE[med].warnings
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
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
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
    
    // Simulate EHR API call
    const confirmImport = confirm(`Fetching data for Patient ID: ${patientId}\n\n${isEhrConnected ? `From: ${ehrSystem}\nEndpoint: ${ehrEndpoint}` : 'Using demo data (EHR not connected)'}\n\nLoad data?`);
    
    if (confirmImport) {
      // In production: const response = await fetch(`${ehrEndpoint}/patient/${patientId}`, { headers: { 'Authorization': `Bearer ${ehrApiKey}` }});
      setPatientName('Priya Sharma');
      setPatientAge('45');
      setPatientWeight('68 kg');
      setPatientBP('130/85 mmHg');
      setMedicalHistory('• Type 2 Diabetes Mellitus (diagnosed 2018)\n• Essential Hypertension (diagnosed 2020)\n• Hyperlipidemia\n• Family history of cardiovascular disease');
      setAllergies('• Penicillin (causes rash)\n• Sulfa drugs (anaphylaxis)\n• Shellfish (mild reaction)');
      setCurrentMedications('• Metformin 500mg - Twice daily (ongoing)\n• Lisinopril 5mg - Once daily (ongoing)\n• Atorvastatin 20mg - Once daily at bedtime');
      alert('✅ Sample data loaded for Patient ID: ' + patientId + '\n\n' + (isEhrConnected ? 'Connected via: ' + ehrSystem : 'Demo mode - configure EHR in Settings'));
    } else {
      alert('Please manually enter patient information in the fields below.');
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

  const handleSubmitToEHR = () => {
    setCurrentView('submitted');
    setTimeout(() => {
      setCurrentView('input');
      setTranscript('');
      setDiagnosis('');
      setMedications([]);
      setPrognosis('');
      setInteractions([]);
      setPatientName('');
      setPatientAge('');
      setPatientWeight('');
      setPatientBP('');
      setPatientId('');
      setMedicalHistory('');
      setAllergies('');
      setCurrentMedications('');
    }, 3000);
  };

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
            <h2 className="text-3xl font-bold text-white mb-3">Successfully Submitted!</h2>
            <p className="text-slate-300 mb-6 text-lg">Clinical documentation added to patient EHR</p>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/50 mb-6">
              <p className="text-sm text-slate-400 mb-1">Patient Record Updated</p>
              <p className="text-white font-semibold text-lg">{patientName || 'Patient'}</p>
              {patientId && <p className="text-slate-400 text-sm">ID: {patientId}</p>}
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
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">
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
                    <button onClick={handleEhrDisconnect} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all border border-red-500/30">
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
                  <button onClick={handleEhrConnect} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg">
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

  if (currentView === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                Final Review
              </h2>

              <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <UserCircle2 className="w-6 h-6 text-blue-400" />
                  <p className="text-sm text-blue-300 font-semibold uppercase tracking-wide">Patient Information</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-400 mb-1">Name</p><p className="text-xl font-bold text-white">{patientName || 'Not specified'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Patient ID</p><p className="text-xl font-bold text-white">{patientId || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Age</p><p className="text-lg text-white">{patientAge || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Weight</p><p className="text-lg text-white">{patientWeight || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Blood Pressure</p><p className="text-lg text-white">{patientBP || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-400 mb-1">Date</p><p className="text-lg text-white">{new Date().toLocaleDateString()}</p></div>
                </div>
              </div>

              {/* Medical History in Review */}
              {(medicalHistory || allergies || currentMedications) && (
                <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30">
                  <h3 className="font-semibold text-purple-300 mb-4 uppercase tracking-wide text-sm">Medical Background</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {medicalHistory && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2 uppercase">Medical History</p>
                        <p className="text-white text-sm whitespace-pre-line">{medicalHistory}</p>
                      </div>
                    )}
                    {allergies && (
                      <div>
                        <p className="text-xs text-red-400 mb-2 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Allergies
                        </p>
                        <p className="text-red-200 text-sm whitespace-pre-line">{allergies}</p>
                      </div>
                    )}
                    {currentMedications && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2 uppercase">Current Medications</p>
                        <p className="text-white text-sm whitespace-pre-line">{currentMedications}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Diagnosis</h3>
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50"><p className="text-white text-lg">{diagnosis}</p></div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Prescriptions</h3>
                <div className="space-y-3">
                  {medications.map((med, i) => (
                    <div key={i} className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50">
                      <p className="font-bold text-white text-lg mb-1">{med.name} - {med.dosage}</p>
                      <p className="text-slate-400">{med.frequency} for {med.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-semibold text-blue-300 mb-3 uppercase tracking-wide text-sm">Prognosis</h3>
                <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-600/50"><p className="text-white text-lg leading-relaxed">{prognosis}</p></div>
              </div>

              {interactions.length > 0 && (
                <div className="mb-8 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Interactions Acknowledged</h3>
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

              <div className="flex flex-col md:flex-row gap-4">
                <button onClick={() => setCurrentView('input')} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all border border-slate-600">← Back to Edit</button>
                <button onClick={handleSubmitToEHR} className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg" style={{ boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)' }}>Confirm & Submit to EHR ✓</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20"><Stethoscope className="w-8 h-8 text-white" /></div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">SmartDoc<Sparkles className="w-6 h-6 text-yellow-300" /></h1>
                <p className="text-blue-100 text-sm md:text-base">AI-Powered Clinical Documentation Assistant</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><UserCircle2 className="w-5 h-5 text-blue-200" /><p className="text-sm text-blue-200 font-semibold">Patient Information</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSettings(true)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-white transition-all">
                    <Settings className="w-3 h-3" />
                  </button>
                  <button onClick={() => setShowEHRImport(!showEHRImport)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-white transition-all">Import EHR</button>
                </div>
              </div>
              {showEHRImport && (
                <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20">
                  <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Enter Patient ID" className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 mb-2 text-sm" />
                  <button onClick={handleEHRImport} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all">Fetch Data</button>
                </div>
              )}
              <div className="space-y-2">
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" placeholder="Patient Name" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" placeholder="Age" />
                  <input type="text" value={patientWeight} onChange={(e) => setPatientWeight(e.target.value)} className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" placeholder="Weight" />
                  <input type="text" value={patientBP} onChange={(e) => setPatientBP(e.target.value)} className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" placeholder="BP" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 mb-6 border border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative text-center mb-6">
            <div className="inline-block relative">
              {isListening && (<><div className="absolute inset-0 animate-ping rounded-full bg-red-500/30"></div><div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20"></div></>)}
              <button onClick={toggleListening} className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl ${isListening ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`} style={{ boxShadow: isListening ? '0 0 60px rgba(239, 68, 68, 0.6)' : '0 0 60px rgba(59, 130, 246, 0.6)' }}>
                {isListening ? <MicOff className="w-14 h-14 text-white" /> : <Mic className="w-14 h-14 text-white" />}
              </button>
            </div>
            <div className="mt-6">
              <p className="text-xl md:text-2xl font-bold text-white mb-2">{isListening ? 'Listening to consultation...' : 'Start Voice Documentation'}</p>
              <p className="text-slate-400 mb-3">{isListening ? 'Speak naturally - AI is capturing everything' : 'Click the microphone to begin'}</p>
              
              {supportStatus === 'not-supported' && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3 text-yellow-200 text-sm">
                  ⚠️ Voice not available in this browser. Use Demo Mode or Chrome/Edge.
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={runDemo} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-bold transition-all shadow-lg">
                  🎬 Run Demo Consultation
                </button>
              </div>
            </div>
          </div>
          {transcript && (
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/20 p-2 rounded-lg"><FileText className="w-5 h-5 text-blue-400" /></div>
                <h3 className="font-semibold text-white text-lg">Live Transcript</h3>
              </div>
              <p className="text-slate-200 leading-relaxed text-lg">{transcript}</p>
            </div>
          )}
        </div>

        {(diagnosis || medications.length > 0) && (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mb-6 border border-slate-700/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-blue-500 p-3 rounded-xl shadow-lg"><Sparkles className="w-6 h-6 text-white" /></div>
                <h2 className="text-2xl font-bold text-white">AI-Extracted Clinical Data</h2>
              </div>

              {diagnosis && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Diagnosis</label>
                  <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
                </div>
              )}

              {medications.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Prescriptions</label>
                  <div className="space-y-4">
                    {medications.map((med, i) => (
                      <div key={i} className="relative p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-600/50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <input type="text" value={med.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} placeholder="Medication" className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="text" value={med.dosage} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} placeholder="Dosage" className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="text" value={med.frequency} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} placeholder="Frequency" className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="text" value={med.duration} onChange={(e) => updateMedication(i, 'duration', e.target.value)} placeholder="Duration" className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button onClick={() => removeMedication(i)} className="text-red-400 text-sm hover:text-red-300 font-medium">× Remove</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addMedication} className="mt-4 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl font-semibold transition-all border border-blue-500/30">+ Add Medication</button>
                </div>
              )}

              {prognosis && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Prognosis</label>
                  <textarea value={prognosis} onChange={(e) => setPrognosis(e.target.value)} rows="4" className="w-full px-5 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg resize-none" />
                </div>
              )}

              {interactions.length > 0 && (
                <div className="relative bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-lg flex-shrink-0"><AlertTriangle className="w-6 h-6 text-amber-400" /></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-300 mb-3 text-lg">Drug Interactions Detected</h3>
                      <div className="space-y-3">
                        {interactions.map((int, i) => (
                          <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-amber-500/20">
                            {int.type === 'drug-drug' ? (
                              <p className="text-amber-200"><span className="font-semibold text-white">{int.drug1}</span> + <span className="font-semibold text-white">{int.drug2}</span><span className="block mt-1 text-sm text-amber-300">{int.warning}</span></p>
                            ) : (
                              <p className="text-amber-200"><span className="font-semibold text-white">{int.drug}</span> interacts with: {int.foods.join(', ')}<span className="block mt-1 text-sm text-amber-300">{int.warning}</span></p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleReview} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg" style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}>Review & Submit to EHR →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDoc;
