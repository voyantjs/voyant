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
- one-time manual bootstrap GitHub release for the initial `0.1.0` release
- npm Trusted Publishing via GitHub Actions OIDC
- versioned starter tarballs attached to each GitHub Release for CLI scaffolding

## Required GitHub Secrets

No npm publish token is required when Trusted Publishing is configured.

## Notes

- Database migrations are intentionally not automated in GitHub Actions for this repository.
- Schema and migration work should be generated, reviewed, and applied explicitly by maintainers.
