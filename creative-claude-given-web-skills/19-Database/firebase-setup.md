# SKILL: firebase-setup

**Layer:** `layer-19-database`  
**Goal:** Set up Firebase as a secure, maintainable application backend by configuring projects, Authentication, Cloud Firestore, Security Rules, Storage, client/server SDKs, local emulation, indexes, deployment environments, and production operations.

## 1. The Senior Engineer's Perspective

Firebase is a managed application development platform. It offers services such as Authentication, Cloud Firestore, Realtime Database, Cloud Storage, Hosting, Cloud Functions, messaging, analytics, and local emulation. A Firebase project can help a team deliver application features without operating every backend component itself. That convenience does not remove the need to design data access, validate input, control costs, separate environments, or test security boundaries.

The most important decision is not how quickly the first document can be written. It is whether the data model and authorization rules remain understandable as users, features, and traffic grow. Firestore is a document database, not a relational database with invisible joins. Data modeling must account for access patterns, query constraints, denormalization, indexes, document size, and the cost of reads and writes.

A senior engineer asks:

- **Product shape:** Which Firebase services are needed, and which would add unnecessary complexity?
- **Data model:** What are the core collections, documents, subcollections, and relationships?
- **Access patterns:** Which queries must be supported, and can they be expressed efficiently by Firestore?
- **Identity:** How do users authenticate, and what trusted identity claims are available to rules?
- **Authorization:** Can Security Rules enforce access at the data boundary, rather than relying on UI checks?
- **Privileged server code:** Which operations use Admin SDK credentials and therefore need explicit server-side authorization?
- **Environment separation:** Are local, staging, and production projects distinct and configured safely?
- **Cost and scale:** How do reads, writes, listeners, function invocations, and storage affect cost?
- **Reliability:** How are retries, offline writes, duplicate events, and partial failures handled?
- **Operations:** Are indexes, rules, functions, and configuration deployed and reviewed as code?

Firebase is not one database. Cloud Firestore and Realtime Database are separate products with different data models, query capabilities, and operational characteristics. This guide focuses mainly on Cloud Firestore, Firebase Authentication, Cloud Storage, and the Firebase CLI/emulator workflow, while calling out where other services differ.

### Recommended setup sequence

1. Define the app's data entities, roles, and access patterns.
2. Create separate Firebase projects for development, staging, and production where practical.
3. Register the correct web, iOS, Android, or server application.
4. Install the Firebase SDK and configure environment-specific client settings.
5. Enable only the Authentication providers the product needs.
6. Model Firestore collections and documents around actual query patterns.
7. Write restrictive Firestore Security Rules before shipping data access.
8. Configure Storage rules and file constraints if uploads are required.
9. Create and deploy indexes required by queries.
10. Use the Emulator Suite for local development and security testing.
11. Deploy rules, indexes, functions, and hosting configuration through a repeatable workflow.
12. Monitor errors, usage, quotas, and billing after release.

The guiding principle is **managed services reduce infrastructure work, not engineering responsibility**.

## 2. Core Concepts

### 2.1 Firebase projects and registered apps

A Firebase project is the main container for resources and settings. Applications such as a web app or Android app are registered within a project so the SDK can identify the relevant Firebase configuration. A project may contain several registered apps, but registration does not automatically isolate data or create a separate environment.

Use distinct projects for development and production when feasible. This limits the chance that test data, experimental rules, or destructive scripts affect live users. Project names should make the environment obvious. Keep project IDs and configuration documented, but do not treat a client configuration object as a secret credential.

### 2.2 Client configuration versus server credentials

A Firebase web configuration commonly includes values such as `apiKey`, `authDomain`, `projectId`, `storageBucket`, and `appId`. These identify the Firebase app and project; they are generally included in client applications. They are not a replacement for authorization. Security Rules, IAM, API restrictions where applicable, and server-side access controls must protect resources.

Admin SDK credentials are different. Server credentials can grant privileged access and may bypass Firestore and Storage Security Rules. Never bundle service-account private keys in browser code, mobile app assets, or a public repository. Use the platform's recommended application-default credentials or managed identity when running trusted server code, and grant only the IAM roles required.

Do not assume that obscuring a project ID or client config protects the database. Treat client-visible configuration as public and make access rules correct.

### 2.3 Cloud Firestore data model

Firestore stores documents inside collections. Documents contain fields and may have subcollections. Document paths are hierarchical, but subcollections do not behave like embedded arrays and are not automatically deleted when a parent document is deleted.

A conceptual structure might be:

```text
users/{userId}
projects/{projectId}
projects/{projectId}/tasks/{taskId}
organizations/{organizationId}
organizations/{organizationId}/members/{userId}
```

Choose paths based on how data is read, written, secured, and retained. A `users/{userId}` document is often a natural place for profile fields. A project document may store an owner ID and timestamps. A subcollection can hold a potentially large number of tasks without growing the parent document indefinitely.

Firestore documents have size and field constraints. Avoid storing unbounded arrays or repeatedly appending activity records to one document. Store growing collections as separate documents and query them with explicit limits and ordering.

### 2.4 Firestore is not relational SQL

Firestore does not provide arbitrary relational joins or the same constraint system as PostgreSQL. A query generally targets a collection or collection group and uses supported filters and ordering. If the same information is needed in several query paths, denormalization may be appropriate.

For example, a project card may store an owner display name for convenient listing, even if a user profile is the canonical source. This reduces lookup complexity but introduces a consistency problem when the display name changes. Decide which copy is canonical, how updates propagate, and whether temporary inconsistency is acceptable.

Do not choose Firestore simply because the SDK is easy to use. If the application depends heavily on multi-table joins, relational constraints, complex reporting, or transactional relational workflows, compare Firestore with PostgreSQL or another relational database before committing.

### 2.5 Authentication and identity

Firebase Authentication supports multiple sign-in providers. Once a user is authenticated, client SDK requests can carry identity information that Security Rules can use, such as `request.auth.uid`. A user ID is an identity key, not a role by itself.

Authentication answers who is making the request. Authorization decides which resources that identity can access. A signed-in user should not automatically have access to every document. Security Rules should verify ownership, membership, and role requirements for each operation.

### 2.6 Firestore Security Rules

Security Rules run at the service boundary and determine whether a client request is allowed. They can inspect the authenticated user, request data, existing resource data, and other supported rule context. Rules are not filters that silently remove unauthorized documents from a broad query; a query must be compatible with the rule constraints or Firestore rejects it.

A starting rule for user-owned documents may look like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update: if request.auth != null
                          && request.auth.uid == userId;
    }
  }
}
```

This is an illustration, not a complete production ruleset. It permits both read and update for a user's document but does not validate update fields or prevent writes to sensitive fields. Add field validation and separate operations where the product requires tighter control. Do not deploy broad development rules such as allowing all reads and writes to every document.

### 2.7 Admin SDK and server trust boundaries

Trusted server code using the Firebase Admin SDK generally operates with IAM permissions and bypasses client Security Rules. That is useful for trusted jobs and administrative operations, but it means the server must perform the required authorization checks itself.

A server endpoint should not accept a user ID from the request body and treat it as proof of identity. Verify the Firebase ID token using the supported server SDK, then authorize the action against trusted data. If the server uses Admin SDK to read or write a document, check ownership, tenant membership, and role before the privileged operation.

Keep user-scoped client code and privileged server code conceptually separate. Do not use Admin SDK from a browser or embed a service-account private key in the frontend.

### 2.8 Firestore indexes

Firestore automatically indexes many fields, but compound queries may require composite indexes. When a query needs an index, Firestore commonly returns an error with a link to create it. Treat the index definition as part of the application's schema and version it in source control where supported by the Firebase CLI configuration.

Indexes improve query support but consume storage and add write overhead. Exempt fields from indexing when appropriate, especially large fields that are never queried. Do not create indexes without understanding the query they serve.

### 2.9 Cloud Storage

Cloud Storage for Firebase stores objects such as profile images, documents, and media. Storage has its own Security Rules. A Firestore policy does not automatically secure a Storage object. Design the access model for each bucket and path, and test uploads, downloads, updates, and deletes independently.

Validate file size and content type, but do not assume the client-provided MIME type proves the file's actual content. For sensitive uploads, consider server-side inspection, malware scanning, and safe download behavior.

### 2.10 Local Emulator Suite

The Firebase Local Emulator Suite can provide local instances of supported Firebase services, including Authentication, Firestore, Storage, and Functions. It enables repeatable development and security testing without relying on production resources.

Use emulators to test both permitted and denied requests. Keep emulator configuration and seed data in the repository, and document the command sequence for starting services, loading test fixtures, running tests, and shutting down. Do not assume emulator behavior proves every production integration detail; test deployment configuration and service-specific behavior as well.

## 3. Project Setup and Environment Configuration

### 3.1 Create a project

Create a Firebase project in the Firebase console and choose a clear environment name. Review project-level settings, billing requirements, data location options where applicable, and the services the app will use. Do not enable every service by default. Every additional service introduces configuration, permissions, billing, and operational considerations.

Register the application platform. Web, iOS, and Android apps have different configuration and installation steps. Keep the generated configuration in the appropriate client application, but keep server credentials outside client assets. Confirm that the registered app points to the intended environment.

### 3.2 Install the SDK

For a JavaScript or TypeScript web application:

```bash
npm install firebase
```

Initialize the app using environment-specific configuration:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

The variable prefix is specific to the build tool in this example. Public-prefixed variables are bundled into client code. Never put Admin SDK private keys or other server-only secrets in these variables.

In frameworks with server-side rendering, use the framework's supported Firebase client and server integration. Avoid importing browser-only modules into server execution paths without checking runtime compatibility.

### 3.3 Environment separation

Use separate project configuration for local development, staging, and production. Environment switching should be explicit and visible in deployment configuration. A developer should be able to tell which project a command targets before running a destructive operation.

A `.env.example` can document variable names without secrets. Add real local environment files to `.gitignore`. Store production secrets in the deployment platform's secret manager or managed identity system. Restrict who can deploy to production and who can access service-account credentials.

### 3.4 Firebase CLI

Install and authenticate the Firebase CLI using the official installation instructions for the current version. Initialize the features the project needs, such as Firestore rules and indexes, Storage rules, Functions, Hosting, and emulator configuration. The exact prompts and commands can change across CLI releases, so verify them with the installed CLI help and current official docs.

A typical repository may contain:

```text
firebase.json
.firebaserc
firestore.rules
firestore.indexes.json
storage.rules
functions/
```

Not every project needs every file or feature. Commit configuration and rules, but never commit service-account private keys or production secrets. Review `.firebaserc` aliases carefully so development commands cannot accidentally target production.

### 3.5 Billing and quotas

Firebase usage can involve document reads and writes, storage, bandwidth, function invocations, and other service-specific charges or quotas. Understand the pricing model for the chosen services before launch. Real-time listeners and repeated client queries can create substantial read volume, particularly when a large query is re-subscribed or many clients listen to overlapping data.

Set budgets and alerts where supported, monitor usage, and establish limits for expensive workflows. A billing alert may notify the team rather than automatically cap all spending; do not assume it is a hard spending limit. Design pagination, caching, and listener lifecycles to avoid accidental usage spikes.

## 4. Authentication Setup

### 4.1 Enable only required providers

Configure the authentication providers the product needs. Each provider may require domain, redirect, OAuth client, or platform-specific setup. Test the full flow in the actual development and production domains.

Plan for account recovery, email verification, provider linking, logout, and changes in user identity. Decide what happens when a user signs in with two providers that may represent the same person. Do not merge accounts solely because two unverified identifiers look similar.

### 4.2 Create and observe a session

A client can observe authentication state using the SDK's supported listener:

```javascript
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    // Render signed-in UI; Firestore rules still enforce access.
  } else {
    // Render signed-out UI.
  }
});

// Call unsubscribe when the listener is no longer needed.
```

Unsubscribe when the component or service is disposed. Leaking listeners can create duplicate work and confusing UI updates. Do not treat a local UI state variable as the authoritative authorization boundary.

### 4.3 Verify ID tokens on a server

When a backend endpoint receives a Firebase ID token, verify it with the supported Admin SDK rather than decoding it manually and trusting the claims. Verification establishes that the token is valid according to the supported verification process. The backend must still authorize the requested operation.

A safe server request flow is:

1. Extract the bearer token from the request.
2. Verify it using the Admin SDK.
3. Obtain the verified UID and relevant trusted claims.
4. Validate the requested resource identifier and input.
5. Check ownership, membership, and role using trusted data.
6. Perform only the authorized operation.
7. Return a minimal response and log a safe request identifier.

If custom claims are used for roles, restrict who can set them and understand how token refresh affects propagation. Removing a role from a user may not immediately change claims already embedded in a token until the token is refreshed or otherwise handled according to the platform's behavior.

### 4.4 User profile data

Keep authentication identity separate from application profile data. A profile document might be stored at `users/{uid}`. Avoid trusting client-writable profile fields for privileged roles, account status, billing entitlements, or moderation state.

A common pattern allows users to update a limited set of fields such as `displayName` and `photoURL`, while server-managed fields remain protected. Security Rules can validate changed keys and field types. The exact rule must reflect the application's schema and supported rule language; test it in the emulator before deployment.

## 5. Firestore Data Modeling

### 5.1 Model around queries

Start with the queries the application must support, not just an entity diagram. For each screen or workflow, record the collection, filters, sort order, page size, and authorization rule. Then choose document paths and indexes that support those queries.

Example requirements:

- List projects owned by the current user, newest first.
- List tasks for one project, filtered by status.
- Show public published articles ordered by publication date.
- List a user's organization memberships.
- Load a project summary without fetching every task document.

The model should make common reads predictable. If a page needs many separate reads to render one small card, consider whether the data should be denormalized or aggregated. Balance duplication against write complexity and consistency requirements.

### 5.2 Embed versus subcollection

Embedding a small, bounded set of fields in a document can reduce reads and simplify atomic updates. A subcollection is often better for an unbounded list, independently queried records, or records with separate security and retention rules.

Do not embed a growing list of comments or events into one parent document. It can increase contention and approach document size limits. Use a subcollection for records that grow independently and define explicit cleanup behavior.

### 5.3 Denormalization and consistency

Firestore commonly uses denormalized data to support efficient reads. If a project document stores an owner display name, updating the canonical user profile may require updating many project documents. Decide whether the duplicate is a snapshot, a cache, or a canonical value.

Possible strategies include:
- Accept eventual consistency for non-critical display fields.
- Update copies in a trusted background process.
- Read the canonical value separately when freshness matters.
- Store only stable identifiers and derive display information at read time where feasible.

Do not duplicate sensitive authorization state casually. A copied `isAdmin` field in user-controlled documents can create inconsistent or exploitable permission checks.

### 5.4 Document and field naming

Use consistent, predictable names. Document IDs should be stable and safe to place in paths. Avoid placing sensitive personal data in document IDs because paths may appear in logs, URLs, and debugging output. Validate user-controlled IDs and avoid assuming that an unguessable ID is authorization.

Keep documents focused. Large arrays, long histories, and frequently updated counters may create contention or excessive transfer. Consider separate documents, aggregation strategies, or a relational database if the access pattern becomes difficult to maintain.

### 5.5 Deletion and lifecycle

Deleting a Firestore document does not automatically delete every document in its subcollections. Design a lifecycle process for parent records, child records, Storage objects, and related references. For large trees, use a trusted background cleanup job or supported recursive deletion approach with appropriate safeguards.

Before deleting a user account, determine which records should be deleted, anonymized, retained, or transferred. Use a server-side process for privileged cleanup and make it safe to retry. A partial failure should not leave the application permanently inconsistent without a repair path.

## 6. Firestore Security Rules

### 6.1 Deny by default

Rules should explicitly permit intended access and deny everything else. Avoid broad catch-all rules that grant reads or writes to any authenticated user unless that is truly the desired access model. A rule for one collection does not automatically secure other collections; audit all paths that can contain sensitive data.

Example restrictive structure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null
                  && request.auth.uid == userId;
    }
  }
}
```

This example only grants reads and does not grant writes. Extend it only after defining field-level requirements. Do not use `allow read, write: if true` in production.

### 6.2 Validate fields and changed keys

Ownership checks are necessary but may not be sufficient. If a user can update a document, they might alter protected fields unless rules validate the update. Use supported rule expressions to verify allowed keys, data types, ranges, and immutable fields.

For example, a project update rule may need to ensure that `ownerId` remains unchanged and that only `title` and `description` can change. Rules language features and map-diff methods have specific syntax and limits; validate the exact implementation against the current rules documentation and emulator tests.

### 6.3 Ownership and membership

For a user-owned project, a rule might compare `request.auth.uid` with the document's `ownerId`. For organization-owned data, the rule must check membership and role in a trusted membership document. A client-supplied `organizationId` is not proof of membership.

Be mindful that rules can perform document lookups with limits and billing implications. Avoid designing authorization around a large number of repeated cross-document reads. Keep membership data normalized enough to maintain correctness and efficient enough to authorize common operations.

### 6.4 Queries must satisfy rules

Firestore Security Rules do not function as row filters that return only allowed documents from a query. The query itself must be constrained so that every possible result is permitted by the rules. For example, if a rule permits reads only when `ownerId` matches the authenticated UID, a broad query across all projects may be rejected even if the developer expects unauthorized documents to be silently omitted.

Design the query and rule together. Test the actual query in the emulator using the intended authenticated identity. Avoid solving a rejected query by weakening the rule to permit every user to read every document.

### 6.5 Rules testing matrix

For every collection, test at least:
- Anonymous read and write.
- Authenticated owner read and write.
- Authenticated non-owner read and write.
- Forged owner ID on create.
- Ownership change on update.
- Invalid field type or unexpected field.
- Access to a missing or deleted resource.
- Cross-organization access when multi-tenancy applies.

Tests should assert both success and failure. A rule that denies everything may pass only the negative tests but still break the application; a rule that allows everything may pass the happy path but be insecure. Both sides are necessary.

## 7. Cloud Storage Security

### 7.1 Bucket and path strategy

Define object paths around ownership and product structure, such as `users/{uid}/avatars/{fileName}` or `projects/{projectId}/documents/{fileName}`. Path naming is a convention; Security Rules must enforce the relevant identity and relationship.

Use separate paths or buckets for public assets and private user uploads when that makes access boundaries clearer. Do not place sensitive files in public storage and rely on a hidden URL.

### 7.2 File validation

Set reasonable maximum file sizes and allowed content types. The client should validate early for usability, but the server-side Storage Rules and any trusted processing pipeline must enforce security-relevant constraints. A file extension or MIME type sent by the client can be misleading.

For high-risk uploads, consider scanning, content inspection, and safe serving. Avoid directly rendering untrusted HTML or SVG content without an appropriate threat model. Use generated object names and store user-provided filenames as metadata when needed.

### 7.3 Storage cleanup

When a user deletes a project, its Storage objects may need deletion too. Firestore and Storage do not share a single atomic transaction. Use a retryable workflow, record cleanup status if necessary, and make the operation idempotent. A failed object deletion should be observable and repairable.

### 7.4 Signed or tokenized access

Some Firebase Storage access patterns use download tokens or signed URLs depending on the SDK and architecture. Treat access URLs as potentially sensitive capabilities. Do not put private file URLs in public analytics or logs. Verify authorization before generating or returning an access URL and understand its expiration/revocation behavior for the chosen mechanism.

## 8. Indexes and Query Performance

### 8.1 Composite indexes

Compound Firestore queries may require composite indexes. Keep index definitions in source control when supported and deploy them with the application. Treat index deployment as part of a release rather than an undocumented console click.

A query combining `ownerId`, `status`, and `createdAt` may require an index matching its filters and ordering. The exact index depends on the query. Use the error message and query documentation to identify the required index, then test it with representative data.

### 8.2 Avoid accidental read amplification

A screen that loads one document at a time in a loop can generate many requests. A real-time listener that remains active after a component unmounts can continue consuming reads. Review data access per screen, unsubscribe listeners, paginate results, and avoid re-fetching unchanged data unnecessarily.

Do not cache authorization-sensitive data indefinitely. If a user's role or membership changes, stale client caches may show data that the server now denies or allow the UI to imply access that no longer exists. The server remains authoritative, and client caches should be invalidated where the product requires prompt updates.

### 8.3 Counters and contention

A single document updated by many clients can become a contention hotspot. For high-frequency counters or event streams, consider a supported distributed counter pattern, aggregation, or a backend processing pipeline. Do not assume a transaction will scale without limit simply because it prevents lost updates.

Choose transaction and batch-write strategies based on atomicity requirements and service limits. Keep transactions focused, avoid external network calls inside transaction callbacks, and account for retries.

### 8.4 Cost-aware query design

Firestore costs are strongly influenced by reads, writes, deletes, storage, and listeners. A query that is logically correct may still be expensive if it returns many documents or runs too frequently. Use limits and pagination, fetch only the data needed, and avoid broad listeners when a narrow query would suffice.

Monitor usage after release and test representative user journeys. Do not optimize only for a small developer dataset. Consider the cost of rule document lookups, repeated listeners, background triggers, and retries in the overall architecture.

## 9. Cloud Functions and Trusted Backend Work

### 9.1 When to use server functions

Use trusted backend code when an operation requires privileged credentials, secret API keys, server-side validation, scheduled processing, or coordination across services. Examples include processing a verified payment webhook, generating a report from private data, cleaning up a user's resources, or invoking a third-party API with a secret.

Not every operation needs a function. Direct client access can be appropriate when Security Rules precisely enforce the intended behavior. Adding a server function introduces deployment, latency, monitoring, and retry considerations; use it for a clear trust-boundary or workflow need.

### 9.2 Verify identity and authorize

For HTTP endpoints, verify the caller's Firebase ID token using the Admin SDK. Then perform explicit authorization checks before privileged operations. For event-driven functions, understand the event's origin and delivery semantics; do not assume an event executes exactly once.

Keep secrets in the platform's supported secret configuration or managed secret service. Do not hardcode them in source files. Give each function only the permissions it needs and separate high-privilege jobs from ordinary request handlers.

### 9.3 Idempotency and retries

Background functions and event handlers may retry or receive duplicate events. Design handlers to be idempotent: processing the same logical event twice should not double-charge, duplicate a record, or send repeated irreversible notifications. Use event IDs, unique operation records, transaction checks, or provider idempotency keys as appropriate.

Do not rely on an in-memory flag because function instances can restart or scale horizontally. Persist idempotency state in a durable system and define how old keys are cleaned up.

### 9.4 Transactional boundaries

A Firestore transaction can atomically read and write Firestore documents within the supported constraints, but it cannot atomically include an external email, payment processor, or object-storage action. For workflows across systems, use an outbox, state machine, or compensating action pattern. Record progress so a failed step can resume safely.

## 10. Emulator and Testing Workflow

### 10.1 Configure emulators

Use the Firebase CLI to configure the emulators needed for the project. Keep emulator ports and service configuration in the repository. Start only the services needed for the current test suite to keep local development manageable.

The exact CLI commands vary by version and initialized project. Use the installed CLI help and current official documentation. Document a stable team workflow such as install dependencies, start emulators, seed test fixtures, run unit/security tests, and stop services.

### 10.2 Seed predictable test data

Create deterministic fixtures for anonymous users, user A, user B, organization members, non-members, and representative project documents. Make fixtures easy to reset. Do not depend on whatever data happens to exist in a developer's local emulator from a previous run.

### 10.3 Security Rules unit tests

Use the supported Firebase rules testing library or current test tooling to run tests against the emulator. Test exact client operations, not only manually inspected rule expressions. Include tests for invalid fields, cross-user access, cross-tenant access, and queries that are expected to be rejected.

Run these tests in CI before deploying rules. A policy change is a code change with a security impact; it should have review, test coverage, and a rollback or repair plan.

### 10.4 Test real deployment configuration

Emulators are valuable but do not fully replace production-like integration testing. Verify app configuration, auth providers, domain allowlists, IAM permissions, indexes, and deployment targets in a staging project. Do not test destructive production behavior against live customer data.

## 11. Deployment and Production Operations

### 11.1 Deploy rules and indexes as code

Commit Firestore rules, Storage rules, index configuration, and relevant function code. Use a reviewed deployment process and verify the selected Firebase project before applying changes. Separate rule deployment from unrelated app changes when that makes risk easier to control.

Avoid making production-only console edits that are not reflected in source control. If an emergency console change is necessary, immediately reconcile it back into the repository and document the incident.

### 11.2 Staged rollout

Deploy to a staging project first. Run smoke tests for sign-in, key queries, uploads, functions, and denied access. Then deploy to production with an explicit change review. For risky changes, use a staged rollout or limited exposure when the platform and product support it.

Rules changes can break clients even if the application bundle is unchanged. Coordinate changes to rules and query shape. A stricter rule may cause old clients to fail; a looser rule may expose data. Review both compatibility and security impact.

### 11.3 Monitoring and alerting

Monitor authentication errors, Firestore request failures, function errors, latency, usage, quota exhaustion, storage failures, and billing trends. Add application-level logs with request IDs and safe metadata. Avoid logging ID tokens, service-account secrets, private document content, or sensitive file URLs.

Alerts should have clear owners and runbooks. Distinguish transient errors from sustained incidents. Monitor business-level outcomes such as failed uploads or stuck cleanup jobs, not only infrastructure health.

### 11.4 Backups and recovery

Confirm the backup and export options available for the chosen Firestore configuration and project. Understand whether exports require separate setup, how indexes and rules are restored, and how long a recovery may take. Test restoration in a non-production project and document validation steps.

A data export alone may not recreate the full application environment. Keep rules, indexes, functions, and deployment configuration in source control. Define recovery objectives and assign responsibility for initiating and validating recovery.

### 11.5 Cost and abuse controls

Set budgets and alerts where available. Use quotas, App Check where appropriate, rate limiting at trusted server boundaries, pagination, and server-side validation to reduce abuse. App Check can help attest that requests originate from an expected app environment, but it is not a replacement for Authentication or Security Rules.

Review expensive query patterns and listener lifecycles. A malicious or buggy client can generate repeated requests even when it cannot read protected documents. Monitor request volume and apply controls suitable for the service and threat model.

## 12. Common Mistakes

| Mistake | Why it hurts | Better approach |
|---|---|---|
| Deploying open development rules | Exposes or permits mutation of data | Start restrictive and test every intended operation |
| Treating client config as the main secret | Misunderstands Firebase's client security model | Assume client config is visible; enforce access in rules and IAM |
| Shipping Admin SDK credentials | Privileged access can bypass rules | Use server-side managed credentials and least privilege |
| Relying on UI checks | Direct API calls can bypass the UI | Enforce authorization in Security Rules or trusted server code |
| Assuming rules filter query results | Queries can be rejected instead of partially filtered | Design queries that prove all possible results are permitted |
| Modeling every relationship as a nested object | Unbounded data and query needs become difficult | Use collections/subcollections and explicit query design |
| Copying fields without a consistency plan | Duplicated values drift | Define canonical values and propagation behavior |
| Forgetting subcollection deletion | Orphaned data and privacy issues remain | Build explicit recursive cleanup workflows |
| Leaving listeners active | Repeated reads and stale state | Unsubscribe when components or services end |
| Ignoring composite indexes | Production queries fail | Version and deploy required indexes |
| Assuming transactions include external systems | Partial workflows occur | Use idempotent orchestration or compensation |
| Testing only successful access | Security gaps go unnoticed | Test denied cases with multiple identities |
| Using production for local experiments | Risks customer data and service availability | Use isolated projects and emulators |
| Ignoring read costs | Small screens can generate large bills | Paginate, narrow queries, and monitor usage |
| Treating App Check as authorization | Does not replace user-level access control | Combine App Check with auth and rules |
| Deleting only a parent document | Child collections and files may remain | Define lifecycle cleanup for related resources |
| Storing roles in client-editable fields | Users may elevate themselves | Use trusted claims or server-controlled role data |
| Hardcoding service secrets | Rotation and exposure become difficult | Use managed secret configuration |
| Assuming emulator tests cover deployment | Provider/IAM/domain settings may differ | Run staging smoke tests |
| Using one project for every environment | Tests can affect production | Separate environments and verify deploy targets |

## 13. Mental Models

1. **Firebase is a set of services, not a single database.** Choose each service for a specific need.
2. **Client configuration is not authorization.** Security Rules and IAM protect the data.
3. **Authentication identifies; rules authorize.** A signed-in user is not automatically trusted with every document.
4. **Firestore queries and rules are designed together.** Rules do not act as post-query filters.
5. **Data modeling follows access patterns.** Denormalization can improve reads but introduces consistency work.
6. **Admin SDK is a privilege boundary.** It requires explicit server-side authorization.
7. **A parent deletion is not necessarily a tree deletion.** Plan subcollections and file cleanup.
8. **Listeners are ongoing work.** Their lifecycle affects correctness and cost.
9. **A transaction cannot span unrelated services.** Use orchestration and idempotency for cross-service workflows.
10. **Indexes are part of the schema.** Version and deploy them with code.
11. **Emulators make security tests repeatable.** Staging still validates real project configuration.
12. **App Check is not a permission system.** Use it alongside authentication and rules.
13. **Managed infrastructure still needs recovery planning.** Understand and test backups.
14. **Every rule needs a negative test.** Prove that an unauthorized user is denied.
15. **Cost is an architectural property.** Query shape, listeners, retries, and data duplication all matter.

## 14. Quick Reference

| Task | Starting point | Important check |
|---|---|---|
| Register a web app | Firebase console and SDK | Correct environment project |
| Initialize Firestore | `getFirestore(app)` | Public config only in client |
| Observe sign-in state | Auth state listener | Unsubscribe when no longer needed |
| Protect user documents | Firestore Security Rules | Compare UID and validate fields |
| Protect organization data | Trusted membership model | Test cross-tenant denial |
| Add a compound query | Composite index configuration | Deploy index with release |
| Upload private files | Storage rules and private path | Test upload/download/delete independently |
| Run local tests | Emulator Suite | Seed deterministic fixtures |
| Verify server identity | Admin SDK token verification | Authorization is a separate step |
| Run privileged jobs | Trusted server credentials | Least privilege and audit trail |
| Remove a user | Explicit cleanup workflow | Subcollections and Storage objects |
| Reduce read volume | Limits, pagination, listener cleanup | Test real user journeys |
| Handle duplicate events | Idempotency records | Safe retry behavior |
| Deploy rules | Source-controlled config | Confirm target project |
| Recover data | Supported export/backup process | Test restore and validate data |
| Control abuse | App Check, rules, server rate limits | App Check does not replace authorization |

## 15. Build Challenge: Secure a Multi-User Project Workspace

Build a web application where users sign in, create projects, manage tasks, and upload private documents. Complete the challenge only when authorization is enforced at the service boundary and tested with multiple identities.

### Requirements

1. Create isolated development and production Firebase projects.
2. Register the web application and configure environment variables.
3. Initialize Firebase Authentication and Cloud Firestore.
4. Implement sign-in, sign-out, and authentication state handling.
5. Model projects with an owner and timestamps.
6. Model tasks as a subcollection or separate collection based on the required queries.
7. Define queries for a user's projects and each project's tasks.
8. Create restrictive Firestore Security Rules.
9. Ensure users cannot read or mutate another user's project.
10. Ensure ownership cannot be forged on create or changed on update.
11. Validate field types and permitted changes.
12. Create composite indexes required by actual queries.
13. Configure a private Storage path for project documents.
14. Write Storage rules that validate ownership and file constraints.
15. Configure emulators and deterministic test fixtures.
16. Test anonymous, owner, non-owner, and cross-tenant access.
17. Include negative tests for invalid fields and forged IDs.
18. Implement cleanup for projects, tasks, and uploaded objects.
19. Add pagination and unsubscribe real-time listeners correctly.
20. Use a trusted server function for one operation that genuinely needs elevated access.
21. Verify ID tokens and authorize the requested resource in that server function.
22. Make background processing idempotent.
23. Deploy rules, indexes, and functions through a repeatable workflow.
24. Add monitoring and a documented recovery plan.
25. Verify no service-account private key is present in the client bundle or repository.

### Suggested implementation sequence

1. Write the data model and query list.
2. Define the authorization matrix.
3. Create the Firebase project and register the app.
4. Initialize Authentication and Firestore.
5. Write restrictive rules before building the complete UI.
6. Configure the emulator and seed user A, user B, and sample projects.
7. Implement project CRUD and task queries.
8. Add indexes based on the actual query shapes.
9. Add Storage and private-object rules.
10. Test positive and negative access cases.
11. Implement cleanup and idempotent server-side work.
12. Run tests in CI and deploy to staging.
13. Verify authentication providers, rules, indexes, and function configuration.
14. Review usage, logging, and recovery assumptions before production.

### Test matrix

| Scenario | Expected result | Evidence |
|---|---|---|
| User A creates own project | Allowed | Document has trusted owner identity |
| User A creates project owned by B | Denied | Rule rejects forged owner |
| User A reads own project | Allowed | Query returns expected project |
| User B reads A's project | Denied | Direct read and query fail as appropriate |
| User A changes owner to B | Denied | Update validation rejects ownership change |
| Anonymous user reads private project | Denied | Rule test fails closed |
| User A queries across all owners | Rejected if query cannot prove permitted scope | Emulator test verifies behavior |
| User A uploads permitted file | Allowed | Object stored under authorized path |
| User B downloads A's private file | Denied | Storage rules block access |
| Oversized or disallowed upload | Denied | Rule or trusted validation rejects it |
| Parent project deleted | Related data cleaned by workflow | Child documents and objects checked |
| Listener component unmounts | Listener unsubscribed | No continued subscription work |
| Duplicate background event arrives | No duplicate side effect | Idempotency test passes |
| Admin endpoint receives invalid token | Denied | Token verification fails |
| Valid user requests another user's resource through Admin SDK | Denied | Server authorization blocks it |
| Clean emulator reset | Reproducible environment | Fixtures and rules load consistently |
| Production rules deployment | Correct target | CI/deployment log and smoke tests |
| Client bundle inspected | No server private key | Build artifact scan |
| Recovery procedure tested | Data and config can be restored | Documented restore evidence |

### Definition of done

- Authentication works for the supported providers.
- Firestore and Storage rules explicitly enforce the intended access model.
- Cross-user and cross-tenant attempts are denied.
- Client-visible configuration contains no privileged server credentials.
- Queries are supported by deployed indexes and use bounded result sets.
- Listeners are cleaned up correctly.
- Related documents and objects have a deliberate deletion lifecycle.
- Server functions verify identity and authorize each privileged action.
- Event handlers are safe under retries and duplicate delivery.
- Security Rules tests run repeatably in the emulator.
- Staging smoke tests validate actual project configuration.
- Monitoring, cost controls, and recovery procedures are documented.

## 16. Production Readiness Review

Before approving a Firebase implementation, ask:

- Are development, staging, and production projects clearly separated?
- Are only required services enabled?
- Is client configuration treated as public?
- Are Admin SDK credentials kept out of browser and mobile bundles?
- Does every sensitive Firestore path have explicit rules?
- Do rules validate both identity and mutable fields?
- Have anonymous, owner, non-owner, and tenant-boundary cases been tested?
- Are queries compatible with the rules rather than relying on rules to filter results?
- Are Storage permissions tested independently?
- Are required indexes stored and deployed with code?
- Are listeners and background jobs managed to avoid duplicate work and excess cost?
- Are subcollections and uploaded objects handled during deletion?
- Are server functions authorized and idempotent?
- Are emulator tests and staging checks part of the release process?
- Are logs free of tokens, service-account secrets, and sensitive document contents?
- Are billing trends and quotas monitored?
- Has the restore procedure been tested?

A good Firebase setup is one another developer can reproduce, a security reviewer can explain, and an operator can maintain. Start with the data access model, enforce it at the service boundary, test denials as carefully as successful requests, and treat indexes, rules, credentials, and deployment configuration as versioned application code.



## 17. Advanced Engineering Patterns

### 17.1 Read models and materialized summaries

When a UI needs a summary assembled from many documents, repeatedly fetching every source document can be slow and expensive. A derived read model can store a summary such as task counts, last activity time, or project status. Update it through a trusted and observable workflow.

A derived summary is not automatically correct merely because a function updates it. Define how retries are handled, whether updates are atomic, how stale data is repaired, and which source records are canonical. For exact financial or access-control decisions, avoid relying on a loosely maintained summary unless the consistency model is carefully designed.

### 17.2 Outbox-style workflows

Suppose a project creation must also trigger an email or third-party integration. Firestore cannot atomically commit a document and an external email delivery. One approach is to write the project and an outbox record in the same Firestore transaction, then process the outbox record asynchronously.

The processor should mark progress and be safe to retry. If the external provider supports idempotency keys, use them. If it does not, design the workflow to detect duplicates where possible and make duplicate notifications harmless. Monitor records that remain pending too long.

### 17.3 Handling offline writes

Firestore clients may support offline persistence and queued writes, depending on platform and configuration. This improves user experience in unreliable networks but introduces synchronization questions. A client may show a local pending write before the server accepts it, and a later rules rejection must be handled gracefully.

Design UI states for pending, confirmed, rejected, and conflicting changes. Do not treat locally cached data as proof that the server accepted an operation. For critical workflows, clearly communicate when a change has been committed remotely.

### 17.4 Conflict and concurrency design

Transactions can protect related document updates within Firestore's supported transaction model, but application design still needs to account for retries and contention. Keep transaction callbacks deterministic and free of external side effects because callbacks may run more than once.

For collaborative editing, decide whether last-write-wins is acceptable or whether the application needs version checks, merge logic, or an event history. A timestamp alone does not resolve every concurrent update safely. Test two clients updating the same logical resource.

### 17.5 Data export and portability

Firestore's document model and security features are specific to its service. If portability matters, document the schema, export procedures, transformations, and dependencies on Cloud Functions or proprietary APIs. Avoid making every business rule implicit in client code that cannot be reconstructed from the database.

Periodically validate that the team can export and interpret its data. For analytics, consider a deliberate pipeline into an analytical store rather than running reporting workloads through user-facing queries. Protect exports as sensitive data and restrict who can access them.

### 17.6 Choosing between Firestore and Realtime Database

Firestore and Realtime Database solve overlapping but different problems. Compare query needs, data structure, offline behavior, synchronization requirements, pricing characteristics, and existing platform integration. Do not assume they are interchangeable or that using both is automatically beneficial.

If the application requires flexible document queries and collection structures, Firestore may fit well. If it requires a simpler JSON tree with specific real-time synchronization patterns, Realtime Database may be worth evaluating. Base the choice on measured requirements and a proof of concept, not only on familiarity.

### 17.7 When a relational database is a better fit

Choose a relational database when the application relies on joins, referential integrity, multi-row constraints, complex transactions, or SQL-based reporting. Firebase can still provide Authentication or Storage while PostgreSQL handles relational data. A hybrid architecture should have a clear source of truth and avoid duplicating authorization decisions inconsistently across systems.

Do not force a document database to mimic a relational schema if the resulting duplication and transaction logic become harder to maintain than a relational alternative. Revisit the choice when requirements change.

### 17.8 Incident response for rules mistakes

If a rule accidentally exposes data, first restrict the affected access path and preserve relevant logs. Identify which paths and identities were affected, assess whether data may have been read or modified, and fix the rule with tests. Review whether any sensitive credentials were exposed and rotate them if necessary.

Then investigate why the change escaped review: missing negative tests, open development rules, unreviewed console changes, or deployment to the wrong project. Add a regression test and update the release process. A policy correction prevents future access; it cannot retroactively undo prior access.

## 18. Final Principle

Firebase is most effective when the team uses its managed services deliberately. Model data for real query patterns, keep privileged credentials on trusted servers, enforce access in Security Rules and IAM, test with the Emulator Suite, version indexes and rules, and plan for cost and recovery. The quality of the setup is measured not by how quickly the demo works, but by how predictably it behaves under real users, adversarial requests, retries, deployment changes, and operational incidents.
