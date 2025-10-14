# Construction ERP React Rebuild — Specification Overview

This document consolidates the system requirements, architectural intent, and implementation scope captured in `.kiro/specs/construction-erp-system` to guide the React (Vite) rebuild.

## 1. Product Vision
- Deliver an end-to-end Construction ERP for Centurion (SL) Ltd covering equipment, inventory, project, procurement, financial, quality, logistics, analytics, document management, and compliance.
- Target outcomes: eliminate 15–20% equipment utilization loss, reduce administrative overhead 25–30%, prevent 10–15% material waste, keep delays under 5%, achieve 99% inventory accuracy, 95% on-time delivery, <3% budget variance, support 50k+ concurrent users with 99.9% uptime.
- Serve 10 primary personas and 4 secondary user types across 11 core operational modules.

## 2. Functional Domains & Key Capabilities

### 2.1 Asset & Equipment Management (Req 1, 13, 14)
- Real-time GPS tracking with 30s updates, geofencing, unauthorized movement alerts.
- Predictive maintenance using IoT data, maintenance scheduling (hours/mileage/calendar/condition-based), maintenance history, ROI tracking, depreciation, disposal optimization.
- Equipment identification with QR/RFID, check-in/out workflows with digital signatures, operator verification, incident logging.

### 2.2 Inventory & Materials Management (Req 2, 15, 16)
- Multi-location inventory with inter-site transfers, cross-docking, automated reordering, Bill of Materials integration.
- ABC analysis, slow-moving detection, seasonal forecasting, reorder point optimization, safety stock validation.
- Batch/lot tracking, expiration alerts, quality certifications, quarantine workflow, supplier quality monitoring, recall handling.

### 2.3 Logistics & Transportation (Req 3, 17)
- Route optimization with traffic, fleet tracking, delivery coordination, proof of delivery, compliance with driver regulations.
- Load planning, fuel monitoring, maintenance integration, exception management, multi-stop & international logistics support.

### 2.4 Project Management & Resource Planning (Req 4, 19, 20, 21)
- Hierarchical WBS, resource-constrained scheduling, critical path calculations, earned value metrics (SPI, CPI, TCPI), forecasting.
- Resource allocation with skills matching, conflict resolution, utilization tracking, what-if scenarios, risk registers.
- Subcontractor qualification, work packages, performance monitoring, compliance and dispute tracking.

### 2.5 Procurement & Vendor Management (Req 5, 18)
- Vendor lifecycle: qualification, RFP evaluation, contracts, performance scorecards, collaboration portals.
- Purchase requisitions with multi-level approvals, POs, receiving, three-way matching (PO/receipt/invoice), invoice processing.
- Supplier portals with order visibility, messaging, document exchange, supplier risk/diversity tracking.

### 2.6 Financial Management & Cost Control (Req 6, 22, 23)
- Multi-dimensional job costing, hierarchical budgets, commitment tracking, variance analysis with alerts.
- Cash flow forecasting (scenario-based), progress billing, retention management, revenue recognition compliance, integration with ERP systems (SAP, Oracle, QuickBooks, Sage).

### 2.7 Quality, Safety & Compliance (Req 7, 24, 25, 32)
- Inspection workflows with mobile support, non-conformance resolution, safety incident reporting, OSHA compliance, training tracking.
- Environmental compliance (permits, emissions, waste), sustainability metrics, audit preparation, inspector access.

### 2.8 Analytics, BI, & AI (Req 8, 26, 27, 33, 38)
- Predictive analytics for demand, cost, equipment failures, risk assessment; executive dashboards with KPI monitoring.
- Custom report builder, scheduling, drill-down analysis, optimization recommendations, machine learning for resource allocation.

### 2.9 Mobile & IoT Integration (Req 10)
- Native mobile experiences with offline support (48h), barcode scanning, GPS capture, photo/video uploads, push notifications, voice transcription, AR guidance.
- IoT data ingestion for equipment/environmental monitoring, RFID, weighbridge, sensors.

### 2.10 Document & Collaboration (Req 11, 31, 35)
- Document repository with versioning, approvals, CAD integration, secure sharing, portals for clients/vendors/subcontractors.
- Workflow automation, change management with impact analysis, knowledge management, training and onboarding materials.

### 2.11 Integration & Platform (Req 12, 28, 29, 30, 36, 39, 40)
- API-first design with REST, GraphQL, webhooks, rate limiting, monitoring.
- Integrations: accounting, supplier catalogs/EDI, weather, mapping, banking, manufacturer APIs.
- Security: MFA, RBAC with project/location scopes, audit trails, encryption, key management, privacy compliance (GDPR, SOC 2, ISO 27001).
- Performance: 1s response for 95% operations, 50k concurrent users, auto-scaling, backups, DR (1h RTO).
- Monitoring/logging: proactive alerting, performance analytics, backup verification, disaster recovery testing.
- Sustainability tracking, innovation pipeline for emerging tech (digital twin, AR, drones, robotics, AI).

## 3. Architectural Intent
- Domain Driven Design layered architecture (Presentation, Application Services, Domain, Infrastructure) with microservice boundaries per core module.
- Event-driven interactions, API Gateway, Firebase back-end (Auth, Firestore, Storage, Functions) in current implementation with scalability targets.
- Integration adapters for external systems, IoT ingestion, analytics pipelines, notification services.
- Comprehensive error handling (circuit breaker, retry with exponential backoff, global error handler).
- Testing strategy: unit (70%), integration (20%), E2E (10%) with performance and security validations.

## 4. Implementation Status Snapshot (Angular baseline)
- Completed modules: Equipment (tracking, GPS simulation, maintenance), Inventory (multi-location, transfers, optimization), Projects (wizard, templates, resources, EVM), Financials (job costing, budgets, cash flow, billing), Procurement (vendors, requisitions, POs, matching).
- Pending major areas: Quality & safety, analytics & reporting, mobile/offline experiences, integrations, document collaboration, testing automation, DevOps, training assets.

## 5. Compliance & Non-Functional Targets
- Security: MFA, RBAC, audit logging, encryption (AES-256 at rest, TLS 1.3 in transit), privacy rights management.
- Performance: <1s response, <100ms queries, 99.9% uptime, auto-scaling, monitoring/alerting.
- Reliability: Backups, DR plans, incident response, logging, health checks, SLA tracking.
- Scalability: Multi-region deployment, container orchestration (future state), API rate limiting.
- Sustainability & Innovation: Carbon footprint, energy usage, renewable tracking, digital twin, AR, AI adoption metrics.

## 6. Deliverables for React/Vite Rebuild
1. **Domain Layer**: Port TS models, value objects, invariants, enums corresponding to requirements.
2. **Application Layer**: Recreate use cases/services (auth, access control, audit, analytics, notifications, IoT, logging, procurement, finance, etc.).
3. **Infrastructure Layer**: Firebase adapters, HTTP clients, integration connectors, storage helpers, audit trail persistence, FCM, analytics data pipelines.
4. **Presentation Layer**: React Router structure, guarded routes, feature pages per module, dashboards, notification center, IoT visualizations, executive analytics.
5. **Cross-Cutting**: Context providers, state hooks, theme management, offline support, auth/access guards, utilities (date, currency, validation, storage, data enums).
6. **Testing & DevOps**: Vitest/RTL coverage, E2E suite, CI/CD pipelines, monitoring, documentation, training materials.
7. **Compliance Features**: Audit logging, reporting, inspector portals, blockchain integrations (where feasible), data retention policies, sustainability reporting.

## 7. Reference Materials
- `.kiro/specs/construction-erp-system/requirements.md` — exhaustive requirement list (1–40).
- `.kiro/specs/construction-erp-system/design.md` — architecture & design blueprint.
- `.kiro/specs/construction-erp-system/tasks.md` — implementation progress across Angular modules.

Use this specification as the authoritative scope for the React/Vite migration effort.
