# Firebase Inventory (Angular Baseline)

## Firestore Collections (inferred from services/models)
- `users`
- `companies`
- `roles`
- `permissions`
- `projects`
- `projectTemplates`
- `projectMilestones`
- `projectTasks`
- `projectResources`
- `projectRisks`
- `equipment`
- `equipmentMaintenance`
- `equipmentUsage`
- `equipmentLocationHistory`
- `inventoryItems`
- `inventoryTransactions`
- `inventoryTransfers`
- `inventoryOptimization`
- `vendors`
- `vendorEvaluations`
- `vendorQualifications`
- `procurementRequisitions`
- `purchaseOrders`
- `goodsReceipts`
- `threeWayMatching`
- `financialBudgets`
- `financialCostRecords`
- `financialCashFlows`
- `financialInvoices`
- `financialRetentions`
- `qualityInspections`
- `safetyIncidents`
- `auditLogs`
- `notifications`
- `documents`
- `documentVersions`
- `messages`
- `analyticsDashboards`
- `reports`
- `iotDevices`
- `sensorData`

*(Note: actual collection names to verify; list derived from Angular services and requirements.)*

## Firebase Functions & Scripts
- `functions/lib/**` and `functions/src/**` include domain folders mirroring services (finance, inventory, procurement, projects, safety, users). Specific callable functions still to be catalogued.
- `scripts/generate-env.js` for environment setup.
- `update-financial-components.sh` for Angular sync.

## Security Rules
- `firestore.rules` and `storage.rules` defined for Angular app (need review for React access patterns).
- `firestore.indexes.json` contains composite indexes (audit logs, etc.).

## Hosting & Configuration
- `firebase.json` for hosting/deploy targets.
- `apphosting.yaml` for hosting configuration.
- `.firebaserc` for project aliases.

## Next Steps
1. Export current rules/indexes for documentation.
2. Confirm collection structure via Firestore console or exports.
3. Plan React adapters respecting existing schema.
