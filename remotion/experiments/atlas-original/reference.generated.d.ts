export const references: Record<string, () => {
  explainerDuration: number;
  explainer(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void;
}>;
