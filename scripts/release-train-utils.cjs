function getPublishablePackages(packages, config) {
  return packages.packages.filter((pkg) => {
    const { name, private: isPrivate } = pkg.packageJson

    return (
      typeof name === "string" &&
      name.startsWith("@voyantjs/") &&
      !isPrivate &&
      !config.ignore.includes(name)
    )
  })
}

function getVersionsByPackage(packages) {
  const versions = new Map()

  for (const pkg of packages) {
    const version = pkg.packageJson.version

    if (!versions.has(version)) {
      versions.set(version, [])
    }

    versions.get(version).push(pkg.packageJson.name)
  }

  return versions
}

function formatVersionMismatch(versionsByPackage) {
  return Array.from(versionsByPackage.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([version, packageNames]) =>
        `${version}: ${packageNames.sort((left, right) => left.localeCompare(right)).join(", ")}`,
    )
    .join("\n")
}

function getSharedTrainVersion(packages) {
  const versionsByPackage = getVersionsByPackage(packages)

  if (versionsByPackage.size !== 1) {
    throw new Error(
      `Expected one shared release train version across publishable packages.\n${formatVersionMismatch(
        versionsByPackage,
      )}`,
    )
  }

  return Array.from(versionsByPackage.keys())[0]
}

module.exports = {
  formatVersionMismatch,
  getPublishablePackages,
  getSharedTrainVersion,
  getVersionsByPackage,
}
