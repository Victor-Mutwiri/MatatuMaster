
/**
 * A simple Linear Congruential Generator (LCG) for seeded random numbers.
 * Essential for deterministic traffic in multiplayer.
 */
export class SeededRNG {
  private seed: number;

  constructor(seedString: string) {
    this.seed = this.cyrb128(seedString);
  }

  // Hashing algorithm to turn a string (UUID) into a number
  private cyrb128(str: string): number {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
  }

  /**
   * Returns a random float between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * Returns true/false based on probability (0-1)
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Range float
   */
  range(min: number, max: number): number {
    return min + (this.next() * (max - min));
  }
  
  /**
   * Pick random item from array
   */
  pick<T>(array: T[]): T {
      return array[Math.floor(this.next() * array.length)];
  }
}
