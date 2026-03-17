// ============================================================
// rx.js — Complete prescription autocomplete for Pakistan
// v3 — 400+ drugs with Pakistani brand names, favourites,
// custom drugs, spell correction, admin review requests
// ============================================================

// ============================================================
// rx.js — Complete prescription autocomplete for Pakistan
// Features:
//  • 400+ drugs with Pakistani brand names (generic + brand search)
//  • Type any part: "cillin", "inj", "drip", "syrup", "neb"
//  • Doctor's personal Favourites — saved across sessions
//  • Custom drugs — add any drug not in the database
//  • Spell correction — suggests fix for common misspellings
//  • New drug requests shown to admin for review
// ============================================================

// ── Spell correction dictionary ───────────────────────────
// Maps common misspellings → correct drug name
const SPELL_CORRECTIONS = {
  'amoxcilin':'Amoxicillin','amoxycillin':'Amoxicillin','amoxcillin':'Amoxicillin',
  'augmentin':'Augmentin','ogmentin':'Augmentin','augmentine':'Augmentin',
  'panadole':'Panadol','panado':'Panadol','panadool':'Panadol','paradol':'Panadol',
  'brufan':'Brufen','bruffen':'Brufen','brufen':'Brufen',
  'flagel':'Flagyl','flayl':'Flagyl','flagal':'Flagyl',
  'cefaxone':'Ceftriaxone','ceftrixone':'Ceftriaxone','ceftriaxon':'Ceftriaxone',
  'ventolan':'Ventolin','ventolyn':'Ventolin','ventoline':'Ventolin',
  'ciproflaxacin':'Ciprofloxacin','ciproflaxin':'Ciprofloxacin','ciprofloaxin':'Ciprofloxacin',
  'metronidazol':'Metronidazole','metronidazole':'Metronidazole',
  'omeprazol':'Omeprazole','omeprazole':'Omeprazole',
  'azithromicin':'Azithromycin','azithromysin':'Azithromycin','azithromicyn':'Azithromycin',
  'diclofenack':'Diclofenac','diclofinac':'Diclofenac','diclofenic':'Diclofenac',
  'cefspan':'Cefspan','cefspane':'Cefspan',
  'septran':'Septran','siptran':'Septran','sepran':'Septran',
  'tramadole':'Tramadol','tramadole':'Tramadol',
  'dexamethasone':'Dexamethasone','dexamethosone':'Dexamethasone',
  'hydrocortisone':'Hydrocortisone','hydrochortisone':'Hydrocortisone',
  'ranitidene':'Ranitidine','ranitadine':'Ranitidine','ranetidine':'Ranitidine',
  'domperidone':'Domperidone','dampridone':'Domperidone','dompridone':'Domperidone',
  'ondansetrone':'Ondansetron','ondansetron':'Ondansetron',
  'furosemide':'Furosemide','furosimide':'Furosemide','frusemide':'Furosemide',
  'metformine':'Metformin','metfornin':'Metformin','metformin':'Metformin',
  'insuline':'Insulin','insolin':'Insulin',
  'salbutamole':'Salbutamol','salbutamol':'Salbutamol',
  'prednisolone':'Prednisolone','prednisalone':'Prednisolone','prednesolone':'Prednisolone',
  'levothyroxine':'Levothyroxine','levothyroxin':'Levothyroxine','levothyrozine':'Levothyroxine',
  'atorvastatin':'Atorvastatin','atrovastatin':'Atorvastatin',
  'clopidogrel':'Clopidogrel','clopidegrel':'Clopidogrel',
  'amlodipine':'Amlodipine','amlodapine':'Amlodipine','amlodipin':'Amlodipine',
  'fluconazole':'Fluconazole','flucnazole':'Fluconazole','fluconazol':'Fluconazole',
  'meropenam':'Meropenem','meropenim':'Meropenem','meropenm':'Meropenem',
  'vancomicin':'Vancomycin','vancomycine':'Vancomycin','vancomysin':'Vancomycin',
  'ceftazidim':'Ceftazidime','ceftazidime':'Ceftazidime',
  'amikacine':'Amikacin','amikacin':'Amikacin','amikasin':'Amikacin',
  'gentamicine':'Gentamicin','gentamycin':'Gentamicin','gentomicin':'Gentamicin',
  'phenytoine':'Phenytoin','phenytoin':'Phenytoin','phenitoin':'Phenytoin',
  'carbamazepine':'Carbamazepine','carbamazapine':'Carbamazepine',
  'levetiracetam':'Levetiracetam','levetracetam':'Levetiracetam',
  'sertraline':'Sertraline','sertralin':'Sertraline','sertreline':'Sertraline',
  'fluoxetine':'Fluoxetine','fluoxitine':'Fluoxetine','fluoxetine':'Fluoxetine',
  'risperidone':'Risperidone','resperidone':'Risperidone','rispiridone':'Risperidone',
  'olanzapine':'Olanzapine','olanzapin':'Olanzapine',
  'warfarine':'Warfarin','warfarin':'Warfarin',
  'enoxaparine':'Enoxaparin','enoxaparin':'Enoxaparin','enoxiparin':'Enoxaparin',
  'heparine':'Heparin','heparin':'Heparin',
  'oxytocine':'Oxytocin','oxytocin':'Oxytocin',
  'magnesium sulphate':'Magnesium Sulphate','mgso4':'Magnesium Sulphate','mgso':'Magnesium Sulphate',
  'potassium chloride':'Potassium Chloride','kcl':'Potassium Chloride',
  'normal saline':'Normal Saline','ns':'Normal Saline',
  'ringers lactate':'Ringer Lactate','rl':'Ringer Lactate','hartmanns':'Ringer Lactate',
  'dextrose 5%':'Dextrose 5%','d5w':'Dextrose 5%','d5':'Dextrose 5%',
  'albendazol':'Albendazole','albendazole':'Albendazole',
  'mebendazol':'Mebendazole','mebendazole':'Mebendazole',
  'cotrimoxazol':'Trimethoprim+Sulfamethoxazole','septrim':'Trimethoprim+Sulfamethoxazole',
  'naloxon':'Naloxone','naloxone':'Naloxone',
  'adrenaline':'Adrenaline','epinefrine':'Adrenaline','epinephrine':'Adrenaline',
  'atropine':'Atropine','atropine':'Atropine','atropeen':'Atropine',
  'midazolam':'Midazolam','midazalom':'Midazolam',
  'ketamine':'Ketamine','ketamin':'Ketamine',
  'propofol':'Propofol','propofole':'Propofol',
  'lignocaine':'Lignocaine','lidocaine':'Lignocaine','lignocain':'Lignocaine',
  'sofosbuvir':'Sofosbuvir','sofusbuvir':'Sofosbuvir',
  'entecavir':'Entecavir','entacavir':'Entecavir',
  'rifampicin':'Rifampicin','rifampicine':'Rifampicin','rifampsin':'Rifampicin',
  'isoniazid':'Isoniazid','isoniazide':'Isoniazid','isonaizid':'Isoniazid',
  'pyrazinamide':'Pyrazinamide','pyrazinamid':'Pyrazinamide',
  'ethambutol':'Ethambutol','ethambutole':'Ethambutol',
  'methotrexate':'Methotrexate','methotraxate':'Methotrexate',
  'hydroxychloroquine':'Hydroxychloroquine','hydroxychloroquin':'Hydroxychloroquine',
};


// ── Additional drugs not in existing database ─────────────
const DRUGS = [
// ─────────────────────────────────────────────────────────
// ANALGESICS / ANTIPYRETICS
// ─────────────────────────────────────────────────────────
{g:'Paracetamol',b:['Panadol','Calpol','Napa','Febrol'],f:'Tab',s:'500mg',c:'Analgesic/Antipyretic',d:'1-2 tabs TDS-QID (max 8/day, after meals)'},
{g:'Paracetamol',b:['Calpol Syrup','Panadol Syrup','Febrol Syrup'],f:'Syrup',s:'120mg/5ml',c:'Analgesic Syrup',d:'5-10ml TDS (child: 15mg/kg/dose TDS)'},
{g:'Paracetamol',b:['Paracetamol Infusion','Perfalgan','Pamol IV'],f:'Inj',s:'1g/100ml',c:'Analgesic IV Infusion',d:'1g IV over 15 min TDS-QID (max 4g/day)'},
{g:'Ibuprofen',b:['Brufen','Neurofen','Profen'],f:'Tab',s:'400mg',c:'NSAID',d:'1 tab TDS after meals (max 5 days)'},
{g:'Ibuprofen',b:['Brufen Syrup','Calprofen'],f:'Syrup',s:'100mg/5ml',c:'NSAID Syrup',d:'5ml TDS after meals (child: 10mg/kg/dose)'},
{g:'Diclofenac',b:['Voltaren','Voren','Diclofen'],f:'Tab',s:'50mg',c:'NSAID',d:'1 tab TDS after meals (max 7 days)'},
{g:'Diclofenac',b:['Voltaren Inj','Voren Inj'],f:'Inj',s:'75mg/3ml',c:'NSAID Injection',d:'1 amp IM SOS (max 2 days IM)'},
{g:'Diclofenac',b:['Voltaren Suppository'],f:'Supp',s:'100mg',c:'NSAID Suppository',d:'1 supp PR BD (useful postop)'},
{g:'Mefenamic Acid',b:['Ponstan','Meftal','Mefacid'],f:'Cap',s:'500mg',c:'NSAID',d:'1 cap TDS AC (max 7 days)'},
{g:'Aspirin',b:['Disprin','Aspirin Bayer','Cardiprin'],f:'Tab',s:'75mg',c:'Antiplatelet',d:'1 tab OD after meals (cardiac)'},
{g:'Tramadol',b:['Tramal','Ultram','Tramol'],f:'Tab',s:'50mg',c:'Opioid Analgesic',d:'1 tab BD-TDS (max 400mg/day — short term)'},
{g:'Tramadol',b:['Tramal Inj','Tramol Inj'],f:'Inj',s:'100mg/2ml',c:'Opioid Analgesic Injection',d:'50-100mg IM/IV slow TDS-QID (dilute for IV)'},
{g:'Ketorolac',b:['Toradol','Ketolac','Aculac'],f:'Inj',s:'30mg/ml',c:'NSAID Injection (Strong)',d:'30mg IM/IV SOS (max 5 days total)'},
{g:'Morphine',b:['Morphine Sulphate','MST Continus'],f:'Inj',s:'10mg/ml',c:'Opioid Analgesic (Strong)',d:'2.5-10mg IV/SC/IM 4-6 hrly PRN (titrate to pain — monitor resp)'},
{g:'Pethidine',b:['Pethidine HCl','Demerol'],f:'Inj',s:'50mg/ml',c:'Opioid Analgesic',d:'50-100mg IM 3-4 hrly PRN'},
{g:'Celecoxib',b:['Celebrex','Celebra'],f:'Cap',s:'200mg',c:'COX-2 Inhibitor',d:'1 cap BD after meals'},
{g:'Pentazocine',b:['Fortwin','Talwin'],f:'Inj',s:'30mg/ml',c:'Opioid Agonist-Antagonist',d:'30mg IM/IV 3-4 hrly PRN'},

// ─────────────────────────────────────────────────────────
// ANTIBIOTICS — ORAL
// ─────────────────────────────────────────────────────────
{g:'Amoxicillin',b:['Amoxil','Ospamox','Trimox'],f:'Cap',s:'500mg',c:'Penicillin',d:'1 cap TDS x 5-7 days'},
{g:'Amoxicillin',b:['Amoxil Syrup','Ospamox Syrup'],f:'Syrup',s:'125mg/5ml',c:'Penicillin Syrup',d:'5-10ml TDS x 7 days (child: 25mg/kg/day ÷ TDS)'},
{g:'Amoxicillin+Clavulanate',b:['Augmentin','Co-Amoxiclav','Amoxiclav','Synermox','Curam'],f:'Tab',s:'625mg',c:'Penicillin+BLI',d:'1 tab BD x 7 days after meals'},
{g:'Amoxicillin+Clavulanate',b:['Augmentin Syrup','Amoxiclav Syrup'],f:'Syrup',s:'156mg/5ml',c:'Penicillin+BLI Syrup',d:'5-10ml TDS x 7 days after meals'},
{g:'Azithromycin',b:['Zithromax','Azithral','Azimax','Azicin'],f:'Tab',s:'500mg',c:'Macrolide',d:'1 tab OD x 3 days (or 500mg day1 then 250mg OD x4)'},
{g:'Azithromycin',b:['Zithromax Syrup','Azithral Syrup'],f:'Syrup',s:'200mg/5ml',c:'Macrolide Syrup',d:'5ml OD x 3 days (child: 10mg/kg/day)'},
{g:'Clarithromycin',b:['Klacid','Biaxin','Claribid','Fromilid'],f:'Tab',s:'500mg',c:'Macrolide',d:'1 tab BD x 7-14 days'},
{g:'Ciprofloxacin',b:['Ciprobay','Ciproxin','Ciplox','Cifran'],f:'Tab',s:'500mg',c:'Fluoroquinolone',d:'1 tab BD x 5-7 days'},
{g:'Levofloxacin',b:['Tavanic','Levaquin','Levoxa','Lebact'],f:'Tab',s:'500mg',c:'Fluoroquinolone',d:'1 tab OD x 5-7 days'},
{g:'Doxycycline',b:['Vibramycin','Doxylin','Doxycin'],f:'Cap',s:'100mg',c:'Tetracycline',d:'1 cap BD x 7-14 days after meals'},
{g:'Metronidazole',b:['Flagyl','Metrogyl','Rozex'],f:'Tab',s:'400mg',c:'Nitroimidazole',d:'1 tab TDS x 5-7 days after meals'},
{g:'Metronidazole',b:['Flagyl Syrup','Metrogyl Syrup'],f:'Syrup',s:'200mg/5ml',c:'Antiprotozoal Syrup',d:'5ml TDS x 5-7 days'},
{g:'Cephalexin',b:['Keflex','Ospexin','Cefalin'],f:'Cap',s:'500mg',c:'Cephalosporin 1st Gen',d:'1 cap QID x 7 days'},
{g:'Cefuroxime',b:['Zinnat','Cefaxim','Ceftum'],f:'Tab',s:'500mg',c:'Cephalosporin 2nd Gen',d:'1 tab BD x 7-10 days after meals'},
{g:'Cefixime',b:['Suprax','Cefspan','Hifen','Taxim-O','Zifi'],f:'Cap',s:'400mg',c:'Cephalosporin 3rd Gen (Oral)',d:'1 cap OD or 200mg BD x 7-14 days'},
{g:'Cefixime',b:['Suprax Syrup','Cefspan Syrup','Hifen Syrup'],f:'Syrup',s:'100mg/5ml',c:'Cephalosporin Syrup',d:'5-10ml BD x 7 days (child: 8mg/kg/day ÷ BD)'},
{g:'Cefpodoxime',b:['Orelox','Cepodem','Pecef'],f:'Tab',s:'200mg',c:'Cephalosporin 3rd Gen (Oral)',d:'1 tab BD x 7-10 days after meals'},
{g:'Trimethoprim+Sulfamethoxazole',b:['Septran','Bactrim','Cotrimoxazole','Microprim'],f:'Tab',s:'480mg',c:'Sulfonamide (Co-trimoxazole)',d:'1 tab BD x 5-7 days'},
{g:'Clindamycin',b:['Dalacin C','Clindal'],f:'Cap',s:'300mg',c:'Lincosamide',d:'1 cap TDS x 7 days'},
{g:'Nitrofurantoin',b:['Macrobid','Urantoin'],f:'Cap',s:'100mg',c:'UTI Antibiotic',d:'1 cap BD x 5-7 days after meals'},
{g:'Flucloxacillin',b:['Floxapen','Flucil'],f:'Cap',s:'500mg',c:'Antistaphylococcal',d:'1 cap QID (empty stomach) x 7 days'},
{g:'Erythromycin',b:['Erythrocin','Eryc'],f:'Tab',s:'500mg',c:'Macrolide',d:'1 tab QID x 7 days after meals'},
{g:'Linezolid',b:['Zyvox','Linox','Lizolid'],f:'Tab',s:'600mg',c:'Oxazolidinone (MRSA/VRE)',d:'600mg BD x 10-14 days (check platelets weekly)'},

// ─────────────────────────────────────────────────────────
// ANTIBIOTICS — INJECTABLE (hospital)
// ─────────────────────────────────────────────────────────
{g:'Ceftriaxone',b:['Rocephin','Biotum','Ceftron','Wintriax'],f:'Inj',s:'1g',c:'Cephalosporin 3rd Gen Inj',d:'1g IV/IM OD-BD x 5-7 days'},
{g:'Cefotaxime',b:['Claforan','Cefotax','Fotax'],f:'Inj',s:'1g',c:'Cephalosporin 3rd Gen Inj',d:'1g IV TDS x 5-7 days'},
{g:'Ceftazidime',b:['Fortum','Ceftaz','Ceptaz'],f:'Inj',s:'1g',c:'Cephalosporin 3rd Gen (Pseudomonas) Inj',d:'1g IV TDS x 7-10 days'},
{g:'Cefepime',b:['Maxipime','Cefepime Pharma'],f:'Inj',s:'1g',c:'Cephalosporin 4th Gen Inj',d:'1g IV BD-TDS (febrile neutropenia: 2g TDS)'},
{g:'Meropenem',b:['Meronem','Meropin','Merotek'],f:'Inj',s:'1g',c:'Carbapenem Inj',d:'1g IV TDS (infuse over 30 min)'},
{g:'Imipenem+Cilastatin',b:['Tienam','Primaxin'],f:'Inj',s:'500mg',c:'Carbapenem Inj',d:'500mg IV QID (infuse over 60 min)'},
{g:'Piperacillin+Tazobactam',b:['Tazocin','Piptaz'],f:'Inj',s:'4.5g',c:'Extended Penicillin+BLI Inj',d:'4.5g IV TDS (infuse over 30 min)'},
{g:'Ampicillin',b:['Pentrexyl','Ampicyn','Ampiclox (with clox)'],f:'Inj',s:'500mg',c:'Penicillin Inj',d:'500mg-1g IV/IM QID'},
{g:'Ampicillin+Cloxacillin',b:['Ampiclox','Ampicloxin'],f:'Inj',s:'500mg',c:'Penicillin Combo Inj',d:'500mg IV/IM QID'},
{g:'Benzyl Penicillin',b:['Crystapen','Penicillin G'],f:'Inj',s:'1 MU',c:'Penicillin G Inj',d:'1-4 MU IV 4-6 hrly (dilute in NS, infuse over 30 min)'},
{g:'Gentamicin',b:['Garamycin','Gentacin'],f:'Inj',s:'80mg/2ml',c:'Aminoglycoside Inj',d:'3-5mg/kg IV OD or 80mg IV BD (monitor renal function)'},
{g:'Amikacin',b:['Amikin','Amicin'],f:'Inj',s:'500mg/2ml',c:'Aminoglycoside Inj',d:'15mg/kg IV OD or 7.5mg/kg BD (monitor renal/auditory)'},
{g:'Vancomycin',b:['Vancocin','Vancoled'],f:'Inj',s:'500mg',c:'Glycopeptide Inj (MRSA)',d:'15-20mg/kg IV BD (infuse over 1-2 hrs — monitor troughs)'},
{g:'Metronidazole',b:['Flagyl IV','Metrogyl IV'],f:'Inj',s:'500mg/100ml',c:'Nitroimidazole IV Infusion',d:'500mg IV TDS (infuse over 30 min)'},
{g:'Ciprofloxacin',b:['Ciprobay IV','Ciproxin IV'],f:'Inj',s:'200mg/100ml',c:'Fluoroquinolone IV',d:'400mg IV BD (infuse over 60 min)'},
{g:'Levofloxacin',b:['Tavanic IV','Levoxa IV'],f:'Inj',s:'500mg/100ml',c:'Fluoroquinolone IV',d:'500mg IV OD (infuse over 60 min)'},
{g:'Clindamycin',b:['Dalacin IV','Clindal IV'],f:'Inj',s:'300mg/2ml',c:'Lincosamide Inj',d:'600mg IV TDS (dilute and infuse over 30 min)'},
{g:'Azithromycin',b:['Zithromax IV','Azimax IV'],f:'Inj',s:'500mg',c:'Macrolide IV (CAP)',d:'500mg IV OD (dilute in 250ml NS, infuse over 60 min)'},
{g:'Linezolid',b:['Zyvox IV','Lizolid IV'],f:'Inj',s:'600mg/300ml',c:'Oxazolidinone IV (MRSA)',d:'600mg IV BD (infuse over 30-120 min)'},
{g:'Colistin',b:['Colistimethate','Colomycin'],f:'Inj',s:'1 MU',c:'Polymyxin Inj (MDR GNB)',d:'As per renal function — specialist guidance required'},

// ─────────────────────────────────────────────────────────
// ANTIFUNGALS
// ─────────────────────────────────────────────────────────
{g:'Fluconazole',b:['Diflucan','Flucoral','Funazole'],f:'Cap',s:'150mg',c:'Antifungal',d:'150mg stat or OD x 7-14 days'},
{g:'Fluconazole',b:['Diflucan IV','Flucoral IV'],f:'Inj',s:'200mg/100ml',c:'Antifungal IV',d:'200-400mg IV OD (infuse over 60 min)'},
{g:'Voriconazole',b:['Vfend','Voriz'],f:'Tab',s:'200mg',c:'Triazole Antifungal (Aspergillus)',d:'200mg BD (loading: 400mg BD day 1)'},
{g:'Caspofungin',b:['Cancidas'],f:'Inj',s:'50mg',c:'Echinocandin IV (Invasive Candida)',d:'70mg IV day 1 then 50mg IV OD'},
{g:'Clotrimazole',b:['Canesten','Candid'],f:'Cream',s:'1%',c:'Topical Antifungal',d:'Apply BD x 2-4 weeks'},
{g:'Terbinafine',b:['Lamisil','Terbicil'],f:'Tab',s:'250mg',c:'Antifungal Oral',d:'1 tab OD x 2-6 weeks (skin) or 3-6 months (nails)'},
{g:'Nystatin',b:['Mycostatin','Nystat'],f:'Susp',s:'100,000 IU/ml',c:'Antifungal (Oral Candida)',d:'1ml QID swish and swallow x 7 days'},

// ─────────────────────────────────────────────────────────
// ANTIVIRALS / ANTIPARASITICS / ANTIMALARIALS
// ─────────────────────────────────────────────────────────
{g:'Acyclovir',b:['Zovirax','Acivir'],f:'Tab',s:'400mg',c:'Antiviral (HSV/VZV)',d:'400mg TDS x 7 days (herpes simplex) or 800mg 5x/day x 7 days (zoster)'},
{g:'Acyclovir',b:['Zovirax IV','Acivir IV'],f:'Inj',s:'250mg',c:'Antiviral IV',d:'5-10mg/kg IV TDS (infuse over 60 min — ensure good hydration)'},
{g:'Oseltamivir',b:['Tamiflu','Antiflu'],f:'Cap',s:'75mg',c:'Antiviral (Influenza)',d:'1 cap BD x 5 days (start within 48hrs of symptoms)'},
{g:'Albendazole',b:['Zentel','Almex','Bendex','Wormez'],f:'Tab',s:'400mg',c:'Anthelmintic',d:'400mg stat (repeat after 2 weeks for worms)'},
{g:'Mebendazole',b:['Vermox','Mebex'],f:'Tab',s:'100mg',c:'Anthelmintic',d:'1 tab BD x 3 days or 500mg stat'},
{g:'Metronidazole',b:['Flagyl','Metrogyl'],f:'Tab',s:'500mg',c:'Antiprotozoal (Amoeba/Giardia)',d:'500mg TDS x 5-7 days after meals'},
{g:'Chloroquine',b:['Avloclor','Resochin'],f:'Tab',s:'250mg',c:'Antimalarial',d:'Day1: 1g then 500mg after 6h — Day2-3: 500mg OD'},
{g:'Artemether+Lumefantrine',b:['Coartem','Riamet','Lumartem'],f:'Tab',s:'20/120mg',c:'Antimalarial (Falciparum)',d:'4 tabs stat then at 8h, 24h, 36h, 48h, 60h (with food)'},
{g:'Primaquine',b:['Primacin'],f:'Tab',s:'15mg',c:'Antimalarial (Vivax Relapse — check G6PD)',d:'1 tab OD x 14 days'},
{g:'Ivermectin',b:['Stromectol','Scabo'],f:'Tab',s:'6mg',c:'Antiparasitic',d:'200mcg/kg stat (scabies: repeat after 1 week)'},
{g:'Permethrin',b:['Lyclear','Scabex'],f:'Cream',s:'5%',c:'Topical Scabicide',d:'Apply head-to-toe at night, wash off morning — repeat after 1 week'},

// ─────────────────────────────────────────────────────────
// GI DRUGS
// ─────────────────────────────────────────────────────────
{g:'Omeprazole',b:['Losec','Risek','Omez','Prilosec'],f:'Cap',s:'20mg',c:'PPI',d:'1 cap OD (30 min before breakfast) x 4-8 weeks'},
{g:'Omeprazole',b:['Losec IV','Omez IV','Risek IV'],f:'Inj',s:'40mg',c:'PPI Injection',d:'40mg IV OD-BD (dilute in 100ml NS, infuse over 30 min)'},
{g:'Pantoprazole',b:['Protonix','Pantoloc','Pantor'],f:'Tab',s:'40mg',c:'PPI',d:'1 tab OD before breakfast'},
{g:'Pantoprazole',b:['Protonix IV','Pantor IV'],f:'Inj',s:'40mg',c:'PPI Injection',d:'40mg IV OD-BD (upper GI bleed: 80mg bolus then 8mg/hr infusion)'},
{g:'Esomeprazole',b:['Nexium','Esopral','Nexopro'],f:'Tab',s:'40mg',c:'PPI',d:'1 tab OD before breakfast'},
{g:'Ranitidine',b:['Zantac','Ranic','Rantin'],f:'Tab',s:'150mg',c:'H2 Blocker',d:'1 tab BD x 4-8 weeks'},
{g:'Ranitidine',b:['Zantac Inj','Ranic Inj'],f:'Inj',s:'50mg/2ml',c:'H2 Blocker Injection',d:'50mg IV/IM BD-TDS (dilute for IV)'},
{g:'Domperidone',b:['Motilium','Motinorm','Comed'],f:'Tab',s:'10mg',c:'Prokinetic/Antiemetic',d:'1 tab TDS (30 min before meals)'},
{g:'Domperidone',b:['Motilium Syrup','Motinorm Syrup'],f:'Syrup',s:'5mg/5ml',c:'Prokinetic Syrup',d:'5-10ml TDS (30 min before meals)'},
{g:'Metoclopramide',b:['Maxolon','Reglan','Perinorm'],f:'Tab',s:'10mg',c:'Antiemetic/Prokinetic',d:'1 tab TDS before meals (short-term only)'},
{g:'Metoclopramide',b:['Maxolon Inj','Reglan Inj'],f:'Inj',s:'10mg/2ml',c:'Antiemetic Injection',d:'10mg IV/IM TDS (slow IV over 3 min)'},
{g:'Ondansetron',b:['Zofran','Ondem','Emset','Anzatron'],f:'Tab',s:'8mg',c:'Antiemetic (5-HT3)',d:'1 tab BD-TDS x 3-5 days'},
{g:'Ondansetron',b:['Zofran Inj','Emset Inj'],f:'Inj',s:'4mg/2ml',c:'Antiemetic Injection',d:'4-8mg IV/IM BD-TDS (slow IV over 5 min)'},
{g:'Granisetron',b:['Kytril','Graniron'],f:'Inj',s:'3mg/3ml',c:'Antiemetic (Chemo) Injection',d:'3mg IV 30 min before chemotherapy (dilute in 20-50ml NS)'},
{g:'Hyoscine Butylbromide',b:['Buscopan','Hyoscin'],f:'Tab',s:'10mg',c:'Antispasmodic',d:'1-2 tabs TDS-QID for cramps'},
{g:'Hyoscine Butylbromide',b:['Buscopan Inj'],f:'Inj',s:'20mg/ml',c:'Antispasmodic Injection',d:'20mg IV/IM SOS (slow IV — watch for tachycardia)'},
{g:'Loperamide',b:['Imodium','Lopamide'],f:'Cap',s:'2mg',c:'Antidiarrhoeal',d:'2 caps stat then 1 after each loose stool (max 8/day)'},
{g:'ORS',b:['Pedialyte','Gastrolyte','Oralyte','Dextrolyte'],f:'Sachet',s:'per sachet',c:'Oral Rehydration',d:'1 sachet in 200ml water after each loose stool'},
{g:'Lactulose',b:['Duphalac','Regulose','Laevolac'],f:'Syrup',s:'3.35g/5ml',c:'Osmotic Laxative',d:'15-30ml OD-BD (adjust to response)'},
{g:'Bisacodyl',b:['Dulcolax','Correctol'],f:'Tab',s:'5mg',c:'Stimulant Laxative',d:'2 tabs OD at night (do not crush)'},
{g:'Sucralfate',b:['Carafate','Sucrate','Ulcyte'],f:'Tab',s:'1g',c:'Mucosal Protectant',d:'1 tab QID (1 hr before meals and bedtime)'},
{g:'Antacid',b:['Gelusil','Maalox','Mucaine','Digene','Gaviscon'],f:'Susp',s:'per 5ml',c:'Antacid',d:'10ml TDS after meals and 10ml at bedtime'},
{g:'Octreotide',b:['Sandostatin','Octride'],f:'Inj',s:'100mcg/ml',c:'Somatostatin Analogue (GI Bleed)',d:'100mcg IV bolus then 25mcg/hr infusion x 5 days (variceal bleed)'},
{g:'Neostigmine',b:['Prostigmin','Stigmine'],f:'Inj',s:'0.5mg/ml',c:'Anticholinesterase (Ileus)',d:'0.5-2.5mg SC/IM BD-TDS (with atropine ready)'},

// ─────────────────────────────────────────────────────────
// RESPIRATORY
// ─────────────────────────────────────────────────────────
{g:'Salbutamol',b:['Ventolin','Sultanol','Asthalin'],f:'Inhaler',s:'100mcg/puff',c:'SABA Inhaler',d:'2 puffs QID or PRN (acute wheeze)'},
{g:'Salbutamol',b:['Ventolin Syrup','Sultanol Syrup'],f:'Syrup',s:'2mg/5ml',c:'SABA Syrup',d:'5-10ml TDS x 5 days'},
{g:'Salbutamol',b:['Ventolin Respules','Asthalin Respules'],f:'Nebuliser',s:'2.5mg/2.5ml',c:'SABA Nebuliser',d:'1 respule via nebuliser TDS-QID (SOS in acute attack)'},
{g:'Salbutamol',b:['Ventolin Inj','Asthalin Inj'],f:'Inj',s:'500mcg/ml',c:'SABA Injection (Severe Asthma)',d:'250mcg SC stat (may repeat after 15 min) or 5-20mcg/min IV infusion'},
{g:'Ipratropium',b:['Atrovent','Ipravent'],f:'Inhaler',s:'20mcg/puff',c:'SABA+Anticholinergic Inhaler',d:'2 puffs TDS-QID'},
{g:'Ipratropium',b:['Atrovent Respules'],f:'Nebuliser',s:'500mcg/2ml',c:'Anticholinergic Nebuliser',d:'500mcg via nebuliser TDS-QID (often combined with salbutamol)'},
{g:'Budesonide',b:['Pulmicort','Budelin'],f:'Inhaler',s:'200mcg/puff',c:'Inhaled Corticosteroid',d:'1-2 puffs BD (rinse mouth after)'},
{g:'Budesonide',b:['Pulmicort Respules'],f:'Nebuliser',s:'0.5mg/2ml',c:'ICS Nebuliser (Croup/Asthma)',d:'0.5-1mg via nebuliser BD (croup: 2mg single dose)'},
{g:'Fluticasone',b:['Flixotide','Flixonase Nasal'],f:'Inhaler',s:'125mcg/puff',c:'Inhaled Corticosteroid',d:'1-2 puffs BD (rinse mouth after)'},
{g:'Montelukast',b:['Singulair','Montair','Montiget','Arokast'],f:'Tab',s:'10mg',c:'Leukotriene Antagonist',d:'1 tab OD at bedtime'},
{g:'Prednisolone',b:['Deltacortril','Predsy'],f:'Tab',s:'5mg',c:'Corticosteroid (Oral)',d:'40mg OD x 5 days then taper by 5mg every 2 days'},
{g:'Hydrocortisone',b:['Solu-Cortef','Hydrocortisone Inj'],f:'Inj',s:'100mg',c:'Corticosteroid IV/IM (Acute Asthma/Anaphylaxis)',d:'100-200mg IV/IM QID (acute asthma/anaphylaxis/adrenal crisis)'},
{g:'Methylprednisolone',b:['Solu-Medrol','Depo-Medrol','Medrol'],f:'Inj',s:'500mg',c:'Corticosteroid IV (Pulse)',d:'500mg-1g IV OD x 3 days (pulse therapy — infuse over 30-60 min)'},
{g:'Dexamethasone',b:['Decadron','Oradexon','Dexona'],f:'Inj',s:'4mg/ml',c:'Corticosteroid Injection',d:'4-8mg IV/IM BD (cerebral oedema: 10mg stat then 4mg QID)'},
{g:'Aminophylline',b:['Aminophylline','Phyllocontin'],f:'Inj',s:'250mg/10ml',c:'Xanthine Bronchodilator IV',d:'Loading: 5mg/kg IV over 30 min — Maintenance: 0.5mg/kg/hr infusion'},
{g:'Ambroxol',b:['Mucosolvan','Ambro','Exputex'],f:'Syrup',s:'30mg/5ml',c:'Mucolytic',d:'10ml TDS x 5-7 days after meals'},
{g:'N-Acetylcysteine (Mucolytic)',b:['Fluimucil','Mucomix','ACC'],f:'Sachet',s:'600mg',c:'Mucolytic Sachet',d:'1 sachet dissolved in water OD-BD'},
{g:'Dextromethorphan',b:['Robitussin DM','Benylin DM'],f:'Syrup',s:'10mg/5ml',c:'Antitussive (Dry Cough Only)',d:'10ml TDS — dry cough only'},
{g:'Adrenaline (Epinephrine)',b:['Adrenaline Inj','Epinephrine Inj'],f:'Inj',s:'1mg/ml (1:1000)',c:'Sympathomimetic (Anaphylaxis/Cardiac Arrest)',d:'Anaphylaxis: 0.5mg IM (0.5ml of 1:1000) — repeat every 5 min\nCardiac arrest: 1mg IV every 3-5 min (1:10000)'},

// ─────────────────────────────────────────────────────────
// ANTIHISTAMINES
// ─────────────────────────────────────────────────────────
{g:'Cetirizine',b:['Zyrtec','Cetrizet','Allecet','Alzet'],f:'Tab',s:'10mg',c:'Antihistamine (Non-Sedating)',d:'1 tab OD at night'},
{g:'Loratadine',b:['Claritin','Loridin','Roletra'],f:'Tab',s:'10mg',c:'Antihistamine (Non-Sedating)',d:'1 tab OD'},
{g:'Fexofenadine',b:['Telfast','Allegra','Fexet'],f:'Tab',s:'120mg',c:'Antihistamine (Non-Sedating)',d:'1 tab OD'},
{g:'Levocetirizine',b:['Xyzal','Levocet','Teczine'],f:'Tab',s:'5mg',c:'Antihistamine (Non-Sedating)',d:'1 tab OD at night'},
{g:'Chlorpheniramine',b:['Piriton','Avil','Histafen'],f:'Tab',s:'4mg',c:'Antihistamine (Sedating)',d:'1 tab TDS (causes drowsiness)'},
{g:'Promethazine',b:['Phenergan','Avomine'],f:'Tab',s:'25mg',c:'Antihistamine/Antiemetic (Sedating)',d:'25mg OD at night'},
{g:'Promethazine',b:['Phenergan Inj'],f:'Inj',s:'25mg/ml',c:'Antihistamine Injection',d:'25-50mg IM/IV (slow IV) — anaphylaxis adjunct'},
{g:'Chlorpheniramine',b:['Piriton Inj','Avil Inj'],f:'Inj',s:'10mg/ml',c:'Antihistamine Injection',d:'10mg IV/IM SOS (anaphylaxis adjunct)'},

// ─────────────────────────────────────────────────────────
// CARDIOVASCULAR
// ─────────────────────────────────────────────────────────
{g:'Amlodipine',b:['Norvasc','Istin','Amlopin','Stamlo'],f:'Tab',s:'5mg',c:'Calcium Channel Blocker',d:'1 tab OD (may increase to 10mg)'},
{g:'Atenolol',b:['Tenormin','Aten','Betacard'],f:'Tab',s:'50mg',c:'Beta Blocker',d:'1 tab OD morning'},
{g:'Metoprolol',b:['Betaloc','Lopressor','Metolar'],f:'Tab',s:'50mg',c:'Beta Blocker',d:'1 tab BD'},
{g:'Metoprolol',b:['Betaloc IV','Lopressor IV'],f:'Inj',s:'5mg/5ml',c:'Beta Blocker IV (Rate Control)',d:'2.5-5mg IV over 2 min — may repeat every 5 min (max 15mg)'},
{g:'Carvedilol',b:['Dilatrend','Carloc','Cardivas'],f:'Tab',s:'6.25mg',c:'Alpha+Beta Blocker',d:'6.25mg BD (double every 2 weeks as tolerated)'},
{g:'Enalapril',b:['Renitec','Vasotec','Enapril'],f:'Tab',s:'5mg',c:'ACE Inhibitor',d:'5mg OD (start 2.5mg if elderly)'},
{g:'Lisinopril',b:['Zestril','Prinivil','Lisopril'],f:'Tab',s:'10mg',c:'ACE Inhibitor',d:'1 tab OD'},
{g:'Losartan',b:['Cozaar','Losacar','Repace'],f:'Tab',s:'50mg',c:'ARB',d:'1 tab OD'},
{g:'Valsartan',b:['Diovan','Valzaar','Tareg'],f:'Tab',s:'80mg',c:'ARB',d:'1 tab OD'},
{g:'Furosemide',b:['Lasix','Frusemide','Diuride'],f:'Tab',s:'40mg',c:'Loop Diuretic',d:'1 tab OD morning (monitor K+)'},
{g:'Furosemide',b:['Lasix Inj','Frusemide Inj'],f:'Inj',s:'20mg/2ml',c:'Loop Diuretic Injection',d:'20-40mg IV slow BD — acute pulmonary oedema: 40-80mg IV stat'},
{g:'Spironolactone',b:['Aldactone','Spirotone'],f:'Tab',s:'25mg',c:'K-Sparing Diuretic',d:'25-50mg OD'},
{g:'Hydrochlorothiazide',b:['HCTZ','Hydrodiuril','Esidrex'],f:'Tab',s:'25mg',c:'Thiazide Diuretic',d:'1 tab OD morning'},
{g:'Nitroglycerin',b:['GTN Tab','Nitrolingual Sub'],f:'Tab',s:'0.5mg',c:'Nitrate Sublingual',d:'1 tab sublingual SOS — repeat every 5min x3 (call emergency if no relief)'},
{g:'Nitroglycerin',b:['GTN Infusion','Nitronal Inj'],f:'Inj',s:'25mg/25ml',c:'Nitrate IV Infusion (Unstable Angina/ADHF)',d:'5-100mcg/min IV infusion (titrate to BP response)'},
{g:'Isosorbide Mononitrate',b:['Imdur','Monosorb','Ismo'],f:'Tab',s:'30mg',c:'Long-Acting Nitrate',d:'1 tab OD (SR — do not crush)'},
{g:'Atorvastatin',b:['Lipitor','Atorva','Lipicard','Torvast'],f:'Tab',s:'20mg',c:'Statin',d:'1 tab OD at night'},
{g:'Rosuvastatin',b:['Crestor','Rozat','Rosulip'],f:'Tab',s:'10mg',c:'Statin',d:'1 tab OD at night'},
{g:'Clopidogrel',b:['Plavix','Clopilet','Deplatt'],f:'Tab',s:'75mg',c:'Antiplatelet',d:'1 tab OD (usually with aspirin — dual antiplatelet)'},
{g:'Warfarin',b:['Coumadin','Warf'],f:'Tab',s:'5mg',c:'Anticoagulant (monitor INR)',d:'As per INR — target 2.0-3.0'},
{g:'Enoxaparin',b:['Clexane','Lovenox','Enoxarin'],f:'Inj',s:'40mg/0.4ml',c:'LMWH Injection (DVT/PE/ACS)',d:'Prophylaxis: 40mg SC OD — Treatment: 1mg/kg SC BD'},
{g:'Heparin',b:['Heparin Sodium','Liquemin'],f:'Inj',s:'5000 IU/ml',c:'Unfractionated Heparin (UFH)',d:'IV infusion: 80 IU/kg bolus then 18 IU/kg/hr (adjust per aPTT) — SC prophylaxis: 5000 IU BD-TDS'},
{g:'Digoxin',b:['Lanoxin','Cardigoxin'],f:'Tab',s:'0.25mg',c:'Cardiac Glycoside (AF/HF)',d:'0.25mg OD (narrow therapeutic index — monitor levels and ECG)'},
{g:'Digoxin',b:['Lanoxin Inj'],f:'Inj',s:'0.25mg/ml',c:'Cardiac Glycoside IV',d:'Loading: 0.25-0.5mg IV slow over 30 min — maintenance: 0.125-0.25mg IV OD'},
{g:'Adenosine',b:['Adenocor','Adenoject'],f:'Inj',s:'6mg/2ml',c:'Antiarrhythmic IV (SVT)',d:'6mg rapid IV bolus — if no response 12mg after 2 min (central or large peripheral line)'},
{g:'Amiodarone',b:['Cordarone','Pacerone','Amiodacore'],f:'Tab',s:'200mg',c:'Antiarrhythmic',d:'Loading: 200mg TDS x 1 week, then 200mg BD x 1 week, maintenance: 200mg OD'},
{g:'Amiodarone',b:['Cordarone IV'],f:'Inj',s:'150mg/3ml',c:'Antiarrhythmic IV (VF/VT)',d:'VF/pulseless VT: 300mg IV bolus — stable VT: 150mg IV over 10 min then 1mg/min x 6hrs'},
{g:'Atropine',b:['Atropine Sulphate','Atrovent (not same)'],f:'Inj',s:'1mg/ml',c:'Anticholinergic (Bradycardia/Organophosphate)',d:'Bradycardia: 0.5-1mg IV every 3-5 min (max 3mg) — Organophosphate: 2-4mg IV repeated until secretions dry'},
{g:'Dopamine',b:['Intropin','Dopamine HCl'],f:'Inj',s:'200mg/5ml',c:'Vasopressor/Inotrope IV',d:'2-20mcg/kg/min IV infusion (dilute in D5W or NS — via central line preferred)'},
{g:'Noradrenaline',b:['Levophed','Norepinephrine'],f:'Inj',s:'4mg/4ml',c:'Vasopressor IV (Septic Shock)',d:'0.01-3mcg/kg/min IV infusion (via central line)'},
{g:'Dobutamine',b:['Dobutrex','Dobutamine'],f:'Inj',s:'250mg/20ml',c:'Inotrope IV (Cardiogenic Shock)',d:'2-20mcg/kg/min IV infusion (titrate to cardiac output)'},

// ─────────────────────────────────────────────────────────
// DIABETES
// ─────────────────────────────────────────────────────────
{g:'Metformin',b:['Glucophage','Glumet','Obimet','Glycomet'],f:'Tab',s:'500mg',c:'Biguanide (T2DM)',d:'500mg BD with meals (increase to 1g BD as tolerated)'},
{g:'Glibenclamide',b:['Daonil','Euglucon'],f:'Tab',s:'5mg',c:'Sulphonylurea',d:'5mg OD before breakfast (start 2.5mg in elderly)'},
{g:'Glimepiride',b:['Amaryl','Glimy','Glimpid'],f:'Tab',s:'2mg',c:'Sulphonylurea',d:'1-2mg OD before breakfast'},
{g:'Gliclazide',b:['Diamicron MR','Glyzid MR'],f:'Tab',s:'30mg',c:'Sulphonylurea MR',d:'30mg OD with breakfast (max 120mg OD)'},
{g:'Sitagliptin',b:['Januvia','Xelevia'],f:'Tab',s:'100mg',c:'DPP-4 Inhibitor',d:'100mg OD (50mg if eGFR 30-50)'},
{g:'Empagliflozin',b:['Jardiance','Empagard'],f:'Tab',s:'10mg',c:'SGLT-2 Inhibitor',d:'10mg OD with or without food'},
{g:'Insulin Glargine',b:['Lantus','Basaglar','Toujeo'],f:'Inj',s:'100 IU/ml',c:'Long-Acting Insulin (Basal)',d:'As per dose — OD at fixed time (usually bedtime)'},
{g:'Insulin Aspart',b:['NovoRapid','NovoLog'],f:'Inj',s:'100 IU/ml',c:'Rapid-Acting Insulin (Bolus)',d:'As per dose — 0-15 min before meals'},
{g:'Insulin Mixtard',b:['Mixtard 30','Humulin 30/70','Insuget Mix'],f:'Inj',s:'100 IU/ml',c:'Premixed Insulin 30/70',d:'As per dose BD — 30 min before breakfast and dinner'},
{g:'Insulin Regular',b:['Actrapid','Humulin R'],f:'Inj',s:'100 IU/ml',c:'Short-Acting Insulin (Sliding Scale/DKA)',d:'Sliding scale: as per BSL — DKA: 0.1 IU/kg/hr IV infusion'},
{g:'Dextrose 50%',b:['D50%','Glucose 50%','Dextrose Hypertonic'],f:'Inj',s:'50%',c:'Hypoglycaemia IV Treatment',d:'Symptomatic hypoglycaemia: 50ml (25g) IV stat — repeat if no response after 10 min'},
{g:'Glucagon',b:['GlucaGen','Glucagon HCl'],f:'Inj',s:'1mg',c:'Hypoglycaemia Inj (Unconscious)',d:'1mg IM/SC stat (if IV access not available — glucose preferred)'},

// ─────────────────────────────────────────────────────────
// IV FLUIDS & DRIPS
// ─────────────────────────────────────────────────────────
{g:'Normal Saline',b:['0.9% NaCl','Isotonic Saline','NS','Physiological Saline'],f:'IV Drip',s:'0.9% — 500ml / 1000ml',c:'IV Fluid — Isotonic Crystalloid',d:'500ml-1L IV at required rate (ml/hr per fluid plan)'},
{g:'Ringer Lactate',b:["Hartmann's Solution",'Lactated Ringer','RL','Compound Sodium Lactate'],f:'IV Drip',s:'500ml / 1000ml',c:'IV Fluid — Balanced Crystalloid (Surgical/Trauma)',d:'500ml-1L IV at required rate (preferred in surgical patients)'},
{g:'Dextrose 5%',b:['D5W','5% Glucose','Dextrose Water','D5'],f:'IV Drip',s:'5% — 500ml',c:'IV Fluid — Maintenance/Hypoglycaemia',d:'500ml IV at required rate'},
{g:'Dextrose-Saline',b:['D/S','Dextrose-Saline 5%/0.45%','Half-Strength Saline Dextrose'],f:'IV Drip',s:'5%/0.45% — 500ml',c:'IV Fluid — Maintenance Fluid',d:'500ml IV at required rate (common paediatric/maintenance fluid)'},
{g:'0.45% Saline',b:['Half Normal Saline','0.45% NaCl','Half NS'],f:'IV Drip',s:'0.45% — 500ml',c:'IV Fluid — Hypotonic',d:'500ml IV at required rate (hypertonic dehydration — use cautiously)'},
{g:'Dextrose 10%',b:['D10W','10% Glucose','D10'],f:'IV Drip',s:'10% — 500ml',c:'IV Fluid — Neonatal/Hypoglycaemia',d:'As per fluid plan — neonatal nutrition or hypoglycaemia'},
{g:'Colloid — Albumin',b:['Human Albumin 5%','Albumin 20%','Albutein'],f:'IV Drip',s:'5% or 20%',c:'IV Colloid (Hypoalbuminaemia/SBP)',d:'SBP: 1.5g/kg albumin day 1 then 1g/kg day 3 — hypoalb: 100-200ml 20% over 4 hrs'},
{g:'Colloid — Gelatin',b:['Gelofusine','Haemaccel','Volplex'],f:'IV Drip',s:'500ml',c:'IV Colloid (Volume Expansion)',d:'500ml IV over 30-60 min (volume resuscitation)'},
{g:'Mannitol',b:['Osmitrol','Mannitol Inj'],f:'IV Drip',s:'20% — 250ml',c:'Osmotic Diuretic (Raised ICP/Cerebral Oedema)',d:'0.25-1g/kg IV over 30-60 min (raised ICP) — use filter'},
{g:'Sodium Bicarbonate',b:['NaHCO3','Soda Bicarb Inj','Sodibic'],f:'Inj',s:'8.4% — 50ml',c:'Alkalinising Agent (Metabolic Acidosis)',d:'50ml (50mmol) IV slow — dose guided by blood gas: base deficit × weight × 0.3'},
{g:'Potassium Chloride',b:['KCl','Potassium Chloride Inj'],f:'Inj',s:'15% — 10ml ampoule',c:'Electrolyte Replacement (Hypokalaemia)',d:'Always dilute — 40mmol/L in NS at max 10mmol/hr (NEVER give undiluted IV)'},
{g:'Calcium Gluconate',b:['Calcium Gluconate Inj','Sandocal IV'],f:'Inj',s:'10% — 10ml',c:'Calcium Replacement (Hypocalcaemia/Hyperkalemia)',d:'Hypocalcaemia: 10ml (10% solution) IV over 10 min — repeat if needed\nHyperkalemia: 10ml IV over 2-3 min (cardiac protection)'},
{g:'Magnesium Sulphate',b:['MgSO4','Epsom Salt IV','Magnessium Inj'],f:'Inj',s:'50% — 10ml',c:'Magnesium IV (Eclampsia/Torsades/Asthma)',d:'Eclampsia: 4g IV loading over 20 min then 1g/hr — Torsades: 2g IV over 10 min — Severe asthma: 2g IV over 20 min'},
{g:'Zinc Sulphate',b:['Zinco Inj','Zincovit IV'],f:'Inj',s:'1mg/ml',c:'Trace Element (TPN additive)',d:'As per TPN protocol — usually 6.5mg elemental Zn/day'},

// ─────────────────────────────────────────────────────────
// NEUROLOGICAL / PSYCHIATRIC
// ─────────────────────────────────────────────────────────
{g:'Diazepam',b:['Valium','Stesolid','Tensium'],f:'Tab',s:'5mg',c:'Benzodiazepine',d:'5mg BD-TDS (short course max 2-4 weeks — habit forming)'},
{g:'Diazepam',b:['Valium Inj','Stesolid Rectal'],f:'Inj',s:'10mg/2ml',c:'Benzodiazepine IV (Status Epilepticus)',d:'Status epilepticus: 10mg IV at 2mg/min — may repeat once (have resuscitation ready)'},
{g:'Lorazepam',b:['Ativan','Loraz'],f:'Inj',s:'4mg/ml',c:'Benzodiazepine IV (Status Epilepticus — preferred)',d:'4mg IV at 2mg/min — may repeat once after 10 min'},
{g:'Midazolam',b:['Dormicum','Versed'],f:'Inj',s:'5mg/ml',c:'Benzodiazepine IV (Sedation/Status Epilepticus)',d:'Sedation: 1-2.5mg IV titrated — Status epilepticus: 10mg IM or IV'},
{g:'Alprazolam',b:['Xanax','Alprox','Restyl','Alzam'],f:'Tab',s:'0.5mg',c:'Benzodiazepine (Anxiety)',d:'0.5mg BD-TDS (short course only)'},
{g:'Carbamazepine',b:['Tegretol','Epitol','Epimaz'],f:'Tab',s:'200mg',c:'Anticonvulsant',d:'200mg BD (increase gradually — monitor LFTs and CBC)'},
{g:'Sodium Valproate',b:['Epilim','Depalept','Valparin'],f:'Tab',s:'500mg',c:'Anticonvulsant/Mood Stabiliser',d:'500mg BD (increase as needed — monitor LFTs)'},
{g:'Sodium Valproate',b:['Epilim IV','Valparin IV'],f:'Inj',s:'400mg',c:'Anticonvulsant IV (Status Epilepticus)',d:'25-30mg/kg IV loading over 60 min then 1mg/kg/hr infusion'},
{g:'Phenytoin',b:['Dilantin','Epanutin','Eptoin'],f:'Tab',s:'100mg',c:'Anticonvulsant',d:'100mg TDS (monitor levels — narrow therapeutic window)'},
{g:'Phenytoin',b:['Dilantin Inj','Eptoin Inj'],f:'Inj',s:'250mg/5ml',c:'Anticonvulsant IV (Status Epilepticus)',d:'15-20mg/kg IV loading at max 50mg/min (ECG monitoring — in NS only)'},
{g:'Levetiracetam',b:['Keppra','Levroxa','Epixx'],f:'Tab',s:'500mg',c:'Anticonvulsant (2nd Gen)',d:'500mg BD (increase to 1g BD as needed)'},
{g:'Levetiracetam',b:['Keppra IV','Levroxa IV'],f:'Inj',s:'500mg/5ml',c:'Anticonvulsant IV',d:'1-3g IV BD (dilute in 100ml NS, infuse over 15 min)'},
{g:'Amitriptyline',b:['Tryptizol','Triptyl','Amitril'],f:'Tab',s:'25mg',c:'TCA Antidepressant/Neuropathic Pain',d:'25mg OD at night (increase to 75mg over weeks)'},
{g:'Fluoxetine',b:['Prozac','Axtin','Prodep','Flutine'],f:'Cap',s:'20mg',c:'SSRI',d:'20mg OD morning (effects begin 2-4 weeks)'},
{g:'Sertraline',b:['Zoloft','Lustral','Daxid','Serlift'],f:'Tab',s:'50mg',c:'SSRI',d:'50mg OD (increase to 100mg after 4 weeks if needed)'},
{g:'Escitalopram',b:['Lexapro','Cipralex','Nexito'],f:'Tab',s:'10mg',c:'SSRI',d:'10mg OD (may increase to 20mg after 4 weeks)'},
{g:'Pregabalin',b:['Lyrica','Pregeb','Pregalin'],f:'Cap',s:'75mg',c:'Gabapentinoid (Neuropathic Pain)',d:'75mg BD (increase to 150mg BD after 1 week)'},
{g:'Gabapentin',b:['Neurontin','Gabapin','Gabapax'],f:'Cap',s:'300mg',c:'Gabapentinoid',d:'300mg TDS (start OD, increase over 1 week)'},
{g:'Sumatriptan',b:['Imigran','Suminat'],f:'Tab',s:'50mg',c:'Triptan (Migraine)',d:'50mg stat — repeat 100mg after 2hrs if needed (max 300mg/day)'},
{g:'Haloperidol',b:['Haldol','Serenace','Halop'],f:'Tab',s:'5mg',c:'Antipsychotic (Typical)',d:'As per psychiatry guidance — usually 1.5-5mg BD-TDS'},
{g:'Haloperidol',b:['Haldol Inj','Serenace Inj'],f:'Inj',s:'5mg/ml',c:'Antipsychotic Injection (Acute Agitation)',d:'5-10mg IM (acute agitation) — may repeat after 30 min'},
{g:'Risperidone',b:['Risperdal','Risdon','Sizodon'],f:'Tab',s:'2mg',c:'Antipsychotic (Atypical)',d:'Start 0.5mg BD — as per psychiatry guidance'},
{g:'Olanzapine',b:['Zyprexa','Oleanz','Olimelt'],f:'Tab',s:'5mg',c:'Antipsychotic (Atypical)',d:'5-10mg OD at night — as per psychiatry guidance'},

// ─────────────────────────────────────────────────────────
// THYROID
// ─────────────────────────────────────────────────────────
{g:'Levothyroxine',b:['Eltroxin','Synthroid','Thyroxin','Euthyrox'],f:'Tab',s:'50mcg',c:'Thyroid Hormone',d:'50mcg OD (empty stomach 30 min before food — adjust every 4-6 weeks)'},
{g:'Carbimazole',b:['Neo-Mercazole','Carbimazole'],f:'Tab',s:'5mg',c:'Antithyroid',d:'20-40mg OD initially — reduce as euthyroid per TFTs'},
{g:'Propylthiouracil',b:['PTU','Propycil'],f:'Tab',s:'50mg',c:'Antithyroid (Preferred Pregnancy)',d:'100-200mg TDS initially'},
{g:'Propranolol',b:['Inderal','Propra'],f:'Tab',s:'40mg',c:'Beta Blocker (Thyrotoxicosis Symptoms)',d:'40mg TDS (for tachycardia/tremor in hyperthyroidism)'},

// ─────────────────────────────────────────────────────────
// VITAMINS / ELECTROLYTES / SUPPLEMENTS
// ─────────────────────────────────────────────────────────
{g:'Vitamin C',b:['Redoxon','Celin','Vitacee'],f:'Tab',s:'500mg',c:'Vitamin',d:'1 tab OD'},
{g:'Vitamin C',b:['Ascorbic Acid Inj','Celin Inj'],f:'Inj',s:'500mg/5ml',c:'Vitamin C IV',d:'500mg-1g IV/IM OD (scurvy/wound healing/adjunct)'},
{g:'Vitamin D3',b:['D-Vit','Calcirol','Arachitol','Vigantol'],f:'Cap',s:'5000 IU',c:'Vitamin D',d:'1 cap OD x 8-12 weeks (with food)'},
{g:'Vitamin D3 Loading',b:['Calcirol Sachet','Uprise D','D-Vit Sachet'],f:'Sachet',s:'600,000 IU',c:'Vitamin D Loading',d:'1 sachet in water stat (severe deficiency — repeat after 3 months)'},
{g:'Vitamin D3',b:['Arachitol Inj','Calciferol Inj'],f:'Inj',s:'300,000 IU/ml',c:'Vitamin D IM Injection',d:'300,000-600,000 IU IM stat (severe deficiency — repeat after 6 months)'},
{g:'Vitamin B Complex',b:['Neurobion','Polybion','Becadex'],f:'Tab',s:'B1+B6+B12',c:'B Vitamins',d:'1 tab TDS'},
{g:'Vitamin B Complex',b:['Neurobion Forte Inj','Polybion Inj'],f:'Inj',s:'per ampoule',c:'B Vitamins Injection',d:'1 amp IV/IM OD x 5-7 days (then switch to oral)'},
{g:'Vitamin B12',b:['Mecobalamin','Methycobal','Nervijen','Cyanocobalamin'],f:'Tab',s:'1000mcg',c:'Vitamin B12',d:'1 tab OD x 1-3 months'},
{g:'Vitamin B12',b:['Cyanocobalamin Inj','Cobalmin Inj'],f:'Inj',s:'1000mcg/ml',c:'Vitamin B12 Injection',d:'1000mcg IM OD x 7 days then weekly x 4 weeks then monthly'},
{g:'Thiamine (Vitamin B1)',b:['Benerva Inj','Thiamine Inj'],f:'Inj',s:'100mg/ml',c:'Vitamin B1 (Wernicke/Alcohol)',d:'200-500mg IV TDS x 3 days (Wernicke encephalopathy — give before glucose)'},
{g:'Folic Acid',b:['Folinext','Folate','Folvite'],f:'Tab',s:'5mg',c:'Folate',d:'5mg OD (anaemia) or 0.4mg OD (pregnancy prophylaxis)'},
{g:'Ferrous Sulphate',b:['Fefol','Iberet','Vitifer','Feromin'],f:'Tab',s:'200mg',c:'Iron Supplement',d:'1 tab BD before meals (with Vit C, avoid with tea/milk)'},
{g:'Iron Sucrose',b:['Venofer','Iron Sucrose Inj','Ferric'],f:'Inj',s:'100mg/5ml',c:'Iron IV (Severe Anaemia/Intolerance to Oral)',d:'100mg in 100ml NS IV over 30 min — total dose as per deficit calculation'},
{g:'Iron Dextran',b:['Dexferrum','Ferroject','Imferon'],f:'Inj',s:'50mg/ml',c:'Iron IV Injection',d:'As per total dose calculation — test dose required first'},
{g:'Calcium Gluconate',b:['Calcium Gluconate Tabs','Sandocal'],f:'Tab',s:'600mg',c:'Calcium Supplement',d:'1 tab BD with meals'},
{g:'Calcium+Vitamin D',b:['Calcimax','Shelcal','Calciform','Ostocalcium'],f:'Tab',s:'500mg+250IU',c:'Calcium+Vit D',d:'1 tab BD with meals'},
{g:'Zinc',b:['Zincovit','Zinco','Zincold'],f:'Tab',s:'20mg',c:'Zinc',d:'1 tab OD x 2-4 weeks'},
{g:'Potassium Chloride',b:['Slow-K','K-Lor','Kloref','Potklor'],f:'Tab',s:'600mg (8mmol)',c:'Oral Potassium Supplement',d:'1-2 tabs TDS with food (hypokalaemia — monitor K+ levels)'},

// ─────────────────────────────────────────────────────────
// ANAESTHESIA / SEDATION (hospital)
// ─────────────────────────────────────────────────────────
{g:'Ketamine',b:['Ketalar','Calypsol'],f:'Inj',s:'50mg/ml',c:'Dissociative Anaesthetic/Sedation',d:'Induction: 1-2mg/kg IV or 4mg/kg IM — Analgesia: 0.1-0.5mg/kg IV'},
{g:'Propofol',b:['Diprivan','Propofol Lipuro'],f:'Inj',s:'10mg/ml',c:'IV Anaesthetic/Sedation',d:'Induction: 1.5-2.5mg/kg IV — ICU sedation: 0.3-4mg/kg/hr infusion'},
{g:'Thiopental',b:['Pentothal','Thiopentone'],f:'Inj',s:'500mg powder',c:'Barbiturate Anaesthetic',d:'Induction: 3-5mg/kg IV — status epilepticus: 3-5mg/kg then 0.5-5mg/kg/hr'},
{g:'Suxamethonium',b:['Scoline','Anectine','Succinylcholine'],f:'Inj',s:'50mg/ml',c:'Depolarising Muscle Relaxant (RSI)',d:'RSI: 1-2mg/kg IV (or 4mg/kg IM) — short acting, onset 30-60 sec'},
{g:'Rocuronium',b:['Esmeron','Zemuron'],f:'Inj',s:'10mg/ml',c:'Non-Depolarising Muscle Relaxant',d:'Intubation: 0.6mg/kg IV — RSI dose: 1.2mg/kg'},
{g:'Neostigmine',b:['Prostigmin','Stigmine'],f:'Inj',s:'0.5mg/ml',c:'Reversal of NDMR (with Atropine)',d:'0.05mg/kg IV (with atropine 20mcg/kg — always give together)'},
{g:'Fentanyl',b:['Sublimaze','Fentanyl Citrate'],f:'Inj',s:'50mcg/ml',c:'Opioid Analgesic/Anaesthetic',d:'Analgesia: 1-2mcg/kg IV — Induction: 2-5mcg/kg IV'},
{g:'Lignocaine',b:['Xylocaine','Lidocaine'],f:'Inj',s:'2% — 20ml',c:'Local Anaesthetic / Antiarrhythmic',d:'Local: 1-2% solution — VT/VF: 1-1.5mg/kg IV bolus then 1-4mg/min infusion'},
{g:'Bupivacaine',b:['Marcaine','Sensorcaine'],f:'Inj',s:'0.5% — 20ml',c:'Long-Acting Local Anaesthetic (Spinal/Epidural)',d:'Spinal: 10-20mg (2-4ml of 0.5%) — max dose 2mg/kg'},

// ─────────────────────────────────────────────────────────
// ANTIDOTES / EMERGENCY
// ─────────────────────────────────────────────────────────
{g:'N-Acetylcysteine (Antidote)',b:['Parvolex','NAC','Fluimucil IV'],f:'Inj',s:'200mg/ml',c:'Antidote (Paracetamol Overdose)',d:'Loading: 150mg/kg in 200ml D5W over 60 min — then 50mg/kg over 4hrs — then 100mg/kg over 16hrs'},
{g:'Naloxone',b:['Narcan','Naloxone HCl'],f:'Inj',s:'0.4mg/ml',c:'Opioid Antagonist (Overdose/Reversal)',d:'0.4-2mg IV/IM/SC — repeat every 2-3 min (short acting — repeat doses needed)'},
{g:'Flumazenil',b:['Anexate','Mazicon'],f:'Inj',s:'0.1mg/ml',c:'Benzodiazepine Antagonist',d:'0.2mg IV over 15 sec — may repeat 0.1mg every 60 sec (max 1mg) — short acting'},
{g:'Vitamin K (Phytomenadione)',b:['Konakion','Phytomen','AquaMEPHYTON'],f:'Inj',s:'10mg/ml',c:'Anticoagulant Reversal (Warfarin/Bleeding)',d:'Minor bleed: 1-3mg IV slow — major bleed: 5-10mg IV (with FFP or PCC)'},
{g:'Protamine Sulphate',b:['Protamine Sulphate Inj'],f:'Inj',s:'10mg/ml',c:'Heparin Reversal',d:'1mg per 100 IU of heparin given (max 50mg) — IV over 10 min slowly'},
{g:'Pralidoxime',b:['PAM','2-PAM','Contrathion'],f:'Inj',s:'1g',c:'Antidote (Organophosphate Poisoning)',d:'1-2g IV over 15-30 min — then 0.5g/hr infusion (with atropine)'},
{g:'Activated Charcoal',b:['Carbomix','Actidose-Aqua'],f:'Susp',s:'50g',c:'Poison Adsorption (Within 1 hour of ingestion)',d:'50g (1g/kg child) orally stat — may repeat 25g 4-6 hrly for certain poisons'},
{g:'Fresh Frozen Plasma',b:['FFP','Fresh Frozen Plasma'],f:'IV Drip',s:'200-250ml unit',c:'Blood Product (Coagulopathy/DIC)',d:'10-15ml/kg IV (thaw and use within 4 hrs — must be ABO compatible)'},
{g:'Packed Red Blood Cells',b:['PRBC','Packed Cells','Blood Transfusion'],f:'IV Drip',s:'200-350ml unit',c:'Blood Product (Anaemia/Haemorrhage)',d:'1 unit over 2-4 hrs (crossmatch required — 1 unit raises Hb by ~1g/dl)'},
{g:'Platelets',b:['Platelet Concentrate','Platelet Transfusion'],f:'IV Drip',s:'per unit',c:'Blood Product (Thrombocytopenia/Bleeding)',d:'1 adult therapeutic dose (ATD) IV — aim platelet count >50,000 for procedures'},

// ─────────────────────────────────────────────────────────
// TOPICAL / DERMATOLOGY
// ─────────────────────────────────────────────────────────
{g:'Hydrocortisone',b:['Dermacort','Hycort','Mildison'],f:'Cream',s:'1%',c:'Mild Topical Corticosteroid',d:'Apply thin layer BD x 1-2 weeks (face/flexures)'},
{g:'Betamethasone',b:['Betnovate','Diprosone','Betatrex'],f:'Cream',s:'0.1%',c:'Potent Topical Corticosteroid',d:'Apply thin layer BD (avoid face)'},
{g:'Mometasone',b:['Elocon','Momate'],f:'Cream',s:'0.1%',c:'Topical Corticosteroid',d:'Apply OD (can be used on face with caution)'},
{g:'Mupirocin',b:['Bactroban','Mupiderm','Mupivan'],f:'Oint',s:'2%',c:'Topical Antibiotic (Impetigo/Staph)',d:'Apply TDS x 5-10 days'},
{g:'Fusidic Acid',b:['Fucidin','Fucibact'],f:'Cream',s:'2%',c:'Topical Antibiotic',d:'Apply BD-TDS x 7-14 days'},
{g:'Calamine',b:['Lacto Calamine','Calamatum','Caladryl'],f:'Lotion',s:'',c:'Antipruritic Lotion',d:'Apply TDS PRN (chickenpox, urticaria, rash)'},
{g:'Silver Sulfadiazine',b:['Silverex','Flamazine','SSD Cream'],f:'Cream',s:'1%',c:'Topical (Burns/Wounds)',d:'Apply to burn area OD-BD (with dressing)'},
{g:'Povidone Iodine',b:['Betadine','Wokadine','Videne'],f:'Solution',s:'10%',c:'Antiseptic (Wound/Skin Prep)',d:'Apply to wound/skin BD (dilute 1:10 for cavity irrigation)'},

// ─────────────────────────────────────────────────────────
// HORMONES / GYNAECOLOGY / OBSTETRICS
// ─────────────────────────────────────────────────────────
{g:'Oxytocin',b:['Syntocinon','Pitocin','Oxytocin Inj'],f:'Inj',s:'10 IU/ml',c:'Uterotonic (PPH/Labour Induction)',d:'PPH: 10 IU IM stat or 10-40 IU in 1L NS IV infusion — Induction: 1-4 mIU/min IV'},
{g:'Ergometrine',b:['Syntometrine (with oxytocin)','Ergometrine Inj'],f:'Inj',s:'0.5mg/ml',c:'Uterotonic (PPH)',d:'0.5mg IM or slow IV stat (avoid in hypertension)'},
{g:'Misoprostol',b:['Cytotec','Misoclear','Artrotec (with diclo)'],f:'Tab',s:'200mcg',c:'Prostaglandin (PPH/Cervical Ripening)',d:'PPH: 800mcg sublingual/rectal stat — Cervical ripening: 25-50mcg PV 4-6 hrly'},
{g:'Magnesium Sulphate',b:['MgSO4 Inj'],f:'Inj',s:'50% — 10ml',c:'Anticonvulsant (Eclampsia)',d:'Loading: 4g IV over 20 min then 1-2g/hr maintenance (monitor reflexes and UO)'},
{g:'Progesterone',b:['Duphaston (not progesterone)','Proluton Depot','Gestone'],f:'Inj',s:'25mg/ml',c:'Progestogen Injection',d:'As per gynaecology/obstetrics protocol'},
{g:'Dydrogesterone',b:['Duphaston','Dufaston'],f:'Tab',s:'10mg',c:'Progestogen (Threatened Miscarriage/HRT)',d:'10mg BD-TDS (threatened miscarriage — as per ObGyn guidance)'},
{g:'Clomiphene',b:['Clomid','Serophene'],f:'Tab',s:'50mg',c:'Ovulation Induction',d:'50mg OD days 2-6 of cycle — as per fertility specialist'},
{g:'Tranexamic Acid',b:['Cyklokapron','Traxyl','Hemostop'],f:'Tab',s:'500mg',c:'Antifibrinolytic (Heavy Bleeding)',d:'1g TDS x 4-5 days (menorrhagia) or 1g IV TDS (trauma/surgical bleeding)'},
{g:'Tranexamic Acid',b:['Cyklokapron Inj','Traxyl Inj'],f:'Inj',s:'500mg/5ml',c:'Antifibrinolytic IV (Trauma/Surgical Bleeding)',d:'1g IV over 10 min stat (within 3 hrs of injury) then 1g over 8 hrs'},

// ─────────────────────────────────────────────────────────
// UROLOGICAL / RENAL
// ─────────────────────────────────────────────────────────
{g:'Tamsulosin',b:['Flomax','Urimax','Tamsin'],f:'Cap',s:'0.4mg',c:'Alpha Blocker (BPH)',d:'1 cap OD after breakfast'},
{g:'Finasteride',b:['Proscar','Fincar','Propecia (hair)'],f:'Tab',s:'5mg',c:'5-Alpha Reductase Inhibitor (BPH)',d:'1 tab OD (3-6 months before full effect)'},
{g:'Sildenafil',b:['Viagra','Revatio (PAH)','Silvasta'],f:'Tab',s:'50mg',c:'PDE-5 Inhibitor (ED/PAH)',d:'50mg 1 hour before sexual activity (ED) — PAH: 20mg TDS'},
{g:'Allopurinol',b:['Zyloric','Zyloprim','Aloric'],f:'Tab',s:'100mg',c:'Xanthine Oxidase Inhibitor (Gout Prophylaxis)',d:'Start 100mg OD after acute attack resolves — increase to 300mg OD (with colchicine cover)'},
{g:'Colchicine',b:['Colchicine','Colinets'],f:'Tab',s:'0.5mg',c:'Antigout (Acute Gout)',d:'1mg stat then 0.5mg 1 hour later (max 1.5mg per course) — reduce dose in renal impairment'},

// ─────────────────────────────────────────────────────────
// ANTICOAGULANT / THROMBOLYTIC
// ─────────────────────────────────────────────────────────
{g:'Alteplase (tPA)',b:['Actilyse','Activase'],f:'Inj',s:'50mg',c:'Thrombolytic (STEMI/Massive PE/Stroke)',d:'STEMI: 15mg IV bolus then 0.75mg/kg over 30 min then 0.5mg/kg over 60 min — Stroke (within 4.5hrs): 0.9mg/kg (max 90mg) — specialist use only'},
{g:'Streptokinase',b:['Streptase','Kabikinase'],f:'Inj',s:'1.5 MU',c:'Thrombolytic (STEMI)',d:'1.5 MU in 100ml NS IV over 60 min (alternative to tPA — specialist use)'},

// ─────────────────────────────────────────────────────────
// MISC HOSPITAL DRUGS
// ─────────────────────────────────────────────────────────
{g:'Omeprazole+Domperidone',b:['Omidom','Omez D','Pantozol D'],f:'Cap',s:'20mg+10mg',c:'PPI+Prokinetic Combination',d:'1 cap OD before breakfast (GERD with slow gastric emptying)'},
{g:'Dexamethasone',b:['Decadron','Oradexon','Dexona Tab'],f:'Tab',s:'0.5mg',c:'Corticosteroid Tablet',d:'As per dose — cerebral oedema/allergy/nausea (chemotherapy)'},
{g:'Dexamethasone',b:['Decadron Inj','Dexona Inj'],f:'Inj',s:'4mg/ml',c:'Corticosteroid Injection',d:'4-8mg IV/IM BD — cerebral oedema: 10mg stat then 4mg QID — COVID-19: 6mg OD x 10 days'},
{g:'Furosemide+Spironolactone',b:['Lasilactone','Aldactide'],f:'Tab',s:'20mg+50mg',c:'Diuretic Combination (Ascites/CCF)',d:'1 tab OD morning (ascites: target weight loss 0.5-1kg/day)'},
{g:'Lactulose+Paraffin',b:['Duphalac Plus','Agarol'],f:'Syrup',s:'per 5ml',c:'Laxative Combination',d:'10-15ml BD (constipation)'},
{g:'Anticoagulant Flush',b:['Heparin Flush','Heplock'],f:'Inj',s:'10 IU/ml',c:'IV Line Maintenance Flush',d:'2-3ml to flush and lock IV cannula after each use'},
{g:'Water for Injection',b:['WFI','Sterile Water for Injection'],f:'Inj',s:'10ml',c:'Diluent for Injections',d:'Use as diluent to reconstitute IV drugs — do not give undiluted IV in large volumes'},
];
const EXTRA_DRUGS = [
// ─── ANTI-TB ───
{g:'Rifampicin',b:['Rimactane','Rifadin','Rifaldin'],f:'Cap',s:'300mg',c:'Anti-TB (First Line)',d:'10mg/kg/day OD (empty stomach) — part of DOTS regimen'},
{g:'Isoniazid',b:['INH','Isozid','Rimifon'],f:'Tab',s:'300mg',c:'Anti-TB (First Line)',d:'5mg/kg/day OD (max 300mg) — give with Pyridoxine 25mg OD'},
{g:'Pyrazinamide',b:['Pyrazinamide','PZA','Zinamide'],f:'Tab',s:'500mg',c:'Anti-TB (First Line)',d:'25mg/kg/day OD — monitor LFTs'},
{g:'Ethambutol',b:['Myambutol','EMB','Ethan'],f:'Tab',s:'400mg',c:'Anti-TB (First Line)',d:'15mg/kg/day OD — monitor vision (colour vision test monthly)'},
{g:'Streptomycin',b:['Streptomycin Inj'],f:'Inj',s:'1g',c:'Anti-TB Injectable (2nd Line)',d:'1g IM OD — 5 days/week (hearing/renal monitoring)'},
{g:'Pyridoxine (Vitamin B6)',b:['Benadon','Pyridoxine','B6'],f:'Tab',s:'25mg',c:'Vitamin B6 (TB prophylaxis — with INH)',d:'25mg OD (given with Isoniazid to prevent peripheral neuropathy)'},
{g:'Rifampicin+Isoniazid',b:['Rifinah','Rimactazid','Macrozid'],f:'Tab',s:'150/100mg',c:'Fixed-Dose Anti-TB Combination',d:'As per weight-based DOTS dosing — OD (empty stomach)'},
{g:'Rifampicin+Isoniazid+Pyrazinamide+Ethambutol',b:['Rimstar 4-FDC','Macrocomp'],f:'Tab',s:'150/75/400/275mg',c:'4-Drug Anti-TB FDC',d:'As per weight-based DOTS dosing — OD (empty stomach)'},

// ─── HEPATOLOGY (Hep B/C — very common in Pakistan) ───
{g:'Sofosbuvir',b:['Sovaldi','Sofolanork','Myhep'],f:'Tab',s:'400mg',c:'Direct-Acting Antiviral (Hep C)',d:'400mg OD x 12-24 weeks (with Daclatasvir or Ribavirin — as per genotype)'},
{g:'Sofosbuvir+Daclatasvir',b:['Myhep LVIR','Sofosbuvir+Daclatasvir FDC','Hepcinat Plus'],f:'Tab',s:'400/60mg',c:'DAA Combination (Hep C — all genotypes)',d:'1 tab OD x 12-24 weeks'},
{g:'Sofosbuvir+Velpatasvir',b:['Epclusa','Sofosvel','Velpanat'],f:'Tab',s:'400/100mg',c:'Pan-Genotypic DAA (Hep C)',d:'1 tab OD x 12 weeks (pangenotypic — no genotype testing needed)'},
{g:'Ribavirin',b:['Rebetol','Virazole','Ribavir'],f:'Tab',s:'200mg',c:'Antiviral (Hep C — with Interferon/DAA)',d:'Weight-based: <75kg: 1000mg/day ÷ BD — >75kg: 1200mg/day ÷ BD (with food)'},
{g:'Entecavir',b:['Baraclude','Entavir','Entaliv'],f:'Tab',s:'0.5mg',c:'Nucleoside Analogue (Hep B)',d:'0.5mg OD (empty stomach) — 1mg OD if lamivudine-resistant'},
{g:'Tenofovir Disoproxil',b:['Viread','Tenvir','Ricovir'],f:'Tab',s:'300mg',c:'Nucleotide Analogue (Hep B/HIV)',d:'1 tab OD with food (monitor renal function)'},
{g:'Lamivudine',b:['Zeffix (Hep B)','3TC','Epivir'],f:'Tab',s:'100mg',c:'Nucleoside Analogue (Hep B)',d:'100mg OD (Hep B) — resistance develops — prefer Entecavir/Tenofovir'},
{g:'Ursodeoxycholic Acid',b:['Ursofalk','Ursoliv','UDCA'],f:'Cap',s:'250mg',c:'Hepatoprotective (Cholestasis/NAFLD)',d:'10-15mg/kg/day ÷ BD-TDS with meals'},
{g:'Silymarin (Milk Thistle)',b:['Legalon','Silymarin','Hepaprotect'],f:'Cap',s:'140mg',c:'Hepatoprotective (Adjunct)',d:'1 cap TDS with meals'},
{g:'L-Ornithine L-Aspartate',b:['Hepa-Merz','LOLA','Orniliv'],f:'Inj',s:'10g/10ml',c:'Ammonia-Lowering (Hepatic Encephalopathy)',d:'20-40g IV OD (dilute in 500ml NS/D5W, infuse over 4-8 hrs)'},
{g:'Lactulose',b:['Duphalac','Regulose'],f:'Syrup',s:'3.35g/5ml',c:'Ammonia-Lowering (Hepatic Encephalopathy)',d:'30-45ml TDS-QID (titrate to 2-3 soft stools/day — HE dose)'},
{g:'Rifaximin',b:['Xifaxan','Rifax','Rifagut'],f:'Tab',s:'550mg',c:'Non-Absorbable Antibiotic (HE/IBS)',d:'550mg BD (HE prevention) or 400mg TDS x 3 days (traveller\'s diarrhoea)'},
{g:'Terlipressin',b:['Glypressin','Remestyp'],f:'Inj',s:'1mg',c:'Vasopressin Analogue (Variceal Bleed/HRS)',d:'2mg IV every 4-6 hrs (acute variceal bleed) or 1mg BD (HRS)'},
{g:'Albumin',b:['Human Albumin 20%','Albutein 20%','Albuminat'],f:'Inj',s:'20% 100ml',c:'IV Albumin (SBP/HRS/Post-LVP)',d:'SBP: 1.5g/kg day1 + 1g/kg day3 — Post-LVP: 8g/litre ascites removed'},

// ─── OPHTHALMOLOGY (Eye Drops) ───
{g:'Timolol',b:['Timoptol','Blocadren Eye','Timolet'],f:'Eye Drops',s:'0.5%',c:'Beta Blocker Eye Drop (Glaucoma)',d:'1 drop BD in affected eye(s)'},
{g:'Latanoprost',b:['Xalatan','Latoprost','Monoprost'],f:'Eye Drops',s:'0.005%',c:'Prostaglandin Analogue (Glaucoma)',d:'1 drop OD in the evening'},
{g:'Bimatoprost',b:['Lumigan','Bimat'],f:'Eye Drops',s:'0.03%',c:'Prostaglandin Analogue (Glaucoma)',d:'1 drop OD in the evening'},
{g:'Dorzolamide',b:['Trusopt','Dorzox'],f:'Eye Drops',s:'2%',c:'Carbonic Anhydrase Inhibitor (Glaucoma)',d:'1 drop TDS'},
{g:'Brimonidine',b:['Alphagan','Brimo'],f:'Eye Drops',s:'0.2%',c:'Alpha-2 Agonist (Glaucoma)',d:'1 drop BD-TDS'},
{g:'Ciprofloxacin',b:['Ciloxan','Ciplox Eye','Cipro Eye Drops'],f:'Eye Drops',s:'0.3%',c:'Antibiotic Eye Drop (Conjunctivitis/Corneal Ulcer)',d:'1-2 drops QID x 7 days (corneal ulcer: 1-2 drops every 15 min initially)'},
{g:'Moxifloxacin',b:['Vigamox','Moxivig','Moxicip Eye'],f:'Eye Drops',s:'0.5%',c:'Antibiotic Eye Drop (Bacterial Conjunctivitis)',d:'1 drop TDS x 7 days'},
{g:'Chloramphenicol',b:['Chloromycetin Eye','Minims Chloramphenicol'],f:'Eye Drops',s:'0.5%',c:'Antibiotic Eye Drop',d:'1-2 drops QID x 5-7 days'},
{g:'Prednisolone Acetate',b:['Pred Forte','Omnipred','Predsol Eye'],f:'Eye Drops',s:'1%',c:'Steroid Eye Drop (Uveitis/Post-Op)',d:'1 drop QID (taper as directed — do not stop abruptly)'},
{g:'Dexamethasone',b:['Maxidex','Dexacos Eye','Dexa Eye Drops'],f:'Eye Drops',s:'0.1%',c:'Steroid Eye Drop',d:'1 drop TDS-QID'},
{g:'Sodium Cromoglicate',b:['Opticrom','Cromolux','Crolom Eye'],f:'Eye Drops',s:'2%',c:'Mast Cell Stabiliser (Allergic Conjunctivitis)',d:'1-2 drops QID (use regularly, not PRN)'},
{g:'Olopatadine',b:['Patanol','Olopatadine Eye','Pataday'],f:'Eye Drops',s:'0.1%',c:'Antihistamine Eye Drop (Allergic Conjunctivitis)',d:'1 drop BD'},
{g:'Lubricating Eye Drops',b:['Systane','Refresh Tears','Tears Naturale','Lacrigel'],f:'Eye Drops',s:'per drop',c:'Artificial Tears (Dry Eye)',d:'1-2 drops QID or PRN'},
{g:'Tropicamide',b:['Mydriacyl','Tropicayl'],f:'Eye Drops',s:'1%',c:'Mydriatic (Pupil Dilation)',d:'1-2 drops in affected eye — effect lasts 4-6 hours'},
{g:'Acetazolamide',b:['Diamox','Acetazol'],f:'Tab',s:'250mg',c:'Carbonic Anhydrase Inhibitor (Acute Glaucoma)',d:'250mg QID (acute glaucoma) or 125-250mg BD (prophylaxis altitude sickness)'},
{g:'Atropine',b:['Atropine Eye','Isopto Atropine'],f:'Eye Drops',s:'1%',c:'Cycloplegic Eye Drop (Uveitis)',d:'1 drop OD-BD (uveitis — cycloplegia)'},

// ─── ENT (Ear/Nose) ───
{g:'Ciprofloxacin',b:['Ciloxan Ear','Cipro Ear','Otocip'],f:'Ear Drops',s:'0.3%',c:'Antibiotic Ear Drop (Otitis Externa)',d:'3-4 drops BD-TDS x 7 days (lie with affected ear up for 5 min)'},
{g:'Gentamicin',b:['Garamycin Ear','Gentamicin Ear Drops'],f:'Ear Drops',s:'0.3%',c:'Antibiotic Ear Drop',d:'3-4 drops TDS x 7 days'},
{g:'Betamethasone+Clotrimazole',b:['Canesten HC Ear','Betnesol Ear','Betadine Ear'],f:'Ear Drops',s:'per drop',c:'Steroid+Antifungal Ear Drop (Otitis Externa)',d:'2-3 drops TDS x 7 days'},
{g:'Fluticasone Nasal',b:['Flixonase','Avamys','Flonase'],f:'Nasal Spray',s:'50mcg/spray',c:'Steroid Nasal Spray (Allergic Rhinitis)',d:'2 sprays each nostril OD (morning) — onset 3-7 days'},
{g:'Mometasone Nasal',b:['Nasonex','Rhinocort (budesonide)','Momeflo'],f:'Nasal Spray',s:'50mcg/spray',c:'Steroid Nasal Spray',d:'2 sprays each nostril OD'},
{g:'Xylometazoline',b:['Otrivin','Nasivion','Xymelin'],f:'Nasal Spray',s:'0.1%',c:'Nasal Decongestant (Max 3-5 days)',d:'2-3 sprays each nostril TDS — max 5 days (rebound congestion if longer)'},
{g:'Sodium Chloride Nasal',b:['Sterimar','Nasoclear','Salinex'],f:'Nasal Spray',s:'0.9%',c:'Saline Nasal Wash',d:'2-3 sprays each nostril TDS (safe for any duration — mucociliary clearance)'},
{g:'Beclomethasone Nasal',b:['Beconase','Clenil Nasal','Beclate Nasal'],f:'Nasal Spray',s:'50mcg/spray',c:'Steroid Nasal Spray',d:'2 sprays each nostril BD'},
{g:'Wax Softening Drops',b:['Cerumol','Earex','Otex'],f:'Ear Drops',s:'per drop',c:'Cerumenolytic (Ear Wax)',d:'5 drops in affected ear at bedtime x 3-4 days then syringe'},

// ─── DERMATOLOGY ───
{g:'Isotretinoin',b:['Roaccutane','Acnotin','Isotane'],f:'Cap',s:'20mg',c:'Retinoid (Severe Acne)',d:'0.5-1mg/kg/day OD-BD with food — 16-24 week course (teratogenic — strict counselling)'},
{g:'Tretinoin',b:['Retin-A','Airol','Avita'],f:'Cream',s:'0.025%',c:'Topical Retinoid (Acne/Anti-Ageing)',d:'Apply pea-sized amount at night x alternate nights initially (sunscreen during day)'},
{g:'Benzoyl Peroxide',b:['Panoxyl','Benzac','OXY'],f:'Cream/Gel',s:'2.5%',c:'Topical (Acne)',d:'Apply OD-BD to acne-prone areas (bleaches fabric)'},
{g:'Clindamycin Topical',b:['Dalacin T','Clindac-A','Clindamycin Gel'],f:'Gel',s:'1%',c:'Topical Antibiotic (Acne)',d:'Apply BD to affected areas'},
{g:'Azelaic Acid',b:['Skinoren','Azelaic Acid Cream'],f:'Cream',s:'20%',c:'Topical (Acne/Rosacea)',d:'Apply BD (safe in pregnancy — for acne and rosacea)'},
{g:'Salicylic Acid',b:['Acne-Aid','Stridex','Salicylic Lotion'],f:'Lotion',s:'2%',c:'Keratolytic (Acne/Psoriasis)',d:'Apply OD-BD to affected areas'},
{g:'Clobetasol',b:['Dermovate','Temovate','Clobevate'],f:'Cream',s:'0.05%',c:'Very Potent Topical Corticosteroid',d:'Apply thin layer OD-BD (max 4 weeks — avoid face/flexures)'},
{g:'Tacrolimus',b:['Protopic','Tacroz'],f:'Oint',s:'0.1%',c:'Topical Calcineurin Inhibitor (Eczema)',d:'Apply BD (not for children <2 yrs — alternative to steroids for face/flexures)'},
{g:'Betamethasone+Gentamicin',b:['Gentamicin+Betamethasone Cream','Betnol-N','Diprogenta'],f:'Cream',s:'0.1%/0.1%',c:'Topical Steroid+Antibiotic Combination',d:'Apply BD x 7-14 days (infected eczema/dermatitis)'},
{g:'Betamethasone+Clotrimazole',b:['Canesten HC','Candid-B','Betnesol-C'],f:'Cream',s:'0.1%/1%',c:'Topical Steroid+Antifungal',d:'Apply BD x 2-4 weeks (tinea with inflammation)'},
{g:'Coal Tar',b:['Capasal','T-Gel','Alphosyl'],f:'Shampoo',s:'per application',c:'Antipsoriatic Shampoo',d:'Apply to scalp 2-3x/week (psoriasis/seborrhoeic dermatitis)'},
{g:'Ketoconazole Shampoo',b:['Nizoral','Sebizole Shampoo'],f:'Shampoo',s:'2%',c:'Antifungal Shampoo (Dandruff/Tinea Versicolor)',d:'Apply twice weekly (dandruff) or daily x 5 days (tinea versicolor) — leave 3 min then rinse'},
{g:'Zinc Pyrithione Shampoo',b:['Head&Shoulders','Zinc Shampoo'],f:'Shampoo',s:'1%',c:'Antidandruff Shampoo',d:'Use 2-3x/week'},
{g:'Emollient',b:['Vaseline','Aqueous Cream','E45','CeraVe'],f:'Cream',s:'per application',c:'Emollient/Moisturiser (Eczema/Dry Skin)',d:'Apply liberally BD-TDS — apply before other topicals (20-30 min gap)'},

// ─── RHEUMATOLOGY ───
{g:'Methotrexate',b:['Methofar','MTX','Methotrexate Pharma'],f:'Tab',s:'2.5mg',c:'DMARD (RA/Psoriasis)',d:'7.5-25mg once WEEKLY (not daily — give folate 5mg next day — monitor LFTs/CBC monthly)'},
{g:'Hydroxychloroquine',b:['Plaquenil','Quinoric'],f:'Tab',s:'200mg',c:'Antimalarial/DMARD (RA/SLE/Lupus)',d:'200mg BD (max 5mg/kg/day — annual eye check for maculopathy)'},
{g:'Sulfasalazine',b:['Salazopyrin','Azulfidine'],f:'Tab',s:'500mg',c:'DMARD (RA/IBD)',d:'Start 500mg OD — increase weekly to 1g BD (take with food — monitor CBC)'},
{g:'Leflunomide',b:['Arava','Lefra','Leflunomide Pharma'],f:'Tab',s:'20mg',c:'DMARD (RA)',d:'20mg OD (loading: 100mg OD x 3 days — monitor LFTs monthly)'},
{g:'Colchicine',b:['Colchicine','Colinets','Colgout'],f:'Tab',s:'0.5mg',c:'Antigout (Acute Attack)',d:'1mg stat then 0.5mg 1hr later (max 1.5mg per attack) — reduce dose in renal impairment'},
{g:'Allopurinol',b:['Zyloric','Zyloprim','Aloric'],f:'Tab',s:'100mg',c:'Xanthine Oxidase Inhibitor (Gout Prophylaxis)',d:'Start 100mg OD (after acute attack settled) — increase to 300mg OD (with colchicine cover x 6 months)'},
{g:'Probenecid',b:['Benemid','Probalan'],f:'Tab',s:'500mg',c:'Uricosuric (Gout Prophylaxis)',d:'500mg BD (increase fluids — avoid aspirin — not in renal failure)'},
{g:'Febuxostat',b:['Uloric','Febuget','Febucip'],f:'Tab',s:'40mg',c:'Xanthine Oxidase Inhibitor (Gout — alternative to Allopurinol)',d:'40mg OD (increase to 80mg if urate not controlled)'},
{g:'Prednisolone',b:['Deltacortril','Predsy'],f:'Tab',s:'5mg',c:'Corticosteroid (RA/SLE Flare)',d:'RA flare: 15-30mg OD then taper — SLE: 1mg/kg/day then taper'},
{g:'Diclofenac Gel',b:['Voltaren Gel','Voren Gel','Diclofen Gel'],f:'Gel',s:'1%',c:'Topical NSAID (Soft Tissue/Joint Pain)',d:'Apply 4g to affected area QID (local effect — less GI side effects)'},

// ─── PSYCHIATRY ───
{g:'Lithium Carbonate',b:['Priadel','Litarex','Lithane'],f:'Tab',s:'400mg',c:'Mood Stabiliser (Bipolar)',d:'400mg BD-TDS (titrate to serum level 0.6-1.0 mmol/L — narrow therapeutic index — hydration critical)'},
{g:'Quetiapine',b:['Seroquel','Qutipin','Qutan'],f:'Tab',s:'100mg',c:'Atypical Antipsychotic (Bipolar/Schizophrenia)',d:'Start 25mg BD — increase gradually — bipolar depression: 50mg OD at night'},
{g:'Aripiprazole',b:['Abilify','Arip MT','Aripra'],f:'Tab',s:'10mg',c:'Atypical Antipsychotic (Schizophrenia/Bipolar)',d:'10-15mg OD — lower metabolic side effects than others'},
{g:'Clozapine',b:['Clozaril','Sizopin'],f:'Tab',s:'100mg',c:'Atypical Antipsychotic (Treatment-Resistant Schizophrenia)',d:'As per psychiatry guidance — mandatory weekly/fortnightly CBC (agranulocytosis risk)'},
{g:'Venlafaxine',b:['Effexor','Alventa','Venlor'],f:'Tab',s:'75mg',c:'SNRI Antidepressant',d:'75mg OD (SR) — increase to 150mg after 4 weeks if needed'},
{g:'Mirtazapine',b:['Remeron','Zispin','Mirtaz'],f:'Tab',s:'15mg',c:'NaSSA Antidepressant (also sedating/appetite stimulant)',d:'15mg OD at night — increase to 30-45mg if needed'},
{g:'Buspirone',b:['Buspar','Buspin'],f:'Tab',s:'5mg',c:'Non-Benzodiazepine Anxiolytic',d:'5mg TDS — increase to 10mg TDS (takes 2-4 weeks — no dependence)'},
{g:'Zolpidem',b:['Ambien','Stilnoct','Nytamel'],f:'Tab',s:'10mg',c:'Non-Benzodiazepine Hypnotic (Insomnia)',d:'10mg at bedtime (max 7-10 days — habit forming)'},
{g:'Melatonin',b:['Circadin','Melatonin Sandoz'],f:'Tab',s:'2mg',c:'Melatonin (Insomnia/Jet Lag)',d:'2mg 1-2 hrs before bedtime (safe for elderly — no dependence)'},
{g:'Trihexyphenidyl',b:['Artane','Pacitane'],f:'Tab',s:'2mg',c:'Anticholinergic (EPS from Antipsychotics)',d:'2mg BD-TDS (for extrapyramidal side effects from antipsychotics)'},
{g:'Procyclidine',b:['Kemadrin'],f:'Tab',s:'5mg',c:'Anticholinergic (EPS)',d:'2.5-5mg TDS (for EPS from antipsychotics)'},

// ─── CONTRACEPTIVES ───
{g:'Combined OCP (Ethinylestradiol+Levonorgestrel)',b:['Microgynon','Trinordiol','Nordette','Lo-Femenal'],f:'Tab',s:'30mcg/150mcg',c:'Combined Oral Contraceptive (COC)',d:'1 tab OD (start day 1 of period) x 21 days then 7-day break — or 28-day pack'},
{g:'Progestogen-Only Pill (Norethisterone)',b:['Noriday','Micronor','Primolut N (norethisterone)'],f:'Tab',s:'350mcg',c:'Progestogen-Only Pill (POP — Mini-Pill)',d:'1 tab OD at same time every day (no break — suitable breastfeeding/over 35)'},
{g:'Emergency Contraception (Levonorgestrel)',b:['Postinor-2','Plan B','Unwanted 72','Norlevo'],f:'Tab',s:'1.5mg',c:'Emergency Contraception (Morning-After Pill)',d:'1.5mg stat or 750mcg x 2 (12 hrs apart) — within 72 hrs of unprotected intercourse'},
{g:'Depo-Provera',b:['Depo-Provera','Medroxyprogesterone Inj'],f:'Inj',s:'150mg/ml',c:'Injectable Contraceptive (3-Monthly)',d:'150mg IM every 12 weeks (first dose during period or within 5 days of onset)'},
{g:'Norethisterone',b:['Primolut N','Aygestin','Noristerat'],f:'Tab',s:'5mg',c:'Progestogen (Period Delay/Dysfunctional Uterine Bleeding)',d:'Period delay: 5mg TDS start 3 days before expected period — DUB: 5mg TDS x 10 days'},
{g:'Tranexamic Acid',b:['Cyklokapron','Traxyl','Hemostop'],f:'Tab',s:'500mg',c:'Antifibrinolytic (Menorrhagia)',d:'1g TDS x 4-5 days from start of period'},

// ─── PAEDIATRIC-SPECIFIC ───
{g:'Salbutamol',b:['Ventolin Mini-Spacer','Asthalin Respules'],f:'Nebuliser',s:'0.15mg/kg/dose',c:'SABA (Paediatric Acute Asthma)',d:'0.15mg/kg (min 2.5mg, max 5mg) via nebuliser every 20 min x 3 doses in acute attack'},
{g:'Oral Rehydration Therapy',b:['Pedialyte','Gastrolyte','Oralyte'],f:'Sachet',s:'per sachet',c:'ORS (Paediatric Diarrhoea)',d:'WHO plan A: 10ml/kg after each loose stool — Plan B (some dehydration): 75ml/kg over 4 hrs'},
{g:'Zinc (Paediatric)',b:['Zincovit Syrup','Zinc Sulphate Syrup','Zinco Syrup'],f:'Syrup',s:'10mg/5ml',c:'Zinc (Paediatric Diarrhoea Adjunct)',d:'<6 months: 10mg OD x 14 days — >6 months: 20mg OD x 14 days (with ORS)'},
{g:'Amoxicillin',b:['Amoxil Drops','Ospamox Drops'],f:'Drops',s:'50mg/ml',c:'Antibiotic (Infant)',d:'Child <3 months: 30mg/kg/day ÷ BD — Infant/child: 25mg/kg/day ÷ TDS'},
{g:'Paracetamol',b:['Panadol Baby Drops','Calpol Drops'],f:'Drops',s:'80mg/ml',c:'Analgesic/Antipyretic (Infant)',d:'10-15mg/kg/dose every 4-6 hrs PRN (max 5 doses/24hrs)'},
{g:'Vitamin A',b:['Vitamin A Capsule','Aquasol A'],f:'Cap',s:'200,000 IU',c:'Vitamin A (Measles/Night Blindness)',d:'200,000 IU stat (measles in children >1yr) — 100,000 IU (6-12 months)'},
{g:'Iron Drops',b:['Ferrodan Drops','Palafer Drops','Iberet Drops'],f:'Drops',s:'75mg/ml',c:'Iron (Infant Anaemia)',d:'3-5mg/kg/day elemental iron ÷ OD-BD (give between meals with Vit C juice)'},
{g:'Gripe Water',b:['Woodward\'s Gripe Water','Bonnisan','Baby Gripe Water'],f:'Drops',s:'per dose',c:'Infant Colic (Symptomatic)',d:'5ml after feeds PRN (contains dill seed oil — safe, limited evidence)'},
{g:'Nystatin',b:['Mycostatin Drops','Nystat Drops'],f:'Drops',s:'100,000 IU/ml',c:'Antifungal (Oral Candida in Infants)',d:'1ml QID — apply to each side of mouth after feeds x 7 days'},

// ─── ONCOLOGY SUPPORTIVE CARE ───
{g:'Granisetron',b:['Kytril','Graniron'],f:'Tab',s:'1mg',c:'Antiemetic (Chemotherapy-Induced)',d:'1mg BD (on chemo days — start 1hr before)'},
{g:'Ondansetron (High-Dose)',b:['Zofran','Emset'],f:'Inj',s:'8mg/4ml',c:'Antiemetic (Chemotherapy-Induced)',d:'8mg IV 30 min before chemo — then 8mg IV BD x 1-2 days'},
{g:'Dexamethasone',b:['Decadron','Dexona'],f:'Inj',s:'8mg/2ml',c:'Antiemetic Adjunct (Chemotherapy)',d:'8mg IV 30 min before chemo (with serotonin antagonist)'},
{g:'Filgrastim (G-CSF)',b:['Neupogen','Zarzio','Granocyte'],f:'Inj',s:'300mcg/ml',c:'G-CSF (Neutropenia/Bone Marrow Recovery)',d:'5mcg/kg/day SC OD (start 24 hrs after chemo — continue until neutrophil recovery)'},
{g:'Allopurinol',b:['Zyloric','Zyloprim'],f:'Tab',s:'300mg',c:'Xanthine Oxidase Inhibitor (Tumour Lysis Prophylaxis)',d:'300mg OD (start 1-2 days before chemo in high-risk tumour lysis syndrome)'},
{g:'Rasburicase',b:['Fasturtec','Elitek'],f:'Inj',s:'1.5mg',c:'Urate Oxidase (Tumour Lysis Syndrome)',d:'0.2mg/kg IV OD x 5 days (specialist use — G6PD screen first)'},
{g:'Morphine (Palliative)',b:['Morphine Sulphate SR','MST Continus','Oramorph'],f:'Tab',s:'10mg',c:'Opioid (Palliative/Cancer Pain)',d:'Start 5-10mg 4-hrly (IR) or 30mg BD (SR) — titrate to pain response'},

// ─── THALASSAEMIA (common in Pakistan) ───
{g:'Deferasirox',b:['Exjade','Jadenu','Desirox'],f:'Tab',s:'500mg',c:'Iron Chelator (Transfusion-Dependent Thalassaemia)',d:'20mg/kg/day OD (dispersible — dissolve in water/juice — on empty stomach)'},
{g:'Deferoxamine',b:['Desferal','DFO'],f:'Inj',s:'500mg',c:'Iron Chelator (Thalassaemia — SC Infusion)',d:'20-40mg/kg/day SC over 8-12 hrs (overnight infusion via pump x 5 nights/week)'},
{g:'Deferiprone',b:['Ferriprox','Kelfer'],f:'Tab',s:'500mg',c:'Iron Chelator (Oral — Thalassaemia)',d:'75mg/kg/day ÷ TDS with meals (monitor CBC weekly — agranulocytosis risk)'},
{g:'Hydroxyurea',b:['Hydrea','Droxia','Siklos'],f:'Cap',s:'500mg',c:'Cytoreductive (Sickle Cell/Thalassaemia)',d:'15mg/kg/day OD — increase every 8-12 weeks (monitor CBC regularly)'},
{g:'Folic Acid (High-Dose)',b:['Folvite 5mg','Folinext 5mg'],f:'Tab',s:'5mg',c:'Folate (Haemolytic Anaemia/Thalassaemia)',d:'5mg OD (lifelong in haemolytic anaemias to prevent megaloblastic crisis)'},

// ─── COMMON COMBINATIONS (Pakistan-specific) ───
{g:'Ofloxacin+Ornidazole',b:['Zenflox OZ','Oflonida','Norflox-OZ','Orflox'],f:'Tab',s:'200/500mg',c:'Fluoroquinolone+Nitroimidazole Combination',d:'1 tab BD x 5-7 days (GI infections — diarrhoea with bacterial+protozoal cover)'},
{g:'Amoxicillin+Cloxacillin',b:['Ampiclox','Amoxyclav (different)','Cloxamox'],f:'Cap',s:'250/250mg',c:'Penicillin Combination (Skin/Soft Tissue)',d:'1 cap QID x 7 days (empty stomach)'},
{g:'Trimethoprim+Polymyxin',b:['Polytrim Eye','Polyfax'],f:'Eye Drops',s:'per drop',c:'Antibiotic Eye Drop Combination',d:'1-2 drops QID x 5-7 days'},
{g:'Ibuprofen+Paracetamol',b:['Combiflam','Maxigesic','Ibuflam'],f:'Tab',s:'400/325mg',c:'NSAID+Analgesic Combination',d:'1 tab TDS after meals (max 3 days — stepped analgesia)'},
{g:'Chlorpheniramine+Pseudoephedrine',b:['Actifed','Deconamine','Triaminic'],f:'Tab',s:'4/60mg',c:'Antihistamine+Decongestant (Cold/Allergy)',d:'1 tab TDS (max 3-5 days for nasal congestion component)'},
{g:'Diclofenac+Misoprostol',b:['Arthrotec','Napratec'],f:'Tab',s:'50/200mcg',c:'NSAID+Gastroprotective Combination',d:'1 tab BD-TDS after meals (gastroprotective cover for NSAID)'},
];

const DIAGNOSES = [
  'Viral URTI (Common Cold)','Influenza (Flu)','Acute Pharyngitis / Tonsillitis',
  'Bacterial Pharyngitis (Streptococcal)','Acute Otitis Media','Sinusitis (Acute)',
  'Allergic Rhinitis','Community-Acquired Pneumonia (CAP)','Bronchitis (Acute)',
  'Bronchial Asthma (Acute Exacerbation)','Bronchial Asthma (Stable)','COPD Exacerbation',
  'Pulmonary Tuberculosis (PTB)','COVID-19 (Mild)','COVID-19 (Moderate)','COVID-19 (Severe)',
  'Viral Gastroenteritis','Acute Gastroenteritis with Dehydration',
  'Peptic Ulcer Disease (PUD)','GERD (Acid Reflux)','Irritable Bowel Syndrome (IBS)',
  'Acute Appendicitis','Cholecystitis (Acute)','Pancreatitis (Acute)',
  'Hepatitis A (Acute)','Hepatitis B (Chronic)','Hepatitis C (Chronic)','Liver Cirrhosis',
  'Spontaneous Bacterial Peritonitis (SBP)','Hepatic Encephalopathy','Upper GI Bleed',
  'Lower GI Bleed','Acute Bowel Obstruction',
  'Urinary Tract Infection (UTI)','Acute Pyelonephritis','Urolithiasis (Kidney Stones)',
  'Benign Prostatic Hyperplasia (BPH)','Acute Urinary Retention',
  'Typhoid Fever (Enteric Fever)','Dengue Fever','Dengue Haemorrhagic Fever (DHF)',
  'Dengue Shock Syndrome (DSS)','Malaria — Plasmodium Vivax','Malaria — Plasmodium Falciparum',
  'Brucellosis','Typhus','Leptospirosis',
  'Hypertension (Essential)','Hypertensive Urgency','Hypertensive Emergency',
  'Type 2 Diabetes Mellitus (Uncontrolled)','Type 2 Diabetes Mellitus (Controlled)',
  'Type 1 Diabetes Mellitus','Diabetic Ketoacidosis (DKA)','Hyperosmolar Hyperglycaemic State (HHS)',
  'Hypoglycaemia','Hyperlipidaemia','Metabolic Syndrome',
  'Hypothyroidism','Hyperthyroidism','Thyroid Storm',
  'Ischaemic Heart Disease (IHD)','Acute Coronary Syndrome (ACS) — NSTEMI',
  'Acute Coronary Syndrome (ACS) — STEMI','Congestive Heart Failure (CHF)',
  'Atrial Fibrillation','Ventricular Tachycardia (VT)','Supraventricular Tachycardia (SVT)',
  'Deep Vein Thrombosis (DVT)','Pulmonary Embolism (PE)',
  'Iron Deficiency Anaemia','Anaemia (Chronic Disease)','Haemolytic Anaemia',
  'Vitamin B12 Deficiency','Folate Deficiency',
  'Acute Kidney Injury (AKI)','Chronic Kidney Disease (CKD)','Nephrotic Syndrome',
  'Hyperkalaemia','Hypokalaemia','Hyponatraemia','Hypernatraemia','Hypocalcaemia',
  'Migraine (Acute Attack)','Tension-Type Headache','Cluster Headache',
  'Epilepsy (Generalised Tonic-Clonic)','Epilepsy (Focal)','Status Epilepticus',
  'Ischaemic Stroke','Haemorrhagic Stroke','TIA (Transient Ischaemic Attack)',
  'Meningitis (Bacterial)','Meningitis (Viral)','Encephalitis',
  'Guillain-Barré Syndrome','Bell\'s Palsy',
  'Anxiety Disorder (GAD)','Panic Disorder','Major Depressive Disorder',
  'Bipolar Disorder','Schizophrenia','Acute Psychosis',
  'Sepsis','Septic Shock','SIRS (Systemic Inflammatory Response Syndrome)',
  'Anaphylaxis','Anaphylactic Shock',
  'Scabies','Tinea Corporis (Ringworm)','Tinea Pedis','Tinea Versicolor',
  'Impetigo','Cellulitis','Abscess (Superficial)','Wound Infection','Burn Injury',
  'Fracture (Closed — for referral)','Fracture (Open — emergency)',
  'Soft Tissue Injury / Sprain','Dislocation',
  'Low Back Pain (Mechanical)','Osteoarthritis','Rheumatoid Arthritis',
  'Gout (Acute Attack)','Osteoporosis','Vitamin D Deficiency','Rickets',
  'Protein-Energy Malnutrition','Iron Deficiency (without anaemia)',
  'Neonatal Jaundice (Physiological)','Neonatal Sepsis','Neonatal Hypoglycaemia',
  'Acute Respiratory Distress Syndrome (ARDS)','Pleural Effusion',
  'Pneumothorax','Haemothorax',
  'Organophosphate Poisoning','Paracetamol Overdose','Opioid Overdose',
  'Benzodiazepine Overdose','Corrosive Ingestion',
  'Pre-Eclampsia','Eclampsia','Gestational Diabetes','Antepartum Haemorrhage (APH)',
  'Postpartum Haemorrhage (PPH)','Threatened Miscarriage',
];

// ── Combine ALL drugs: built-in + extra ───────────────────
// DRUGS_ALL is used for search; doctors can also add custom drugs
let DRUGS_ALL = [...DRUGS, ...EXTRA_DRUGS];

// ── Favourites & custom drugs (per doctor, saved in browser) ─
// Key: 'rx_favs_<uid>' → Array of drug objects {g,b,f,s,c,d, custom:true}
// Key: 'rx_custom_<uid>' → Array of custom drugs added by this doctor
// Key: 'rx_pending_custom' → Array of new drug requests for admin review

function getFavKey()    { return 'rx_favs_'    + (window._CU_UID || 'default'); }
function getCustomKey() { return 'rx_custom_'  + (window._CU_UID || 'default'); }

function loadFavs() {
  try { return JSON.parse(localStorage.getItem(getFavKey()) || '[]'); } catch { return []; }
}
function saveFavs(favs) {
  try { localStorage.setItem(getFavKey(), JSON.stringify(favs)); } catch {}
}
function loadCustom() {
  try { return JSON.parse(localStorage.getItem(getCustomKey()) || '[]'); } catch { return []; }
}
function saveCustom(custom) {
  try { localStorage.setItem(getCustomKey(), JSON.stringify(custom)); } catch {}
  // Merge custom drugs into search pool
  DRUGS_ALL = [...DRUGS, ...EXTRA_DRUGS, ...custom];
}

// ── Pending new drug requests (for admin to review) ───────
function getPendingRequests() {
  try { return JSON.parse(localStorage.getItem('rx_pending_custom') || '[]'); } catch { return []; }
}
function addPendingRequest(drug, requestedBy) {
  const pending = getPendingRequests();
  pending.push({ ...drug, requestedBy, requestedAt: new Date().toISOString() });
  try { localStorage.setItem('rx_pending_custom', JSON.stringify(pending)); } catch {}
}

// ── Init: load custom drugs into search pool on startup ───
export function rxInit(uid) {
  if (uid) window._CU_UID = uid;
  const custom = loadCustom();
  DRUGS_ALL = [...DRUGS, ...EXTRA_DRUGS, ...custom];
}

// ── Spell correction ──────────────────────────────────────
function spellCorrect(query) {
  const ql = query.toLowerCase().trim();
  // Direct lookup in spell correction table
  if (SPELL_CORRECTIONS[ql]) return SPELL_CORRECTIONS[ql];
  // Fuzzy: if 1 char off from a drug name (Levenshtein distance 1)
  if (ql.length < 4) return null;
  for (const [misspell, correct] of Object.entries(SPELL_CORRECTIONS)) {
    if (Math.abs(misspell.length - ql.length) > 2) continue;
    if (levenshtein(misspell, ql) <= 2) return correct;
  }
  // Also check drug names directly
  for (const d of DRUGS_ALL) {
    const gn = d.g.toLowerCase();
    if (levenshtein(gn, ql) === 1) return d.g;
    for (const b of d.b) {
      if (levenshtein(b.toLowerCase(), ql) === 1) return b;
    }
  }
  return null;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── Search ────────────────────────────────────────────────
const FORM_MAP = {
  'inj':'Inj','injection':'Inj','inject':'Inj','ampoule':'Inj','amp':'Inj',
  'drip':'IV Drip','iv':'IV Drip','fluid':'IV Drip','infusion':'IV Drip',
  'syrup':'Syrup','syr':'Syrup','suspension':'Syrup',
  'tab':'Tab','tablet':'Tab','tabs':'Tab',
  'cap':'Cap','capsule':'Cap','caps':'Cap',
  'cream':'Cream','oint':'Oint','ointment':'Oint','gel':'Gel',
  'nebuliser':'Nebuliser','neb':'Nebuliser','respule':'Nebuliser','nebulizer':'Nebuliser',
  'inhaler':'Inhaler','puff':'Inhaler','mdi':'Inhaler',
  'supp':'Supp','suppository':'Supp','pr':'Supp',
  'drop':'Drops','drops':'Drops','eye':'Eye Drops','ear':'Ear Drops',
  'sachet':'Sachet','nasal':'Nasal Spray','spray':'Nasal Spray',
  'lotion':'Lotion','solution':'Solution','shampoo':'Shampoo',
  'patch':'Patch','blood':'IV Drip','blood product':'IV Drip',
};

function searchDrugs(q, favs) {
  if (!q || q.length < 2) return { results: [], correction: null };
  const ql = q.toLowerCase().trim();

  // Check spell correction
  let correction = null;
  if (!searchRaw(ql).length) {
    const corrected = spellCorrect(ql);
    if (corrected) correction = corrected;
  }

  // Form search
  const targetForm = FORM_MAP[ql] || Object.values(FORM_MAP).find(v => ql === v.toLowerCase());

  const score = d => {
    const gn = d.g.toLowerCase();
    const bn = d.b.join(' ').toLowerCase();
    const cl = (d.c || '').toLowerCase();
    const fm = (d.f || '').toLowerCase();
    const isFav = favs.some(f => f.g === d.g && f.f === d.f && f.s === d.s);

    if (targetForm) {
      const match = d.f === targetForm || d.f.toLowerCase().includes(targetForm.toLowerCase());
      return match ? (isFav ? 10 : 2) : 0;
    }
    if (gn === ql || d.b.some(b => b.toLowerCase() === ql)) return isFav ? 15 : 5;
    if (gn.startsWith(ql)) return isFav ? 14 : 4;
    if (d.b.some(b => b.toLowerCase().startsWith(ql))) return isFav ? 13 : 3;
    if (gn.includes(ql) || bn.includes(ql)) return isFav ? 12 : 2;
    if (cl.includes(ql) || fm.includes(ql)) return isFav ? 11 : 1;
    return 0;
  };

  const results = DRUGS_ALL
    .map(d => ({ d, s: score(d) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map(x => x.d);

  return { results, correction };
}

function searchRaw(ql) {
  return DRUGS_ALL.filter(d => {
    const gn = d.g.toLowerCase();
    const bn = d.b.join(' ').toLowerCase();
    return gn.includes(ql) || bn.includes(ql) || (d.c||'').toLowerCase().includes(ql);
  });
}

function searchDiagnoses(q) {
  if (!q || q.length < 2) return [];
  const ql = q.toLowerCase();
  return DIAGNOSES.filter(d => d.toLowerCase().includes(ql)).slice(0, 7);
}

function getCurrentLine(ta) {
  const text = ta.value, cursor = ta.selectionStart;
  let start = cursor;
  while (start > 0 && text[start - 1] !== '\n') start--;
  return text.slice(start, cursor).trim();
}

// ── State ─────────────────────────────────────────────────
let _acIdx = -1, _acWord = '', _acResults = [], _acCorrection = null;

// ── Main textarea autocomplete ────────────────────────────
export function rxMedAC(textarea) {
  const word = getCurrentLine(textarea);
  _acWord = word; _acIdx = -1;
  const list = document.getElementById('rx-ac-list');
  if (!list) return;

  if (word.length < 2) { list.style.display = 'none'; return; }

  const favs = loadFavs();
  const { results, correction } = searchDrugs(word, favs);
  _acResults = results;
  _acCorrection = correction;

  let html = '';

  // Spell correction suggestion
  if (correction && !results.length) {
    html += `<div class="rx-ac-item" style="background:var(--color-background-warning);cursor:pointer"
                  onclick="rxApplyCorrection('${encodeURIComponent(correction)}')">
               <span style="font-size:12px;color:var(--color-text-warning);">
                 ✏ Did you mean: <strong>${correction}</strong>?
               </span>
             </div>`;
  }

  if (results.length) {
    const favIds = new Set(favs.map(f => f.g + '|' + f.f + '|' + f.s));
    html += results.map((d, i) => {
      const isFav = favIds.has(d.g + '|' + d.f + '|' + d.s);
      const pb = d.b[0];
      const ob = d.b.slice(1, 4).join(' / ');
      const isCustom = d.custom;
      return `<div class="rx-ac-item" data-i="${i}" onmousedown="event.preventDefault()" onclick="rxPickMed(${i})">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="flex:1;min-width:0;">
            ${isFav ? '<span style="color:#d69e2e;font-size:12px;">★ </span>' : ''}
            ${isCustom ? '<span style="color:var(--color-text-info);font-size:10px;">[Custom] </span>' : ''}
            <span class="drug-name">${pb}</span>
            <span style="font-size:11px;color:var(--color-text-secondary);margin-left:6px;">${d.f} ${d.s}</span>
            ${ob ? `<span style="font-size:10px;color:var(--color-text-secondary);margin-left:4px;">· ${ob}</span>` : ''}
            <br><span style="font-size:11px;color:var(--color-text-secondary);">${d.g} · ${d.c}</span>
          </div>
          <button style="flex-shrink:0;background:none;border:1px solid var(--color-border-tertiary);border-radius:5px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--color-text-secondary);"
                  onmousedown="event.preventDefault();event.stopPropagation()"
                  onclick="event.stopPropagation();rxToggleFav(${i})"
                  title="${isFav ? 'Remove from favourites' : 'Add to favourites'}">
            ${isFav ? '★ Saved' : '☆ Fav'}
          </button>
        </div>
      </div>`;
    }).join('');
  }

  // "Add custom drug" option if no results (and no spell suggestion helped)
  if (!results.length && !correction) {
    html += `<div class="rx-ac-item" style="cursor:pointer;color:var(--color-text-info);"
                  onclick="rxOpenAddCustom('${encodeURIComponent(word)}')">
               <span style="font-size:12px;">+ Add "<strong>${word}</strong>" as a custom drug / request for database</span>
             </div>`;
  } else {
    html += `<div style="padding:6px 14px;font-size:10px;color:var(--color-text-secondary);border-top:1px solid var(--color-border-tertiary);display:flex;justify-content:space-between;">
               <span>Tab = accept · ↑↓ = navigate · Esc = close</span>
               <span style="cursor:pointer;color:var(--color-text-info);" onclick="rxOpenAddCustom('')">+ Add custom drug</span>
             </div>`;
  }

  list.innerHTML = html;
  list.style.display = 'block';
}

// ── Apply spell correction ────────────────────────────────
export function rxApplyCorrection(encoded) {
  const corrected = decodeURIComponent(encoded);
  const ta = document.getElementById('rx-txt'); if (!ta) return;
  const text = ta.value, cursor = ta.selectionStart;
  let lineStart = cursor;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
  const before = text.slice(0, lineStart), after = text.slice(cursor);
  ta.value = before + corrected + after;
  ta.selectionStart = ta.selectionEnd = (before + corrected).length;
  ta.focus();
  rxMedAC(ta);
}

// ── Toggle favourite ──────────────────────────────────────
export function rxToggleFav(idx) {
  const drug = _acResults[idx]; if (!drug) return;
  const favs = loadFavs();
  const key = drug.g + '|' + drug.f + '|' + drug.s;
  const existing = favs.findIndex(f => f.g + '|' + f.f + '|' + f.s === key);
  if (existing >= 0) {
    favs.splice(existing, 1);
  } else {
    favs.unshift(drug); // add to front
  }
  saveFavs(favs);
  // Re-render the list to update star
  const ta = document.getElementById('rx-txt');
  if (ta) rxMedAC(ta);
}

// ── Pick drug and insert line ─────────────────────────────
export function rxPickMed(idx) {
  const drug = _acResults[idx]; if (!drug) return;
  const ta = document.getElementById('rx-txt'); if (!ta) return;
  const line = `${drug.f}. ${drug.b[0]} ${drug.s} — ${drug.d}\n`;
  const text = ta.value, cursor = ta.selectionStart;
  let lineStart = cursor;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
  const before = text.slice(0, lineStart), after = text.slice(cursor);
  ta.value = before + line + after;
  ta.selectionStart = ta.selectionEnd = (before + line).length;
  ta.focus();
  document.getElementById('rx-ac-list').style.display = 'none';
  _acResults = []; _acIdx = -1;
}

// ── Keyboard navigation ───────────────────────────────────
export function rxMedKey(event) {
  const list = document.getElementById('rx-ac-list');
  if (!list || list.style.display === 'none') return;
  const items = list.querySelectorAll('.rx-ac-item[data-i]');
  if (event.key === 'ArrowDown') {
    event.preventDefault(); _acIdx = Math.min(_acIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('selected', i === _acIdx));
    items[_acIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowUp') {
    event.preventDefault(); _acIdx = Math.max(_acIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('selected', i === _acIdx));
    items[_acIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Tab') {
    if (_acResults.length > 0) { event.preventDefault(); rxPickMed(_acIdx >= 0 ? _acIdx : 0); }
  } else if (event.key === 'Escape') {
    list.style.display = 'none'; _acIdx = -1;
  }
}

// ── Diagnosis autocomplete ────────────────────────────────
export function rxDiagAC(input) {
  const q = input.value.trim();
  const list = document.getElementById('rx-diag-ac');
  if (!list) return;
  const matches = searchDiagnoses(q);
  if (!matches.length) { list.style.display = 'none'; return; }
  list.innerHTML = matches
    .map(d => `<div class="rx-ac-item" onmousedown="event.preventDefault()" onclick="rxPickDiag('${encodeURIComponent(d)}')">
                 <span class="drug-name">${d}</span>
               </div>`)
    .join('');
  list.style.display = 'block';
}
export function rxPickDiag(encoded) {
  const diag = decodeURIComponent(encoded);
  const input = document.getElementById('rx-diag');
  if (input) input.value = diag;
  document.getElementById('rx-diag-ac').style.display = 'none';
}

// ── Favourites management page (opens modal) ──────────────
export function rxOpenFavsManager() {
  const favs = loadFavs();
  const modal = document.getElementById('mo-rx-favs');
  if (!modal) { buildFavsModal(); return; }
  renderFavsModal(favs);
  if (typeof openMo === 'function') openMo('mo-rx-favs');
}

function buildFavsModal() {
  const div = document.createElement('div');
  div.className = 'mo'; div.id = 'mo-rx-favs';
  div.innerHTML = `<div class="md" style="max-width:600px;">
    <div class="mh">
      <h3>⭐ My Favourites & Custom Drugs</h3>
      <button class="mclose" onclick="closeMo('mo-rx-favs')">×</button>
    </div>
    <div id="favs-body" style="padding:4px 0;"></div>
  </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e => { if (e.target === div && typeof closeMo === 'function') closeMo('mo-rx-favs'); });
  renderFavsModal(loadFavs());
  if (typeof openMo === 'function') openMo('mo-rx-favs');
}

function renderFavsModal(favs) {
  const custom = loadCustom();
  const pending = getPendingRequests();
  const isAdmin = window._CU_ROLE === 'admin';
  let html = '';

  // Favourites section
  html += `<div style="padding:14px 22px 0;">
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-secondary);margin-bottom:10px;">
      Starred Favourites (${favs.length}) — appear at top of search
    </div>`;
  if (favs.length) {
    html += favs.map((d, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border-tertiary);">
        <div>
          <strong style="font-size:13px;">${d.b[0]}</strong>
          <span style="font-size:11px;color:var(--color-text-secondary);margin-left:6px;">${d.f} ${d.s}</span><br>
          <span style="font-size:11px;color:var(--color-text-secondary);">${d.g} · ${d.c}</span>
        </div>
        <button onclick="rxRemoveFav(${i})" style="background:none;border:1px solid var(--color-border-tertiary);border-radius:5px;padding:3px 9px;font-size:11px;cursor:pointer;color:var(--color-text-danger);">Remove</button>
      </div>`).join('');
  } else {
    html += '<div style="color:var(--color-text-secondary);font-size:13px;padding:8px 0;">No favourites yet. Search for a drug and click ☆ Fav to save it.</div>';
  }
  html += '</div>';

  // Custom drugs section
  html += `<div style="padding:14px 22px 0;margin-top:4px;">
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-secondary);margin-bottom:10px;">
      My Custom Drugs (${custom.length}) — drugs you added that are not in the database
    </div>`;
  if (custom.length) {
    html += custom.map((d, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border-tertiary);">
        <div>
          <strong style="font-size:13px;">${d.b[0]}</strong>
          <span style="font-size:11px;color:var(--color-text-secondary);margin-left:6px;">${d.f} ${d.s}</span><br>
          <span style="font-size:11px;color:var(--color-text-secondary);">${d.g} · ${d.c}</span>
        </div>
        <button onclick="rxRemoveCustom(${i})" style="background:none;border:1px solid var(--color-border-tertiary);border-radius:5px;padding:3px 9px;font-size:11px;cursor:pointer;color:var(--color-text-danger);">Remove</button>
      </div>`).join('');
  } else {
    html += '<div style="color:var(--color-text-secondary);font-size:13px;padding:8px 0;">No custom drugs yet.</div>';
  }
  html += '</div>';

  // Pending requests (admin only)
  if (isAdmin && pending.length) {
    html += `<div style="padding:14px 22px;margin-top:4px;background:var(--color-background-info);border-radius:8px;margin:14px 22px;">
      <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-info);margin-bottom:8px;">
        📋 Pending Drug Requests from Doctors (${pending.length})
      </div>`;
    html += pending.map((d, i) => `
      <div style="padding:8px 0;border-bottom:1px solid var(--color-border-secondary);font-size:13px;">
        <strong>${d.b[0]}</strong> — ${d.g} — ${d.f} ${d.s}<br>
        <span style="font-size:11px;color:var(--color-text-secondary);">Requested by: ${d.requestedBy} · ${new Date(d.requestedAt).toLocaleDateString()}</span>
      </div>`).join('');
    html += '</div>';
  }

  // Add custom drug button
  html += `<div style="padding:14px 22px;">
    <button class="btn bt bsm" onclick="rxOpenAddCustom('')">+ Add Custom Drug</button>
  </div>`;

  const body = document.getElementById('favs-body');
  if (body) body.innerHTML = html;
}

export function rxRemoveFav(idx) {
  const favs = loadFavs();
  favs.splice(idx, 1);
  saveFavs(favs);
  renderFavsModal(favs);
}

export function rxRemoveCustom(idx) {
  const custom = loadCustom();
  custom.splice(idx, 1);
  saveCustom(custom);
  renderFavsModal(loadFavs());
}

// ── Add custom drug modal ─────────────────────────────────
export function rxOpenAddCustom(prefillEncoded) {
  const prefill = prefillEncoded ? decodeURIComponent(prefillEncoded) : '';

  // Check if drug already exists in database
  let existingMatch = null;
  if (prefill.length >= 2) {
    const ql = prefill.toLowerCase();
    existingMatch = DRUGS_ALL.find(d =>
      d.g.toLowerCase().includes(ql) || d.b.some(b => b.toLowerCase().includes(ql))
    );
  }

  const existing = document.getElementById('mo-rx-add');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.className = 'mo'; div.id = 'mo-rx-add';
  div.innerHTML = `<div class="md" style="max-width:520px;">
    <div class="mh"><h3>+ Add Custom Drug</h3><button class="mclose" onclick="closeMo('mo-rx-add')">×</button></div>
    <div style="padding:0 0 18px;">
      ${existingMatch ? `<div style="background:var(--color-background-warning);border-radius:8px;padding:11px 14px;margin-bottom:14px;font-size:13px;color:var(--color-text-warning);">
        ⚠ Similar drug found in database: <strong>${existingMatch.b[0]}</strong> (${existingMatch.g} ${existingMatch.f} ${existingMatch.s}). Are you sure you want to add a different one?
      </div>` : ''}
      <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px;line-height:1.7;">
        This drug will be added to your personal prescription list and saved on this device.
        It will also be flagged for the database administrator to review and add permanently.
      </div>
      <div class="fl" style="margin-bottom:12px;"><label>Generic / Salt Name *</label>
        <input id="cd-generic" type="text" value="${prefill}" placeholder="e.g. Amoxicillin"></div>
      <div class="fl" style="margin-bottom:12px;"><label>Brand Name(s) * (comma separated)</label>
        <input id="cd-brand" type="text" placeholder="e.g. Amoxil, Ospamox"></div>
      <div class="fgrid" style="margin-bottom:12px;">
        <div class="fl"><label>Form *</label>
          <select id="cd-form">
            <option>Tab</option><option>Cap</option><option>Syrup</option><option>Inj</option>
            <option>IV Drip</option><option>Cream</option><option>Drops</option><option>Inhaler</option>
            <option>Nebuliser</option><option>Eye Drops</option><option>Ear Drops</option>
            <option>Nasal Spray</option><option>Gel</option><option>Oint</option><option>Sachet</option>
            <option>Supp</option><option>Lotion</option><option>Shampoo</option><option>Solution</option><option>Other</option>
          </select>
        </div>
        <div class="fl"><label>Strength *</label>
          <input id="cd-strength" type="text" placeholder="e.g. 500mg"></div>
      </div>
      <div class="fl" style="margin-bottom:12px;"><label>Drug Class / Category</label>
        <input id="cd-class" type="text" placeholder="e.g. Antibiotic, NSAID, Antifungal"></div>
      <div class="fl" style="margin-bottom:18px;"><label>Usual Dose / Instructions</label>
        <textarea id="cd-dose" rows="2" placeholder="e.g. 1 tab TDS x 7 days after meals"></textarea></div>
      <div id="cd-error" style="color:var(--color-text-danger);font-size:13px;margin-bottom:10px;"></div>
      <div class="brow">
        <button class="btn bt" onclick="rxSaveCustomDrug()">Save to My List</button>
        <button class="btn bo" onclick="closeMo('mo-rx-add')">Cancel</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e => { if (e.target === div && typeof closeMo === 'function') closeMo('mo-rx-add'); });
  if (typeof openMo === 'function') openMo('mo-rx-add');
  setTimeout(() => document.getElementById('cd-generic')?.focus(), 200);
}

export function rxSaveCustomDrug() {
  const g = document.getElementById('cd-generic')?.value.trim();
  const bRaw = document.getElementById('cd-brand')?.value.trim();
  const f = document.getElementById('cd-form')?.value;
  const s = document.getElementById('cd-strength')?.value.trim();
  const c = document.getElementById('cd-class')?.value.trim() || 'Custom Drug';
  const d = document.getElementById('cd-dose')?.value.trim() || 'As prescribed';
  const errEl = document.getElementById('cd-error');

  if (!g || !bRaw || !s) {
    if (errEl) errEl.textContent = 'Please fill in: Generic Name, Brand Name(s), and Strength.';
    return;
  }
  if (errEl) errEl.textContent = '';

  const b = bRaw.split(',').map(x => x.trim()).filter(Boolean);
  const drug = { g, b, f, s, c, d, custom: true };

  // Save to custom list
  const custom = loadCustom();
  custom.unshift(drug);
  saveCustom(custom);

  // Also add to favourites automatically
  const favs = loadFavs();
  if (!favs.some(fav => fav.g === g && fav.f === f && fav.s === s)) {
    favs.unshift(drug);
    saveFavs(favs);
  }

  // Submit as pending request for admin
  addPendingRequest(drug, window._CU_NAME || window._CU_UID || 'Unknown');

  if (typeof closeMo === 'function') closeMo('mo-rx-add');
  if (typeof showToast === 'function') showToast(`✓ ${b[0]} added to your custom drugs & favourites`);

  // Refresh favs modal if open
  const favsModal = document.getElementById('mo-rx-favs');
  if (favsModal?.classList.contains('open')) renderFavsModal(loadFavs());
}

// ── Close dropdowns when clicking outside ─────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('#mo-rx')) {
    document.getElementById('rx-ac-list')?.style  && (document.getElementById('rx-ac-list').style.display  = 'none');
    document.getElementById('rx-diag-ac')?.style  && (document.getElementById('rx-diag-ac').style.display  = 'none');
  }
});
