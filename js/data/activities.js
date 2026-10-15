// 行動データ：パラメーターを維持・アップさせるための行動
// cost = 平均年収に対する倍率 / fx = 上がる値の範囲 [最小, 最大]
// 1年に使える行動ポイントには限りがある（DATA.AP_PER_YEAR）
window.DATA = window.DATA || {};

DATA.AP_PER_YEAR = 3;

DATA.actCats = [
  { id: 'body',  name: 'からだ', emoji: '💪' },
  { id: 'heart', name: 'こころ', emoji: '🍃' },
  { id: 'brain', name: 'まなび', emoji: '📚' },
  { id: 'look',  name: 'みため', emoji: '✨' },
  { id: 'art',   name: 'しゅみ', emoji: '🎨' },
  { id: 'people',name: 'ひと',   emoji: '🤝' },
  { id: 'life',  name: 'じんせい', emoji: '🌈' }
];

DATA.activities = [
  // からだ
  { id: 'walk', cat: 'body', name: 'さんぽ', emoji: '🚶', min: 3, cost: 0, fx: { health: [1, 3], mind: [1, 3] },
    texts: ['いつもと違う道を歩いたら、知らないパン屋さんを見つけた。', '{place}のあたりまで歩いた。風が気持ちいい。', '野良猫と目が合った。しばらく見つめ合った。'] },
  { id: 'jog', cat: 'body', name: 'ジョギング', emoji: '🏃', min: 10, cost: 0, fx: { fitness: [3, 6], health: [2, 4] }, trait: ['運動好き', 0.2],
    texts: ['朝5時のジョギング。世界がまだ眠っている時間が好きだ。', '息を切らしながら走りきった。足はガクガク、心はスッキリ。'] },
  { id: 'gym', cat: 'body', name: 'ジムに通う', emoji: '🏋️', min: 15, cost: 0.02, fx: { fitness: [5, 9], health: [2, 4], looks: [1, 2] }, trait: ['運動好き', 0.25],
    texts: ['ジムで筋トレ。鏡の中の自分が少したくましく見えた。', 'トレーナーに「いいフォームですね」と褒められた。'] },
  { id: 'yoga', cat: 'body', name: 'ヨガ', emoji: '🧘', min: 12, cost: 0.01, fx: { health: [2, 4], mind: [3, 6], fitness: [1, 3] },
    texts: ['ヨガのポーズで体がポキポキ鳴った。', '深呼吸を繰り返すうちに、心が凪いでいった。'] },
  { id: 'checkup', cat: 'body', name: '健康診断・通院', emoji: '🏥', min: 0, cost: 0.015, fx: { health: [5, 12] },
    texts: ['健康診断を受けた。お医者さんに「生活習慣、気をつけてね」と言われた。', '病院で診てもらった。早めに来て正解だった。'] },
  { id: 'sleep', cat: 'body', name: '早寝早起き', emoji: '😴', min: 0, cost: 0, fx: { health: [2, 4], mind: [1, 3] },
    texts: ['22時に布団へ。目覚ましより先に起きられた朝は、ちょっと誇らしい。', 'たっぷり寝たら、肌の調子までよくなった。'] },
  { id: 'cook', cat: 'body', name: '自炊で健康ごはん', emoji: '🥗', min: 12, cost: 0.005, fx: { health: [2, 5], art: [1, 2] }, trait: ['食いしん坊', 0.15],
    texts: ['{food}を自分で作ってみた。お店の味には負けるけど、愛情は勝ってる。', '野菜たっぷりのスープを作った。体がよろこんでる。'] },
  { id: 'sports', cat: 'body', name: 'スポーツクラブ', emoji: '⚽', min: 6, max: 60, cost: 0.01, fx: { fitness: [4, 8], social: [2, 4] }, trait: ['負けず嫌い', 0.2],
    texts: ['試合で初ゴール！チームメイトにもみくちゃにされた。', '練習はキツいけど、仲間と飲むスポドリは格別。'] },

  // こころ
  { id: 'meditate', cat: 'heart', name: '瞑想', emoji: '🪷', min: 10, cost: 0, fx: { mind: [4, 8] },
    texts: ['10分間、何も考えない練習。3分で晩ごはんのことを考えていた。', '呼吸に集中すると、モヤモヤが少しずつほどけていった。'] },
  { id: 'onsen', cat: 'heart', name: '温泉・スパ', emoji: '♨️', min: 6, cost: 0.01, fx: { mind: [5, 9], health: [1, 3], happy: [2, 4] },
    texts: ['湯船につかった瞬間「あぁ〜」と声が出た。', 'サウナ→水風呂→外気浴。ととのった。'] },
  { id: 'pet_play', cat: 'heart', name: 'ペットと遊ぶ', emoji: '🐾', min: 2, cost: 0, needPet: true, fx: { happy: [4, 7], mind: [3, 6] }, trait: ['動物好き', 0.3],
    texts: ['{pet}がお腹を見せてゴロンとした。今日の勝者は{pet}。', '{pet}と昼寝した。最高の休日。'] },
  { id: 'karaoke', cat: 'heart', name: 'カラオケ', emoji: '🎤', min: 8, cost: 0.003, fx: { happy: [3, 6], mind: [3, 5], social: [1, 3] },
    texts: ['90点を超えた！採点機に初めて認められた日。', '喉が枯れるまで歌った。声がガラガラ。'] },
  { id: 'trip', cat: 'heart', name: '国内旅行', emoji: '🚃', min: 15, cost: 0.04, fx: { happy: [5, 10], mind: [5, 8], art: [1, 3] }, trait: ['冒険好き', 0.15],
    texts: ['{city}へ一人旅。知らない町の空気は、なんだか自由な味がした。', '{place}を訪れた。写真じゃ伝わらない景色だった。'] },
  { id: 'abroad', cat: 'heart', name: '海外旅行', emoji: '✈️', min: 18, cost: 0.12, fx: { happy: [8, 14], mind: [5, 10], smarts: [2, 4], art: [2, 4] }, trait: ['冒険好き', 0.3],
    texts: ['{abroad}へ旅に出た。言葉が通じなくても、笑顔は通じた。', '{abroad}の屋台で、名前も知らない料理に感動した。'] },
  { id: 'diary', cat: 'heart', name: '日記を書く', emoji: '📔', min: 8, cost: 0, fx: { mind: [2, 5], art: [1, 3] },
    texts: ['今日の「よかったこと」を3つ書いた。意外とすぐ見つかった。', '日記を読み返したら、去年の自分に励まされた。'] },

  // まなび
  { id: 'read', cat: 'brain', name: '図書館で読書', emoji: '📖', min: 5, cost: 0, fx: { smarts: [3, 6], mind: [1, 2] }, trait: ['読書家', 0.25],
    texts: ['分厚い小説を一気読み。気づいたら閉館時間だった。', '図書館の静けさが好きだ。ページをめくる音だけが響く。'] },
  { id: 'study', cat: 'brain', name: '猛勉強', emoji: '✏️', min: 7, cost: 0, fx: { smarts: [4, 8], mind: [-3, -1] }, trait: ['努力家', 0.25],
    texts: ['机にかじりついて勉強した。ノートが一冊埋まった。', '徹夜で勉強。朝日がやけにまぶしかった。'] },
  { id: 'cram', cat: 'brain', name: '塾・習い事', emoji: '🏫', min: 6, max: 18, cost: 0.015, fx: { smarts: [5, 9] },
    texts: ['塾の先生の雑談がやけにおもしろかった。', '塾帰りに友達と食べた肉まんが、勉強より記憶に残っている。'] },
  { id: 'lang', cat: 'brain', name: '語学学習', emoji: '🌐', min: 10, cost: 0.01, fx: { smarts: [3, 6], social: [1, 3] }, trait: ['好奇心旺盛', 0.2],
    texts: ['外国語で「ありがとう」を10か国語言えるようになった。', 'オンラインで海外の人と話した。半分くらい通じた！'] },
  { id: 'license', cat: 'brain', name: '資格の勉強', emoji: '📜', min: 18, cost: 0.02, fx: { smarts: [4, 7] }, careerBoost: true,
    texts: ['資格試験に合格！職場でちょっと見る目が変わった気がする。', '参考書が3冊目に突入。テキストが付箋だらけ。'] },
  { id: 'puzzle', cat: 'brain', name: 'パズル・将棋・チェス', emoji: '♟️', min: 6, cost: 0, fx: { smarts: [2, 5], mind: [1, 3] },
    texts: ['長考の末の一手が決まった。気持ちいい！', '近所のおじいさんに完敗した。次こそは。'] },

  // みため
  { id: 'salon', cat: 'look', name: '美容院', emoji: '💇', min: 6, cost: 0.006, fx: { looks: [3, 6], happy: [1, 3] },
    texts: ['思い切って髪型を変えた。誰も気づかなかった。', '美容師さんの「お似合いです」を素直に信じることにした。'] },
  { id: 'skincare', cat: 'look', name: 'スキンケア', emoji: '🧴', min: 12, cost: 0.004, fx: { looks: [2, 5], mind: [1, 2] },
    texts: ['化粧水をていねいに塗り込んだ。自分を大事にしている時間。', '肌がもちもちになった気がする。'] },
  { id: 'fashion', cat: 'look', name: 'おしゃれな服を買う', emoji: '👗', min: 12, cost: 0.02, fx: { looks: [3, 7], happy: [2, 4] }, trait: ['浪費家', 0.15],
    texts: ['一目ぼれした服を即決で購入。鏡の前で一人ファッションショー。', '店員さんにのせられて、気づいたら3着買っていた。'] },
  { id: 'cosmetic', cat: 'look', name: '美容整形', emoji: '💉', min: 18, cost: 0.4, fx: { looks: [12, 22], mind: [-4, 6] },
    texts: ['ダウンタイムを乗り越えた。新しい顔に、まだちょっと慣れない。', '鏡を見るたびに、ほんの少し自信がわいてくる。'] },

  // しゅみ
  { id: 'draw', cat: 'art', name: '絵を描く', emoji: '🖍️', min: 3, cost: 0, fx: { art: [3, 7], mind: [1, 3] }, trait: ['芸術家肌', 0.2],
    texts: ['{mom}の似顔絵を描いた。「ちょっと太く描きすぎ」と言われた。', '夕焼けを水彩で描こうとしたら、ただのオレンジ色の紙になった。'] },
  { id: 'music', cat: 'art', name: '楽器の練習', emoji: '🎹', min: 5, cost: 0.01, fx: { art: [4, 7], smarts: [1, 3] }, trait: ['芸術家肌', 0.15],
    texts: ['ついに一曲通して弾けた！誰も聴いてないけど、拍手。', '指が痛い。でも音が少しずつ「音楽」になってきた。'] },
  { id: 'museum', cat: 'art', name: '美術館・博物館', emoji: '🏛️', min: 6, cost: 0.003, fx: { art: [3, 6], smarts: [2, 4] }, trait: ['好奇心旺盛', 0.15],
    texts: ['ある一枚の絵の前で、なぜか30分動けなかった。', '恐竜の骨格標本を見上げて、首が痛くなった。'] },
  { id: 'movie', cat: 'art', name: '映画・アニメ鑑賞', emoji: '🎬', min: 4, cost: 0.002, fx: { happy: [2, 5], art: [2, 4] }, trait: ['涙もろい', 0.2],
    texts: ['エンドロールで号泣。隣の人も泣いていた。', '話題の映画を観た。帰り道、主人公になりきって歩いた。'] },
  { id: 'garden', cat: 'art', name: 'ガーデニング', emoji: '🌱', min: 8, cost: 0.003, fx: { mind: [3, 6], art: [1, 3], health: [1, 2] },
    texts: ['ミニトマトが赤くなった。我が子のようにかわいい。', '植えた種から芽が出た。小さな緑に、大きな勇気をもらった。'] },
  { id: 'game', cat: 'art', name: 'ゲームで遊ぶ', emoji: '🎮', min: 5, cost: 0.003, fx: { happy: [3, 6], mind: [2, 4], health: [-2, 0] },
    texts: ['ラスボスを倒した瞬間、深夜3時に一人で叫んだ。', '「あと1回だけ」を12回繰り返した。'] },

  // ひと
  { id: 'friends', cat: 'people', name: '友達と遊ぶ', emoji: '🧑‍🤝‍🧑', min: 4, cost: 0.003, fx: { social: [3, 6], happy: [3, 6] }, trait: ['社交的', 0.15],
    texts: ['{friend}と朝まで語り明かした。何を話したかは覚えていない。', '{friend}と{food}を食べに行った。いつもの味、いつもの笑顔。'] },
  { id: 'family_time', cat: 'people', name: '家族と過ごす', emoji: '🏡', min: 0, cost: 0, fx: { happy: [2, 5], mind: [2, 4] }, family: true, trait: ['家族思い', 0.15],
    texts: ['家族みんなで{food}を囲んだ。何気ない夜が、いちばんの宝物。', '{fam}と昔のアルバムを見て笑い転げた。'] },
  { id: 'volunteer', cat: 'people', name: 'ボランティア', emoji: '🙌', min: 10, cost: 0, fx: { social: [2, 5], happy: [2, 5], mind: [1, 3] }, trait: ['優しい', 0.25],
    texts: ['地域の清掃活動に参加。拾ったゴミより、もらった「ありがとう」のほうが多かった。', '子ども食堂を手伝った。おかわりの声が嬉しかった。'] },
  { id: 'party', cat: 'people', name: 'パーティーに行く', emoji: '🥳', min: 16, cost: 0.006, fx: { social: [4, 8], happy: [2, 5], health: [-2, 0] }, trait: ['社交的', 0.2],
    texts: ['初対面の人と意気投合。連絡先を交換した。', '盛り上がりすぎて、翌朝の記憶があいまい。'] },
  { id: 'parttime', cat: 'people', name: 'アルバイト', emoji: '🧃', min: 15, cost: 0, income: 0.06, fx: { social: [1, 3], mind: [-2, 0] }, studentOnly: true,
    texts: ['バイト先の先輩がやたら優しかった。', '初めての給料で、{mom}にお菓子を買って帰った。'] }
];
