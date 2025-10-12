#!/usr/bin/env python3
"""
Backend Test Suite for NEW Patient Management System
Tests the redesigned patient/visit system with MRN and visit codes
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any

# Test configuration
BASE_URL = "https://medscribe-26.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class NewPatientManagementTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_doctor_id = None
        self.test_results = []
        self.saved_patient_code = None  # Store patient code for search tests (legacy)
        self.saved_patient_mrn = None   # Store MRN for new system tests
        self.saved_visit_code = None    # Store visit code for new system tests
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    async def test_health_check(self):
        """Test 1: Health Check Endpoint"""
        try:
            async with self.session.get(f"{API_BASE}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy":
                        self.log_test("Health Check", True, "Backend is healthy", data)
                        return True
                    else:
                        self.log_test("Health Check", False, "Unexpected health status", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Health Check", False, f"HTTP {response.status}", {"response": text})
                    return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    async def test_doctor_registration_and_login(self):
        """Test 2: Doctor Authentication with Demo Account"""
        # Use demo account as specified in review request
        demo_username = "drsmith"
        demo_password = "password123"
        
        try:
            # First try to login with demo account
            login_data = {
                "username": demo_username,
                "password": demo_password
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    login_response = await response.json()
                    if login_response.get("access_token"):
                        self.auth_token = login_response["access_token"]
                        self.test_doctor_id = login_response["user"]["id"]
                        self.log_test("Doctor Login (Demo Account)", True, "Demo account login successful", {
                            "username": demo_username,
                            "token_type": login_response.get("token_type"),
                            "user_id": self.test_doctor_id
                        })
                        return True
                    else:
                        self.log_test("Doctor Login (Demo Account)", False, "No access token received", login_response)
                        # Fall back to creating new account
                        return await self._create_test_account()
                else:
                    text = await response.text()
                    self.log_test("Doctor Login (Demo Account)", False, f"Demo account login failed - HTTP {response.status}", {"response": text})
                    # Fall back to creating new account
                    return await self._create_test_account()
                    
        except Exception as e:
            self.log_test("Doctor Authentication", False, f"Error: {str(e)}")
            return False
    
    async def _create_test_account(self):
        """Fallback: Create a test account if demo account doesn't exist"""
        # Generate unique test doctor credentials
        test_username = f"test_doctor_{uuid.uuid4().hex[:8]}"
        test_password = "TestPassword123!"
        
        # Registration data
        registration_data = {
            "name": "Dr. Sarah Johnson",
            "degree": "MD",
            "registration_number": f"REG{uuid.uuid4().hex[:8].upper()}",
            "organization": "SmartDoc Test Hospital",
            "email": f"{test_username}@testdomain.com",
            "phone": "+1-555-0123",
            "specialization": "Internal Medicine",
            "username": test_username,
            "password": test_password
        }
        
        try:
            # Test registration
            async with self.session.post(
                f"{API_BASE}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    reg_data = await response.json()
                    if reg_data.get("success"):
                        self.log_test("Doctor Registration (Fallback)", True, "Registration successful", reg_data)
                    else:
                        self.log_test("Doctor Registration (Fallback)", False, "Registration failed", reg_data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Doctor Registration (Fallback)", False, f"HTTP {response.status}", {"response": text})
                    return False
            
            # Test login with new account
            login_data = {
                "username": test_username,
                "password": test_password
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    login_response = await response.json()
                    if login_response.get("access_token"):
                        self.auth_token = login_response["access_token"]
                        self.test_doctor_id = login_response["user"]["id"]
                        self.log_test("Doctor Login (Fallback)", True, "Login successful", {
                            "token_type": login_response.get("token_type"),
                            "user_id": self.test_doctor_id
                        })
                        return True
                    else:
                        self.log_test("Doctor Login (Fallback)", False, "No access token received", login_response)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Doctor Login (Fallback)", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Doctor Authentication (Fallback)", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_providers(self):
        """Test 3: Get EHR Providers"""
        if not self.auth_token:
            self.log_test("EHR Providers", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/ehr/providers", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("providers"):
                        providers = data["data"]["providers"]
                        expected_providers = ["Epic", "Cerner", "Allscripts", "AthenaHealth", "eClinicalWorks"]
                        
                        provider_values = [p.get("value") for p in providers]
                        found_providers = [p for p in expected_providers if p in provider_values]
                        
                        self.log_test("EHR Providers", True, f"Retrieved {len(providers)} providers", {
                            "total_providers": len(providers),
                            "expected_found": len(found_providers),
                            "providers": provider_values
                        })
                        return True
                    else:
                        self.log_test("EHR Providers", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Providers", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Providers", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_configuration(self):
        """Test 4: EHR Configuration Management"""
        if not self.auth_token:
            self.log_test("EHR Configuration", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test Epic configuration with OAuth
            epic_config = {
                "provider": "Epic",
                "base_url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/",
                "client_id": "test_client_id_epic",
                "client_secret": "test_client_secret_epic",
                "auth_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
                "token_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
                "scope": "patient/*.read patient/*.write",
                "use_oauth": True,
                "organization_id": "TEST_ORG_EPIC",
                "facility_id": "TEST_FACILITY_EPIC",
                "timeout": 30,
                "verify_ssl": True
            }
            
            # Save Epic configuration
            async with self.session.post(
                f"{API_BASE}/ehr/configure",
                json=epic_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.log_test("EHR Configuration (Epic OAuth)", True, "Epic configuration saved", data)
                    else:
                        self.log_test("EHR Configuration (Epic OAuth)", False, "Failed to save Epic config", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Configuration (Epic OAuth)", False, f"HTTP {response.status}", {"response": text})
                    return False
            
            # Test Cerner configuration with API Key
            cerner_config = {
                "provider": "Cerner",
                "base_url": "https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d/",
                "use_oauth": False,
                "api_key": "test_api_key_cerner_12345",
                "organization_id": "TEST_ORG_CERNER",
                "facility_id": "TEST_FACILITY_CERNER",
                "timeout": 30,
                "verify_ssl": True
            }
            
            # Save Cerner configuration
            async with self.session.post(
                f"{API_BASE}/ehr/configure",
                json=cerner_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.log_test("EHR Configuration (Cerner API Key)", True, "Cerner configuration saved", data)
                        return True
                    else:
                        self.log_test("EHR Configuration (Cerner API Key)", False, "Failed to save Cerner config", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Configuration (Cerner API Key)", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Configuration", False, f"Error: {str(e)}")
            return False
    
    async def test_ehr_connection_test(self):
        """Test 5: EHR Connection Testing"""
        if not self.auth_token:
            self.log_test("EHR Connection Test", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test connection with Epic configuration
            test_config = {
                "provider": "Epic",
                "base_url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/",
                "client_id": "test_client_id",
                "client_secret": "test_client_secret",
                "auth_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
                "token_url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
                "scope": "patient/*.read patient/*.write",
                "use_oauth": True,
                "timeout": 30,
                "verify_ssl": True
            }
            
            async with self.session.post(
                f"{API_BASE}/ehr/test-connection",
                json=test_config,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    # Connection test may fail due to invalid credentials, but endpoint should work
                    if "data" in data and "status" in data["data"]:
                        status = data["data"]["status"]
                        self.log_test("EHR Connection Test", True, f"Connection test completed with status: {status}", data)
                        return True
                    else:
                        self.log_test("EHR Connection Test", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("EHR Connection Test", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("EHR Connection Test", False, f"Error: {str(e)}")
            return False
    
    async def test_get_ehr_configurations(self):
        """Test 6: Get EHR Configurations"""
        if not self.auth_token:
            self.log_test("Get EHR Configurations", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/ehr/configurations", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "configurations" in data.get("data", {}):
                        configurations = data["data"]["configurations"]
                        self.log_test("Get EHR Configurations", True, f"Retrieved {len(configurations)} configurations", {
                            "count": len(configurations),
                            "providers": [config.get("provider") for config in configurations]
                        })
                        return True
                    else:
                        self.log_test("Get EHR Configurations", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get EHR Configurations", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Get EHR Configurations", False, f"Error: {str(e)}")
            return False
    
    async def test_authentication_required_endpoints(self):
        """Test 7: Authentication Required for Protected Endpoints"""
        get_endpoints = [
            "/ehr/providers",
            "/ehr/configurations"
        ]
        
        post_endpoints = [
            "/ehr/configure",
            "/ehr/test-connection"
        ]
        
        all_passed = True
        
        # Test GET endpoints without authentication
        for endpoint in get_endpoints:
            try:
                async with self.session.get(f"{API_BASE}{endpoint}") as response:
                    if response.status in [401, 403]:  # Both are valid auth errors
                        self.log_test(f"Auth Required - GET {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                    else:
                        self.log_test(f"Auth Required - GET {endpoint}", False, f"Expected 401/403, got {response.status}")
                        all_passed = False
                        
            except Exception as e:
                self.log_test(f"Auth Required - GET {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        # Test POST endpoints without authentication
        for endpoint in post_endpoints:
            try:
                async with self.session.post(f"{API_BASE}{endpoint}", json={}) as response:
                    if response.status in [401, 403]:  # Both are valid auth errors
                        self.log_test(f"Auth Required - POST {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                    else:
                        self.log_test(f"Auth Required - POST {endpoint}", False, f"Expected 401/403, got {response.status}")
                        all_passed = False
                        
            except Exception as e:
                self.log_test(f"Auth Required - POST {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    async def test_patient_save(self):
        """Test 8: Save Patient Information"""
        if not self.auth_token:
            self.log_test("Patient Save", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Comprehensive patient data - matching PatientInfo and MedicalHistory models
            patient_data = {
                "patient_info": {
                    "name": "John Michael Smith",
                    "age": "45",
                    "gender": "Male",
                    "height": "5'10\"",
                    "weight": "180 lbs",
                    "blood_pressure": "130/85 mmHg",
                    "temperature": "98.6°F",
                    "heart_rate": "72 bpm",
                    "respiratory_rate": "16/min",
                    "oxygen_saturation": "98%"
                },
                "medical_history": {
                    "allergies": "Penicillin, Shellfish",
                    "past_medical_history": "Type 2 Diabetes (2018), Hypertension (2020)",
                    "past_medications": "Metformin 500mg twice daily, Lisinopril 10mg once daily",
                    "family_history": "Diabetes (Father), Heart Disease (Mother)",
                    "smoking_status": "Non-smoker",
                    "alcohol_use": "Occasional social drinking",
                    "drug_use": "None",
                    "exercise_level": "Moderate - walks 30 minutes daily"
                },
                "diagnosis": "Type 2 Diabetes Mellitus with good glycemic control. Essential Hypertension, well-controlled.",
                "prognosis": "Good prognosis with continued medication compliance and lifestyle modifications. Regular monitoring recommended.",
                "notes": "Patient is compliant with medications. Recommend quarterly HbA1c monitoring and annual eye exams."
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/save",
                json=patient_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("patient_code"):
                        self.saved_patient_code = data["data"]["patient_code"]
                        patient_id = data["data"]["id"]
                        visit_date = data["data"]["visit_date"]
                        
                        # Validate patient code format (6-8 characters)
                        code_length = len(self.saved_patient_code)
                        if 6 <= code_length <= 8:
                            self.log_test("Patient Save", True, f"Patient saved successfully with code: {self.saved_patient_code}", {
                                "patient_code": self.saved_patient_code,
                                "patient_id": patient_id,
                                "visit_date": visit_date,
                                "code_length": code_length
                            })
                            return True
                        else:
                            self.log_test("Patient Save", False, f"Invalid patient code length: {code_length} (expected 6-8)", data)
                            return False
                    else:
                        self.log_test("Patient Save", False, "No patient code in response", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Save", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Save", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_search(self):
        """Test 9: Search Patient by Code"""
        if not self.auth_token:
            self.log_test("Patient Search", False, "No authentication token available")
            return False
        
        if not self.saved_patient_code:
            self.log_test("Patient Search", False, "No saved patient code available for search")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            search_data = {
                "patient_code": self.saved_patient_code
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data", {}).get("patient"):
                        patient = data["data"]["patient"]
                        
                        # Verify patient data integrity
                        expected_fields = ["patient_code", "patient_info", "medical_history", "diagnosis", "prognosis"]
                        missing_fields = [field for field in expected_fields if field not in patient]
                        
                        if not missing_fields:
                            # Verify patient code matches
                            if patient["patient_code"] == self.saved_patient_code:
                                # Verify patient name
                                patient_name = patient.get("patient_info", {}).get("name")
                                if patient_name == "John Michael Smith":
                                    self.log_test("Patient Search", True, f"Patient found successfully with code: {self.saved_patient_code}", {
                                        "patient_code": patient["patient_code"],
                                        "patient_name": patient_name,
                                        "doctor_id": patient.get("doctor_id"),
                                        "visit_date": patient.get("visit_date")
                                    })
                                    return True
                                else:
                                    self.log_test("Patient Search", False, f"Patient name mismatch: expected 'John Michael Smith', got '{patient_name}'")
                                    return False
                            else:
                                self.log_test("Patient Search", False, f"Patient code mismatch: expected '{self.saved_patient_code}', got '{patient['patient_code']}'")
                                return False
                        else:
                            self.log_test("Patient Search", False, f"Missing required fields: {missing_fields}", patient)
                            return False
                    else:
                        self.log_test("Patient Search", False, "No patient data in response", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Search", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Search", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_search_invalid_code(self):
        """Test 10: Search Patient with Invalid Code"""
        if not self.auth_token:
            self.log_test("Patient Search Invalid Code", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test with non-existent patient code (8 characters max)
            search_data = {
                "patient_code": "INVALID1"
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 404:
                    data = await response.json()
                    if not data.get("success"):
                        self.log_test("Patient Search Invalid Code", True, "Correctly returned 404 for invalid patient code", data)
                        return True
                    else:
                        self.log_test("Patient Search Invalid Code", False, "Expected success=false for invalid code", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Patient Search Invalid Code", False, f"Expected HTTP 404, got {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Search Invalid Code", False, f"Error: {str(e)}")
            return False
    
    async def test_get_my_patients(self):
        """Test 11: Get Doctor's Saved Patients"""
        if not self.auth_token:
            self.log_test("Get My Patients", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{API_BASE}/patients/my-patients", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "patients" in data.get("data", {}):
                        patients = data["data"]["patients"]
                        patient_count = data["data"]["count"]
                        
                        # Should have at least 1 patient (the one we saved)
                        if patient_count >= 1:
                            # Find our saved patient
                            our_patient = None
                            for patient in patients:
                                if patient.get("patient_code") == self.saved_patient_code:
                                    our_patient = patient
                                    break
                            
                            if our_patient:
                                self.log_test("Get My Patients", True, f"Retrieved {patient_count} patients including our saved patient", {
                                    "total_patients": patient_count,
                                    "found_our_patient": True,
                                    "our_patient_code": self.saved_patient_code,
                                    "our_patient_name": our_patient.get("patient_info", {}).get("name")
                                })
                                return True
                            else:
                                self.log_test("Get My Patients", False, f"Our saved patient (code: {self.saved_patient_code}) not found in results", {
                                    "total_patients": patient_count,
                                    "patient_codes": [p.get("patient_code") for p in patients]
                                })
                                return False
                        else:
                            self.log_test("Get My Patients", False, f"Expected at least 1 patient, got {patient_count}")
                            return False
                    else:
                        self.log_test("Get My Patients", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get My Patients", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Get My Patients", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_endpoints_authentication(self):
        """Test 12: Patient Endpoints Require Authentication"""
        patient_endpoints = [
            ("GET", "/patients/my-patients"),
            ("POST", "/patients/save"),
            ("POST", "/patients/search")
        ]
        
        all_passed = True
        
        for method, endpoint in patient_endpoints:
            try:
                if method == "GET":
                    async with self.session.get(f"{API_BASE}{endpoint}") as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                else:  # POST
                    async with self.session.post(f"{API_BASE}{endpoint}", json={}) as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                            
            except Exception as e:
                self.log_test(f"Auth Required - {method} {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    # ============ NEW PATIENT MANAGEMENT SYSTEM TESTS ============
    
    async def test_search_patients_empty(self):
        """Test 13: Search Patients (Empty Results)"""
        if not self.auth_token:
            self.log_test("Search Patients Empty", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            search_data = {
                "search_term": "NonExistentPatient12345"
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search-patients",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if "patients" in data and "total_count" in data:
                        patients = data["patients"]
                        total_count = data["total_count"]
                        
                        if total_count == 0 and len(patients) == 0:
                            self.log_test("Search Patients Empty", True, "Empty search results returned correctly", {
                                "total_count": total_count,
                                "patients_count": len(patients)
                            })
                            return True
                        else:
                            self.log_test("Search Patients Empty", False, f"Expected empty results, got {total_count} patients")
                            return False
                    else:
                        self.log_test("Search Patients Empty", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Search Patients Empty", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Search Patients Empty", False, f"Error: {str(e)}")
            return False
    
    async def test_create_new_patient(self):
        """Test 14: Create New Patient with Initial Visit"""
        if not self.auth_token:
            self.log_test("Create New Patient", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Comprehensive patient data for new system
            patient_data = {
                "patient_info": {
                    "name": "Emily Sarah Johnson",
                    "age": "32",
                    "gender": "Female",
                    "height": "5'6\"",
                    "weight": "140 lbs",
                    "blood_pressure": "120/80 mmHg",
                    "temperature": "98.4°F",
                    "heart_rate": "68 bpm",
                    "respiratory_rate": "14/min",
                    "oxygen_saturation": "99%",
                    "phone": "+1-555-0198"
                },
                "medical_history": {
                    "allergies": "Latex, Peanuts",
                    "past_medical_history": "Asthma (childhood), Appendectomy (2019)",
                    "past_medications": "Albuterol inhaler as needed",
                    "family_history": "Diabetes (Grandmother), Hypertension (Father)",
                    "smoking_status": "Never smoked",
                    "alcohol_use": "Social drinking, 1-2 drinks per week",
                    "drug_use": "None",
                    "exercise_level": "Regular - yoga 3x/week, running 2x/week"
                },
                "diagnosis": "Annual wellness visit. Patient in good health with well-controlled asthma.",
                "prognosis": "Excellent prognosis. Continue current lifestyle and asthma management.",
                "notes": "Patient reports no current concerns. Asthma well-controlled with PRN albuterol. Recommend annual follow-up."
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/create-new",
                json=patient_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        result_data = data["data"]
                        
                        # Validate MRN format (MRN + 7 digits)
                        mrn = result_data.get("mrn")
                        visit_code = result_data.get("visit_code")
                        patient_name = result_data.get("patient_name")
                        
                        if mrn and mrn.startswith("MRN") and len(mrn) == 10:
                            if visit_code and visit_code.startswith("V") and len(visit_code) >= 6:
                                if patient_name == "Emily Sarah Johnson":
                                    self.saved_patient_mrn = mrn
                                    self.saved_visit_code = visit_code
                                    
                                    self.log_test("Create New Patient", True, f"New patient created successfully", {
                                        "mrn": mrn,
                                        "visit_code": visit_code,
                                        "patient_name": patient_name,
                                        "mrn_format_valid": True,
                                        "visit_code_format_valid": True
                                    })
                                    return True
                                else:
                                    self.log_test("Create New Patient", False, f"Patient name mismatch: expected 'Emily Sarah Johnson', got '{patient_name}'")
                                    return False
                            else:
                                self.log_test("Create New Patient", False, f"Invalid visit code format: {visit_code}")
                                return False
                        else:
                            self.log_test("Create New Patient", False, f"Invalid MRN format: {mrn}")
                            return False
                    else:
                        self.log_test("Create New Patient", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Create New Patient", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Create New Patient", False, f"Error: {str(e)}")
            return False
    
    async def test_search_patients_by_name(self):
        """Test 15: Search Patients by Name"""
        if not self.auth_token or not self.saved_patient_mrn:
            self.log_test("Search Patients by Name", False, "No authentication token or saved patient available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Search by partial name
            search_data = {
                "search_term": "Emily"
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search-patients",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if "patients" in data and "total_count" in data:
                        patients = data["patients"]
                        total_count = data["total_count"]
                        
                        # Should find our created patient
                        found_patient = None
                        for patient in patients:
                            if patient.get("mrn") == self.saved_patient_mrn:
                                found_patient = patient
                                break
                        
                        if found_patient:
                            self.log_test("Search Patients by Name", True, f"Found patient by name search", {
                                "total_count": total_count,
                                "found_mrn": found_patient["mrn"],
                                "patient_name": found_patient.get("patient_info", {}).get("name"),
                                "total_visits": found_patient.get("total_visits", 0)
                            })
                            return True
                        else:
                            self.log_test("Search Patients by Name", False, f"Created patient not found in search results", {
                                "total_count": total_count,
                                "expected_mrn": self.saved_patient_mrn,
                                "found_mrns": [p.get("mrn") for p in patients]
                            })
                            return False
                    else:
                        self.log_test("Search Patients by Name", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Search Patients by Name", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Search Patients by Name", False, f"Error: {str(e)}")
            return False
    
    async def test_search_patients_by_mrn(self):
        """Test 16: Search Patients by MRN"""
        if not self.auth_token or not self.saved_patient_mrn:
            self.log_test("Search Patients by MRN", False, "No authentication token or saved patient available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Search by MRN
            search_data = {
                "search_term": self.saved_patient_mrn
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/search-patients",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if "patients" in data and "total_count" in data:
                        patients = data["patients"]
                        total_count = data["total_count"]
                        
                        if total_count >= 1:
                            found_patient = patients[0]  # Should be exact match
                            if found_patient.get("mrn") == self.saved_patient_mrn:
                                self.log_test("Search Patients by MRN", True, f"Found patient by MRN search", {
                                    "mrn": found_patient["mrn"],
                                    "patient_name": found_patient.get("patient_info", {}).get("name"),
                                    "total_visits": found_patient.get("total_visits", 0)
                                })
                                return True
                            else:
                                self.log_test("Search Patients by MRN", False, f"MRN mismatch in results")
                                return False
                        else:
                            self.log_test("Search Patients by MRN", False, f"No patients found for MRN: {self.saved_patient_mrn}")
                            return False
                    else:
                        self.log_test("Search Patients by MRN", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Search Patients by MRN", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Search Patients by MRN", False, f"Error: {str(e)}")
            return False
    
    async def test_get_patient_details(self):
        """Test 17: Get Patient Details with All Visits"""
        if not self.auth_token or not self.saved_patient_mrn:
            self.log_test("Get Patient Details", False, "No authentication token or saved patient available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(
                f"{API_BASE}/patients/{self.saved_patient_mrn}/details",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if "patient" in data and "visits" in data and "visit_count" in data:
                        patient = data["patient"]
                        visits = data["visits"]
                        visit_count = data["visit_count"]
                        
                        # Validate patient data
                        if patient.get("mrn") == self.saved_patient_mrn:
                            if visit_count >= 1 and len(visits) >= 1:
                                # Check first visit
                                first_visit = visits[0]
                                if first_visit.get("visit_code") == self.saved_visit_code:
                                    self.log_test("Get Patient Details", True, f"Patient details retrieved successfully", {
                                        "mrn": patient["mrn"],
                                        "patient_name": patient.get("patient_info", {}).get("name"),
                                        "visit_count": visit_count,
                                        "first_visit_code": first_visit["visit_code"],
                                        "visit_type": first_visit.get("visit_type")
                                    })
                                    return True
                                else:
                                    self.log_test("Get Patient Details", False, f"Visit code mismatch in details")
                                    return False
                            else:
                                self.log_test("Get Patient Details", False, f"Expected at least 1 visit, got {visit_count}")
                                return False
                        else:
                            self.log_test("Get Patient Details", False, f"MRN mismatch in patient details")
                            return False
                    else:
                        self.log_test("Get Patient Details", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Get Patient Details", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Get Patient Details", False, f"Error: {str(e)}")
            return False
    
    async def test_add_visit_to_existing_patient(self):
        """Test 18: Add New Visit to Existing Patient"""
        if not self.auth_token or not self.saved_patient_mrn:
            self.log_test("Add Visit to Existing Patient", False, "No authentication token or saved patient available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Follow-up visit data
            visit_data = {
                "patient_mrn": self.saved_patient_mrn,
                "medical_history": {
                    "allergies": "Latex, Peanuts",
                    "past_medical_history": "Asthma (childhood), Appendectomy (2019)",
                    "past_medications": "Albuterol inhaler as needed, Vitamin D3 1000 IU daily",
                    "family_history": "Diabetes (Grandmother), Hypertension (Father)",
                    "smoking_status": "Never smoked",
                    "alcohol_use": "Social drinking, 1-2 drinks per week",
                    "drug_use": "None",
                    "exercise_level": "Regular - yoga 3x/week, running 2x/week"
                },
                "diagnosis": "Follow-up visit for asthma management. Patient reports good control with current regimen.",
                "prognosis": "Excellent. Continue current management plan.",
                "notes": "Patient doing well. No exacerbations since last visit. Continue albuterol PRN. Added Vitamin D supplementation."
            }
            
            async with self.session.post(
                f"{API_BASE}/patients/add-visit",
                json=visit_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        result_data = data["data"]
                        new_visit_code = result_data.get("visit_code")
                        patient_mrn = result_data.get("patient_mrn")
                        
                        if new_visit_code and patient_mrn == self.saved_patient_mrn:
                            # Validate visit code format
                            if new_visit_code.startswith("V") and len(new_visit_code) >= 6:
                                self.log_test("Add Visit to Existing Patient", True, f"New visit added successfully", {
                                    "patient_mrn": patient_mrn,
                                    "new_visit_code": new_visit_code,
                                    "visit_code_format_valid": True
                                })
                                return True
                            else:
                                self.log_test("Add Visit to Existing Patient", False, f"Invalid visit code format: {new_visit_code}")
                                return False
                        else:
                            self.log_test("Add Visit to Existing Patient", False, "Missing visit code or MRN mismatch", result_data)
                            return False
                    else:
                        self.log_test("Add Visit to Existing Patient", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Add Visit to Existing Patient", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Add Visit to Existing Patient", False, f"Error: {str(e)}")
            return False
    
    async def test_search_visit_by_code(self):
        """Test 19: Search Visit by Visit Code"""
        if not self.auth_token or not self.saved_visit_code:
            self.log_test("Search Visit by Code", False, "No authentication token or saved visit code available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            search_data = {
                "visit_code": self.saved_visit_code
            }
            
            async with self.session.post(
                f"{API_BASE}/visits/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("data"):
                        result_data = data["data"]
                        visit = result_data.get("visit")
                        patient = result_data.get("patient")
                        
                        if visit and patient:
                            if visit.get("visit_code") == self.saved_visit_code:
                                if patient.get("mrn") == self.saved_patient_mrn:
                                    self.log_test("Search Visit by Code", True, f"Visit found successfully", {
                                        "visit_code": visit["visit_code"],
                                        "patient_mrn": patient["mrn"],
                                        "patient_name": patient.get("patient_info", {}).get("name"),
                                        "visit_type": visit.get("visit_type"),
                                        "diagnosis": visit.get("diagnosis", "")[:50] + "..." if visit.get("diagnosis") else "None"
                                    })
                                    return True
                                else:
                                    self.log_test("Search Visit by Code", False, f"Patient MRN mismatch in visit search")
                                    return False
                            else:
                                self.log_test("Search Visit by Code", False, f"Visit code mismatch in search results")
                                return False
                        else:
                            self.log_test("Search Visit by Code", False, "Missing visit or patient data", result_data)
                            return False
                    else:
                        self.log_test("Search Visit by Code", False, "Invalid response format", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Search Visit by Code", False, f"HTTP {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Search Visit by Code", False, f"Error: {str(e)}")
            return False
    
    async def test_search_visit_invalid_code(self):
        """Test 20: Search Visit with Invalid Code"""
        if not self.auth_token:
            self.log_test("Search Visit Invalid Code", False, "No authentication token available")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            search_data = {
                "visit_code": "VINVALID123"
            }
            
            async with self.session.post(
                f"{API_BASE}/visits/search",
                json=search_data,
                headers=headers
            ) as response:
                
                if response.status == 404:
                    data = await response.json()
                    if not data.get("success"):
                        self.log_test("Search Visit Invalid Code", True, "Correctly returned 404 for invalid visit code", data)
                        return True
                    else:
                        self.log_test("Search Visit Invalid Code", False, "Expected success=false for invalid code", data)
                        return False
                else:
                    text = await response.text()
                    self.log_test("Search Visit Invalid Code", False, f"Expected HTTP 404, got {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Search Visit Invalid Code", False, f"Error: {str(e)}")
            return False
    
    async def test_patient_details_invalid_mrn(self):
        """Test 21: Get Patient Details with Invalid MRN"""
        if not self.auth_token:
            self.log_test("Patient Details Invalid MRN", False, "No authentication token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            invalid_mrn = "MRN9999999"
            
            async with self.session.get(
                f"{API_BASE}/patients/{invalid_mrn}/details",
                headers=headers
            ) as response:
                
                if response.status == 404:
                    data = await response.json()
                    self.log_test("Patient Details Invalid MRN", True, "Correctly returned 404 for invalid MRN", data)
                    return True
                else:
                    text = await response.text()
                    self.log_test("Patient Details Invalid MRN", False, f"Expected HTTP 404, got {response.status}", {"response": text})
                    return False
                    
        except Exception as e:
            self.log_test("Patient Details Invalid MRN", False, f"Error: {str(e)}")
            return False
    
    async def test_new_patient_endpoints_authentication(self):
        """Test 22: New Patient Management Endpoints Require Authentication"""
        new_patient_endpoints = [
            ("POST", "/patients/search-patients"),
            ("POST", "/patients/create-new"),
            ("POST", "/patients/add-visit"),
            ("GET", "/patients/MRN1234567/details"),
            ("POST", "/visits/search")
        ]
        
        all_passed = True
        
        for method, endpoint in new_patient_endpoints:
            try:
                if method == "GET":
                    async with self.session.get(f"{API_BASE}{endpoint}") as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                else:  # POST
                    async with self.session.post(f"{API_BASE}{endpoint}", json={}) as response:
                        if response.status in [401, 403]:
                            self.log_test(f"Auth Required - {method} {endpoint}", True, f"Correctly requires authentication (HTTP {response.status})")
                        else:
                            self.log_test(f"Auth Required - {method} {endpoint}", False, f"Expected 401/403, got {response.status}")
                            all_passed = False
                            
            except Exception as e:
                self.log_test(f"Auth Required - {method} {endpoint}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    async def run_all_tests(self):
        """Run all NEW Patient Management System tests"""
        print("🚀 Starting NEW Patient Management System Backend Tests")
        print("=" * 70)
        
        # Test sequence - Focus on NEW Patient Management System
        tests = [
            ("Health Check", self.test_health_check),
            ("Doctor Authentication", self.test_doctor_registration_and_login),
            
            # NEW Patient Management System Tests
            ("Search Patients Empty", self.test_search_patients_empty),
            ("Create New Patient", self.test_create_new_patient),
            ("Search Patients by Name", self.test_search_patients_by_name),
            ("Search Patients by MRN", self.test_search_patients_by_mrn),
            ("Get Patient Details", self.test_get_patient_details),
            ("Add Visit to Existing Patient", self.test_add_visit_to_existing_patient),
            ("Search Visit by Code", self.test_search_visit_by_code),
            ("Search Visit Invalid Code", self.test_search_visit_invalid_code),
            ("Patient Details Invalid MRN", self.test_patient_details_invalid_mrn),
            ("New Patient Auth Required", self.test_new_patient_endpoints_authentication),
            
            # Legacy System Tests (for backward compatibility)
            ("Legacy Patient Save", self.test_patient_save),
            ("Legacy Patient Search", self.test_patient_search),
            ("Legacy Patient Search Invalid Code", self.test_patient_search_invalid_code),
            ("Legacy Get My Patients", self.test_get_my_patients),
            ("Legacy Patient Auth Required", self.test_patient_endpoints_authentication)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            try:
                result = await test_func()
                if result:
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        # Summary
        print("\n" + "=" * 60)
        print(f"🏁 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All NEW Patient Management System tests PASSED!")
        else:
            print(f"❌ {total - passed} tests FAILED")
            
        # Detailed results
        print("\n📊 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        return passed, total, self.test_results

async def main():
    """Main test execution"""
    async with NewPatientManagementTester() as tester:
        passed, total, results = await tester.run_all_tests()
        
        # Save results to file
        with open("/app/new_patient_management_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "passed": passed,
                    "total": total,
                    "success_rate": f"{(passed/total)*100:.1f}%",
                    "timestamp": datetime.now().isoformat()
                },
                "results": results
            }, f, indent=2)
        
        print(f"\n💾 Results saved to /app/new_patient_management_test_results.json")
        
        return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)