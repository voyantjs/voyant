const { read } = require("@changesets/config")
const { getPackages } = require("@manypkg/get-packages")
const { getPublishablePackages, getSharedTrainVersion } = require("./release-train-utils.cjs")

async function main() {
  const cwd = process.cwd()
  const packages = await getPackages(cwd)
  const config = await read(cwd, packages)
  const publishablePackages = getPublishablePackages(packages, config)
  const trainVersion = getSharedTrainVersion(publishablePackages)

  console.log(
    `Verified ${publishablePackages.length} publishable packages on shared release train ${trainVersion}.`,
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
