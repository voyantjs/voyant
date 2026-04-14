const { writeFileSync } = require("node:fs")
const { EOL } = require("node:os")

const { read } = require("@changesets/config")
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
  const publishablePackages = getPublishablePackages(packages, config)
  const sharedTrainVersion = getSharedTrainVersion(publishablePackages)

  const canonicalPackage =
    publishablePackages.find((pkg) => pkg.packageJson.name === "@voyantjs/cli") ??
    publishablePackages[0]

  if (!canonicalPackage) {
    throw new Error("No publishable packages found for pending publication detection.")
  }

  const latestPublishedVersion = await fetchLatestVersion(canonicalPackage.packageJson.name)
  const pendingPublication =
    latestPublishedVersion === null || semver.lt(latestPublishedVersion, sharedTrainVersion)

  console.log(
    JSON.stringify(
      {
        canonicalPackage: canonicalPackage.packageJson.name,
        latestPublishedVersion,
        pendingPublication,
        sharedTrainVersion,
      },
      null,
      2,
    ),
  )

  appendGithubOutput("canonical_package", canonicalPackage.packageJson.name)
  appendGithubOutput("latest_published_version", latestPublishedVersion ?? "")
  appendGithubOutput("pending", pendingPublication ? "true" : "false")
  appendGithubOutput("shared_train_version", sharedTrainVersion)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
