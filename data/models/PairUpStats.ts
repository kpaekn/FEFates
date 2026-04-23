export default class PairUpStats {
  c: string;
  b: string;
  a: string;
  s: string;

  constructor(values: string[]) {
    if (values.length !== 4) {
      throw new Error(`Expected 4 stat values, got ${values.join(", ")}`);
    }
    this.c = values[0];
    this.b = values[1];
    this.a = values[2];
    this.s = values[3];
  }
}
