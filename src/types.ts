export interface Idiom {
  word: string;         // 成语词汇
  pinyin: string;       // 拼音
  definition: string;   // 释义
  derivation?: string;  // 典故/出处
  example?: string;     // 例句
  category: 'elementary' | 'middle' | 'high'; // 适合阶段：小学、初中、高中
}

export type GameMode = 'home' | 'solitaire' | 'elimination' | 'guess' | 'glossary' | 'profile' | 'pk';

export type StudentGrade = 'elementary' | 'middle' | 'high' | 'university';

export interface SolitaireMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  word: string;
  pinyin: string;
  definition?: string;
  explanation?: string; // AI added fun explanation or story
  timestamp: string;
  pinyinMatching?: boolean; // True if matched via same pinyin instead of identical character
}

export interface EliminationBlock {
  id: string;
  char: string;       // 单个汉字
  col: number;        // 列 0-5
  row: number;        // 行 0-5
  isMatched: boolean; // 是否已消除
  shake?: boolean;    // 是否抖动中（选错反馈）
}

export interface GuessLevel {
  id: number;
  word: string;
  riddle: string;      // 描述/谜面
  candidates: string[]; // 备选汉字集合（打乱）
  pinyin: string;
  definition: string;
  story?: string;
}

export interface StudentProfile {
  name: string;
  grade: StudentGrade;
  score: number;
  coins: number;
  streak: number;      // 连续签到天数
  checkedInToday: boolean;
  unlockedStorybook: string[]; // 已解锁的成语故事 (word)
  puzzlesSolved: number;
  solitaireRecord: number; // 连击记录
}
