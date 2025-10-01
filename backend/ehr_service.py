"""
EHR Integration Service
Handles communication with various EHR systems using HL7 FHIR standards
"""

import json
import uuid
import asyncio
import aiohttp
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin

from models import (
    EHRProvider, EHRConfiguration, EHRConnectionTest, EHRConnectionStatus,
    EHRSubmission, EHRSubmissionResponse, 
    FHIRPatient, FHIRPractitioner, FHIRMedicationRequest, 
    FHIREncounter, FHIRObservation, FHIRBundle,
    Prescription, PatientInfo, Medication
)

logger = logging.getLogger(__name__)

class FHIRService:
    """Service for creating FHIR-compliant resources"""
    
    @staticmethod
    def create_patient_resource(patient_info: PatientInfo, patient_id: str = None) -> FHIRPatient:
        """Create FHIR Patient resource from PatientInfo"""
        patient = FHIRPatient()
        
        if patient_id:
            patient.id = patient_id
        
        # Add identifier
        if hasattr(patient_info, 'patient_id') and patient_info.patient_id:
            patient.identifier.append({
                "use": "usual",
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "MR",
                        "display": "Medical Record Number"
                    }]
                },
                "value": patient_info.patient_id
            })
        
        # Add name
        if patient_info.name:
            name_parts = patient_info.name.split(' ', 1)
            given_name = [name_parts[0]] if name_parts else []
            family_name = name_parts[1] if len(name_parts) > 1 else ""
            
            patient.name.append({
                "use": "official",
                "family": family_name,
                "given": given_name
            })
        
        # Add gender
        if patient_info.gender:
            gender_map = {
                "Male": "male",
                "Female": "female", 
                "Other": "other",
                "Unknown": "unknown"
            }
            patient.gender = gender_map.get(patient_info.gender.lower().title(), "unknown")
        
        # Add birth date (calculate from age if available)
        if patient_info.age:
            try:
                current_year = datetime.now().year
                birth_year = current_year - int(patient_info.age)
                patient.birthDate = f"{birth_year}-01-01"
            except (ValueError, TypeError):
                pass
        
        return patient
    
    @staticmethod
    def create_practitioner_resource(doctor_info: dict, practitioner_id: str = None) -> FHIRPractitioner:
        """Create FHIR Practitioner resource from doctor information"""
        practitioner = FHIRPractitioner()
        
        if practitioner_id:
            practitioner.id = practitioner_id
        
        # Add identifier (registration number)
        if doctor_info.get('registration_number'):
            practitioner.identifier.append({
                "use": "official",
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "PRN",
                        "display": "Provider Number"
                    }]
                },
                "value": doctor_info['registration_number']
            })
        
        # Add name
        if doctor_info.get('name'):
            name_parts = doctor_info['name'].split(' ', 1)
            given_name = [name_parts[0]] if name_parts else []
            family_name = name_parts[1] if len(name_parts) > 1 else ""
            
            practitioner.name.append({
                "use": "official",
                "family": family_name,
                "given": given_name,
                "prefix": ["Dr."]
            })
        
        # Add qualifications
        if doctor_info.get('degree'):
            practitioner.qualification.append({
                "code": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0360",
                        "code": "MD",
                        "display": doctor_info['degree']
                    }]
                }
            })
        
        return practitioner
    
    @staticmethod
    def create_medication_request_resource(
        medication: Medication, 
        patient_reference: str,
        practitioner_reference: str,
        medication_request_id: str = None
    ) -> FHIRMedicationRequest:
        """Create FHIR MedicationRequest resource"""
        med_request = FHIRMedicationRequest()
        
        if medication_request_id:
            med_request.id = medication_request_id
        
        # Medication coding
        med_request.medicationCodeableConcept = {
            "coding": [{
                "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                "code": f"rxnorm-{medication.name.lower().replace(' ', '-')}",
                "display": medication.name
            }],
            "text": medication.name
        }
        
        # References
        med_request.subject = {"reference": patient_reference}
        med_request.requester = {"reference": practitioner_reference}
        
        # Dosage instructions
        if any([medication.dosage, medication.frequency, medication.duration]):
            dosage = {
                "text": f"{medication.dosage} {medication.frequency} for {medication.duration}",
                "timing": {
                    "repeat": {
                        "frequency": 1,
                        "period": 1,
                        "periodUnit": "d"  # daily by default
                    }
                }
            }
            
            # Parse frequency for better timing
            if medication.frequency:
                freq_lower = medication.frequency.lower()
                if "twice" in freq_lower or "bid" in freq_lower:
                    dosage["timing"]["repeat"]["frequency"] = 2
                elif "three" in freq_lower or "tid" in freq_lower:
                    dosage["timing"]["repeat"]["frequency"] = 3
                elif "four" in freq_lower or "qid" in freq_lower:
                    dosage["timing"]["repeat"]["frequency"] = 4
            
            # Add dosage amount if available
            if medication.dosage:
                dosage["doseAndRate"] = [{
                    "doseQuantity": {
                        "value": medication.dosage.split()[0] if medication.dosage.split() else "1",
                        "unit": medication.formulation or "tablet"
                    }
                }]
            
            med_request.dosageInstruction.append(dosage)
        
        # Add notes
        if medication.food_instruction:
            med_request.note.append({
                "text": f"Take {medication.food_instruction.lower()}"
            })
        
        med_request.authoredOn = datetime.now(timezone.utc).isoformat()
        
        return med_request
    
    @staticmethod
    def create_encounter_resource(
        patient_reference: str,
        practitioner_reference: str,
        encounter_id: str = None,
        diagnosis: str = None
    ) -> FHIREncounter:
        """Create FHIR Encounter resource"""
        encounter = FHIREncounter()
        
        if encounter_id:
            encounter.id = encounter_id
        
        # Encounter class
        encounter.class_ = {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        }
        
        # References
        encounter.subject = {"reference": patient_reference}
        encounter.participant.append({
            "type": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                    "code": "PPRF",
                    "display": "primary performer"
                }]
            }],
            "individual": {"reference": practitioner_reference}
        })
        
        # Period (current timestamp)
        now = datetime.now(timezone.utc).isoformat()
        encounter.period = {
            "start": now,
            "end": now
        }
        
        # Reason for encounter
        if diagnosis:
            encounter.reasonCode.append({
                "text": diagnosis
            })
        
        return encounter
    
    @staticmethod
    def create_vital_signs_observations(
        patient_info: PatientInfo,
        patient_reference: str,
        encounter_reference: str = None
    ) -> List[FHIRObservation]:
        """Create FHIR Observation resources for vital signs"""
        observations = []
        now = datetime.now(timezone.utc).isoformat()
        
        # Blood Pressure
        if hasattr(patient_info, 'bp') and patient_info.bp:
            try:
                bp_parts = patient_info.bp.split('/')
                if len(bp_parts) == 2:
                    systolic, diastolic = bp_parts
                    
                    bp_obs = FHIRObservation()
                    bp_obs.id = str(uuid.uuid4())
                    bp_obs.category.append({
                        "coding": [{
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "vital-signs",
                            "display": "Vital Signs"
                        }]
                    })
                    bp_obs.code = {
                        "coding": [{
                            "system": "http://loinc.org",
                            "code": "85354-9",
                            "display": "Blood pressure panel with all children optional"
                        }]
                    }
                    bp_obs.subject = {"reference": patient_reference}
                    if encounter_reference:
                        bp_obs.encounter = {"reference": encounter_reference}
                    bp_obs.effectiveDateTime = now
                    bp_obs.component = [
                        {
                            "code": {
                                "coding": [{
                                    "system": "http://loinc.org",
                                    "code": "8480-6",
                                    "display": "Systolic blood pressure"
                                }]
                            },
                            "valueQuantity": {
                                "value": int(systolic.strip()),
                                "unit": "mmHg",
                                "system": "http://unitsofmeasure.org",
                                "code": "mm[Hg]"
                            }
                        },
                        {
                            "code": {
                                "coding": [{
                                    "system": "http://loinc.org",
                                    "code": "8462-4",
                                    "display": "Diastolic blood pressure"
                                }]
                            },
                            "valueQuantity": {
                                "value": int(diastolic.strip()),
                                "unit": "mmHg",
                                "system": "http://unitsofmeasure.org",
                                "code": "mm[Hg]"
                            }
                        }
                    ]
                    observations.append(bp_obs)
            except (ValueError, AttributeError):
                pass
        
        # Heart Rate
        if hasattr(patient_info, 'heart_rate') and patient_info.heart_rate:
            try:
                hr_obs = FHIRObservation()
                hr_obs.id = str(uuid.uuid4())
                hr_obs.category.append({
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "vital-signs",
                        "display": "Vital Signs"
                    }]
                })
                hr_obs.code = {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "8867-4",
                        "display": "Heart rate"
                    }]
                }
                hr_obs.subject = {"reference": patient_reference}
                if encounter_reference:
                    hr_obs.encounter = {"reference": encounter_reference}
                hr_obs.effectiveDateTime = now
                hr_obs.valueQuantity = {
                    "value": int(patient_info.heart_rate),
                    "unit": "beats/min",
                    "system": "http://unitsofmeasure.org",
                    "code": "/min"
                }
                observations.append(hr_obs)
            except (ValueError, AttributeError):
                pass
        
        # Temperature
        if hasattr(patient_info, 'temperature') and patient_info.temperature:
            try:
                temp_value = float(patient_info.temperature)
                temp_obs = FHIRObservation()
                temp_obs.id = str(uuid.uuid4())
                temp_obs.category.append({
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "vital-signs",
                        "display": "Vital Signs"
                    }]
                })
                temp_obs.code = {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "8310-5",
                        "display": "Body temperature"
                    }]
                }
                temp_obs.subject = {"reference": patient_reference}
                if encounter_reference:
                    temp_obs.encounter = {"reference": encounter_reference}
                temp_obs.effectiveDateTime = now
                temp_obs.valueQuantity = {
                    "value": temp_value,
                    "unit": "°F" if temp_value > 45 else "°C",
                    "system": "http://unitsofmeasure.org",
                    "code": "Cel" if temp_value <= 45 else "[degF]"
                }
                observations.append(temp_obs)
            except (ValueError, AttributeError):
                pass
        
        return observations
    
    @staticmethod
    def create_fhir_bundle(resources: List[dict], bundle_id: str = None) -> FHIRBundle:
        """Create FHIR Bundle for transaction"""
        bundle = FHIRBundle()
        
        if bundle_id:
            bundle.id = bundle_id
        
        bundle.timestamp = datetime.now(timezone.utc).isoformat()
        
        for resource in resources:
            entry = {
                "resource": resource,
                "request": {
                    "method": "POST",
                    "url": resource.get("resourceType", "Unknown")
                }
            }
            bundle.entry.append(entry)
        
        return bundle

class EHRIntegrationService:
    """Main EHR integration service"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.fhir_service = FHIRService()
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def test_ehr_connection(self, config: EHRConfiguration) -> EHRConnectionTest:
        """Test connection to EHR system"""
        start_time = datetime.now()
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Test metadata endpoint
            metadata_url = urljoin(config.base_url, "metadata")
            
            timeout = aiohttp.ClientTimeout(total=config.timeout)
            headers = {"Accept": "application/fhir+json"}
            
            # Add authentication if configured
            if config.api_key:
                headers["Authorization"] = f"Bearer {config.api_key}"
            
            async with self.session.get(
                metadata_url, 
                headers=headers, 
                timeout=timeout,
                ssl=config.verify_ssl
            ) as response:
                
                response_time = (datetime.now() - start_time).total_seconds()
                
                if response.status == 200:
                    data = await response.json()
                    capabilities = []
                    fhir_version = None
                    
                    if "rest" in data:
                        for rest in data["rest"]:
                            if "resource" in rest:
                                capabilities.extend([r["type"] for r in rest["resource"]])
                    
                    if "fhirVersion" in data:
                        fhir_version = data["fhirVersion"]
                    
                    return EHRConnectionTest(
                        provider=config.provider,
                        status=EHRConnectionStatus.CONNECTED,
                        message="Connection successful",
                        response_time=response_time,
                        last_tested=start_time,
                        capabilities=list(set(capabilities)) if capabilities else None,
                        fhir_version=fhir_version
                    )
                else:
                    return EHRConnectionTest(
                        provider=config.provider,
                        status=EHRConnectionStatus.ERROR,
                        message=f"HTTP {response.status}: {await response.text()}",
                        response_time=response_time,
                        last_tested=start_time
                    )
                    
        except asyncio.TimeoutError:
            return EHRConnectionTest(
                provider=config.provider,
                status=EHRConnectionStatus.ERROR,
                message=f"Connection timeout after {config.timeout} seconds",
                last_tested=start_time
            )
        except Exception as e:
            return EHRConnectionTest(
                provider=config.provider,
                status=EHRConnectionStatus.ERROR,
                message=f"Connection error: {str(e)}",
                last_tested=start_time
            )
    
    async def submit_prescription_to_ehr(
        self, 
        prescription: Prescription,
        doctor_info: dict,
        config: EHRConfiguration
    ) -> Dict:
        """Submit prescription to EHR system using FHIR"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Create FHIR resources
            patient_id = str(uuid.uuid4())
            practitioner_id = str(uuid.uuid4())
            encounter_id = str(uuid.uuid4())
            
            # Patient resource
            patient = self.fhir_service.create_patient_resource(
                prescription.patient_info, 
                patient_id
            )
            
            # Practitioner resource
            practitioner = self.fhir_service.create_practitioner_resource(
                doctor_info, 
                practitioner_id
            )
            
            # Encounter resource
            encounter = self.fhir_service.create_encounter_resource(
                f"Patient/{patient_id}",
                f"Practitioner/{practitioner_id}",
                encounter_id,
                prescription.diagnosis
            )
            
            # Medication requests
            medication_requests = []
            for medication in prescription.medications:
                med_request = self.fhir_service.create_medication_request_resource(
                    medication,
                    f"Patient/{patient_id}",
                    f"Practitioner/{practitioner_id}",
                    str(uuid.uuid4())
                )
                medication_requests.append(med_request.model_dump())
            
            # Vital signs observations
            vital_observations = self.fhir_service.create_vital_signs_observations(
                prescription.patient_info,
                f"Patient/{patient_id}",
                f"Encounter/{encounter_id}"
            )
            
            # Create bundle
            resources = [
                patient.model_dump(),
                practitioner.model_dump(), 
                encounter.model_dump()
            ] + medication_requests + [obs.model_dump() for obs in vital_observations]
            
            bundle = self.fhir_service.create_fhir_bundle(resources)
            
            # Submit to EHR
            headers = {
                "Content-Type": "application/fhir+json",
                "Accept": "application/fhir+json"
            }
            
            if config.api_key:
                headers["Authorization"] = f"Bearer {config.api_key}"
            
            timeout = aiohttp.ClientTimeout(total=config.timeout)
            
            async with self.session.post(
                config.base_url,
                json=bundle.model_dump(),
                headers=headers,
                timeout=timeout,
                ssl=config.verify_ssl
            ) as response:
                
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                return {
                    "success": response.status in [200, 201],
                    "status_code": response.status,
                    "response": response_data,
                    "submitted_bundle": bundle.model_dump(),
                    "patient_fhir_id": patient_id,
                    "encounter_fhir_id": encounter_id
                }
                
        except Exception as e:
            logger.error(f"EHR submission error: {e}")
            return {
                "success": False,
                "error": str(e),
                "submitted_bundle": None,
                "patient_fhir_id": None,
                "encounter_fhir_id": None
            }
    
    def get_supported_providers(self) -> List[Dict[str, str]]:
        """Get list of supported EHR providers"""
        return [
            {"value": EHRProvider.EPIC, "label": "Epic MyChart", "description": "Epic Systems EHR platform"},
            {"value": EHRProvider.CERNER, "label": "Cerner PowerChart", "description": "Oracle Cerner EHR platform"},
            {"value": EHRProvider.ALLSCRIPTS, "label": "Allscripts", "description": "Allscripts EHR platform"},
            {"value": EHRProvider.ATHENAHEALTH, "label": "athenahealth", "description": "athenahealth EHR platform"},
            {"value": EHRProvider.ECLINICALWORKS, "label": "eClinicalWorks", "description": "eClinicalWorks EHR platform"},
            {"value": EHRProvider.NEXTGEN, "label": "NextGen", "description": "NextGen Healthcare EHR platform"},
            {"value": EHRProvider.CUSTOM_FHIR, "label": "Custom FHIR", "description": "Custom FHIR-compliant endpoint"},
            {"value": EHRProvider.OTHER, "label": "Other", "description": "Other FHIR-compliant EHR system"}
        ]