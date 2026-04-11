const getReleasePlan = require("@changesets/get-release-plan").default
const applyReleasePlan = require("@changesets/apply-release-plan").default
const { read } = require("@changesets/config")
const { getPackages } = require("@manypkg/get-packages")
const semver = require("semver")
const { getPublishablePackages, getSharedTrainVersion } = require("./release-train-utils.cjs")

function getHighestReleaseType(releases) {
  if (releases.some((release) => release.type === "major")) {
    return "major"
  }

  if (releases.some((release) => release.type === "minor")) {
    return "minor"
  }

  return "patch"
}

function getTrainVersion(currentVersion, highestReleaseType) {
  const currentMajor = semver.major(currentVersion)

  if (currentMajor === 0) {
    return semver.inc(currentVersion, highestReleaseType === "patch" ? "patch" : "minor")
  }

  return semver.inc(currentVersion, highestReleaseType)
}

async function main() {
  const cwd = process.cwd()
  const packages = await getPackages(cwd)
  const config = await read(cwd, packages)
  const noFixedConfig = { ...config, fixed: [] }
  const releasePlan = await getReleasePlan(cwd, undefined, noFixedConfig)
  const directReleases = releasePlan.releases.filter((release) => release.type !== "none")

  if (directReleases.length === 0) {
    console.log("No releasable changesets found.")
    return
  }

  const publishablePackages = getPublishablePackages(packages, noFixedConfig)
  const currentVersion = getSharedTrainVersion(publishablePackages)
  const highestReleaseType = getHighestReleaseType(directReleases)
  const trainVersion = getTrainVersion(currentVersion, highestReleaseType)

  if (!trainVersion) {
    throw new Error(
      `Could not determine next train version from ${currentVersion} (${highestReleaseType})`,
    )
  }

  const normalizedReleases = publishablePackages.map((pkg) => {
    const existingRelease = releasePlan.releases.find(
      (release) => release.name === pkg.packageJson.name,
    )

    if (existingRelease) {
      return {
        ...existingRelease,
        type:
          semver.major(currentVersion) === 0 && existingRelease.type === "major"
            ? "minor"
            : existingRelease.type,
        newVersion: trainVersion,
      }
    }

    return {
      name: pkg.packageJson.name,
      type: "patch",
      oldVersion: pkg.packageJson.version,
      newVersion: trainVersion,
      changesets: [],
    }
  })

  await applyReleasePlan(
    {
      ...releasePlan,
      releases: normalizedReleases,
    },
    packages,
    noFixedConfig,
  )

  console.log(`Applied ${trainVersion} release train to ${publishablePackages.length} packages.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
