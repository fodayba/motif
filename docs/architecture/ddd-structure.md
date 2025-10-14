# Domain-Driven Structure Overview

The React application follows a layered DDD layout under `src`:

- `app/` — Application bootstrap: providers, routing, layout shells, hydration.
- `domain/` — Pure domain logic: aggregates, entities, value objects, domain services, specifications, enums.
- `application/` — Use cases and orchestrators coordinating domain logic with infrastructure.
- `infrastructure/` — Adapters for persistence, HTTP, Firebase, integrations, caching, notifications.
- `presentation/` — React-facing components: pages, routes, widgets aligned with domain boundaries.
- `shared/` — Cross-cutting utilities, hooks, types, theming primitives.

## Module Conventions

Each bounded context (e.g. `access-control`, `projects`, `inventory`, `procurement`, `financial`, `quality`) mirrors the same folder hierarchy across layers where needed:

```
src/
  domain/
    projects/
      entities/
      value-objects/
      services/
      events/
  application/
    projects/
      use-cases/
      dto/
      mappers/
  infrastructure/
    projects/
      repositories/
      api/
  presentation/
    pages/
    components/
    routes/
```

## Naming Guidelines
- Prefer PascalCase for types/classes and camelCase for variables/functions.
- Keep feature-specific exports behind barrel files (`index.ts`) per module.
- Co-locate unit tests alongside implementation files where practical (e.g. `*.spec.ts` or `*.test.ts`).

## Cross-Cutting Practices
- DTOs live in the application layer and are mapped explicitly to domain objects.
- Infrastructure should depend on abstractions from the domain/application layers, not the other way around.
- Presentation interacts with application services via hooks/contexts—never directly with infrastructure.
- Shared utilities remain framework-agnostic; prefer pure functions/hooks without Firebase coupling.

This document will expand as modules are ported to the new structure.
