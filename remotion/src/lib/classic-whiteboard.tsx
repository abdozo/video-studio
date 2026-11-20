import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont} from "@remotion/google-fonts/Kalam";

export const MARKER = {
  white: "#FFFFFF",
  ink: "#171513",
  ochre: "#F5AB33",
  teal: "#087D70",
} as const;

const {fontFamily} = loadFont("normal", {weights: ["700"], subsets: ["latin"]});
const drawEase = Easing.bezier(.36, 0, .24, 1);

const reveal = (frame: number, at: number, frames: number) =>
  interpolate(frame, [at, at + Math.max(frames, 1)], [0, 1], {
    easing: drawEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const ClassicWhiteboardCanvas: React.FC<React.PropsWithChildren> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: MARKER.white, color: MARKER.ink, overflow: "hidden"}}>
    {children}
  </AbsoluteFill>
);

export const MarkerHeading: React.FC<{title: string}> = ({title}) => {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const portrait = height > width;
  const maxWidth = width * (portrait ? .85 : .55);
  const size = Math.min(width * (portrait ? .11 : .078), maxWidth * 3.3 / Math.max(title.length, 1));
  const underline = reveal(frame, 1, fps * .55);
  const lastWord = title.lastIndexOf(" ") + 1;
  return <h1 style={{
    position: "absolute", margin: 0, left: "6.5%", top: portrait ? "8%" : "8.5%",
    maxWidth, fontFamily, fontSize: size, fontWeight: 700, lineHeight: 1.02,
    letterSpacing: "-.035em", textWrap: "balance", overflowWrap: "anywhere",
  }}>
    {title.slice(0, lastWord)}
    <span style={{display: "inline-block", position: "relative", maxWidth: "100%"}}>
      {title.slice(lastWord)}
      <svg viewBox="0 0 260 22" preserveAspectRatio="none" aria-hidden="true"
        style={{position: "absolute", left: 0, bottom: "-.05em", width: "100%", height: ".14em"}}>
        <path d="M5 17 Q119 1 254 10" fill="none" stroke={MARKER.ochre} strokeWidth={8}
          strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - underline}
          opacity={underline > 0 ? 1 : 0} />
      </svg>
    </span>
  </h1>;
};

type Stroke = string | {d: string; color?: string; width?: number; dotted?: boolean};
type Fill = {d: string; color: string};

export const MarkerDrawing: React.FC<{
  strokes: readonly Stroke[];
  fills?: readonly Fill[];
  at: number;
  duration: number;
  label?: string;
  labelY?: number;
}> = ({strokes, fills, at, duration, label, labelY = 185}) => {
  const frame = useCurrentFrame();
  const fill = reveal(frame, at + .59 * duration, .39 * duration);
  const text = reveal(frame, at + .45 * duration, .46 * duration);
  return <g strokeLinecap="round" strokeLinejoin="round">
    {fills?.map(({d, color}) => <path key={d} d={d} fill={color} opacity={fill} />)}
    {strokes.map((stroke, index) => {
      const {d, color = MARKER.ink, width = 5, dotted = false} = typeof stroke === "string" ? {d: stroke} : stroke;
      const p = reveal(frame, at + index * duration * .52 / strokes.length, duration * .48);
      if (p <= 0) return null;
      return <path key={d} d={d} fill="none" stroke={color} strokeWidth={width} pathLength={1}
        strokeDasharray={dotted ? ".01 .10" : "1 1"} strokeDashoffset={dotted ? 0 : 1 - p}
        opacity={dotted ? p : 1} />;
    })}
    {label && <text x={100} y={labelY} textAnchor="middle" fill={MARKER.ink} opacity={text}
      fontFamily={fontFamily} fontWeight={700} fontSize={Math.min(26, 340 / label.length)}>
      {label}
    </text>}
  </g>;
};

const sweater = "M53 173 Q30 185 21 224 Q11 259 38 269 L174 269 Q196 267 188 242 Q177 190 145 177 Q131 194 110 194 Q85 194 72 175Z";

const character = {
  fills: [{d: sweater, color: MARKER.ochre}],
  strokes: [
    "M49 141 Q32 140 37 122 Q19 112 32 97 Q19 78 39 71 Q31 53 51 49 Q46 30 68 28 Q73 10 94 18 Q108 3 127 19 Q148 11 154 32 Q178 26 179 48 Q199 55 186 74 Q198 90 184 98",
    "M48 131 Q62 142 75 126 Q72 109 87 103 Q101 88 99 64 Q120 72 130 50 Q142 70 160 63 Q184 84 180 118 Q178 151 153 165 Q129 180 97 166 Q74 176 64 152",
    "M72 124 L91 116 A19 19 0 1 1 127 109 A19 19 0 1 1 91 116 M129 108 Q138 101 145 104 A17 17 0 1 1 177 99 A17 17 0 1 1 145 104 M113 110 l2 4 M163 99 l2 4 M135 145 q8 -8 17 -4",
    sweater,
    "M73 191 Q75 218 106 237 L129 238 Q146 243 143 256 Q136 269 114 266 L72 247 M146 212 L154 239 M110 239 Q117 253 114 266 M62 199 Q52 218 61 238",
  ],
} as const;

const report = {
  strokes: [
    "M48 21 L143 33 L114 133 L21 119Z M58 48 L121 56 M51 67 L115 75 M44 87 L108 95",
    "M140 48 L155 52 L125 149 L30 136 L34 122 M150 67 L167 70 L137 165 L42 152 L45 138",
  ],
} as const;

const laptop = {
  strokes: [
    "M25 111 L19 36 Q17 22 29 21 L154 14 Q168 13 170 26 L179 101 Q180 111 169 114 L36 123 Q26 124 25 111Z",
    "M37 111 L29 34 L158 26 L167 102Z M75 49 L105 46 L124 62 L128 91 L78 95Z M106 46 L108 65 L124 62 M87 71 L114 69 M88 81 L115 79",
    "M28 124 L168 113 L193 138 Q198 145 186 149 L51 160 Q41 160 35 153 L12 134 Q5 126 28 124Z M41 131 L168 121 M47 141 L176 130 M84 143 L131 139 L139 147 L91 151Z",
  ],
} as const;

const pen = {
  strokes: [
    "M115 42 L25 57 L45 154 L145 136 L126 76",
    "M99 94 L104 73 L156 7 Q162 0 170 5 L180 12 Q185 17 178 25 L124 89Z M105 73 L124 86 M149 18 L173 33 M178 25 Q186 33 178 45 L158 69",
    {d: "M63 100 L99 94 M157 86 L169 99 L192 72", color: MARKER.teal, width: 6},
  ],
} as const;

const fork = {
  strokes: [
    "M100 142 L100 106 Q97 62 29 25 L37 43 M29 25 L51 27",
    {d: "M100 109 Q107 58 173 20 L151 22 M173 20 L162 41", color: MARKER.teal, width: 6},
  ],
} as const;

const layout = {
  landscape: {
    viewBox: "0 0 1200 675",
    report: "translate(298 426) scale(.72)",
    poses: [
      "translate(58 283) scale(1.24)",
      "translate(461 373) scale(1.11)",
      "translate(723 227) scale(1.06)",
      "translate(972 76) scale(.94)",
    ],
    trails: ["M661 392 Q689 351 715 345", "M923 241 Q943 208 960 201"],
  },
  portrait: {
    viewBox: "0 0 675 1200",
    report: "translate(267 469) scale(.49)",
    poses: [
      "translate(53 311) scale(1.18)",
      "translate(372 322) scale(1.05)",
      "translate(301 542) scale(1.05)",
      "translate(408 744) scale(.93)",
    ],
    trails: ["M548 529 Q533 549 517 554", "M495 750 Q514 756 525 778"],
  },
} as const;

export const ClassicWhiteboardStarter: React.FC<{
  title: string;
  steps: readonly [string, string, string];
}> = ({title, steps}) => {
  const {width, height, fps, durationInFrames} = useVideoConfig();
  const board = height > width ? layout.portrait : layout.landscape;
  const length = Math.min(durationInFrames, fps * 7);
  const duration = length * .19;
  return <ClassicWhiteboardCanvas>
    <MarkerHeading title={title} />
    <svg width="100%" height="100%" viewBox={board.viewBox} style={{position: "absolute", inset: 0}}>
      <g transform={board.poses[0]}><MarkerDrawing {...character} at={length * .03} duration={duration} /></g>
      <g transform={board.report}><MarkerDrawing {...report} at={length * .12} duration={duration * .72} /></g>
      <g transform={board.poses[1]}><MarkerDrawing {...laptop} label={steps[0]} at={length * .28} duration={duration} /></g>
      <MarkerDrawing strokes={[{d: board.trails[0], color: MARKER.teal, dotted: true}]} at={length * .47} duration={duration * .42} />
      <g transform={board.poses[2]}><MarkerDrawing {...pen} label={steps[1]} at={length * .53} duration={duration} /></g>
      <MarkerDrawing strokes={[{d: board.trails[1], color: MARKER.teal, dotted: true}]} at={length * .72} duration={duration * .42} />
      <g transform={board.poses[3]}><MarkerDrawing {...fork} label={steps[2]} labelY={168} at={length * .78} duration={duration} /></g>
    </svg>
  </ClassicWhiteboardCanvas>;
};
