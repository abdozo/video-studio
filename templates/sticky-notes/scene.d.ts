export type TextCue = {text:string; at?:number; x?:number; y?:number; size?:number; color?:string; duration?:number};
export type StickyNote = {id:string; at:number; x:number; y:number; w:number; h:number; color?:string; rotation?:number; lift?:number; seed?:number; kind?:'note'|'index'; taped?:boolean; pin?:boolean; pinColor?:string; lines?:TextCue[]; doodles?:{kind:'person'|'book'|'question'|'cross';at?:number;x?:number;y?:number}[]; rings?:{at:number;x?:number;y?:number;rx:number;ry:number}[]};
export type StickyScene = {direction:'rtl'|'ltr'; duration:number; camera:{at:number;x:number;y:number;zoom:number}[]; notes:StickyNote[]; links?:({at:number;duration?:number;color?:string;seed?:number}&({kind:'yarn';from:[number,number];to:[number,number];sag?:number}|{kind:'arrow';points:[number,number][];width?:number}))[]; sfx?:{at:number;kind:'slap'|'marker'|'yarn'|'pin'|'tape';duration?:number}[]};
export function drawScene(ctx:CanvasRenderingContext2D,width:number,height:number,time:number,data:StickyScene):void;
export function cameraAt(keys:StickyScene['camera'],time:number):number[];

export function parseStickyScene(data:unknown):StickyScene;
