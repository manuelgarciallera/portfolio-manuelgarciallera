import { DataTexture, LinearFilter, RepeatWrapping, RGBAFormat, SphereGeometry, SRGBColorSpace } from 'three'

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

// An 8 KiB emissive map colours the existing material; no extra mesh or pass.
export function createResearchGradientTexture() {
  const width = 64
  const height = 32
  const data = new Uint8Array(width * height * 4)
  const stops = [[0, 209, 255], [48, 103, 255], [146, 72, 255], [255, 55, 195], [0, 209, 255]]
  for (let y = 0; y < height; y++) {
    const latitude = y / (height - 1)
    const blend = Math.sin(latitude * Math.PI) ** 2
    const pole = [105 + latitude * 95, 135 - latitude * 45, 235]
    for (let x = 0; x < width; x++) {
      const position = x / (width - 1) * (stops.length - 1)
      const left = Math.min(Math.floor(position), stops.length - 2)
      const mix = position - left
      const offset = (y * width + x) * 4
      for (let channel = 0; channel < 3; channel++) {
        const gradient = stops[left][channel] * (1 - mix) + stops[left + 1][channel] * mix
        data[offset + channel] = Math.round(pole[channel] * (1 - blend) + gradient * blend)
      }
      data[offset + 3] = 255
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

export function createResearchPulseReset(onReset: () => void) {
  let pending: ReturnType<typeof setTimeout> | undefined
  const cancel = () => {
    if (pending !== undefined) clearTimeout(pending)
    pending = undefined
  }
  return {
    cancel,
    restart() {
      cancel()
      pending = setTimeout(() => {
        pending = undefined
        onReset()
      }, 6000)
    },
  }
}
