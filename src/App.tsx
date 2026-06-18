/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Volume2,
  Check,
  AlertCircle,
  Sparkles,
  User,
  ChevronRight,
  Settings,
  Trash2
} from 'lucide-react';

import { StudentProfile, StudentGrade } from './types';
import { getPKQuestionByGrade, PK_QUESTIONS_DATABASE } from './idioms_database';

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
      name: "挑战之星 ⭐",
      grade: 'elementary',
      score: 10,
      coins: 30,
      streak: 1,
      checkedInToday: false,
      unlockedStorybook: [],
      puzzlesSolved: 0,
      solitaireRecord: 0
    };
  });

  const updateProfile = (updater: Partial<StudentProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updater };
      
      if (updater.score !== undefined && updater.score !== prev.score) {
        const prevRank = getCurrentRank(prev.score);
        const nextRank = getCurrentRank(next.score);
        if (nextRank.title !== prevRank.title && next.score > prev.score) {
          setPromotionBadge(nextRank);
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
    setTimeout(() => setToast(null), 2500);
  };

  // --- PK Game State ---
  const [pkQuestion, setPkQuestion] = useState<{
    question: string;
    answer: string;
    pinyin: string;
    kidsExplanation: string;
    fact: string;
    options: string[];
  } | null>(null);

  const [pkCharQuestion, setPkCharQuestion] = useState<{
    blankIdiom: string;
    blankIndex: number;
    correctChar: string;
    charOptions: string[];
  } | null>(null);

  const [pkSelectedOption, setPkSelectedOption] = useState<string | null>(null);
  const [pkIsCorrect, setPkIsCorrect] = useState<boolean | null>(null);
  const [pkStreak, setPkStreak] = useState<number>(0);
  const [isLoadingPk, setIsLoadingPk] = useState<boolean>(false);
  const [promotionBadge, setPromotionBadge] = useState<ExamRank | null>(null);
  const [pkSeenAnswers, setPkSeenAnswers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wx_pk_seen_answers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // --- Answer Rich Details (Fetched upon selection to reveal the details) ---
  const [pkAnswerDetail, setPkAnswerDetail] = useState<{
    word: string;
    pinyin: string;
    definition: string;
    mnemonic?: string;
    story?: string;
  } | null>(null);
  const [isPlayingStory, setIsPlayingStory] = useState<boolean>(false);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  // --- Notebook ("我的生词本") & Settings States ---
  const [wrongWords, setWrongWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wx_wrong_words');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [reviewMode, setReviewMode] = useState<boolean>(() => {
    return localStorage.getItem('wx_review_mode') === 'true';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const addWrongWord = (word: string) => {
    if (!word) return;
    setWrongWords(prev => {
      if (prev.includes(word)) return prev;
      const next = [word, ...prev];
      localStorage.setItem('wx_wrong_words', JSON.stringify(next));
      return next;
    });
  };

  const removeWrongWord = (word: string) => {
    setWrongWords(prev => {
      const next = prev.filter(w => w !== word);
      localStorage.setItem('wx_wrong_words', JSON.stringify(next));
      return next;
    });
  };

  const toggleReviewMode = (val: boolean) => {
    setReviewMode(val);
    localStorage.setItem('wx_review_mode', String(val));
    if (val) {
      showToast("🔄 已开启复习模式，将优先为您抽取出错成语！", "info");
    } else {
      showToast("⚔️ 已切回标准挑战大PK模式！", "info");
    }
    startNewPkQuestion(false, val);
  };

  // Sound Effects Handlers
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
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
        const utterance = new SpeechSynthesisUtterance("答对啦");
        utterance.lang = 'zh-CN';
        utterance.rate = 1.3;
        utterance.pitch = 1.3;
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

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("您的浏览器暂不支持语音功能哦！", "error");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const togglePlayStory = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("您的浏览器暂不支持故事朗读哦！", "error");
      return;
    }

    if (isPlayingStory) {
      window.speechSynthesis.cancel();
      setIsPlayingStory(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.95; 
      utterance.pitch = 1.1; 

      utterance.onend = () => setIsPlayingStory(false);
      utterance.onerror = () => setIsPlayingStory(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingStory(true);
      showToast("📣 正在为您朗读成语故事...", "success");
    }
  };

  // --- Persist seen answers to localStorage ---
  useEffect(() => {
    localStorage.setItem('wx_pk_seen_answers', JSON.stringify(pkSeenAnswers));
  }, [pkSeenAnswers]);

  // --- Load First PK Level ---
  useEffect(() => {
    setPkQuestion(null);
    setPkCharQuestion(null);
    startNewPkQuestion();
  }, [profile.grade]);

  // --- Check and Generate Character Fill-in-the-Blank for Higher Grades ---
  useEffect(() => {
    if (!pkQuestion) {
      setPkCharQuestion(null);
      return;
    }

    // Double check that the active question actually belongs to the current grade's pool
    // to prevent race conditions or carry-overs when switching grade difficulties
    const currentPool = PK_QUESTIONS_DATABASE[profile.grade] || PK_QUESTIONS_DATABASE['elementary'];
    const belongsToCurrentPool = currentPool.some(q => q.answer === pkQuestion.answer);
    if (!belongsToCurrentPool) {
      setPkCharQuestion(null);
      return;
    }

    if (profile.grade === 'elementary') {
      const correctAnswer = pkQuestion.answer;
      // Choose variable index to blank out
      const blankIndex = Math.floor(Math.random() * correctAnswer.length);
      const correctChar = correctAnswer[blankIndex] || '';

      const blankIdiom = correctAnswer.split('').map((char, index) =>
        index === blankIndex ? '【 】' : char
      ).join('');

      const candidates = new Set<string>();
      if (correctChar) {
        candidates.add(correctChar);
      }

      // Fill from same position in other option idioms
      for (const opt of pkQuestion.options) {
        if (opt !== correctAnswer && opt[blankIndex]) {
          candidates.add(opt[blankIndex]);
        }
      }

      // Add common characters if candidates size < 3
      const distractorPool = "金碧辉煌风华正茂山高水长世外桃源理直气壮一心一意画龙点睛九牛一毛";
      let poolIdx = 0;
      while (candidates.size < 3 && poolIdx < distractorPool.length) {
        candidates.add(distractorPool[poolIdx]);
        poolIdx++;
      }

      // Shuffle final options
      const charOptions = Array.from(candidates).slice(0, 3).sort(() => Math.random() - 0.5);

      setPkCharQuestion({
        blankIdiom,
        blankIndex,
        correctChar,
        charOptions
      });
    } else {
      setPkCharQuestion(null);
    }
  }, [pkQuestion, profile.grade]);

  // --- Fetch Next PK Quiz ---
  const startNewPkQuestion = async (overrideReset?: boolean, overrideReviewMode?: boolean) => {
    setIsLoadingPk(true);
    setPkSelectedOption(null);
    setPkIsCorrect(null);
    setPkAnswerDetail(null);
    setIsPlayingStory(false);
    setIsCardFlipped(false);
    try {
      window.speechSynthesis?.cancel();

      const currentGrade = profile.grade;
      const pool = PK_QUESTIONS_DATABASE[currentGrade] || PK_QUESTIONS_DATABASE['elementary'];
      const poolAnswers = pool.map(q => q.answer);

      let nextAnswer = "";
      let isReviewQuestion = false;

      const activeReviewMode = overrideReviewMode !== undefined ? overrideReviewMode : reviewMode;

      // Prioritize wrong words belonging to current grade first, or any wrong words in general
      if (activeReviewMode && wrongWords.length > 0) {
        const gradeWrongWords = wrongWords.filter(w => poolAnswers.includes(w));
        if (gradeWrongWords.length > 0) {
          nextAnswer = gradeWrongWords[Math.floor(Math.random() * gradeWrongWords.length)];
          isReviewQuestion = true;
        } else {
          nextAnswer = wrongWords[Math.floor(Math.random() * wrongWords.length)];
          isReviewQuestion = true;
        }
      }

      if (isReviewQuestion && nextAnswer) {
        // Look up details for review question
        let selectedQuestion = pool.find(q => q.answer === nextAnswer) || 
                               (Object.values(PK_QUESTIONS_DATABASE) as any[]).flat().find((q: any) => q.answer === nextAnswer) || 
                               pool[0];

        // Attempt to load from high-fidelity AI API
        try {
          const res = await fetch(`/api/game/pk/question?grade=${currentGrade}&exclude=${pkSeenAnswers.slice(-10).join(",")}&word=${encodeURIComponent(nextAnswer)}`);
          if (res.ok) {
            const apiQ = await res.json();
            if (apiQ && apiQ.answer === nextAnswer) {
              selectedQuestion = apiQ;
            }
          }
        } catch (err) {
          console.warn("Using offline fallback for PK question:", err);
        }

        setPkQuestion(selectedQuestion);

      } else {
        const queueKey = `wx_pk_queue_${currentGrade}`;
        const savedQueue = localStorage.getItem(queueKey);
        let queue: string[] = [];
        try {
          queue = savedQueue ? JSON.parse(savedQueue) : [];
        } catch (e) {
          queue = [];
        }

        // Filter queue down to what is valid in the pool
        queue = queue.filter(ans => poolAnswers.includes(ans));

        // If overrideReset or queue is empty, we rebuild/reshuffle the queue!
        if (overrideReset || queue.length === 0) {
          if (queue.length === 0 && savedQueue !== null) {
            showToast("🌟 本阶所有挑战已悉数攻克！聪聪兔正在为您重整题库开启新一轮挑战！", "info");
          }
          
          // Shuffle the pool of answers
          const shuffled = [...poolAnswers].sort(() => Math.random() - 0.5);
          
          // Avoid starting the new cycle with the exact same question the user is currently looking at
          if (pkQuestion && shuffled.length > 1 && shuffled[0] === pkQuestion.answer) {
            const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
            const temp = shuffled[0];
            shuffled[0] = shuffled[swapIdx];
            shuffled[swapIdx] = temp;
          }
          
          queue = shuffled;
        }

        // Pop the first question from the queue
        nextAnswer = queue[0];
        const remainingQueue = queue.slice(1);
        
        // Save remaining queue back to localStorage
        localStorage.setItem(queueKey, JSON.stringify(remainingQueue));

        // Lookup the question details
        let selectedQuestion = pool.find(q => q.answer === nextAnswer) || pool[0];

        // Attempt to load from high-fidelity AI API
        try {
          const res = await fetch(`/api/game/pk/question?grade=${currentGrade}&exclude=${pkSeenAnswers.slice(-10).join(",")}&word=${encodeURIComponent(nextAnswer)}`);
          if (res.ok) {
            const apiQ = await res.json();
            if (apiQ && apiQ.answer === nextAnswer) {
              selectedQuestion = apiQ;
            }
          }
        } catch (err) {
          console.warn("Using offline fallback for PK question:", err);
        }

        setPkQuestion(selectedQuestion);

        // Save into pkSeenAnswers for visual history / compatibility
        setPkSeenAnswers(prev => {
          if (prev.includes(nextAnswer)) return prev;
          const nextSeen = [...prev, nextAnswer];
          localStorage.setItem('wx_pk_seen_answers', JSON.stringify(nextSeen));
          return nextSeen;
        });
      }

    } catch (e) {
      console.error(e);
      showToast("出题失败，请重试！", "error");
    } finally {
      setIsLoadingPk(false);
    }
  };

  // --- Handle Choice Selection ---
  const handlePkChoice = async (option: string) => {
    if (pkSelectedOption !== null) return;
    setPkSelectedOption(option);
    
    const isCharQuiz = profile.grade === 'elementary' && pkCharQuestion;
    const correct = isCharQuiz 
      ? option === pkCharQuestion.correctChar 
      : option === pkQuestion?.answer;
    setPkIsCorrect(correct);

    const correctAnswer = pkQuestion?.answer || '';
    if (correctAnswer) {
      setPkSeenAnswers(prev => {
        if (prev.includes(correctAnswer)) return prev;
        return [...prev, correctAnswer];
      });
    }
    
    // Trigger sound alerts
    if (correct) {
      playSuccessSound();
      const nextStreak = pkStreak + 1;
      setPkStreak(nextStreak);
      const coinReward = nextStreak % 3 === 0 ? 10 : 2;
      updateProfile({
        score: profile.score + 5,
        coins: profile.coins + coinReward,
        puzzlesSolved: profile.puzzlesSolved + 1
      });
      
      let toastMsg = nextStreak % 3 === 0 ? `🔥 连挑对 ${nextStreak} 局！大赏 10 金币！` : "回答正确！才高八斗！";
      
      if (wrongWords.includes(correctAnswer)) {
        removeWrongWord(correctAnswer);
        toastMsg = `🎉 复习成功！将《${correctAnswer}》学懂并移出生词本！`;
      }
      
      showToast(toastMsg, "success");
    } else {
      playFailureSound();
      setPkStreak(0);
      if (correctAnswer) {
        addWrongWord(correctAnswer);
      }
      showToast("可惜答错啦！已记入生词本，记得加倍复习！", "error");
    }

    if (pkQuestion) {
      setPkAnswerDetail({
        word: correctAnswer,
        pinyin: pkQuestion.pinyin,
        definition: pkQuestion.definition,
        mnemonic: pkQuestion.mnemonic,
        story: pkQuestion.story
      });
    }
  };

  const handleCheckIn = () => {
    if (profile.checkedInToday) return;
    updateProfile({
      coins: profile.coins + 5,
      streak: profile.streak + 1,
      checkedInToday: true
    });
    showToast("📝 签到成功！奖励金币 +5", "success");
  };

  const changeGrade = (val: StudentGrade) => {
    updateProfile({ grade: val });
    showToast(`📚 已切换为您对应的学习难度阶层`, "info");
  };

  const handleRename = () => {
    const newName = window.prompt("给自己起一个炫酷的求学笔名吧：", profile.name);
    if (newName && newName.trim()) {
      updateProfile({ name: newName.trim() });
      showToast("笔名修改成功！", "success");
    }
  };

  // ---仕途大考 Rank computation ---
  const currentRank = getCurrentRank(profile.score);
  const nextRankIdx = EXAM_RANKS.findIndex(r => r.title === currentRank.title) + 1;
  const nextRank = nextRankIdx < EXAM_RANKS.length ? EXAM_RANKS[nextRankIdx] : null;
  const progressPercent = currentRank.title === "状元" 
    ? 100 
    : Math.min(100, Math.max(0, ((profile.score - currentRank.minScore) / (currentRank.maxScore - currentRank.minScore)) * 100));

  const currentPool = PK_QUESTIONS_DATABASE[profile.grade] || PK_QUESTIONS_DATABASE['elementary'];
  const isQuestionValidForGrade = pkQuestion ? currentPool.some(q => q.answer === pkQuestion.answer) : false;

  return (
    <div id="wx_game_app" className="flex flex-col min-h-screen items-center bg-slate-900 pb-8 sm:py-4 selection:bg-amber-100 font-sans">
      
      {/* Simulation WeChat Container */}
      <main className="relative w-full max-w-md bg-[#F4F6F9] min-h-screen md:min-h-[850px] md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col justify-between border border-slate-800">
        
        {/* WeChat Mini-Program Capsule Header */}
        <header className="bg-[#121216] text-white pt-6 pb-4 px-4 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]"></span>
            <span className="text-xs sm:text-sm tracking-wider font-extrabold text-amber-100 font-sans">最强成语大PK 👑</span>
          </div>
          
          {/* Classic WeChat Capsule Controls */}
          <div className="flex items-center bg-[#1F1F24] border border-slate-800 rounded-full px-2.5 py-1 space-x-3 text-white/85">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="h-3 w-[1px] bg-slate-700"></div>
            <div className="w-2.5 h-2.5 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Global Floating Notification Pop */}
        {toast && (
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 text-xs font-black text-white transition-all transform scale-100 border/10 ${
            toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400' : toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400'
          }`}>
            {toast.type === 'success' && <Check className="w-3.5 h-3.5" />}
            {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Inner Content Component (Pure single-screen PK interface) */}
        <section className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 pb-12">
          
          {/* Student Status Profile Badge Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center justify-center bg-amber-50 p-1.5 rounded-xl border border-amber-100 shadow-inner relative">
                <span className="text-xl filter drop-shadow">🧑‍🎓</span>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 border border-white text-[8px] px-1 rounded-md font-black">
                  {currentRank.title}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-sm text-slate-800 line-clamp-1">{profile.name}</span>
                  <button onClick={handleRename} className="text-[10px] text-indigo-500 hover:underline font-bold">重命名</button>
                </div>
                <div className="text-[10.5px] mt-0.5 font-bold text-slate-450">
                  已战过 <span className="text-slate-800">{profile.puzzlesSolved}</span> 关 · 连对记录 {profile.streak} 天
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Checkin button */}
              <button 
                onClick={handleCheckIn}
                disabled={profile.checkedInToday}
                className={`py-1 px-2.5 rounded-xl text-[10.5px] font-black transition-all flex items-center space-x-1 shadow-sm ${
                  profile.checkedInToday 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 hover:shadow transform active:scale-95 cursor-pointer'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{profile.checkedInToday ? '已签' : '签到+5'}</span>
              </button>

              {/* Coins banner */}
              <div className="bg-yellow-50 text-amber-700 px-2.5 py-1.5 rounded-xl border border-yellow-200/70 flex items-center space-x-1 font-bold shadow-sm">
                <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-black">{profile.coins}</span>
              </div>

              {/* Settings / Notebook trigger */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 px-2 h-[28px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:text-indigo-650 font-black text-[11px] transition-all flex items-center space-x-0.5 cursor-pointer active:scale-95 transform shadow-sm"
                title="我的生词本"
              >
                <Settings className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-[10px]">生词本</span>
              </button>
            </div>
          </div>

          {/* Banner & Stage difficulty picker */}
          <div className="bg-gradient-to-r from-indigo-950 via-[#1e1b4b] to-indigo-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
            <span className="absolute -right-6 -bottom-6 text-7xl opacity-10 select-none pointer-events-none">🤺</span>
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-0.5">
                <h2 className="font-black text-sm tracking-wide text-indigo-100 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                  <span>趣味之最大擂台</span>
                </h2>
                <p className="text-[10px] text-indigo-200/90 leading-normal max-w-[210px]">
                  用“最”字谜趣猜成语！答对即刻解密爆笑白话典故与生动插画，好记好学！
                </p>
              </div>

              {/* Step difficulties combo box */}
              <div className="flex flex-col items-end space-y-1">
                <span className="text-[9px] text-indigo-300 font-extrabold uppercase">挑战难度设定</span>
                <select 
                  value={profile.grade}
                  onChange={(e) => changeGrade(e.target.value as StudentGrade)}
                  className="bg-indigo-800/80 hover:bg-indigo-700 border border-indigo-600/70 text-indigo-50 font-black rounded-lg text-[10.5px] px-2 py-1 outline-none cursor-pointer transition-all focus:ring-1 focus:ring-amber-300"
                >
                  <option value="elementary">🌱 小学 (以字词猜意)</option>
                  <option value="middle">🔥 初中 (核心必考词)</option>
                  <option value="high">🏔️ 高中 (文言大拓展)</option>
                  <option value="university">🎓 大学 (国学大通识)</option>
                </select>
              </div>
            </div>
          </div>

          {/* PK Combo Streak Header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔥</span>
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold block leading-none">当前连对局</span>
                  <span className="text-sm font-black text-amber-600 mt-1 block">{pkStreak} 连胜</span>
                </div>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 font-black px-1.5 py-0.5 rounded-full">
                PK秀
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎖️</span>
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold block leading-none">当前功名星</span>
                  <span className="text-sm font-black text-indigo-600 mt-1 block">{profile.score} 分</span>
                </div>
              </div>
              <span className={`text-[10px] font-black rounded-full border px-1.5 py-0.5 ${currentRank.bg} ${currentRank.color} ${currentRank.border}`}>
                {currentRank.title}
              </span>
            </div>
          </div>

          {/* Main PK Quiz Arena Container */}
          {isLoadingPk || !isQuestionValidForGrade ? (
            <div className="bg-white rounded-2xl p-16 shadow-inner border border-slate-200/50 flex flex-col items-center justify-center space-y-3.5">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="font-extrabold text-slate-500 text-xs tracking-wider">
                聪聪兔翻阅古汉书籍出题中...
              </p>
            </div>
          ) : pkQuestion ? (
            <div className="space-y-4">
              
              {/* Optional inline Review Toggle bar */}
              <div className="flex items-center justify-between p-2.5 px-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🔄</span>
                  <div className="text-left">
                    <span className="text-[11px] font-black text-indigo-950 block">复习巩固模式</span>
                    <span className="text-[9.5px] text-slate-500 block leading-none mt-0.5">优先复习错题本（答对即自动移出）</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 border ${
                    wrongWords.length > 0 
                      ? 'text-amber-700 bg-amber-50 border-amber-200' 
                      : 'text-slate-400 bg-slate-100 border-slate-200'
                  }`}>
                    {wrongWords.length} 生词
                  </span>
                  {/* Modern Toggle Switch */}
                  <button 
                    onClick={() => {
                      if (wrongWords.length === 0 && !reviewMode) {
                        showToast("💡 您的生词本目前还是空的，答错题目时会自动记录在这里哦！", "info");
                        return;
                      }
                      toggleReviewMode(!reviewMode);
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reviewMode ? 'bg-indigo-650' : 'bg-slate-350'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        reviewMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Question Screen Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-sky-350 shadow-sm relative overflow-hidden">
                <span className="absolute top-2 left-2 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-indigo-200/60 shadow-inner">
                  第 {profile.puzzlesSolved + 1} 关 {reviewMode && <span className="text-indigo-600 font-extrabold ml-1">· 复习中 🔄</span>}
                </span>

                <div className="text-center pt-2">
                  <span className="text-3xl block filter drop-shadow">❓</span>
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-widest block mt-2 uppercase">【趣味成语之最谜面】</span>
                  <h3 className="font-extrabold text-[16px] sm:text-[18px] text-slate-900 mt-1 mb-1 leading-snug">
                    “{pkQuestion.question}”
                  </h3>
                  {pkCharQuestion ? (
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[280px] mx-auto mb-1.5">
                      认真推敲谜面，挑出下方最合适的单字补全以下成语！
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[280px] mx-auto">
                      请在下方4个成语选项中，精准挑出与其意境最符合的正确成语！
                    </p>
                  )}

                  {/* Elegant interactive fill-in-the-blank block for elementary kids */}
                  {pkCharQuestion && (
                    <div className="mt-3 p-3 bg-amber-50/65 border border-amber-200/60 rounded-xl flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">补全以下成语：</span>
                      <div className="flex items-center space-x-1.5">
                        {pkQuestion.answer.split('').map((char, charIdx) => {
                          const isBlank = charIdx === pkCharQuestion.blankIndex;
                          if (isBlank) {
                            return (
                              <div 
                                key={charIdx} 
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black border-2 border-dashed ${
                                  pkSelectedOption !== null 
                                    ? pkIsCorrect 
                                      ? 'bg-green-100 border-green-500 text-green-700 animate-bounce' 
                                      : 'bg-rose-100 border-rose-500 text-rose-700'
                                    : 'bg-white border-amber-400 text-amber-550 animate-pulse'
                                }`}
                              >
                                {pkSelectedOption !== null ? pkCharQuestion.correctChar : "?"}
                              </div>
                            );
                          }
                          return (
                            <div key={charIdx} className="w-10 h-10 rounded-xl bg-indigo-50/50 border border-slate-200/80 flex items-center justify-center text-xl font-bold text-slate-800 shadow-sm">
                              {char}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Choices Selection List */}
              {pkCharQuestion ? (
                <div className="grid grid-cols-3 gap-3">
                  {pkCharQuestion.charOptions.map((option, idx) => {
                    const isSelected = pkSelectedOption === option;
                    const isCorrectChar = option === pkCharQuestion.correctChar;
                    
                    let btnStyle = "bg-white border-slate-200 hover:bg-amber-50 text-slate-800 font-extrabold hover:border-amber-300 transform active:scale-95";
                    
                    if (pkSelectedOption !== null) {
                      if (isCorrectChar) {
                        btnStyle = "bg-green-100 border-green-550 text-green-900 font-extrabold ring-4 ring-green-100";
                      } else if (isSelected) {
                        btnStyle = "bg-rose-100 border-rose-500 text-rose-900 font-extrabold ring-4 ring-rose-100 animate-shake";
                      } else {
                        btnStyle = "bg-slate-50 border-slate-200/50 text-slate-400 opacity-55 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePkChoice(option)}
                        disabled={pkSelectedOption !== null}
                        style={{ transition: 'all 0.15s ease' }}
                        className={`h-14 rounded-2xl border-2 text-center flex flex-col items-center justify-center relative cursor-pointer ${btnStyle}`}
                      >
                        {pkSelectedOption !== null && isCorrectChar && (
                          <span className="absolute top-1 right-2 text-green-600 animate-bounce">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-white" />
                          </span>
                        )}
                        <span className="text-lg font-black block">{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {pkQuestion.options.map((option, idx) => {
                    const isSelected = pkSelectedOption === option;
                    const isCorrectAnswer = option === pkQuestion.answer;
                    
                    let btnStyle = "bg-white border-slate-200 hover:bg-amber-50 text-slate-800 font-extrabold hover:border-amber-300 transform active:scale-95";
                    
                    if (pkSelectedOption !== null) {
                      if (isCorrectAnswer) {
                        btnStyle = "bg-green-100 border-green-550 text-green-900 font-extrabold ring-4 ring-green-100";
                      } else if (isSelected) {
                        btnStyle = "bg-rose-100 border-rose-500 text-rose-900 font-extrabold ring-4 ring-rose-100 animate-shake";
                      } else {
                        btnStyle = "bg-slate-50 border-slate-200/50 text-slate-400 opacity-55 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePkChoice(option)}
                        disabled={pkSelectedOption !== null}
                        style={{ transition: 'all 0.15s ease' }}
                        className={`min-h-[70px] rounded-2xl p-2.5 border-2 text-center flex flex-col items-center justify-center relative cursor-pointer ${btnStyle}`}
                      >
                        {pkSelectedOption !== null && isCorrectAnswer && (
                          <span className="absolute top-1.5 right-2 text-green-600 animate-bounce">
                            <CheckCircle2 className="w-4 h-4 fill-white" />
                          </span>
                        )}
                        <span className="text-[13px] tracking-wide block">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Dynamic explanations drawer and beautiful illust card (Opens immediately on choice) */}
              {pkSelectedOption !== null && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
                  
                  {/* Status announcement indicator */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm ${
                      pkIsCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
                    }`}>
                      {pkIsCorrect ? '✓' : '✗'}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {pkIsCorrect ? '回答正确！真棒！' : `答错啦，正确答案是：${pkQuestion.answer}`}
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10.5px] text-slate-450 font-semibold font-mono tracking-wide">{pkQuestion.pinyin}</span>
                        <button 
                          onClick={() => speakText(pkQuestion.answer)}
                          className="p-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-500 transition-all cursor-pointer"
                          title="听发音"
                        >
                          <Volume2 className="w-3 h-3 text-slate-650" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3-sec quick mnemonic card */}
                  {profile.grade === 'elementary' && pkAnswerDetail?.mnemonic && (
                    <div className="bg-[#FEFCE8] border border-yellow-200 rounded-xl p-3 shadow-inner relative">
                      <span className="font-extrabold text-amber-800 text-[11px] flex items-center space-x-1 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 fill-amber-300 text-amber-500 animate-pulse shrink-0" />
                        <span>3秒一眼速记口诀：</span>
                      </span>
                      <p className="text-[11px] font-bold text-slate-700 leading-snug bg-white/70 rounded-lg p-2 border border-yellow-100/40">
                        {pkAnswerDetail.mnemonic}
                      </p>
                    </div>
                  )}

                  {/* Explanatory insights integrated into a beautiful '成语翻转卡片' */}
                  <div className="w-full py-1">
                    <div 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="relative w-full min-h-[200px] cursor-pointer group [perspective:1000px] select-none"
                    >
                      <div 
                        className="relative w-full min-h-[200px] duration-500 ease-out transition-transform"
                        style={{
                          transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        {/* Front Side: 释义 (Explanation) */}
                        <div 
                          className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-205 rounded-2xl p-4 flex flex-col justify-between shadow-sm"
                          style={{ 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <div className="space-y-2.5 text-left">
                            <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2">
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <span>💡 成语释义卡</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold flex items-center space-x-1">
                                <span>点击正面可翻转 ↺</span>
                              </span>
                            </div>

                            <div className="pt-1">
                              <h5 className="font-extrabold text-[15px] text-slate-800 flex items-center space-x-1.5">
                                <span>{pkQuestion.answer}</span>
                                <span className="text-xs text-slate-450 font-mono font-semibold">({pkQuestion.pinyin})</span>
                              </h5>
                              
                              {profile.grade === 'elementary' ? (
                                <div className="mt-2 space-y-2">
                                  <p className="text-[11px] text-slate-650 leading-relaxed">
                                    <strong className="text-amber-700 font-black">🐰 聪聪兔白话解释：</strong>
                                    {pkQuestion.kidsExplanation}
                                  </p>
                                  {pkQuestion.fact && (
                                    <p className="text-[10px] text-slate-500 border-t border-slate-205 pt-2 leading-relaxed">
                                      <strong className="text-slate-700">💡 趣闻巧懂：</strong>
                                      {pkQuestion.fact}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2.5">
                                  <p className="text-[11px] text-slate-650 leading-relaxed">
                                    <strong className="text-indigo-950 font-black">📖 字面释义：</strong>
                                    {pkQuestion.definition || "该成语由经典语境精简凝练而来，富有哲理与智慧。"}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                                    随着科举等级提升，词汇考纲正不断精进。多积累典籍，打磨成语根底。
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-center text-[10px] text-indigo-500 font-extrabold border-t border-slate-200/40 pt-2.5 mt-2 flex items-center justify-center space-x-1">
                            <span>点击此卡片，翻转通往「故事典故」秘境 🪄</span>
                          </div>
                        </div>

                        {/* Back Side: 故事典故 (Story Allusion & Voice Actor) */}
                        <div 
                          className="absolute inset-0 w-full h-full bg-[#FCFBF7] border border-amber-200 rounded-2xl p-4 flex flex-col justify-between shadow-md"
                          style={{ 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden', 
                            transform: 'rotateY(180deg)' 
                          }}
                        >
                          <div className="space-y-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                              <span className="text-[10px] font-extrabold text-amber-801 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                <span>📖 完整历史典故传说</span>
                              </span>
                              <button
                                onClick={() => togglePlayStory(pkAnswerDetail?.story || pkQuestion.story || '')}
                                className={`p-1 px-3 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 text-[9.5px] font-black shadow-sm ${
                                  isPlayingStory 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' 
                                    : 'bg-amber-100 border-amber-300 hover:bg-amber-150 text-amber-800'
                                }`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>{isPlayingStory ? "停止朗读" : "听故事朗读"}</span>
                              </button>
                            </div>

                            <div className="pt-1.5 overflow-y-auto max-h-[110px] pr-1 text-[11px] text-slate-700 leading-relaxed scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
                              <p className="italic bg-amber-50/20 p-2.5 rounded-xl border border-amber-100/30">
                                {pkAnswerDetail?.story || pkQuestion.story || "暂无该成语的历史典故。"}
                              </p>
                            </div>
                          </div>

                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCardFlipped(false);
                            }}
                            className="text-center text-[10px] text-amber-600 font-extrabold border-t border-amber-200/50 pt-2.5 mt-2 cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <span>再次点击卡片或此处，翻转回「释义卡」 ↺</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PK Play turn actions */}
                  <button
                    onClick={startNewPkQuestion}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 hover:scale-101 cursor-pointer active:scale-95 transform"
                  >
                    <span>挑战下一局 PK 🤺</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center space-y-3 shadow-sm border border-slate-205">
              <span className="text-3xl">⚠️</span>
              <p className="text-xs text-slate-500">成语殿堂起雾了，出题兔子在迷雾中迷失...</p>
              <button onClick={startNewPkQuestion} className="bg-amber-500 text-white text-xs px-4 py-2.5 rounded-xl">重新开启魔法</button>
            </div>
          )}

          {/* Gamified visual progress checklist */}
          <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-slate-200 space-y-3.5">
            <div className="flex justify-between items-center text-xs border-b border-indigo-50 pb-2">
              <span className="font-extrabold text-slate-700 flex items-center space-x-1">
                <span>🏆 考科举仕途功名</span>
                <span className="text-[9.5px] font-normal text-slate-400">({currentRank.title} 阶)</span>
              </span>
              <span className="font-mono font-extrabold text-indigo-600">
                {currentRank.title === "状元" ? "已至仕臣极点功高震主" : `${profile.score} / ${currentRank.maxScore} 学分`}
              </span>
            </div>

            {/* Level Rank ProgressBar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="italic">“{currentRank.desc}”</span>
                {nextRank && (
                  <span className="text-indigo-600 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                    升【{nextRank.title}】还需 {nextRank.minScore - profile.score} 绩点
                  </span>
                )}
              </div>
            </div>

            {/* Micro career path indicator */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5">文曲星考取轨迹：</span>
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {EXAM_RANKS.map((r, i) => {
                  const isCur = currentRank.title === r.title;
                  const isPassed = profile.score >= r.minScore;
                  return (
                    <div 
                      key={i} 
                      className={`flex-none px-2 py-1.5 rounded-lg text-center border text-[10px] font-bold ${
                        isCur 
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-50' 
                          : isPassed 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 opacity-70' 
                            : 'bg-slate-50 border-slate-100 text-slate-350 opacity-50'
                      }`}
                    >
                      <span className="block text-xs">{r.badge}</span>
                      <span className="block leading-none mt-1">{r.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </section>

        {/* WeChat Small Footer signature */}
        <footer className="bg-[#FAFAFB] border-t border-slate-200/50 py-3 text-center text-[10px] text-slate-400 font-black tracking-wider uppercase">
          <span>微信拼拼好玩版 · 聪聪兔成语工坊 🐰</span>
        </footer>

        {/* --- Career milestone promotion card overlay popup --- */}
        <AnimatePresence>
          {promotionBadge && (
            <motion.div 
              className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                {/* Rotating background light ray */}
                <div className="absolute inset-x-0 -top-12 h-44 overflow-hidden pointer-events-none select-none">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25)_0%,transparent_75%)]" />
                </div>

                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full px-4.5 py-1.5 shadow-md flex items-center space-x-1.5 mb-5 z-10 border border-amber-300">
                  <span className="text-sm">🎉</span>
                  <span className="text-white font-black text-xs tracking-widest font-sans">喜报 · 功名晋升</span>
                  <span className="text-sm">🎉</span>
                </div>

                {/* Big Medal badge */}
                <div className="relative flex items-center justify-center w-32 h-32 mb-4 z-10">
                  <div className="absolute inset-x-0 rounded-full border-4 border-dashed border-amber-400 rotate-animation" />
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-100 border-4 border-amber-400 rounded-full flex flex-col items-center justify-center shadow-lg relative z-10">
                    <span className="text-4xl filter drop-shadow animate-bounce" style={{ animationDuration: '2.5s' }}>
                      {promotionBadge.badge}
                    </span>
                    <span className="text-amber-950 font-black text-[12px] tracking-wide mt-1 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {promotionBadge.title}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 z-10 px-1">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    恭喜学子 <span className="text-indigo-600 underline font-black">{profile.name}</span>
                  </h3>
                  <p className="text-xs font-black text-amber-700">
                    荣升至科举大夫功名阶梯之：【{promotionBadge.title}】
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal max-w-[240px] italic">
                    "{promotionBadge.desc}"
                  </p>
                </div>

                <button
                  onClick={() => setPromotionBadge(null)}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs py-3 px-5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 transform"
                >
                  谢天恩！领封赏 📜
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
