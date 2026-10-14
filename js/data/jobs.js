// 仕事データ
// pay = その国の平均年収に対する倍率 / edu = 必要な学歴 / req = 必要なパラメーター
// 学歴: 0=なし 1=小学校 2=中学校 3=高校 4=大学 5=大学院
window.DATA = window.DATA || {};

DATA.eduNames = ['なし', '小学校卒', '中学校卒', '高校卒', '大学卒', '大学院卒'];

DATA.jobs = [
  { id: 'cashier',   name: 'コンビニ店員',       emoji: '🏪', pay: 0.55, edu: 0, stress: 2 },
  { id: 'farmer',    name: '農家',               emoji: '🌾', pay: 0.6,  edu: 0, stress: 1, fit: 1 },
  { id: 'fisher',    name: '漁師',               emoji: '🎣', pay: 0.7,  edu: 0, stress: 2, fit: 1 },
  { id: 'factory',   name: '工場スタッフ',       emoji: '🏭', pay: 0.8,  edu: 2, stress: 3 },
  { id: 'driver',    name: 'タクシー運転手',     emoji: '🚕', pay: 0.75, edu: 2, stress: 3 },
  { id: 'cook',      name: '料理人',             emoji: '🍳', pay: 0.8,  edu: 2, stress: 3, req: { art: 30 } },
  { id: 'hair',      name: '美容師',             emoji: '💇', pay: 0.8,  edu: 3, stress: 3, req: { looks: 40, art: 35 } },
  { id: 'care',      name: '介護士',             emoji: '🧓', pay: 0.75, edu: 3, stress: 4, req: { social: 30 } },
  { id: 'clerk',     name: '事務職',             emoji: '🗂️', pay: 0.95, edu: 3, stress: 2 },
  { id: 'sales',     name: '営業',               emoji: '💼', pay: 1.1,  edu: 3, stress: 4, req: { social: 45 } },
  { id: 'hr',        name: '人事',               emoji: '🧑‍💼', pay: 1.05, edu: 4, stress: 3, req: { social: 45 } },
  { id: 'civil',     name: '公務員',             emoji: '🏛️', pay: 1.0,  edu: 4, stress: 2, req: { smarts: 45 } },
  { id: 'teacher',   name: '学校の先生',         emoji: '👩‍🏫', pay: 1.05, edu: 4, stress: 4, req: { smarts: 45, social: 35 } },
  { id: 'nurse',     name: '看護師',             emoji: '🩺', pay: 1.2,  edu: 3, stress: 5, req: { smarts: 45 } },
  { id: 'designer',  name: 'デザイナー',         emoji: '🖌️', pay: 1.05, edu: 3, stress: 3, req: { art: 55 } },
  { id: 'engineer',  name: 'エンジニア',         emoji: '💻', pay: 1.6,  edu: 4, stress: 4, req: { smarts: 60 } },
  { id: 'banker',    name: '銀行員',             emoji: '🏦', pay: 1.5,  edu: 4, stress: 5, req: { smarts: 55 } },
  { id: 'journalist',name: '記者',               emoji: '📰', pay: 1.1,  edu: 4, stress: 5, req: { smarts: 50, social: 40 } },
  { id: 'lawyer',    name: '弁護士',             emoji: '⚖️', pay: 2.6,  edu: 5, stress: 6, req: { smarts: 75 } },
  { id: 'doctor',    name: '医師',               emoji: '👨‍⚕️', pay: 3.0,  edu: 5, stress: 6, req: { smarts: 80 } },
  { id: 'professor', name: '研究者',             emoji: '🔬', pay: 1.4,  edu: 5, stress: 3, req: { smarts: 75 } },
  { id: 'musician',  name: 'ミュージシャン',     emoji: '🎸', pay: 0.7,  edu: 0, stress: 3, req: { art: 65 }, volatile: true },
  { id: 'artist',    name: '画家',               emoji: '🖼️', pay: 0.5,  edu: 0, stress: 2, req: { art: 70 }, volatile: true },
  { id: 'athlete',   name: 'プロスポーツ選手',   emoji: '🏅', pay: 2.0,  edu: 0, stress: 5, req: { fitness: 80 }, maxAge: 38, volatile: true },
  { id: 'streamer',  name: '配信者',             emoji: '🎙️', pay: 0.6,  edu: 0, stress: 3, req: { social: 50 }, volatile: true },
  { id: 'vtuber',    name: 'Vtuber',             emoji: '🦉', pay: 0.7,  edu: 0, stress: 3, req: { social: 50, art: 45 }, volatile: true },
  { id: 'model',     name: 'モデル',             emoji: '📸', pay: 1.3,  edu: 0, stress: 4, req: { looks: 80 }, maxAge: 40, volatile: true },
  { id: 'chef',      name: '人気レストランのシェフ', emoji: '👨‍🍳', pay: 1.4, edu: 2, stress: 5, req: { art: 60, fitness: 40 } },
  { id: 'founder',   name: 'スタートアップ社長', emoji: '🚀', pay: 1.8,  edu: 3, stress: 7, req: { smarts: 60, social: 55 }, volatile: true },
  { id: 'parttime',  name: 'アルバイト',         emoji: '🧃', pay: 0.35, edu: 0, stress: 1, partTime: true }
];

DATA.jobById = {};
DATA.jobs.forEach(j => { DATA.jobById[j.id] = j; });
