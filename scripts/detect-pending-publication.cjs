const { writeFileSync } = require("node:fs")
const { EOL } = require("node:os")

const { read } = require("@changesets/config")
const getReleasePlan = require("@changesets/get-release-plan").default
const { getPackages } = require("@manypkg/get-packages")
const semver = require("semver")

const { getPublishablePackages, getSharedTrainVersion } = require("./release-train-utils.cjs")

async function fetchLatestVersion(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch npm metadata for ${packageName}: ${response.status}`)
  }

  const payload = await response.json()
  return payload?.["dist-tags"]?.latest ?? null
}

async function getPublishedVersions(packageNames) {
  const publishedVersions = new Map()

  await Promise.all(
    packageNames.map(async (packageName) => {
      publishedVersions.set(packageName, await fetchLatestVersion(packageName))
    }),
  )

  return publishedVersions
}

function getPendingPackages(publishablePackages, sharedTrainVersion, publishedVersions) {
  return publishablePackages
    .map((pkg) => ({
      name: pkg.packageJson.name,
      latestPublishedVersion: publishedVersions.get(pkg.packageJson.name) ?? null,
    }))
    .filter(
      ({ latestPublishedVersion }) =>
        latestPublishedVersion === null || semver.lt(latestPublishedVersion, sharedTrainVersion),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

function appendGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) {
    return
  }

  writeFileSync(outputPath, `${key}=${value}${EOL}`, { flag: "a" })
}

async function main() {
  const cwd = process.cwd()
  const packages = await getPackages(cwd)
  const config = await read(cwd, packages)
  const noFixedConfig = { ...config, fixed: [] }
  const releasePlan = await getReleasePlan(cwd, undefined, noFixedConfig)
  const directReleases = releasePlan.releases.filter((release) => release.type !== "none")
  const hasReleasableChangesets = directReleases.length > 0
  const publishablePackages = getPublishablePackages(packages, noFixedConfig)
  const sharedTrainVersion = getSharedTrainVersion(publishablePackages)

  if (publishablePackages.length === 0) {
    throw new Error("No publishable packages found for pending publication detection.")
  }

  const publishedVersions = await getPublishedVersions(
    publishablePackages.map((pkg) => pkg.packageJson.name),
  )
  const pendingPackages = getPendingPackages(
    publishablePackages,
    sharedTrainVersion,
    publishedVersions,
  )
  const pendingPublication = pendingPackages.length > 0

  console.log(
    JSON.stringify(
      {
        hasReleasableChangesets,
        pendingPackages,
        pendingPublication,
        sharedTrainVersion,
      },
      null,
      2,
    ),
  )

  appendGithubOutput("has_releasable_changesets", hasReleasableChangesets ? "true" : "false")
  appendGithubOutput("pending", pendingPublication ? "true" : "false")
  appendGithubOutput("shared_train_version", sharedTrainVersion)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
