# External Integration Map

Reference summary from `.kiro/specs/construction-erp-system/requirements.md` to track third-party touchpoints during the React migration.

## Accounting & Finance
- **ERP Systems**: SAP, Oracle, QuickBooks, Sage (bidirectional sync for job costing, GL, invoicing, revenue recognition).
- **Banking APIs**: Payment processing, reconciliation, cash management.
- **Payment Gateways**: Support for progress billing, retention release, electronic payments.

## Procurement & Supply Chain
- **Supplier Catalogs & EDI**: Automated ordering, pricing/availability sync, electronic PO/invoice exchanges.
- **Supplier Portals**: Secure access for vendors to view orders, submit documents, update status.
- **Logistics/3PL Systems**: Coordination for transportation, cross-docking, delivery tracking.

## Project & Field Operations
- **Scheduling Tools**: Microsoft Project, Primavera P6 (two-way synchronization for schedules and resources).
- **Document/CAD Systems**: CAD markup tools, 3D model connectivity for drawings and revisions.
- **Subcontractor Portals**: Collaboration, document sharing, payment status.

## Equipment & IoT
- **IoT Platforms**: Equipment sensors (GPS, fuel, vibration, temperature), environmental monitors, weather stations.
- **Equipment Manufacturer APIs**: Service data, diagnostic info, parts availability.
- **RFID/Barcode Devices**: Asset tagging, inventory scanning, weighbridge interfaces.

## Analytics & Intelligence
- **Weather Services**: Planning and safety alerts.
- **Mapping & Geolocation**: Routing, geocoding, location services.
- **AI/ML Platforms**: Predictive analytics, optimization engines (internal or external services as needed).

## Communications & Notifications
- **Email/SMS Providers**: User notifications, alerts, marketing communications.
- **Push Notification Services**: Mobile/Web push (Firebase Cloud Messaging baseline).
- **Messaging/Collaboration**: Potential integration with enterprise chat or ticketing (future consideration).

## Compliance & Security
- **Identity Providers/SSO**: Support for enterprise SSO/MFA.
- **Regulatory Reporting Portals**: Export formats for compliance submissions (OSHA, environmental agencies).

## Sustainability & Innovation
- **Sustainability Platforms**: Carbon footprint tracking, environmental impact reporting.
- **Emerging Tech**: AR devices, drone data ingestion, robotics control (future integration points).

Use this map to drive adapter design in the infrastructure layer and to prioritize mock implementations for early development.
