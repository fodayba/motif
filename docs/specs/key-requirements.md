# Key Requirements Snapshot

Summary of critical requirements from `.kiro/specs/construction-erp-system/requirements.md` to guide the React migration.

## Core Domains

### Equipment & Asset Management
- Real-time GPS tracking with 30s updates, geofencing alerts, unauthorized movement detection.
- Predictive maintenance driven by IoT data; maintenance scheduling based on hours/mileage/calendar/condition.
- Check-in/out workflows with digital signatures, operator qualification verification, incident handling.
- Lifecycle coverage: acquisition ROI, depreciation, disposal optimization, insurance/certification alerts.

### Inventory & Materials
- Multi-location control with inter-site transfers, cross-docking, automated reordering.
- ABC analysis, slow-moving detection, seasonal forecasting, safety stock checks.
- Batch/lot tracking, expiration alerts, quality certifications, recall handling.

### Logistics & Transportation
- Route optimization with traffic, multi-stop planning, load balancing, delivery proof capture.
- Driver qualification tracking, hours-of-service compliance, maintenance integration.

### Projects & Resources
- Hierarchical WBS, resource-constrained scheduling, critical path, earned value metrics (SPI, CPI, TCPI).
- Resource allocation with skills matching, conflict resolution, utilization metrics, what-if scenarios.
- Subcontractor qualification, performance monitoring, payment tracking.

### Procurement & Vendors
- Vendor lifecycle (qualification, scorecarding, portals), RFP evaluation, contract management.
- Purchase requisitions with multi-level approvals, PO workflow, receiving, three-way matching.
- Supplier collaboration: order tracking, secure messaging, document exchange.

### Financial Management
- Multi-dimensional job costing, hierarchical budgets, commitment tracking, variance alerts.
- Cash flow forecasting with scenarios, progress billing, retention management, revenue recognition compliance.
- Integration with external accounting systems.

### Quality, Safety, Compliance
- Inspection scheduling with mobile workflows, non-conformance resolution, safety incident management.
- Environmental compliance (permits, emissions, waste), sustainability metrics, audit readiness.
- Regulatory inspector portal with read-only access and audit trails.

### Analytics & Intelligence
- Predictive analytics (demand, cost, equipment failure, risk), executive dashboards, KPI alerts.
- Custom report builder with scheduling, drill-down, exports; optimization recommendations.

### Mobile & IoT
- Native-like mobile experience with 48-hour offline resilience, barcode scanning, GPS capture, media uploads.
- Push notifications, voice transcription, AR guidance, IoT integration (RFID, sensors, weighbridge).

### Document & Collaboration
- Document repository with versioning, approvals, CAD integration, secure sharing.
- Client/vendor/subcontractor portals, workflow automation, change management with impact analysis.

### Integration & Platform
- API-first (REST, GraphQL, webhooks) with rate limiting and monitoring.
- Security: MFA, RBAC with project/location scopes, audit trails, encryption, privacy compliance.
- Performance: 50k concurrent users, <1s response for 95% operations, 99.9% uptime, DR (1h RTO).
- Monitoring/logging, backups, incident response, multi-region deployment, sustainability tracking.
