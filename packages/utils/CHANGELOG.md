# @voyantjs/utils

## 0.6.2

### Patch Changes

- @voyantjs/types@0.6.2

## 0.6.1

### Patch Changes

- @voyantjs/types@0.6.1

## 0.6.0

### Patch Changes

- @voyantjs/types@0.6.0

## 0.5.0

### Patch Changes

- @voyantjs/types@0.5.0

## 0.4.5

### Patch Changes

- @voyantjs/types@0.4.5

## 0.4.4

### Patch Changes

- @voyantjs/types@0.4.4

## 0.4.3

### Patch Changes

- @voyantjs/types@0.4.3

## 0.4.2

### Patch Changes

- @voyantjs/types@0.4.2

## 0.4.1

### Patch Changes

- @voyantjs/types@0.4.1

## 0.4.0

### Patch Changes

- e84fe0f: Add built-in PDF document adapters for legal and finance workflows.

  `@voyantjs/utils` now exports `renderPdfDocument()` as a shared basic PDF
  renderer for rendered text content. `@voyantjs/legal` and `@voyantjs/finance`
  now expose bundled PDF serializers and generator helpers on top of their
  storage-backed document workflows, so apps can generate readable PDF artifacts
  without wiring a custom browser renderer for the common case.

- e84fe0f: Upgrade legal and finance template rendering to support Liquid-style control
  flow.

  - add a shared structured template renderer in `@voyantjs/utils`
  - keep simple `{{path}}` interpolation compatibility for existing templates
  - support Liquid loops, conditionals, and filters in legal and finance
    html/markdown templates
  - support Liquid rendering inside lexical text nodes for legal and finance
    template bodies
  - @voyantjs/types@0.4.0

## 0.3.1

### Patch Changes

- @voyantjs/types@0.3.1

## 0.3.0

### Patch Changes

- @voyantjs/types@0.3.0

## 0.2.0

### Patch Changes

- @voyantjs/types@0.2.0

## 0.1.1

### Patch Changes

- @voyantjs/types@0.1.1

## 1.1.11

### Patch Changes

- @voyantjs/types@1.1.11

## 1.1.1

### Patch Changes

- @voyantjs/types@1.1.1

## 1.1.0

### Minor Changes

- [#292](https://github.com/voyantjs/voyant/pull/292)
  [`d799492`](https://github.com/voyantjs/voyant/commit/d799492fabc7789315d614af4bb2f3a58804ce10)
  Thanks [@mihaipxm](https://github.com/mihaipxm)! - Initial SDK release

### Patch Changes

- Updated dependencies
  [[`d799492`](https://github.com/voyantjs/voyant/commit/d799492fabc7789315d614af4bb2f3a58804ce10)]:
  - @voyantjs/types@1.1.0
