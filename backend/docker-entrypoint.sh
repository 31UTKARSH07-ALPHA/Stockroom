#!/bin/sh
set -eu

python - <<'PY'
import subprocess

from sqlalchemy import text

from app.database import engine

# Serialize startup migrations when multiple Kubernetes replicas launch together.
with engine.connect() as connection:
    connection.execute(text("SELECT pg_advisory_lock(314159265)"))
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True)
    finally:
        connection.execute(text("SELECT pg_advisory_unlock(314159265)"))
PY
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
