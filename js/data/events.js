// イベントデータ（世界共通）
// 形式:
//  id, emoji, title, min, max（年齢）, w（出やすさ）, once（一度きりか）, milestone（条件を満たしたら必ず起きる）
//  cond(S,G)          … 発生条件
//  setup(S,G)         … このイベント用の一時データ（ctx）を作る
//  text(S,G,ctx)      … 本文
//  info(S,G,ctx)      … 選ぶために必要な情報 [{title, rows:[[項目,値],...]}]
//  choices(S,G,ctx)   … 選択肢 [{label, sub, ok, t:[性格], do(S,G,ctx) => 結果テキスト}]
//  auto(S,G,ctx)      … 選択肢なしで自動的に起こる
window.DATA = window.DATA || {};

DATA.events = [
  // ============ 節目（マイルストーン） ============
  {
    id: 'club', emoji: '🏸', title: '部活動を選ぼう', min: 12, max: 12, milestone: true,
    cond: (S) => S.school === 'middle',
    text: (S, G) => '中学校に入学！放課後の過ごし方を決める季節がやってきた。',
    info: (S, G) => [{ title: 'いまのあなた', rows: G.statRows(['fitness', 'art', 'smarts', 'social']) }],
    choices: () => [
      { label: '⚽ 運動部に入る', sub: '体力・健康アップ', t: ['運動好き'], do: (S, G) => { G.fx({ fitness: 10, health: 4, social: 3 }); S.club = '運動部'; return '毎日泥だらけで帰宅。先輩の声出しが、だんだん自分の声になっていった。'; } },
      { label: '🎺 吹奏楽部・合唱部', sub: '感性・社交性アップ', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 9, social: 4 }); S.club = '吹奏楽部'; return '最初は音すら出なかった楽器。夏のコンクールで、みんなの音が一つになった。'; } },
      { label: '🖼️ 美術部・漫画研究部', sub: '感性大幅アップ', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 12, mind: 3 }); S.club = '美術部'; return '静かな美術室で、絵の具の匂いに包まれる時間が好きになった。'; } },
      { label: '🔬 科学部・パソコン部', sub: '知性アップ', t: ['好奇心旺盛'], do: (S, G) => { G.fx({ smarts: 10, social: 2 }); S.club = '科学部'; return 'ペットボトルロケットを校舎の3階より高く飛ばした。顧問の先生が一番はしゃいでいた。'; } },
      { label: '🏠 帰宅部', sub: '心の余裕アップ', t: ['のんびり屋'], do: (S, G) => { G.fx({ mind: 8, happy: 3 }); S.club = '帰宅部'; return '帰宅部エース。夕方のアニメを一話も見逃さなかった。'; } }
    ]
  },
  {
    id: 'highschool', emoji: '🏫', title: '高校受験', min: 15, max: 15, milestone: true,
    cond: (S) => S.school === 'middle_done',
    text: () => '中学校卒業が近づいてきた。進路を決めなければならない。',
    info: (S, G) => [
      { title: 'いまのあなた', rows: G.statRows(['smarts', 'fitness', 'art']) },
      { title: '家庭の状況', rows: G.familyMoneyRows() }
    ],
    choices: (S, G) => [
      { label: '📚 難関の進学校を受験', sub: '知性55以上で合格しやすい', t: ['野心家'], do: (S, G) => {
        if (G.chance(G.pass(S.stats.smarts, 55))) { S.school = 'high'; S.schoolName = '進学校'; G.fx({ smarts: 6, happy: 6 }); return '🌸 合格発表の掲示板に自分の番号を見つけた！家族みんなで抱き合った。'; }
        S.school = 'high'; S.schoolName = '普通科高校'; G.fx({ happy: -6, mind: -4 }); return '不合格…。でも滑り止めの高校で、かけがえのない出会いが待っていた。'; } },
      { label: '🏫 地元の普通高校へ', sub: 'のんびり確実に', t: ['のんびり屋'], do: (S, G) => { S.school = 'high'; S.schoolName = '普通科高校'; G.fx({ mind: 4, social: 3 }); return '地元の高校に入学。中学からの友達も多く、気楽な毎日が始まった。'; } },
      { label: '🔧 専門・工業・商業高校へ', sub: '手に職をつける', t: ['現実主義'], do: (S, G) => { S.school = 'high'; S.schoolName = '専門高校'; S.flags.vocational = true; G.fx({ smarts: 3, fitness: 2 }); return '実習で初めて自分の手で作った作品に、言葉にできない達成感があった。'; } },
      { label: '💼 進学せずに働く', sub: 'すぐにお金を稼げる', t: ['自由人'], do: (S, G) => { S.school = 'none'; S.edu = 2; G.queue('jobhunt'); return '15歳で社会へ。教科書の代わりに、仕事が先生になった。'; } }
    ]
  },
  {
    id: 'university', emoji: '🎓', title: '高校卒業後の進路', min: 18, max: 18, milestone: true,
    cond: (S) => S.school === 'high_done',
    setup: (S, G) => ({ tuition: Math.round(G.avg() * 0.28), years: 4 }),
    text: () => '高校卒業。ここから先は自分で選ぶ道だ。',
    info: (S, G, x) => [
      { title: '選ぶための情報', rows: [
        ['📚 あなたの知性', S.stats.smarts + ' / 100'],
        ['🎓 大学の学費（年間）', G.fmt(x.tuition) + ' × 4年'],
        ['🏠 家の貯金', G.fmt(S.familySavings)],
        ['💰 あなたの貯金', G.fmt(S.money)]
      ] },
      { title: '家族の収入', rows: G.familyMoneyRows() }
    ],
    choices: (S, G, x) => [
      { label: '🎓 大学に進学する', sub: S.familySavings >= x.tuition * 4 ? '家族が学費を出してくれる' : '学費が足りないので奨学金（借金）を借りる', t: ['好奇心旺盛'], do: (S, G) => {
        const total = x.tuition * 4;
        if (!G.chance(G.pass(S.stats.smarts, 40) + 0.15)) { G.fx({ happy: -8 }); S.school = 'none'; S.edu = 3; G.queue('jobhunt'); return '受験に失敗…。浪人はせず、働きながら次の道を探すことにした。'; }
        if (S.familySavings >= total) { S.familySavings -= total; } else { const lack = total - Math.max(0, S.familySavings); S.familySavings = 0; S.debt += lack; G.log('📄 奨学金を借りた（返済額 ' + G.fmt(lack) + '）', 'sad'); }
        S.school = 'univ'; S.schoolYears = 0; G.fx({ smarts: 6, happy: 6, social: 3 });
        return '🌸 大学に合格！キャンパスの広さにまず迷子になった。'; } },
      { label: '🛠️ 専門学校で技術を学ぶ', sub: '学費は大学の半分、2年間', t: ['努力家'], do: (S, G) => {
        const total = x.tuition; if (S.familySavings >= total) S.familySavings -= total; else S.debt += total;
        S.school = 'vocational'; S.schoolYears = 0; G.fx({ smarts: 3, art: 4 }); return '専門学校に入学。好きなことを勉強するのは、こんなに楽しかったのか。'; } },
      { label: '💼 就職する', sub: '高卒で働き始める', t: ['現実主義'], do: (S, G) => { S.school = 'none'; S.edu = 3; G.queue('jobhunt'); return '社会人の一歩を踏み出すことにした。'; } },
      { label: '🌍 1年かけて世界を旅する', sub: '費用 ' + G.fmt(G.avg() * 0.15) + '・冒険心が育つ', t: ['冒険好き', '自由人'], do: (S, G) => {
        G.money(-G.avg() * 0.15); S.school = 'none'; S.edu = 3; G.fx({ happy: 10, mind: 8, smarts: 4, social: 5, art: 4 });
        return '🎒 バックパック一つで' + G.abroad() + 'へ。帰ってきたら、少しだけ世界が小さく、自分が大きく感じた。'; } }
    ]
  },
  {
    id: 'after_univ', emoji: '🎓', title: '大学卒業', min: 21, max: 30, milestone: true,
    cond: (S) => S.school === 'univ_done',
    text: () => '卒業式。角帽を投げた先に、どんな未来が待っているだろう。',
    info: (S, G) => [{ title: 'いまのあなた', rows: G.statRows(['smarts', 'social', 'art']).concat([['📄 奨学金の残り', G.fmt(S.debt)]]) }],
    choices: () => [
      { label: '💼 就職活動をする', sub: '大卒の求人から選べる', do: (S, G) => { S.school = 'none'; S.edu = 4; G.queue('jobhunt'); return 'リクルートスーツに袖を通した。似合っているかは、まだわからない。'; } },
      { label: '🔬 大学院に進む', sub: '2年間・医師や弁護士を目指せる', t: ['努力家'], do: (S, G) => { S.school = 'grad'; S.schoolYears = 0; S.edu = 4; G.fx({ smarts: 6 }); S.debt += Math.round(G.avg() * 0.3); return '研究室の窓から見える夕焼けが、だんだん日常になっていった。'; } },
      { label: '🌱 しばらく自分探しをする', sub: '心の余裕アップ・収入なし', t: ['自由人'], do: (S, G) => { S.school = 'none'; S.edu = 4; G.fx({ mind: 10, happy: 4 }); return '少し立ち止まることにした。焦らなくても、道はきっと見つかる。'; } }
    ]
  },
  {
    id: 'retire', emoji: '🌅', title: '定年', min: 62, max: 70, milestone: true,
    cond: (S) => S.job && !S.flags.retireAsked,
    info: (S, G) => [{ title: 'お金のこと', rows: G.moneyRows().concat([['🧓 年金（年間）', G.fmt(G.avg() * 0.35)]]) }],
    text: (S, G) => '長年勤めた「' + G.jobName() + '」の仕事。そろそろ引退を考える時期がきた。',
    choices: () => [
      { label: '🌅 引退する', sub: '年金生活・心の余裕アップ', t: ['のんびり屋'], do: (S, G) => { S.flags.retireAsked = true; G.retire(); G.fx({ mind: 12, happy: 6 }); return '最後の出勤日。花束をもらって、少し泣いた。明日からは、自分の時間だ。'; } },
      { label: '💪 まだまだ働く', sub: '収入は続くが体力が必要', t: ['努力家'], do: (S, G) => { S.flags.retireAsked = true; S.income = Math.round(S.income * 0.7); G.fx({ smarts: 2, health: -2 }); return '「まだ若いもんには負けない」。働き続けることを選んだ。'; } }
    ]
  },

  // ============ こども時代 ============
  {
    id: 'toy_fight', emoji: '🧸', title: 'おもちゃの取り合い', min: 3, max: 6,
    setup: (S, G) => ({ f: G.friendName() }),
    text: (S, G, x) => '保育園で、' + x.f + 'がお気に入りのおもちゃを取っていった！',
    choices: (S, G, x) => [
      { label: '😤 取り返す！', t: ['負けず嫌い'], do: (S, G) => { G.fx({ fitness: 2, social: -1 }); return '全力で引っ張り合い、二人とも泣いた。先生に「なかよくね」と言われた。'; } },
      { label: '🤲 「どうぞ」と貸してあげる', t: ['優しい'], do: (S, G) => { G.fx({ social: 4, happy: 2 }); return x.f + 'が「ありがとう」と笑った。それから二人は親友になった。'; } },
      { label: '🙋 先生に言いつける', t: ['正義感'], do: (S, G) => { G.fx({ smarts: 1 }); return '先生が順番を決めてくれた。ルールって大事。'; } }
    ]
  },
  {
    id: 'grab', emoji: '🔮', title: '将来を占う儀式', min: 1, max: 1, w: 3,
    cond: (S) => !['CN', 'KR'].includes(S.country),
    text: () => '1歳の誕生日。目の前に色々な物が並べられた。どれをつかむ？',
    choices: () => [
      { label: '📕 本', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 3 }); return '迷わず本をつかんだ。家族は「学者さんになるかも」と大喜び。'; } },
      { label: '🍰 ケーキ', t: ['食いしん坊'], do: (S, G) => { G.fx({ happy: 3 }); return 'ケーキに顔からダイブした。まあ、そういう人生もいい。'; } },
      { label: '⚽ ボール', t: ['運動好き'], do: (S, G) => { G.fx({ fitness: 3 }); return 'ボールを抱えて離さなかった。'; } },
      { label: '🖍️ クレヨン', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 3 }); return 'クレヨンで床に大作を描き始めた。'; } }
    ]
  },
  {
    id: 'wallet', emoji: '👛', title: '落とし物', min: 7, max: 17,
    setup: (S, G) => ({ amt: Math.round(G.avg() * 0.004) }),
    text: (S, G, x) => '帰り道、財布を拾った。中には ' + G.fmt(x.amt) + ' 入っている…。',
    info: (S, G, x) => [{ title: 'あなたのお小遣い事情', rows: [['💰 いまの所持金', G.fmt(S.money)], ['👛 財布の中身', G.fmt(x.amt)]] }],
    choices: (S, G, x) => [
      { label: '🚓 交番に届ける', t: ['誠実'], do: (S, G) => { G.fx({ happy: 3, social: 2 }); if (G.chance(0.4)) { G.money(Math.round(x.amt * 0.1)); return '持ち主のおじいさんがお礼に来てくれた。お礼金と、あったかい言葉をもらった。'; } return 'おまわりさんに「えらいね」と頭をなでられた。'; } },
      { label: '🤫 こっそりもらっちゃう', t: ['ずる賢い'], do: (S, G) => { G.money(x.amt); G.fx({ mind: -5 }); return 'お金は手に入った。でも、その日の夜はなかなか眠れなかった。'; } },
      { label: '🙈 見なかったことにする', t: ['慎重派'], do: (S, G) => { G.fx({ mind: -1 }); return '財布をそっと元の場所に戻した。誰か優しい人が拾ってくれますように。'; } }
    ]
  },
  {
    id: 'bully', emoji: '🛡️', title: 'クラスのいじめ', min: 8, max: 15,
    setup: (S, G) => ({ v: G.friendName() }),
    text: (S, G, x) => 'クラスの' + x.v + 'が、何人かにからかわれているのを見てしまった。',
    choices: (S, G, x) => [
      { label: '✋ 「やめなよ」と止めに入る', t: ['正義感', '優しい'], do: (S, G) => { G.fx({ social: 3, mind: -2, happy: 3 }); S.flags.bestFriend = x.v; return '足が震えたけど、声は出た。' + x.v + 'とは、それから一生の友達になった。'; } },
      { label: '🧑‍🏫 先生にこっそり相談する', t: ['慎重派'], do: (S, G) => { G.fx({ smarts: 2, social: 1 }); return '先生が動いてくれて、いじめはなくなった。正しいやり方は一つじゃない。'; } },
      { label: '😶 見て見ぬふりをする', do: (S, G) => { G.fx({ mind: -6, happy: -3 }); G.addTrait('心配性'); return 'あの時の' + x.v + 'の顔を、大人になっても時々思い出す。'; } }
    ]
  },
  {
    id: 'pet_ask', emoji: '🐾', title: 'ペットを飼いたい！', min: 5, max: 14,
    cond: (S) => S.pets.filter(p => p.alive).length === 0,
    setup: (S, G) => ({ pt: G.pick(DATA.petTypes) }),
    text: (S, G, x) => '友達の家の' + x.pt.type + 'がかわいすぎた。うちでも飼いたい！',
    info: (S, G, x) => [{ title: '家の状況', rows: G.familyMoneyRows().concat([['🐾 飼うのにかかるお金（年）', G.fmt(G.avg() * 0.02)]]) }],
    choices: (S, G, x) => [
      { label: '🙏 毎日お世話するから！と頼み込む', t: ['動物好き'], do: (S, G) => {
        if (G.chance(0.6)) { const p = G.addPet(x.pt); G.fx({ happy: 10 }); return x.pt.emoji + ' ついに' + x.pt.type + 'の「' + p.name + '」が家族になった！'; }
        G.fx({ happy: -4 }); return '「ちゃんとお世話できる？」の問いに、自信を持って答えられなかった。また今度。'; } },
      { label: '📚 図鑑で我慢する', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 3 }); return x.pt.type + 'の図鑑を読みこんで、ちょっとした' + x.pt.type + '博士になった。'; } }
    ]
  },
  {
    id: 'bad_test', emoji: '📝', title: 'テストの点数', min: 8, max: 17,
    setup: (S, G) => ({ score: G.r(8, 35) }),
    text: (S, G, x) => 'テストが返ってきた。…' + x.score + '点。',
    choices: () => [
      { label: '🔥 次は見てろ！猛勉強', t: ['努力家', '負けず嫌い'], do: (S, G) => { G.fx({ smarts: 7, mind: -2 }); return '次のテストで平均点を超えた。先生が少し驚いた顔をしていた。'; } },
      { label: '🌞 まあ、こんな日もある', t: ['楽観的'], do: (S, G) => { G.fx({ mind: 3 }); return '答案用紙で紙飛行機を作ったら、けっこう遠くまで飛んだ。'; } },
      { label: '🫣 親に隠す', t: ['ずる賢い'], do: (S, G) => { if (G.chance(0.5)) { G.fx({ mind: -3 }); G.closeAll(['父', '母'], -4); return '机の奥から見つかった。人生で一番気まずい晩ごはんだった。'; } return '完全犯罪成立。…たぶん。'; } }
    ]
  },
  {
    id: 'research', emoji: '🔎', title: '夏休みの自由研究', min: 7, max: 12,
    text: () => '夏休みもあと少し。自由研究がまだ真っ白だ！',
    choices: () => [
      { label: '🦋 昆虫を観察する', t: ['好奇心旺盛'], do: (S, G) => { G.fx({ smarts: 4 }); return 'アリの行列を3日間観察。アリにも渋滞があることを発見した。'; } },
      { label: '🛠️ すごい工作を作る', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 5 }); return '段ボールで巨大ロボを作った。教室に入らなかった。'; } },
      { label: '😴 最終日に家族を巻き込む', t: ['のんびり屋'], do: (S, G) => { G.closeAll(['父', '母'], 2); G.fx({ mind: 2 }); return '8月31日の深夜、家族総出で自由研究。なぜか一番燃えていたのは' + G.relName('父') + 'だった。'; } }
    ]
  },
  {
    id: 'allowance', emoji: '🪙', title: 'お年玉の使い道', min: 6, max: 15,
    setup: (S, G) => ({ amt: Math.round(G.avg() * 0.006) }),
    text: (S, G, x) => '親戚からお小遣いをもらった！ 合計 ' + G.fmt(x.amt) + '。',
    choices: (S, G, x) => [
      { label: '🐷 全部貯金する', t: ['倹約家'], do: (S, G) => { G.money(x.amt); return '貯金箱がずっしり重くなった。それを振る音が好き。'; } },
      { label: '🍭 お菓子を爆買い', t: ['食いしん坊'], do: (S, G) => { G.fx({ happy: 6, health: -1 }); return '駄菓子屋で両手いっぱい。王様の気分だった。'; } },
      { label: '📚 本を買う', t: ['読書家'], do: (S, G) => { G.fx({ smarts: 4 }); return 'ずっと欲しかったシリーズを大人買い。夜ふかしの日々が始まった。'; } },
      { label: '🎁 家族にプレゼントを買う', t: ['家族思い'], do: (S, G) => { G.closeAll(['父', '母', '兄', '姉', '弟', '妹'], 5); G.fx({ happy: 4 }); return G.relName('母') + 'がプレゼントを見て、ちょっと泣いていた。'; } }
    ]
  },
  {
    id: 'play', emoji: '🎭', title: '学芸会の役決め', min: 7, max: 12,
    text: () => '学芸会の劇の役を決めることになった。',
    choices: () => [
      { label: '👑 主役に立候補！', t: ['社交的'], do: (S, G) => { G.fx({ social: 5, looks: 2, mind: -1 }); return 'セリフを一つ飛ばしたけど、アドリブで乗り切った。拍手喝采！'; } },
      { label: '🔦 裏方で照明係', t: ['人見知り'], do: (S, G) => { G.fx({ smarts: 3, art: 2 }); return 'スポットライトが完璧なタイミングで主役を照らした。陰の主役は自分だ。'; } },
      { label: '🌳 あえて「木」の役', t: ['ユーモア'], do: (S, G) => { G.fx({ happy: 4, social: 2 }); return '一番存在感のある木だったと、のちに語り継がれる。'; } }
    ]
  },
  {
    id: 'friend_move', emoji: '🚚', title: '親友の引っ越し', min: 8, max: 15,
    setup: (S, G) => ({ f: S.flags.bestFriend || G.friendName() }),
    text: (S, G, x) => '親友の' + x.f + 'が、遠くの町へ引っ越すことになった。',
    choices: (S, G, x) => [
      { label: '✉️ 手紙を書くと約束する', t: ['一途', '優しい'], do: (S, G) => { G.fx({ social: 2, happy: -2 }); return x.f + 'との文通は、大人になっても続いている。'; } },
      { label: '😄 笑顔で見送る', t: ['楽観的'], do: (S, G) => { G.fx({ mind: 2 }); return '「またね！」が「さよなら」じゃないことを、二人とも知っていた。'; } },
      { label: '😭 大泣きする', t: ['涙もろい'], do: (S, G) => { G.fx({ happy: -4, art: 2 }); return 'トラックが見えなくなるまで手を振り、泣きながら走って追いかけた。'; } }
    ]
  },
  {
    id: 'first_love', emoji: '💗', title: '初恋', min: 13, max: 18,
    cond: (S, G) => !G.partner(),
    setup: (S, G) => ({ p: G.newPerson({ gender: G.prefGender(), age: S.age + G.r(-1, 1), rel: '恋人' }) }),
    text: (S, G, x) => '同じクラスの' + G.fn(x.p) + 'のことが、気になって仕方ない。',
    info: (S, G, x) => [{ title: '気になるあの子', rows: [['名前', G.name(x.p)], ['年齢', x.p.age + '歳'], ['性格', G.traitText(x.p)]] }, { title: 'あなた', rows: G.statRows(['looks', 'social']) }],
    choices: (S, G, x) => [
      { label: '💌 思い切って告白する', t: ['ロマンチスト'], do: (S, G) => {
        if (G.chance(0.25 + (S.stats.looks + S.stats.social) / 300)) { x.p.close = 75; G.add(x.p); G.fx({ happy: 12 }); return '🌸「…私も」。世界がキラキラして見えた。'; }
        G.fx({ happy: -8, mind: -3 }); return '「ごめんね」。帰り道の夕日がやけに目にしみた。でも、言えてよかった。'; } },
      { label: '🫣 そっと見守る', t: ['人見知り'], do: (S, G) => { G.fx({ art: 3 }); return '気持ちは伝えられなかった。でも、ノートの隅に描いた落書きは、今でも宝物。'; } },
      { label: '🗣️ 友達に相談する', t: ['社交的'], do: (S, G) => { G.fx({ social: 3 }); if (G.chance(0.3)) { x.p.close = 65; G.add(x.p); G.fx({ happy: 8 }); return '友達が勝手に伝えてしまった！…が、なぜかうまくいった。'; } return 'クラス中に広まった。恥ずかしすぎて三日学校を休みたかった。'; } }
    ]
  },
  {
    id: 'rebel', emoji: '🌩️', title: '反抗期', min: 13, max: 17,
    text: (S, G) => G.relName('母') + 'に何を言われても、なぜかイライラしてしまう。',
    choices: () => [
      { label: '🚪 ドアをバタン！', t: ['自由人'], do: (S, G) => { G.closeAll(['父', '母'], -6); G.fx({ mind: -2 }); return '部屋にこもった。でも夜中、そっと置かれた夜食を食べた。'; } },
      { label: '🗣️ ちゃんと話し合う', t: ['家族思い'], do: (S, G) => { G.closeAll(['父', '母'], 6); G.fx({ mind: 4, smarts: 2 }); return '泣きながら本音を話した。親も一人の人間なんだと知った夜。'; } },
      { label: '🎒 プチ家出する', t: ['冒険好き'], do: (S, G) => { G.closeAll(['父', '母'], -3); G.fx({ happy: 2, mind: 3 }); return '近所の公園で3時間。お腹がすいて帰ったら、何も言わずにごはんが出てきた。'; } }
    ]
  },
  {
    id: 'cheat', emoji: '👀', title: 'カンニングのお誘い', min: 13, max: 19,
    setup: (S, G) => ({ f: G.friendName() }),
    text: (S, G, x) => x.f + '「明日のテスト、答え回すからさ、一緒にやろうよ」',
    choices: (S, G, x) => [
      { label: '🙅 断る', t: ['誠実'], do: (S, G) => { G.fx({ smarts: 2 }); return '自力で解いた。点数は平凡だけど、胸を張れる点数だった。'; } },
      { label: '🦊 乗っかる', t: ['ずる賢い'], do: (S, G) => { if (G.chance(0.35)) { G.fx({ happy: -8, social: -4 }); return 'バレた。職員室に呼ばれ、反省文を3枚書いた。'; } G.fx({ smarts: -2, happy: 2 }); return '高得点。でも、何も頭に残らなかった。'; } }
    ]
  },
  {
    id: 'scout', emoji: '🌟', title: 'スカウト', min: 14, max: 26,
    cond: (S) => S.stats.looks >= 68 || S.stats.art >= 70,
    text: () => '街を歩いていたら「芸能事務所の者ですが…」と声をかけられた！',
    choices: () => [
      { label: '✨ 挑戦してみる', t: ['冒険好き'], do: (S, G) => {
        if (G.chance(0.4)) { G.fx({ looks: 5, social: 6, happy: 8 }); G.setJob('model', 0.8); return '📸 オーディション合格！モデルとしてデビューした。'; }
        G.fx({ happy: -3, social: 3 }); return 'レッスンに通ったが、デビューには届かなかった。でも度胸はついた。'; } },
      { label: '🙅 怪しいので断る', t: ['慎重派'], do: (S, G) => { G.fx({ mind: 2 }); return 'あとで調べたら、本物の事務所だった。…まあいいか。'; } }
    ]
  },
  {
    id: 'phone', emoji: '📱', title: 'スマホ漬けの日々', min: 12, max: 19,
    text: () => '気づけば一日10時間スマホを見ている。',
    choices: () => [
      { label: '📵 デジタルデトックス', t: ['努力家'], do: (S, G) => { G.fx({ mind: 6, health: 3, smarts: 2 }); return '一週間スマホを封印。空ってこんなに青かったっけ。'; } },
      { label: '📹 いっそ動画を投稿してみる', t: ['冒険好き'], do: (S, G) => { G.fx({ social: 4, art: 4 }); if (G.chance(0.15)) { G.fx({ happy: 10 }); return '投稿した動画がバズった！ 再生回数100万回。通知が鳴りやまない。'; } return '再生回数は37回。そのうち20回は自分。'; } },
      { label: '🛋️ まあいっか', t: ['のんびり屋'], do: (S, G) => { G.fx({ health: -3, happy: 2 }); return '目がしょぼしょぼする。ブルーライトカット眼鏡を買った。'; } }
    ]
  },

  // ============ 恋愛・結婚 ============
  {
    id: 'meet', emoji: '💞', title: '素敵な出会い', min: 18, max: 60, once: false, w: 3,
    cond: (S, G) => !G.partner(),
    setup: (S, G) => ({ p: G.candidate() }),
    text: (S, G, x) => G.pick(['友人の紹介で', '職場で', '行きつけのカフェで', 'マッチングアプリで', '趣味の集まりで', '雨の日のバス停で']) + '、' + G.fn(x.p) + 'と出会った。なんだか気が合いそうだ。',
    info: (S, G, x) => [{ title: '💞 お相手のプロフィール', rows: G.personRows(x.p) }, { title: 'あなたの状況', rows: G.moneyRows() }],
    choices: (S, G, x) => [
      { label: '💗 お付き合いする', t: ['ロマンチスト'], do: (S, G) => { x.p.rel = '恋人'; x.p.close = 70; x.p.since = S.age; G.add(x.p); G.fx({ happy: 10 }); return G.fn(x.p) + 'と付き合い始めた。スマホの通知音が、恋の音に変わった。'; } },
      { label: '🙂 友達のままでいたい', t: ['慎重派'], do: (S, G) => { G.fx({ social: 2 }); return 'いい友達になれた。それはそれで、素敵な縁。'; } }
    ]
  },
  {
    id: 'proposal', emoji: '💍', title: 'プロポーズ', min: 20, max: 70, once: false, w: 4,
    cond: (S, G) => { const p = G.person('恋人'); return p && S.age - (p.since || S.age) >= 1 && p.close >= 55; },
    setup: (S, G) => ({ p: G.person('恋人'), cost: { big: Math.round(G.avg() * 0.35), small: Math.round(G.avg() * 0.08) } }),
    text: (S, G, x) => G.fn(x.p) + '「ずっと一緒にいてくれませんか？」――プロポーズされた！',
    info: (S, G, x) => [{ title: '💍 お相手のこと', rows: G.personRows(x.p) }, { title: '💴 お金のこと', rows: G.moneyRows().concat([['💒 盛大な結婚式', G.fmt(x.cost.big)], ['🌼 小さな式', G.fmt(x.cost.small)]]) }],
    choices: (S, G, x) => [
      { label: '💒 結婚する（盛大な式）', sub: '費用 ' + G.fmt(x.cost.big), t: ['ロマンチスト'], do: (S, G) => { G.money(-x.cost.big); G.marry(x.p); G.fx({ happy: 18, social: 5 }); return '🔔 たくさんの人に祝福されて結婚式を挙げた。' + G.relName('母') + 'がずっと泣いていた。'; } },
      { label: '🌼 結婚する（小さな式）', sub: '費用 ' + G.fmt(x.cost.small), t: ['倹約家'], do: (S, G) => { G.money(-x.cost.small); G.marry(x.p); G.fx({ happy: 14 }); return '家族だけの小さな式。誓いの言葉で声が震えた。'; } },
      { label: '⏳ まだ早い、もう少し待って', do: (S, G) => { x.p.close -= 10; G.fx({ mind: -2 }); return G.fn(x.p) + 'は「わかった、待ってる」と笑った。少しさみしそうだった。'; } },
      { label: '💔 別れる', t: ['自由人'], do: (S, G) => { G.breakup(x.p); G.fx({ happy: -10 }); return G.fn(x.p) + 'とお別れした。思い出の写真を消すのに、1年かかった。'; } }
    ]
  },
  {
    id: 'arranged', emoji: '🤵', title: 'お見合い話', min: 24, max: 40, w: 1.5,
    cond: (S, G) => !G.partner() && G.person('母') && !['IN', 'PK', 'BD'].includes(S.country),
    setup: (S, G) => ({ p: G.candidate() }),
    text: (S, G, x) => G.relName('母') + '「いい人がいるんだけど、一度会ってみない？」',
    info: (S, G, x) => [{ title: '📋 お見合い相手の釣書', rows: G.personRows(x.p) }],
    choices: (S, G, x) => [
      { label: '🍵 会ってみる', t: ['伝統を重んじる'], do: (S, G) => { if (G.chance(0.55)) { x.p.rel = '恋人'; x.p.close = 62; x.p.since = S.age; G.add(x.p); G.fx({ happy: 6 }); return 'ホテルのラウンジで緊張の対面。意外にも話が弾み、交際することに。'; } G.fx({ mind: -2 }); return '「ご縁がなかったということで…」。紅茶がやけに苦かった。'; } },
      { label: '🙅 自分で相手は見つける', t: ['自由人'], do: (S, G) => { G.closeAll(['母'], -3); return '「時代が違うのよ」と言ったら、ちょっとむくれられた。'; } }
    ]
  },
  {
    id: 'cheating_doubt', emoji: '📱', title: '怪しいメッセージ', min: 20, max: 70, w: 0.6, once: false,
    cond: (S, G) => !!G.partner(),
    setup: (S, G) => ({ p: G.partner() }),
    text: (S, G, x) => G.fn(x.p) + 'のスマホに、知らない名前からのメッセージが…。',
    choices: (S, G, x) => [
      { label: '🔍 問い詰める', t: ['正義感'], do: (S, G) => { if (G.chance(0.3)) { G.fx({ happy: -12 }); x.p.close -= 30; return '浮気だった。信じていた分、心が割れる音がした。'; } x.p.close -= 8; G.fx({ mind: -3 }); return '誕生日サプライズの打ち合わせ相手だった。…とても気まずい。'; } },
      { label: '🌷 信じる', t: ['一途'], do: (S, G) => { x.p.close += 5; return '何も聞かなかった。数週間後、サプライズパーティーが開かれた。'; } }
    ]
  },
  {
    id: 'marriage_crisis', emoji: '🌧️', title: 'すれ違い', min: 25, max: 80, w: 0.8, once: false,
    cond: (S, G) => { const s = G.spouse(); return s && s.close < 60; },
    setup: (S, G) => ({ p: G.spouse() }),
    text: (S, G, x) => '最近、' + G.fn(x.p) + 'との会話が減った。食卓が静かだ。',
    info: (S, G, x) => [{ title: '夫婦の状況', rows: [['💞 仲の良さ', x.p.close + ' / 100'], ['👶 子ども', G.kids().length + '人'], ['💰 貯金', G.fmt(S.money)]] }],
    choices: (S, G, x) => [
      { label: '🗣️ じっくり話し合う', t: ['誠実'], do: (S, G) => { x.p.close += 15; G.fx({ mind: 3 }); return '久しぶりに二人で夜通し話した。最初に好きになった理由を思い出した。'; } },
      { label: '🛋️ カウンセリングに通う', sub: '費用 ' + G.fmt(G.avg() * 0.03), t: ['現実主義'], do: (S, G) => { G.money(-G.avg() * 0.03); x.p.close += 22; return 'プロの力を借りた。言葉にできなかった気持ちが、少しずつ言えるようになった。'; } },
      { label: '📄 離婚する', t: ['自由人'], do: (S, G) => { G.divorce(x.p); G.fx({ happy: -10, mind: 4 }); return '離婚届に判を押した。終わりは、新しい始まりでもある。'; } }
    ]
  },
  {
    id: 'baby_talk', emoji: '👶', title: '子どもについて', min: 22, max: 46, w: 3, once: false,
    cond: (S, G) => G.spouse() && !S.flags.babyAsked && G.kids(true).length < 4 && S.age - (S.flags.babyAskedAge || 0) >= 3,
    setup: (S, G) => ({ p: G.spouse(), cost: Math.round(G.avg() * 0.12) }),
    text: (S, G, x) => G.fn(x.p) + '「そろそろ、子どものこと考えてみない？」',
    info: (S, G, x) => [{ title: '💴 家計の状況', rows: G.moneyRows().concat([['🍼 子ども1人の年間養育費（目安）', G.fmt(x.cost)], ['👶 いまの子ども', G.kids(true).length + '人']]) }],
    choices: (S, G, x) => [
      { label: '👶 子どもがほしい', t: ['家族思い'], do: (S, G) => { S.flags.trying = true; S.flags.babyAskedAge = S.age; x.p.close += 5; return '二人で、新しい家族を迎える準備を始めた。'; } },
      { label: '⏳ 今はまだ', do: (S, G) => { S.flags.babyAskedAge = S.age; return 'もう少し二人の時間を大切にすることにした。'; } },
      { label: '🙅 子どもは持たない', t: ['自由人'], do: (S, G) => { S.flags.babyAsked = true; x.p.close -= 3; return '二人で決めた、二人らしい生き方。'; } }
    ]
  },

  // ============ 仕事・お金 ============
  {
    id: 'headhunt', emoji: '📨', title: '転職のお誘い', min: 24, max: 58, w: 1.2, once: false,
    cond: (S) => !!S.job && !S.retired,
    setup: (S, G) => { const o = G.jobOffers(1, true)[0]; return { o }; },
    text: (S, G, x) => 'ヘッドハンターから連絡が来た。「' + x.o.job.emoji + x.o.job.name + 'として、ぜひうちに来ませんか？」',
    info: (S, G, x) => [
      { title: '📊 比べてみよう', rows: [['いまの仕事', G.jobName()], ['いまの年収', G.fmt(S.income)], ['新しい仕事', x.o.job.name], ['新しい年収', G.fmt(x.o.pay)], ['ストレス', '★'.repeat(x.o.job.stress) + '☆'.repeat(7 - x.o.job.stress)]] },
      { title: 'いまの心身', rows: G.statRows(['mind', 'health']) }
    ],
    choices: (S, G, x) => [
      { label: '🚀 転職する', t: ['野心家'], do: (S, G) => { G.setJob(x.o.job.id, null, x.o.pay); G.fx({ happy: 4, mind: -3 }); return '新しい職場へ。名刺の肩書きが変わると、景色も変わった。'; } },
      { label: '🏢 今の会社に残る', t: ['一途'], do: (S, G) => { if (G.chance(0.3)) { S.income = Math.round(S.income * 1.1); return '引き止めのために昇給してもらえた！'; } return '慣れた場所にも、慣れた良さがある。'; } }
    ]
  },
  {
    id: 'burnout', emoji: '🥀', title: '心と体が悲鳴をあげている', min: 18, max: 70, w: 3, once: false,
    cond: (S) => !!S.job && S.stats.mind < 30,
    text: () => '朝、布団から出られない。仕事のことを考えると胸が苦しい。',
    info: (S, G) => [{ title: 'いまのあなた', rows: G.statRows(['mind', 'health', 'happy']).concat(G.moneyRows()) }],
    choices: () => [
      { label: '🛌 休職して休む', sub: '半年間収入が半分に', t: ['慎重派'], do: (S, G) => { G.money(-S.income * 0.25); G.fx({ mind: 22, health: 5 }); return 'しばらく休むことにした。休むのも、立派な仕事だ。'; } },
      { label: '🔄 思い切って転職する', do: (S, G) => { G.quitJob(); G.fx({ mind: 15 }); G.queue('jobhunt'); return '退職届を出した。肩の荷が、すっと下りた。'; } },
      { label: '😣 歯を食いしばって頑張る', t: ['負けず嫌い'], do: (S, G) => { G.fx({ mind: -6, health: -6 }); S.income = Math.round(S.income * 1.05); return 'なんとか乗り切った。でも、鏡の中の自分は少しやつれていた。'; } }
    ]
  },
  {
    id: 'startup', emoji: '🚀', title: '友人の起業', min: 23, max: 60, w: 0.8,
    setup: (S, G) => ({ f: G.friendName(), amt: Math.round(G.avg() * 0.5) }),
    text: (S, G, x) => '友人の' + x.f + 'が起業するらしい。「' + G.fmt(x.amt) + '出資してくれないか？」',
    info: (S, G, x) => [{ title: '💴 判断材料', rows: G.moneyRows().concat([['📈 出資額', G.fmt(x.amt)], ['🎲 成功率（噂）', '約3割']]) }],
    choices: (S, G, x) => [
      { label: '💸 出資する', ok: S.money >= x.amt, t: ['冒険好き'], do: (S, G) => { G.money(-x.amt); if (G.chance(0.3)) { G.money(x.amt * G.r(3, 8)); G.fx({ happy: 12 }); return '🎉 会社が大成功！出資金が何倍にもなって返ってきた。'; } G.fx({ happy: -6 }); return '会社は1年でたたまれた。' + x.f + 'との友情だけは残った。'; } },
      { label: '🙏 応援だけする', t: ['現実主義'], do: (S, G) => { G.fx({ social: 1 }); return '「がんばれ」とだけ伝えた。それも大事な支え。'; } }
    ]
  },
  {
    id: 'house', emoji: '🏡', title: 'マイホーム', min: 28, max: 60, w: 1.5,
    cond: (S) => !S.house && S.income > 0,
    setup: (S, G) => { const price = Math.round(G.avg() * G.rf(4, 7)); return { price, down: Math.round(price * 0.2), yearly: Math.round(price * 0.8 / 25) }; },
    text: () => '理想の家が売りに出ているのを見つけた。',
    info: (S, G, x) => [{ title: '🏡 物件情報', rows: [['💴 価格', G.fmt(x.price)], ['💵 頭金（2割）', G.fmt(x.down)], ['🏦 ローン返済（年間・25年）', G.fmt(x.yearly)]] }, { title: '💰 あなたの家計', rows: G.moneyRows() }],
    choices: (S, G, x) => [
      { label: '🏡 ローンを組んで買う', ok: S.money >= x.down, sub: S.money >= x.down ? '' : '頭金が足りない', t: ['家族思い'], do: (S, G) => { G.money(-x.down); S.house = true; S.loan = { left: x.price - x.down, yearly: x.yearly }; G.fx({ happy: 12, mind: -2 }); return '🔑 鍵を受け取った。この家で、どんな日々が始まるんだろう。'; } },
      { label: '🏢 賃貸のままでいい', t: ['自由人'], do: (S, G) => { G.fx({ mind: 2 }); return '身軽さも、一つの豊かさ。'; } },
      { label: '🌾 田舎に古民家を買う', sub: '価格は3分の1', t: ['のんびり屋'], ok: S.money >= x.price / 3, do: (S, G) => { G.money(-x.price / 3); S.house = true; G.fx({ mind: 12, happy: 6, social: -3 }); return '縁側のある古い家。夜はカエルの合唱がBGM。'; } }
    ]
  },
  {
    id: 'lottery', emoji: '🎫', title: '宝くじ売り場', min: 18, max: 99, w: 0.8, once: false,
    setup: (S, G) => ({ cost: Math.round(G.avg() * 0.003) }),
    text: (S, G, x) => '「当たったら何しよう」…宝くじ売り場の前で足が止まった。',
    info: (S, G, x) => [{ title: '', rows: [['🎫 10枚の値段', G.fmt(x.cost)], ['💰 所持金', G.fmt(S.money)]] }],
    choices: (S, G, x) => [
      { label: '🎫 10枚買う', t: ['楽観的'], do: (S, G) => { G.money(-x.cost); const r = Math.random(); if (r < 0.004) { G.money(G.avg() * 20); G.fx({ happy: 25 }); return '💥💥 1等当選！？！？ 手が震えて番号を10回確認した。'; } if (r < 0.08) { G.money(x.cost * 5); G.fx({ happy: 5 }); return '3等が当たった！ちょっといいディナーに行った。'; } return '全部はずれ。夢を見られた時間代、ということで。'; } },
      { label: '🚶 通り過ぎる', t: ['現実主義'], do: () => '当たらない宝くじより、確実な貯金。' }
    ]
  },
  {
    id: 'sib_loan', emoji: '🙏', title: '家族からの頼みごと', min: 25, max: 75, w: 0.8,
    cond: (S, G) => G.siblings().length > 0,
    setup: (S, G) => ({ p: G.pick(G.siblings()), amt: Math.round(G.avg() * G.rf(0.1, 0.4)) }),
    text: (S, G, x) => x.p.rel + 'の' + G.fn(x.p) + '「お願い、' + G.fmt(x.amt) + '貸してくれない？必ず返すから」',
    info: (S, G, x) => [{ title: '👤 ' + x.p.rel + 'の状況', rows: G.personRows(x.p) }, { title: '💰 あなたの家計', rows: G.moneyRows() }],
    choices: (S, G, x) => [
      { label: '💴 貸してあげる', ok: S.money >= x.amt, t: ['お人好し', '家族思い'], do: (S, G) => { G.money(-x.amt); x.p.close += 10; if (G.chance(0.55)) { G.money(x.amt); return '1年後、きっちり返してくれた。お礼の' + G.food() + 'つきで。'; } return 'お金は返ってこなかった。でも' + G.fn(x.p) + 'は立ち直ったようだ。'; } },
      { label: '🙅 断る', t: ['現実主義'], do: (S, G) => { x.p.close -= 10; return '「お金の貸し借りはしない」。それが家族を守るルール。'; } }
    ]
  },
  {
    id: 'scam', emoji: '☎️', title: '怪しい電話', min: 60, max: 99, w: 1,
    setup: (S, G) => ({ amt: Math.round(G.avg() * 0.4) }),
    text: (S, G, x) => '「もしもし、オレだよオレ。事故っちゃって、' + G.fmt(x.amt) + '必要なんだ…」',
    choices: (S, G, x) => [
      { label: '💸 振り込んであげる', t: ['お人好し'], do: (S, G) => { G.money(-x.amt); G.fx({ happy: -10, mind: -8 }); return '詐欺だった。銀行の窓口で崩れ落ちた。'; } },
      { label: '🤨 本人に電話して確認', t: ['慎重派'], do: (S, G) => { G.fx({ smarts: 2, happy: 2 }); return '本人は家でのんびりテレビを見ていた。危なかった！'; } },
      { label: '😂 「オレって誰だっけ？」', t: ['ユーモア'], do: (S, G) => { G.fx({ happy: 4 }); return '相手のほうが先に電話を切った。'; } }
    ]
  },

  // ============ 健康 ============
  {
    id: 'sick', emoji: '🤒', title: '体調不良', min: 25, max: 110, w: 1.5, once: false,
    cond: (S) => S.stats.health < 70,
    setup: (S, G) => ({ cost: Math.round(G.avg() * 0.06), ill: G.pick(['原因不明の頭痛', 'しつこい咳', '胃の痛み', '息切れ', 'ひどいめまい', '腰の痛み']) }),
    text: (S, G, x) => '最近、' + x.ill + 'が続いている。',
    info: (S, G, x) => [{ title: '', rows: G.statRows(['health']).concat([['🏥 精密検査の費用', G.fmt(x.cost)], ['💰 所持金', G.fmt(S.money)]]) }],
    choices: (S, G, x) => [
      { label: '🏥 病院で精密検査', t: ['慎重派'], do: (S, G) => { G.money(-x.cost); G.fx({ health: G.r(10, 18) }); return '早期発見で大事に至らなかった。お医者さん、ありがとう。'; } },
      { label: '🛏️ 様子を見る', t: ['楽観的'], do: (S, G) => { if (G.chance(0.5)) { G.fx({ health: 3 }); return 'しばらくしたら治った。'; } G.fx({ health: -12 }); return '悪化してしまった…。もっと早く病院へ行けばよかった。'; } },
      { label: '🌿 民間療法を試す', do: (S, G) => { G.fx({ health: G.r(-6, 6), mind: 3 }); return 'おばあちゃん直伝の秘薬を試した。効いたかどうかは…神のみぞ知る。'; } }
    ]
  },
  {
    id: 'accident', emoji: '🚑', title: 'アクシデント', min: 5, max: 90, w: 0.5, once: false,
    auto: (S, G) => { G.fx({ health: -G.r(8, 20) }); return G.pick(['自転車で転んで骨折した。ギプスにみんなが落書きしてくれた。', '階段を踏み外して足をねんざした。', '料理中に指を切った。絆創膏がしばらく相棒。', 'スポーツ中に肩を痛めた。']); }
  },
  {
    id: 'parent_care', emoji: '🧓', title: '親の介護', min: 35, max: 75, w: 2,
    cond: (S, G) => G.parents().some(p => p.age >= 75),
    setup: (S, G) => ({ p: G.pick(G.parents().filter(p => p.age >= 75)), cost: Math.round(G.avg() * 0.25) }),
    text: (S, G, x) => x.p.rel + 'の' + G.fn(x.p) + '（' + x.p.age + '歳）が、一人で暮らすのが難しくなってきた。',
    info: (S, G, x) => [{ title: '👤 ' + x.p.rel + 'の状況', rows: G.personRows(x.p) }, { title: '💴 介護施設', rows: [['🏥 施設の費用（年間）', G.fmt(x.cost)]].concat(G.moneyRows()) }],
    choices: (S, G, x) => [
      { label: '🏠 同居して自分で介護', t: ['家族思い'], do: (S, G) => { x.p.close += 15; G.fx({ mind: -10, happy: 3, health: -3 }); return '毎日の介護は大変だ。でも' + G.fn(x.p) + 'が「ありがとう」と言うたび、昔の自分を思い出す。'; } },
      { label: '🏥 介護施設にお願いする', t: ['現実主義'], do: (S, G) => { G.money(-x.cost); x.p.close += 3; G.fx({ mind: -2 }); return '週末ごとに施設へ通った。プロの手を借りるのも、愛情の形。'; } },
      { label: '🤝 兄弟姉妹と分担する', ok: G.siblings().length > 0, t: ['社交的'], do: (S, G) => { G.fx({ mind: -4, social: 3 }); return '家族会議の末、交代で介護することに。久しぶりに兄弟の絆を感じた。'; } }
    ]
  },

  // ============ 人とのつながり ============
  {
    id: 'reunion', emoji: '🍻', title: '同窓会のお知らせ', min: 25, max: 80, w: 1, once: false,
    text: () => '10年ぶりの同窓会の案内が届いた。',
    choices: () => [
      { label: '🎉 行く！', t: ['社交的'], do: (S, G) => { G.fx({ social: 6, happy: 5 }); return G.pick(['昔のあだ名で呼ばれて、一瞬で10代に戻った。', '初恋の人が、すっかりお父さん/お母さんの顔になっていた。', '担任の先生が、まだ同じ冗談を言っていた。']); } },
      { label: '🏠 今回はやめておく', t: ['人見知り'], do: (S, G) => { G.fx({ mind: 3 }); return 'SNSで写真だけ見た。みんな、元気そうでよかった。'; } }
    ]
  },
  {
    id: 'speech', emoji: '🎤', title: '友人代表スピーチ', min: 22, max: 45, w: 1,
    setup: (S, G) => ({ f: S.flags.bestFriend || G.friendName() }),
    text: (S, G, x) => '親友の' + x.f + 'から「結婚式でスピーチしてほしい」と頼まれた。',
    choices: (S, G, x) => [
      { label: '😂 笑いありのスピーチ', t: ['ユーモア'], do: (S, G) => { G.fx({ social: 6, happy: 4 }); return '会場が爆笑の渦に。新婦のお父さんまで笑っていた。'; } },
      { label: '😭 感動のスピーチ', t: ['涙もろい'], do: (S, G) => { G.fx({ social: 4, art: 3 }); return '自分が一番泣いてしまい、半分何を言っているかわからなかった。でも、伝わった。'; } },
      { label: '🙏 丁重にお断り', t: ['人見知り'], do: (S, G) => { G.fx({ mind: 2 }); return '代わりに心を込めた手紙を贈った。'; } }
    ]
  },
  {
    id: 'adopt_pet', emoji: '🐕', title: '保護動物との出会い', min: 20, max: 80, w: 1, once: false,
    cond: (S) => S.pets.filter(p => p.alive).length === 0,
    setup: (S, G) => ({ pt: G.pick(DATA.petTypes), cost: Math.round(G.avg() * 0.03) }),
    text: (S, G, x) => '譲渡会で、じっとこちらを見つめる' + x.pt.type + 'がいた。',
    info: (S, G, x) => [{ title: '', rows: [['🐾 飼育費（年間の目安）', G.fmt(x.cost)]].concat(G.moneyRows()) }],
    choices: (S, G, x) => [
      { label: '🏠 家族として迎える', t: ['動物好き', '優しい'], do: (S, G) => { const p = G.addPet(x.pt); G.fx({ happy: 10, mind: 6 }); return x.pt.emoji + '「' + p.name + '」が家族になった。最初の夜、ずっとそばを離れなかった。'; } },
      { label: '🙏 今は責任を持てない', t: ['慎重派'], do: () => '素敵な家族が見つかりますように、と願った。' }
    ]
  },
  {
    id: 'kid_trouble', emoji: '🧒', title: '子どものこと', min: 25, max: 70, w: 1.5, once: false,
    cond: (S, G) => G.kids().some(k => k.age >= 6 && k.age <= 17),
    setup: (S, G) => ({ k: G.pick(G.kids().filter(k => k.age >= 6 && k.age <= 17)), what: G.pick(['学校で友達とケンカした', '成績が急に下がった', '「学校に行きたくない」と言い出した', '夢を追いたいと言い出した']) }),
    text: (S, G, x) => G.fn(x.k) + '（' + x.k.age + '歳）が' + x.what + '。',
    choices: (S, G, x) => [
      { label: '👂 じっくり話を聞く', t: ['優しい'], do: (S, G) => { x.k.close += 10; G.fx({ mind: -1, happy: 3 }); return G.fn(x.k) + 'がぽつりぽつりと話してくれた。答えより、聞いてもらえたことがうれしかったようだ。'; } },
      { label: '😠 厳しく叱る', t: ['伝統を重んじる'], do: (S, G) => { x.k.close -= 8; return '叱ったあと、自分も親に同じことを言われたのを思い出した。'; } },
      { label: '🌈 好きにさせてみる', t: ['自由人'], do: (S, G) => { x.k.close += 4; return '「あなたの人生だからね」。' + G.fn(x.k) + 'の目が少し輝いた。'; } }
    ]
  },
  {
    id: 'midlife', emoji: '🌱', title: '新しい挑戦', min: 38, max: 60, w: 1,
    text: () => '人生の折り返し地点。何か新しいことを始めたくなった。',
    choices: () => [
      { label: '🏃 フルマラソンに挑戦', t: ['負けず嫌い'], do: (S, G) => { G.fx({ fitness: 10, health: 6 }); return '42.195km、完走！ゴールで知らない人とハイタッチした。'; } },
      { label: '🎸 若い頃の夢だった楽器', t: ['芸術家肌'], do: (S, G) => { G.fx({ art: 10, happy: 5 }); return 'ギターを買った。指は痛いけど、心が若返る。'; } },
      { label: '🎓 学び直しで大学へ', t: ['好奇心旺盛'], do: (S, G) => { G.money(-G.avg() * 0.2); G.fx({ smarts: 10, social: 3 }); return '20歳下の同級生と机を並べた。学ぶのに遅すぎることはない。'; } },
      { label: '☁️ 今のままで十分', t: ['のんびり屋'], do: (S, G) => { G.fx({ mind: 6 }); return '何も足さない。それも立派な選択。'; } }
    ]
  },
  {
    id: 'viral', emoji: '📈', title: 'まさかのバズ', min: 16, max: 80, w: 0.5,
    cond: (S) => S.stats.social >= 60 || S.stats.art >= 65,
    auto: (S, G) => { G.fx({ happy: 8, social: 6 }); return 'SNSに何気なく投稿した' + G.pick(['手料理の写真', '飼い猫の寝顔', '下手くそな似顔絵', '夕焼けの写真']) + 'が大バズリ。知らない国の人からもコメントが届いた。'; }
  },
  {
    id: 'disaster', emoji: '🌪️', title: '自然災害', min: 1, max: 99, w: 0.3,
    setup: (S, G) => ({ type: G.pick(['大きな地震', '台風', '洪水', '大雪']) }),
    text: (S, G, x) => x.type + 'が町を襲った。',
    choices: (S, G, x) => [
      { label: '🙌 避難所でボランティア', t: ['優しい'], do: (S, G) => { G.fx({ social: 6, mind: -4, health: -2 }); return '炊き出しを手伝った。「ありがとう」が、なによりの温かさだった。'; } },
      { label: '🏠 家族を守ることに専念', t: ['家族思い'], do: (S, G) => { G.fx({ mind: -4 }); G.closeAll(['父', '母', '配偶者', '息子', '娘'], 4); return '家族みんなで寄り添って夜を明かした。'; } }
    ]
  },
  {
    id: 'grandkid_visit', emoji: '👶', title: '孫が遊びに来た', min: 50, max: 110, w: 2, once: false,
    cond: (S, G) => G.people(p => p.rel === '孫' && p.alive && p.age <= 15).length > 0,
    setup: (S, G) => ({ g: G.pick(G.people(p => p.rel === '孫' && p.alive && p.age <= 15)) }),
    text: (S, G, x) => '孫の' + G.fn(x.g) + 'が遊びに来た！',
    choices: (S, G, x) => [
      { label: '🎁 お小遣いをあげる', t: ['お人好し'], do: (S, G) => { G.money(-G.avg() * 0.01); x.g.close += 8; G.fx({ happy: 5 }); return '「ありがとう！」の笑顔。お財布は軽く、心は重く満たされた。'; } },
      { label: '📖 昔話を聞かせる', t: ['伝統を重んじる'], do: (S, G) => { x.g.close += 6; G.fx({ mind: 4 }); return '若い頃の話をしたら、目を丸くして聞いてくれた。'; } },
      { label: '🎮 一緒にゲームで遊ぶ', t: ['好奇心旺盛'], do: (S, G) => { x.g.close += 10; G.fx({ happy: 6, smarts: 1 }); return '最新のゲームでボコボコにされた。でも、楽しかった。'; } }
    ]
  },
  {
    id: 'century', emoji: '💯', title: '100歳！', min: 100, max: 100, milestone: true,
    auto: (S, G) => { G.fx({ happy: 20 }); return '🎉 100歳の誕生日！ 町から表彰状が届き、家族みんなが集まってくれた。'; }
  }
];

// 動的イベント（行動から呼ばれる・他のイベントから続けて呼ばれる）
DATA.dynEvents = {
  jobhunt: {
    emoji: '💼', title: '仕事探し',
    setup: (S, G) => ({ offers: G.jobOffers(4) }),
    text: (S, G) => '求人情報をチェックした。あなたの学歴は「' + DATA.eduNames[S.edu] + '」。',
    info: (S, G) => [{ title: 'あなたのスペック', rows: G.statRows(['smarts', 'social', 'art', 'fitness', 'looks']).concat([['🎓 学歴', DATA.eduNames[S.edu]]]) }, { title: 'お金のこと', rows: G.moneyRows() }],
    choices: (S, G, x) => x.offers.map(o => ({
      label: o.job.emoji + ' ' + o.job.name,
      sub: '年収 ' + G.fmt(o.pay) + '　ストレス ' + '★'.repeat(o.job.stress) + '☆'.repeat(7 - o.job.stress) + (o.job.volatile ? '　収入不安定' : ''),
      do: (S, G) => { G.setJob(o.job.id, null, o.pay); G.fx({ happy: 5 }); return '🎉 ' + o.job.name + 'として働き始めた！' + G.pick(['初日は緊張で名前を3回噛んだ。', '先輩が優しくて泣きそうになった。', '初任給で家族にごちそうした。']); }
    })).concat([{ label: '🙅 今回は見送る', do: () => 'もう少しじっくり考えることにした。' }])
  },
  findlove: {
    emoji: '💘', title: '恋人探し',
    setup: (S, G) => ({ list: [G.candidate(), G.candidate(), G.candidate()] }),
    text: () => '出会いを求めて行動してみた。3人と知り合った！',
    info: (S, G) => [{ title: 'あなた', rows: G.statRows(['looks', 'social']).concat(G.moneyRows().slice(0, 2)) }],
    choices: (S, G, x) => x.list.map((p, i) => ({
      label: '💌 ' + G.name(p) + 'をデートに誘う',
      rows: G.personRows(p).filter(r => !/名前|続柄/.test(r[0])),
      do: (S, G) => {
        const ch = 0.25 + p.compat / 200 + (S.stats.looks + S.stats.social) / 400;
        if (G.chance(ch)) { p.rel = '恋人'; p.close = 60 + Math.round(p.compat / 5); p.since = S.age; G.add(p); G.fx({ happy: 10 }); return G.fn(p) + 'とのデートは大成功！付き合うことになった。'; }
        G.fx({ happy: -4 }); return G.fn(p) + 'に「ごめんなさい」と言われた。縁がなかったみたい。';
      }
    })).concat([{ label: '🙅 今回は誰とも…', do: () => 'ピンとくる人はいなかった。' }])
  },
  propose: {
    emoji: '💍', title: 'プロポーズする',
    setup: (S, G) => ({ p: G.person('恋人'), cost: Math.round(G.avg() * 0.2) }),
    text: (S, G, x) => G.fn(x.p) + 'にプロポーズしようと思う。',
    info: (S, G, x) => [{ title: '💍 お相手', rows: G.personRows(x.p) }, { title: '💴 お金', rows: G.moneyRows().concat([['💒 結婚式の費用', G.fmt(x.cost)]]) }],
    choices: (S, G, x) => [
      { label: '💍 夜景の見えるレストランで', t: ['ロマンチスト'], do: (S, G) => { G.money(-G.avg() * 0.01); if (G.chance(x.p.close / 100 + 0.1)) { G.money(-x.cost); G.marry(x.p); G.fx({ happy: 18 }); return '💒「はい」。指輪が、夜景よりも輝いて見えた。'; } x.p.close -= 10; G.fx({ happy: -10 }); return '「…少し考えさせて」。帰りのタクシーは無言だった。'; } },
      { label: '🏠 いつもの部屋でさりげなく', t: ['現実主義'], do: (S, G) => { if (G.chance(x.p.close / 100)) { G.money(-x.cost * 0.4); G.marry(x.p); G.fx({ happy: 14 }); return '「結婚しよっか」「うん」。それだけで十分だった。'; } x.p.close -= 8; return 'ちょっと冗談だと思われた。'; } },
      { label: '⏳ やっぱりやめておく', do: () => 'もう少しタイミングを考えよう。' }
    ]
  },
  breakup: {
    emoji: '💔', title: 'お別れ',
    setup: (S, G) => ({ p: G.partner() }),
    text: (S, G, x) => G.fn(x.p) + 'との関係を見つめ直す。',
    info: (S, G, x) => [{ title: '', rows: G.personRows(x.p) }],
    choices: (S, G, x) => [
      { label: '💔 ' + (x.p.rel === '配偶者' ? '離婚する' : '別れる'), do: (S, G) => { if (x.p.rel === '配偶者') G.divorce(x.p); else G.breakup(x.p); G.fx({ happy: -8, mind: 3 }); return G.fn(x.p) + 'とお別れした。'; } },
      { label: '🌷 やっぱりやり直す', t: ['一途'], do: (S, G) => { x.p.close += 10; return 'もう一度、向き合ってみることにした。'; } }
    ]
  }
};
