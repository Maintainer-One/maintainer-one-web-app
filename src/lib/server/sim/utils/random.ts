export class MatchPCG {
  private state: bigint;
  private readonly inc: bigint;

  constructor(seed: bigint, sequence: bigint = 6364136223846793005n) {
    this.inc = (sequence << 1n) | 1n;
    this.state = 0n;
    this.nextState();
    this.state += seed;
    this.nextState();
  }

  private nextState(): void {
    const multiplier = 6364136223846793005n;
    this.state = (this.state * multiplier + this.inc) & 0xffffffffffffffffn;
  }

  public nextInt(): number {
    const oldState = this.state;
    this.nextState();

    const xorshifted = Number(((oldState >> 18n) ^ oldState) >> 27n) >>> 0;
    const rot = Number(oldState >> 59n);

    const result = (xorshifted >>> rot) | (xorshifted << (-rot & 31));

    return result >>> 0;
  }

  public nextFloat(): number {
    // Divide by 2^32 to get 0.0 to 1.0
    return this.nextInt() / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    const range = max - min + 1;
    // We use the float to determine the offset within the range
    return Math.floor(this.nextFloat() * range) + min;
  }
}
