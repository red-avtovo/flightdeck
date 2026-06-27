export interface Rng {
  next(): number
  nextInt(min: number, max: number): number
  nextFloat(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  nextBool(probability?: number): boolean
  logNormal(meanLog: number, sigmaLog: number): number
}

function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed: number = 42): Rng {
  const rand = mulberry32(seed)
  return {
    next: rand,
    nextInt: (min, max) => Math.floor(rand() * (max - min + 1)) + min,
    nextFloat: (min, max) => rand() * (max - min) + min,
    pick: <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)],
    nextBool: (p = 0.5) => rand() < p,
    logNormal: (meanLog, sigmaLog) => {
      const u1 = Math.max(rand(), 1e-10)
      const u2 = rand()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      return Math.exp(meanLog + sigmaLog * z)
    },
  }
}
