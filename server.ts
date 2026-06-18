import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { USER_IDIOMS_POOL } from './src/idioms_data';
import { IDIOMS_1000_POOL } from './src/idioms_1000_pool';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const baseURL = process.env.GEMINI_API_BASE_URL || process.env.GEMINI_NEXT_GEN_API_BASE_URL || undefined;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  const clientOptions: any = {
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  };
  if (baseURL) {
    clientOptions.baseURL = baseURL;
    console.log(`[Gemini SDK] 正在使用自定义 API 中转网关地址 (Base URL): ${baseURL}`);
  }
  ai = new GoogleGenAI(clientOptions);
} else {
  console.warn("警告: 未检测到 GEMINI_API_KEY。动态AI成语生成与接龙功能将降级为本地预置库！");
}

const app = express();
app.use(express.json());

// Static library of pre-curated idioms with kid-friendly SVGs and mnemonic tips
// This ensures instant loading and perfect robustness if API is calling or fallback occurs!
const BASE_PRE_CURATED_IDIOMS: Array<{
  word: string;
  pinyin: string;
  definition: string;
  category: 'elementary' | 'middle' | 'high';
  illustration: string; // SVG code
  mnemonic: string;     // 一眼速记口诀
  kidsExplanation: string; // 适合小学生的比喻解释
  synonyms: string[];
  antonyms: string[];
  story: string;
}> = [
  {
    word: "自强不息",
    pinyin: "zì qiáng bù xī",
    definition: "思想、毅力与奋斗永不停息。自主努力向上，永不松懈懈怠。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Sky background -->
  <rect width="400" height="300" rx="20" fill="#FFF8E1" />
  <!-- Radiant golden sun -->
  <circle cx="330" cy="70" r="35" fill="#FFB300" opacity="0.9" />
  <circle cx="330" cy="70" r="25" fill="#FFE082" />
  <!-- Sunbeams -->
  <g stroke="#FFB300" stroke-width="4" stroke-linecap="round">
    <line x1="330" y1="20" x2="330" y2="10" />
    <line x1="330" y1="120" x2="330" y2="130" />
    <line x1="280" y1="70" x2="270" y2="70" />
    <line x1="380" y1="70" x2="390" y2="70" />
  </g>
  <!-- Green majestic hills -->
  <path d="M 0,220 Q 120,160 250,210 T 400,190 L 400,300 L 0,300 Z" fill="#81C784" />
  <path d="M 150,230 Q 280,180 400,220 L 400,300 C 300,300 200,300 150,300 Z" fill="#66BB6A" />
  <!-- Cute little green seedling breaking through rocks, stretching proudly -->
  <g transform="translate(140, 200)">
    <!-- Soil/Rocks -->
    <ellipse cx="0" cy="20" rx="40" ry="15" fill="#8D6E63" />
    <ellipse cx="0" cy="15" rx="25" ry="10" fill="#795548" />
    <!-- Stem growing up and curling towards the sun -->
    <path d="M 0,15 T 10,-30 T 40,-70" fill="none" stroke="#2E7D32" stroke-width="8" stroke-linecap="round" />
    <path d="M 0,15 T 10,-30 T 40,-70" fill="none" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" />
    <!-- Leaves -->
    <path d="M 18,-45 Q 40,-55 35,-35 Q 20,-30 18,-45 Z" fill="#4CAF50" stroke="#2E7D32" stroke-width="2" />
    <path d="M 40,-70 Q 60,-85 62,-65 Q 48,-55 40,-70 Z" fill="#81C784" stroke="#2E7D32" stroke-width="2" />
    <!-- Sparkles of motivation -->
    <g fill="#FFF" fill-opacity="0.9">
      <polygon points="5,-85 10,-80 5,-75 0,-80" />
      <polygon points="55,-105 58,-100 55,-95 52,-100" />
    </g>
  </g>
  <rect x="15" y="15" width="115" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="72" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#2E7D32" text-anchor="middle">🔥 自强不息</text>
</svg>`,
    mnemonic: "小树苗破土出，迎着烈日不怕苦！风吹雨打不退缩，天天向上拼劲足！记住：靠自己不断努力奋斗，永远不放弃就是自强不息。",
    kidsExplanation: "就像一颗小草在坚硬的石头缝里努力地发芽，不怕风吹雨淋，每一天都高高兴兴地迎着太阳长大！",
    synonyms: ["发愤图强", "奋发图强", "力争上游"],
    antonyms: ["自暴自弃", "得过且过", "不思进取"],
    story: "孔子在《易经》中写道：‘天行健，君子以自强不息。’意思是天体每天都在永不停息地快乐运转，有出息、有志向的小朋友也应该像天体一样，靠自己的努力每天积极向上，永远不懈怠偷懒。"
  },
  {
    word: "百折不挠",
    pinyin: "bǎi zhé bù náo",
    definition: "折：受挫折。挠：弯曲，引申为屈服。比喻即使经历成百上千次的挫折，依然坚强不屈服。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" rx="20" fill="#E3F2FD" />
  <!-- Clouds -->
  <path d="M 30,50 Q 50,30 70,50 Q 90,45 80,70 L 25,70 Z" fill="#FFF" opacity="0.8" />
  <path d="M 310,70 Q 330,50 350,70 Q 370,65 360,90 L 305,90 Z" fill="#FFF" opacity="0.8" />
  <!-- Waves -->
  <path d="M 0,200 Q 100,165 200,200 T 400,200 L 400,300 L 0,300 Z" fill="#90CAF9" />
  <path d="M 0,225 Q 120,200 240,230 T 400,220 L 400,300 L 0,300 Z" fill="#42A5F5" />
  <!-- Cute little red sailboat riding the wave, tilted but sturdyly pointing up -->
  <g transform="translate(180, 150) rotate(-10)">
    <!-- Sailboat Hull -->
    <path d="M -50,15 L 50,15 L 35,45 L -35,45 Z" fill="#D32F2F" stroke="#B71C1C" stroke-width="3" />
    <path d="M -50,15 C -20,15 20,15 50,15 M -35,45 L 35,45" stroke="#FFF" stroke-width="2" />
    <!-- Mast -->
    <line x1="0" y1="15" x2="0" y2="-75" stroke="#795548" stroke-width="5" stroke-linecap="round" />
    <!-- Sails -->
    <path d="M 5,-10 L 45,-10 Q 25,-40 5,-70 Z" fill="#FFF" stroke="#CFD8DC" stroke-width="2" />
    <path d="M -5,-10 L -35,-10 Q -20,-35 -5,-60 Z" fill="#FFEB3B" stroke="#FBC02D" stroke-width="2" />
    <!-- Friendly smiling eye on boat hull -->
    <circle cx="-10" cy="28" r="4" fill="#FFF" />
    <circle cx="-10" cy="28" r="2" fill="#000" />
    <path d="M 0,32 Q 5,36 10,32" stroke="#FFF" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <!-- Wind spray -->
    <path d="M 58,15 Q 75,10 70,25" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" />
  </g>
  <rect x="15" y="15" width="115" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="72" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#1565C0" text-anchor="middle">⛵ 百折不挠</text>
</svg>`,
    mnemonic: "大风浪打过来，小红船摇啊摇。遇到困难不怕疼，挺起胸膛哈哈笑！记住：摔倒100次，第101次还要站起来，这就是百折不挠。",
    kidsExplanation: "就像搭积木的时候，城堡倒塌了10次，你还是高高兴兴地去搭第11次，拍拍手说：‘我一定能搭得更棒！’",
    synonyms: ["坚韧不拔", "不屈不挠", "持之以恒"],
    antonyms: ["半途而废", "一蹶不振", "知难而退"],
    story: "东汉名将桥玄，性格刚毅，极富正义感。他在面对坏人绑架和重重危险时，始终毫不妥协、坚守公理。蔡邕在《桥公碑》中赞扬他忠诚正直、面对无数次困境和危险也绝不弯腰屈服，这正是‘百折不挠’的精神。"
  },
  {
    word: "持之以恒",
    pinyin: "chí zhī yǐ héng",
    definition: "持久地坚持下去。恒：恒心，常态。比喻做一件事情有恒心、不间断。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" rx="20" fill="#EDE7F6" />
  
  <!-- Subtle path / road -->
  <path d="M 0,220 Q 200,180 400,220 L 400,300 L 0,300 Z" fill="#CFD8DC" />
  <path d="M 0,240 Q 200,210 400,240 T 400,300 L 0,300 Z" fill="#D7CCC8" opacity="0.6" />
  
  <!-- Hourglass / Clock representing time and persistence -->
  <g transform="translate(200, 130)">
    <!-- Aura of persistence -->
    <circle cx="0" cy="0" r="60" fill="#FFF" opacity="0.5" />
    <!-- Footprints leading toward the right -->
    <g fill="#78909C" opacity="0.6" transform="translate(-160, 90)">
      <ellipse cx="20" cy="10" rx="8" ry="4" transform="rotate(-15, 20, 10)" />
      <circle cx="30" cy="5" r="2" />
      <circle cx="26" cy="4" r="1.5" />
      <circle cx="22" cy="4" r="1.5" />
      
      <ellipse cx="60" cy="20" rx="8" ry="4" transform="rotate(-15, 60, 20)" />
      <circle cx="70" cy="15" r="2" />
      <circle cx="66" cy="14" r="1.5" />
      <circle cx="62" cy="14" r="1.5" />
    </g>
    <!-- Giant running clock character -->
    <g transform="translate(0, -10)">
      <!-- Clock Face -->
      <circle cx="0" cy="0" r="45" fill="#FF8A65" stroke="#D84315" stroke-width="4" />
      <circle cx="0" cy="0" r="38" fill="#FFF" />
      <!-- Numbers indicator marks -->
      <line x1="0" y1="-38" x2="0" y2="-32" stroke="#D84315" stroke-width="3" />
      <line x1="0" y1="38" x2="0" y2="32" stroke="#D84315" stroke-width="3" />
      <line x1="-38" y1="0" x2="-32" y2="0" stroke="#D84315" stroke-width="3" />
      <line x1="38" y1="0" x2="32" y2="0" stroke="#D84315" stroke-width="3" />
      <!-- Hands -->
      <line x1="0" y1="0" x2="18" y2="-18" stroke="#37474F" stroke-width="4" stroke-linecap="round" />
      <line x1="0" y1="0" x2="-22" y2="5" stroke="#37474F" stroke-width="3" stroke-linecap="round" />
      <circle cx="0" cy="0" r="3" fill="#D84315" />
      <!-- Cute Eyes and Smile -->
      <circle cx="-13" cy="-12" r="3" fill="#37474F" />
      <circle cx="13" cy="-12" r="3" fill="#37474F" />
      <path d="M -5,-5 Q 0,0 5,-5" stroke="#37474F" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <!-- Legs running -->
      <path d="M -15,45 Q -25,60 -10,70" stroke="#D84315" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M 15,45 Q 25,55 35,70" stroke="#D84315" stroke-width="6" stroke-linecap="round" fill="none" />
    </g>
  </g>
  <rect x="15" y="15" width="115" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="72" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#673AB7" text-anchor="middle">⏰ 持之以恒</text>
</svg>`,
    mnemonic: "小座钟嘀嗒跑，一步一步停不了。每天努力一点点，最后夺得大奖杯！记住：做事情不松劲、不间断、永远坚持下去，就是持之以恒。",
    kidsExplanation: "就像练习弹琴或写字，每天只写15分钟，但这15分钟绝对不偷懒，天天都坚持这样做，一个月之后你就超级棒了！",
    synonyms: ["坚持不懈", "锲而不舍", "始终如一"],
    antonyms: ["半途而废", "三天打鱼两天晒网", "虎头蛇尾"],
    story: "荀子在《劝学》中说过：‘锲而舍之，朽木不折；锲 intelligence 锲而不舍，金石可镂。’意思是，如果你遇到困难就放弃，连腐烂的木头都刻不断；但如果你持之以恒地不停雕刻，就算是坚硬的金属和石头，也能雕刻出美丽的图案！"
  },
  {
    word: "磨杵成针",
    pinyin: "mó chǔ chéng zhēn",
    definition: "把坚硬粗大的铁棒磨成一根微小的缝衣针。比喻只要目标专一，下苦功，坚持不懈，就一定能成功。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF3E0" />
      <stop offset="100%" stop-color="#FFE0B2" />
    </linearGradient>
    <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#90A4AE" />
      <stop offset="100%" stop-color="#455A64" />
    </linearGradient>
    <linearGradient id="ironGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#CFD8DC" />
      <stop offset="50%" stop-color="#78909C" />
      <stop offset="100%" stop-color="#37474F" />
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#B0BEC5" />
    </linearGradient>
  </defs>

  <!-- Warm background -->
  <rect width="400" height="300" rx="20" fill="url(#skyGrad)" />
  
  <!-- Soft green mountains/grass backdrop -->
  <path d="M -50,300 C 50,220 150,230 250,260 C 320,240 380,250 450,300 Z" fill="#A5D6A7" opacity="0.8" />
  <path d="M 120,300 C 200,200 300,210 420,300 Z" fill="#81C784" />

  <!-- Sun in the sky -->
  <circle cx="340" cy="65" r="28" fill="#FFB74D" opacity="0.6" />
  <circle cx="340" cy="65" r="22" fill="#FFA726" />
  
  <!-- Cute little birds in distance -->
  <path d="M 280,50 Q 285,42 290,50 Q 295,42 300,50" fill="none" stroke="#E65100" stroke-width="2" stroke-linecap="round" />
  <path d="M 240,70 Q 244,64 248,70 Q 252,64 256,70" fill="none" stroke="#E65100" stroke-width="1.5" stroke-linecap="round" />

  <!-- Huge grey grinding boulder / stone -->
  <g transform="translate(140, 210)">
    <!-- Main rock body with 3D depth and outline -->
    <path d="M -60,20 Q -80,55 -50,80 L 120,80 Q 150,55 130,20 C 110,-5 -20,-10 -60,20 Z" fill="url(#stoneGrad)" stroke="#263238" stroke-width="3" />
    <!-- Top smooth surface for grinding -->
    <ellipse cx="35" cy="18" rx="80" ry="15" fill="#B0BEC5" stroke="#37474F" stroke-width="2" />
    <!-- Scratches on stone to show hard work -->
    <path d="M -10,18 L 30,16 M 10,21 L 50,19 M -30,15 L 0,14" stroke="#78909C" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Sparkles / Dust from grinding -->
  <g transform="translate(245, 210)">
    <circle cx="-30" cy="-5" r="5" fill="#FFF" opacity="0.9" />
    <polygon points="0,0 3,10 0,5 -3,10" fill="#FFEB3B" transform="translate(-10, -10) rotate(15)" />
    <polygon points="0,0 3,10 0,5 -3,10" fill="#FF9800" transform="translate(-50, -5) rotate(-35) scale(0.8)" />
    <polygon points="0,0 2,7 0,4 -2,7" fill="#FFF" transform="translate(-25, 5) rotate(45)" />
  </g>

  <!-- The smiling cartoon Grandmother (老婆婆) -->
  <g transform="translate(80, 100)">
    <!-- Body / Clothes (purple robe) -->
    <path d="M 15,100 C 5,100 -20,135 -30,170 L 70,170 C 60,135 35,100 15,100 Z" fill="#7E57C2" stroke="#4527A0" stroke-width="3" />
    
    <!-- Left Hand (holding iron bar) -->
    <path d="M 35,100 L 45,115 L 35,125 Z" fill="#FFCC80" stroke="#5D4037" stroke-width="2" />
    
    <!-- Hair Bun -->
    <circle cx="15" cy="5" r="16" fill="url(#hairGrad)" stroke="#78909C" stroke-width="2.5" />
    <circle cx="15" cy="-12" r="8" fill="url(#hairGrad)" stroke="#78909C" stroke-width="2" />
    <!-- Cute red hair-tie -->
    <rect x="10" y="-6" width="10" height="4" rx="2" fill="#E53935" />

    <!-- Head / Face -->
    <circle cx="15" cy="35" r="24" fill="#FFE0B2" stroke="#5D4037" stroke-width="3" />
    
    <!-- Smiling Eyes (highly expressive, curved upward, happy) -->
    <path d="M 1,32 Q 7,24 12,32" fill="none" stroke="#5D4037" stroke-width="3" stroke-linecap="round" />
    <path d="M 18,32 Q 24,24 29,32" fill="none" stroke="#5D4037" stroke-width="3" stroke-linecap="round" />
    
    <!-- Cheerful rosy cheeks -->
    <circle cx="-1" cy="38" r="4.5" fill="#FF8A80" opacity="0.8" />
    <circle cx="27" cy="38" r="4.5" fill="#FF8A80" opacity="0.8" />
    
    <!-- Friendly smiling mouth -->
    <path d="M 10,43 Q 15,50 20,43" fill="none" stroke="#E53935" stroke-width="2.5" stroke-linecap="round" />
    
    <!-- Cute little ears -->
    <ellipse cx="-10" cy="35" rx="4" ry="7" fill="#FFE0B2" stroke="#5D4037" stroke-width="2.5" />
    <ellipse cx="40" cy="35" rx="4" ry="7" fill="#FFE0B2" stroke="#5D4037" stroke-width="2.5" />

    <!-- Big Iron pestle / bar being ground -->
    <g transform="translate(42, 60) rotate(15)">
      <!-- Massive iron bar -->
      <path d="M -12,-35 L 12,-35 L 7,65 L -7,65 Z" fill="url(#ironGrad)" stroke="#1C313A" stroke-width="3" />
      <ellipse cx="0" cy="-35" rx="12" ry="4" fill="#ECEFF1" stroke="#1C313A" stroke-width="2" />
    </g>

    <!-- Right Hand on iron bar -->
    <circle cx="56" cy="118" r="7.5" fill="#FFCC80" stroke="#5D4037" stroke-width="2.5" />
  </g>

  <!-- Magical comparison bubble / display on top right: Little shiny finished needle with red thread! -->
  <g transform="translate(300, 160)">
    <!-- Decorative magical ring -->
    <circle cx="0" cy="0" r="38" fill="#FFF" stroke="#FFD54F" stroke-width="3" />
    <circle cx="0" cy="0" r="34" fill="#E0F7FA" />
    
    <!-- Tiny shiny silver sewing needle -->
    <!-- Needle body -->
    <path d="M -18,12 L 18,-15" stroke="#78909C" stroke-width="3" stroke-linecap="round" />
    
    <!-- Needle eye / loop hole on the top right end -->
    <circle cx="16" cy="-13.5" r="1.5" fill="#FFF" stroke="#37474F" stroke-width="1" />
    
    <!-- Red thread looping gracefully through the needle eye -->
    <path d="M 16,-13.5 Q 35,-35 25,-10 T -5,25" fill="none" stroke="#E53935" stroke-width="2.5" stroke-linecap="round" />
    
    <!-- Sparkles around the needle -->
    <path d="M 5,-25 L 8,-20 L 13,-22 L 9,-25 L 11,-30 L 7,-27 Z" fill="#FFEB3B" />
    <path d="M -22,-5 L -19,-2 L -15,-3 L -18,-6 L -17,-10 L -20,-7 Z" fill="#FFEB3B" />
  </g>

  <!-- Big Red Banner with Text: 只要功夫深 -->
  <g transform="translate(200, 26)">
    <rect x="-105" y="-14" width="210" height="28" rx="14" fill="#FF1744" stroke="#FFF" stroke-width="2" />
    <text x="0" y="5" font-family="'SimHei', 'Microsoft YaHei', sans-serif" font-weight="900" font-size="14" fill="#FFF" text-anchor="middle" letter-spacing="2">✨ 只要功夫深 ✨</text>
  </g>

  <!-- Corner label: 磨杵成针 -->
  <rect x="15" y="15" width="112" height="34" rx="8" fill="#FFF" opacity="0.92" stroke="#81C784" stroke-width="1.5" />
  <text x="71" y="38" font-family="'SimHei', sans-serif" font-weight="900" font-size="15" fill="#2E7D32" text-anchor="middle">🪡 磨杵成针</text>
</svg>`,
    mnemonic: "大粗铁棒真坚硬，老婆婆磨啊磨。只要功夫用得深，铁棒也能变钢针！记住：肯下苦功辛勤做，再难的任务也能办得到！",
    kidsExplanation: "就像要把满满一盒乱糟糟的卡片全部整理干净，只要你耐下心，一张一张慢慢理，最后乱糟糟的代码和书桌都会变得特别整齐好看！",
    synonyms: ["铁杵磨针", "持之以恒", "锲而不舍"],
    antonyms: ["半途而废", "浅尝辄止", "三天打鱼两天晒网"],
    story: "大诗人李白小时候读书不努力，经常逃课出去玩。一天，他看见一位老婆婆在溪边石头上磨一根大粗铁棒。李白好奇地问：‘老婆婆你磨它干什么？’老婆婆笑着说：‘我要把它磨成一根绣花针。’李白被老婆婆顽强不屈的耐性深深感动了，从此发愤读书，终于成为了一代诗仙。"
  },
  {
    word: "狐假虎威",
    pinyin: "hú jiǎ hǔ wēi",
    definition: "狐狸假借老虎的威风去吓唬其他野兽。比喻依仗别人的势力来欺压人。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Sky background -->
  <rect width="400" height="300" rx="20" fill="#E8F5E9" />
  <path d="M 0,220 Q 100,180 200,220 T 400,220 L 400,300 L 0,300 Z" fill="#C8E6C9" />
  
  <!-- Subtle Trees -->
  <g fill="#81C784" opacity="0.7">
    <polygon points="50,150 20,220 80,220" />
    <polygon points="120,130 90,200 150,200" />
    <polygon points="340,140 310,210 370,210" />
  </g>

  <!-- Tiger (In the background, looming and looking confused) -->
  <g id="tiger" transform="translate(180, 70)">
    <!-- Body -->
    <ellipse cx="120" cy="110" rx="65" ry="45" fill="#FF9800" stroke="#E65100" stroke-width="4"/>
    <!-- Head -->
    <circle cx="60" cy="80" r="45" fill="#FF9800" stroke="#E65100" stroke-width="4"/>
    <!-- Stripes -->
    <path d="M 60,35 Q 60,50 55,50 M 45,45 Q 55,55 45,65 M 75,45 Q 65,55 75,65" stroke="#212121" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M 120,65 L 120,85 M 100,100 L 100,120 M 140,100 L 140,120" stroke="#212121" stroke-width="4" stroke-linecap="round" />
    <!-- Eyes -->
    <circle cx="45" cy="75" r="5" fill="#212121"/>
    <circle cx="75" cy="75" r="5" fill="#212121"/>
    <!-- Eyebrows (confused / curious) -->
    <path d="M 38,65 Q 45,68 52,65 M 68,65 Q 75,63 82,65" stroke="#212121" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- Nose & Mouth -->
    <polygon points="55,85 65,85 60,92" fill="#E65100" />
    <path d="M 55,95 Q 60,100 65,95" stroke="#212121" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- Ears -->
    <circle cx="25" cy="45" r="12" fill="#FF9800" stroke="#E65100" stroke-width="4"/>
    <circle cx="25" cy="45" r="6" fill="#FFF" />
    <circle cx="95" cy="45" r="12" fill="#FF9800" stroke="#E65100" stroke-width="4"/>
    <circle cx="95" cy="45" r="6" fill="#FFF" />
    <!-- Tail -->
    <path d="M 185,110 Q 210,80 190,40" stroke="#FF9800" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 185,110 Q 210,80 190,40" stroke="#000" stroke-dasharray="8,8" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.3"/>
  </g>

  <!-- Fox (In the foreground, strutting proud and happy) -->
  <g id="fox" transform="translate(60, 110)">
    <!-- Tail -->
    <path d="M -5,90 Q -40,110 -40,60 T -5,40 Z" fill="#FF5722" stroke="#D84315" stroke-width="3"/>
    <path d="M -25,50 Q -40,60 -20,70 Z" fill="#FFF" />
    <!-- Body -->
    <ellipse cx="40" cy="80" rx="40" ry="25" fill="#FF5722" stroke="#D84315" stroke-width="3"/>
    <!-- Legs in strutting pose -->
    <path d="M 20,105 L 15,130 M 35,105 L 45,130 M 55,102 L 65,128" stroke="#D84315" stroke-width="5" stroke-linecap="round"/>
    <!-- Head in proud tilt -->
    <path d="M 60,65 L 105,50 Q 80,90 60,85 Z" fill="#FF5722" stroke="#D84315" stroke-width="3"/>
    <!-- White Cheek/Chest -->
    <path d="M 60,65 L 85,73 Q 75,85 60,85 Z" fill="#FFF"/>
    <!-- Black nose tip -->
    <circle cx="103" cy="51" r="4.5" fill="#212121"/>
    <!-- Confident Eye (closed curved) -->
    <path d="M 72,58 Q 78,54 84,60" fill="none" stroke="#212121" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Ear (tall and alert) -->
    <polygon points="52,40 68,15 72,48" fill="#FF5722" stroke="#D84315" stroke-width="3"/>
    <polygon points="56,38 66,22 69,43" fill="#FFAB91" />
  </g>
  
  <!-- Fun Text Label on Sandbox -->
  <rect x="15" y="15" width="110" height="35" rx="8" fill="#FFF" opacity="0.9" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" />
  <text x="70" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#D84315" text-anchor="middle">🦊 仗势欺人</text>
</svg>`,
    mnemonic: "小狐狸走在前面神气活现，大老虎跟在后面探头探脑。百兽吓得飞跑，狐狸得意地笑！记住：依仗别人的势，欺压好人是狐假虎威。",
    kidsExplanation: "就像在学校里，有的小猫咪带着高大威猛的大狼狗在操场上神气地走路，其他小动物都吓跑了，小猫咪却以为大家怕的是自己呢！",
    synonyms: ["仗势欺人", "狗仗人势", "作威作福"],
    antonyms: ["独步天下", "堂堂正正", "光明磊落", "抱头鼠窜"],
    story: "江乙对楚宣王说：‘老虎寻找各种野兽吃。抓到一只狐狸，狐狸说：你不敢吃我，天帝命我做百兽之王，你如果不信，我走在你前面，你跟在后面看！’老虎相信了，跟着狐狸走，野兽看见都逃跑。老虎不知道兽类是怕自己，以为是怕狐狸呢。"
  },
  {
    word: "亡羊补牢",
    pinyin: "wáng yáng bǔ láo",
    definition: "羊丢失了，才去修补羊圈。比喻受到损失以后，及时想办法补救，免得以后再受损失。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" rx="20" fill="#E0F7FA" />
  <path d="M 0,210 Q 150,170 300,210 T 400,200 L 400,300 L 0,300 Z" fill="#A5D6A7" />
  
  <!-- Cloud -->
  <path d="M 320,60 Q 340,40 360,60 Q 380,60 370,80 Q 350,90 330,80 Z" fill="#FFF" opacity="0.9"/>

  <!-- Fence with a gap -->
  <g stroke="#8D6E63" stroke-width="8" stroke-linecap="round" fill="none">
    <line x1="40" y1="210" x2="40" y2="250" />
    <line x1="80" y1="205" x2="80" y2="250" />
    <line x1="30" y1="225" x2="90" y2="225" />
    
    <!-- Broken Fence post (The gap) -->
    <path d="M 120,215 Q 125,235 110,245" stroke="#8D6E63" stroke-width="6" opacity="0.6" />
    
    <line x1="200" y1="210" x2="200" y2="255" />
    <line x1="240" y1="205" x2="240" y2="255" />
    <line x1="190" y1="225" x2="250" y2="225" />
  </g>

  <!-- Happy Sheep inside -->
  <g transform="translate(230, 160)">
    <!-- Legs -->
    <line x1="30" y1="40" x2="30" y2="70" stroke="#333" stroke-width="4" />
    <line x1="50" y1="40" x2="50" y2="70" stroke="#333" stroke-width="4" />
    <!-- Fluffy Body -->
    <circle cx="40" cy="30" r="28" fill="#FFF" stroke="#CFD8DC" stroke-width="2"/>
    <circle cx="25" cy="20" r="10" fill="#FFF" />
    <circle cx="55" cy="20" r="10" fill="#FFF" />
    <!-- Head -->
    <ellipse cx="65" cy="25" rx="14" ry="10" fill="#FFE0B2" />
    <path d="M 60,18 Q 55,5 50,15 L 58,22" fill="#FFE0B2" />
    <circle cx="70" cy="23" r="1.5" fill="#000" />
    <path d="M 72,27 Q 68,31 66,28" stroke="#333" stroke-width="2" fill="none" />
  </g>

  <!-- Farmer building fences with hammer -->
  <g transform="translate(100, 140)">
    <!-- Body -->
    <rect x="25" y="40" width="30" height="40" rx="10" fill="#1E88E5" />
    <!-- Head -->
    <circle cx="40" cy="25" r="15" fill="#FFCC80" />
    <!-- Straw Hat -->
    <path d="M 15,20 Q 40,-5 65,20 Z" fill="#FFE082" stroke="#FFA000" stroke-width="2"/>
    <line x1="10" y1="20" x2="70" y2="20" stroke="#FFA000" stroke-width="3" />
    <!-- Arm swinging hammer -->
    <path d="M 55,48 Q 75,35 65,20" stroke="#FFCC80" stroke-width="8" stroke-linecap="round" fill="none" />
    <!-- Hammer -->
    <rect x="58" y="10" width="18" height="12" rx="2" fill="#424242" />
    <line x1="67" y1="22" x2="67" y2="35" stroke="#8D6E63" stroke-width="4" />
    <!-- Action Lines -->
    <path d="M 80,15 Q 85,25 78,35" stroke="#FF9800" stroke-width="2" fill="none" stroke-dasharray="4,2"/>
  </g>
  
  <rect x="15" y="15" width="110" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="70" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#00ACC1" text-anchor="middle">🐑 及时补救</text>
</svg>`,
    mnemonic: "昨晚丢了一只羊，今天赶紧修栅栏。虽然羊儿少一只，以后不怕大灰狼！记住：做错了事没关系，吸取教训、立刻改正，叫做亡羊补牢。",
    kidsExplanation: "就像不小心把开水洒在作业本上，虽然这页弄脏了，但立刻把本子移开并吹干，这样后面的作业就不会坏掉啦！这叫亡羊补牢，一点也不晚哦！",
    synonyms: ["知错就改", "见怪不怪", "后顾之忧", "防微杜渐"],
    antonyms: ["临渴掘井", "执迷不悟", "抱薪救火", "死不改悔"],
    story: "战国时楚国的大臣庄辛对楚襄王说：‘臣听说，看见兔子才回头召唤猎犬，并不算晚；羊丢失了才赶快修补羊圈，也还不算迟。’只要大王现在改正奢侈忽略的行为，楚国依然可以重振威风。"
  },
  {
    word: "画蛇添足",
    pinyin: "huà shé tiān zú",
    definition: "画蛇时给蛇添上脚。比喻做了多余的事，非但无益，反而有害。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" rx="20" fill="#FFF8E1" />
  <path d="M 0,230 Q 200,200 400,230 L 400,300 L 0,300 Z" fill="#FFE082" opacity="0.5" />
  
  <!-- Large wine vessel in back -->
  <g transform="translate(40, 140)">
    <rect x="5" y="28" width="50" height="60" rx="8" fill="#A1887F" stroke="#5D4037" stroke-width="4" />
    <ellipse cx="30" cy="28" rx="25" ry="12" fill="#8D6E63" stroke="#5D4037" stroke-width="4" />
    <path d="M 12,28 Q 30,35 48,28" stroke="#5D4037" stroke-width="3" fill="none" />
    <text x="30" y="65" fill="#FFF" font-size="20" font-weight="bold" font-family="Courier" text-anchor="middle">酒</text>
  </g>

  <!-- Wooden Drawing Canvas -->
  <g transform="translate(130, 40)">
    <!-- Stand -->
    <line x1="70" y1="160" x2="30" y2="240" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
    <line x1="70" y1="160" x2="110" y2="240" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
    <!-- Board -->
    <rect x="0" y="10" width="140" height="150" rx="5" fill="#D7CCC8" stroke="#5D4037" stroke-width="4" />
    
    <!-- The Drawn Snake -->
    <path d="M 20,80 Q 40,40 70,80 T 120,80" fill="none" stroke="#2E7D32" stroke-width="12" stroke-linecap="round" />
    <!-- Rattles & eye -->
    <circle cx="118" cy="80" r="3" fill="#E65100" />
    <path d="M 15,80 L 10,75 L 10,85 Z" fill="#2E7D32" />
    
    <!-- The Ridiculous Added Legs -->
    <path d="M 40,75 L 30,95 M 40,75 L 45,95" stroke="#E53935" stroke-width="4" stroke-linecap="round" />
    <circle cx="30" cy="95" r="3" fill="#E53935" />
    <circle cx="45" cy="95" r="3" fill="#E53935" />
    
    <path d="M 85,78 L 80,102 M 85,78 L 95,102" stroke="#E53935" stroke-width="4" stroke-linecap="round" />
    <circle cx="80" cy="102" r="3" fill="#E53935" />
    <circle cx="95" cy="102" r="3" fill="#E53935" />
    
    <text x="70" y="145" fill="#E53935" font-size="12" font-family="'SimHei'" text-anchor="middle">多余的脚！</text>
  </g>

  <!-- Disappointed Painter holding paintbrush -->
  <g transform="translate(290, 110)">
    <circle cx="40" cy="40" r="18" fill="#FFCC80" stroke="#E65100" stroke-width="2"/>
    <!-- Hair bun -->
    <circle cx="40" cy="18" r="7" fill="#3E2723" />
    <!-- Sad / Facepalm look -->
    <path d="M 33,38 Q 40,45 47,38" stroke="#333" stroke-width="2" fill="none" />
    <line x1="30" y1="32" x2="35" y2="34" stroke="#333" stroke-width="2" />
    <line x1="50" y1="32" x2="45" y2="34" stroke="#333" stroke-width="2" />
    <!-- Hand with brush -->
    <path d="M 25,60 Q -5,65 10,45" stroke="#FFCC80" stroke-width="6" stroke-linecap="round" fill="none" />
    <!-- Paintbrush -->
    <line x1="3" y1="35" x2="18" y2="55" stroke="#8D6E63" stroke-width="4" stroke-linecap="round"/>
    <path d="M 1,32 L 6,37 L 2,40 Z" fill="#2E7D32" />
  </g>
  
  <rect x="15" y="15" width="110" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="70" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#F57C00" text-anchor="middle">🐍 多此一举</text>
</svg>`,
    mnemonic: "蛇儿本没脚，偏要画上爪。不仅没跑快，美酒被抢跑！记住：事情做合适了就行，硬要加一些无用的修饰，非但不好反而坏事，就是画蛇添足。",
    kidsExplanation: "就像明明已经穿好了一双超帅的小皮鞋，却还要在鞋子外面套上一层五颜六色的彩色袜子出去跑步，走也走不动，还被大家笑话呢！",
    synonyms: ["多此一举", "画虎类犬", "弄巧成拙"],
    antonyms: ["恰到好处", "恰如其分", "画龙点睛", "精益求精"],
    story: "楚国有个人赏赐给门客一壶酒。门客们商量：‘大家分这壶酒不够喝，一个人喝就足够。我们在地上画蛇，谁先画好谁就独享这壶酒！’一个人先画好了，他拿过酒壶，左手执壶，右手继续画：‘我还能给它添上脚呢！’还没等他画完，第二个人画好了，夺过酒壶说：‘蛇本来就没脚，你凭什么给它加脚？’说完把酒喝了。那个添脚的人最终失去了美酒。"
  },
  {
    word: "叶公好龙",
    pinyin: "yè gōng hào lóng",
    definition: "比喻口头上说爱好某事物，实际上并不真正爱好它，甚至畏惧它。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" rx="20" fill="#ECEFF1" />
  
  <!-- Classic oriental clouds -->
  <g fill="#FFF" fill-opacity="0.8">
    <path d="M 40,60 Q 60,40 80,60 Q 100,50 90,75 L 30,75 Z" />
    <path d="M 320,80 Q 340,60 360,80 Q 380,75 365,100 L 300,100 Z" />
  </g>

  <!-- Big friendly/scary Dragon peeking from window/portal -->
  <g id="dragon" transform="translate(180, 20)">
    <!-- Dragon Body -->
    <path d="M 120,100 Q 150,150 180,80 T 220,130" fill="none" stroke="#26A69A" stroke-width="12" stroke-linecap="round" />
    <path d="M 120,100 Q 150,150 180,80 T 220,130" fill="none" stroke="#00796B" stroke-width="12" stroke-dasharray="2,6" stroke-linecap="round" />
    <!-- Dragon Head -->
    <path d="M 30,100 Q 20,40 60,30 Q 110,25 90,75 Z" fill="#26A69A" stroke="#004D40" stroke-width="3" />
    <path d="M 30,100 A 30,30 0 0,0 75,100 Z" fill="#26A69A" stroke="#004D40" stroke-width="3" />
    <!-- Horns -->
    <path d="M 60,30 Q 45,5 35,8" stroke="#FFA726" stroke-width="5" stroke-linecap="round" fill="none" />
    <path d="M 75,28 Q 70,2 60,5" stroke="#FFA726" stroke-width="5" stroke-linecap="round" fill="none" />
    <!-- Whisker / Tentacle -->
    <path d="M 40,85 Q -10,110 -20,90" fill="none" stroke="#FFA726" stroke-width="3" stroke-linecap="round" />
    <!-- Big glowing eye -->
    <circle cx="55" cy="50" r="8" fill="#FFF" stroke="#FF5722" stroke-width="2"/>
    <circle cx="57" cy="48" r="3" fill="#000" />
    <!-- Smoke coming out -->
    <path d="M 25,90 Q -5,80 -15,70" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
  </g>

  <!-- Leaf pattern curtains (showing Ye Gong's house) -->
  <g id="curtains" transform="translate(0, 0)" opacity="0.15">
    <path d="M 0,0 L 50,0 Q 40,80 0,90 Z" fill="#880E4F" />
    <path d="M 400,0 L 350,0 Q 360,80 400,90 Z" fill="#880E4F" />
  </g>
  
  <!-- Screaming Ye Gong character -->
  <g transform="translate(60, 120)">
    <!-- Body in escape pose -->
    <path d="M 38,100 L 15,140 M 38,100 L 50,145" stroke="#3E2723" stroke-width="6" stroke-linecap="round" />
    <rect x="23" y="55" width="30" height="45" rx="8" fill="#AB47BC" />
    <!-- Arms raised in horror -->
    <path d="M 23,65 Q 5,45 -10,50" stroke="#FFCC80" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M 53,65 Q 75,40 70,25" stroke="#FFCC80" stroke-width="6" stroke-linecap="round" fill="none"/>
    <!-- Head in shock -->
    <circle cx="38" cy="35" r="16" fill="#FFCC80" stroke="#7B1FA2" stroke-width="2"/>
    <!-- Shocked wide open mouth & eyes -->
    <ellipse cx="38" cy="42" rx="5" ry="8" fill="#D32F2F" />
    <circle cx="31" cy="30" r="3" fill="#212121" />
    <circle cx="45" cy="30" r="3" fill="#212121" />
    <!-- Classic Chinese Scholar Cap flying off -->
    <path d="M 22,20 Q 30,5 38,5 Q 46,5 54,20 Z" fill="#3F51B5" transform="rotate(-15, 38, 20)" />
  </g>
  
  <rect x="15" y="15" width="110" height="35" rx="8" fill="#FFF" opacity="0.9" />
  <text x="70" y="38" font-family="'SimHei', sans-serif" font-weight="bold" font-size="16" fill="#7B1FA2" text-anchor="middle">🐲 表里不一</text>
</svg>`,
    mnemonic: "叶公天天说爱龙，家里画满彩色龙。真龙高高兴兴来，叶公吓得钻地缝！记住：光是嘴上说喜欢某样东西，心里却怕得要命，这就是叶公好龙。",
    kidsExplanation: "就像有的小朋友在班里大喊：‘我超级无敌喜欢吃爆爆辣的火锅！它最酷了！’可是当妈妈真的夹起一块特辣牛肉递给她时，她却吓得直摆手哭喊：‘拿走拿走！我才不吃呢！’",
    synonyms: ["表里不一", "口是心非", "口不应心"],
    antonyms: ["名副其实", "名副其实", "真心实意", "始终如一"],
    story: "古时候有个叫叶公的人，非常喜欢龙，屋梁上、柱子上、衣服上都雕刻或画着龙。天上的真龙听说有人如此深爱自己，感动极了，就降临到叶公家里。龙头趴在窗户向里看，尾巴拖在堂屋。叶公一回头，看到真龙，吓得失魂落魄，连滚带爬地逃跑了。原来他喜欢的根本不是真龙，而是像龙却不是龙的假东西。"
  }
];

// Helper to parse JSON robustly, extracting the first balanced JSON object
function tryParseJSON(text: string): any {
  let target = text.trim();

  // Scan starting at the first root '{' and find its matching balanced '}'
  const startIdx = target.indexOf('{');
  if (startIdx !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = startIdx; i < target.length; i++) {
      const char = target[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            const candidate = target.substring(startIdx, i + 1);
            try {
              return JSON.parse(candidate);
            } catch (e) {
              // Try cleaning common trailing commas
              try {
                const cleanedCandidate = candidate.replace(/,(\s*[\]}])/g, '$1');
                return JSON.parse(cleanedCandidate);
              } catch (innerErr) {
                // If parsing fails, fall through to other cleaning strategies
              }
            }
          }
        }
      }
    }
  }

  // Fallback to simpler cleaning if balanced bracket finder did not succeed
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (error: any) {
    const cleanedClean = clean.replace(/,(\s*[\]}])/g, '$1');
    return JSON.parse(cleanedClean);
  }
}

// Helper to generate dynamic colored, beautiful SVGs for database idioms without pre-drawn illustrations
function generateDynamicSVG(word: string, category: string) {
  const colors = [
    { bg: "#FFF9E6", stroke: "#D84315", text: "#E65100", secondary: "#F59E0B" }, // warm amber
    { bg: "#E8F5E9", stroke: "#2E7D32", text: "#1B5E20", secondary: "#4CAF50" }, // fresh green
    { bg: "#E3F2FD", stroke: "#1565C0", text: "#0D47A1", secondary: "#2196F3" }, // gentle blue
    { bg: "#EDE7F6", stroke: "#673AB7", text: "#4A148C", secondary: "#9C27B0" }, // purple fantasy
    { bg: "#FCE4EC", stroke: "#C2185B", text: "#880E4F", secondary: "#E91E63" }, // sweet pink
    { bg: "#E0F7FA", stroke: "#00ACC1", text: "#006064", secondary: "#00BCD4" }, // refreshing cyan
  ];
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash += word.charCodeAt(i);
  }
  const color = colors[hash % colors.length];
  
  return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Rounded child-friendly background -->
  <rect width="400" height="300" rx="20" fill="${color.bg}" />
  
  <!-- Sun/Sky decorations -->
  <circle cx="340" cy="60" r="25" fill="${color.secondary}" opacity="0.1" />
  <circle cx="340" cy="60" r="15" fill="${color.secondary}" opacity="0.2" />
  
  <!-- Rolling Hills in the background -->
  <path d="M -20,240 Q 100,190 220,220 T 420,180 L 420,300 L -20,300 Z" fill="#E2E8F0" opacity="0.4" />
  <path d="M -20,250 Q 80,210 240,240 T 420,220 L 420,300 L -20,300 Z" fill="#CBD5E1" opacity="0.6" />
  
  <!-- Decorative small trees and flowers -->
  <g fill="#A7F3D0" opacity="0.8">
    <polygon points="50,210 30,260 70,260" />
    <polygon points="340,190 310,240 370,240" />
  </g>
  <g fill="#FBCFE8" opacity="0.8">
    <circle cx="90" cy="240" r="6" />
    <circle cx="280" cy="235" r="5" />
  </g>

  <!-- Centered Cute Mystery Riddle Box / Interactive Scroll -->
  <g transform="translate(200, 125)">
    <!-- Main Board / Frame -->
    <rect x="-95" y="-55" width="190" height="110" rx="16" fill="#FFFFFF" opacity="0.95" filter="drop-shadow(0px 8px 20px rgba(0,0,0,0.06))" />
    <rect x="-85" y="-45" width="170" height="90" rx="12" fill="none" stroke="${color.secondary}" stroke-width="4" stroke-dasharray="8 6" opacity="0.7" />
    
    <!-- Big glowing question mark of mystery for kids -->
    <path d="M -12,-15 C -12,-26 12,-26 12,-15 C 12,-7 0,-8 0,0" fill="none" stroke="${color.stroke}" stroke-width="8" stroke-linecap="round" opacity="0.85" />
    <circle cx="0" cy="15" r="4.5" fill="${color.stroke}" opacity="0.85" />
    
    <!-- Sparkling magical stars -->
    <path d="M -45,-25 L -42,-18 L -35,-20 L -39,-25 L -37,-32 L -42,-28 L -45,-30 L -43,-22 Z" fill="#FBBF24" opacity="0.9" />
    <path d="M 45,20 L 48,27 L 55,25 L 51,20 L 53,13 L 48,17 L 45,15 L 47,23 Z" fill="#FBBF24" opacity="0.9" />
  </g>
  
  <!-- Underneath visual text which can easily be stripped by stripSVGText -->
  <g transform="translate(200, 130)">
    <rect x="-100" y="-12" width="200" height="42" rx="10" fill="#FFFFFF" fill-opacity="0.9" />
    <text x="0" y="16" font-family="'SimHei', 'STHeiti', 'Microsoft YaHei', sans-serif" font-weight="950" font-size="28" fill="${color.text}" text-anchor="middle" letter-spacing="4">${word}</text>
  </g>
  
  <!-- Bottom banner badge with a lock/question icon -->
  <g transform="translate(200, 240)">
    <rect x="-70" y="0" width="140" height="28" rx="8" fill="${color.stroke}" />
    <text x="0" y="17" font-family="'SimHei', sans-serif" font-weight="bold" font-size="11" fill="#FFFFFF" text-anchor="middle">🔍 寻宝成语挑战</text>
  </g>
</svg>`;
}

const ADDITIONAL_IDIOMS: Array<{
  word: string;
  pinyin: string;
  definition: string;
  category: 'elementary' | 'middle' | 'high';
  illustration?: string;
  mnemonic: string;
  kidsExplanation: string;
  synonyms: string[];
  antonyms: string[];
  story: string;
}> = [
  {
    word: "守株待兔",
    pinyin: "shǒu zhū dài tù",
    definition: "守着树桩等待兔子撞死。比喻希图不经过努力而得到意外的收获，或死守狭隘经验，不知变通。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Warm fields background -->
  <rect width="400" height="300" rx="20" fill="#FFFBEB" />
  
  <!-- Subtle sun/clouds -->
  <circle cx="340" cy="50" r="25" fill="#FEF08A" opacity="0.6" />
  <path d="M 30,50 Q 50,35 70,50 Q 90,35 110,50 L 30,50 Z" fill="#FFFFFF" opacity="0.9" />
  
  <!-- Hills/Fields -->
  <path d="M -20,180 Q 120,130 280,170 T 420,150 L 420,300 L -20,300 Z" fill="#FEF08A" opacity="0.4" />
  <path d="M -20,190 Q 150,170 320,200 T 420,195 L 420,300 L -20,300 Z" fill="#D9F99D" opacity="0.75" />
  <path d="M -20,220 Q 100,210 240,230 T 420,220 L 420,300 L -20,300 Z" fill="#A7F3D0" opacity="0.85" />

  <!-- Neglected dry/wilted crops in the field -->
  <g transform="translate(40, 240)">
    <path d="M 0,0 Q -10,-15 -20,-10 Q -15,5 0,0" fill="#CA8A04" opacity="0.9" />
    <path d="M 5,0 Q 15,-18 8,-25 Q 0,-15 5,0" fill="#A16207" opacity="0.85" />
    <path d="M -5,0 Q 3,-10 -5,-20" fill="none" stroke="#854D0E" stroke-width="2" />
  </g>
  <g transform="translate(80, 250)">
    <path d="M 0,0 Q -5,-12 -12,-8 Q -8,4 0,0" fill="#CA8A04" opacity="0.9" />
    <path d="M 3,0 Q 10,-12 4,-18 Q 0,-10 3,0" fill="#A16207" opacity="0.85" />
  </g>

  <!-- Abandoned Farming Hoe/Spade lying on the ground -->
  <g transform="translate(110, 255) rotate(-20)">
    <!-- Wooden handle -->
    <rect x="0" y="0" width="60" height="4" rx="2" fill="#78350F" />
    <!-- Metal spade head -->
    <path d="M 52,2 L 64,12 L 60,18 L 48,8 Z" fill="#64748B" stroke="#334155" stroke-width="1.5" />
  </g>

  <!-- BIG TREE STUMP WITH SPIRALS -->
  <g transform="translate(290, 200)">
    <!-- Roots spreading flat ground -->
    <path d="M -65,30 Q -60,0 0,0 Q 60,0 65,30 Z" fill="#78350F" />
    <path d="M -55,30 Q -40,10 -15,10 Q 0,10 10,30" fill="none" stroke="#451A03" stroke-width="3" />
    <path d="M 15,30 Q 30,10 50,30" fill="none" stroke="#451A03" stroke-width="3" />

    <!-- Stump Body -->
    <path d="M -35,-15 C -45,15 -55,25 -50,30 L 50,30 C 55,25 45,15 35,-15 Z" fill="#92400E" stroke="#451A03" stroke-width="3" />
    
    <!-- Flat wood top surface ring perspective -->
    <ellipse cx="0" cy="-15" rx="35" ry="14" fill="#FDBA74" stroke="#451A03" stroke-width="3" />
    <!-- Bark cracks -->
    <path d="M -38,10 Q -30,22 -35,28" fill="none" stroke="#451A03" stroke-width="2" />
    <path d="M 38,10 Q 30,22 32,28" fill="none" stroke="#451A03" stroke-width="2" />
    
    <!-- Stump Annual Growth Rings (Spirals) -->
    <ellipse cx="-1" cy="-15" rx="27" ry="10" fill="none" stroke="#B45309" stroke-width="1.8" />
    <ellipse cx="-2" cy="-15" rx="19" ry="7" fill="none" stroke="#B45309" stroke-width="1.5" />
    <ellipse cx="-1.5" cy="-15" rx="11" ry="4" fill="none" stroke="#B45309" stroke-width="1.2" />
    <ellipse cx="-2" cy="-15" rx="5" ry="1.8" fill="none" stroke="#B45309" stroke-width="1" />
  </g>

  <!-- THE DIZZY CRASHED WHITE RABBIT -->
  <g transform="translate(245, 175) rotate(-45)">
    <!-- Flop ears -->
    <path d="M -15,-20 Q -25,-40 -12,-36 Q -5,-25 -6,-20" fill="#FFFFFF" stroke="#475569" stroke-width="2" />
    <path d="M -18,-24 Q -30,-42 -17,-39 Q -11,-28 -12,-24" fill="#FECDD3" />
    <path d="M -5,-22 Q 10,-40 18,-30 Q 10,-20 -2,-20" fill="#FFFFFF" stroke="#475569" stroke-width="2" />
    <path d="M -4,-23 Q 8,-37 14,-31 Q 8,-22 -1,-23" fill="#FECDD3" />

    <!-- Rabbit body & fluffy tail -->
    <circle cx="20" cy="10" r="16" fill="#FFFFFF" stroke="#475569" stroke-width="2" />
    <circle cx="34" cy="16" r="6" fill="#FFFFFF" stroke="#475569" stroke-width="1.5" /> <!-- tail -->
    <ellipse cx="6" cy="5" r="14" fill="#FFFFFF" stroke="#475569" stroke-width="2" /> <!-- chest/arm segment -->

    <!-- Head -->
    <circle cx="-10" cy="-8" r="13" fill="#FFFFFF" stroke="#475569" stroke-width="2" />
    
    <!-- Head dizzy details (Spiral eyes, red cheeks) -->
    <circle cx="-14" cy="-10" r="3" fill="#FDA4AF" opacity="0.8" />
    <circle cx="-6" cy="-6" r="3" fill="#FDA4AF" opacity="0.8" />
    <!-- Spiral left eye -->
    <path d="M -15,-13 Q -12,-15 -11,-12 Q -12,-10 -14,-11" fill="none" stroke="#1E293B" stroke-width="1.5" />
    <!-- Spiral right eye -->
    <path d="M -7,-9 Q -4,-11 -3,-8 Q -4,-6 -6,-7" fill="none" stroke="#1E293B" stroke-width="1.5" />
    <!-- Funny mouth -->
    <path d="M -12,-4 Q -9,-1 -7,-4" fill="none" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round" />
    <ellipse cx="-10" cy="-12" r="2" fill="#E11D48" /> <!-- pink nose -->

    <!-- Dizzy stars swirling near the bunny -->
    <g transform="translate(-25, -28)">
      <path d="M 0,-5 L 1.5,-1.5 L 5,0 L 1.5,1.5 L 0,5 L -1.5,1.5 L -5,0 L -1.5,-1.5 Z" fill="#FBBF24" />
    </g>
    <g transform="translate(15, -22) scale(0.6)">
      <path d="M 0,-5 L 1.5,-1.5 L 5,0 L 1.5,1.5 L 0,5 L -1.5,1.5 L -5,0 L -1.5,-1.5 Z" fill="#FBBF24" />
    </g>
  </g>

  <!-- THE LAZY LAUGHING FARMER (Ancient garment) -->
  <g transform="translate(145, 155)">
    <!-- Legs crossed on grass -->
    <path d="M -25,75 Q 0,65 25,75 C 20,85 5,82 0,82 C -5,82 -20,85 -25,75 Z" fill="#1E3A8A" stroke="#0F172A" stroke-width="2" />
    <path d="M -20,77 Q 0,85 20,77" fill="none" stroke="#0F172A" stroke-width="2" />

    <!-- Robe in cheerful/simple color (ancient light blue/teal) -->
    <path d="M -28,38 C -28,75 -20,75 20,75 C 25,50 15,35 -2,32 Z" fill="#0D9488" stroke="#115E59" stroke-width="2.5" />
    
    <!-- Traditional belt wrap -->
    <rect x="-18" y="55" width="34" height="6" rx="2" fill="#F59E0B" />

    <!-- Head / Face -->
    <circle cx="-1" cy="6" r="20" fill="#FDE047" stroke="#CA8A04" stroke-width="2" />

    <!-- Big straw farmer's hat (slanted, relaxed) -->
    <path d="M -30,-5 C -15,-18 -1,-25 15,-12 L 35,0 Q 0,5 -30,-5 Z" fill="#D97706" stroke="#78350F" stroke-width="2.5" />
    <path d="M -15,-14 L 3,1" stroke="#92400E" stroke-width="1.5" />
    <path d="M -3,-18 L 13,-4" stroke="#92400E" stroke-width="1.5" />
    <path d="M -25,-8 L 22,-3" stroke="#92400E" stroke-width="1.5" />

    <!-- Face details: eyes closed, sleeping/dreaming, bubble blowing from left nostril -->
    <path d="M -12,4 Q -8,0 -4,3" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 2,6 Q 6,2 10,5" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="-11" cy="11" r="3.5" fill="#F87171" opacity="0.6" />
    <circle cx="8" cy="13" r="3.5" fill="#F87171" opacity="0.6" />
    <path d="M -5,17 Q -1,21 3,16" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" />

    <!-- Giant cartoon SNOT BUBBLE (sleeping symbol) -->
    <circle cx="8" cy="22" r="11" fill="#93C5FD" opacity="0.75" stroke="#3B82F6" stroke-width="1.5" />
    <circle cx="5" cy="18" r="3" fill="#FFFFFF" opacity="0.8" />
    <text x="6" y="24" font-family="sans-serif" font-weight="950" font-size="7" fill="#1D4ED8" text-anchor="middle">Z</text>

    <!-- Arms: resting lazily on belly -->
    <path d="M -18,44 Q 0,48 10,42" fill="none" stroke="#0D9488" stroke-width="10" stroke-linecap="round" />
    <path d="M -18,44 Q 0,48 10,42" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
    <circle cx="10" cy="42" r="4.5" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" />
  </g>

  <!-- Sleeping text/dream cloud above the farmer representing his lazy passive expectation -->
  <g transform="translate(180, 25)" opacity="0.9">
    <path d="M 10,18 Q -5,18 -5,10 Q -5,2 10,2 Q 20,-6 35,2 Q 50,0 48,10 Q 52,18 35,18 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" />
    <text x="23" y="12" font-family="sans-serif" font-weight="900" font-size="8" fill="#475569" text-anchor="middle">等野兔撞 💤</text>
    <circle cx="5" cy="24" r="3" fill="#E2E8F0" />
    <circle cx="0" cy="29" r="2" fill="#E2E8F0" />
  </g>

  <!-- Crash banner text near stump -->
  <g transform="translate(300, 115)" opacity="0.95">
    <rect x="-42" y="0" width="84" height="18" rx="5" fill="#EF4444" />
    <text x="0" y="12" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">砰！撞扁了！💥</text>
    <path d="M -10,18 L -5,25 L 0,18" fill="#EF4444" />
  </g>
</svg>`,
    mnemonic: "小农夫守树桩，兔子不来心发慌。不劳动没庄稼，天天挨饿泪汪汪！记住：只有靠勤劳的双手做事，才能有源源不断的收获，不能守株待兔哦！",
    kidsExplanation: "就像你在操场上碰巧捡到了一块巧克力，然后天天坐在那里什么都不干，专门等待下一块巧克力掉下来，这就是守株待兔！",
    synonyms: ["刻舟求剑", "墨守成规", "循规蹈矩"],
    antonyms: ["通权达变", "随机应变", "积极主动", "闻鸡起舞"],
    story: "春秋时期，有个宋国农夫在耕田。突然，一只惊恐的兔子跑过来，一头撞在田里的树桩上，折断脖子死了。农夫白捡了一只兔子，非常高兴。从此，他放下农具什么也不干，天天守在树桩旁，希望再得到兔子。结果地里长满了野草，他也成了大家的笑柄。"
  },
  {
    word: "拔苗助长",
    pinyin: "bá miáo zhù zhǎng",
    definition: "把禾苗往上拔以帮助其生长。比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Warm sunny background -->
  <rect width="400" height="300" rx="20" fill="#FEFEEB" />
  
  <!-- Glowing sun & flying birds -->
  <circle cx="80" cy="50" r="18" fill="#F59E0B" opacity="0.8" />
  <path d="M 160,40 Q 165,30 170,40 Q 175,30 180,40" fill="none" stroke="#92400E" stroke-width="1.5" stroke-linecap="round" />
  <path d="M 190,48 Q 195,40 200,48 Q 205,40 210,48" fill="none" stroke="#92400E" stroke-width="1.5" stroke-linecap="round" />

  <!-- Dry farmlands with cracks -->
  <path d="M -20,170 Q 180,140 420,170 L 420,300 L -20,300 Z" fill="#E9D5FF" opacity="0.2" />
  <path d="M -20,190 Q 180,180 420,195 L 420,300 L -20,300 Z" fill="#FCD34D" opacity="0.3" />
  <!-- Soil layer brown base -->
  <path d="M -20,205 Q 180,200 420,205 L 420,300 L -20,300 Z" fill="#D97706" />

  <!-- Ground cracking line vectors for dry soil -->
  <path d="M 30,225 L 50,235 L 75,230 M 50,235 L 45,250 M 230,220 L 250,230 L 280,225 M 250,230 L 255,248" fill="none" stroke="#78350F" stroke-width="2" opacity="0.6" stroke-linecap="round" />

  <!-- Other Wilted, Dead Crops in the soil (Yellow/bent over) -->
  <g transform="translate(60, 215)">
    <!-- Dead shoot 1 -->
    <path d="M 0,0 C -12,-15 -25,-10 -30,-5" fill="none" stroke="#B45309" stroke-width="3" stroke-linecap="round" />
    <path d="M -15,-11 Q -22,-3 -16,-1" fill="none" stroke="#92400E" stroke-width="2.5" />
    <circle cx="-30" cy="-5" r="3.5" fill="#FBBF24" opacity="0.7" /> <!-- dry leaf tip -->
  </g>
  <g transform="translate(110, 220)">
    <!-- Dead shoot 2 -->
    <path d="M 0,0 C -5,-18 -18,-15 -25,-12" fill="none" stroke="#B45309" stroke-width="3" stroke-linecap="round" />
    <path d="M -10,-12 Q -18,-5 -12,0" fill="none" stroke="#92400E" stroke-width="2.5" />
  </g>
  <g transform="translate(340, 220)">
    <!-- Dead shoot 3 -->
    <path d="M 0,0 C 12,-14 25,-8 28,-2" fill="none" stroke="#B45309" stroke-width="3.5" stroke-linecap="round" />
    <circle cx="28" cy="-2" r="3" fill="#FBBF24" />
  </g>

  <!-- THE ACTIVE SEEDLING BEING DRAGGED UP -->
  <g transform="translate(200, 210)">
    <!-- Soil mound piling up -->
    <path d="M -40,10 Q 0,-15 40,10 Z" fill="#78350F" stroke="#451A03" stroke-width="2" />
    
    <!-- EXPOSED FLAPPING ROOTS (YANKED OUT IN MID-AIR) -->
    <!-- Roots dangling -->
    <path d="M -5,12 Q -12,28 -18,34" fill="none" stroke="#FDE047" stroke-width="3" stroke-linecap="round" />
    <path d="M 0,12 Q 2,32 5,42" fill="none" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 5,12 Q 14,24 18,32" fill="none" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round" />
    <path d="M -12,25 L -8,32 M 10,20 L 15,26" fill="none" stroke="#FDE047" stroke-width="2" />
    
    <!-- Pulled Stem (vibrant green, unnaturally elongated) -->
    <path d="M 0,-40 L 0,10 M 2,-30 L 2,10" fill="none" stroke="#22C55E" stroke-width="5" stroke-linecap="round" />
    <!-- Highlight stretching effect line -->
    <path d="M -10,-10 L -10,-35" stroke="#FACC15" stroke-width="1.5" stroke-dasharray="3 3" />
    <path d="M 10,-10 L 10,-35" stroke="#FACC15" stroke-width="1.5" stroke-dasharray="3 3" />

    <!-- Big green leaves at the top, looking shocked/stretched -->
    <path d="M 0,-40 Q -25,-60 -35,-52 Q -20,-30 0,-40" fill="#4ADE80" stroke="#166534" stroke-width="2" />
    <path d="M 0,-40 Q 25,-60 35,-52 Q 20,-30 0,-40" fill="#4ADE80" stroke="#166534" stroke-width="2" />
    <path d="M 0,-40 Q 5,-75 -5,-80 Q -10,-55 0,-40" fill="#22C55E" stroke="#15803D" stroke-width="2" />
  </g>

  <!-- THE SILLY PEASANT MAN PULLING HARD WITH FLYING SWEAT -->
  <g transform="translate(200, 105)">
    <!-- Body/Chest bent forward with great strain -->
    <path d="M -25,50 C -45,50 -20,20 10,25 C 20,28 35,50 -5,55 Z" fill="#EC4899" stroke="#9D174D" stroke-width="2.5" />
    
    <!-- Pants / belt -->
    <path d="M -32,54 L 6,54 L 0,66 L -26,66 Z" fill="#4B5563" stroke="#1F2937" stroke-width="2" />

    <!-- Highly eccentric laughing/sweating face -->
    <circle cx="-16" cy="3" r="22" fill="#FEE2E2" stroke="#B91C1C" stroke-width="2.5" />
    
    <!-- Ancient topknot wrap in funny red hat shape -->
    <path d="M -16,-19 Q -32,-35 -14,-32 C -5,-30 -8,-20 -10,-19 Z" fill="#EF4444" stroke="#991B1B" stroke-width="2" />
    <circle cx="-16" cy="-34" r="5" fill="#FACC15" />

    <!-- Proud eyes, wide open smirk, heavy sweat droplets flying -->
    <path d="M -26,1 Q -24,-5 -20,2" fill="none" stroke="#7F1D1D" stroke-width="3" stroke-linecap="round" />
    <path d="M -10,3 Q -8,-3 -4,4" fill="none" stroke="#7F1D1D" stroke-width="3" stroke-linecap="round" />
    <circle cx="-25" cy="8" r="4.5" fill="#F87171" opacity="0.8" />
    <circle cx="-6" cy="10" r="4.5" fill="#F87171" opacity="0.8" />
    <path d="M -22,12 Q -12,23 -2,11 Z" fill="#991B1B" stroke="#7F1D1D" stroke-width="2" />
    <rect x="-15" y="13" width="6" height="4" fill="#FFFFFF" />

    <!-- FLYING DROPS OF SWEAT -->
    <path d="M 12,-15 Q 24,-18 20,-10 C 16,-5 10,-8 12,-15" fill="#0EA5E9" opacity="0.8" />
    <path d="M -46,-5 Q -58,-8 -54,-1 C -50,5 -44,2 -46,-5" fill="#0EA5E9" opacity="0.8" />

    <!-- ARMS / HANDS clutching the plant stem tightly -->
    <path d="M -4,28 Q -4,55 0,65" fill="none" stroke="#EC4899" stroke-width="9" stroke-linecap="round" />
    <path d="M -4,28 Q -4,55 0,65" fill="none" stroke="#9D174D" stroke-width="1.8" stroke-linecap="round" />
    <path d="M -20,32 Q 5,45 2,65" fill="none" stroke="#EC4899" stroke-width="9" stroke-linecap="round" />
    <path d="M -20,32 Q 5,45 2,65" fill="none" stroke="#9D174D" stroke-width="1.8" stroke-linecap="round" />

    <!-- Hands around the root junction -->
    <circle cx="1" cy="65" r="7.5" fill="#FEE2E2" stroke="#B91C1C" stroke-width="2" />
    <circle cx="-6" cy="63" r="6" fill="#FEE2E2" stroke="#B91C1C" stroke-width="1.5" />
  </g>

  <!-- Highlighting arrows & educational text boxes -->
  <g transform="translate(110, 115)" opacity="0.95">
    <rect width="70" height="20" rx="5" fill="#EA580C" />
    <text x="35" y="13" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">用力往上拔! 🥵</text>
    <path d="M 70,10 L 76,10 L 72,13" fill="#EA580C" />
  </g>

  <g transform="translate(255, 65)" opacity="0.95">
    <rect width="80" height="20" rx="6" fill="#3F51B5" />
    <text x="40" y="13" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">根都断啦！😭</text>
  </g>
</svg>`,
    mnemonic: "嫌小苗长得慢，一根一根往上拔。拔高了真神气，第二天全枯死啦！记住：成长需要耐心，一步一步踏踏实实，不能盲目拔苗助长！",
    kidsExplanation: "就像你刚上一年级，爸爸妈妈就非要让你去参加高中的高数考试，这非但学不会，还会把学习的积极性全部伤害掉，这就叫拔苗助长。",
    synonyms: ["急功近利", "急于求成", "欲速不达"],
    antonyms: ["循序渐进", "水到渠成", "瓜熟蒂落", "顺其自然"],
    story: "古时候宋国有个农夫，嫌自己地里的禾苗长得太慢。今天到田里把禾苗每根都往上拔高了一点，回到家对家人说：‘今天可把我累坏了，我帮禾苗都长高了！’他的儿子听完赶紧跑到田里去看，结果所有的禾苗都枯萎死掉了。"
  },
  {
    word: "掩耳盗铃",
    pinyin: "yǎn ěr dào líng",
    definition: "偷铃铛时捂住自己的耳朵。比喻自己欺骗自己，明明掩盖不住的事情偏要想办法掩盖。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Soft friendly background -->
  <rect width="400" height="300" rx="20" fill="#FFF8F0" />
  
  <!-- Wooden beam hanger for the bell -->
  <rect x="180" y="30" width="180" height="14" rx="4" fill="#8D6E63" />
  <rect x="320" y="30" width="20" height="240" fill="#795548" />
  <path d="M 290,44 L 320,74 L 320,44 Z" fill="#6D4C41" />
  
  <!-- Red string hanger with traditional Chinese knot -->
  <line x1="240" y1="44" x2="240" y2="85" stroke="#E53935" stroke-width="4.5" />
  <circle cx="240" cy="65" r="7" fill="#E53935" />
  
  <!-- Big Golden temple-style bell -->
  <path d="M 215,85 Q 240,75 265,85 Q 282,115 287,155 Q 240,165 193,155 Q 198,115 215,85 Z" fill="#FFC107" stroke="#FF8F00" stroke-width="4.5" />
  <path d="M 230,85 Q 240,70 250,85" fill="none" stroke="#FF8F00" stroke-width="5" />
  
  <!-- Bell decorative details and studs -->
  <path d="M 205,120 Q 240,128 275,120" fill="none" stroke="#E65100" stroke-width="3" />
  <circle cx="218" cy="105" r="3.5" fill="#E65100" />
  <circle cx="240" cy="108" r="3.5" fill="#E65100" />
  <circle cx="262" cy="105" r="3.5" fill="#E65100" />
  
  <!-- Bell clapper vibrating -->
  <line x1="240" y1="155" x2="240" y2="182" stroke="#E65100" stroke-width="5.5" />
  <circle cx="240" cy="182" r="10" fill="#FF6F00" stroke="#FF3D00" stroke-width="2.5" />
  
  <!-- Dynamic acoustic sound waves spreading out loudly -->
  <path d="M 160,110 Q 120,140 160,170" fill="none" stroke="#FF9800" stroke-width="5" stroke-linecap="round" opacity="0.85" />
  <path d="M 140,90 Q 90,140 140,190" fill="none" stroke="#FF5722" stroke-width="5" stroke-linecap="round" opacity="0.65" />
  <path d="M 120,70 Q 60,140 120,210" fill="none" stroke="#E53935" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="6 6" opacity="0.45" />
  
  <!-- Floating musical particles -->
  <path d="M 100,55 A 4,4 0 1,1 96,59 L 96,45 L 108,41 L 108,49 A 4,4 0 1,1 104,53" fill="#FF5722" />
  <path d="M 290,70 A 3,3 0 1,1 287,73 L 287,62 L 295,59 L 295,66" fill="#FF9800" />
  
  <!-- Comon cartoon character: Thief sneaks in -->
  <!-- Legs of the thief -->
  <ellipse cx="140" cy="254" rx="14" ry="7" fill="#4E342E" />
  <ellipse cx="110" cy="254" rx="14" ry="7" fill="#4E342E" />
  <line x1="135" y1="215" x2="140" y2="250" stroke="#5D4037" stroke-width="9.5" stroke-linecap="round" />
  <line x1="113" y1="215" x2="110" y2="250" stroke="#5D4037" stroke-width="9.5" stroke-linecap="round" />
  
  <!-- Body with humorous burglar striped cloth -->
  <ellipse cx="122" cy="184" rx="24" ry="34" fill="#37474F" stroke="#212121" stroke-width="2.5" />
  <path d="M 102,168 Q 122,173 142,168" fill="none" stroke="#90A4AE" stroke-width="6.5" />
  <path d="M 98,183 Q 122,188 146,183" fill="none" stroke="#90A4AE" stroke-width="6.5" />
  <path d="M 100,198 Q 122,203 144,198" fill="none" stroke="#90A4AE" stroke-width="6.5" />
  
  <!-- Thief head/face -->
  <circle cx="122" cy="120" r="28" fill="#FFCC80" stroke="#D84315" stroke-width="3" />
  
  <!-- Black eye mask -->
  <path d="M 95,110 Q 122,122 149,110 L 148,124 Q 122,136 96,124 Z" fill="#212121" />
  <!-- Squinting happy eyes inside mask -->
  <path d="M 104,118 Q 112,113 116,119" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
  <path d="M 128,118 Q 136,113 140,119" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
  <!-- Funny red nose -->
  <circle cx="123" cy="128" r="5" fill="#E53935" />
  <!-- Self-satisfied smug grin -->
  <path d="M 114,137 Q 123,144 132,137" fill="none" stroke="#D84315" stroke-width="3.5" stroke-linecap="round" />
  
  <!-- Arms & Hands physically CLAMPED over his ears! -->
  <!-- Left arm -->
  <path d="M 102,184 Q 77,164 86,125" fill="none" stroke="#37474F" stroke-width="12" stroke-linecap="round" />
  <!-- Left Hand covering left ear -->
  <g transform="translate(86, 120)">
    <ellipse cx="0" cy="0" rx="14" ry="17" fill="#FFB74D" stroke="#D84315" stroke-width="3" />
    <line x1="-5" y1="-10" x2="-2" y2="10" stroke="#D84315" stroke-width="2.5" />
    <line x1="2" y1="-10" x2="4" y2="10" stroke="#D84315" stroke-width="2.5" />
  </g>
  
  <!-- Right arm -->
  <path d="M 142,184 Q 167,164 158,125" fill="none" stroke="#37474F" stroke-width="12" stroke-linecap="round" />
  <!-- Right Hand covering right ear -->
  <g transform="translate(158, 120)">
    <ellipse cx="0" cy="0" rx="14" ry="17" fill="#FFB74D" stroke="#D84315" stroke-width="3" />
    <line x1="-2" y1="-10" x2="-4" y2="10" stroke="#D84315" stroke-width="2.5" />
    <line x1="5" y1="-10" x2="2" y2="10" stroke="#D84315" stroke-width="2.5" />
  </g>
  
  <!-- Wooden pole stick held under arm or foot, poking the bell clapper! -->
  <line x1="130" y1="178" x2="208" y2="160" stroke="#8D6E63" stroke-width="7" stroke-linecap="round" />
  <circle cx="208" cy="160" r="4" fill="#5D4037" />
  
  <!-- Sweat drop from task effort -->
  <path d="M 152,95 C 152,95 155,91 157,91 C 159,91 161,94 159,97 C 158,99 152,95 152,95 Z" fill="#29B6F6" />
  
  <!-- Small funny bubble above indicating complete silent illusion -->
  <path d="M 75,55 Q 60,65 50,55 Q 40,45 55,35 Q 70,25 85,35 Q 95,45 75,55 Z" fill="#F5F7FA" stroke="#90A4AE" stroke-width="2" />
  <!-- Red Cross-out silent symbol inside bubble -->
  <path d="M 68,40 Q 60,35 58,42 Q 56,48 62,50" fill="none" stroke="#78909C" stroke-width="2" stroke-linecap="round" />
  <line x1="52" y1="36" x2="72" y2="52" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />
</svg>`,
    mnemonic: "捂住耳朵去偷铃，铛铛铛响没听清。以为别人不知道，抓个正着脸通红！记住：坏事逃不过大家的眼睛，自欺欺人是没有用处的！",
    kidsExplanation: "就像考试没考好，你捂住小眼睛说‘我看不到成绩单，那就等于我考了100分！’这就是捂住耳朵偷铃铛，自己骗自己呀！",
    synonyms: ["自欺欺人", "抱薪救火", "盗钟掩耳"],
    antonyms: ["光明磊落", "堂堂正正", "心怀坦荡"],
    story: "古时候有个小偷去大户人家偷一个精致的大铁铃。他想把铃搬走，但是铃太响了，一动就会发出洪亮的声音。他一琢磨：‘铃响是因为耳朵能听见。如果我把耳朵捂住，不就听不到了吗？’于是他一手捂住自己的耳朵，一手去砸铃，结果当场被听见响声赶来的主人抓获。"
  },
  {
    word: "闻鸡起舞",
    pinyin: "wén jī qǐ wǔ",
    definition: "听到鸡鸣就起来舞剑练武。比喻有志报国的人及时奋起努力，意志坚强，勤奋不懈。",
    category: "middle",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Morning Sky Gradient -->
  <defs>
    <linearGradient id="morningSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="60%" stop-color="#4C1D95" />
      <stop offset="100%" stop-color="#FFEDD5" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEE2E2" />
      <stop offset="30%" stop-color="#FACC15" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="400" height="300" rx="20" fill="url(#morningSky)" />

  <!-- Rising Sun and Glow -->
  <circle cx="340" cy="180" r="100" fill="url(#sunGlow)" pointer-events="none" />
  <circle cx="340" cy="180" r="50" fill="#FEF08A" opacity="0.9" />

  <!-- Distant purple hills -->
  <path d="M 120,300 C 180,240 280,250 400,280 L 400,300 Z" fill="#3B0764" opacity="0.6" />
  <path d="M -20,300 C 60,260 180,250 320,300 Z" fill="#2E1065" opacity="0.8" />

  <!-- Courtyard Ground -->
  <path d="M -20,240 Q 200,220 420,240 L 420,300 L -20,300 Z" fill="#14532D" /> <!-- Dark green grass -->
  <path d="M -20,260 Q 200,240 420,260 L 420,300 L -20,300 Z" fill="#052E16" opacity="0.4" />
  
  <!-- Backyard Cobblestone path -->
  <path d="M 120,300 L 190,230 L 230,232 L 180,300 Z" fill="#4B5563" opacity="0.3" stroke="#374151" stroke-width="1.5" />

  <!-- Traditional Courtyard Grey-tiled Wall -->
  <g transform="translate(-10, 110)">
    <!-- Wall Body -->
    <rect x="0" y="40" width="160" height="90" fill="#6B7280" stroke="#374151" stroke-width="2.5" />
    <path d="M 0,60 L 160,60 M 0,85 L 160,85 M 0,110 L 160,110 M 35,40 L 35,60 M 110,40 L 110,60 M 70,60 L 70,85 M 140,60 L 140,85 M 40,85 L 40,110 M 105,85 L 105,110" stroke="#4B5563" stroke-width="1.5" opacity="0.7" />
    <!-- White Wall plaster trim -->
    <rect x="-10" y="30" width="180" height="10" rx="3" fill="#E5E7EB" stroke="#374151" stroke-width="2" />
    <!-- Traditional Curved Tile Roof top on wall -->
    <path d="M -10,30 Q 30,12 80,26 Q 130,12 170,30" fill="none" stroke="#1F2937" stroke-width="8" stroke-linecap="round" />
    <path d="M -10,30 Q 30,12 80,26 Q 130,12 170,30" fill="none" stroke="#4B5563" stroke-width="4" stroke-linecap="round" />
  </g>

  <!-- Bamboo (Framing element on right) -->
  <g transform="translate(350, 40)" opacity="0.8">
    <!-- Bamboo stems -->
    <path d="M 30,260 L 20,40" stroke="#064E3B" stroke-width="5" fill="none"/>
    <path d="M 45,260 L 38,80" stroke="#0F5132" stroke-width="3" fill="none"/>
    <!-- Bamboo segments -->
    <circle cx="27" cy="190" r="3" fill="#198754" />
    <circle cx="24" cy="120" r="3" fill="#198754" />
    <!-- Drooping leaves -->
    <path d="M 23,120 Q -5,110 -15,125" fill="#198754" />
    <path d="M 23,120 Q 5,130 -3,145" fill="#198754" />
    <path d="M 25,80 Q 2,65 -8,80" fill="#14532D" />
    <path d="M 25,80 Q 10,95 8,110" fill="#14532D" />
  </g>

  <!-- THE ROOSTER (鸡) - Standing proudly on the courtyard wall -->
  <g transform="translate(60, 65)">
    <!-- Rooster Legs -->
    <line x1="20" y1="85" x2="16" y2="105" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="20" y1="85" x2="26" y2="104" stroke="#F59E0B" stroke-width="3" />
    <line x1="30" y1="85" x2="36" y2="105" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <!-- Three claws -->
    <path d="M 16,105 L 10,108 M 16,105 L 16,111 M 16,105 L 22,108" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 36,105 L 30,108 M 36,105 L 36,111 M 36,105 L 42,108" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />

    <!-- Big Fluffy Colorful Tail Feathers -->
    <path d="M 12,50 Q -25,15 -35,45 C -40,65 -20,80 10,65 Z" fill="#1E3A8A" stroke="#172554" stroke-width="1.5" />
    <path d="M 8,45 Q -15,-5 -22,25 C -25,45 -10,60 10,55 Z" fill="#0284C7" stroke="#172554" stroke-width="1.5" />
    <path d="M 6,40 Q -5,-15 -2,15 C -2,32 5,45 8,40 Z" fill="#0D9488" />

    <!-- Rooster Body -->
    <ellipse cx="25" cy="55" rx="22" ry="17" fill="#EA580C" stroke="#7C2D12" stroke-width="2" />
    <!-- Wing on body -->
    <path d="M 12,50 Q 25,35 34,52 Q 22,70 12,50 Z" fill="#F97316" stroke="#7C2D12" stroke-width="1.8" />
    <!-- Gold wing highlights -->
    <path d="M 18,48 Q 26,40 30,50" fill="none" stroke="#FACC15" stroke-width="2" />

    <!-- Neck with feathered collar -->
    <path d="M 28,42 C 34,25 40,15 48,12 C 50,22 42,42 34,48 Z" fill="#DC2626" />
    <path d="M 32,38 C 38,20 44,12 48,12" stroke="#FACC15" stroke-width="2.5" stroke-linecap="round" />

    <!-- Head & Comb (Beak wide open throwing back his head to crow!) -->
    <circle cx="50" cy="12" r="10" fill="#DC2626" />
    <!-- Open Beak -->
    <path d="M 58,8 L 70,2 L 62,11 Z M 58,14 L 66,20 L 59,10 Z" fill="#FACC15" stroke="#7C2D12" stroke-width="1.5" stroke-linejoin="round" />
    <!-- Little shiny black eye -->
    <circle cx="48" cy="8" r="2.5" fill="#FFFFFF" />
    <circle cx="48" cy="8" r="1.2" fill="#000000" />
    <!-- Drooping Wattle below beak -->
    <path d="M 54,18 C 56,26 48,28 48,18 Z" fill="#EF4444" stroke="#7C2D12" stroke-width="1" />
    <!-- Majestic Head Comb (Crown) -->
    <path d="M 44,8 Q 36,-10 44,-2 Q 48,-12 52,0 Q 58,-8 56,4 Z" fill="#EF4444" stroke="#991B1B" stroke-width="1.5" />

    <!-- Crowing sound waves & notes! -->
    <g transform="translate(72, -5)">
      <!-- Wave 1 -->
      <path d="M 5,10 Q 15,0 20,12" fill="none" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" opacity="0.9" />
      <!-- Wave 2 -->
      <path d="M 12,5 Q 26,-12 34,8" fill="none" stroke="#FACC15" stroke-width="4" stroke-linecap="round" opacity="0.7" />
      <!-- Note symbols -->
      <path d="M 22,-8 L 22,-18 L 30,-16 L 30,-12 L 22,-14" fill="#FEF08A" stroke="#7C2D12" stroke-width="1" />
      <circle cx="20" cy="-8" r="3" fill="#FEF08A" stroke="#7C2D12" stroke-width="1" />
    </g>
  </g>

  <!-- THE DILIGENT HERO (少年祖逖) - Performing high-spirited sword dance -->
  <g transform="translate(160, 95)">
    <!-- Motion Swoops / Speed Trails of sword -->
    <path d="M 85,32 A 45,45 0 0,0 155,-5" fill="none" stroke="#E0F2FE" stroke-width="4" stroke-linecap="round" opacity="0.6" stroke-dasharray="2 3" />
    <path d="M 70,60 A 55,55 0 0,1 150,55" fill="none" stroke="#E0F2FE" stroke-width="5.5" stroke-linecap="round" opacity="0.4" />
    <!-- Action speed sparkles -->
    <path d="M 125,5 L 130,-5 L 135,5 L 145,10 L 135,15 L 130,25 L 125,15 L 115,10 Z" fill="#FFFFFF" opacity="0.9" />

    <!-- Left Leg (lunging forward) -->
    <path d="M 30,120 Q 55,122 75,150 L 55,152 Q 35,128 30,120 Z" fill="#0369A1" stroke="#0F172A" stroke-width="2" />
    <ellipse cx="75" cy="150" rx="8" ry="4.5" fill="#475569" stroke="#1E293B" stroke-width="1.8" /> <!-- Right foot shoe -->
    
    <!-- Right Leg (bent deep back) -->
    <path d="M -10,122 Q -30,135 -40,146 L -25,152 Q -15,138 -10,122 Z" fill="#0369A1" stroke="#0F172A" stroke-width="2" />
    <ellipse cx="-40" cy="146" rx="8" ry="4.5" fill="#475569" stroke="#1E293B" stroke-width="1.8" /> <!-- Left foot shoe -->

    <!-- Cyan traditional robe (vivid coloring) -->
    <path d="M -22,75 Q 15,62 52,78 C 45,115 15,125 -15,122 Z" fill="#06B6D4" stroke="#0891B2" stroke-width="2" />
    
    <!-- Red belted sash with dangling ties representing action -->
    <rect x="-16" y="92" width="58" height="8" rx="2" fill="#E11D48" stroke="#9F1239" stroke-width="1.5" />
    <!-- Flowing sash tails -->
    <path d="M -5,98 Q -18,115 -25,125" fill="none" stroke="#E11D48" stroke-width="3" stroke-linecap="round" />
    <path d="M 5,98 Q -2,118 -4,130" fill="none" stroke="#E11D48" stroke-width="3.5" stroke-linecap="round" />

    <!-- Left Hand extending back for style and balance -->
    <path d="M -18,72 Q -45,62 -55,50" fill="none" stroke="#06B6D4" stroke-width="9" stroke-linecap="round" />
    <path d="M -18,72 Q -45,62 -55,50" fill="none" stroke="#0891B2" stroke-width="2.2" stroke-linecap="round" />
    <circle cx="-55" cy="50" r="5.5" fill="#FEE2E2" stroke="#0891B2" stroke-width="1.5" />

    <!-- Head and high topknot -->
    <rect x="5" y="42" width="16" height="15" fill="#FEE2E2" />
    <circle cx="13" cy="24" r="23" fill="#FEE2E2" stroke="#0891B2" stroke-width="2.5" />
    <!-- Black traditional hair & cute topknot bun on top -->
    <path d="M -8,18 Q 13,-8 34,18 C 30,4 21,3 13,8 C 5,3 -4,4 -8,18 Z" fill="#1E293B" />
    <!-- Red ribbon tied in bun -->
    <circle cx="13" cy="-3" r="7" fill="#E11D48" />
    <path d="M 13,-10 Q 5,-20 0,-18 M 13,-10 Q 22,-20 26,-15" fill="none" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="13" cy="-3" r="4.5" fill="#1E293B" />

    <!-- Joyful determined eyes and rosy cheeks -->
    <path d="M 2,16 Q 8,10 13,15" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" /> <!-- Determined eyebrow left -->
    <path d="M 23,17 Q 28,11 31,17" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" /> <!-- Determined eyebrow right -->
    <circle cx="11" cy="24" r="3" fill="#0F172A" /> <!-- Left pupil -->
    <circle cx="27" cy="25" r="3" fill="#0F172A" /> <!-- Right pupil -->
    <circle cx="12" cy="23" r="1" fill="#FFFFFF" /> <!-- Sparkle -->
    <circle cx="28" cy="24" r="1" fill="#FFFFFF" />
    <!-- Cheerful rosy blush -->
    <circle cx="7" cy="29" r="4" fill="#FDA4AF" opacity="0.8" />
    <circle cx="29" cy="30" r="4" fill="#FDA4AF" opacity="0.8" />
    <!-- Wide happy smiling mouth -->
    <path d="M 14,33 Q 19,38 24,32" fill="none" stroke="#7F1D1D" stroke-width="2.5" stroke-linecap="round" />

    <!-- Right arm extended forward holding the majestic sword -->
    <path d="M 36,65 Q 68,55 85,38" fill="none" stroke="#06B6D4" stroke-width="11" stroke-linecap="round" />
    <path d="M 36,65 Q 68,55 85,38" fill="none" stroke="#0891B2" stroke-width="2.2" stroke-linecap="round" />
    
    <!-- Fist clutching sword -->
    <circle cx="85" cy="38" r="7" fill="#FEE2E2" stroke="#0891B2" stroke-width="1.8" />

    <!-- EXQUISITE ANCIENT METALLIC SWORD! -->
    <!-- Gold hilt guard -->
    <path d="M 80,45 L 94,30" stroke="#EAB308" stroke-width="5" stroke-linecap="round" />
    <!-- Red wool tassel dangling from handle of sword -->
    <path d="M 82,42 Q 78,55 74,74" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="74" cy="74" r="3" fill="#EF4444" />
    
    <!-- Long gleaming blade pointing into the morning sun! -->
    <path d="M 87,38 L 155,-12 L 158,-9 L 90,41 Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5" stroke-linejoin="round" />
    <line x1="88" y1="39" x2="156" y2="-10" stroke="#cbd5e1" stroke-width="1.5" />
    <!-- Gleaming star shine at tip of sword -->
    <path d="M 152,-18 L 155,-12 L 161,-15 L 156,-9 L 159,-3 L 153,-8 L 147,-6 L 151,-11 Z" fill="#38BDF8" />
  </g>

  <!-- Educational labels -->
  <!-- Label 1: Active Rooster crowing -->
  <g transform="translate(45, 195)" opacity="0.95">
    <rect width="66" height="18" rx="5" fill="#EA580C" stroke="#9A3412" stroke-width="1" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">🐓 公鸡报晓</text>
  </g>
  
  <!-- Label 2: Training diligently -->
  <g transform="translate(255, 255)" opacity="0.95">
    <rect width="66" height="18" rx="5" fill="#0891B2" stroke="#0E7490" stroke-width="1" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">⚔️ 晨起练剑</text>
  </g>
</svg>`,
    mnemonic: "清晨大公鸡打鸣，年轻将军翻身行。月光底下练宝剑，保家卫国志气宏！记住：听到公鸡叫就立刻起床看书、运动、学本领，就是最棒的学习计划！",
    kidsExplanation: "就像早上小闹钟刚响，小萌娃就高高兴兴一骨碌爬起来，认真朗读课文、背古诗，这就是勤学的闻鸡起舞！",
    synonyms: ["发愤图强", "自强不息", "励精图治", "废寝忘食"],
    antonyms: ["自暴自弃", "得过且过", "玩物丧志", "饱食终日"],
    story: "晋代青年祖逖和好友刘琨志向远大。为了练好武艺保卫国家，他们约定，只要半夜听到荒原上的大公鸡啼鸣，就立刻穿好衣服起床，到院子里舞剑练功。风雨交加也从不中断。最终他们都成为了雄才大略的抗敌名将。"
  },
  {
    word: "卧薪尝胆",
    pinyin: "wò xīn cháng dǎn",
    definition: "睡在干柴上，吃饭前尝一尝苦胆。形容人刻苦自励，发愤图强，立志雪耻创造成就。",
    category: "middle",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Ancient stone room background -->
  <rect width="400" height="300" rx="20" fill="#F8FAFC" />
  
  <!-- Brick wall pattern on background -->
  <path d="M 0,80 L 400,80 M 0,160 L 400,160 M 80,0 L 80,80 M 280,0 L 280,80 M 180,80 L 180,160 M 340,80 L 340,160 M 100,160 L 100,300 M 240,160 L 240,300" stroke="#E2E8F0" stroke-width="2.5" opacity="0.6" stroke-linecap="round" />
  
  <!-- Straw mat & Ground -->
  <rect x="0" y="240" width="400" height="60" rx="10" fill="#E2E8F0" opacity="0.4" />
  
  <!-- Hard dry logs/firewood pile (卧薪 - Bed of firewood) -->
  <g transform="translate(40, 200)">
    <!-- Logs stacked -->
    <!-- Log 1 (back) -->
    <rect x="0" y="30" width="180" height="22" rx="4" fill="#92400E" stroke="#451A03" stroke-width="2" />
    <ellipse cx="180" cy="41" rx="6" ry="11" fill="#78350F" />
    <path d="M 0,35 L 160,35 M 0,47 L 150,47" stroke="#78350F" stroke-width="1.5" />
    
    <!-- Log 2 (cross slanted) -->
    <g transform="rotate(6, 90, 20)">
      <rect x="10" y="10" width="165" height="20" rx="4" fill="#B45309" stroke="#451A03" stroke-width="2" />
      <ellipse cx="175" cy="20" rx="5" ry="10" fill="#92400E" />
      <path d="M 10,16 L 155,16" stroke="#78350F" stroke-width="1.5" />
    </g>
    
    <!-- Log 3 (front bundle) -->
    <g transform="rotate(-4, 80, 25)">
      <rect x="-10" y="25" width="190" height="24" rx="4" fill="#D97706" stroke="#451A03" stroke-width="2.5" />
      <ellipse cx="180" cy="37" rx="6" ry="12" fill="#B45309" />
      <!-- Swirly age rings inside wood end -->
      <ellipse cx="180" cy="37" rx="3" ry="6" fill="#78350F" />
      <!-- Bark cracks -->
      <path d="M 10,32 L 160,32" stroke="#92400E" stroke-width="2" />
      <path d="M 20,40 L 140,40" stroke="#92400E" stroke-width="1.5" />
    </g>

    <!-- Some pointy stray straw straws poking out -->
    <path d="M -15,45 L 15,30 M -5,55 L 25,48" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 160,55 L 195,48 M 170,50 L 185,58" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- King Goujian sitting/gritting teeth on the firewood -->
  <g transform="translate(130, 115)">
    <!-- Body/Shoulders -->
    <path d="M 0,90 C -15,90 -25,120 -20,130 L 60,130 C 65,115 50,90 30,90 Z" fill="#475569" stroke="#1E293B" stroke-width="2.5" />
    <!-- Collar crossing trim (ancient clothing) -->
    <path d="M 5,90 L 20,115 M 25,90 L 10,115" stroke="#F43F5E" stroke-width="4.5" stroke-linecap="round" />
    
    <!-- Determined arms with clenched fists -->
    <path d="M -16,105 Q -25,112 -12,122" fill="none" stroke="#475569" stroke-width="9" stroke-linecap="round" />
    <circle cx="-10" cy="120" r="5" fill="#FEE2E2" stroke="#1E293B" stroke-width="1.5" />
    
    <path d="M 45,105 Q 55,112 42,122" fill="none" stroke="#475569" stroke-width="9" stroke-linecap="round" />
    <circle cx="40" cy="120" r="5" fill="#FEE2E2" stroke="#1E293B" stroke-width="1.5" />

    <!-- Head / Neck -->
    <rect x="5" y="70" width="20" height="25" rx="5" fill="#FEE2E2" />
    <circle cx="15" cy="45" r="28" fill="#FEE2E2" stroke="#1E293B" stroke-width="2.5" />

    <!-- Crown / Topknot (Classic ancient Chinese crown) -->
    <rect x="2" y="8" width="26" height="15" rx="3" fill="#D97706" stroke="#451A03" stroke-width="2" />
    <!-- Jade pin through hair -->
    <line x1="-5" y1="15" x2="35" y2="15" stroke="#10B981" stroke-width="4.5" stroke-linecap="round" />
    <path d="M -2,20 Q 15,2 32,20 Z" fill="#1E293B" />

    <!-- Facial details: extremely determined, sweat of hard work, eyes angled down in focus -->
    <path d="M -3,32 L 6,36 M 33,32 L 24,36" stroke="#000" stroke-width="4.5" stroke-linecap="round" /> <!-- Angry/focused eyebrows -->
    <circle cx="4" cy="46" r="3.5" fill="#1E293B" /> <!-- Left eye -->
    <circle cx="26" cy="46" r="3.5" fill="#1E293B" /> <!-- Right eye -->
    
    <!-- Determination sweat droplets -->
    <path d="M -8,45 Q -14,48 -10,54" fill="none" stroke="#38BDF8" stroke-width="2" />
    <path d="M 38,45 Q 44,48 40,54" fill="none" stroke="#38BDF8" stroke-width="2" />
    
    <!-- Blush -->
    <circle cx="2" cy="55" r="4.5" fill="#F87171" opacity="0.6" />
    <circle cx="28" cy="55" r="4.5" fill="#F87171" opacity="0.6" />

    <!-- Determined straight line mouth -->
    <path d="M 9,60 L 21,60" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round" />
  </g>

  <!-- Hanging Bitter Gall Bladder (尝胆 - Hanging Gall Bladder) -->
  <!-- Ceiling Hook and Rope -->
  <line x1="280" y1="0" x2="280" y2="100" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
  
  <!-- Gall Bladder container with highlights and drops -->
  <g transform="translate(280, 110)">
    <!-- Gall Body (Teardrop shape) -->
    <path d="M 0,-15 C -22,-5 -26,30 0,35 C 26,30 22,-5 0,-15 Z" fill="#047857" stroke="#022C22" stroke-width="2.5" />
    <!-- Highlight reflection panel -->
    <path d="M -13,10 A 15,15 0 0,1 -6,-6" fill="none" stroke="#A7F3D0" stroke-width="3" stroke-linecap="round" opacity="0.8" />
    
    <!-- Dripping extreme bitterness drops -->
    <path d="M 0,38 Q 4,50 0,55 C -4,50 0,38 0,38" fill="#10B981" />
    
    <!-- Little green toxic/bitter aura lines to show how bitter it is -->
    <path d="M -32,15 H -24 M 24,15 H 32" stroke="#059669" stroke-width="2" opacity="0.8" stroke-linecap="round" />
    <path d="M -26,3 V 10 L -29,8" fill="none" stroke="#059669" stroke-width="2" opacity="0.8" />
  </g>

  <!-- Determined speech bubble from King Goujian -->
  <g transform="translate(190, 30)" opacity="0.95">
    <!-- Bubble cloud body -->
    <path d="M 12,28 Q -6,26 2,12 Q 10,-8 35,2 Q 60,-2 65,12 Q 72,28 45,28 Z" fill="#EF4444" />
    <text x="34" y="16" font-family="'SimHei', sans-serif" font-weight="950" font-size="10" fill="#FFFFFF" text-anchor="middle">发愤图强！</text>
    <path d="M 10,25 L -5,35 L 5,28" fill="#EF4444" />
  </g>

  <!-- Child-friendly Educational labels -->
  <!-- Firewood Label -->
  <g transform="translate(45, 255)" opacity="0.9">
    <rect width="66" height="18" rx="5" fill="#B45309" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">🪵 睡在柴火上</text>
  </g>
  
  <!-- Bitter Gall Label -->
  <g transform="translate(290, 165)" opacity="0.9">
    <rect width="66" height="18" rx="5" fill="#047857" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">😝 尝苦胆提神</text>
  </g>
</svg>`,
    mnemonic: "柴草上面当床睡，苦胆尝尝提神智。不忘艰难和屈辱，越国终究大胜利！记住：在困境中不气馁、不骄奢，用极大恒心和斗志努力奋斗！",
    kidsExplanation: "就像打比赛输了之后，你不哭鼻子也不气馁，每天刻苦训练技能，吃吃苦头也不嫌弃，终于在下次拿到了冠军奖杯！",
    synonyms: ["发愤图强", "奋发图强"],
    antonyms: ["纸上谈兵", "安于现状", "醉生梦死", "享乐至上"],
    story: "春秋时期，越王勾践败于吴王夫差。勾践为了不忘记失败的教训，他晚上睡在硌人的硬柴草上，在屋梁挂一颗奇苦无比的猪胆。每天吃饭前、睡觉前都要舔一舔胆汁，苦得直咧嘴，来提醒自己刻苦学习，最终他东山再起重创敌国。"
  },
  {
    word: "完璧归赵",
    pinyin: "wán bì guī zhào",
    definition: "本指把和氏璧完好地送回赵国。后比喻把物品原封不动、完好地归还给原主。",
    category: "middle",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Royal Palace Background -->
  <defs>
    <linearGradient id="palaceWall" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FEFBEB" />
      <stop offset="100%" stop-color="#FEF3C7" />
    </linearGradient>
    <linearGradient id="jadeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <!-- Soft emerald shine radial glow -->
    <radialGradient id="jadeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A7F3D0" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#34D399" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="400" height="300" rx="20" fill="url(#palaceWall)" />

  <!-- Geometrical Wood Palace Lattice Screen (Behind subjects) -->
  <g opacity="0.12" stroke="#B45309" stroke-width="1.5">
    <line x1="40" y1="0" x2="40" y2="220" />
    <line x1="360" y1="0" x2="360" y2="220" />
    <line x1="120" y1="0" x2="120" y2="220" />
    <line x1="280" y1="0" x2="280" y2="220" />
    <line x1="200" y1="0" x2="200" y2="220" />
    <line x1="40" y1="70" x2="360" y2="70" />
    <line x1="40" y1="140" x2="360" y2="140" />
    <!-- Lattice diagonal decoration detail -->
    <path d="M 40,35 L 120,35 M 120,105 L 200,105 M 200,35 L 280,35 M 280,105 L 360,105" />
    <path d="M 40,175 L 120,175 M 120,175 L 200,175 M 200,175 L 280,175 M 280,175 L 360,175" />
  </g>

  <!-- Palace Floor tiles in perspective -->
  <path d="M 0,220 L 400,220 L 400,300 L 0,300 Z" fill="#FDE68A" />
  <path d="M 0,220 L 400,220" stroke="#D97706" stroke-width="2.5" />
  <!-- Tiles lines -->
  <line x1="80" y1="220" x2="40" y2="300" stroke="#F59E0B" stroke-width="1.5" />
  <line x1="160" y1="220" x2="140" y2="300" stroke="#F59E0B" stroke-width="1.5" />
  <line x1="240" y1="220" x2="260" y2="300" stroke="#F59E0B" stroke-width="1.5" />
  <line x1="320" y1="220" x2="360" y2="300" stroke="#F59E0B" stroke-width="1.5" />

  <!-- RED PALACE PILLARS (L&R Framing) -->
  <!-- Left Pillar -->
  <rect x="0" y="0" width="35" height="300" fill="#991B1B" stroke="#7F1D1D" stroke-width="2" />
  <!-- Golden dragon clouds on pillar -->
  <path d="M 0,50 Q 20,60 10,75 M 0,130 Q 25,140 15,155 M 0,210 Q 20,220 15,235" fill="none" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" opacity="0.4" />
  <!-- Right Pillar -->
  <rect x="365" y="0" width="35" height="300" fill="#991B1B" stroke="#7F1D1D" stroke-width="2" />
  <path d="M 400,60 Q 380,70 385,85 M 400,140 Q 375,150 380,165 M 400,220 Q 380,230 385,245" fill="none" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" opacity="0.4" />

  <!-- Palace Beam decorative horizontal top -->
  <rect x="0" y="0" width="400" height="25" fill="#7F1D1D" />
  <rect x="30" y="8" width="340" height="8" fill="#FBBF24" opacity="0.8" />

  <!-- THE ASTONISHED QIN MINISTER / SOLDIER (Far background peeking from right column) -->
  <g transform="translate(328, 100)">
    <!-- Shocked face -->
    <ellipse cx="22" cy="30" rx="15" ry="17" fill="#FEE2E2" stroke="#451A03" stroke-width="2" />
    <!-- Traditional cap -->
    <path d="M 8,18 Q 22,0 36,18 Z" fill="#374151" stroke="#111827" stroke-width="1.5" />
    <circle cx="22" cy="3" r="3.5" fill="#EF4444" />
    <!-- Shocked eyes -->
    <circle cx="15" cy="26" r="4" fill="#FFFFFF" stroke="#000" stroke-width="1" />
    <circle cx="15" cy="26" r="1.5" fill="#000" />
    <circle cx="28" cy="26" r="4" fill="#FFFFFF" stroke="#000" stroke-width="1" />
    <circle cx="28" cy="26" r="1.5" fill="#000" />
    <!-- Wide open shocked mouth -->
    <ellipse cx="21" cy="39" rx="4.5" ry="6" fill="#7F1D1D" stroke="#000" stroke-width="1" />
    <path d="M 10,14 C 18,17 26,17 34,14" fill="none" stroke="#FCA5A5" stroke-width="2" />
  </g>

  <!-- HERO LIN XIANGRU (蔺相如) - Presenting the pristine jade with pride -->
  <g transform="translate(68, 90)">
    <!-- Body and Royal Gown -->
    <path d="M -15,130 C -25,130 -35,160 -30,170 L 60,170 C 65,160 55,130 35,130 Z" fill="#5B21B6" stroke="#4C1D95" stroke-width="2" />
    <path d="M 5,130 L 15,152 M 15,130 L 5,152" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" />

    <!-- Wide beautiful traditional flowing robes sleeves -->
    <path d="M -22,135 Q -42,145 -48,168" fill="none" stroke="#5B21B6" stroke-width="10" stroke-linecap="round" />
    <path d="M -22,135 Q -42,145 -48,168" fill="none" stroke="#311042" stroke-width="2" stroke-linecap="round" />
    
    <!-- Arm holding presenting board or tray -->
    <path d="M 30,138 Q 50,145 68,140" fill="none" stroke="#5B21B6" stroke-width="11" stroke-linecap="round" />
    <path d="M 30,138 Q 50,145 68,140" fill="none" stroke="#311042" stroke-width="2" stroke-linecap="round" />
    <circle cx="68" cy="140" r="5.5" fill="#FEE2E2" stroke="#4C1D95" stroke-width="1.5" />

    <!-- Head and High Advisor Hat -->
    <rect x="5" y="80" width="16" height="15" fill="#FEE2E2" />
    <circle cx="13" cy="56" r="24" fill="#FEE2E2" stroke="#4C1D95" stroke-width="2.5" />
    
    <!-- Tall Advisor's Hat -->
    <rect x="2" y="16" width="22" height="20" rx="3" fill="#1F2937" stroke="#111827" stroke-width="2" />
    <!-- Long horizontal hat wings -->
    <path d="M -22,25 L 2,27 M 24,27 L 46,25" stroke="#1F2937" stroke-width="4.5" stroke-linecap="round" />
    <circle cx="13" cy="18" r="3" fill="#EF4444" />

    <!-- Scholarly goatee beard -->
    <path d="M 12,80 L 12,105 L 19,98 Z" fill="#1F2937" />

    <!-- Calm visual expressions: Closed happy smiling eyes -->
    <path d="M 2,52 Q 7,46 12,52" fill="none" stroke="#1F2937" stroke-width="3" stroke-linecap="round" />
    <path d="M 20,52 Q 25,46 29,52" fill="none" stroke="#1F2937" stroke-width="3" stroke-linecap="round" />
    <circle cx="6" cy="60" r="4.5" fill="#F87171" opacity="0.6" />
    <circle cx="27" cy="60" r="4.5" fill="#F87171" opacity="0.6" />
    <!-- Proud confident smile -->
    <path d="M 11,68 Q 16,74 21,68" fill="none" stroke="#7F1D1D" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- THE GLORIOUS PERFECT JADE "HE SHI BI" (和氏璧) -->
  <!-- Emerald Glow Underlying Circles -->
  <circle cx="265" cy="130" r="70" fill="url(#jadeGlow)" pointer-events="none" />
  <circle cx="265" cy="130" r="50" fill="url(#jadeGlow)" opacity="0.5" pointer-events="none" />

  <!-- Red Lacquer presenting tray -->
  <g transform="translate(195, 172)">
    <!-- Red silk cushion trailing off the box -->
    <path d="M 15,15 Q 70,35 125,15 L 115,35 L 25,35 Z" fill="#FBBF24" opacity="0.9" stroke="#D97706" stroke-width="1.5" />
    <!-- Stand wood/Lacquer tray context -->
    <rect x="0" y="0" width="140" height="18" rx="4" fill="#78350F" stroke="#451A03" stroke-width="2.5" />
    <!-- Golden corners of presenting tray -->
    <path d="M 0,0 L 12,0 L 0,12 Z M 140,0 L 128,0 L 140,12 Z" fill="#FACC15" />
  </g>

  <!-- Complete, circular, undamaged green jade disk -->
  <circle cx="265" cy="130" r="42" fill="url(#jadeGradient)" stroke="#064E3B" stroke-width="4" />
  <!-- Traditional central hole -->
  <circle cx="265" cy="130" r="12" fill="#FEFEEB" stroke="#064E3B" stroke-width="2.5" />
  
  <!-- Intricately carved cloud outlines on the precious jade -->
  <circle cx="265" cy="130" r="28" fill="none" stroke="#A7F3D0" stroke-width="2" stroke-dasharray="5 7" opacity="0.8" />
  <!-- Delicate ancient swirls -->
  <path d="M 252,122 Q 256,116 260,120" fill="none" stroke="#A7F3D0" stroke-width="1.8" stroke-linecap="round" />
  <path d="M 278,138 Q 274,144 270,140" fill="none" stroke="#A7F3D0" stroke-width="1.8" stroke-linecap="round" />

  <!-- Traditional silk red tassels hanging from the jade's central hole -->
  <path d="M 265,142 Q 260,172 268,206" fill="none" stroke="#DC2626" stroke-width="3" stroke-linecap="round" />
  <!-- Yellow bead details on tassel -->
  <circle cx="263" cy="158" r="3.5" fill="#FACC15" />
  <path d="M 268,206 L 264,222 M 268,206 L 273,222" stroke="#B91C1C" stroke-width="2" stroke-linecap="round" />

  <!-- Shiny Sparkles around the undamaged perfect jade -->
  <g transform="translate(265, 130)" opacity="0.95">
    <path d="M -52,-42 L -49,-34 L -41,-31 L -49,-28 L -52,-20 L -55,-28 L -63,-31 L -55,-34 Z" fill="#FFE082" />
    <path d="M 45,-48 L 48,-42 L 54,-39 L 48,-36 L 45,-30 L 42,-36 L 36,-39 L 42,-42 Z" fill="#FFE082" />
    <path d="M -55,30 L -52,36 L -46,39 L -52,42 L -55,48 L -58,42 L -64,39 L -58,36 Z" fill="#FFE082" />
  </g>

  <!-- Educational UI text pill boxes -->
  <!-- Box 1: Intact Jade -->
  <g transform="translate(68, 255)" opacity="0.95">
    <rect width="66" height="18" rx="5" fill="#047857" stroke="#022C22" stroke-width="1" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">💚 完好无损</text>
  </g>
  
  <!-- Box 2: Safely returned to Zhao -->
  <g transform="translate(232, 255)" opacity="0.95">
    <rect width="66" height="18" rx="5" fill="#991B1B" stroke="#7F1D1D" stroke-width="1" />
    <text x="33" y="12" font-family="'SimHei', sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">🏰 安全归赵</text>
  </g>
</svg>`,
    mnemonic: "楚国美玉天下知，秦王想要使巧思。蔺相如大义凛然，完好把玉送回国！记住：借别人的故事书 and 画笔要好好爱护，用完后整整齐齐还给人家。",
    kidsExplanation: "就像你向同桌借了一支很漂亮的彩铅，用完之后顺手削得整整齐齐，笔尖完好，笑比哭好地还回去，这就是完璧归赵！",
    synonyms: ["物归原主", "秋毫无犯"],
    antonyms: ["巧取豪夺", "据为己有"],
    story: "战国时，秦昭王听说赵惠文王得到了稀世之宝‘和氏璧’，写信表示愿拿十五座城池同赵国交换。赵王派智勇双全的蔺相如带壁前往。蔺相如朝见秦王后，看出秦王并无诚意交换，便凭借非凡胆识在章台怒斥秦王，并派人在夜里偷偷把和氏璧送回了赵国。"
  },
  {
    word: "刻舟求剑",
    pinyin: "kè zhōu qiú jiàn",
    definition: "在行驶的船上刻记号寻找落水的剑。比喻拘泥成法，不懂得事物已经随时间和环境的变化而变化。",
    category: "elementary",
    illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Sky background -->
  <rect width="400" height="300" rx="20" fill="#F0F9FF" />
  
  <!-- Subtle clouds in the sky -->
  <path d="M 40,60 Q 55,45 70,60 Q 85,45 100,60 L 40,60 Z" fill="#FFFFFF" opacity="0.8" />
  <path d="M 320,50 Q 330,38 342,50 Q 354,38 366,50 L 320,50 Z" fill="#FFFFFF" opacity="0.8" />
  
  <!-- Distant mountains in soft green-blue -->
  <path d="M -10,130 L 40,80 L 100,130 L 170,90 L 240,130 Z" fill="#CCE3DE" opacity="0.7" />
  
  <!-- Safe deep water layout at the bottom half -->
  <rect x="0" y="160" width="400" height="140" fill="#E0F2FE" />
  
  <!-- Multi-layered water waves with transparency -->
  <path d="M 0,165 Q 100,150 200,165 T 400,165 L 400,300 L 0,300 Z" fill="#BAE6FD" opacity="0.6" />
  <path d="M 0,185 Q 80,175 160,185 T 320,185 T 400,185 L 400,300 L 0,300 Z" fill="#7DD3FC" opacity="0.5" />
  
  <!-- The Sinking Chinese Sword (deep underwater, visible) -->
  <!-- Falling trajectory dotted lines / bubbles -->
  <path d="M 110,180 Q 95,200 90,220" fill="none" stroke="#F0F9FF" stroke-width="3" stroke-dasharray="4 4" />
  <circle cx="85" cy="205" r="5" fill="#FFFFFF" opacity="0.8" />
  <circle cx="95" cy="225" r="3" fill="#FFFFFF" opacity="0.8" />
  <circle cx="78" cy="245" r="4" fill="#FFFFFF" opacity="0.8" />
  <circle cx="84" cy="265" r="6" fill="#FFFFFF" opacity="0.8" />
  
  <!-- Sword structure under water at bottom-left -->
  <!-- Sword blade (silver-blue metallic) -->
  <g transform="translate(85,245) rotate(-35)">
    <!-- Light ray around the sword -->
    <ellipse cx="0" cy="0" rx="15" ry="40" fill="#FFF59D" opacity="0.4" filter="blur(4px)" />
    <!-- Blade -->
    <path d="M -4,-28 L 4,-28 L 4,12 L 0,22 L -4,12 Z" fill="#ECEFF1" stroke="#455A64" stroke-width="2.5" />
    <line x1="0" y1="-28" x2="0" y2="15" stroke="#B0BEC5" stroke-width="1.5" />
    <!-- Guard -->
    <path d="M -10,-28 Q 0,-34 10,-28 L 8,-32 Q 0,-38 -8,-32 Z" fill="#FFC107" stroke="#E65100" stroke-width="2.5" />
    <!-- Handle / Hilt -->
    <rect x="-3.5" y="-48" width="7" height="20" rx="2.5" fill="#8D6E63" stroke="#4E342E" stroke-width="2" />
    <!-- Tassel / Ribbon -->
    <path d="M 0,-48 Q -8,-58 -4,-68" fill="none" stroke="#E53935" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="-4" cy="-68" r="3.5" fill="#E53935" />
  </g>
  
  <!-- Traditional Chinese Wooden Boat -->
  <g transform="translate(140, 115)">
    <!-- Boat hull curve shadow -->
    <path d="M -40,35 Q 60,65 240,40 Q 230,85 100,85 Q -10,85 -40,35 Z" fill="#4E342E" opacity="0.25" />
    <!-- Wooden hull -->
    <path d="M -40,30 Q 60,60 240,35 L 245,30 Q 220,70 100,70 Q -10,70 -40,30 Z" fill="#8D6E63" stroke="#5D4037" stroke-width="3" />
    <!-- Wooden planks on boat -->
    <path d="M -30,35 Q 60,57 230,38" fill="none" stroke="#6D4C41" stroke-width="2" />
    <path d="M -15,45 Q 60,62 215,45" fill="none" stroke="#6D4C41" stroke-width="1.5" />
    
    <!-- Big distinct Carved Mark 'X' & notches on the hull -->
    <!-- Carving spot: exactly aligned with y-coordinate above the sword splash -->
    <g transform="translate(-2, 48)">
      <!-- Highlight glow under the mark -->
      <circle cx="0" cy="0" rx="14" ry="10" fill="#FFF" opacity="0.6" />
      <line x1="-8" y1="-8" x2="8" y2="8" stroke="#E53935" stroke-width="4.5" stroke-linecap="round" />
      <line x1="8" y1="-8" x2="-8" y2="8" stroke="#E53935" stroke-width="4.5" stroke-linecap="round" />
      <circle cx="-12" cy="4" r="2.5" fill="#FFCC80" /> <!-- Wood chips flying off -->
      <circle cx="10" cy="-6" r="2" fill="#FFCC80" />
    </g>
  </g>
  
  <!-- The Character: Ancient Chinese passenger (scholarly robe, topknot) -->
  <g transform="translate(140, 115)">
    <!-- Legs inside the boat -->
    <path d="M -15,25 Q -10,35 5,35" fill="none" stroke="#3E2723" stroke-width="8" stroke-linecap="round" />
    
    <!-- Body with Hanfu (traditional robe) -->
    <path d="M -35,28 C -35,5 -10,0 10,12 C 10,12 -5,30 -20,28 Z" fill="#FFF59D" stroke="#F57F17" stroke-width="2.5" />
    <path d="M -22,12 L -6,22" stroke="#F57F17" stroke-width="2.5" />
    
    <!-- Head / Face -->
    <circle cx="5" cy="-14" r="19" fill="#FFE082" stroke="#FF8F00" stroke-width="2.5" />
    
    <!-- Ancient topknot / Bun -->
    <circle cx="5" cy="-35" r="7.5" fill="#212121" />
    <path d="M 5,-33 Q -8,-38 -6,-42 Q 0,-44 8,-38 Z" fill="#212121" />
    <path d="M 5,-35 L 5,-45" stroke="#E53935" stroke-width="2.5" stroke-linecap="round" /> <!-- Hair pin/ribbon -->
    
    <!-- Worried yet earnest facial expression -->
    <!-- Eyebrows raised weirdly -->
    <path d="M -6,-21 Q -2,-24 1,-21" fill="none" stroke="#4E342E" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 6,-21 Q 10,-24 13,-21" fill="none" stroke="#4E342E" stroke-width="2.5" stroke-linecap="round" />
    <!-- Eyes squinting at the carving action -->
    <circle cx="-2" cy="-15" r="2.5" fill="#212121" />
    <circle cx="10" cy="-15" r="2.5" fill="#212121" />
    <!-- Cheerful smirk or silly look -->
    <path d="M -1,-8 Q 4,-4 8,-9" fill="none" stroke="#D84315" stroke-width="2.5" stroke-linecap="round" />
    <!-- Sweat drop from focus -->
    <path d="M -16,-12 C -16,-12 -18,-15 -20,-15 C -22,-15 -21,-12 -19,-10 Z" fill="#29B6F6" />
    
    <!-- Arm reaching down to carve -->
    <!-- Left Hand holding carving knife -->
    <path d="M -15,12 Q -22,35 -6,45" fill="none" stroke="#FFF59D" stroke-width="9.5" stroke-linecap="round" />
    <circle cx="-5" cy="45" r="7.5" fill="#FFE082" stroke="#FF8F00" stroke-width="2" />
    <!-- Knife/Chisel -->
    <rect x="-8" y="44" width="4" height="15" rx="1" fill="#CFD8DC" stroke="#455A64" stroke-width="1.5" transform="rotate(30 -8 44)" />
  </g>
  
  <!-- Ocean foreground waves -->
  <path d="M 0,205 Q 120,185 240,205 T 400,205 L 400,300 L 0,300 Z" fill="#0284C7" opacity="0.3" />
  
  <!-- Comic pointer text/arrow for extra clarity -->
  <g transform="translate(20, 200)" opacity="0.95">
    <rect width="65" height="18" rx="5" fill="#E53935" />
    <text x="32" y="12" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">掉落在此处 🗡️</text>
    <path d="M 65,9 L 75,9" stroke="#E53935" stroke-width="2" fill="none" />
  </g>
  
  <!-- Carving note bubble -->
  <g transform="translate(170, 45)" opacity="0.95">
    <rect width="90" height="22" rx="6" fill="#4CAF50" />
    <text x="45" y="14" font-family="sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">在这里刻个记号! ✍️</text>
    <path d="M 45,22 L 35,32 L 30,22" fill="#4CAF50" />
  </g>
</svg>`,
    mnemonic: "宝剑落水急得慌，就在船边刻一行。船儿游走剑不动，捞了半天泪流淌！记住：时间、环境都在不停变化，我们做事也得灵活变通，不能死板哦！",
    kidsExplanation: "就像你在飞驰的地铁上面，看到窗外有一棵好玩的花，于是你用笔在地铁座位底下画了个标记，说‘下车后我顺着这个画去找！’这就是刻舟求剑啦！",
    synonyms: ["胶柱鼓瑟", "墨守成规", "守株待兔"],
    antonyms: ["看风使舵", "随机应变", "通权达变"],
    story: "楚国有个乘船渡江的人，宝剑从船里掉进了水里。他急忙用小刀在船弦上剑落水的地方刻了个记号。等船靠岸了，他便沿着刚才刻记号的地方跳下水捞剑，可是船已经走得很远了，宝剑怎么可能还在那里呢？"
  },
  {
    word: "画龙点睛",
    pinyin: "huà lóng diǎn jīng",
    definition: "画龙时点上眼睛。比喻说话或写文章等在关键处用一两句话点明主旨，使内容更加生动有力。",
    category: "elementary",
    mnemonic: "大白墙上画巨龙，只差眼睛没点红。画师神来点两笔，巨龙飞上九天中！记住：在写作文或画画的最后，加上最生动的一点笔触，通篇都发光了！",
    kidsExplanation: "就像你搭起了一座超漂亮的积木城堡，最后在城堡顶上插了一杆迎风飞舞的小彩旗，整个城堡瞬间就变得神气活现！这就是画龙点睛！",
    synonyms: ["锦上添花", "点石成金", "神来之笔"],
    antonyms: ["画蛇添足", "多此一举", "弄巧成拙"],
    story: "南北朝时期张僧繇在寺庙墙壁上画了四条金龙，全都没画眼睛。别人问他为什么，他说：‘点了眼睛，龙就会飞走的。’大家不信。画家提起毛笔朝两条龙眼点了几笔。忽然电闪雷鸣，这两条龙张牙舞爪破墙飞上了天空。"
  },
  {
    word: "愚公移山",
    pinyin: "yú gōng yí shān",
    definition: "愚公为了出行方便，立志要把挡在门前的两座大山移开。比喻做事下定决心，不怕困难，坚持奋斗到底。",
    category: "middle",
    mnemonic: "两座大山当大门，白胡子愚公想要啃。挖土搬山不停息，天神感动助新春！记住：只要我们目标专一、肯下大功夫天天坚持做，连大山都能被搬走！",
    kidsExplanation: "就像一个超级大难题要你解开，或者有一千个单词需要背诵，你嘴上不变，每天坚持背10个，几个月之后你全学会了，这就是愚公的精神！",
    synonyms: ["锲而不舍", "百折不挠", "持之以恒"],
    antonyms: ["半途而废", "浅尝辄止", "知难而退"],
    story: "古代有个叫愚公的人，门前有两座大山挡住去路。他下定决心带子孙挖平大山。智叟笑他太愚笨。愚公说：‘我死了有儿子，儿子生孙子，子孙无穷无尽，而山不会长高，怎么挖不平？’天帝被他的坚韧感动，派神仙把山搬走了。"
  },
  {
    word: "精卫填海",
    pinyin: "jīng wèi tián hǎi",
    definition: "神话中的小鸟精卫衔木石去填平东海。比喻意志极坚强，不畏艰难，誓不罢休的奋斗意志。",
    category: "elementary",
    mnemonic: "精卫衔木小石头，誓要把那东海收。大海虽阔心更硬，百折不挠写风流！记住：大目标看似高不可攀，只要你绝不放弃、咬牙坚持，就是最伟大的小英雄！",
    kidsExplanation: "就像要把整个大操场上的落叶一片片扫干净，虽然落叶在落，你毫无惧色，坚持每天扫一点，直到打扫得干干净净！",
    synonyms: ["愚公移山", "坚持不懈"],
    antonyms: ["一蹶不振", "半途而废", "知难而退"],
    story: "神话中炎帝的小女儿女娃，在东海游玩不幸溺水，化作一只名叫‘精卫’的鸟。她天天在东海和太行山之间穿飞，用小嘴巴衔一颗小石头或小木枝扔进东海，下望要把东海填平。"
  },
  {
    word: "虚怀若谷",
    pinyin: "xū huái ruò gǔ",
    definition: "心胸宽广、谦虚，就像能容纳万物的深谷一样。形容十分谦虚，善于接受别人的意见。",
    category: "high",
    mnemonic: "大山谷里空幽深，能装细雨和红云。学者心里多谦让，虚心求教进步勤！记住：即使成绩拿第一，也能虚心地请教别人的长处，就是虚怀若谷的表现。",
    kidsExplanation: "就像一个小口袋，它不骄傲自满，故意把口袋松得大大的，这样才能装得下世界上所有的好学问和新本领呀！",
    synonyms: ["谦虚谨慎", "虚心好学"],
    antonyms: ["骄傲自满", "狂妄自大", "目空一切"],
    story: "老子在《道德经》中写道：‘旷兮其若谷。’意思是，一个真正有大修养的君子，他的心灵宽广得就像山里深不见底的巨大幽林和深深峡谷一样，能容得下狂风细雨和各种意见，永远保持谦逊。"
  }
];

function stripSVGText(svg: string): string {
  if (!svg) return '';
  // 1. Remove <text>...</text> tags completely (with case-insensitive and multiline support)
  let cleaned = svg.replace(/<text[\s\S]*?<\/text>/gi, '');
  
  // 2. Remove any self-closing or dangling text elements if they exist
  cleaned = cleaned.replace(/<text[^>]*\/>/gi, '');
  
  // 3. Remove text background containers (like white rectangles or capsules that highlight text labels)
  cleaned = cleaned.replace(/<rect[^>]*?fill="#FFF"[^>]*?opacity="0.9"[^>]*?\/>/gi, '');
  cleaned = cleaned.replace(/<rect[^>]*?fill="#FFFFFF"[^>]*?opacity="0.9"[^>]*?\/>/gi, '');
  cleaned = cleaned.replace(/<rect[^>]*?fill="white"[^>]*?opacity="0.9"[^>]*?\/>/gi, '');
  
  return cleaned;
}

function generateDynamicArtworkFallback(word: string, category: string): string {
  const colors = [
    { bg: "#FFFBEB", primary: "#F59E0B", secondary: "#D97706", accent: "#FEF3C7" }, // Amber cozy
    { bg: "#F0FDF4", primary: "#22C55E", secondary: "#16A34A", accent: "#DCFCE7" }, // Green forest
    { bg: "#EFF6FF", primary: "#3B82F6", secondary: "#2563EB", accent: "#DBEAFE" }, // Blue sky
    { bg: "#FAF5FF", primary: "#A855F7", secondary: "#9333EA", accent: "#F3E8FF" }, // Purple magic
    { bg: "#FFF5F5", primary: "#EF4444", secondary: "#DC2626", accent: "#FEE2E2" }, // Red passion
    { bg: "#F0FDFA", primary: "#14B8A6", secondary: "#0D9488", accent: "#CCFBF1" }, // Teal ocean
  ];

  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash += word.charCodeAt(i);
  }
  const color = colors[hash % colors.length];

  // Specific bespoke drawings for pre-defined local idioms to avoid the generic mystery box
  switch (word) {
    case "井底之蛙":
    case "坐井观天":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#0F172A" />
        <!-- Well bricks on sides -->
        <path d="M 0,0 L 100,0 L 100,300 L 0,300 Z" fill="#334155" />
        <path d="M 300,0 L 400,0 L 400,300 L 300,300 Z" fill="#334155" />
        <line x1="100" y1="50" x2="0" y2="50" stroke="#1E293B" stroke-width="4" />
        <line x1="100" y1="120" x2="0" y2="120" stroke="#1E293B" stroke-width="4" />
        <line x1="100" y1="190" x2="0" y2="190" stroke="#1E293B" stroke-width="4" />
        <line x1="100" y1="260" x2="0" y2="260" stroke="#1E293B" stroke-width="4" />
        <line x1="300" y1="80" x2="400" y2="80" stroke="#1E293B" stroke-width="4" />
        <line x1="300" y1="160" x2="400" y2="160" stroke="#1E293B" stroke-width="4" />
        <line x1="300" y1="240" x2="400" y2="240" stroke="#1E293B" stroke-width="4" />
        <!-- Starry opening at top -->
        <circle cx="200" cy="50" r="45" fill="#38BDF8" opacity="0.3" />
        <circle cx="200" cy="50" r="30" fill="#7DD3FC" opacity="0.4" />
        <!-- Little white stars -->
        <circle cx="190" cy="45" r="2" fill="#FFFFFF" />
        <circle cx="215" cy="55" r="3" fill="#FFFFFF" />
        <circle cx="205" cy="35" r="1.5" fill="#FFFFFF" />
        <!-- Well bottom mossy rock -->
        <path d="M 100,280 Q 200,240 300,280 L 300,300 L 100,300 Z" fill="#15803D" />
        <!-- Cute green frog looking up -->
        <g transform="translate(180, 210)">
          <ellipse cx="20" cy="25" rx="25" ry="18" fill="#22C55E" />
          <ellipse cx="20" cy="27" rx="16" ry="12" fill="#86EFAC" />
          <!-- Frog big eyes -->
          <circle cx="8" cy="10" r="8" fill="#22C55E" />
          <circle cx="8" cy="10" r="5" fill="#FFFFFF" />
          <circle cx="9" cy="10" r="2.5" fill="#000000" />
          <circle cx="32" cy="10" r="8" fill="#22C55E" />
          <circle cx="32" cy="10" r="5" fill="#FFFFFF" />
          <circle cx="31" cy="10" r="2.5" fill="#000000" />
          <!-- Smiling mouth -->
          <path d="M 12,23 Q 20,29 28,23" fill="none" stroke="#14532D" stroke-width="3" stroke-linecap="round" />
          <!-- Small cheeks -->
          <circle cx="6" cy="21" r="3" fill="#EF4444" opacity="0.6" />
          <circle cx="34" cy="21" r="3" fill="#EF4444" opacity="0.6" />
        </g>
      </svg>`;

    case "精卫填海":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F0F9FF" />
        <!-- Soft glowing orange sun -->
        <circle cx="65" cy="65" r="26" fill="#FDBA74" opacity="0.8" />
        <circle cx="65" cy="65" r="34" fill="#FED7AA" opacity="0.4" />
        
        <!-- White clouds floating -->
        <path d="M 320,50 A 12,12 0 0,1 336,42 A 16,16 0 0,1 360,46 A 12,12 0 0,1 352,62 L 316,62 A 10,10 0 0,1 320,50 Z" fill="#FFFFFF" opacity="0.9" />
        <path d="M 40,90 A 10,10 0 0,1 54,83 A 14,14 0 0,1 75,86 A 10,10 0 0,1 68,100 L 36,100 A 8,8 0 0,1 40,90 Z" fill="#FFFFFF" opacity="0.75" />

        <!-- Distant mountains in the sea -->
        <path d="M 0,220 Q 50,180 110,210 Q 180,170 240,215 T 400,210 L 400,300 L 0,300 Z" fill="#7DD3FC" opacity="0.5" />

        <!-- Deep blue roaring waves -->
        <path d="M 0,230 C 80,210 140,270 240,225 T 400,240 L 400,300 L 0,300 Z" fill="#0284C7" />
        <path d="M 0,250 C 60,265 150,215 230,255 T 400,260 L 400,300 L 0,300 Z" fill="#0EA5E9" opacity="0.8" />

        <!-- Cute curly wave splashes (drawn with paths and circles to represent foam) -->
        <g fill="#FFFFFF" opacity="0.85">
          <circle cx="80" cy="235" r="6" />
          <circle cx="72" cy="242" r="4" />
          <circle cx="89" cy="240" r="4" />
          
          <circle cx="280" cy="225" r="7" />
          <circle cx="272" cy="231" r="5" />
          <circle cx="290" cy="230" r="4" />
        </g>
        
        <!-- Splash from previous stones -->
        <g stroke="#38BDF8" stroke-width="2.5" fill="none" stroke-linecap="round">
          <path d="M 120,240 Q 110,210 100,220" />
          <path d="M 130,240 Q 140,210 150,220" />
          <circle cx="102" cy="210" r="3" fill="#38BDF8" stroke="none" />
          <circle cx="148" cy="210" r="3" fill="#38BDF8" stroke="none" />
        </g>

        <!-- Dynamic elements of filling: stone pebbles and tree twigs falling down -->
        <!-- Small pebble 1 -->
        <path d="M 185,150 Q 178,140 190,140 Q 196,150 185,150" fill="#94A3B8" stroke="#475569" stroke-width="2" />
        <!-- Small pebble 2 -->
        <path d="M 140,195 Q 132,185 145,185 Q 152,195 140,195" fill="#64748B" stroke="#334155" stroke-width="2" />
        
        <!-- Small tree branch/twig with a green leaf -->
        <g transform="translate(145, 150) rotate(-20)">
          <line x1="0" y1="0" x2="22" y2="18" stroke="#B45309" stroke-width="3.5" stroke-linecap="round" />
          <line x1="10" y1="8" x2="18" y2="4" stroke="#B45309" stroke-width="2" stroke-linecap="round" />
          <path d="M 18,4 Q 24,-2 18,-4 Q 13,0 18,4 Z" fill="#4ADE80" stroke="#166534" stroke-width="1" />
        </g>

        <!-- Cute determined Jingwei bird flying -->
        <g transform="translate(200, 60)">
          <!-- Back wing -->
          <path d="M 65,40 Q 95,5 90,30 Z" fill="#818CF8" stroke="#4F46E5" stroke-width="2" />
          
          <!-- Tail feathers -->
          <path d="M 70,60 L 105,52 L 95,62 L 108,70 L 70,68 Z" fill="#F472B6" stroke="#4F46E5" stroke-width="2" />
          
          <!-- Cute robust body -->
          <ellipse cx="45" cy="62" rx="36" ry="24" fill="#A5B4FC" stroke="#4F46E5" stroke-width="3" />
          
          <!-- Front wing -->
          <path d="M 32,50 C 10,10 50,-10 60,45 Z" fill="#C084FC" stroke="#7C3AED" stroke-width="3" />

          <!-- Cute round head -->
          <circle cx="10" cy="50" r="19" fill="#A5B4FC" stroke="#4F46E5" stroke-width="3" />
          
          <!-- Crown plume feathers -->
          <path d="M 10,31 Q 7,12 -3,17 Q 10,25 10,31" fill="#FB7185" stroke="#E11D48" stroke-width="2" />
          <path d="M 18,33 Q 22,14 12,18 Q 18,25 18,33" fill="#FB7185" stroke="#E11D48" stroke-width="2" />
          
          <!-- Big, hopeful and determined anime-style eye -->
          <circle cx="2" cy="45" r="5.5" fill="#1E1B4B" />
          <circle cx="-0.5" cy="43" r="2.2" fill="#FFFFFF" />
          <path d="M -6,37 Q 2,37 8,40" fill="none" stroke="#1E1B4B" stroke-width="2.2" stroke-linecap="round" />
          
          <!-- Pink cheeks -->
          <circle cx="8" cy="56" r="3.5" fill="#FDA4AF" />

          <!-- Orange beak carrying a pebble -->
          <path d="M -9,51 L -28,58 L -9,63 Z" fill="#FB923C" stroke="#EA580C" stroke-width="2.5" />
          
          <!-- Pebble held in beak -->
          <ellipse cx="-23" cy="60" rx="6" ry="4" fill="#94A3B8" stroke="#475569" stroke-width="1.5" />
        </g>
      </svg>`;

    case "南辕北辙":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- Rounded corner card canvas -->
        <rect width="400" height="300" rx="24" fill="#F8FAFC" />
        
        <!-- BACKGROUND DIVISION: LEFT = SUNNY, RIGHT = COLD -->
        <!-- Sunny Side (Left half background mask) -->
        <path d="M 0,0 L 200,0 L 200,300 L 0,300 Z" fill="#FFFBEB" />
        <!-- Cold Side (Right half background mask) -->
        <path d="M 200,0 L 400,0 L 400,300 L 200,300 Z" fill="#F1F5F9" />

        <!-- LEFT: Radiant Sun and Palm trees -->
        <!-- Sun -->
        <circle cx="50" cy="50" r="22" fill="#F59E0B" opacity="0.9" />
        <circle cx="50" cy="50" r="28" fill="#FCD34D" opacity="0.4" />
        <!-- Rays -->
        <g stroke="#F59E0B" stroke-width="2" stroke-linecap="round">
          <line x1="50" y1="20" x2="50" y2="12" />
          <line x1="50" y1="80" x2="50" y2="88" />
          <line x1="20" y1="50" x2="12" y2="50" />
          <line x1="80" y1="50" x2="88" y2="50" />
          <line x1="29" y1="29" x2="23" y2="23" />
          <line x1="71" y1="71" x2="77" y2="77" />
          <line x1="29" y1="71" x2="23" y2="77" />
          <line x1="71" y1="29" x2="77" y2="23" />
        </g>

        <!-- Cute palm tree on the far left -->
        <path d="M 25,240 Q 30,170 15,120 Q 20,120 30,170 Q 35,240 25,240 Z" fill="#78350F" />
        <!-- Left Palm leaves -->
        <path d="M 15,120 Q -10,110 -15,130 Q 0,130 15,120" fill="#10B981" />
        <path d="M 15,120 Q 15,90 0,95 Q 10,110 15,120" fill="#047857" />
        <path d="M 15,120 Q 40,100 45,115 Q 30,125 15,120" fill="#10B981" />
        <path d="M 15,120 Q 30,140 25,150 Q 20,135 15,120" fill="#059669" />

        <!-- RIGHT: Cold Snowflake, snowy pine tree, snow particles -->
        <!-- Snow particles -->
        <g fill="#FFFFFF">
          <circle cx="240" cy="40" r="3" />
          <circle cx="280" cy="60" r="4.5" />
          <circle cx="340" cy="30" r="3" />
          <circle cx="380" cy="70" r="4" />
          <circle cx="260" cy="100" r="3.5" />
          <circle cx="310" cy="110" r="3" />
          <circle cx="360" cy="130" r="5" />
        </g>

        <!-- Big stylized Snowflake graphic on the top right -->
        <g stroke="#93C5FD" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
          <line x1="360" y1="45" x2="360" y2="75" />
          <line x1="345" y1="60" x2="375" y2="60" />
          <line x1="349" y1="49" x2="371" y2="71" />
          <line x1="349" y1="71" x2="371" y2="49" />
          <!-- V ticks -->
          <path d="M 355,50 L 360,55 L 365,50" fill="none" />
          <path d="M 355,70 L 360,65 L 365,70" fill="none" />
          <path d="M 348,56 L 353,60 L 348,64" fill="none" />
          <path d="M 372,56 L 367,60 L 372,64" fill="none" />
        </g>

        <!-- Snowy hill right -->
        <path d="M 150,250 C 230,220 320,240 400,210 L 400,300 L 150,300 Z" fill="#E2E8F0" />
        <!-- Snowy pine tree background right -->
        <g transform="translate(350, 150)">
          <polygon points="15,0 0,35 30,35" fill="#1E3A8A" opacity="0.6" />
          <polygon points="15,-15 3,18 27,18" fill="#1E40AF" opacity="0.75" />
          <!-- Snow cover cap -->
          <path d="M 15,-15 Q 11,-8 6,-5 Q 15,-1 24,-5 Q 19,-8 15,-15" fill="#FFFFFF" />
          <path d="M 15,0 Q 8,15 0,25 Q 15,30 30,25 Q 22,15 15,0" fill="#FFFFFF" opacity="0.9" />
        </g>

        <!-- GREEN/WARM HILLS ON LEFT -->
        <path d="M -20,260 C 50,240 120,230 200,250 L 200,300 L -20,300 Z" fill="#A7F3D0" />
        <path d="M 80,270 C 140,250 210,260 260,250 L 260,300 L 80,300 Z" fill="#34D399" opacity="0.4" />

        <!-- Road dividing the two worlds -->
        <path d="M 40,280 C 130,250 200,255 380,265" stroke="#E2E8F0" stroke-width="32" fill="none" stroke-linecap="round" opacity="0.3" />
        <path d="M 40,280 C 130,250 200,255 380,265" stroke="#94A3B8" stroke-width="1.5" fill="none" stroke-dasharray="6,8" stroke-linecap="round" />

        <!-- SIGNPOST: placed at the dividing center (X=140, Y=170) -->
        <g transform="translate(120, 160)">
          <!-- Main post -->
          <rect x="18" y="20" width="8" height="85" fill="#78350F" rx="3" stroke="#451A03" stroke-width="1.5" />
          
          <!-- Left Sign: Warm South (Sun graphic instead of letters) -->
          <path d="M 22,15 Q 0,15 -14,25 L -14,42 Q 0,32 22,32 Z" fill="#FBBF24" stroke="#78350F" stroke-width="1.5" />
          <!-- Cute sun symbol on the left sign -->
          <circle cx="-1" cy="28" r="4.5" fill="#EF4444" />
          <line x1="-1" y1="20" x2="-1" y2="23" stroke="#EF4444" stroke-width="1" />
          <line x1="-1" y1="33" x2="-1" y2="36" stroke="#EF4444" stroke-width="1" />
          <line x1="-9" y1="28" x2="-6" y2="28" stroke="#EF4444" stroke-width="1" />
          <line x1="4" y1="28" x2="7" y2="28" stroke="#EF4444" stroke-width="1" />
          <path d="M -16,28 L -20,28" stroke="#78350F" stroke-dasharray="2,2" />

          <!-- Right Sign: Cold North (Snowflake/Icicle graphic instead of letters) -->
          <path d="M 22,40 Q 42,40 56,30 L 56,13 Q 42,23 22,23 Z" fill="#93C5FD" stroke="#1E40AF" stroke-width="1.5" />
          <!-- Tiny snowflake symbol on the right sign -->
          <line x1="38" y1="20" x2="38" y2="32" stroke="#1E40AF" stroke-width="1" />
          <line x1="32" y1="26" x2="44" y2="26" stroke="#1E40AF" stroke-width="1" />
          <circle cx="38" cy="26" r="2" fill="none" stroke="#1E40AF" stroke-width="1" />
        </g>

        <!-- ================= CARRIAGE SPRINTING NORTH (TO THE RIGHT) ================= -->
        <!-- Carriage and Horse Group, scaled & moved into the center-right -->
        <g transform="translate(180, 155)">
          <!-- Connective wooden shafts/poles pointing forward/right (辕 - Yuan) -->
          <line x1="35" y1="80" x2="95" y2="76" stroke="#D97706" stroke-width="4.5" stroke-linecap="round" />
          <line x1="35" y1="85" x2="90" y2="82" stroke="#B45309" stroke-width="3" stroke-linecap="round" />
          <line x1="15" y1="70" x2="45" y2="70" stroke="#78350F" stroke-width="3" />

          <!-- THE HORSE GALLOPING TO THE RIGHT -->
          <g transform="translate(75, 25)">
            <!-- Horse Back Legs (galloping pose) -->
            <path d="M 12,50 Q -10,65 -5,75 Q 5,75 16,55" fill="#B45309" stroke="#78350F" stroke-width="1.5" />
            <path d="M 20,50 Q 8,70 18,78 Q 24,78 26,55" fill="#92400E" stroke="#78350F" stroke-width="1.5" />

            <!-- Horse Body -->
            <ellipse cx="32" cy="46" rx="24" ry="15" fill="#D97706" stroke="#78350F" stroke-width="2.5" />

            <!-- Horse Front Legs (stretched forward high-speed gallop) -->
            <path d="M 45,50 Q 65,65 72,55" stroke="#D97706" stroke-width="4.5" stroke-linecap="round" fill="none" />
            <path d="M 40,52 Q 55,72 64,68" stroke="#92400E" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <!-- Golden Hooves -->
            <path d="M 68,54 L 75,56 L 71,59 Z" fill="#FBBF24" />
            <path d="M 61,66 L 68,69 L 65,72 Z" fill="#FBBF24" />

            <!-- Cute Horse Neck and Head -->
            <path d="M 45,42 Q 55,20 60,18" stroke="#D97706" stroke-width="12" stroke-linecap="round" />
            <!-- Head shape -->
            <path d="M 52,18 C 52,8 72,12 70,22 C 68,30 52,26 52,18 Z" fill="#D97706" stroke="#78350F" stroke-width="2" />
            
            <!-- Ears -->
            <polygon points="56,12 59,-2 62,10" fill="#B45309" />
            <polygon points="61,12 65,2 67,11" fill="#78350F" />
            
            <!-- Mane flying back (comical wind effect) -->
            <path d="M 44,30 Q 32,22 42,16 Q 30,12 45,8 Q 38,2 50,4" fill="none" stroke="#F97316" stroke-width="3" stroke-linecap="round" />

            <!-- Big cartoon eye (straining, racing!) -->
            <circle cx="62" cy="15" r="4.5" fill="#FFFFFF" stroke="#000000" stroke-width="1" />
            <circle cx="63.5" cy="14.5" r="2" fill="#000000" />
            <!-- Teeth smiling/sweating -->
            <path d="M 68,23 Q 66,26 63,24" stroke="#000000" stroke-width="1.2" fill="none" />
            
            <!-- Sweat beads splashing in the air -->
            <ellipse cx="25" cy="10" rx="2" ry="4.5" fill="#38BDF8" transform="rotate(30, 25, 10)" />
            <ellipse cx="40" cy="0" rx="1.5" ry="3.5" fill="#38BDF8" transform="rotate(40, 40, 0)" />
          </g>

          <!-- CARRIAGE CABIN (Very rustic ornate structure) -->
          <!-- Cabin base shadow -->
          <rect x="-10" y="58" width="60" height="6" fill="#1E293B" opacity="0.3" rx="3" />
          <!-- Main cabin box -->
          <rect x="-8" y="15" width="54" height="44" fill="#D97706" rx="8" stroke="#78350F" stroke-width="2.5" />
          <rect x="-3" y="19" width="44" height="36" fill="#FDE047" rx="5" />
          <rect x="6" y="24" width="26" height="24" fill="#FEF08A" rx="3" stroke="#78350F" stroke-width="2" />
          <!-- Curtain draped inside window -->
          <path d="M 6,24 Q 19,30 32,24 L 32,28 Q 19,34 6,28 Z" fill="#EF4444" />

          <!-- Left pointing arrow icon painted on the cabin (visual metaphor) -->
          <path d="M 28,11 Q 20,4 12,11 L 12,6 L 6,12 L 12,18 L 12,13 Q 20,6 28,13 Z" fill="#EA580C" stroke="#78350F" stroke-dasharray="1.5,1.5" stroke-width="0.75" />

          <!-- Cute Carriage Roof with chinese/east asian corners -->
          <path d="M -16,18 Q 19,4 54,18 L 46,12 Q 19,-2 -8,12 Z" fill="#DC2626" stroke="#991B1B" stroke-width="2" />
          <circle cx="-15" cy="18" r="3" fill="#FBBF24" />
          <circle cx="53" cy="18" r="3" fill="#FBBF24" />

          <!-- THE CHEERFUL DRIVER pointing back to the left (South) -->
          <!-- Driver torso -->
          <path d="M 33,40 Q 42,42 42,55 L 26,55 Z" fill="#4F46E5" stroke="#3730A3" stroke-width="2" />
          <!-- Head -->
          <circle cx="34" cy="30" r="8" fill="#FFEDD5" stroke="#3730A3" stroke-width="1.8" />
          <!-- Hair bun -->
          <circle cx="34" cy="20" r="3" fill="#1E293B" />
          <!-- Smiley face -->
          <path d="M 31,31 Q 33,34 35,31" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="31" cy="28" r="0.8" fill="#000000" />
          <circle cx="36" cy="28" r="0.8" fill="#000000" />
          <!-- Arm pointing LEFT (backward towards the sun) -->
          <!-- Stretched pointing arm -->
          <path d="M 28,38 C 15,35 6,28 0,35" fill="none" stroke="#4F46E5" stroke-width="5" stroke-linecap="round" />
          <circle cx="-1" cy="34" r="3" fill="#FFEDD5" stroke="#3730A3" stroke-width="1" />
          <path d="M -3,34 L -10,34" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />

          <!-- EXTRAORDINARILY LARGE ROTATING WHEELS (very dynamic!) -->
          <!-- Wheel Back -->
          <g transform="translate(1, 62)">
            <!-- Outer spin ring -->
            <circle cx="0" cy="0" r="22" fill="#D97706" stroke="#78350F" stroke-width="4" />
            <circle cx="0" cy="0" r="18" fill="#FFFBEB" />
            <!-- Heart cap -->
            <circle cx="0" cy="0" r="6" fill="#1E293B" />
            <!-- Spokes (wooden lines) -->
            <g stroke="#78350F" stroke-width="2.2" stroke-linecap="round">
              <line x1="-18" y1="0" x2="18" y2="0" />
              <line x1="0" y1="-18" x2="0" y2="18" />
              <line x1="-12" y1="-12" x2="12" y2="12" />
              <line x1="-12" y1="12" x2="12" y2="-12" />
            </g>
          </g>

          <!-- Wheel Front (smaller, under the horse connector) -->
          <g transform="translate(38, 64)">
            <circle cx="0" cy="0" r="18" fill="#D97706" stroke="#78350F" stroke-width="3" />
            <circle cx="0" cy="0" r="15" fill="#FFFBEB" />
            <circle cx="0" cy="0" r="4.5" fill="#1E293B" />
            <g stroke="#78350F" stroke-width="1.8" stroke-linecap="round">
              <line x1="-15" y1="0" x2="15" y2="0" />
              <line x1="0" y1="-15" x2="0" y2="15" />
              <line x1="-11" y1="-11" x2="11" y2="11" />
              <line x1="-11" y1="11" x2="11" y2="-11" />
            </g>
          </g>

          <!-- Comical dirt dust spirals flying behind the wheels -->
          <path d="M -22,78 C -35,76 -45,65 -35,55 Q -30,51 -26,58" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
          <path d="M -26,82 C -32,84 -38,88 -42,83" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
        </g>
      </svg>`;

    case "对牛弹琴":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F0FDF4" />
        <!-- Green meadow pasture -->
        <path d="M -20,220 Q 120,180 280,210 T 420,190 L 420,300 L -20,300 Z" fill="#DCFCE7" />
        <!-- Traditional wooden lute (Qin) -->
        <g transform="translate(40, 190) rotate(-15)">
          <rect x="0" y="0" width="140" height="22" rx="6" fill="#78350F" />
          <line x1="10" y1="6" x2="130" y2="6" stroke="#FEF08A" stroke-width="1.5" />
          <line x1="10" y1="11" x2="130" y2="11" stroke="#FEF08A" stroke-width="1.5" />
          <line x1="10" y1="16" x2="130" y2="16" stroke="#FEF08A" stroke-width="1.5" />
          <!-- Sound holes -->
          <circle cx="45" cy="11" r="3" fill="#1E293B" />
          <circle cx="95" cy="11" r="3" fill="#1E293B" />
        </g>
        <!-- Musical notes floating -->
        <path d="M 180,120 Q 200,90 220,105" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 5" />
        <g fill="#16A34A" transform="translate(190, 80)">
          <ellipse cx="6" cy="12" rx="5" ry="3.5" transform="rotate(-20)" />
          <line x1="10" y1="11" x2="10" y2="0" stroke="#16A34A" stroke-width="2" />
          <line x1="10" y1="1" x2="16" y2="3" stroke="#16A34A" stroke-width="2" stroke-linecap="round" />
        </g>
        <g fill="#3B82F6" transform="translate(130, 95) scale(0.8)">
          <ellipse cx="6" cy="12" rx="5" ry="3.5" transform="rotate(-20)" />
          <line x1="10" y1="11" x2="10" y2="0" stroke="#3B82F6" stroke-width="2" />
          <rect x="10" y="0" width="8" height="2" fill="#3B82F6" />
        </g>
        <!-- Cute Cow Head listening happily -->
        <g transform="translate(220, 100)">
          <!-- Cow muzzle ears -->
          <path d="M 10,40 Q -15,10 -5,8 Q 0,20 15,35 Z" fill="#94A3B8" /> <!-- ear left -->
          <path d="M 80,40 Q 105,10 95,8 Q 90,20 75,35 Z" fill="#94A3B8" /> <!-- ear right -->
          <!-- Cow Horns -->
          <path d="M 22,25 Q 15,-2 8,5 Q 15,12 25,23 Z" fill="#E2E8F0" />
          <path d="M 68,25 Q 75,-2 82,5 Q 75,12 65,23 Z" fill="#E2E8F0" />
          <!-- Head Base -->
          <ellipse cx="45" cy="55" rx="35" ry="32" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3" />
          <!-- Cow black spots -->
          <path d="M 15,35 C 10,45 25,50 25,38 Z" fill="#334155" />
          <path d="M 65,35 C 75,45 78,55 65,58 Z" fill="#334155" />
          <!-- Cheerful closed eyes -->
          <path d="M 23,50 Q 30,58 37,50" fill="none" stroke="#334155" stroke-width="4" stroke-linecap="round" />
          <path d="M 53,50 Q 60,58 67,50" fill="none" stroke="#334155" stroke-width="4" stroke-linecap="round" />
          <!-- Big pink snouth/jaw -->
          <ellipse cx="45" cy="72" rx="27" ry="16" fill="#FECDD3" />
          <circle cx="35" cy="70" r="3" fill="#E11D48" />
          <circle cx="55" cy="70" r="3" fill="#E11D48" />
          <!-- Happy mouth -->
          <path d="M 38,76 Q 45,82 52,76" fill="none" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round" />
        </g>
      </svg>`;

    case "盲人摸象":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EFF6FF" />
        <circle cx="210" cy="120" r="110" fill="#DBEAFE" opacity="0.6" />
        <!-- Giant grey cartoon elephant leg and belly -->
        <g transform="translate(140, 40)">
          <!-- Belly -->
          <path d="M -80,50 Q 40,-10 180,30 L 180,180 L -80,180 Z" fill="#94A3B8" opacity="0.4" />
          <!-- Front Leg -->
          <rect x="20" y="40" width="65" height="190" rx="16" fill="#64748B" />
          <!-- Elephant toes -->
          <ellipse cx="37" cy="225" rx="10" ry="6" fill="#E2E8F0" />
          <ellipse cx="53" cy="225" rx="10" ry="6" fill="#E2E8F0" />
          <ellipse cx="68" cy="225" rx="10" ry="6" fill="#E2E8F0" />
        </g>
        <!-- Playful human hand reaching and probing -->
        <g transform="translate(100, 130)">
          <!-- Sleeve -->
          <rect x="0" y="25" width="45" height="28" rx="6" fill="#F59E0B" />
          <circle cx="45" cy="39" r="6" fill="#F59E0B" />
          <!-- Hand touching elephant skin -->
          <path d="M 45,34 C 55,28 65,34 68,39 C 62,45 52,43 45,43 Z" fill="#FDBA74" stroke="#D97706" stroke-width="2" />
          <path d="M 45,39 C 58,36 68,43 65,47 C 55,50 48,46 45,43 Z" fill="#FDBA74" stroke="#D97706" stroke-width="2" />
        </g>
        <!-- Question marks of exploration -->
        <path d="M 60,85 C 60,75 70,68 80,68 C 90,68 95,75 95,85 C 95,92 90,96 85,100 Q 82,103 82,107" fill="none" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" />
        <circle cx="82" cy="120" r="4.5" fill="#3B82F6" />
      </svg>`;

    case "杯弓蛇影":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <circle cx="200" cy="150" r="100" fill="#FEF3C7" opacity="0.6" />
        <!-- Big retro tea cup/bowl -->
        <g transform="translate(100, 75)">
          <ellipse cx="100" cy="70" rx="85" ry="32" fill="#E2E8F0" stroke="#94A3B8" stroke-width="4" />
          <!-- Tea liquid -->
          <ellipse cx="100" cy="70" rx="77" ry="26" fill="#F59E0B" opacity="0.8" />
          <!-- Reflected wavy snake silhouette in the tea -->
          <path d="M 45,72 Q 70,55 95,72 T 145,72 T 160,68" fill="none" stroke="#065F46" stroke-width="6" stroke-linecap="round" opacity="0.7" />
          <path d="M 45,72 Q 70,55 95,72 T 145,72 T 160,68" fill="none" stroke="#34D399" stroke-width="3" stroke-linecap="round" opacity="0.9" />
          <!-- Tongue/Eyes of shadow snake -->
          <path d="M 160,68 L 165,65 M 160,68 L 166,72" stroke="#34D399" stroke-width="2" stroke-linecap="round" />
          <circle cx="152" cy="68" r="1.5" fill="#065F46" />
          
          <!-- Bowl thick porcelain body -->
          <path d="M 15,70 Q 25,140 100,140 T 185,70" fill="none" stroke="#94A3B8" stroke-width="5" />
          <path d="M 15,70 Q 25,140 100,140 T 185,70 L 185,75 Q 175,145 100,145 T 15,75 Z" fill="#CBD5E1" />
          <ellipse cx="100" cy="140" rx="30" ry="8" fill="#94A3B8" />
        </g>
        <!-- Archery bow hint in background sky -->
        <path d="M 330,30 Q 270,120 310,230" fill="none" stroke="#B45309" stroke-width="5" stroke-linecap="round" opacity="0.25" />
        <line x1="330" y1="30" x2="310" y2="230" stroke="#D97706" stroke-width="1.5" opacity="0.2" />
      </svg>`;

    case "惊弓之鸟":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EFF6FF" />
        <!-- Big wooden bow in action in left corner -->
        <g transform="translate(-10, 80) rotate(15)">
          <!-- Curved bow wood -->
          <path d="M 50,-60 Q 150,40 50,140" fill="none" stroke="#78350F" stroke-width="7" stroke-linecap="round" />
          <path d="M 50,-60 Q 150,40 50,140" fill="none" stroke="#9A3412" stroke-width="3" stroke-linecap="round" />
          <!-- Bow string vibrating -->
          <path d="M 50,-60 Q 40,40 50,140" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="3 3" />
        </g>
        <!-- Flustered yellow bird flying away in panic -->
        <g transform="translate(240, 80)">
          <!-- Swoop indicator circles -->
          <circle cx="-30" cy="50" r="20" fill="#3B82F6" opacity="0.08" />
          <circle cx="-10" cy="30" r="12" fill="#3B82F6" opacity="0.05" />
          <!-- Bird wings (raised in hurry) -->
          <path d="M 12,5 Q 5,-20 -15,-10 Q -5,15 12,12 Z" fill="#FBBF24" />
          <path d="M 28,5 Q 35,-20 55,-10 Q 45,15 28,12 Z" fill="#FBBF24" />
          <!-- Main body -->
          <circle cx="20" cy="18" r="20" fill="#F59E0B" />
          <!-- Face detail -->
          <circle cx="12" cy="12" r="3" fill="#1E293B" />
          <circle cx="28" cy="12" r="3" fill="#1E293B" />
          <!-- Shocked wide eyes outline -->
          <circle cx="12" cy="12" r="5.5" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
          <circle cx="28" cy="12" r="5.5" fill="none" stroke="#FFFFFF" stroke-width="1.5" />
          <!-- Open sharp orange beak -->
          <polygon points="18,18 22,18 20,27" fill="#EA580C" />
          <!-- Sweat droplets of terror -->
          <ellipse cx="-1" cy="6" rx="3" ry="5" fill="#38BDF8" transform="rotate(-30)" />
          <ellipse cx="41" cy="6" rx="3" ry="5" fill="#38BDF8" transform="rotate(30)" />
        </g>
      </svg>`;

    case "滥竽充数":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FAF5FF" />
        <!-- Master row of green pipes/flutes of orchestra -->
        <g transform="translate(60, 100)">
          <!-- Elegant row of green standard bamboo flutes (Sheng) -->
          <g fill="#16A34A" opacity="0.5">
            <rect x="0" y="20" width="12" height="120" rx="3" />
            <rect x="18" y="10" width="12" height="130" rx="3" />
            <rect x="36" y="0" width="12" height="143" rx="3" />
            <circle cx="6" cy="35" r="2" fill="#FFFFFF" />
            <circle cx="6" cy="65" r="2" fill="#FFFFFF" />
            <circle cx="24" cy="25" r="2" fill="#FFFFFF" />
            <circle cx="24" cy="55" r="2" fill="#FFFFFF" />
            <circle cx="42" cy="15" r="2" fill="#FFFFFF" />
            <circle cx="42" cy="45" r="2" fill="#FFFFFF" />
          </g>
          <!-- The odd orange/red flute in the center that is NOT being played, just held stupidly -->
          <g transform="translate(110, 0)">
            <rect x="0" y="5" width="22" height="140" rx="5" fill="#F59E0B" stroke="#9A3412" stroke-width="3" />
            <!-- Missing finger holes or wrong circles -->
            <circle cx="11" cy="30" r="4.5" fill="#EF4444" />
            <circle cx="11" cy="60" r="4.5" fill="#EF4444" />
            <circle cx="11" cy="90" r="4.5" fill="#EF4444" />
            <circle cx="11" cy="120" r="4.5" fill="#78350F" />
            
            <!-- Face in background sweating / panicking -->
            <g transform="translate(-10, -50)">
              <circle cx="20" cy="20" r="16" fill="#FED7AA" />
              <!-- Nervous eyes -->
              <line x1="12" y1="16" x2="16" y2="20" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
              <line x1="28" y1="16" x2="24" y2="20" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
              <!-- Sweat beads -->
              <ellipse cx="37" cy="14" rx="2" ry="4" fill="#38BDF8" />
            </g>
          </g>
          <!-- Another row of standard green flutes on the right -->
          <g fill="#16A34A" opacity="0.5" transform="translate(200, 0)">
            <rect x="0" y="0" width="12" height="143" rx="3" />
            <rect x="18" y="10" width="12" height="130" rx="3" />
            <rect x="36" y="20" width="12" height="120" rx="3" />
          </g>
        </g>
      </svg>`;

    case "鸡犬不宁":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFF5F5" />
        <!-- Speed chase whirl design -->
        <path d="M 200,150 A 90,80 0 1,1 199,150" fill="none" stroke="#FEE2E2" stroke-width="15" stroke-dasharray="10 20" stroke-linecap="round" />
        <!-- Running cute yellow Rooster (comb and beak) -->
        <g transform="translate(70, 70)">
          <!-- Red comb -->
          <path d="M 20,5 Q 30,-15 40,5 Z" fill="#EF4444" />
          <circle cx="30" cy="-2" r="6" fill="#EF4444" />
          <!-- Bird Body -->
          <ellipse cx="30" cy="25" rx="22" ry="16" fill="#FBBF24" />
          <ellipse cx="44" cy="20" rx="9" ry="9" fill="#F97316" />
          <!-- Sharp beak -->
          <polygon points="50,18 57,22 50,26" fill="#EA580C" />
          <!-- Feathers flying -->
          <path d="M 5,20 Q -10,10 -5,25 Z" fill="#FBBF24" opacity="0.8" />
          <path d="M 10,32 Q -12,38 -15,25 Z" fill="#FEF08A" opacity="0.7" />
        </g>
        <!-- Furious orange cartoon Dog chasing -->
        <g transform="translate(210, 130)">
          <!-- Dog body -->
          <ellipse cx="50" cy="50" rx="35" ry="24" fill="#E28743" />
          <circle cx="28" cy="35" r="20" fill="#E28743" />
          <circle cx="28" cy="35" r="15" fill="#EE9C58" />
          <!-- Long brown floppy ears -->
          <path d="M 12,32 Q -10,38 -5,55 Q 12,45 15,35 Z" fill="#763D13" />
          <!-- Happy/angry bark mouth -->
          <ellipse cx="38" cy="40" rx="6" ry="4" fill="#000000" />
          <!-- Cartoon tail up and wagging -->
          <path d="M 85,50 Q 110,40 100,25" fill="none" stroke="#E28743" stroke-width="7" stroke-linecap="round" />
        </g>
      </svg>`;

    case "马到成功":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <!-- Golden radiant halo -->
        <circle cx="200" cy="140" r="110" fill="#FEF08A" opacity="0.5" />
        <!-- Orange/Brown horse galloping head profile -->
        <g transform="translate(120, 65)">
          <!-- Speed dashes -->
          <line x1="-50" y1="50" x2="-10" y2="50" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" />
          <line x1="-70" y1="90" x2="-25" y2="90" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />
          <line x1="-40" y1="120" x2="-5" y2="120" stroke="#D97706" stroke-width="3" stroke-linecap="round" />
          
          <!-- Neck & Chest -->
          <path d="M 10,130 Q 30,50 80,45 L 120,80 L 70,140 Z" fill="#D97706" />
          <!-- Gorgeous flying mane hair -->
          <path d="M 12,120 Q -25,80 5,60" fill="none" stroke="#78350F" stroke-width="12" stroke-linecap="round" />
          <path d="M 22,90 Q -15,50 15,35" fill="none" stroke="#78350F" stroke-width="10" stroke-linecap="round" />
          <!-- Horse Head -->
          <ellipse cx="105" cy="62" rx="35" ry="20" transform="rotate(-25 105 62)" fill="#EA580C" />
          <!-- Muzzle/Nose -->
          <ellipse cx="132" cy="48" rx="14" ry="11" fill="#C2410C" />
          <circle cx="135" cy="45" r="2.5" fill="#1E293B" />
          <!-- Sharp ear -->
          <path d="M 70,38 L 58,15 L 75,25 Z" fill="#78350F" />
          <path d="M 82,42 L 74,18 L 86,28 Z" fill="#78350F" />
          <!-- Glowing eye of success -->
          <circle cx="95" cy="55" r="6" fill="#FEF08A" />
          <circle cx="95" cy="55" r="3" fill="#1E293B" />
        </g>
        <!-- Golden celebratory winner template banner on bottom -->
        <g transform="translate(140, 210)">
          <path d="M 10,0 L 110,0 L 120,40 L 0,40 Z" fill="#F59E0B" stroke="#D97706" stroke-width="3" />
          <circle cx="60" cy="20" r="14" fill="#FFFFFF" stroke="#D97706" stroke-width="3" />
          <circle cx="60" cy="20" r="8" fill="#FBBF24" />
        </g>
      </svg>`;

    case "狼吞虎咽":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFF1F2" />
        <!-- Big tasty cartoon ham bone in the center -->
        <g transform="translate(100, 100)">
          <!-- Bone ends -->
          <circle cx="20" cy="45" r="16" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" />
          <circle cx="20" cy="70" r="16" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" />
          <rect x="25" y="47" width="150" height="20" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="3" />
          <!-- Large pink delicious meat block -->
          <ellipse cx="105" cy="57" rx="55" ry="36" fill="#FDA4AF" stroke="#F43F5E" stroke-width="4" />
          <ellipse cx="95" cy="57" rx="35" ry="24" fill="#FECDD3" />
          <!-- Bite marks/bitten chunks missing on the right -->
          <path d="M 140,30 Q 125,57 140,84 L 160,84 L 160,30 Z" fill="#FFF1F2" />
          <circle cx="132" cy="40" r="11" fill="#FFF1F2" />
          <circle cx="134" cy="65" r="11" fill="#FFF1F2" />
          <!-- Flying tasty crumbs -->
          <circle cx="170" cy="35" r="4.5" fill="#F43F5E" />
          <circle cx="178" cy="55" r="3" fill="#E11D48" />
          <circle cx="165" cy="75" r="4.5" fill="#FBBF24" />
          <!-- Happy chewing stars -->
          <polygon points="90,10 93,15 99,15 94,18 96,24 90,20 84,24 86,18 81,15 87,15" fill="#F59E0B" />
        </g>
      </svg>`;

    case "鸟语花香":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F0FDF4" />
        <!-- Sunbeam lights -->
        <circle cx="340" cy="60" r="50" fill="#FEF08A" opacity="0.3" filter="blur(8px)" />
        <!-- Tree branch on left -->
        <path d="M 0,170 Q 120,160 180,210" fill="none" stroke="#78350F" stroke-width="10" stroke-linecap="round" />
        <!-- Cute Red cartoon Bird singing on branch -->
        <g transform="translate(90, 110)">
          <!-- Tail -->
          <path d="M -15,30 Q -30,40 -25,25 Z" fill="#EF4444" />
          <!-- Body -->
          <circle cx="15" cy="20" r="22" fill="#EF4444" />
          <circle cx="22" cy="12" r="16" fill="#F87171" />
          <circle cx="18" cy="10" r="2.5" fill="#1E293B" />
          <!-- Open singing beak -->
          <polygon points="34,8 42,4 36,14" fill="#FBBF24" />
          <!-- Music notes floating in the air -->
          <path d="M 46,-5 Q 56,-15 66,-8" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="48" cy="-5" r="3" fill="#10B981" />
          <circle cx="58" cy="-12" r="3" fill="#10B981" />
        </g>
        <!-- Lovely sweet pink blooming Spring Flowers inside tall grass on right -->
        <g transform="translate(260, 150)">
          <!-- Grass stalks -->
          <path d="M -20,100 Q 10,40 5,10 Q -5,40 -20,100 Z" fill="#4ADE80" />
          <path d="M 60,100 Q 40,30 20,-10 Q 30,50 60,100 Z" fill="#4ADE80" />
          
          <!-- Pink Flower 1 -->
          <g transform="translate(10, 40)">
            <circle cx="0" cy="-20" r="12" fill="#F43F5E" />
            <circle cx="16" cy="-10" r="12" fill="#F43F5E" />
            <circle cx="-16" cy="-10" r="12" fill="#F43F5E" />
            <circle cx="10" cy="10" r="12" fill="#F43F5E" />
            <circle cx="-10" cy="10" r="12" fill="#F43F5E" />
            <!-- Flower core -->
            <circle cx="0" cy="0" r="10" fill="#FEF08A" />
          </g>
          <!-- Small Flower 2 -->
          <g transform="translate(50, 20) scale(0.65)">
            <circle cx="0" cy="-20" r="12" fill="#EC4899" />
            <circle cx="16" cy="-10" r="12" fill="#EC4899" />
            <circle cx="-16" cy="-10" r="12" fill="#EC4899" />
            <circle cx="10" cy="10" r="12" fill="#EC4899" />
            <circle cx="-10" cy="10" r="12" fill="#EC4899" />
            <circle cx="0" cy="0" r="10" fill="#FBBF24" />
          </g>
        </g>
      </svg>`;

    case "鱼目混珠":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#ECFEFF" />
        <!-- Underwater bubbles -->
        <circle cx="100" cy="80" r="12" fill="none" stroke="#22D3EE" stroke-width="2" opacity="0.4" />
        <circle cx="280" cy="220" r="8" fill="none" stroke="#22D3EE" stroke-width="1.5" opacity="0.3" />
        <!-- Big beautiful Fish in background -->
        <g transform="translate(60, 100)">
          <!-- Tail fin -->
          <path d="M 0,40 Q -40,10 -35,70 Q -10,60 0,40 Z" fill="#60A5FA" />
          <path d="M 0,40 Q -35,5 Q -10,35 0,40 Z" fill="#3B82F6" />
          <!-- Fish body -->
          <path d="M -5,42 Q 60,5 110,42 Q 60,80 -5,42 Z" fill="#93C5FD" stroke="#2563EB" stroke-width="4" />
          <!-- Shiny fish scales decoration -->
          <path d="M 35,32 Q 45,37 35,42" fill="none" stroke="#2563EB" stroke-width="2" />
          <path d="M 45,39 Q 55,44 45,49" fill="none" stroke="#2563EB" stroke-width="2" />
          
          <!-- GIANT white round eyeball of the fish (Fish Eye) -->
          <circle cx="85" cy="36" r="16" fill="#FFFFFF" stroke="#1E293B" stroke-width="3" />
          <circle cx="85" cy="36" r="9" fill="#1E293B" />
          <circle cx="88" cy="33" r="3.5" fill="#FFFFFF" />
        </g>
        
        <!-- Glowing high-gloss precious Pearl (The Pearl) -->
        <g transform="translate(260, 120)">
          <!-- Outer glowing rings -->
          <circle cx="20" cy="20" r="38" fill="#E0F2FE" opacity="0.6" />
          <circle cx="20" cy="20" r="26" fill="#BAE6FD" opacity="0.7" />
          <!-- Pearl eyeball mock -->
          <circle cx="20" cy="20" r="19" fill="#F8FAFC" stroke="#0284C7" stroke-width="3.5" />
          <!-- Highlight glistening points -->
          <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
          <polygon points="34,8 37,13 42,13 38,16 40,21 34,18 28,21 30,16 26,13 31,13" fill="#FBBF24" />
        </g>
      </svg>`;

    case "鹬蚌相争":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <ellipse cx="200" cy="230" rx="140" ry="25" fill="#FEF3C7" opacity="0.8" />
        <!-- Clam (open shell) on left -->
        <g transform="translate(100, 130)">
          <!-- Clam bottom shell -->
          <path d="M 0,60 Q 60,95 100,50 L 100,65 Z" fill="#FDA4AF" stroke="#E11D48" stroke-width="3" />
          <!-- Clam top shell clamped tight on beak -->
          <path d="M 0,55 Q 50,0 90,30 L 98,39 Z" fill="#F43F5E" stroke="#9F1239" stroke-width="3" />
          <!-- Clam meat -->
          <ellipse cx="50" cy="40" rx="25" ry="14" fill="#FECDD3" />
          <!-- Clam cute blushing face -->
          <circle cx="45" cy="38" r="1.5" fill="#E11D48" />
          <circle cx="55" cy="38" r="1.5" fill="#E11D48" />
          <path d="M 47,43 Q 50,46 53,43" fill="none" stroke="#E11D48" stroke-width="1.5" />
        </g>
        <!-- Snipe Bird's long pointing orange beak getting clamped -->
        <g transform="translate(160, 45)">
          <!-- Long neck of snipe -->
          <path d="M 100,-20 L 70,70 L 88,80 L 120,-20 Z" fill="#94A3B8" />
          <!-- Crest of feathers -->
          <path d="M 120,-20 Q 145,-45 135,-15 Z" fill="#64748B" />
          <!-- Long pointy beak coming down to clam core -->
          <path d="M 72,66 L -25,125 L 78,74 Z" fill="#F97316" stroke="#C2410C" stroke-width="2.5" />
          <!-- Sharp alarmed bird eye -->
          <circle cx="92" cy="22" r="7.5" fill="#FFFFFF" stroke="#475569" stroke-width="2" />
          <circle cx="92" cy="22" r="3.5" fill="#000000" />
          <path d="M 85,13 L 95,18" stroke="#475569" stroke-width="2" />
        </g>
      </svg>`;

    case "螳螂捕蝉":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F0FDF4" />
        <!-- Big brown leafy branch -->
        <path d="M -20,200 Q 140,170 420,180" fill="none" stroke="#78350F" stroke-width="12" stroke-linecap="round" />
        <path d="M 220,175 Q 260,110 320,120" fill="none" stroke="#78350F" stroke-width="6" stroke-linecap="round" />
        
        <!-- Alarmed black Cicada bug (the Cicada) on right branch tip -->
        <g transform="translate(260, 80)">
          <!-- Translucent wings -->
          <ellipse cx="6" cy="30" rx="8" ry="24" fill="#38BDF8" opacity="0.6" transform="rotate(-15)" />
          <ellipse cx="26" cy="30" rx="8" ry="24" fill="#38BDF8" opacity="0.6" transform="rotate(15)" />
          <!-- Cicada body -->
          <ellipse cx="16" cy="25" rx="14" ry="19" fill="#1E293B" />
          <!-- Red eyes -->
          <circle cx="3" cy="15" r="4.5" fill="#EF4444" />
          <circle cx="29" cy="15" r="4.5" fill="#EF4444" />
        </g>
        
        <!-- Giant bright green Mantis stalking from left -->
        <g transform="translate(70, 75)">
          <!-- Abdomen -->
          <path d="M 12,95 Q 60,65 110,85 L 100,105 Q 60,85 12,95 Z" fill="#16A34A" />
          <!-- Long green neck/thorax -->
          <path d="M 100,90 L 140,40 L 152,48 L 112,98 Z" fill="#22C55E" />
          <!-- Mantis head with big cartoon eyes -->
          <g transform="translate(133, 20)">
            <polygon points="10,0 26,10 5,22" fill="#22C55E" />
            <circle cx="21" cy="7" r="5" fill="#86EFAC" />
            <circle cx="21" cy="7" r="2.5" fill="#1E293B" />
            <circle cx="6" cy="15" r="5" fill="#86EFAC" />
            <circle cx="6" cy="15" r="2.5" fill="#1E293B" />
          </g>
          <!-- Sharp folded green hook arms ready to strike! -->
          <path d="M 130,55 L 145,75 L 125,95" fill="none" stroke="#15803D" stroke-width="5.5" stroke-linecap="round" />
          <path d="M 138,50 L 158,68 L 142,88" fill="none" stroke="#15803D" stroke-width="5.5" stroke-linecap="round" />
        </g>
      </svg>`;

    case "黔驴技穷":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFF7ED" />
        <!-- Donkey outline in grey on the left kicking high -->
        <g transform="translate(80, 100)">
          <!-- Donkey rear and back legs kicking -->
          <ellipse cx="60" cy="65" rx="36" ry="28" fill="#64748B" />
          <!-- Left Leg kicking out straight -->
          <path d="M 86,52 L 150,22 Q 155,30 148,38 L 88,68 Z" fill="#475569" stroke="#334155" stroke-width="2" />
          <!-- Right Leg kicking -->
          <path d="M 84,72 L 145,55 Q 150,62 143,70 L 86,85 Z" fill="#475569" stroke="#334155" stroke-width="2" />
          <!-- Hooves of frustration -->
          <rect x="135" y="18" width="12" height="15" rx="3" fill="#0F172A" transform="rotate(-26 135 18)" />
          <rect x="133" y="52" width="12" height="15" rx="3" fill="#0F172A" transform="rotate(-15 133 52)" />
          
          <!-- Donkey torso/head straining, sweating -->
          <ellipse cx="20" cy="74" rx="25" ry="18" fill="#64748B" />
          <path d="M 15,65 L -10,35 L 8,25 L 30,58 Z" fill="#64748B" />
          <!-- Long donkey ears flying -->
          <path d="M -8,38 L -35,28 L -18,15 Z" fill="#475569" />
          <!-- Funny sad open eye -->
          <circle cx="2" cy="40" r="4" fill="#FFFFFF" />
          <circle cx="2" cy="40" r="1.5" fill="#000000" />
        </g>
        <!-- Angry/amused Tiger cartoon spying/watching donkey closely on right side -->
        <g transform="translate(240, 140)">
          <circle cx="45" cy="45" r="40" fill="#F97316" stroke="#C2410C" stroke-width="3" />
          <!-- Tiger black stripes -->
          <path d="M 12,30 L 25,32 L 12,35 Z" fill="#1E293B" />
          <path d="M 12,45 L 28,47 L 12,50 Z" fill="#1E293B" />
          <path d="M 78,35 L 65,37 L 78,40 Z" fill="#1E293B" />
          <!-- Smart gleaming yellow tiger eyes -->
          <path d="M 23,38 Q 30,42 37,38" fill="none" stroke="#FEF08A" stroke-width="5" stroke-linecap="round" />
          <path d="M 53,38 Q 60,42 67,38" fill="none" stroke="#FEF08A" stroke-width="5" stroke-linecap="round" />
          <circle cx="30" cy="38" r="2.5" fill="#1E293B" />
          <circle cx="60" cy="38" r="2.5" fill="#1E293B" />
          <!-- Laughing mouth -->
          <path d="M 40,55 Q 45,62 50,55" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round" />
        </g>
      </svg>`;

    case "开门见山":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EDF2F7" />
        <!-- Majestic polygon green/teal mountains in center background -->
        <g transform="translate(100, 50)" stroke="#15803D" stroke-width="3" stroke-linejoin="round">
          <polygon points="100,160 50,50 -20,160" fill="#22C55E" />
          <polygon points="210,165 140,30 70,165" fill="#4ADE80" />
          <polygon points="135,170 95,80 30,170" fill="#16A34A" />
        </g>
        <!-- Two large bright red wooden double doors swung wide open on sides -->
        <!-- Left wide-open door frame -->
        <g transform="translate(20, 40)">
          <!-- Door frame shadow -->
          <rect x="-5" y="-5" width="85" height="230" rx="8" fill="#1E293B" opacity="0.1" />
          <!-- Golden hinge links -->
          <circle cx="70" cy="50" r="5" fill="#FBBF24" />
          <circle cx="70" cy="150" r="5" fill="#FBBF24" />
          <!-- Left door panel swung back -->
          <path d="M 0,0 L 70,25 L 70,195 L 0,220 Z" fill="#DC2626" stroke="#991B1B" stroke-width="4" />
          <!-- Gold knocker plaque ring -->
          <circle cx="45" cy="110" r="10" fill="#FEF08A" stroke="#B45309" stroke-width="2" />
        </g>
        <!-- Right wide-open door panel -->
        <g transform="translate(305, 40)">
          <rect x="5" y="-5" width="85" height="230" rx="8" fill="#1E293B" opacity="0.1" />
          <circle cx="5" cy="50" r="5" fill="#FBBF24" />
          <circle cx="5" cy="150" r="5" fill="#FBBF24" />
          <path d="M 75,0 L 5,25 L 5,195 L 75,220 Z" fill="#DC2626" stroke="#991B1B" stroke-width="4" />
          <circle cx="30" cy="110" r="10" fill="#FEF08A" stroke="#B45309" stroke-width="2" />
        </g>
      </svg>`;

    case "水滴石穿":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#ECFEFF" />
        <circle cx="200" cy="150" r="110" fill="#CFFAFE" opacity="0.6" />
        <!-- Big soft blue cartoon cloud at top -->
        <g fill="#A5F3FC" transform="translate(110, 20)">
          <path d="M 30,40 Q 50,15 80,30 Q 110,10 140,35 Q 170,20 180,50 L 10,50 Z" />
          <rect x="10" y="38" width="170" height="15" rx="6" />
        </g>
        <!-- Large cracked, weathered river stone in center bottom -->
        <g transform="translate(100, 195)">
          <path d="M 10,65 Q 100,10 190,65 Q 160,95 100,95 T 10,65" fill="#64748B" stroke="#475569" stroke-width="4" />
          <!-- Center deep hole/crater worn down by drops -->
          <ellipse cx="100" cy="45" rx="24" ry="12" fill="#1E293B" />
          <ellipse cx="100" cy="45" rx="14" ry="7" fill="#0F172A" />
          <!-- Splitting cracks on rock outward -->
          <path d="M 76,45 L 45,40 M 124,45 L 155,47 M 100,57 L 100,75" stroke="#334155" stroke-width="4" stroke-linecap="round" />
        </g>
        <!-- The heroic single blue water droplet falling straight down -->
        <g transform="translate(185, 95)">
          <path d="M 15,0 C 15,0 30,22 30,32 C 30,42 20,48 15,48 C 10,48 -0,42 -0,32 C -0,22 15,0 15,0 Z" fill="#0EA5E9" />
          <ellipse cx="11" cy="30" rx="4" ry="7" fill="#FFFFFF" opacity="0.3" transform="rotate(-15)" />
          <!-- Action speed/drizzle particles -->
          <line x1="15" y1="-15" x2="15" y2="-5" stroke="#0EA5E9" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 2" />
        </g>
      </svg>`;

    case "火上浇油":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#0F172A" />
        <!-- Big raging campfire sparks -->
        <g transform="translate(130, 140)">
          <!-- Wooden logs beneath -->
          <rect x="20" y="80" width="110" height="18" rx="5" fill="#78350F" transform="rotate(20 75 89)" />
          <rect x="25" y="80" width="110" height="18" rx="5" fill="#78350F" transform="rotate(-20 78 89)" />
          
          <!-- Layered glowing flames -->
          <path d="M 15,90 Q 70,-45 125,90 Z" fill="#EF4444" opacity="0.6" />
          <path d="M 25,90 Q 70,-15 115,90 Z" fill="#F97316" opacity="0.8" />
          <path d="M 40,90 Q 70,5 100,90 Z" fill="#FBBF24" />
          <path d="M 55,90 Q 70,25 85,90 Z" fill="#FFFFFF" />
        </g>
        <!-- Green bottle pouring oil streams on top -->
        <g transform="translate(40, 30)">
          <!-- Glowing green fluid flask tilted high -->
          <rect x="18" y="22" width="40" height="70" rx="10" transform="rotate(-55 38 57)" fill="#10B981" stroke="#047857" stroke-width="3.5" />
          <!-- Flask neck -->
          <rect x="30" y="0" width="16" height="25" rx="3" transform="rotate(-55 38 57)" fill="#10B981" stroke="#047857" stroke-width="2" />
          <!-- Oil droplets streaming into flame -->
          <ellipse cx="140" cy="115" rx="9" ry="5" fill="#10B981" transform="rotate(35)" style={{ animationDuration: '0.5s' }} />
          <ellipse cx="110" cy="95" rx="6" ry="4" fill="#FEF08A" transform="rotate(35)" />
        </g>
      </svg>`;

    case "雪中送炭":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EFF6FF" />
        <!-- Big snowy pasture hills background -->
        <path d="M -20,220 Q 120,185 280,225 T 420,195 L 420,300 L -20,300 Z" fill="#FFFFFF" />
        <path d="M -20,245 Q 150,215 320,255 L 420,255 L -20,300 Z" fill="#E2E8F0" opacity="0.6" />
        
        <!-- Cozy woven wood basket containing charcoal logs -->
        <g transform="translate(130, 140)" filter="drop-shadow(0px 8px 12px rgba(0,0,0,0.06))">
          <!-- Basket body back -->
          <ellipse cx="70" cy="55" rx="60" ry="32" fill="#D97706" />
          <ellipse cx="70" cy="55" rx="55" ry="27" fill="#B45309" />
          
          <!-- Stack of round black charcoal logs inside basket -->
          <g fill="#1E293B">
            <rect x="35" y="10" width="22" height="50" rx="6" transform="rotate(15 46 35)" />
            <rect x="65" y="5" width="24" height="50" rx="6" transform="rotate(-5 77 30)" />
            <rect x="85" y="12" width="22" height="50" rx="6" transform="rotate(-25 96 37)" />
            <rect x="52" y="20" width="25" height="45" rx="6" />
            <!-- Charcoal rings -->
            <ellipse cx="44" cy="18" rx="8" ry="4" fill="#475569" transform="rotate(15)" />
            <ellipse cx="79" cy="12" rx="9" ry="5" fill="#475569" transform="rotate(-5)" />
          </g>
          
          <!-- Warming glowing red/gold embers/sparks shooting from the charcoal -->
          <g fill="#EF4444" opacity="0.9">
            <circle cx="48" cy="-5" r="4" fill="#EF4444" />
            <circle cx="88" cy="-12" r="5" fill="#FBBF24" />
            <circle cx="108" cy="15" r="3" fill="#F97316" />
            <polygon points="68,-10 71,-5 77,-5 72,-2 74,4 68,0 62,4 64,-2 59,-5 65,-5" fill="#FEF08A" />
          </g>
          
          <!-- Basket woven front cover -->
          <path d="M 10,55 A 60,32 0 0,0 130,55 Z" fill="#D97706" stroke="#92400E" stroke-width="3" />
          <line x1="20" y1="58" x2="120" y2="58" stroke="#78350F" stroke-width="2.5" />
          <line x1="30" y1="67" x2="110" y2="67" stroke="#78350F" stroke-width="2.5" />
        </g>
      </svg>`;

    case "画饼充饥":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F8FAFC" />
        <!-- Big dark chalkboard easel -->
        <g transform="translate(100, 30)">
          <!-- Wooden stand easel legs -->
          <line x1="30" y1="120" x2="10" y2="240" stroke="#78350F" stroke-width="6" stroke-linecap="round" />
          <line x1="170" y1="120" x2="190" y2="240" stroke="#78350F" stroke-width="6" stroke-linecap="round" />
          <line x1="100" y1="30" x2="100" y2="230" stroke="#451A03" stroke-width="4" stroke-linecap="round" opacity="0.4" />
          
          <!-- The green board frame -->
          <rect x="0" y="10" width="200" height="142" rx="12" fill="#78350F" />
          <rect x="8" y="18" width="184" height="126" rx="6" fill="#064E3B" />
          
          <!-- A beautifully hand-drawn chalk circle 'biscuit/cookie' on chalkboard -->
          <circle cx="100" cy="80" r="38" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-dasharray="8 4" />
          <!-- Cookie cream spirals / dots -->
          <path d="M 80,72 Q 100,60 115,80 T 110,105" fill="none" stroke="#FEF08A" stroke-width="3" stroke-dasharray="5 5" opacity="0.9" />
          <circle cx="85" cy="90" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="112" cy="72" r="3.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="102" cy="98" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </g>
        <!-- Human hand on bottom holding a piece of white chalk -->
        <g transform="translate(260, 160)">
          <path d="M 0,25 C 10,20 20,25 24,30 L 12,45 C 5,42 0,34 0,25 Z" fill="#FED7AA" stroke="#D97706" stroke-width="2" />
          <!-- Piece of white chalk stick -->
          <rect x="-8" y="15" width="12" height="24" rx="2" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" transform="rotate(35)" />
        </g>
      </svg>`;

    case "指鹿为马":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FAF5FF" />
        <!-- A sweet cartoon brown Stag Deer (The Deer) in center -->
        <g transform="translate(140, 80)">
          <!-- Legs -->
          <line x1="25" y1="120" x2="25" y2="180" stroke="#B45309" stroke-width="5" stroke-linecap="round" />
          <line x1="38" y1="120" x2="48" y2="180" stroke="#B45309" stroke-width="5" stroke-linecap="round" />
          <line x1="75" y1="120" x2="68" y2="180" stroke="#B45309" stroke-width="5" stroke-linecap="round" />
          <line x1="88" y1="120" x2="88" y2="180" stroke="#B45309" stroke-width="5" stroke-linecap="round" />
          <!-- Body -->
          <ellipse cx="60" cy="110" rx="42" ry="26" fill="#D97706" />
          <ellipse cx="60" cy="104" rx="28" ry="14" fill="#FFFBEB" opacity="0.2" />
          <!-- White deer spots -->
          <circle cx="48" cy="98" r="3" fill="#FFFFFF" />
          <circle cx="68" cy="115" r="3.5" fill="#FFFFFF" />
          <circle cx="78" cy="102" r="2.5" fill="#FFFFFF" />
          <!-- Tail -->
          <path d="M 102,104 L 115,95 L 105,115 Z" fill="#B45309" />
          
          <!-- Long Neck & Head -->
          <path d="M 24,106 L 15,35 L 35,38 L 48,100 Z" fill="#D97706" />
          <!-- Deer Head -->
          <ellipse cx="12" cy="30" rx="18" ry="12" transform="rotate(-15 12 30)" fill="#EA580C" />
          <!-- Large antler branches indicating standard deer, NOT horse -->
          <path d="M 18,18 Q 12,-15 -10,0 Q 10,8 15,18 Z" fill="#78350F" />
          <path d="M 28,18 Q 38,-15 58,0 Q 42,8 32,18 Z" fill="#78350F" />
          <!-- Blushing cheeks & big innocent eye -->
          <circle cx="8" cy="27" r="2.5" fill="#1E293B" />
          <circle cx="4" cy="31" r="3" fill="#F43F5E" opacity="0.5" />
        </g>
        <!-- Impudence          <circle cx="50" cy="120" r="6" fill="#78350F" />
          <path d="M 35,200 L 65,200 L 50,190 Z" fill="#EA580C" />
          <!-- Tucked other leg -->
          <path d="M 32,120 Q 15,140 25,155" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round" />
          
          <!-- Fluffy yellow spherical body -->
          <circle cx="50" cy="85" r="35" fill="#FBBF24" stroke="#D97706" stroke-width="3" />
          <circle cx="50" cy="85" r="24" fill="#FEF08A" />
          <!-- Red tail plumes -->
          <path d="M 15,85 Q -15,55 -5,42 C 5,52 15,70 15,85 Z" fill="#EF4444" />
          <path d="M 15,95 Q -25,85 -8,72 Q 13,85 15,95 Z" fill="#F97316" />
          
          <!-- Head neck combo -->
          <path d="M 68,72 L 80,42 L 95,58 L 74,86 Z" fill="#FBBF24" />
          <!-- Head -->
          <circle cx="90" cy="45" r="14" fill="#EA580C" />
          <!-- Red comb of golden rooster -->
          <ellipse cx="90" cy="28" rx="5" ry="8" fill="#EF4444" />
          <ellipse cx="96" cy="30" rx="4" ry="7" fill="#EF4444" />
          <!-- Eyes closed in deep peaceful concentration -->
          <line x1="82" y1="45" x2="94" y2="45" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
          <!-- Golden beak -->
          <polygon points="102,40 110,45 102,50" fill="#FBBF24" />
        </g>
      </svg>`;

    case "眉飞色舞":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FAF5FF" />
        <!-- Sparkles of extreme joy/excitement in background -->
        <g fill="#A855F7" opacity="0.6">
          <polygon points="60,40 63,45 69,45 64,48 66,54 60,50 54,54 56,48 51,45 57,45" fill="#F59E0B" />
          <polygon points="320,60 323,65 329,65 324,68 326,74 320,70 314,74 316,68 311,65 317,65" fill="#3B82F6" />
          <polygon points="80,210 83,215 89,215 84,218 86,224 80,220 74,224 76,218 71,215 77,215" fill="#EF4444" />
          <polygon points="310,200 313,205 319,205 314,208 316,214 310,210 304,214 306,208 301,205 307,205" fill="#10B981" />
        </g>
        <!-- The epic happy smiley face (眉飞色舞!) -->
        <g transform="translate(110, 60)">
          <!-- Blushing cheeks -->
          <circle cx="40" cy="115" r="55" fill="#FCE4EC" opacity="0.6" />
          <circle cx="140" cy="115" r="55" fill="#FCE4EC" opacity="0.6" />
          <!-- Rosy dots -->
          <ellipse cx="28" cy="105" rx="14" ry="7" fill="#F43F5E" opacity="0.4" />
          <ellipse cx="152" cy="105" rx="14" ry="7" fill="#F43F5E" opacity="0.4" />
          
          <!-- Flying eyebrows (Wiggling up and off the forehead in joy) -->
          <path d="M 12,35 C 20,15 45,15 54,28" fill="none" stroke="#701A75" stroke-width="8.5" stroke-linecap="round" />
          <path d="M 128,35 C 136,15 161,15 170,28" fill="none" stroke="#701A75" stroke-width="8.5" stroke-linecap="round" stroke-linecap="round" stroke-linecap="round" />
          <polygon points="50,15 58,10 52,22" fill="#E879F9" />
          <polygon points="125,15 117,10 123,22" fill="#E879F9" />
          
          <!-- Joyful half moon smiling eyes -->
          <path d="M 18,74 Q 40,95 62,74" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <path d="M 118,74 Q 140,95 162,74" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          
          <!-- Big open happy mouth laughing -->
          <path d="M 55,115 Q 90,165 125,115 Z" fill="#EF4444" stroke="#991B1B" stroke-width="3" />
          <!-- Tongue inside mouth -->
          <ellipse cx="90" cy="138" rx="24" ry="12" fill="#FCA5A5" />
        </g>
      </svg>`;

    case "门庭若市":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <!-- Big red target archway gates in background -->
        <g transform="translate(100, 40)">
          <!-- Side stone columns -->
          <rect x="10" y="30" width="22" height="180" fill="#94A3B8" rx="5" />
          <rect x="168" y="30" width="22" height="180" fill="#94A3B8" rx="5" />
          <!-- Red imperial gate roof -->
          <path d="M -10,40 L 210,40 L 190,10 L 10,10 Z" fill="#DC2626" stroke="#991B1B" stroke-width="3" />
          <rect x="30" y="30" width="140" height="20" fill="#EA580C" />
          <!-- Open double wooden doors -->
          <rect x="32" y="50" width="60" height="160" fill="#B45309" opacity="0.3" />
          <rect x="108" y="50" width="60" height="160" fill="#B45309" opacity="0.3" />
        </g>
        <!-- Festive red lanterns hanging -->
        <circle cx="80" cy="90" r="14" fill="#EF4444" />
        <rect x="76" y="104" width="8" height="4" fill="#FEF08A" />
        <circle cx="320" cy="90" r="14" fill="#EF4444" />
        <rect x="316" y="104" width="8" height="4" fill="#FEF08A" />
        
        <!-- Multiple pairs of small footsteps leading through open door (Bustling crowd index) -->
        <g fill="#D97706" opacity="0.8">
          <!-- Footsteps pair 1 -->
          <ellipse cx="160" cy="230" rx="5" ry="10" transform="rotate(-15 160 230)" />580C" stroke-width="6" stroke-linecap="round" />
          <line x1="0" y1="0" x2="280" y2="0" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" />
          <!-- Arrow head -->
          <polygon points="280,-8 296,0 280,8" fill="#C2410C" />
          <!-- Arrow feathers/wings -->
          <polygon points="0,0 15,14 -10,14" fill="#EF4444" />
          <polygon points="0,0 15,-14 -10,-14" fill="#EF4444" />
        </g>
      </svg>`;

    case "胸有成竹":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#F0FDF4" />
        <circle cx="200" cy="150" r="110" fill="#DCFCE7" opacity="0.6" />
        <!-- Serene elegant green tall Bamboo poles and leaves -->
        <g transform="translate(120, 30)">
          <!-- Pole 1 -->
          <g stroke="#15803D" stroke-width="8" stroke-linecap="butt">
            <line x1="40" y1="240" x2="40" y2="183" />
            <line x1="40" y1="177" x2="40" y2="123" />
            <line x1="40" y1="117" x2="40" y2="63" />
            <line x1="40" y1="57" x2="40" y2="0" />
          </g>
          <!-- Bamboo connectors knots lines -->
          <circle cx="40" cy="180" r="6.5" fill="#A7F3D0" />
          <circle cx="40" cy="120" r="6.5" fill="#A7F3D0" />
          <circle cx="40" cy="60" r="6.5" fill="#A7F3D0" />
          
          <!-- Pole 2 (thinner, slightly tilted in background) -->
          <g stroke="#047857" stroke-width="5" stroke-linecap="butt" opacity="0.6">
            <line x1="120" y1="240" x2="115" y2="183" />
            <line x1="115" y1="177" x2="110" y2="123" />
            <line x1="110" y1="117" x2="105" y2="63" />
            <line x1="105" y1="57" x2="100" y2="0" />
          </g>
          
          <!-- Delicate leaves shoots springing from knots -->
          <path d="M 40,120 Q 10,105 -25,115 Q -10,130 40,120 Z" fill="#15803D" stroke="#14532D" stroke-width="1.5" />
          <path d="M 40,120 Q 15,95 2,75 Q 18,92 40,120 Z" fill="#34D399" />
          <path d="M 40,60 Q 70,45 105,52 Q 80,68 40,60 Z" fill="#16A34A" />
          <path d="M 40,60 Q 64,25 58,1 Q 50,22 40,60 Z" fill="#34D399" />
        </g>
      </svg>`;

    case "破釜沉舟":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#0F172A" />
        <!-- Giant blue angry sea waves on bottom -->
        <path d="M -20,220 Q 80,180 180,230 T 380,210 L 420,300 M -20,240 L -20,300 L 420,300 Z" fill="#1E3A8A" />
        <path d="M -20,240 Q 110,210 260,260 L 420,260 L -20,300 Z" fill="#1D4ED8" opacity="0.7" />
        <!-- Sinking wooden boat hull in the water (舟) -->
        <g transform="translate(220, 150) rotate(22)">
          <path d="M 12,40 Q 60,-5 120,40 L 110,55 L 20,55 Z" fill="#78350F" stroke="#451A03" stroke-width="3.5" />
          <rect x="52" y="10" width="8" height="40" fill="#FED7AA" />
          <rect x="42" y="10" width="28" height="15" fill="#EF4444" />
        </g>
        <!-- Shattered heavy iron cooking pot on left (釜) -->
        <g transform="translate(60, 110) rotate(-15)">
          <!-- Main cooking pot body cracks -->
          <circle cx="50" cy="50" r="42" fill="#334155" stroke="#1E293B" stroke-width="4.5" />
          <path d="M 12,35 L 88,68 L 78,88 M 50,15 L 50,85" stroke="#0F172A" stroke-width="6" stroke-linecap="round" />
          <path d="M 12,35 L 88,68 L 78,88 M 50,15 L 50,85" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
          <!-- Heavy dynamic sparks of explosion -->
          <circle cx="20" cy="-5" r="4.5" fill="#EF4444" />
          <circle cx="85" cy="-10" r="4.5" fill="#FBBF24" />
          <circle cx="-12" cy="74" r="3.5" fill="#F97316" />
        </g>
      </svg>`;

    case "大惊小怪":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <!-- Left eye opened extremely wide matching exclamation marks (大惊!) -->
        <g transform="translate(50, 60)">
          <ellipse cx="65" cy="80" rx="55" ry="55" fill="#FFFFFF" stroke="#334155" stroke-width="4" />
          <!-- dilated pupil -->
          <circle cx="65" cy="80" r="22" fill="#1E293B" />
          <circle cx="70" cy="74" r="6" fill="#FFFFFF" />
          <!-- Red nervous lines -->
          <path d="M 15,80 L 25,80 M 115,80 L 105,80 M 65,30 L 65,40" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" />
          <!-- Raised curved exclamation eyebrow -->
          <path d="M 23,12 C 30,-5 100,-5 107,12" fill="none" stroke="#F97316" stroke-width="9.5" stroke-linecap="round" />
        </g>
        <!-- Right eye closed extremely tiny looking calm and small (小怪) -->
        <g transform="translate(240, 95)">
          <path d="M 20,40 Q 50,10 80,40" fill="none" stroke="#334155" stroke-width="9.5" stroke-linecap="round" />
          <ellipse cx="50" cy="52" rx="4" ry="4" fill="#F43F5E" opacity="0.5" />
        </g>
        <!-- Floating colorful red exclamation mark of chaos -->
        <g transform="translate(195, 40)" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.15))">
          <path d="M 0,0 L 10,0 L 8,42 L 2,42 Z" fill="#EF4444" stroke="#991B1B" stroke-width="2" />
          <circle cx="5" cy="56" r="6" fill="#EF4444" stroke="#991B1B" stroke-width="2" />
        </g>
      </svg>`;

    case "九牛一毛":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EFF6FF" />
        <!-- Nine repeating cow spot patterns in background -->
        <g fill="#94A3B8" opacity="0.12" transform="translate(20, 20)">
          <path d="M 10,40 C 35,20 60,50 30,70 Z" />
          <path d="M 120,60 C 145,40 170,70 140,90 Z" />
          <path d="M 220,30 C 245,10 270,40 240,60 Z" />
          <path d="M 50,140 C 75,120 100,150 70,170 Z" />
          <path d="M 180,180 C 205,160 230,190 200,210 Z" />
          <path d="M 280,130 C 305,110 330,140 300,160 Z" />
        </g>
        <!-- The big magnifying glass circle focusing on one single tiny hair strand (一毛!) -->
        <g transform="translate(100, 50)">
          <!-- The magnifying lens outline and black arm handle -->
          <line x1="160" y1="160" x2="230" y2="230" stroke="#1E293B" stroke-width="14" stroke-linecap="round" />
          <line x1="160" y1="160" x2="230" y2="230" stroke="#475569" stroke-width="6" stroke-linecap="round" />
          
          <!-- Outer shiny lens holder -->
          <circle cx="100" cy="100" r="80" fill="#E2E8F0" stroke="#475569" stroke-width="8" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))" />
          <circle cx="100" cy="100" r="74" fill="#FFFFFF" />
          
          <!-- The giant golden curly hair strand shown in details inside magnifying glass -->
          <path d="M 60,110 Q 100,40 135,115" fill="none" stroke="#D97706" stroke-width="9" stroke-linecap="round" />
          <path d="M 60,110 Q 100,40 135,115" fill="none" stroke="#FBBF24" stroke-width="4.5" stroke-linecap="round" />
          
          <!-- Shining dusts -->
          <polygon points="120,40 122,44 127,44 123,47 125,52 120,49 115,52 117,47 113,44 118,44" fill="#FEF08A" />
        </g>
      </svg>`;

    case "杯水车薪":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#EF4444" opacity="0.05" />
        <!-- Giant cartload of firewood burning fiercely on right (车薪) -->
        <g transform="translate(180, 80)">
          <!-- The cart wheel in line -->
          <circle cx="50" cy="140" r="32" fill="#B45309" stroke="#78350F" stroke-width="5" />
          <circle cx="50" cy="140" r="10" fill="#78350F" />
          <!-- Heavy fire firewood stack -->
          <rect x="-10" y="30" width="130" height="92" rx="10" fill="#78350F" stroke="#451A03" stroke-width="4" />
          <!-- Heavy crackling flame paths -->
          <path d="M -20,60 Q 40,-45 100,60 Z" fill="#EF4444" opacity="0.75" />
          <path d="M 10,60 Q 50,5 90,60 Z" fill="#FBBF24" />
          <!-- Dynamic smoke clouds -->
          <ellipse cx="30" cy="-20" rx="25" ry="14" fill="#64748B" opacity="0.6" />
          <ellipse cx="75" cy="-28" rx="30" ry="16" fill="#64748B" opacity="0.5" />
        </g>
        <!-- A single tiny cute cup of blue water spilling one small droplet on left (杯水) -->
        <g transform="translate(30, 85)">
          <ellipse cx="65" cy="15" rx="18" ry="10" fill="#FFFFFF" stroke="#3B82F6" stroke-width="3.5" />
          <ellipse cx="65" cy="15" rx="13" ry="6" fill="#60A5FA" />
          <!-- Spill drop -->
          <path d="M 65,15 C 65,15 85,32 85,42 C 85,48 77,54 70,54 C 64,54 58,48 58,42 C 58,32 65,15 65,15 Z" fill="#2563EB" />
          <ellipse cx="65" cy="38" rx="2" ry="5" fill="#FFFFFF" opacity="0.4" />
          <!-- Bowl handle -->
          <path d="M 47,15 Q 30,22 47,30" fill="none" stroke="#2563EB" stroke-width="3" />
          <!-- Bowl body -->
          <path d="M 47,15 Q 52,58 75,58" fill="none" stroke="#3B82F6" stroke-width="4.5" />
        </g>
      </svg>`;

    case "金鸡独立":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <!-- Big red rising sun in backdrop -->
        <circle cx="200" cy="100" r="65" fill="#EF4444" opacity="0.15" />
        <!-- Beautiful round stone pedestal -->
        <ellipse cx="200" cy="245" rx="70" ry="18" fill="#CBD5E1" stroke="#94A3B8" stroke-width="3" />
        
        <!-- Golden rooster standing perfectly on just one leg (金鸡独立!) -->
        <g transform="translate(150, 40)">
          <!-- Standing leg holding mass -->
          <line x1="50" y1="120" x2="50" y2="200" stroke="#F59E0B" stroke-width="6" stroke-linecap="round" />
          <circle cx="50" cy="120" r="6" fill="#78350F" />
          <path d="M 35,200 L 65,200 L 50,190 Z" fill="#EA580C" />
          <!-- Tucked other leg -->
          <path d="M 32,120 Q 15,140 25,155" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round" />
          
          <!-- Fluffy yellow spherical body -->
          <circle cx="50" cy="85" r="35" fill="#FBBF24" stroke="#D97706" stroke-width="3" />
          <circle cx="50" cy="85" r="24" fill="#FEF08A" />
          <!-- Red tail plumes -->
          <path d="M 15,85 Q -15,55 -5,42 C 5,52 15,70 15,85 Z" fill="#EF4444" />
          <path d="M 15,95 Q -25,85 -8,72 Q 13,85 15,95 Z" fill="#F97316" />
          
          <!-- Head neck combo -->
          <path d="M 68,72 L 80,42 L 95,58 L 74,86 Z" fill="#FBBF24" />
          <!-- Head -->
          <circle cx="90" cy="45" r="14" fill="#EA580C" />
          <!-- Red comb of golden rooster -->
          <ellipse cx="90" cy="28" rx="5" ry="8" fill="#EF4444" />
          <ellipse cx="96" cy="30" rx="4" ry="7" fill="#EF4444" />
          <!-- Eyes closed in deep peaceful concentration -->
          <line x1="82" y1="45" x2="94" y2="45" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />
          <!-- Golden beak -->
          <polygon points="102,40 110,45 102,50" fill="#FBBF24" />
        </g>
      </svg>`;

    case "眉飞色舞":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FAF5FF" />
        <!-- Sparkles of extreme joy/excitement in background -->
        <g fill="#A855F7" opacity="0.6">
          <polygon points="60,40 63,45 69,45 64,48 66,54 60,50 54,54 56,48 51,45 57,45" fill="#F59E0B" />
          <polygon points="320,60 323,65 329,65 324,68 326,74 320,70 314,74 316,68 311,65 317,65" fill="#3B82F6" />
          <polygon points="80,210 83,215 89,215 84,218 86,224 80,220 74,224 76,218 71,215 77,215" fill="#EF4444" />
          <polygon points="310,200 313,205 319,205 314,208 316,214 310,210 304,214 306,208 301,205 307,205" fill="#10B981" />
        </g>
        <!-- The epic happy smiley face (眉飞色舞!) -->
        <g transform="translate(110, 60)">
          <!-- Blushing cheeks -->
          <circle cx="40" cy="115" r="55" fill="#FCE4EC" opacity="0.6" />
          <circle cx="140" cy="115" r="55" fill="#FCE4EC" opacity="0.6" />
          <!-- Rosy dots -->
          <ellipse cx="28" cy="105" rx="14" ry="7" fill="#F43F5E" opacity="0.4" />
          <ellipse cx="152" cy="105" rx="14" ry="7" fill="#F43F5E" opacity="0.4" />
          
          <!-- Flying eyebrows (Wiggling up and off the forehead in joy) -->
          <path d="M 12,35 C 20,15 45,15 54,28" fill="none" stroke="#701A75" stroke-width="8.5" stroke-linecap="round" />
          <path d="M 128,35 C 136,15 161,15 170,28" fill="none" stroke="#701A75" stroke-width="8.5" stroke-linecap="round" />
          <polygon points="50,15 58,10 52,22" fill="#E879F9" />
          <polygon points="125,15 117,10 123,22" fill="#E879F9" />
          
          <!-- Joyful half moon smiling eyes -->
          <path d="M 18,74 Q 40,95 62,74" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          <path d="M 118,74 Q 140,95 162,74" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
          
          <!-- Big open happy mouth laughing -->
          <path d="M 55,115 Q 90,165 125,115 Z" fill="#EF4444" stroke="#991B1B" stroke-width="3" />
          <!-- Tongue inside mouth -->
          <ellipse cx="90" cy="138" rx="24" ry="12" fill="#FCA5A5" />
        </g>
      </svg>`;

    case "门庭若市":
      return `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FFFBEB" />
        <!-- Big red target archway gates in background -->
        <g transform="translate(100, 40)">
          <!-- Side stone columns -->
          <rect x="10" y="30" width="22" height="180" fill="#94A3B8" rx="5" />
          <rect x="168" y="30" width="22" height="180" fill="#94A3B8" rx="5" />
          <!-- Red imperial gate roof -->
          <path d="M -10,40 L 210,40 L 190,10 L 10,10 Z" fill="#DC2626" stroke="#991B1B" stroke-width="3" />
          <rect x="30" y="30" width="140" height="20" fill="#EA580C" />
          <!-- Open double wooden doors -->
          <rect x="32" y="50" width="60" height="160" fill="#B45309" opacity="0.3" />
          <rect x="108" y="50" width="60" height="160" fill="#B45309" opacity="0.3" />
        </g>
        <!-- Festive red lanterns hanging -->
        <circle cx="80" cy="90" r="14" fill="#EF4444" />
        <rect x="76" y="104" width="8" height="4" fill="#FEF08A" />
        <circle cx="320" cy="90" r="14" fill="#EF4444" />
        <rect x="316" y="104" width="8" height="4" fill="#FEF08A" />
        
        <!-- Multiple pairs of small footsteps leading through open door (Bustling crowd index) -->
        <g fill="#D97706" opacity="0.8">
          <!-- Footsteps pair 1 -->
          <ellipse cx="160" cy="230" rx="5" ry="10" transform="rotate(-15 160 230)" />
          <ellipse cx="172" cy="226" rx="5" ry="10" transform="rotate(-15 172 226)" />
          <circle cx="160" cy="217" r="2.5" />
          <circle cx="172" cy="213" r="2.5" />
          <!-- Footsteps pair 2 -->
          <ellipse cx="210" cy="210" rx="5" ry="10" transform="rotate(10 210 210)" />
          <ellipse cx="223" cy="216" rx="5" ry="10" transform="rotate(10 223 216)" />
          <circle cx="210" cy="197" r="2.5" />
          <circle cx="223" cy="203" r="2.5" />
          <!-- Footsteps pair 3 -->
          <ellipse cx="180" cy="180" rx="4" ry="8" />
          <ellipse cx="191" cy="183" rx="4" ry="8" />
          <circle cx="180" cy="170" r="2" />
          <circle cx="191" cy="173" r="2" />
        </g>
      </svg>`;

    default:
      // Robust colorful standard Fallback containing a unique dynamic cute card with Chinese characters
      return generateDynamicSVG(word, category);
  }
}

const PRE_CURATED_IDIOMS: Array<{
  word: string;
  pinyin: string;
  definition: string;
  category: 'elementary' | 'middle' | 'high';
  illustration: string;
  mnemonic: string;
  kidsExplanation: string;
  synonyms: string[];
  antonyms: string[];
  story: string;
  visualPrompt: string;
}> = USER_IDIOMS_POOL.map(item => {
  const handdrawnBase = BASE_PRE_CURATED_IDIOMS.find(x => x.word === item.word);
  const handdrawnAdd = ADDITIONAL_IDIOMS.find(x => x.word === item.word);
  
  let rawIllustration = "";
  if (handdrawnBase?.illustration) {
    rawIllustration = handdrawnBase.illustration;
  } else if (handdrawnAdd?.illustration) {
    rawIllustration = handdrawnAdd.illustration;
  } else {
    rawIllustration = generateDynamicArtworkFallback(item.word, item.category);
  }

  // Keep original raw illustration with text and labels for search cards & detail views
  const illustration = rawIllustration;

  return {
    ...item,
    illustration
  };
});

// Helper to check if a valid word can cascade for dynamic lookups
function findLocalIdiom(query: string) {
  const qStr = query.replace(/\s+/g, '');
  const curatedMatch = PRE_CURATED_IDIOMS.find(i => i.word === qStr);
  if (curatedMatch) return curatedMatch;
  
  const baseMatch = BASE_PRE_CURATED_IDIOMS.find(i => i.word === qStr);
  if (baseMatch) {
    return {
      ...baseMatch,
      visualPrompt: baseMatch.kidsExplanation
    };
  }
  return null;
}

// Automatically enrich synonyms and antonyms with accurate pinyins for primary school kids
const KNOWN_WORD_PINYINS: Record<string, string> = {
  "截然不同": "jié rán bù tóng",
  "大相径庭": "dà xiāng jìng tíng",
  "触类旁通": "chù lèi páng tōng",
  "融会贯通": "róng huì guàn tōng",
  "无独有偶": "wú dú yǒu ǒu",
  "举一反三": "jǔ yī fǎn sān",
  "持之以恒": "chí zhī yǐ héng",
  "磨杵成针": "mó chǔ chéng zhēn",
  "坚韧不拔": "jiān rèn bù bá",
  "异曲同工": "yì qǔ tóng gōng",
  "殊途同归": "shū tú tóng guī",
  "井底之蛙": "jǐng dǐ zhī wā",
  "坐井观天": "zuò jǐng guān tiān",
  "自相矛盾": "zì xiāng máo dùn",
  "画蛇添足": "huà shé tiān zú",
  "亡羊补牢": "wáng yáng bǔ láo",
  "拔苗助长": "bá miáo zhù zhǎng",
  "掩耳盗铃": "yǎn ěr dào líng",
  "刻舟求剑": "kè zhōu qiú jiàn",
  "画龙点睛": "huà lóng diǎn jīng",
  "狐假虎威": "hú jiǎ hǔ wēi",
  "叶公好龙": "yè gōng hào lóng",
  "愚公移山": "yú gōng yí shān",
  "精卫填海": "jīng wèi tián hǎi",
  "闻鸡起舞": "wén jī qǐ wǔ",
  "卧薪尝胆": "wò xīn cháng dǎn",
  "完璧归赵": "wán bì guī zhào",
  "守株待兔": "shǒu zhū dài tù",
  "半途而废": "bàn tú ér fèi",
  "一丝不苟": "yī sī bù gǒu",
  "自强不息": "zì qiáng bù xī",
  "一见如故": "yī jiàn rú gù",
  "名落孙山": "míng luò sūn shān",
  "画饼充饥": "huà bǐng chōng jī",
  "名副其实": "míng fù qí shí",
  "胸有成竹": "xiōng yǒu chéng zhú",
  "得意忘形": "dé ý wàng xíng",
  "如影随形": "rú yǐng suí xíng"
};

const KNOWN_CHARACTER_PINYINS: Record<string, string> = {
  "截": "jié", "然": "rán", "不": "bù", "同": "tóng",
  "大": "dà", "相": "xiāng", "径": "jìng", "庭": "tíng",
  "触": "chù", "类": "lèi", "旁": "páng", "通": "tōng",
  "融": "róng", "会": "huì", "贯": "guàn", "无": "wú",
  "独": "dú", "有": "yǒu", "偶": "ǒu", "举": "jǔ",
  "一": "yī", "反": "fǎn", "三": "sān", "持": "chí",
  "之": "zhī", "以": "yǐ", "恒": "héng", "磨": "mó",
  "杵": "chǔ", "成": "chéng", "针": "zhēn", "坚": "jiān",
  "韧": "rèn", "拔": "bá", "异": "yì", "曲": "qǔ",
  "工": "gōng", "殊": "shū", "途": "tú", "归": "guī",
  "井": "jǐng", "底": "dǐ", "蛙": "wā", "坐": "zuò",
  "观": "guān", "天": "tiān", "自": "zì", "矛": "máo",
  "盾": "dùn", "画": "huà", "蛇": "shé", "添": "tiān",
  "足": "zú", "亡": "wáng", "羊": "yáng", "补": "bǔ",
  "牢": "láo", "苗": "miáo", "助": "zhù", "长": "zhǎng",
  "掩": "yǎn", "耳": "ěr", "盗": "dào", "铃": "líng",
  "刻": "kè", "舟": "zhōu", "求": "qiú", "剑": "jiàn",
  "龙": "lóng", "点": "diǎn", "睛": "jīng", "狐": "hú",
  "假": "jiǎ", "虎": "hǔ", "威": "wēi", "叶": "yè",
  "公": "gōng", "好": "hào", "愚": "yú", "移": "yí",
  "山": "shān", "精": "jīng", "卫": "wèi", "填": "tián",
  "海": "hǎi", "闻": "wén", "鸡": "jī", "起": "qǐ",
  "舞": "wǔ", "卧": "wò", "薪": "xīn", "尝": "cháng",
  "胆": "dǎn", "完": "wán", "璧": "bì", "赵": "zhào",
  "守": "shǒu", "株": "zhū", "待": "dài", "兔": "tù"
};

function enrichRelationshipsWithPinyin(list: string[]): Array<{ word: string, pinyin: string }> {
  if (!list || !Array.isArray(list)) return [];
  return list.map(word => {
    const cleanWord = word.replace(/\s+/g, '');
    
    // 0. Check direct match in known perfect pinyins
    if (KNOWN_WORD_PINYINS[cleanWord]) {
      return { word: cleanWord, pinyin: KNOWN_WORD_PINYINS[cleanWord] };
    }

    // 1. Check direct match in official base or curated idioms
    const match = PRE_CURATED_IDIOMS.find(i => i.word === cleanWord) || BASE_PRE_CURATED_IDIOMS.find(i => i.word === cleanWord);
    if (match) {
      return { word: cleanWord, pinyin: match.pinyin };
    }
    
    // 2. Check match in local backup puzzle dictionaries
    let dictMatch: any = null;
    if (typeof LOCAL_WORD_DICT !== 'undefined') {
      for (const key of Object.keys(LOCAL_WORD_DICT)) {
        const found = LOCAL_WORD_DICT[key].find(item => item.word === cleanWord);
        if (found) {
          dictMatch = found;
          break;
        }
      }
    }
    if (dictMatch) {
      return { word: cleanWord, pinyin: dictMatch.pinyin };
    }

    // 3. Fallback character-by-character sound extractor from the base database to maintain exquisite accuracy for children
    const pinyinParts: string[] = [];
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      let charPinyin = "";
      
      // Try known character mapping first
      if (KNOWN_CHARACTER_PINYINS[char]) {
        charPinyin = KNOWN_CHARACTER_PINYINS[char];
      }
      
      if (!charPinyin) {
        const referenceIdiom = PRE_CURATED_IDIOMS.find(item => item.word.includes(char)) || BASE_PRE_CURATED_IDIOMS.find(item => item.word.includes(char));
        if (referenceIdiom) {
          const idx = referenceIdiom.word.indexOf(char);
          const pinyinArr = referenceIdiom.pinyin.split(/\s+/);
          if (pinyinArr[idx]) {
            charPinyin = pinyinArr[idx];
          }
        }
      }
      
      if (!charPinyin && typeof LOCAL_WORD_DICT !== 'undefined') {
        for (const key of Object.keys(LOCAL_WORD_DICT)) {
          const dictItem = LOCAL_WORD_DICT[key].find(item => item.word.includes(char));
          if (dictItem) {
            const idx = dictItem.word.indexOf(char);
            const pinyinArr = dictItem.pinyin.split(/\s+/);
            if (pinyinArr[idx]) {
              charPinyin = pinyinArr[idx];
              break;
            }
          }
        }
      }
      pinyinParts.push(charPinyin || "yī");
    }
    return { word: cleanWord, pinyin: pinyinParts.join(" ") };
  });
}

// REST end-point to load curated idioms (supports random sampling from database)
app.get('/api/idioms/curated', (req, res) => {
  const size = parseInt(req.query.size as string) || 8;
  const shuffled = [...PRE_CURATED_IDIOMS].sort(() => Math.random() - 0.5);
  res.json(shuffled.slice(0, size).map(({ word, pinyin, definition, category, mnemonic, kidsExplanation, synonyms, antonyms }) => ({
    word, pinyin, definition, category, mnemonic, kidsExplanation, synonyms, antonyms
  })));
});

// GET specific dynamic idiom (including AI interactive SVGs and definitions)
app.get('/api/idiom/detail', async (req, res) => {
  const word = req.query.word as string;
  if (!word) {
    return res.status(400).json({ error: '成语词汇不能为空！' });
  }

  const local = findLocalIdiom(word);
  if (local) {
    return res.json({
      ...local,
      synonyms: enrichRelationshipsWithPinyin(local.synonyms),
      antonyms: enrichRelationshipsWithPinyin(local.antonyms)
    });
  }

  if (ai) {
    try {
      const prompt = `您是一位专门为中小学生创作中国传统成语教学内容的超级插画师和儿童作家。请为成语《${word}》输出极其专业、寓教于乐的高清卡片详细内容。

请严格仅返回 JSON 格式纯文本，不要在外部包裹任何其他说明、多余空格或 markdown 代码块包裹（即不要带 \`\`\`json 和 \`\`\` 标记，直接返回 JSON 纯文本字符串）。
JSON 格式需精
// Local presets of words and candidate definitions for non-AI fallback mode or robust filler safety.�相关的常见反义或相对概念成语"],
  "story": "该成语的经典历史典故或背景传说简短有趣叙事版本，控制在150字以内，浅显易懂。"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = tryParseJSON(response.text || '');
      if (parsed && parsed.word) {
        return res.json({
          ...parsed,
          synonyms: enrichRelationshipsWithPinyin(parsed.synonyms || []),
          antonyms: enrichRelationshipsWithPinyin(parsed.antonyms || [])
        });
      }
    } catch (err) {
      console.error("Gemini idiom detail error:", err);
    }
  }

  // Final fallback if local doesn't exist AND AI is unavailable or fails
  const categoryStr: 'elementary' | 'middle' | 'high' = 'elementary';
  const fallbackSVG = generateDynamicSVG(word, categoryStr);
  return res.json({
    word,
    pinyin: "yī fān fēng shùn",
    definition: `关于成语《${word}》的趣味释义`,
    category: categoryStr,
    illustration: fallbackSVG,
    mnemonic: `大声读着《${word}》，脑海画面有起伏。`,
    kidsExplanation: `这就像是一个特别有趣的奥秘，等你去探索！`,
    synonyms: [],
    antonyms: [],
    story: `关于成语《${word}》的故事，目前正在精心编纂中。`
  });
});

app.get('/api/game/pk/question', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';
  const excludeStr = (req.query.exclude as string) || '';
  const excludeList = excludeStr.split(',').map(x => x.trim()).filter(x => x.length > 0);

  // Divide our 1000 idioms pool among the 4 grades
  let gradePool: string[] = [];
  if (grade === 'elementary') {
    gradePool = IDIOMS_1000_POOL.slice(0, 250);
  } else if (grade === 'middle') {
    gradePool = IDIOMS_1000_POOL.slice(250, 500);
  } else if (grade === 'high') {
    gradePool = IDIOMS_1000_POOL.slice(500, 750);
  } else {
    gradePool = IDIOMS_1000_POOL.slice(750, 1000);
  }

  // Filter out recently seen/excluded ones
  let availableWords = gradePool.filter(w => !excludeList.includes(w));
  if (availableWords.length === 0) {
    availableWords = gradePool;
  }

  const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)] || "画蛇添足";

  if (ai) {
    try {
      const prompt = `你是一个非常专业优秀的成语趣味问答大PK出题官。我们正在开发一款针对中小学生的成语教学软件，其中有一个深受欢迎的板块叫「最强之最·大PK」。在这个板块中，我们要用趣味设问来做谜面，让孩子猜出对应成语。
现在，请专为成语《${targetWord}》量身定制设计一道全新的、充满趣味性并完全符合学段「${grade}」学生的“成语谜面关卡”！

请严格返回 JSON（不要带 Markdown 代码块，不要带 \`\`\`json 标记）：
{
  "question": "“最优秀的/最棒的/最...的 XXX”或高度生动的动作行为描述的趣味谜面（控制在20字以内，绝对不要在谜面中泄露谜底成语《${targetWord}》的任何字眼）",
  "answer": "${targetWord}",
  "pinyin": "成语拼音带声调",
  "definition": "成语的准确白话基本释义",
  "kidsExplanation": "一两句话，非常适合儿童和学生的白话幽默类比与解释（极其有温度、通俗易懂）",
  "fact": "一句话成语经典源流典故、造句技巧或在写文章时的小贴士",
  "mnemonic": "四句朗朗上口的儿歌或打油诗速记口诀，帮助孩子快速联想并记住该成语，控制在30字内（如：‘昨晚丢了一只羊，今天赶紧修栅栏...’）",
  "story": "该成语的经典历史典故或传说故事白话小故事版本，极其有趣生动、情节精彩，150字以内，浅显易懂，适合小学生阅读",
  "options": [
    "${targetWord}",
    "干扰成语A (必须是具有一定干扰性的相同或相似字数成语)",
    "干扰成语B (必须是具有一定干扰性的相同或相似字数成语)",
    "干扰成语C (必须是具有一定干扰性的相同或相似字数成语)"
  ]
}
（请打乱 options 的顺序，使得正确答案不总是第一个，并且保证 options 是包含正确谜底在内的正好 4 项）`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = tryParseJSON(response.text || '');
      if (parsed) {
        parsed.answer = targetWord; // strictly guarantee the correct target word
        if (!parsed.options) {
          parsed.options = [targetWord, "画蛇添足", "盲人摸象", "守株待兔"];
        }
        // Make sure options has the correct answer
        if (!parsed.options.includes(targetWord)) {
          parsed.options[Math.floor(Math.random() * 4)] = targetWord;
        }
        // Shuffle options
        parsed.options = parsed.options.sort(() => Math.random() - 0.5);
        return res.json(parsed);
      }
    } catch (err) {
      console.error("Gemini PK spec-word generator error:", err);
    }
  }

  // Fallback to local pool if AI is down or fails
  const randomQ = PK_QUESTIONS_POOL[Math.floor(Math.random() * PK_QUESTIONS_POOL.length)];
  // shuffle options
  const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
  res.json({
    question: randomQ.question,
    answer: randomQ.answer,
    pinyin: randomQ.pinyin,
    definition: "比喻情况或实质对应的描述。",
    kidsExplanation: randomQ.kidsExplanation,
    fact: randomQ.fact,
    mnemonic: "儿歌速记，快乐巧学：成语字词记在心，朗朗上口好温习！",
    story: `关于“${randomQ.answer}”，古人曾留下精彩绝伦的历史传说与文学印记，鼓励小朋友努力拼搏、知错就改、积极向上，这就是它的魅力所在。`,
    options: shuffledOptions
  });
});

const riddleImageCache = new Map<string, string>();

// Game Mode:看图猜成语 - Riddle Engine
app.get('/api/game/riddle', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';
  const excludeStr = (req.query.exclude as string) || '';
  const excludeList = excludeStr.split(',').map(x => x.trim()).filter(x => x.length > 0);
  
  // 1. Filter our official pool of idioms by category and exclude already solved list
  let pool = PRE_CURATED_IDIOMS.filter(i => i.category === grade && !excludeList.includes(i.word));
  if (pool.length === 0) {
    // If all are excluded, reset and pick from grade-level pool to prevent locking
    pool = PRE_CURATED_IDIOMS.filter(i => i.category === grade);
  }
  if (pool.length === 0) {
    pool = PRE_CURATED_IDIOMS;
  }
  const picked = pool[Math.floor(Math.random() * pool.length)] || PRE_CURATED_IDIOMS[0];

  const fillers = "水火风土地山云雷电日月星晨乾坤宇宙古今内外生死存亡左右上下真假美丑狐虎羊狼蛇足龙风吹雨打完璧归赵百折不挠自强不息";
  const wordChars = picked.word.split('');
  const gridSet = new Set(wordChars);
  while(gridSet.size < 12) {
    const rChar = fillers[Math.floor(Math.random() * fillers.length)];
    gridSet.add(rChar);
  }
  const candidates = Array.from(gridSet).sort(() => Math.random() - 0.5);

  // Check if our picked idiom has a robust handdrawn/bespoke illustration.
  const isHanddrawn = 
    BASE_PRE_CURATED_IDIOMS.some(x => x.word === picked.word) || 
    ADDITIONAL_IDIOMS.some(x => x.word === picked.word) ||
    [
      "井底之蛙", "坐井观天", "对牛弹琴", "精卫填海", "南辕北辙", "盲人摸象", "杯弓蛇影", "惊弓之鸟", "滥竽充数",
      "鸡犬不宁", "马到成功", "狼吞虎咽", "鸟语花香", "鱼目混珠", "鹬蚌相争", "螳螂捕蝉", "黔驴技穷",
      "开门见山", "水滴石穿", "火上浇油", "雪中送炭", "画饼充饥", "指鹿为马", "一箭双雕", "胸有成竹",
      "破釜沉舟", "大惊小怪", "九牛一毛", "杯水车薪", "金鸡独立", "眉飞色舞", "门庭若市"
    ].includes(picked.word);

  let finalIllustration = "";

  if (isHanddrawn) {
    finalIllustration = picked.illustration;
  } else if (ai) {
    // If it's not precompiled, generate on-demand using Gemini API to establish high precision corresponding illustrations!
    if (riddleImageCache.has(picked.word)) {
      finalIllustration = riddleImageCache.get(picked.word) || "";
    } else {
      try {
        const aiPrompt = `你是一个非常专业且具有丰富童趣想象力的儿童插画师和精美的SVG矢量设计师。
现在，你正在为一个成语探宝小程序里的“看图猜成语”关卡设计精美、高度具象的图片插画。
目标成语："${picked.word}"
成语释义：${picked.definition}
适合小学生的场景比喻：${picked.kidsExplanation}
画面直观展现场景描述（必须非常具体地突出成语的核心动作和物体之间的关系，使其具象而生动，切合小学生的直观联想认知）：
"${picked.visualPrompt || picked.kidsExplanation}"

请根据上述要求设计并输出一段完整的、高品质可缩放矢量图形（SVG）代码字符串。

⚠️ 极为关键的硬性约束（不遵守将导致事故）：
1. 绝对、绝对不能在SVG图形的任何地方包含该成语的字、词、首字母、拼音、数字、英文标签或任何可以识别该成语的文字/拼音提示（包括不能放在像 <text> 标签或作为各种图案背景）。若有文字提示，游戏就穿帮了！一丁点提示性的文字都不能有！
2. 必须画得“具体、具象”，不要使用抽象几何色块或者只有一个问号！必须按照画面直白、具象展现场景要求，把核心的人、动物、工具、动作、物体极其夸张可爱地画出来，具有高度的趣味性、童话色彩和动漫卡通感。
3. 请合理和优美地使用SVG元素：可以使用多重 <path>（来绘制可爱的拟人动物、表情丰富的角色表情等）、<circle>、<ellipse>、<rect>、<polygon>，甚至定义渐变色 <linearGradient>。
4. 必须输出完整无缺 of SVG 代码。画幅设置：宽度400，高度300。外带宽度100%、高度100%、viewBox="0 0 400 300"的格式，包含一个外层 rx="24" 或 rx="20" 的圆角淡彩色温润淡雅矩形背景。
5. 必须严格返回具有如下格式的JSON纯文本（不要带 \`\`\`json 和 \`\`\` 标记，直接返回 JSON 纯文本）：
{
  "illustration": "<svg viewBox=\\"0 0 400 300\\" width=\\"100%\\" height=\\"100%\\" xmlns=\\"http://www.w3.org/2000/svg\\">...此处是完整的SVG代码...</svg>"
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: aiPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textOutput = aiResponse.text || '';
        const parsedResult = tryParseJSON(textOutput);
        if (parsedResult && parsedResult.illustration) {
          finalIllustration = parsedResult.illustration;
          riddleImageCache.set(picked.word, finalIllustration);
        }
      } catch (err) {
        console.error("Failed to generate dynamic riddle illustration via Gemini:", err);
      }
    }
  }

  // Fallback to static pre-curated illustration
  if (!finalIllustration) {
    finalIllustration = picked.illustration;
  }

  return res.json({
    id: Date.now(),
    riddle: picked.definition,
    illustration: stripSVGText(finalIllustration),
    pinyin: picked.pinyin,
    mnemonic: picked.mnemonic,
    kidsExplanation: picked.kidsExplanation,
    word: picked.word,
    candidates
  });
});

// Dynamic Match Connection Pair Generator / Elimination Game Setup
app.get('/api/game/match-pair', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';

  // Filter local pre-curated idioms pool by category level if available
  let pool = PRE_CURATED_IDIOMS.filter(i => i.category === grade);
  if (pool.length < 4) {
    pool = PRE_CURATED_IDIOMS;
  }

  // Shuffle and pick 4 idioms
  const pickedSet = [...pool].sort(() => Math.random() - 0.5).slice(0, 4);

  const idioms = pickedSet.map((item, idx) => {
    // Generate exactly 2 random distinct indices of the four characters to be blanked out
    // e.g., if word is "一心一意", blankIndices might be [1, 3] representing "一【】一【】"
    // To make it fun, we shuffle indices 0-3 and pick first 2, then sort them ascending
    const sourceIndices = [0, 1, 2, 3];
    const shuffled = sourceIndices.sort(() => Math.random() - 0.5);
    const blankIndices = [shuffled[0], shuffled[1]].sort((a, b) => a - b);

    return {
      id: `elim-idiom-${idx}`,
      word: item.word,
      pinyin: item.pinyin,
      definition: item.definition,
      kidsExplanation: item.kidsExplanation || item.definition,
      blankIndices: blankIndices
    };
  });

  return res.json({ idioms });
});

// ==================== GAME MODE: 成语之最最强大PK ====================
const PK_QUESTIONS_POOL = [
  {
    question: "最大的谎言",
    answer: "弥天大谎",
    pinyin: "mí tiān dà huǎng",
    kidsExplanation: "「弥天」是指覆盖了整个天空。连天空都给遮蔽遮盖了，这句谎话大得简直太离奇了！",
    fact: "形容范围极大、极其荒谬的欺骗行为。欺人太甚，欺天之说。",
    options: ["自欺欺人", "弥天大谎", "口若悬河", "掩耳盗铃"]
  },
  {
    question: "最大的手掌",
    answer: "只手遮天",
    pinyin: "zhī shǒu zhē tiān",
    kidsExplanation: "仅想用一只手就把辽阔的整个天空盖住。用来形容手里的权势特别大，一手遮掩天下人的耳目。",
    fact: "比喻依仗威势玩弄各种手段，欺骗蒙蔽公众。",
    options: ["得心应手", "大手大脚", "只手遮天", "推心置腹"]
  },
  {
    question: "最大的嘴巴",
    answer: "气吞山河",
    pinyin: "qì tūn shān hé",
    kidsExplanation: "嘴巴、气概大得一口就能吞下壮丽高山和大江大河！形容气魄雄伟异常，非常有大英雄气概。",
    fact: "多用于形容英雄好汉、志向或气势极其宏伟壮观。",
    options: ["口若悬河", "张口结舌", "气吞山河", "血口喷人"]
  },
  {
    question: "最快的时间",
    answer: "转瞬即逝",
    pinyin: "zhuǎn shùn jí shì",
    kidsExplanation: "眨一下眼睛的功夫就消失不见了。用来告诉我们时间过得飞快，必须像金子一样珍惜学习时间！",
    fact: "形容极短的时间内人或事物就消失了，多见于文学抒情描写。",
    options: ["一日三秋", "千秋万代", "度日如年", "转瞬即逝"]
  },
  {
    question: "最贵重的话",
    answer: "一诺千金",
    pinyin: "yī nuò qiān jīn",
    kidsExplanation: "答应别人的一个承诺，比一千块沉甸甸的黄金还要珍贵！教导咱们一诺既出、驷马难追，讲信用最光荣！",
    fact: "典故来自西汉季布，季布只要答应了别人，就一定会拼尽全力办到。",
    options: ["天花乱坠", "一诺千金", "千言万语", "信口开河"]
  },
  {
    question: "最高的个子",
    answer: "顶天立地",
    pinyin: "dǐng tiān lì dì",
    kidsExplanation: "头顶着高耸的蓝天，脚稳稳地踩着大地。形容小英雄像山峰一样高大伟岸，敢做敢当，能挑大梁！",
    fact: "比喻形象高大，气度宏伟，敢于做能顶半边天的真梁柱！",
    options: ["拔苗助长", "一步登天", "顶天立地", "高枕无忧"]
  },
  {
    question: "最吝啬的人",
    answer: "一毛不拔",
    pinyin: "yī máo bù bá",
    kidsExplanation: "小气鬼身上的一根细汗毛都舍不得拔下来送人。比喻一个人极其自私，不乐意和大家分享半分糖果。",
    fact: "出自战国孟子对杨子学说的一针见血批评，指不顾大局极度吝啬自私。",
    options: ["斤斤计较", "一毛不拔", "大手大脚", "两手空空"]
  },
  {
    question: "最好看、好读的作文写作",
    answer: "妙笔生花",
    pinyin: "miào bǐ shēng huā",
    kidsExplanation: "小朋友的手中笔仿佛能开出五颜六色的美丽鲜花！形容小作家的文章写得太生动有趣啦！",
    fact: "传说诗仙李白年轻时，曾梦见自己常用的毛笔尖头上开出绚丽花朵，后果然文笔绝尘。",
    options: ["才华横溢", "妙笔生花", "一气呵成", "行云流水"]
  },
  {
    question: "最绝望的处境",
    answer: "山穷水尽",
    pinyin: "shān qióng shuǐ jìn",
    kidsExplanation: "爬山爬到了没有山路，溪流也到干枯没水的地方。说明眼前没主意了，陷入极大的难关中。这时候得像聪聪兔一样坚强哦！",
    fact: "也用来比喻无路可走、精疲力竭或彻底无能为力的处境。",
    options: ["绝处逢生", "山穷水尽", "柳暗花明", "走投无路"]
  },
  {
    question: "最锋利的眼光",
    answer: "一针见血",
    pinyin: "yī zhēn jiàn xiě",
    kidsExplanation: "一针扎下去就能见到鲜血。比喻小老师看问题特别透，一句话完美指出了题目的核心和最关键之处！",
    fact: "比喻分析或说话一语中的，能够指出事物最关键实质。",
    options: ["一针见血", "明察秋毫", "火眼金睛", "一目十行"]
  },
  {
    question: "最惊险的差事",
    answer: "与虎谋皮",
    pinyin: "yǔ hǔ móu pí",
    kidsExplanation: "竟然跟凶巴巴的大老虎去商量要借它的毛皮大衣！太愚笨了，这说明跟利益根本对立的对手商议是不可能成功的哦！",
    fact: "比喻跟恶人或利益完全对立的人商量，让他做出让步，这绝无可能成功。",
    options: ["虎口拔牙", "大智大勇", "谈虎色变", "与虎谋皮"]
  },
  {
    question: "最危险的处境",
    answer: "盲人瞎马",
    pinyin: "máng rén xiā mǎ",
    kidsExplanation: "眼睛看不见的小玩伴骑在受惊瞎了双眼的心慌烈马上赶夜路！形容盲目任性，不讲章法，随时有摔交、掉下深渊的特大危险！",
    fact: "比喻盲目冒昧行事，处于极其危险而不自知的状态。",
    options: ["盲人瞎马", "危机四伏", "铤而走险", "雪上加霜"]
  }
];

app.get('/api/game/pk/question', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';
  
  if (ai) {
    try {
      const prompt = `你是一个非常专业优秀的成语趣味问答大PK出题官。我们正在开发一款针对中小学生的成语教学软件，其中有一个深受欢迎的板块叫「最强之最·大PK」。在这个板块中，我们要用“最XXX的XXX”这样的趣问来做谜面，让孩子猜出对应成语（例如：“最大的谎言”谜底是“弥天大谎”，“最大的手掌”谜底是“只手遮天”，“最吝啬的人”是“一毛不拔”）。
现在，请你发挥脑洞，动态设计一道全新的、充满趣味性并完全符合 ${grade} 学生的“成语之最”限时大PK关卡！

请严格返回 JSON（不要带 Markdown 代码块，不要带 \`\`\`json 标记）：
{
  "question": "“最优秀的/最棒的/最...的 XXX”的趣味谜面（控制在15字以内）",
  "answer": "对应的四字正规成语",
  "pinyin": "成语拼音带声调",
  "kidsExplanation": "一两句话，非常适合儿童和学生的白话幽默类比与解释（极其有温度、通俗易懂）",
  "fact": "一句话成语经典源流典故或在写文章时的小贴士",
  "options": [
    "成语谜底（必须包含）",
    "干扰成语A (四字成语)",
    "干扰成语B (四字成语)",
    "干扰成语C (四字成语)"
  ]
}
（请打乱 options 的顺序，使得正确答案不总是第一个，并且保证 options 是 4 项）`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = tryParseJSON(response.text || '');
      // Make sure options has the correct answer
      if (parsed.options && !parsed.options.includes(parsed.answer)) {
        parsed.options[Math.floor(Math.random() * 4)] = parsed.answer;
      }
      return res.json(parsed);
    } catch (err) {
      console.error("Gemini PK generator error, fallback:", err);
    }
  }

  // Fallback to pool
  const randomQ = PK_QUESTIONS_POOL[Math.floor(Math.random() * PK_QUESTIONS_POOL.length)];
  // shuffle options
  const shuffledOptions = [...randomQ.options].sort(() => Math.random() - 0.5);
  res.json({
    question: randomQ.question,
    answer: randomQ.answer,
    pinyin: randomQ.pinyin,
    kidsExplanation: randomQ.kidsExplanation,
    fact: randomQ.fact,
    options: shuffledOptions
  });
});

// Local presets of words and candidate definitions for non-AI fallback mode or robust filler safety.
const LOCAL_WORD_DICT: Record<string, Array<{word: string, pinyin: string, definition: string, hint: string}>> = {
  "息": [
    { word: "息息相关", pinyin: "xī xī xiāng guān", definition: "形容关系非常密切。", hint: "【息】手拉手，彼此关系特别亲密。" },
    { word: "息事宁人", pinyin: "xī shì níng rén", definition: "调解纠纷，使事情平息下来。", hint: "【息】热心帮两个吵架的小羊和好。" },
    { word: "喜气洋洋", pinyin: "xǐ qì yáng yáng", definition: "充满了热闹、欢喜的气氛。", hint: "【喜】过新年放鞭炮放糖果哈哈大笑。" },
    { word: "惜墨如金", pinyin: "xī mò rú jīn", definition: "指画画写字态度非常严谨认真。", hint: "【惜】画图超级仔细，宝贝自己的每一笔。" }
  ],
  "威": [
    { word: "威风凛凛", pinyin: "wēi fēng lǐn lǐn", definition: "形容声势或气派强大，十分神气。", hint: "【威】像小母狮戴上亮晶晶的皇冠。" },
    { word: "威力无穷", pinyin: "wēi lì wú qióng", definition: "力量非常巨大，没有穷尽。", hint: "【威】像超级小战士充满了无穷的能量。" },
    { word: "喜笑颜开", pinyin: "xǐ xiào yán kāi", definition: "形容心中非常欣喜，满脸笑容。", hint: "【喜】听到好消息，小嘴笑得像朵小花。" },
    { word: "威武不屈", pinyin: "wēi wǔ bù qū", definition: "面对威逼压迫，坚决不肯屈服。", hint: "【威】非常勇敢，面对坏人决不低头。" }
  ],
  "牢": [
    { word: "劳苦功高", pinyin: "láo kǔ gōng gāo", definition: "工作极为辛苦，立下的功劳非常大。", hint: "【劳】像勤劳的牛伯伯辛苦耕作大丰收。" },
    { word: "劳逸结合", pinyin: "láo yì jié hé", definition: "工作学习与休息放松安排合理。", hint: "【劳】写完30分钟字就快快乐乐玩滑梯。" },
    { word: "老当益壮", pinyin: "lǎo dāng yì zhuàng", definition: "年纪虽大但志气和身体依然很好。", hint: "【老】老爷爷跑步爬山比小朋友还要快。" },
    { word: "牢不可破", pinyin: "láo bù kě pò", definition: "非常坚固，绝对无法被摧毁。", hint: "【牢】积木城堡造得紧紧的，怎么扔都不翻。" }
  ],
  "足": [
    { word: "足智多谋", pinyin: "zú zhì duō móu", definition: "聪明，计谋多。形容十分善于策划。", hint: "【足】脑筋转得飞快，能想出一万条妙计。" },
    { word: "足不出户", pinyin: "zú bù chū hù", definition: "脚不跨出大门。形容很少外出活动。", hint: "【足】周末最爱在温暖小屋里读绘本故事。" },
    { word: "自给自足", pinyin: "zì jǐ zì zú", definition: "凭借自己的努力来满足生活的需要。", hint: "【自】自家种的红草莓，美味大口吃。" },
    { word: "大义凛然", pinyin: "dà yì lǐn rán", definition: "形容为了正义事业和公理非常严正威武。", hint: "【大】大白熊挺起胸膛保护自己的小伙伴。" }
  ],
  "龙": [
    { word: "龙腾虎跃", pinyin: "lóng téng hǔ yuè", definition: "形容场面非常热闹，充满生机活力。", hint: "【龙】体育课上大家精神饱满，欢快奔跑。" },
    { word: "龙飞凤舞", pinyin: "lóng fēi fèng wǔ", definition: "原指神态气势飞扬，现多形容书法活泼。", hint: "【龙】拿毛笔写的大字像彩云飞龙一样帅气。" },
    { word: "龙马精神", pinyin: "lóng mǎ jīng shén", definition: "比喻人的精神非常饱满，干劲充足。", hint: "【龙】早晨起床高高兴兴，像个小神马。" },
    { word: "融会贯通", pinyin: "róng huì guàn tōng", definition: "把各方面的知识有机融合，彻底理解。", hint: "【融】把拼音、读音和童话故事完全连起来。" }
  ],
  "针": [
    { word: "真心诚意", pinyin: "zhēn xīn shí yì", definition: "用真切、毫无虚伪的心意对待别人。", hint: "【真】拿出最好的胡萝卜，开门笑脸迎朋友。" },
    { word: "振奋人心", pinyin: "zhèn fèn rén xīn", definition: "使大家情绪高涨，精神十分振作。", hint: "【振】听到今天要举办游园会，全班欢呼起来。" },
    { word: "针锋相对", pinyin: "zhēn fēng xiāng duì", definition: "比喻双方词义或行动上互相对立不让。", hint: "【针】小刺猬跟小猫各抒脑洞，谁也不服。" },
    { word: "震耳欲聋", pinyin: "zhèn ěr yù lóng", definition: "形容声音极其响亮，耳朵都要隆隆响。", hint: "【震】天空打了一个超级大的雷，轰隆一声。" }
  ],
  "抗": [
    { word: "慷慨大方", pinyin: "kāng kǎi dà fāng", definition: "非常愿意分享，一点也不自私吝啬。", hint: "【慷】把超爽口的彩虹棒棒糖分给朋友吃。" },
    { word: "开源节流", pinyin: "kāi yuán jié liú", definition: "努力获取收益，并节约各种消耗支出。", hint: "【开】多多攒小硬币，绝不随地买废纸乱花钱。" },
    { word: "侃侃而谈", pinyin: "kǎn kǎn ér tán", definition: "说话时理直气壮，不慌不忙悠然自得。", hint: "【侃】站在舞台中央，勇敢地为大家讲故事。" },
    { word: "空前绝后", pinyin: "kōng qián jué hòu", definition: "世界上独一无二，以前没有以后也不再有。", hint: "【空】超可爱的魔法成语大作战，天下无敌！" }
  ],
  "挠": [
    { word: "脑洞大开", pinyin: "nǎo dòng dà kāi", definition: "想象力无限奇思妙想，创意极为震撼。", hint: "【脑】小脑袋里长出了十万个童话小天线。" },
    { word: "闹意十足", pinyin: "nào yì shí zú", definition: "充满嬉闹快乐的欢畅、生动情绪。", hint: "【闹】兔子们手拉手在森林地上打滚唱歌。" },
    { word: "不知不觉", pinyin: "bù zhī bù jué", definition: "时间走得太快，完全没有发觉时间流逝。", hint: "【不】玩接龙赛太着迷，外面的太阳悄悄下山落。" },
    { word: "傲气十足", pinyin: "ào qì shí zú", definition: "形容极为骄傲、神气活现的样子。", hint: "【傲】小螃蟹横着走路，觉得大狮子都不如它。" }
  ]
};

function getFallbackChoices(char: string): Array<{word: string, pinyin: string, definition: string, hint: string}> {
  if (LOCAL_WORD_DICT[char]) {
    return LOCAL_WORD_DICT[char];
  }
  // If not found, look up curated synonyms/antonyms
  const fromCurated = PRE_CURATED_IDIOMS.filter(i => i.word.startsWith(char));
  if (fromCurated.length > 0) {
    return fromCurated.slice(0, 4).map(e => ({
      word: e.word,
      pinyin: e.pinyin,
      definition: e.definition,
      hint: `【${char}】` + e.mnemonic.substring(0, 20)
    }));
  }
  // general template builder
  return [
    { word: char + "气洋洋", pinyin: "xǐ qì yáng yáng", definition: "充满了热闹、心情愉快的气氛。", hint: `【${char}】过年放鞭炮一样，大家欢天喜喜乐开怀。` },
    { word: char + "开得胜", pinyin: "qí kāi dé shèng", definition: "刚一出手、出兵，就立刻获得了胜利。", hint: `【${char}】刚一上台，兔子就得到了第一大鸡腿勋章。` },
    { word: char + "智多谋", pinyin: "zú zhì duō móu", definition: "脑筋转得极快，主意计谋特别多。", hint: `【${char}】脑子飞快转着，一眨眼想出了八个奇思。` },
    { word: char + "星高照", pinyin: "fú xīng gāo zhào", definition: "形容天天都有非凡的快乐好运气。", hint: `【${char}】天上的幸运吉星眨眨眼，今天保佑你发大芽。` }
  ];
}

// AI Solitaire START endpoint - sets initial state with choices!
app.get('/api/game/solitaire/start', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';
  
  // Pick a random starting idiom from pre-curated ones
  const startList = PRE_CURATED_IDIOMS;
  const item = startList[Math.floor(Math.random() * startList.length)] || startList[0];
  const endChar = item.word.charAt(item.word.length - 1);

  if (!ai) {
    const fallbackOptions = getFallbackChoices(endChar);
    return res.json({
      botWord: item.word,
      pinyin: item.pinyin,
      definition: item.definition,
      kidsExplanation: item.kidsExplanation,
      mnemonic: item.mnemonic,
      illustration: item.illustration,
      story: item.story,
      choices: fallbackOptions
    });
  }

  try {
    const prompt = `你是一个非常有趣的童趣成语接龙出题官，专为中小学生服务。
现在游戏刚开始，兔子机器人出的第一个首发成语是： "${item.word}"。它的最后一个字是： "${endChar}"。
你需要为小朋友生成 4 个非常优秀的、适合小朋友的成语接龙候选项，供小朋友下一轮点击进行选择。
要求：这 4 个成语选项的“首汉字”必须全部是 "${endChar}"，或者“首汉字的首音（拼音）”与 "${endChar}" 相同（属于同音字接龙），例如 息(xi) 可以接 喜(xi), 牢(lao) 可以接 劳(lao)，难度适合 ${grade} 阶段孩子。

请严格返回 JSON（不要带 Markdown 代码块，不要带 \`\`\`json 标记）：
{
  "botWord": "${item.word}",
  "pinyin": "${item.pinyin}",
  "definition": "${item.definition}",
  "kidsExplanation": "${item.kidsExplanation}",
  "mnemonic": "${item.mnemonic}",
  "illustration": ${JSON.stringify(item.illustration)},
  "story": "${item.story}",
  "choices": [
    {
      "word": "候选四字成语1",
      "pinyin": "拼音(带声调)1",
      "definition": "一句话词典简易释义",
      "hint": "前提示白话解读1（用于选择时显示的趣味大提示，告诉孩子该词讲什么，控制在15到30个字以内）"
    },
    ... (正好4个选项)
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = tryParseJSON(response.text || '');
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Solitaire Start Endpoint Error:", error);
    res.json({
      botWord: item.word,
      pinyin: item.pinyin,
      definition: item.definition,
      kidsExplanation: item.kidsExplanation,
      mnemonic: item.mnemonic,
      illustration: item.illustration,
      story: item.story,
      choices: getFallbackChoices(endChar)
    });
  }
});

// AI Solitaire Bot Answer Endpoint (takes student selected word, generates bot answer AND choices for subsequent round)
app.post('/api/game/solitaire', async (req, res) => {
  const { lastWord, grade } = req.body;
  
  if (!lastWord) {
    return res.status(400).json({ error: '请先说一个词作为开头！' });
  }

  // Find the ending character of user's chosen word
  const endChar = lastWord.charAt(lastWord.length - 1);

  if (!ai) {
    // Find local options starting with endChar
    const localMatch = PRE_CURATED_IDIOMS.find(i => i.word.startsWith(endChar));
    const finalBotWord = localMatch ? localMatch.word : (endChar + "气洋洋");
    const finalBotEndChar = finalBotWord.charAt(finalBotWord.length - 1);
    
    const resData: any = {
      word: finalBotWord,
      pinyin: localMatch ? localMatch.pinyin : "xǐ qì yáng yáng",
      definition: localMatch ? localMatch.definition : "充满了欢喜、快乐的神色、气氛。",
      kidsExplanation: localMatch ? localMatch.kidsExplanation : "就像过新年，大家穿上红衣服放鞭炮吃糖果，满脸红扑扑地笑！",
      mnemonic: localMatch ? localMatch.mnemonic : "红灯笼挂得高，小朋友在抱着糖大笑。真快乐呀！",
      illustration: localMatch ? localMatch.illustration : `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="20" fill="#FFF5F5" />
        <circle cx="200" cy="120" r="50" fill="#FF8787" />
        <rect x="180" y="80" width="40" height="80" rx="10" fill="#FA5252" />
        <line x1="200" y1="50" x2="200" y2="80" stroke="#FAB005" stroke-width="4"/>
        <line x1="200" y1="160" x2="200" y2="190" stroke="#FAB005" stroke-width="4"/>
        <text x="200" y="240" font-size="24" font-weight="bold" fill="#C92A2A" text-anchor="middle" font-family="'SimHei'">${endChar}气洋洋</text>
      </svg>`,
      story: localMatch ? localMatch.story : "大家一起庆祝快乐丰收的喜悦节日。",
      choices: getFallbackChoices(finalBotEndChar),
      found: true
    };
    return res.json(resData);
  }

  try {
    const prompt = `你是一个非常幽默和可爱的成语接龙兔子机器人。由于你在和中小学生玩成语接龙游戏，小朋友刚刚选中的成语是： "${lastWord}"。它的尾字是 "${endChar}"。
现在轮到你出招了，你需要完成两个高度关联的任务：
1. 你必须接出首字为 "${endChar}"（或同音字首字）的四字正规成语，并输出它的标准词义、童趣白话讲解（白话类比）、顺口溜记忆口诀、精美可缩放矢量图形(SVG)插画和出处典故。
2. 此时，你的新成语尾字叫 X，你必须用 X（或 X 的同音拼音字）作为首字，为小朋友生成 4 个全新的接龙候选成语选项，供小朋友在下一轮点击进行选择（从而避免他们打字）。选项需要契合 ${grade} 的学习范围。

请严格返回 JSON（不要带 Markdown 代码块，不要带 \`\`\`json 标记）：
{
  "word": "你接出来的这个四字成语",
  "pinyin": "声调拼音",
  "definition": "一句话词典真实释义",
  "kidsExplanation": "一句极适合小学生的白话场景趣味类比解释",
  "mnemonic": "热情可爱、30-50字左右的的童谣顺口溜速记口诀，让孩子一读就懂、秒速记住！",
  "illustration": "一段手工绘制、高度治愈、高对比童趣的可缩放矢量图形(SVG)代码（宽度400，高度300，包含浅色背景、卡通角色动物、和该词意思契合的趣味艺术插图）",
  "story": "该成语的经典历史背景或传说拟人化叙事版本，控制在100字以内，浅显懂生活。",
  "choices": [
    {
      "word": "备选成语1",
      "pinyin": "拼音1",
      "definition": "简短词条释义1",
      "hint": "前提示白话解读1（用于选择时显示的趣味说明，告诉孩子这个待选词讲什么，控制在15到30个字以内）"
    },
    ... (正好4个选项)
  ],
  "found": true
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || '';
    const result = tryParseJSON(textOutput);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Solitaire Answer Failure, using Fallback:", error);
    // Graceful dynamic fallback
    const fallbackWord = endChar + "气洋洋";
    res.json({
      word: fallbackWord,
      pinyin: "xǐ qì yáng yáng",
      definition: "充满了喜气洋洋、非常欢欣蓬勃的神色与氛围。",
      kidsExplanation: "就像过大年，大家穿红衣、拿压岁钱、吃糖葫芦，脸上红扑扑地直笑！",
      mnemonic: "红灯笼挂得高，萌萌小兔咧嘴笑。大家欢聚一堂真快乐，喜气洋洋福星关照！",
      illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="20" fill="#FFF5F5" />
        <circle cx="200" cy="120" r="50" fill="#FF8787" />
        <rect x="180" y="80" width="40" height="80" rx="10" fill="#FA5252" />
        <line x1="200" y1="50" x2="200" y2="80" stroke="#FAB005" stroke-width="4"/>
        <line x1="200" y1="160" x2="200" y2="190" stroke="#FAB005" stroke-width="4"/>
        <text x="200" y="240" font-size="24" font-weight="bold" fill="#C92A2A" text-anchor="middle" font-family="'SimHei'">${endChar}气洋洋</text>
      </svg>`,
      story: "过大年时，小动物们穿戴一新，高举大红灯笼送上祝福，四处都充满了喜悦的气候。",
      choices: getFallbackChoices("洋"),
      found: true
    });
  }
});

// Serve frontend in dev or prod
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Mount Vite middleware in development
  const viteServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(viteServer.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await viteServer.transformIndexHtml(url, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>微信版成语游戏 (WX Idiom)</title>
  </head>
  <body class="bg-slate-100 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务端开启：服务挂载于 http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'} 模式)`);
});
