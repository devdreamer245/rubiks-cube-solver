declare module 'cubejs' {
  export default class Cube {
    constructor();
    static fromString(str: string): Cube;
    static initSolver(): void;
    static scramble(): string;
    static random(): Cube;
    asString(): string;
    clone(): Cube;
    isSolved(): boolean;
    move(alg: string): void;
    solve(): string;
  }
}
