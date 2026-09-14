from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
import os

app = Flask(__name__, static_folder="/home/ubuntu/app")
CORS(app)

DB_HOST = os.getenv(
    "DB_HOST",
    "emergency-response-db.cl0ms62ioflt.ap-south-1.rds.amazonaws.com"
)
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "YOUR_DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "emergencydb")

def db():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

@app.get("/api/health")
def health():
    try:
        conn = db()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return jsonify({"status": "ok", "service": "RAHAT API", "database": db_status})

@app.get("/api/incidents")
def incidents():
    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, title, description, location,
                       severity, status, created_at
                FROM incidents
                ORDER BY created_at DESC
            """)
            rows = cur.fetchall()

        for row in rows:
            if row["created_at"]:
                row["created_at"] = row["created_at"].isoformat()

        return jsonify(rows)
    finally:
        conn.close()

@app.post("/api/incidents")
def create_incident():
    data = request.get_json() or {}

    for field in ["title", "description", "location", "severity"]:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    severity = str(data["severity"]).upper()
    if severity not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        return jsonify({"error": "Invalid severity"}), 400

    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO incidents
                (title, description, location, severity, status)
                VALUES (%s, %s, %s, %s, 'OPEN')
            """, (
                data["title"],
                data["description"],
                data["location"],
                severity
            ))
            new_id = cur.lastrowid
            
            cur.execute("""
                SELECT id, title, description, location,
                       severity, status, created_at
                FROM incidents WHERE id = %s
            """, (new_id,))
            new_incident = cur.fetchone()
            if new_incident and new_incident["created_at"]:
                new_incident["created_at"] = new_incident["created_at"].isoformat()

            return jsonify(new_incident), 201
    finally:
        conn.close()

@app.patch("/api/incidents/<int:incident_id>")
def update_incident(incident_id):
    data = request.get_json() or {}
    status = str(data.get("status", "")).upper()

    if status not in ["OPEN", "IN_PROGRESS", "RESOLVED"]:
        return jsonify({"error": "Invalid status"}), 400

    conn = db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM incidents WHERE id=%s", (incident_id,))
            if not cur.fetchone():
                return jsonify({"error": "Incident not found"}), 404

            cur.execute(
                "UPDATE incidents SET status=%s WHERE id=%s",
                (status, incident_id)
            )
            
            cur.execute("""
                SELECT id, title, description, location,
                       severity, status, created_at
                FROM incidents WHERE id = %s
            """, (incident_id,))
            updated = cur.fetchone()
            if updated and updated["created_at"]:
                updated["created_at"] = updated["created_at"].isoformat()

        return jsonify(updated)
    finally:
        conn.close()

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def frontend(path):
    return send_from_directory("/home/ubuntu/app", path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)