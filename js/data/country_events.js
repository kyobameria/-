// 国ごとの文化イベント（その国に生まれたときだけ起こる）
window.DATA = window.DATA || {};

DATA.countryEvents = {
  JP: [
    { id: 'jp_753', emoji: '👘', title: '七五三', min: 7, max: 7, milestone: true,
      auto: (S, G) => { G.fx({ happy: 4, looks: 2 }); return '七五三で神社へ。千歳飴が長すぎて、引きずりながら歩いた。'; } },
    { id: 'jp_randoseru', emoji: '🎒', title: 'ランドセル選び', min: 5, max: 5, milestone: true,
      text: () => '来年は小学生！ランドセルを選びに行った。',
      choices: () => [
        { label: '❤️ 定番の赤・黒', t: ['伝統を重んじる'], do: (S, G) => { G.fx({ happy: 3 }); return '6年間、ピカピカに磨き続けた。'; } },
        { label: '💜 ラベンダー色', t: ['自由人'], do: (S, G) => { G.fx({ happy: 4, art: 2 }); return 'クラスで一人だけの色。それが誇らしかった。'; } },
        { label: '💰 おさがりでいい', t: ['倹約家'], do: (S, G) => { G.fx({ mind: 2 }); return 'いとこのお古。名前シールの跡が、なんだか頼もしい。'; } }
      ] },
    { id: 'jp_trip', emoji: '🚅', title: '修学旅行', min: 14, max: 14, milestone: true,
      text: () => '修学旅行で京都へ！自由行動はどこへ行く？',
      choices: () => [
        { label: '⛩️ 伏見稲荷の千本鳥居', t: ['伝統を重んじる'], do: (S, G) => { G.fx({ art: 4, fitness: 2 }); return '鳥居の数を数えようとして、87本目で挫折した。'; } },
        { label: '🗡️ 木刀を買う', t: ['ユーモア'], do: (S, G) => { G.fx({ happy: 5 }); return '班の全員が木刀を買った。先生にあきれられた。'; } },
        { label: '🍵 抹茶スイーツ巡り', t: ['食いしん坊'], do: (S, G) => { G.fx({ happy: 5 }); return '抹茶パフェ、抹茶だんご、抹茶ソフト。舌が緑色になった。'; } },
        { label: '🌙 夜の恋バナ大会', t: ['社交的'], do: (S, G) => { G.fx({ social: 5 }); return '消灯後、布団の中でひそひそ恋バナ。見回りの先生の足音にドキドキした。'; } }
      ] },
    { id: 'jp_seijin', emoji: '🎊', title: '成人式', min: 20, max: 20, milestone: true,
      setup: (S, G) => ({ cost: Math.round(G.avg() * 0.06) }),
      text: () => '二十歳の節目。成人式の日がやってきた。',
      info: (S, G, x) => [{ title: '', rows: [['👘 振袖・袴のレンタル代', G.fmt(x.cost)], ['💰 所持金', G.fmt(S.money)]] }],
      choices: (S, G, x) => [
        { label: '👘 振袖・袴で華やかに', t: ['伝統を重んじる'], do: (S, G) => { G.money(-x.cost); G.fx({ looks: 4, happy: 6 }); return '朝4時から着付け。写真館で撮った一枚は、' + G.relName('母') + 'のスマホの待ち受けになった。'; } },
        { label: '👔 スーツでシンプルに', t: ['現実主義'], do: (S, G) => { G.fx({ happy: 3 }); return '久しぶりに会った同級生たちと、居酒屋で朝まで語り明かした。'; } },
        { label: '🏠 行かない', t: ['人見知り'], do: (S, G) => { G.fx({ mind: 3 }); return '家でのんびり。' + G.relName('母') + 'が赤飯を炊いてくれた。'; } }
      ] },
    { id: 'jp_shukatsu', emoji: '🙇', title: '新年会の一発芸', min: 23, max: 35,
      cond: (S) => !!S.job,
      text: () => '会社の新年会で、新人恒例の「一発芸」を振られた！',
      choices: () => [
        { label: '🕺 全力でやる', t: ['ユーモア', '社交的'], do: (S, G) => { G.fx({ social: 6 }); return 'ものまねがまさかの大ウケ。部長に名前を覚えられた。'; } },
        { label: '🙇 丁重にスルー', t: ['人見知り'], do: (S, G) => { G.fx({ mind: 2 }); return '乾杯の音頭でごまかした。それも一つの芸。'; } }
      ] }
  ],
  CN: [
    { id: 'cn_zhuazhou', emoji: '🎎', title: '抓周（ジュアジョウ）', min: 1, max: 1, milestone: true,
      text: () => '1歳の誕生日。将来を占う伝統儀式「抓周」。何をつかむ？',
      choices: () => [
        { label: '🖌️ 筆', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 3 }); return '筆をつかんだ！おじいちゃんは「学者になる」と大喜び。'; } },
        { label: '🧮 そろばん', t: ['倹約家'], do: (S, G) => { G.fx({ smarts: 2 }); return 'そろばんをつかんだ。「商売上手になるぞ」と親戚中が拍手。'; } },
        { label: '🪙 お金', t: ['野心家'], do: (S, G) => { G.money(G.avg() * 0.002); return 'お金を握りしめて離さなかった。'; } },
        { label: '🍎 食べ物', t: ['食いしん坊'], do: (S, G) => { G.fx({ happy: 3 }); return 'りんごをかじった。「食いっぱぐれない子だ」と言われた。'; } }
      ] },
    { id: 'cn_gaokao', emoji: '📝', title: '高考（大学入試）', min: 17, max: 17, milestone: true,
      text: () => '人生を左右すると言われる「高考」まであと一年。',
      choices: () => [
        { label: '🔥 一日16時間勉強', t: ['努力家'], do: (S, G) => { G.fx({ smarts: 12, health: -5, mind: -6 }); return '教科書が全部ボロボロになった。それが努力の証。'; } },
        { label: '⚖️ バランスよく', t: ['現実主義'], do: (S, G) => { G.fx({ smarts: 6, mind: 2 }); return '勉強の合間に、友達と屋台の串焼きを食べた。'; } }
      ] },
    { id: 'cn_dance', emoji: '💃', title: '広場ダンス', min: 55, max: 90,
      text: () => '夕方の公園で、おばちゃんたちが広場ダンスを踊っている。',
      choices: () => [
        { label: '🕺 一緒に踊る', t: ['社交的'], do: (S, G) => { G.fx({ fitness: 6, social: 6, happy: 4 }); return 'いつの間にか最前列のリーダーになっていた。'; } },
        { label: '🪑 ベンチで見守る', t: ['のんびり屋'], do: (S, G) => { G.fx({ mind: 3 }); return 'ラジカセの音楽が、夕焼けによく似合った。'; } }
      ] }
  ],
  IN: [
    { id: 'in_cricket', emoji: '🏏', title: '路地裏クリケット', min: 7, max: 15, milestone: true,
      text: () => '近所の子どもたちと、路地裏でクリケット！',
      choices: () => [
        { label: '🏏 バッター！', t: ['負けず嫌い'], do: (S, G) => { G.fx({ fitness: 5 }); return '特大のシックス！…が、隣の家の窓ガラスを割った。'; } },
        { label: '⚾ ボウラー！', t: ['努力家'], do: (S, G) => { G.fx({ fitness: 4, smarts: 1 }); return '変化球を練習し続けて、近所で一番のボウラーになった。'; } }
      ] },
    { id: 'in_arranged', emoji: '💐', title: 'お見合い結婚の話', min: 21, max: 32,
      cond: (S, G) => !G.partner(),
      setup: (S, G) => ({ p: G.candidate() }),
      text: (S, G) => '両親が「いいご縁がある」と、お見合い相手の写真と経歴を持ってきた。',
      info: (S, G, x) => [{ title: '📋 お相手の情報（両親より）', rows: G.personRows(x.p) }],
      choices: (S, G, x) => [
        { label: '🙏 両親を信じて会う', t: ['伝統を重んじる', '家族思い'], do: (S, G) => { if (G.chance(0.7)) { x.p.since = S.age - 1; x.p.close = 60; G.marry(x.p); G.closeAll(['父', '母'], 10); G.fx({ happy: 10 }); return '🎉 3日間続く盛大な結婚式。象に乗った新郎がやってきた！'; } return 'お互いに「違う」と感じた。両親も理解してくれた。'; } },
        { label: '💕 恋愛結婚がしたい', t: ['ロマンチスト', '自由人'], do: (S, G) => { G.closeAll(['父', '母'], -6); return '家族会議は3時間に及んだ。最後には「あなたの人生だから」と言ってもらえた。'; } }
      ] },
    { id: 'in_yoga', emoji: '🧘', title: '朝のヨガ', min: 40, max: 90,
      text: () => 'ガンジス川のほとりで、朝のヨガに誘われた。',
      choices: () => [
        { label: '🧘 参加する', t: ['伝統を重んじる'], do: (S, G) => { G.fx({ health: 6, mind: 8 }); return '朝日を浴びながら太陽礼拝。体の奥からエネルギーがわいてきた。'; } },
        { label: '☕ チャイを飲みながら見る', t: ['のんびり屋'], do: (S, G) => { G.fx({ happy: 3 }); return 'マサラチャイの湯気越しに見る朝日も、悪くない。'; } }
      ] }
  ],
  US: [
    { id: 'us_lemonade', emoji: '🍋', title: 'レモネードスタンド', min: 6, max: 10, milestone: true,
      text: () => '夏休み、家の前でレモネードスタンドを開くことにした！',
      choices: () => [
        { label: '🍋 本格的にやる', t: ['野心家'], do: (S, G) => { G.money(G.avg() * 0.001); G.fx({ social: 4 }); return 'ご近所さんが次々と買ってくれた。人生初の「売上」！'; } },
        { label: '🍪 クッキーもおまけ', t: ['優しい'], do: (S, G) => { G.fx({ social: 6, happy: 3 }); return '利益はゼロ。でも町中の人と友達になった。'; } }
      ] },
    { id: 'us_prom', emoji: '💃', title: 'プロム', min: 17, max: 17, milestone: true,
      setup: (S, G) => ({ cost: Math.round(G.avg() * 0.01) }),
      text: () => '高校最後のダンスパーティー「プロム」の季節！',
      info: (S, G, x) => [{ title: '', rows: [['👗 ドレス・タキシード代', G.fmt(x.cost)]] }],
      choices: (S, G, x) => [
        { label: '🌹 気になる人を誘う', t: ['ロマンチスト'], do: (S, G) => { G.pay(x.cost); if (G.chance(0.5)) { G.fx({ happy: 10 }); return 'OKをもらった！コサージュを渡す手が震えた。'; } G.fx({ happy: -3 }); return '断られたけど、友達グループで行って結局一番楽しんだ。'; } },
        { label: '👯 友達同士で行く', t: ['社交的'], do: (S, G) => { G.pay(x.cost); G.fx({ social: 5, happy: 6 }); return 'リムジンを割り勘でレンタル。窓から叫んだ青春。'; } },
        { label: '🎮 行かずに家でゲーム', t: ['人見知り'], do: (S, G) => { G.fx({ mind: 3 }); return 'アンチ・プロム同盟の仲間たちと、朝までゲーム大会。'; } }
      ] },
    { id: 'us_roadtrip', emoji: '🚗', title: 'ロードトリップ', min: 19, max: 30,
      setup: (S, G) => ({ cost: Math.round(G.avg() * 0.03) }),
      text: () => '友達に「ルート66を横断しようぜ」と誘われた。',
      info: (S, G, x) => [{ title: '', rows: [['⛽ 費用', G.fmt(x.cost)], ['💰 所持金', G.fmt(S.money)]] }],
      choices: (S, G, x) => [
        { label: '🚗 行く！', t: ['冒険好き'], do: (S, G) => { G.money(-x.cost); G.fx({ happy: 10, social: 5 }); return '砂漠の真ん中でエンスト。でも星空の下で寝転んだ夜は、一生の宝物。'; } },
        { label: '💼 仕事があるので', t: ['現実主義'], do: () => 'みんなから届く写真を見て、ちょっとだけ後悔した。' }
      ] }
  ],
  ID: [
    { id: 'id_batik', emoji: '🧵', title: 'バティック作り', min: 8, max: 20,
      text: () => 'おばあちゃんが、伝統の染物「バティック」を教えてくれるという。',
      choices: () => [
        { label: '🎨 教わる', t: ['伝統を重んじる', '芸術家肌'], do: (S, G) => { G.fx({ art: 8 }); return 'ろうけつ染めの線がガタガタ。でもおばあちゃんは「いい模様だね」と笑った。'; } },
        { label: '⚽ 友達とサッカーへ', t: ['運動好き'], do: (S, G) => { G.fx({ fitness: 4 }); return 'また今度ね、と言ったけど、あの時教わればよかった。'; } }
      ] },
    { id: 'id_ramadan', emoji: '🌙', title: '初めての断食', min: 9, max: 12, milestone: true,
      text: () => 'ラマダン。今年は初めて、大人と同じように断食に挑戦する。',
      choices: () => [
        { label: '💪 最後までやりきる', t: ['努力家'], do: (S, G) => { G.fx({ mind: 5, smarts: 2 }); return '30日間やりきった！レバランのごちそうが、人生で一番おいしかった。'; } },
        { label: '🍌 こっそりおやつ', t: ['ずる賢い'], do: (S, G) => { G.fx({ happy: 2 }); return 'バナナの皮を隠しそびれて、すぐにバレた。'; } }
      ] }
  ],
  PK: [
    { id: 'pk_mehndi', emoji: '🌿', title: 'メヘンディの夜', min: 10, max: 40,
      text: () => 'いとこの結婚式前夜、メヘンディ（ヘナ）の宴が開かれた。',
      choices: () => [
        { label: '💃 ダンスを披露', t: ['社交的'], do: (S, G) => { G.fx({ social: 6, happy: 5 }); return 'ドーラクの太鼓に合わせて踊りまくった。親戚中の注目の的！'; } },
        { label: '🎨 手にヘナを描いてもらう', t: ['芸術家肌'], do: (S, G) => { G.fx({ looks: 3, art: 3 }); return '繊細な模様が手を覆った。一週間、手を見るたびにうっとりした。'; } }
      ] },
    { id: 'pk_cricket', emoji: '🏏', title: 'クリケットの試合', min: 8, max: 70,
      auto: (S, G) => { G.fx({ happy: 8, social: 3 }); return 'クリケットの国際試合で母国が勝利！夜中まで通りに歓声と花火が響いた。'; } }
  ],
  NG: [
    { id: 'ng_jollof', emoji: '🍛', title: 'ジョロフ戦争', min: 12, max: 60,
      text: () => 'ガーナ人の友達と「どっちの国のジョロフライスが本物か」で大論争になった。',
      choices: () => [
        { label: '🔥 一歩も引かない', t: ['負けず嫌い'], do: (S, G) => { G.fx({ social: 3 }); return '結局、両方作って食べ比べ。どちらもおいしかった（でもナイジェリアの勝ち）。'; } },
        { label: '🤝 両方最高！', t: ['優しい'], do: (S, G) => { G.fx({ social: 5 }); return '平和条約を結んだ。毎月ジョロフパーティーを開くことに。'; } }
      ] },
    { id: 'ng_nollywood', emoji: '🎬', title: 'ノリウッドのエキストラ', min: 15, max: 40,
      text: () => '近所でノリウッド映画の撮影が！エキストラを募集している。',
      choices: () => [
        { label: '🎬 参加する', t: ['冒険好き'], do: (S, G) => { G.fx({ social: 4, art: 4, happy: 4 }); return '通行人Bの役。0.5秒だけ映った自分を、家族みんなで100回見た。'; } },
        { label: '👀 見学だけ', do: (S, G) => { G.fx({ art: 2 }); return '監督の怒鳴り声と俳優の涙。映画の裏側はドラマだった。'; } }
      ] }
  ],
  BR: [
    { id: 'br_futebol', emoji: '⚽', title: 'サッカー少年団のテスト', min: 9, max: 15, milestone: true,
      text: () => 'ビーチサッカーでのプレーを見た地元クラブのコーチが、テストに来ないかと誘ってくれた！',
      info: (S, G) => [{ title: '', rows: G.statRows(['fitness']) }],
      choices: () => [
        { label: '⚽ テストを受ける', t: ['負けず嫌い', '運動好き'], do: (S, G) => { if (G.chance(G.pass(S.stats.fitness, 60))) { G.fx({ fitness: 10, happy: 8 }); S.flags.footballer = true; return '合格！ユースチームのユニフォームに袖を通した。'; } G.fx({ fitness: 4, happy: -4 }); return '不合格。でも、ビーチで蹴るボールは今日も楽しい。'; } },
        { label: '🏖️ 遊びのままがいい', t: ['自由人'], do: (S, G) => { G.fx({ happy: 4 }); return 'サッカーは「楽しむもの」。それが自分のスタイル。'; } }
      ] },
    { id: 'br_worldcup', emoji: '🏆', title: 'ワールドカップ', min: 5, max: 95, once: false, w: 0.6,
      auto: (S, G) => { G.fx({ happy: 6, social: 3 }); return G.pick(['ワールドカップで母国がゴール！ 近所中から爆竹と叫び声が響いた。', 'ワールドカップでまさかの敗退…。国中がお葬式みたいな空気になった。']); } }
  ],
  BD: [
    { id: 'bd_monsoon', emoji: '🌧️', title: 'モンスーン', min: 3, max: 90,
      text: () => '激しいモンスーンで、町が水浸しになった。',
      choices: () => [
        { label: '⛵ 紙の船を浮かべて遊ぶ', t: ['楽観的'], do: (S, G) => { G.fx({ happy: 4 }); return '水たまりが海になった。紙の船はどこまでも流れていった。'; } },
        { age: [10, 90], label: '🙌 近所の片付けを手伝う', t: ['優しい'], do: (S, G) => { G.fx({ social: 5, fitness: 2 }); return 'みんなで泥をかき出した。終わった後のチャがしみた。'; } },
        { age: [3, 9], label: '🪟 窓から雨を眺める', t: ['のんびり屋'], do: (S, G) => { G.fx({ mind: 3, art: 2 }); return '窓にあたる雨粒の競争を、どっちが先に落ちるか予想して遊んだ。'; } }
      ] },
    { id: 'bd_language', emoji: '🌺', title: '言語の日（ショヒド・ミナール）', min: 8, max: 90,
      auto: (S, G) => { G.fx({ art: 3, mind: 2 }); return '2月21日、裸足で献花の列に並んだ。母語を守った人たちへの感謝を込めて。'; } }
  ],
  RU: [
    { id: 'ru_dacha', emoji: '🥒', title: 'ダーチャの夏', min: 5, max: 14, milestone: true,
      text: () => '夏休みはおばあちゃんのダーチャ（郊外の菜園付き別荘）で過ごすことに。',
      choices: () => [
        { label: '🥒 畑仕事を手伝う', t: ['努力家'], do: (S, G) => { G.fx({ fitness: 5, health: 3 }); return 'きゅうりのピクルスを100本漬けた。指が酸っぱい匂い。'; } },
        { label: '🍄 森でキノコ狩り', t: ['冒険好き'], do: (S, G) => { G.fx({ happy: 5, smarts: 2 }); return 'バケツいっぱいのキノコ。おばあちゃんが半分「毒」と言って捨てた。'; } },
        { label: '📚 ハンモックで読書', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 5, mind: 3 }); return '白夜の光の中で、トルストイを読み切った。'; } }
      ] },
    { id: 'ru_icebath', emoji: '🧊', title: '氷の穴に飛び込む', min: 16, max: 80,
      text: () => '1月の神現祭。凍った湖に開けた十字の穴に飛び込む伝統行事だ。',
      choices: () => [
        { label: '🧊 飛び込む！', t: ['冒険好き', '伝統を重んじる'], do: (S, G) => { G.fx({ health: G.r(-3, 6), mind: 6 }); return '心臓が止まるかと思った。上がった瞬間、全身から湯気が出た。生まれ変わった気分。'; } },
        { label: '🍵 岸で紅茶を飲む', t: ['慎重派'], do: () => 'サモワールの紅茶をすすりながら、勇者たちに拍手を送った。' }
      ] }
  ],
  ET: [
    { id: 'et_run', emoji: '🏃', title: '高地のランニング', min: 10, max: 30,
      text: () => '標高2400mの丘を、朝霧の中ランナーたちが駆けていく。',
      choices: () => [
        { label: '🏃 一緒に走る', t: ['運動好き', '負けず嫌い'], do: (S, G) => { G.fx({ fitness: 10, health: 4 }); return '息が苦しい。でも、ゴールで見た朝日は格別だった。'; } },
        { label: '👏 応援する', do: (S, G) => { G.fx({ social: 2 }); return '裸足で走るランナーの背中に、夢を見た。'; } }
      ] }
  ],
  MX: [
    { id: 'mx_quince', emoji: '👑', title: 'キンセアニェーラ', min: 15, max: 15, milestone: true,
      cond: (S) => S.gender === 'f',
      setup: (S, G) => ({ cost: Math.round(G.avg() * 0.15) }),
      text: () => '15歳の誕生日。少女から大人になる「キンセアニェーラ」のお祝い！',
      info: (S, G, x) => [{ title: '', rows: [['🎉 盛大なパーティーの費用（家族負担）', G.fmt(x.cost)], ['🏠 家の貯金', G.fmt(S.familySavings)]] }],
      choices: (S, G, x) => [
        { label: '👗 ドレスで盛大に', t: ['伝統を重んじる'], do: (S, G) => { S.familySavings -= x.cost; G.fx({ happy: 12, looks: 4, social: 5 }); return 'ふわふわのドレスで' + G.relName('父') + 'とワルツを踊った。最後に、ぺたんこ靴からヒールに履き替えた。'; } },
        { label: '✈️ パーティーより旅行がいい', t: ['冒険好き'], do: (S, G) => { G.fx({ happy: 8, smarts: 3 }); return '家族で旅行へ。新しい景色の中で迎えた15歳。'; } }
      ] },
    { id: 'mx_altar', emoji: '🌼', title: '祭壇づくり', min: 30, max: 99,
      cond: (S, G) => S.people.some(p => !p.alive),
      setup: (S, G) => ({ p: G.pick(S.people.filter(p => !p.alive)) }),
      auto: (S, G, x) => { G.fx({ mind: 6, art: 3 }); return '死者の日。亡くなった' + G.fn(x.p) + 'の写真と好物を祭壇に飾った。マリーゴールドの道を通って、帰ってきてくれますように。'; } }
  ],
  PH: [
    { id: 'ph_debut', emoji: '🌹', title: 'デビュタント（18歳の祝い）', min: 18, max: 18, milestone: true,
      cond: (S) => S.gender === 'f',
      auto: (S, G) => { G.fx({ happy: 10, social: 5 }); return '18歳の「デビュー」パーティー。18本のバラを持った18人と順番に踊った。'; } },
    { id: 'ph_karaoke', emoji: '🎤', title: '近所のカラオケ大会', min: 8, max: 90, once: false, w: 0.6,
      text: () => '近所の家の前で、マイクが回ってきた！',
      choices: () => [
        { label: '🎤 熱唱する', t: ['社交的'], do: (S, G) => { G.fx({ social: 4, happy: 5 }); return '高得点！近所中から拍手が起きた。'; } },
        { label: '😅 マイクを回す', t: ['人見知り'], do: () => '聴く側も、立派な参加者。' }
      ] }
  ],
  EG: [
    { id: 'eg_pyramid', emoji: '🐫', title: 'ピラミッド遠足', min: 8, max: 14, milestone: true,
      auto: (S, G) => { G.fx({ smarts: 4, art: 3 }); return '学校の遠足でギザのピラミッドへ。ラクダにつばを吐かれた。'; } },
    { id: 'eg_iftar', emoji: '🍲', title: 'みんなのイフタール', min: 10, max: 90,
      text: () => 'ラマダン中、通りに長いテーブルを並べて誰でも食べられる「慈悲の食卓」を出す人がいる。',
      choices: () => [
        { label: '🙌 準備を手伝う', t: ['優しい'], do: (S, G) => { G.fx({ social: 5, happy: 5 }); return '知らない人同士が、日没と同時に「いただきます」。'; } },
        { label: '🏠 家族と過ごす', t: ['家族思い'], do: (S, G) => { G.fx({ happy: 4 }); return '家族でモロヘイヤスープを囲んだ。'; } }
      ] }
  ],
  VN: [
    { id: 'vn_bike', emoji: '🛵', title: '初めてのバイク', min: 16, max: 20, milestone: true,
      text: () => 'ついにバイクの免許をとれる年齢に！',
      choices: () => [
        { label: '🛵 さっそく乗り回す', t: ['冒険好き'], do: (S, G) => { G.fx({ happy: 8 }); return '朝のラッシュのバイクの洪水に飛び込んだ。生きて帰ってこられた。'; } },
        { label: '🚶 安全第一で練習', t: ['慎重派'], do: (S, G) => { G.fx({ mind: 3 }); return '路地裏でゆっくり練習。おばあさんの自転車に抜かれた。'; } }
      ] },
    { id: 'vn_coffee', emoji: '☕', title: '路上カフェ', min: 15, max: 90, once: false, w: 0.5,
      auto: (S, G) => { G.fx({ mind: 4 }); return '風呂場の椅子みたいな小さなプラスチックの椅子に座って、甘いカフェ・スア・ダーを飲んだ。街の音がBGM。'; } }
  ],
  DE: [
    { id: 'de_schultuete', emoji: '🎁', title: 'シュールテューテ', min: 6, max: 6, milestone: true,
      auto: (S, G) => { G.fx({ happy: 6 }); return '入学式の日、自分の背丈くらいの円すい形の袋「シュールテューテ」をもらった。中身はお菓子と文房具！'; } },
    { id: 'de_ausbildung', emoji: '🔧', title: '職業訓練（アウスビルドゥング）', min: 16, max: 16, milestone: true,
      text: () => 'ドイツでは、大学に行かずに職業訓練を受ける道もある。',
      choices: () => [
        { label: '🔧 職人を目指す', t: ['努力家', '現実主義'], do: (S, G) => { G.fx({ smarts: 4, fitness: 3 }); S.flags.vocational = true; return 'マイスターの下で修業を始めた。手が覚えることがある。'; } },
        { label: '📚 ギムナジウムで大学を目指す', t: ['好奇心旺盛'], do: (S, G) => { G.fx({ smarts: 5 }); return 'アビトゥーア（大学入学資格）を目指して勉強漬けの日々。'; } }
      ] }
  ],
  TR: [
    { id: 'tr_tea', emoji: '🍵', title: 'チャイの時間', min: 12, max: 95, once: false, w: 0.6,
      auto: (S, G) => { G.fx({ social: 3, mind: 3 }); return 'チューリップ型のグラスで、一日7杯目のチャイ。近所のおじさんたちと延々おしゃべり。'; } },
    { id: 'tr_nazar', emoji: '🧿', title: 'ナザール・ボンジュウ', min: 0, max: 0, milestone: true,
      auto: (S, G) => { S.flags.lucky = true; return '🧿 生まれたその日、ベビーベッドに青い目玉のお守り「ナザール」が吊るされた。'; } }
  ],
  TH: [
    { id: 'th_monk', emoji: '🧡', title: '出家体験', min: 20, max: 22, milestone: true,
      cond: (S) => S.gender === 'm',
      text: () => 'タイの男性は一生に一度、短期間出家する習慣がある。',
      choices: () => [
        { label: '🧡 3か月出家する', t: ['伝統を重んじる'], do: (S, G) => { G.fx({ mind: 15, smarts: 3 }); G.closeAll(['父', '母'], 10); return '頭を剃り、オレンジの袈裟をまとった。托鉢の朝、街の人々の優しさに触れた。'; } },
        { label: '🙏 今は見送る', t: ['自由人'], do: () => 'いつか心が求めたときに、と思った。' }
      ] },
    { id: 'th_market', emoji: '🛶', title: '水上マーケット', min: 5, max: 90,
      auto: (S, G) => { G.fx({ happy: 5 }); return '小舟の上で焼いたバナナを買った。舟ごと揺れながら食べた。'; } }
  ],
  GB: [
    { id: 'gb_gap', emoji: '🎒', title: 'ギャップイヤー', min: 18, max: 18,
      cond: (S) => S.school === 'univ',
      auto: (S, G) => { G.fx({ mind: 5 }); return '大学に入る前に、ギャップイヤーの話題で友達と盛り上がった。'; } },
    { id: 'gb_tea', emoji: '☕', title: 'ミルクティー論争', min: 10, max: 90,
      text: () => '「ミルクが先か、紅茶が先か」。家族で決着をつける日がきた。',
      choices: () => [
        { label: '🥛 ミルクが先！', t: ['伝統を重んじる'], do: () => '祖母が深くうなずいた。' },
        { label: '🫖 紅茶が先！', t: ['現実主義'], do: () => '祖父が満足そうにうなずいた。夫婦喧嘩は今日も続く。' }
      ] }
  ],
  FR: [
    { id: 'fr_bac', emoji: '📜', title: 'バカロレア（哲学の試験）', min: 17, max: 17, milestone: true,
      text: () => '大学入学資格「バカロレア」の哲学の問題：「幸福は手に入れられるか？」',
      choices: () => [
        { label: '✍️ 4時間かけて論じる', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 8 }); return '答案用紙8枚に、自分なりの幸福論を書き上げた。'; } },
        { label: '😌 「今、ここにある」と書く', t: ['楽観的'], do: (S, G) => { G.fx({ mind: 6, smarts: 2 }); return '短い答えだったけど、先生のコメントは「興味深い」。'; } }
      ] },
    { id: 'fr_bread', emoji: '🥖', title: 'バゲットのおつかい', min: 6, max: 12,
      auto: (S, G) => { G.fx({ happy: 3 }); return '焼きたてのバゲットを買いに行かされた。家に着くころには、先っぽがなくなっていた。'; } }
  ],
  IT: [
    { id: 'it_nonna', emoji: '👵', title: 'ノンナのパスタ教室', min: 6, max: 30,
      text: () => 'ノンナ（おばあちゃん）が、秘伝の手打ちパスタを教えてくれるという。',
      choices: () => [
        { label: '🍝 弟子入りする', t: ['伝統を重んじる', '食いしん坊'], do: (S, G) => { G.fx({ art: 5, happy: 5 }); S.flags.nonnaRecipe = true; return '「計量カップ？そんなもの心で量るのよ」。秘伝のレシピは、手のひらで受け継がれた。'; } },
        { label: '🍕 ピザのほうがいい', t: ['自由人'], do: (S, G) => { G.fx({ happy: 3 }); return 'ノンナにパスタで頭を叩かれた（愛情表現）。'; } }
      ] },
    { id: 'it_espresso', emoji: '☕', title: 'バールで一杯', min: 16, max: 95, once: false, w: 0.5,
      auto: (S, G) => { G.fx({ mind: 3, social: 2 }); return 'バールのカウンターで立ち飲みのエスプレッソ。30秒の、至福の時間。'; } }
  ],
  KE: [
    { id: 'ke_safari', emoji: '🦁', title: 'サファリ', min: 6, max: 70,
      setup: (S, G) => ({ cost: Math.round(G.avg() * 0.05) }),
      text: () => 'マサイマラでヌーの大移動が始まったらしい！',
      info: (S, G, x) => [{ title: '', rows: [['🚙 サファリツアー代', G.fmt(x.cost)], [S.age < 18 ? '🏠 家の貯金' : '💰 あなたの貯金', G.fmt(S.age < 18 ? S.familySavings : S.money)]] }],
      choices: (S, G, x) => [
        { label: '🚙 見に行く', t: ['冒険好き', '動物好き'], do: (S, G) => { G.pay(x.cost); G.fx({ happy: 10, art: 4 }); return '地平線まで続くヌーの群れ。川を渡る瞬間、思わず息を止めた。'; } },
        { label: '🏠 写真で我慢', do: () => 'いつか必ず、と心に決めた。' }
      ] },
    { id: 'ke_marathon', emoji: '🏅', title: '村のマラソン大会', min: 10, max: 40,
      text: () => 'ランナーの国ケニア。村のマラソン大会に出てみる？',
      choices: () => [
        { label: '🏃 出場する', t: ['運動好き'], do: (S, G) => { G.fx({ fitness: 8 }); if (S.stats.fitness > 75 && G.chance(0.3)) { G.fx({ happy: 10 }); return '🏅 まさかの優勝！スカウトが名刺を置いていった。'; } return '完走！足は棒だけど、心は軽い。'; } },
        { label: '📣 応援する', do: (S, G) => { G.fx({ social: 2 }); return '沿道からの声援で、知り合いのランナーが自己ベストを出した。'; } }
      ] }
  ],
  KR: [
    { id: 'kr_dol', emoji: '🎎', title: 'トルジャンチ（1歳のお祝い）', min: 1, max: 1, milestone: true,
      text: () => '1歳の誕生日。韓服を着て「トルジャビ」（将来を占う品物選び）！',
      choices: () => [
        { label: '✏️ 鉛筆', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 3 }); return '鉛筆をつかんだ。「勉強ができる子になる」と大歓声。'; } },
        { label: '🎤 マイク', t: ['社交的'], do: (S, G) => { G.fx({ social: 3 }); return 'マイクをつかんだ！「アイドルになるかも」と親戚が沸いた。'; } },
        { label: '🧵 糸', t: ['のんびり屋'], do: (S, G) => { G.fx({ health: 3 }); return '糸をつかんだ。「長生きするよ」とおばあちゃんが涙ぐんだ。'; } },
        { label: '💵 お金', t: ['野心家'], do: (S, G) => { G.money(G.avg() * 0.002); return 'お札を握りしめた。'; } }
      ] },
    { id: 'kr_suneung', emoji: '📝', title: '修能（スヌン）', min: 17, max: 17, milestone: true,
      text: () => '大学修学能力試験の日。飛行機の離着陸すら止まる、国を挙げた試験日だ。',
      choices: () => [
        { label: '🔥 塾と自習室で猛勉強してきた', t: ['努力家'], do: (S, G) => { G.fx({ smarts: 10, mind: -6, health: -3 }); return '後輩たちの応援と、校門前の飴とお茶。全部出し切った。'; } },
        { label: '🍀 自分のペースでやってきた', t: ['のんびり屋'], do: (S, G) => { G.fx({ smarts: 4, mind: 3 }); return '試験後、家族とチキンを食べた。結果はどうあれ、よく頑張った。'; } }
      ] },
    { id: 'kr_army', emoji: '🪖', title: '兵役', min: 20, max: 21, milestone: true,
      cond: (S) => S.gender === 'm',
      auto: (S, G) => { G.fx({ fitness: 12, mind: -4, social: 4 }); return '🪖 兵役へ。坊主頭に軍服。約1年半、仲間と汗を流した。除隊の日、空がやけに広かった。'; } },
    { id: 'kr_jjimjil', emoji: '♨️', title: 'チムジルバン', min: 6, max: 95, once: false, w: 0.5,
      auto: (S, G) => { G.fx({ mind: 5, health: 2 }); return 'チムジルバンで羊巻きタオルをかぶって、ゆで卵と甘いシッケ。最高の週末。'; } }
  ],
  CA: [
    { id: 'ca_hockey', emoji: '🏒', title: 'アイスホッケー', min: 6, max: 14, milestone: true,
      text: () => '凍った池で、近所の子たちがホッケーをしている。',
      choices: () => [
        { label: '🏒 参加する', t: ['運動好き'], do: (S, G) => { G.fx({ fitness: 6, social: 3 }); return '転んでばかりだったけど、初ゴールは一生忘れない。'; } },
        { label: '⛸️ フィギュアスケートの練習', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 4, fitness: 3 }); return '一回転ジャンプに成功！氷の上で風になった気分。'; } }
      ] },
    { id: 'ca_aurora', emoji: '🌌', title: 'オーロラの夜', min: 8, max: 95,
      auto: (S, G) => { G.fx({ art: 5, mind: 6 }); return '真夜中に起こされて外に出たら、空一面にオーロラが揺れていた。言葉が出なかった。'; } }
  ]
};
