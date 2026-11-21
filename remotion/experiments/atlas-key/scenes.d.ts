export const W: number;
export const H: number;
export const duration: number;
export const styles: string[];
export function createRenderer(style: string): (canvas: HTMLCanvasElement, time: number) => void;
