// 仕事データ
// pay = その国の平均年収に対する倍率 / edu = 必要な学歴 / req = 必要なパラメーター
// 学歴: 0=なし 1=小学校 2=中学校 3=高校 4=大学 5=大学院
//
// start   = 働き始めたときの肩書き（なければ職業名）
// ladder  = 昇進していく肩書きの順番（その職業らしいキャリアアップ）
// branchAt / branches = ladder の branchAt 番目まで来たら「キャリアの分かれ道」が起きる
//   branches の各要素: label（選択肢）, title（新しい肩書き）, mult（年収の倍率）, cost（平均年収に対する初期費用の倍率）,
//                      self（自営業になり収入が不安定に）, desc（説明）, after（その後の昇進ルート）
window.DATA = window.DATA || {};

DATA.eduNames = ['なし', '小学校卒', '中学校卒', '高校卒', '大学卒', '大学院卒'];

DATA.jobs = [
  { id: 'cashier', name: 'コンビニ店員', emoji: '🏪', pay: 0.55, edu: 0, stress: 2,
    ladder: ['ベテラン店員', 'シフトリーダー', '副店長', '店長'],
    branchAt: 4, branches: [
      { label: '🗺️ 本部のエリアマネージャーになる', title: 'エリアマネージャー', mult: 1.35, desc: '複数の店舗をまとめる仕事', after: ['統括エリアマネージャー', '本部の運営部長'] },
      { label: '🏪 フランチャイズのオーナーとして独立', title: 'コンビニオーナー', mult: 1.5, cost: 0.6, self: true, desc: '自分の店を持つ。収入は売上次第', after: ['2店舗目のオーナー', '複数店舗を経営するオーナー'] },
      { label: '🏠 店長のまま地域に根ざす', title: 'みんなに慕われる店長', mult: 1.1, desc: 'なじみのお客さんに囲まれる毎日', after: [] }
    ] },
  { id: 'farmer', name: '農家', emoji: '🌾', pay: 0.6, edu: 0, stress: 1, fit: 1,
    start: '見習い農家', ladder: ['一人前の農家', '農園の跡継ぎ', '大規模農園の経営者', '農業法人の社長'] },
  { id: 'fisher', name: '漁師', emoji: '🎣', pay: 0.7, edu: 0, stress: 2, fit: 1,
    start: '見習い漁師', ladder: ['一人前の漁師', '船長', '船団の親方', '漁協の組合長'] },
  { id: 'factory', name: '工場スタッフ', emoji: '🏭', pay: 0.8, edu: 2, stress: 3,
    ladder: ['熟練工', '班長', 'ライン長', '製造課長', '工場長'] },
  { id: 'driver', name: 'タクシー運転手', emoji: '🚕', pay: 0.75, edu: 2, stress: 3,
    ladder: ['ベテランドライバー', '新人ドライバーの指導係'],
    branchAt: 2, branches: [
      { label: '🏢 営業所の管理職になる', title: '営業所の運行管理者', mult: 1.2, desc: 'ドライバーをまとめる仕事', after: ['営業所長', 'タクシー会社の役員'] },
      { label: '🚖 個人タクシーとして独立', title: '個人タクシー運転手', mult: 1.3, cost: 0.3, self: true, desc: '自分の車で、自分のペースで', after: ['指名の絶えない個人タクシー'] }
    ] },
  { id: 'cook', name: '料理人', emoji: '🍳', pay: 0.8, edu: 2, stress: 3, req: { art: 30 },
    start: 'ジュニア料理人', ladder: ['ミドル料理人', 'シニア料理人'],
    branchAt: 2, branches: [
      { label: '👨‍🍳 料理長としてマネジメント職へ', title: '料理長', mult: 1.3, desc: '厨房のチームを率いる', after: ['総料理長', 'レストラングループの料理統括'] },
      { label: '🏮 独立して自分の店を開く', title: '自分の店のオーナーシェフ', mult: 1.4, cost: 0.8, self: true, desc: '開業資金が必要。収入は店の繁盛次第', after: ['行列のできる店のオーナーシェフ', '2号店を出したオーナーシェフ'] },
      { label: '🏬 系列店の店長を任される', title: '系列店の店長', mult: 1.2, desc: 'お店の運営と料理の両方を担う', after: ['エリア店長', '飲食チェーンの運営部長'] }
    ] },
  { id: 'hair', name: '美容師', emoji: '💇', pay: 0.8, edu: 3, stress: 3, req: { looks: 40, art: 35 },
    start: 'アシスタント美容師', ladder: ['スタイリスト', 'トップスタイリスト'],
    branchAt: 2, branches: [
      { label: '💈 サロンの店長になる', title: 'サロンの店長', mult: 1.25, desc: 'スタッフを育てながらお店をまとめる', after: ['複数店舗の統括マネージャー'] },
      { label: '✂️ 独立して自分のサロンを開く', title: '自分のサロンのオーナー', mult: 1.45, cost: 0.6, self: true, desc: '開業資金が必要。常連さん次第', after: ['予約のとれない人気サロンのオーナー'] },
      { label: '🎓 美容学校の講師になる', title: '美容学校の講師', mult: 1.1, desc: '次の世代に技術を伝える', after: ['美容学校の主任講師'] }
    ] },
  { id: 'care', name: '介護士', emoji: '🧓', pay: 0.75, edu: 3, stress: 4, req: { social: 30 },
    ladder: ['介護福祉士', 'ユニットリーダー', 'フロア主任', '生活相談員', '施設長'] },
  { id: 'clerk', name: '事務職', emoji: '🗂️', pay: 0.95, edu: 3, stress: 2,
    ladder: ['事務職（主任）', '事務職（係長）', '総務課長', '総務部長', '管理本部長'] },
  { id: 'sales', name: '営業', emoji: '💼', pay: 1.1, edu: 3, stress: 4, req: { social: 45 },
    ladder: ['営業（主任）', '営業（係長）', '営業課長', '営業部長', '営業本部長', '取締役'] },
  { id: 'hr', name: '人事', emoji: '🧑‍💼', pay: 1.05, edu: 4, stress: 3, req: { social: 45 },
    ladder: ['人事（主任）', '採用リーダー', '人事課長', '人事部長', 'CHRO（最高人事責任者）'] },
  { id: 'civil', name: '公務員', emoji: '🏛️', pay: 1.0, edu: 4, stress: 2, req: { smarts: 45 },
    ladder: ['公務員（主任）', '公務員（係長）', '課長補佐', '課長', '部長', '局長'] },
  { id: 'teacher', name: '学校の先生', emoji: '👩‍🏫', pay: 1.05, edu: 4, stress: 4, req: { smarts: 45, social: 35 },
    ladder: ['クラス担任', '学年主任', '教務主任', '教頭', '校長'] },
  { id: 'nurse', name: '看護師', emoji: '🩺', pay: 1.2, edu: 3, stress: 5, req: { smarts: 45 },
    start: '新人看護師', ladder: ['看護師', '指導係の看護師（プリセプター）'],
    branchAt: 2, branches: [
      { label: '📋 主任・師長として管理職へ', title: '主任看護師', mult: 1.15, desc: '病棟をまとめる立場', after: ['看護師長', '看護部長'] },
      { label: '🎓 認定看護師・専門看護師を目指す', title: '認定看護師', mult: 1.15, desc: '特定の分野のスペシャリスト', after: ['専門看護師', '大学病院の看護専門職リーダー'] },
      { label: '🏡 訪問看護で地域を支える', title: '訪問看護師', mult: 1.05, desc: '患者さんの暮らしに寄り添う', after: ['訪問看護ステーションの所長'] }
    ] },
  { id: 'designer', name: 'デザイナー', emoji: '🖌️', pay: 1.05, edu: 3, stress: 3, req: { art: 55 },
    start: 'ジュニアデザイナー', ladder: ['デザイナー', 'シニアデザイナー'],
    branchAt: 2, branches: [
      { label: '🎯 アートディレクターになる', title: 'アートディレクター', mult: 1.3, desc: 'チームとブランドの見た目を導く', after: ['クリエイティブディレクター', 'デザイン会社の代表'] },
      { label: '🕊️ フリーランスとして独立', title: 'フリーランスデザイナー', mult: 1.2, self: true, desc: '自由に働ける。収入は案件次第', after: ['指名の絶えない人気デザイナー', '自分のデザイン事務所の代表'] }
    ] },
  { id: 'engineer', name: 'エンジニア', emoji: '💻', pay: 1.6, edu: 4, stress: 4, req: { smarts: 60 },
    start: 'ジュニアエンジニア', ladder: ['ミドルエンジニア', 'シニアエンジニア'],
    branchAt: 2, branches: [
      { label: '👥 エンジニアリングマネージャーになる', title: 'エンジニアリングマネージャー', mult: 1.3, desc: 'チームを育て、組織を動かす', after: ['開発部長', 'CTO'] },
      { label: '🧠 スペシャリストの道を極める', title: 'テックリード', mult: 1.25, desc: '技術の最前線に立ち続ける', after: ['スタッフエンジニア', 'プリンシパルエンジニア'] },
      { label: '🚀 独立してフリーランスに', title: 'フリーランスエンジニア', mult: 1.4, self: true, desc: '高単価も夢じゃない。ただし収入は不安定', after: ['引っ張りだこのフリーランスエンジニア'] }
    ] },
  { id: 'banker', name: '銀行員', emoji: '🏦', pay: 1.5, edu: 4, stress: 5, req: { smarts: 55 },
    ladder: ['銀行員（主任）', '支店長代理', '支店長', '本部の部長', '執行役員'] },
  { id: 'journalist', name: '記者', emoji: '📰', pay: 1.1, edu: 4, stress: 5, req: { smarts: 50, social: 40 },
    start: '新人記者', ladder: ['担当記者', '取材班キャップ', 'デスク', '編集長'] },
  { id: 'lawyer', name: '弁護士', emoji: '⚖️', pay: 2.6, edu: 5, stress: 6, req: { smarts: 75 },
    start: 'アソシエイト弁護士', ladder: ['シニアアソシエイト'],
    branchAt: 1, branches: [
      { label: '🏢 大手事務所のパートナーを目指す', title: 'パートナー弁護士', mult: 1.4, desc: '事務所の経営にも関わる', after: ['マネージングパートナー'] },
      { label: '⚖️ 独立して自分の事務所を開く', title: '自分の法律事務所の代表', mult: 1.3, cost: 0.4, self: true, desc: '地域の頼れる弁護士に', after: ['評判の法律事務所の代表'] }
    ] },
  { id: 'doctor', name: '医師', emoji: '👨‍⚕️', pay: 3.0, edu: 5, stress: 6, req: { smarts: 80 },
    start: '研修医', ladder: ['専門医'],
    branchAt: 1, branches: [
      { label: '🏥 病院で出世を目指す', title: '医長', mult: 1.2, desc: '大きな病院の中核に', after: ['診療部長', '病院長'] },
      { label: '🩺 開業医になる', title: '自分のクリニックの院長', mult: 1.35, cost: 1.5, self: true, desc: '開業資金が必要。地域のかかりつけ医に', after: ['地域で評判のクリニックの院長'] },
      { label: '🔬 大学病院で研究の道へ', title: '大学病院の講師', mult: 1.05, desc: '医学の未来をつくる', after: ['准教授', '教授'] }
    ] },
  { id: 'professor', name: '研究者', emoji: '🔬', pay: 1.4, edu: 5, stress: 3, req: { smarts: 75 },
    start: 'ポスドク研究員', ladder: ['助教', '講師', '准教授', '教授', '学部長'] },
  { id: 'musician', name: 'ミュージシャン', emoji: '🎸', pay: 0.7, edu: 0, stress: 3, req: { art: 65 }, volatile: true,
    start: 'ライブハウスで歌うミュージシャン', ladder: ['インディーズで人気のミュージシャン', 'メジャーデビューしたミュージシャン', '全国ツアーを回るアーティスト', '伝説のミュージシャン'] },
  { id: 'artist', name: '画家', emoji: '🖼️', pay: 0.5, edu: 0, stress: 2, req: { art: 70 }, volatile: true,
    start: '駆け出しの画家', ladder: ['初個展を開いた画家', '注目の若手画家', '人気画家', '巨匠と呼ばれる画家'] },
  { id: 'athlete', name: 'プロスポーツ選手', emoji: '🏅', pay: 2.0, edu: 0, stress: 5, req: { fitness: 80 }, maxAge: 38, volatile: true,
    start: '控えのプロ選手', ladder: ['レギュラー選手', 'チームのエース', 'キャプテン', '代表選手'] },
  { id: 'streamer', name: '配信者', emoji: '🎙️', pay: 0.6, edu: 0, stress: 3, req: { social: 50 }, volatile: true,
    start: '駆け出しの配信者', ladder: ['登録者1万人の配信者', '登録者10万人の配信者', '大型コラボに呼ばれる人気配信者', '登録者100万人のトップ配信者'] },
  { id: 'vtuber', name: 'Vtuber', emoji: '🦉', pay: 0.7, edu: 0, stress: 3, req: { social: 50, art: 45 }, volatile: true,
    start: 'デビューしたてのVtuber', ladder: ['登録者1万人のVtuber', '3Dお披露目をしたVtuber', '単独ライブを開いたVtuber', '登録者100万人のトップVtuber'] },
  { id: 'model', name: 'モデル', emoji: '📸', pay: 1.3, edu: 0, stress: 4, req: { looks: 80 }, maxAge: 40, volatile: true,
    start: '新人モデル', ladder: ['雑誌の専属モデル', '人気モデル', 'トップモデル', 'ブランドの顔'] },
  { id: 'chef', name: '人気レストランのシェフ', emoji: '👨‍🍳', pay: 1.4, edu: 2, stress: 5, req: { art: 60, fitness: 40 },
    start: 'レストランのシェフ', ladder: ['スーシェフ', '料理長', 'グランシェフ', '星付きレストランのオーナーシェフ'] },
  { id: 'founder', name: 'スタートアップ社長', emoji: '🚀', pay: 1.8, edu: 3, stress: 7, req: { smarts: 60, social: 55 }, volatile: true,
    start: '創業したての社長', ladder: ['資金調達に成功した社長', '社員50人の会社の社長', '急成長企業のCEO', '上場企業の社長'] },
  { id: 'parttime', name: 'アルバイト', emoji: '🧃', pay: 0.35, edu: 0, stress: 1, partTime: true }
];

DATA.jobById = {};
DATA.jobs.forEach(j => { DATA.jobById[j.id] = j; });
