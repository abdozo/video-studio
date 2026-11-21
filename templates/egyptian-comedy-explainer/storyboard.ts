import type {Scene} from './Scene';

export const lead=.50;
const cream='#f5e9cb', sage='#dcece2', peach='#f6dfd0';
const raw:Scene[]=[
  {at:0,bg:cream,title:[{at:0,text:'الفرح له خُطّة'},{at:8.54,text:'أدقّ من\nجدول المطار'}],layers:[
    {at:1.30,kind:'calendar',label:'جدول الفرح',x:503,y:192,scale:1.15,tilt:5},
    {at:1.92,kind:'hall',label:'القاعة',x:508,y:396,scale:.85},
    {at:2.80,kind:'ticket',label:'٧ مساءً',x:552,y:528,scale:.63,tilt:-7},
    {at:3.18,kind:'camera',label:'التصوير',x:319,y:370,scale:.80,tilt:-8},
    {at:4.04,kind:'ticket',label:'٨ مساءً',x:341,y:493,scale:.63,tilt:9},
    {at:4.52,kind:'cake',label:'التورتة',x:137,y:419,scale:.72},
    {at:6.44,kind:'person',x:150,y:217,scale:.7},
    {at:8.88,kind:'clock',x:300,y:173,scale:.70,tilt:-10}
  ]},
  {at:9.78,bg:sage,title:[{at:9.78,text:'طب بعد الفرح؟'},{at:16.10,text:'بيت عامل إزّاي؟'}],layers:[
    {at:10.12,kind:'door',x:516,y:334,scale:1.22},
    {at:11.88,kind:'person',x:325,y:420,scale:.83,off:12.29},
    {at:13.12,kind:'tray',x:304,y:429,scale:.83,tilt:-8},
    {at:14.82,kind:'woman',x:205,y:272,scale:.82},
    {at:15.36,kind:'person',x:97,y:373,scale:.65},
    {at:16.36,kind:'question',x:265,y:162,scale:.77}
  ]},
  {at:17.38,bg:peach,title:[{at:17.38,text:'قبل ما تختار'},{at:22.06,text:'حاجة صغيرة أوي'},{at:23.48,text:'مين ساب النور؟'},{at:24.76,text:'مين حطّ الحَلّة؟'},{at:25.82,text:'بالمعلقة؟!'}],layers:[
    {at:18.70,kind:'person',x:531,y:406,scale:1.12,worried:true},
    {at:19.60,kind:'woman',x:183,y:427,scale:1.06,worried:true},
    {at:22.30,kind:'ray',x:194,y:265,scale:1.22},
    {at:23.48,kind:'bulb',x:355,y:176,scale:.90,off:24.54},
    {at:24.76,kind:'pot',x:351,y:208,scale:1.0},
    {at:25.82,kind:'spoon',x:372,y:329,scale:.71,tilt:11},
    {at:26.32,kind:'ray',x:543,y:244,scale:1.0},
  ]},
  {at:26.92,bg:cream,title:[{at:26.92,text:'فيه سؤال أكبر'},{at:31.26,text:'إحنا رايحين فين؟'},{at:34.64,text:'كل واحد\nمتخيّل طريق'}],layers:[
    {at:28.58,kind:'question',x:444,y:192,scale:1.21,tilt:8,off:31.8},
    {at:31.26,kind:'person',x:573,y:312,scale:.91},
    {at:32.60,kind:'woman',x:471,y:471,scale:.87},
    {at:33.42,kind:'line',x:343,y:264,tilt:-12},
    {at:33.92,kind:'house',x:157,y:238,scale:.79},
    {at:34.34,kind:'line',x:300,y:450,tilt:9},
    {at:34.64,kind:'house',x:105,y:475,scale:.69,tilt:-10},
    {at:36.10,kind:'ray',x:320,y:337,scale:1.1}
  ]},
  {at:37.28,bg:sage,title:[],verseLabel:'سورة النحل · ٩٧',verse:[
    {at:38.90,text:'مَنْ عَمِلَ صَالِحًا مِنْ ذَكَرٍ أَوْ أُنْثَىٰ'},
    {at:44.54,text:'وَهُوَ مُؤْمِنٌ'},
    {at:45.90,text:'فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً'},
  ]},
  {at:50.48,bg:sage,title:[{at:50.48,text:'حياة طيّبة'}],layers:[
    {at:51.96,kind:'heart',label:'إيمان',x:508,y:319,scale:1.14,tilt:8},
    {at:52.78,kind:'check',x:344,y:324,scale:1.10},
    {at:52.93,kind:'book',label:'عمل صالح',x:179,y:359,scale:1.10,tilt:-7},
    {at:53.88,kind:'spark',x:387,y:189,scale:.42},
  ]},
  {at:54.34,bg:peach,title:[{at:54.34,text:'متاع الدنيا'},{at:57.86,text:'الفرح خلص'},{at:61.84,text:'فين التورتة؟'}],layers:[
    {at:56.06,kind:'cake',x:494,y:291,scale:1.35,off:60.46},
    {at:56.84,kind:'clock',x:279,y:316,scale:.92,off:60.46},
    {at:59.40,kind:'calendar',label:'شهور تجهيز',x:119,y:247,scale:.78,tilt:-9,off:60.46},
    {at:60.46,kind:'person',x:410,y:395,scale:1.16,worried:true},
    {at:61.62,kind:'fork',x:178,y:367,scale:.93,tilt:-13},
    {at:62.24,kind:'question',x:211,y:190,scale:.71},
  ]},
  {at:63.10,bg:cream,title:[{at:63.10,text:'أنا عايز\nأتجوّز ليه؟'},{at:68.30,text:'بيت يعين على\nطاعة ربنا'},{at:75.06,text:'أصون نفسي'},{at:77.52,text:'ذرية صالحة'},{at:80.46,text:'أجر يفضل\nبعد انقطاع العمل'}],layers:[
    {at:64.24,kind:'person',x:488,y:319,scale:1.06,off:68.8},
    {at:65.04,kind:'question',x:277,y:197,scale:.76,off:66.2},
    {at:66.92,kind:'house',x:288,y:404,scale:1.17,off:74.50},
    {at:67.70,kind:'woman',x:131,y:374,scale:.73,off:74.50},
    {at:69.70,kind:'heart',x:488,y:268,scale:.53,off:74.50},
    {at:71.00,kind:'ticket',label:'الصلاة',x:557,y:395,scale:.81,off:74.50},
    {at:71.60,kind:'ticket',label:'الذِّكر',x:510,y:460,scale:.81,off:74.50},
    {at:72.68,kind:'book',label:'القرآن',x:198,y:219,scale:.72,off:74.50},
    {at:73.60,kind:'ticket',label:'طلب العلم',x:454,y:527,scale:.81,off:74.50},
    {at:75.26,kind:'shield',x:443,y:334,scale:1.07,off:77.52},
    {at:77.52,kind:'woman',x:516,y:330,scale:.95},
    {at:77.84,kind:'child',x:321,y:409,scale:.80},
    {at:78.94,kind:'person',x:167,y:357,scale:.91},
    {at:80.46,kind:'spark',x:322,y:189,scale:.62},
  ]},
  {at:82.94,bg:sage,title:[{at:82.94,text:'قبل ما تختار'},{at:86.58,text:'نقدر نساعد\nبعض؟'},{at:87.92,text:'البيت اللي\nهنبنيه سوا'}],layers:[
    {at:83.4,kind:'calendar',label:'بعد الفرح',x:380,y:211,scale:1.23,tilt:-5},
    {at:84.42,kind:'person',x:527,y:438,scale:.96},
    {at:85.28,kind:'woman',x:389,y:472,scale:.94},
    {at:86.58,kind:'line',x:290,y:329,scale:.70,tilt:-9},
    {at:87.26,kind:'house',x:140,y:333,scale:.92},
    {at:87.92,kind:'check',x:243,y:170,scale:.86},
  ]},
];

export const scenes = raw.map(scene=>({
  ...scene,at:scene.at+lead,title:scene.title.map(c=>({...c,at:c.at+lead})),
  verse:scene.verse?.map(c=>({...c,at:c.at+lead})),
  layers:scene.layers?.map(l=>({...l,at:l.at+lead,off:l.off===undefined?undefined:l.off+lead})),
}));
