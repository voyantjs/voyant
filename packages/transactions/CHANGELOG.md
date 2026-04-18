# @voyantjs/transactions

## 0.6.6

### Patch Changes

- @voyantjs/core@0.6.6
- @voyantjs/db@0.6.6
- @voyantjs/hono@0.6.6
- @voyantjs/utils@0.6.6

## 0.6.5

### Patch Changes

- @voyantjs/core@0.6.5
- @voyantjs/db@0.6.5
- @voyantjs/hono@0.6.5
- @voyantjs/utils@0.6.5

## 0.6.4

### Patch Changes

- @voyantjs/core@0.6.4
- @voyantjs/db@0.6.4
- @voyantjs/hono@0.6.4
- @voyantjs/utils@0.6.4

## 0.6.3

### Patch Changes

- Updated dependencies [d3c6937]
  - @voyantjs/core@0.6.3
  - @voyantjs/db@0.6.3
  - @voyantjs/hono@0.6.3
  - @voyantjs/utils@0.6.3

## 0.6.2

### Patch Changes

- @voyantjs/core@0.6.2
- @voyantjs/db@0.6.2
- @voyantjs/hono@0.6.2
- @voyantjs/utils@0.6.2

## 0.6.1

### Patch Changes

- c498a5b: Align transaction child-list indexes with dominant parent-scoped query shapes
  by replacing single-column parent indexes with composite parent-and-sort
  indexes for offer participants, offer items, order participants, order items,
  order item participants, and order terms.
  - @voyantjs/core@0.6.1
  - @voyantjs/db@0.6.1
  - @voyantjs/hono@0.6.1
  - @voyantjs/utils@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/core@0.6.0
- @voyantjs/db@0.6.0
- @voyantjs/hono@0.6.0
- @voyantjs/utils@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [ce72e29]
  - @voyantjs/core@0.5.0
  - @voyantjs/db@0.5.0
  - @voyantjs/hono@0.5.0
  - @voyantjs/utils@0.5.0

## 0.4.5

### Patch Changes

- e3f6e72: Standardize TypeID prefixes to a first-N-chars convention for better DX.

  Root entities now use the shortest unambiguous first-N chars of the entity name
  (e.g. `pers` instead of `prsn`, `org` instead of `orgn`). Child entities use a
  2-char module code plus 2-char suffix. 19 prefixes renamed in total.

- Updated dependencies [e3f6e72]
  - @voyantjs/core@0.4.5
  - @voyantjs/db@0.4.5
  - @voyantjs/hono@0.4.5
  - @voyantjs/utils@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/core@0.4.4
- @voyantjs/db@0.4.4
- @voyantjs/hono@0.4.4
- @voyantjs/utils@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/core@0.4.3
- @voyantjs/db@0.4.3
- @voyantjs/hono@0.4.3
- @voyantjs/utils@0.4.3

## 0.4.2

### Patch Changes

- @voyantjs/core@0.4.2
- @voyantjs/db@0.4.2
- @voyantjs/hono@0.4.2
- @voyantjs/utils@0.4.2

## 0.4.1

### Patch Changes

- 4c4ea3c: Avoid deep `@voyantjs/db/schema/iam/kms` imports in published bundles by using the stable
  `@voyantjs/db/schema/iam` entrypoint instead. This reduces downstream SSR bundler resolution issues
  under pnpm-based builds.
  - @voyantjs/core@0.4.1
  - @voyantjs/db@0.4.1
  - @voyantjs/hono@0.4.1
  - @voyantjs/utils@0.4.1

## 0.4.0

### Minor Changes

- e84fe0f: Add shared storefront promotional offer helpers backed by transactions offers.

  Published offers can now carry `storefrontPromotionalOffer` metadata and be
  resolved through reusable helpers for product/departure applicability and
  slug-based storefront lookup.

### Patch Changes

- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
- Updated dependencies [e84fe0f]
  - @voyantjs/core@0.4.0
  - @voyantjs/db@0.4.0
  - @voyantjs/hono@0.4.0
  - @voyantjs/utils@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [8566f2d]
- Updated dependencies [8566f2d]
  - @voyantjs/core@0.3.1
  - @voyantjs/db@0.3.1
  - @voyantjs/hono@0.3.1
  - @voyantjs/utils@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/core@0.3.0
- @voyantjs/db@0.3.0
- @voyantjs/hono@0.3.0
- @voyantjs/utils@0.3.0

## 0.2.0

### Patch Changes

- @voyantjs/core@0.2.0
- @voyantjs/db@0.2.0
- @voyantjs/hono@0.2.0
- @voyantjs/utils@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/core@0.1.1
- @voyantjs/db@0.1.1
- @voyantjs/hono@0.1.1
- @voyantjs/utils@0.1.1
