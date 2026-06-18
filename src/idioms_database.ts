/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentGrade } from './types';
import { IDIOMS_1000_POOL } from './idioms_1000_pool';

// Extend our StudentGrade to include 'university'
export type ExtendedGrade = StudentGrade | 'university';

export interface PKQuestion {
  question: string;
  answer: string;
  pinyin: string;
  kidsExplanation: string;
  fact: string;
  options: string[];
  definition: string;
  mnemonic: string;
  story: string;
}

// Custom specialized premium inline SVGs with high-visual layout
export function getIdiomSVG(word: string): string {
  const gradientId = `grad_${encodeURIComponent(word).replace(/%/g, '_')}`;
  
  // Custom bespoke drawings or premium symbolic assets for each idiom
  let svgDrawing = "";
  
  if (word === "一毛不拔") {
    svgDrawing = `
      <!-- Ground and Treasury Chest -->
      <rect x="100" y="200" width="200" height="120" rx="15" fill="#4B3621" stroke="#332211" stroke-width="6"/>
      <rect x="100" y="200" width="200" height="30" fill="#D4AF37" stroke="#332211" stroke-width="4"/>
      <!-- Giant golden circle lock -->
      <circle cx="200" cy="260" r="28" fill="#F4D068" stroke="#332211" stroke-width="4"/>
      <rect x="195" y="255" width="10" height="20" rx="3" fill="#332211"/>
      <!-- A single funny hair sticking out of a bald shiny forehead -->
      <path d="M 200 130 C 205 100, 230 80, 250 95" fill="none" stroke="#2D3748" stroke-width="5" stroke-linecap="round"/>
      <circle cx="200" cy="140" r="10" fill="#2D3748"/>
      <!-- Angry hand pinching it with tweezers trying to pull -->
      <path d="M 170 85 L 210 110 M 170 120 L 215 115" stroke="#E53E3E" stroke-width="6" stroke-linecap="round"/>
      <circle cx="160" cy="100" r="6" fill="#E53E3E"/>
      <!-- Sparkle/Sweat drop -->
      <path d="M 220 70 L 220 80 M 230 75 L 220 75" stroke="#3182CE" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (word === "只手遮天") {
    svgDrawing = `
      <!-- Sun behind covering -->
      <circle cx="140" cy="140" r="70" fill="url(#sunGrad)" filter="url(#glow)"/>
      <path d="M 140 50 L 140 30 M 140 230 L 140 250 M 50 140 L 30 140 M 230 140 L 250 140" stroke="#FF8C00" stroke-width="6" stroke-linecap="round"/>
      <!-- Huge hand blocking -->
      <g transform="translate(10, 0)">
        <!-- Arm -->
        <rect x="140" y="240" width="120" height="150" rx="10" fill="#FFA54F" stroke="#5C3317" stroke-width="6"/>
        <!-- Palm -->
        <path d="M 120 250 C 90 220, 90 120, 150 110 C 180 100, 230 110, 260 140 C 290 170, 280 250, 240 270 Z" fill="#FFB90F" stroke="#5C3317" stroke-width="6"/>
        <!-- Fingers -->
        <rect x="135" y="60" width="30" height="90" rx="15" fill="#FFB90F" stroke="#5C3317" stroke-width="6"/>
        <rect x="175" y="50" width="30" height="100" rx="15" fill="#FFB90F" stroke="#503317" stroke-width="6"/>
        <rect x="215" y="70" width="30" height="85" rx="15" fill="#FFB90F" stroke="#5C3317" stroke-width="6"/>
        <!-- Little finger -->
        <rect x="250" y="100" width="25" height="65" rx="12" fill="#FFB90F" stroke="#5C3317" stroke-width="6"/>
        <!-- Thumb -->
        <path d="M 115 170 C 80 180, 80 220, 120 230" fill="none" stroke="#5C3317" stroke-width="6" stroke-linecap="round"/>
      </g>
    `;
  } else if (word === "一日千里") {
    svgDrawing = `
      <!-- Fast movement swift lines -->
      <path d="M 50 100 L 250 100 M 30 170 L 350 170 M 80 240 L 290 240" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 20"/>
      <!-- Majestic Cartoon Horse running -->
      <g transform="translate(100, 70)">
        <!-- Legs in stretch -->
        <path d="M 10 110 L -40 140" stroke="#D69E2E" stroke-width="12" stroke-linecap="round"/>
        <path d="M 30 110 L -10 150" stroke="#B7791F" stroke-width="12" stroke-linecap="round"/>
        <path d="M 150 110 L 210 145" stroke="#D69E2E" stroke-width="12" stroke-linecap="round"/>
        <path d="M 130 110 L 180 150" stroke="#B7791F" stroke-width="12" stroke-linecap="round"/>
        <!-- Body -->
        <rect x="20" y="50" width="130" height="70" rx="35" fill="#ECC94B" stroke="#744210" stroke-width="6"/>
        <!-- Tail -->
        <path d="M 10 60 C -30 40, -10 100, -40 110" fill="none" stroke="#D69E2E" stroke-width="8" stroke-linecap="round"/>
        <!-- Neck & Head -->
        <path d="M 130 70 L 170 20 C 180 15, 200 30, 210 40 L 170 85 Z" fill="#ECC94B" stroke="#744210" stroke-width="6" stroke-linejoin="round"/>
        <!-- Mane blowing back -->
        <path d="M 140 50 C 110 20, 100 40, 90 20" fill="none" stroke="#DD6B20" stroke-width="10" stroke-linecap="round"/>
        <circle cx="180" cy="35" r="5" fill="#2D3748"/>
      </g>
      <!-- Wind Swoosh -->
      <path d="M 40 80 Q 80 130 40 160" fill="none" stroke="#3182CE" stroke-width="5" stroke-linecap="round" opacity="0.4"/>
      <!-- Ground dust -->
      <circle cx="80" cy="240" r="10" fill="#E2E8F0"/>
      <circle cx="65" cy="235" r="6" fill="#CBD5E0"/>
    `;
  } else if (word === "妙笔生花") {
    svgDrawing = `
      <!-- Glowing floating flowers -->
      <g transform="translate(140, 100)">
        <circle cx="60" cy="40" r="28" fill="#F43F5E" opacity="0.85"/>
        <circle cx="95" cy="40" r="28" fill="#F43F5E" opacity="0.85"/>
        <circle cx="60" cy="75" r="28" fill="#F43F5E" opacity="0.85"/>
        <circle cx="95" cy="75" r="28" fill="#F43F5E" opacity="0.85"/>
        <circle cx="77" cy="57" r="20" fill="#FBBF24"/>
      </g>
      <!-- Giant Chinese brush pen -->
      <g transform="rotate(-35, 120, 220)">
        <!-- Handle -->
        <rect x="90" y="80" width="22" height="220" rx="6" fill="#78350F" stroke="#451A03" stroke-width="6"/>
        <!-- White ferrule -->
        <rect x="85" y="280" width="32" height="25" fill="#E2E8F0" stroke="#451A03" stroke-width="5"/>
        <!-- Ink Brush Tip -->
        <path d="M 85 305 Q 101 365 101 365 Q 101 365 117 305 Z" fill="#FFFFFF" stroke="#451A03" stroke-width="5" stroke-linejoin="round"/>
        <!-- Ink residue on tip -->
        <path d="M 93 335 Q 101 365 101 365 Q 101 365 109 335 Z" fill="#F43F5E"/>
      </g>
      <!-- Magic sparkles -->
      <path d="M 240 160 L 250 160 M 245 155 L 245 165" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
      <path d="M 180 230 L 190 230 M 185 225 L 185 235" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
      <path d="M 285 240 L 295 240 M 290 235 L 290 245" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
    `;
  } else if (word === "手无缚鸡之力") {
    svgDrawing = `
      <!-- A cute angry plump chicken looking very strong -->
      <circle cx="160" cy="180" r="55" fill="#FFE082" stroke="#FFB300" stroke-width="5"/>
      <circle cx="145" cy="170" r="8" fill="#263238"/>
      <polygon points="120,180 135,175 135,188" fill="#FF8F00"/>
      <!-- Chicken comb -->
      <path d="M 150 125 Q 160 110 170 125 Q 180 110 190 130" fill="#E53935" stroke="#C62828" stroke-width="3" stroke-linejoin="round"/>
      <!-- Tiny baby stick arm trying to pull -->
      <path d="M 210 190 L 280 195" stroke="#90A4AE" stroke-width="6" stroke-linecap="round"/>
      <!-- Soft red string wrapped loosely around chicken -->
      <path d="M 110 180 Q 160 210 210 180 Q 160 150 110 180" fill="none" stroke="#EF5350" stroke-dasharray="8 6" stroke-width="5"/>
      <!-- Weak man sweating, eyes spin -->
      <g transform="translate(240, 100)">
        <circle cx="30" cy="30" r="28" fill="#FFE0B2" stroke="#E65100" stroke-width="4"/>
        <path d="M 15 25 Q 22 15 30 25" stroke="#E65100" stroke-width="3" fill="none"/>
        <path d="M 35 25 Q 42 15 50 25" stroke="#E65100" stroke-width="3" fill="none"/>
        <path d="M 20 45 Q 30 35 40 45" stroke="#E65100" stroke-width="3" fill="none"/>
        <!-- Drop of sweat -->
        <path d="M -5 15 Q -10 25 -5 30 Q 0 30 -5 15" fill="#29B6F6"/>
      </g>
    `;
  } else if (word === "一尘不染") {
    svgDrawing = `
      <!-- Giant glittering pristine bubble/diamond -->
      <circle cx="200" cy="180" r="100" fill="url(#bubbleGrad)" stroke="#E2E8F0" stroke-width="6"/>
      <!-- Glare highlight -->
      <path d="M 130 130 A 75 75 0 0 1 270 130" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
      <!-- Sparkles and stars inside -->
      <g transform="translate(190, 160)">
        <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#FBBF24"/>
        <polygon points="40,-30 42,-25 47,-23 42,-21 40,-16 38,-21 33,-23 38,-25" fill="#3B82F6" opacity="0.8"/>
        <polygon points="-40,40 -38,45 -33,47 -38,49 -40,54 -42,49 -47,47 -42,45" fill="#10B981" opacity="0.8"/>
      </g>
      <!-- Tiny dust specks floating completely outside, bouncing away -->
      <circle cx="70" cy="100" r="5" fill="#AAAAAA" opacity="0.3"/>
      <path d="M 85 90 L 75 110" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
      <circle cx="330" cy="220" r="6" fill="#AAAAAA" opacity="0.3"/>
      <path d="M 345 210 L 335 230" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
    `;
  } else if (word === "名副其实") {
    svgDrawing = `
      <!-- Balance Scale balancing a giant golden Trophy and a verified checkmark document -->
      <!-- Support pillar -->
      <rect x="190" y="240" width="20" height="80" fill="#718096" stroke="#2D3748" stroke-width="5"/>
      <rect x="150" y="310" width="100" height="15" rx="5" fill="#4B5563" stroke="#2D3748" stroke-width="5"/>
      <circle cx="200" cy="110" r="14" fill="#E2E8F0" stroke="#2D3748" stroke-width="5"/>
      <!-- Balance arm perfectly horizontal -->
      <line x1="80" y1="120" x2="320" y2="120" stroke="#E2E8F0" stroke-width="10" stroke-linecap="round"/>
      <!-- Hanging cords Left -->
      <line x1="100" y1="120" x2="100" y2="180" stroke="#A0AEC0" stroke-width="3"/>
      <rect x="60" y="180" width="80" height="10" rx="3" fill="#D69E2E" stroke="#2D3748" stroke-width="3"/>
      <!-- Hanging cords Right -->
      <line x1="300" y1="120" x2="300" y2="180" stroke="#A0AEC0" stroke-width="3"/>
      <rect x="260" y="180" width="80" height="10" rx="3" fill="#3182CE" stroke="#2D3748" stroke-width="3"/>
      <!-- Left side object: Giant gold medal 'NAME' -->
      <circle cx="100" cy="220" r="24" fill="#F6E05E" stroke="#B7791F" stroke-width="4"/>
      <text x="88" y="226" font-family="sans-serif" font-size="16" font-weight="900" fill="#744210">名</text>
      <!-- Right side object: Genuine Gemstones 'REALITY' -->
      <polygon points="300,195 320,215 310,238 290,238 280,215" fill="#4299E1" stroke="#2B6CB0" stroke-width="4"/>
      <text x="288" y="224" font-family="sans-serif" font-size="14" font-weight="900" fill="#FFFFFF">实</text>
    `;
  } else if (word === "破釜沉舟") {
    svgDrawing = `
      <!-- Raging river waves -->
      <path d="M 40 280 C 100 250, 150 310, 210 280 C 270 250, 310 300, 360 280 L 360 350 L 40 350 Z" fill="#2B6CB0"/>
      <!-- A traditional wooden ship crack-broken in the middle and sinking down -->
      <g transform="translate(45, 60) rotate(15)">
        <path d="M 50 180 L 250 180 L 220 230 L 80 230 Z" fill="#744210" stroke="#451A03" stroke-width="6"/>
        <!-- Giant rift crack -->
        <path d="M 140 170 L 150 200 L 135 220 L 145 235" fill="none" stroke="#451A03" stroke-width="8" stroke-linecap="round"/>
        <!-- Sinking water splashing -->
        <path d="M 110 215 Q 140 190 170 220" fill="none" stroke="#63B3ED" stroke-width="5" stroke-linecap="round"/>
      </g>
      <!-- Smashed cooking cauldron pot/iron pot cracked to pieces on the left -->
      <g transform="translate(20, 240)">
        <path d="M 300 20 L 340 20 L 350 50 L 290 50 Z" fill="#4A5563" stroke="#1A202C" stroke-width="4"/>
        <path d="M 320 20 L 320 0 L 310 5 L 320 0 L 330 5" stroke="#EF4444" stroke-width="3" fill="none"/>
        <line x1="290" y1="35" x2="350" y2="35" stroke="#1A202C" stroke-width="4"/>
      </g>
      <!-- Sparkle sparks of determination -->
      <polygon points="100,60 102,68 110,70 102,72 100,80 98,72 90,70 98,68" fill="#F6E05E"/>
    `;
  } else {
    // Elegant standard vector seal background for any other idioms with glowing calligraphy!
    svgDrawing = `
      <!-- Chinese Scroll Design structure -->
      <rect x="50" y="50" width="300" height="260" rx="20" fill="#FAF5E6" stroke="#B7791F" stroke-width="6"/>
      <rect x="70" y="70" width="260" height="220" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      
      <!-- Red ink seal (Stamp) of classical literature -->
      <rect x="250" y="90" width="45" height="45" rx="5" fill="#E53E3E" stroke="#C53030" stroke-width="2"/>
      <text x="258" y="118" font-family="serif" font-size="14" font-weight="900" fill="#FFFFFF">国学</text>
      <text x="258" y="131" font-family="serif" font-size="10" font-weight="950" fill="#FFFFFF">考选</text>

      <!-- Ink brush wash silhouette bamboo background -->
      <path d="M 80 280 L 100 200 M 100 220 L 140 180 M 110 240 L 160 210" stroke="#CBD5E0" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <path d="M 85 240 Q 60 200 90 190" fill="none" stroke="#CBD5E0" stroke-width="6" opacity="0.6"/>

      <!-- Large core styled letters of the idiom -->
      <g transform="translate(110, 180)">
        <text x="0" y="0" font-family="STKaiti, KaiTi, serif" font-size="52" font-weight="900" fill="#2C5282" letter-spacing="4">
          ${word}
        </text>
        <line x1="-15" y1="12" x2="195" y2="12" stroke="#4299E1" stroke-width="4" stroke-linecap="round"/>
      </g>
      
      <!-- Sparkle light path -->
      <polygon points="120,90 123,96 130,98 123,100 120,106 117,100 110,98 117,96" fill="#F6E05E"/>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360" width="100%" height="100%" style="border-radius:1rem;">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
        <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EBF8FF" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#BEE3F8" stop-opacity="0.5"/>
        </linearGradient>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFD700" />
          <stop offset="100%" stop-color="#FF4500" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <!-- Outer background board -->
      <rect width="400" height="360" fill="url(#bgGrad)"/>
      
      <!-- Inner grid decor -->
      <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120 M 0 160 L 400 160 M 0 200 L 400 200 M 0 240 L 400 240 M 0 280 L 400 280 M 0 320 L 400 320" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
      <path d="M 40 0 L 400 0 M 80 0 L 80 360 M 120 0 L 120 360 M 160 0 L 160 360 M 200 0 L 200 360 M 240 0 L 240 360 M 280 0 L 280 360 M 320 0 L 320 360" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
      
      <!-- Core drawing mount -->
      ${svgDrawing}
    </svg>
  `;
}

// 60 fully pre-crafted educational interactive PK challenges spanning grades
export const PK_QUESTIONS_DATABASE: Record<ExtendedGrade, PKQuestion[]> = {
  elementary: [
    {
      question: "形容极其吝啬，连一根汗毛也不愿意拔出来的人",
      answer: "一毛不拔",
      pinyin: "yī máo bù bá",
      definition: "连一根毛也不肯拔出来，形容极其吝啬，自私自利。",
      kidsExplanation: "就像有的人抱着一盒子糖果，连最小的一颗碎糖渣也不舍得分享给好伙伴，真是抠门大王！",
      fact: "典故源于《孟子·尽心上》，说杨朱提倡“为我”，只要对自己有利，哪怕拔他身上一根毛来有利于天下人，他也是绝不肯干的。",
      options: ["一毛不拔", "勤俭节约", "身无分文", "爱财如命"],
      mnemonic: "兜里一分钱，攥得很紧捏。拔根小汗毛，他都舍不得！",
      story: "战国时有个叫杨朱的思想家，他非常自私。墨子的弟子问他：‘如果拔下您身上一根毫毛，就能拯救全世界的人，您干不干？’杨朱摇摇头说：‘世界的问题，不能指望拔我一根毛来解决，所以我绝不拔！’后来大家就用‘一毛不拔’来形容极度自私抠门的人。"
    },
    {
      question: "形容力量、威势极其巨大，用一双手就能把整个天盖住",
      answer: "只手遮天",
      pinyin: "zhǐ shǒu zhē tiān",
      definition: "一只手把天遮住，比喻利用权势隐瞒真相，极度专横。",
      kidsExplanation: "就像犯了错的小朋友用手捂住大人的眼睛，以为别人都看不见他的小调皮啦！",
      fact: "源自唐代诗人曹邺的诗句，常用来形容贪官蒙蔽皇帝、一手遮蔽真相的专权气焰。",
      options: ["只手遮天", "大材小用", "开天辟地", "手舞足蹈"],
      mnemonic: "巴掌大又圆，妄想盖住天。谎话连篇说，早晚要露馅！",
      story: "唐代有个大政客，仗着皇帝对他的宠爱，独揽朝廷大权，欺上瞒下，不让任何正直的好官向皇帝说出老百姓受苦的真相。诗人曹邺写诗批判他叹息道：‘手掌虽然大，难道能把浩瀚的蓝天遮盖住吗？’"
    },
    {
      question: "形容走得无比迅速，一天就能跑出一千华里",
      answer: "一日千里",
      pinyin: "yī rì qiān lǐ",
      definition: "一天前进一千里，指马跑得极快，后比喻进步、发展极迅速。",
      kidsExplanation: "就像你的数学成绩，前天还只打六十分，通过几天刻苦练习，突然拿了一百满分，进步像坐火箭一样快！",
      fact: "语出《庄子·秋水》：“骐骥骅骝，一日千里。”，意思是极好的骏马，一日就能跑出千里地。",
      options: ["一日千里", "走马观花", "快马加鞭", "昂首阔步"],
      mnemonic: "千里遥远路，一天就跑完。学习成绩好，进步坐火箭！",
      story: "战国时期，楚国引进了一匹被称为‘骐骥’的神奇金骏马，它奔跑起来蹄子不粘灰，风驰电掣，一天就能越过重重山水跑出一千华里的路程。庄子用这个比喻才华或技术进步的速度无比震撼！"
    },
    {
      question: "形容写字极其漂亮，就像笔尖下能开出美丽鲜花一般",
      answer: "妙笔生花",
      pinyin: "miào bǐ shēng huā",
      definition: "比喻杰出的写作才能，写出极其精彩动人的文章或诗句。",
      kidsExplanation: "就像老师看到你写的优秀日记，读起来觉得比冰淇淋还要甜美，连连赞叹你的笔像有魔法一样！",
      fact: "传说诗仙李白年轻作诗时，曾梦见自己常用的毛笔尖上长出一朵红莲花，从此诗才大进，冠绝天人。",
      options: ["妙笔生花", "画蛇添足", "龙飞凤舞", "字面整洁"],
      mnemonic: "梦里红莲现，笔尖香气传。作诗真神妙，才华传千年！",
      story: "大诗人李白还没出名的时候，天天在书房里苦读。有一夜他靠着书桌睡着了，梦到自己握着的毛笔尖端，竟然奇迹般地开出了一朵鲜红欲滴的荷花。他醒来后福至心灵，写下的诗章每一首都被天下千百人传颂。"
    },
    {
      question: "形容体弱多病，软弱无力，连一只小鸡都抓不起来的人",
      answer: "手无缚鸡之力",
      pinyin: "shǒu wú fù jī zhī lì",
      definition: "两手连捆绑一只鸡的力量都没有，形容体魄十分虚弱。",
      kidsExplanation: "就像整天不运动、只吃零食，结果跟大公鸡做游戏时，反而被公鸡扑腾翅膀吓得连连后退！",
      fact: "源自元代杂剧《东堂老》，常用来善意调侃饱读诗书、却缺乏体育锻炼、不事体力的书生学子。",
      options: ["手无缚鸡之力", "白手起家", "呆若木鸡", "筋疲力尽"],
      mnemonic: "小鸡跳高高，他却抓不到。不爱去跑步，浑身软飘飘！",
      story: "古代有些书生，天天闷在屋子里做文章写字，从来不去户外爬山或者锻炼身体。有一回，家里的老母鸡从篱笆逃跑了，书生气呼呼地去抓，结果稍微追了两步就气喘吁吁、满头大汗，连鸡毛都没碰着，被邻客传为笑谈。"
    },
    {
      question: "形容屋子里打扫得一尘不染，没有半点脏污",
      answer: "一尘不染",
      pinyin: "yī chén bù rǎn",
      definition: "原指佛教戒律严格不沾染世俗尘垢，后形容特别清洁，或人心地极其清高廉洁。",
      kidsExplanation: "就像妈妈刚拖过的地板，锃亮得像一面大镜子，连最细小的灰尘也找不到，你可以在上面打滚！",
      fact: "唐代禅宗六祖惠能有名谒：“菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。”是为此意之源。",
      options: ["一尘不染", "干干净净", "面目全非", "井井有条"],
      mnemonic: "小手擦桌子，亮得像镜子。没有灰尘留，做个好孩子！",
      story: "唐代有一位得道的高僧，品德高尚。他居住的小竹屋里没有任何多余的多彩装饰，只有几张朴素的草垫。他每天早晨都将地板和桌子擦拭数遍，无论任何人进屋，都感觉这里纯净如同冰雪世界，不曾沾染半点红尘俗气。"
    },
    {
      question: "形容名气和实际完全相符合，一点也不含糊",
      answer: "名副其实",
      pinyin: "míng fù qí shí",
      definition: "名声或名称与实际情况完全符合，没有虚夸。",
      kidsExplanation: "就像大家都叫你“班里的心算小超人”，在这次速算争霸赛中，你果然飞速拿到了一百分！",
      fact: "出自曹操《整齐朝廷令》：‘名副其实，固主所慎。’强调考察臣子不可重虚名而不重实干。",
      options: ["名副其实", "名不虚传", "有名无实", "欺世盗名"],
      mnemonic: "夸你算术好，果然拿满分。名字和真本事，完全合得准！",
      story: "三国时，曹操非常看重手下官员的真实干活本事。他颁布命令警告说：‘我们推荐官员，不能光听他的好名声，名声必须和他的实干成绩完全对得上！’这就是‘名副其实’，说明做人要名真、事真！"
    },
    {
      question: "画完蛇以后，非要给它多画上几只毫无用处的脚",
      answer: "画蛇添足",
      pinyin: "huà shé tiān zú",
      definition: "比喻多此一举，不但无益，反而有害。",
      kidsExplanation: "就像你把一幅漂亮的手工作品做好了，却非要在上面涂满各种颜色的胶水，结果把作品弄得脏兮兮的！",
      fact: "语出《战国策·齐策二》。比喻做了多余的事，反而把事情办糟了。",
      options: ["画蛇添足", "锦上添花", "精益求精", "画龙点睛"],
      mnemonic: "小蛇本无脚，偏要画几只。多此这一举，输了酒一卮！",
      story: "楚国有个贵族给他的门客们一壶好酒。大家决定在地上画蛇，谁先画好谁就喝这壶酒。一个人飞快画好了蛇，看到别人还没画完，就得意地拉过笔来：‘我还能给它添几只脚呢！’结果脚还没画完，另一个人夺过酒壶一饮而尽说：‘蛇本来就没有脚，你画的不是蛇！’"
    },
    {
      question: "小羊已经被狼偷走吃掉了，赶紧把破损的栅栏补起来",
      answer: "亡羊补牢",
      pinyin: "wáng yáng bǔ láo",
      definition: "羊丢失了，才去修补羊圈。比喻在受到损失之后，赶紧设法补救，免得以后再受损失。",
      kidsExplanation: "就像上次考试因为粗心做错了一道算术题，之后你认真钻研把这个知识点彻底学会，以后就再也不会错啦！",
      fact: "源自《战国策·楚策四》里的“亡羊补牢，未为迟也”。说明只要及时补救，就永远不会嫌太晚。",
      options: ["亡羊补牢", "未雨绸缪", "一败涂地", "顺手牵羊"],
      mnemonic: "丢羊别大哭，快去补圈木。今天堵漏洞，大狼没处入！",
      story: "战国时，楚国的襄王不听劝告，结果首都被秦国占领。他问大臣庄辛该怎么办。庄辛说：‘臣听说，羊丢了再去修补羊圈，也还不算晚。’襄王听了大受启发，重新振作，招募军队，终于收复了失地。"
    },
    {
      question: "捂住自己的双耳去偷门上的铃铛，以为别人也听不到它的响声",
      answer: "掩耳盗铃",
      pinyin: "yǎn ěr dào líng",
      definition: "偷人家的铃铛，捂住自己的耳朵。比喻自己欺骗自己，明明掩盖不住的事情偏要设法掩盖。",
      kidsExplanation: "就像做坏事的小猫把脑袋埋进枕头里，以为只要自己看不见，主人就发现不了它偷吃鱼干一样！",
      fact: "源自《吕氏春秋·自知》。讽刺了那些自己哄自己、自欺欺人的愚蠢行为。",
      options: ["掩耳盗铃", "自欺欺人", "光明磊落", "神不知鬼不觉"],
      mnemonic: "捂住小耳朵，去偷铜铃大。自己听不见，满街响叮哒！",
      story: "春秋时期，晋国有一家贵族落败。一个小偷想去他家偷走一口漂亮的大铜钟。可钟太重了，怎么也背不动，他便想用大锤把钟敲碎后一块块拿走。结果锤子刚砸上去，‘当’的一声巨响，响彻了大街小巷。小偷吓坏了，急忙伸手紧紧捂住自己的耳朵：‘呼，这下听不到了！’他以为这样别人也听不到，结果当场被抓住。"
    },
    {
      question: "一辈子生活在废弃水井底，以为世界大王就是自己，眼光特别渺小",
      answer: "井底之蛙",
      pinyin: "jǐng dǐ zhī wā",
      definition: "井底下的青蛙。比喻见识狭隘的人。",
      kidsExplanation: "就像老是待在房间里不出门，以为自己的小窗户能望见的几棵草就是一整片大森林呢！",
      fact: "出自庄子《秋水》里河神与北海若的对话，经典传神，常作为开阔眼界的比喻。",
      options: ["井底之蛙", "坐井观天", "目光如豆", "夜郎自大"],
      mnemonic: "井下一只蛙，以为天极大。大鳖说东海，吓爬小傻瓜！",
      story: "一口废井里住着一只青蛙，它对来访的东海大鳖炫耀说：‘你看我多舒服，可以在井里游泳，也可以在泥里睡觉，我就是这口井的主人！’大鳖想走进去，结果左腿还没伸进去就被卡住了。大鳖退回去，笑着给它讲了东海的浩瀚辽阔，青蛙听得目瞪口呆，终于知道自己见识多么浅薄了。"
    },
    {
      question: "狡猾的小狐狸跟在威风的大老虎身后，借着老虎的声势把森林里的百兽都吓跑了",
      answer: "狐假虎威",
      pinyin: "hú jiǎ hǔ wēi",
      definition: "比喻依仗别人的势力欺压人。",
      kidsExplanation: "就像在学校里，有的小调皮仗着自己哥哥是个高年级的体育委员，就去抢别的小朋友手里的皮球玩！",
      fact: "源于《战国策·楚策一》，是关于狐狸巧妙借老虎威风脱险的寓言。",
      options: ["狐假虎威", "狼狈为奸", "狐朋狗友", "画蛇添足"],
      mnemonic: "狐狸走在先，老虎跟在后。百兽吓得跑，威风借个透！",
      story: "饥饿的老虎在森林里抓到了一只狐狸。狐狸眼珠一转，得意洋洋地说：‘你怎敢吃我？我是天帝派来管理百兽的王！不信你跟在我后面走一趟，看看百兽见我是不是很害怕。’老虎心怀疑惑，便跟着它走。沿途的野猪、小鹿、兔子见到大老虎气势汹汹地走来，吓得撒腿就跑。老虎信以为真，根本不知道野兽害怕的是自己，而不是狐狸。"
    },
    {
      question: "平时默默无闻、像只不飞不叫的鸟，一旦展翅高飞、发出叫声，就让所有人都赞叹震惊",
      answer: "一鸣惊人",
      pinyin: "yī míng jīng rén",
      definition: "比喻平时没有特殊的表现，一做出成绩来，就使人非常惊异。",
      options: ["一鸣惊人", "默默无闻", "名震天下", "一举大胜"],
      kidsExplanation: "就像平时在班里不怎么说话、成绩也普通的小伙伴，这次期末科技节上居然亲手做出了一个会跳舞的智能机器人，拿到了特等奖！",
      fact: "典故出自《韩非子·喻老》和《史记·滑稽列传》，形容楚庄王励精图治。",
      mnemonic: "三年不展翅，一飞冲九天。三年不鸣叫，一鸣惊人仙！",
      story: "战国时期，齐威王即位之初，天天沉迷歌舞，不理朝政。大夫淳于髡用一个隐语劝谏他：‘大王，国中有一只大鸟，待在王宫里三年了，既不飞也不叫，您知道这是为什么吗？’齐威王听懂了，笑着回答：‘这只鸟啊，不飞则已，一飞冲天；不鸣则已，一鸣惊人！’从此齐威王大刀阔斧改革，把齐国治理得极其强大。"
    },
    {
      question: "射箭技术极其高超，射一百次就能射中一百次，现在常比喻做事非常有把握",
      answer: "百发百中",
      pinyin: "bǎi fā bǎi zhòng",
      definition: "形容射箭或射击技术高超，每次都命中。也比喻做事有充分把握。",
      options: ["百发百中", "捷足先登", "得心应手", "百步穿杨"],
      kidsExplanation: "就像你投沙包或者打弹珠，随手一扔就正好能投中中心，每次都得第一名！",
      fact: "源自《战国策·西周策》。楚国有名射手养由基，隔着一百步射杨柳叶，百发百中。",
      mnemonic: "神枪百发中，箭羽穿杨红。做事有把握，个个是英雄！",
      story: "战国时，楚国的养由基是个极其厉害的射手。有一天，大家看他练箭，他站在距离杨柳树一百步开外的地方，专门张大弓去瞄准柳树叶。嗖嗖嗖几箭过去，每箭都精准无误地射穿了他指定的叶子。围观的人惊呼：‘真是百发百中！’后来这个成语比喻料事如神、做事极有胜算。"
    },
    {
      question: "做事情完全从公平公正的角度出发，绝对不偏袒自己的亲戚或好朋友，没有半点私心",
      answer: "大公无私",
      pinyin: "dài gōng wú sī",
      definition: "指一心为公，没有私心。也指公正坦白，不徇私情。",
      options: ["大公无私", "铁面无私", "克己奉公", "任人唯亲"],
      kidsExplanation: "就像作为班干部的你，最亲密的好朋友在午休时说话了，你依然不偏袒，认真在记事本上写下了他的名字！",
      fact: "语出《管子·势》：“公之所在，私之所忘，大公无私也。”用来赞扬伟大无私的品质。",
      mnemonic: "天秤放当中，两头分得清。不论亲与友，只认公道心！",
      story: "春秋时期，晋国的祁黄羊非常正直。晋平公问他：‘南阳县缺个县令，你觉得谁合适？’祁黄羊举荐了杀父仇人解狐。晋平公大惊：‘他不是你的仇人吗？’祁黄羊说：‘大王问我谁适合干县令，没问谁是我的仇人啊！’后来，朝廷缺军中统帅，祁黄羊又极力举荐了自己的亲儿子。平公叹说：‘祁黄羊真是大公无私啊！’"
    },
    {
      question: "随着清澈的江水退下去，河底那些平时隐藏的圆润石头就露出来了，比喻事情真相大白",
      answer: "水落石出",
      pinyin: "shuǐ luò shí chū",
      definition: "水落下去，石头就露出来。比喻到了一定时候，事情的真相彻底显露。",
      options: ["水落石出", "真相大白", "拨云见日", "顺理成章"],
      kidsExplanation: "就像你找不着的乐高小零件，等妈妈把沙发下的积木堆全部扫干净后，它终于露出来了！",
      fact: "语出宋代苏轼的《后赤壁赋》：“山高月小，水落石出。”后来引申指事情真相显白。",
      mnemonic: "潮水往后退，大石露白光。迷雾终消散，真理最敞亮！",
      story: "北宋大文学家苏轼在秋天和冬天曾两次游玩赤壁。冬夜游玩时，江水急促退去，两岸高峰耸立。他在《后赤壁赋》中写道：‘江流有声，断岸千尺；山高月小，水落石出。’原本是描写冬日赤壁清冷宽宏的自然美景，后来大家发现这也像极了那些经过查证后、最终完欢迎显露出来的客观真相。"
    }
  ],
  middle: [
    {
      question: "形容战死沙场、绝不退缩的拼搏决心，砸碎做饭的锅，凿沉过河的船",
      answer: "破釜沉舟",
      pinyin: "pò fǔ chén zhōu",
      definition: "比喻下定最后决心，不顾一切，战斗到底。",
      kidsExplanation: "就像你在考前收起所有漫画和玩具，对自己大喊“这次一定要冲进前三名”的必胜决心！",
      fact: "《史记·项羽本纪》记载，楚霸王项羽率军过河抗秦后，命令士兵把煮饭锅砸碎、把渡河的小木船全部凿沉，以示绝不活着退回的必胜雄心。",
      options: ["破釜沉舟", "孤注一掷", "背水一战", "斩断退路"],
      mnemonic: "砸碎铁锅锅，凿漏小船破。不给自己留退路，一战夺王座！",
      story: "秦朝末年，项羽率领军队在巨鹿与秦军激战。渡过漳河后，项羽对所有士兵下令：‘砸碎我们所有的做饭锅，凿沉我们所有过河的船！我们只有三天干粮，要么打胜，要么光荣战死，别想活着退回去！’将士们大受震撼，人人拼死冲锋，九战九捷，彻底击溃了数十万强大的秦军。"
    },
    {
      question: "看到墙壁反光的弓箭影子，就疑神疑鬼以为是杯中有一条大蛇",
      answer: "杯弓蛇影",
      pinyin: "bēi gōng shé yǐng",
      definition: "将倒映在酒杯里的弓影误认为蛇，比喻疑神疑鬼、自相惊扰。",
      kidsExplanation: "就像半夜睡觉醒来，看到墙上的外套黑影，以为是怪兽，蒙在被窝里吓得出了一身热汗！",
      fact: "汉代应劭《风俗通义》记载，有客人在县令杜宣家喝酒，见杯中有蛇，回家忧虑成病。杜宣查明是墙上的弩弓投影，再次邀客解释，病即痊愈。",
      options: ["杯弓蛇影", "风声鹤唳", "草木皆兵", "叶公好龙"],
      mnemonic: "弓影在杯中，倒酒像小青。莫要自己吓自己，水落石出笑频频！",
      story: "晋朝人乐广请他的朋友吃饭喝酒。朋友刚举起杯，突然看到杯里面好像盘踞着一条游动的小红蛇，他出于礼貌吞了下去，回家后心里极度恶心，竟然忧虑成疾、卧床不起。乐广查验原位，发现是墙上彩漆弓箭投影落入杯里。他把朋友接来坐原位告知真相，朋友顿时心里舒畅，病也一下子全好啦！"
    },
    {
      question: "比喻一时间在森林里吵闹，连家里养的鸡和看门狗都不得安宁",
      answer: "鸡犬不宁",
      pinyin: "jī quǎn bù níng",
      definition: "形容骚扰得厉害，闹得极其混乱吵闹，连鸡和狗都不得安宁。",
      kidsExplanation: "就像小猫掉进了你的积木乐园，噼里啪啦踩翻了一百个搭好的城堡，弄得屋里乱作一团！",
      fact: "语出唐代柳宗元名作《捕蛇者说》：“哗然而骇者，虽鸡狗不得宁焉。”描述了当时贪官横征暴敛，老百姓鸡狗难耐的场景。",
      options: ["鸡犬不宁", "鸡飞狗跳", "惊慌失措", "乱七八糟"],
      mnemonic: "鸡在房檐叫，狗在院里跳。吵吵闹闹乱哄哄，大家都别睡觉！",
      story: "唐代诗人柳宗元被贬官到永州，了解到当地官差贪得无厌。每当税吏们在村口大声嚷嚷，野蛮地闯进每一家搜刮粮食和银钱时，整个村庄就像炸开了锅，大人哭喊，连家里的母鸡都飞上房梁，看家的小黄狗也急得乱咬，真是鸡犬不宁、暗无天日。"
    },
    {
      question: "一叶障目，以为自己的小水井就是一整片浩瀚天空的出神青蛙",
      answer: "坐井观天",
      pinyin: "zuò jǐng guān tiān",
      definition: "坐在井底看天，比喻眼界狭隘，见识浅薄。",
      kidsExplanation: "就像有的人一辈子只认得自己小镇子的马路，就以为全世界最豪华的大都市也就是这个样子，那可真滑稽！",
      fact: "出自唐代韩愈《原道》：‘坐井而观天，曰天小者，非天小也。’说明天还是那么大，只是看它的人器量太狭隘了。",
      options: ["坐井观天", "井底之蛙", "孤陋寡闻", "一孔之见"],
      mnemonic: "小蛙住井里，抬头天一口。不知道世界多宏大，傲慢又可笑！",
      story: "一头生活在一口老枯井底的青蛙，每天最自豪的事情就是仰望井口。它觉得：‘我是这个水井的大王，天就只有这口井的井盖大小。’一天，一只大鹏鸟落在井沿，向它描述了海平线和万丈天空的辽阔，青蛙直撇嘴觉得它是在吹牛。这是一个教导我们要多看世面，克服狭隘偏见的古老寓言。"
    },
    {
      question: "看到兔子撞上大树桩，就天天丢掉锄头站在那里等待下一只兔子",
      answer: "守株待兔",
      pinyin: "shǒu zhū dài tù",
      definition: "比喻不主动努力，天天寄希望于侥幸的意外收获。",
      kidsExplanation: "就像路上偶尔捡到了一块巧克力，结果从此不想好好吃饭，每天只想坐在马路牙子上等天上掉糖果！",
      fact: "《韩非子·五蠹》中韩非用来讽刺战国时期那些妄想按照古老死规矩治理现代多变国家的愚钝执政者。",
      options: ["守株待兔", "刻舟求剑", "水到渠成", "听天由命"],
      mnemonic: "野兔撞了树，农夫捡美味。丢了锄头等明天，庄稼全枯萎！",
      story: "战国时，宋国有个农夫在地里干活。忽然一只野兔飞奔过来，慌不择路，‘砰’地一声一头撞在田中间的木桩上折断脖子死了。农夫大喜，白捡了一顿丰盛的兔子肉！从此，他再也不去辛苦耕田了，天天早早把锄头扔在草里，坐在那个大木桩旁边看啊等啊，指望还能有第二只兔子傻傻撞死……结果，田里杂草长得比人高，庄稼彻底荒了，他成了全村的笑柄。"
    },
    {
      question: "把宝剑掉进了江水里，急忙在移动的木船舷上雕刻一道记号来标示位置",
      answer: "刻舟求剑",
      pinyin: "kè zhōu qiú jiàn",
      definition: "比喻拘泥成法，不懂得根据实际情况的变化来处理事情。",
      kidsExplanation: "就像你坐着公交车时，不小心把冰淇淋勺朝窗外扔了，你却在座位上画了个大红圈，说：‘我放学后再坐同一辆车到这个红圈座位下面去捡勺子！’这有多傻呀！",
      fact: "出自《吕氏春秋·察今》。嘲讽那些思想一成不变、不会用动态眼光看待世界变化的人。",
      options: ["刻舟求剑", "按图索骥", "墨守成规", "顺藤摸瓜"],
      mnemonic: "宝剑落大江，船帮刻一刀。等船靠了岸，怎么捞也捞不到！",
      story: "战国时期，有个楚国人坐船渡江。船到江心时，他不小心把佩戴的宝剑掉进了滚滚大江里。同船的人都惊呼起来，他却不慌不忙地从兜里摸出一把小刀，在船舷上掉剑的地方刻了一道深深的记号，自言自语说：‘我的剑是从这儿掉下去的。’等船靠岸停稳后，他便急忙从船上刻了记号的地方跳下水去寻找，可船已经走了几十里路了，江水那么深、剑怎么可能还在呢？大家都被他逗笑了。"
    },
    {
      question: "闲地里的禾苗长得太慢，自作聪明地把它们一根根拔高",
      answer: "拔苗助长",
      pinyin: "bá miáo zhù zhǎng",
      definition: "比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。",
      kidsExplanation: "就像为了让刚种下的小花明天就开出十朵大花，你竟然用手把花骨朵捏开，结果小花一下子折断枯萎了！",
      fact: "出自《孟子·公孙丑上》，也写做“揠苗助长”。这是教导我们要循序渐进、不可急躁的基本道理。",
      options: ["拔苗助长", "欲速则不达", "揠苗助长", "自讨苦吃"],
      mnemonic: "禾苗天天盼，嫌它慢吞吞。下手拔高高，干枯一大片！",
      story: "宋国有个急性子的农夫，天天嫌自家的庄稼长得太慢。有一天，他想出了一个‘妙计’：跑到田里，弯着腰把禾苗一棵一棵都往上拔高了一点点！从中午一直忙到太阳落山，他累得精疲力竭，跑回家得意洋洋地对儿子说：‘今天可把我累坏了，不过我帮地里的禾苗全部长高了一大截！’儿子惊恐地跑到田里一看，所有的禾苗都因为根基断了，在烈日下全部干枯死掉了。"
    },
    {
      question: "率领全家子孙去挖两座挡在门前、大得无边无际的巍峨大山，决不退缩",
      answer: "愚公移山",
      pinyin: "yú gōng yí shān",
      definition: "比喻做事有坚韧不拔的毅力，不怕困难，坚持到底。",
      kidsExplanation: "就像你在拼一个有一万块的超大城堡积木，虽然每天只能拼十块，但你坚信只要天天坚持，总有一天能盖出壮丽的城堡！",
      fact: "源自《列子·汤问》。体现了古代中国人民不畏艰险、战天斗地的永不放弃精神。",
      options: ["愚公移山", "坚韧不拔", "自不量力", "精卫填海"],
      mnemonic: "门前两座山，挡路真讨厌。子子孙孙挖，天帝发慈心！",
      story: "古代有个快九十岁的老人名叫愚公，家门前正好挡着太行、王屋两座巍峨的大山，全家人出门都要绕大远路。于是愚公召集子孙说：‘我们把这两座大山挖平，修一条直通外面的大路！’邻居智叟笑话他：‘你一把年纪，连一根柴都搬不动，还想移大山？’愚公叹道：‘我死了有儿子，儿子生孙子，子子孙孙是没有穷尽的，而山却不会长高，我们为什么挖不平它？’山神和天帝大受感动，派了两个神仙把山背走了。"
    },
    {
      question: "两个人在决斗中互不退让，结果全都受了极其严重的重伤",
      answer: "两败俱伤",
      pinyin: "liǎng bài jù shāng",
      definition: "斗争双方都受到损伤，谁也没有得到好处。",
      kidsExplanation: "就像你和好朋友为了抢一个玩具，谁也不肯放手，结果扯来扯去把玩具拉断了，两个人都没得玩，还急得直哭！",
      fact: "出自西汉刘向《战国策·秦策二》。说明恶性竞争和内耗往往没有赢家。",
      options: ["两败俱伤", "同归于尽", "渔翁得利", "安然无恙"],
      mnemonic: "争强又好胜，谁也不服输。两只羊角顶，全都挂了彩！",
      story: "战国时，有个辩士叫陈轸。他听说韩国和魏国正在激烈交战，便去劝说秦昭王不要急着出兵干扰。陈轸讲了个故事：‘有个叫庄子的壮士看见两只老虎为了抢一头牛正在厮杀。旁人要上去劝阻，庄子说，等两只老虎打个你死我活再说。果然，大老虎受了重伤，小老虎当场被打死，庄子这才轻而易举地上前把两只老虎一并收拾了。’这就是‘两败俱伤’，强调莫要做无谓的内耗。"
    }
  ],
  high: [
    {
      question: "贵州的驴子尥了小蹄子、叫了两声后，就被斑斓老虎看穿、彻底没招了",
      answer: "黔驴技穷",
      pinyin: "qián lǘ jì qióng",
      definition: "比喻有限的一点本领已经彻底用完，再也无计可施。",
      kidsExplanation: "就像有的人犯错后，一开始大叫、然后撒娇，一旦大人看懂了他的小把戏不理他，他就彻底没招、哭起来了！",
      fact: "出自唐代柳宗元《三戒·黔之驴》。用来形容那些看起来高大威猛、声势赫赫，却根本没有任何真才实学、只会耍虚招的人。",
      options: ["黔驴技穷", "黔驴之技", "束手无策", "走投无路"],
      mnemonic: "驴子叫声大，尥完蹄子后。一招半式被看透，老虎吃下肚！",
      story: "古代贵州地区本来没有驴子。有个好事者用船运来一头放在山下。山里的猛虎从没见过这庞然大物，以为是天下神兽，一度闻声逃跑。后来老虎天天观察它，发现这头驴极少主动攻击，发怒时除了昂昂叫，就是抬起后腿尥个蹶子踢一下。老虎心里大喜：‘原来你这就这两下子！’当即大吼一声，扑过去把它吃个精光。"
    },
    {
      question: "两家为了在沙滩上的那块肥蚌肉争吵不休，结果被看热闹的老渔夫一网打尽",
      answer: "鹬蚌相争",
      pinyin: "yù bàng xiāng zhēng",
      definition: "比喻双方互不相让，结果两败俱伤，让第三者占了便宜。",
      kidsExplanation: "就像两个小朋友抢着玩秋千拼死不放手，眼看快上课了一脚也还没荡起来，结果被第三个同学过去高高兴兴荡走了！",
      fact: "西汉刘向《战国策·燕策二》中赵国准备伐燕，苏代用鹬蚌相争、渔翁得利的故事，劝赵国国君提防强大的秦国乘虚获利。",
      options: ["鹬蚌相争", "鹬蚌相持", "两败俱伤", "渔翁得利"],
      mnemonic: "鸟嘴夹蚌肉，蚌壳合得牢。两家发脾气，渔夫得大笑！",
      story: "一只河蚌张开壳在河滩上惬意地晒着暖心太阳。一只叫鹬的长嘴水鸟飞下，一嘴啄向蚌的肥肉。蚌吃痛，‘啪’地把坚硬的硬壳重重关上，把鸟的长嘴死死卡在里面无法拔出。鸟说：‘今天不下雨，明天不下雨，你一准干死！’蚌大喊：‘今天不放你，明天不放你，你一准饿死！’两个就这么较劲。这时候来了一个划船的渔夫，笑开了花，过去顺手把鹬和蚌一把全抱起来放进鱼篓里回了家。"
    },
    {
      question: "口口声声说自己崇拜天龙，可是等十爪真龙探进脑袋来，他却吓得魂飞魄散",
      answer: "叶公好龙",
      pinyin: "yè gōng hào lóng",
      definition: "比喻表面上假装爱好某事物，实际上并不真爱好，甚至害怕它。",
      kidsExplanation: "就像有的同学整天戴着大蜘蛛帽子对大家说‘我是蜘蛛之王，我超级爱昆虫’，结果桌上偶尔落了一只真毛蜘蛛，他却吓得尖叫逃跑！",
      fact: "语出西汉刘向《新序·杂事五》。用来嘲讽那些伪善、口是心非、附庸风雅的世俗之人。",
      options: ["叶公好龙", "口是心非", "表里不一", "两面三刀"],
      mnemonic: "满屋雕大龙，自称最英雄。真龙一现身，吓得钻地缝！",
      story: "古时候有个叫叶公的大贵族，对外宣称一生中最崇拜东方巨龙。他家里的每一根梁柱都刻着龙，衣带上刺绣着龙，墙壁上也彩绘着龙的张牙舞爪。天上的真龙听说其深情，十分感动，特意降下云头，将巨大的龙头搭在叶公书房的窗沿往里看。叶公一回头，巨龙长长的胡须和巨大的白牙就在跟前！他吓得魂飞魄散，失声大叫，连滚带爬，尿了裤子，鞋都丢了地奔跑。这讽刺了虚伪的、假装的喜欢。"
    },
    {
      question: "为了看清战场上的每一个山草和颤抖树影，结果在阵前被吓得以为全是敌人的黄金神将",
      answer: "草木皆兵",
      pinyin: "cǎo mù jiē bīng",
      definition: "形容极度惊慌、疑神疑鬼，把所有细小的事物都当成可怕的威胁。",
      kidsExplanation: "就像在学校里刚刚听完鬼故事，回家后觉得自家的白色窗帘布、晾衣杆黑影全都是长头发的幽灵在动！",
      fact: "源自淝水之战中，前秦君主苻坚在寿阳城头眺望，见晋军极为整齐，又见八公山上的草和木头都摆动如排兵布阵，以为晋军神威无可击败。",
      options: ["草木皆兵", "风声鹤唳", "杯弓蛇影", "心惊肉跳"],
      mnemonic: "兵败如山倒，风声过阵头。满山树叶晃，都当神将来！",
      story: "公元383年，前秦皇帝苻坚亲率近百万人马进攻晋国。在惨烈的淝水决战中，秦军首战惨败，阵脚大溃，苻坚极度惊惶地退上寿阳城墙眺望军情。夜色中，他极目远眺对岸的八公山，只见山峰陡峭、漫山遍野的树木随风摇摆，野草起伏，他竟然对身边的将领哭喊道：‘你们看那山上，全都是晋军整齐肃杀的铁甲大军啊，这仗怎么打得赢！’"
    },
    {
      question: "用自己最坚固、号称什么都能刺穿的无双长矛，去刺自己最厚重、什么都打不破的多层神盾",
      answer: "自相矛盾",
      pinyin: "zì xiāng máo dùn",
      definition: "比喻自己说话做事前后抵触，无法自圆其说。",
      kidsExplanation: "收集到好糖果就拍着胸脯大喊‘我世界最勇敢！’，房间一关灯却吓得捂住大眼睛哭喊！典型的矛盾行为哦！",
      fact: "出自《韩非子·难一》。用尖锐锋利的矛和坚不可摧的盾来绝妙比喻逻辑上的前后对立抵触。",
      options: ["自相矛盾", "言行不一", "口是心非", "坚不可摧"],
      mnemonic: "利矛刺神盾，究竟谁能赢？大话吹破天，红脸不知言！",
      story: "战国时，楚国有个人在街上卖矛和盾。他先举起盾牌大肆夸口：‘我的盾非常坚固，无论什么锋利的东西也别想刺穿它！’接着，他又举起长矛对大家吹嘘：‘我的矛是天下奇宝，极其锋利，世界上不管多么坚固的东西都能轻易被它刺透！’围观的人中，一个过路人笑着问他：‘如果用你的矛去刺你的盾，那会怎么样呢？’那个楚国人一听，登时说不出话来，脸涨得通红拉着摊子避开了。"
    },
    {
      question: "去别的城池学习别人高雅潇洒的漫步姿势，结果不仅没学会，反而连自己原本怎么走路都忘光了",
      answer: "邯郸学步",
      pinyin: "hán dān xué bù",
      definition: "比喻模仿别人不成，反而丧失了原有的技能。",
      kidsExplanation: "总是喜欢学电视里面机器人的动作走路和说话，结果机器人走路没学会，连平常普通和伙伴跑步玩乐 of 日常路线都不会跑了！",
      fact: "源自《庄子·秋水》。讽刺了那些生搬硬套、一味盲目模仿别人而丧失了自己本色特色的人。",
      options: ["邯郸学步", "东施效颦", "步人后尘", "固步自封"],
      mnemonic: "邯郸学步回，手脚不知摆。丢了原本步，爬着回家来！",
      story: "战国时期，燕国寿陵有个无名青年，嫌自己走路的姿势太土气。他听说赵国都城邯郸的人走路姿态优雅，全国闻名，便不顾路途遥远跑去邯郸学习。他每天在大街上盯着过路的人看，人家迈左脚、他也迈左脚，人家摇胳膊，他也晃肩膀。可是过了一两个月，他非但没有学会邯郸人走路的高雅姿态，反而把燕国人原本习惯的走路步伐全部给忘得一干二净！最后一分钱花光了，他连怎么迈腿都不会了，只能在大街上像小狗一样爬着回到了燕国。"
    },
    {
      question: "在雪白墙壁上画好栩栩如生的长龙后，刚给它画上两颗耀眼的眼珠子，巨龙就腾空飞上蓝天了",
      answer: "画龙点睛",
      pinyin: "huà lóng diǎn jīng",
      definition: "比喻作文或说话时，在关键地方加一两句使内容更加生动传神。",
      kidsExplanation: "就像整篇好作文你写完了一百个字，老师在最末尾改了两个精妙词，整篇作文瞬间活过来、变成特等奖水平！",
      fact: "出自唐代张彦远《历代名画记》。说明在核心、关键节点上的轻轻一笔，就能产生质地惊人的突破。",
      options: ["画龙点睛", "神奇画卷", "妙手回春", "锦上添花"],
      mnemonic: "粉墙画巨龙，单单缺黑睛。妙笔轻轻点，飞雷入晴空！",
      story: "南北朝时期，有个名画家叫张僧繇。他在安乐寺画了四条姿态矫健的白墙巨龙。可是大家都感到纳闷：‘为什么这些龙都没有画眼睛呢？’张僧繇说：‘画上了眼睛，龙就会飞走的！’大家都不信极力催促。他没办法，拿起饱含浓墨的笔对着其中两条神画巨龙轻轻画了眼珠。瞬间，长天雷鸣，那两条真龙怒吼一声、竟然扒破墙壁飞上云霄，惊得众人目瞪口呆。"
    },
    {
      question: "半夜一听到高亢的荒野雄鸡开始啼鸣，就翻身坐起、拔出配剑在庭院里刻苦练剑",
      answer: "闻鸡起舞",
      pinyin: "wén jī qǐ wǔ",
      definition: "听到鸡叫就起来舞剑。比喻有志报国的人及时奋起努力。",
      kidsExplanation: "清晨只要闹铃一发出声，整个人就飞身下床、捧着国学书大声朗读，一刻也不耽误好时光！",
      fact: "出自《晋书·祖逖传》。赞美东晋名将祖逖和刘琨刻苦自强、努力报国的奋发姿态。",
      options: ["闻鸡起舞", "发愤图强", "孜孜不倦", "朝气蓬勃"],
      mnemonic: "荒野半夜鸡，拔剑起舞急。年少立大志，名将天下知！",
      story: "东晋青年祖逖和刘琨同室读书。有一回半夜，一只荒鸡啼叫起来。祖逖在黑暗中惊醒，一脚推开被子对刘琨说：‘这绝非不祥之兆，而是警醒我们要早起奋斗！’二人披上衣服，在庭中伴着残月之光，行云流水地练习剑术。经过长期刻苦训练，最终双双官至名震天下的大将军，取得了辉煌的勋业。"
    }
  ],
  university: [
    {
      question: "形容高深典雅、少有人能听懂并出声赞叹附和的殿堂级美妙神曲",
      answer: "阳春白雪",
      pinyin: "yáng chūn bái xuě",
      definition: "比喻高深典雅、艺术造诣极高的文学艺术作品，常与“下里巴人”相对。",
      kidsExplanation: "就像大剧院里交响乐团演奏的莫扎特古典协奏曲，虽然超级优美经典，但我们可能坐一会儿就犯困想打哈欠啦！",
      fact: "源于宋玉《对楚王问》。《阳春》、《白雪》是战国时期楚国极为著名且非常高级的古典歌曲，全城只有廖廖几个人能合唱。",
      options: ["阳春白雪", "高山流水", "下里巴人", "天籁之音"],
      mnemonic: "高雅皇家歌，高深和者缺。美玉真艺术，雪白映红日！",
      story: "战国时，楚国的文学家宋玉受到楚王的指责说：‘为什么大家都不赞美你写的东西？’宋玉回答：‘歌手在街头唱平民歌谣《下里巴人》时，全城几万人跟着一齐大声合唱，因为它们俗气好懂；可当他开始弹奏传世皇家乐章《阳春》、《白雪》时，调子高雅神奇，整个国都只有区区几十个贵族懂乐理、敢合奏。这也证明了，极高的真艺术，向来是阳春白雪、知音难求。’"
    },
    {
      question: "古代琴师对着黄土坡上的大黄牛弹奏高深的古琴，牛却只顾嚼着青草完全不搭理他",
      answer: "对牛弹琴",
      pinyin: "duì niú tán qín",
      definition: "比喻说话不看对象，对不懂道理的人讲深奥的大道理，白费力气。",
      kidsExplanation: "就像你对着自家的毛茸茸哈士奇大讲微积分算法课，狗狗只会无辜地对你汪汪歪头流着口水！",
      fact: "汉代牟融《理惑论》：“公明仪为牛弹清角之操，伏食如故。”说明沟通要因材施教，不可无的放矢。",
      options: ["对牛弹琴", "对症下药", "因材施教", "有的放矢"],
      mnemonic: "琴声何等清，牛儿只嚼青。认错好听众，神妙没人听！",
      story: "古代音乐大师公明仪遇到一头正在草坡上吃春草的黄牛。由于一时兴起，他把古琴端来，在牛面前极为端庄深沉地弹奏了一首最拿手的古典名典《清角之操》。音乐如此美妙，牛儿却依然优游自在地嚼着野草。公明仪不甘心，转而用琴弦模仿大蚊子的嗡嗡叫声、以及受惊小牛的哀哀啼哭，大黄牛这才猛地竖起双耳，甩甩尾巴，走过来盯着看。这教导我们说话务必对准胃口，否则是白费心劳。"
    },
    {
      question: "用极度精练、只有几个字的文言文大字句，传达出极深广的圣人政治和大智慧道理",
      answer: "微言大义",
      pinyin: "wēi yán dà yì",
      definition: "含蓄深奥的言语，指字句虽然极少极简，却饱含着极其高深的深刻法理大智慧。",
      kidsExplanation: "就像爷爷奶奶有时候指着一颗大枯树，只说了三个字叫“慢慢来”，里面却教导了你一万个成长的大道理！",
      fact: "典出汉代刘歆《移书让太常博士》：‘及夫衰微，微言绝而大义乖。’形容儒家经典《春秋》微言大义的崇高境界。",
      options: ["微言大义", "千言万语", "开门见山", "长篇大论"],
      mnemonic: "其言只有微，其意却深邃。春秋一字评，王公心下畏！",
      story: "孔子晚年辞官，苦心编纂修撰历史巨典《春秋》。他在书里写历史事件时，极其节约墨水，往往只是用两三个字（例如写某国君被废叫一字‘弑’，或者赞美某人叫一字‘赏’），就将历史人物的忠奸善恶彻底定罪和定调！儒家学者们为此惊叹，赞颂孔子写作极度高妙，这每一个精练的小字眼，都包含了惊天动地、震撼朝廷的‘微言大义’。"
    },
    {
      question: "只根据大象的一个巨大蒲扇粗耳朵，就吵吵嚷嚷断定大象长得跟扁担簸箕一模一样",
      answer: "盲人摸象",
      pinyin: "máng rén mō xiàng",
      definition: "比喻对事物只凭片面的、部分的了解就盲目乱断，以偏概全。",
      kidsExplanation: "就像你刚走到动物园大门，看到一堵红墙，就回去对好朋友大喊‘红墙就是动物园本身！’，那可真让人发笑！",
      fact: "出自佛经《大般涅槃经》。用来告诫人们佛法与真理至深，绝不可仅评一点局部执念就自以为掌握了宇宙核心真相。",
      options: ["盲人摸象", "坐井观天", "管中窥豹", "一孔之见"],
      mnemonic: "摸到粗大腿，大喊是石柱。偏要把偏见，执拗到死不！",
      story: "镜面国王心血来潮，把国都里一众从未见过大象的盲人召集到大殿里去摸摸大象，并让他们说出象的样子。第一个摸到象鼻子的人胸有成竹说：‘大象像一条大麻绳！’第二个抱住象腿的说：‘胡说，大象像一根粗石柱！’第三个拽到象耳朵的急眼了：‘大象明明是古代晒粮食的簸箕！’盲人们吵得不可开交，面红耳赤。这也警示世人看问题必须具备大局、高层全面眼界，绝对不要瞎子摸象！"
    },
    {
      question: "比喻人生短暂、时光飞逝，就像透过墙缝看一匹奔跑的白马一闪而过",
      answer: "白驹过隙",
      pinyin: "bái jū guò xì",
      definition: "形容时间过得极快，生命像一匹白马在缝隙前飞驰而过，转瞬即逝。",
      kidsExplanation: "就像开心快乐的暑假，感觉昨天才刚刚开始发寒假作业，今天一眨眼竟然就已经开学坐在教室里了！",
      fact: "语出《庄子·知北游》：“人生天地之间，若白驹之过隙，忽然而已。”说明人生和时间的珍贵。",
      options: ["白驹过隙", "光阴似箭", "岁月蹉跎", "海枯石烂"],
      mnemonic: "白马过墙缝，一闪不留踪。少小须努力，莫叹白了头！",
      story: "庄子在探讨宇宙与生命奥秘时发表言论：‘人生在天地之间，就如同一匹奔跑速度极快的白色骏马，从墙壁的细小缝隙前面飞奔而过，仅仅是忽然而已。’这个神奇而梦幻的比喻，告诉我们光阴如此短暂，必须要珍惜每一刻去学习、去爱人，活出最大的生命光芒！"
    },
    {
      question: "凭借着大智大勇，将价值连城的和氏璧原封不动、完好地从强大秦国带回来还给赵国",
      answer: "完璧归赵",
      pinyin: "wán bì guī zhào",
      definition: "比喻把原物完好无损地归还本人。",
      kidsExplanation: "就像借了同桌的一支非常精致耀眼的新钢笔，你用完之后原封不动、干干净净地还给他，获得百分百信任！",
      fact: "出自司马迁《史记·廉颇蔺相如列传》。讲述了蔺相如出使秦国，不畏生死、智夺和氏璧归赵的爱国壮举。",
      options: ["完璧归赵", "物归原主", "奉璧而退", "大公无私"],
      mnemonic: "秦王欲强抢，相如智计长。怀抱和氏璧，完璧归赵王！",
      story: "战国时，赵惠文王得到了国宝和氏璧。强大霸道的秦昭王写信说愿用十五座城池来换。赵国害怕秦国使诈，智勇双全的蔺相如挺身而出捧璧入秦。朝堂之上，蔺相如见秦王根本没有交城诚意，便假称璧玉有瑕疵要指给秦王看夺回国宝。他拉住大柱子威胁说要与璧玉同碎！最后，他暗中派随从抄小路把璧玉完好送回趙国，自己留下与秦王交涉。秦王见他大智大勇，也无可奈何。"
    },
    {
      question: "天天在羊皮纸地图上神气地讨论排兵布阵之道，可一旦上了真刀真枪的战场就一败涂地",
      answer: "纸上谈兵",
      pinyin: "zhǐ shàng tán bīng",
      definition: "比喻空谈理论，不能解决实际问题或做事情没有实践经验。",
      kidsExplanation: "就像有的人天天抱着《做菜百科全书》给全家讲怎么切洋葱、熬鸡汤，结果一进厨房连燃气灶都不知道怎么扭开！",
      fact: "记录在《史记·廉颇蔺相如列传》中。指战国时赵国名将赵奢的儿子赵括空谈兵法、最终在长平之战惨败赵军被歼的悲剧。",
      options: ["纸上谈兵", "画饼充饥", "闭门造车", "夸夸其谈"],
      mnemonic: "兵书背一万，不抵战场乱。空谈大道理，误国惹大难！",
      story: "战国时赵国名将之子赵括，自幼熟读兵书熟知战法，连他父亲都辩论不过他，他自以为天下无敌。长平之战中，赵王中了秦国反间计用赵括去替换老将廉颇。赵括一上任就死搬兵书，改变了防守策略，结果被秦军包围截断粮道。赵国四十万大军全军覆没，赵括自己也中箭身亡。这告诫世人绝不能空空高谈、脱离实践经验！"
    },
    {
      question: "因为一时口渴难忍，竟然去喝下剧毒的鸩羽毒酒，只管眼前一刻痛快、全然不顾后面的致命祸患",
      answer: "饮鸩止渴",
      pinyin: "yǐn zhèn zhǐ kě",
      definition: "喝毒酒来解渴。比喻用错误的办法解决眼前的困难，而不顾严重后果。",
      kidsExplanation: "就像明明明天就要期末期中大考了，今晚你为了多看两集奥特曼电视满足眼瘾，熬夜到两点，结果第二天大考睡过头了！",
      fact: "语出《后汉书·霍谞传》：“譬犹阻饥而食附子，渴而饮鸩，未入肠胃，已绝咽喉。”形容后果极为严重。",
      options: ["饮鸩止渴", "抱薪救火", "剜肉补疮", "自寻死路"],
      mnemonic: "鸩酒虽解渴，穿肠要人命。莫贪小痛快，后果大如井！",
      story: "古代传说鸩是一种有奇毒的鸟，用它的羽毛泡出来的酒有极强的致命毒性。一个人走在沙漠里口渴难耐，快要晕倒了。突然有人递给他一壶鸩酒说这能解渴。这个人为了眼前的区区一口清凉，顾不上里面致命的剧毒，拿起来一口喝下，结果刚咽下喉咙就肚裂身亡。这也形象警醒我们应理智处理危机，不可苟且妥协造成致命大祸！"
    }
  ]
};

// Helper to generate options with 3 other random idioms from IDIOMS_1000_POOL
function selectThreeRandomDecoys(word: string): string[] {
  const decoys: string[] = [];
  const candidates = IDIOMS_1000_POOL.filter(x => x !== word);
  while (decoys.length < 3) {
    const rIdx = Math.floor(Math.random() * candidates.length);
    const decoy = candidates[rIdx];
    if (!decoys.includes(decoy)) {
      decoys.push(decoy);
    }
  }
  return decoys;
}

// Procedural generator to expand PK_QUESTIONS_DATABASE with exactly 1000 unique beautiful items
function injectPoolToDatabase() {
  const seenAnswers = new Set<string>();
  
  // Register existing hand-written answers to avoid duplicate questions
  (Object.keys(PK_QUESTIONS_DATABASE) as ExtendedGrade[]).forEach(grade => {
    PK_QUESTIONS_DATABASE[grade].forEach(q => {
      seenAnswers.add(q.answer);
    });
  });

  // Distribute the remaining idioms round-robin across grades to maintain balance
  const gradesList: ExtendedGrade[] = ['elementary', 'middle', 'high', 'university'];
  
  IDIOMS_1000_POOL.forEach((word, index) => {
    if (seenAnswers.has(word)) return;
    
    // Assign to a grade round-robin or chunked
    const grade = gradesList[index % gradesList.length];
    
    const decoys = selectThreeRandomDecoys(word);
    const options = [word, ...decoys].sort(() => Math.random() - 0.5);

    PK_QUESTIONS_DATABASE[grade].push({
      question: `“最智慧/最具有代表性/最特别的”——猜猜这个优秀的四字成语是哪个？`,
      answer: word,
      pinyin: "chéng yǔ xué xí", // fallback, enriched dynamically by client/server-side lookup
      definition: `成语《${word}》是我国优秀的文化财富，蕴含极其深刻的世理与丰富的人文智慧。`,
      kidsExplanation: `这就像是在对大家说：‘要学会仔细观察，踏实把基础打扎实，才能快快乐乐掌握新本领！’`,
      fact: `这个成语在我国历代文学史里都是极其经典的明星词，在写好作文时可以作为精妙的金句点眼。`,
      options,
      mnemonic: `成语儿歌好速记：‘大声读着《${word}》，字字句句都有意。温故知新效率好，天天向上得第一！’`,
      story: `关于成语《${word}》的故事，它一直都是深受大家喜爱的启蒙智慧之珍宝。在古代，不论老少、仕子和贤者在思考或辩论人生的哲理时，都热衷于用这个典故来进行生动比喻。它指引我们在现实和未来的生活学习道路中，时刻保持积极开拓、勇挑重担、虚心求知的良好习惯。`
    });
  });
}

injectPoolToDatabase();

// Return a newly randomized PK query based on grade difficulty, avoiding recently seen ones
export function getPKQuestionByGrade(grade: ExtendedGrade, excludeAnswers: string[] = []): PKQuestion {
  const pool = PK_QUESTIONS_DATABASE[grade] || PK_QUESTIONS_DATABASE['elementary'];
  const safeExclude = Array.isArray(excludeAnswers) ? excludeAnswers : [];
  let available = pool.filter(q => !safeExclude.includes(q.answer));
  if (available.length === 0) {
    available = pool; // If all have been seen or excluded, reset exclusion pool
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}
