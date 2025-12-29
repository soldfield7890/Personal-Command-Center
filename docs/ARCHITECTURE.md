# Personal Command Center — V1 Architecture

## Non-Negotiables
- Google Drive = raw system of record (immutable)
- Database = curated truth (migrations from day one)
- App UI = decision surfaces (Next.js App Router, TypeScript)
- AI layer reads only (not in V1)

## Layers
1) Drive (raw)
2) DB (curated + provenance)
3) UI (selectors → components)
4) AI (later)

## Patterns
- Server Components by default
- Deterministic selectors only
- Engines are pure functions (no IO)
- Missing data is explicit: UNKNOWN (conservative scoring)

## V1 Definition of Done
- npm run dev runs clean
- Home dashboard tile grid renders
- Finance renders from seeded data + V3_LOCKED outputs
- System Health shows provenance + freshness
