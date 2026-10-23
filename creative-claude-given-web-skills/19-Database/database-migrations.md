# SKILL: database-migrations

**Layer:** `layer-19-database`  
**Goal:** Plan, author, test, deploy, and recover database schema and data changes safely across environments.

## 1. The Senior Engineer's Perspective

A database migration is a version-controlled change to a database's structure or stored data. It may create a table, add a column, introduce a constraint, build an index, backfill millions of rows, or retire an obsolete field. It is not merely SQL that runs once: it is a release artifact with ordering, compatibility, operational risk, and recovery requirements.

The important question is not only “Does this SQL work locally?” It is “Can this change be applied predictably to every environment while the application remains correct, and can the team diagnose or recover if something goes wrong?”

A strong migration process provides **history**, **ordering**, **reviewability**, **compatibility**, **data safety**, **observability**, and **recovery**. A migration framework tracks execution, but it cannot decide whether a dropped column is business-critical, whether a backfill will overload production, or whether a worker still uses an old field. Those are engineering responsibilities.

### The migration lifecycle

1. **Discover:** inspect schema, queries, data quality, scale, and deployment topology.
2. **Design:** choose the smallest change that achieves the goal.
3. **Author:** create a uniquely ordered, descriptive migration.
4. **Review:** check SQL, locks, constraints, compatibility, and data effects.
5. **Validate:** test against a realistic prior schema and representative data.
6. **Deploy:** run in a controlled sequence with an operational plan.
7. **Verify:** prove the schema and data invariants, then check application health.
8. **Retire:** remove compatibility code and old schema only after consumers have moved.

The order matters. A valid SQL statement can still be unsafe if it runs at the wrong point in a deployment.

## 2. Core Concepts

### 2.1 Schema state versus migration history

**Schema state** is what the database actually contains: tables, columns, indexes, constraints, views, and functions. **Migration history** is what the migration tool records as having run. They can diverge after manual changes, partial failures, restores, or inconsistent deployments.

Do not treat a history row as proof that every intended effect exists. Do not casually delete history rows to make a deployment pass. When history and schema disagree, capture the actual state, understand why, and reconcile deliberately.

### 2.2 Ordered, immutable migrations

Migration tools typically use timestamps or sequence identifiers. Each migration should have a unique ID and stable meaning. Once a migration has been applied to a shared environment, treat it as immutable. Editing it creates divergent definitions between environments. Instead of changing an applied migration, add a new corrective migration.

```sql
-- Illustrative PostgreSQL example; check your engine and version.
CREATE INDEX CONCURRENTLY idx_customer_email_lower
ON customer (lower(email));
```

PostgreSQL concurrent index creation has restrictions, including that it cannot run inside a normal transaction block. Confirm your runner's transaction behavior before using it.

### 2.3 Reversible versus forward-only changes

A rollback script describes a possible structural reversal; it does not magically restore deleted data. Creating an empty table may be reversible. Dropping a populated table is not meaningfully reversible unless the data is preserved elsewhere.

Classify a change before choosing recovery: adding a nullable column is usually reversible; renaming a column is conditionally reversible; dropping populated data is destructive; and large transformations or non-transactional operations may be difficult to reverse. For risky changes, a forward repair may be safer than a blind rollback.

### 2.4 Expand-and-contract

Expand-and-contract is a production pattern for changing structures without requiring every application component to switch simultaneously. For a change from `users.full_name` to `users.display_name`:

**Expand:** add `display_name`; deploy compatible code; dual-write if necessary; backfill old rows; verify parity; switch reads.

**Contract:** stop writing `full_name`; verify web instances, workers, scheduled jobs, scripts, and integrations no longer use it; remove the old column in a later release.

This avoids breaking old application versions during rolling deployments. Dual-writing introduces consistency risks, so define a source of truth and a way to detect mismatches.

### 2.5 Transaction boundaries

DDL transaction behavior differs by database engine and sometimes by version. Even when a database supports transactional DDL, long-running transactions may hold locks, retain old row versions, delay cleanup, or increase contention. Some statements, such as PostgreSQL `CREATE INDEX CONCURRENTLY`, cannot run inside a regular transaction block.

Before relying on transaction behavior, establish which statements are transactional on the target engine/version, whether the runner wraps each migration in a transaction, what happens if execution is interrupted, and whether retrying after partial failure is safe. Never assume that behavior from one engine applies to another.

### 2.6 Schema migrations versus data migrations

A schema migration changes structure. A data migration transforms records. For example, adding `normalized_email` is structural; computing it for existing users is a data transformation. Large or risky data migrations often deserve their own step because they need batching, progress tracking, retry behavior, and verification.

Consider nulls, malformed legacy values, duplicates, rows inserted during the backfill, and source values that change concurrently. A successful `UPDATE` is not proof of correctness. Verify the resulting invariant.

### 2.7 Idempotency and retry safety

An operation is idempotent when repeating it has the same intended result as applying it once. Migration history normally prevents duplicate execution, but a process can fail partway through. Retry safety still matters.

```sql
CREATE TABLE IF NOT EXISTS import_job (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

This is an illustrative PostgreSQL statement. `IF NOT EXISTS` does not prove that an existing table has the expected definition; it can hide drift. Verify columns and constraints when correctness depends on them.

### 2.8 Constraints and validation

Constraints encode invariants: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys, and primary keys. They protect data even when multiple services write to the database. Before adding a constraint to an existing table, inspect historical data for violations. Adding a constraint may scan records or acquire locks.

PostgreSQL supports staged workflows such as `NOT VALID` followed by `VALIDATE CONSTRAINT` for certain constraints; this is engine-specific and must be checked against the exact version. A constraint plan should answer what happens to new writes and how existing records will be proven valid.

### 2.9 Index migrations

Indexes improve reads but consume storage and add write overhead. Building an index on a large, active table may block work or compete for CPU and I/O depending on the engine and method. Review the query plan and workload first. Confirm column order, selectivity, partial-index conditions, existing indexes, storage needs, lock behavior, and index validity after failure.

In PostgreSQL, a failed concurrent index build can leave an invalid index behind. Inspect catalog state and clean it up deliberately rather than assuming the failed operation left no artifact.

### 2.10 Migration ownership and concurrency

A team should agree on naming, ordering, shared-table ownership, branch conflict resolution, permissions, and emergency schema changes. Avoid having every application replica race to apply migrations at startup unless the framework explicitly coordinates that pattern.

A dedicated migration job often provides a clearer owner and failure point. Where multiple runners are possible, use framework-supported locking or a deployment-level single-writer mechanism. Do not manually remove a lock until you know whether a live migration still owns it.

### 2.11 Schema drift

Schema drift occurs when actual schema differs from the version-controlled expectation. Causes include manual hotfixes, failed deployments, restores, and divergent migration histories.

When drift appears: stop making assumptions; capture the actual schema and logs; identify the change and its origin; decide whether a corrective migration, restore, or metadata reconciliation is appropriate; test against a copy where possible; and document the outcome. Do not edit already-applied migrations or erase history merely to silence a warning.

### 2.12 Zero-downtime compatibility

During rolling deployments, old and new application instances may run simultaneously. A schema change must account for every intermediate state, not only the final one.

| Application version | Old schema | Expanded schema | Contracted schema |
|---|---|---|---|
| Old application | Usually works | Must remain compatible | Often breaks |
| Transitional application | Depends on implementation | Intended state | May work |
| New application | Depends on implementation | Intended state | Intended state |

Inventory web servers, workers, cron jobs, admin tools, analytics, scripts, and external clients. A column is not safe to remove merely because the primary web application no longer reads it.

### 2.13 Large-table operations

A small SQL statement can be expensive at production scale. Operations may scan or rewrite a table, increase write-ahead logs or undo data, grow temporary storage, delay replication, or block writes. Estimate table size, write rate, peak traffic, disk space, lock behavior, replication impact, and cancellation/recovery semantics. Test on representative data.

### 2.14 Engine-specific behavior

PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, and hosted platforms differ in quoting, DDL transactions, online index operations, default expressions, and constraint validation. Even versions of one engine may differ. Prefer official documentation for the exact engine and version, then validate with reproducible tests. Treat examples in this skill as patterns to adapt, not universal syntax.

## 3. Practical Workflow

### Step 1: Define the intended outcome

Write the requirement, current behavior, target behavior, and invariants. “Change user table” is weak. “Introduce `display_name`, populate it from `full_name`, support both application versions during rollout, and remove the old field only after all consumers have migrated” is reviewable.

### Step 2: Inspect the current schema and data

For PostgreSQL, the information schema can help inspect columns:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

Before adding a uniqueness rule, find duplicates under the intended normalization:

```sql
SELECT lower(email) AS normalized_email, count(*)
FROM users
WHERE email IS NOT NULL
GROUP BY lower(email)
HAVING count(*) > 1;
```

Adapt schema names and query semantics to the real system. Check data volume, indexes, constraints, and queries that touch the affected object.

### Step 3: Choose the smallest safe change

Avoid bundling unrelated changes. Split a complex transition into structural expansion, backfill, application cutover, and cleanup when their risk or runtime differs. Not every change needs multiple migrations; split when doing so improves compatibility, observability, or recovery.

### Step 4: Author a descriptive migration

Examples of readable names:

```text
202610230915_add_display_name_to_users.sql
202610231030_backfill_display_name_from_full_name.sql
202610241200_add_customer_email_index.sql
```

Use the naming and ordering convention supported by your tool. Avoid `update.sql`, `fix2.sql`, or `final_final.sql`. Add comments to explain preconditions, unusual choices, and operational restrictions.

### Step 5: Test beyond the happy path

Test a fresh database, an upgrade from a realistic older schema, null and malformed values, duplicate records, concurrent writes, failure/retry behavior, and old/new application compatibility. Measure runtime and locks on representative data. If a migration requires a precondition, test the failure path. An explicit error is usually safer than silently skipping a required change.

### Step 6: Review operational behavior

Ask whether the operation blocks reads or writes, scans or rewrites a table, needs extra storage, can violate constraints, can be retried, and is compatible with the runner's transaction behavior. Define monitoring and stop conditions before deployment.

### Step 7: Deploy under one clear owner

Use a dedicated release job or another coordinated approach. Ensure the migration finishes before incompatible application code is rolled out. Do not launch new code that requires a column that has not been created.

### Step 8: Verify postconditions

```sql
SELECT count(*) AS total_rows,
       count(display_name) AS populated_rows
FROM users;
```

Use checks specific to the migration: row counts, duplicate queries, value parity, index validity, constraint state, application errors, and key user journeys. An exit code of zero is not enough.

### Step 9: Record the outcome

Record migration ID, deployment window, duration, verification results, exceptions, and follow-up work. This record helps future maintenance and incident response.

## 4. Implementation Patterns

### 4.1 Add a nullable field first

```sql
ALTER TABLE users ADD COLUMN display_name text;
```

This is often a safe first step for a live application, but existing rows remain null and application code must tolerate that state. Confirm the cost of the operation on the actual engine/version.

### 4.2 Backfill in bounded batches

An illustrative PostgreSQL batch:

```sql
WITH batch AS (
  SELECT id FROM users
  WHERE display_name IS NULL AND full_name IS NOT NULL
  ORDER BY id LIMIT 1000
)
UPDATE users AS u
SET display_name = u.full_name
FROM batch
WHERE u.id = batch.id;
```

Run the statement repeatedly through a controlled worker. Add progress tracking, retry behavior, rate limits, completion checks, and a policy for concurrent writes. The source of truth must be clear if the old field changes during the backfill.

### 4.3 Clean data before enforcing constraints

First measure violations:

```sql
SELECT id FROM users WHERE email IS NULL;
```

Resolve invalid records using a legitimate business rule, then add the constraint. Do not invent replacement values just to make the migration pass.

### 4.4 Stage a rename

1. Add the new field.
2. Update writers or temporarily dual-write.
3. Backfill existing records.
4. Verify parity.
5. Switch readers.
6. Stop old writes.
7. Remove the old field in a later release.

Dual-writing can fail halfway through or create divergent values. Define the authoritative value and monitor mismatches.

### 4.5 Create an index using the appropriate method

```sql
CREATE INDEX CONCURRENTLY idx_orders_customer_created
ON orders (customer_id, created_at DESC);
```

This PostgreSQL example cannot run inside a regular transaction block. Confirm the migration tool supports non-transactional execution, verify that the index supports a real query, and inspect for invalid index artifacts after failure.

### 4.6 Keep migration execution separate from app startup

For a service with multiple replicas, use a controlled migration job unless the framework provides verified concurrency coordination. A dedicated job has a clear log stream, execution identity, and failure point. A failed required migration should pause or fail the release rather than allowing incompatible code to launch.

## 5. Advanced Patterns

### Pattern 1: Expand-and-contract across releases

**Use when:** changing a field or representation while the application remains available.

- Release A expands the schema.
- Release B supports both representations and writes compatibly.
- A background worker backfills old rows.
- Verification proves completeness and parity.
- Release C switches reads to the new representation.
- Release D stops old writes.
- A later cleanup removes the old field.

The benefit is compatibility across intermediate states. The common failure is removing the old field while delayed workers, older replicas, integrations, or rollback builds still use it. Inventory every reader and writer before contracting.

### Pattern 2: Resumable, checkpointed backfill

**Use when:** transforming a large dataset that cannot safely fit in one transaction.

A robust worker selects a deterministic batch, updates eligible rows, commits a bounded transaction, records progress, exposes processed and remaining counts, retries transient failures, and performs a final invariant check. Keyset pagination on a stable primary key is often preferable to large offsets.

```python
def backfill_users(db, batch_size=1000):
    last_id = 0
    while True:
        rows = db.fetch_all(
            "SELECT id, full_name FROM users "
            "WHERE id > %s AND display_name IS NULL "
            "AND full_name IS NOT NULL ORDER BY id LIMIT %s",
            (last_id, batch_size),
        )
        if not rows:
            break
        with db.transaction():
            for row in rows:
                db.execute(
                    "UPDATE users SET display_name = %s "
                    "WHERE id = %s AND display_name IS NULL",
                    (row["full_name"], row["id"]),
                )
        last_id = rows[-1]["id"]
```

This is a teaching outline, not production-ready code. The actual database API, transaction semantics, concurrent updates, restart checkpoint, and final sweep need design. A cursor based only on `last_id` can miss records that become eligible after the cursor passes or arrive with lower IDs; define concurrency semantics and verify completion.

### Pattern 3: Online constraint enforcement

**Use when:** introducing a rule on a large active table.

1. Measure existing violations.
2. Repair or quarantine invalid rows.
3. Ensure new application writes satisfy the rule.
4. Add the constraint using an engine-specific staged option if available.
5. Validate existing records.
6. Confirm enforcement and remove temporary validation code.

PostgreSQL example:

```sql
ALTER TABLE orders
ADD CONSTRAINT orders_total_nonnegative
CHECK (total_amount >= 0) NOT VALID;

ALTER TABLE orders
VALIDATE CONSTRAINT orders_total_nonnegative;
```

This is PostgreSQL-specific. Check version-specific semantics and lock behavior before adopting it.

### Pattern 4: Preconditions and fail-fast checks

Use explicit preconditions when a change depends on expected database state: a source column exists, duplicates have been resolved, a prior backfill completed, or a required release is deployed. A migration should stop with a useful error when a critical precondition fails. Do not silently skip a change and let the release proceed as though it succeeded.

Preconditions can live in a migration assertion, a pre-deployment validation script, or a dedicated operational check. Test the failure path.

### Pattern 5: Single-writer migration coordination

Use framework-supported migration locking or a deployment-level lock when multiple release processes might run simultaneously. Define lock timeout, crash handling, stale-lock diagnosis, and safe release procedures. Never remove a lock record without establishing whether a live migration still owns it.

### Pattern 6: Index failure recovery

Before building a large index, inspect query plans, existing indexes, storage, and the write workload. After failure, inspect the database catalog and determine whether an invalid or incomplete index remains. Remove or rebuild it using a reviewed procedure. `IF NOT EXISTS` is not a reliable repair for an invalid index.

### Pattern 7: Observability and stop conditions

Track start/end time, rows changed, batch duration, lock waits, database load, storage, replication lag, application latency, error rates, and retries. Define stop conditions before the operation starts. For example, pause a backfill if latency or replication lag crosses an agreed threshold. Derive thresholds from system baselines and SLOs, not a generic tutorial number.

### Pattern 8: Recovery by rollback, forward fix, or restore

When a migration fails, stop further deployments, preserve logs, capture actual schema state, identify completed statements, and assess writes made since execution began.

- **Rollback:** suitable when the reverse operation is safe and data is preserved.
- **Forward fix:** suitable when a new migration can repair the state safely.
- **Restore:** suitable for serious corruption, subject to recovery time and data-loss windows.
- **Metadata reconciliation:** appropriate only when the schema is already correct and migration metadata alone is wrong.

Do not decide to roll back automatically. A reverse operation can lose new data or break newer application code. For high-risk migrations, rehearse the recovery path before production execution.

## 6. Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Editing a migration after shared deployment | Environments no longer share the same history | Add a corrective migration |
| Assuming `down` restores deleted data | Recreating structure does not recreate records | Classify reversibility and preserve data |
| Renaming/dropping a field immediately | Old app versions and workers may still depend on it | Expand-and-contract |
| Backfilling millions of rows in one transaction | Long locks, large logs, replication lag, difficult recovery | Use bounded resumable batches |
| Running migrations from every replica | Competing runners can race | Use a coordinated job or verified lock |
| Treating `IF NOT EXISTS` as drift repair | Existing objects may have wrong definitions | Inspect and verify state |
| Adding uniqueness before checking duplicates | Existing data violates the rule | Find and remediate duplicates first |
| Creating an index without query evidence | Extra storage and write overhead may not help | Inspect query plans and workload |
| Assuming DDL is transactional everywhere | Engine-specific behavior can leave partial state | Verify engine/version semantics |
| Testing only on an empty local database | Production data and scale expose different failures | Test realistic upgrade paths |
| Trusting exit code alone | Data may be incomplete or app behavior broken | Verify postconditions and health |
| Deleting migration history to silence errors | Hides drift and risks future corruption | Diagnose and reconcile deliberately |
| Skipping a failed migration without repair | Later migrations may depend on missing objects | Stop, inspect, repair, then resume |
| Ignoring workers and integrations | A field may still have hidden consumers | Inventory every reader and writer |
| Using one backfill cursor without final verification | Late-eligible rows may be missed | Define concurrency rules and do a final sweep |
| Combining unrelated changes | Review and recovery become harder | Keep migrations focused |
| Assuming rollback is always safest | Rollback can lose data or break newer code | Choose recovery based on evidence |

## 7. Testing Strategy

### Fresh-database test
Build a blank database by applying the entire migration history. This catches ordering errors and dependencies on manually modified developer schemas.

### Upgrade test
Start from a representative older schema with realistic records and apply the new migration. This validates the actual upgrade path, not just the final shape.

### Data-quality test
Include nulls, duplicates, malformed values, boundary values, and rows that violate assumptions. Type conversions, normalization, and time-zone transformations need particular care.

### Compatibility test
Run old and new application versions against the intermediate states that can exist during rollout. Include workers, scheduled tasks, admin tools, and scripts.

### Failure and retry test
Where practical, simulate interruption. Verify migration metadata, partial artifacts, and whether retrying is safe.

### Performance test
Use representative row counts and write activity. Measure elapsed time, lock waits, I/O, and impact on concurrent queries.

### Postcondition test
Define assertions such as all eligible users have a populated normalized field; no duplicate normalized values remain; migrated values match the intended source; the new index is present and valid; and the application no longer references the retired column. A migration is complete when postconditions are satisfied, not merely when SQL statements finish.

## 8. Framework Integration

### Prisma Migrate

```bash
# Development: create a migration and review its generated SQL.
npx prisma migrate dev --name add_display_name

# Deployment: apply committed migrations.
npx prisma migrate deploy

# Check status when supported by the installed version.
npx prisma migrate status
```

Use development commands for development workflows and deployment commands for deployment. Do not casually use development reset commands against production. Review generated SQL for renames, data transformations, constraints, and large-table operations. Exact behavior depends on Prisma version and project configuration.

### Drizzle ORM

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Commands and configuration vary by Drizzle Kit version and driver. Review generated SQL, use a deliberate deployment job, and do not assume the ORM can infer the intended data transformation from a type change.

### Knex-style workflow

```bash
npx knex migrate:make add_display_name
npx knex migrate:latest
npx knex migrate:rollback
```

These are illustrative commands. Rollback behavior depends on the code and framework configuration; a `down` function does not guarantee data restoration.

### Raw SQL migrations

Raw SQL is appropriate when precise database-specific behavior is required. It gives reviewers direct visibility but requires consistent naming, ordering, execution, and history management. Keep files focused, test them against the target engine, and document non-transactional operations.

### ORM-generated migrations are not automatically safe

Generated diffs can mistake a rename for a drop-and-create sequence, fail on legacy values, or introduce constraints that existing data violates. Review generated SQL against the intended outcome. Edit a new migration before shared deployment if needed; after deployment, preserve history and correct problems with a subsequent migration.

## 9. Security and Permissions

Migration privileges are often broader than runtime application privileges. Where feasible, separate the migration identity from the application identity.

- Use a dedicated migration role.
- Grant only the required privileges.
- Store credentials in a secret manager or protected CI environment.
- Never place production credentials in migration files.
- Avoid logging connection strings and secrets.
- Require review for production DDL.
- Audit manual schema changes.
- Confirm runtime credentials cannot perform destructive DDL when that separation is intended.

Migration files are source code and should be safe to review and share.

## 10. Production Runbook

### Before deployment
- [ ] Confirm target database and environment.
- [ ] Confirm migration ID and ordering.
- [ ] Review SQL and engine/version compatibility.
- [ ] Inspect table size, indexes, constraints, and data quality.
- [ ] Identify old/new app versions and all consumers.
- [ ] Test an upgrade from realistic prior state.
- [ ] Estimate runtime, locks, storage, and replication impact.
- [ ] Confirm backup and point-in-time recovery procedures.
- [ ] Define success checks, stop conditions, and owner.
- [ ] Decide transaction and retry behavior.

### During deployment
- [ ] Observe logs and migration-history state.
- [ ] Monitor lock waits, database load, latency, and replication lag.
- [ ] Pause or abort according to pre-agreed conditions.
- [ ] Do not start a second runner to “help” a slow first runner.
- [ ] Record warnings and partial effects.

### After deployment
- [ ] Verify tables, columns, indexes, and constraints.
- [ ] Verify data invariants and row counts.
- [ ] Check application errors and key journeys.
- [ ] Confirm replicas and background workers are healthy.
- [ ] Record duration, result, and follow-up actions.
- [ ] Keep old schema until no deployed consumer depends on it.
- [ ] Remove temporary dual-write code only after verification.

## 11. Mental Models

**A migration is a release, not just a query.** It has prerequisites, execution, observability, and recovery.

**Intermediate states are real states.** During a rollout, old code may meet expanded schema and new code may meet partially backfilled data. Plan for those states.

**Rollback is a business decision.** A reverse operation may be technically possible but operationally unsafe. Consider forward repair or restore.

**Data invariants are the real contract.** If a new value must match a transformed old value, verify that relationship with a query.

**Small changes reduce blast radius.** Focused migrations are easier to review, monitor, and recover.

**The database is shared state.** Web services, workers, scripts, and integrations may all depend on the same objects.

**Successful execution is not successful delivery.** Verify schema, data, and application behavior.

## 12. Quick Reference

| Situation | Recommended starting point |
|---|---|
| Add a field to a live app | Add compatibly, deploy code, backfill, then enforce constraints |
| Rename a field during rolling deployment | Expand-and-contract |
| Backfill a large table | Bounded batches, checkpoints, metrics, final sweep |
| Add a unique constraint | Find and resolve duplicates first |
| Add a foreign key to a large table | Check engine-specific staged validation options |
| Create a PostgreSQL index on a high-write table | Evaluate concurrent index creation and transaction restrictions |
| Migration fails midway | Stop, inspect actual state, then choose tested recovery |
| History disagrees with schema | Diagnose drift before editing metadata |
| Multiple deploys may migrate together | Use migration locking or one owner |
| Remove an obsolete field | Confirm every reader and writer has moved |
| ORM generates destructive SQL | Review intent and replace with a deliberate migration |
| Operation may run for a long time | Define monitoring, batching, and stop conditions first |

### Migration review questions

1. What requirement does this migration implement?
2. Which schema versions and environments will run it?
3. What data can it change or destroy?
4. What happens if it fails halfway through?
5. Is retry safe?
6. How do old and new application versions behave?
7. What locks, scans, rewrites, or storage growth are possible?
8. Which checks prove success?
9. What is the recovery path?
10. Who owns deployment and verification?

If these questions cannot be answered, the migration is not ready for production.

## 13. Build Challenge: Safely Rename a User Field

A marketplace currently stores a public name in `users.full_name` and needs to transition to `users.display_name`.

### Requirements
1. Add the new field without breaking existing code.
2. Make new writes populate the intended value during transition.
3. Backfill existing records in bounded batches.
4. Make the backfill resumable and observable.
5. Verify every eligible row is migrated.
6. Switch reads to the new field.
7. Stop writes to the old field.
8. Remove the old field only after all consumers move.
9. Document failure handling and recovery.
10. Test both a fresh database and an upgrade from realistic existing state.

### Deliverables
- [ ] Design note listing assumptions and compatibility requirements.
- [ ] Descriptive, ordered migration files.
- [ ] Backfill worker with bounded transactions.
- [ ] Precondition and postcondition queries.
- [ ] Tests for nulls, concurrent writes, retries, and old application versions.
- [ ] Deployment runbook with success metrics and stop conditions.
- [ ] Recovery decision tree for rollback versus forward repair.

### Evaluation rubric

| Area | What good looks like |
|---|---|
| Correctness | Existing and new records reach the intended state |
| Compatibility | Old and new code coexist during rollout |
| Resumability | Retries do not skip or corrupt eligible records |
| Performance | Work is bounded and monitored |
| Verification | Completion is proven with data checks |
| Recovery | Failure handling is documented and tested |
| Maintainability | Migrations are focused, ordered, and reviewable |

**Completion standard:** the new field is authoritative, data invariants are verified, every application consumer has moved, and the old field can be removed without breaking a deployed process.
