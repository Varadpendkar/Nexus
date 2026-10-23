# SKILL: supabase-setup

**Layer:** `layer-19-database`  
**Goal:** Set up Supabase as a secure application backend by configuring PostgreSQL, authentication, Row Level Security (RLS), storage, client/server access, migrations, local development, and production operations without exposing privileged credentials.

## 1. The Senior Engineer's Perspective

Supabase is best understood as a developer platform built around PostgreSQL, with related services such as authentication, file storage, APIs, and local development tooling. It can reduce the amount of backend infrastructure a team must assemble, but it does not remove the need to understand database design, authorization, migrations, environment separation, or operational risk.

A successful setup is not simply a project that starts and returns data. It is a backend whose access rules are explicit, whose schema can be reproduced, whose credentials are handled safely, and whose production behavior is observable. Supabase exposes database capabilities to application code, so a missing policy or an incorrectly exposed key can have a larger impact than an ordinary frontend bug.

A senior engineer evaluates these concerns before implementation:

- **Data model:** Are tables, relationships, constraints, and indexes designed in PostgreSQL rather than improvised in application code?
- **Identity:** How does a user sign in, how is their identity represented, and how is a session refreshed or revoked?
- **Authorization:** Which operations can anonymous users, authenticated users, and service processes perform?
- **RLS:** Does every exposed table have policies that enforce row-level access on the server?
- **Credential boundaries:** Which keys may be used in a browser, and which privileged credentials must remain on a trusted server?
- **Schema lifecycle:** Are schema changes committed as migrations and applied consistently across development, staging, and production?
- **File access:** Are storage buckets and object policies aligned with the sensitivity of uploaded files?
- **Failure behavior:** What does the application do when authentication, the database, or a storage request fails?
- **Operations:** How are logs, backups, connection limits, schema changes, and service health reviewed?
- **Portability:** Is the team using PostgreSQL and standard SQL where practical, so the data model is not unnecessarily coupled to a client SDK?

The core principle is: **Supabase provides useful building blocks; the application team still owns its authorization model and data correctness.**

### Recommended setup sequence

1. Define the application's data entities and user roles.
2. Create a project and establish development, staging, and production separation.
3. Configure environment variables and secret-handling rules.
4. Design the PostgreSQL schema with constraints and indexes.
5. Enable RLS on tables exposed through client-accessible APIs.
6. Write and test policies for every intended operation.
7. Configure authentication providers, redirect URLs, and session handling.
8. Configure storage buckets and object policies if files are involved.
9. Create migrations and test a clean database setup.
10. Integrate the client SDK at the correct trust boundary.
11. Add tests for allowed and denied access.
12. Configure monitoring, backups, and release procedures.

Do not treat a working query as proof that the backend is secure. The most important test is whether a user can access data they should not be allowed to access.

## 2. Core Concepts

### 2.1 Supabase and PostgreSQL

Supabase uses PostgreSQL as its relational database. PostgreSQL supports tables, foreign keys, transactions, constraints, indexes, views, functions, and row-level security. Supabase adds developer-facing services around this foundation, including authentication, storage, and API access.

This matters because many important guarantees should live in the database. For example, a foreign key can prevent a record from referencing a nonexistent parent. A unique constraint can prevent duplicate email addresses or external identifiers. A check constraint can reject invalid numeric ranges. RLS can limit which rows a database role may read or modify.

Application validation is still useful for friendly error messages, but it should not be the only protection for data integrity or access control.

### 2.2 Projects, environments, and configuration

A Supabase project is a managed environment with its own database and related services. Treat development, staging, and production as separate environments with distinct URLs, credentials, redirect settings, and data. Avoid using a production project as a convenient test database.

Typical environment variables might look like:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-public-client-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret
DATABASE_URL=postgresql://...
```

These names are examples. Use the actual key types and connection details shown in the project's current dashboard and tooling. Never commit real secrets to source control or paste them into public issues. Use a `.env` file only for local development, add it to `.gitignore`, and use the deployment platform's secret manager for production.

A public client key is not an authorization policy. It identifies the project/client context; RLS and database permissions still determine which rows may be accessed. A privileged service-role or secret key can bypass ordinary RLS protections and must never be embedded in frontend JavaScript, a mobile app bundle, or a public repository.

### 2.3 Supabase client SDK

The JavaScript SDK can be used in browser applications and trusted server environments. The location where it runs determines which credentials and operations are appropriate.

Install the package in a JavaScript or TypeScript project:

```bash
npm install @supabase/supabase-js
```

Create a browser client using only the project's public URL and publishable key:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Build tools commonly expose variables with prefixes such as `VITE_` to browser code. Anything exposed this way must be considered public. Do not add a service-role secret to a `VITE_`, `NEXT_PUBLIC_`, or similar public prefix.

In a server-side application, load server secrets from the server's environment and use them only in trusted code paths. Even there, use the least-privileged credential suitable for the operation. A privileged client should not be passed into arbitrary request handlers without considering authorization.

### 2.4 Authentication is not authorization

Authentication answers “Who is this user?” Authorization answers “What may this user do?” A successful sign-in does not mean the user should be able to read every row in a table.

Supabase Auth can manage user identities and sessions. Database RLS policies can use the authenticated identity and claims to enforce data access. The application should not rely on a frontend check such as hiding an Edit button. A user can call an API directly, inspect network requests, or modify client-side state.

The secure pattern is defense in depth: authenticate at the identity layer, enforce data access at the database/API boundary, and use application checks for usability rather than as the only security control.

### 2.5 Row Level Security (RLS)

RLS is a PostgreSQL feature that restricts which rows a database role can see or modify. In a Supabase application, RLS is central when client-accessible APIs can reach a table.

Enable RLS:

```sql
alter table public.projects enable row level security;
```

Once RLS is enabled, the table's policies determine which rows are visible or modifiable for roles subject to those policies. A missing policy usually results in denied access for that role, which is safer than allowing all access. However, owners and privileged roles may have different behavior, so test using the same kind of client and role the real application uses.

A policy can specify which rows may be selected, inserted, updated, or deleted. `USING` commonly controls which existing rows are visible or eligible for an operation; `WITH CHECK` controls whether new or updated row values satisfy the policy.

Example: users may read their own profile row:

```sql
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
```

This assumes `profiles.id` stores the authenticated user's UUID. Adapt the predicate to the actual schema rather than copying it blindly.

Example: users can insert a profile only for themselves:

```sql
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
```

A policy should encode the intended rule precisely. A condition like `auth.uid() is not null` merely proves that the user is authenticated; it does not prove they own the row.

### 2.6 RLS policy design for ownership

A typical user-owned table may include an `owner_id` column referencing the authenticated user. A policy for reading their own records could be:

```sql
create policy "Owners can read their projects"
on public.projects
for select
to authenticated
using (owner_id = (select auth.uid()));
```

The `SELECT` wrapper around `auth.uid()` is a common optimization pattern for stable request-level values in PostgreSQL policies; check query plans and current Supabase guidance for the exact environment. Correctness and clarity come first.

For updates, both existing-row access and the resulting row should be constrained:

```sql
create policy "Owners can update their projects"
on public.projects
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
```

The `WITH CHECK` condition helps prevent a user from updating a row they own and changing its `owner_id` to someone else—or using an update path to create a row outside their ownership scope. In many systems, it is better to make `owner_id` immutable through database permissions, triggers, or carefully designed update functions.

Do not create one broad policy that accidentally grants every operation. Read, insert, update, and delete permissions often have different business rules.

### 2.7 Table grants and RLS are different controls

SQL privileges determine whether a role can attempt an operation on a table. RLS policies determine which rows that operation may affect. Both layers matter. A permissive RLS policy does not necessarily grant a missing table privilege, and a table grant does not override an RLS policy for roles subject to it.

When access fails, inspect both grants and policies. When access is too broad, inspect both. Review default privileges and any functions that execute with elevated privileges. Security should not depend on one dashboard toggle alone.

### 2.8 Database schema and relationships

Use explicit primary keys, foreign keys, nullability, and uniqueness constraints. For example:

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  created_at timestamptz not null default now()
);

create index projects_owner_created_idx
on public.projects (owner_id, created_at desc);
```

This example illustrates a common structure, but production schema choices should reflect actual ownership and retention requirements. Referencing `auth.users` directly is a design decision; some projects maintain a public profile table with a foreign key to the auth identity.

Choose deletion behavior deliberately. `ON DELETE CASCADE` may be appropriate for user-owned content, but can be destructive if records must be retained for audit, billing, or legal reasons. Use `RESTRICT`, `SET NULL`, soft deletion, or an archival model when the product requires it.

### 2.9 Migrations

A migration is a versioned change to the database schema or related database objects. Migrations make changes reproducible and reviewable. They should be committed to source control and applied through a documented process rather than made only by clicking in a dashboard.

Typical migration changes include creating a table, adding a constraint, enabling RLS, adding policies, creating indexes, and modifying functions. Review data migrations separately from schema changes because data volume and locking behavior can make them riskier.

Prefer small, reversible where practical, forward-compatible migrations. In a rolling deployment, the old and new application versions may run at the same time. Add a new nullable column first, deploy code that can use it, backfill safely, then tighten constraints only when the data is ready.

### 2.10 Storage buckets and object policies

Supabase Storage organizes uploaded objects into buckets. A bucket may be public or private. A public bucket makes object retrieval broadly available through its public URL; it should only contain content intended for public access. Private buckets require authorized access, typically through authenticated requests or signed URLs.

Storage permissions are separate from ordinary table policies for your application's data. Configure and test the policies for the storage metadata tables and object operations using the documented Supabase model. A private bucket does not automatically guarantee that every upload or delete operation is correctly authorized.

A common ownership convention places a user identifier in the object path, but path naming alone is not security. The storage policy must validate the user's right to create, read, update, or delete the requested object.

### 2.11 Local development

Supabase CLI tooling can support local development with a local stack and migration workflow. Exact commands and prerequisites can vary by CLI version; consult the installed CLI's help and the current official documentation when setting up a team workflow.

A reproducible local setup generally includes:

- A documented CLI version or version-management approach.
- A local configuration file that is safe to commit.
- Versioned SQL migrations.
- Seed data that contains no real production secrets or private customer records.
- A command sequence for starting services, resetting the database, and running tests.
- Clear separation between local and hosted project credentials.

The goal is for another developer to clone the repository and reconstruct a useful development environment without manually recreating tables from memory.

## 3. Creating a Project and Establishing Safe Configuration

### 3.1 Project creation checklist

When creating a Supabase project, decide on the project name, region, database password, and environment purpose. Choose a region based on user geography, latency, regulatory needs, and the rest of the application infrastructure. Store the database password in a secure password manager or secret store.

After creation, record the project URL and the correct client key type for each environment. Do not copy all keys into a shared chat or commit them to Git. The project dashboard is a configuration source, not a substitute for an internal secret inventory.

Create separate projects for production and non-production when feasible. At minimum, avoid running destructive test migrations or seed scripts against production. If you need realistic test data, generate synthetic records or use a carefully approved anonymization process.

### 3.2 Environment variable layout

A `.env.example` file should show the names of variables without real secrets:

```bash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

A local `.env` file contains the actual development values and should be ignored by Git. The production platform should inject secrets at runtime. Never assume a variable is private merely because its name includes `SECRET`; build tools can expose variables according to naming conventions and configuration.

Validate required configuration at startup. If a server-only key is missing, fail clearly in the server environment rather than silently falling back to a public client with different permissions. Avoid printing environment objects in logs because they may contain credentials.

### 3.3 Public versus privileged keys

Treat the public/publishable key as visible to clients. It is designed to be used in a public client context with RLS and appropriate grants enforcing access. It is not a password and should not be used as a reason to relax policies.

Treat service-role or secret keys as privileged. They can perform operations that ordinary client sessions cannot and may bypass RLS. They must remain on trusted server infrastructure. Do not put them in a mobile app, desktop client, browser bundle, public GitHub repository, screenshot, or client-side configuration endpoint.

If a privileged key is exposed, rotate it using the project's supported key-management process and investigate potential access. Removing the key from the latest commit does not remove it from Git history, build artifacts, logs, or deployed bundles.

### 3.4 Database connection strings

A direct PostgreSQL connection is useful for migrations, administrative tasks, and server-side database libraries. Supabase may provide different connection options, such as direct or pooled connections, depending on the environment and platform. Choose based on the runtime, connection limits, transaction behavior, and deployment topology.

Serverless functions can create large numbers of short-lived connections if configured carelessly. Prefer a supported pooler or connection strategy for the platform and framework, and keep migration connections separate from normal application traffic where appropriate. Do not expose a database connection string to browser code.

A database password in a connection URL must be URL-encoded when it contains reserved characters. Keep connection strings out of source control and logs, and rotate credentials according to the team's security process.

## 4. Authentication Setup and Session Handling

### 4.1 Configure providers and redirect URLs

Choose the authentication methods the application actually needs: email/password, email OTP or magic links, OAuth providers, or other supported options. Configure provider credentials and redirect URLs in the appropriate project settings. Avoid permissive redirect patterns that could allow a session or authorization result to be redirected to an untrusted site.

Use exact production and development redirect origins where possible. Test successful login, failed login, logout, email verification if enabled, expired links, and redirects from the actual deployed domains. A configuration that works on localhost may fail in production because the callback URL differs.

Do not enable a provider just because it is available. Each provider adds setup, user-experience, abuse, and support considerations. Document the intended sign-in flow and account recovery path.

### 4.2 Browser client and user session

A browser client can manage the user's session according to the SDK's supported storage and refresh behavior. Avoid implementing custom token storage unless there is a clear security reason and the approach has been reviewed. Tokens accessible to JavaScript can be exposed by cross-site scripting; use secure coding practices and content-security controls where appropriate.

Example:

```javascript
const { data, error } = await supabase.auth.getUser();

if (error) {
  // Handle expired or unavailable session state.
} else {
  const user = data.user;
  // Use user identity for UI state; database policies still enforce access.
}
```

Do not trust a user ID supplied in a form or query parameter as proof of identity. Use the authenticated session and server/database authorization context. The frontend may use the returned identity to personalize the UI, but data access must still be checked at the server boundary.

### 4.3 Server-side rendering and server clients

In server-rendered frameworks, use the integration pattern recommended for that framework and the current Supabase SSR package. Cookie handling, refresh behavior, and request-scoped clients matter. Avoid creating one global mutable user client that can accidentally carry one request's session into another request.

A server-side request should create or obtain a client using the current request's cookies/session context. If a privileged service client is also needed for administrative work, keep it separate from the user-scoped client and make the privilege escalation explicit in the code review.

### 4.4 Auth user records and profile tables

The authentication system's user table and the application's profile table serve different purposes. The auth record represents identity and sign-in state; the profile table stores application-specific attributes. Do not assume every application field belongs in auth metadata, or that client-editable metadata is trustworthy for authorization.

A profile table might use the auth user's UUID as its primary key:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
```

Create appropriate policies for profile access. If users can update their display name, ensure they cannot change the profile's identity key or write privileged fields such as an admin flag. Administrative roles should be determined by trusted server-controlled data or claims, not a field a user can edit.

### 4.5 Account deletion and retention

Deleting an auth user can affect related records, storage objects, subscriptions, and audit history. Plan the deletion workflow rather than relying on one cascade without review. Determine which data should be deleted, anonymized, retained, or placed on a legal hold.

Some deletion operations require a privileged server-side process. Do not give the browser a service-role key to simplify account deletion. Use an authenticated server endpoint or trusted function that verifies the requester and performs only the intended actions.

## 5. RLS Policy Engineering

### 5.1 Start with a policy matrix

Before writing policies, list operations by role. For example:

| Resource | Anonymous | Authenticated owner | Admin/service |
|---|---|---|---|
| Public articles | Read published rows | Read published rows | Manage all rows |
| User profiles | No access or limited public fields | Read/update own profile | Support-specific access |
| Private projects | No access | CRUD own rows | Explicit administrative path |
| Billing records | No access | Read permitted own records | Trusted billing process |
| Upload metadata | Public read only if intended | Access own objects | Controlled maintenance |

This is a planning example, not a universal policy. Replace the rows and roles with the application's real requirements. Explicitly decide what anonymous users can do; do not infer it from the fact that a page is public.

### 5.2 Policy examples for CRUD

Suppose `projects` has `owner_id`:

```sql
alter table public.projects enable row level security;

create policy "Read own projects"
on public.projects
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Create own projects"
on public.projects
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Update own projects"
on public.projects
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Delete own projects"
on public.projects
for delete
to authenticated
using (owner_id = (select auth.uid()));
```

These policies illustrate ownership-based access. They must be reviewed with table grants, other policies, and any triggers or functions. PostgreSQL policies can combine permissively or restrictively according to their configuration; adding a second policy can broaden access unexpectedly if the team assumes all policies are ANDed together. Understand the actual policy composition and test it.

### 5.3 Avoid trusting client-supplied ownership

A user can modify a request body. If an insert accepts `owner_id` from the browser, a policy with `WITH CHECK (owner_id = auth.uid())` should reject an attempt to insert for another user. For a stronger design, derive ownership from the authenticated identity in a trusted database default or function when practical, and do not allow clients to change the owner field after creation.

For multi-tenant applications, `owner_id` may not be enough. A user may belong to several organizations and act in different roles within each. Model memberships explicitly and write policies that check membership in the relevant tenant. Test both allowed and denied access across tenants.

### 5.4 Admin roles and privileged operations

Do not create an admin policy based on a user-editable profile column. Use a trusted role assignment process, verified claims, or a server-side authorization model. If using custom claims, define who can set them, how changes propagate, and what happens to existing sessions after role revocation.

A service-role key bypasses normal RLS protections, so a server endpoint using it must perform its own authorization checks before executing privileged operations. The fact that the request reached a backend route is not sufficient. Verify the user's identity, role, resource scope, and intended action.

### 5.5 Views, functions, and elevated execution

Views and database functions can change how permissions apply. Review their security mode and ownership carefully. A function that executes with elevated privileges can accidentally bypass protections if it accepts arbitrary user-controlled identifiers or dynamic SQL.

Use parameterized SQL, narrow function signatures, and explicit authorization checks. Avoid dynamic SQL assembled from untrusted input. Grant execution only to the roles that need it, and document why any function requires elevated access. Include functions and policies in migrations so they are reviewed alongside table definitions.

### 5.6 Test RLS with real client roles

Testing only from the SQL editor or as a database owner can produce misleading results because privileged roles may bypass RLS. Test with an ordinary authenticated user session and, where relevant, the anonymous role. Create at least two test users and verify that one cannot read, update, or delete the other's rows.

Negative tests are critical. Check that a request with a forged `owner_id` is rejected, a tenant mismatch returns no unauthorized data, an update cannot transfer ownership, and a user cannot access a private storage object by guessing its path. A policy is not validated merely because the intended user can access their own data.

## 6. Storage Setup

### 6.1 Public and private buckets

Use a public bucket only for content intended to be broadly retrievable, such as approved public thumbnails. Use a private bucket for documents, private uploads, exports, or other user-specific content. Public URLs are not a substitute for access control.

Set file-size and MIME-type restrictions where supported and validate file content on the server when the threat model requires it. Client-provided MIME types can be forged. Consider malware scanning, safe file naming, and content-disposition behavior for user-uploaded files that may be opened in a browser.

### 6.2 Object paths and ownership

A path convention such as `user-id/document-id/filename` can help organize objects and write policies, but it does not grant access by itself. A policy should compare the authenticated user to the expected owner segment or use a database relationship that represents ownership. Ensure users cannot upload into another user's path or overwrite objects they do not own.

Do not trust a filename as a unique identifier. Normalize paths and avoid relying on client-supplied file extensions for security decisions. Keep original filenames as metadata if needed, but use safe storage object names.

### 6.3 Signed URLs

A signed URL can provide temporary access to a private object. Its expiration is part of the access contract: anyone who obtains the URL may be able to use it until it expires, depending on the storage semantics. Do not log signed URLs or embed them in analytics events. Generate them only after verifying the requester may access the object.

Choose an expiration that fits the use case. A short-lived download link reduces exposure but may expire during a large transfer or before a user opens it. A long-lived link is convenient but increases the period of access if shared. Re-check ownership before generating the link; possession of a resource ID alone is not authorization.

## 7. Migrations and Local Development Workflow

### 7.1 Source-controlled schema

Keep schema changes in SQL migration files. Include table definitions, constraints, indexes, RLS enablement, policies, functions, and other database objects needed to reproduce the environment. A migration should be understandable in code review and should not depend on a developer remembering a manual dashboard step.

A migration workflow should support both forward deployment and a clean local reset. Seed data should be deterministic and synthetic. Avoid placing production data dumps or real user secrets in a repository.

### 7.2 Typical CLI workflow

A team may use Supabase CLI commands to initialize local configuration, start the local stack, create migration files, apply migrations, generate types, and link to a hosted project. Exact command names and options can change between CLI releases; use the installed version's help and current official documentation to confirm the workflow.

The process should be standardized in the repository README or developer guide. Include prerequisites, required environment variables, how to start local services, how to reset a local database, how to run tests, and how to deploy a migration. Do not let each developer invent a different path to the same schema.

### 7.3 Migration review and deployment safety

Before applying a migration to production, assess lock behavior, table size, index creation, backfill cost, and compatibility with currently deployed application versions. Adding a column is often safer than renaming or dropping one immediately. Use expand-and-contract migrations for changes that span multiple application releases.

For a large backfill, consider a separately controlled job with progress tracking rather than one long transaction. Make it restartable and idempotent where possible. Verify the expected row counts and constraints before switching application behavior.

### 7.4 Generated types

Type generation can make client code safer by aligning TypeScript types with the database schema. Treat generated types as a representation of the schema, not proof that runtime access is authorized or that values from external input are valid. Re-generate types after schema changes and include the appropriate generated artifacts in the team's workflow.

Avoid hand-editing generated files unless the tool explicitly supports customization. If types are stale, a developer may write code against a field that no longer exists or fail to notice a nullability change. CI can check that generated types remain in sync where practical.

## 8. Query Design and Performance

### 8.1 Use indexes for real access patterns

Supabase's PostgreSQL database still benefits from conventional query planning. Index columns used in selective filters, joins, and ordering when the workload justifies them. Do not add indexes to every column: indexes consume storage and add write overhead.

For an owner-scoped project list:

```sql
create index projects_owner_created_at_idx
on public.projects (owner_id, created_at desc);
```

Validate with realistic query plans and data volume. A small local dataset can hide slow scans and poor selectivity. Consider composite index column order based on the filters and ordering that the application actually uses.

### 8.2 Pagination and result limits

Avoid returning an unbounded table to the client. Use pagination or keyset pagination for large datasets and define stable ordering. A query without deterministic ordering can return rows in an order that changes between calls, making pagination unreliable.

Apply result limits and validate page parameters. A client should not be able to request millions of rows simply by changing a URL parameter. Consider whether the query should be exposed directly to the client or wrapped in a narrower server-side operation.

### 8.3 Connection limits and serverless runtimes

Connection usage depends on runtime model, pooling, and concurrency. A serverless function can scale to many instances, each opening database connections. Choose the supported connection option for the workload, monitor active connections and pool wait times, and avoid opening a fresh connection per row or per request without pooling.

Use transactions for logically related changes. Keep transactions short and avoid making slow external API calls while holding database locks. If an operation needs both a database change and an external side effect, consider an outbox or retryable workflow rather than pretending the two systems share one transaction.

### 8.4 Avoid using RLS as the only performance plan

RLS is a security feature, not a replacement for indexes or query analysis. A policy that performs a costly membership lookup for every row can become a performance bottleneck. Index the columns used by policy predicates and inspect query plans with realistic user and tenant data.

Do not weaken authorization just to improve performance. Instead, simplify the data model, add appropriate indexes, precompute membership relationships where safe, or use a carefully reviewed database function. Measure both correctness and performance after policy changes.

## 9. Production Operations and Reliability

### 9.1 Backups and restore tests

A backup policy is meaningful only if the team understands its recovery point objective (RPO) and recovery time objective (RTO), and has tested restoration. Review the backup and point-in-time recovery capabilities available for the chosen Supabase plan and configuration rather than assuming all projects have identical options.

Document who can initiate a restore, how restored data is validated, and how the application is switched to the recovered environment. A backup that has never been restored is an untested assumption. Test the process in a non-production environment when possible.

### 9.2 Monitoring and logs

Monitor database availability, query latency, connection use, storage usage, error rates, authentication failures, and application-level authorization denials. Use the platform's available logs and metrics, and add application metrics for business-critical paths. Alert on meaningful symptoms, not every transient warning.

Avoid logging access tokens, passwords, connection strings, signed URLs, or private row contents. For debugging, prefer request IDs, error classes, safe identifiers, and counts. Restrict access to production logs because they may still contain sensitive metadata.

### 9.3 Rate limits and abuse controls

Public endpoints can be abused even when RLS is correct. Use appropriate rate limits, input validation, pagination limits, and abuse monitoring. Do not rely exclusively on a client-side debounce or a hidden button to limit requests. For costly workflows, apply controls at a trusted server boundary.

Authentication endpoints also need abuse consideration, including repeated sign-in attempts and email flows. Use the platform's supported protections and add application-level safeguards where necessary. Do not reveal whether a sensitive account exists if that would enable enumeration.

### 9.4 Incident response

Prepare a response for accidental secret exposure, an overly permissive policy, unexpected data deletion, authentication misconfiguration, and a failed migration. The runbook should include how to rotate secrets, disable a risky route or feature, inspect audit/log information, restore from backup if needed, and communicate impact.

If a policy is found to be too permissive, fix the policy and assess whether data may have been accessed. Do not assume that closing the hole erases prior exposure. If a migration fails, determine whether it partially applied, whether it is safe to retry, and whether a forward repair migration is safer than a manual rollback.

## 10. Common Mistakes

| Mistake | Why it hurts | Better approach |
|---|---|---|
| Exposing a service-role key in frontend code | Privileged access may bypass RLS | Keep it on trusted server infrastructure and rotate if exposed |
| Treating authentication as authorization | Signed-in users may read other users' data | Enforce access with RLS and server-side checks |
| Enabling RLS without writing policies | Intended access may fail unexpectedly | Create and test explicit policies for each operation |
| Writing only `auth.uid() IS NOT NULL` | Any authenticated user may match | Check ownership, membership, or an explicit role |
| Testing only as database owner | Owner privileges can bypass RLS | Test with real anonymous and authenticated client roles |
| Trusting client-supplied `owner_id` | Users can attempt to forge ownership | Use `WITH CHECK`, immutable ownership, and server/database logic |
| Assuming public keys are secrets | Leads to misplaced security effort | Assume public keys are visible; rely on grants and RLS |
| Putting secrets in public-prefixed env vars | Build tools may bundle them into browser code | Keep server-only secrets in server runtime configuration |
| Making a storage bucket public by convenience | Private files become broadly retrievable | Choose public/private based on data sensitivity |
| Relying on object path naming alone | Paths do not enforce access | Write and test object policies |
| Making dashboard-only schema changes | Environments drift | Commit migrations and reproduce from source |
| Dropping columns in one release | Old application instances may break | Use expand-and-contract rollout |
| Ignoring connection pooling | Serverless concurrency can exhaust connections | Use a supported pooling strategy and monitor connections |
| Over-indexing | Writes and storage become more expensive | Add indexes for measured query patterns |
| Assuming backups are enough | Restore may be too slow or incomplete | Test recovery against RPO/RTO |
| Logging tokens or signed URLs | Credentials and private data can leak | Redact sensitive values and restrict logs |
| Using a profile field for admin privileges | Users may alter their own role | Use trusted role assignment and narrow privileged paths |
| Treating generated types as validation | Runtime input can still be malicious or invalid | Validate external input and enforce DB constraints |
| Allowing unbounded queries | Clients can trigger expensive scans or huge responses | Limit, paginate, index, and monitor |
| Assuming RLS covers every function | Elevated functions may bypass policies | Review function security mode and grants |

### 10.1 Debugging access problems

When a query unexpectedly returns no rows, check:

1. Is the user authenticated in the request that actually reaches the database?
2. Is the request using the expected project URL and environment?
3. Is RLS enabled on the table?
4. Does a policy exist for the operation and role?
5. Does the row satisfy the `USING` predicate?
6. For inserts and updates, does the new row satisfy `WITH CHECK`?
7. Are table grants present for the role?
8. Does the policy refer to the correct identity or membership column?
9. Is a view or function changing the permission context?
10. Is the client using a stale session or incorrect cookie context?

When access is unexpectedly broad, check:

1. Is RLS enabled on every exposed table?
2. Are there multiple permissive policies that broaden access?
3. Does a policy check only that a user is authenticated rather than that they own the row?
4. Are admin flags editable by clients?
5. Is a service-role key used in a request path without authorization?
6. Are storage policies too broad?
7. Are elevated functions using untrusted parameters?
8. Are public views exposing columns that should remain private?

## 11. Mental Models

1. **Supabase is a platform, not a security policy.** Your app's access rules must still be designed and tested.
2. **Authentication establishes identity; authorization limits actions.** A valid session is not blanket permission.
3. **RLS is enforced at the data boundary.** Frontend hiding is a usability detail, not a security barrier.
4. **A public key can be public because policies protect the data.** A privileged key must remain private because it can bypass ordinary restrictions.
5. **A migration is part of the application.** If schema changes are not versioned, environments will drift.
6. **Every exposed table needs an access story.** State who may select, insert, update, and delete each row.
7. **Storage has its own authorization surface.** Database table policies do not automatically secure every file operation.
8. **The SQL editor may not represent a real user.** Test with ordinary client roles and sessions.
9. **Constraints protect data after the UI is bypassed.** Put durable invariants in PostgreSQL.
10. **Environment separation limits blast radius.** Development credentials and test scripts should not reach production.
11. **A successful deploy is not a recovery plan.** Backups matter only when restore procedures are understood and tested.
12. **Generated types improve developer feedback, not runtime trust.** Validate inputs and enforce database rules.
13. **Least privilege applies to keys, functions, tables, and operators.** Give each component only the access it needs.
14. **Secure defaults should fail closed for data access.** When authorization is uncertain, do not return protected data.

## 12. Quick Reference

| Task | Starting point | Important check |
|---|---|---|
| Create a client project | Use project URL and publishable key | No privileged key in browser bundle |
| Read user identity | Auth SDK/session | Database policies still enforce access |
| Protect user-owned rows | Enable RLS and use `auth.uid()` ownership checks | Test with two separate users |
| Protect tenant data | Model memberships and tenant scope | Test cross-tenant denials |
| Add a table | SQL migration with constraints | RLS, grants, indexes, deletion behavior |
| Upload private files | Private bucket and object policies | Verify guessed paths cannot bypass policy |
| Share a file temporarily | Generate signed URL after authorization | Keep URL short-lived and out of logs |
| Change schema | Versioned migration | Compatibility with old and new app versions |
| Run locally | CLI and committed migrations | Reproducible clean reset |
| Improve slow queries | Indexes and query plans | Test realistic data and policy predicates |
| Handle serverless DB access | Supported connection/pooling strategy | Connection limits and pool wait |
| Rotate exposed credentials | Supported key rotation process | Investigate exposure and remove leaked copies |
| Recover from data loss | Backup and restore runbook | Validate RPO/RTO with restore test |
| Debug denied access | Inspect auth context, grants, and policies | Avoid testing only as owner |
| Audit security | Policy matrix and negative tests | Check every table, view, function, and bucket |

## 13. Build Challenge: Secure a Multi-User Project Workspace

Build a small application where users can sign in, create projects, manage their own projects, and upload private documents. The challenge is complete only when database rules—not merely frontend logic—enforce the intended access model.

### Requirements

1. Create separate development and production projects or document the environment separation plan.
2. Configure environment variables without committing secrets.
3. Initialize the JavaScript SDK with the public/publishable key in the browser.
4. Create a `projects` table with a UUID primary key, owner identity, title, and timestamp.
5. Add constraints for required fields and reasonable title values.
6. Enable RLS on the projects table.
7. Write separate select, insert, update, and delete policies.
8. Ensure a user cannot create a project for another user.
9. Ensure a user cannot transfer a project to another owner through an update.
10. Add an application profile table if the product requires profile attributes.
11. Configure sign-in and sign-out flows with valid redirect URLs.
12. Create a private storage bucket for project documents.
13. Write storage policies that enforce the intended ownership model.
14. Validate file size and type according to the product's requirements.
15. Add migrations for tables, indexes, RLS, policies, and required functions.
16. Create synthetic seed data for local development.
17. Test access using two independent authenticated users and an anonymous client.
18. Confirm that a user cannot read or modify another user's project or file.
19. Add a query limit and an index for the owner's project list.
20. Document how migrations are applied to staging and production.
21. Add error handling for expired sessions and failed storage operations.
22. Ensure logs do not expose secrets, tokens, or signed URLs.
23. Document backup and recovery assumptions for the chosen project configuration.
24. Write a short incident procedure for an exposed privileged key or overly permissive policy.

### Suggested implementation sequence

1. Define the policy matrix before writing the frontend.
2. Create the schema and migrations.
3. Enable RLS and add ownership policies.
4. Run negative tests directly with ordinary client roles.
5. Configure authentication and session behavior.
6. Add project CRUD operations using the public client.
7. Add private storage and object policies.
8. Add indexes based on the actual query pattern.
9. Recreate the database from a clean local environment.
10. Test two-user isolation and anonymous access.
11. Review key exposure in the built frontend bundle.
12. Document deployment, backup, and incident response.

### Test matrix

| Scenario | Expected result | Evidence |
|---|---|---|
| User A creates a project for self | Allowed | Insert succeeds with owner A |
| User A creates a project for user B | Denied | Policy rejects forged owner |
| User A reads own project | Allowed | Correct row returned |
| User B reads A's private project | Denied | No unauthorized row returned |
| User A changes owner to B | Denied | Update policy or database rule rejects it |
| Anonymous client reads private projects | Denied | No private rows exposed |
| User A uploads to permitted private path | Allowed | Upload succeeds |
| User B reads A's object | Denied | Storage policy blocks access |
| User requests a public object | Allowed only if intended | Public bucket contains only public content |
| Client bundle is inspected | No privileged secret found | Build artifact scan |
| Migration is applied to clean database | Reproducible schema | Reset succeeds |
| Old app version runs during migration | No avoidable breakage | Compatibility test |
| Session expires | Safe re-authentication path | No protected data returned without access |
| Database query is large | Bounded response | Pagination and query limit |
| Backup restoration is rehearsed | Recovery meets documented target | Restore record and validation |

### Definition of done

The challenge is complete when:

- Authentication works through the intended provider and redirect configuration.
- Every exposed table has an explicit and tested access policy.
- A user cannot read or mutate another user's private data.
- No privileged key is shipped to a browser or client bundle.
- Storage bucket visibility and object policies match the sensitivity of the files.
- Schema changes are represented in migrations and reproduce a clean environment.
- Database constraints and indexes support the data model and query patterns.
- Tests cover allowed and denied actions, including cross-user attempts.
- The team understands its backup, recovery, and incident-response process.
- The application remains usable when authentication or storage operations fail.
- Production configuration is distinct from development configuration.

## 14. Final Review Checklist

Before approving a Supabase setup, ask:

- Which tables and storage buckets can client applications reach?
- Is RLS enabled on every exposed table that requires row-level protection?
- Are policies specific to the intended operation and user/tenant scope?
- Have tests been run as ordinary anonymous and authenticated clients?
- Can a user forge ownership or edit their own role?
- Are any views or functions using elevated privileges?
- Is the service-role or secret key absent from browser/mobile artifacts?
- Are storage object policies tested independently from database table policies?
- Are environment variables and connection strings handled securely?
- Are schema and policy changes versioned in migrations?
- Can a clean environment be reproduced from source control?
- Are query limits, indexes, and connection strategy appropriate for the runtime?
- Are backups and restore procedures understood and tested?
- Are logs free of secrets, tokens, and signed URLs?
- Is there a plan for key rotation, policy incidents, and failed migrations?

A robust Supabase implementation is not the one with the fewest lines of setup code. It is the one where identity, authorization, schema evolution, storage, and operations have explicit boundaries and reproducible tests. Start with the smallest secure design, verify denial cases as carefully as success cases, and expand only when the product requirements justify it.



## 15. Deeper Engineering Notes

### 15.1 Policy composition requires careful review

PostgreSQL RLS policy composition can surprise teams that assume every policy is automatically restrictive. Permissive policies generally combine with OR semantics, while restrictive policies combine with AND semantics, subject to PostgreSQL's role and command rules. Adding a policy for a new feature can therefore broaden access if an existing permissive policy already allows a larger set of rows.

When reviewing policy changes, inspect all policies that apply to the table, not just the new policy. Keep policy names descriptive and avoid duplicating similar rules across migrations. Where the business model becomes complex, consider a small number of clear policy helpers or a normalized membership model rather than many overlapping conditions that no one can reason about.

### 15.2 Membership-based multi-tenancy

For an organization-based application, model membership as data. For example, an `organization_members` table may contain `organization_id`, `user_id`, and a role. A project can then belong to an organization rather than directly to a single user. Policies must verify that the current user is a member of the organization and has the right role for the requested operation.

Index the membership lookup columns and avoid relying on a user-supplied organization ID alone. A request that names organization A is not proof that the caller belongs to organization A. Test users who belong to multiple organizations and users who were removed from an organization. Decide how quickly membership revocation must affect active sessions and cached application state.

### 15.3 RLS and privileged server operations

Some administrative operations legitimately need broader database access, such as scheduled cleanup, support tooling, or processing a verified payment webhook. Keep these operations in a trusted server context and make the boundary explicit. A service-role key should not become the default client for all server routes simply because it makes queries easier.

For every privileged endpoint, write down the authorization check that occurs before the privileged operation. For a webhook, verify the provider's signature and event semantics. For support tooling, verify the operator's role and audit the action. For background jobs, restrict the job's scope and credential access. Privilege should be narrow, auditable, and difficult to invoke accidentally.

### 15.4 Database constraints complement RLS

RLS controls which rows a role can access; it does not replace data validation or integrity constraints. A user may be allowed to insert a project but still submit an empty title, duplicate external ID, or invalid state transition. Use `NOT NULL`, `CHECK`, `UNIQUE`, foreign keys, and transactions for invariants that must hold regardless of the caller.

For state transitions that require multiple conditions, consider a database function or carefully controlled update statement that verifies the previous state. Do not trust a client to enforce business invariants by disabling a button or checking a value before sending a request.

### 15.5 Testing strategy: positive and negative cases

A positive test proves that a permitted operation works. A negative test proves that a forbidden operation is blocked. Security tests need both. For every policy, test the intended user, a different user, an anonymous client, and—if relevant—a user with a different organization role.

Use fixtures with unmistakably different ownership values so accidental leakage is obvious. Assert that unauthorized reads return no protected rows and that unauthorized writes fail. Avoid tests that pass merely because the row does not exist; create a real row owned by another test user and attempt to access it.

### 15.6 Seed data and environment safety

Seed scripts should be deterministic and idempotent where possible. They should create recognizable fake users, organizations, and projects for development tests. Do not use real email addresses, passwords, customer documents, or production identifiers unless there is an approved and safe process for doing so.

Make destructive commands require an explicit local environment or project target. A reset command that can accidentally target production is a process design defect. Keep local and hosted project references clear, and require code review or CI checks for production migration steps.

### 15.7 Schema changes that span multiple releases

A database migration and application deployment are rarely one atomic action. In a rolling deployment, some application instances may still use the old schema assumptions while others use the new ones. Use an expand-and-contract process: add the new structure, deploy compatible code, backfill, switch reads/writes, then remove the old structure in a later release.

Renaming a column in one step can break old instances. Dropping a column immediately after deploying code that no longer uses it can still break background workers or delayed jobs. Review all consumers, including scheduled tasks, analytics queries, and administrative scripts, before removing schema objects.

### 15.8 Backups and compliance

Recovery planning should include more than whether a backup exists. Define the data that must be recoverable, the acceptable amount of data loss, how long restoration can take, who may initiate it, and how restored data will be validated. Confirm the available backup and point-in-time recovery features for the actual project configuration and subscription.

If the application handles regulated or sensitive information, also define retention, deletion, access logging, and export requirements. Platform capabilities do not automatically mean the application's legal or contractual obligations are satisfied. Review those requirements with the responsible stakeholders.

### 15.9 Performance triage

When an endpoint is slow, separate database execution time, network latency, SDK overhead, application rendering, and external service time. Inspect query plans and index usage before adding a cache. Look for N+1 queries, unbounded result sets, repeated round trips, expensive RLS predicates, and excessive connection acquisition time.

Measure with representative data and a real client role because RLS predicates can alter query plans. A query that is fast as a database owner may be slower for a normal authenticated user. Do not disable RLS to make a benchmark look good; optimize the real, authorized query path.

### 15.10 A concise runbook for common incidents

**Unexpected public data exposure:** restrict the affected route or policy, identify which tables and roles were exposed, preserve relevant logs, assess potential access, fix and test the policy, and rotate any credentials that may have been exposed. Do not assume a policy fix retroactively protects data already accessed.

**Privileged key exposure:** revoke or rotate the exposed key using the supported process, inspect repositories, build artifacts, logs, and deployment variables, identify operations that may have been performed, and redeploy with a server-only secret source. Removing the key from the current file is not enough if it was committed earlier.

**Migration failure:** determine whether the migration was transactional and whether any statements partially applied. Inspect the schema and migration state, identify dependent application versions, and choose a forward repair or controlled rollback. Do not blindly rerun a non-idempotent migration.

**Authentication callback failure:** verify the exact redirect URL, provider configuration, environment-specific domain, cookie behavior, and server-side session handling. Reproduce the flow in the environment where it fails rather than changing production redirect patterns to broad wildcards.

**Storage access denial:** check bucket visibility, object path, authenticated session, grants/policies, and whether the policy predicate matches the intended ownership model. Test as the actual user role and avoid switching to a privileged key as a permanent workaround.

## 16. Final Principle

Supabase makes it practical to assemble a backend quickly, but speed should come from managed infrastructure and clear conventions—not from skipping access control. Keep credentials on the correct side of the client/server boundary, encode durable invariants in PostgreSQL, version the schema, and test both permitted and denied access. The backend is ready when another developer can reproduce it, a reviewer can explain its authorization model, and an operator can recover it safely.
