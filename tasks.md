# React Rebuild Task Plan

This backlog tracks the React (Vite) migration in phases aligned with the Construction ERP specification.

## Phase 0 – Discovery & Alignment
- [x] Confirm DDD folder structure and conventions (`docs/architecture/ddd-structure.md`)
- [x] Import Angular spec highlights into tech planning (`docs/specs/key-requirements.md`)
- [x] Inventory Firebase collections, Cloud Functions, security rules (`docs/data/firebase-inventory.md`)
- [x] Document external integrations (accounting, suppliers, etc.) (`docs/integrations/integration-map.md`)

## Phase 1 – Foundations
- [x] Configure Vite project tooling (ESLint, Prettier, Vitest, Testing Library)
- [x] Establish path aliases and absolute imports
- [x] Set up environment management (.env, Firebase config loader)
- [x] Scaffold React Router, layout shell, global providers (auth, access control, theming)
- [x] Create base design system primitives (buttons, inputs, layout grid)

## Phase 2 – Domain Layer Port
- [x] Port core models/value objects (users, roles, access-control, projects, inventory, procurement, finance, quality)
- [x] Implement shared enums/constants (currencies, countries, units, statuses)
- [x] Translate Angular validation helpers to domain utilities
- [x] Define repository interfaces and domain services (audit, notifications, analytics, IoT)

## Phase 3 – Application Layer Use Cases
- [x] Recreate AuthService, AccessControlService, RoleService as application services/hooks
- [x] Implement audit logging use cases (action logging, reporting, compliance)
- [x] Port financial flows (job costing, budgets, invoices, retention)
- [x] Port procurement flows (vendors, POs, requisitions, matching)
- [x] Implement project scheduling/resource allocation logic (EVM, conflicts)
- [x] Create quality/safety/compliance workflows
- [x] Build analytics orchestration (dashboards, KPI calculations, predictive stubs)

## Phase 4 – Infrastructure Layer
- [x] Create Firebase adapters (auth, Firestore, Storage, FCM)
- [x] Implement HTTP client with interceptors, retry, error handling
- [x] Build notification channels (email, push, in-app)
- [x] Integrate IoT data ingestion stubs and mock streams
- [x] Configure analytics pipeline adapters (data retrieval, caching)
- [x] Wire external integrations (accounting API mocks, weather, mapping)

## Phase 5 – Presentation Layer
- [x] Rebuild authentication flows (login, register, MFA, onboarding)
- [x] Implement access-guarded routing and layout scaffolding
- [x] Port equipment module UI (tracking, maintenance, analytics)
- [x] Port inventory module UI (list, transfers, optimization)
- [x] Port procurement module UI (vendors, requisitions, POs, portal)
- [x] Port project module UI (wizard, resources, dashboards, EVM)
- [x] Port financial module UI (costing, budgets, billing)
- [x] Build quality/safety/compliance UI
- [x] Implement analytics dashboards and reports
- [x] Build document management and collaboration UI

## Phase 6 – Cross-Cutting & Mobile Support
- [x] Implement offline caching and synchronization strategy
- [x] Add notification center, toasts, modals
- [x] Integrate theming (light/dark, compact mode)
- [x] Create reusable data visualization components
- [x] Prepare mobile-friendly layouts and interactions

## Phase 7 – Testing & DevOps
- [ ] Establish unit test baselines for domain/application services
- [ ] Add component/integration tests with Testing Library
- [ ] Configure E2E tests (Playwright/Cypress) for critical flows
- [ ] Set up CI pipeline (lint, test, build)
- [ ] Add deployment scripts for Firebase Hosting / alternative target
- [ ] Configure monitoring hooks and error tracking

## Phase 8 – Compliance & Documentation
- [ ] Implement audit reporting, inspector portal, compliance exports
- [ ] Document security/privacy controls (MFA, RBAC, encryption)
- [ ] Update Firestore rules & indexes for React usage
- [ ] Create developer documentation (architecture, contributing)
- [ ] Build user-facing guides, training materials, onboarding flows

## Phase 9 – Launch Readiness
- [ ] Data migration scripts, compatibility validation
- [ ] Performance/load testing scenarios
- [ ] Staged rollout plan, feature toggles, fallback paths
- [ ] Stakeholder review & sign-off checklist
- [ ] Post-launch monitoring and feedback loop
