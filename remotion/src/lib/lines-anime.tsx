import React from "react";
import {Easing, interpolate} from "remotion";
import {FONT_BODY, FONT_DISPLAY} from "../fonts";

export const ink = "#242b26";
export const paper = "#faf8ef";
export const teal = "#287e73";
export const amber = "#edaa49";
export const pencil = "#727e75";

const ease = Easing.bezier(.4, 0, .24, 1);
export const move = (frame: number, start: number, length = 18) =>
  interpolate(frame, [start, start + length], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const Heading: React.FC<{x: number; y: number; children: React.ReactNode; size?: number}> = ({x, y, children, size = 59}) =>
  <text x={x} y={y} fontFamily={FONT_DISPLAY} fontSize={size} fontWeight={700} letterSpacing={-size / 32} fill={ink} stroke="none">{children}</text>;

export const Note: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; color?: string}> = ({x, y, children, size = 21, color = pencil}) =>
  <text x={x} y={y} fontFamily={FONT_BODY} fontSize={size} fontWeight={600} fill={color} stroke="none">{children}</text>;

export const Stroke: React.FC<{d: string; progress: number; color?: string; width?: number}> = ({d, progress, color = teal, width = 5}) =>
  <path d={d} pathLength={1} stroke={color} strokeWidth={width} fill="none"
    strokeDasharray="1 1" strokeDashoffset={1 - progress} opacity={progress > 0 ? 1 : 0} />;

type Hand = [number, number];

const Sleeve: React.FC<{shoulder: Hand; elbow: Hand; hand: Hand; phone?: boolean}> = ({shoulder, elbow, hand, phone}) => {
  const d = `M ${shoulder.join(" ")} Q ${elbow.join(" ")} ${hand.join(" ")}`;
  return <>
    <path d={d} fill="none" strokeWidth={42} />
    <path d={d} fill="none" stroke={amber} strokeWidth={34} />
    <g transform={`translate(${hand.join(" ")})`}>
      <path d="M-13 -4 Q-10 -14 4 -13 Q17 -14 20 -5 Q24 4 12 9 L-6 12 Q-14 8 -13 -4Z" fill={paper} />
      {phone && <g transform="translate(8 -23) rotate(17)">
        <rect x={-11} y={-23} width={24} height={44} rx={5} fill={ink} />
        <rect x={-7} y={-18} width={16} height={31} rx={2} fill="#b5d9d0" stroke="none" />
        <circle cx={1} cy={17} r={1.2} fill={paper} stroke="none" />
      </g>}
    </g>
  </>;
};

export const Milo: React.FC<{
  frame: number;
  reach: number;
  lift: number;
  type: number;
  worry: number;
  phone: boolean;
}> = ({frame, reach, lift, type, worry, phone}) => {
  const breath = Math.sin(frame / 28) * 1.5;
  const blink = frame % 97 > 92;
  const tilt = -9 * worry + 7 * reach + 4 * type;
  const tap = Math.sin(frame * .64) * type;
  const hand: Hand = [220 + 61 * reach + 53 * lift + 34 * type, 169 - 16 * reach - 117 * lift + 6 * tap];
  return <g stroke={ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M26 167 L13 100 Q8 73 39 72 L90 71 L113 177" fill="#d9ddd2" />
    <path d="M20 103 L34 151 M27 90 L46 154 M36 87 L57 152" stroke="#abb6a9" />
    <path d="M47 177 L48 111 Q53 87 98 79 L141 80 Q177 89 189 118 L206 183Z" fill={amber} />
    <path d="M83 90 Q99 118 132 105 Q144 100 148 89 M69 121 L65 163 M150 132 L159 157" fill="none" stroke="#aa6f27" />
    <path d="M97 58 L95 88 Q113 103 132 88 L128 53Z" fill={paper} />
    <g transform={`translate(0 ${breath}) rotate(${tilt} 112 56)`}>
      <path d="M64 21 Q55 -20 92 -38 Q133 -58 166 -20 Q184 -1 177 25 L179 43 Q186 53 172 56 Q160 86 130 84 Q104 83 84 64 Q65 73 60 55 Q54 43 66 39Z" fill={paper} />
      <path d="M69 43 Q47 37 53 21 Q39 4 55 -9 Q53 -29 76 -33 Q82 -53 108 -46 Q133 -59 151 -40 Q177 -43 185 -20 Q200 -9 185 7 Q184 19 174 21 L170 4 Q151 16 138 5 Q121 28 99 19 Q93 43 78 42Z" fill={ink} />
      <path d="M59 13 Q63 -3 82 -4 M77 -19 Q86 -33 104 -30 M108 -35 Q130 -44 143 -29 M113 -13 Q128 -27 145 -20 M149 -25 Q169 -27 175 -12" stroke="#777a65" strokeWidth={1.9} fill="none" />
      <path d="M69 52 Q75 47 80 55" fill="none" />
      <path d={worry > .45 ? "M144 65 Q151 59 161 65" : "M144 61 Q153 73 162 60"} fill="none" />
      <path d="M82 42 L99 35 M135 34 Q140 30 146 33" fill="none" />
      <path d="M100 26 Q113 21 133 25 L133 43 Q127 54 109 51 Q100 49 100 40Z M147 24 Q160 19 178 23 L179 39 Q174 48 156 48 Q148 46 147 36Z" fill="none" />
      {blink ? <path d="M119 37 h7 M163 34 h7" /> :
        <g fill={ink} stroke="none"><ellipse cx={122} cy={36 + type * 2} rx={3.1} ry={4.2} /><ellipse cx={166} cy={34 + type * 2} rx={3.1} ry={4.2} /></g>}
      <path d={worry > .45 ? "M106 19 L122 13 M152 12 L168 16" : "M107 16 Q116 10 125 14 M151 12 Q161 7 168 11"} fill="none" />
    </g>
    <Sleeve shoulder={[69, 115]} elbow={[80, 181]} hand={[164 + 97 * type, 176 - 4 * tap]} />
    <Sleeve shoulder={[156, 112]} elbow={[184 + 22 * type, 176]} hand={hand} phone={phone} />
  </g>;
};

export const Laptop: React.FC<{open: number}> = ({open}) => {
  const top = -115 * open;
  return <g stroke={ink} strokeWidth={3.2} strokeLinejoin="round">
    <path d={`M17 -4 L43 ${top - 7} Q45 ${top - 11} 50 ${top - 11} L177 ${top - 11} Q185 ${top - 11} 183 ${top - 5} L159 0Z`} fill="#b5cec1" />
    {open > .22 && <path d={`M37 -12 L52 ${top} L171 ${top} L152 -12Z`} fill="#eaf2e7" strokeWidth={2} />}
    <path d="M16 -4 L159 0 L189 19 Q187 24 179 25 L0 20 Q-5 17 -1 12Z" fill="#e4e8dd" />
    <path d="M16 4 L148 7 L162 14 L9 12Z" fill="#a4b9ad" strokeWidth={1.6} />
  </g>;
};
