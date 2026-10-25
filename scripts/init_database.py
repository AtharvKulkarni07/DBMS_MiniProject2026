"""
Disease Surveillance and Epidemiology Database
Database Initializer and Synthetic Data Generator
Target: MySQL 8.0+ / MariaDB 10.4+ in XAMPP
"""

import os
import random
import datetime
import pymysql

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "disease_surveillance_db")

def get_connection(include_db=True):
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if include_db else None,
        autocommit=True,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

def execute_sql_file(filepath, connection):
    print(f"Executing: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Split statements appropriately (handling DELIMITER)
    statements = []
    current_delim = ";"
    buffer = []

    for line in content.splitlines():
        trimmed = line.strip()
        if trimmed.startswith("--") or not trimmed:
            continue
        if trimmed.upper().startswith("DELIMITER"):
            parts = trimmed.split()
            if len(parts) >= 2:
                current_delim = parts[1]
            continue
        
        buffer.append(line)
        if trimmed.endswith(current_delim):
            stmt = "\n".join(buffer)
            # Remove trailing delimiter
            if current_delim == ";":
                stmt = stmt[:-1]
            elif stmt.endswith(current_delim):
                stmt = stmt[:-len(current_delim)]
            stmt = stmt.strip()
            if stmt:
                statements.append(stmt)
            buffer = []

    with connection.cursor() as cursor:
        for stmt in statements:
            try:
                cursor.execute(stmt)
            except Exception as e:
                # Ignore duplicate or non-fatal drop errors
                print(f"Warning on executing stmt: {e}")

def seed_database():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
    conn = get_connection(include_db=False)
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.close()

    conn = get_connection(include_db=True)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "database")

    # 1. Execute schema.sql
    execute_sql_file(os.path.join(db_dir, "schema.sql"), conn)
    # 2. Execute indexes.sql
    execute_sql_file(os.path.join(db_dir, "indexes.sql"), conn)
    # 3. Execute views.sql
    execute_sql_file(os.path.join(db_dir, "views.sql"), conn)
    # 4. Execute triggers.sql
    execute_sql_file(os.path.join(db_dir, "triggers.sql"), conn)
    # 5. Execute procedures.sql
    execute_sql_file(os.path.join(db_dir, "procedures.sql"), conn)

    print("Generating deterministic synthetic surveillance data...")
    random.seed(42)  # Deterministic seed for reproducible evaluation

    regions_data = [
        ("Pune Metro", "MH-PUN", "Maharashtra", "Urban", 3124450),
        ("Mumbai Suburban", "MH-MUM", "Maharashtra", "Urban", 9356960),
        ("Nagpur Central", "MH-NAG", "Maharashtra", "Urban", 2405660),
        ("Nashik Valley", "MH-NAS", "Maharashtra", "Semi-Urban", 1486050),
        ("Thane Industrial", "MH-THA", "Maharashtra", "Urban", 1841480),
        ("Chhatrapati Sambhajinagar", "MH-CSN", "Maharashtra", "Semi-Urban", 1175110),
        ("Kolhapur Heritage", "MH-KOL", "Maharashtra", "Rural", 549280),
        ("Solapur Belt", "MH-SOL", "Maharashtra", "Rural", 951550),
        ("Amravati Plateau", "MH-AMR", "Maharashtra", "Rural", 647050),
        ("Nanded Border", "MH-NAN", "Maharashtra", "Rural", 550430),
        ("Satara Foothills", "MH-SAT", "Maharashtra", "Rural", 480200),
        ("Ratnagiri Coastal", "MH-RAT", "Maharashtra", "Coastal", 315600)
    ]

    diseases_data = [
        ("Dengue Fever", "DIS-DEN-01", "Vector-borne", "Aedes mosquito bite transmission", "Moderate", "Immediate (24h)", "Acute viral mosquito-borne infection with high fever, rash, and thrombocytopenia."),
        ("Malaria (Plasmodium falciparum)", "DIS-MAL-02", "Vector-borne", "Anopheles mosquito vector", "Severe", "Immediate (24h)", "Parasitic disease characterized by recurring chills, fever, anemia, and splenomegaly."),
        ("Chikungunya", "DIS-CHIK-03", "Vector-borne", "Aedes albopictus / aegypti vector", "Moderate", "Weekly", "Viral illness causing debilitating joint pain, rash, and fever."),
        ("COVID-19 (SARS-CoV-2)", "DIS-COV-04", "Airborne", "Respiratory droplets and aerosol inhalation", "Severe", "Immediate (24h)", "Novel coronavirus disease presenting respiratory distress, cough, and anosmia."),
        ("Pulmonary Tuberculosis", "DIS-TB-05", "Airborne", "Inhalation of Mycobacterium droplet nuclei", "Critical", "Weekly", "Chronic pulmonary bacterial infection marked by persistent cough, hemoptysis, and weight loss."),
        ("Cholera (Vibrio cholerae)", "DIS-CHOL-06", "Water-borne", "Ingestion of contaminated water or food", "Critical", "Immediate (24h)", "Acute diarrheal illness causing profound dehydration and hypovolemic shock."),
        ("Viral Hepatitis A/E", "DIS-HEP-07", "Water-borne", "Fecal-oral transmission through unhygienic water", "Moderate", "Weekly", "Acute hepatic inflammation resulting in jaundice, abdominal pain, and dark urine."),
        ("Typhoid Fever", "DIS-TYPH-08", "Water-borne", "Salmonella enterica serovar Typhi ingestion", "Moderate", "Weekly", "Systemic bacterial infection characterized by sustained step-ladder fever and delirium."),
        ("Rabies Encephalitis", "DIS-RAB-09", "Zoonotic", "Saliva from infected animal bite (canine)", "Critical", "Immediate (24h)", "Near-fatal neurological encephalomyelitis preventable through timely post-exposure prophylaxis."),
        ("Leptospirosis", "DIS-LEP-10", "Zoonotic", "Direct skin contact with rodent-contaminated floodwaters", "Severe", "Immediate (24h)", "Spirochetal zoonosis common during monsoon inundation causing renal and hepatic injury.")
    ]

    facilities_data = [
        ("Sassoon General Hospital", "HCF-PUN-001", "Tertiary Care Center", 1, "Active", "epidemiology@sassoonpune.gov.in", "+91-20-26128000"),
        ("Aundh District Hospital", "HCF-PUN-002", "District Hospital", 1, "Active", "contact@aundhdh.org", "+91-20-27274000"),
        ("KEM Hospital Parel", "HCF-MUM-001", "Tertiary Care Center", 2, "Active", "surveillance@kem.edu", "+91-22-24107000"),
        ("Kurla Bhabha Hospital", "HCF-MUM-002", "Sub-District Hospital", 2, "Active", "bhabha.kurla@mcgm.gov.in", "+91-22-26500144"),
        ("Government Medical College Nagpur", "HCF-NAG-001", "Tertiary Care Center", 3, "Active", "dean@gmcnagpur.org", "+91-712-2701580"),
        ("Nashik Civil Hospital", "HCF-NAS-001", "District Hospital", 4, "Active", "civil.nashik@mahasurv.in", "+91-253-2572000"),
        ("Chhatrapati Shivaji Maharaj Hospital Kalwa", "HCF-THA-001", "District Hospital", 5, "Active", "csmh.kalwa@thanecity.gov.in", "+91-22-25410000"),
        ("Government Medical College Aurangabad", "HCF-CSN-001", "Tertiary Care Center", 6, "Active", "surv@gmcaurangabad.com", "+91-240-2402412"),
        ("CPR General Hospital Kolhapur", "HCF-KOL-001", "District Hospital", 7, "Active", "cprhospital@kolhapur.nic.in", "+91-231-2641500"),
        ("Solapur Civil Hospital", "HCF-SOL-001", "District Hospital", 8, "Active", "civil.solapur@dhs.gov.in", "+91-217-2745500"),
        ("Karad Sub-District Hospital", "HCF-SAT-001", "Sub-District Hospital", 11, "Active", "sdh.karad@satarahealth.in", "+91-2164-222044"),
        ("Ratnagiri District Civil Hospital", "HCF-RAT-001", "District Hospital", 12, "Active", "dch.ratnagiri@kokanhealth.org", "+91-2352-222365")
    ]

    with conn.cursor() as cur:
        # Insert Regions
        print("Inserting regions...")
        cur.executemany("""
            INSERT INTO `regions` (`region_name`, `district_code`, `state`, `region_type`, `population`)
            VALUES (%s, %s, %s, %s, %s)
        """, regions_data)

        # Insert Diseases
        print("Inserting diseases...")
        cur.executemany("""
            INSERT INTO `diseases` (`disease_name`, `disease_code`, `category`, `transmission_mode`, `severity_level`, `reporting_requirement`, `description`)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, diseases_data)

        # Insert Facilities
        print("Inserting healthcare facilities...")
        cur.executemany("""
            INSERT INTO `healthcare_facilities` (`facility_name`, `facility_code`, `facility_type`, `region_id`, `operational_status`, `contact_email`, `contact_phone`)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, facilities_data)

        # Generate 100 Patients
        print("Generating 100 synthetic de-identified patients...")
        patients_data = []
        genders = ["Male", "Female", "Male", "Female", "Non-Binary", "Other"]
        for i in range(1, 101):
            pat_ref = f"SYN-PAT-2026-{i:04d}"
            age = random.choice([
                random.randint(2, 14),   # Pediatric
                random.randint(15, 24),  # Youth
                random.randint(25, 44),  # Adult
                random.randint(45, 64),  # Middle Age
                random.randint(65, 84)   # Senior
            ])
            if age <= 14:
                age_group = "0-14 Pediatric"
            elif age <= 24:
                age_group = "15-24 Youth"
            elif age <= 44:
                age_group = "25-44 Adult"
            elif age <= 64:
                age_group = "45-64 Middle Age"
            else:
                age_group = "65+ Senior"
            gender = random.choice(genders)
            region_id = random.randint(1, len(regions_data))
            patients_data.append((pat_ref, age, age_group, gender, region_id))

        cur.executemany("""
            INSERT INTO `patients` (`patient_reference`, `age`, `age_group`, `gender`, `region_id`)
            VALUES (%s, %s, %s, %s, %s)
        """, patients_data)

        # Generate 250 Surveillance Cases
        print("Generating 250 surveillance cases...")
        cases_data = []
        base_date = datetime.date(2026, 7, 1)  # Spread across mid to late 2026
        
        classifications = ["Suspected", "Probable", "Confirmed", "Confirmed", "Discarded"]
        statuses = ["Active", "Active", "Under Investigation", "Closed", "Closed"]
        outcomes = ["Recovering", "Recovered", "Recovered", "Recovered", "Deceased", "Unknown"]
        risks = ["Low", "Medium", "High", "Critical"]

        for i in range(1, 251):
            case_ref = f"CAS-2026-{i:04d}"
            patient_id = random.randint(1, 100)
            disease_id = random.randint(1, len(diseases_data))
            facility_id = random.randint(1, len(facilities_data))
            # Region matches facility or patient region
            region_id = random.randint(1, len(regions_data))
            
            day_offset = random.randint(0, 115)
            onset_date = base_date + datetime.timedelta(days=day_offset)
            delay = random.randint(1, 6)
            reported_date = onset_date + datetime.timedelta(days=delay)

            classification = random.choice(classifications)
            status = random.choice(statuses)
            
            if status == "Closed":
                outcome = random.choice(["Recovered", "Recovered", "Deceased"])
            elif status == "Active":
                outcome = random.choice(["Recovering", "Unknown"])
            else:
                outcome = "Unknown"

            if outcome == "Deceased":
                risk = "Critical"
            elif classification == "Confirmed":
                risk = random.choice(["Medium", "High", "Critical"])
            else:
                risk = random.choice(["Low", "Medium"])

            notes = f"Case detected through community health reporting stream. Triage protocol followed for {diseases_data[disease_id-1][0]}."
            cases_data.append((
                case_ref, patient_id, disease_id, facility_id, region_id,
                onset_date, reported_date, classification, status, outcome, risk, notes
            ))

        cur.executemany("""
            INSERT INTO `surveillance_cases` (
                `case_reference`, `patient_id`, `disease_id`, `facility_id`, `region_id`,
                `date_of_onset`, `date_reported`, `case_classification`, `case_status`, `outcome`, `risk_category`, `notes`
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, cases_data)

        # Generate 150 Laboratory Reports
        print("Generating 150 laboratory reports...")
        lab_reports_data = []
        test_types = ['RT-PCR', 'Rapid Antigen Test', 'ELISA Serology', 'Blood Culture', 'Microscopy Smear', 'Antibody Titre']
        results = ['Positive', 'Positive', 'Negative', 'Inconclusive', 'Pending']
        lab_names = [
            "National Institute of Virology Satellite Lab",
            "Maharashtra State Public Health Laboratory",
            "Metropolis Diagnostic Centre",
            "SRL Diagnostics Regional Hub",
            "District Hospital Central Pathology Lab"
        ]

        # Pick random distinct cases for lab tests
        case_sample = random.sample(range(1, 251), 150)
        for idx, case_id in enumerate(case_sample, start=1):
            lab_ref = f"LAB-2026-{idx:04d}"
            ttype = random.choice(test_types)
            c_date = base_date + datetime.timedelta(days=random.randint(10, 110))
            t_date = c_date + datetime.timedelta(days=random.randint(0, 3))
            t_res = random.choice(results)
            lab_n = random.choice(lab_names)
            notes = f"Standard assay conducted adhering to ICMR/WHO surveillance test benchmark. Specimen validated."
            lab_reports_data.append((
                lab_ref, case_id, ttype, c_date, t_date, t_res, lab_n, notes
            ))

        cur.executemany("""
            INSERT INTO `laboratory_reports` (
                `report_reference`, `case_id`, `test_type`, `sample_collection_date`, `test_date`, `test_result`, `laboratory_name`, `technician_notes`
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, lab_reports_data)

        # Generate 15 Outbreak Alerts
        print("Generating 15 outbreak alerts...")
        outbreak_alerts_data = [
            ("ALT-2026-0001", 1, 1, "Dengue Cluster Surge Detected in Urban Core", "High", "2026-08-14", "Monitoring", "Cluster of 34 confirmed dengue cases within 2 km radius in Bhavani Peth and Hadapsar wards.", 25),
            ("ALT-2026-0002", 6, 2, "Acute Water-borne Gastroenteritis / Cholera Signal", "Critical", "2026-08-20", "Open", "Water contamination suspected following municipal pipeline breach in Govandi municipal sector.", 40),
            ("ALT-2026-0003", 2, 3, "Spike in Falciparum Malaria Notifications", "Moderate", "2026-09-02", "Monitoring", "Post-monsoon vector density increment noted in eastern urban fringes.", 18),
            ("ALT-2026-0004", 4, 1, "Respiratory Illness Cluster in Higher Secondary School", "Low", "2026-09-10", "Resolved", "Cluster of mild febrile respiratory illness resolved after 7-day isolation and symptom monitoring.", 8),
            ("ALT-2026-0005", 10, 5, "Leptospirosis Alert Post Waterlogging", "High", "2026-09-18", "Open", "Elevated clinical presentations of suspected leptospirosis among sanitation and fieldwork personnel.", 22),
            ("ALT-2026-0006", 8, 4, "Typhoid Fever Outbreak Linked to Commercial Food Facility", "Moderate", "2026-09-22", "Monitoring", "Epidemiological traceback connects 19 enteric fever notifications to street vendor intersection.", 15),
            ("ALT-2026-0007", 3, 6, "Chikungunya Arthralgia Surge in Cantonment Zone", "Moderate", "2026-09-28", "Monitoring", "Entomological larval index exceeds critical threshold (Breteau Index > 30).", 16),
            ("ALT-2026-0008", 7, 7, "Hepatitis A Cluster in Residential Hostel", "Low", "2026-10-02", "Resolved", "Overhead reservoir sanitized; containment measures enacted successfully.", 9),
            ("ALT-2026-0009", 1, 8, "Dengue Warning in Agricultural Periphery", "Moderate", "2026-10-06", "Open", "Rising seropositive IgM ELISA reports reported from rural taluka health posts.", 14),
            ("ALT-2026-0010", 9, 9, "Suspected Canine Rabies Exposure Threat", "Critical", "2026-10-12", "Open", "Stray animal aggression incident with 5 individuals requiring urgent RIG and cell culture vaccine.", 5),
            ("ALT-2026-0011", 5, 2, "Multidrug-Resistant TB Surveillance Scrutiny", "High", "2026-10-15", "Monitoring", "Cohort review demonstrates clustering of secondary contacts requiring active screening.", 12),
            ("ALT-2026-0012", 2, 10, "Malaria Spike in Tribal Forest Blocks", "High", "2026-10-18", "Open", "Seasonal migratory labor return correlated with surge in falciparum blood smears.", 28),
            ("ALT-2026-0013", 1, 11, "Dengue Micro-Cluster in Suburban Housing Society", "Informational", "2026-10-20", "Open", "Preventative vector fogging requested by regional health inspector.", 6),
            ("ALT-2026-0014", 6, 12, "Diarrheal Disease Advisory Coastal Fishing Hamlets", "Moderate", "2026-10-21", "Monitoring", "Bacterial culture isolates indicate contamination of shallow borewell waters.", 17),
            ("ALT-2026-0015", 4, 3, "COVID-19 Variant Genomic Watch", "Low", "2026-10-22", "Open", "Routine sewage surveillance detected slight spike in viral RNA copy numbers.", 10)
        ]

        cur.executemany("""
            INSERT INTO `outbreak_alerts` (
                `alert_reference`, `disease_id`, `region_id`, `alert_title`, `alert_level`, `detection_date`, `status`, `description`, `cases_threshold_exceeded`
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, outbreak_alerts_data)

    conn.close()
    print("Database seeding completed successfully!")

    # Now generate pure seed.sql so user can also import it in phpMyAdmin!
    dump_seed_sql()

def dump_seed_sql():
    print("Exporting database/seed.sql for manual phpMyAdmin / CLI import...")
    conn = get_connection(include_db=True)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_sql_path = os.path.join(base_dir, "database", "seed.sql")

    tables = ["regions", "diseases", "healthcare_facilities", "patients", "surveillance_cases", "laboratory_reports", "outbreak_alerts", "audit_logs"]

    with open(seed_sql_path, "w", encoding="utf-8") as f:
        f.write("-- ============================================================================\n")
        f.write("-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE\n")
        f.write("-- Synthetic Demonstration Seed Dataset (seed.sql)\n")
        f.write("-- Compatible with phpMyAdmin and MySQL 8.0+ / MariaDB 10.4+\n")
        f.write("-- ============================================================================\n\n")
        f.write("USE `disease_surveillance_db`;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        with conn.cursor() as cur:
            for table in tables:
                cur.execute(f"SELECT * FROM `{table}`")
                rows = cur.fetchall()
                if not rows:
                    continue
                f.write(f"-- Data for table `{table}` ({len(rows)} records)\n")
                f.write(f"TRUNCATE TABLE `{table}`;\n")
                
                columns = list(rows[0].keys())
                col_str = ", ".join([f"`{c}`" for c in columns])

                for chunk_start in range(0, len(rows), 50):
                    chunk = rows[chunk_start:chunk_start+50]
                    f.write(f"INSERT INTO `{table}` ({col_str}) VALUES\n")
                    value_lines = []
                    for r in chunk:
                        vals = []
                        for col in columns:
                            val = r[col]
                            if val is None:
                                vals.append("NULL")
                            elif isinstance(val, (int, float)):
                                vals.append(str(val))
                            elif isinstance(val, (datetime.date, datetime.datetime)):
                                vals.append(f"'{val}'")
                            else:
                                escaped = str(val).replace("\\", "\\\\").replace("'", "\\'")
                                vals.append(f"'{escaped}'")
                        value_lines.append(f"  ({', '.join(vals)})")
                    f.write(",\n".join(value_lines) + ";\n\n")

        f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
    conn.close()
    print(f"seed.sql generated at: {seed_sql_path}")

if __name__ == "__main__":
    seed_database()
