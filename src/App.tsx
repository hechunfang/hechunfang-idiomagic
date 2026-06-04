/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';

import { Idiom, SolitaireMessage, StudentProfile, StudentGrade, GameMode } from './types';

// Standard fallback if server fetch doesn't work or for initial loader helper
const DEFAULT_PRESET_WORDS = ["狐假虎威", "亡羊补牢", "画蛇添足", "叶公好龙"];

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

  // --- Synonym/Antonym Match Card Game State ---
  const [matchCards, setMatchCards] = useState<Array<{
    id: string;
    text: string;
    pairId: string;
    type: 'idiom' | 'relation';
    relationType: 'synonym' | 'antonym';
    isMatched: boolean;
  }>>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [shakingCardIds, setShakingCardIds] = useState<string[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);

  // --- AI Solitaire State ---
  const [solitaireChat, setSolitaireChat] = useState<SolitaireMessage[]>([]);
  const [userInputWord, setUserInputWord] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Load Initial Content ---
  useEffect(() => {
    fetchCuratedIdioms();
    // Auto load first idiom as presentation card so the page is never blank
    loadIdiomDetail("狐假虎威");
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

  // Handlers for Search Page
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    loadIdiomDetail(query);
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
      const response = await fetch(`/api/game/riddle?grade=${profile.grade}`);
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

  // --- Synonym Match Game Handlers ---
  const startNewMatchGame = async () => {
    setIsLoadingMatch(true);
    setMatchedPairsCount(0);
    setSelectedCardId(null);
    setShakingCardIds([]);
    try {
      const response = await fetch('/api/game/match-pair');
      if (response.ok) {
        const data = await response.json();
        setMatchCards(data.cards.map((c: any) => ({ ...c, isMatched: false })));
      } else {
        showToast("配对卡片生成失败", "error");
      }
    } catch (e) {
      showToast("获取配对卡片异常", "error");
    } finally {
      setIsLoadingMatch(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'elimination' && matchCards.length === 0) {
      startNewMatchGame();
    }
  }, [activeTab]);

  const handleCardClick = (card: any) => {
    if (card.isMatched) return;

    // First card selection
    if (!selectedCardId) {
      setSelectedCardId(card.id);
      return;
    }

    // click same card -> cancel select
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      return;
    }

    // Check with first card
    const firstCard = matchCards.find(c => c.id === selectedCardId);
    if (!firstCard) return;

    if (firstCard.pairId === card.pairId) {
      // MATCH!
      setMatchCards(prev => {
        return prev.map(c => {
          if (c.pairId === card.pairId) {
            return { ...c, isMatched: true };
          }
          return c;
        });
      });
      setSelectedCardId(null);
      const newMatchedCount = matchedPairsCount + 1;
      setMatchedPairsCount(newMatchedCount);

      // Check for win
      if (newMatchedCount === 4) {
        updateProfile({
          score: profile.score + 15,
          coins: profile.coins + 8
        });
        showToast("太棒了！消灭全部词汇，金币+8 🎉", "success");
      } else {
        showToast("配对成功！加深大记忆 💡", "success");
      }
    } else {
      // Shakes items as penalty
      setShakingCardIds([selectedCardId, card.id]);
      setSelectedCardId(null);
      setTimeout(() => {
        setShakingCardIds([]);
      }, 800);
      showToast("不是近义或反义配对哦，再想想！", "error");
    }
  };

  // --- AI Solitaire Game Handlers ---
  const handleStartSolitaire = () => {
    if (solitaireChat.length > 0) return;

    // Send initial introduction
    setSolitaireChat([
      {
        id: "sys-1",
        sender: "system",
        word: "成语接龙游戏开始！",
        pinyin: "chéng yǔ jiē lóng",
        definition: "小朋友，由聪聪兔开局。我说出一个成语，你接它的尾字（可拼音同音代替哦，非常宽松好玩！）。",
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: "bot-init",
        sender: "assistant",
        word: "狐假虎威",
        pinyin: "hú jiǎ hǔ wēi",
        definition: "狐狸依仗老虎的威风。尾字是‘威’，你可以报任何以‘wēi’或‘威’开头的成语哦！",
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  useEffect(() => {
    if (activeTab === 'solitaire') {
      handleStartSolitaire();
    }
  }, [activeTab]);

  const submitStudentSolitaireWord = async () => {
    const word = userInputWord.trim();
    if (!word) return;

    if (word.length !== 4) {
      showToast("接龙只能输入四个字的词汇哦！", "info");
      return;
    }

    // Add user message
    const timestampStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: SolitaireMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      word,
      pinyin: "拼音载入中",
      timestamp: timestampStr
    };

    setSolitaireChat(prev => [...prev, userMsg]);
    setUserInputWord('');
    setIsBotThinking(true);

    try {
      const response = await fetch('/api/game/solitaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWord: word, grade: profile.grade })
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

        // award profile score
        updateProfile({
          score: profile.score + 8,
          coins: profile.coins + 2,
          solitaireRecord: Math.max(profile.solitaireRecord, solitaireChat.filter(c => c.sender === 'user').length + 1)
        });
      } else {
        setIsBotThinking(false);
        showToast("聪聪兔被难倒了！或者网络打瞌睡了", "error");
      }
    } catch (e) {
      setIsBotThinking(false);
      showToast("网络连接异常，接龙超时", "error");
    }
  };

  const handleKeyPressSolitaire = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitStudentSolitaireWord();
    }
  };

  // Quick action: Learn an idiom directly from active view
  const flyToIdiom = (word: string) => {
    setActiveTab('home');
    setSearchQuery(word);
    loadIdiomDetail(word);
  };

  return (
    <div id="wx_game_app" class="flex flex-col min-h-screen items-center bg-slate-900 overflow-x-hidden py-0  md:py-4">
      {/* Simulation WeChat Container */}
      <main class="relative w-full max-w-md bg-[#EDF0F5] min-h-screen md:min-h-[840px] md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col justify-between border border-slate-700/30">
        
        {/* WX MiniProgram Top Header Bar */}
        <header class="bg-[#101014] text-white pt-6 pb-4 px-4 sticky top-0 z-30 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
            <span class="text-sm tracking-wider font-semibold">成语魔法袋 (WeChat Game)</span>
          </div>
          
          {/* Mock WeChat capsule menu button */}
          <div class="flex items-center bg-[#202024]/80 border border-slate-800 rounded-full px-3 py-1 space-x-3 text-white/90">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div class="h-4 w-[1px] bg-white/20"></div>
            {/* Circle inner dot icon */}
            <div class="w-3 h-3 border-2 border-white rounded-full flex items-center justify-center">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Global Floating Toast Pop */}
        {toast && (
          <div class={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 text-sm text-white transition-all transform scale-100 ${
            toast.type === 'success' ? 'bg-[#22C55E]' : toast.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'
          }`}>
            {toast.type === 'success' && <Check className="w-4 h-4 text-white" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* --- Content View Area --- */}
        <section class="flex-1 overflow-y-auto pb-24">
          
          {/* Grade banner / Profile mini header on every tab */}
          <div class="mx-3 my-2.5 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/50 flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg border-2 border-green-200 shadow-sm">
                🎓
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm flex items-center">
                  <span>{profile.name}</span>
                  <span class="ml-1.5 px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 font-bold rounded-md">
                    {profile.grade === 'elementary' ? '小学段' : profile.grade === 'middle' ? '初中段' : '高中段'}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 font-medium">连续签到 {profile.streak} 天</div>
              </div>
            </div>

            {/* Coins & Sign-in combo */}
            <div class="flex items-center space-x-2">
              <button 
                onClick={handleCheckIn}
                disabled={profile.checkedInToday}
                class={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm ${
                  profile.checkedInToday 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 transform hover:scale-105'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{profile.checkedInToday ? '已签到' : '今日签到'}</span>
              </button>

              <div class="bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center space-x-1.5 font-bold shadow-sm">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span class="text-xs">{profile.coins}</span>
              </div>
            </div>
          </div>

          {/* ==================== TAB 1: HOME (GLOSSARY & AI MNEMONIC CARDS) ==================== */}
          {activeTab === 'home' && (
            <div class="px-3 space-y-4">
              
              {/* Intelligent Mnemonic search bar */}
              <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                {/* Decorative float circles */}
                <span class="absolute top-[-20px] right-[-20px] w-28 h-28 bg-white/10 rounded-full pointer-events-none"></span>
                <span class="absolute bottom-[-10px] left-[40%] w-16 h-16 bg-white/10 rounded-full pointer-events-none"></span>

                <h2 class="font-black text-lg tracking-wide mb-1 flex items-center space-x-1.5">
                  <Sparkles class="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
                  <span>画里成语 · 一面即牢</span>
                </h2>
                <p class="text-xs text-green-50/90 leading-snug mb-3.5">
                  输入任意成语，让AI为你即时创作「看图记忆卡」与「近反义关系图」，助力一眼速记！
                </p>

                <form onSubmit={handleSearchSubmit} class="flex items-center bg-white rounded-xl p-1 shadow-inner relative z-10">
                  <div class="flex-1 flex items-center pl-2.5">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="输入任意四字成语，如：完璧归赵..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      class="w-full bg-transparent border-none outline-none pl-2 text-slate-800 text-sm placeholder-slate-400 py-2.5 font-medium"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoadingDetail}
                    class="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center space-x-1 shrink-0"
                  >
                    <span>{isLoadingDetail ? '画作绘制中...' : 'AI画卡'}</span>
                  </button>
                </form>
              </div>

              {/* Recommended Curate grid (Elementary, Middle, High, beautifully color coded) */}
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold text-slate-800 text-sm flex items-center space-x-1">
                    <BookOpen class="w-4 h-4 text-green-600" />
                    <span>课纲核心必考成语</span>
                  </h3>
                  <span class="text-[10px] text-slate-400 font-semibold uppercase">小朋友点一点直接学</span>
                </div>

                <div class="grid grid-cols-4 gap-2">
                  {DEFAULT_PRESET_WORDS.map((w, idx) => (
                    <button
                      key={w}
                      onClick={() => handleCuratedClick(w)}
                      class={`px-1 py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                        selectedIdiom?.word === w
                          ? 'bg-green-100 border-green-300 text-green-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{w}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Central Study Card Display */}
              {isLoadingDetail ? (
                <div class="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
                  {/* Custom loader element */}
                  <div class="relative w-16 h-16">
                    <div class="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div class="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div class="text-center">
                    <p class="font-bold text-slate-800 text-sm">聪聪兔正在用AI灵感为您绘制插图...</p>
                    <p class="text-xs text-slate-400 mt-1">成语意境、白话讲解、近反义关联，一气呵成！</p>
                  </div>
                </div>
              ) : selectedIdiom ? (
                <div class="space-y-4">
                  {/* Primary visual flashcard frame */}
                  <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/40 relative">
                    
                    {/* Grade indicator */}
                    <span class="absolute top-3 left-3 bg-slate-900/40 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full z-10 shadow-sm uppercase tracking-wider">
                      {selectedIdiom.category === 'elementary' ? '🌱 小学核心' : selectedIdiom.category === 'middle' ? '🔥 初中必背' : '🏔️ 高阶难点'}
                    </span>

                    {/* Highly curated memorable vector illustration */}
                    <div class="relative w-full aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      {selectedIdiom.illustration && (
                        <div 
                          className="w-full h-full text-slate-800"
                          dangerouslySetInnerHTML={{ __html: selectedIdiom.illustration }} 
                        />
                      )}
                    </div>

                    {/* Word explanation block */}
                    <div class="p-4 space-y-2.5">
                      <div class="text-center">
                        <h1 class="text-2xl font-black text-slate-900 tracking-wider font-mono">
                          {selectedIdiom.word}
                        </h1>
                        <span class="text-sm font-bold text-slate-500 select-all">
                          {selectedIdiom.pinyin}
                        </span>
                      </div>

                      {/* Hard Definition */}
                      <div class="bg-slate-50 rounded-xl p-3 text-slate-700 text-xs leading-relaxed border border-slate-100 shadow-inner">
                        <span class="font-bold text-slate-900 block mb-0.5">📘 权威释义</span>
                        {selectedIdiom.definition}
                      </div>

                      {/* Mnemonic instant-memorability tip */}
                      <div class="bg-amber-50/80 rounded-xl p-3 text-slate-800 leading-normal border border-amber-100 shadow-sm relative">
                        <span class="font-extrabold text-[#D97706] text-xs flex items-center space-x-1 mb-1">
                          <Lightbulb className="w-4 h-4 fill-amber-300 text-amber-500 animate-pulse" />
                          <span>3秒速记口诀（小朋友一眼记牢）：</span>
                        </span>
                        <p class="text-xs font-medium text-slate-700 leading-relaxed bg-white/70 rounded-lg p-2 border border-amber-100/30">
                          {selectedIdiom.mnemonic}
                        </p>
                      </div>

                      {/* Simplified Class analogy */}
                      <div class="bg-green-50/60 rounded-xl p-3 border border-green-100">
                        <span class="font-bold text-green-800 text-xs block mb-1">🧒 老师悄悄话（白话类比）：</span>
                        <p class="text-xs text-slate-600 leading-relaxed italic">
                          "{selectedIdiom.kidsExplanation}"
                        </p>
                      </div>

                      {/* --- Synonym & Antonym Network (Relational Learning) --- */}
                      <div class="pt-2 border-t border-slate-100 space-y-3">
                        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div class="flex items-center space-x-1.5 mb-2 text-green-700 font-bold text-xs">
                            <TrendingUp className="w-4 h-4" />
                            <span>记住更多：这些词意思相近 (近义词)</span>
                          </div>
                          <div class="flex flex-wrap gap-2">
                            {selectedIdiom.synonyms?.map((item: string) => (
                              <button
                                key={item}
                                onClick={() => handleCuratedClick(item)}
                                class="bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 rounded-lg py-1 px-2.5 text-[11px] font-bold flex items-center space-x-1 transition-all"
                              >
                                <span>{item}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div class="flex items-center space-x-1.5 mb-2 text-rose-700 font-bold text-xs">
                            <Shuffle className="w-4 h-4 rotate-90" />
                            <span>对比记忆：这些词意思相反 (反义/相对词)</span>
                          </div>
                          <div class="flex flex-wrap gap-2">
                            {selectedIdiom.antonyms?.map((item: string) => (
                              <button
                                key={item}
                                onClick={() => handleCuratedClick(item)}
                                class="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-800 rounded-lg py-1 px-2.5 text-[11px] font-bold flex items-center space-x-1 transition-all"
                              >
                                <span>{item}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Historical story origin */}
                      {selectedIdiom.story && (
                        <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-650 leading-relaxed border border-slate-100">
                          <span class="font-bold text-slate-800 block mb-0.5">⚔️ 成语典故出处</span>
                          {selectedIdiom.story}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ) : (
                <div class="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-200 shadow-sm">
                  没有找到这个成语哦。快使用搜索框检索，让聪聪兔画给你看！
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: GUESS (看图猜成语 RIDDLE) ==================== */}
          {activeTab === 'guess' && (
            <div class="px-3 space-y-4">
              <div class="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-md">
                <h2 class="font-black text-lg flex items-center space-x-1.5">
                  <Puzzle className="w-5 h-5" />
                  <span>看图猜成语 · 测测智慧</span>
                </h2>
                <p class="text-xs text-orange-50 leading-snug mt-1">
                  细心看一看AI绘制的精美卡通插图，你能拼接出是哪个成语吗？答对获取金币和学分哦！
                </p>
              </div>

              {isLoadingRiddle ? (
                <div class="bg-white rounded-2xl p-16 shadow-sm border border-slate-105 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <p class="font-bold text-slate-600 text-sm">聪聪兔正在随机抽出精美试题...</p>
                </div>
              ) : guessGame ? (
                <div class="space-y-4">
                  {/* Central stage card */}
                  <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
                    
                    {/* Illustration Display block */}
                    <div class="relative w-full aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      <div 
                        className="w-full h-full text-slate-800"
                        dangerouslySetInnerHTML={{ __html: guessGame.illustration }} 
                      />
                    </div>

                    {/* Word spell placeholders slot */}
                    <div class="p-4 space-y-4">
                      <p class="text-xs text-center text-slate-400 font-bold tracking-widest uppercase">点击下方字块将成语拼全：</p>
                      
                      <div class="flex justify-center items-center space-x-2.5">
                        {guessSelection.map((char, index) => (
                          <button
                            key={index}
                            onClick={() => handleBackspaceSelection(index)}
                            class={`w-14 h-14 rounded-2xl border-2 font-black text-xl flex items-center justify-center shadow-sm transform active:scale-95 transition-all ${
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
                        <div class={`p-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold ${
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
                      <div class="space-y-2.5">
                        <div class="flex justify-between items-center bg-slate-50 rounded-xl p-3.5 border border-slate-100 shadow-inner">
                          <button
                            onClick={() => setShowGuessHint(!showGuessHint)}
                            class="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center space-x-1"
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
                            class="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1"
                          >
                            <span>金币神助攻 (-10 🪙)</span>
                          </button>
                        </div>

                        {showGuessHint && (
                          <div class="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-slate-800 text-xs leading-relaxed space-y-1">
                            <div><strong class="text-amber-800">📘 词义谜面：</strong>{guessGame.riddle}</div>
                            <div class="mt-1 leading-snug"><strong class="text-amber-850">🧒 场景类比：</strong>"{guessGame.kidsExplanation}"</div>
                          </div>
                        )}
                      </div>

                      {/* Scrambled candidates letter pool */}
                      <div class="pt-2 border-t border-slate-100">
                        <div class="grid grid-cols-4 gap-2.5">
                          {guessGame.candidates.map((char, index) => {
                            // check if this character is already completely utilized in selection arrays to optionally dim it
                            const occurrencesInSel = guessSelection.filter(c => c === char).length;
                            const occurrencesInTarget = guessGame.word.split('').filter(c => c === char).length;
                            const isSpent = occurrencesInSel >= occurrencesInTarget && occurrencesInSel > 0;

                            return (
                              <button
                                key={`${char}-${index}`}
                                onClick={() => handleCandidateClick(char)}
                                disabled={isSpent || isGuessCorrect === true}
                                class={`py-3.5 rounded-xl font-bold text-center text-lg border transition-all transform active:scale-90 select-none shadow-sm ${
                                  isSpent 
                                    ? 'bg-slate-100 border-slate-150 text-slate-300 cursor-not-allowed opacity-50' 
                                    : 'bg-white hover:bg-amber-50 border-slate-200 text-slate-800 hover:border-amber-400 font-semibold'
                                }`}
                              >
                                {char}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div class="pt-2 flex space-x-3">
                        {isGuessCorrect === true && (
                          <button
                            onClick={() => flyToIdiom(guessGame.word)}
                            class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl text-xs font-bold text-center transition-all shadow-md transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>前往卡片 · 开启近反义词图</span>
                          </button>
                        )}

                        <button
                          onClick={startNewGuessLevel}
                          class="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-xl text-xs font-bold text-center transition-all shadow-md transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{isGuessCorrect === true ? "挑战下一关" : "换一道题"}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div class="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-200 shadow-sm">
                  暂无题目加载，请点击下方刷新按钮重试！
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: MATCH GAME (近义词反义词消消乐/对对碰) ==================== */}
          {activeTab === 'elimination' && (
            <div class="px-3 space-y-4">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
                <h2 class="font-black text-lg flex items-center space-x-1.5">
                  <Award className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span>近反义词对对碰 · 双倍收获</span>
                </h2>
                <p class="text-xs text-blue-50 leading-snug mt-1">
                  在这里，成语卡片散落一地。每两张卡片具有【近义】或【反义】关系。请点击匹配，扩展大词汇网！
                </p>
              </div>

              {isLoadingMatch ? (
                <div class="bg-white rounded-2xl p-16 shadow-sm border border-slate-105 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p class="font-bold text-slate-600 text-sm">正在布设成语网络方阵里...</p>
                </div>
              ) : (
                <div class="space-y-4">
                  {/* Progress Indicator */}
                  <div class="bg-white rounded-xl p-3 shadow-sm border border-slate-200/50 flex justify-between items-center">
                    <span class="text-xs text-slate-500 font-semibold uppercase">当前进度配对：</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-black text-indigo-600">{matchedPairsCount} / 4</span>
                      <span class="text-xs text-slate-400">对</span>
                    </div>
                  </div>

                  {/* Matching grid 4x2 matrix */}
                  <div class="grid grid-cols-2 gap-3.5">
                    {matchCards.map((card) => {
                      const isSelected = selectedCardId === card.id;
                      const isShaking = shakingCardIds.includes(card.id);

                      return (
                        <button
                          key={card.id}
                          onClick={() => handleCardClick(card)}
                          disabled={card.isMatched}
                          className={`min-h-[110px] rounded-2xl p-4 flex flex-col items-center justify-center border-2 text-center transition-all transform shadow-sm relative ${
                            card.isMatched
                              ? 'bg-slate-100 border-slate-200 text-slate-350 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-800 scale-102 ring-2 ring-indigo-200 font-extrabold shadow-md'
                              : isShaking
                              ? 'bg-rose-50 border-rose-400 text-rose-800 animate-shake'
                              : 'bg-white hover:bg-indigo-50/20 border-slate-200/70 text-slate-800 font-semibold hover:border-indigo-300'
                          }`}
                        >
                          {/* Matched state graphic indicator */}
                          {card.isMatched && (
                            <span class="absolute top-2 right-2 text-green-500">
                              <CheckCircle2 className="w-5 h-5 fill-white" />
                            </span>
                          )}

                          <span class="text-sm tracking-wide font-black block mb-1">
                            {card.text.split(' ')[0]}
                          </span>

                          {/* Detail of relation text */}
                          {card.text.includes(' ') && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              card.text.includes('近义') ? 'bg-green-150 text-green-700' : 'bg-rose-150 text-rose-700'
                            }`}>
                              {card.text.split(' ')[1]}
                            </span>
                          )}

                          <span class="text-[9px] text-slate-400 block mt-1">
                            {card.isMatched ? '已归属网联' : card.type === 'idiom' ? '核心主成语' : '配对连线项'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Complete win state block */}
                  {matchedPairsCount === 4 && (
                    <div class="bg-green-50 rounded-2xl p-5 border border-green-200 text-center space-y-3.5">
                      <div class="inline-flex w-12 h-12 bg-green-100 text-green-750 font-bold items-center justify-center rounded-full text-2xl shadow-sm border border-green-200">
                        🏆
                      </div>
                      <div>
                        <h4 class="font-black text-green-800 text-sm">恭喜小朋友！成语关系网络全部连通！</h4>
                        <p class="text-xs text-green-650 mt-1">
                          你成功理解了《狐假虎威》《亡羊补牢》《画蛇添足》《叶公好龙》等必考词汇的外延拓展。
                        </p>
                      </div>

                      <button
                        onClick={startNewMatchGame}
                        class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md inline-block transform hover:scale-105"
                      >
                        再战一局
                      </button>
                    </div>
                  )}

                  {/* footer restart banner */}
                  {matchedPairsCount < 4 && (
                    <button
                      onClick={startNewMatchGame}
                      class="w-full bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold text-xs py-3.5 rounded-xl transition-all text-center flex items-center justify-center space-x-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>遇到困难？重新生成一关成语对对碰</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: SOLITAIRE (AI 聪聪兔成语接龙) ==================== */}
          {activeTab === 'solitaire' && (
            <div class="px-3 flex flex-col space-y-4">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-md">
                <h2 class="font-black text-lg flex items-center space-x-1.5">
                  <Bot className="w-5 h-5" />
                  <span>聪聪兔 AI 接龙大作战</span>
                </h2>
                <p class="text-xs text-orange-50/90 leading-snug mt-1">
                  和全能聪聪兔展开回合制接龙！同音字接龙即可算数。看看你的连击次数能挑战到多少吧！
                </p>
              </div>

              {/* Chat screen module */}
              <div class="bg-white rounded-2xl border border-slate-200/50 shadow-sm flex flex-col h-[340px] overflow-hidden">
                <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  
                  {solitaireChat.map((msg) => {
                    const isBot = msg.sender === 'assistant' || msg.sender === 'system';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} class="flex justify-center">
                          <span class="bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-inner">
                            {msg.word} {msg.definition}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} items-start space-x-2.5`}>
                        {isBot && (
                          <div class="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-lg shadow-sm shrink-0">
                            🐰
                          </div>
                        )}

                        <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs space-y-1.5 relative ${
                          isBot 
                            ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200' 
                            : 'bg-emerald-600 text-white rounded-tr-sm font-semibold'
                        }`}>
                          <div class="flex items-center justify-between space-x-4">
                            <span class="font-black text-base tracking-wide">{msg.word}</span>
                            <span class="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                          </div>

                          {msg.pinyin && <p class="text-[10px] opacity-80 font-bold">{msg.pinyin}</p>}
                          
                          {/* Bot rich properties */}
                          {msg.definition && (
                            <div className={`mt-2 p-2 rounded-lg text-[10.5px] leading-relaxed border ${
                              isBot ? 'bg-slate-50 text-slate-650 border-slate-100' : 'bg-emerald-700 text-emerald-100 border-emerald-500'
                            }`}>
                              <strong>📘 意思：</strong>{msg.definition}
                            </div>
                          )}

                          {msg.explanation && (
                            <p class="text-[10.5px] text-slate-600 italic bg-amber-50 rounded-lg p-2 border border-amber-100">
                              🐰 {msg.explanation}
                            </p>
                          )}
                        </div>

                        {!isBot && (
                          <div class="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-lg shadow-sm shrink-0 font-bold">
                            学
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Loading / Thinking Bot Bubble */}
                  {isBotThinking && (
                    <div class="flex justify-start items-center space-x-2.5 animate-pulse">
                      <div class="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-lg">
                        🐰
                      </div>
                      <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3.5 shadow-sm text-xs text-slate-500 flex items-center space-x-2">
                        {/* Loader dots */}
                        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        <span class="font-medium text-[10px] pl-1 text-slate-400">聪聪兔翻书查找中...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input panel block inside chat border */}
                <div class="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                  <input 
                    type="text"
                    maxLength={4}
                    placeholder="输入四字成语接龙..."
                    value={userInputWord}
                    onChange={(e) => setUserInputWord(e.target.value.replace(/[^\u4e00-\u9fa5]/g, ''))}
                    onKeyDown={handleKeyPressSolitaire}
                    disabled={isBotThinking}
                    class="flex-1 bg-slate-105 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-bold text-slate-750 text-sm placeholder-slate-400 focus:border-emerald-400 focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    onClick={submitStudentSolitaireWord}
                    disabled={isBotThinking || !userInputWord.trim()}
                    class="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </div>

              {/* High score box solitaire stats */}
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 flex justify-between items-center text-xs">
                <span class="text-slate-500 font-semibold mb-0.5 block">当前成语接龙统计：</span>
                <div class="flex items-center space-x-4">
                  <div>
                    <span class="text-slate-400 block text-[10px]">我的回合数</span>
                    <strong class="text-sm font-black text-slate-800">{solitaireChat.filter(c => c.sender === 'user').length} 次合</strong>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px]">历史最长佳绩</span>
                    <strong class="text-sm font-black text-rose-600">{profile.solitaireRecord} 连击</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: PROFILE (成长树 / 我的成就) ==================== */}
          {activeTab === 'profile' && (
            <div class="px-3 space-y-4">
              
              {/* Profile Card details */}
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/50 space-y-4">
                <div class="flex items-center space-x-3">
                  <div class="w-14 h-14 bg-green-150 border-2 border-green-300 rounded-2xl flex items-center justify-center text-3xl shadow-md">
                    🧑‍🎓
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <h2 class="text-lg font-black text-slate-800">{profile.name}</h2>
                      <button 
                        onClick={() => {
                          const newName = window.prompt("取一个亮闪闪的新笔名吧！", profile.name);
                          if (newName && newName.trim()) {
                            updateProfile({ name: newName.trim() });
                          }
                        }}
                        class="text-[10px] text-indigo-600 font-extrabold hover:underline"
                      >
                        编辑名字
                      </button>
                    </div>
                    {/* Grade Selector Option */}
                    <div class="mt-1 flex items-center space-x-2.5">
                      <span class="text-[10px] text-slate-450 font-semibold">难易阶段：</span>
                      <select 
                        value={profile.grade} 
                        onChange={(e) => updateProfile({ grade: e.target.value as StudentGrade })}
                        class="bg-slate-100 hover:bg-slate-200 text-slate-755 border border-slate-200 rounded-lg text-xs px-2 py-0.5 font-bold outline-none cursor-pointer transition-all"
                      >
                        <option value="elementary">🌱 小学阶 (以字代拼)</option>
                        <option value="middle">🔥 初中阶 (核心中考词)</option>
                        <option value="high">🏔️ 高中阶 (文言词拓展)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                  <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                    <span class="text-slate-400 block text-[9.5px] font-bold">已解谜题</span>
                    <strong class="text-base text-slate-800 font-extrabold">{profile.puzzlesSolved} 道</strong>
                  </div>
                  <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                    <span class="text-slate-400 block text-[9.5px] font-bold">接龙记录</span>
                    <strong class="text-base text-slate-850 font-extrabold">{profile.solitaireRecord} 连</strong>
                  </div>
                  <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 rounded-xl border border-slate-200/20">
                    <span class="text-slate-400 block text-[9.5px] font-bold">成语学分</span>
                    <strong class="text-base text-green-700 font-extrabold">{profile.score} 分</strong>
                  </div>
                </div>
              </div>

              {/* Study virtual badges container */}
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 space-y-3">
                <h3 class="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                  <Award className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                  <span>微信荣誉成语勋章</span>
                </h3>

                <div class="grid grid-cols-2 gap-3.5">
                  <div class={`p-3 rounded-2xl border text-center transition-all ${
                    profile.streak >= 3 
                      ? 'bg-[#FEFCE8] border-yellow-300 text-yellow-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span class="text-2xl block mb-1">🔥</span>
                    <strong class="text-xs font-black block">持之以恒勋章</strong>
                    <span class="text-[9.5px] text-slate-450 mt-0.5 block">签到连续满3天</span>
                  </div>

                  <div class={`p-3 rounded-2xl border text-center transition-all ${
                    profile.score >= 50 
                      ? 'bg-[#F0FDF4] border-green-300 text-green-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span class="text-2xl block mb-1">🎓</span>
                    <strong class="text-xs font-black block">成语小神童</strong>
                    <span class="text-[9.5px] text-slate-450 mt-0.5 block">核心学分达到50分</span>
                  </div>

                  <div class={`p-3 rounded-2xl border text-center transition-all ${
                    profile.puzzlesSolved >= 1 
                      ? 'bg-[#E0F2FE] border-blue-300 text-blue-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span class="text-2xl block mb-1">🧩</span>
                    <strong class="text-xs font-black block">妙智神探奖</strong>
                    <span class="text-[9.5px] text-slate-450 mt-0.5 block">通关至少一次看图猜</span>
                  </div>

                  <div class={`p-3 rounded-2xl border text-center transition-all ${
                    profile.solitaireRecord >= 2 
                      ? 'bg-[#FDF2F8] border-pink-300 text-pink-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}>
                    <span class="text-2xl block mb-1">🐉</span>
                    <strong class="text-xs font-black block">接龙盟主杯</strong>
                    <span class="text-[9.5px] text-slate-450 mt-0.5 block">成语接龙达到2胜连击</span>
                  </div>
                </div>
              </div>

              {/* Study guide message for kids */}
              <div class="bg-indigo-50 rounded-2xl p-4 border border-indigo-150 flex items-start space-x-2.5">
                <span class="text-2xl">💡</span>
                <div class="space-y-1">
                  <h4 class="font-extrabold text-xs text-indigo-900 leading-none">聪聪兔给爸妈的信：</h4>
                  <p class="text-[11px] text-indigo-750 leading-relaxed">
                    成语魔法袋专为孩子提供趣味形象化的成语训练。推荐孩子每天玩 5 分钟，通过精美的AI矢量图产生「一眼速记」的物理联想，同时利用近反义词对仗连线，孩子记住的数量加倍，语感训练效果绝赞！
                  </p>
                </div>
              </div>

            </div>
          )}

        </section>

        {/* --- WeChat bottom simulated tabbar (Tab Navigation) --- */}
        <nav class="bg-[#FCFCFC] border-t border-slate-200/70 absolute bottom-0 inset-x-0 h-20 shadow-lg px-2 py-2 flex items-center justify-around z-30">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'home' ? 'text-green-600 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span class="text-[10px]">学成语</span>
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
            <span class="text-[10px]">看图猜</span>
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
            <span class="text-[10px]">配配看</span>
          </button>

          <button 
            onClick={() => setActiveTab('solitaire')}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'solitaire' ? 'text-teal-600 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span class="text-[10px]">接龙赛</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center flex-1 transition-all py-1.5 ${
              activeTab === 'profile' ? 'text-indigo-500 scale-102 font-bold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span class="text-[10px]">我的阁</span>
          </button>
        </nav>

      </main>
    </div>
  );
}
