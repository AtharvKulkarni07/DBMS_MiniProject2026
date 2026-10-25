"""
Disease Surveillance and Epidemiology Database
Analytical Queries Runner for Terminal / CMD Demonstration
"""

import os
import pymysql

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "disease_surveillance_db")

def run_queries():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

    queries = [
        ("Query 1: Diseases with Highest Case Volume (JOIN, GROUP BY, Aggregation)",
         """
         SELECT 
             d.disease_code, d.disease_name, d.category,
             COUNT(c.case_id) AS total_cases,
             SUM(CASE WHEN c.case_classification = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_cases
         FROM diseases d
         JOIN surveillance_cases c ON d.disease_id = c.disease_id
         GROUP BY d.disease_code, d.disease_name, d.category
         ORDER BY total_cases DESC
         LIMIT 5;
         """),

        ("Query 2: Top Confirmed Cases by Region (INNER JOIN, WHERE, GROUP BY)",
         """
         SELECT 
             r.region_name, r.district_code, r.region_type,
             COUNT(c.case_id) AS confirmed_case_count
         FROM regions r
         JOIN surveillance_cases c ON r.region_id = c.region_id
         WHERE c.case_classification = 'Confirmed'
         GROUP BY r.region_name, r.district_code, r.region_type
         ORDER BY confirmed_case_count DESC
         LIMIT 5;
         """),

        ("Query 3: Healthcare Facilities with Most Submissions",
         """
         SELECT 
             f.facility_name, f.facility_code, f.facility_type, r.region_name,
             COUNT(c.case_id) AS total_submissions
         FROM healthcare_facilities f
         JOIN regions r ON f.region_id = r.region_id
         LEFT JOIN surveillance_cases c ON f.facility_id = c.facility_id
         GROUP BY f.facility_name, f.facility_code, f.facility_type, r.region_name
         ORDER BY total_submissions DESC
         LIMIT 5;
         """),

        ("Query 8: Regional Hotspot Ranking (Window Functions: RANK, DENSE_RANK, ROW_NUMBER)",
         """
         SELECT 
             r.region_name, r.district_code,
             COUNT(c.case_id) AS confirmed_cases,
             ROW_NUMBER() OVER (ORDER BY COUNT(c.case_id) DESC) AS seq_rank,
             RANK() OVER (ORDER BY COUNT(c.case_id) DESC) AS std_rank,
             DENSE_RANK() OVER (ORDER BY COUNT(c.case_id) DESC) AS dense_rank
         FROM regions r
         LEFT JOIN surveillance_cases c ON r.region_id = c.region_id AND c.case_classification = 'Confirmed'
         GROUP BY r.region_name, r.district_code
         ORDER BY confirmed_cases DESC
         LIMIT 5;
         """),

        ("Query 9: Surveillance Cases without Confirmatory Lab Assay (LEFT JOIN ... IS NULL)",
         """
         SELECT 
             c.case_reference, p.patient_reference, d.disease_name, c.date_reported
         FROM surveillance_cases c
         JOIN patients p ON c.patient_id = p.patient_id
         JOIN diseases d ON c.disease_id = d.disease_id
         LEFT JOIN laboratory_reports lr ON c.case_id = lr.case_id
         WHERE lr.report_id IS NULL
         ORDER BY c.date_reported DESC
         LIMIT 5;
         """)
    ]

    with conn.cursor() as cur:
        for title, sql in queries:
            print("=" * 80)
            print(title)
            print("=" * 80)
            cur.execute(sql)
            rows = cur.fetchall()
            if not rows:
                print("No results returned.")
                continue
            headers = list(rows[0].keys())
            header_str = " | ".join([f"{h:<22}" for h in headers])
            print(header_str)
            print("-" * len(header_str))
            for r in rows:
                print(" | ".join([f"{str(r[h]):<22}" for h in headers]))
            print()

    conn.close()

if __name__ == "__main__":
    run_queries()
