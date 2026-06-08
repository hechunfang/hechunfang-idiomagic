/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Puzzle, 
  MessageSquare, 
  User, 
  Search, 
  Shuffle, 
  HelpCircle, 
  ChevronRight, 
  Heart, 
  Award, 
  Coins, 
  Calendar, 
  Bot, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  ThumbsUp,
  Check,
  AlertCircle,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';

import { Idiom, SolitaireMessage, StudentProfile, StudentGrade, GameMode } from './types';

// Standard fallback if server fetch doesn't work or for initial loader helper
const DEFAULT_PRESET_WORDS = ["自强不息", "百折不挠", "持之以恒", "磨杵成针", "狐假虎威", "亡羊补牢", "画蛇添足", "叶公好龙"];

interface ExamRank {
  title: string;
  minScore: number;
  maxScore: number;
  color: string;
  bg: string;
  border: string;
  badge: string;
  desc: string;
}

const EXAM_RANKS: ExamRank[] = [
  { title: "童生", minScore: 0, maxScore: 20, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", badge: "📝", desc: "刚入成语学堂，勤奋练字，明理知礼。" },
  { title: "秀才", minScore: 20, maxScore: 50, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", badge: "📖", desc: "通过县试，出口成章，才气渐露。" },
  { title: "举人", minScore: 50, maxScore: 100, color: "text-blue-700", bg: "bg-blue-50/80", border: "border-blue-200", badge: "🦅", desc: "乡试高中，见多识广，志存高远。" },
  { title: "贡生", minScore: 100, maxScore: 200, color: "text-cyan-700", bg: "bg-cyan-50/80", border: "border-cyan-200", badge: "🏰", desc: "贡入京师太学，学贯古今，栋梁之材。" },
  { title: "探花", minScore: 200, maxScore: 350, color: "text-pink-700", bg: "bg-pink-50/80", border: "border-pink-200", badge: "🌸", desc: "殿试第三名，俊逸不凡，博闻强识。" },
  { title: "榜眼", minScore: 350, maxScore: 500, color: "text-amber-700", bg: "bg-amber-50/80", border: "border-amber-200", badge: "🥈", desc: "殿试第二名，人中龙凤，名不虚传。" },
  { title: "状元", minScore: 500, maxScore: 9999, color: "text-rose-700", bg: "bg-rose-50/80", border: "border-rose-200", badge: "👑", desc: "殿试魁首，独占鳌头，旷世奇才！" }
];

const getCurrentRank = (score: number): ExamRank => {
  for (let i = EXAM_RANKS.length - 1; i >= 0; i--) {
    if (score >= EXAM_RANKS[i].minScore) {
      return EXAM_RANKS[i];
    }
  }
  return EXAM_RANKS[0];
};

export default function App() {
  // --- Student Profile State ---
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('wx_idiom_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      name: "学习之星 ⭐",
      grade: 'elementary',
      score: 0,
      coins: 30,
      streak: 3,
      checkedInToday: false,
      unlockedStorybook: [],
      puzzlesSolved: 0,
      solitaireRecord: 0
    };
  });

  // Save profile helper
  const updateProfile = (updater: Partial<StudentProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updater };
      
      // If score is updated, compare the ranks using getCurrentRank
      if (updater.score !== undefined && updater.score !== prev.score) {
        const prevRank = getCurrentRank(prev.score);
        const nextRank = getCurrentRank(next.score);
        if (nextRank.title !== prevRank.title && next.score > prev.score) {
          // Level promotion detected!
          setPromotionBadge(nextRank);
          setShowPromotionAnimation(true);
        }
      }

      localStorage.setItem('wx_idiom_profile', JSON.stringify(next));
      return next;
    });
  };

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // --- UI Navigation ---
  // We offer "home" (Idiom dictionary with search & synonym connection maps), "guess" (看图猜成语),
  // "elimination" (Synonym/Antonym match pair match), "solitaire" (AI 接龙), "profile" (成长树 / 成就)
  const [activeTab, setActiveTab] = useState<GameMode>('home');

  // --- Glossary / Dict Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [curatedIdioms, setCuratedIdioms] = useState<any[]>([]);
  const [selectedIdiom, setSelectedIdiom] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingStory, setIsPlayingStory] = useState(false);

  // --- Guess Game State ---
  const [guessGame, setGuessGame] = useState<{
    id: number;
    word: string;
    riddle: string;
    illustration: string;
    pinyin: string;
    mnemonic: string;
    kidsExplanation: string;
    candidates: string[];
  } | null>(null);
  const [guessSelection, setGuessSelection] = useState<string[]>([]); // Array of selected characters so far, padded with ""
  const [isGuessCorrect, setIsGuessCorrect] = useState<boolean | null>(null);
  const [showGuessHint, setShowGuessHint] = useState(false);
  const [isLoadingRiddle, setIsLoadingRiddle] = useState(false);
  const [solvedRiddlesList, setSolvedRiddlesList] = useState<string[]>([]);
  const [promotionBadge, setPromotionBadge] = useState<ExamRank | null>(null);
  const [showPromotionAnimation, setShowPromotionAnimation] = useState(false);

  // --- Synonym/Antonym Match Card Game State ---
  const [matchCards, setMatchCards] = useState<Array<{
    id: string;
    text: string;
    pinyin: string;
    pairId: string;
    type: 'idiom' | 'relation';
    relationType: 'synonym' | 'antonym';
    isMatched: boolean;
  }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [shakingCardIds, setShakingCardIds] = useState<string[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeSlashLine, setActiveSlashLine] = useState<{ p1: { x: number; y: number }; p2: { x: number; y: number } } | null>(null);
  const [gridShake, setGridShake] = useState(false);
  const [showMatchSuccessPopup, setShowMatchSuccessPopup] = useState(false);

  // --- Dynamic Connections state & refs for matches ---
  const [connections, setConnections] = useState<Array<{
    fromId: string;
    toId: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    relationType: 'synonym' | 'antonym';
  }>>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const getCardCenter = (cardId: string) => {
    if (!gridRef.current) return null;
    const gridRect = gridRef.current.getBoundingClientRect();
    const el = cardRefs.current[cardId];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.right) / 2 - gridRect.left,
      y: (r.top + r.bottom) / 2 - gridRect.top
    };
  };

  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        // Retro sweet synth chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Web Audio block", e);
    }

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("太棒啦！");
        utterance.lang = 'zh-CN';
        utterance.rate = 1.25;
        utterance.pitch = 1.35; // high cute children style
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("SpeechSynthesis error", e);
    }
  };

  const playFailureSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.25);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {}
  };

  const updateConnectionCoords = () => {
    if (!gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    
    // Group identical pairId matched cards together
    const pairGroups: Record<string, string[]> = {};
    matchCards.forEach(card => {
      if (card.isMatched) {
        if (!pairGroups[card.pairId]) {
          pairGroups[card.pairId] = [];
        }
        pairGroups[card.pairId].push(card.id);
      }
    });

    const newConnections: any[] = [];
    Object.entries(pairGroups).forEach(([pairId, cardIds]) => {
      if (cardIds.length === 2) {
        const id1 = cardIds[0];
        const id2 = cardIds[1];
        const el1 = cardRefs.current[id1];
        const el2 = cardRefs.current[id2];
        if (el1 && el2) {
          const r1 = el1.getBoundingClientRect();
          const r2 = el2.getBoundingClientRect();
          
          const p1 = {
            x: (r1.left + r1.right) / 2 - gridRect.left,
            y: (r1.top + r1.bottom) / 2 - gridRect.top
          };
          const p2 = {
            x: (r2.left + r2.right) / 2 - gridRect.left,
            y: (r2.top + r2.bottom) / 2 - gridRect.top
          };

          const cardInfo = matchCards.find(c => c.id === id1);
          newConnections.push({
            fromId: id1,
            toId: id2,
            p1,
            p2,
            relationType: cardInfo ? cardInfo.relationType : 'synonym'
          });
        }
      }
    });

    setConnections(newConnections);
  };

  useEffect(() => {
    if (activeTab === 'elimination') {
      const ticks = [50, 150, 305, 505];
      const timers = ticks.map(t => setTimeout(updateConnectionCoords, t));
      window.addEventListener('resize', updateConnectionCoords);
      return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener('resize', updateConnectionCoords);
      };
    }
  }, [activeTab, matchCards]);

  // --- AI Solitaire State ---
  const [solitaireChat, setSolitaireChat] = useState<SolitaireMessage[]>([]);
  const [userInputWord, setUserInputWord] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active solitaire blank-filling state
  const [activeSolitaireChoice, setActiveSolitaireChoice] = useState<{
    word: string;
    pinyin: string;
    definition: string;
    hint: string;
    blankIndices: number[];
    filledChars: { [key: number]: string };
    candidates: string[];
    focusedIndex: number | null;
  } | null>(null);

  // --- PK Extreme Quiz State ---
  const [pkQuestion, setPkQuestion] = useState<{
    question: string;
    answer: string;
    pinyin: string;
    kidsExplanation: string;
    fact: string;
    options: string[];
  } | null>(null);
  const [pkSelectedOption, setPkSelectedOption] = useState<string | null>(null);
  const [pkIsCorrect, setPkIsCorrect] = useState<boolean | null>(null);
  const [pkStreak, setPkStreak] = useState<number>(0);
  const [isLoadingPk, setIsLoadingPk] = useState<boolean>(false);

  // --- Load Initial Content ---
  useEffect(() => {
    fetchCuratedIdioms();
    // Auto load first motivating/inspiring idiom as presentation card from the list
    const motivationalList = ["自强不息", "百折不挠", "持之以恒", "磨杵成针"];
    const randomInspirational = motivationalList[Math.floor(Math.random() * motivationalList.length)];
    loadIdiomDetail(randomInspirational);
  }, []);

  // auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [solitaireChat, isBotThinking]);

  const fetchCuratedIdioms = async () => {
    try {
      const response = await fetch('/api/idioms/curated');
      if (response.ok) {
        const data = await response.json();
        setCuratedIdioms(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadIdiomDetail = async (word: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/idiom/detail?word=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedIdiom(data);
      } else {
        showToast("无法获取该成语的AI释义", "error");
      }
    } catch (e) {
      showToast("连接服务器失败", "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const togglePlayStory = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("您的浏览器暂不支持语音朗读功能哦！", "error");
      return;
    }

    if (isPlayingStory) {
      window.speechSynthesis.cancel();
      setIsPlayingStory(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.90; // 缓漫朗读，便于孩子吸收
      utterance.pitch = 1.15; // 柔和、阳光、有亲和力的声线

      utterance.onend = () => {
        setIsPlayingStory(false);
      };

      utterance.onerror = () => {
        setIsPlayingStory(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlayingStory(true);
      showToast("📣 正在为您朗读成语典故故事...", "success");
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("您的浏览器暂不支持语音播放功能哦！", "error");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      setIsPlayingStory(false); // cancel story if reading
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.82; // slightly slower so children can hear each character clearly
      utterance.pitch = 1.30; // warm and cute cartoon character voice tone
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingStory(false);
  }, [selectedIdiom, activeTab]);

  // Handlers for Search Page
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    loadIdiomDetail(query);
  };

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("您的浏览器暂不支持语音输入，请手动输入成语哦！", "error");
      return;
    }

    if (isListening) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast("🎙️ 聪聪兔正在倾听... 请对麦克风说出成语", "info");
      };

      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        const cleaned = speechToText.replace(/[^\u4e00-\u9fa5]/g, '').slice(0, 8);
        if (cleaned) {
          setSearchQuery(cleaned);
          showToast(`🎤 听到啦：“${cleaned}”`, "success");
          loadIdiomDetail(cleaned);
        } else {
          showToast(`没听懂，请清晰念出成语哦：“${speechToText}”`, "info");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error === 'not-allowed') {
          showToast("请允许浏览器获取麦克风权限哦！", "error");
        } else {
          showToast("抱歉，没听清，请再试一次", "error");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      showToast("语音功能初始化失败", "error");
      setIsListening(false);
    }
  };

  const handleCuratedClick = (word: string) => {
    setSearchQuery(word);
    loadIdiomDetail(word);
  };

  // Daily Sign-In Function
  const handleCheckIn = () => {
    if (profile.checkedInToday) {
      showToast("今天已经签到过了哦，明天再来吧！", "info");
      return;
    }
    const bonusCoins = 15;
    const newStreak = profile.streak + 1;
    updateProfile({
      checkedInToday: true,
      coins: profile.coins + bonusCoins,
      streak: newStreak
    });
    showToast(`签到成功！连续${newStreak}天签到，金币+${bonusCoins} 💎`, "success");
  };

  // --- Guess Game Handlers ---
  const startNewGuessLevel = async () => {
    setIsLoadingRiddle(true);
    setIsGuessCorrect(null);
    setGuessSelection([]);
    setShowGuessHint(false);
    try {
      const excludeParam = solvedRiddlesList.length > 0 ? `&exclude=${encodeURIComponent(solvedRiddlesList.join(','))}` : '';
      const response = await fetch(`/api/game/riddle?grade=${profile.grade}${excludeParam}`);
      if (response.ok) {
        const data = await response.json();
        setGuessGame(data);
        // Initialize guess empty array with length of word
        setGuessSelection(Array(data.word.length).fill(""));
      } else {
        showToast("加载关卡失败", "error");
      }
    } catch (e) {
      showToast("网络连接异常", "error");
    } finally {
      setIsLoadingRiddle(false);
    }
  };

  // Trigger loading automatically when entering Guess screen
  useEffect(() => {
    if (activeTab === 'guess' && !guessGame) {
      startNewGuessLevel();
    }
  }, [activeTab]);

  const handleCandidateClick = (char: string) => {
    if (isGuessCorrect === true) return;

    // Find first empty space in selections
    const emptyIndex = guessSelection.indexOf("");
    if (emptyIndex !== -1) {
      const newSelection = [...guessSelection];
      newSelection[emptyIndex] = char;
      setGuessSelection(newSelection);

      // Check if complete
      if (newSelection.indexOf("") === -1 && guessGame) {
        const guessedWord = newSelection.join('');
        if (guessedWord === guessGame.word) {
          setIsGuessCorrect(true);
          // Reward coins & score
          updateProfile({
            score: profile.score + 10,
            coins: profile.coins + 5,
            puzzlesSolved: profile.puzzlesSolved + 1
          });
          // Track solved level so we don't repeat
          setSolvedRiddlesList(prev => {
            if (!prev.includes(guessGame.word)) {
              return [...prev, guessGame.word];
            }
            return prev;
          });
          showToast("答对啦！智慧过人，金币+5 🪙", "success");
        } else {
          setIsGuessCorrect(false);
          showToast("拼写的成语不对哦，再试一次吧！", "error");
        }
      }
    }
  };

  const handleBackspaceSelection = (index: number) => {
    if (isGuessCorrect === true) return;
    const newSelection = [...guessSelection];
    newSelection[index] = "";
    setGuessSelection(newSelection);
    setIsGuessCorrect(null);
  };

  // --- Idiom Bracket Elimination Game States ---
  const [elimIdioms, setElimIdioms] = useState<Array<{
    id: string;
    word: string;
    pinyin: string;
    definition: string;
    kidsExplanation: string;
    blankIndices: number[];
    filledChars: string[];
    isMatched: boolean;
  }>>([]);
  const [elimCandidates, setElimCandidates] = useState<Array<{
    id: string;
    char: string;
    isUsed: boolean;
  }>>([]);
  const [activeElimId, setActiveElimId] = useState<string | null>(null);
  const [matchedElimCount, setMatchedElimCount] = useState(0);
  const [isLoadingElim, setIsLoadingElim] = useState(false);
  const [shakingElimCardId, setShakingElimCardId] = useState<string | null>(null);

  const startNewMatchGame = async () => {
    setIsLoadingElim(true);
    setMatchedElimCount(0);
    setActiveElimId(null);
    setShakingElimCardId(null);
    try {
      const grade = profile?.grade || 'elementary';
      const response = await fetch(`/api/game/match-pair?grade=${grade}`);
      if (response.ok) {
        const data = await response.json();
        
        // Format idioms and compute missing character gaps
        const formattedIdioms = data.idioms.map((item: any) => {
          const filledChars = item.word.split('').map((char: string, index: number) => {
            return item.blankIndices.includes(index) ? "" : char;
          });
          return {
            ...item,
            filledChars,
            isMatched: false
          };
        });

        setElimIdioms(formattedIdioms);

        // Harvest all correct missing characters from all 4 idioms as candidates
        const correctChars: string[] = [];
        data.idioms.forEach((item: any) => {
          item.blankIndices.forEach((idx: number) => {
            correctChars.push(item.word[idx]);
          });
        });

        // Mix in some colorful distractor characters for engagement
        const distractors = "一二三四五六七八九十金木水火风雷日月山水风云天地手足人心鸟花羊兔龙蛇假真心自由".split('');
        const scrambledDistractors = distractors.sort(() => Math.random() - 0.5);
        
        const candidatePool = [...correctChars];
        let dIdx = 0;
        while (candidatePool.length < 12 && dIdx < scrambledDistractors.length) {
          const char = scrambledDistractors[dIdx];
          if (!candidatePool.includes(char)) {
            candidatePool.push(char);
          }
          dIdx++;
        }

        // Shuffle candidatePool to form a nice layout
        const shuffledPool = candidatePool.sort(() => Math.random() - 0.5).map((char, index) => ({
          id: `cand-${index}-${char}`,
          char,
          isUsed: false
        }));

        setElimCandidates(shuffledPool);

        // Pre-select the first idiom card
        if (formattedIdioms.length > 0) {
          setActiveElimId(formattedIdioms[0].id);
        }
      } else {
        showToast("出题机打了个盹，请重新加载吧", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("获取填空消消乐异常", "error");
    } finally {
      setIsLoadingElim(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'elimination' && elimIdioms.length === 0) {
      startNewMatchGame();
    }
  }, [activeTab]);

  const handleElimCandidateClick = (cand: { id: string; char: string; isUsed: boolean }) => {
    if (cand.isUsed) return;
    if (!activeElimId) {
      showToast("请先选择上方的一个成语卡片哦！", "info");
      return;
    }

    const activeIdiom = elimIdioms.find(i => i.id === activeElimId);
    if (!activeIdiom || activeIdiom.isMatched) return;

    // Find the first empty bracket position
    const emptySlotIdx = activeIdiom.blankIndices.find(idx => activeIdiom.filledChars[idx] === "");
    if (emptySlotIdx === undefined) return;

    // Fill the slot
    const newFilledChars = [...activeIdiom.filledChars];
    newFilledChars[emptySlotIdx] = cand.char;

    // Update state
    setElimIdioms(prev => prev.map(item => {
      if (item.id === activeElimId) {
        return {
          ...item,
          filledChars: newFilledChars
        };
      }
      return item;
    }));

    // Mark candidate as used
    setElimCandidates(prev => prev.map(c => {
      if (c.id === cand.id) {
        return { ...c, isUsed: true };
      }
      return c;
    }));

    // Check if the card is now fully filled
    const stillHasEmpty = activeIdiom.blankIndices.some(idx => newFilledChars[idx] === "");
    if (!stillHasEmpty) {
      const completedWord = newFilledChars.join('');
      if (completedWord === activeIdiom.word) {
        // CORRECT MATCH!
        playSuccessSound();
        showToast("👍 太棒啦！成语拼装成功！", "success");

        // Reward score & coins
        updateProfile({
          score: profile.score + 10,
          coins: profile.coins + 3,
          puzzlesSolved: profile.puzzlesSolved + 1
        });

        // Mark as matched
        setElimIdioms(prev => prev.map(item => {
          if (item.id === activeElimId) {
            return { ...item, isMatched: true };
          }
          return item;
        }));

        setMatchedElimCount(prev => prev + 1);

        // Smoothly auto-select the next remaining incomplete card after a small delay
        setTimeout(() => {
          setElimIdioms(prev => {
            const nextUnmatched = prev.find(item => item.id !== activeElimId && !item.isMatched);
            if (nextUnmatched) {
              setActiveElimId(nextUnmatched.id);
            } else {
              setActiveElimId(null);
            }
            return prev;
          });
        }, 400);

      } else {
        // INCORRECT MATCH!
        playFailureSound();
        showToast("哎呀，选错字了，再试一次！", "error");
        setShakingElimCardId(activeElimId);

        // Reset Card blanks after shake time
        setTimeout(() => {
          setShakingElimCardId(null);
          
          setElimIdioms(prev => prev.map(item => {
            if (item.id === activeElimId) {
              const resetFilled = item.word.split('').map((char: string, index: number) => {
                return item.blankIndices.includes(index) ? "" : char;
              });
              return {
                ...item,
                filledChars: resetFilled
              };
            }
            return item;
          }));

          // Recover used candidate characters in this attempt
          const lettersToFree = activeIdiom.blankIndices.map(idx => newFilledChars[idx]);
          setElimCandidates(prev => prev.map(c => {
            if (lettersToFree.includes(c.char) && c.isUsed) {
              return { ...c, isUsed: false };
            }
            return c;
          }));

        }, 800);
      }
    }
  };

  const handleRetractSlot = (idiomId: string, charIndex: number) => {
    const idiom = elimIdioms.find(i => i.id === idiomId);
    if (!idiom || idiom.isMatched) return;

    if (!idiom.blankIndices.includes(charIndex) || idiom.filledChars[charIndex] === "") return;

    const keyChar = idiom.filledChars[charIndex];

    setElimIdioms(prev => prev.map(item => {
      if (item.id === idiomId) {
        const nextFilled = [...item.filledChars];
        nextFilled[charIndex] = "";
        return {
          ...item,
          filledChars: nextFilled
        };
      }
      return item;
    }));

    setElimCandidates(prev => {
      let restored = false;
      return prev.map(c => {
        if (!restored && c.char === keyChar && c.isUsed) {
          restored = true;
          return { ...c, isUsed: false };
        }
        return c;
      });
    });
  };

  // --- PK Extreme Quiz Handlers ---
  const startNewPkQuestion = async () => {
    setIsLoadingPk(true);
    setPkSelectedOption(null);
    setPkIsCorrect(null);
    try {
      const response = await fetch(`/api/game/pk/question?grade=${profile.grade}`);
      if (response.ok) {
        const data = await response.json();
        setPkQuestion(data);
      } else {
        showToast("无法获取PK挑战题目，请重试哦！", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("网络开小差啦，请等下再试吧", "error");
    } finally {
      setIsLoadingPk(false);
    }
  };

  const handlePkChoice = (option: string) => {
    if (pkSelectedOption !== null) return;
    setPkSelectedOption(option);
    const correct = option === pkQuestion?.answer;
    setPkIsCorrect(correct);
    if (correct) {
      const nextStreak = pkStreak + 1;
      setPkStreak(nextStreak);
      const coinReward = nextStreak % 3 === 0 ? 10 : 2;
      updateProfile({
        score: profile.score + 5,
        coins: profile.coins + coinReward
      });
      showToast(nextStreak % 3 === 0 ? `🎉 连对 ${nextStreak} 局！奖励 10 金币！` : "回答正确！学成语又快又准！", "success");
    } else {
      setPkStreak(0);
      showToast("哎呀，答错啦，不要气馁，再接再厉！", "error");
    }
  };

  useEffect(() => {
    if (activeTab === 'pk' && !pkQuestion) {
      startNewPkQuestion();
    }
  }, [activeTab, profile.grade]);

  // --- AI Solitaire Game Handlers ---
  const [solitaireChoices, setSolitaireChoices] = useState<Array<{word: string, pinyin: string, definition: string, hint: string}>>([]);

  const handleStartSolitaire = async () => {
    if (solitaireChat.length > 0) return;
    setIsBotThinking(true);
    try {
      const response = await fetch(`/api/game/solitaire/start?grade=${profile.grade}`);
      if (response.ok) {
        const data = await response.json();
        setSolitaireChat([
          {
            id: "sys-1",
            sender: "system",
            word: "成语接龙游乐赛开始！",
            pinyin: "chéng yǔ jiē lóng",
            definition: "聪聪兔已经备齐了精美的接龙选项包！请根据成语释义和前提示，选一个你喜欢的词，点击立刻接龙！无需拼音键盘输入，快乐加倍！",
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: "bot-init",
            sender: "assistant",
            word: data.botWord,
            pinyin: data.pinyin,
            definition: data.definition,
            explanation: data.kidsExplanation,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setSolitaireChoices(data.choices || []);
      } else {
        showToast("聪聪兔还在拿书，加载接龙开局失败", "error");
      }
    } catch (e) {
      showToast("连接接龙星空出错啦", "error");
    } finally {
      setIsBotThinking(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'solitaire') {
      handleStartSolitaire();
    }
  }, [activeTab, profile.grade]);

  const handleResetSolitaire = () => {
    setSolitaireChat([]);
    setSolitaireChoices([]);
    setActiveSolitaireChoice(null);
    setTimeout(() => {
      // triggers start fresh
      handleStartSolitaire();
    }, 100);
  };

  const generateSolitaireBlankIndices = (word: string): number[] => {
    const len = word.length;
    if (len < 4) return [len - 1];
    
    const charSum = word.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const patternType = charSum % 3;
    
    if (patternType === 0) {
      return [1, 3]; // e.g. "人?不?"
    } else if (patternType === 1) {
      return [1, 2]; // e.g. "足??户"
    } else {
      return [2, 3]; // e.g. "一鸣??"
    }
  };

  const getWordWithBlanksForDisplay = (word: string): string => {
    const blankIndices = generateSolitaireBlankIndices(word);
    return word.split('').map((char, index) => {
      return blankIndices.includes(index) ? '？' : char;
    }).join('');
  };

  const startFillingSolitaireBlank = (choice: { word: string, pinyin: string, definition: string, hint: string }) => {
    const word = choice.word;
    const blankIndices = generateSolitaireBlankIndices(word);
    
    const initialFilled: { [key: number]: string } = {};
    blankIndices.forEach(idx => {
      initialFilled[idx] = '';
    });

    const correctChars = blankIndices.map(idx => word[idx]);
    const pool = "人心大小手足金木水火土日月山川花草出入内外高低天地上下一二三四五六七八九十百千万风云雷雨春夏秋冬红黄蓝绿白黑花叶".split('');
    const extraCount = Math.max(4, 8 - correctChars.length);
    const extraChars: string[] = [];
    
    while (extraChars.length < extraCount) {
      const char = pool[Math.floor(Math.random() * pool.length)];
      if (!correctChars.includes(char) && !extraChars.includes(char)) {
        extraChars.push(char);
      }
    }

    const candidates = [...correctChars, ...extraChars].sort(() => Math.random() - 0.5);

    setActiveSolitaireChoice({
      word: choice.word,
      pinyin: choice.pinyin,
      definition: choice.definition,
      hint: choice.hint,
      blankIndices,
      filledChars: initialFilled,
      candidates,
      focusedIndex: blankIndices[0]
    });
  };

  const handleSolitaireBubbleClick = (char: string) => {
    if (!activeSolitaireChoice) return;
    const { blankIndices, filledChars, focusedIndex } = activeSolitaireChoice;
    if (focusedIndex === null) return;

    const newFilled = { ...filledChars, [focusedIndex]: char };

    let nextFocus: number | null = null;
    for (const bIdx of blankIndices) {
      if (bIdx !== focusedIndex && !newFilled[bIdx]) {
        nextFocus = bIdx;
        break;
      }
    }
    if (nextFocus === null) {
      nextFocus = focusedIndex;
    }

    setActiveSolitaireChoice({
      ...activeSolitaireChoice,
      filledChars: newFilled,
      focusedIndex: nextFocus
    });
  };

  const handleSolitaireRetractSlot = (slotIndex: number) => {
    if (!activeSolitaireChoice) return;
    const { filledChars } = activeSolitaireChoice;
    const newFilled = { ...filledChars, [slotIndex]: '' };
    setActiveSolitaireChoice({
      ...activeSolitaireChoice,
      filledChars: newFilled,
      focusedIndex: slotIndex
    });
  };

  const handleValidateSolitaire = () => {
    if (!activeSolitaireChoice) return;
    const { word, blankIndices, filledChars } = activeSolitaireChoice;

    const hasEmpty = blankIndices.some(idx => !filledChars[idx]);
    if (hasEmpty) {
      showToast("请填满所有的空空哦！🔍", "info");
      return;
    }

    const isAllCorrect = blankIndices.every(idx => filledChars[idx] === word[idx]);

    if (isAllCorrect) {
      showToast("🎉 拼合全对！接龙连击成功！", "success");
      
      handleSelectSolitaireChoice({
        word: activeSolitaireChoice.word,
        pinyin: activeSolitaireChoice.pinyin,
        definition: activeSolitaireChoice.definition,
        hint: activeSolitaireChoice.hint
      });

      setActiveSolitaireChoice(null);
    } else {
      showToast("❌ 哎呀，拼法好像不对，请再核准调整哦！", "error");
    }
  };

  const handleSelectSolitaireChoice = async (choice: any) => {
    if (isBotThinking) return;

    // Display student choice message and dynamic "After Prompt (后提示)" feedback
    const timestampStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: SolitaireMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      word: choice.word,
      pinyin: choice.pinyin,
      definition: choice.definition,
      explanation: `【已选后提示】你非常棒，接出了成语: “${choice.word}”。意思：${choice.definition}`,
      timestamp: timestampStr
    };

    setSolitaireChat(prev => [...prev, userMsg]);
    setSolitaireChoices([]);
    setIsBotThinking(true);

    try {
      const response = await fetch('/api/game/solitaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWord: choice.word, grade: profile.grade })
      });

      if (response.ok) {
        const botAnswer = await response.json();
        setIsBotThinking(false);
        
        // Add bot answer
        setSolitaireChat(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          word: botAnswer.word,
          pinyin: botAnswer.pinyin,
          definition: botAnswer.definition,
          explanation: botAnswer.kidsExplanation,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }]);

        // Put choices for the user's next turn
        setSolitaireChoices(botAnswer.choices || []);

        // award profile score
        updateProfile({
          score: profile.score + 10,
          coins: profile.coins + 3,
          solitaireRecord: Math.max(profile.solitaireRecord, solitaireChat.filter(c => c.sender === 'user').length + 1)
        });
        showToast("接上了！学分+10 金币+3 💎", "success");
      } else {
        setIsBotThinking(false);
        showToast("聪聪兔被你的完美连招击败了！你赢啦！", "success");
      }
    } catch (e) {
      setIsBotThinking(false);
      showToast("智慧电波抖动了一下，请重试", "error");
    }
  };

  // Quick action: Learn an idiom directly from active view
  const flyToIdiom = (word: string) => {
    setActiveTab('home');
    setSearchQuery(word);
    loadIdiomDetail(word);
  };

  return (
    <div id="wx_game_app" className="flex flex-col min-h-screen items-center bg-slate-900 overflow-x-hidden py-0  md:py-4">
      {/* Simulation WeChat Container */}
      <main className="relative w-full max-w-md bg-[#EDF0F5] min-h-screen md:min-h-[840px] md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col justify-between border border-slate-700/30">
        
        {/* WX MiniProgram Top Header Bar */}
        <header className="bg-[#101014] text-white pt-6 pb-4 px-4 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-sm tracking-wider font-semibold">成语魔法袋 (WeChat Game)</span>
          </div>
          
          {/* Mock WeChat capsule menu button */}
          <div className="flex items-center bg-[#202024]/80 border border-slate-800 rounded-full px-3 py-1 space-x-3 text-white/90">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="h-4 w-[1px] bg-white/20"></div>
            {/* Circle inner dot icon */}
            <div className="w-3 h-3 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Global Floating Toast Pop */}
        {toast && (
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 text-sm text-white transition-all transform scale-100 ${
            toast.type === 'success' ? 'bg-[#22C55E]' : toast.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'
          }`}>
            {toast.type === 'success' && <Check className="w-4 h-4 text-white" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* --- Content View Area --- */}
        <section className="flex-1 overflow-y-auto pb-24">
          
          {/* Grade banner / Profile mini header on every tab */}
          <div className="mx-3 my-2.5 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg border-2 border-green-200 shadow-sm">
                🎓
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm flex items-center">
                  <span>{profile.name}</span>
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 font-bold rounded-md">
                    {profile.grade === 'elementary' ? '小学段' : profile.grade === 'middle' ? '初中段' : '高中段'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">连续签到 {profile.streak} 天</div>
              </div>
            </div>

            {/* Coins & Sign-in combo */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleCheckIn}
                disabled={profile.checkedInToday}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm ${
                  profile.checkedInToday 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 transform hover:scale-105 cursor-pointer'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{profile.checkedInToday ? '已签到' : '今日签到'}</span>
              </button>

              <div className="bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center space-x-1.5 font-bold shadow-sm">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs">{profile.coins}</span>
              </div>
            </div>
          </div>

                    {/* ==================== TAB 1: HOME (GLOSSARY & AI MNEMONIC CARDS) ==================== */}
          {activeTab === 'home' && (
            <div className="px-3 space-y-4">
              
              {/* Intelligent Mnemonic search bar */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                {/* Decorative float circles */}
                <span className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-white/10 rounded-full pointer-events-none"></span>
                <span className="absolute bottom-[-10px] left-[40%] w-16 h-16 bg-white/10 rounded-full pointer-events-none"></span>

                <h2 className="font-black text-lg tracking-wide mb-1 flex items-center space-x-1.5">
                  <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
                  <span>画里成语 · 一面即牢</span>
                </h2>
                <p className="text-xs text-green-50/90 leading-snug mb-3.5">
                  输入任意成语，让AI为你即时创作「看图记忆卡」与「近反义关系图」，助力一眼速记！
                </p>

                <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl p-1 shadow-inner relative z-10">
                  <div className="flex-1 flex items-center pl-2.5">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="输入任意四字成语，如：完璧归赵..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none pl-2 text-slate-800 text-sm placeholder-slate-400 py-2.5 font-medium"
                    />
                    
                    {/* Speech Recognition Mic Button */}
                    <button
                      type="button"
                      onClick={handleSpeechInput}
                      className={`mr-2 p-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                        isListening 
                          ? 'bg-rose-100 text-rose-600 animate-pulse scale-105 border border-rose-200' 
                          : 'text-slate-400 hover:text-green-600 hover:bg-slate-50'
                      }`}
                      title={isListening ? "正在倾听..." : "点击语音说成语"}
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoadingDetail}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center space-x-1 shrink-0 cursor-pointer"
                  >
                    <span>{isLoadingDetail ? '画作绘制中...' : 'AI画卡'}</span>
                  </button>
                </form>
              </div>

              {/* Recommended Curate grid (Elementary, Middle, High, beautifully color coded with dynamic database support) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5 font-sans">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span>课纲核心必考成语</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={fetchCuratedIdioms}
                      className="text-xs text-green-600 hover:text-green-700 font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>换一批</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase hidden sm:inline">| 点一点直接学</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(curatedIdioms.length > 0 ? curatedIdioms : DEFAULT_PRESET_WORDS.map(w => ({ word: w }))).map((item, idx) => (
                    <button
                      key={item.word}
                      onClick={() => handleCuratedClick(item.word)}
                      className={`px-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                        selectedIdiom?.word === item.word
                          ? 'bg-green-100 border-green-300 text-green-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{item.word}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Central Study Card Display */}
              {isLoadingDetail ? (
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
                  {/* Custom loader element */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">聪聪兔正在用AI灵感为您绘制插图...</p>
                    <p className="text-xs text-slate-400 mt-1">成语意境、白话讲解、近反义关联，一气呵成！</p>
                  </div>
                </div>
              ) : selectedIdiom ? (
                <div className="space-y-4">
                  {/* Primary visual flashcard frame */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/40 relative">
                    
                    {/* Grade indicator */}
                    <span className="absolute top-3 left-3 bg-slate-900/40 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full z-10 shadow-sm uppercase tracking-wider">
                      {selectedIdiom.category === 'elementary' ? '🌱 小学核心' : selectedIdiom.category === 'middle' ? '🔥 初中必背' : '🏔️ 高阶难点'}
                    </span>

                    {/* Highly curated memorable vector illustration */}
                    <div className="relative w-full aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      {selectedIdiom.illustration && (
                        <div 
                          className="w-full h-full text-slate-800"
                          dangerouslySetInnerHTML={{ __html: selectedIdiom.illustration }} 
                        />
                      )}
                    </div>

                    {/* Word explanation block */}
                    <div className="p-4 space-y-2.5">
                      <div className="text-center flex flex-col items-center justify-center space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <h1 className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                            {selectedIdiom.word}
                          </h1>
                          <button
                            id="btn-speak-main"
                            onClick={() => speakText(selectedIdiom.word)}
                            className="p-1 px-2.5 rounded-full bg-green-50 hover:bg-green-150 text-green-700 hover:text-green-800 transition-all cursor-pointer flex items-center space-x-1 border border-green-200/80 shadow-sm active:scale-95 text-[11px] font-black"
                            title="播放成语读音"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-green-600" />
                            <span>听发音</span>
                          </button>
                        </div>
                        <span className="text-sm font-bold text-slate-500 select-all">
                          {selectedIdiom.pinyin}
                        </span>
                      </div>

                      {/* Hard Definition */}
                      <div className="bg-slate-50 rounded-xl p-3 text-slate-705 text-xs leading-relaxed border border-slate-100 shadow-inner">
                        <span className="font-bold text-slate-900 block mb-0.5">📘 权威释义</span>
                        {selectedIdiom.definition}
                      </div>

                      {/* Mnemonic instant-memorability tip */}
                      <div className="bg-amber-50/80 rounded-xl p-3 text-slate-800 leading-normal border border-amber-100 shadow-sm relative">
                        <span className="font-extrabold text-[#D97706] text-xs flex items-center space-x-1 mb-1">
                          <Lightbulb className="w-4 h-4 fill-amber-300 text-amber-500 animate-pulse" />
                          <span>3秒速记口诀（小朋友一眼记牢）：</span>
                        </span>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed bg-white/70 rounded-lg p-2 border border-amber-100/30">
                          {selectedIdiom.mnemonic}
                        </p>
                      </div>

                      {/* Simplified Class analogy */}
                      <div className="bg-green-50/60 rounded-xl p-3 border border-green-100">
                        <span className="font-bold text-green-800 text-xs block mb-1">🧒 老师悄悄话（白话类比）：</span>
                        <p className="text-xs text-slate-650 leading-relaxed italic">
                          "{selectedIdiom.kidsExplanation}"
                        </p>
                      </div>

                      {/* --- Synonym & Antonym Network (Relational Learning) --- */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center space-x-1.5 mb-2 text-green-700 font-black text-xs">
                            <TrendingUp className="w-4 h-4" />
                            <span>记住更多：这些词意思相近 (近义词拼音卡片)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdiom.synonyms?.map((item: any) => {
                              const isObj = typeof item === 'object' && item !== null;
                              const word = isObj ? item.word : item;
                              const pinyin = isObj ? item.pinyin : "";
                              return (
                                <button
                                  key={word}
                                  onClick={() => handleCuratedClick(word)}
                                  className="bg-white hover:bg-green-50/20 border border-slate-200 hover:border-green-300 text-slate-755 rounded-xl px-2.5 py-1.5 min-w-[85px] text-xs font-bold flex flex-col items-center justify-center transition-all shadow-sm transform active:scale-95 cursor-pointer relative group"
                                >
                                  {pinyin && (
                                    <span className="text-[9px] text-green-600 font-bold font-mono tracking-tight leading-none mb-1 max-w-[85px] truncate">
                                      {pinyin}
                                    </span>
                                  )}
                                  <span className="text-xs font-black text-slate-800 flex items-center justify-center space-x-1 w-full">
                                    <span>{word}</span>
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakText(word);
                                      }}
                                      className="p-1 rounded-md bg-green-50/80 hover:bg-green-150 text-green-700 hover:text-green-800 transition-colors inline-flex items-center justify-center shadow-xs ml-0.5"
                                      title="语音播放"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center space-x-1.5 mb-2 text-rose-700 font-black text-xs">
                            <Shuffle className="w-4 h-4 rotate-90" />
                            <span>对比记忆：这些词意思相反 (反义词拼音卡片)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdiom.antonyms?.map((item: any) => {
                              const isObj = typeof item === 'object' && item !== null;
                              const word = isObj ? item.word : item;
                              const pinyin = isObj ? item.pinyin : "";
                              return (
                                <button
                                  key={word}
                                  onClick={() => handleCuratedClick(word)}
                                  className="bg-white hover:bg-rose-50/20 border border-slate-200 hover:border-rose-300 text-slate-755 rounded-xl px-2.5 py-1.5 min-w-[85px] text-xs font-bold flex flex-col items-center justify-center transition-all shadow-sm transform active:scale-95 cursor-pointer relative group"
                                >
                                  {pinyin && (
                                    <span className="text-[9px] text-rose-600 font-bold font-mono tracking-tight leading-none mb-1 max-w-[85px] truncate">
                                      {pinyin}
                                    </span>
                                  )}
                                  <span className="text-xs font-black text-slate-800 flex items-center justify-center space-x-1 w-full">
                                    <span>{word}</span>
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakText(word);
                                      }}
                                      className="p-1 rounded-md bg-rose-50/80 hover:bg-rose-150 text-rose-700 hover:text-rose-800 transition-colors inline-flex items-center justify-center shadow-xs ml-0.5"
                                      title="语音播放"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Historical story origin */}
                      {selectedIdiom.story && (
                        <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-650 leading-relaxed border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1.5">
                            <span className="font-bold text-slate-800 flex items-center space-x-1">
                              <span>⚔️</span>
                              <span>成语典故出处</span>
                            </span>
                            
                            <button
                              id="btn-play-story"
                              onClick={() => togglePlayStory(selectedIdiom.story)}
                              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all shadow-sm cursor-pointer ${
                                isPlayingStory 
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-250 animate-pulse' 
                                  : 'bg-green-150 text-green-800 hover:bg-green-200 border border-green-250'
                              }`}
                            >
                              <span>{isPlayingStory ? "⏹ 停止朗读" : "🔊 听兔兔讲故事"}</span>
                            </button>
                          </div>
                          
                          <p className="text-slate-700 text-xs tracking-wide leading-relaxed bg-white/60 p-2.5 rounded-lg border border-slate-200/50">
                            {selectedIdiom.story}
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-200 shadow-sm">
                  没有找到这个成语哦。快使用搜索框检索，让聪聪兔画给你看！
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: GUESS (看图猜成语 RIDDLE) ==================== */}
          {activeTab === 'guess' && (
            <div className="px-3 space-y-4">
              <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-md">
                <h2 className="font-black text-lg flex items-center space-x-1.5">
                  <Puzzle className="w-5 h-5" />
                  <span>看图猜成语 · 测测智慧</span>
                </h2>
                <p className="text-xs text-orange-50 leading-snug mt-1">
                  细心看一看AI绘制的精美卡通插图，你能拼接出是哪个成语吗？答对获取金币和学分哦！
                </p>
              </div>

              {isLoadingRiddle ? (
                <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-105 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <p className="font-bold text-slate-600 text-sm">聪聪兔正在随机抽出精美试题...</p>
                </div>
              ) : guessGame ? (
                <div className="space-y-4">
                  {/* Central stage card */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
                    
                    {/* Illustration Display block */}
                    <div className="relative w-full aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      <div 
                        className="w-full h-full text-slate-800"
                        dangerouslySetInnerHTML={{ __html: guessGame.illustration }} 
                      />
                    </div>

                    {/* Word spell placeholders slot */}
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-center text-slate-400 font-bold tracking-widest uppercase">点击下方字块将成语拼全：</p>
                      
                      <div className="flex justify-center items-center space-x-2.5">
                        {guessSelection.map((char, index) => (
                          <button
                            key={index}
                            onClick={() => handleBackspaceSelection(index)}
                            className={`w-14 h-14 rounded-2xl border-2 font-black text-xl flex items-center justify-center shadow-sm transform active:scale-95 transition-all ${
                              char 
                                ? 'bg-amber-100 border-amber-400 text-amber-800' 
                                : 'bg-slate-50 border-slate-300 text-slate-400 border-dashed hover:border-slate-400'
                            }`}
                          >
                            <span>{char}</span>
                          </button>
                        ))}
                      </div>

                      {/* Spell check feedback result banner */}
                      {isGuessCorrect !== null && (
                        <div className={`p-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold ${
                          isGuessCorrect ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-rose-100 border border-rose-200 text-rose-800'
                        }`}>
                          {isGuessCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-700 animate-bounce" />
                              <span>恭喜你，答对啦！快点看口诀，加深记忆！</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-700 animate-shake" />
                              <span>拼错啦！可以点击格子撤回，或者用金币买个提示哦。</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Dynamic Hint Toggle option */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3.5 border border-slate-100 shadow-inner">
                          <button
                            onClick={() => setShowGuessHint(!showGuessHint)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center space-x-1"
                          >
                            <Lightbulb className="w-3.5 h-3.5 animate-bounce" />
                            <span>{showGuessHint ? "隐藏提示" : "我想看一点解释/提示"}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (profile.coins < 10) {
                                showToast("金币不足10，请先签到或答题获取金币！", "error");
                                return;
                              }
                              updateProfile({ coins: profile.coins - 10 });
                              // Fill first empty slot automatically with correct answer
                              const firstEmpty = guessSelection.indexOf("");
                              if (firstEmpty !== -1) {
                                const correctChar = guessGame.word[firstEmpty];
                                handleCandidateClick(correctChar);
                                showToast("提示：买入一个正确汉字！金币-10 🪙", "info");
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1"
                          >
                            <span>金币神助攻 (-10 🪙)</span>
                          </button>
                        </div>

                        {showGuessHint && (
                          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-slate-800 text-xs leading-relaxed space-y-1">
                            <div><strong className="text-amber-800">📘 词义谜面：</strong>{guessGame.riddle}</div>
                            <div className="mt-1 leading-snug"><strong className="text-amber-850">🧒 场景类比：</strong>"{guessGame.kidsExplanation}"</div>
                          </div>
                        )}
                      </div>

                      {/* Scrambled candidates letter pool */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-4 gap-2.5">
                          {guessGame.candidates.map((char, index) => {
                            // check if this character is already completely utilized in selection arrays to optionally dim it
                            const occurrencesInSel = guessSelection.filter(c => c === char).length;
                            const occurrencesInTarget = guessGame.word.split('').filter(c => c === char).length;
                            const isSpent = occurrencesInSel >= occurrencesInTarget && occurrencesInSel > 0;

                            return (
                              <button
                                key={index}
                                onClick={() => handleCandidateClick(char)}
                                disabled={isSpent}
                                className={`h-12 rounded-xl font-bold text-base flex flex-col items-center justify-center transition-all shadow-sm ${
                                  isSpent
                                    ? "bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed"
                                    : "bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 active:scale-95 cursor-pointer font-black"
                                }`}
                              >
                                {char}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guess correct details and next level action */}
                  {isGuessCorrect && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-green-250 pb-2">
                        <span className="font-extrabold text-sm text-green-800 flex items-center space-x-1.5">
                          <span>🎯</span>
                          <span>拼字通关：学习卡片</span>
                        </span>
                        <div className="text-xs bg-green-200 text-green-900 px-2 py-0.5 rounded-full font-black font-mono">
                          {guessGame.pinyin}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1.5">
                        <p><strong className="text-green-800">💡 记忆口诀学一学：</strong> {guessGame.mnemonic}</p>
                        <p><strong className="text-green-800">🧒 解释读一读：</strong> {guessGame.kidsExplanation}</p>
                      </div>

                      <button
                        onClick={startNewGuessLevel}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm py-3 px-4 rounded-xl shadow-md transform active:scale-98 transition-all flex items-center justify-center space-x-2"
                      >
                        <span>下一关谜题接招！🚀</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-200 shadow-sm">
                  加载问题中...
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: MATCH GAME (成语括弧填空消消乐) ==================== */}
          {activeTab === 'elimination' && (
            <div className="px-3 space-y-4">
              <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <span className="absolute -right-6 -bottom-6 text-7xl opacity-15 select-none pointer-events-none">✨</span>
                <h2 className="font-black text-lg flex items-center space-x-1.5 relative z-10">
                  <Award className="w-5 h-5 text-yellow-350 fill-yellow-350 animate-bounce" />
                  <span>成语括弧填空消消乐</span>
                </h2>
                <p className="text-xs text-cyan-50 leading-snug mt-1 relative z-10 font-medium">
                  点击空白虚线框选中一张成语卡片，然后在下方汉字气泡中选择正确的字填空。组装完成，成语就会神奇消除哦！
                </p>
              </div>

              {isLoadingElim ? (
                <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin" />
                  <p className="font-bold text-slate-600 text-sm">正在为您精心布设汉字星球关卡...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Indicator */}
                  <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200/50 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-extrabold flex items-center space-x-1.5">
                      <span>🏆</span>
                      <span>本轮消消卡片进度：</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-indigo-600">{matchedElimCount} / 4</span>
                      <span className="text-xs text-slate-400 font-bold">已消去</span>
                    </div>
                  </div>

                  {matchedElimCount === 4 ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300 text-center space-y-4 shadow-sm"
                    >
                      <div className="inline-flex w-14 h-14 bg-green-100 text-green-700 font-bold items-center justify-center rounded-full text-3xl shadow-sm border border-green-250 animate-bounce">
                        🏆
                      </div>
                      <div>
                        <h4 className="font-black text-green-800 text-sm">太棒啦！成语通通被消灭消尽！</h4>
                        <p className="text-xs text-green-650 mt-1 leading-relaxed">
                          你真是一个了不起的汉字小英雄，完成了所有成语括弧填充并成功消灭了卡片！
                        </p>
                      </div>

                      <button
                        onClick={startNewMatchGame}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md inline-block transform hover:scale-[1.03]"
                      >
                        挑战下一关
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      {/* Main Elimination Board Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {elimIdioms.map((item) => {
                            if (item.isMatched) {
                              // Correct items fade away and disappear ("做对了就提示太棒了，然后消失")
                              return null;
                            }

                            const isActive = activeElimId === item.id;
                            const isShaking = shakingElimCardId === item.id;

                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ 
                                  scale: isShaking ? [1, 0.93, 1.05, 0.95, 1.02, 0.98, 1] : 1,
                                  opacity: 1,
                                  x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
                                }}
                                exit={{ scale: 0, opacity: 0, transition: { duration: 0.4 } }}
                                onClick={() => {
                                  if (!item.isMatched) {
                                    setActiveElimId(item.id);
                                  }
                                }}
                                className={`rounded-2xl p-4 border-2 shadow-sm text-center cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-amber-50/50 border-amber-400 ring-4 ring-amber-100'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300'
                                }`}
                              >
                                {/* Card Status Indicator */}
                                <div className="flex justify-between items-center mb-2">
                                  {isActive ? (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                                      <span>👉</span> <span>正在填补此词</span>
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                      点击可选此题
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono font-medium">{item.pinyin}</span>
                                </div>

                                {/* Characters Display Plate */}
                                <div className="flex justify-center items-center gap-2 mb-3 mt-1 py-2">
                                  {item.word.split('').map((char, index) => {
                                    const isBlank = item.blankIndices.includes(index);
                                    if (!isBlank) {
                                      // Regular immutable character
                                      return (
                                        <div 
                                          key={`${item.id}-char-${index}`}
                                          className="w-12 h-12 bg-indigo-50 border-2 border-indigo-100 rounded-xl flex items-center justify-center text-lg font-black text-indigo-900 shadow-sm"
                                        >
                                          {char}
                                        </div>
                                      );
                                    } else {
                                      // Mutable Blank bracket slot
                                      const filled = item.filledChars[index];
                                      return (
                                        <div
                                          key={`${item.id}-char-${index}`}
                                          onClick={(e) => {
                                            if (filled) {
                                              e.stopPropagation();
                                              handleRetractSlot(item.id, index);
                                            }
                                          }}
                                          className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                                            filled
                                              ? 'bg-amber-400 border-amber-500 text-white cursor-pointer hover:scale-105 active:scale-95'
                                              : 'bg-amber-50/50 border-dashed border-amber-300 text-amber-500 select-none text-xs'
                                          }`}
                                        >
                                          {filled || ''}
                                        </div>
                                      );
                                    }
                                  })}
                                </div>

                                {/* Kids Explanation / Hint below if active */}
                                {isActive && (
                                  <p className="text-[10px] text-slate-500 leading-normal border-t border-slate-100 pt-2 px-1 text-left">
                                    <strong>💡 解释提示：</strong>{item.kidsExplanation}
                                  </p>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Active Candidates Bubble Tray Floor */}
                      <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-slate-500 flex items-center space-x-1">
                            <span>🎈</span>
                            <span>拼字气泡库（点击气泡自动填入选中的括弧中）：</span>
                          </span>
                          
                          <button
                            onClick={startNewMatchGame}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-bold transition-all shadow-sm"
                          >
                            换一关 🌀
                          </button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                          {elimCandidates.map((cand) => {
                            return (
                              <button
                                key={cand.id}
                                onClick={() => handleElimCandidateClick(cand)}
                                disabled={cand.isUsed}
                                className={`py-3 rounded-full font-extrabold text-center text-lg border-2 select-none transition-all transform active:scale-90 shadow-sm ${
                                  cand.isUsed
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                                    : 'bg-white hover:bg-amber-50 border-indigo-200 text-indigo-950 hover:border-amber-400 cursor-pointer scale-100 hover:scale-105 shadow-inner'
                                }`}
                              >
                                {cand.char}
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[9px] text-slate-400 text-center font-bold">
                          小提示：如果填错了位置，也可以点击括弧里已填好的字进行「撤回拼字」哦！
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 6: PK QUIZ (最强成语之最PK) ==================== */}
          {activeTab === 'pk' && (
            <div className="px-3 flex flex-col space-y-4">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                {/* Floating shine particles */}
                <span className="absolute -right-6 -bottom-6 text-8xl opacity-15 select-none pointer-events-none">🏆</span>
                <h2 className="font-extrabold text-lg flex items-center space-x-1.5 relative z-10">
                  <Award className="w-5 h-5 text-yellow-200 fill-yellow-200 animate-spin-slow" />
                  <span>成语之最 · 最强超强大PK</span>
                </h2>
                <p className="text-xs text-yellow-50/90 leading-snug mt-1 relative z-10 font-medium">
                  发挥聪明大脑，脑筋大转弯！挑战那些充满夸张有趣的「最」字谜，看看你能冲到多少连胜纪录！
                </p>
              </div>

              {/* Stats Bar */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">当前PK大连胜</span>
                    <strong className="text-sm font-black text-amber-600">{pkStreak} 连胜</strong>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl px-3 py-1 border border-amber-200 flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-black text-amber-700">我的金币: {profile.coins}</span>
                </div>
              </div>

              {isLoadingPk ? (
                <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200/50 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-9 h-9 text-amber-500 animate-spin" />
                  <p className="font-bold text-slate-555 text-xs">聪聪兔正在出题PK中，请预备...</p>
                </div>
              ) : pkQuestion ? (
                <div className="space-y-4">
                  {/* Question Box Card */}
                  <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-3xl p-6 border-2 border-amber-300 shadow-sm text-center relative">
                    <span className="absolute top-2.5 left-3 bg-amber-400 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      第 {profile.puzzlesSolved + 1} 关 · 趣味之最
                    </span>

                    <span className="text-4xl block my-2.5">💡</span>
                    <span className="text-xs font-bold text-amber-800 tracking-wider">成语谜面：</span>
                    <h3 className="font-black text-lg text-slate-800 tracking-normal mt-1 mb-2">
                      “{pkQuestion.question}” 是哪个成语？
                    </h3>
                    <p className="text-[10.5px] text-amber-700 opacity-90 leading-relaxed max-w-[240px] mx-auto">
                      小提示：用来指代形容程度夸张达到极致的神秘成语，认真挑选哦！
                    </p>
                  </div>

                  {/* Options Selection Grid (4 choice layout) */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {pkQuestion.options.map((option, idx) => {
                      const isSelected = pkSelectedOption === option;
                      const isCorrectAnswer = option === pkQuestion.answer;
                      
                      let btnStyle = "bg-white border-slate-200 hover:bg-slate-50 text-slate-800 font-bold hover:border-amber-300";
                      
                      if (pkSelectedOption !== null) {
                        if (isCorrectAnswer) {
                          btnStyle = "bg-green-100 border-green-500 text-green-905 font-black shadow-sm ring-2 ring-green-200";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-100 border-rose-400 text-rose-905 font-black ring-2 ring-rose-200";
                        } else {
                          btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handlePkChoice(option)}
                          disabled={pkSelectedOption !== null}
                          className={`min-h-[75px] rounded-2xl p-3 border-2 text-center transition-all flex flex-col items-center justify-center transform active:scale-95 cursor-pointer relative ${btnStyle}`}
                        >
                          {pkSelectedOption !== null && isCorrectAnswer && (
                            <span className="absolute top-1.5 right-2 text-green-600">
                              <CheckCircle2 className="w-4 h-4 fill-white" />
                            </span>
                          )}
                          <span className="text-sm tracking-wide font-black block">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Block (Show after an answer is chosen) */}
                  {pkSelectedOption !== null && (
                    <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-3.5 animate-fadeIn">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white ${
                          pkIsCorrect ? 'bg-green-500' : 'bg-rose-500'
                        }`}>
                          {pkIsCorrect ? '✓' : '✗'}
                        </span>
                        <div>
                          <h4 className="font-black text-xs text-slate-800">
                            {pkIsCorrect ? '回答正确！你超级聪明！' : `答错啦，正确谜底是：${pkQuestion.answer}`}
                          </h4>
                          <span className="text-[10px] text-slate-450 block font-mono">{pkQuestion.pinyin}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] leading-relaxed text-slate-700 space-y-2">
                        <p>
                          <strong>🐰 聪聪兔趣味白话：</strong>
                          {pkQuestion.kidsExplanation}
                        </p>
                        {pkQuestion.fact && (
                          <div className="pt-2 border-t border-slate-200/50 text-slate-500 text-[10.5px]">
                            <strong>💡 知识小贴士：</strong>
                            {pkQuestion.fact}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={startNewPkQuestion}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 hover:scale-101 cursor-pointer"
                      >
                        <span>挑战下一关</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center space-y-3">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-xs text-slate-500">题库遇到了阻碍，让我们重试一下吧</p>
                  <button onClick={startNewPkQuestion} className="bg-amber-500 text-white text-xs px-4 py-2 rounded-xl">重试</button>
                </div>
              )}
            </div>
          )}



          {/* ==================== TAB 5: PROFILE (成长树 / 我的成就) ==================== */}
          {activeTab === 'profile' && (
            <motion.div 
              className="px-3 space-y-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              
              {/* Leveled Up Celebratory Interactive Shimmer Banner */}
              {showPromotionAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4.5 rounded-2xl shadow-lg border border-amber-400/60 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden"
                >
                  {/* Subtle Shimmer Ray */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />

                  <div className="flex items-center space-x-3.5 z-10 text-left">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-3xl shadow-inner shrink-0 animate-bounce" style={{ transformOrigin: "center", animationDuration: '2.5s' }}>
                      🎓
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-sm tracking-wide flex items-center space-x-1">
                        <span>功名晋升金榜题名！</span>
                        <span className="text-yellow-300 animate-pulse">✨</span>
                      </h4>
                      <p className="text-[10.5px] text-amber-50/95 mt-0.5 leading-snug">
                        恭贺您成功修得正果，荣获大儒功名【{getCurrentRank(profile.score).title}】级！
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 z-10 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        // Re-trigger the promotional medal popup with sound!
                        setPromotionBadge(getCurrentRank(profile.score));
                        playSuccessSound();
                      }}
                      className="bg-white hover:bg-yellow-100 text-amber-950 font-black text-[10.5px] px-3.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center space-x-1 cursor-pointer"
                    >
                      <span>🏆 授勋封赏</span>
                    </button>
                    <button
                      onClick={() => setShowPromotionAnimation(false)}
                      className="bg-amber-700/40 hover:bg-amber-700/65 text-amber-100 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      知道了
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Profile Card details */}
              {(() => {
                const currentRank = getCurrentRank(profile.score);
                const nextRankIdx = EXAM_RANKS.findIndex(r => r.title === currentRank.title) + 1;
                const nextRank = nextRankIdx < EXAM_RANKS.length ? EXAM_RANKS[nextRankIdx] : null;
                const progressPercent = currentRank.title === "状元" 
                  ? 100 
                  : Math.min(100, Math.max(0, ((profile.score - currentRank.minScore) / (currentRank.maxScore - currentRank.minScore)) * 100));

                return (
                  <>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/50 space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="flex flex-col items-center space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-12 h-12 bg-green-100 border border-green-200 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                            🧑‍🎓
                          </div>
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-lg border shadow-sm ${currentRank.bg} ${currentRank.color} ${currentRank.border} whitespace-nowrap`}>
                            {currentRank.badge} {currentRank.title}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h2 className="text-lg font-black text-slate-800">{profile.name}</h2>
                            <button 
                              onClick={() => {
                                const newName = window.prompt("取一个亮闪闪的新笔名吧！", profile.name);
                                if (newName && newName.trim()) {
                                  updateProfile({ name: newName.trim() });
                                }
                              }}
                              className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                            >
                              编辑名字
                            </button>
                          </div>
                          {/* Grade Selector Option */}
                          <div className="mt-1.5 flex items-center space-x-2.5">
                            <span className="text-[10px] text-slate-400 font-semibold">难易阶段：</span>
                            <select 
                              value={profile.grade} 
                              onChange={(e) => updateProfile({ grade: e.target.value as StudentGrade })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs px-2 py-0.5 font-bold outline-none cursor-pointer transition-all"
                            >
                              <option value="elementary">🌱 小学阶 (以字代拼)</option>
                              <option value="middle">🔥 初中阶 (核心中考词)</option>
                              <option value="high">🏔️ 高中阶 (文言词拓展)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                          <span className="text-slate-400 block text-[9.5px] font-bold">已解谜题</span>
                          <strong className="text-base text-slate-800 font-extrabold">{profile.puzzlesSolved} 道</strong>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                          <span className="text-slate-400 block text-[9.5px] font-bold">接龙记录</span>
                          <strong className="text-base text-slate-850 font-extrabold">{profile.solitaireRecord} 连</strong>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                          <span className="text-slate-400 block text-[9.5px] font-bold">成语学分</span>
                          <strong className="text-base text-green-700 font-extrabold">{profile.score} 分</strong>
                        </div>
                      </div>
                    </div>

                    {/* ==================== 「考功名」仕途升级系统卡片 ==================== */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/50 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-lg shadow-sm border border-indigo-150">
                            🎓
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">「考功名」考科举升级系统</h3>
                            <p className="text-[10px] text-slate-400">研习成语考取功名，显耀门楣步步高升</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black rounded-full border px-2.5 py-0.5 ${currentRank.bg} ${currentRank.color} ${currentRank.border}`}>
                          {currentRank.title}
                        </span>
                      </div>

                      {/* Level Progress Indicator */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-700 flex items-center space-x-1">
                            <span>仕途大考进度</span>
                            <span className="text-[9.5px] font-normal text-slate-400">({currentRank.title} 层阶)</span>
                          </span>
                          <span className="font-mono font-extrabold text-indigo-600">
                            {currentRank.title === "状元" ? "已达大满贯" : `${profile.score} / ${currentRank.maxScore} 学分`}
                          </span>
                        </div>

                        {/* Custom visual progress bar */}
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                          <motion.div 
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] leading-tight pt-1 gap-1">
                          <p className="text-slate-500 text-[10.5px] italic">
                            “{currentRank.desc}”
                          </p>
                          {nextRank ? (
                            <span className="text-indigo-600 font-extrabold text-[10.5px] whitespace-nowrap bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              晋升【{nextRank.title}】还需 {nextRank.minScore - profile.score} 学分
                            </span>
                          ) : (
                            <span className="text-amber-600 font-extrabold text-[10.5px] whitespace-nowrap bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-bounce">
                              👑 功德圆满，威震朝野！
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Examination Ranking Path / Road */}
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-extrabold text-slate-450 block">仕途功名七大阶梯：</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EXAM_RANKS.map((rank) => {
                            const isCurrent = currentRank.title === rank.title;
                            const isAchieved = profile.score >= rank.minScore;
                            const isLocked = profile.score < rank.minScore;

                            return (
                              <div 
                                key={rank.title}
                                className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                                  isCurrent 
                                    ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border-indigo-400 ring-2 ring-indigo-100/50 shadow-sm' 
                                    : isAchieved 
                                      ? 'bg-slate-50 border-slate-200/70 opacity-80' 
                                      : 'bg-slate-50/30 border-slate-100 opacity-55'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xl">{rank.badge}</span>
                                  {isCurrent ? (
                                    <span className="text-[8.5px] font-black tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded-md animate-pulse">
                                      当前功名
                                    </span>
                                  ) : isAchieved ? (
                                    <span className="text-emerald-600 text-[10px] font-extrabold flex items-center space-x-0.5">
                                      <span>✅</span>
                                      <span>已达成</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded-md">
                                      🔒 未达成
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2.5">
                                  <span className={`text-xs font-black block ${isCurrent ? 'text-indigo-900' : isAchieved ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {rank.title}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                    {rank.minScore === 500 ? "≥ 500" : `${rank.minScore}-${rank.maxScore - 1}`} 学分
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Study virtual badges container */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                  <Award className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                  <span>微信荣誉成语勋章</span>
                </h3>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className={`p-3 rounded-2xl border text-center transition-all ${
                    profile.streak >= 3 
                      ? 'bg-[#FEFCE8] border-yellow-300 text-yellow-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span className="text-2xl block mb-1">🔥</span>
                    <strong className="text-xs font-black block">持之以恒勋章</strong>
                    <span className="text-[9.5px] text-slate-450 mt-0.5 block">签到连续满3天</span>
                  </div>

                  <div className={`p-3 rounded-2xl border text-center transition-all ${
                    profile.score >= 50 
                      ? 'bg-[#F0FDF4] border-green-300 text-green-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span className="text-2xl block mb-1">🎓</span>
                    <strong className="text-xs font-black block">成语小神童</strong>
                    <span className="text-[9.5px] text-slate-450 mt-0.5 block">核心学分达到50分</span>
                  </div>

                  <div className={`p-3 rounded-2xl border text-center transition-all ${
                    profile.puzzlesSolved >= 1 
                      ? 'bg-[#E0F2FE] border-blue-300 text-blue-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span className="text-2xl block mb-1">🧩</span>
                    <strong className="text-xs font-black block">妙智神探奖</strong>
                    <span className="text-[9.5px] text-slate-450 mt-0.5 block">通关至少一次看图猜</span>
                  </div>

                  <div className={`p-3 rounded-2xl border text-center transition-all ${
                    profile.solitaireRecord >= 2 
                      ? 'bg-[#FDF2F8] border-pink-300 text-pink-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span className="text-2xl block mb-1">🐉</span>
                    <strong className="text-xs font-black block">接龙盟主杯</strong>
                    <span className="text-[9.5px] text-slate-450 mt-0.5 block">成语接龙达到2胜连击</span>
                  </div>
                </div>
              </div>

              {/* Study guide message for kids */}
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-150 flex items-start space-x-2.5">
                <span className="text-2xl">💡</span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-indigo-900 leading-none">聪聪兔给爸妈的信：</h4>
                  <p className="text-[11px] text-indigo-750 leading-relaxed">
                    成语魔法袋专为孩子提供趣味形象化的成语训练。推荐孩子每天玩 5 分钟，通过精美的AI矢量图产生「一眼速记」的物理联想，同时利用近反义词对仗连线，孩子记住的数量加倍，语感训练效果绝赞！
                  </p>
                </div>
              </div>

            </motion.div>
          )}

        </section>

        {/* --- WeChat bottom simulated tabbar (Tab Navigation) --- */}
        <nav className="bg-[#FCFCFC] border-t border-slate-200/70 absolute bottom-0 inset-x-0 h-20 shadow-lg px-2 py-2 flex items-center justify-around z-30">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'home' ? 'text-green-600 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-[10px]">学成语</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('guess');
              // Automatically reset/trigger riddle level
              if (!guessGame) startNewGuessLevel();
            }}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'guess' ? 'text-amber-500 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <Puzzle className="w-5 h-5 mb-1" />
            <span className="text-[10px]">看图猜</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('elimination');
              if (matchCards.length === 0) startNewMatchGame();
            }}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'elimination' ? 'text-indigo-600 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <Award className="w-5 h-5 mb-1" />
            <span className="text-[10px]">消消乐</span>
          </button>



          <button 
            onClick={() => {
              setActiveTab('pk');
              if (!pkQuestion) startNewPkQuestion();
            }}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'pk' ? 'text-amber-500 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <Award className="w-5 h-5 mb-1 text-amber-500 fill-amber-500" />
            <span className="text-[10px]">最强PK</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'profile' ? 'text-indigo-500 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px]">我的阁</span>
          </button>
        </nav>

        {/* ==================== 恭喜晋升精美勋章弹窗 ==================== */}
        <AnimatePresence>
          {promotionBadge && (
            <motion.div 
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-amber-200 p-6 flex flex-col items-center text-center relative"
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
              >
                {/* Rotating background light ray effect */}
                <div className="absolute inset-x-0 -top-12 h-48 overflow-hidden pointer-events-none select-none">
                  <motion.div 
                    className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.3)_0%,transparent_70%)] animate-pulse"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                {/* Confetti / spark particle lookalikes using divs and motions */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, idx) => {
                    const xRand = (idx % 3 === 0 ? -1 : 1) * (15 + (idx * 18) % 120);
                    const yRand = -40 - (idx * 25) % 180;
                    const colors = ['bg-amber-400', 'bg-red-400', 'bg-blue-400', 'bg-emerald-400', 'bg-purple-400'];
                    const col = colors[idx % colors.length];
                    return (
                      <motion.div
                        key={`con-p-${idx}`}
                        className={`absolute w-2 h-2 rounded-full ${col}`}
                        initial={{ x: 0, y: 150, scale: 0 }}
                        animate={{ 
                          x: xRand, 
                          y: yRand, 
                          scale: [0, 1.2, 0.8, 0],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ 
                          duration: 2.2, 
                          repeat: Infinity, 
                          repeatDelay: 0.8,
                          delay: idx * 0.15,
                          ease: "easeOut"
                        }}
                      />
                    );
                  })}
                </div>

                {/* Cute Header Ribbon */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full px-5 py-1.5 shadow-md flex items-center space-x-1.5 mb-5 z-10 border border-amber-300">
                  <span className="text-sm">🎉</span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-widest font-sans">喜报 · 功名晋升</span>
                  <span className="text-sm">🎉</span>
                </div>

                {/* Large Badge Medal Container with custom layout */}
                <div className="relative flex items-center justify-center w-36 h-36 mb-4 z-10">
                  <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-xl animate-pulse" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Inner glowing circle */}
                  <div className="w-28 h-28 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 border-4 border-amber-400 rounded-full flex flex-col items-center justify-center shadow-lg relative z-10">
                    <span className="text-5xl filter drop-shadow animate-bounce" style={{ animationDuration: '3s' }}>
                      {promotionBadge.badge}
                    </span>
                    <span className="text-amber-950 font-black text-sm tracking-wide mt-1 bg-amber-300/60 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {promotionBadge.title}
                    </span>
                  </div>

                  {/* Miniature support decorative star tags */}
                  <span className="absolute top-2 left-2 text-xl animate-spin" style={{ animationDuration: '6s' }}>⭐</span>
                  <span className="absolute bottom-2 right-2 text-xl animate-spin" style={{ animationDuration: '8s' }}>⭐</span>
                </div>

                {/* Congrats Message */}
                <div className="space-y-2 z-10 px-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    恭喜学童 <span className="text-indigo-600 font-black underline decoration-indigo-400 decoration-wavy decoration-2">{profile.name}</span>
                  </h3>
                  <p className="text-sm font-black text-amber-700">
                    荣升至仕途功名阶梯之：【{promotionBadge.title}】
                  </p>
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 leading-relaxed font-semibold">
                    <strong>📜 官职描述：</strong>"{promotionBadge.desc}"
                  </div>
                  <div className="text-[10px] text-slate-450 font-mono py-1">
                    当前成语总学分: <strong className="text-indigo-600 font-black">{profile.score} 分</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full mt-6 space-y-2.5 z-10">
                  <button
                    onClick={() => {
                      setPromotionBadge(null);
                      // Show celebration details or direct to profile page if not already there
                      setActiveTab('profile');
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm py-3 px-5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.98] transform flex items-center justify-center space-x-2"
                  >
                    <span>前往太学领册 📜</span>
                  </button>
                  <button
                    onClick={() => setPromotionBadge(null)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs py-2 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.98] transform"
                  >
                    先放进行囊放着 💼
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
