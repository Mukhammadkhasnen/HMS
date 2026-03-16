// ============================================================
// rx.js — Prescription autocomplete & smart suggestions
// Provides drug name completion, dosage templates, and
// common diagnosis suggestions for the prescription modal.
// ============================================================

// ── Drug database ─────────────────────────────────────────
// Format: { name, form, strengths[], class, dosage (common template) }
const DRUGS = [
  // Analgesics / Antipyretics
  { name:'Paracetamol',    form:'Tab',  strengths:['500mg','1g'],              cls:'Analgesic/Antipyretic',   dose:'1 tab TDS x 5 days (after meals)' },
  { name:'Ibuprofen',      form:'Tab',  strengths:['200mg','400mg','600mg'],   cls:'NSAID',                   dose:'1 tab TDS x 5 days (after meals)' },
  { name:'Diclofenac',     form:'Tab',  strengths:['50mg','75mg'],             cls:'NSAID',                   dose:'1 tab BD x 5 days (after meals)' },
  { name:'Aspirin',        form:'Tab',  strengths:['75mg','150mg','300mg'],    cls:'Antiplatelet/NSAID',      dose:'1 tab OD (after meals)' },
  { name:'Mefenamic Acid', form:'Tab',  strengths:['250mg','500mg'],           cls:'NSAID',                   dose:'1 tab TDS x 3 days (after meals)' },
  { name:'Tramadol',       form:'Tab',  strengths:['50mg','100mg'],            cls:'Opioid Analgesic',        dose:'1 tab BD x 3 days' },
  { name:'Ketorolac',      form:'Inj',  strengths:['30mg/ml'],                 cls:'NSAID Injection',         dose:'1 amp IM/IV SOS' },

  // Antibiotics
  { name:'Amoxicillin',         form:'Cap',  strengths:['250mg','500mg'],          cls:'Penicillin',              dose:'1 cap TDS x 7 days' },
  { name:'Amoxicillin-Clavulanate', form:'Tab', strengths:['625mg','1g'],         cls:'Penicillin + BLI',        dose:'1 tab BD x 7 days (after meals)' },
  { name:'Azithromycin',        form:'Tab',  strengths:['250mg','500mg'],          cls:'Macrolide',               dose:'1 tab OD x 3-5 days' },
  { name:'Clarithromycin',      form:'Tab',  strengths:['250mg','500mg'],          cls:'Macrolide',               dose:'1 tab BD x 7 days' },
  { name:'Ciprofloxacin',       form:'Tab',  strengths:['250mg','500mg','750mg'],  cls:'Fluoroquinolone',         dose:'1 tab BD x 5-7 days' },
  { name:'Levofloxacin',        form:'Tab',  strengths:['250mg','500mg','750mg'],  cls:'Fluoroquinolone',         dose:'1 tab OD x 5-7 days' },
  { name:'Doxycycline',         form:'Cap',  strengths:['100mg'],                  cls:'Tetracycline',            dose:'1 cap BD x 7 days (after meals)' },
  { name:'Metronidazole',       form:'Tab',  strengths:['200mg','400mg','500mg'],  cls:'Nitroimidazole',          dose:'1 tab TDS x 5-7 days' },
  { name:'Cephalexin',          form:'Cap',  strengths:['250mg','500mg'],          cls:'Cephalosporin 1st gen',   dose:'1 cap QID x 7 days' },
  { name:'Cefuroxime',          form:'Tab',  strengths:['250mg','500mg'],          cls:'Cephalosporin 2nd gen',   dose:'1 tab BD x 7 days (after meals)' },
  { name:'Ceftriaxone',         form:'Inj',  strengths:['500mg','1g'],             cls:'Cephalosporin 3rd gen',   dose:'1g IV/IM OD x 5 days' },
  { name:'Meropenem',           form:'Inj',  strengths:['500mg','1g'],             cls:'Carbapenem',              dose:'1g IV TDS' },
  { name:'Trimethoprim-Sulfamethoxazole', form:'Tab', strengths:['480mg','960mg'], cls:'Sulfonamide',             dose:'1 tab BD x 5-7 days' },
  { name:'Clindamycin',         form:'Cap',  strengths:['150mg','300mg'],          cls:'Lincosamide',             dose:'1 cap TDS x 7 days' },
  { name:'Nitrofurantoin',      form:'Cap',  strengths:['50mg','100mg'],           cls:'UTI Antibiotic',          dose:'1 cap QID x 7 days (after meals)' },
  { name:'Flucloxacillin',      form:'Cap',  strengths:['250mg','500mg'],          cls:'Antistaphylococcal',      dose:'1 cap QID x 7 days (empty stomach)' },

  // Antifungals
  { name:'Fluconazole',    form:'Cap',  strengths:['50mg','150mg','200mg'],    cls:'Antifungal',              dose:'1 cap OD x 7-14 days' },
  { name:'Clotrimazole',   form:'Cream',strengths:['1%'],                      cls:'Topical Antifungal',      dose:'Apply BD x 2-4 weeks' },
  { name:'Terbinafine',    form:'Tab',  strengths:['250mg'],                   cls:'Antifungal',              dose:'1 tab OD x 2-6 weeks' },
  { name:'Nystatin',       form:'Susp', strengths:['100000 IU/ml'],            cls:'Antifungal',              dose:'1 tsp swish & swallow QID x 7 days' },

  // Antivirals
  { name:'Acyclovir',      form:'Tab',  strengths:['200mg','400mg','800mg'],   cls:'Antiviral',               dose:'800mg 5x/day x 7 days' },
  { name:'Oseltamivir',    form:'Cap',  strengths:['75mg'],                    cls:'Antiviral (Influenza)',    dose:'1 cap BD x 5 days' },

  // Antiparasitics
  { name:'Albendazole',    form:'Tab',  strengths:['200mg','400mg'],           cls:'Anthelmintic',            dose:'400mg stat (or BD x 3 days)' },
  { name:'Metronidazole',  form:'Susp', strengths:['200mg/5ml'],               cls:'Antiprotozoal Syrup',     dose:'5ml TDS x 5-7 days' },
  { name:'Mebendazole',    form:'Tab',  strengths:['100mg'],                   cls:'Anthelmintic',            dose:'1 tab BD x 3 days' },
  { name:'Chloroquine',    form:'Tab',  strengths:['150mg','250mg'],           cls:'Antimalarial',            dose:'As per malaria protocol' },
  { name:'Artemether-Lumefantrine', form:'Tab', strengths:['20/120mg'],        cls:'Antimalarial',            dose:'4 tabs stat then 4 tabs at 8,24,36,48,60 hrs' },

  // GI drugs
  { name:'Omeprazole',     form:'Cap',  strengths:['20mg','40mg'],             cls:'PPI',                     dose:'1 cap OD before breakfast x 4-8 weeks' },
  { name:'Pantoprazole',   form:'Tab',  strengths:['20mg','40mg'],             cls:'PPI',                     dose:'1 tab OD before breakfast' },
  { name:'Esomeprazole',   form:'Tab',  strengths:['20mg','40mg'],             cls:'PPI',                     dose:'1 tab OD before breakfast' },
  { name:'Ranitidine',     form:'Tab',  strengths:['150mg','300mg'],           cls:'H2 Blocker',              dose:'1 tab BD x 2-4 weeks' },
  { name:'Domperidone',    form:'Tab',  strengths:['10mg'],                    cls:'Prokinetic/Antiemetic',   dose:'1 tab TDS AC x 3-5 days' },
  { name:'Metoclopramide', form:'Tab',  strengths:['10mg'],                    cls:'Antiemetic/Prokinetic',   dose:'1 tab TDS AC' },
  { name:'Ondansetron',    form:'Tab',  strengths:['4mg','8mg'],               cls:'Antiemetic (5-HT3)',      dose:'1 tab BD-TDS x 3 days' },
  { name:'Loperamide',     form:'Cap',  strengths:['2mg'],                     cls:'Antidiarrhoeal',          dose:'2 caps stat then 1 after each loose stool (max 8/day)' },
  { name:'Bisacodyl',      form:'Tab',  strengths:['5mg'],                     cls:'Laxative',                dose:'2 tabs OD at night' },
  { name:'Lactulose',      form:'Syrup',strengths:['3.35g/5ml'],               cls:'Osmotic Laxative',        dose:'15ml BD (adjust to response)' },
  { name:'Hyoscine',       form:'Tab',  strengths:['10mg'],                    cls:'Antispasmodic',           dose:'1 tab TDS x 3-5 days' },
  { name:'Simethicone',    form:'Tab',  strengths:['40mg','80mg'],             cls:'Antiflatulent',           dose:'1 tab TDS AC' },
  { name:'Antacid',        form:'Susp', strengths:['per 5ml'],                 cls:'Antacid',                 dose:'2 tsp TDS PC and at bedtime' },
  { name:'Sucralfate',     form:'Tab',  strengths:['1g'],                      cls:'GI Protectant',           dose:'1 tab QID (1 hr before meals & bedtime)' },

  // Respiratory
  { name:'Salbutamol',     form:'Inhaler', strengths:['100mcg/dose'],          cls:'SABA Bronchodilator',     dose:'2 puffs QID (or PRN)' },
  { name:'Salbutamol',     form:'Syrup',   strengths:['2mg/5ml'],              cls:'SABA Bronchodilator',     dose:'5ml TDS x 5 days' },
  { name:'Budesonide',     form:'Inhaler', strengths:['200mcg/dose'],          cls:'ICS',                     dose:'1-2 puffs BD (rinse mouth after)' },
  { name:'Ipratropium',    form:'Inhaler', strengths:['20mcg/dose'],           cls:'Anticholinergic Bronchodilator', dose:'2 puffs TDS-QID' },
  { name:'Montelukast',    form:'Tab',  strengths:['4mg','5mg','10mg'],        cls:'Leukotriene Antagonist',  dose:'1 tab OD at bedtime' },
  { name:'Theophylline',   form:'Tab',  strengths:['100mg','200mg'],           cls:'Xanthine Bronchodilator', dose:'1 tab BD' },
  { name:'Prednisolone',   form:'Tab',  strengths:['5mg','10mg','25mg'],       cls:'Corticosteroid',          dose:'As per taper protocol' },
  { name:'Ambroxol',       form:'Syrup',strengths:['30mg/5ml'],                cls:'Mucolytic',               dose:'2 tsp TDS x 5 days' },
  { name:'Guaifenesin',    form:'Syrup',strengths:['100mg/5ml'],               cls:'Expectorant',             dose:'2 tsp TDS' },
  { name:'Dextromethorphan',form:'Syrup',strengths:['10mg/5ml'],               cls:'Antitussive',             dose:'2 tsp TDS (dry cough only)' },
  { name:'Cetirizine',     form:'Tab',  strengths:['10mg'],                    cls:'Antihistamine',           dose:'1 tab OD at night' },
  { name:'Loratadine',     form:'Tab',  strengths:['10mg'],                    cls:'Antihistamine',           dose:'1 tab OD' },
  { name:'Fexofenadine',   form:'Tab',  strengths:['120mg','180mg'],           cls:'Antihistamine',           dose:'1 tab OD' },
  { name:'Levocetirizine', form:'Tab',  strengths:['5mg'],                     cls:'Antihistamine',           dose:'1 tab OD at night' },
  { name:'Chlorpheniramine',form:'Tab', strengths:['4mg'],                     cls:'Antihistamine (1st gen)', dose:'1 tab TDS' },

  // Cardiovascular
  { name:'Amlodipine',     form:'Tab',  strengths:['5mg','10mg'],              cls:'CCB',                     dose:'1 tab OD' },
  { name:'Atenolol',       form:'Tab',  strengths:['25mg','50mg','100mg'],     cls:'Beta Blocker',            dose:'1 tab OD' },
  { name:'Metoprolol',     form:'Tab',  strengths:['25mg','50mg','100mg'],     cls:'Beta Blocker',            dose:'1 tab BD' },
  { name:'Enalapril',      form:'Tab',  strengths:['5mg','10mg'],              cls:'ACE Inhibitor',           dose:'1 tab OD' },
  { name:'Lisinopril',     form:'Tab',  strengths:['5mg','10mg','20mg'],       cls:'ACE Inhibitor',           dose:'1 tab OD' },
  { name:'Losartan',       form:'Tab',  strengths:['25mg','50mg','100mg'],     cls:'ARB',                     dose:'1 tab OD' },
  { name:'Valsartan',      form:'Tab',  strengths:['80mg','160mg'],            cls:'ARB',                     dose:'1 tab OD' },
  { name:'Hydrochlorothiazide',form:'Tab',strengths:['12.5mg','25mg'],         cls:'Thiazide Diuretic',       dose:'1 tab OD (morning)' },
  { name:'Furosemide',     form:'Tab',  strengths:['20mg','40mg'],             cls:'Loop Diuretic',           dose:'1 tab OD (morning)' },
  { name:'Spironolactone', form:'Tab',  strengths:['25mg','50mg'],             cls:'Potassium-Sparing Diuretic',dose:'1 tab OD' },
  { name:'Nitroglycerin',  form:'Tab',  strengths:['0.5mg'],                   cls:'Nitrate (Sublingual)',    dose:'1 tab sublingual SOS (chest pain)' },
  { name:'Isosorbide Mononitrate',form:'Tab',strengths:['20mg','30mg','60mg'], cls:'Nitrate',                 dose:'1 tab OD (SR) or BD (IR)' },
  { name:'Digoxin',        form:'Tab',  strengths:['0.25mg'],                  cls:'Cardiac Glycoside',       dose:'1 tab OD (monitor levels)' },
  { name:'Warfarin',       form:'Tab',  strengths:['1mg','2mg','5mg'],         cls:'Anticoagulant',           dose:'As per INR — monitor closely' },
  { name:'Clopidogrel',    form:'Tab',  strengths:['75mg'],                    cls:'Antiplatelet',            dose:'1 tab OD' },
  { name:'Atorvastatin',   form:'Tab',  strengths:['10mg','20mg','40mg','80mg'],cls:'Statin',                  dose:'1 tab OD at night' },
  { name:'Rosuvastatin',   form:'Tab',  strengths:['5mg','10mg','20mg'],       cls:'Statin',                  dose:'1 tab OD at night' },

  // Diabetes
  { name:'Metformin',      form:'Tab',  strengths:['500mg','850mg','1000mg'],  cls:'Biguanide (Antidiabetic)',dose:'1 tab BD-TDS (after meals)' },
  { name:'Glibenclamide',  form:'Tab',  strengths:['2.5mg','5mg'],             cls:'Sulphonylurea',           dose:'1 tab OD before breakfast' },
  { name:'Glimepiride',    form:'Tab',  strengths:['1mg','2mg','4mg'],         cls:'Sulphonylurea',           dose:'1 tab OD before breakfast' },
  { name:'Sitagliptin',    form:'Tab',  strengths:['50mg','100mg'],            cls:'DPP-4 Inhibitor',         dose:'1 tab OD' },
  { name:'Empagliflozin',  form:'Tab',  strengths:['10mg','25mg'],             cls:'SGLT-2 Inhibitor',        dose:'1 tab OD' },
  { name:'Insulin Regular',form:'Inj',  strengths:['100 IU/ml'],               cls:'Short-Acting Insulin',    dose:'As per sliding scale — check BSL' },
  { name:'Insulin NPH',    form:'Inj',  strengths:['100 IU/ml'],               cls:'Intermediate Insulin',    dose:'As per dose — at bedtime' },
  { name:'Insulin Glargine',form:'Inj', strengths:['100 IU/ml'],               cls:'Long-Acting Insulin',     dose:'OD at fixed time — as per dose' },

  // Neurological / Psychiatric
  { name:'Diazepam',       form:'Tab',  strengths:['2mg','5mg','10mg'],        cls:'Benzodiazepine',          dose:'1 tab BD-TDS (short-term use only)' },
  { name:'Alprazolam',     form:'Tab',  strengths:['0.25mg','0.5mg','1mg'],    cls:'Benzodiazepine',          dose:'0.5mg BD-TDS' },
  { name:'Lorazepam',      form:'Tab',  strengths:['0.5mg','1mg','2mg'],       cls:'Benzodiazepine',          dose:'1mg BD' },
  { name:'Carbamazepine',  form:'Tab',  strengths:['100mg','200mg','400mg'],   cls:'Anticonvulsant',          dose:'200mg BD (increase gradually)' },
  { name:'Valproate',      form:'Tab',  strengths:['200mg','500mg'],           cls:'Anticonvulsant/Mood Stabilizer',dose:'500mg BD' },
  { name:'Phenytoin',      form:'Cap',  strengths:['100mg'],                   cls:'Anticonvulsant',          dose:'1 cap TDS (monitor levels)' },
  { name:'Levetiracetam',  form:'Tab',  strengths:['250mg','500mg','1000mg'],  cls:'Anticonvulsant',          dose:'500mg BD' },
  { name:'Amitriptyline',  form:'Tab',  strengths:['10mg','25mg','50mg'],      cls:'TCA Antidepressant',      dose:'25mg OD at night' },
  { name:'Fluoxetine',     form:'Cap',  strengths:['20mg'],                    cls:'SSRI',                    dose:'1 cap OD (morning)' },
  { name:'Sertraline',     form:'Tab',  strengths:['50mg','100mg'],            cls:'SSRI',                    dose:'50mg OD' },
  { name:'Haloperidol',    form:'Tab',  strengths:['0.5mg','1.5mg','5mg'],     cls:'Antipsychotic',           dose:'As per psychiatry advice' },
  { name:'Risperidone',    form:'Tab',  strengths:['0.5mg','1mg','2mg'],       cls:'Atypical Antipsychotic',  dose:'As per psychiatry advice' },
  { name:'Sumatriptan',    form:'Tab',  strengths:['50mg','100mg'],            cls:'Triptan (Migraine)',       dose:'50-100mg stat at onset — may repeat after 2 hrs' },

  // Vitamins / Supplements
  { name:'Vitamin C',      form:'Tab',  strengths:['500mg','1g'],              cls:'Vitamin',                 dose:'1 tab OD' },
  { name:'Vitamin D3',     form:'Cap',  strengths:['1000IU','5000IU','50000IU'],cls:'Vitamin',                dose:'1 cap OD (with food)' },
  { name:'Vitamin B Complex',form:'Tab',strengths:[''],                         cls:'Vitamin',                 dose:'1 tab OD' },
  { name:'Folic Acid',     form:'Tab',  strengths:['0.4mg','1mg','5mg'],       cls:'Vitamin',                 dose:'1 tab OD' },
  { name:'Ferrous Sulphate',form:'Tab', strengths:['200mg','325mg'],           cls:'Iron Supplement',         dose:'1 tab BD (before meals)' },
  { name:'Calcium Carbonate',form:'Tab',strengths:['500mg','1250mg'],          cls:'Calcium',                 dose:'1 tab BD (with meals)' },
  { name:'Zinc',           form:'Tab',  strengths:['20mg'],                    cls:'Mineral',                 dose:'1 tab OD x 2-4 weeks' },
  { name:'Omega-3',        form:'Cap',  strengths:['1g'],                      cls:'Supplement',              dose:'1-2 caps OD with food' },

  // Thyroid
  { name:'Levothyroxine',  form:'Tab',  strengths:['25mcg','50mcg','100mcg'],  cls:'Thyroid Hormone',         dose:'1 tab OD (empty stomach, 30 min before food)' },
  { name:'Carbimazole',    form:'Tab',  strengths:['5mg','10mg'],              cls:'Antithyroid',             dose:'As per thyroid status' },

  // Topical / Dermatology
  { name:'Hydrocortisone', form:'Cream',strengths:['1%'],                      cls:'Topical Corticosteroid',  dose:'Apply thin layer BD x 1-2 weeks' },
  { name:'Betamethasone',  form:'Cream',strengths:['0.1%'],                    cls:'Topical Corticosteroid',  dose:'Apply thin layer BD' },
  { name:'Mupirocin',      form:'Oint', strengths:['2%'],                      cls:'Topical Antibiotic',      dose:'Apply TDS x 5-10 days' },
  { name:'Permethrin',     form:'Cream',strengths:['5%'],                      cls:'Topical Antiparasitic',   dose:'Apply overnight, wash off in morning — 1 application' },

  // ORS / IV fluids
  { name:'ORS',            form:'Sachet',strengths:['per sachet'],             cls:'Oral Rehydration',        dose:'1 sachet in 200ml water after each loose stool' },
  { name:'Normal Saline',  form:'IV',   strengths:['0.9%'],                    cls:'IV Fluid',                dose:'500ml-1L IV at ... drops/min' },
  { name:'Dextrose',       form:'IV',   strengths:['5%','50%'],                cls:'IV Fluid',                dose:'500ml IV at ... drops/min' },
  { name:'Ringer Lactate', form:'IV',   strengths:[''],                        cls:'IV Fluid',                dose:'500ml-1L IV at ... drops/min' },
];

// ── Diagnosis suggestions ─────────────────────────────────
const DIAGNOSES = [
  'Viral Upper Respiratory Tract Infection (URTI)',
  'Bacterial Pharyngitis / Tonsillitis',
  'Acute Otitis Media',
  'Allergic Rhinitis',
  'Community-Acquired Pneumonia (CAP)',
  'Bronchitis (Acute)',
  'Bronchial Asthma (Acute Exacerbation)',
  'COPD Exacerbation',
  'Pulmonary Tuberculosis (PTB)',
  'Urinary Tract Infection (UTI)',
  'Acute Gastroenteritis',
  'Peptic Ulcer Disease (PUD)',
  'Gastroesophageal Reflux Disease (GERD)',
  'Irritable Bowel Syndrome (IBS)',
  'Typhoid Fever',
  'Dengue Fever',
  'Malaria (Plasmodium Falciparum)',
  'Malaria (Plasmodium Vivax)',
  'Hepatitis A (Acute)',
  'Hepatitis B (Chronic)',
  'Hepatitis C (Chronic)',
  'Hypertension (Essential)',
  'Type 2 Diabetes Mellitus',
  'Hyperlipidaemia',
  'Ischaemic Heart Disease (IHD)',
  'Congestive Heart Failure (CHF)',
  'Acute Myocardial Infarction (AMI)',
  'Atrial Fibrillation',
  'Deep Vein Thrombosis (DVT)',
  'Anaemia (Iron Deficiency)',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Migraine',
  'Tension Headache',
  'Epilepsy (Well-Controlled)',
  'Anxiety Disorder',
  'Depression',
  'Scabies',
  'Tinea (Ringworm)',
  'Cellulitis',
  'Abscess (Superficial)',
  'Wound Infection',
  'Fracture (Closed)',
  'Sprain / Strain',
  'Low Back Pain (Mechanical)',
  'Arthritis (Osteoarthritis)',
  'Rheumatoid Arthritis',
  'Gout (Acute Attack)',
  'Vitamin D Deficiency',
  'Protein-Energy Malnutrition',
];

// ── Autocomplete state ────────────────────────────────────
let _acSelectedIdx = -1;
let _acCurrentWord = '';
let _acMatches = [];

// ── Drug search ───────────────────────────────────────────
function searchDrugs(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return DRUGS
    .filter(d => d.name.toLowerCase().startsWith(q))
    .concat(DRUGS.filter(d => !d.name.toLowerCase().startsWith(q) && d.name.toLowerCase().includes(q)))
    .slice(0, 8);
}

function searchDiagnoses(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return DIAGNOSES
    .filter(d => d.toLowerCase().includes(q))
    .slice(0, 6);
}

// ── Get the word currently being typed in the textarea ────
function getCurrentWord(ta) {
  const text   = ta.value;
  const cursor = ta.selectionStart;
  // Walk back to start of current word
  let start = cursor;
  while (start > 0 && text[start - 1] !== '\n') start--;
  return text.slice(start, cursor).trim();
}

// ── Prescription textarea input handler ──────────────────
export function rxMedAC(textarea) {
  const word = getCurrentWord(textarea);
  _acCurrentWord = word;
  _acSelectedIdx = -1;

  const list = document.getElementById('rx-ac-list');
  if (!list) return;

  const matches = searchDrugs(word);
  _acMatches = matches;

  if (!matches.length) { list.style.display = 'none'; return; }

  list.innerHTML = matches.map((d, i) => {
    const template = `${d.form}. ${d.name} ${d.strengths[0] || ''} — ${d.dose}`;
    return `<div class="rx-ac-item" data-idx="${i}" data-template="${encodeURIComponent(template)}"
               onmousedown="event.preventDefault()" onclick="rxPickMed(${i})">
              <span class="drug-name">${d.form}. ${d.name} <span style="font-weight:400;color:var(--muted);">${d.strengths.join(' / ')}</span></span>
              <span class="drug-class">${d.cls}</span>
            </div>`;
  }).join('');
  list.style.display = 'block';
}

// ── Diagnosis input handler ───────────────────────────────
export function rxDiagAC(input) {
  const q    = input.value.trim();
  const list = document.getElementById('rx-diag-ac');
  if (!list) return;

  const matches = searchDiagnoses(q);
  if (!matches.length) { list.style.display = 'none'; return; }

  list.innerHTML = matches.map(d =>
    `<div class="rx-ac-item" onmousedown="event.preventDefault()" onclick="rxPickDiag('${encodeURIComponent(d)}')">
       <span class="drug-name">${d}</span>
     </div>`
  ).join('');
  list.style.display = 'block';
}

// ── Pick a diagnosis from the list ───────────────────────
export function rxPickDiag(encoded) {
  const diag  = decodeURIComponent(encoded);
  const input = document.getElementById('rx-diag');
  if (input) input.value = diag;
  const list = document.getElementById('rx-diag-ac');
  if (list) list.style.display = 'none';
}

// ── Pick a drug from the list ─────────────────────────────
export function rxPickMed(idx) {
  const drug = _acMatches[idx];
  if (!drug) return;
  const ta = document.getElementById('rx-txt');
  if (!ta) return;

  // Build the line to insert
  const line = `${drug.form}. ${drug.name} ${drug.strengths[0] || ''} — ${drug.dose}\n`;

  // Replace the current incomplete word on the current line
  const text   = ta.value;
  const cursor = ta.selectionStart;
  let lineStart = cursor;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

  const before = text.slice(0, lineStart);
  const after  = text.slice(cursor);
  ta.value = before + line + after;
  ta.selectionStart = ta.selectionEnd = (before + line).length;
  ta.focus();

  const list = document.getElementById('rx-ac-list');
  if (list) list.style.display = 'none';
  _acCurrentWord = '';
  _acMatches = [];
}

// ── Keyboard navigation for autocomplete ─────────────────
export function rxMedKey(event) {
  const list = document.getElementById('rx-ac-list');
  if (!list || list.style.display === 'none') return;

  const items = list.querySelectorAll('.rx-ac-item');

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    _acSelectedIdx = Math.min(_acSelectedIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('selected', i === _acSelectedIdx));
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    _acSelectedIdx = Math.max(_acSelectedIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('selected', i === _acSelectedIdx));
  } else if (event.key === 'Tab' || event.key === 'Enter') {
    if (_acSelectedIdx >= 0 && _acMatches[_acSelectedIdx]) {
      event.preventDefault();
      rxPickMed(_acSelectedIdx);
    } else if (_acMatches.length > 0) {
      event.preventDefault();
      rxPickMed(0); // auto-pick first match on Tab
    }
  } else if (event.key === 'Escape') {
    list.style.display = 'none';
    _acSelectedIdx = -1;
  }
}

// ── Close lists when clicking outside ────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('#mo-rx')) {
    const l1 = document.getElementById('rx-ac-list');
    const l2 = document.getElementById('rx-diag-ac');
    if (l1) l1.style.display = 'none';
    if (l2) l2.style.display = 'none';
  }
});
