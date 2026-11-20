import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, SHADOW} from '../brand';
import {FONT_BODY, FONT_DISPLAY, FONT_MONO} from '../fonts';

const p = (frame: number, at: number, dur = 12) => interpolate(frame, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.33, 1, .68, 1)});

export const VocabularyCard: React.FC<{word: string; meaning: string; example?: string; at?: number}> = ({word, meaning, example, at = 0}) => {
  const frame = useCurrentFrame(); const enter = p(frame, at);
  return <div style={{padding: '46px 54px', borderRadius: 20, background: '#fff', color: COLORS.ink, boxShadow: SHADOW.card, opacity: enter, transform: `translateY(${(1-enter)*24}px)`}}>
    <div style={{fontFamily: FONT_DISPLAY, fontSize: 78, fontWeight: 700, color: COLORS.accent}}>{word}</div>
    <div style={{fontFamily: FONT_BODY, fontSize: 34, marginTop: 16}}>{meaning}</div>
    {example ? <div style={{fontFamily: FONT_BODY, fontSize: 28, color: COLORS.muted, marginTop: 30, paddingTop: 24, borderTop: `1px solid ${COLORS.line}`}}>{example}</div> : null}
  </div>;
};

export const SentenceParts: React.FC<{parts: {text: string; role: 'subject'|'verb'|'object'|'other'}[]}> = ({parts}) => {
  const colors = {subject: COLORS.accent, verb: COLORS.signal, object: COLORS.warn, other: COLORS.ink};
  return <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18}}>{parts.map((part, i) => <div key={`${part.text}-${i}`} style={{fontFamily: FONT_DISPLAY, fontSize: 52, fontWeight: 600, color: colors[part.role], padding: '12px 18px', borderBottom: `5px solid ${colors[part.role]}55`}}>{part.text}</div>)}</div>;
};

export const Correction: React.FC<{wrong: string; correct: string; revealAt?: number}> = ({wrong, correct, revealAt = 30}) => {
  const frame = useCurrentFrame(); const reveal = p(frame, revealAt, 14);
  return <div style={{display: 'grid', gap: 28, fontFamily: FONT_DISPLAY, fontSize: 48}}>
    <div style={{color: COLORS.danger, textDecoration: 'line-through', opacity: .75}}>✕ {wrong}</div>
    <div style={{color: COLORS.signal, opacity: reveal, transform: `translateY(${(1-reveal)*18}px)`}}>✓ {correct}</div>
  </div>;
};

export const Pronunciation: React.FC<{word: string; phonetic: string; syllables?: string[]; stress?: number}> = ({word, phonetic, syllables, stress = 0}) => <div style={{textAlign: 'center'}}>
  <div style={{fontFamily: FONT_DISPLAY, fontSize: 86, fontWeight: 700}}>{word}</div>
  <div style={{fontFamily: FONT_MONO, fontSize: 38, color: COLORS.accent, marginTop: 14}}>{phonetic}</div>
  {syllables ? <div style={{display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24}}>{syllables.map((s, i) => <span key={i} style={{fontFamily: FONT_BODY, fontSize: 30, fontWeight: i === stress ? 700 : 400, color: i === stress ? COLORS.signal : COLORS.muted}}>{s}{i < syllables.length - 1 ? ' ·' : ''}</span>)}</div> : null}
</div>;

export const Dialogue: React.FC<{speaker: string; text: string; side?: 'left'|'right'; accent?: string}> = ({speaker, text, side = 'left', accent = COLORS.accent}) => <div style={{alignSelf: side === 'left' ? 'flex-start' : 'flex-end', maxWidth: '72%', padding: '24px 30px', borderRadius: 22, borderBottomLeftRadius: side === 'left' ? 4 : 22, borderBottomRightRadius: side === 'right' ? 4 : 22, background: '#fff', color: COLORS.ink, boxShadow: SHADOW.soft}}>
  <div style={{fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: accent, marginBottom: 8}}>{speaker}</div>
  <div style={{fontFamily: FONT_BODY, fontSize: 32, lineHeight: 1.35}}>{text}</div>
</div>;

export const FillBlank: React.FC<{before: string; answer: string; after?: string; revealAt?: number}> = ({before, answer, after = '', revealAt = 40}) => {
  const frame = useCurrentFrame(); const reveal = p(frame, revealAt, 10);
  return <div style={{fontFamily: FONT_DISPLAY, fontSize: 56, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16}}><span>{before}</span><span style={{minWidth: 220, textAlign: 'center', color: COLORS.accent, borderBottom: `4px solid ${COLORS.accent}`, opacity: .25 + .75*reveal}}>{reveal > .05 ? answer : ' '}</span><span>{after}</span></div>;
};

export const MultipleChoice: React.FC<{question: string; choices: string[]; correct: number; revealAt?: number}> = ({question, choices, correct, revealAt = 60}) => {
  const frame = useCurrentFrame(); const reveal = p(frame, revealAt, 8);
  return <div><div style={{fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 600, marginBottom: 30}}>{question}</div><div style={{display: 'grid', gap: 16}}>{choices.map((choice, i) => <div key={choice} style={{fontFamily: FONT_BODY, fontSize: 30, padding: '20px 24px', borderRadius: 14, background: reveal > .05 && i === correct ? `${COLORS.signal}25` : '#fff', border: `2px solid ${reveal > .05 && i === correct ? COLORS.signal : COLORS.line}`, color: COLORS.ink}}>{String.fromCharCode(65+i)}. {choice}</div>)}</div></div>;
};

export const TranslationPair: React.FC<{source: string; translation: string}> = ({source, translation}) => <div style={{display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 38, alignItems: 'center', padding: 38, borderRadius: 18, background: '#fff', color: COLORS.ink, boxShadow: SHADOW.soft}}>
  <div style={{fontFamily: FONT_DISPLAY, fontSize: 38, textAlign: 'right'}}>{source}</div><div style={{height: 90, background: COLORS.line}}/><div style={{fontFamily: FONT_BODY, fontSize: 34}}>{translation}</div>
</div>;
