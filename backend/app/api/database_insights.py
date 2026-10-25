from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List
import subprocess
import sys
import os
from app.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/api/database-insights", tags=["Database Insights (Academic / Viva)"])

@router.get("/overview")
def get_database_overview(db: Session = Depends(get_db)):
    # Query MySQL information_schema for physical tables
    tables_query = text("""
        SELECT 
            TABLE_NAME, 
            ENGINE, 
            TABLE_ROWS, 
            DATA_LENGTH, 
            INDEX_LENGTH, 
            CREATE_TIME,
            TABLE_COLLATION
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = :schema_name AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME ASC
    """)
    tables_res = db.execute(tables_query, {"schema_name": settings.DB_NAME}).fetchall()

    table_inventory = []
    for row in tables_res:
        # Get exact row count with a fast count
        cnt = db.execute(text(f"SELECT COUNT(*) FROM `{row.TABLE_NAME}`")).scalar()
        table_inventory.append({
            "table_name": row.TABLE_NAME,
            "engine": row.ENGINE,
            "row_count": cnt,
            "data_size_kb": round((row.DATA_LENGTH or 0) / 1024, 2),
            "index_size_kb": round((row.INDEX_LENGTH or 0) / 1024, 2),
            "collation": row.TABLE_COLLATION
        })

    # Available views
    views_query = text("""
        SELECT TABLE_NAME 
        FROM information_schema.VIEWS 
        WHERE TABLE_SCHEMA = :schema_name
    """)
    views_res = db.execute(views_query, {"schema_name": settings.DB_NAME}).fetchall()
    views_list = [
        {
            "view_name": r.TABLE_NAME,
            "purpose": "Analytical epidemiological denormalization & aggregation view"
        }
        for r in views_res
    ]

    # Stored procedures
    procs_query = text("""
        SELECT ROUTINE_NAME, ROUTINE_TYPE, DTD_IDENTIFIER 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_SCHEMA = :schema_name
    """)
    procs_res = db.execute(procs_query, {"schema_name": settings.DB_NAME}).fetchall()
    procedures_list = [
        {
            "name": r.ROUTINE_NAME,
            "type": r.ROUTINE_TYPE,
            "return_type": r.DTD_IDENTIFIER
        }
        for r in procs_res
    ]

    # Triggers
    triggers_query = text("""
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING 
        FROM information_schema.TRIGGERS 
        WHERE TRIGGER_SCHEMA = :schema_name
    """)
    triggers_res = db.execute(triggers_query, {"schema_name": settings.DB_NAME}).fetchall()
    triggers_list = [
        {
            "trigger_name": r.TRIGGER_NAME,
            "event": r.EVENT_MANIPULATION,
            "table": r.EVENT_OBJECT_TABLE,
            "timing": r.ACTION_TIMING
        }
        for r in triggers_res
    ]

    return {
        "database_name": settings.DB_NAME,
        "rdbms_engine": "MySQL / MariaDB (InnoDB Storage Engine)",
        "normalization_level": "3NF with BCNF Verification",
        "tables": table_inventory,
        "views": views_list,
        "procedures": procedures_list,
        "triggers": triggers_list
    }

@router.get("/indexes")
def get_indexes(db: Session = Depends(get_db)):
    idx_query = text("""
        SELECT 
            TABLE_NAME, 
            INDEX_NAME, 
            NON_UNIQUE, 
            COLUMN_NAME, 
            SEQ_IN_INDEX, 
            INDEX_TYPE 
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = :schema_name 
        ORDER BY TABLE_NAME ASC, INDEX_NAME ASC, SEQ_IN_INDEX ASC
    """)
    rows = db.execute(idx_query, {"schema_name": settings.DB_NAME}).fetchall()
    indexes = []
    for r in rows:
        indexes.append({
            "table_name": r.TABLE_NAME,
            "index_name": r.INDEX_NAME,
            "is_unique": r.NON_UNIQUE == 0,
            "column_name": r.COLUMN_NAME,
            "seq_in_index": r.SEQ_IN_INDEX,
            "index_type": r.INDEX_TYPE
        })
    return indexes

@router.get("/explain-query")
def explain_query(query_type: str = "indexed_disease_temporal", db: Session = Depends(get_db)):
    """Demonstrate MySQL EXPLAIN execution plan for academic examination."""
    if query_type == "indexed_disease_temporal":
        sql = """
            EXPLAIN 
            SELECT case_id, case_reference, date_reported 
            FROM surveillance_cases 
            WHERE disease_id = 1 AND date_reported >= '2026-08-01'
        """
        explanation_note = "Uses composite index idx_cases_disease_date (ref / range access type), avoiding a full table scan."
    elif query_type == "region_hotspot_grouping":
        sql = """
            EXPLAIN 
            SELECT r.region_name, COUNT(c.case_id) as total 
            FROM regions r 
            JOIN surveillance_cases c ON r.region_id = c.region_id 
            GROUP BY r.region_name
        """
        explanation_note = "Demonstrates relational JOIN using primary key fk_cases_region."
    else:
        sql = """
            EXPLAIN 
            SELECT alert_id, alert_title, alert_level 
            FROM outbreak_alerts 
            WHERE alert_level = 'Critical' AND status = 'Open'
        """
        explanation_note = "Uses composite index idx_alerts_level_status for instantaneous filter."

    plan_rows = db.execute(text(sql)).fetchall()
    plan_dicts = [dict(row._mapping) for row in plan_rows]

    return {
        "query_type": query_type,
        "sql_evaluated": sql.strip(),
        "academic_explanation": explanation_note,
        "execution_plan": plan_dicts
    }

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    sql = text("""
        SELECT log_id, entity_type, entity_id, action_type, old_values, new_values, changed_by, logged_at, details
        FROM audit_logs
        ORDER BY logged_at DESC, log_id DESC
        LIMIT :limit
    """)
    rows = db.execute(sql, {"limit": limit}).fetchall()
    return [dict(r._mapping) for r in rows]

@router.post("/reset-database")
def reset_and_seed_database():
    """Trigger complete deterministic re-initialization for live demo."""
    try:
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scripts", "init_database.py")
        result = subprocess.run([sys.executable, script_path], capture_output=True, text=True, check=True)
        return {
            "status": "success",
            "message": "Database successfully re-initialized and synthetic dataset seeded.",
            "output": result.stdout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")
