import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

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
const PRE_CURATED_IDIOMS: Array<{
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
  <line x1="200" y1="0" x2="200" y2="300" stroke="#B0BEC5" stroke-width="4" stroke-dasharray="10,5" />

  <!-- Ye Gong screaming and running away -->
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

// Helper to check if a valid word can cascade for dynamic lookups
function findLocalIdiom(query: string) {
  const qStr = query.replace(/\s+/g, '');
  return PRE_CURATED_IDIOMS.find(i => i.word === qStr);
}

// REST end-point to load curated idioms
app.get('/api/idioms/curated', (req, res) => {
  res.json(PRE_CURATED_IDIOMS.map(({ word, pinyin, definition, category, mnemonic, kidsExplanation, synonyms, antonyms }) => ({
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
    return res.json(local);
  }

  if (!ai) {
    // If no API Key is set, create a plausible mock representation
    return res.json({
      word,
      pinyin: `${word} pīn yīn`,
      definition: `关于《${word}》的释义：这是一款优美动听的成语词汇，快开启你的成语想象力吧！`,
      category: 'elementary',
      illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="20" fill="#EFF6FF" />
        <circle cx="200" cy="130" r="50" fill="#3B82F6" opacity="0.8" />
        <text x="200" y="220" font-size="24" font-weight="bold" fill="#1D4ED8" text-anchor="middle" font-family="'SimHei'">${word}</text>
        <text x="200" y="255" font-size="14" fill="#60A5FA" text-anchor="middle">AI 绘图中 (配置 API Key 即可全自动生成画作)</text>
      </svg>`,
      mnemonic: `大家经常说起《${word}》，多读多看，熟能生巧！`,
      kidsExplanation: `这就像一个超级好玩的童话故事，小朋友多用这个成语，你的作文能拿一百分哦！`,
      synonyms: [word + "近义", "触类旁通"],
      antonyms: ["无独有偶", "截然不同"],
      story: `关于${word}的典故，流传于久远的故事里。通过它我们学到了宝贵的中华传统智慧！`
    });
  }

  try {
    const prompt = `你正在为一个专为中小学生设计的、具有成语插画和近义词关联网络的微信小程序游戏提供服务。
现在，请为这个极为特别的成语生成符合要求的生动儿童学习卡片。
目标成语： "${word}"

必须严格返回 JSON 格式数据，不得包含任何 Markdown 代码块包裹（即不要带 \`\`\`json 和 \`\`\` 标记，直接返回 JSON 纯文本字符串）。
JSON 格式需精确匹配以下字字段结构：
{
  "word": "${word}",
  "pinyin": "声母韵母带声调的拼音 (例如: 'huà shé tiān zú')",
  "definition": "一句话成语的标准权威词典释义",
  "category": "根据成语难度归类，选择 'elementary'(小学)、'middle'(初中)、'high'(高中) 之一",
  "illustration": "一段纯手工绘制的高品质可缩放矢量图形(SVG)代码字符串。背景使用治愈、童趣的清新淡雅浅色系背景(比如 #FFF9E6, #EDF7ED 等，圆角。宽度400，高度300。需要利用多重 <path>, <circle>, <ellipse>, <text> 在其中绘制该成语的主题拟人卡通形象或经典情节，且必须带有圆角边框及生动的图形元素，使其能和小朋友一眼联想记住，设计富有极强的童趣特色与插画师级别的色彩搭配)。",
  "mnemonic": "一段朗朗上口的‘一眼速记口诀’或‘顺口溜’，帮助小朋友三秒钟记住这个成语并会用。字数在40-80字左右，语气十分热情幽默、可爱。",
  "kidsExplanation": "一两句适合低年级或中小学生的‘白话大白话比喻解释’，例如用身边的学校、操场、生活场景做类比解释，极其生动。",
  "synonyms": ["两个到四个相关的常见近义成语"],
  "antonyms": ["两个到四个相关的常见反义或相对概念成语"],
  "story": "该成语的经典历史典故或背景传说简短有趣叙事版本，控制在150字以内，浅显易懂。"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || '';
    // Strip codeblock format if the model returns it despite instruction
    let cleanText = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanText);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Details Generation Error:", error);
    res.status(500).json({ error: "Gemini 无法生成该成语的插画和解析，请检查成语名称后重试！" });
  }
});

// Game Mode:看图猜成语 - Riddle Engine
app.get('/api/game/riddle', async (req, res) => {
  const grade = (req.query.grade as string) || 'elementary';
  
  // Filter local curate
  const pool = PRE_CURATED_IDIOMS.filter(i => i.category === grade);
  const picked = pool[Math.floor(Math.random() * pool.length)] || PRE_CURATED_IDIOMS[0];

  // Candidates scramble: includes all characters of picked.word plus random filler Chinese characters
  const fillers = "水火风土地山云雷电日月星晨乾坤宇宙古今内外生死存亡左右上下真假美丑狐虎羊狼蛇足龙风吹雨打完璧归赵百折不挠自强不息";
  const wordChars = picked.word.split('');
  
  // Scramble 12 character grid
  const gridSet = new Set(wordChars);
  while(gridSet.size < 12) {
    const rChar = fillers[Math.floor(Math.random() * fillers.length)];
    gridSet.add(rChar);
  }
  const candidates = Array.from(gridSet).sort(() => Math.random() - 0.5);

  res.json({
    id: Date.now(),
    riddle: picked.definition,
    illustration: picked.illustration,
    pinyin: picked.pinyin,
    mnemonic: picked.mnemonic,
    kidsExplanation: picked.kidsExplanation,
    word: picked.word,
    candidates
  });
});

// Dynamic Match Connection Pair Generator
app.get('/api/game/match-pair', async (req, res) => {
  // Return dynamic synonym/antonym relations from pre-curated pool
  // Mix and match 4 sets of pairs: Idiom with its Synonym or Antonym
  const pickedSet = [...PRE_CURATED_IDIOMS].sort(() => Math.random() - 0.5).slice(0, 4);
  
  const cardList: Array<{ id: string; text: string; pairId: string; type: 'idiom' | 'relation'; relationType: 'synonym' | 'antonym' }> = [];
  
  pickedSet.forEach((item, index) => {
    // Choose one synonym or antonym randomly to pair
    const useSynonym = Math.random() > 0.5;
    const relationWord = useSynonym ? item.synonyms[0] : item.antonyms[0];
    
    cardList.push({
      id: `idiom-${index}`,
      text: item.word,
      pairId: `pair-${index}`,
      type: 'idiom',
      relationType: useSynonym ? 'synonym' : 'antonym'
    });
    
    cardList.push({
      id: `rel-${index}`,
      text: `${relationWord} (${useSynonym ? '近义' : '反义'})`,
      pairId: `pair-${index}`,
      type: 'relation',
      relationType: useSynonym ? 'synonym' : 'antonym'
    });
  });

  // Shuffle cardList
  const shuffledCards = cardList.sort(() => Math.random() - 0.5);
  res.json({ cards: shuffledCards });
});

// AI Solitaire Bot Answer Endpoint
app.post('/api/game/solitaire', async (req, res) => {
  const { lastWord, grade } = req.body;
  
  if (!lastWord) {
    return res.status(400).json({ error: '请先说一个词作为开头！' });
  }

  // Find the ending character of lastWord
  const endChar = lastWord.charAt(lastWord.length - 1);

  if (!ai) {
    // Fallback dictionary search or generic creation
    // Find local options starting with endChar
    const localMatch = PRE_CURATED_IDIOMS.find(i => i.word.startsWith(endChar));
    if (localMatch) {
      return res.json({
        word: localMatch.word,
        pinyin: localMatch.pinyin,
        definition: localMatch.definition,
        mnemonic: localMatch.mnemonic,
        illustration: localMatch.illustration,
        story: localMatch.story,
        found: true
      });
    }

    // fallback procedural generator
    const standardPinyin = "zhēn xiá hù nǎo";
    return res.json({
      word: endChar + "心诚意",
      pinyin: "zhēn xīn chéng yì",
      definition: "形容诚心诚意，非常真实的一片心意。",
      mnemonic: "真心诚意待朋友，温暖大伙乐融融！记住它，生活变得更美好！",
      illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="20" fill="#FFF1F2" />
        <path d="M 150,150 Q 200,100 250,150 T 350,150 L 350,300 L 150,300 Z" fill="#FFE4E6" />
        <path d="M12,15 C5,0 95,-15 110,60 C125,-15 215,0 208,15 L110,125 Z" fill="#F43F5E" transform="translate(90, 60) scale(0.8)"/>
        <text x="200" y="220" font-size="24" font-weight="bold" fill="#BE123C" text-anchor="middle" font-family="'SimHei'">${endChar}心诚意</text>
      </svg>`,
      story: "大家用真切的情意互相帮助，最终一起度过难关，这叫‘真心诚意’。",
      found: true
    });
  }

  try {
    const prompt = `你是一个非常幽默和可爱的成语接龙兔子机器人。由于你在和中小学生玩成语接龙游戏，小朋友刚刚说出的成语是： "${lastWord}"。
现在轮到你出招了：
你需要用 "${endChar}" 作为你出的成语的首字。你可以通过拼音同音字匹配（如果找不到以 "${endChar}" 开头的，也可以用 "${endChar}" 的同音拼音字开头，比如 龙(long) 接 融(rong)）。
你必须从你的中华成语大数据库里挑出一个优秀的、适合小朋友学习的词，然后将详细成语属性返回！

请严格返回 JSON（不要带 Markdown 代码块，不要带 \`\`\`json 标记）：
{
  "word": "你接出来的四字成语",
  "pinyin": "声母韵母带声调的拼音",
  "definition": "一句话成语标准词典释义",
  "kidsExplanation": "一句适合小学生的白话场景趣味类比解释",
  "mnemonic": "热情可爱、30-60字左右的的顺口溜速记口诀，用来让小朋友一眼记住这个词！",
  "illustration": "一段纯手工绘制、高度治愈、童趣的可缩放矢量图形(SVG)代码（宽度400，高度300，包含浅色系背景、卡通形象、与该词紧密关联的趣味图形）。",
  "story": "该成语的经典历史典故或背景简短传说有趣叙事版本，控制在100字以内，浅显易懂。",
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
    let cleanText = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanText);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Solitaire Answer Failure:", error);
    // Graceful dynamic fallback
    res.json({
      word: endChar + "气洋洋",
      pinyin: "xǐ qì yáng yáng",
      definition: "充满了欢喜振奋的神色、气氛。",
      kidsExplanation: "就像过新年，大家穿上红衣服放鞭炮吃糖果，满脸红扑扑的，每个人都在高兴地笑，这就叫喜气洋洋！",
      mnemonic: "红灯笼挂得高，小朋友在傻傻地笑。大家在一起真快乐，喜气洋洋乐开怀！",
      illustration: `<svg viewBox="0 0 400 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="20" fill="#FFF5F5" />
        <circle cx="200" cy="120" r="50" fill="#FF8787" />
        <!--🏮 Lantern -->
        <rect x="180" y="80" width="40" height="80" rx="10" fill="#FA5252" />
        <line x1="200" y1="50" x2="200" y2="80" stroke="#FAB005" stroke-width="4"/>
        <line x1="200" y1="160" x2="200" y2="190" stroke="#FAB005" stroke-width="4"/>
        <text x="200" y="240" font-size="24" font-weight="bold" fill="#C92A2A" text-anchor="middle" font-family="'SimHei'">${endChar}气洋洋</text>
      </svg>`,
      story: "古人在佳节欢聚时，挂起红红的灯笼，彼此送上最真诚的祝福，充满了欢喜和快乐。",
      found: true
    });
  }
});

// Serve frontend in dev or prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
