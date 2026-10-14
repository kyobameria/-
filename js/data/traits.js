// 性格データ：選択肢によって性格が追加されていく
// opp = 正反対の性格（新しく得ると入れ替わる）
// yearly = 毎年ちょっとだけ影響するパラメーター
window.DATA = window.DATA || {};

DATA.traits = {
  '冒険好き':     { emoji: '🧭', desc: '未知のものにワクワクする', opp: '慎重派', yearly: { happy: 1 } },
  '慎重派':       { emoji: '🐢', desc: '石橋を叩いて渡る', opp: '冒険好き', yearly: { health: 1 } },
  '優しい':       { emoji: '🌷', desc: '誰かの痛みに気づける', yearly: { social: 1 } },
  '正義感':       { emoji: '⚖️', desc: 'まちがったことは見過ごせない', opp: 'ずる賢い' },
  '野心家':       { emoji: '🔥', desc: 'もっと上へ、もっと遠くへ', opp: 'のんびり屋', yearly: { mind: -1 } },
  'のんびり屋':   { emoji: '☁️', desc: 'マイペースが一番', opp: '野心家', yearly: { mind: 2 } },
  '努力家':       { emoji: '📈', desc: 'コツコツ積み重ねる', yearly: { smarts: 1 } },
  '天才肌':       { emoji: '💡', desc: 'ひらめきで生きる', yearly: { smarts: 1, art: 1 } },
  '食いしん坊':   { emoji: '🍙', desc: 'おいしいものに目がない', yearly: { happy: 1, fitness: -1 } },
  '芸術家肌':     { emoji: '🎨', desc: '世界を自分の色で描く', yearly: { art: 2 } },
  '社交的':       { emoji: '🎉', desc: '人の輪の中心にいる', opp: '人見知り', yearly: { social: 2 } },
  '人見知り':     { emoji: '🫣', desc: '仲良くなるまで時間がかかる', opp: '社交的', yearly: { social: -1, art: 1 } },
  '誠実':         { emoji: '🤝', desc: '嘘がつけない', opp: 'ずる賢い' },
  'ずる賢い':     { emoji: '🦊', desc: '抜け道を見つけるのが得意', opp: '誠実' },
  '家族思い':     { emoji: '🏠', desc: '家族の笑顔が原動力', yearly: { happy: 1 } },
  '自由人':       { emoji: '🕊️', desc: '縛られるのが苦手', opp: '伝統を重んじる', yearly: { mind: 1 } },
  '伝統を重んじる': { emoji: '⛩️', desc: '受け継がれたものを大切にする', opp: '自由人' },
  '倹約家':       { emoji: '💰', desc: '1円も無駄にしない', opp: '浪費家' },
  '浪費家':       { emoji: '🛍️', desc: '欲しいと思ったら買っちゃう', opp: '倹約家', yearly: { happy: 1 } },
  'ロマンチスト': { emoji: '💘', desc: '運命の出会いを信じてる', opp: '現実主義' },
  '現実主義':     { emoji: '📐', desc: '夢より計画', opp: 'ロマンチスト' },
  '負けず嫌い':   { emoji: '🏆', desc: '勝つまでやめない', yearly: { fitness: 1 } },
  '楽観的':       { emoji: '🌞', desc: 'なんとかなるさ', opp: '心配性', yearly: { mind: 2 } },
  '心配性':       { emoji: '🌧️', desc: '最悪のケースをいつも想定', opp: '楽観的', yearly: { mind: -1, smarts: 1 } },
  '動物好き':     { emoji: '🐾', desc: '動物に話しかけちゃう', yearly: { happy: 1 } },
  '読書家':       { emoji: '📚', desc: '本の中にもう一つの人生', yearly: { smarts: 2 } },
  '運動好き':     { emoji: '⚽', desc: '体を動かすと元気になる', yearly: { fitness: 2, health: 1 } },
  '好奇心旺盛':   { emoji: '🔍', desc: '「なんで？」が口癖', yearly: { smarts: 1 } },
  '涙もろい':     { emoji: '💧', desc: 'すぐもらい泣きしちゃう', yearly: { art: 1 } },
  'ユーモア':     { emoji: '😂', desc: 'どんな時も笑いを忘れない', yearly: { social: 1, mind: 1 } },
  'お人好し':     { emoji: '🍵', desc: '頼まれると断れない', yearly: { mind: -1, social: 1 } },
  '一途':         { emoji: '💍', desc: '好きになったらとことん' }
};

DATA.MAX_TRAITS = 12;
