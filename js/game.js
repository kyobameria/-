// すべて億分の1 — ゲーム本体（ロジック）
(function () {
  'use strict';

  const SAVE_KEY = 'subete_oku1_save_v1';
  const START_YEAR = 2026;

  const STATS = [
    { key: 'health',  name: '健康',     emoji: '❤️', color: 'var(--c-health)' },
    { key: 'happy',   name: '幸福',     emoji: '😊', color: 'var(--c-happy)' },
    { key: 'mind',    name: '心の余裕', emoji: '🍃', color: 'var(--c-mind)' },
    { key: 'smarts',  name: '知性',     emoji: '📚', color: 'var(--c-smarts)' },
    { key: 'looks',   name: '外見',     emoji: '✨', color: 'var(--c-looks)' },
    { key: 'fitness', name: '体力',     emoji: '💪', color: 'var(--c-fitness)' },
    { key: 'social',  name: '社交性',   emoji: '🤝', color: 'var(--c-social)' },
    { key: 'art',     name: '感性',     emoji: '🎨', color: 'var(--c-art)' }
  ];
  const STAT_BY_KEY = {};
  STATS.forEach(s => { STAT_BY_KEY[s.key] = s; });

  const REL_EMOJI = { '父': '👨', '母': '👩', '兄': '🧑', '姉': '👩', '弟': '🧒', '妹': '👧', '恋人': '💗', '配偶者': '💍', '元配偶者': '🥀', '息子': '👦', '娘': '👧', '義理の息子': '👦', '義理の娘': '👧', '孫': '👶' };
  const FAMILY_RELS = ['父', '母', '兄', '姉', '弟', '妹', '配偶者', '恋人', '息子', '娘', '義理の息子', '義理の娘', '孫'];

  let S = null;          // ゲームの状態
  const Q = [];          // イベントの待ち行列（保存しない）
  let yearOpen = false;  // 年が進んだ直後でイベント処理中か

  // ================= ユーティリティ =================
  const G = {};
  window.G = G;
  G.r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  G.rf = (a, b) => Math.random() * (b - a) + a;
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.chance = (p) => Math.random() < p;
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.wpick = (items, wf) => { const tot = items.reduce((s, it) => s + wf(it), 0); let x = Math.random() * tot; for (const it of items) { x -= wf(it); if (x <= 0) return it; } return items[items.length - 1]; };
  // 能力値による成功率（基準値ちょうどで6割くらい）
  G.pass = (v, base) => G.clamp(0.6 + (v - base) / 50, 0.05, 0.95);

  G.c = () => DATA.countryByCode[S.country];
  G.avg = () => G.c().avg;

  G.fmt = (n) => {
    n = Math.round(n || 0);
    const c = G.c();
    const sign = n < 0 ? '-' : '';
    const a = Math.abs(n);
    let s;
    if (a >= 1e8) s = trimNum(a / 1e8, a >= 1e10 ? 0 : 1) + '億';
    else if (a >= 1e4) s = trimNum(a / 1e4, a >= 1e6 ? 0 : 1) + '万';
    else s = a.toLocaleString('ja-JP');
    return sign + s + c.curName;
  };
  function trimNum(v, d) { return Number(v.toFixed(d)).toLocaleString('ja-JP'); }

  // ================= パラメーター =================
  let CAP = null;      // 変化を記録するバッファ
  let NEW_TRAITS = []; // その場で得た性格

  G.stat = (k, d) => {
    if (!S.stats.hasOwnProperty(k)) return 0;
    d = Math.round(d);
    const before = S.stats[k];
    S.stats[k] = G.clamp(before + d, 0, 100);
    const real = S.stats[k] - before;
    if (CAP && real !== 0) CAP.push({ k, d: real });
    return real;
  };
  G.fx = (obj) => {
    Object.keys(obj).forEach(k => {
      const v = Array.isArray(obj[k]) ? G.r(obj[k][0], obj[k][1]) : obj[k];
      G.stat(k, v);
    });
  };
  // 支払い（18歳未満は家の貯金から）
  G.pay = (n) => {
    n = Math.round(n);
    if (S.age < 18) S.familySavings -= n; else G.money(-n);
  };
  G.money = (d) => {
    d = Math.round(d);
    if (!d) return;
    S.money += d;
    if (CAP) CAP.push({ k: 'money', d });
  };

  // ================= 性格 =================
  G.has = (t) => S.traits.includes(t);
  G.traitPoint = (t, pts) => {
    if (!DATA.traits[t] || G.has(t)) return;
    S.tp[t] = (S.tp[t] || 0) + (pts || 1);
    // 性格が増えるほど、新しい性格は芽生えにくくなる
    if (S.tp[t] >= G.traitNeed()) G.addTrait(t);
  };
  G.traitNeed = () => 2 + Math.floor(S.traits.length / 4);
  G.addTrait = (t) => {
    const def = DATA.traits[t];
    if (!def || G.has(t)) return;
    let msg;
    if (def.opp && G.has(def.opp)) {
      S.traits = S.traits.filter(x => x !== def.opp);
      S.tp[def.opp] = 0;
      msg = '🔄 性格が変化した：' + DATA.traits[def.opp].emoji + def.opp + ' → ' + def.emoji + t;
    } else {
      if (S.traits.length >= DATA.MAX_TRAITS) S.traits.shift();
      msg = '🧬 新しい性格が芽生えた：' + def.emoji + t + '（' + def.desc + '）';
    }
    S.traits.push(t);
    S.tp[t] = 99;
    NEW_TRAITS.push(t);
    G.log(msg, 'trait');
    UI.toast(def.emoji + ' 「' + t + '」が性格に加わった！');
  };
  G.traitText = (p) => (p.traits && p.traits.length) ? p.traits.map(t => (DATA.traits[t] ? DATA.traits[t].emoji : '') + t).join('・') : 'ふつう';

  // ================= 人物 =================
  G.name = (p) => {
    const c = DATA.countryByCode[p.country || S.country];
    if (c.order === 'lf') return p.last + (['KR', 'VN'].includes(c.code) ? ' ' : '') + p.first;
    return p.first + '・' + p.last;
  };
  G.fn = (p) => p ? p.first : '';
  G.myName = () => G.name(S.me);
  G.people = (f) => S.people.filter(f);
  G.person = (rel) => S.people.find(p => p.rel === rel && p.alive);
  G.relName = (rel) => { const p = G.person(rel); return p ? p.first : (rel === '母' ? 'お母さん' : rel === '父' ? 'お父さん' : rel); };
  G.parents = () => G.people(p => (p.rel === '父' || p.rel === '母') && p.alive);
  G.siblings = () => G.people(p => ['兄', '姉', '弟', '妹'].includes(p.rel) && p.alive && p.age >= 0);
  G.spouse = () => G.person('配偶者');
  G.partner = () => G.person('配偶者') || G.person('恋人');
  G.kids = (includeStep) => G.people(p => p.alive && (p.rel === '息子' || p.rel === '娘' || (includeStep && (p.rel === '義理の息子' || p.rel === '義理の娘'))));
  G.close = (p, d) => { if (p) p.close = G.clamp((p.close || 50) + d, 0, 100); };
  G.closeAll = (rels, d) => S.people.forEach(p => { if (p.alive && rels.includes(p.rel)) G.close(p, d); });
  G.prefGender = () => G.chance(0.9) ? (S.gender === 'm' ? 'f' : 'm') : S.gender;

  let pid = 0;
  // avoid に入っている名前とかぶらない名前を選ぶ（全部使い切ったときだけ重複を許す）
  G.uniqueFirst = (gender, avoid) => {
    const c = G.c();
    const pool = gender === 'm' ? c.m : c.f;
    const free = pool.filter(n => !(avoid || []).includes(n));
    return G.pick(free.length ? free : pool);
  };
  // 同じ親から生まれたきょうだいの名前（自分を含む）
  G.myKidsNames = () => G.people(p => ['息子', '娘', '義理の息子', '義理の娘'].includes(p.rel)).map(p => p.first);
  G.newPerson = (o) => {
    const c = G.c();
    const gender = o.gender || (G.chance(0.5) ? 'm' : 'f');
    const p = {
      id: 'p' + (Date.now() % 100000) + '_' + (pid++),
      first: G.uniqueFirst(gender, o.avoid),
      last: o.last || G.pick(c.last),
      gender, rel: o.rel || '', age: o.age != null ? o.age : 20,
      alive: true, close: o.close != null ? o.close : G.r(55, 85),
      traits: o.traits || G.shuffle(Object.keys(DATA.traits)).slice(0, 2),
      marriedTimes: o.marriedTimes || 0, kidsCount: o.kidsCount || 0,
      job: '', income: 0, looks: G.r(25, 90)
    };
    if (o.job !== false) G.npcJob(p);
    return p;
  };
  G.add = (p) => {
    if (p.rel === '恋人' && p.since == null) p.since = S.age;
    if (!S.people.includes(p)) S.people.push(p);
    return p;
  };

  // NPCの職業と年収を決める
  G.npcJob = (p, force) => {
    if (p.age < 22 && !force) { p.job = ''; p.income = 0; return; }
    if (p.age >= 66) { p.job = '年金生活'; p.income = Math.round(G.avg() * G.rf(0.25, 0.45)); return; }
    if (G.chance(0.1)) { p.job = p.gender === 'f' ? '専業主婦' : '専業主夫'; p.income = 0; return; }
    const pool = DATA.jobs.filter(j => !j.partTime && !(j.maxAge && p.age > j.maxAge));
    const j = G.wpick(pool, x => x.pay > 2 ? 0.4 : (x.volatile ? 0.3 : 1.2));
    p.job = j.name;
    const af = p.age < 30 ? 0.8 : p.age < 40 ? 0.95 : p.age < 55 ? 1.1 : 1.05;
    p.income = Math.round(j.pay * G.avg() * G.rf(0.8, 1.25) * af);
  };
  G.npcStatus = (p) => {
    if (!p.alive) return '故人';
    if (p.job) return p.job;
    if (p.age < 3) return '赤ちゃん';
    if (p.age < 6) return '未就学児';
    if (p.age < 12) return '小学生';
    if (p.age < 15) return '中学生';
    if (p.age < 18) return '高校生';
    if (p.age < 22) return '大学生';
    return '無職';
  };

  // 結婚相手の候補
  G.candidate = () => {
    const age = G.clamp(S.age + G.r(-6, 6), 18, 110);
    const mt = G.chance(age < 28 ? 0.05 : age < 40 ? 0.2 : 0.35) ? (G.chance(0.8) ? 1 : 2) : 0;
    const kc = mt > 0 && G.chance(0.55) ? G.r(1, 2) : 0;
    const p = G.newPerson({ gender: G.prefGender(), age, marriedTimes: mt, kidsCount: kc });
    const shared = p.traits.filter(t => G.has(t)).length;
    p.compat = G.clamp(G.r(35, 88) + shared * 12, 10, 99);
    return p;
  };

  G.personRows = (p) => {
    const rows = [
      ['👤 名前', G.name(p)],
      ['🏷️ 続柄', p.rel || '—'],
      ['🎂 年齢', p.age + '歳'],
      ['💼 職業', G.npcStatus(p)],
      ['💴 年収', p.income ? G.fmt(p.income) : 'なし']
    ];
    if (p.age >= 18) {
      rows.push(['💍 過去の結婚歴', p.marriedTimes ? p.marriedTimes + '回' : 'なし']);
      rows.push(['🧒 子ども', p.kidsCount ? p.kidsCount + '人' : 'なし']);
    }
    rows.push(['🧬 性格', G.traitText(p)]);
    if (p.compat != null && !FAMILY_RELS.slice(0, 6).includes(p.rel)) rows.push(['💞 あなたとの相性', p.compat + '%']);
    if (S.people.includes(p)) rows.push(['🤍 仲の良さ', (p.close || 0) + ' / 100']);
    return rows;
  };
  G.statRows = (keys) => keys.map(k => [STAT_BY_KEY[k].emoji + ' ' + STAT_BY_KEY[k].name, S.stats[k] + ' / 100']);
  G.householdIncome = () => {
    const sp = G.spouse();
    return (S.income || 0) + (sp ? sp.income : 0);
  };
  G.moneyRows = () => {
    if (S.age < 18) return G.familyMoneyRows().concat([['👛 あなたのお小遣い', G.fmt(S.money)]]);
    const rows = [['💰 あなたの貯金', G.fmt(S.money)], ['💼 あなたの年収', S.income ? G.fmt(S.income) : 'なし']];
    const sp = G.spouse();
    if (sp) { rows.push(['💑 配偶者の年収', sp.income ? G.fmt(sp.income) : 'なし']); rows.push(['🏠 世帯年収', G.fmt(G.householdIncome())]); }
    if (S.debt > 0) rows.push(['📄 奨学金の残り', G.fmt(S.debt)]);
    if (S.loan && S.loan.left > 0) rows.push(['🏦 住宅ローン残り', G.fmt(S.loan.left)]);
    rows.push(['📊 この国の平均年収', G.fmt(G.avg())]);
    return rows;
  };
  G.familyMoneyRows = () => {
    const rows = [];
    const d = G.person('父'), m = G.person('母');
    if (d) rows.push(['👨 父の年収（' + d.job + '）', d.income ? G.fmt(d.income) : 'なし']);
    if (m) rows.push(['👩 母の年収（' + m.job + '）', m.income ? G.fmt(m.income) : 'なし']);
    rows.push(['🏠 家の貯金', G.fmt(S.familySavings)]);
    return rows;
  };

  // ================= 仕事 =================
  G.jobName = () => {
    if (S.job) return S.jobTitle || DATA.jobById[S.job].name;
    if (S.retired) return '年金生活';
    const sc = { kinder: '保育園児', elementary: '小学生', middle: '中学生', middle_done: '中学生', high: '高校生', high_done: '高校生', univ: '大学生', univ_done: '大学生', grad: '大学院生', vocational: '専門学校生' }[S.school];
    if (sc) return sc;
    if (S.age < 3) return '赤ちゃん';
    if (S.age < 6) return '未就学児';
    return '無職';
  };
  G.isStudent = () => ['elementary', 'middle', 'middle_done', 'high', 'high_done', 'univ', 'univ_done', 'grad', 'vocational'].includes(S.school);
  G.jobOffers = (n, better) => {
    const edu = S.edu + (S.flags.vocational && S.edu === 2 ? 1 : 0);
    let pool = DATA.jobs.filter(j => !j.partTime && j.id !== S.job && j.edu <= edu && !(j.maxAge && S.age > j.maxAge) && Object.keys(j.req || {}).every(k => S.stats[k] >= j.req[k] - 8));
    if (!pool.length) pool = [DATA.jobById.cashier, DATA.jobById.farmer];
    if (better && S.income) {
      const b = pool.filter(j => j.pay * G.avg() >= S.income * 0.9);
      if (b.length) pool = b;
    }
    const af = S.age < 25 ? 0.75 : S.age < 35 ? 0.95 : S.age < 50 ? 1.1 : 1.0;
    const picked = G.shuffle(pool).slice(0, n);
    return picked.map(j => {
      let pay = Math.round(j.pay * G.avg() * G.rf(0.85, 1.2) * af);
      if (better && S.income) pay = Math.max(pay, Math.round(S.income * G.rf(1.1, 1.35)));
      return { job: j, pay };
    });
  };
  G.setJob = (id, mult, pay) => {
    const j = DATA.jobById[id];
    const prevStudent = S.school;
    G.clearCareer();
    S.job = id; S.jobTitle = j.start || j.name; S.retired = false;
    S.income = pay != null ? Math.round(pay) : Math.round(j.pay * G.avg() * (mult || 1));
    S.jobYears = 0;
    if (['univ', 'grad', 'vocational', 'high'].includes(prevStudent) && !j.partTime && id !== 'model') { /* 在学中のデビューなどは学業継続 */ }
    G.log('💼 ' + j.emoji + j.name + 'として働き始めた（' + S.jobTitle + '・年収 ' + G.fmt(S.income) + '）', 'big');
  };
  // 仕事まわりの状態をリセット
  G.clearCareer = () => { S.job = null; S.jobTitle = ''; S.income = 0; S.rank = 0; S.ladder = null; S.selfEmployed = false; };
  G.quitJob = () => { if (S.job) G.log('🚪 ' + G.jobName() + 'の仕事を辞めた', 'ev'); G.clearCareer(); };
  G.retire = () => { G.clearCareer(); S.retired = true; S.income = Math.round(G.avg() * 0.35); G.log('🌅 引退して年金生活に入った（年金 ' + G.fmt(S.income) + '／年）', 'big'); };

  // ================= 恋愛・結婚 =================
  G.marry = (p) => {
    p.rel = '配偶者';
    p.close = Math.max(p.close || 60, 70);
    G.add(p);
    S.marriedCount = (S.marriedCount || 0) + 1;
    S.flags.babyAsked = false;
    G.log('💒 ' + G.name(p) + 'と結婚した！', 'big');
    if (p.kidsCount > 0) {
      for (let i = 0; i < p.kidsCount; i++) {
        const g = G.chance(0.5) ? 'm' : 'f';
        const k = G.newPerson({ gender: g, age: G.r(1, Math.max(1, Math.min(p.age - 20, 18))), rel: g === 'm' ? '義理の息子' : '義理の娘', last: p.last, close: G.r(35, 60), avoid: G.myKidsNames().concat([S.me.first, p.first]) });
        G.add(k);
        G.log('👨‍👩‍👧 ' + G.fn(p) + 'の連れ子、' + G.fn(k) + '（' + k.age + '歳）と家族になった', 'ev');
      }
    }
  };
  G.breakup = (p) => { S.people = S.people.filter(x => x !== p); };
  G.divorce = (p) => {
    p.rel = '元配偶者';
    p.marriedTimes = (p.marriedTimes || 0) + 1;
    S.money = Math.round(S.money * 0.6);
    S.flags.trying = false;
    G.log('📄 ' + G.name(p) + 'と離婚した', 'sad');
  };

  // ================= ペット =================
  G.addPet = (pt) => {
    const p = { name: G.pick(pt.names), type: pt.type, emoji: pt.emoji, age: 0, alive: true, life: G.r(8, 16) };
    if (pt.type === 'ハムスター') p.life = G.r(2, 3);
    if (pt.type === 'インコ' || pt.type === 'フクロウ') p.life = G.r(10, 20);
    S.pets.push(p);
    return p;
  };

  // ================= 文字の置き換え =================
  G.friendName = () => {
    if (S.friends.length && G.chance(0.6)) return G.pick(S.friends);
    const c = G.c();
    const n = G.pick(G.chance(0.5) ? c.m : c.f);
    if (S.friends.length < 6 && !S.friends.includes(n)) S.friends.push(n);
    return n;
  };
  G.food = () => G.pick(G.c().foods);
  G.abroad = () => G.pick(DATA.countries.filter(c => c.code !== S.country)).name;

  G.fill = (text) => {
    if (!text) return text;
    let ok = true;
    const famPool = S.people.filter(p => p.alive && FAMILY_RELS.includes(p.rel) && p.age >= 0 && p.rel !== '恋人');
    const map = {
      me: () => S.me.first,
      me2: () => S.gender === 'm' ? 'パパ' : 'ママ',
      gp: () => S.gender === 'm' ? 'じぃじ' : 'ばぁば',
      mom: () => { const p = G.person('母'); return p ? p.first : null; },
      dad: () => { const p = G.person('父'); return p ? p.first : null; },
      sib: () => { const a = G.siblings(); return a.length ? G.pick(a).first : null; },
      friend: () => G.friendName(),
      pet: () => { const a = S.pets.filter(p => p.alive); return a.length ? a[0].name : null; },
      spouse: () => { const p = G.spouse(); return p ? p.first : null; },
      child: () => { const a = G.kids(true); return a.length ? G.pick(a).first : null; },
      grandchild: () => { const a = G.people(p => p.rel === '孫' && p.alive); return a.length ? G.pick(a).first : null; },
      food: () => G.food(),
      place: () => G.pick(G.c().places),
      city: () => S.city,
      fest: () => G.pick(G.c().festivals).name,
      fam: () => famPool.length ? G.pick(famPool).first : '家族',
      dream: () => S.dream,
      abroad: () => G.abroad()
    };
    const out = text.replace(/\{(\w+)\}/g, (m, k) => {
      const f = map[k];
      if (!f) return m;
      const v = f();
      if (v == null) { ok = false; return ''; }
      return v;
    });
    return ok ? out : null;
  };

  // ================= ログ =================
  G.log = (text, kind, fx) => {
    const y = S.log[S.log.length - 1];
    const item = { t: text, k: kind || 'ev' };
    if (fx && fx.length) item.fx = fx;
    y.items.push(item);
    return item;
  };
  // 変化を記録しながら関数を実行する
  function capture(fn) {
    const prev = CAP, prevT = NEW_TRAITS;
    CAP = []; NEW_TRAITS = [];
    let res;
    try { res = fn(); } catch (e) { console.error(e); res = ''; }
    const out = { res, fx: CAP, traits: NEW_TRAITS };
    CAP = prev; NEW_TRAITS = prevT;
    if (prev) prev.push(...out.fx);
    return out;
  }

  // ================= キュー =================
  G.queue = (idOrEv, ctx) => {
    let ev = idOrEv;
    if (typeof idOrEv === 'string') ev = DATA.dynEvents[idOrEv] || DATA.events.find(e => e.id === idOrEv);
    if (ev) Q.push({ ev, ctx });
  };

  // ================= 誕生 =================
  function weightedCountry() {
    return G.wpick(DATA.countries, c => c.pop);
  }
  function newGame(opt) {
    opt = opt || {};
    const c = opt.country ? DATA.countryByCode[opt.country] : weightedCountry();
    const gender = opt.gender || (G.chance(0.5) ? 'm' : 'f');
    S = {
      v: 1, country: c.code, gender, age: 0, birthYear: START_YEAR, year: START_YEAR, alive: true,
      city: G.pick(c.cities), dream: G.pick(DATA.dreams),
      stats: { health: G.r(70, 95), happy: G.r(60, 80), mind: G.r(60, 85), smarts: G.r(15, 55), looks: G.r(20, 80), fitness: G.r(25, 55), social: G.r(25, 60), art: G.r(15, 55) },
      traits: [], tp: {}, money: 0, familySavings: 0, debt: 0, loan: null, house: false,
      job: null, jobTitle: '', income: 0, retired: false, edu: 0, school: 'none', schoolYears: 0,
      people: [], pets: [], friends: [], log: [], ap: DATA.AP_PER_YEAR, flags: {}, done: {},
      hsum: 0, hn: 0, marriedCount: 0
    };
    const last = G.pick(c.last);
    const first = opt.first || G.pick(gender === 'm' ? c.m : c.f);
    S.me = { first, last: opt.last || last, gender, country: c.code };

    S.log.push({ age: 0, year: START_YEAR, items: [] });

    const dad = G.newPerson({ gender: 'm', age: G.r(23, 42), rel: '父', last: S.me.last, close: G.r(60, 90) });
    const mom = G.newPerson({ gender: 'f', age: G.r(21, 40), rel: '母', last: S.me.last, close: G.r(65, 95) });
    [dad, mom].forEach(p => { G.npcJob(p, true); p.marriedTimes = 1; p.kidsCount = 1; });
    S.people.push(dad, mom);
    const nSib = G.wpick([0, 1, 2, 3], n => [30, 40, 20, 10][n]);
    for (let i = 0; i < nSib; i++) {
      let off = G.r(-7, 8); if (off === 0) off = 2;
      if (mom.age - off < 18 || mom.age - off > 45) off = -off;
      const g = G.chance(0.5) ? 'm' : 'f';
      const rel = off > 0 ? (g === 'm' ? '兄' : '姉') : (g === 'm' ? '弟' : '妹');
      const sibNames = [S.me.first].concat(S.people.filter(p => ['兄', '姉', '弟', '妹'].includes(p.rel)).map(p => p.first));
      const s = G.newPerson({ gender: g, age: off, rel, last: S.me.last, close: G.r(50, 85), avoid: sibNames });
      S.people.push(s);
    }
    const kids = 1 + S.people.filter(p => ['兄', '姉'].includes(p.rel)).length;
    dad.kidsCount = mom.kidsCount = kids;
    S.familySavings = Math.round((dad.income + mom.income) * G.rf(0.2, 1.8));

    const prob = Math.round(DATA.WORLD_POP / c.pop);
    G.log('👶 ' + START_YEAR + '年、' + c.flag + c.name + 'の' + S.city + 'で、' + (gender === 'm' ? '男の子' : '女の子') + 'として生まれた。', 'big');
    G.log('📛 名前は「' + G.myName() + '」。', 'ev');
    G.log('👨‍👩‍👧 父は' + G.name(dad) + '（' + dad.age + '歳・' + dad.job + '）、母は' + G.name(mom) + '（' + mom.age + '歳・' + mom.job + '）。', 'ev');
    const olders = S.people.filter(p => p.age > 0 && ['兄', '姉'].includes(p.rel));
    if (olders.length) G.log('🧒 ' + olders.map(p => p.rel + 'の' + p.first + '（' + p.age + '歳）').join('、') + 'が、小さな手をのぞき込んでいる。', 'ev');
    G.log('🌏 81億人の中で' + c.name + 'に生まれる確率は、およそ' + prob + '人に1人。そしてあなたという人間は、世界でたった一人。', 'mem');

    // 0歳の国イベント（例：トルコのナザール）
    (DATA.countryEvents[S.country] || []).filter(e => e.milestone && e.min === 0).forEach(e => {
      S.done[e.id] = true;
      const r = capture(() => e.auto(S, G, null));
      G.log(r.res, 'culture', r.fx);
    });
    UI.toast(c.flag + ' ' + c.name + 'に生まれた！');
    save();
  }

  // ================= 1年進める =================
  function ageUp() {
    S.age++; S.year++;
    S.ap = DATA.AP_PER_YEAR;
    S.log.push({ age: S.age, year: S.year, items: [] });
    yearOpen = true;

    agePeople();
    schoolProgress();
    yearlyMoney();
    yearlyStats();
    careerYear();
    familyEvents();
    friendsGrow();
  }

  function agePeople() {
    const avg = G.avg();
    const lifeShift = G.c().life - 82;
    S.people.forEach(p => {
      if (!p.alive) return;
      p.age++;
      if (p.age === 0) {
        G.log('🍼 ' + p.rel + 'の' + p.first + 'が生まれた！ 家族がまた一人増えた。', 'big');
        G.closeAll(['父', '母'], 2);
        const m = G.person('母'), d = G.person('父');
        if (m) m.kidsCount++; if (d) d.kidsCount = m ? m.kidsCount : d.kidsCount + 1;
      }
      if (p.age < 0) return;
      // 仕事
      if (p.age === 22 && !p.job && p.rel !== '恋人') { G.npcJob(p, true); if (FAMILY_RELS.includes(p.rel) && p.job) G.log('💼 ' + p.rel + 'の' + p.first + 'が' + p.job + 'として働き始めた', 'ev'); }
      if (p.age === 65 && p.job && p.job !== '年金生活') { p.job = '年金生活'; p.income = Math.round(avg * G.rf(0.25, 0.45)); }
      else if (p.income && p.age > 22 && p.age < 65) p.income = Math.round(p.income * G.rf(1.0, 1.05));
      // 家族の結婚・孫
      const isChild = ['息子', '娘', '義理の息子', '義理の娘'].includes(p.rel);
      const isSib = ['兄', '姉', '弟', '妹'].includes(p.rel);
      if ((isChild || isSib) && !p.married && p.age >= 24 && p.age <= 40 && G.chance(0.12)) {
        p.married = true; p.marriedTimes = (p.marriedTimes || 0) + 1;
        G.log('💒 ' + p.rel + 'の' + p.first + 'が結婚した！', 'good');
        if (isChild) G.fx({ happy: 5 });
      }
      if (isChild && p.married && p.age <= 42 && G.chance(0.15)) {
        const g = G.chance(0.5) ? 'm' : 'f';
        const sameParent = S.people.filter(x => x.rel === '孫' && x.parentId === p.id).map(x => x.first);
        const gc = G.newPerson({ gender: g, age: 0, rel: '孫', last: p.gender === 'm' ? p.last : G.pick(G.c().last), close: G.r(70, 95), avoid: sameParent.concat([p.first, S.me.first]) });
        gc.parentId = p.id;
        p.kidsCount = (p.kidsCount || 0) + 1;
        S.people.push(gc);
        G.log('👶 孫が生まれた！ ' + p.first + 'の子、' + gc.first + '。', 'big');
        G.fx({ happy: 8 });
      }
      // 死亡
      let hz = p.age < 50 ? 0.0006 : 0.003 * Math.exp((p.age - 60 - lifeShift) / 8);
      if (G.chance(Math.min(hz, 0.6))) {
        p.alive = false; p.deathAge = p.age;
        onNpcDeath(p);
      }
    });
    S.pets.forEach(pt => {
      if (!pt.alive) return;
      pt.age++;
      if (pt.age >= pt.life || (pt.age > pt.life - 2 && G.chance(0.3))) {
        pt.alive = false;
        G.log('🌈 ' + pt.emoji + pt.name + 'が虹の橋を渡った（' + pt.age + '歳）。最後まで、そばにいてくれてありがとう。', 'sad');
        G.fx({ happy: -10 });
      }
    });
  }

  function onNpcDeath(p) {
    const fam = FAMILY_RELS.includes(p.rel);
    if (!fam) return;
    const t = {
      '父': ['父の' + p.first + 'が' + p.age + '歳で亡くなった。最後に握った手は、昔と同じように大きかった。', '父の' + p.first + 'が旅立った。口癖だった「なんとかなる」が、今も耳に残っている。'],
      '母': ['母の' + p.first + 'が' + p.age + '歳で亡くなった。台所から聞こえた鼻歌が、もう聞けない。', '母の' + p.first + 'が旅立った。最後の言葉は「ちゃんと食べなさいよ」だった。'],
      '配偶者': ['最愛の' + p.first + 'が' + p.age + '歳で亡くなった。隣の席が、こんなに広いなんて知らなかった。'],
      '恋人': ['恋人の' + p.first + 'が亡くなった。']
    }[p.rel] || [p.rel + 'の' + p.first + 'が' + p.age + '歳で亡くなった。'];
    G.log('🕊️ ' + G.pick(t), 'sad');
    const big = ['父', '母', '配偶者', '息子', '娘'].includes(p.rel);
    G.stat('happy', big ? -15 : -8);
    G.stat('mind', big ? -8 : -4);
    if (p.rel === '配偶者') { S.flags.widowed = true; S.flags.trying = false; }
    if ((p.rel === '父' || p.rel === '母') && G.parents().length === 0 && S.familySavings > 0 && S.age >= 18) {
      const share = Math.round(S.familySavings / (1 + G.siblings().length));
      S.familySavings = 0;
      G.money(share);
      G.log('📜 両親の遺産として ' + G.fmt(share) + ' を受け継いだ。', 'ev');
    }
  }

  function schoolProgress() {
    const a = S.age;
    if (a === 3 && S.school === 'none') { S.school = 'kinder'; G.log('🧸 ' + G.pick(['保育園', '幼稚園']) + 'に通い始めた。最初の一週間は、毎朝門の前で泣いた。', 'ev'); }
    if (a === 6 && (S.school === 'kinder' || S.school === 'none')) { S.school = 'elementary'; G.log('🏫 ' + S.city + 'の小学校に入学した！', 'big'); }
    if (a === 12 && S.school === 'elementary') { S.edu = 1; S.school = 'middle'; G.log('🎓 小学校を卒業し、中学校に進学した。', 'big'); }
    if (a === 15 && S.school === 'middle') { S.edu = 2; S.school = 'middle_done'; }
    if (S.school === 'high') {
      S.schoolYears = (S.schoolYears || 0) + 1;
      if (a >= 18) { S.edu = 3; S.school = 'high_done'; G.log('🎓 ' + (S.schoolName || '高校') + 'を卒業した。', 'big'); }
    }
    if (S.school === 'univ') {
      S.schoolYears++;
      if (S.schoolYears === 1) G.log('🎓 大学生活が始まった。サークルの勧誘がすごい。', 'ev');
      if (S.schoolYears >= 4) { S.edu = 4; S.school = 'univ_done'; G.log('🎓 大学を卒業した！', 'big'); }
    }
    if (S.school === 'vocational') {
      S.schoolYears++;
      if (S.schoolYears >= 2) { S.edu = 3; S.flags.vocational = true; S.school = 'none'; G.log('🎓 専門学校を卒業した！', 'big'); if (!S.job) G.queue('jobhunt'); }
    }
    if (S.school === 'grad') {
      S.schoolYears++;
      if (S.schoolYears >= 2) { S.edu = 5; S.school = 'none'; G.log('🎓 大学院を修了した！', 'big'); if (!S.job || DATA.jobById[S.job].partTime) G.queue('jobhunt'); }
    }
    // 大人が無職のときは時々仕事探しを促す
    if (!S.job && !S.retired && S.school === 'none' && a >= 18 && a < 60 && a % 2 === 0) G.queue('jobhunt');
  }

  function yearlyMoney() {
    const avg = G.avg();
    const d = G.person('父'), m = G.person('母');
    // 実家の家計
    const famInc = (d ? d.income : 0) + (m ? m.income : 0);
    const kidsAtHome = 1 + S.people.filter(p => ['兄', '姉', '弟', '妹'].includes(p.rel) && p.alive && p.age >= 0 && p.age < 22).length;
    if (d || m) S.familySavings = Math.round(S.familySavings + famInc * 0.85 - avg * (0.45 + 0.1 * kidsAtHome));
    if (S.familySavings < 0 && G.chance(0.15) && S.age < 18) G.log('💸 家計が苦しいらしい。' + G.relName('母') + 'がため息をついていた。', 'sad');

    if (S.age < 18) {
      if (S.age >= 8) S.money += Math.round(avg * 0.004);
      if (S.job) S.money += Math.round(S.income * 0.9);
      return;
    }
    const sp = G.spouse();
    const minors = G.kids(true).filter(k => k.age < 22).length;
    const livingHome = !S.job && !sp && S.age < 25 && (d || m);
    let expense = livingHome ? avg * 0.08 : avg * (0.5 + (sp ? 0.25 : 0) + 0.12 * minors);
    expense += S.pets.filter(p => p.alive).length * avg * 0.02;
    if (G.isStudent() && (d || m)) { S.familySavings -= Math.round(avg * 0.25); expense = avg * 0.05; }
    let inc = (S.income || 0) * 0.82 + (sp ? sp.income * 0.82 : 0);
    let net = inc - expense;
    if (S.loan && S.loan.left > 0) {
      const pay = Math.min(S.loan.left, S.loan.yearly);
      S.loan.left -= pay; net -= pay;
      if (S.loan.left <= 0) { S.loan = null; G.log('🏦 住宅ローンを完済した！ この家は、正真正銘わが家だ。', 'big'); }
    }
    if (S.debt > 0 && S.income > 0) {
      const pay = Math.min(S.debt, Math.round(avg * 0.06));
      S.debt -= pay; net -= pay;
      if (S.debt <= 0) G.log('📄 奨学金を返し終えた！ 肩の荷がひとつ下りた。', 'good');
    }
    if (G.has('倹約家')) net += avg * 0.03;
    if (G.has('浪費家')) net -= avg * 0.04;
    S.money = Math.round(S.money + net);
    if (S.money > 0) S.money = Math.round(S.money * 1.01);
    if (S.money < -avg * 0.5) {
      G.stat('mind', -5); G.stat('happy', -3);
      if (G.chance(0.4)) G.log('💸 借金がふくらんでいる…。毎月の支払いに追われている。', 'sad');
    }
  }

  function yearlyStats() {
    const a = S.age, st = S.stats;
    if (a < 18) { G.stat('smarts', G.r(0, 3)); G.stat('fitness', G.r(0, 3)); G.stat('social', G.r(0, 1)); }
    if (a > 30) G.stat('fitness', -G.r(0, 2));
    if (a > 40) G.stat('health', -G.r(0, 2));
    if (a > 35) G.stat('looks', -G.r(0, 1));
    if (a > 55) G.stat('health', -G.r(0, 2));
    if (a > 70) { G.stat('health', -G.r(1, 3)); G.stat('fitness', -G.r(1, 2)); }
    if (a > 80) G.stat('health', -G.r(1, 3));
    if (a > 65) G.stat('smarts', -G.r(0, 1));
    if (st.fitness > 70) G.stat('health', 1);
    if (st.fitness < 25 && a > 20) G.stat('health', -1);
    if (st.mind < 20) G.stat('health', -2);
    if (st.mind < 30) G.stat('happy', -2);
    // 自然に平均へ戻る（若いうちは体も回復しやすい）
    G.stat('happy', Math.round((55 - st.happy) * 0.12));
    G.stat('mind', Math.round((62 - st.mind) * 0.1));
    if (a < 30 && st.health < 85) G.stat('health', Math.round((85 - st.health) * 0.15));
    else if (a < 60 && st.health < 70) G.stat('health', Math.round((70 - st.health) * 0.06));
    if (a > 20) G.stat('social', -G.r(0, 1));
    // 仕事のストレス
    if (S.job) { const j = DATA.jobById[S.job]; G.stat('mind', -Math.max(0, j.stress - 2)); if (j.fit) G.stat('fitness', 1); }
    if (S.flags.lucky && G.chance(0.1)) G.stat('happy', 3);
    // 性格の影響
    S.traits.forEach(t => { const y = DATA.traits[t] && DATA.traits[t].yearly; if (y) Object.keys(y).forEach(k => G.stat(k, y[k])); });
    // 恋人・配偶者との距離
    const pt = G.partner();
    if (pt) { pt.close = G.clamp(pt.close - G.r(0, 3) + (G.has('一途') ? 1 : 0), 0, 100); if (pt.close < 25 && pt.rel === '恋人' && G.chance(0.5)) { G.breakup(pt); G.log('💔 ' + pt.first + 'に別れを告げられた。最近すれ違ってばかりだった。', 'sad'); G.stat('happy', -10); } }
    S.hsum += st.happy; S.hn++;
  }

  function careerYear() {
    if (!S.job) return;
    const j = DATA.jobById[S.job];
    S.jobYears = (S.jobYears || 0) + 1;
    if (j.partTime) return;
    const unstable = j.volatile || S.selfEmployed;
    if (unstable) S.income = Math.round(G.clamp(S.income * G.rf(0.7, 1.45), G.avg() * 0.15, G.avg() * 8));
    else S.income = Math.round(S.income * G.rf(1.0, 1.04));

    // 昇進・キャリアアップ（職業ごとの肩書きルート）
    const ladder = S.ladder || j.ladder || [];
    const rank = S.rank || 0;
    const pc = (unstable ? 0.08 : 0.1) + S.stats.smarts / 900 + (S.flags.careerBoost || 0) * 0.04 + (G.has('野心家') ? 0.06 : 0) + (G.has('努力家') ? 0.04 : 0);
    if (S.jobYears >= 2 && G.chance(pc)) {
      if (!S.ladder && j.branches && rank >= j.branchAt && !S.flags['branch_' + j.id]) {
        S.flags['branch_' + j.id] = true;
        G.queue(branchEvent(j));
        return; // 分かれ道の年は、ほかのキャリアの変化は起こさない
      } else if (rank < ladder.length) {
        S.rank = rank + 1;
        S.jobTitle = ladder[rank];
        S.income = Math.round(S.income * G.rf(1.08, 1.25));
        S.flags.careerBoost = 0;
        G.log((unstable ? '🌟 ステップアップ！ ' : '🎊 キャリアアップ！ ') + '「' + S.jobTitle + '」になった（年収 ' + G.fmt(S.income) + '）', 'good');
        G.stat('happy', 6);
      }
    }
    if (j.maxAge && S.age > j.maxAge && G.chance(0.5)) {
      G.log('👋 ' + j.name + 'を引退した。体が昔のようには動かない。', 'ev'); G.clearCareer(); return;
    }
    if (S.age < 62 && G.chance(S.selfEmployed ? 0.04 : j.volatile ? 0.05 : 0.02)) {
      G.log(S.selfEmployed ? '📉 経営が立ち行かなくなり、「' + S.jobTitle + '」としての仕事をたたむことになった…。' : '📉 会社の業績悪化で、' + j.name + 'の仕事を失ってしまった…。', 'sad');
      G.clearCareer();
      G.stat('mind', -10); G.stat('happy', -6);
    }
  }

  // キャリアの分かれ道（マネジメント・独立・店舗を任される など）
  function branchEvent(j) {
    return {
      emoji: j.emoji, title: 'キャリアの分かれ道',
      cond: () => S.job === j.id && !S.ladder,
      text: () => '「' + S.jobTitle + '」として、たくさんの経験を積んできた。この先、どの道に進む？',
      info: () => [
        { title: 'いまの仕事', rows: [['💼 肩書き', S.jobTitle], ['💴 年収', G.fmt(S.income)], ['📅 勤続', S.jobYears + '年']] },
        { title: 'お金のこと', rows: G.moneyRows() }
      ],
      choices: () => j.branches.map(b => {
        const cost = Math.round(G.avg() * (b.cost || 0));
        return {
          label: b.label,
          sub: b.desc + '／年収の目安 ' + G.fmt(S.income * b.mult) + (cost ? '／初期費用 ' + G.fmt(cost) : '') + (b.self ? '／収入は不安定' : ''),
          ok: S.money >= cost,
          t: b.self ? ['自由人', '冒険好き'] : b.after.length ? ['野心家'] : ['のんびり屋'],
          do: () => {
            if (cost) G.money(-cost);
            S.ladder = b.after; S.rank = 0; S.jobTitle = b.title; S.selfEmployed = !!b.self;
            S.income = Math.round(S.income * b.mult);
            G.fx(b.self ? { happy: 8, mind: -4 } : { happy: 6, social: 2 });
            G.log('🧭 「' + S.jobTitle + '」として新しい一歩を踏み出した（年収 ' + G.fmt(S.income) + '）', 'big');
            return b.self ? '覚悟を決めて独立した。看板を掲げた日の朝の空気は、少しだけ違って見えた。' : '新しい役割を引き受けた。これまでの経験が、次のステージで生きてくる。';
          }
        };
      }).concat([{ label: '🌱 今のままの働き方を続ける', t: ['のんびり屋'], do: () => { G.fx({ mind: 5 }); S.ladder = []; return '「' + S.jobTitle + '」のまま、自分のペースで腕を磨き続けることにした。'; } }])
    };
  }

  function familyEvents() {
    const sp = G.spouse();
    if (S.flags.trying && sp && S.age <= 46 && sp.age <= 46 && G.chance(0.4)) {
      const g = G.chance(0.5) ? 'm' : 'f';
      const k = G.newPerson({ gender: g, age: 0, rel: g === 'm' ? '息子' : '娘', last: S.me.last, close: G.r(80, 98), avoid: G.myKidsNames().concat([S.me.first, sp.first]) });
      S.people.push(k);
      S.flags.trying = false; S.flags.babyAskedAge = S.age;
      sp.kidsCount = (sp.kidsCount || 0) + 1;
      G.log('👶 ' + (g === 'm' ? '男の子' : '女の子') + 'が生まれた！ 名前は「' + k.first + '」。小さな手が、指をぎゅっと握り返した。', 'big');
      G.stat('happy', 15); G.stat('mind', -4);
    }
    // 子どもの成長
    G.kids(true).forEach(k => {
      if (k.age === 6) G.log('🎒 ' + k.first + 'が小学校に入学した。', 'ev');
      if (k.age === 18) G.log('🎓 ' + k.first + 'が高校を卒業した。もう立派な大人だ。', 'ev');
      if (k.age === 18 && k.rel.indexOf('義理') < 0 && S.money > 0) {
        const fee = Math.round(G.avg() * 0.2);
        G.money(-fee); G.log('🎓 ' + k.first + 'の進学費用 ' + G.fmt(fee) + ' を出した。', 'ev');
      }
    });
  }

  function friendsGrow() {
    if ((S.age === 4 || S.age === 7 || S.age === 13 || S.age === 19) && S.friends.length < 6) G.friendName();
  }

  // ================= イベントの選び方 =================
  function eligible(e) {
    if (S.age < e.min || S.age > e.max) return false;
    if (e.once !== false && S.done[e.id]) return false;
    try { if (e.cond && !e.cond(S, G)) return false; } catch (err) { console.error(err); return false; }
    return true;
  }
  function planEvents() {
    const ce = DATA.countryEvents[S.country] || [];
    const all = DATA.events.concat(ce);
    // 節目イベントは必ず
    all.filter(e => e.milestone && eligible(e)).forEach(e => { S.done[e.id] = true; Q.push({ ev: e }); });
    if (S.age < 1) return;
    // 文化のお祭り
    const fests = G.c().festivals;
    if (S.age >= 2 && G.chance(0.38)) {
      const f = G.pick(fests.filter(x => x.name !== S.flags.lastFest).concat(fests.length === 1 ? fests : []));
      S.flags.lastFest = f.name;
      Q.push({ ev: festivalEvent(f) });
    }
    // ランダムイベント
    const pool = all.filter(e => !e.milestone && eligible(e));
    const r = Math.random();
    let n = S.age < 3 ? (r < 0.4 ? 1 : 0) : (r < 0.2 ? 0 : r < 0.78 ? 1 : 2);
    const chosen = [];
    for (let i = 0; i < n && pool.length; i++) {
      const e = G.wpick(pool, x => (x.w || 1) * (ce.includes(x) ? 2.5 : 1));
      pool.splice(pool.indexOf(e), 1);
      chosen.push(e);
    }
    chosen.forEach(e => { S.done[e.id] = true; Q.push({ ev: e }); });
  }

  function festivalEvent(f) {
    const ev = {
      id: 'fest', emoji: f.emoji, title: f.name, culture: true,
      text: () => f.emoji + ' ' + f.name + 'の季節がやってきた。' + f.desc
    };
    if (S.age < 6) {
      ev.auto = () => { G.fx({ happy: 4, art: 1 }); return f.emoji + ' ' + f.name + '：' + G.pick(f.mem); };
      return ev;
    }
    ev.choices = () => [
      { label: '🎉 思いっきり楽しむ', t: ['社交的'], do: (S, G) => { if (S.age >= 18) G.money(-G.avg() * 0.004); G.fx({ happy: 6, social: 3 }); return G.pick(f.mem); } },
      { label: '🏠 家族とゆっくり過ごす', t: ['家族思い'], do: (S, G) => { G.closeAll(FAMILY_RELS, 3); G.fx({ happy: 4, mind: 3 }); return G.fill('{fam}たちと' + G.food() + 'を囲みながら、' + f.name + 'を過ごした。毎年同じことをするのが、なんだか心地いい。') || ('家族と' + f.name + 'を静かに過ごした。'); } },
      { age: [6, 11], label: '👵 おじいちゃん・おばあちゃんに由来を聞く', t: ['伝統を重んじる', '好奇心旺盛'], do: (S, G) => { G.fx({ smarts: 2, art: 2 }); G.closeAll(['父', '母'], 2); return '「昔はね…」と始まる' + f.name + 'の話。知らなかったことばかりで、目を丸くして聞いた。'; } },
      { age: [12, 120], label: '📖 由来や歴史を調べる', t: ['伝統を重んじる', '好奇心旺盛'], do: (S, G) => { G.fx({ smarts: 3, art: 2 }); return f.name + 'の由来を調べてみた。昔の人の想いが、形を変えて今も続いているんだと知った。'; } },
      { label: '😴 今年はのんびりパス', t: ['のんびり屋'], do: (S, G) => { G.fx({ mind: 4 }); return '遠くから聞こえる' + f.name + 'のにぎわいを、部屋で聞いていた。それもまた風情。'; } }
    ];
    return ev;
  }

  // ================= 思い出 =================
  function stageKey(a) {
    if (a <= 3) return 'baby';
    if (a <= 12) return 'kid';
    if (a <= 18) return 'teen';
    if (a <= 29) return 'young';
    if (a <= 49) return 'adult';
    if (a <= 64) return 'middle';
    return 'senior';
  }
  function addMemories() {
    const n = S.age < 1 ? 0 : (G.chance(0.45) ? 2 : 1);
    const used = S.usedMem || (S.usedMem = {});
    for (let i = 0; i < n; i++) {
      let text = null;
      for (let tries = 0; tries < 10 && !text; tries++) {
        const r = Math.random();
        let src;
        if (r < 0.22 && S.traits.length && S.age >= 4) {
          const t = G.pick(S.traits);
          src = (DATA.traitMemories[t] || []);
        } else if (r < 0.36 && S.age >= 4) {
          src = DATA.countryMemories;
        } else {
          src = DATA.memories[stageKey(S.age)];
        }
        if (!src || !src.length) continue;
        const tpl = G.pick(src);
        if (used[tpl] && tries < 8) continue;
        const filled = G.fill(tpl);
        if (filled) { text = filled; used[tpl] = true; }
      }
      if (text) G.log(text, 'mem');
    }
  }

  // ================= 死 =================
  function deathCheck() {
    if (!S.alive) return;
    const h = S.stats.health, a = S.age, life = G.c().life;
    let hz = a < 5 ? 0.0015 : a < 40 ? 0.0007 : 0.0007 + 0.08 * Math.exp((a - life) / 9);
    hz *= 0.3 + (100 - h) / 45;
    if (h < 10) hz += 0.25;
    if (a >= 120) hz = 1;
    if (h <= 0 || G.chance(Math.min(hz, 0.95))) die();
  }
  function die() {
    S.alive = false;
    const a = S.age, h = S.stats.health, life = G.c().life;
    let cause;
    if (a >= life - 6 && h > 25) cause = '老衰';
    else if (h < 40) cause = G.pick(['病気', '心臓の病', '長い闘病の末']);
    else cause = G.pick(['不慮の事故', '突然の病']);
    S.deathCause = cause;
    const sp = G.spouse(), kids = G.kids(true);
    let last;
    if (cause === '老衰') last = '🕊️ ' + a + '歳。' + (sp ? sp.first + 'に手を握られながら' : kids.length ? '家族に見守られながら' : '窓から差し込むやわらかな光の中で') + '、静かに眠るように旅立った。';
    else last = '🕊️ ' + a + '歳、' + cause + 'で人生の幕を閉じた。';
    G.log(last, 'sad');
    S.flags.lastWords = G.pick(['ありがとう。いい人生だった。', 'みんな、笑っていてね。', 'もう一回生まれても、この人生がいいな。', 'おなかすいた。', 'ちょっと、寝るね。', 'またね。']);
    G.log('💬 最後の言葉：「' + S.flags.lastWords + '」', 'mem');
    yearOpen = false;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 保存できない環境 */ }
    UI.render();
    UI.showEnding();
  }

  // ================= ゲーム進行 =================
  function runQueue() {
    while (Q.length) {
      const item = Q[0];
      const ev = item.ev;
      // 同じ年の前のイベントで状況が変わっていたら（恋人と別れた等）発生させない
      if (item.ctx == null) {
        let okNow = true;
        try { if (ev.cond && !ev.cond(S, G)) okNow = false; } catch (e) { okNow = false; }
        if (okNow && ev.setup) {
          try { item.ctx = ev.setup(S, G); } catch (e) { console.error(e); okNow = false; }
          if (item.ctx && 'p' in item.ctx && !item.ctx.p) okNow = false;
        }
        if (!okNow) { Q.shift(); continue; }
      }
      if (ev.auto) {
        Q.shift();
        const r = capture(() => ev.auto(S, G, item.ctx));
        if (r.res) G.log((ev.emoji ? ev.emoji + ' ' : '') + r.res, ev.culture || isCountryEvent(ev) ? 'culture' : 'ev', r.fx);
        continue;
      }
      let choices;
      try { choices = typeof ev.choices === 'function' ? ev.choices(S, G, item.ctx) : ev.choices; } catch (e) { console.error(e); Q.shift(); continue; }
      // 年齢に合う選択肢だけを残す（age: [最小, 最大]）
      item.choices = (choices || []).filter(c => !c.age || (S.age >= c.age[0] && S.age <= c.age[1]));
      if (!item.choices.length) { Q.shift(); continue; }
      UI.render();
      UI.showEvent(item);
      return;
    }
    if (yearOpen) finalizeYear();
    else { save(); UI.render(); }
  }
  function isCountryEvent(ev) { return (DATA.countryEvents[S.country] || []).includes(ev); }

  function choose(item, idx) {
    const ch = item.choices[idx];
    if (!ch || ch.ok === false) return;
    Q.shift();
    const ev = item.ev;
    const r = capture(() => {
      (ch.t || []).forEach(t => G.traitPoint(t, 1));
      return ch.do ? ch.do(S, G, item.ctx) : '';
    });
    const kind = ev.culture || isCountryEvent(ev) ? 'culture' : 'ev';
    const title = (ev.emoji || '') + ' ' + (ev.title || '');
    if (r.res) G.log('【' + title.trim() + '】' + r.res, kind, r.fx);
    UI.showResult(item, ch, r);
  }

  function finalizeYear() {
    yearOpen = false;
    addMemories();
    deathCheck();
    if (S.alive) { save(); UI.render(); }
  }

  function nextYear() {
    if (!S || !S.alive || Q.length) return;
    ageUp();
    planEvents();
    runQueue();
  }

  // ================= 行動 =================
  function actCost(a) { return Math.round((a.cost || 0) * G.avg()); }
  function actPayer() { return S.age < 18 ? 'family' : 'me'; }
  function actAvailable(a) {
    if (S.age < (a.min || 0) || (a.max && S.age > a.max)) return { ok: false, why: (a.min || 0) + '歳から' };
    if (a.needPet && !S.pets.some(p => p.alive)) return { ok: false, why: 'ペットがいない' };
    if (a.studentOnly && S.job && !DATA.jobById[S.job].partTime) return { ok: false, why: '就職済み' };
    if (a.family && !S.people.some(p => p.alive && FAMILY_RELS.includes(p.rel) && p.age >= 0)) return { ok: false, why: '家族がいない' };
    const cost = actCost(a);
    if (cost > 0) {
      const wallet = actPayer() === 'family' ? S.familySavings : S.money;
      if (wallet < cost) return { ok: false, why: actPayer() === 'family' ? '家計が厳しい' : 'お金が足りない' };
    }
    if (S.ap <= 0) return { ok: false, why: '今年はもう疲れた' };
    return { ok: true };
  }
  function doActivity(id) {
    const a = DATA.activities.find(x => x.id === id);
    if (!a || Q.length || !S.alive) return;
    if (!actAvailable(a).ok) return;
    S.ap--;
    const r = capture(() => {
      const cost = actCost(a);
      if (cost) { if (actPayer() === 'family') S.familySavings -= cost; else G.money(-cost); }
      G.fx(a.fx);
      if (a.income) G.money(G.avg() * a.income);
      if (a.careerBoost) S.flags.careerBoost = (S.flags.careerBoost || 0) + 1;
      if (a.family) { G.closeAll(FAMILY_RELS, 4); }
      if (a.trait && G.chance(a.trait[1] * 1.5)) G.traitPoint(a.trait[0], 1);
      return G.fill(G.pick(a.texts)) || G.fill(a.texts[0]) || (a.name + 'をした。');
    });
    G.log(a.emoji + ' ' + r.res, 'act', r.fx);
    save();
    UI.render();
    UI.flashFx(r.fx);
  }

  // 人生の行動（仕事・恋愛など）
  function lifeActions() {
    const list = [];
    const a = S.age;
    const fulltime = S.job && !DATA.jobById[S.job].partTime;
    if (a >= 15 && !G.isStudent() && !S.retired) list.push({ id: 'jobhunt', emoji: '💼', name: fulltime ? '転職活動をする' : '仕事を探す', desc: '求人から選んで働く' });
    if (S.job) list.push({ id: 'quit', emoji: '🚪', name: '仕事を辞める', desc: '収入がなくなる' });
    if (a >= 55 && S.job && !S.retired) list.push({ id: 'retire', emoji: '🌅', name: '引退する', desc: '年金生活に入る（年金 ' + G.fmt(G.avg() * 0.35) + '）' });
    if (a >= 16 && !G.partner()) list.push({ id: 'findlove', emoji: '💘', name: '恋人を探す', desc: '3人の中から選べる' });
    if (a >= 18 && G.person('恋人')) list.push({ id: 'propose', emoji: '💍', name: 'プロポーズする', desc: G.person('恋人').first + 'に想いを伝える' });
    if (G.spouse() && a <= 46 && !S.flags.trying) list.push({ id: 'baby', emoji: '👶', name: '子どもを授かりたい', desc: '養育費の目安 ' + G.fmt(G.avg() * 0.12) + '／年' });
    if (G.partner()) list.push({ id: 'breakup', emoji: '💔', name: G.spouse() ? '離婚を考える' : '別れを考える', desc: '関係を見つめ直す' });
    if (a >= 18 && !S.pets.some(p => p.alive)) list.push({ id: 'pet', emoji: '🐾', name: 'ペットを迎える', desc: '保護動物の譲渡会へ' });
    if (a >= 25 && !S.house && S.income > 0) list.push({ id: 'house', emoji: '🏡', name: '家を探す', desc: 'マイホームを検討する' });
    if (a >= 22 && a <= 60 && S.edu === 3 && S.school === 'none') list.push({ id: 'reuniv', emoji: '🎓', name: '大学に入り直す', desc: '学費 ' + G.fmt(G.avg() * 0.28) + '×4年（奨学金）' });
    return list;
  }
  function doLife(id) {
    if (Q.length || !S.alive || S.ap <= 0) return;
    S.ap--;
    switch (id) {
      case 'jobhunt': G.queue('jobhunt'); break;
      case 'quit': G.quitJob(); G.stat('mind', 6); break;
      case 'retire': G.retire(); G.stat('mind', 10); break;
      case 'findlove': G.queue('findlove'); break;
      case 'propose': G.queue('propose'); break;
      case 'baby': S.flags.trying = true; G.log('👶 ' + G.spouse().first + 'と、子どもを迎える準備を始めた。', 'ev'); break;
      case 'breakup': G.queue('breakup'); break;
      case 'pet': G.queue(DATA.events.find(e => e.id === 'adopt_pet')); break;
      case 'house': G.queue(DATA.events.find(e => e.id === 'house')); break;
      case 'reuniv': S.school = 'univ'; S.schoolYears = 0; S.debt += Math.round(G.avg() * 0.28 * 4); G.quitJob(); G.log('🎓 もう一度大学生になった！ 学び直しの春。', 'big'); break;
    }
    runQueue();
  }

  // ================= 保存 =================
  function save() {
    if (!S || !S.alive) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 保存できない環境 */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || !s.alive || !DATA.countryByCode[s.country]) return false;
      S = s;
      (S.pets || []).forEach(p => { const t = DATA.petTypes.find(x => x.type === p.type); if (t) p.emoji = t.emoji; });
      return true;
    } catch (e) { return false; }
  }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

  // ================= 結果 =================
  function summary() {
    const c = G.c();
    const kids = G.people(p => ['息子', '娘', '義理の息子', '義理の娘'].includes(p.rel));
    const grand = G.people(p => p.rel === '孫');
    const happyAvg = S.hn ? Math.round(S.hsum / S.hn) : S.stats.happy;
    const st = S.stats;
    let title;
    if (S.age < 30) title = '🌠 短くも、まばゆく輝いた人生';
    else if (G.has('家族思い') && kids.length >= 2) title = '🏠 家族に愛され、家族を愛した人生';
    else if (S.money >= G.avg() * 20) title = '💰 大きな成功をつかんだ人生';
    else if (happyAvg >= 68) title = '🌞 笑顔のあふれる人生';
    else if (st.art >= 80) title = '🎨 美しいものとともに生きた人生';
    else if (st.smarts >= 85) title = '📚 知ることを愛した人生';
    else if (G.has('冒険好き')) title = '🧭 冒険に満ちた人生';
    else if (S.age >= 95) title = '🌳 長く、穏やかな人生';
    else if (st.social >= 75) title = '🤝 たくさんの縁に恵まれた人生';
    else title = '🍃 ささやかで、かけがえのない人生';
    const highlights = [];
    S.log.forEach(y => y.items.forEach(it => { if (it.k === 'big' || it.k === 'culture') highlights.push({ age: y.age, t: it.t }); }));
    const picks = highlights.length > 9 ? [highlights[0]].concat(G.shuffle(highlights.slice(1)).slice(0, 8).sort((a, b) => a.age - b.age)) : highlights;
    const score = Math.round(G.clamp(happyAvg * 0.5 + S.age * 0.25 + S.traits.length * 1.5 + kids.length * 2 + Math.min(10, Math.max(0, S.money / G.avg())), 0, 100));
    return { c, kids, grand, happyAvg, title, picks, score };
  }

  // ================= 公開API =================
  window.Game = {
    STATS, STAT_BY_KEY, REL_EMOJI, FAMILY_RELS,
    get S() { return S; },
    get Q() { return Q; },
    newGame, load, hasSave, nextYear, choose, runQueue, doActivity, doLife, actAvailable, actCost, actPayer, lifeActions, summary,
    clearSave: () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ } }
  };
})();
