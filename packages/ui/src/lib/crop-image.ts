import type { Area } from "react-easy-crop"

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous") // to avoid CORS issues
    image.src = url
  })

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    // Export as PNG to preserve transparency for logos
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Canvas is empty"))
      }
    }, "image/png")
  })
}

export default getCroppedImg
