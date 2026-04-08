# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI and npm releases.

## Workflows Overview

### `ci.yml`

Runs the main repository checks for pull requests and pushes to `main` and `develop`:

- build
- lint
- typecheck
- test

### `release.yml`

Handles package releases:

- normal Changesets release flow on pushes to `main`
- manual GitHub release + starter asset refresh for the current checked-in version
- npm Trusted Publishing via GitHub Actions OIDC
- versioned starter tarballs attached to each GitHub Release for CLI scaffolding

Notes:

- the push flow publishes packages, ensures a repo tag like `v0.1.1` exists, then creates the GitHub Release and uploads starter tarballs
- the manual dispatch path is for release asset recovery or refresh when npm packages already exist but the GitHub Release/tag/assets need to be created or repaired

## Required GitHub Secrets

No npm publish token is required when Trusted Publishing is configured.

## Notes

- Database migrations are intentionally not automated in GitHub Actions for this repository.
- Schema and migration work should be generated, reviewed, and applied explicitly by maintainers.
