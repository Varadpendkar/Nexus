# SKILL: postgresql-setup
**Layer:** 19 — Database
**Goal:** Configure PostgreSQL for local development and production-like deployments with secure connections, repeatable schema setup, reliable migrations, observability, and a tested recovery path.

---

## Why This Matters (Senior Perspective)

A PostgreSQL installation that “works on my laptop” can still fail the first time a portfolio or client site receives real traffic. The common failures are not dramatic syntax errors: the app connects as a superuser, a database is exposed to the network, credentials are committed to Git, the application silently points at a developer database in production, or a deployment starts before its schema is ready. A connection pool can also exhaust the server’s connection limit, while a missing backup turns a small accidental `DELETE` into permanent data loss. These failures affect creative sites too: a project gallery can load perfectly in a demo and then fail during a client launch because the production environment has a different connection string or missing extension.

A beginner often treats setup as a one-time installation task: install PostgreSQL, create a database, paste a URI into code, and move on. A senior treats it as a reproducible operating procedure. The database version, roles, permissions, extensions, schema changes, environment variables, health checks, backup policy, and restore test are all part of setup. The aim is not merely to make a connection succeed; it is to make the connection secure, diagnosable, and repeatable across a laptop, CI pipeline, staging environment, and production deployment.

For freelance and portfolio work, this discipline prevents awkward client-facing failures. A CMS-backed case-study page should not go blank because the database was restarted, a deployment role cannot run migrations, or the app is accidentally using a local database. Start with least privilege, explicit configuration, parameterized queries, migrations, and a recovery plan. Those choices cost little in a small project and are much harder to retrofit after customer data exists.

---

## Core Concepts

### 1. PostgreSQL’s server, database, schema, and role are different things

Think of PostgreSQL as a server process that can host multiple databases. Each database contains schemas, and schemas contain tables, views, functions, and other objects. Roles represent identities and permissions; a role may be allowed to log in, own objects, or inherit privileges. Keeping these boundaries clear prevents the “everything runs as postgres” shortcut from spreading into application code.

```sql
-- Create a dedicated database owner role and application login.
-- Separate ownership from the runtime identity to reduce accidental DDL access.
CREATE ROLE portfolio_owner NOLOGIN;
CREATE ROLE portfolio_app LOGIN PASSWORD 'replace-with-a-secret-from-your-secret-manager';

CREATE DATABASE portfolio_db OWNER portfolio_owner;
REVOKE ALL ON DATABASE portfolio_db FROM PUBLIC;
GRANT CONNECT ON DATABASE portfolio_db TO portfolio_app;
```

The SQL above illustrates the roles and database boundaries; in a real deployment, inject the password through a secret manager or an interactive provisioning step rather than storing it in a committed SQL file. Use a separate migration identity when the application must not alter schema objects during normal requests.

**Naive approach:** Run every command as the built-in `postgres` superuser and reuse that identity in the web app.

**Correct approach:** Create a database owner/migration role and a minimally privileged runtime role; grant only the access the app requires.

**Gotcha:** PostgreSQL roles are cluster-wide, while schemas and tables belong to a database. Creating a role does not automatically grant it access to every database.

### 2. Install and verify the server deliberately

Choose a supported PostgreSQL major version that your hosting provider and application libraries support. Use the official package manager or container image for your platform, then verify both the client and server. `psql --version` only proves that a client binary exists; it does not prove that a server is running or that the client is connected to the expected instance.

```bash
# Verify the command-line client first.
psql --version

# On systems using systemd, inspect the service rather than guessing.
sudo systemctl status postgresql

# Ask the connected server for its actual version and address.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -c "SELECT version(), inet_server_addr(), inet_server_port();"
```

For a local portfolio project, a container can make the database version explicit and easy to reproduce. A managed database may be simpler for deployment because backups, patching, and monitoring can be provider-managed, but the team still owns credentials, access policy, migration safety, and restore testing.

**Naive approach:** Assume a successful `psql` command means the application is connected to the right server.

**Correct approach:** Verify the server version, database name, server address, role, and connection mode from the same configuration the app uses.

**Gotcha:** Unix socket connections and TCP connections can use different authentication rules in `pg_hba.conf`; a command that works locally may fail when the app connects over TCP.

### 3. Keep connection configuration outside source code

A connection string commonly contains host, port, database, username, and password. Treat it as a secret when it contains credentials. Store it in environment configuration for local development and in a secret manager or protected deployment setting for hosted environments. Commit only a `.env.example` with safe, non-working values.

```python
import os
import psycopg
from psycopg.rows import dict_row

def open_database_connection():
    # The deployment environment supplies credentials; source code never owns them.
    database_url = os.environ["DATABASE_URL"]
    return psycopg.connect(
        database_url,
        row_factory=dict_row,
        connect_timeout=5,
        application_name="portfolio-web",
    )

with open_database_connection() as connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user")
        print(cursor.fetchone())
```

This example uses Psycopg 3 and relies on the standard `DATABASE_URL` environment variable. In production, avoid printing the URL or exception messages that might contain credentials. Log a safe error category and a request/correlation ID instead.

**Naive approach:** Write `postgresql://user:password@localhost/app` directly in a Python file and commit it.

**Correct approach:** Read `os.environ["DATABASE_URL"]`, keep `.env` out of Git, and use different secrets for local, staging, and production.

**Gotcha:** Passwords containing reserved URI characters must be percent-encoded in a URI, or supplied through a driver configuration mechanism that handles them correctly.

### 4. Understand local authentication and `pg_hba.conf`

PostgreSQL uses host-based authentication rules to decide which clients may connect, from which addresses, to which databases, and with which authentication method. Rules are evaluated in order; the first matching rule is used. A broad trust rule can let an unintended local or network user connect without a password. Prefer SCRAM password authentication for password-based TCP access and keep network exposure narrow.

```conf
# Example entries in pg_hba.conf; adapt addresses to the deployment.
# Local Unix-socket administration may use peer authentication.
local   all             postgres                                peer

# TCP access from the application's private subnet requires SCRAM.
hostssl portfolio_db    portfolio_app   10.20.0.0/16            scram-sha-256
```

After changing authentication configuration, reload PostgreSQL and test with the exact application identity from the expected network path. For remote connections, configure TLS certificates and server-side TLS policy as appropriate for the hosting environment.

**Naive approach:** Add `host all all 0.0.0.0/0 trust` to make a connection error disappear.

**Correct approach:** Restrict the database, role, source network, and authentication method; use TLS for remote connections.

**Gotcha:** `listen_addresses` controls which interfaces accept TCP connections, while `pg_hba.conf` controls which clients may authenticate. Changing one does not replace the other.

### 5. Create an application schema with intentional ownership

Schemas provide namespaces inside a database. A dedicated schema can separate application objects from extensions or administrative objects, but permissions must be explicit. A runtime role that can create arbitrary objects in a shared schema may be able to shadow names or interfere with migrations.

```sql
-- Run as an authorized database owner after connecting to portfolio_db.
CREATE SCHEMA app AUTHORIZATION portfolio_owner;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO portfolio_app;

-- Runtime reads and writes existing tables; it does not own the schema.
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA app TO portfolio_app;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA app TO portfolio_app;

-- Apply the same policy to objects created later by the owner role.
ALTER DEFAULT PRIVILEGES FOR ROLE portfolio_owner IN SCHEMA app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO portfolio_app;

ALTER DEFAULT PRIVILEGES FOR ROLE portfolio_owner IN SCHEMA app
GRANT USAGE, SELECT ON SEQUENCES TO portfolio_app;
```

The migration process must create objects as `portfolio_owner` for these default privileges to apply. If migrations use a different owner, configure default privileges for that actual role. Test grants using the runtime login, not just the administrator.

**Naive approach:** Grant `ALL PRIVILEGES ON SCHEMA app` and assume table privileges follow automatically.

**Correct approach:** Separate schema `USAGE`/`CREATE` permissions from table and sequence permissions, and configure default privileges for future objects.

**Gotcha:** Granting privileges on existing tables does not automatically grant the same privileges on tables created later; default privileges handle future objects only for the specified creating role.

### 6. Use a connection pool and finite timeouts

Each PostgreSQL connection consumes server resources. Creating a new connection for every query can add latency, while opening too many connections can exhaust `max_connections` and block healthy requests. A pool reuses connections and places a ceiling on concurrent database work. Set pool limits based on the total across every app instance, background worker, migration job, and administrative connection.

```python
import os
from psycopg_pool import ConnectionPool

pool = ConnectionPool(
    conninfo=os.environ["DATABASE_URL"],
    min_size=1,
    max_size=8,
    timeout=5,
    kwargs={"connect_timeout": 5, "application_name": "portfolio-web"},
    open=True,
)

def fetch_published_projects():
    # The pool leases a connection and returns it when the context exits.
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, slug, title
                FROM app.projects
                WHERE published = TRUE
                ORDER BY published_at DESC
                LIMIT 24
            """)
            return cursor.fetchall()

# Application shutdown hook:
# pool.close()
```

The pool size shown is an example, not a universal recommendation. For serverless functions or platforms that create many short-lived instances, consider a provider pooler such as PgBouncer or the managed provider’s connection proxy. Use transaction pooling only after checking driver features and application behavior.

**Naive approach:** Set a pool size of 100 for each of 10 app replicas without calculating the total.

**Correct approach:** Budget connections globally, cap pool sizes, set acquisition/connect timeouts, and observe pool saturation.

**Gotcha:** A pooled connection may preserve session state between requests. Avoid relying on session-level settings unless your pool mode and reset behavior guarantee them.

### 7. Use parameterized queries for every value

SQL parameters separate query structure from user-provided data. String concatenation can turn a search term, filter, or form field into executable SQL. Parameterization is both a security control and a correctness control; it also handles quoting and data types reliably.

```python
def find_project_by_slug(connection, requested_slug):
    with connection.cursor() as cursor:
        # The placeholder is a value parameter, not string interpolation.
        cursor.execute(
            "SELECT id, title FROM app.projects WHERE slug = %s",
            (requested_slug,),
        )
        return cursor.fetchone()

# Wrong: f"SELECT * FROM app.projects WHERE slug = '{requested_slug}'"
# Correct: pass the value separately as a parameter.
```

Identifiers such as table names and sort directions generally cannot be passed as ordinary value parameters. If users can choose a sort option, map a small allowlist of application-level choices to fixed SQL fragments; never paste arbitrary input into an identifier position.

**Naive approach:** Build SQL with f-strings because the input “comes from a dropdown.”

**Correct approach:** Bind values through the driver and allowlist any dynamic identifier or ordering choice.

**Gotcha:** A placeholder represents a value, not a whole list of SQL syntax or an identifier. For `IN` queries, use the driver’s supported list/array adaptation or generate a safe placeholder list.

### 8. Set up health checks that test the right thing

A process-level health check answers whether the application process is alive. A readiness check should answer whether the app can serve traffic, including whether critical dependencies are usable. A database health check should be lightweight and bounded; it should not run a full table scan or expose credentials in its response.

```python
from flask import Flask, jsonify
from psycopg import OperationalError

app = Flask(__name__)

@app.get("/health/live")
def liveness():
    # Liveness should not fail merely because PostgreSQL has a brief outage.
    return jsonify(status="alive"), 200

@app.get("/health/ready")
def readiness():
    try:
        with open_database_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        return jsonify(status="ready"), 200
    except (OperationalError, KeyError):
        # Keep internals private; detailed diagnostics belong in protected logs.
        return jsonify(status="not_ready"), 503
```

Wire readiness to the platform’s routing or deployment policy and give the database call a short timeout. Keep liveness separate so a transient database failure does not cause an orchestrator to restart every healthy application process in a loop.

**Naive approach:** Return HTTP 200 from every health endpoint regardless of dependency state.

**Correct approach:** Separate liveness from readiness and use a bounded database probe for readiness.

**Gotcha:** If every replica performs an expensive check every second, health monitoring itself can increase load during an outage. Keep checks cheap and tune intervals.

### 9. Make migrations the source of schema truth

A migration is a versioned change to the database schema or data. It lets developers, CI, staging, and production converge on the same structure. Do not rely on manually clicking through a database GUI or running undocumented SQL from memory. Use a migration tool appropriate to the stack, such as Alembic for SQLAlchemy, Django migrations, Flyway, or a carefully managed SQL migration directory.

```sql
-- migrations/20261021_001_create_projects.sql
BEGIN;

CREATE TABLE app.projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT projects_published_timestamp_check
        CHECK (published = FALSE OR published_at IS NOT NULL)
);

COMMIT;
```

This is a transactional migration for operations PostgreSQL supports inside a transaction. Some operations, notably `CREATE INDEX CONCURRENTLY`, cannot run inside a transaction block and require a migration tool configuration that supports non-transactional migrations.

**Naive approach:** Edit the original migration after it has already been applied in shared environments.

**Correct approach:** Treat applied migrations as immutable and add a new migration to correct or extend the schema.

**Gotcha:** A migration that works on an empty local database may fail on production data because existing rows violate a new `NOT NULL`, unique, or check constraint.

### 10. Configure safe defaults for timestamps and transactions

Use `TIMESTAMPTZ` for points in time, store timestamps consistently, and convert to the user’s timezone at the presentation layer. Use transactions when several statements must succeed or fail together. Keep transactions short: long-running transactions can hold locks, delay vacuum cleanup, and increase contention.

```python
def publish_project(connection, project_id):
    # The context commits on success and rolls back when an exception escapes.
    with connection.transaction():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE app.projects
                SET published = TRUE,
                    published_at = now()
                WHERE id = %s
                RETURNING id, slug, published_at
                """,
                (project_id,),
            )
            published_project = cursor.fetchone()
            if published_project is None:
                raise LookupError("Project not found")
            return published_project
```

The update and returned row are part of one transaction. If the project does not exist, the exception triggers rollback. For external actions such as sending an email, do not assume a database rollback can undo the external side effect; use an outbox or a post-commit workflow when reliable delivery matters.

**Naive approach:** Execute related updates independently and hope all of them succeed.

**Correct approach:** Wrap logically atomic database changes in a transaction and keep network calls outside the transaction.

**Gotcha:** A transaction does not automatically make a workflow involving email, payment providers, or object storage atomic; those systems need coordination or compensating actions.

### 11. Index for real query shapes, not intuition

Indexes can reduce reads, but they consume storage and slow writes because each relevant index must be maintained. Design them around actual predicates, join keys, and sort orders. A B-tree index is the usual starting point for equality, range, and ordered retrieval. A partial index can be effective when queries consistently filter on a stable subset, such as published projects.

```sql
-- Equality lookup for a public URL.
CREATE UNIQUE INDEX projects_slug_uidx
ON app.projects (slug);

-- Supports a frequent published feed ordered by time.
CREATE INDEX projects_published_feed_idx
ON app.projects (published_at DESC)
WHERE published = TRUE;

-- Supports a join from project comments to their parent project.
CREATE INDEX project_comments_project_created_idx
ON app.project_comments (project_id, created_at DESC);
```

Before adding an index, inspect the query with `EXPLAIN (ANALYZE, BUFFERS)` in a safe environment with representative data. `ANALYZE` executes the query, so use caution with expensive statements and production data. The planner may correctly choose a sequential scan for a small table or a query returning a large fraction of rows.

**Naive approach:** Add an index to every column “for speed.”

**Correct approach:** Start from the query workload, validate with a query plan, and measure both read improvement and write/storage cost.

**Gotcha:** Column order matters for multicolumn B-tree indexes. An index on `(project_id, created_at)` is not interchangeable with `(created_at, project_id)` for every predicate.

### 12. Backups are useful only if restoration works

A backup policy must specify frequency, retention, storage location, encryption, access controls, and a recovery-time objective (RTO) and recovery-point objective (RPO). A logical backup with `pg_dump` is useful for many small deployments; larger production systems may require managed automated backups, physical backups, and point-in-time recovery using WAL archiving. A successful backup command is not proof that the data can be restored.

```bash
# Write a compressed custom-format logical backup.
pg_dump --format=custom --no-owner \
  --file="portfolio-$(date +%F).dump" \
  "$DATABASE_URL"

# Restore into a separate test database to validate the artifact.
createdb portfolio_restore_test
pg_restore --dbname=portfolio_restore_test \
  --no-owner --exit-on-error \
  "portfolio-2026-10-21.dump"

# Run a small validation query against the restored database.
psql "postgresql://restore_tester@localhost/portfolio_restore_test" \
  -X -v ON_ERROR_STOP=1 \
  -c "SELECT count(*) FROM app.projects;"
```

The example assumes a Unix-like shell and a date matching the actual backup file. Store backup artifacts outside the database host and protect them like production data. Use a secret manager or `.pgpass` with restrictive file permissions for authentication; do not put passwords directly into shell history.

**Naive approach:** Keep a backup on the same machine and never test it.

**Correct approach:** Store protected backups separately, monitor job success, and rehearse restore into an isolated database.

**Gotcha:** A logical dump is not the same as a point-in-time recovery plan. If the RPO requires recovery to a moment between backups, evaluate WAL archiving or the managed service’s PITR feature.

### 13. Observe slow queries and connection pressure

PostgreSQL exposes statistics that help explain whether latency comes from slow queries, lock waits, connection exhaustion, or resource pressure. Enable `pg_stat_statements` where supported and permitted, configure appropriate logging thresholds, and inspect `pg_stat_activity` during incidents. Avoid logging sensitive query parameters in a way that leaks personal or customer data.

```sql
-- Requires pg_stat_statements to be installed and configured by an administrator.
SELECT
    query,
    calls,
    round(mean_exec_time::numeric, 2) AS mean_ms,
    round(total_exec_time::numeric, 2) AS total_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Inspect active sessions without exposing credentials.
SELECT pid, usename, application_name, state,
       wait_event_type, wait_event,
       now() - query_start AS query_age
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start NULLS LAST;
```

Use metrics to distinguish a query that is individually slow from one that is called thousands of times. A small query repeated in an N+1 pattern can dominate total time even when each execution looks fast. Capture plans with representative data and review them before making index or query changes.

**Naive approach:** Increase database CPU or connection limits whenever pages feel slow.

**Correct approach:** Identify the dominant query, call count, lock wait, and pool behavior before selecting a fix.

**Gotcha:** `pg_stat_statements` query text may be normalized and aggregated; it is not a substitute for request-level tracing or understanding which endpoint triggers the workload.

### 14. Apply the full setup to a client portfolio deployment

A production-ready setup is a chain: provision a supported database, create a least-privileged runtime role, configure secrets, apply migrations once through a controlled deployment step, run readiness checks, monitor errors and query latency, and verify a restore path. For a creative portfolio with a CMS, public project pages should use read-only access where possible, while editor actions require authenticated application authorization. Never expose database credentials to browser JavaScript or build-time public environment variables.

```python
import os
import logging
import psycopg
from psycopg_pool import ConnectionPool

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("portfolio.database")

database_url = os.environ["DATABASE_URL"]
pool = ConnectionPool(
    conninfo=database_url,
    min_size=1,
    max_size=int(os.getenv("DB_POOL_MAX", "8")),
    timeout=5,
    kwargs={"connect_timeout": 5, "application_name": "portfolio-web"},
    open=True,
)

def get_public_projects():
    try:
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT slug, title, summary, cover_image_url
                    FROM app.projects
                    WHERE published = TRUE
                    ORDER BY published_at DESC
                    LIMIT 24
                """)
                return cursor.fetchall()
    except psycopg.Error:
        # Avoid logging the DSN or raw user data; log enough to correlate an incident.
        logger.exception("Database read failed for public project listing")
        raise
```

This endpoint uses a bounded result set and does not let the browser connect directly to PostgreSQL. The application layer still needs authorization for editing, validation for stored URLs, and a clear error response to visitors. A deploy checklist should confirm the migration status, backup freshness, role grants, TLS mode, and readiness result before routing traffic.

**Naive approach:** Deploy the site with a database superuser URL and debug errors shown to visitors.

**Correct approach:** Use a restricted role, private network/TLS, secret-managed configuration, migration automation, safe logging, and tested recovery.

**Gotcha:** A successful `SELECT 1` only proves a basic connection. It does not prove that the runtime role can read the required tables, that migrations are current, or that the app has enough pool capacity under load.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Environment-specific configuration without code branching

**What it does:** Uses the same application code in development, staging, and production while each environment supplies its own connection settings.

**When to use it:** When a portfolio is deployed to a preview environment and production, or when multiple developers need separate local databases.

```python
import os
from urllib.parse import urlparse

def validate_database_configuration():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgres", "postgresql"} or not parsed.hostname:
        raise RuntimeError("DATABASE_URL must be a PostgreSQL connection URI")

    # Do not print parsed.password or the full URI in logs.
    return database_url
```

Validation should fail fast during startup, but never echo the secret in the error. For cloud providers that use separate host, port, and credential fields, validate the corresponding variables instead of forcing everything into a URI.

### Pattern 2: Migration identity separate from runtime identity

**What it does:** Gives schema-changing permissions to a deployment identity while keeping normal web requests limited to data operations.

**When to use it:** When CI/CD applies migrations before the new application version receives traffic.

```sql
-- Run with an administrative provisioning identity.
CREATE ROLE portfolio_migrator LOGIN;
GRANT portfolio_owner TO portfolio_migrator;

-- The runtime role receives data access, not ownership.
GRANT CONNECT ON DATABASE portfolio_db TO portfolio_app;
GRANT USAGE ON SCHEMA app TO portfolio_app;
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA app TO portfolio_app;
```

The deployment pipeline must obtain the migrator credential from a secret store and run migrations in a controlled step. Do not give the runtime role membership in the owner role simply to avoid a permission error.

### Pattern 3: Bounded retry for transient connection failures

**What it does:** Retries a small number of transient connection attempts with exponential backoff and jitter, while avoiding endless retries on invalid credentials or bad SQL.

**When to use it:** During startup when a container may become ready slightly before the database endpoint.

```python
import random
import time
import psycopg

def connect_with_bounded_retry(database_url, attempts=4):
    for attempt in range(attempts):
        try:
            return psycopg.connect(database_url, connect_timeout=3)
        except psycopg.OperationalError:
            if attempt == attempts - 1:
                raise
            # Jitter prevents many replicas from retrying at exactly the same moment.
            delay_seconds = min(0.5 * (2 ** attempt), 4.0)
            time.sleep(delay_seconds + random.uniform(0, 0.25))
```

Classify errors in mature applications so invalid credentials and configuration mistakes fail promptly rather than being retried. When a pool is used, configure its own retry and health behavior rather than wrapping every query in a broad retry loop.

### Pattern 4: Safe deployment sequence

**What it does:** Applies compatible schema changes before switching application traffic, reducing the chance of old and new code disagreeing about the schema.

**When to use it:** When adding a field to a CMS-backed project table or changing how a page reads data.

```bash
set -euo pipefail

# The CI environment supplies a secret DATABASE_URL for the migration identity.
: "${DATABASE_URL:?DATABASE_URL must be configured in the deployment environment}"

# Example: replace with the migration command used by the selected framework.
alembic upgrade head

# Verify the app can reach PostgreSQL before traffic is shifted.
python -c "from app.database import open_database_connection; \
with open_database_connection() as c: c.execute('SELECT 1').fetchone()"
```

Prefer expand-and-contract changes: add a nullable column, deploy code that can handle both shapes, backfill, then enforce constraints or remove the old column in a later release. A deployment script should fail on migration errors instead of continuing to route traffic.

### Pattern 5: Least-privilege public read path

**What it does:** Limits the database operations used by public portfolio pages and leaves editing behind application authorization.

**When to use it:** When visitors can view project case studies but only an authenticated editor can publish or modify them.

```sql
CREATE ROLE portfolio_public_reader LOGIN;
GRANT CONNECT ON DATABASE portfolio_db TO portfolio_public_reader;
GRANT USAGE ON SCHEMA app TO portfolio_public_reader;
GRANT SELECT ON app.projects TO portfolio_public_reader;

REVOKE INSERT, UPDATE, DELETE
ON app.projects FROM portfolio_public_reader;
```

This is a database-level defense-in-depth pattern, not a replacement for authentication and authorization in the web application. Use separate credentials only if the architecture can safely route public reads through that role.

### Pattern 6: Backup restore drill with data assertions

**What it does:** Confirms a backup can be restored and that important tables contain expected data.

**When to use it:** Before a client launch, after changing backup configuration, and on a recurring schedule based on the recovery objectives.

```bash
set -euo pipefail

restore_database="portfolio_restore_drill"
backup_file="${BACKUP_FILE:?Set BACKUP_FILE to the protected dump path}"

createdb "$restore_database"
pg_restore --dbname="$restore_database" --exit-on-error --no-owner "$backup_file"

project_count=$(psql "$restore_database" -X -At -v ON_ERROR_STOP=1 \
  -c "SELECT count(*) FROM app.projects")

test "$project_count" -gt 0
echo "Restore drill passed: projects table contains data."
dropdb "$restore_database"
```

Use a disposable, isolated target and ensure the backup is protected. The example checks only one assertion; a real drill should validate important relationships, application startup, permissions, and the time required to restore.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Running the app as `postgres` | Setup convenience is mistaken for a runtime requirement | Create a dedicated login role with only required grants |
| Committing a database URI | Secrets are treated like ordinary configuration | Add `.env` to `.gitignore` and inject `DATABASE_URL` from a secret store |
| Exposing PostgreSQL to every IP | Connectivity troubleshooting takes priority over access control | Restrict firewall rules and `pg_hba.conf` to trusted private sources |
| Using `trust` authentication for TCP | The developer wants to bypass password errors quickly | Configure SCRAM authentication and verify matching rules in order |
| Assuming client version proves server health | The local CLI is confused with the running service | Query `version()`, database, role, and server address from the app’s connection |
| Granting schema access but not table access | Schema privileges and object privileges are conflated | Grant schema `USAGE` and explicit table/sequence privileges |
| Forgetting default privileges | Existing tables work but newly migrated tables fail | Set `ALTER DEFAULT PRIVILEGES` for the actual object-creating role |
| Creating one connection per request | Connection creation seems simpler than pool management | Use a bounded pool and tune total connections across replicas |
| Setting every pool to a large number | Each process is tuned independently | Calculate aggregate pool capacity against server and provider limits |
| Building SQL with string interpolation | Query strings look readable during development | Bind values with driver parameters and allowlist dynamic identifiers |
| Editing an applied migration | Migrations are treated as disposable local scripts | Add a forward migration and keep applied history immutable |
| Adding `NOT NULL` before backfilling | The change is tested only against an empty local database | Backfill existing rows, validate, then add constraints in a safe sequence |
| Indexing every column | Indexes are assumed to be free performance wins | Use `EXPLAIN (ANALYZE, BUFFERS)` and measure read/write trade-offs |
| Keeping backups on the same host | Backup existence is mistaken for disaster recovery | Store encrypted backups separately and test restore into an isolated database |
| Retrying every database error forever | All errors are assumed to be transient | Retry only bounded transient connection failures; fail fast on configuration and SQL errors |
| Returning database exception details to visitors | Debugging information is exposed for convenience | Return generic errors and keep sanitized diagnostics in protected logs |
| Using only one health endpoint | Process liveness and dependency readiness are confused | Separate liveness from readiness and bound the database probe |
| Running migrations from every app replica | Startup logic is copied without deployment coordination | Run migrations as a single controlled release step or use a migration lock |
| Assuming `SELECT 1` proves full readiness | A minimal probe is overinterpreted | Verify required grants, migration state, and a representative read path |
| Logging the complete connection URI | Debug logs are treated as private by default | Redact credentials and avoid logging raw DSNs |
| Ignoring timezone semantics | A timestamp is stored without deciding whether it represents an instant | Use `TIMESTAMPTZ` for instants and convert at the presentation boundary |
| Holding transactions open during API calls | Database and network work are bundled for convenience | Commit database work before external calls or use an outbox |
| Allowing public browser code to connect directly | Database access is confused with an API endpoint | Keep PostgreSQL private and expose validated application endpoints |
| Skipping restore tests after changing backups | Job success is assumed to mean recoverability | Run scheduled restore drills and verify key table counts and application behavior |

### Before → After: connection configuration

```python
# BEFORE — unsafe: secret committed with application code.
# database_url = "postgresql://admin:password123@db.example.com/portfolio"

# AFTER — deployment supplies a protected secret.
import os
import psycopg

database_url = os.environ["DATABASE_URL"]
with psycopg.connect(database_url, connect_timeout=5) as connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user")
        print(cursor.fetchone())
```

---

## Mental Models

1. **The database is a service boundary.** Treat it like a private service with identity, network policy, health, and recovery—not a file the app happens to use.
2. **Roles are capabilities.** Give each identity the minimum operations it needs; avoid superuser shortcuts in application runtime.
3. **Configuration is part of the artifact.** The same code should run across environments because secrets and endpoints are supplied externally.
4. **Migrations are a deployment contract.** They describe how schema state moves forward and must work against real existing data.
5. **A pool is a budget.** Count connections across replicas and workers, not only inside one process.
6. **Indexes trade writes and storage for reads.** Add them in response to query evidence, not habit.
7. **A backup is a hypothesis until restored.** Recovery is demonstrated by a restore drill, not by a green backup job.
8. **Health checks have different jobs.** Liveness answers “should this process restart?”; readiness answers “should this process receive traffic?”
9. **Retry is not a universal error handler.** Transient network failures may recover; invalid credentials and invalid SQL will not.
10. **The browser never gets database authority.** Public pages call a server-side API that enforces validation and authorization.

---

## Quick Reference

| Situation | Recommended action | Why it matters |
|---|---|---|
| App needs a connection | Read `DATABASE_URL` from the environment | Keeps credentials out of source code |
| Local CLI works but app fails | Check TCP/socket path, role, database, and `pg_hba.conf` | Authentication rules may differ by connection path |
| Need a runtime identity | Create a dedicated login role | Limits damage from application compromise |
| Need schema changes | Use a versioned migration tool | Makes deployments reproducible |
| App opens too many sessions | Use a bounded pool or provider pooler | Prevents connection exhaustion |
| Search endpoint is slow | Inspect query plan and call frequency | Distinguishes missing indexes from N+1 behavior |
| Add an index | Validate with `EXPLAIN (ANALYZE, BUFFERS)` | Confirms whether the planner benefits |
| Remote connection | Restrict network access and require TLS | Protects data in transit and reduces exposure |
| Public project listing | Use bounded, parameterized `SELECT` | Limits data volume and injection risk |
| Need a new table grant | Grant schema usage and table permissions | PostgreSQL privileges are layered |
| New tables lack grants | Configure default privileges for the creating role | Future objects do not inherit old grants automatically |
| Add a required column | Expand, backfill, validate, then constrain | Avoids downtime and failed migrations |
| Deploy a schema change | Run migration before traffic shift | Avoids code/schema mismatch |
| Health check | Separate liveness and readiness | Prevents cascading restarts during DB outages |
| Need recovery assurance | Restore a backup in isolation and assert data | Proves the artifact is usable |
| Database error in production | Log sanitized context and correlation ID | Supports debugging without leaking secrets |
| Timestamp storage | Use `TIMESTAMPTZ` for real-world instants | Avoids ambiguous timezone interpretation |
| Credentials rotate | Update secret configuration and recycle connections safely | Prevents stale pooled connections from persisting |
| Connection limit reached | Inspect `pg_stat_activity` and aggregate pool budgets | Finds the actual source of connection pressure |
| Need auditability | Track migration version and deployment identity | Makes changes traceable |
| Managed database | Review provider TLS, backup, retention, and restore options | Provider management does not remove application responsibility |
| Local reproducibility | Pin a supported image/version in development | Reduces “works on my machine” drift |

---

## Build Challenge

### Build: Production-Ready PostgreSQL Foundation for a Creative Portfolio CMS

Build the database foundation for a portfolio site with public case studies and a private editor workflow. The expected output is a version-controlled setup directory, migration history, a small application connection module, a deployment checklist, and a tested backup/restore procedure.

1. Install or start a supported PostgreSQL version and document the exact version used.
2. Create separate owner/migration and runtime roles; demonstrate that the runtime role cannot create or drop tables.
3. Create an `app.projects` table with a unique slug, title, publication status, publication timestamp, and creation timestamp.
4. Add a constraint that prevents a published project from having a null publication timestamp.
5. Store the connection URI in `DATABASE_URL`; verify that no working credentials appear in tracked files.
6. Add a `.gitignore` rule for `.env` and provide a `.env.example` containing only a non-secret example value.
7. Implement a parameterized query that retrieves only published projects and returns a bounded list.
8. Add a connection pool with a finite maximum, connection timeout, and a documented total connection budget for all app replicas.
9. Create a migration that can be applied from a clean database and record the migration version in source control.
10. Demonstrate a safe schema update using an expand-and-contract approach rather than breaking existing application code.
11. Add at least three indexes based on distinct query patterns and explain the evidence for each using query plans.
12. Add separate liveness and readiness endpoints; readiness must return a non-success status if PostgreSQL cannot be reached within the timeout.
13. Configure logs that record a useful failure category without printing the DSN, password, or sensitive user data.
14. Capture a logical backup to a protected location and restore it into a separate database.
15. Validate the restored schema and data with at least two assertions, such as project count and uniqueness of slugs.
16. Simulate a wrong password and a database outage; confirm the app fails safely and does not enter an infinite retry loop.
17. Simulate a missing table grant and explain how the least-privilege setup reveals the permission problem.
18. Use `EXPLAIN (ANALYZE, BUFFERS)` against representative data to compare one query before and after an index.
19. Document which operations require an administrator, which run as the migration identity, and which run as the runtime identity.
20. Complete a launch checklist covering TLS, network restrictions, secret rotation, migrations, backup freshness, restore results, pool capacity, and readiness status.

### Definition of Done

- [ ] A clean environment can reproduce the database schema using documented commands.
- [ ] Runtime credentials cannot perform schema-changing operations or connect from unapproved network paths.
- [ ] The application reads configuration from the environment and tracked files contain no live secrets.
- [ ] Queries are parameterized and public listings have explicit result limits.
- [ ] Migrations run in a controlled order and a simulated incompatible change is handled safely.
- [ ] Pool capacity and connection timeouts are documented and tested.
- [ ] The three chosen indexes are justified by query plans or measured workload evidence.
- [ ] Liveness and readiness behave differently during a database outage.
- [ ] A backup restores successfully into an isolated database and data assertions pass.
- [ ] Failure tests produce useful protected logs without exposing credentials to visitors.

**Failure scenario to test:** Deploy a new version that expects a new `summary` column before the migration has run. The deployment should fail safely or remain on the previous compatible version; it must not silently serve broken pages. Then apply the migration in the correct sequence, verify readiness, and confirm that the new version works with both existing and newly created project rows.
