"""
demo_data.py - High-fidelity clinical sample datasets and demo mock responses for MediGuide AI.
Strictly for educational and demonstration purposes. All values represent fictional patients.
"""

SAMPLE_REPORTS = {
    "cbc": {
        "id": "cbc",
        "title": "Complete Blood Count (CBC) - Fictional Sample",
        "title_te": "పూర్తి రక్త గణన పరీక్ష (CBC) - నమూనా",
        "report_type": "Hematology / Complete Blood Count",
        "patient_info": {
            "name": "Jane Doe (Sample Patient)",
            "age_range": "28-35 years",
            "gender": "Female",
            "date": "2024-03-15",
            "referring_dr": "Dr. R. Sharma, MD"
        },
        "raw_text": (
            "METROPOLITAN CLINICAL LABORATORIES\n"
            "PATIENT: Jane Doe | AGE: 32 | GENDER: Female | DATE: 15-Mar-2024\n"
            "REPORT: COMPLETE BLOOD COUNT (CBC)\n\n"
            "TEST NAME                  VALUE      UNIT        REFERENCE RANGE    STATUS\n"
            "Hemoglobin (Hb)            10.4       g/dL        12.0 - 15.5         LOW\n"
            "RBC Count                  3.8        million/uL  4.0 - 5.2           LOW\n"
            "WBC Count                  6,800      cells/uL    4,500 - 11,000      NORMAL\n"
            "Platelet Count             245,000    /uL         150,000 - 450,000   NORMAL\n"
            "Hematocrit (PCV)           32.1       %           36.0 - 46.0         LOW\n"
            "Mean Corpuscular Vol (MCV) 74.2       fL          80.0 - 100.0        LOW\n"
            "Mean Corpuscular Hb (MCH)  24.5       pg          27.0 - 33.0         LOW\n"
            "Neutrophils                62         %           40 - 70             NORMAL\n"
            "Lymphocytes                30         %           20 - 40             NORMAL\n"
            "Eosinophils                3          %           1 - 6               NORMAL\n"
            "Monocytes                  5          %           2 - 8               NORMAL\n\n"
            "CLINICAL NOTE: Microcytic hypochromic red blood cell picture observed. Correlate with iron studies."
        ),
        "test_results": [
            {
                "test_name": "Hemoglobin (Hb)",
                "value": 10.4,
                "unit": "g/dL",
                "reference_range": "12.0 - 15.5",
                "status": "low",
                "description": "Hemoglobin is the protein in red blood cells that carries oxygen from your lungs throughout your body.",
                "description_te": "హిమోగ్లోబిన్ అనేది ఎర్ర రక్త కణాలలో ఉండే ప్రోటీన్. ఇది ఊపిరితిత్తుల నుండి శరీర భాగానికి ఆక్సిజన్‌ను మోసుకెళ్తుంది."
            },
            {
                "test_name": "RBC Count",
                "value": 3.8,
                "unit": "million/uL",
                "reference_range": "4.0 - 5.2",
                "status": "low",
                "description": "Red Blood Cells carry oxygen and nutrients. A slightly lower count often mirrors low hemoglobin.",
                "description_te": "ఎర్ర రక్త కణాలు ఆక్సిజన్‌ను సరఫరా చేస్తాయి. ఈ సంఖ్య తగ్గడం వల్ల అలసట లేదా రక్తహీనత లక్షణాలు కనిపించవచ్చు."
            },
            {
                "test_name": "WBC Count",
                "value": 6800,
                "unit": "cells/uL",
                "reference_range": "4,500 - 11,000",
                "status": "normal",
                "description": "White Blood Cells are vital defenders of the immune system that fight infections and inflammation.",
                "description_te": "తెల్ల రక్త కణాలు రోగనిరోధక రక్షణలో కీలకమైనవి, ఇవి ఇన్ఫెక్షన్ల నుండి శరీరాన్ని కాపాడతాయి."
            },
            {
                "test_name": "Platelet Count",
                "value": 245000,
                "unit": "/uL",
                "reference_range": "150,000 - 450,000",
                "status": "normal",
                "description": "Platelets are small cell fragments that help blood clot properly to stop bleeding from cuts or injuries.",
                "description_te": "ప్లేట్‌లెట్స్ రక్తం గడ్డకట్టడానికి సహాయపడే కణాలు, ఇవి రక్తస్రావాన్ని అరికడతాయి."
            },
            {
                "test_name": "Mean Corpuscular Volume (MCV)",
                "value": 74.2,
                "unit": "fL",
                "reference_range": "80.0 - 100.0",
                "status": "low",
                "description": "MCV indicates the average size of red blood cells. A lower number suggests microcytic (smaller) cells.",
                "description_te": "MCV ఎర్ర రక్త కణాల సగటు పరిమాణాన్ని తెలియజేస్తుంది. తక్కువగా ఉంటే కణాలు సాధారణం కంటే చిన్నవిగా ఉన్నాయని అర్థం."
            },
            {
                "test_name": "Hematocrit (PCV)",
                "value": 32.1,
                "unit": "%",
                "reference_range": "36.0 - 46.0",
                "status": "low",
                "description": "Hematocrit represents the percentage of total blood volume made up of red blood cells.",
                "description_te": "హెమటోక్రిట్ అనేది మొత్తం రక్తంలో ఎర్ర రక్త కణాల నిష్పత్తిని సూచిస్తుంది."
            }
        ],
        "summary": {
            "overview_en": "This sample Complete Blood Count shows mild microcytic anemia patterns, indicated by hemoglobin (10.4 g/dL) and MCV (74.2 fL) below the standard adult female reference interval. White blood cells and platelets remain fully within healthy reference bounds.",
            "overview_te": "ఈ నమూనా CBC పరీక్ష ఫలితాల్లో హిమోగ్లోబిన్ (10.4 g/dL) మరియు MCV (74.2 fL) సాధారణ సూచికల కంటే కొద్దిగా తక్కువగా ఉన్నాయి. ఇది సాధారణంగా మైక్రోసైటిక్ రక్తహీనత (Anemia) సంకేతాన్ని సూచిస్తుంది. తెల్ల రక్త కణాలు మరియు ప్లేట్‌లెట్స్ సాధారణ పరిమితుల్లోనే ఉన్నాయి.",
            "key_takeaways_en": [
                "Hemoglobin is mildly below standard reference range (10.4 vs 12.0-15.5 g/dL).",
                "MCV is low (74.2 fL), suggesting smaller red blood cells, which frequently correlates with low iron stores.",
                "Immune defenders (WBC) and clotting factors (Platelets) are in healthy normal ranges."
            ],
            "key_takeaways_te": [
                "హిమోగ్లోబిన్ సాధారణ పరిమితి కంటే కొద్దిగా తక్కువగా ఉంది (10.4 g/dL).",
                "MCV తక్కువగా ఉండటం వల్ల ఐరన్ (ఇనుము) లోపం ఉండే అవకాశం ఉందని సూచిస్తుంది.",
                "రోగనిరోధక కణాలు (WBC) మరియు ప్లేట్‌లెట్స్ ఆరోగ్యకరమైన స్థాయిలో ఉన్నాయి."
            ],
            "questions_for_doctor_en": [
                "Should we test serum ferritin, iron levels, and total iron-binding capacity (TIBC)?",
                "Are dietary iron enhancements or temporary supplements recommended for my situation?",
                "When should I repeat this complete blood count to monitor my hemoglobin progress?"
            ],
            "questions_for_doctor_te": [
                "సీరం ఫెర్రిటిన్ (Iron/Ferritin) పరీక్షలు చేయించాలా?",
                "నా ఆహారంలో ఎలాంటి మార్పులు చేసుకోవాలి లేదా ఐరన్ సప్లిమెంట్స్ అవసరమా?",
                "హిమోగ్లోబిన్ పురోగతిని తెలుసుకోవడానికి ఈ పరీక్షను ఎప్పుడు మళ్లీ చేయించాలి?"
            ],
            "disclaimer": "Informational summary only. This does not constitute a clinical diagnosis or treatment prescription. Always consult your personal physician."
        }
    },

    "lipid": {
        "id": "lipid",
        "title": "Lipid Profile (Cholesterol Panel) - Fictional Sample",
        "title_te": "లిపిడ్ ప్రొఫైల్ (కొలెస్ట్రాల్ పరీక్ష) - నమూనా",
        "report_type": "Cardiovascular / Lipid Profile",
        "patient_info": {
            "name": "John Smith (Sample Patient)",
            "age_range": "45-55 years",
            "gender": "Male",
            "date": "2024-05-10",
            "referring_dr": "Dr. K. Patel, MD"
        },
        "raw_text": (
            "APEX DIAGNOSTIC CENTER\n"
            "PATIENT: John Smith | AGE: 48 | GENDER: Male | FASTING: 12 Hours | DATE: 10-May-2024\n"
            "REPORT: COMPREHENSIVE FASTING LIPID PANEL\n\n"
            "TEST NAME                  VALUE      UNIT        DESIRABLE RANGE    STATUS\n"
            "Total Cholesterol          228        mg/dL       < 200               BORDERLINE HIGH\n"
            "HDL ('Good') Cholesterol   42         mg/dL       > 40 (Male)         NORMAL\n"
            "LDL ('Bad') Cholesterol    148        mg/dL       < 100               ELEVATED\n"
            "Triglycerides              190        mg/dL       < 150               BORDERLINE HIGH\n"
            "VLDL Cholesterol           38         mg/dL       5 - 30              ELEVATED\n"
            "Total Chol / HDL Ratio     5.4        ratio       < 5.0               ELEVATED\n\n"
            "NOTE: Values interpreted in conjunction with overall cardiovascular risk assessment."
        ),
        "test_results": [
            {
                "test_name": "Total Cholesterol",
                "value": 228,
                "unit": "mg/dL",
                "reference_range": "< 200",
                "status": "borderline",
                "description": "Total cholesterol measures the overall cholesterol content in your bloodstream, including HDL, LDL, and VLDL.",
                "description_te": "మొత్తం కొలెస్ట్రాల్ రక్తంలో ఉండే కొవ్వు పదార్థాల మొత్తం శాతాన్ని కొలుస్తుంది."
            },
            {
                "test_name": "LDL ('Bad') Cholesterol",
                "value": 148,
                "unit": "mg/dL",
                "reference_range": "< 100",
                "status": "high",
                "description": "Low-Density Lipoprotein carries cholesterol to tissues; higher levels can contribute to arterial plaque buildup over time.",
                "description_te": "LDL అనేది 'చెడు కొలెస్ట్రాల్'. ఇది ఎక్కువైతే రక్తనాళాల్లో పూడికలు (ప్లాక్) ఏర్పడే ప్రమాదం పెరుగుతుంది."
            },
            {
                "test_name": "HDL ('Good') Cholesterol",
                "value": 42,
                "unit": "mg/dL",
                "reference_range": "> 40",
                "status": "normal",
                "description": "High-Density Lipoprotein sweeps excess cholesterol back to the liver for clearance, supporting vascular health.",
                "description_te": "HDL అనేది 'మంచి కొలెస్ట్రాల్'. ఇది రక్తనాళాల నుండి అదనపు కొవ్వును కాలేయానికి చేర్చి రక్షిస్తుంది."
            },
            {
                "test_name": "Triglycerides",
                "value": 190,
                "unit": "mg/dL",
                "reference_range": "< 150",
                "status": "borderline",
                "description": "Triglycerides are the main type of fat in your body, derived from dietary calories and stored energy.",
                "description_te": "ట్రైగ్లిజరైడ్స్ శరీరంలో నిల్వ ఉండే కొవ్వు రూపం. ఆహారంలో అధిక పిండి పదార్థాలు లేదా తీపి పదార్థాల వల్ల ఇది పెరుగుతుంది."
            }
        ],
        "summary": {
            "overview_en": "This sample lipid profile reflects elevated LDL cholesterol (148 mg/dL) and borderline elevated total cholesterol (228 mg/dL) and triglycerides (190 mg/dL). HDL is at 42 mg/dL, just above the male threshold.",
            "overview_te": "ఈ నమూనా లిపిడ్ పరీక్షలో చెడు కొలెస్ట్రాల్ (LDL 148 mg/dL) మరియు ట్రైగ్లిజరైడ్స్ (190 mg/dL) సాధారణ పరిమితుల కంటే కొద్దిగా ఎక్కువగా ఉన్నాయి. మంచి కొలెస్ట్రాల్ (HDL 42 mg/dL) సాధారణ పరిధిలోనే ఉంది.",
            "key_takeaways_en": [
                "LDL cholesterol is above desirable bounds (< 100 mg/dL), warranting cardiovascular review.",
                "Triglycerides show mild elevation, often sensitive to refined carbs and exercise habits.",
                "HDL cholesterol meets basic thresholds but could benefit from aerobic activity."
            ],
            "key_takeaways_te": [
                "LDL కొలెస్ట్రాల్ ఆదర్శ పరిమితి కంటే ఎక్కువ ఉంది.",
                "ట్రైగ్లిజరైడ్స్ కొద్దిగా పెరిగాయి, ఇది ఆహారపు అలవాట్లతో సంబంధం కలిగి ఉంటుంది.",
                "రోజువారీ వ్యాయామం మరియు సమతుల్య ఆహారం గుండె ఆరోగ్యానికి తోడ్పడతాయి."
            ],
            "questions_for_doctor_en": [
                "What is my personalized 10-year cardiovascular risk assessment score?",
                "What specific lifestyle modifications (aerobic exercise, dietary fiber) should I focus on first?",
                "Do my results warrant medication or should we re-evaluate after 3 months of lifestyle changes?"
            ],
            "questions_for_doctor_te": [
                "నా వయస్సు మరియు జీవనశైలికి తగినట్లుగా గుండె ఆరోగ్యంపై ప్రమాద శాతం ఎంత?",
                "ఆహారంలో ఎలాంటి మార్పులు మరియు వ్యాయామాలు ప్రారంభించాలి?",
                "3 నెలల తర్వాత మళ్లీ ఈ పరీక్ష చేయించి చూడవచ్చా?"
            ],
            "disclaimer": "Educational summary only. Consult a physician for individualized cardiovascular risk evaluation."
        }
    },

    "metabolic": {
        "id": "metabolic",
        "title": "Comprehensive Metabolic & Kidney Panel - Fictional Sample",
        "title_te": "మెటబాలిక్ & కిడ్నీ పరీక్షల నివేదిక - నమూనా",
        "report_type": "Renal & Metabolic Panel",
        "patient_info": {
            "name": "Alex Taylor (Sample Patient)",
            "age_range": "50-60 years",
            "gender": "Male",
            "date": "2024-06-20",
            "referring_dr": "Dr. S. Rao, MD"
        },
        "raw_text": (
            "PRIMECARE HEALTH LABORATORIES\n"
            "PATIENT: Alex Taylor | AGE: 54 | GENDER: Male | DATE: 20-Jun-2024\n"
            "REPORT: COMPREHENSIVE METABOLIC & RENAL PROFILE\n\n"
            "TEST NAME                  VALUE      UNIT        REFERENCE RANGE    STATUS\n"
            "Fasting Blood Glucose      118        mg/dL       70 - 99             ELEVATED (Impaired)\n"
            "Serum Creatinine           0.95       mg/dL       0.70 - 1.30         NORMAL\n"
            "Blood Urea Nitrogen (BUN)  16         mg/dL       7 - 20              NORMAL\n"
            "eGFR                       94         mL/min/1.73 > 90                NORMAL\n"
            "Serum Sodium               140        mEq/L       136 - 145           NORMAL\n"
            "Serum Potassium            4.3        mEq/L       3.5 - 5.1           NORMAL\n"
            "Serum Calcium              9.4        mg/dL       8.6 - 10.2          NORMAL\n\n"
            "INTERPRETATION: Fasting blood glucose is in the prediabetes / impaired fasting range."
        ),
        "test_results": [
            {
                "test_name": "Fasting Blood Glucose",
                "value": 118,
                "unit": "mg/dL",
                "reference_range": "70 - 99",
                "status": "borderline",
                "description": "Fasting blood sugar measures glucose levels after at least 8 hours of no caloric intake.",
                "description_te": "ఉదయం ఖాళీ కడుపుతో రక్తంలో చక్కెర (గ్లూకోజ్) శాతాన్ని కొలిచే పరీక్ష."
            },
            {
                "test_name": "Serum Creatinine",
                "value": 0.95,
                "unit": "mg/dL",
                "reference_range": "0.70 - 1.30",
                "status": "normal",
                "description": "Creatinine is a waste product from normal muscle breakdown, filtered and cleared by healthy kidneys.",
                "description_te": "క్రియేటినిన్ అనేది కండరాల పనితీరు వల్ల ఏర్పడే వ్యర్థం, ఇది మూత్రపిండాల పనితీరును సూచిస్తుంది."
            },
            {
                "test_name": "eGFR (Kidney Function)",
                "value": 94,
                "unit": "mL/min/1.73m2",
                "reference_range": "> 90",
                "status": "normal",
                "description": "Estimated Glomerular Filtration Rate estimates how effectively the kidneys filter waste products from blood.",
                "description_te": "eGFR మూత్రపిండాలు రక్తాన్ని ఎంత సమర్థవంతంగా శుద్ధి చేస్తున్నాయో తెలియజేస్తుంది."
            },
            {
                "test_name": "Serum Potassium",
                "value": 4.3,
                "unit": "mEq/L",
                "reference_range": "3.5 - 5.1",
                "status": "normal",
                "description": "An essential electrolyte for electrical signals in nerves and heart muscle cells.",
                "description_te": "పొటాషియం గుండె లయ మరియు నరాల స్పందనలకు అత్యంత ముఖ్యమైన ఎలక్ట్రోలైట్."
            }
        ],
        "summary": {
            "overview_en": "Kidney function indicators (Creatinine 0.95 mg/dL, eGFR 94) and electrolyte balances are fully within normal ranges. Fasting blood glucose (118 mg/dL) falls into the impaired fasting glucose range (100-125 mg/dL), warranting discussion with a doctor regarding metabolic screening.",
            "overview_te": "మూత్రపిండాల పనితీరు (Creatinine 0.95, eGFR 94) మరియు ఎలక్ట్రోలైట్స్ సాధారణ స్థాయిలో ఉన్నాయి. ఖాళీ కడుపుతో రక్తంలో చక్కెర (118 mg/dL) సాధారణ పరిమితి (70-99) కంటే కొద్దిగా ఎక్కువగా ఉంది, ఇది ప్రీ-డయాబెటిస్ సంకేతం కావచ్చు.",
            "key_takeaways_en": [
                "Kidney filtration (eGFR) and waste clearance (Creatinine, BUN) are robust and normal.",
                "Fasting blood glucose shows mild elevation (118 mg/dL).",
                "Electrolytes (Sodium, Potassium) are in balanced ranges."
            ],
            "key_takeaways_te": [
                "కిడ్నీల పనితీరు మరియు ఎలక్ట్రోలైట్స్ చాలా ఆరోగ్యకరంగా ఉన్నాయి.",
                "బ్లడ్ షుగర్ స్థాయి కొద్దిగా పెరిగింది, ఆహార నియంత్రణ అవసరం.",
                "HbA1c పరీక్ష ద్వారా గత 3 నెలల సగటు చక్కెర శాతాన్ని తెలుసుకోవచ్చు."
            ],
            "questions_for_doctor_en": [
                "Would you recommend checking an HbA1c test to assess my average blood sugar over the last 3 months?",
                "What dietary guidance is best for managing borderline fasting glucose?",
                "Are there additional metabolic markers I should check?"
            ],
            "questions_for_doctor_te": [
                "గత 3 నెలల సగటు చక్కెర స్థాయిని తెలుసుకోవడానికి HbA1c పరీక్ష చేయించాలా?",
                "చక్కెర నియంత్రణకు ఎలాంటి ఆహార మార్పులు పాటించాలి?",
                "వ్యాయామం మరియు బరువు నియంత్రణ గురించి వైద్య సలహా తీసుకోండి."
            ],
            "disclaimer": "Informational summary only. Consult a doctor for definitive glucose management and evaluation."
        }
    }
}

# Longitudinal Comparison Datasets for Report Comparison Section
COMPARISON_DATASETS = {
    "lipid_panel": {
        "title": "Lipid Profile Trend: Baseline vs 6-Month Follow-Up",
        "description": "Fictional demonstration comparing lipid levels before and after diet/exercise lifestyle intervention.",
        "report_a": {
            "label": "Report A (Baseline - Jan 2024)",
            "date": "2024-01-15"
        },
        "report_b": {
            "label": "Report B (Follow-up - Jul 2024)",
            "date": "2024-07-20"
        },
        "metrics": [
            {
                "test_name": "Total Cholesterol",
                "val_a": 240,
                "val_b": 210,
                "unit": "mg/dL",
                "ref_range": "< 200",
                "diff": -30,
                "percent_diff": -12.5,
                "note": "Decrease of 30 mg/dL observed"
            },
            {
                "test_name": "LDL ('Bad') Cholesterol",
                "val_a": 158,
                "val_b": 130,
                "unit": "mg/dL",
                "ref_range": "< 100",
                "diff": -28,
                "percent_diff": -17.7,
                "note": "Decrease of 28 mg/dL observed"
            },
            {
                "test_name": "HDL ('Good') Cholesterol",
                "val_a": 38,
                "val_b": 46,
                "unit": "mg/dL",
                "ref_range": "> 40",
                "diff": 8,
                "percent_diff": 21.0,
                "note": "Increase of 8 mg/dL observed"
            },
            {
                "test_name": "Triglycerides",
                "val_a": 215,
                "val_b": 165,
                "unit": "mg/dL",
                "ref_range": "< 150",
                "diff": -50,
                "percent_diff": -23.2,
                "note": "Decrease of 50 mg/dL observed"
            }
        ],
        "clinical_caveat": "Important: While numerical reductions in LDL and increases in HDL are often favorable in lipid management, laboratory values must be evaluated in total clinical context with cardiovascular risk factors, diet adherence, and physician oversight."
    },
    "cbc_panel": {
        "title": "Complete Blood Count Trend: Baseline vs 3-Month Follow-Up",
        "description": "Fictional demonstration tracking red blood cell indices during nutritional support.",
        "report_a": {
            "label": "Report A (Baseline - Mar 2024)",
            "date": "2024-03-10"
        },
        "report_b": {
            "label": "Report B (Follow-up - Jun 2024)",
            "date": "2024-06-15"
        },
        "metrics": [
            {
                "test_name": "Hemoglobin",
                "val_a": 10.2,
                "val_b": 12.6,
                "unit": "g/dL",
                "ref_range": "12.0 - 15.5",
                "diff": 2.4,
                "percent_diff": 23.5,
                "note": "Increase of 2.4 g/dL toward standard range"
            },
            {
                "test_name": "RBC Count",
                "val_a": 3.7,
                "val_b": 4.4,
                "unit": "million/uL",
                "ref_range": "4.0 - 5.2",
                "diff": 0.7,
                "percent_diff": 18.9,
                "note": "Increase of 0.7 million/uL"
            },
            {
                "test_name": "MCV (Cell Size)",
                "val_a": 72.0,
                "val_b": 84.5,
                "unit": "fL",
                "ref_range": "80.0 - 100.0",
                "diff": 12.5,
                "percent_diff": 17.4,
                "note": "Normalization into standard cell size"
            },
            {
                "test_name": "Platelets",
                "val_a": 230000,
                "val_b": 245000,
                "unit": "/uL",
                "ref_range": "150,000 - 450,000",
                "diff": 15000,
                "percent_diff": 6.5,
                "note": "Remained stable in reference bounds"
            }
        ],
        "clinical_caveat": "Important: An upward trend in hemoglobin indicates improvement when recovering from anemia, but blood markers require clinical correlation by a doctor."
    },
    "glucose_hba1c": {
        "title": "Glycemic Control Trend: Fasting Glucose & HbA1c",
        "description": "Fictional demonstration tracking glycemic biomarkers over a 4-month span.",
        "report_a": {
            "label": "Report A (Baseline - Feb 2024)",
            "date": "2024-02-12"
        },
        "report_b": {
            "label": "Report B (Follow-up - Jun 2024)",
            "date": "2024-06-18"
        },
        "metrics": [
            {
                "test_name": "Fasting Blood Glucose",
                "val_a": 126,
                "val_b": 104,
                "unit": "mg/dL",
                "ref_range": "70 - 99",
                "diff": -22,
                "percent_diff": -17.5,
                "note": "Fasting glucose reduced by 22 mg/dL"
            },
            {
                "test_name": "HbA1c (Glycated Hb)",
                "val_a": 6.4,
                "val_b": 5.8,
                "unit": "%",
                "ref_range": "< 5.7",
                "diff": -0.6,
                "percent_diff": -9.4,
                "note": "3-month glucose average improved by 0.6%"
            }
        ],
        "clinical_caveat": "Important: Blood sugar fluctuations should always be interpreted alongside diet, medication history, and continuous clinical monitoring."
    }
}

# Trusted Public Health References
TRUSTED_SOURCES = [
    {
        "id": "medlineplus",
        "title": "MedlinePlus Medical Tests Guide",
        "organization": "U.S. National Library of Medicine (NLM / NIH)",
        "url": "https://medlineplus.gov/lab-tests/",
        "description": "Authoritative, consumer-friendly explanations of hundreds of laboratory tests, reference ranges, and preparation steps.",
        "category": "Lab Tests & Diagnostics",
        "badge": "Primary Reference"
    },
    {
        "id": "who",
        "title": "WHO Health Topics & Guidelines",
        "organization": "World Health Organization",
        "url": "https://www.who.int/health-topics",
        "description": "Global public health guidelines on cardiovascular disease, anemia prevention, diabetes management, and healthy living.",
        "category": "Global Public Health",
        "badge": "Global Standard"
    },
    {
        "id": "cdc-cholesterol",
        "title": "CDC Cholesterol & Heart Health",
        "organization": "Centers for Disease Control and Prevention",
        "url": "https://www.cdc.gov/cholesterol/",
        "description": "Educational guidance on understanding HDL, LDL, and triglycerides, along with heart-healthy lifestyle tips.",
        "category": "Cardiovascular Health",
        "badge": "Public Health"
    },
    {
        "id": "nih-nhlbi",
        "title": "NIH Blood Tests Resource",
        "organization": "National Heart, Lung, and Blood Institute (NHLBI)",
        "url": "https://www.nhlbi.nih.gov/health/blood-tests",
        "description": "Comprehensive guide on why blood tests are performed, what doctors evaluate, and what risks or results signify.",
        "category": "Hematology & Blood",
        "badge": "Clinical Research"
    },
    {
        "id": "icmr",
        "title": "ICMR Dietary Guidelines for Indians",
        "organization": "Indian Council of Medical Research (NIN)",
        "url": "https://www.nin.res.in/",
        "description": "Nutritional recommendations, micronutrient intakes, and iron-deficiency guidelines specifically suited for Indian dietary contexts.",
        "category": "Nutrition & Regional Health",
        "badge": "Regional Authority"
    }
]

# Demo Chat Knowledge Base for fallback when no API key is provided
DEMO_CHAT_RESPONSES = [
    {
        "keywords": ["ldl", "cholesterol", "bad cholesterol", "కొలెస్ట్రాల్"],
        "reply_en": (
            "**Understanding LDL ('Bad') Cholesterol:**\n\n"
            "• **What it is:** Low-Density Lipoprotein (LDL) carries cholesterol from your liver to the cells in your body. When levels are higher than desirable (typically >100 mg/dL), excess particles can gradually build up in the walls of arteries (plaque).\n\n"
            "• **General Desirable Targets:**\n"
            "  - Optimal: Less than 100 mg/dL\n"
            "  - Near Optimal: 100 – 129 mg/dL\n"
            "  - Borderline High: 130 – 159 mg/dL\n"
            "  - High: 160 – 189 mg/dL\n\n"
            "• **Common Lifestyle Factors:** Doctors frequently recommend a diet rich in soluble fiber (oats, legumes), reducing saturated and trans fats, and engaging in 150 minutes of moderate physical activity weekly.\n\n"
            "*(Educational information only. Please discuss your individual cardiovascular targets with your doctor.)*"
        ),
        "reply_te": (
            "**LDL ('చెడు') కొలెస్ట్రాల్ గురించి అవగాహన:**\n\n"
            "• **ఇది ఏమిటి?** LDL (లో-డెన్సిటీ లైపోప్రొటీన్) కాలేయం నుండి శరీర కణాలకు కొలెస్ట్రాల్‌ను మోసుకెళ్తుంది. రక్తంలో ఇది ఎక్కువైతే రక్తనాళాలలో పూడికలు (ప్లాక్) ఏర్పడే ప్రమాదం పెరుగుతుంది.\n\n"
            "• **సాధారణ పరిమితులు:**\n"
            "  - ఉత్తమం: 100 mg/dL కంటే తక్కువ\n"
            "  - సరిహద్దు: 130 – 159 mg/dL\n"
            "  - అధికం: 160 mg/dL కంటే ఎక్కువ\n\n"
            "• **తీసుకోవలసిన జాగ్రత్తలు:** ఫైబర్ (పీచు పదార్థాలు) ఉన్న ఆహారం, తాజా కూరగాయలు, నడక/వ్యాయామం మరియు వేపుళ్ళు, నూనెలు తగ్గించడం.\n\n"
            "*(ఇది కేవలం సమాచార ప్రయోజనాల కొరకు మాత్రమే. మీ వైద్యుని సలహా తీసుకోండి.)*"
        ),
        "suggested_questions": [
            "What is the difference between HDL and LDL?",
            "What lifestyle steps can raise HDL cholesterol?",
            "What questions should I ask my doctor about lipid results?"
        ]
    },
    {
        "keywords": ["hemoglobin", "anemia", "rbc", "iron", "హిమోగ్లోబిన్", "రక్తం"],
        "reply_en": (
            "**Understanding Hemoglobin and Red Blood Cells:**\n\n"
            "• **What it is:** Hemoglobin is the iron-containing protein inside red blood cells responsible for binding oxygen in the lungs and releasing it to tissues throughout your body.\n\n"
            "• **General Reference Ranges:**\n"
            "  - Adult Males: ~13.8 to 17.2 g/dL\n"
            "  - Adult Females: ~12.1 to 15.1 g/dL\n\n"
            "• **When levels are low:** Mildly lower numbers may reflect nutritional factors (such as insufficient dietary iron, vitamin B12, or folate), blood loss, or other physiological reasons. People might experience fatigue, lightheadedness, or feeling cold.\n\n"
            "• **Doctor Discussions:** Physicians typically check serum ferritin and iron levels before recommending any supplementation.\n\n"
            "*(Educational information only. Consult your doctor for individualized lab interpretation.)*"
        ),
        "reply_te": (
            "**హిమోగ్లోబిన్ మరియు ఎర్ర రక్త కణాల గురించి వివరణ:**\n\n"
            "• **ఇది ఏమిటి?** హిమోగ్లోబిన్ అనేది ఎర్ర రక్త కణాల్లో ఉండే ఇనుము (ఐరన్) ప్రోటీన్. ఇది ఊపిరితిత్తుల నుండి ఆక్సిజన్‌ను శరీరమంతటా అందిస్తుంది.\n\n"
            "• **సాధారణ పరిమితులు:**\n"
            "  - పురుషులు: 13.8 నుండి 17.2 g/dL\n"
            "  - స్త్రీలు: 12.1 నుండి 15.1 g/dL\n\n"
            "• **తక్కువగా ఉంటే:** ఐరన్ లోపం, విటమిన్ B12 లోపం లేదా రక్తహీనత (అనీమియా) సంభవించవచ్చు. దీనివల్ల నీరసం, అలసట కలుగుతాయి.\n\n"
            "• **సలహా:** ఆకుకూరలు, దానిమ్మ, ఖర్జూరం, మొలకెత్తిన గింజలు వంటి ఐరన్ సమృద్ధిగా ఉండే ఆహారాలు తీసుకోవడం మరియు వైద్యుని సంప్రదించడం మంచిది.\n\n"
            "*(ఇది సమాచార ప్రయోజనాల కోసం మాత్రమే. వైద్య సలహాను తప్పక పొందండి.)*"
        ),
        "suggested_questions": [
            "What foods are naturally rich in iron?",
            "What does a low MCV number mean on a blood test?",
            "How often should a complete blood count be checked?"
        ]
    },
    {
        "keywords": ["blood sugar", "glucose", "diabetes", "hba1c", "షుగర్", "గ్లూకోజ్"],
        "reply_en": (
            "**Understanding Blood Glucose & HbA1c:**\n\n"
            "• **Fasting Blood Glucose:** Measures blood sugar after an 8+ hour fast.\n"
            "  - Normal: 70 – 99 mg/dL\n"
            "  - Impaired (Prediabetes): 100 – 125 mg/dL\n"
            "  - Elevated (Diabetes threshold): 126 mg/dL or higher on two separate tests.\n\n"
            "• **HbA1c:** Reflects your average blood sugar over the preceding 2 to 3 months by measuring the percentage of hemoglobin with attached glucose.\n"
            "  - Normal: Below 5.7%\n"
            "  - Prediabetes: 5.7% – 6.4%\n"
            "  - Diabetes threshold: 6.5% or higher.\n\n"
            "*(Educational information only. Lab criteria must always be evaluated in person by a certified clinician.)*"
        ),
        "reply_te": (
            "**రక్తంలో చక్కెర (గ్లూకోజ్) మరియు HbA1c గురించి:**\n\n"
            "• **ఫాస్టింగ్ బ్లడ్ షుగర్ (Fasting Glucose):** ఉదయం పరగడుపున చేసే పరీక్ష.\n"
            "  - సాధారణం: 70 - 99 mg/dL\n"
            "  - ప్రీ-డయాబెటిస్: 100 - 125 mg/dL\n"
            "  - డయాబెటిస్ సంకేతం: 126 mg/dL లేదా అంతకంటే ఎక్కువ.\n\n"
            "• **HbA1c:** గత 2-3 నెలల సగటు చక్కెర శాతాన్ని సూచిస్తుంది.\n"
            "  - సాధారణం: 5.7% కంటే తక్కువ\n"
            "  - ప్రీ-డయాబెటిస్: 5.7% నుండి 6.4%\n"
            "  - డయాబెటిస్: 6.5% లేదా అంతకంటే ఎక్కువ.\n\n"
            "*(ఇది సమాచార ప్రయోజనాల కొరకు మాత్రమే. సరైన నిర్ధారణ కోసం వైద్యుడిని సంప్రదించండి.)*"
        ),
        "suggested_questions": [
            "What is the difference between fasting blood sugar and HbA1c?",
            "How does physical exercise influence blood glucose?",
            "What questions should I ask my doctor about borderline sugar?"
        ]
    }
]

DEFAULT_FALLBACK_CHAT = {
    "reply_en": (
        "Hello! I am **MediGuide AI**, your health education companion.\n\n"
        "I can help explain medical terms, laboratory tests (such as CBC, Lipid Profile, or Blood Glucose), and general health concepts in clear English or Telugu.\n\n"
        "Please remember: I am strictly an educational tool. I cannot diagnose conditions, recommend medication doses, or replace clinical consultation with your doctor.\n\n"
        "Feel free to ask a question, or select one of the suggested prompts below!"
    ),
    "reply_te": (
        "నమస్కారం! నేను **MediGuide AI**, మీ ఆరోగ్య సమాచార సహాయకుడిని.\n\n"
        "రక్త పరీక్షల ఫలితాలు (CBC, లిపిడ్ ప్రొఫైల్, షుగర్ టెస్ట్ మొదలైనవి) మరియు వైద్య నిబంధనలను సులభమైన తెలుగు మరియు ఆంగ్లంలో అర్థం చేసుకోవడానికి నేను సహాయపడగలను.\n\n"
        "గమనిక: ఇది కేవలం విద్యా మరియు సమాచార ప్రయోజనాల కోసం మాత్రమే. రోగ నిర్ధారణ లేదా మందుల సూచనల కోసం ఎల్లప్పుడూ మీ వైద్యుడిని సంప్రదించండి.\n\n"
        "మీకు ఏవైనా సందేహాలు ఉంటే అడగండి!"
    ),
    "suggested_questions": [
        "What does high LDL cholesterol mean?",
        "Explain Hemoglobin and RBC in simple terms",
        "What questions should I ask my doctor about my blood sugar?",
        "What is the purpose of an eGFR kidney test?"
    ]
}
