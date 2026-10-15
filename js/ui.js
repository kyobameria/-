// すべて億分の1 — 画面まわり
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let tab = 'life';
  let actCat = 'body';

  function avatar(gender, age) {
    if (age < 3) return '👶';
    if (age < 13) return gender === 'm' ? '👦' : '👧';
    if (age < 60) return gender === 'm' ? '👨' : '👩';
    return gender === 'm' ? '👴' : '👵';
  }

  function fxChips(fx) {
    if (!fx || !fx.length) return '';
    // 同じ項目はまとめる
    const sum = {};
    fx.forEach(f => { sum[f.k] = (sum[f.k] || 0) + f.d; });
    return '<span class="fx">' + Object.keys(sum).filter(k => sum[k] !== 0).map(k => {
      const v = sum[k];
      const cls = v > 0 ? 'up' : 'down';
      if (k === 'money') return '<span class="chip ' + cls + '">💴 ' + (v > 0 ? '+' : '') + esc(G.fmt(v)) + '</span>';
      const s = Game.STAT_BY_KEY[k];
      return '<span class="chip ' + cls + '">' + s.emoji + s.name + (v > 0 ? ' +' : ' ') + v + '</span>';
    }).join('') + '</span>';
  }

  function rowsTable(rows) {
    return '<table class="info-table">' + rows.map(r => '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>';
  }

  function traitHint(ts) {
    if (!ts || !ts.length) return '';
    return '<span class="trait-hint" title="' + esc(ts.join('・')) + 'に近づく">' + ts.map(t => DATA.traits[t] ? DATA.traits[t].emoji : '').join('') + '</span>';
  }

  // ============ 描画 ============
  function render() {
    const S = Game.S;
    if (!S) return;
    renderProfile(S);
    renderStats(S);
    renderTabs();
    if (tab === 'life') renderLog(S);
    if (tab === 'act') renderActions(S);
    if (tab === 'fam') renderFamily(S);
    if (tab === 'trait') renderTraits(S);
    renderBottom(S);
  }

  function renderProfile(S) {
    const c = G.c();
    const sp = G.spouse();
    const fam = S.people.filter(p => p.alive && Game.FAMILY_RELS.includes(p.rel) && p.age >= 0);
    const pets = S.pets.filter(p => p.alive);
    const hh = G.householdIncome();
    $('#profile').innerHTML =
      '<div class="pf-top">' +
        '<div class="pf-avatar">' + avatar(S.gender, S.age) + '</div>' +
        '<div class="pf-main">' +
          '<div class="pf-name">' + esc(G.myName()) + (S.alive ? '' : ' <span class="tag gray">故人</span>') + '</div>' +
          '<div class="pf-sub">' + c.flag + ' ' + esc(c.name) + '・' + esc(S.city) + '　<b>' + S.age + '歳</b>（' + S.year + '年）</div>' +
          '<div class="pf-tags">' +
            '<span class="tag">💼 ' + esc(G.jobName()) + '</span>' +
            '<span class="tag">🎓 ' + esc(DATA.eduNames[S.edu]) + '</span>' +
            (sp ? '<span class="tag pink">💍 既婚</span>' : G.person('恋人') ? '<span class="tag pink">💗 恋人あり</span>' : '') +
            (S.house ? '<span class="tag">🏡 持ち家</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pf-money">' +
        moneyBox(S.age < 18 ? '👛 お小遣い' : '💰 貯金', G.fmt(S.money), S.money < 0 ? 'neg' : '') +
        moneyBox('💼 年収', S.income ? G.fmt(S.income) : '—') +
        (S.age < 18 ? moneyBox('🏠 家の貯金', G.fmt(S.familySavings), S.familySavings < 0 ? 'neg' : '') : moneyBox('🏠 世帯年収', hh ? G.fmt(hh) : '—')) +
      '</div>' +
      '<div class="pf-family-title">👪 家族 <button class="link" data-tab="fam">くわしく ›</button></div>' +
      '<div class="fam-strip">' +
        (fam.length ? fam.map(p => '<button class="fam-chip" data-pid="' + p.id + '"><span class="fc-emoji">' + avatar(p.gender, p.age) + '</span><span class="fc-rel">' + esc(p.rel) + '</span><span class="fc-name">' + esc(p.first) + '</span><span class="fc-age">' + p.age + '歳・' + esc(shortJob(p)) + '</span></button>').join('') : '<span class="muted">家族はいない</span>') +
        pets.map(p => '<span class="fam-chip pet"><span class="fc-emoji">' + p.emoji + '</span><span class="fc-rel">ペット</span><span class="fc-name">' + esc(p.name) + '</span><span class="fc-age">' + p.age + '歳・' + esc(p.type) + '</span></span>').join('') +
      '</div>' +
      (S.traits.length ? '<div class="pf-traits">' + S.traits.map(t => '<span class="trait-chip">' + DATA.traits[t].emoji + esc(t) + '</span>').join('') + '</div>' : '');
  }
  function shortJob(p) { const j = G.npcStatus(p); return j.length > 7 ? j.slice(0, 7) + '…' : j; }
  function moneyBox(label, val, cls) { return '<div class="mbox ' + (cls || '') + '"><div class="ml">' + label + '</div><div class="mv">' + esc(val) + '</div></div>'; }

  function renderStats(S) {
    $('#stats').innerHTML = Game.STATS.map(s => {
      const v = S.stats[s.key];
      const low = v < 25 ? ' low' : '';
      return '<div class="stat' + low + '"><div class="st-head"><span>' + s.emoji + ' ' + s.name + '</span><b>' + v + '</b></div><div class="bar"><i style="width:' + v + '%;background:' + s.color + '"></i></div></div>';
    }).join('');
  }

  function renderTabs() {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    ['life', 'act', 'fam', 'trait'].forEach(t => $('#tab-' + t).classList.toggle('hidden', t !== tab));
  }

  const KIND_LABEL = { big: '節目', culture: '文化', mem: '思い出', act: '行動', trait: '性格', sad: '', good: '', ev: '' };
  function renderLog(S) {
    const years = S.log.slice().reverse();
    $('#tab-life').innerHTML = years.map((y, i) => {
      return '<article class="year' + (i === 0 ? ' latest' : '') + '">' +
        '<header><span class="y-age">' + y.age + '歳</span><span class="y-year">' + y.year + '年</span></header>' +
        (y.items.length ? y.items.map(it => '<div class="item k-' + it.k + '">' + (KIND_LABEL[it.k] ? '<span class="klabel">' + KIND_LABEL[it.k] + '</span>' : '') + '<span class="itxt">' + esc(it.t) + '</span>' + fxChips(it.fx) + '</div>').join('') : '<div class="item muted">静かな一年だった。</div>') +
        '</article>';
    }).join('');
  }

  function renderActions(S) {
    const payer = Game.actPayer();
    const wallet = payer === 'family' ? S.familySavings : S.money;
    let html = '<div class="act-head">' +
      '<div>行動ポイント <span class="ap">' + apDots(S.ap) + '</span></div>' +
      '<div class="muted small">' + (payer === 'family' ? '🏠 家の貯金から：' : '💰 あなたの貯金：') + '<b>' + esc(G.fmt(wallet)) + '</b>' + (S.income ? '　💼 年収 ' + esc(G.fmt(S.income)) : '') + '</div>' +
      '</div>';
    html += '<div class="cats">' + DATA.actCats.map(c => '<button class="cat' + (c.id === actCat ? ' on' : '') + '" data-cat="' + c.id + '">' + c.emoji + ' ' + c.name + '</button>').join('') + '</div>';
    if (actCat === 'life') {
      const list = Game.lifeActions();
      html += '<div class="acts">' + (list.length ? list.map(a => '<button class="act" data-life="' + a.id + '"' + (S.ap <= 0 ? ' disabled' : '') + '><span class="a-emoji">' + a.emoji + '</span><span class="a-body"><span class="a-name">' + esc(a.name) + '</span><span class="a-desc">' + esc(a.desc) + '</span></span></button>').join('') : '<p class="muted">今できる人生の選択はまだない。大きくなったら色々できるよ。</p>') + '</div>';
    } else {
      const list = DATA.activities.filter(a => a.cat === actCat);
      html += '<div class="acts">' + list.map(a => {
        const av = Game.actAvailable(a);
        const cost = Game.actCost(a);
        const fx = Object.keys(a.fx).filter(k => a.fx[k][1] > 0).map(k => Game.STAT_BY_KEY[k].emoji).join('');
        const down = Object.keys(a.fx).filter(k => a.fx[k][0] < 0).map(k => Game.STAT_BY_KEY[k].emoji).join('');
        return '<button class="act" data-act="' + a.id + '"' + (av.ok ? '' : ' disabled') + '>' +
          '<span class="a-emoji">' + a.emoji + '</span>' +
          '<span class="a-body"><span class="a-name">' + esc(a.name) + '</span>' +
          '<span class="a-desc">' + (fx ? '<span class="up-t">↑' + fx + '</span>' : '') + (down ? ' <span class="down-t">↓' + down + '</span>' : '') + (a.income ? ' <span class="up-t">💴収入</span>' : '') + '</span>' +
          '<span class="a-cost">' + (cost ? '💴 ' + esc(G.fmt(cost)) : '無料') + (av.ok ? '' : '　<span class="why">' + esc(av.why) + '</span>') + '</span></span>' +
          '</button>';
      }).join('') + '</div>';
    }
    $('#tab-act').innerHTML = html;
  }
  function apDots(n) { let s = ''; for (let i = 0; i < DATA.AP_PER_YEAR; i++) s += i < n ? '●' : '○'; return s; }

  function renderFamily(S) {
    const groups = [
      ['いっしょに暮らす・近しい家族', p => p.alive && ['父', '母', '配偶者', '恋人'].includes(p.rel)],
      ['きょうだい', p => p.alive && ['兄', '姉', '弟', '妹'].includes(p.rel) && p.age >= 0],
      ['子ども・孫', p => p.alive && ['息子', '娘', '義理の息子', '義理の娘', '孫'].includes(p.rel)],
      ['思い出の人', p => !p.alive || p.rel === '元配偶者']
    ];
    let html = '<div class="me-card card-lite"><h3>🙋 あなた</h3>' + rowsTable([
      ['👤 名前', G.myName()], ['🎂 年齢', S.age + '歳'], ['🌏 出身', G.c().flag + G.c().name + '・' + S.city], ['💼 職業', G.jobName()], ['💴 年収', S.income ? G.fmt(S.income) : 'なし'], ['🎓 学歴', DATA.eduNames[S.edu]], ['💍 結婚歴', (S.marriedCount || 0) + '回'], ['🧒 子ども', G.kids(true).length + '人']
    ].concat(G.moneyRows().filter(r => !/あなたの年収|父の年収|母の年収/.test(r[0])))) + '</div>';
    groups.forEach(g => {
      const ps = S.people.filter(g[1]);
      if (!ps.length) return;
      html += '<h3 class="fam-h">' + g[0] + '</h3><div class="fam-grid">' + ps.map(p =>
        '<div class="pcard' + (p.alive ? '' : ' dead') + '"><div class="pc-head"><span class="pc-emoji">' + (p.alive ? avatar(p.gender, p.age) : '🕊️') + '</span><div><div class="pc-name">' + esc(G.name(p)) + '</div><div class="pc-rel">' + esc(p.rel) + (p.alive ? '' : '（' + (p.deathAge || p.age) + '歳で他界）') + '</div></div></div>' +
        rowsTable([['🎂 年齢', p.age + '歳'], ['💼 職業', G.npcStatus(p)], ['💴 年収', p.income ? G.fmt(p.income) : 'なし']].concat(p.married ? [['💍', '既婚']] : []).concat([['🧬 性格', G.traitText(p)]])) +
        (p.alive ? '<div class="close-bar" title="仲の良さ"><span>🤍 仲の良さ</span><div class="bar"><i style="width:' + (p.close || 0) + '%"></i></div></div>' : '') +
        '</div>').join('') + '</div>';
    });
    const pets = S.pets;
    if (pets.length) html += '<h3 class="fam-h">ペット</h3><div class="fam-grid">' + pets.map(p => '<div class="pcard' + (p.alive ? '' : ' dead') + '"><div class="pc-head"><span class="pc-emoji">' + (p.alive ? p.emoji : '🌈') + '</span><div><div class="pc-name">' + esc(p.name) + '</div><div class="pc-rel">' + esc(p.type) + '・' + p.age + '歳</div></div></div></div>').join('') + '</div>';
    $('#tab-fam').innerHTML = html;
  }

  function renderTraits(S) {
    const budding = Object.keys(S.tp || {}).filter(t => S.tp[t] > 0 && S.tp[t] < 99 && !S.traits.includes(t)).sort((a, b) => S.tp[b] - S.tp[a]).slice(0, 8);
    let html = '<p class="muted small">選んだ選択肢や行動によって、少しずつ性格が育っていきます。同じ方向の選択を重ねると、新しい性格が芽生えます。</p>';
    html += '<h3 class="fam-h">🧬 あなたの性格（' + S.traits.length + '）</h3>';
    html += S.traits.length ? '<div class="trait-grid">' + S.traits.map(t => '<div class="tcard"><span class="t-emoji">' + DATA.traits[t].emoji + '</span><div><b>' + esc(t) + '</b><div class="muted small">' + esc(DATA.traits[t].desc) + '</div></div></div>').join('') + '</div>' : '<p class="muted">まだ性格は決まっていない。これからの選択次第！</p>';
    if (budding.length) html += '<h3 class="fam-h">🌱 芽生えかけている性格</h3><div class="trait-grid">' + budding.map(t => '<div class="tcard bud"><span class="t-emoji">' + DATA.traits[t].emoji + '</span><div><b>' + esc(t) + '？</b><div class="muted small">芽生えまで あと' + Math.max(1, G.traitNeed() - S.tp[t]) + '歩</div></div></div>').join('') + '</div>';
    $('#tab-trait').innerHTML = html;
  }

  function renderBottom(S) {
    $('#ap').textContent = apDots(S.ap);
    const b = $('#next');
    b.disabled = S.alive && Game.Q.length > 0;
    b.innerHTML = S.alive ? '🎂 次の年へ <small>（' + (S.age + 1) + '歳になる）</small>' : '🕊️ 人生のまとめを見る';
  }

  // ============ イベント ============
  function showEvent(item) {
    const S = Game.S, ev = item.ev, x = item.ctx;
    let info = [];
    try { info = ev.info ? ev.info(S, G, x) : []; } catch (e) { console.error(e); }
    const text = typeof ev.text === 'function' ? ev.text(S, G, x) : (ev.text || '');
    let html = '<div class="ev-emoji">' + (ev.emoji || '✨') + '</div>' +
      '<div class="ev-meta">' + S.age + '歳・' + S.year + '年' + (ev.culture || (DATA.countryEvents[S.country] || []).includes(ev) ? '　<span class="tag culture">' + G.c().flag + ' この国ならでは</span>' : '') + '</div>' +
      '<h2 class="ev-title">' + esc(ev.title || '') + '</h2>' +
      '<p class="ev-text">' + esc(text) + '</p>';
    if (info && info.length) {
      html += '<details class="ev-info" open><summary>📋 判断材料</summary>' + info.map(sec => (sec.title ? '<h4>' + esc(sec.title) + '</h4>' : '') + rowsTable(sec.rows || [])).join('') + '</details>';
    }
    html += '<div class="choices">' + item.choices.map((c, i) =>
      '<button class="choice" data-choice="' + i + '"' + (c.ok === false ? ' disabled' : '') + '>' +
        '<span class="c-label">' + esc(c.label) + traitHint(c.t) + '</span>' +
        (c.sub ? '<span class="c-sub">' + esc(c.sub) + '</span>' : (c.ok === false ? '<span class="c-sub">条件を満たしていない</span>' : '')) +
        (c.rows ? '<span class="c-rows">' + c.rows.map(r => '<span class="c-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></span>').join('') + '</span>' : '') +
      '</button>').join('') + '</div>';
    openModal(html);
  }

  function showResult(item, ch, r) {
    const ev = item.ev;
    let html = '<div class="ev-emoji">' + (ev.emoji || '✨') + '</div>' +
      '<h2 class="ev-title">' + esc(ch.label) + '</h2>' +
      '<p class="ev-text result">' + esc(r.res || '') + '</p>' +
      '<div class="res-fx">' + fxChips(r.fx) + '</div>';
    if (r.traits && r.traits.length) html += '<div class="res-traits">' + r.traits.map(t => '<div class="new-trait">' + DATA.traits[t].emoji + ' 新しい性格「<b>' + esc(t) + '</b>」が芽生えた！<div class="muted small">' + esc(DATA.traits[t].desc) + '</div></div>').join('') + '</div>';
    html += '<button class="primary" id="continue">つづける ›</button>';
    openModal(html);
    $('#continue').focus();
  }

  function openModal(html) {
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
    $('#modal-body').scrollTop = 0;
  }
  function closeModal() { $('#modal').classList.add('hidden'); }

  function showPerson(pid) {
    const p = Game.S.people.find(x => x.id === pid);
    if (!p) return;
    openModal('<div class="ev-emoji">' + avatar(p.gender, p.age) + '</div><h2 class="ev-title">' + esc(G.name(p)) + '</h2><p class="ev-meta">' + esc(p.rel) + '</p>' + rowsTable(G.personRows(p)) + '<button class="primary" id="close-modal">とじる</button>');
  }

  // ============ トースト ============
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    const box = $('#toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3200);
  }
  function flashFx(fx) {
    if (!fx || !fx.length) return;
    const el = document.createElement('div');
    el.className = 'toast fxtoast';
    el.innerHTML = fxChips(fx);
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 1800);
    setTimeout(() => el.remove(), 2400);
  }

  // ============ エンディング ============
  function showEnding() {
    const S = Game.S, sm = Game.summary();
    const c = sm.c;
    $('#ending-body').innerHTML =
      '<div class="end-flag">' + c.flag + '</div>' +
      '<p class="end-kicker">81億分の1の人生</p>' +
      '<h1 class="end-name">' + esc(G.myName()) + '</h1>' +
      '<p class="end-years">' + S.birthYear + ' – ' + S.year + '（' + S.age + '歳）・' + esc(c.name) + '・' + esc(S.city) + '</p>' +
      '<div class="end-title">' + esc(sm.title) + '</div>' +
      '<blockquote class="end-quote">「' + esc(S.flags.lastWords || 'ありがとう') + '」</blockquote>' +
      '<div class="end-grid">' +
        endBox('💼', '最後の仕事', S.retired ? '年金生活' : G.jobName()) +
        endBox('🎓', '最終学歴', DATA.eduNames[S.edu]) +
        endBox('💍', '結婚', (S.marriedCount || 0) + '回') +
        endBox('🧒', '子ども', sm.kids.length + '人') +
        endBox('👶', '孫', sm.grand.length + '人') +
        endBox('💰', '遺した財産', G.fmt(S.money)) +
        endBox('😊', '平均の幸福度', sm.happyAvg) +
        endBox('🌟', '人生スコア', sm.score + ' / 100') +
      '</div>' +
      (S.traits.length ? '<h3>🧬 あなたの性格</h3><div class="pf-traits center">' + S.traits.map(t => '<span class="trait-chip">' + DATA.traits[t].emoji + esc(t) + '</span>').join('') + '</div>' : '') +
      (sm.picks.length ? '<h3>📖 人生のハイライト</h3><ol class="end-hl">' + sm.picks.map(h => '<li><span class="hl-age">' + h.age + '歳</span>' + esc(h.t) + '</li>').join('') + '</ol>' : '') +
      '<p class="end-msg">あなたの人生も、誰かの人生も、すべて億分の1。<br>同じ人生は、二度とない。</p>' +
      '<div class="end-btns"><button class="primary" id="again">🎲 もう一度生まれる</button><button class="ghost" id="readlog">📖 人生の記録を読む</button></div>';
    $('#ending').classList.remove('hidden');
    $('#ending').scrollTop = 0;
  }
  function endBox(e, l, v) { return '<div class="ebox"><div class="e-e">' + e + '</div><div class="e-l">' + esc(l) + '</div><div class="e-v">' + esc(v) + '</div></div>'; }

  // ============ スタート画面 ============
  function showStart() {
    $('#app').classList.add('hidden');
    $('#ending').classList.add('hidden');
    $('#start').classList.remove('hidden');
    $('#btn-continue').classList.toggle('hidden', !Game.hasSave());
    const sel = $('#sel-country');
    if (!sel.options.length) {
      sel.innerHTML = '<option value="">🎲 ランダム（人口に比例）</option>' + DATA.countries.slice().sort((a, b) => b.pop - a.pop).map(c => '<option value="' + c.code + '">' + c.flag + ' ' + c.name + '（' + (c.pop / DATA.WORLD_POP * 100).toFixed(1) + '%）</option>').join('');
    }
  }
  function startGame(opt) {
    closeModal();
    Game.newGame(opt);
    $('#start').classList.add('hidden');
    $('#ending').classList.add('hidden');
    $('#app').classList.remove('hidden');
    tab = 'life';
    render();
    window.scrollTo(0, 0);
  }

  // ============ イベント登録 ============
  function bind() {
    $('#btn-random').addEventListener('click', () => startGame({}));
    $('#btn-custom').addEventListener('click', () => $('#custom').classList.toggle('hidden'));
    $('#btn-custom-go').addEventListener('click', () => {
      const name = $('#in-name').value.trim();
      startGame({ country: $('#sel-country').value || null, gender: $('#sel-gender').value || null, first: name || null });
    });
    $('#btn-continue').addEventListener('click', () => {
      if (Game.load()) { $('#start').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); }
    });
    $('#next').addEventListener('click', () => {
      if (!Game.S.alive) { showEnding(); return; }
      Game.nextYear();
      render();
      if (tab === 'life') $('#tab-life').scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    document.addEventListener('click', (e) => {
      const t = e.target.closest('button, .fam-chip');
      if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; render(); return; }
      if (t.dataset.cat) { actCat = t.dataset.cat; render(); return; }
      if (t.dataset.act) { Game.doActivity(t.dataset.act); return; }
      if (t.dataset.life) { Game.doLife(t.dataset.life); render(); return; }
      if (t.dataset.choice != null) { const item = Game.Q[0]; if (item) Game.choose(item, +t.dataset.choice); return; }
      if (t.dataset.pid) { showPerson(t.dataset.pid); return; }
      if (t.id === 'continue') { closeModal(); Game.runQueue(); render(); return; }
      if (t.id === 'close-modal') { closeModal(); return; }
      if (t.id === 'again') { showStart(); return; }
      if (t.id === 'readlog') { $('#ending').classList.add('hidden'); tab = 'life'; render(); return; }
      if (t.id === 'btn-help') { openModal($('#help-tpl').innerHTML + '<button class="primary" id="close-modal">とじる</button>'); return; }
      if (t.id === 'btn-home') {
        if (Game.Q.length) return;
        if (!Game.S.alive) { showStart(); return; }
        openModal('<div class="ev-emoji">🏠</div><h2 class="ev-title">タイトルに戻りますか？</h2><p class="ev-text">この人生は保存されています。「続きから」でまた再開できます。</p><div class="choices"><button class="choice" id="go-home"><span class="c-label">🏠 タイトルに戻る</span></button><button class="choice" id="close-modal"><span class="c-label">↩ ゲームを続ける</span></button></div>');
        return;
      }
      if (t.id === 'go-home') { closeModal(); showStart(); return;
      }
      if (t.id === 'btn-ending') { showEnding(); return; }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !$('#modal').classList.contains('hidden') && $('#continue')) { e.preventDefault(); $('#continue').click(); }
    });
  }

  window.UI = { render, toast, showEvent, showResult, showEnding, flashFx, showStart };
  document.addEventListener('DOMContentLoaded', () => { bind(); showStart(); });
})();
