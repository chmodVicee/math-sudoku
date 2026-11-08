/**
 * Implementación exacta de java.util.Random (LCG de 48 bits) para que el
 * generador de niveles produzca los mismos resultados en Java y en JavaScript.
 * Esto permite compartir semillas entre la versión web y la móvil (crossplay).
 */
const MULTIPLIER = 0x5deece66dn;
const ADDEND = 0xbn;
const MASK = (1n << 48n) - 1n;

export class JavaRandom {
  constructor(seed) {
    this.seed = (BigInt(seed) ^ MULTIPLIER) & MASK;
  }

  next(bits) {
    this.seed = (this.seed * MULTIPLIER + ADDEND) & MASK;
    return Number(this.seed >> BigInt(48 - bits));
  }

  nextInt(bound) {
    if (bound <= 0) {
      throw new Error(`bound must be positive: ${bound}`);
    }

    // Potencia de dos: (bound * next(31)) >> 31
    if ((bound & -bound) === bound) {
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }

    let bits;
    let value;
    do {
      bits = this.next(31);
      value = bits % bound;
    } while (bits - value + (bound - 1) < 0);

    return value;
  }

  nextBoolean() {
    return this.next(1) !== 0;
  }
}

export function shuffle(list, random) {
  for (let i = list.length; i > 1; i -= 1) {
    const j = random.nextInt(i);
    [list[i - 1], list[j]] = [list[j], list[i - 1]];
  }
  return list;
}
