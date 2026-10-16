// =============================================================
// ゲームの基本データ（ステータス・性格・行動・趣味・仕事・ペット・家・病気）
// 金額はすべて「日本での値段」。各国では生活水準 ppp を掛けて使う
// =============================================================
window.HB = window.HB || {};

HB.STATS = [
  ['health', '❤️', '健康'],
  ['stamina', '💪', '体力'],
  ['happy', '☺️', '幸福'],
  ['looks', '✨', '外見'],
  ['mental', '🍃', 'メンタル'],
  ['social', '🤝', '社交性'],
  ['intel', '📚', '知性'],
  ['sense', '🎨', '感性']
];
HB.STAT = {};
HB.STATS.forEach(([k, e, n]) => { HB.STAT[k] = { e, n }; });

// ------------------------------------------------------------
// 性格
//  stage 1: 0〜5歳（1つだけ / 2pt） stage 2: 6〜11歳（3つ / 2pt） stage 3: 12歳〜（5つ / 5pt）
//  from: この性格を持っていると自動で取得 / pts4: これらのポイントの合計が6以上で取得
//  block: 持っていると取得できない性格 / mult: ステータスの上がりやすさ
//  t: 性格ポイントの選択肢として出る行動
// ------------------------------------------------------------
HB.TRAITS = [
  // ---- stage 1
  { id: 'emo1', name: '感情的', e: '🌈', stage: 1, mult: { sense: 1.4 }, swing: 1.2, desc: '良くも悪くも気持ちが顔に出る。感性がとても育ちやすい。',
    t: ['うれしいと全身で喜び、悲しいと大声で泣く', 'お気に入りの毛布がないと大泣きする', '音楽が鳴ると体をゆらして笑う', '嫌なことには「イヤ！」とはっきり言う'] },
  { id: 'act1', name: '活動的', e: '🏃', stage: 1, mult: { stamina: 1.2, social: 1.2 }, desc: '外で遊ぶのが大好きで、すぐに誰とでも仲良くなる。',
    t: ['じっとしていられず、どこへでもハイハイで向かう', '知らない子にも自分から近づいていく', '公園で日が暮れるまで走り回る', '高いところを見つけると必ず登ろうとする'] },
  { id: 'quiet1', name: '物静か', e: '🌙', stage: 1, mult: { mental: 1.2, intel: 1.2 }, desc: 'おとなしく、じっくり物事を見つめる。',
    t: ['積み木をひとりで黙々と積み上げる', '絵本の同じページをずっと眺めている', '大人の話をじっと聞いている', '虫や雲の動きを静かに観察する'] },
  { id: 'easy1', name: 'おおらか', e: '🌻', stage: 1, mult: { happy: 1.2, health: 1.2 }, desc: '小さなことは気にしない。いつもにこにこ。',
    t: ['転んでもけろっとして笑っている', 'どこでもすやすや眠れる', 'おもちゃを取られても気にせず別の遊びを始める', '何を食べても「おいしい」顔をする'] },
  // ---- stage 2
  { id: 'wag', name: 'わがまま', e: '😤', stage: 2, mult: { happy: 1.1 }, desc: '自分の気持ちに正直。欲しいものは欲しいと言う。',
    t: ['お店の前で「買って！」と座り込む', '遊びのルールを自分に有利に決める', '嫌いなおかずをこっそり残す'] },
  { id: 'amae', name: '甘えん坊', e: '🧸', stage: 2, mult: { social: 1.1 }, desc: '家族にべったり。甘えるのが上手。',
    t: ['寝る前に必ず家族の布団にもぐりこむ', '「抱っこ」とせがんで離れない', '困るとすぐ大人に頼る'] },
  { id: 'yan', name: 'やんちゃ', e: '🦖', stage: 2, mult: { stamina: 1.1 }, desc: 'いたずらと冒険が大好き。',
    t: ['木登りして服を破いて帰ってくる', '水たまりに全力でジャンプする', '友達と秘密基地を作る'] },
  { id: 'nat', name: '人懐っこい', e: '🐶', stage: 2, mult: { social: 1.15 }, desc: '誰にでも笑顔で話しかける。',
    t: ['近所のおばあちゃんに毎日あいさつする', '転校生に真っ先に話しかける', 'お店の人とすぐ仲良くなる'] },
  { id: 'kiki', name: '聞きたがり', e: '❓', stage: 2, mult: { intel: 1.15 }, desc: '「なんで？」が口ぐせ。',
    t: ['「空はなんで青いの？」と一日中質問する', '図鑑を抱えて大人を質問攻めにする', '先生に授業のあとまで質問する'] },
  { id: 'jiri', name: '自立心旺盛', e: '🦅', stage: 2, mult: { mental: 1.1 }, desc: '何でも自分でやりたがる。',
    t: ['「自分でやる！」と靴ひもと格闘する', 'ひとりで隣町までおつかいに行く', '宿題を誰にも聞かずにやりとげる'] },
  { id: 'oda', name: 'おだやか', e: '🍵', stage: 2, mult: { mental: 1.1 }, desc: 'けんかの仲裁役。争いごとが苦手。',
    t: ['けんかしている友達の間に入って話を聞く', '順番をゆずってあげる', '泣いている子の背中をなでる'] },
  { id: 'myp', name: 'マイペース', e: '🐢', stage: 2, mult: { happy: 1.1 }, desc: '自分の速さで生きている。',
    t: ['みんなが走っても自分のペースで歩く', '集合時間を忘れて花を眺めている', '流行りに興味を示さず好きなものを貫く'] },
  // ---- stage 3
  { id: 'wag3', name: '我儘', e: '👑', stage: 3, from: 'wag', mult: { happy: 1.1 }, desc: '自分の道は自分で決める、筋金入りのこだわり派。',
    t: ['グループの行き先を強引に決める', '気に入らない提案は即却下する', '自分の欲しいものに迷わずお金を使う'] },
  { id: 'amae3', name: '甘え上手', e: '🥺', stage: 3, from: 'amae', mult: { social: 1.1 }, desc: '人に頼るのが上手で、なぜか憎めない。',
    t: ['困ったときに上手に周りを頼る', '先輩にごはんをおごってもらう', '「お願い」の一言で場をなごませる'] },
  { id: 'emo3', name: '感情的', e: '🎢', stage: 3, pts4: ['wag', 'amae'], mult: { sense: 1.2 }, swing: 1.2, desc: '喜怒哀楽がまっすぐ。感動屋さん。',
    t: ['映画で人目もはばからず号泣する', 'うれしいことがあると誰かに電話せずにいられない', '理不尽なことにはその場で怒る'] },
  { id: 'act3', name: 'アクティブ', e: '🚴', stage: 3, from: 'yan', mult: { stamina: 1.15 }, desc: '休日は家にいられないタイプ。',
    t: ['思い立ったら日帰りで遠出する', '週末の予定を全部埋める', '新しいスポーツに片っ端から挑戦する'] },
  { id: 'extro', name: '外向的', e: '🎉', stage: 3, from: 'nat', mult: { social: 1.15 }, desc: '人と会うほど元気になる。',
    t: ['知らない人ばかりのパーティーに飛び込む', '友達の友達とすぐ仲良くなる', '人を集めてイベントを企画する'] },
  { id: 'talk', name: 'お喋り', e: '💬', stage: 3, pts4: ['yan', 'nat'], mult: { social: 1.1 }, desc: '話し出したら止まらない。',
    t: ['電話が気づけば3時間になっている', 'エレベーターで隣の人に話しかける', '面白かった話を何度でも話す'] },
  { id: 'research', name: '調べたがり', e: '🔍', stage: 3, from: 'kiki', mult: { intel: 1.15 }, desc: '気になったら徹底的に調べる。',
    t: ['気になった言葉の語源を夜中まで調べる', '買い物の前に口コミを100件読む', '旅行先の歴史を調べつくす'] },
  { id: 'indep', name: '自立的', e: '🧭', stage: 3, from: 'jiri', mult: { mental: 1.1 }, desc: '自分のことは自分で。頼れる人。',
    t: ['困難をひとりで乗り越える', '自分で計画を立てて実行する', '人に頼らずに引っ越しをやりきる'] },
  { id: 'logic', name: '論理的', e: '🧮', stage: 3, pts4: ['kiki', 'jiri'], mult: { intel: 1.1 }, desc: '筋道を立てて考える。',
    t: ['メリットとデメリットを表にまとめる', '議論で根拠を求める', '家計簿をグラフにする'] },
  { id: 'calm', name: '穏やか', e: '🕊️', stage: 3, from: 'oda', mult: { mental: 1.1 }, desc: 'そばにいると落ち着く、と言われる人。',
    t: ['いらいらしている人に温かいお茶を出す', '揉めごとを静かにおさめる', 'ゆっくり深呼吸してから話す'] },
  { id: 'gener', name: '寛大', e: '🌊', stage: 3, from: 'myp', mult: { happy: 1.1 }, desc: '人の失敗を笑って許せる。',
    t: ['約束に遅れた友達を笑顔で迎える', '貸したお金の催促をしない', '後輩のミスを一緒にかぶる'] },
  { id: 'good', name: '善人', e: '😇', stage: 3, pts4: ['oda', 'myp'], mult: { social: 1.05, happy: 1.05 }, desc: '困っている人を放っておけない。',
    t: ['道に迷っている人を目的地まで案内する', '募金箱を見かけると必ず入れる', '落とし物を交番に届ける'] },
  { id: 'ideal', name: '理想主義', e: '🌟', stage: 3, block: ['real'], mult: { sense: 1.1 }, desc: '世界はもっと良くなると信じている。',
    t: ['「いつか世界を変える」とノートに書く', '理想の暮らしを熱く語る', '妥協案を「まだいける」と押し返す'] },
  { id: 'real', name: '現実主義', e: '📏', stage: 3, block: ['ideal'], mult: { intel: 1.05 }, desc: '地に足のついた考え方をする。',
    t: ['夢より先に貯金の計画を立てる', '「現実的に考えよう」が口ぐせ', '宝くじは買わない派を貫く'] },
  { id: 'odd', name: '様子がおかしい', e: '🌀', stage: 3, block: ['serious'], mult: { sense: 1.15 }, desc: 'ちょっと独特な世界観の持ち主。',
    t: ['観葉植物に毎朝あいさつをする', '真顔で謎の創作ダンスを披露する', '靴下を左右違う柄で履くのがこだわり'] },
  { id: 'serious', name: '生真面目', e: '📐', stage: 3, block: ['odd'], mult: { intel: 1.1 }, desc: '何事にもきっちり。ルールは守る。',
    t: ['集合時間の15分前に到着する', '説明書を最初から最後まで読む', '赤信号は誰もいなくても待つ'] },
  { id: 'gossip', name: '噂好き', e: '👂', stage: 3, block: ['tight'], mult: { social: 1.1 }, desc: '人の話を聞くのも話すのも大好き。',
    t: ['近所の噂をいち早くキャッチする', '「ここだけの話」をつい広める', '有名人のゴシップに詳しくなる'] },
  { id: 'tight', name: '口が堅い', e: '🤐', stage: 3, block: ['gossip'], mult: { mental: 1.05 }, desc: '秘密は墓場まで持っていく。',
    t: ['友達の秘密を誰にも話さない', '相談ごとを静かに聞きとどける', '聞かれても「さあ？」ととぼける'] },
  { id: 'intro', name: '内向的', e: '🏠', stage: 3, block: ['act3', 'extro', 'talk'], mult: { intel: 1.1 }, desc: 'ひとりの時間で充電するタイプ。',
    t: ['休日はひとりで家にこもって過ごす', '大人数の飲み会をそっと断る', '少人数の友達と深く付き合う'] },
  { id: 'animal', name: '動物好き', e: '🐾', stage: 3, petOnly: true, mult: { happy: 1.1 }, desc: '動物を見ると顔がゆるむ。',
    t: ['道ばたの猫に話しかける'] },
  { id: 'family', name: '家族志向', e: '🏡', stage: 3, block: ['wolf'], mult: { happy: 1.05 }, desc: '家族といる時間が何より大切。',
    t: ['家族の誕生日を全部手帳に書く', '週末は実家に顔を出す', '家族旅行の幹事を買って出る'] },
  { id: 'wolf', name: '一匹狼', e: '🐺', stage: 3, block: ['family'], mult: { mental: 1.1 }, desc: '群れずに自分の道を行く。',
    t: ['グループ行動を抜けてひとりで行動する', '誰にも相談せずに大きな決断をする', 'ひとり旅を満喫する'] },
  { id: 'narc', name: 'ナルシスト', e: '🪞', stage: 3, block: ['echo'], mult: { looks: 1.15 }, desc: '自分が大好き。鏡の前が定位置。',
    t: ['自撮りを100枚撮って1枚を選ぶ', 'ショーウィンドウに映る自分を確認する', '自分の武勇伝を語る'] },
  { id: 'echo', name: 'エコーイスト', e: '🫧', stage: 3, block: ['narc'], mult: { social: 1.1 }, desc: '自分のことより人のこと。褒められるのが苦手。',
    t: ['褒められるとすぐ話題を変える', '自分の希望より相手の希望を優先する', '手柄を同僚にゆずる'] }
];
HB.TRAIT = {};
HB.TRAITS.forEach(t => { HB.TRAIT[t.id] = t; });
// 0〜5歳の性格 → 6歳で自動取得する性格（どちらか一方）
HB.TRAIT_PAIR = { emo1: ['wag', 'amae'], act1: ['yan', 'nat'], quiet1: ['kiki', 'jiri'], easy1: ['oda', 'myp'] };
HB.TRAIT_LIMIT = { 1: 1, 2: 3, 3: 5 };
HB.TRAIT_NEED = { 1: 2, 2: 2, 3: 5 };
// 相反する性格（恋人・配偶者と組み合わさると別れやすくなる）
HB.CONFLICTS = [['ideal', 'real'], ['odd', 'serious'], ['gossip', 'tight'], ['intro', 'extro'], ['intro', 'talk'], ['intro', 'act3'],
  ['family', 'wolf'], ['narc', 'echo'], ['emo3', 'logic'], ['wag3', 'gener'], ['amae3', 'indep']];

// ------------------------------------------------------------
// 行動（毎年ステータスを上げる選択肢）  a: [最小年齢, 最大年齢]  cost: 円（日本基準）
// ------------------------------------------------------------
HB.ACTIONS = [
  // 赤ちゃん
  { n: 'いっぱいミルクを飲む', e: '🍼', fx: { health: 6 }, cost: 0, a: [0, 2] },
  { n: 'ハイハイで部屋を大冒険', e: '👶', fx: { stamina: 6 }, cost: 0, a: [0, 2] },
  { n: '家族にたくさん抱っこされる', e: '🤱', fx: { happy: 6, mental: 2 }, cost: 0, a: [0, 2] },
  { n: '鏡の自分ににっこり', e: '🪞', fx: { looks: 5, happy: 2 }, cost: 0, a: [0, 2] },
  { n: 'すやすやお昼寝', e: '😴', fx: { mental: 6, health: 2 }, cost: 0, a: [0, 2] },
  { n: '近所の人にあやしてもらう', e: '👵', fx: { social: 6 }, cost: 0, a: [0, 2] },
  { n: '絵本を読んでもらう', e: '📕', fx: { intel: 6 }, cost: 0, a: [0, 5] },
  { n: 'おもちゃの太鼓をたたく', e: '🥁', fx: { sense: 6 }, cost: 0, a: [0, 2] },
  { n: 'ベビースイミング', e: '🏊', fx: { stamina: 7, health: 3 }, cost: 5000, a: [0, 3] },
  { n: '知育おもちゃで遊ぶ', e: '🧩', fx: { intel: 7 }, cost: 3000, a: [0, 4] },
  { n: 'ベビーマッサージ', e: '👐', fx: { health: 5, mental: 3 }, cost: 2000, a: [0, 2] },
  { n: '写真館で記念撮影', e: '📸', fx: { looks: 5, happy: 3 }, cost: 5000, a: [0, 5] },
  { n: 'ベビー音楽教室', e: '🎵', fx: { sense: 7, social: 2 }, cost: 5000, a: [0, 4] },
  // 幼児
  { n: '公園で走り回る', e: '🛝', fx: { stamina: 6, health: 2 }, cost: 0, a: [3, 8] },
  { n: '好き嫌いせずに食べる', e: '🥦', fx: { health: 6 }, cost: 0, a: [3, 11] },
  { n: 'お友達と砂場で遊ぶ', e: '🏖️', fx: { social: 6 }, cost: 0, a: [3, 6] },
  { n: 'お絵かき帳いっぱいに描く', e: '🖍️', fx: { sense: 6 }, cost: 0, a: [3, 8] },
  { n: '文字や数字の練習', e: '🔢', fx: { intel: 6 }, cost: 0, a: [3, 6] },
  { n: '早寝早起き', e: '🌅', fx: { mental: 5, health: 2 }, cost: 0, a: [3, 12] },
  { n: '大好きな歌を歌う', e: '🎤', fx: { happy: 6 }, cost: 0, a: [3, 8] },
  { n: '歯みがきと身だしなみ', e: '🪥', fx: { looks: 5 }, cost: 0, a: [3, 11] },
  { n: '体操教室に通う', e: '🤸', fx: { stamina: 7, health: 2 }, cost: 8000, a: [3, 8] },
  { n: 'ピアノ教室に通う', e: '🎹', fx: { sense: 7 }, cost: 10000, a: [3, 15] },
  { n: '英語教室に通う', e: '🔤', fx: { intel: 7, social: 2 }, cost: 10000, a: [3, 15] },
  { n: '遊園地へおでかけ', e: '🎠', fx: { happy: 8 }, cost: 6000, a: [3, 12] },
  { n: 'お気に入りの服を買ってもらう', e: '👗', fx: { looks: 6, happy: 2 }, cost: 5000, a: [3, 11] },
  // 小学生
  { n: '放課後に鬼ごっこ', e: '🏃', fx: { stamina: 6, social: 2 }, cost: 0, a: [6, 11] },
  { n: '図書室で本を借りる', e: '📚', fx: { intel: 6 }, cost: 0, a: [6, 15] },
  { n: '宿題をしっかりやる', e: '✏️', fx: { intel: 5, mental: 2 }, cost: 0, a: [6, 17] },
  { n: '友達を家に呼んで遊ぶ', e: '🏠', fx: { social: 6, happy: 2 }, cost: 0, a: [6, 14] },
  { n: '自由研究に打ち込む', e: '🔭', fx: { intel: 5, sense: 3 }, cost: 0, a: [6, 12] },
  { n: '工作に夢中になる', e: '✂️', fx: { sense: 6 }, cost: 0, a: [6, 12] },
  { n: '家族でピクニック', e: '🧺', fx: { happy: 6, health: 2 }, cost: 0, a: [6, 12] },
  { n: '日記をつける', e: '📔', fx: { mental: 6 }, cost: 0, a: [6, 110] },
  { n: '学習塾に通う', e: '🏫', fx: { intel: 8 }, cost: 15000, a: [6, 17] },
  { n: 'スイミングスクール', e: '🏊', fx: { stamina: 7, health: 3 }, cost: 10000, a: [6, 15] },
  { n: 'サマーキャンプに参加', e: '⛺', fx: { social: 6, stamina: 3 }, cost: 12000, a: [6, 15] },
  { n: '美容院でおしゃれカット', e: '💇', fx: { looks: 6 }, cost: 4000, a: [6, 110] },
  // 中高生
  { n: '朝のランニング', e: '👟', fx: { stamina: 6, health: 2 }, cost: 0, a: [12, 60] },
  { n: 'テスト勉強に励む', e: '📝', fx: { intel: 6 }, cost: 0, a: [12, 22] },
  { n: '友達とカラオケ', e: '🎤', fx: { social: 5, happy: 3 }, cost: 2000, a: [12, 45] },
  { n: 'スキンケアを習慣にする', e: '🧴', fx: { looks: 6 }, cost: 1000, a: [12, 110] },
  { n: '好きな音楽を聴きこむ', e: '🎧', fx: { sense: 5, mental: 2 }, cost: 0, a: [12, 110] },
  { n: '悩みを親友に打ち明ける', e: '🫂', fx: { mental: 6, social: 2 }, cost: 0, a: [12, 45] },
  { n: '推し活に全力をそそぐ', e: '💖', fx: { happy: 7 }, cost: 5000, a: [12, 60] },
  { n: 'ボランティア活動', e: '🤲', fx: { social: 5, mental: 3 }, cost: 0, a: [12, 110] },
  { n: '予備校に通う', e: '🏢', fx: { intel: 8 }, cost: 30000, a: [15, 19] },
  { n: 'ジムに通う', e: '🏋️', fx: { stamina: 7, looks: 2 }, cost: 20000, a: [15, 75] },
  { n: '美術館めぐり', e: '🖼️', fx: { sense: 7 }, cost: 3000, a: [12, 110] },
  { n: '健康診断を受ける', e: '🩺', fx: { health: 7 }, cost: 5000, a: [12, 110] },
  { n: '好きなだけ眠る', e: '🛌', fx: { mental: 5, health: 2 }, cost: 0, a: [12, 110] },
  // 大人
  { n: '栄養バランスのいい自炊', e: '🥗', fx: { health: 6 }, cost: 0, a: [18, 110] },
  { n: '資格の勉強をする', e: '📖', fx: { intel: 6 }, cost: 0, a: [18, 64] },
  { n: '飲み会に参加する', e: '🍻', fx: { social: 6, health: -1 }, cost: 5000, a: [20, 70] },
  { n: '旅行に出かける', e: '✈️', fx: { happy: 7, sense: 2 }, cost: 50000, a: [18, 85] },
  { n: 'エステや美容院に行く', e: '💆', fx: { looks: 7 }, cost: 15000, a: [18, 85] },
  { n: '瞑想で心を整える', e: '🧘', fx: { mental: 7 }, cost: 0, a: [18, 110] },
  { n: '交流会に顔を出す', e: '🤝', fx: { social: 6 }, cost: 3000, a: [18, 70] },
  { n: '映画や舞台を観る', e: '🎬', fx: { sense: 6, happy: 2 }, cost: 3000, a: [15, 110] },
  { n: '人間ドックを受ける', e: '🏥', fx: { health: 8 }, cost: 30000, a: [30, 110] },
  { n: '社会人大学で学ぶ', e: '🎓', fx: { intel: 8 }, cost: 50000, a: [22, 80] },
  { n: 'パーソナルトレーニング', e: '💪', fx: { stamina: 8, looks: 2 }, cost: 50000, a: [20, 75] },
  { n: 'カウンセリングを受ける', e: '🛋️', fx: { mental: 8 }, cost: 10000, a: [15, 110] },
  { n: '自分へのご褒美を買う', e: '🎁', fx: { happy: 7 }, cost: 20000, a: [18, 110] },
  { n: '散歩で季節を感じる', e: '🍂', fx: { health: 4, mental: 3 }, cost: 0, a: [40, 110] },
  // シニア
  { n: 'ラジオ体操', e: '📻', fx: { stamina: 5, health: 3 }, cost: 0, a: [55, 110] },
  { n: '近所の子どもと遊ぶ', e: '🧒', fx: { happy: 6, social: 2 }, cost: 0, a: [60, 110] },
  { n: 'パズルや将棋で頭の体操', e: '♟️', fx: { intel: 6 }, cost: 0, a: [60, 110] },
  { n: '地域の集まりに参加', e: '🏘️', fx: { social: 6 }, cost: 0, a: [60, 110] },
  { n: '庭いじりを楽しむ', e: '🌷', fx: { sense: 5, mental: 2 }, cost: 0, a: [50, 110] },
  { n: '温泉でゆっくり', e: '♨️', fx: { health: 6, happy: 2 }, cost: 15000, a: [50, 110] },
  { n: 'おしゃれして出かける', e: '🎩', fx: { looks: 6 }, cost: 5000, a: [60, 110] },
  { n: '思い出のアルバムを整理', e: '📷', fx: { mental: 5, happy: 3 }, cost: 0, a: [60, 110] },
  // ペット
  { n: 'ペットとたっぷり遊ぶ', e: '🐾', fx: { happy: 6, mental: 2 }, cost: 0, a: [3, 110], pet: true }
];

// ------------------------------------------------------------
// 趣味・クラブ  cat: sport / intel / art / other
// ------------------------------------------------------------
HB.HOBBIES = [
  { id: 'baseball', n: '野球', e: '⚾', fx: { stamina: 5, health: 5 }, cat: 'sport', club: true },
  { id: 'soccer', n: 'サッカー', e: '⚽', fx: { stamina: 5, health: 5 }, cat: 'sport', club: true },
  { id: 'basket', n: 'バスケットボール', e: '🏀', fx: { stamina: 5, health: 5 }, cat: 'sport', club: true },
  { id: 'volley', n: 'バレーボール', e: '🏐', fx: { stamina: 5, health: 5 }, cat: 'sport', club: true },
  { id: 'swim', n: '水泳', e: '🏊', fx: { stamina: 5, health: 5 }, cat: 'sport', club: true },
  { id: 'science', n: '科学', e: '🔬', fx: { intel: 5, mental: 5 }, cat: 'intel', club: true },
  { id: 'reading', n: '読書', e: '📖', fx: { intel: 5, mental: 5 }, cat: 'intel', club: true },
  { id: 'debate', n: 'ディベート', e: '🎙️', fx: { intel: 5, mental: 5 }, cat: 'intel', club: true },
  { id: 'chorus', n: '合唱', e: '🎶', fx: { sense: 5, happy: 5 }, cat: 'art', club: true },
  { id: 'brass', n: '吹奏楽', e: '🎺', fx: { sense: 5, happy: 5 }, cat: 'art', club: true },
  { id: 'art', n: '美術', e: '🖼️', fx: { sense: 5, happy: 5 }, cat: 'art', club: true },
  { id: 'drama', n: '演劇', e: '🎭', fx: { sense: 5, happy: 5 }, cat: 'art', club: true },
  { id: 'climb', n: '登山', e: '🏔️', fx: { stamina: 5, health: 5 }, cat: 'other' },
  { id: 'yoga', n: 'ヨガ', e: '🧘', fx: { stamina: 5, health: 5 }, cat: 'other' },
  { id: 'cook', n: '料理', e: '🍳', fx: { intel: 5, mental: 5 }, cat: 'other' },
  { id: 'game', n: 'ゲーム', e: '🎮', fx: { intel: 5, mental: 5 }, cat: 'other' },
  { id: 'diy', n: 'DIY', e: '🔨', fx: { sense: 5, happy: 5 }, cat: 'other' },
  { id: 'sew', n: '縫い物', e: '🧵', fx: { sense: 5, happy: 5 }, cat: 'other' },
  { id: 'beauty', n: '美容', e: '💄', fx: { looks: 5, social: 5 }, cat: 'other' }
];
HB.HOBBY = {};
HB.HOBBIES.forEach(h => { HB.HOBBY[h.id] = h; });
HB.SPORTS = ['baseball', 'soccer', 'basket', 'volley', 'swim'];
// 帰宅部（クラブに入らない）
HB.NOCLUB = { n: '帰宅', e: '🏠', fx: { health: 5, mental: 5 } };
// クラブ・部活の「大会」の呼び方と関係するステータス
HB.CLUB_CAT = {
  sport: { stat: 'stamina', meet: '大会', win: '優勝', lead: ['キャプテン', 'エース'] },
  intel: { stat: 'intel', meet: 'コンテスト', win: '最優秀賞', lead: ['部長', '代表'] },
  art: { stat: 'sense', meet: 'コンクール', win: '金賞', lead: ['部長', 'ソロ担当'] }
};

// ------------------------------------------------------------
// 学校
// ------------------------------------------------------------
// 合格率 [有名, 私立, 公立]（⭐1〜5）
HB.SCHOOL_RATE = {
  kinder: { 1: [0, 10, 20], 2: [2, 20, 70], 3: [5, 60, 90], 4: [50, 80, 100], 5: [80, 95, 100] },
  base:   { 1: [0, 10, 60], 2: [2, 20, 80], 3: [5, 40, 95], 4: [50, 80, 100], 5: [80, 95, 100] },
  uni:    { 1: [0, 10, 60], 2: [2, 20, 80], 3: [5, 40, 95], 4: [50, 80, 100], 5: [95, 95, 100] }
};
HB.STAGES = {
  kinder: { n: '幼稚園・保育園', start: 3, years: 3, edu: 0, fees: [10000, 5000, 1000], names: ['有名幼稚園', '幼稚園', '保育園'], rate: 'kinder' },
  elem:   { n: '小学校', start: 6, years: 6, edu: 1, fees: [20000, 10000, 0], names: ['有名私立小学校', '私立小学校', '公立小学校'], rate: 'base', piv: 20, free: 70 },
  middle: { n: '中学校', start: 12, years: 3, edu: 2, fees: [20000, 10000, 0], names: ['有名私立中学校', '私立中学校', '公立中学校'], rate: 'base', piv: 35, free: 80, esc: 80 },
  high:   { n: '高校', start: 15, years: 3, edu: 3, fees: [30000, 20000, 10000], names: ['有名私立高校', '私立高校', '公立高校'], rate: 'base', piv: 45, free: 90, esc: 90 },
  uni:    { n: '大学', start: 18, years: 4, edu: 4, fees: [50000, 30000, 10000], names: ['有名私立大学', '私立大学', '国公立大学'], rate: 'uni', piv: 55, free: 95 },
  grad:   { n: '大学院', start: 22, years: 2, edu: 4, fees: [50000, 30000, 10000], names: ['有名私立大学院', '私立大学院', '国公立大学院'], rate: 'uni', piv: 60, free: 95 }
};
// 高校の科
HB.HS_TRACKS = {
  gen:   { n: '普通科', tiers: [0, 1, 2] },
  sport: { n: 'スポーツ科', tiers: [0, 1, 2], needSport: true },
  agri:  { n: '農業科', tiers: [2] },
  com:   { n: '商業科', tiers: [2] }
};
// 学部 ok: 進学できる高校の科（tier-track）。'any' は高校卒業なら可
HB.FACULTIES = {
  lit:   { n: '文学部', years: 4, ok: 'any' },
  econ:  { n: '経済学部', years: 4, ok: ['0-gen', '1-gen', '2-gen', '2-com'] },
  law:   { n: '法学部', years: 4, ok: ['0-gen', '1-gen', '2-gen'], grad: { start: 22, years: 2 } },
  intl:  { n: '国際学部', years: 4, ok: ['0-gen', '1-gen', '2-gen'] },
  edu:   { n: '教育学部', years: 4, ok: ['0-gen', '1-gen', '2-gen'] },
  med:   { n: '医学部', years: 6, ok: ['0-gen', '1-gen', '2-gen'], grad: { start: 24, years: 3 } },
  pharm: { n: '薬学部', years: 6, ok: ['0-gen', '1-gen', '2-gen'], grad: { start: 24, years: 3 } },
  eng:   { n: '工学部', years: 4, ok: ['0-gen', '1-gen', '2-gen'] },
  agri:  { n: '農学部', years: 4, ok: ['0-gen', '1-gen', '2-gen', '2-agri'] },
  music: { n: '音楽学部', years: 4, ok: 'any', hobby: ['chorus', 'brass'] },
  artf:  { n: '美術学部', years: 4, ok: 'any', hobby: ['art', 'drama'] },
  sport: { n: 'スポーツ学部', years: 4, ok: ['0-sport', '1-sport', '2-sport'], hobby: HB.SPORTS }
};

// ------------------------------------------------------------
// 仕事  start: 月給（万円・日本基準） grow: low/normal/high/volatile  st: 昇進に関わるステータス
//  req: 条件（edu: 'high' 高卒以上 / fac: 学部卒 / grad: 大学院卒 / hob: [趣味, pt] / stat / scout）
// ------------------------------------------------------------
HB.JOBS = [
  { id: 'day', n: '日雇い労働者', e: '🧱', start: 8, grow: 'low', st: 'stamina', req: {} },
  { id: 'stall', n: '屋台販売員', e: '🍢', start: 8, grow: 'low', st: 'social', req: {} },
  { id: 'shop', n: 'ショップ店員', e: '🛍️', start: 12, grow: 'low', st: 'social', req: {} },
  { id: 'food', n: '飲食店スタッフ', e: '🍽️', start: 12, grow: 'low', st: 'social', req: {} },
  { id: 'farm', n: '農家', e: '🌾', start: 8, grow: 'low', st: 'stamina', req: {}, alt: [{ hs: 'agri', start: 18, grow: 'normal' }, { fac: 'agri', start: 20, grow: 'normal' }] },
  { id: 'factory', n: '工場作業員', e: '🏭', start: 10, grow: 'low', st: 'stamina', req: {} },
  { id: 'build', n: '建築作業員', e: '👷', start: 15, grow: 'low', st: 'stamina', req: {}, alt: [{ fac: 'eng', start: 20, grow: 'normal' }] },
  { id: 'comedian', n: '芸人', e: '🎙️', start: 12, grow: 'volatile', st: 'social', req: { stat: ['social', 60] } },
  { id: 'actor', n: '俳優', nf: '女優', e: '🎬', start: 15, grow: 'volatile', st: 'looks', req: { scout: true } },
  { id: 'model', n: 'モデル', e: '📸', start: 15, grow: 'volatile', st: 'looks', req: { scout: true } },
  { id: 'idol', n: 'アイドル', e: '🌟', start: 15, grow: 'volatile', st: 'looks', req: { scout: true } },
  { id: 'office', n: '一般事務', e: '🗂️', start: 20, grow: 'normal', st: 'intel', req: { edu: 'high' } },
  { id: 'sales', n: '営業', e: '💼', start: 20, grow: 'normal', st: 'social', req: { edu: 'high' } },
  { id: 'hr', n: '人事', e: '🧑‍💼', start: 20, grow: 'normal', st: 'social', req: { edu: 'high' } },
  { id: 'account', n: '経理', e: '🧾', start: 20, grow: 'normal', st: 'intel', req: { edu: 'high' } },
  { id: 'writer', n: '作家', e: '✒️', start: 20, grow: 'normal', st: 'sense', req: { fac: 'lit' } },
  { id: 'reporter', n: '記者', e: '📰', start: 20, grow: 'normal', st: 'intel', req: { fac: 'lit' } },
  { id: 'banker', n: '銀行員', e: '🏦', start: 22, grow: 'normal', st: 'intel', req: { fac: 'econ' } },
  { id: 'trader', n: '商社マン', nf: '商社ウーマン', e: '🌐', start: 22, grow: 'normal', st: 'social', req: { fac: 'econ' } },
  { id: 'civil', n: '公務員', e: '🏛️', start: 22, grow: 'normal', st: 'intel', req: { fac: 'law' } },
  { id: 'legal', n: '法律事務', e: '⚖️', start: 20, grow: 'normal', st: 'intel', req: { fac: 'law' } },
  { id: 'airport', n: '空港職員', e: '🛫', start: 20, grow: 'normal', st: 'social', req: { fac: 'intl' } },
  { id: 'interp', n: '通訳', e: '🗣️', start: 20, grow: 'normal', st: 'intel', req: { fac: 'intl' } },
  { id: 'teacher', n: '学校の先生', e: '🧑‍🏫', start: 20, grow: 'normal', st: 'social', req: { fac: 'edu' } },
  { id: 'tutor', n: '塾講師', e: '✏️', start: 20, grow: 'normal', st: 'intel', req: { fac: 'edu' } },
  { id: 'clinic', n: '臨床医', e: '🩺', start: 25, grow: 'normal', st: 'intel', req: { fac: 'med' } },
  { id: 'resdoc', n: '研究医', e: '🧪', start: 25, grow: 'normal', st: 'intel', req: { fac: 'med' } },
  { id: 'pharmstaff', n: '薬局スタッフ', e: '💊', start: 24, grow: 'normal', st: 'social', req: { fac: 'pharm' } },
  { id: 'narc', n: '麻薬取締官', e: '🚨', start: 24, grow: 'normal', st: 'intel', req: { fac: 'pharm' } },
  { id: 'engineer', n: 'エンジニア', e: '💻', start: 22, grow: 'normal', st: 'intel', req: { fac: 'eng' } },
  { id: 'designer', n: '設備設計スタッフ', e: '📐', start: 22, grow: 'normal', st: 'intel', req: { fac: 'eng' } },
  { id: 'farmmgr', n: '農園管理者', e: '🚜', start: 20, grow: 'normal', st: 'stamina', req: { fac: 'agri' } },
  { id: 'garden', n: '造園技師', e: '🌳', start: 20, grow: 'normal', st: 'sense', req: { fac: 'agri' } },
  { id: 'pianist', n: 'ピアニスト', e: '🎹', start: 20, grow: 'normal', st: 'sense', req: { fac: 'music', hob: [['brass'], 6] } },
  { id: 'singer', n: '声楽家', e: '🎼', start: 20, grow: 'normal', st: 'sense', req: { fac: 'music', hob: [['chorus'], 6] } },
  { id: 'painter', n: '画家', e: '🎨', start: 20, grow: 'normal', st: 'sense', req: { fac: 'artf', hob: [['art'], 6] } },
  { id: 'troupe', n: '劇団スタッフ', e: '🎭', start: 20, grow: 'normal', st: 'sense', req: { fac: 'artf', hob: [['drama'], 6] } },
  { id: 'athlete', n: 'スポーツ選手', e: '🏅', start: 18, grow: 'volatile', st: 'stamina', req: { fac: 'sport', hob: [HB.SPORTS, 6] } },
  { id: 'instructor', n: 'インストラクター', e: '🏋️', start: 20, grow: 'normal', st: 'stamina', req: { fac: 'sport', hob: [HB.SPORTS, 6] } },
  { id: 'lawyer', n: '弁護士', e: '⚖️', start: 40, grow: 'high', st: 'intel', req: { grad: 'law' } },
  { id: 'judge', n: '裁判官', e: '🧑‍⚖️', start: 45, grow: 'high', st: 'intel', req: { grad: 'law' } },
  { id: 'doctor', n: '医者', e: '👩‍⚕️', start: 42, grow: 'high', st: 'intel', req: { grad: 'med' } },
  { id: 'dentist', n: '歯医者', e: '🦷', start: 40, grow: 'high', st: 'intel', req: { grad: 'med' } },
  { id: 'pharmacist', n: '薬剤師', e: '⚗️', start: 38, grow: 'high', st: 'intel', req: { grad: 'pharm' } },
  { id: 'pharmres', n: '薬学研究者', e: '🔬', start: 36, grow: 'high', st: 'intel', req: { grad: 'pharm' } }
];
HB.JOB = {};
HB.JOBS.forEach(j => { HB.JOB[j.id] = j; });
HB.RANKS = {
  low: ['見習い', '一人前', 'ベテラン', 'リーダー', '親方'],
  normal: ['新人', '主任', '係長', '課長', '部長', '役員'],
  high: ['駆け出し', '中堅', 'ベテラン', '第一人者', '重鎮'],
  volatile: ['無名', '注目株', '人気者', 'スター', 'レジェンド']
};

// ------------------------------------------------------------
// 親の仕事（月給 万円・日本基準）
// ------------------------------------------------------------
HB.PARENT_JOBS = {
  1: [['日雇い労働者', 6], ['露天商', 5], ['小作農', 4], ['廃品回収', 4], ['住み込みの家政婦', 4], ['漁師の手伝い', 5], ['レンガ職人', 6]],
  2: [['工場作業員', 15], ['清掃員', 13], ['配達員', 16], ['ショップ店員', 13], ['飲食店スタッフ', 13], ['タクシー運転手', 17], ['農家', 12], ['警備員', 15]],
  3: [['会社員', 30], ['公務員', 32], ['看護師', 30], ['教師', 33], ['営業', 30], ['事務', 25], ['技術者', 35], ['自営業', 28], ['美容師', 26]],
  4: [['医師', 100], ['弁護士', 90], ['銀行員', 60], ['エンジニア', 60], ['大学教授', 70], ['会社役員', 85], ['歯科医', 80], ['薬剤師', 45], ['パイロット', 95]],
  5: [['大臣', 0], ['世界的企業のCEO', 0], ['大財閥の会長', 0], ['名門一族の当主', 0], ['大地主', 0]]
};
// 親の持ち物（最大で階級の数まで）
HB.BELONGINGS = {
  1: ['古いラジオ', '中古の自転車', 'ヤギ1頭', 'ひびの入った携帯電話', '使い込んだ鍋', 'ござ'],
  2: ['スマートフォン', '小さなテレビ', '中古のバイク', '扇風機', 'ミシン', '中古の冷蔵庫'],
  3: ['ファミリーカー', 'ノートパソコン', '持ち家', 'アップライトピアノ', '家族旅行の写真アルバム', '大きな本棚'],
  4: ['高級車', '別荘', '高級腕時計', 'グランドピアノ', 'ワインセラー', '絵画コレクション'],
  5: ['プライベートジェット', 'クルーザー', '美術品コレクション', '海沿いの邸宅', '競走馬', '小さな島']
};
// 平均年収（日本・万円） … ⭐5の親の年収（40〜150倍）の基準
HB.AVG_INCOME = 450;

// ------------------------------------------------------------
// ペット・家
// ------------------------------------------------------------
HB.PETS = [
  { id: 'dog', n: '犬', e: '🐕', life: [15, 25], cost: 10000 },
  { id: 'cat', n: '猫', e: '🐈‍⬛', life: [10, 20], cost: 9000 },
  { id: 'rabbit', n: 'うさぎ', e: '🐰', life: [10, 15], cost: 8000 },
  { id: 'hamster', n: 'ハムスター', e: '🐹', life: [2, 5], cost: 3000 },
  { id: 'bird', n: 'インコ', e: '🦜', life: [5, 10], cost: 5000 },
  { id: 'owl', n: 'フクロウ', e: '🦉', life: [10, 20], cost: 9000 },
  { id: 'fish', n: '魚', e: '🐟', life: [1, 10], cost: 3000 }
];
HB.PET_NAMES = ['モモ', 'ココ', 'ルル', 'チョコ', 'マロン', 'ソラ', 'ハナ', 'レオ', 'ムギ', 'きなこ', 'ポチ', 'ミルク', 'あずき', 'ラッキー', 'ポン太', 'ふく', 'こむぎ', 'ピッピ', 'まる', 'ゴマ', 'ベル', 'ニコ', 'おもち', 'クッキー'];
HB.HOUSES = [
  { n: '中古住宅', e: '🏚️', cost: 500000, happy: 5 },
  { n: 'スタンダード住宅', e: '🏠', cost: 1000000, happy: 8 },
  { n: 'ミドル住宅', e: '🏡', cost: 3000000, happy: 12 },
  { n: 'プレミアム住宅', e: '🏘️', cost: 7000000, happy: 16 },
  { n: 'ハイエンド住宅', e: '🏰', cost: 10000000, happy: 20 }
];

// ------------------------------------------------------------
// 病気  sev: 1 軽い / 2 中くらい / 3 重い  cost: 治療費（日本基準）
// ------------------------------------------------------------
HB.DISEASES = [
  { n: '風邪', sev: 1, min: 0, cost: 3000 },
  { n: 'インフルエンザ', sev: 1, min: 0, cost: 5000 },
  { n: '胃腸炎', sev: 1, min: 0, cost: 5000 },
  { n: '中耳炎', sev: 1, min: 0, max: 12, cost: 4000 },
  { n: '水ぼうそう', sev: 1, min: 1, max: 10, cost: 4000 },
  { n: 'ぎっくり腰', sev: 1, min: 25, cost: 8000 },
  { n: '肺炎', sev: 2, min: 0, cost: 60000 },
  { n: '骨折', sev: 2, min: 3, cost: 80000 },
  { n: '胃潰瘍', sev: 2, min: 18, cost: 60000 },
  { n: '高血圧', sev: 2, min: 35, cost: 40000 },
  { n: '糖尿病', sev: 2, min: 30, cost: 80000 },
  { n: 'うつ状態', sev: 2, min: 13, cost: 50000, mental: true },
  { n: 'マラリア', sev: 2, min: 0, cost: 30000, region: ['wafrica', 'cafrica', 'eafrica'] },
  { n: 'デング熱', sev: 2, min: 0, cost: 30000, region: ['seasia', 'sasia', 'samerica'] },
  { n: '結核', sev: 3, min: 5, cost: 200000, region: ['sasia', 'wafrica', 'cafrica', 'eafrica', 'safrica', 'seasia'] },
  { n: 'がん', sev: 3, min: 30, cost: 1000000 },
  { n: '心臓病', sev: 3, min: 40, cost: 800000 },
  { n: '脳卒中', sev: 3, min: 50, cost: 800000 },
  { n: '腎臓病', sev: 3, min: 45, cost: 600000 }
];

// ------------------------------------------------------------
// 子どもの頃に面倒を見てもらう方法（幼稚園に通えなかったとき）
// ------------------------------------------------------------
HB.CARE = [
  { id: 'mom', n: '母親が仕事を半分にして面倒を見る', e: '👩', fx: { happy: 10, social: 10 }, half: 'mom' },
  { id: 'dad', n: '父親が仕事を半分にして面倒を見る', e: '👨', fx: { happy: 10, social: 10 }, half: 'dad' },
  { id: 'gp', n: '祖父母に面倒を見てもらう', e: '👵', fx: { happy: 5, social: 5 } },
  { id: 'nb', n: '近所の人に助けてもらう', e: '🏘️', fx: { social: 5 } }
];
