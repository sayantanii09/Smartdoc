import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import time

logger = logging.getLogger(__name__)

class MedicalDatabaseIntegrator:
    """
    Comprehensive Medical Database Integration System
    Integrates with multiple authoritative medical databases for complete drug information
    """
    
    def __init__(self):
        self.session = None
        self.base_apis = {
            'fda': 'https://api.fda.gov/drug',
            'dailymed': 'https://dailymed.nlm.nih.gov/dailymed/services/v2',
            'rxnorm': 'https://rxnav.nlm.nih.gov/REST',
            'drugbank': 'https://go.drugbank.com/api/v1',  # Requires API key
            'openfda': 'https://api.fda.gov/drug/label.json'
        }
        self.drug_database = {}
        self.interaction_matrix = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_fda_drugs(self, limit: int = 1000) -> List[Dict]:
        """Fetch drugs from FDA Orange Book API"""
        try:
            url = f"{self.base_apis['fda']}/label.json"
            params = {
                'search': 'effective_time:[20200101 TO 20241201]',
                'limit': limit
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('results', [])
                else:
                    logger.error(f"FDA API error: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching FDA drugs: {e}")
            return []

    async def fetch_rxnorm_interactions(self, rxcui: str) -> List[Dict]:
        """Fetch drug interactions from RxNorm API"""
        try:
            url = f"{self.base_apis['rxnorm']}/interaction/interaction.json"
            params = {'rxcui': rxcui}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    interactions = data.get('interactionTypeGroup', [])
                    return self.parse_rxnorm_interactions(interactions)
                return []
        except Exception as e:
            logger.error(f"Error fetching RxNorm interactions: {e}")
            return []

    async def fetch_dailymed_data(self, set_id: str) -> Dict:
        """Fetch detailed drug information from DailyMed"""
        try:
            url = f"{self.base_apis['dailymed']}/spls/{set_id}.json"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                return {}
        except Exception as e:
            logger.error(f"Error fetching DailyMed data: {e}")
            return {}

    def parse_fda_drug_data(self, fda_data: Dict) -> Dict:
        """Parse FDA drug data into standardized format"""
        try:
            # Extract generic name
            generic_name = None
            if 'openfda' in fda_data and 'generic_name' in fda_data['openfda']:
                generic_name = fda_data['openfda']['generic_name'][0].lower()
            elif 'substance_name' in fda_data:
                generic_name = fda_data['substance_name'][0].lower()
            
            if not generic_name:
                return {}

            # Extract drug class
            drug_class = "Unknown"
            if 'openfda' in fda_data and 'pharm_class_epc' in fda_data['openfda']:
                drug_class = fda_data['openfda']['pharm_class_epc'][0]
            elif 'openfda' in fda_data and 'pharm_class_moa' in fda_data['openfda']:
                drug_class = fda_data['openfda']['pharm_class_moa'][0]

            # Extract warnings and precautions
            warnings = []
            if 'warnings_and_cautions' in fda_data:
                warnings.extend(fda_data['warnings_and_cautions'])
            if 'boxed_warning' in fda_data:
                warnings.extend(fda_data['boxed_warning'])

            # Extract contraindications
            contraindications = []
            if 'contraindications' in fda_data:
                contraindications.extend(fda_data['contraindications'])

            # Extract adverse reactions
            side_effects = []
            if 'adverse_reactions' in fda_data:
                side_effects.extend(fda_data['adverse_reactions'])

            return {
                'name': generic_name,
                'class': drug_class,
                'warnings': ' '.join(warnings)[:500] if warnings else '',
                'contraindications': contraindications[:10] if contraindications else [],
                'side_effects': side_effects[:15] if side_effects else [],
                'interactions': [],  # Will be populated separately
                'food_interactions': [],  # Will be populated separately
                'source': 'FDA',
                'last_updated': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error parsing FDA drug data: {e}")
            return {}

    def parse_rxnorm_interactions(self, interactions: List[Dict]) -> List[str]:
        """Parse RxNorm interaction data"""
        interaction_drugs = []
        try:
            for interaction_group in interactions:
                if 'interactionPair' in interaction_group:
                    for pair in interaction_group['interactionPair']:
                        if 'interactionConcept' in pair:
                            for concept in pair['interactionConcept']:
                                if 'minConceptItem' in concept:
                                    drug_name = concept['minConceptItem']['name'].lower()
                                    if drug_name not in interaction_drugs:
                                        interaction_drugs.append(drug_name)
        except Exception as e:
            logger.error(f"Error parsing RxNorm interactions: {e}")
        
        return interaction_drugs[:20]  # Limit to top 20 interactions

    async def get_comprehensive_drug_list(self) -> List[str]:
        """Get comprehensive list of common drugs to process"""
        # Top 500+ most prescribed drugs in various categories
        common_drugs = [
            # Cardiovascular
            'lisinopril', 'amlodipine', 'metoprolol', 'losartan', 'atorvastatin', 
            'simvastatin', 'carvedilol', 'valsartan', 'furosemide', 'hydrochlorothiazide',
            'warfarin', 'clopidogrel', 'aspirin', 'propranolol', 'diltiazem',
            'verapamil', 'digoxin', 'spironolactone', 'isosorbide', 'nitroglycerin',
            
            # Diabetes
            'metformin', 'insulin', 'glipizide', 'glyburide', 'pioglitazone',
            'sitagliptin', 'liraglutide', 'empagliflozin', 'dapagliflozin', 'canagliflozin',
            
            # Antibiotics
            'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'cephalexin',
            'clindamycin', 'clarithromycin', 'levofloxacin', 'trimethoprim', 'erythromycin',
            'penicillin', 'ampicillin', 'tetracycline', 'vancomycin', 'gentamicin',
            
            # Pain/Inflammation
            'ibuprofen', 'naproxen', 'acetaminophen', 'morphine', 'oxycodone',
            'hydrocodone', 'tramadol', 'codeine', 'diclofenac', 'celecoxib',
            'meloxicam', 'indomethacin', 'ketorolac', 'prednisone', 'prednisolone',
            
            # Mental Health
            'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
            'venlafaxine', 'duloxetine', 'bupropion', 'trazodone', 'mirtazapine',
            'lithium', 'valproic acid', 'lamotrigine', 'quetiapine', 'risperidone',
            'olanzapine', 'aripiprazole', 'haloperidol', 'clozapine', 'ziprasidone',
            
            # Neurological
            'phenytoin', 'carbamazepine', 'valproate', 'levetiracetam', 'gabapentin',
            'pregabalin', 'topiramate', 'oxcarbazepine', 'lacosamide', 'zonisamide',
            'levodopa', 'carbidopa', 'pramipexole', 'ropinirole', 'selegiline',
            
            # Respiratory
            'albuterol', 'ipratropium', 'budesonide', 'fluticasone', 'montelukast',
            'theophylline', 'salbutamol', 'formoterol', 'tiotropium', 'salmeterol',
            'prednisone', 'prednisolone', 'dexamethasone', 'beclomethasone',
            
            # Gastrointestinal
            'omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole', 'ranitidine',
            'famotidine', 'metoclopramide', 'ondansetron', 'loperamide', 'bismuth',
            'sucralfate', 'misoprostol', 'lactulose', 'polyethylene', 'docusate',
            
            # Endocrine
            'levothyroxine', 'methimazole', 'propylthiouracil', 'hydrocortisone',
            'fludrocortisone', 'testosterone', 'estradiol', 'progesterone', 'calcitriol',
            
            # Antimicrobials
            'fluconazole', 'ketoconazole', 'itraconazole', 'voriconazole', 'amphotericin',
            'acyclovir', 'valacyclovir', 'oseltamivir', 'ribavirin', 'zidovudine',
            'efavirenz', 'tenofovir', 'emtricitabine', 'raltegravir', 'darunavir',
            
            # Oncology (common)
            'tamoxifen', 'anastrozole', 'letrozole', 'exemestane', 'fulvestrant',
            'cyclophosphamide', 'methotrexate', 'fluorouracil', 'cisplatin', 'carboplatin',
            'doxorubicin', 'paclitaxel', 'docetaxel', 'gemcitabine', 'irinotecan',
            
            # Allergy/Immunology
            'diphenhydramine', 'loratadine', 'cetirizine', 'fexofenadine', 'desloratadine',
            'montelukast', 'cromolyn', 'epinephrine', 'methylprednisolone',
            
            # Ophthalmology
            'timolol', 'latanoprost', 'brimonidine', 'dorzolamide', 'pilocarpine',
            'cyclopentolate', 'tropicamide', 'atropine', 'prednisolone', 'dexamethasone',
            
            # Dermatology
            'tretinoin', 'isotretinoin', 'hydrocortisone', 'triamcinolone', 'clobetasol',
            'tacrolimus', 'pimecrolimus', 'clotrimazole', 'terbinafine', 'ketoconazole'
        ]
        
        return list(set(common_drugs))  # Remove duplicates

    async def process_drug_batch(self, drug_names: List[str], batch_size: int = 10) -> Dict[str, Dict]:
        """Process drugs in batches to avoid rate limiting"""
        processed_drugs = {}
        
        for i in range(0, len(drug_names), batch_size):
            batch = drug_names[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}: {len(batch)} drugs")
            
            tasks = []
            for drug_name in batch:
                tasks.append(self.process_single_drug(drug_name))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for drug_name, result in zip(batch, batch_results):
                if isinstance(result, dict) and result:
                    processed_drugs[drug_name] = result
                elif isinstance(result, Exception):
                    logger.error(f"Error processing {drug_name}: {result}")
            
            # Rate limiting - wait between batches
            await asyncio.sleep(1)
        
        return processed_drugs

    async def process_single_drug(self, drug_name: str) -> Dict:
        """Process a single drug through all available APIs"""
        drug_data = {
            'name': drug_name.lower(),
            'class': 'Unknown',
            'interactions': [],
            'food_interactions': [],
            'warnings': '',
            'contraindications': [],
            'side_effects': [],
            'source': 'Multiple APIs',
            'last_updated': datetime.utcnow().isoformat()
        }
        
        try:
            # Try FDA API first
            fda_data = await self.fetch_fda_drug_data(drug_name)
            if fda_data:
                drug_data.update(fda_data)
            
            # Get RxNorm CUI for interactions
            rxcui = await self.get_rxnorm_cui(drug_name)
            if rxcui:
                interactions = await self.fetch_rxnorm_interactions(rxcui)
                drug_data['interactions'].extend(interactions)
            
            # Add known food interactions based on drug class
            drug_data['food_interactions'] = self.get_food_interactions_by_class(drug_data['class'])
            
            return drug_data
            
        except Exception as e:
            logger.error(f"Error processing drug {drug_name}: {e}")
            return {}

    async def fetch_fda_drug_data(self, drug_name: str) -> Dict:
        """Fetch specific drug data from FDA API"""
        try:
            url = f"{self.base_apis['fda']}/label.json"
            params = {
                'search': f'openfda.generic_name:"{drug_name}"',
                'limit': 1
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    results = data.get('results', [])
                    if results:
                        return self.parse_fda_drug_data(results[0])
                return {}
        except Exception as e:
            logger.error(f"Error fetching FDA data for {drug_name}: {e}")
            return {}

    async def get_rxnorm_cui(self, drug_name: str) -> Optional[str]:
        """Get RxNorm CUI for drug name"""
        try:
            url = f"{self.base_apis['rxnorm']}/rxcui.json"
            params = {'name': drug_name}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    cui_list = data.get('idGroup', {}).get('rxnormId', [])
                    return cui_list[0] if cui_list else None
                return None
        except Exception as e:
            logger.error(f"Error getting RxNorm CUI for {drug_name}: {e}")
            return None

    def get_food_interactions_by_class(self, drug_class: str) -> List[str]:
        """Get common food interactions based on drug class"""
        food_interactions_map = {
            'ACE Inhibitor': ['salt substitutes', 'potassium-rich foods'],
            'Anticoagulant': ['green leafy vegetables', 'cranberry juice', 'alcohol', 'grapefruit juice'],
            'HMG-CoA Reductase Inhibitor': ['grapefruit juice', 'alcohol'],
            'Calcium Channel Blocker': ['grapefruit juice'],
            'Loop Diuretic': ['alcohol', 'licorice'],
            'Thiazide Diuretic': ['alcohol', 'licorice'],
            'SSRI': ['alcohol'],
            'NSAID': ['alcohol'],
            'Thyroid Hormone': ['soy products', 'fiber', 'coffee', 'calcium-rich foods'],
            'Fluoroquinolone': ['dairy products', 'calcium supplements', 'iron supplements'],
            'Macrolide': ['grapefruit juice'],
            'Corticosteroid': ['alcohol', 'grapefruit juice'],
        }
        
        for class_key, interactions in food_interactions_map.items():
            if class_key.lower() in drug_class.lower():
                return interactions
        
        return []

    async def update_database(self, db_instance) -> Dict[str, int]:
        """Update the MongoDB database with comprehensive drug data"""
        try:
            # Get comprehensive drug list
            drug_names = await self.get_comprehensive_drug_list()
            logger.info(f"Processing {len(drug_names)} drugs...")
            
            # Process drugs in batches
            processed_drugs = await self.process_drug_batch(drug_names, batch_size=5)
            
            # Update database
            updated_count = 0
            for drug_name, drug_data in processed_drugs.items():
                if drug_data:
                    # Update or insert drug data
                    await db_instance.drug_database.update_one(
                        {'name': drug_name},
                        {'$set': drug_data},
                        upsert=True
                    )
                    updated_count += 1
            
            logger.info(f"Updated {updated_count} drugs in database")
            
            return {
                'total_processed': len(drug_names),
                'successfully_updated': updated_count,
                'failed': len(drug_names) - updated_count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error updating database: {e}")
            return {'error': str(e)}

# Integration function to be called from main application
async def integrate_comprehensive_medical_data():
    """Main function to integrate comprehensive medical data"""
    from database import MongoDB
    
    async with MedicalDatabaseIntegrator() as integrator:
        # Get database instance
        db = await MongoDB.get_database()
        
        # Update database with comprehensive data
        result = await integrator.update_database(db)
        
        logger.info(f"Medical database integration completed: {result}")
        return result