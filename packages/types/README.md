# @headlight/types

Single source of truth for enums, entities, metrics, actions, and view descriptors.
Source-only package — consumers import TypeScript directly.

## Import

```typescript
import type { Mode, Industry, SourceTier } from "@headlight/types";
import type { MetricDescriptor } from "@headlight/types/metrics";
import type { Project, Page, Task } from "@headlight/types/entities";
```

## Rules

- No runtime logic here — only `type`, `interface`, branded primitives, and frozen `const` catalogs.
- Every enum is a string union plus a frozen list (`MODES`, `INDUSTRIES`, …) for iteration.
- Every entity has a branded `Id` primitive; never use raw `string` for IDs.
- Additive only after Wave 2 freezes. Breaking changes require a migration note.
