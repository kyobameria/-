// =============================================================
// Happy Birth Day — ゲームの進行と計算
// 画面に関わる処理は ui.js。ここでは状態 S を作って更新するだけ
// =============================================================
(function () {
  'use strict';
  const H = window.HB;

  // ---------------- 小さな道具
  const R = Math.random;
  const rnd = (a, b) => Math.floor(R() * (b - a + 1)) + a;
  const rndf = (a, b) => R() * (b - a) + a;
  const pick = a => a[Math.floor(R() * a.length)];
  const chance = p => R() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const wpick = (items, wf) => { const ws = items.map(wf); let t = ws.reduce((x, y) => x + y, 0); if (t <= 0) return null; let r = R() * t; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  function fmtYen(y) {
    const neg = y < 0; y = Math.abs(Math.round(y));
    let s;
    if (y >= 1e8) s = (y / 1e8).toFixed(y >= 1e10 ? 0 : 1).replace(/\.0$/, '') + '億円';
    else if (y >= 1e4) s = Math.round(y / 1e4).toLocaleString('ja-JP') + '万円';
    else s = y.toLocaleString('ja-JP') + '円';
    return (neg ? '-' : '') + s;
  }

  let S = null;            // ゲームの状態
  let listeners = [];      // 画面更新の通知先
  const SAVE_KEY = 'happy-birth-day-v1';

  // ---------------- 国・お金
  const C = code => H.countryMap[code];
  const live = () => C(S.me.live);
  const birth = () => C(S.me.country);
  const ppp = (code) => Math.max(0.05, (code ? C(code) : live()).ppp);
  const price = yen => Math.round(yen * ppp());

  function wallet() { return S.indep ? S.money.mine : S.money.parents; }
  function spend(yen) { if (S.indep) S.money.mine -= yen; else S.money.parents -= yen; }
  function canPay(yen) { return yen <= 0 || wallet() >= yen; }

  // ---------------- 名前
  function fullName(p) {
    const c = C(p.country || S.me.country);
    return c.order === 'lf' ? `${p.last} ${p.first}` : `${p.first} ${p.last}`;
  }
  function newFirst(code, gender) {
    const c = C(code);
    const list = gender === 'f' ? c.f : c.m;
    const used = new Set(S ? S.usedNames : []);
    const free = list.filter(n => !used.has(n));
    const n = free.length ? pick(free) : pick(list);
    if (S) S.usedNames.push(n);
    return n;
  }

  // ---------------- ステータス
  function traitMult(stat) {
    let m = 1;
    S.traits.has.forEach(id => { const t = H.TRAIT[id]; if (t && t.mult && t.mult[stat]) m *= t.mult[stat]; });
    return m;
  }
  function swing() { let s = 1; S.traits.has.forEach(id => { const t = H.TRAIT[id]; if (t && t.swing) s *= t.swing; }); return s; }
  // fx を適用して、実際の変化量を返す
  function applyFx(fx, opt) {
    const out = {};
    if (!fx) return out;
    Object.keys(fx).forEach(k => {
      let v = fx[k];
      if (!(k in S.stats)) return;
      if (v > 0 && !(opt && opt.raw)) v = v * traitMult(k);
      if (k === 'mental') v = v * swing();
      v = Math.round(v);
      const before = S.stats[k];
      S.stats[k] = clamp(before + v, 0, 100);
      const d = S.stats[k] - before;
      if (d) out[k] = d;
    });
    return out;
  }
  function fxText(d) {
    return Object.keys(d).map(k => `${H.STAT[k].e}${d[k] > 0 ? '+' : ''}${d[k]}`).join(' ');
  }

  // ---------------- ログ
  function curLog() {
    let y = S.log[S.log.length - 1];
    if (!y || y.age !== S.me.age) { y = { age: S.me.age, items: [] }; S.log.push(y); }
    return y;
  }
  function log(t, k, extra) { curLog().items.push(Object.assign({ t, k: k || 'event' }, extra || {})); }
  function hl(t, w) { S.hl.push({ age: S.me.age, t, w: w || 3 }); }

  // ---------------- 状態の便利関数
  const has = id => S.traits.has.includes(id);
  const hp = id => S.hp[id] || 0;
  const hobbyLevel = pts => { let l = 0, need = 1, rest = pts; while (rest >= need) { rest -= need; l++; need++; } return { lv: l, rest, need }; };
  const activeHobby = id => S.hobbies.find(h => h.id === id);
  const club = () => S.hobbies.find(h => h.club);
  const isStudent = () => !!S.school && S.school.stage !== 'kinder';
  const inStage = st => !!S.school && S.school.stage === st;
  const female = () => S.me.gender === 'f';
  const parentsAlive = () => [S.fam.dad, S.fam.mom].filter(p => p && p.alive);
  const spouse = () => S.fam.partner && S.fam.partner.status === 'spouse' && S.fam.partner.alive ? S.fam.partner : null;
  const lover = () => S.fam.partner && S.fam.partner.status === 'lover' ? S.fam.partner : null;
  const sportPts = () => Math.max(0, ...H.SPORTS.map(hp));
  const hasSportHobby = () => S.hobbies.some(h => H.SPORTS.includes(h.id));
  const graduated = st => S.edu[st] && S.edu[st].done;

  function stageOfAge(a) { return a <= 5 ? 1 : a <= 11 ? 2 : 3; }

  // =============================================================
  // 誕生
  // =============================================================
  function pickCountry() { return wpick(H.countries, c => c.births).code; }
  function wpickIndex(ws) { const t = ws.reduce((a, b) => a + b, 0); let r = R() * t; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; } return ws.length - 1; }

  function parentJob(cls, code) {
    const [n, base] = pick(H.PARENT_JOBS[cls]);
    let sal;
    if (cls === 5) sal = H.AVG_INCOME * rndf(40, 150) / 12 * 10000 * ppp(code);
    else sal = base * 10000 * ppp(code) * rndf(0.8, 1.25);
    return { job: n, sal: Math.round(sal) };
  }
  function randomTraits(n) {
    const pool = shuffle(H.TRAITS.filter(t => t.stage === 3));
    const out = [];
    for (const t of pool) {
      if (out.length >= n) break;
      if (t.block && t.block.some(b => out.includes(b))) continue;
      if (out.some(o => (H.TRAIT[o].block || []).includes(t.id))) continue;
      if (t.id === 'intro' && out.some(o => ['act3', 'extro', 'talk'].includes(o))) continue;
      if (['act3', 'extro', 'talk'].includes(t.id) && out.includes('intro')) continue;
      out.push(t.id);
    }
    return out;
  }
  function makePerson(o) {
    return Object.assign({ id: 'p' + Math.random().toString(36).slice(2, 9), alive: true, traits: randomTraits(rnd(3, 5)), items: [] }, o);
  }

  function newLife(opt) {
    opt = opt || {};
    S = {
      v: 1, over: false, usedNames: [], log: [], hl: [],
      me: {}, stats: {}, traits: { has: [], pts: {}, gotAt: {} },
      hp: {}, hobbies: [], noClub: false,
      school: null, edu: {}, eduFinal: 'なし', dropout: null,
      job: null, retired: false, pension: 0, everJob: false, peakIncome: 0,
      allowance: 0, money: { parents: 0, mine: 0 }, indep: false,
      house: null, pets: [], petsGone: [],
      fam: { dad: null, mom: null, partner: null, exes: [], kids: [] },
      love: { lastEnd: null, pref: 'opp', wantKids: true, everMarried: false },
      sick: null, neglect: 0, lowMental: 0,
      abroad: null, abroadDone: false,
      yr: null, cause: null, deathAge: null
    };
    const code = opt.country || pickCountry();
    const c = C(code);
    const gender = opt.gender || (chance(0.512) ? 'm' : 'f');
    const cls = opt.cls || (1 + wpickIndex(H.classDist[c.tier]));
    S.me = { country: code, live: code, gender, cls, age: 0, city: pick(c.cities) };

    // 親
    const last = pick(c.last);
    const momAge = clamp(Math.round(c.ma + gauss() * 4), 16, 45);
    const dadAge = clamp(momAge + rnd(-2, 6), 17, 60);
    const dadJob = parentJob(cls, code);
    let momJob;
    const homeChance = { rich: 0.2, upper: 0.35, mid: 0.3, low: 0.45, poor: 0.35 }[c.tier];
    if (cls === 5) momJob = chance(0.5) ? { job: '専業主婦', sal: 0 } : parentJob(4, code);
    else if (chance(homeChance)) momJob = { job: '専業主婦', sal: 0 };
    else momJob = parentJob(cls, code);
    S.fam.dad = makePerson({ rel: '父', gender: 'm', age: dadAge, country: code, first: newFirst(code, 'm'), last, job: dadJob.job, sal: dadJob.sal });
    S.fam.mom = makePerson({ rel: '母', gender: 'f', age: momAge, country: code, first: newFirst(code, 'f'), last: c.keep ? pick(c.last) : last, job: momJob.job, sal: momJob.sal });
    [S.fam.dad, S.fam.mom].forEach(p => {
      const n = rnd(1, cls);
      const pool = [];
      for (let k = Math.max(1, cls - 1); k <= cls; k++) pool.push(...H.BELONGINGS[k]);
      p.items = shuffle(pool).slice(0, n);
    });

    // 本人
    S.me.first = opt.name || newFirst(code, gender);
    if (opt.name) S.usedNames.push(opt.name);
    S.me.last = last;
    const cm = (cls - 3) * 4;
    S.stats = {
      health: clamp(rnd(50, 72) + cm, 20, 90), stamina: rnd(5, 15), happy: rnd(55, 72), looks: rnd(20, 70),
      mental: rnd(30, 55), social: rnd(5, 15), intel: rnd(5, 15), sense: rnd(5, 15)
    };

    // お金
    const hh = (S.fam.dad.sal + S.fam.mom.sal) * 12;
    const sv = { 1: [0, 0.2], 2: [0.2, 1], 3: [1, 3], 4: [3, 8], 5: [10, 40] }[cls];
    S.money.parents = Math.round(hh * rndf(sv[0], sv[1]));
    if (cls >= 4 && chance(0.4)) S.allowance = Math.round(rnd(0, 10) * 1000 * ppp(code));

    // 誕生ログ
    const ci = H.classInfo[cls];
    log(`🎂 ${c.flag} ${c.name}の${S.me.city}で、${female() ? '女の子' : '男の子'}「${fullName(S.me)}」が生まれた。`, 'birth');
    log(`🏷️ 生まれの階級：${ci.stars}（${ci.name}）。${pick(ci.desc)}`, 'birth');
    log(`👨 父 ${S.fam.dad.first}（${dadAge}歳・${S.fam.dad.job}）、👩 母 ${S.fam.mom.first}（${momAge}歳・${S.fam.mom.job}）のもとで、人生が始まった。`, 'birth');
    hl(`${c.flag} ${c.name}の${S.me.city}で生まれた（${ci.stars} ${ci.name}）`, 6);
    newYear();
    save();
    return S;
  }

  // =============================================================
  // 性格
  // =============================================================
  function traitCount(stage) { return S.traits.has.filter(id => H.TRAIT[id].stage === stage).length; }
  function canGetTrait(id) {
    const t = H.TRAIT[id];
    if (!t || has(id)) return false;
    if (traitCount(t.stage) >= H.TRAIT_LIMIT[t.stage]) return false;
    if (t.block && t.block.some(has)) return false;
    if (['act3', 'extro', 'talk'].includes(id) && has('intro')) return false;
    return true;
  }
  function gainTrait(id, why) {
    if (!canGetTrait(id)) return false;
    const t = H.TRAIT[id];
    S.traits.has.push(id);
    S.traits.gotAt[id] = S.me.age;
    log(`🧬 性格「${t.e} ${t.name}」が芽生えた${why ? '（' + why + '）' : ''}。${t.desc}`, 'trait');
    if (t.stage === 3) hl(`性格「${t.name}」が芽生えた`, 1);
    return true;
  }
  function addTraitPt(id, n) {
    S.traits.pts[id] = (S.traits.pts[id] || 0) + (n || 1);
    checkTraitPoints();
  }
  function checkTraitPoints() {
    const st = stageOfAge(S.me.age);
    H.TRAITS.filter(t => t.stage === st).forEach(t => {
      if ((S.traits.pts[t.id] || 0) >= H.TRAIT_NEED[st]) gainTrait(t.id);
    });
  }
  // 年齢の節目（6歳・12歳）で前の性格から引き継ぐ
  function stageTransition() {
    const a = S.me.age;
    if (a === 6) {
      // 0〜5歳で性格が決まっていなければ、一番ポイントの高いものに
      if (!traitCount(1)) {
        const best = H.TRAITS.filter(t => t.stage === 1).sort((x, y) => (S.traits.pts[y.id] || 0) - (S.traits.pts[x.id] || 0))[0];
        S.traits.has.push(best.id); S.traits.gotAt[best.id] = 5;
      }
      const s1 = S.traits.has.find(id => H.TRAIT[id].stage === 1);
      if (s1 && H.TRAIT_PAIR[s1]) gainTrait(pick(H.TRAIT_PAIR[s1]), `${H.TRAIT[s1].name}だったから`);
      checkTraitPoints();
    }
    if (a === 12) {
      S.traits.has.filter(id => H.TRAIT[id].stage === 2).forEach(id => {
        const t3 = H.TRAITS.find(t => t.from === id);
        if (t3) gainTrait(t3.id, `${H.TRAIT[id].name}が大人になって`);
      });
      shuffle(H.TRAITS.filter(t => t.pts4)).forEach(t => {
        if (t.pts4.reduce((sum, p) => sum + (S.traits.pts[p] || 0), 0) >= 6) gainTrait(t.id, '子どもの頃の積み重ねから');
      });
      checkTraitPoints();
    }
  }
  function traitOptions() {
    const a = S.me.age;
    const st = stageOfAge(a);
    const n = st === 1 ? 4 : 5;
    const blocked = t => !has(t.id) && ((t.block && t.block.some(has)) || (['act3', 'extro', 'talk'].includes(t.id) && has('intro')));
    const pool = H.TRAITS.filter(t => t.stage === st && !t.petOnly && !blocked(t));
    return shuffle(pool).slice(0, n).map(t => ({ id: t.id, text: pick(t.t) }));
  }

  // =============================================================
  // 行動（ステータスを上げる選択肢）
  // =============================================================
  function actionOptions() {
    const a = S.me.age;
    const pool = H.ACTIONS.filter(x => a >= x.a[0] && a <= x.a[1] && (!x.pet || S.pets.length));
    const keys = Object.keys(S.stats);
    const minV = Math.min(...keys.map(k => S.stats[k]));
    const lowK = pick(keys.filter(k => S.stats[k] === minV));
    const under = keys.filter(k => S.stats[k] < 100);
    const maxV = under.length ? Math.max(...under.map(k => S.stats[k])) : -1;
    const highK = under.length ? pick(under.filter(k => S.stats[k] === maxV)) : null;
    const chosen = [];
    const take = x => { if (x && !chosen.includes(x)) chosen.push(x); };
    const cheapest = list => { if (!list.length) return null; const m = Math.min(...list.map(x => x.cost)); return pick(list.filter(x => x.cost === m)); };
    const raises = k => pool.filter(x => k && x.fx[k] > 0 && !chosen.includes(x));
    // ① いちばん低いステータス（0円・最安） ② いちばん低いステータス（ほか）
    // ③ 100未満でいちばん高いステータス（0円・最安） ④ 2番目に低いステータス ⑤⑥ ランダム
    take(cheapest(raises(lowK)));
    take(pick(raises(lowK)));
    if (highK !== lowK) take(cheapest(raises(highK)));
    const others = keys.filter(k => k !== lowK);
    const v2 = Math.min(...others.map(k => S.stats[k]));
    const secondK = pick(others.filter(k => S.stats[k] === v2));
    take(pick(raises(secondK)));
    const rest = shuffle(pool.filter(x => !chosen.includes(x)));
    while (chosen.length < 6 && rest.length) take(rest.shift());
    return chosen.slice(0, 6).map(x => ({ i: H.ACTIONS.indexOf(x), cost: price(x.cost) }));
  }

  // =============================================================
  // 学校
  // =============================================================
  const STAGE_EDU_IDX = { kinder: 0, elem: 1, middle: 2, high: 3, uni: 4, grad: 4 };
  function passRate(stage, tier, track, fac) {
    const st = H.STAGES[stage];
    let r = H.SCHOOL_RATE[st.rate][S.me.cls][tier];
    r += intelBonus(S.stats.intel, stage);
    if (stage === 'high' && track === 'sport' && sportPts() >= 5) r += 10;
    if (stage === 'uni' && fac === 'sport' && sportPts() >= 6) r += 10;
    // 国の進学補正（マイナスのみ・下限0.6倍）
    let f = birth().edu[STAGE_EDU_IDX[stage]];
    if (S.me.live !== S.me.country) f *= C(S.me.live).edu[STAGE_EDU_IDX[stage]];
    r = r * Math.max(0.6, Math.min(1, f));
    return clamp(Math.round(r), 0, 100);
  }
  // 知性ボーナス：学校ごとの基準値からの差×0.4（-10〜+20%）
  function intelBonus(intel, stage) {
    const st = H.STAGES[stage];
    if (st.piv == null) return 0;
    return clamp(Math.round((intel - st.piv) * 0.4), -10, 20);
  }
  function countryEdu(stage) {
    let f = birth().edu[STAGE_EDU_IDX[stage]];
    if (S.me.live !== S.me.country) f *= C(S.me.live).edu[STAGE_EDU_IDX[stage]];
    return Math.max(0.6, Math.min(1, f));
  }
  function fee(stage, tier) {
    const st = H.STAGES[stage];
    if (st.free && S.stats.intel >= st.free) return 0;
    return price(st.fees[tier]);
  }
  function schoolName(stage, tier, track, fac) {
    const st = H.STAGES[stage];
    let n = st.names[tier];
    if (stage === 'high' && track) n += ' ' + H.HS_TRACKS[track].n;
    if ((stage === 'uni' || stage === 'grad') && fac) n += ' ' + H.FACULTIES[fac].n;
    return n;
  }
  // 学校の選択肢（UI 用）
  function schoolOptions(stage, fac) {
    const st = H.STAGES[stage];
    const out = [];
    const tracks = stage === 'high' ? Object.keys(H.HS_TRACKS) : [null];
    tracks.forEach(track => {
      const tiers = track ? H.HS_TRACKS[track].tiers : [0, 1, 2];
      tiers.forEach(tier => {
        let lock = null;
        if (track === 'sport' && !hasSportHobby()) lock = 'スポーツ系の趣味が必要';
        const f = fee(stage, tier);
        if (!lock && !canPay(f)) lock = 'お金が足りない';
        out.push({ stage, tier, track, fac, name: schoolName(stage, tier, track, fac), rate: passRate(stage, tier, track, fac), fee: f, free: st.free && S.stats.intel >= st.free && st.fees[tier] > 0, lock });
      });
    });
    // エスカレーター
    if (st.esc && S.stats.intel >= st.esc) {
      const prev = stage === 'middle' ? S.edu.elem : S.edu.middle;
      if (prev && prev.tier <= 1) {
        const f = fee(stage, prev.tier);
        out.unshift({ stage, tier: prev.tier, track: stage === 'high' ? 'gen' : null, esc: true, name: schoolName(stage, prev.tier, stage === 'high' ? 'gen' : null) + '（内部進学）', rate: 100, fee: f, lock: canPay(f) ? null : 'お金が足りない' });
      }
    }
    return out;
  }
  function facultyOk(fac) {
    const f = H.FACULTIES[fac];
    const hs = S.edu.high;
    if (!hs || !hs.done) return '高校卒業が必要';
    if (f.ok !== 'any' && !f.ok.includes(`${hs.tier}-${hs.track}`)) return '出身の高校・科では進めない';
    if (f.hobby) {
      const need = fac === 'sport' ? 5 : 5;
      if (!f.hobby.some(h => hp(h) >= need)) return `${f.hobby.map(h => H.HOBBY[h].n).join('・')}のどれかが${need}pt必要`;
    }
    return null;
  }
  function enterSchool(o) {
    const st = H.STAGES[o.stage];
    S.school = { stage: o.stage, tier: o.tier, track: o.track || null, fac: o.fac || null, start: S.me.age, years: st.years, name: o.name, fee: o.fee };
    if (o.stage === 'uni') S.school.years = H.FACULTIES[o.fac].years;
    if (o.stage === 'grad') S.school.years = H.FACULTIES[o.fac].grad.years;
    S.edu[o.stage] = { tier: o.tier, track: o.track || null, fac: o.fac || null, name: o.name, done: false };
    spend(o.fee);
    S.yr.special = S.yr.special.filter(x => x.done || !['career', 'work12'].includes(x.type));
    const big = o.tier === 0 || o.stage === 'uni' || o.stage === 'grad';
    log(`🏫 ${o.name}に${o.esc ? '内部進学した' : '入学した'}！${o.fee ? `（学費 年${fmtYen(o.fee)}）` : (H.STAGES[o.stage].fees[o.tier] ? '（成績優秀で授業料免除！）' : '')}`, 'school');
    if (big) hl(`${o.name}に入学した`, o.tier === 0 ? 6 : 4);
    // 入学時のボーナス
    if (o.stage === 'kinder') {
      const fx = [{ intel: 10, sense: 10 }, { stamina: 10, social: 10 }, { stamina: 5, social: 5 }][o.tier];
      const d = applyFx(fx); log(`🌱 ${st.names[o.tier]}で過ごす日々 ${fxText(d)}`, 'school');
    }
    if (['elem', 'middle', 'high', 'uni'].includes(o.stage)) addSpecial({ type: 'club', stage: o.stage });
  }
  function trySchool(o) {
    const sp = S.yr.special.find(x => !x.done && (x.type === 'school' || x.type === 'kinder' || x.type === 'uni' || x.type === 'grad'));
    let got = null;
    if (o.esc) got = o;
    else {
      const all = o.stage === 'uni' || o.stage === 'grad' ? schoolOptions(o.stage, o.fac) : schoolOptions(o.stage);
      const cands = all.filter(x => !x.esc && (x.track || null) === (o.track || null) && x.tier >= o.tier && !x.lock).sort((a, b) => a.tier - b.tier);
      for (const x of cands) { if (R() * 100 < x.rate) { got = x; break; } }
    }
    if (sp) sp.done = true;
    if (got) {
      if (!o.esc && got.tier > o.tier) log(`📮 ${schoolName(o.stage, o.tier, o.track, o.fac)}は不合格…でも、${got.name}に合格した。`, 'school');
      else if (!o.esc && o.stage !== 'kinder') log(`🌸 ${got.name}に合格した！`, 'school');
      enterSchool(got);
      if (sp) sp.result = `${got.name}へ`;
      return { ok: true, name: got.name };
    }
    // 不合格
    const st = H.STAGES[o.stage];
    log(`📮 ${st.n}には通えなかった…。`, 'school', { sad: true });
    if (sp) sp.result = '通えなかった';
    if (o.stage === 'kinder') addSpecial({ type: 'care' });
    else if (o.stage === 'elem') becomeHelper();
    else if (o.stage === 'middle') addSpecial({ type: 'work12' });
    else if (o.stage === 'high') addSpecial({ type: 'career' });
    else if (o.stage === 'uni') addSpecial({ type: 'career', ronin: true });
    else if (o.stage === 'grad') addSpecial({ type: 'career' });
    return { ok: false };
  }
  function skipSchool(stage) {
    const sp = S.yr.special.find(x => !x.done && ['school', 'uni', 'grad'].includes(x.type));
    if (sp) { sp.done = true; sp.result = '進学しない'; }
    log(`🚪 ${H.STAGES[stage].n}には進学しないことにした。`, 'school');
    if (stage === 'middle') addSpecial({ type: 'work12' });
    else addSpecial({ type: 'career' });
  }
  function becomeHelper() {
    const sal = Math.round(parentsAlive().reduce((a, p) => a + p.sal, 0) / 5);
    S.job = { id: 'helper', n: '家業の手伝い', e: '🧺', sal, grow: 'low', st: 'stamina', rank: 0, part: false, years: 0, start: sal };
    log(`🧺 学校には通わず、家族の仕事を手伝うことになった。（月${fmtYen(sal)}）`, 'job');
  }
  function graduate() {
    const sc = S.school;
    const st = H.STAGES[sc.stage];
    S.edu[sc.stage].done = true;
    S.eduFinal = sc.stage === 'kinder' ? S.eduFinal : sc.name + (sc.stage === 'grad' ? ' 修了' : ' 卒業');
    if (sc.stage !== 'kinder') log(`🎓 ${sc.name}を卒業した！`, 'school');
    if (sc.stage === 'high' || sc.stage === 'uni' || sc.stage === 'grad') hl(`${sc.name}を${sc.stage === 'grad' ? '修了' : '卒業'}した`, sc.stage === 'high' ? 3 : 5);
    S.hobbies.forEach(h => { h.club = false; });
    S.noClub = false;
    const stage = sc.stage, fac = sc.fac;
    S.school = null;
    const wasAbroad = !!S.abroad;
    // 次の進路
    let next = null;
    if (stage === 'kinder') next = { type: 'school', stage: 'elem' };
    else if (stage === 'elem') next = { type: 'school', stage: 'middle' };
    else if (stage === 'middle') next = { type: 'school', stage: 'high' };
    else if (stage === 'high') next = { type: 'uni' };
    else if (stage === 'uni') next = H.FACULTIES[fac].grad ? { type: 'grad' } : { type: 'career' };
    else next = { type: 'career' };
    if (wasAbroad) addSpecial({ type: 'abroadEnd', next });
    else if (S.job && ['actor', 'model', 'idol'].includes(S.job.id) && next.type === 'career') { /* 芸能活動を続ける */ }
    else addSpecial(next);
  }

  // =============================================================
  // 仕事
  // =============================================================
  function jobStart(j) {
    let start = j.start, grow = j.grow;
    (j.alt || []).forEach(a => {
      if (a.hs && graduated('high') && S.edu.high.track === a.hs && a.start > start) { start = a.start; grow = a.grow; }
      if (a.fac && graduated('uni') && S.edu.uni.fac === a.fac && a.start > start) { start = a.start; grow = a.grow; }
    });
    return { start, grow };
  }
  function jobLock(j) {
    const r = j.req;
    if (r.scout) return 'スカウトされたときだけ';
    if (S.me.age < 10) return '10歳から';
    if (r.edu === 'high' && !graduated('high')) return '高校卒業が必要';
    if (r.fac && !(graduated('uni') && S.edu.uni.fac === r.fac)) return `${H.FACULTIES[r.fac].n}卒業が必要`;
    if (r.grad && !(graduated('grad') && S.edu.grad.fac === r.grad)) return `大学院（${H.FACULTIES[r.grad].n}）修了が必要`;
    if (r.hob && !r.hob[0].some(h => hp(h) >= r.hob[1])) return `${r.hob[0].map(h => H.HOBBY[h].n).join('・')}が${r.hob[1]}pt必要`;
    if (r.stat && S.stats[r.stat[0]] < r.stat[1]) return `${H.STAT[r.stat[0]].n}${r.stat[1]}以上が必要`;
    return null;
  }
  function hireRate(j) {
    const r = j.req;
    if (!r.edu && !r.fac && !r.grad && !r.stat) return 90;
    return clamp(Math.round(60 + (S.stats[j.st] - 40) * 0.8), 25, 95);
  }
  function jobName(j) { return female() && j.nf ? j.nf : j.n; }
  function jobOptions() {
    return H.JOBS.filter(j => !j.req.scout).map(j => {
      const s = jobStart(j);
      return { id: j.id, n: jobName(j), e: j.e, sal: Math.round(s.start * 10000 * ppp()), grow: s.grow, rate: hireRate(j), lock: jobLock(j), cur: S.job && S.job.id === j.id };
    });
  }
  function setJob(id, opt) {
    opt = opt || {};
    const j = H.JOB[id];
    const s = jobStart(j);
    const code = opt.country || S.me.live;
    const sal = Math.round(s.start * 10000 * ppp(code) * rndf(0.95, 1.08));
    const prev = S.job;
    S.job = { id, n: jobName(j), e: j.e, sal, start: sal, grow: s.grow, st: j.st, rank: 0, part: false, years: 0 };
    S.everJob = true;
    S.retired = false;
    if (opt.country && opt.country !== S.me.live) moveTo(opt.country, '出稼ぎ');
    log(`💼 ${prev && prev.id !== 'helper' ? '転職して' : ''}${j.e} ${S.job.n}として働き始めた！（月${fmtYen(sal)}）`, 'job');
    hl(`${S.job.n}として働き始めた`, ['actor', 'model', 'idol', 'athlete', 'doctor', 'lawyer', 'judge'].includes(id) ? 7 : 4);
    if (!S.indep && S.me.age >= 18 && !isStudent()) becomeIndependent();
  }
  function tryJob(id, opt) {
    if (S.yr.jobTries >= 3) return { ok: false, msg: '今年はもう応募できない（1年に3回まで）' };
    const j = H.JOB[id];
    const lock = jobLock(j);
    if (lock && !(opt && opt.force)) return { ok: false, msg: lock };
    S.yr.jobTries++;
    // 学生が働く場合は退学
    if (isStudent() && !(opt && opt.keepSchool)) dropOut();
    const rate = opt && opt.force ? 100 : hireRate(j);
    if (R() * 100 < rate) {
      setJob(id, opt);
      const sp = S.yr.special.find(x => !x.done && (x.type === 'career' || x.type === 'work12'));
      if (sp) { sp.done = true; sp.result = `${jobName(j)}に就職`; }
      return { ok: true, msg: `${jobName(j)}に採用された！` };
    }
    log(`📨 ${jobName(j)}の採用試験を受けたが、不採用だった…。`, 'job', { sad: true });
    applyFx({ mental: -2 });
    return { ok: false, msg: `${jobName(j)}は不採用だった…` };
  }
  function dropOut() {
    if (!S.school) return;
    const n = S.school.name;
    S.eduFinal = n + ' 中退';
    S.edu[S.school.stage].drop = true;
    log(`🚪 ${n}を退学した。`, 'school', { sad: true });
    S.hobbies.forEach(h => { h.club = false; });
    S.school = null;
    S.abroad = null;
  }
  function quitJob() {
    if (!S.job) return;
    log(`🧳 ${S.job.n}の仕事を辞めた。`, 'job');
    S.job = null;
  }
  function togglePart() {
    if (!S.job) return;
    S.job.part = !S.job.part;
    log(S.job.part ? `⏳ パート勤務に切り替えた。負担もお給料も半分に。` : `⏰ フルタイム勤務に戻した。`, 'job');
  }
  function retire(mode) {
    const sp = S.yr.special.find(x => x.type === 'retire' && !x.done);
    if (sp) { sp.done = true; sp.result = { retire: '引退', part: '短時間で続ける', keep: '働き続ける' }[mode]; }
    if (mode === 'retire') doRetire();
    else if (mode === 'part') { if (S.job) S.job.part = true; log('⏳ 短時間勤務で働き続けることにした。', 'job'); }
    else log('💪 まだまだ現役で働き続けることにした。', 'job');
  }
  function doRetire() {
    if (!S.job) return;
    const rate = { rich: 0.4, upper: 0.35, mid: 0.25, low: 0.1, poor: 0.05 }[live().tier];
    S.pension = Math.round(S.job.sal * rate);
    log(`🌅 ${S.job.n}の仕事を引退した。長い間おつかれさまでした。${S.pension ? `（年金 月${fmtYen(S.pension)}）` : ''}`, 'job');
    hl(`${S.job.n}を引退した`, 3);
    S.job = null; S.retired = true;
    applyFx({ happy: 5, mental: 5 });
  }
  function income() { // 本人の年収
    if (S.job) return Math.round(S.job.sal * 12 * (S.job.part ? 0.5 : 1));
    if (S.retired) return S.pension * 12;
    return 0;
  }
  function yearlyJob() {
    const j = S.job;
    if (!j) return;
    j.years++;
    if (j.id === 'helper') { j.sal = Math.round(parentsAlive().reduce((a, p) => a + p.sal, 0) / 5); return; }
    const stv = S.stats[j.st] || 50;
    const p = clamp((stv - 30) / 120, 0.03, 0.45) * (j.part ? 0.5 : 1);
    const ranks = H.RANKS[j.grow];
    if (j.grow === 'low') {
      j.sal = Math.min(Math.round(j.sal * rndf(1, 1.025)), Math.round(j.start * 1.7));
      if (j.rank < ranks.length - 1 && chance(p * 0.5)) { j.rank++; j.sal = Math.round(j.sal * 1.06); log(`📈 仕事ぶりが認められ、「${ranks[j.rank]}」になった。`, 'job'); }
    } else if (j.grow === 'normal' || j.grow === 'high') {
      const g = j.grow === 'high' ? [1.04, 1.07] : [1.015, 1.035];
      j.sal = Math.round(j.sal * rndf(g[0], g[1]));
      if (j.rank < ranks.length - 1 && j.years >= 2 && chance(p)) {
        j.rank++; j.sal = Math.round(j.sal * (j.grow === 'high' ? 1.15 : 1.12));
        log(`📈 昇進して「${ranks[j.rank]}」になった！（月${fmtYen(j.sal)}）`, 'job');
        if (j.rank >= 3) hl(`${j.n}として「${ranks[j.rank]}」に昇進した`, j.rank >= 4 ? 5 : 3);
        applyFx({ happy: 3 });
      }
    } else { // volatile
      const r = R();
      if (r < 0.06 + p * 0.15) { j.sal = Math.round(j.sal * rndf(2, 3.2)); log(`🌟 大ブレイク！一気に人気者になった！（月${fmtYen(j.sal)}）`, 'job'); hl(`${j.n}として大ブレイクした`, 7); applyFx({ happy: 8 }); }
      else if (r < 0.18) { j.sal = Math.round(j.sal * rndf(0.45, 0.7)); log(`📉 仕事が激減して、スランプに陥った…。（月${fmtYen(j.sal)}）`, 'job', { sad: true }); applyFx({ mental: -5 }); }
      else j.sal = Math.round(j.sal * rndf(0.85, 1.3 + p * 0.3));
      j.sal = Math.max(j.sal, Math.round(j.start * 0.3));
      const ratio = j.sal / j.start;
      j.rank = ratio > 8 ? 4 : ratio > 4 ? 3 : ratio > 2 ? 2 : ratio > 1.2 ? 1 : 0;
    }
    if (!j.part) applyFx({ stamina: -1, mental: -1 }, { raw: true });
    S.peakIncome = Math.max(S.peakIncome, income());
  }

  // =============================================================
  // 移住・留学
  // =============================================================
  function moveTo(code, why) {
    const c = C(code);
    S.me.live = code;
    S.me.city = pick(c.cities);
    log(`✈️ ${why ? why + 'で' : ''}${c.flag} ${c.name}の${S.me.city}で暮らし始めた。`, 'move');
  }
  function abroadRate() {
    const cls = S.me.cls, iq = S.stats.intel, t = S.school ? S.school.tier : 2;
    const top = t === 0, priv90 = t === 1 && iq >= 90;
    if (cls === 5 || (cls === 4 && (top || priv90))) return 100;
    if (cls === 4 || (cls === 3 && (top || priv90))) return 80;
    if ((cls === 3 && iq >= 90) || (cls === 2 && iq >= 100)) return 50;
    if (cls === 3 || (cls === 2 && iq >= 90) || (cls === 1 && iq >= 100)) return 30;
    return 0;
  }
  function abroadChoices() {
    const list = (H.studyAbroad[birth().region] || ['US', 'GB']).filter(c => c !== S.me.country && c !== S.me.live);
    return shuffle(list).slice(0, rnd(2, 3));
  }
  function abroadDecide(mode, code) {
    const sp = S.yr.special.find(x => x.type === 'abroad' && !x.done);
    if (mode === 'no') {
      sp.done = true; sp.result = '留学しない';
      applyFx({ happy: 10 }, { raw: true });
      log('🏠 今年は留学せず、地元で学ぶことにした。☺️+10', 'school');
    } else if (mode === 'try') {
      if (R() * 100 < abroadRate()) { sp.phase = 'pick'; sp.countries = abroadChoices(); }
      else { sp.done = true; sp.result = '選考に通らなかった'; log('📮 留学の選考に通らなかった…。', 'school', { sad: true }); }
    } else if (mode === 'go') {
      sp.done = true; sp.result = `${C(code).flag} ${C(code).name}へ留学`;
      S.abroad = { home: S.me.live, to: code };
      moveTo(code, '留学');
      applyFx({ happy: -10 }, { raw: true });
      hl(`${C(code).flag} ${C(code).name}へ留学した`, 6);
      log('🧳 慣れない土地での生活に、ホームシックになることも。☺️-10', 'school');
    } else if (mode === 'stay') {
      sp.done = true; sp.result = '留学を続ける';
      log('📚 留学を続けることにした。', 'school');
    } else if (mode === 'back') {
      sp.done = true; sp.result = '帰国';
      moveTo(S.abroad.home, '帰国');
      S.abroad = null;
      applyFx({ happy: 10 }, { raw: true });
      log('🏡 ふるさとに帰ってきた。☺️+10', 'school');
    }
  }
  function abroadEnd(mode) {
    const sp = S.yr.special.find(x => x.type === 'abroadEnd' && !x.done);
    sp.done = true;
    if (mode === 'stay') {
      sp.result = '留学先に残る';
      applyFx({ happy: -10 }, { raw: true });
      log(`🌍 卒業後も${live().flag} ${live().name}に残ることにした。☺️-10`, 'move');
      S.abroad = null;
    } else {
      sp.result = '帰国する';
      moveTo(S.abroad.home, '帰国');
      S.abroad = null;
      applyFx({ happy: 10 }, { raw: true });
      log('🏡 卒業してふるさとに帰ってきた。☺️+10', 'move');
    }
    addSpecial(sp.next);
  }

  // =============================================================
  // 自立・お金
  // =============================================================
  function becomeIndependent() {
    if (S.indep) return;
    S.indep = true;
    const gift = Math.max(0, Math.round(S.money.parents * (S.me.cls >= 4 ? 0.1 : 0.03)));
    S.money.parents -= gift;
    S.money.mine += gift;
    S.allowance = 0;
    log(`🗝️ 親元を離れて独り立ちした。${gift > 0 ? `（親から${fmtYen(gift)}の援助）` : ''}`, 'money');
    hl('親元を離れて独り立ちした', 2);
  }
  function setAllowance() {
    if (S.indep || S.job) return;
    const a = S.me.age;
    const tbl = { 1: [0, 0, 0], 2: [300, 1000, 2000], 3: [500, 3000, 5000], 4: [1000, 5000, 10000], 5: [5000, 30000, 100000] }[S.me.cls];
    const idx = a === 6 ? 0 : a === 12 ? 1 : a === 15 ? 2 : -1;
    if (idx < 0) return;
    const v = Math.round(tbl[idx] * ppp());
    if (v > S.allowance) { S.allowance = v; log(`👛 お小遣いが月${fmtYen(v)}になった。`, 'money'); }
  }
  function yearlyMoney() {
    // 親の家計
    const ph = parentsAlive().reduce((a, p) => a + p.sal * 12, 0);
    const pRate = { 1: 0.02, 2: 0.05, 3: 0.12, 4: 0.2, 5: 0.3 }[S.me.cls];
    S.money.parents += Math.round(ph * pRate);
    // 子どもの間の教育費・生活費は親の家計から
    const inc = income();
    if (!S.indep) {
      S.money.mine += S.allowance * 12;
      if (S.job) {
        if (S.job.id === 'helper') S.money.parents += Math.round(inc * 0.5);
        else { S.money.mine += Math.round(inc * 0.3); S.money.parents += Math.round(inc * 0.4); }
      }
    } else {
      const sp = spouse();
      const sinc = sp ? sp.sal * 12 : 0;
      S.money.mine += Math.round((inc + sinc) * 0.15);
      const kidCost = S.fam.kids.filter(k => k.alive && k.age < 22).length * price(200000);
      S.money.mine -= kidCost;
    }
    // 学費
    if (S.school && S.school.fee && S.me.age < S.school.start + S.school.years) { spend(S.school.fee); }
    // 子どもの学費
    S.fam.kids.forEach(k => { if (k.alive && k.school && k.school.fee && k.age < k.school.start + k.school.years) spend(k.school.fee); });
    // ペット
    S.pets.forEach(p => spend(price(H.PETS.find(t => t.id === p.type).cost)));
    // 貯金がマイナスだと幸福が下がる
    if (wallet() < 0) applyFx({ happy: -3, mental: -2 }, { raw: true });
  }

  // =============================================================
  // 恋愛・結婚・子ども
  // =============================================================
  function fm() { return Math.round(live().fm); }
  function loveRate() {
    const a = S.me.age, F = fm();
    let p;
    if (S.love.lastEnd != null && a - S.love.lastEnd <= 10) p = 60;
    else if (a < F / 2) p = 3;
    else if (a < F - 2) p = 5 + (a - F / 2) / ((F - 2) - F / 2) * 45;
    else if (a <= F + 10) p = 50;
    else p = Math.max(5, 50 - 3 * (a - F - 10));
    if (has('family')) p += 10;
    if (has('wolf')) p -= 10;
    p += (S.stats.social - 50) / 10 + (S.stats.looks - 50) / 20;
    return clamp(Math.round(p), 1, 95);
  }
  function marryRate() {
    const a = S.me.age, F = fm();
    let p;
    if (S.love.everMarried && S.love.lastEnd != null && a - S.love.lastEnd <= 10) p = 40;
    else p = Math.max(25, 80 - 3 * Math.abs(a - F));
    // 付き合いが長いほど成功しやすい（交際1年ごとに+5%、最大+20%）
    const lv = lover();
    if (lv) p += Math.min(20, 5 * Math.max(0, a - lv.since));
    if (has('family')) p += 10;
    if (has('wolf')) p -= 10;
    return clamp(Math.round(p), 1, 95);
  }
  function conflictsWith(p) {
    let n = 0;
    H.CONFLICTS.forEach(([x, y]) => { if ((has(x) && p.traits.includes(y)) || (has(y) && p.traits.includes(x))) n++; });
    return n;
  }
  function splitRate(p) {
    let r = 10 + 10 * conflictsWith(p);
    if (has('narc')) r += 10;
    if (has('echo')) r -= 10;
    return clamp(r, 2, 90);
  }
  function makePartner() {
    const a = S.me.age;
    let g = S.me.gender === 'm' ? 'f' : 'm';
    if (S.love.pref === 'same') g = S.me.gender;
    else if (S.love.pref === 'any') g = pick(['m', 'f']);
    const code = chance(0.9) ? S.me.live : pick(C(S.me.live).nb.filter(c => H.countryMap[c]));
    const pa = a < 18 ? clamp(a + rnd(-1, 1), 10, 17) : clamp(a + rnd(-5, 5), 18, 100);
    const pc = C(code);
    let job, sal = 0;
    if (pa < 22 && chance(0.6)) job = pa < 18 ? '学生' : '大学生';
    else if (pa >= 68) job = '年金暮らし';
    else {
      const cls = clamp(S.me.cls + rnd(-1, 1), 1, 4);
      const pj = parentJob(cls, code); job = pj.job; sal = pj.sal;
      if (chance(0.12)) { job = g === 'f' ? '専業主婦' : '専業主夫'; sal = 0; }
    }
    return makePerson({ gender: g, age: pa, country: code, first: newFirst(code, g), last: pick(pc.last), job, sal, status: 'lover', since: a, looks: rnd(30, 95) });
  }
  function findLove() {
    if (S.yr.love) return { ok: false, msg: '今年はもう出会いを探した' };
    S.yr.love = true;
    if (R() * 100 < loveRate()) {
      const p = makePartner();
      S.fam.partner = p;
      log(`💕 ${C(p.country).flag} ${fullName(p)}（${p.age}歳・${p.job}）と恋人になった！`, 'love');
      hl(`${p.first}と恋人になった`, 3);
      applyFx({ happy: 8 });
      return { ok: true, msg: `${p.first}と恋人になった！` };
    }
    log('🍂 出会いを探したけれど、今年は縁がなかった。', 'love');
    return { ok: false, msg: '今年は縁がなかった…' };
  }
  function propose() {
    const p = lover();
    if (!p) return { ok: false };
    if (S.me.age < 18) return { ok: false, msg: '結婚は18歳から' };
    if (S.yr.propose) return { ok: false, msg: '今年はもうプロポーズした' };
    S.yr.propose = true;
    if (R() * 100 < marryRate()) { marry(); return { ok: true, msg: `${p.first}と結婚した！` }; }
    log(`💔 ${p.first}にプロポーズしたが、「まだ考えさせて」と言われた。`, 'love', { sad: true });
    applyFx({ mental: -3 });
    if (chance(0.3)) breakUp(true);
    return { ok: false, msg: 'プロポーズは保留になった…' };
  }
  function marry() {
    const p = lover();
    p.status = 'spouse'; p.marriedAt = S.me.age;
    S.love.everMarried = true;
    log(`💍 ${fullName(p)}と結婚した！`, 'love');
    hl(`${p.first}と結婚した`, 9);
    applyFx({ happy: 15 });
    S.love.wantKids = false;
    if (S.me.age <= 60) addSpecial({ type: 'kids' });
    if (!S.indep && !isStudent()) becomeIndependent();
  }
  function breakUp(byThem) {
    const p = S.fam.partner;
    if (!p) return;
    const wasSpouse = p.status === 'spouse';
    p.status = wasSpouse ? 'ex-spouse' : 'ex';
    p.endAt = S.me.age;
    S.fam.exes.push(p);
    S.fam.partner = null;
    S.love.lastEnd = S.me.age;
    if (wasSpouse) { log(`📄 ${p.first}と離婚した。`, 'love', { sad: true }); hl(`${p.first}と離婚した`, 4); applyFx({ happy: -12, mental: -8 }); }
    else { log(`💔 ${byThem ? p.first + 'に別れを告げられた' : p.first + 'と別れた'}。`, 'love', { sad: true }); applyFx({ happy: -6, mental: -4 }); }
  }
  function yearlyLove() {
    const p = S.fam.partner;
    if (!p) return;
    if (!p.alive) return;
    if (p.status === 'lover') {
      if (chance(splitRate(p) / 100)) { breakUp(true); return; }
    } else if (p.status === 'spouse') {
      // 夫婦の危機（4年に1度くらい）→ そのときの離婚率で判定
      if (S.me.age - (p.marriedAt || 0) >= 2 && chance(0.06) && chance(splitRate(p) / 100)) {
        log(`🌧️ ${p.first}との間ですれ違いが続き…`, 'love', { sad: true });
        breakUp(true); return;
      }
      if (chance(0.25)) log(`🌱 ${p.first}と今年もいろいろあったけれど、なんだかんだ仲良し。`, 'love');
      applyFx({ happy: 1 }, { raw: true });
      // 子ども
      const bearer = S.me.gender === 'f' ? S.me.age : (p.gender === 'f' ? p.age : null);
      if (S.love.wantKids) {
        const kids = S.fam.kids.length;
        // 1年あたり約60%（30歳以下なら3年以内に約9割）。きょうだいの多い国（出身国の平均子ども数が2人超）ほどボーナス
        const tfr = birth().tfr || 2;
        let rate = 0.6 * Math.max(1, 1 + (tfr - 2) * 0.15);
        if (bearer == null) rate = 0;
        else { const b = bearer; rate *= b < 18 ? 0 : b <= 30 ? 1 : b <= 35 ? 0.85 : b <= 40 ? 0.55 : b <= 44 ? 0.2 : 0; }
        const n = kids - Math.max(0, Math.round(tfr) - 2); // 平均が多い国では、その人数までは生まれにくくならない
        rate *= n < 2 ? 1 : n === 2 ? 0.55 : n === 3 ? 0.3 : 0.12;
        if (has('family')) rate *= 1.3;
        if (has('wolf')) rate *= 0.7;
        if (chance(rate)) haveKid(bearer == null);
      }
    }
  }
  // ---------------- 適齢期の自動イベント（出会い・プロポーズ）と子どもの相談
  function loveEvents() {
    const a = S.me.age, F = fm();
    const p = S.fam.partner;
    if (!p || !p.alive) {
      const recent = S.love.lastEnd != null && a - S.love.lastEnd <= 10;
      if (a >= 16 && ((a >= F - 8 && a <= F + 12) || recent) && chance(loveRate() / 100 * 0.6)) {
        addSpecial({ type: 'meet', cand: makePartner() });
      }
      return;
    }
    if (p.status === 'lover' && a >= 18 && p.age >= 18 && a - p.since >= 1 && a >= F - 5 && a <= F + 15 && chance(0.5)) {
      addSpecial({ type: 'proposal', from: chance(0.5) ? 'them' : 'me' });
    }
    if (p.status === 'spouse' && a <= 60 && p.marriedAt != null && a > p.marriedAt && (a - p.marriedAt) % 3 === 0) {
      addSpecial({ type: 'kids' });
    }
  }
  // 10年に1度くらいの、新しい趣味・ペットのお誘い
  function offers() {
    const a = S.me.age;
    if (canFindHobby() && S.hobbies.length < 3 && chance(0.1)) {
      const pool = H.HOBBIES.filter(h => !activeHobby(h.id) && (a >= 12 || h.cat === 'other'));
      if (pool.length) addSpecial({ type: 'hobbyOffer', hobby: pick(pool).id });
    }
    if (a >= 10 && !S.pets.length && chance(0.1)) addSpecial({ type: 'petOffer', pet: pick(H.PETS).id });
  }
  function offerAnswer(type, yes) {
    const sp = S.yr.special.find(x => x.type === type && !x.done);
    if (!sp) return;
    sp.done = true;
    if (type === 'hobbyOffer') {
      const h = H.HOBBY[sp.hobby];
      if (yes) { const r = findHobby(sp.hobby); sp.result = r.ok ? `${h.e}${h.n}を始めた` : '始められなかった'; }
      else { sp.result = '始めない'; log(`🍃 ${h.n}には、今回は手を出さないことにした。`, 'hobby'); }
    } else {
      const t = H.PETS.find(x => x.id === sp.pet);
      if (yes) { const r = adoptPet(sp.pet); sp.result = r.ok ? `${t.e}${t.n}を飼う` : '飼えなかった'; }
      else { sp.result = '飼わない'; log(`🍃 ${t.n}を飼うのは、今回は見送った。`, 'pet'); }
    }
  }
  function meetAnswer(yes) {
    const sp = S.yr.special.find(x => x.type === 'meet' && !x.done);
    if (!sp) return;
    sp.done = true;
    const c = sp.cand;
    if (!yes || S.fam.partner) { sp.result = '付き合わない'; log(`🍃 ${c.first}からの好意に、今回はこたえなかった。`, 'love'); return; }
    sp.result = `${c.first}と付き合う`;
    c.since = S.me.age; c.status = 'lover';
    S.fam.partner = c;
    log(`💕 ${C(c.country).flag} ${fullName(c)}（${c.age}歳・${c.job}）と付き合うことになった！`, 'love');
    hl(`${c.first}と恋人になった`, 3);
    applyFx({ happy: 8 });
  }
  function kidsAnswer(mode) {
    const sp = S.yr.special.find(x => x.type === 'kids' && !x.done);
    if (sp) sp.done = true;
    if (mode === 'want') { S.love.wantKids = true; if (sp) sp.result = 'そろそろ子どもを考える'; log('🍼 パートナーと、そろそろ子どものことを考えようと話し合った。', 'family'); }
    else if (mode === 'later') { S.love.wantKids = false; if (sp) sp.result = 'まだ子どもはいい'; log('☕ 子どものことは、もう少し先に考えることにした。', 'family'); }
    else { if (sp) sp.result = '養子を迎える'; adoptKid(); }
  }
  function adoptKid() {
    // 同じ国、または近隣の（先進国ではない）国の0〜11歳の子
    const nb = (C(S.me.live).nb || []).filter(c => H.countryMap[c] && C(c).tier !== 'rich');
    const code = nb.length && chance(0.4) ? pick(nb) : S.me.live;
    const g = chance(0.5) ? 'm' : 'f';
    const age = rnd(0, 11);
    const p = spouse();
    const last = (S.me.gender === 'm' || !p || p.gender === 'f') ? S.me.last : p.last;
    const job = age < 3 ? '赤ちゃん' : age < 6 ? '幼児' : '小学生';
    const k = makePerson({ rel: g === 'm' ? '息子' : '娘', gender: g, age, country: code, first: newFirst(code, g), last, job, sal: 0, kids: [], traits: age >= 3 ? randomTraits(3) : [], adopted: true });
    k.intel = rnd(20, 90);
    const stg = age >= 12 ? 'middle' : age >= 6 ? 'elem' : null;
    if (stg) { const st = H.STAGES[stg]; k.school = { stage: stg, tier: 2, name: st.names[2], start: st.start, years: st.years, fee: price(st.fees[2]) }; k.job = KID_STAGE_JOB[stg]; }
    S.fam.kids.push(k);
    log(`🤝 ${C(code).flag} ${C(code).name}生まれの${age}歳の${g === 'm' ? '男の子' : '女の子'}、${k.first}を養子として家族に迎えた！`, 'family');
    hl(`養子の${k.first}を家族に迎えた`, 8);
    applyFx({ happy: 10 });
  }
  // 人生の選択タブから養子を迎える（18歳以上・学生ではなく仕事についている）
  function canAdopt() { return S.me.age >= 18 && !isStudent() && !!S.job; }
  function adoptManual() {
    if (!canAdopt()) return { ok: false, msg: '18歳以上で、仕事についているときに迎えられます' };
    if (S.yr.adopt) return { ok: false, msg: '今年はもう養子を迎えた' };
    S.yr.adopt = true;
    adoptKid();
    const k = S.fam.kids[S.fam.kids.length - 1];
    return { ok: true, msg: `${k.first}が家族になった！` };
  }
  function haveKid(adopt) {
    const g = chance(0.512) ? 'm' : 'f';
    const p = spouse();
    const code = S.me.live;
    const last = (S.me.gender === 'm' || !p || p.gender === 'f') ? S.me.last : p.last;
    const k = makePerson({ rel: g === 'm' ? '息子' : '娘', gender: g, age: 0, country: code, first: newFirst(code, g), last, job: '赤ちゃん', sal: 0, kids: [], traits: [] });
    k.intel = rnd(20, 90);
    S.fam.kids.push(k);
    log(adopt ? `👶 養子として${k.first}を家族に迎えた！` : `👶 ${g === 'm' ? '男の子' : '女の子'}の${k.first}が生まれた！`, 'family');
    hl(`${g === 'm' ? '息子' : '娘'}の${k.first}が生まれた`, 8);
    applyFx({ happy: 10 });
  }
  function yearlyKids() {
    S.fam.kids.forEach(k => {
      if (!k.alive) return;
      k.age++;
      if (chance(qx(k.age - 1, S.me.live) * 0.8)) { k.alive = false; k.deathAge = k.age; log(`🕯️ ${k.rel}の${k.first}が${k.age}歳で旅立った…。`, 'family', { sad: true }); hl(`${k.rel}の${k.first}を亡くした`, 6); applyFx({ happy: -25, mental: -15 }); return; }
      if (k.age === 3 && !(k.traits || []).length) k.traits = randomTraits(3);
      if (k.age === 3 && !k.school && !k.sal) k.job = '幼児';
      kidMilestone(k);
      if (k.sal && k.age > 18 && k.age < 65) k.sal = Math.round(k.sal * rndf(1.01, 1.04));
      if (k.age === 65 && k.sal) { k.job = '年金暮らし'; k.sal = 0; }
      // 子どもの結婚
      const F = fm();
      if (!k.spouse && k.age >= 20 && chance(k.age < F - 3 ? 0.04 : k.age < F + 8 ? 0.16 : 0.04)) {
        const g2 = k.gender === 'm' ? 'f' : 'm';
        k.spouse = newFirst(S.me.live, g2);
        log(`💒 ${k.first}が${k.spouse}と結婚した！`, 'family');
        hl(`${k.rel}の${k.first}が結婚した`, 4);
        applyFx({ happy: 5 });
      }
      // 孫
      if (k.spouse && k.age >= 20 && k.age <= 42 && (k.kids || []).length < 3 && chance(0.16)) {
        const g3 = chance(0.512) ? 'm' : 'f';
        const gk = { id: 'g' + Math.random().toString(36).slice(2, 8), first: newFirst(S.me.live, g3), gender: g3, age: 0, born: S.me.age, alive: true, parent: k.first };
        k.kids = k.kids || []; k.kids.push(gk);
        log(`🍼 ${k.first}に子ども（孫）の${gk.first}が生まれた！`, 'family');
        hl(`孫の${gk.first}が生まれた`, 6);
        applyFx({ happy: 8 });
      }
      (k.kids || []).forEach(gk => { if (gk.alive) gk.age++; });
    });
  }
  // ---------------- 子どもの進学・就職（親として選ぶ）
  const KID_STAGE_JOB = { elem: '小学生', middle: '中学生', high: '高校生', uni: '大学生' };
  const NEXT_STAGE = { elem: 'middle', middle: 'high' };
  function kidIntel(k) { if (k.intel == null) k.intel = rnd(20, 90); return k.intel; }
  function kidById(id) { return S.fam.kids.find(k => k.id === id); }
  function kidMilestone(k) {
    if (k.school && k.age >= k.school.start + k.school.years) {
      const sc = k.school;
      k.edu = sc.name + (sc.stage === 'grad' ? ' 修了' : ' 卒業');
      k.grad = k.grad || {};
      k.grad[sc.stage] = true;
      if (sc.fac) k.fac = sc.fac;
      k.school = null;
      if (sc.stage === 'uni') {
        log(`🎓 ${k.first}が${sc.name}を卒業した！`, 'family'); hl(`${k.first}が大学を卒業した`, 3);
        if (H.FACULTIES[sc.fac] && H.FACULTIES[sc.fac].grad) addSpecial({ type: 'kidPath', kid: k.id, grad: true });
        else addSpecial({ type: 'kidJob', kid: k.id });
      }
      else if (sc.stage === 'grad') { log(`🎓 ${k.first}が${sc.name}を修了した！`, 'family'); hl(`${k.first}が大学院を修了した`, 3); addSpecial({ type: 'kidJob', kid: k.id }); }
      else if (sc.stage === 'high') addSpecial({ type: 'kidPath', kid: k.id });
      else addSpecial({ type: 'kidSchool', kid: k.id, stage: NEXT_STAGE[sc.stage] });
      return;
    }
    if (k.age === 6 && !k.school && !k.edu) addSpecial({ type: 'kidSchool', kid: k.id, stage: 'elem' });
    if (k.age === 15 && !k.school && !k.sal && !k.workChosen) addSpecial({ type: 'kidJob', kid: k.id });
  }
  function kidSchoolOptions(k, stage) {
    const st = H.STAGES[stage];
    return [0, 1, 2].map(tier => {
      let r = H.SCHOOL_RATE[st.rate][S.me.cls][tier] + intelBonus(kidIntel(k), stage);
      r = clamp(Math.round(r * countryEdu(stage)), 0, 100);
      const f = price(st.fees[tier]);
      return { tier, name: st.names[tier], rate: r, fee: f, lock: !canPay(f) };
    });
  }
  function kidTrySchool(id, stage, tier) {
    const k = kidById(id);
    const sp = S.yr.special.find(x => x.kid === id && !x.done && (x.type === 'kidSchool' || x.type === 'kidPath'));
    if (sp) sp.done = true;
    const opts = kidSchoolOptions(k, stage).filter(o => o.tier >= tier && !o.lock);
    const got = opts.find(o => R() * 100 < o.rate);
    if (got) {
      const st = H.STAGES[stage];
      k.school = { stage, tier: got.tier, name: got.name, start: k.age, years: st.years, fee: got.fee };
      if (stage === 'grad') {
        k.school.fac = k.fac; k.school.years = H.FACULTIES[k.fac].grad.years; k.school.name += ' ' + H.FACULTIES[k.fac].n;
      }
      if (stage === 'uni') {
        const fac = pick(['lit', 'econ', 'law', 'intl', 'edu', 'med', 'pharm', 'eng', 'agri']);
        k.school.fac = fac; k.school.years = H.FACULTIES[fac].years; k.school.name += ' ' + H.FACULTIES[fac].n;
      }
      k.job = KID_STAGE_JOB[stage];
      spend(got.fee);
      if (sp) sp.result = `${got.name}へ`;
      log(`🏫 ${k.first}が${got.name}に入学した！`, 'family');
      if (stage === 'uni') hl(`${k.first}が${got.name}に入学した`, 3);
      return { ok: true, msg: `${k.first}は${got.name}へ！` };
    }
    if (sp) sp.result = '通えなかった';
    log(`📮 ${k.first}は${H.STAGES[stage].n}に通えなかった…。`, 'family', { sad: true });
    kidNoSchool(k, stage);
    return { ok: false, msg: `${k.first}は${H.STAGES[stage].n}に通えなかった…` };
  }
  function kidNoSchool(k, stage) {
    if (k.age >= 15 || stage === 'high' || stage === 'uni' || stage === 'grad') addSpecial({ type: 'kidJob', kid: k.id });
    else { k.job = '家の手伝い'; k.edu = k.edu || 'なし'; }
  }
  function kidSkip(id) {
    const k = kidById(id);
    const sp = S.yr.special.find(x => x.kid === id && !x.done && (x.type === 'kidSchool' || x.type === 'kidPath'));
    const toGrad = sp && sp.grad;
    if (sp) { sp.done = true; sp.result = toGrad ? '大学院に行かずに働く' : '進学しない'; }
    log(`🚪 ${k.first}は${toGrad ? '大学院には進まずに' : '進学せずに'}働くことになった。`, 'family');
    kidNoSchool(k, 'uni');
  }
  function kidJobOffers(sp) {
    if (sp.offers) return sp.offers;
    const k = kidById(sp.kid);
    const g = k.grad || {};
    const ok = j => {
      const r = j.req;
      if (r.scout || r.hob || r.stat) return false;
      if (r.grad && !(g.grad && k.fac === r.grad)) return false;
      if (r.edu === 'high' && !g.high) return false;
      if (r.fac && !(g.uni && k.fac === r.fac)) return false;
      return true;
    };
    const elig = H.JOBS.filter(ok);
    // 大学卒なら学部の仕事、高卒なら高卒の仕事を優先
    const best = shuffle(elig.filter(j => (g.grad && j.req.grad) || (!g.grad && g.uni && j.req.fac) || (!g.uni && g.high && j.req.edu)));
    const left = shuffle(elig.filter(j => !best.includes(j)));
    const rest = left.filter(j => g.uni && j.req.fac === k.fac).concat(left.filter(j => !(g.uni && j.req.fac === k.fac)));
    const out = best.concat(rest).slice(0, 3).map(j => {
      let start = j.start;
      (j.alt || []).forEach(a => { if (a.fac && g.uni && k.fac === a.fac && a.start > start) start = a.start; });
      return { job: k.gender === 'f' && j.nf ? j.nf : j.n, sal: Math.round(start * 10000 * ppp() * rndf(0.95, 1.08)) };
    });
    sp.offers = out;
    return out;
  }
  function kidPickJob(id, idx) {
    const k = kidById(id);
    const sp = S.yr.special.find(x => x.kid === id && !x.done && x.type === 'kidJob');
    const offers = kidJobOffers(sp);
    const o = idx === 'self' ? pick(offers) : offers[idx];
    sp.done = true; sp.result = idx === 'self' ? `本人が${o.job}を選んだ` : o.job;
    k.job = o.job; k.sal = o.sal; k.workChosen = true;
    log(idx === 'self' ? `💼 ${k.first}は自分で考えて、${o.job}として働き始めた。` : `💼 ${k.first}が${o.job}として働き始めた。`, 'family');
    hl(`${k.first}が${o.job}になった`, 2);
  }
  function grandkids() { const out = []; S.fam.kids.forEach(k => (k.kids || []).forEach(g => out.push(g))); return out; }

  // =============================================================
  // ペット・家
  // =============================================================
  function adoptPet(type) {
    if (S.pets.length >= 3) return { ok: false, msg: 'ペットは3匹まで' };
    if (S.yr.pet) return { ok: false, msg: '今年はもうペットを迎えた' };
    const t = H.PETS.find(p => p.id === type);
    const name = pick(H.PET_NAMES.filter(n => !S.pets.some(p => p.name === n)));
    S.pets.push({ type, name, age: 0, life: rnd(t.life[0], t.life[1]), since: S.me.age });
    S.yr.pet = true;
    log(`🐾 ${t.e} ${t.n}の「${name}」を家族に迎えた！（年${fmtYen(price(t.cost))}）`, 'pet');
    hl(`${t.e}${name}を家族に迎えた`, 3);
    applyFx({ happy: 6 });
    addTraitPt('animal', 2);
    return { ok: true, msg: `${t.e}${name}がやってきた！` };
  }
  function yearlyPets() {
    S.pets = S.pets.filter(p => {
      p.age++;
      if (p.age >= p.life) {
        const t = H.PETS.find(x => x.id === p.type);
        log(`🌈 ${t.e}${p.name}が虹の橋を渡った。${p.age}年間、ありがとう。`, 'pet', { sad: true });
        hl(`${t.e}${p.name}とお別れした`, 3);
        applyFx({ happy: -8, mental: -4 });
        S.petsGone.push(p);
        return false;
      }
      return true;
    });
    if (S.pets.length) applyFx({ happy: 1, mental: 1 }, { raw: true });
  }
  function buyHouse(i) {
    if (S.yr.house) return { ok: false, msg: '今年はもう家を建てた' };
    const h = H.HOUSES[i];
    const cost = price(h.cost);
    if (!canPay(cost)) return { ok: false, msg: 'お金が足りない' };
    spend(cost);
    S.house = i;
    S.yr.house = true;
    log(`🏡 ${h.e} ${h.n}のマイホームを建てた！（${fmtYen(cost)}）`, 'money');
    hl(`${h.n}のマイホームを建てた`, 5);
    applyFx({ happy: h.happy });
    return { ok: true, msg: `${h.n}が完成した！` };
  }

  // =============================================================
  // 趣味・クラブ
  // =============================================================
  function clubWord(stage) { return stage === 'elem' ? 'クラブ' : stage === 'uni' ? 'サークル' : '部活'; }
  function joinClub(id) {
    const sp = S.yr.special.find(x => x.type === 'club' && !x.done);
    if (sp) sp.done = true;
    const w = clubWord(S.school ? S.school.stage : 'elem');
    if (id === 'none') {
      S.noClub = true;
      if (sp) sp.result = `${w}に入らない`;
      log(`🏠 ${w}には入らず、${S.school && S.school.stage === 'uni' ? '自由に過ごす' : '帰宅部'}ことにした。`, 'hobby');
      return { ok: true };
    }
    const cur = club();
    if (cur) return { ok: false, msg: `今の${w}をやめてから` };
    const ex = activeHobby(id);
    if (!ex && S.hobbies.length >= 3) return { ok: false, msg: '趣味は3つまで（どれかをやめてから）' };
    if (ex) ex.club = true; else S.hobbies.push({ id, club: true, since: S.me.age });
    S.noClub = false;
    S.clubYears = 0; S.clubLead = false;
    const h = H.HOBBY[id];
    if (sp) sp.result = `${h.e}${h.n}${w}`;
    log(`${h.e} ${h.n}${w}に入った！`, 'hobby');
    return { ok: true, msg: `${h.n}${w}に入った！` };
  }
  function quitClub() {
    const c = club();
    if (!c) return;
    S.hobbies = S.hobbies.filter(h => h !== c);
    log(`🚪 ${H.HOBBY[c.id].n}${clubWord(S.school ? S.school.stage : 'elem')}をやめた。`, 'hobby');
    S.noClub = true;
  }
  function canFindHobby() {
    const a = S.me.age;
    if (a >= 12) return true;
    return a >= 6 && isStudent() && S.noClub;
  }
  function findHobby(id) {
    if (S.hobbies.length >= 3) return { ok: false, msg: '趣味は3つまで' };
    const h = H.HOBBY[id];
    if (S.me.age < 12 && h.cat !== 'other') return { ok: false, msg: '12歳から' };
    S.hobbies.push({ id, club: false, since: S.me.age });
    log(`🎨 新しい趣味「${h.e} ${h.n}」を見つけた！`, 'hobby');
    return { ok: true, msg: `${h.n}を始めた！` };
  }
  function dropHobby(id) {
    const h = activeHobby(id);
    if (!h) return;
    S.hobbies = S.hobbies.filter(x => x !== h);
    log(`🍃 ${H.HOBBY[id].n}をお休みすることにした。`, 'hobby');
  }
  function enjoyHobby(id) {
    const c = S.yr.hobby;
    if (!c || c.done) return;
    c.done = true;
    if (id === 'none') { c.result = 'どれも楽しまない'; log('☁️ 今年は趣味をお休みした。', 'hobby'); return; }
    const h = H.HOBBY[id];
    const before = hobbyLevel(hp(id)).lv;
    S.hp[id] = hp(id) + 1;
    const after = hobbyLevel(hp(id)).lv;
    const d = applyFx(h.fx);
    c.result = `${h.e}${h.n}`;
    log(`${h.e} ${h.n}を楽しんだ ${fxText(d)}${after > before ? `　✨スキルがLv.${after}になった！` : ''}`, 'hobby');
    if (after > before && after >= 3) hl(`${h.n}のスキルがLv.${after}になった`, after >= 4 ? 3 : 2);
  }
  function clubYearly() {
    if (!S.school) return;
    if (S.noClub) { const d = applyFx(H.NOCLUB.fx); log(`🏠 帰宅部でのんびり過ごした ${fxText(d)}`, 'hobby'); return; }
    const c = club();
    if (!c) return;
    const h = H.HOBBY[c.id];
    const cfg = H.CLUB_CAT[h.cat];
    if (!cfg) return;
    S.clubYears = (S.clubYears || 0) + 1;
    const stv = S.stats[cfg.stat];
    const w = clubWord(S.school.stage);
    if (!S.clubLead && S.clubYears >= 2 && stv >= 55 && chance((stv - 45) / 80)) {
      S.clubLead = true;
      const role = pick(cfg.lead);
      log(`🎖️ ${h.n}${w}の${role}に選ばれた！`, 'hobby');
      hl(`${h.n}${w}の${role}に選ばれた`, 4);
      applyFx({ happy: 4, social: 3 });
    }
    if (S.clubYears < 1) return;
    const score = stv * 0.6 + hp(c.id) * 4 + rnd(0, 30) + (S.clubLead ? 8 : 0);
    const meet = cfg.meet;
    let t, w8 = 0;
    if (score >= 100) { t = `🏆 ${h.n}の全国${meet}で${cfg.win}に輝いた！`; w8 = 8; applyFx({ happy: 10 }); }
    else if (score >= 88) { t = `🥈 ${h.n}の全国${meet}に出場した！`; w8 = 5; applyFx({ happy: 6 }); }
    else if (score >= 72) { t = `🥉 ${h.n}の地方${meet}で入賞した！`; w8 = 2; applyFx({ happy: 4 }); }
    else if (score >= 55) t = `📣 ${h.n}の地区${meet}を勝ち抜いた。`;
    else t = `💧 ${h.n}の${meet}は初戦で敗れてしまった。悔し涙。`;
    log(t, 'hobby');
    if (w8) hl(t.replace(/^\S+\s/, ''), w8);
  }

  // =============================================================
  // 病気・死亡
  // =============================================================
  // 年齢 x の1年間の死亡率（国の平均寿命・乳児死亡率から作るモデル）
  function qx(x, code) {
    const c = C(code);
    const b = 0.09, M = c.life + 1;
    const a = b * Math.log(2) * Math.exp(-b * M);
    let q = 1 - Math.exp(-a * Math.exp(b * x));
    // 0〜4歳は「健康なら×0.8」の割引がかかっても国の実際の値に近づくよう、少し上乗せ（×1.2）
    if (x === 0) q += c.q0 * 1.2;
    else if (x <= 4) {
      // 1〜4歳：その国の5歳未満死亡率から乳児の分を引き、幼いほど重く配分（1歳40%・2歳25%・3歳20%・4歳15%）
      const child = Math.max(0, (c.u5 - c.q0) / (1 - c.q0));
      q += child * [0, 0.4, 0.25, 0.2, 0.15][x] * 1.2;
    }
    else if (x <= 14) q += c.q0 / 25;
    if (x >= 15 && x <= 45) q += 0.0004 + Math.max(0, 80 - c.life) * 0.00008;
    return clamp(q, 0, 0.95);
  }
  function deathRate() {
    const a = S.me.age - 1;
    let q = qx(a, S.me.live);
    const L = live().life;
    const h = S.stats.health;
    if (a >= L - 15) q *= 1 + Math.max(0, 60 - h) / 40 * Math.min(1, (a - (L - 15)) / 15);
    if (!S.sick) q *= 1 - Math.max(0, 20 - 2 * S.neglect) / 100;
    else {
      const sv = S.sick.sev;
      if (sv === 1) q *= 1.3;
      if (sv === 2) { q *= 2; if (!S.sick.treated) q += 0.01; }
      if (sv === 3) { q *= 3; q += S.sick.treated ? 0.04 : 0.12; }
      if (S.sick.mental && !S.sick.treated) q += 0.01;
    }
    return clamp(q, 0, 0.95);
  }
  function sicknessRoll() {
    if (S.sick) return;
    // 病気になる確率 =（100 − 基本値）× 0.35 × 年齢の補正　基本値 =（健康×2＋体力）÷2.5（5〜95）
    const a = S.me.age;
    const base = clamp((S.stats.health * 2 + S.stats.stamina) / 2.5, 5, 95);
    const ageMul = a <= 5 ? 1.3 : a <= 49 ? 1 : a <= 64 ? 1.3 : a <= 74 ? 1.6 : 2;
    const sickRate = (100 - base) * 0.35 * ageMul / 100;
    let mentalRisk = a >= 13 && S.stats.mental < 25 ? 0.25 * 0.35 : 0;
    if (!chance(sickRate) && !chance(mentalRisk)) return;
    const reg = live().region;
    const ws = a < 30 ? [0.86, 0.12, 0.02] : a < 60 ? [0.65, 0.27, 0.08] : [0.45, 0.33, 0.22];
    let sev = 1 + wpickIndex(ws);
    let pool = H.DISEASES.filter(d => d.sev === sev && a >= d.min && (d.max == null || a <= d.max) && (!d.region || d.region.includes(reg)));
    if (mentalRisk && S.stats.mental < 25 && chance(0.5)) pool = H.DISEASES.filter(d => d.mental);
    if (!pool.length) pool = H.DISEASES.filter(d => d.sev === 1 && a >= d.min && (d.max == null || a <= d.max));
    const d = pick(pool);
    S.sick = { n: d.n, sev: d.sev, cost: price(d.cost), treated: false, years: 0, mental: !!d.mental };
    log(`🤒 ${d.n}にかかってしまった。`, 'sick', { sad: true });
    applyFx({ health: -[0, 2, 5, 10][d.sev] }, { raw: true });
    addSpecial({ type: 'sick' });
  }
  function treat(mode) {
    const sp = S.yr.special.find(x => x.type === 'sick' && !x.done);
    if (!sp || !S.sick) return;
    sp.done = true;
    const s = S.sick;
    if (mode === 'treat') {
      spend(s.cost);
      s.treated = true;
      const cure = [0, 1, 0.85, 0.5][s.sev] * live().care;
      if (chance(cure)) {
        log(`💊 ${s.n}の治療を受けて、すっかり良くなった。（${fmtYen(s.cost)}）`, 'sick');
        sp.result = '治療して回復';
        if (s.sev >= 3) hl(`${s.n}を乗り越えた`, 6);
        S.sick = null;
        applyFx({ health: [0, 2, 4, 6][s.sev] }, { raw: true });
      } else {
        log(`💊 ${s.n}の治療を受けた。まだ完治はしていない…。（${fmtYen(s.cost)}）`, 'sick');
        sp.result = '治療中';
      }
    } else {
      s.treated = false;
      sp.result = '様子を見る';
      log(`🛏️ ${s.n}だけど、病院には行かず様子を見ることにした。`, 'sick');
    }
  }
  function sicknessYearly() {
    const s = S.sick;
    if (!s) return;
    s.years++;
    if (!s.treated) {
      S.neglect++;
      applyFx({ health: -[0, 3, 6, 12][s.sev], stamina: -[0, 1, 3, 5][s.sev] }, { raw: true });
      if (chance([0, 0.75, 0.3, 0.05][s.sev])) { log(`🌤️ いつのまにか${s.n}が治っていた。`, 'sick'); S.sick = null; return; }
    } else {
      if (chance([0, 1, 0.6, 0.3][s.sev] * live().care)) { log(`🌤️ ${s.n}がようやく治った。`, 'sick'); if (s.sev >= 3) hl(`${s.n}を乗り越えた`, 6); S.sick = null; return; }
    }
    s.treated = false;
    addSpecial({ type: 'sick' });
  }
  function causeOfDeath() {
    if (S.sick && S.sick.sev >= 2 && chance(0.8)) return S.sick.n;
    const a = S.me.age;
    if (a <= 1) return pick(['新生児期の病気', '肺炎', '下痢性疾患', '先天性の病気']);
    if (a <= 14) return wpick([['不慮の事故', 4], ['肺炎', 3], ['感染症', 3], ['先天性の病気', 2], ['がん', 1]], x => x[1])[0];
    const list = H.CAUSES[live().cause];
    return wpick(list, x => x[2] === 'old' ? (a >= 75 ? x[1] * 1.5 : 0) : x[2] === 'young' ? (a < 45 ? x[1] * 5 : x[1]) : (a < 45 ? x[1] * 0.4 : x[1]))[0];
  }
  function die(cause) {
    S.over = true;
    S.cause = cause;
    S.deathAge = S.me.age;
    log(`🕯️ ${S.me.age}歳、${cause}により、その生涯を閉じた。`, 'death');
  }

  // =============================================================
  // 家族の一年
  // =============================================================
  function yearlyFamily() {
    [S.fam.dad, S.fam.mom].forEach(p => {
      if (!p || !p.alive) return;
      p.age++;
      if (p.age === 65 && p.sal) { p.job = '年金暮らし'; p.sal = Math.round(p.sal * 0.3); }
      if (chance(qx(p.age - 1, p.country) * 0.85)) {
        p.alive = false; p.deathAge = p.age;
        const w = has('family') ? -20 : -14;
        log(`🕯️ ${p.rel === '父' ? '父' : '母'}の${p.first}が${p.age}歳で亡くなった。`, 'family', { sad: true });
        hl(`${p.rel}の${p.first}を見送った`, 5);
        applyFx({ happy: w, mental: -8 });
        if (!parentsAlive().length && S.money.parents > 0) {
          const inh = S.money.parents;
          if (S.indep) { S.money.mine += inh; S.money.parents = 0; log(`📜 両親が遺した${fmtYen(inh)}を相続した。`, 'money'); }
        }
      }
    });
    const p = S.fam.partner;
    if (p && p.alive) {
      p.age++;
      if (p.sal && p.age >= 65 && p.job !== '年金暮らし') { p.job = '年金暮らし'; p.sal = Math.round(p.sal * 0.3); }
      else if (p.sal) p.sal = Math.round(p.sal * rndf(1, 1.03));
      if (p.job === '大学生' && p.age >= 22) { const pj = parentJob(clamp(S.me.cls, 1, 4), p.country); p.job = pj.job; p.sal = pj.sal; }
      if (p.job === '学生' && p.age >= 18) p.job = '大学生';
      if (chance(qx(p.age - 1, S.me.live))) {
        p.alive = false; p.deathAge = p.age;
        const wasSpouse = p.status === 'spouse';
        log(`🕯️ ${wasSpouse ? '配偶者' : '恋人'}の${p.first}が${p.age}歳で旅立った…。`, 'family', { sad: true });
        hl(`${wasSpouse ? '最愛の' : ''}${p.first}を見送った`, 7);
        applyFx({ happy: -22, mental: -12 });
        p.status = wasSpouse ? 'late-spouse' : 'late';
        S.fam.exes.push(p);
        S.fam.partner = null;
        S.love.lastEnd = S.me.age;
      }
    }
    S.fam.exes.forEach(x => { if (x.alive) x.age++; });
    yearlyKids();
  }

  // =============================================================
  // 自然な成長・老い
  // =============================================================
  function naturalGrowth() {
    const a = S.me.age;
    const fx = {};
    if (a <= 18) {
      fx.stamina = rnd(1, 2); fx.intel = rnd(0, 1) + (isStudent() || inStage('kinder') ? 1 : 0); fx.social = rnd(0, 1) + (S.school ? 1 : 0); fx.sense = rnd(0, 1);
    }
    if (a >= 45) fx.stamina = (fx.stamina || 0) - 1;
    if (a >= 55) { fx.health = -1; fx.stamina = (fx.stamina || 0) - 1; }
    if (a >= 65) { fx.health = -2; fx.looks = -1; }
    if (a >= 75) { fx.health = -3; fx.stamina = (fx.stamina || 0) - 1; }
    if (a >= 85) fx.health = -4;
    if (S.house != null) fx.happy = (fx.happy || 0) + 1;
    if (!S.job && !isStudent() && !S.retired && a >= 18 && a < 65 && !spouse() && !S.fam.kids.length) fx.happy = (fx.happy || 0) - 2;
    applyFx(fx, { raw: true });
    // メンタルの低い状態が続くと
    if (S.stats.mental <= 20) S.lowMental++; else S.lowMental = 0;
    if (a >= 12 && S.lowMental >= 3) {
      const id = pick(['odd', 'wolf', 'intro'].filter(canGetTrait));
      if (id) { addTraitPt(id, 2); log('🌫️ 心が疲れた日々が続き、性格にも影が差してきた…。', 'trait', { sad: true }); }
    }
    if (a >= 12) {
      if (S.stats.social >= 70) { const id = pick(['extro', 'talk'].filter(canGetTrait)); if (id) addTraitPt(id, 1); }
      if (S.stats.social <= 15) { if (canGetTrait('intro')) addTraitPt('intro', 1); }
    }
    if (S.stats.happy <= 20 && a >= 10) log('🌧️ 最近、心がとても疲れている…。好きなことをしたり、誰かに話したりして休みたい。', 'warn', { sad: true });
  }

  // =============================================================
  // スカウト
  // =============================================================
  function scoutRoll() {
    const a = S.me.age;
    if (a < 12 || a > 45 || S.stats.looks < 80) return;
    if (S.job && ['actor', 'model', 'idol'].includes(S.job.id)) return;
    const roles = [];
    roles.push('model');
    if (hp('drama') >= 5) roles.push('actor');
    if (hp('chorus') >= 5) roles.push('idol');
    shuffle(roles).some(r => { if (chance(0.1)) { addSpecial({ type: 'scout', job: r }); return true; } return false; });
  }
  function scout(accept) {
    const sp = S.yr.special.find(x => x.type === 'scout' && !x.done);
    if (!sp) return;
    sp.done = true;
    const j = H.JOB[sp.job];
    if (accept) {
      sp.result = `${jobName(j)}になる`;
      const keep = isStudent();
      S.yr.jobTries = 0;
      setJob(sp.job);
      if (keep) log('📚 学業と両立しながら、芸能活動を始めた。', 'job');
      log(`🌟 スカウトがきっかけで、${jobName(j)}としてデビューした！`, 'job');
    } else {
      sp.result = '断った';
      log(`🙅 ${jobName(j)}のスカウトを丁寧にお断りした。`, 'job');
    }
  }

  // =============================================================
  // 1年ごとの選択肢
  // =============================================================
  function addSpecial(o) { o.done = false; S.yr.special.push(o); }
  function newYear() {
    initYear();
    finishYear();
  }
  function initYear() {
    S.yr = { age: S.me.age, jobTries: 0, love: false, pet: false, house: false, propose: false, act: null, trait: null, hobby: null, special: [] };
  }
  function finishYear() {
    S.yr.act = { opts: actionOptions(), done: false };
    S.yr.trait = { opts: traitOptions(), done: false };
    S.yr.hobby = S.hobbies.length ? { done: false } : null;
  }
  function pendingSpecial() {
    // 保存データの年が変わっていれば
    return S.yr.special.filter(x => !x.done);
  }
  function canAdvance() {
    if (S.over) return false;
    return S.yr.act.done && S.yr.trait.done && (!S.yr.hobby || S.yr.hobby.done) && !pendingSpecial().length;
  }
  function doAction(k) {
    const c = S.yr.act;
    if (c.done) return;
    const o = c.opts[k];
    if (!o) { c.done = true; c.result = 'のんびり過ごした'; return { ok: true }; }
    const x = H.ACTIONS[o.i];
    if (!canPay(o.cost)) return { ok: false, msg: 'お金が足りない' };
    spend(o.cost);
    const d = applyFx(x.fx);
    if (x.pet) addTraitPt('animal', 1);
    c.done = true; c.result = `${x.e}${x.n}`;
    log(`${x.e} ${x.n} ${fxText(d)}${o.cost ? `（${fmtYen(o.cost)}）` : ''}`, 'act');
    return { ok: true };
  }
  function chooseTrait(k) {
    const c = S.yr.trait;
    if (c.done) return;
    const o = c.opts[k];
    const t = H.TRAIT[o.id];
    c.done = true; c.result = o.text;
    const had = has(o.id);
    log(`🧩 ${o.text}`, 'trait');
    addTraitPt(o.id, 1);
    if (had) {
      const st = Object.keys(t.mult || {})[0];
      if (st) { const d = applyFx({ [st]: 2 }, { raw: true }); if (Object.keys(d).length) log(`　「${t.name}」らしさが深まった ${fxText(d)}`, 'trait'); }
    }
  }
  // おまかせ（残りの選択をランダムに）
  function autoPick() {
    if (!S.yr.act.done) { const ok = S.yr.act.opts.map((o, i) => i).filter(i => canPay(S.yr.act.opts[i].cost)); doAction(ok.length ? pick(ok) : 0); if (!S.yr.act.done) { S.yr.act.done = true; S.yr.act.result = '何もしなかった'; } }
    if (!S.yr.trait.done) chooseTrait(rnd(0, S.yr.trait.opts.length - 1));
    if (S.yr.hobby && !S.yr.hobby.done) enjoyHobby(pick(S.hobbies.map(h => h.id).concat(['none'])));
    let guard = 0;
    while (pendingSpecial().length && guard++ < 10) autoSpecial(pendingSpecial()[0]);
  }
  function autoSpecial(sp) {
    switch (sp.type) {
      case 'kinder': case 'school': case 'grad': {
        const opts = schoolOptions(sp.type === 'kinder' ? 'kinder' : sp.type === 'grad' ? 'grad' : sp.stage, sp.type === 'grad' ? S.edu.uni.fac : undefined).filter(o => !o.lock);
        if (!opts.length) { if (sp.type === 'kinder') trySchool({ stage: 'kinder', tier: 2 }); else skipSchool(sp.stage || 'grad'); break; }
        trySchool(opts.find(o => o.esc) || opts[0]);
        break;
      }
      case 'uni': {
        const facs = Object.keys(H.FACULTIES).filter(f => !facultyOk(f));
        if (!facs.length) { skipSchool('uni'); break; }
        const f = pick(facs);
        const o = schoolOptions('uni', f).filter(x => !x.lock);
        if (!o.length) { skipSchool('uni'); break; }
        trySchool(o[0]);
        break;
      }
      case 'care': careChoice(pick(H.CARE.filter(c => !c.half || parentsAlive().some(p => (c.half === 'mom' ? p.rel === '母' : p.rel === '父') && p.sal > 0)).map(c => c.id).concat(['nb']))); break;
      case 'club': {
        const ids = H.HOBBIES.filter(h => h.club).map(h => h.id).concat(['none']);
        const r = joinClub(pick(ids));
        if (!r.ok) joinClub('none');
        break;
      }
      case 'career': case 'work12': {
        let done = false;
        if (sp.type === 'work12') { const o = pick(sp.opts || work12Opts(sp)); work12(o); done = true; }
        else {
          const ok = jobOptions().filter(j => !j.lock);
          for (let i = 0; i < 3 && ok.length; i++) { const r = tryJob(pick(ok).id); if (r.ok) { done = true; break; } }
        }
        if (!done && !sp.done) careerSkip();
        break;
      }
      case 'sick': treat(canPay(S.sick ? S.sick.cost : 0) ? 'treat' : 'wait'); break;
      case 'scout': scout(chance(0.3)); break;
      case 'proposal': answerProposal(chance(0.7)); break;
      case 'meet': meetAnswer(chance(0.6)); break;
      case 'hobbyOffer': case 'petOffer': offerAnswer(sp.type, chance(0.5)); break;
      case 'kidSchool': case 'kidPath': {
        const k = kidById(sp.kid);
        if (!k || !k.alive) { sp.done = true; break; }
        const stage = sp.type === 'kidPath' ? (sp.grad ? 'grad' : 'uni') : sp.stage;
        if (sp.type === 'kidPath' && chance(0.3)) { kidSkip(sp.kid); break; }
        const o = kidSchoolOptions(k, stage).filter(x => !x.lock);
        if (o.length) kidTrySchool(sp.kid, stage, o[0].tier); else kidSkip(sp.kid);
        break;
      }
      case 'kidJob': { const k = kidById(sp.kid); if (!k || !k.alive) { sp.done = true; break; } kidPickJob(sp.kid, 'self'); break; }
      case 'kids': kidsAnswer(pick(['want', 'want', 'want', 'later', 'later', 'adopt'])); break;
      case 'abroad': abroadDecide(S.abroad ? 'stay' : 'no'); break;
      case 'abroadEnd': abroadEnd('back'); break;
      case 'retire': retire('retire'); break;
      default: sp.done = true;
    }
  }
  function careChoice(id) {
    const sp = S.yr.special.find(x => x.type === 'care' && !x.done);
    if (sp) sp.done = true;
    const c = H.CARE.find(x => x.id === id);
    if (c.half) {
      const p = c.half === 'mom' ? S.fam.mom : S.fam.dad;
      if (p && p.alive) { p.sal = Math.round(p.sal / 2); p.job = p.job.replace(/（.*）$/, '') + '（時短）'; }
    }
    const d = applyFx(c.fx);
    if (sp) sp.result = c.n;
    log(`${c.e} ${c.n}ことになった ${fxText(d)}`, 'school');
  }
  function careerSkip(mode) {
    const sp = S.yr.special.find(x => (x.type === 'career' || x.type === 'work12') && !x.done);
    if (sp) { sp.done = true; sp.result = mode === 'ronin' ? '浪人する' : '今は働かない'; }
    if (mode === 'ronin' && sp && sp.ronin && S.me.age < 22) { S.ronin = true; log('📚 浪人して、来年もう一度大学を目指すことにした。', 'school'); }
    else log('☁️ 今は働かず、ゆっくり過ごすことにした。', 'job');
  }
  function work12Opts(sp) {
    if (sp.opts) return sp.opts;
    const local = shuffle(H.JOBS.filter(j => !Object.keys(j.req).length));
    const opts = [{ kind: 'helper' }];
    local.slice(0, 3).forEach(j => opts.push({ kind: 'job', id: j.id }));
    const nb = birth().nb.filter(c => H.countryMap[c]);
    opts.push({ kind: 'job', id: pick(local).id, country: pick(nb) });
    sp.opts = opts;
    return opts;
  }
  function work12(o) {
    const sp = S.yr.special.find(x => x.type === 'work12' && !x.done);
    if (o.kind === 'helper') {
      if (!S.job || S.job.id !== 'helper') becomeHelper();
      else log('🧺 これからも家族の仕事を手伝うことにした。', 'job');
      if (sp) { sp.done = true; sp.result = '家業の手伝いを続ける'; }
      return;
    }
    S.yr.jobTries = 0;
    setJob(o.id, { country: o.country });
    if (o.country) hl(`${C(o.country).flag} ${C(o.country).name}へ出稼ぎに出た`, 6);
    if (sp) { sp.done = true; sp.result = `${H.JOB[o.id].n}${o.country ? `（${C(o.country).name}）` : ''}`; }
  }
  function answerProposal(yes) {
    const sp = S.yr.special.find(x => x.type === 'proposal' && !x.done);
    if (sp) sp.done = true;
    const p = lover();
    if (!p) return;
    if (sp && sp.from === 'me') {
      if (!yes) { sp.result = 'まだプロポーズしない'; log(`💭 ${p.first}へのプロポーズは、もう少し先にすることにした。`, 'love'); return; }
      if (S.yr.propose) { sp.result = '今年はもうプロポーズした'; return; }
      const r = propose();
      sp.result = r && r.ok ? '結婚した！' : 'プロポーズは保留に';
      return;
    }
    if (yes) { if (sp) sp.result = '結婚する'; log(`💐 ${p.first}からプロポーズされた！`, 'love'); marry(); }
    else { if (sp) sp.result = '結婚しない'; log(`🙇 ${p.first}からのプロポーズを断った。`, 'love'); if (chance(0.3)) breakUp(true); }
  }

  // =============================================================
  // 次の誕生日へ
  // =============================================================
  function advance() {
    if (!canAdvance()) return false;
    S.me.age++;
    const a = S.me.age;
    // 誕生日
    log(`🎂 ${a}歳の誕生日を迎えた。`, 'bday');
    initYear();
    naturalGrowth();
    // 死亡判定（去年の病気の治療状況をふまえて）→ 病気の経過
    const q = deathRate();
    let dead = chance(q);
    if (!dead && a >= 12) {
      const h = S.stats.happy;
      const sr = h <= 5 ? 0.03 : h <= 10 ? 0.015 : 0;
      if (sr && chance(sr)) { die('心の限界（自死）'); save(); emit(); return true; }
    }
    if (dead) { die(causeOfDeath()); save(); emit(); return true; }

    sicknessYearly();
    yearlyMoney();
    yearlyJob();
    if (S.retired) S.peakIncome = Math.max(S.peakIncome, 0);
    yearlyPets();
    yearlyFamily();
    yearlyLove();
    loveEvents();
    offers();
    stageTransition();
    setAllowance();

    // 学校
    if (S.school) {
      if (a >= S.school.start + S.school.years) graduate();
      else clubYearly();
    }
    // 年齢による進路
    if (a === 3 && !S.school) addSpecial({ type: 'kinder' });
    if (a === 6 && !S.school && !S.yr.special.some(x => x.type === 'school')) addSpecial({ type: 'school', stage: 'elem' });
    if (a === 12 && !S.school && !S.yr.special.some(x => x.type === 'school') && S.job && S.job.id === 'helper') addSpecial({ type: 'work12' });
    if (S.ronin && !S.school) { S.ronin = false; addSpecial({ type: 'uni' }); }
    // 大学・大学院の留学
    if (S.school && (S.school.stage === 'uni' || S.school.stage === 'grad') && a > S.school.start) {
      if (S.abroad) addSpecial({ type: 'abroad', cont: true });
      else if (abroadRate() > 0) addSpecial({ type: 'abroad' });
    }
    // 独り立ち
    if (!S.indep && a >= 23 && !isStudent()) becomeIndependent();
    // 引退
    if (S.job && a === 65 && S.job.id !== 'helper') addSpecial({ type: 'retire' });
    if (S.job && a >= 70) doRetire();
    // 病気・スカウト
    sicknessRoll();
    scoutRoll();
    // 思い出
    makeMemories();
    finishYear();
    save();
    emit();
    return true;
  }

  // =============================================================
  // 思い出（イベント）
  // =============================================================
  function ctx() {
    const kids = S.fam.kids.filter(k => k.alive);
    return {
      age: S.me.age, cls: S.me.cls, tier: live().tier,
      st: k => S.stats[k], has, hob: id => !!activeHobby(id), inStage,
      student: isStudent(), working: !!S.job && S.job.id !== 'helper', jobId: S.job ? S.job.id : null, jobGrow: S.job ? S.job.grow : null,
      jobless: !S.job && !isStudent() && !S.retired && S.me.age >= 18 && S.me.age < 65,
      abroad: S.me.live !== S.me.country, partner: !!(S.fam.partner && S.fam.partner.alive), married: !!spouse(),
      kidYoung: kids.some(k => k.age < 6), kidSchool: kids.some(k => k.age >= 6 && k.age <= 12), kidTeen: kids.some(k => k.age >= 13 && k.age <= 18), kidAdult: kids.some(k => k.age >= 19),
      grandkid: grandkids().some(g => g.alive), pet: S.pets.length > 0, anyHobby: S.hobbies.length > 0,
      sportHobby: S.hobbies.some(h => H.SPORTS.includes(h.id)), allowance: S.allowance, dadAlive: S.fam.dad && S.fam.dad.alive
    };
  }
  function fill(t, g) {
    const c = live();
    const kids = S.fam.kids.filter(k => k.alive);
    const gks = grandkids().filter(x => x.alive);
    const p = S.fam.partner;
    const pet = S.pets.length ? pick(S.pets) : null;
    const hob = S.hobbies.length ? H.HOBBY[(g && g.sportHobby && /試合|まめ/.test(t) ? S.hobbies.find(h => H.SPORTS.includes(h.id)) || S.hobbies[0] : pick(S.hobbies)).id] : null;
    const friendG = pick(['m', 'f']);
    const map = {
      food: () => pick(c.foods), place: () => pick(c.places), city: () => S.me.city, country: () => c.name,
      friend: () => { const l = friendG === 'm' ? c.m : c.f; const fl = l.filter(n => !S.usedNames.includes(n)); return pick(fl.length ? fl : l); },
      mom: () => 'お母さん', dad: () => 'お父さん', partner: () => p ? p.first : '恋人',
      kid: () => kids.length ? pick(kids).first : '子ども', grandkid: () => gks.length ? pick(gks).first : '孫',
      pet: () => pet ? pet.name : 'ペット', petn: () => pet ? H.PETS.find(x => x.id === pet.type).e + pet.name : 'ペット',
      hobby: () => hob ? hob.n : '趣味', school: () => S.school ? S.school.name : '学校', job: () => S.job ? S.job.n : '会社員', me: () => S.me.first
    };
    return t.replace(/\{(\w+)\}/g, (m, k) => map[k] ? map[k]() : m);
  }
  function makeMemories() {
    const g = ctx();
    const n = 1 + wpickIndex([15, 30, 30, 15, 10]);
    const pool = H.EVENTS.filter(e => g.age >= e.a[0] && g.age <= e.a[1] && (!e.c || e.c(g)));
    const out = [];
    // お祭り
    if (g.age >= 1 && chance(0.35)) {
      const f = pick(live().fests);
      out.push({ t: `${f[1]} ${f[0]}：${f[2]}`, k: 'fest' });
    }
    const list = shuffle(pool);
    while (out.length < n && list.length) {
      const e = wpick(list, x => x.w || 1);
      list.splice(list.indexOf(e), 1);
      let t = fill(e.t, g);
      let extra = '';
      if (e.fx) { const d = applyFx(e.fx, { raw: true }); if (Object.keys(d).length) extra = ' ' + fxText(d); }
      if (e.money) { const m = price(e.money); spend(-m); extra += ` 💰${m > 0 ? '+' : ''}${fmtYen(m)}`; }
      out.push({ t: '💭 ' + t + extra, k: 'mem' });
    }
    out.forEach(o => log(o.t, o.k));
  }

  // =============================================================
  // 表示用の情報
  // =============================================================
  function jobLabel() {
    const a = S.me.age;
    if (S.job) { const r = H.RANKS[S.job.grow]; return `${S.job.e} ${S.job.n}${S.job.id !== 'helper' && r ? `（${r[S.job.rank]}）` : ''}${S.job.part ? '・パート' : ''}`; }
    if (S.school) return S.school.stage === 'kinder' ? '🧸 園児' : `🎒 学生`;
    if (a < 3) return '👶 赤ちゃん';
    if (a < 6) return '🧒 幼児';
    if (S.retired) return '🌅 引退（年金暮らし）';
    if (a < 15) return '🧒 子ども';
    if (spouse() || S.fam.kids.some(k => k.alive)) return female() ? '🏠 専業主婦' : '🏠 専業主夫';
    return '☁️ 無職';
  }
  function eduLabel() {
    if (S.school) {
      const yr = S.me.age - S.school.start + 1;
      return `${S.school.name}${S.school.stage === 'kinder' ? '' : ` ${yr}年生`}`;
    }
    return S.eduFinal;
  }
  function info() {
    return {
      name: fullName(S.me), first: S.me.first, age: S.me.age, gender: S.me.gender, country: birth(), live: live(), city: S.me.city, cls: S.me.cls,
      job: jobLabel(), edu: eduLabel(), allowance: S.allowance, pocket: S.money.mine, income: income(), money: wallet(), indep: S.indep,
      house: S.house != null ? H.HOUSES[S.house] : null, sick: S.sick
    };
  }
  function lifePhrase() {
    const a = S.deathAge;
    const kids = S.fam.kids.length, gks = grandkids().length;
    const jobId = S.lastJobId;
    if (a <= 5) return 'ほんの一瞬、灯った小さな光';
    if (a <= 17) return '駆け足で過ぎた、まぶしい季節';
    if (/自死/.test(S.cause || '')) return '誰よりも繊細に、世界を感じた人生';
    if (['actor', 'model', 'idol', 'athlete', 'comedian'].includes(jobId) && S.peakIncome > price(15000000)) return 'スポットライトを浴び続けた人生';
    if (S.me.cls <= 2 && S.peakIncome > price(8000000)) return '逆境から駆け上がった人生';
    if (gks >= 4) return 'たくさんの笑顔に囲まれた、にぎやかな人生';
    if (['doctor', 'clinic', 'dentist', 'pharmacist', 'teacher', 'lawyer', 'judge'].includes(jobId)) return '誰かを支え続けた人生';
    if (S.me.live !== S.me.country || S.hl.some(h => /留学|出稼ぎ/.test(h.t))) return '国境を越えて旅した人生';
    if (S.hl.some(h => /全国/.test(h.t))) return '夢中で何かを追いかけた人生';
    if (S.petsGone.length + S.pets.length >= 3) return 'もふもふに愛された人生';
    if (kids >= 3) return '家族の輪を広げた人生';
    if (S.stats.happy >= 80) return '陽だまりのような、穏やかな人生';
    if (a >= 95) return '長い長い物語を生ききった人生';
    if (S.stats.sense >= 85) return '色とりどりの感性で描いた人生';
    if (S.stats.intel >= 85) return '知ることを楽しみ続けた人生';
    if (S.stats.happy <= 25) return '雨の日も歩き続けた、強い人生';
    return '一歩一歩、自分らしく歩いた人生';
  }
  function highlights() {
    const list = S.hl.slice();
    const top = list.slice().sort((x, y) => y.w - x.w || x.age - y.age);
    const n = clamp(top.filter(h => h.w >= 3).length, 3, 5);
    return top.slice(0, n).sort((x, y) => x.age - y.age);
  }

  // =============================================================
  // 保存
  // =============================================================
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 保存できなくても遊べる */ } }
  function load() {
    try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const o = JSON.parse(s); if (!o || o.v !== 1) return null; S = o; return S; } catch (e) { return null; }
  }
  function hasSave() { try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const o = JSON.parse(s); return !!o && !o.over; } catch (e) { return false; } }
  function clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ } }
  function emit() { listeners.forEach(f => { try { f(S); } catch (e) { console.error(e); } }); }

  // 行動系の関数は実行後に保存・再描画する
  function act(fn) { return function () { if (!S || S.over) return; const r = fn.apply(null, arguments); if (S.job) S.lastJobId = S.job.id; save(); emit(); return r; }; }

  window.Game = {
    get S() { return S; },
    H, fmtYen, fullName, hobbyLevel, has, hp, club, clubWord, isStudent, spouse, lover, grandkids, parentsAlive,
    newLife: o => { newLife(o); emit(); return S; }, load, hasSave, clear, save,
    on: f => listeners.push(f),
    info, canAdvance, pendingSpecial, actionDef: i => H.ACTIONS[i],
    schoolOptions, facultyOk, passRate, jobOptions, jobLock, hireRate, abroadRate, work12Opts, canFindHobby, canPay, price, wallet,
    loveRate, marryRate, splitRate, conflictsWith, canGetTrait, traitCount, deathRate,
    lifePhrase, highlights,
    advance: () => { const r = advance(); if (S && S.job) S.lastJobId = S.job.id; return r; },
    doAction: act(doAction), chooseTrait: act(chooseTrait), enjoyHobby: act(enjoyHobby), autoPick: act(autoPick),
    trySchool: act(trySchool), skipSchool: act(skipSchool), careChoice: act(careChoice), joinClub: act(joinClub), quitClub: act(quitClub),
    findHobby: act(findHobby), dropHobby: act(dropHobby), tryJob: act(tryJob), quitJob: act(quitJob), togglePart: act(togglePart),
    careerSkip: act(careerSkip), work12: act(work12), retire: act(retire), treat: act(treat), scout: act(scout),
    abroadDecide: act(abroadDecide), abroadEnd: act(abroadEnd), answerProposal: act(answerProposal), meetAnswer: act(meetAnswer), kidsAnswer: act(kidsAnswer), offerAnswer: act(offerAnswer),
    kidSchoolOptions, kidJobOffers, kidById, kidTrySchool: act(kidTrySchool), kidSkip: act(kidSkip), kidPickJob: act(kidPickJob), adopt: act(adoptManual), canAdopt: () => !!S && canAdopt(),
    findLove: act(findLove), propose: act(propose), breakUp: act(() => breakUp(false)), adoptPet: act(adoptPet), buyHouse: act(buyHouse),
    setPref: act(v => { S.love.pref = v; }), setWantKids: act(v => { S.love.wantKids = v; })
  };
})();
