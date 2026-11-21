export function createReference(): {
  duration: number;
  draw(context: CanvasRenderingContext2D, width: number, height: number, time: number): void;
};
