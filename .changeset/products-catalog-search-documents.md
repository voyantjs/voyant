---
"@voyantjs/products": patch
---

Add a reusable internal catalog hydration and search-document helper to the
products package.

Changes:

- add `catalogProductsService.hydrateProducts()` for shared localized product
  hydration outside the public route module
- add `catalogProductsService.listSearchDocuments()` and
  `getSearchDocumentByProductId()` for locale-aware indexing/search jobs
- export catalog search-document schemas and localized catalog product schemas
- switch `publicProductsService` to use the shared catalog hydrator so
  translation/category/tag/media joins stay aligned between public routes and
  internal indexing workflows
