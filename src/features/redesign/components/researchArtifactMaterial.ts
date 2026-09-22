import { DataTexture, LinearFilter, RepeatWrapping, RGBAFormat, SphereGeometry } from 'three'

export function createResearchSphere() {
  return new SphereGeometry(1.2, 64, 48)
}

// Pack height in red (bumpMap) and a separate satin finish in green
// (roughnessMap). Reusing mid-gray height for roughness would halve it.
// Only the lighting changes; fade grain out at both poles.
export function createSatinTexture() {
  const width = 128
  const height = 64
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    const latitude = y / (height - 1) * Math.PI
    const fade = Math.sin(latitude) ** 2
    for (let x = 0; x < width; x++) {
      const longitude = x / (width - 1) * Math.PI * 2
      const brushed = Math.sin(latitude * 38 + Math.sin(longitude * 3) * 0.8)
      const grain = Math.sin(longitude * 37 + Math.sin(latitude * 29) * 3)
      const value = Math.round(128 + fade * (brushed * 22 + grain * 7))
      const index = (y * width + x) * 4
      data[index] = value
      data[index + 1] = Math.round(220 + fade * brushed * 8)
      data[index + 2] = value
      data[index + 3] = 255
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat)
  texture.wrapS = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}
