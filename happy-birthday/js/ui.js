// =============================================================
// Happy Birth Day — 画面の描画と操作
// =============================================================
(function () {
  'use strict';
  const G = window.Game;
  const H = window.HB;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yen = G.fmtYen;
  let tab = 'year';
  let uniFac = null; // 大学の学部選択中

  // ---------------- 共通
  function toast(msg) {
    if (!msg) return;
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2700);
  }
  function modal(html) { $('#modal-body').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; }
  function confirmBox(title, text, okLabel, onOk) {
    modal(`<h2>${esc(title)}</h2><p>${text}</p><div class="btn-row"><button class="btn ghost" data-m="cancel" type="button">やめておく</button><button class="btn primary" data-m="ok" type="button">${esc(okLabel)}</button></div>`);
    $('#modal-body [data-m="ok"]').onclick = () => { closeModal(); onOk(); };
    $('#modal-body [data-m="cancel"]').onclick = closeModal;
  }
  function confetti() {
    const box = $('#confetti');
    box.innerHTML = '';
    const cols = ['var(--berry)', 'var(--candle)', 'var(--sky)', 'var(--mint)', 'var(--lilac)'];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.animationDuration = 1.2 + Math.random() * 0.8 + 's';
      box.appendChild(c);
    }
    setTimeout(() => { box.innerHTML = ''; }, 2600);
  }
  const fxChips = fx => Object.keys(fx).map(k => `<span class="chip">${H.STAT[k].e}${fx[k] > 0 ? '+' : ''}${fx[k]}</span>`).join('');
  const stars = n => '⭐'.repeat(n);
  const genderLabel = (g, a) => g === 'f' ? (a < 18 ? '女の子' : '女性') : (a < 18 ? '男の子' : '男性');

  // =============================================================
  // スタート
  // =============================================================
  function initStart() {
    const sel = $('#sel-country');
    sel.innerHTML = '<option value="">🎲 ランダム（世界の出生数の割合で決まる）</option>' +
      H.countries.slice().sort((a, b) => b.births - a.births).map(c => `<option value="${c.code}">${c.flag} ${c.name}</option>`).join('');
    $('#btn-born').onclick = () => born({});
    $('#btn-custom').onclick = () => { $('#custom').hidden = !$('#custom').hidden; };
    $('#custom').onsubmit = e => {
      e.preventDefault();
      born({ country: sel.value || undefined, gender: $('#sel-gender').value || undefined, cls: +$('#sel-class').value || undefined, name: $('#in-name').value.trim() || undefined });
    };
    $('#btn-continue').onclick = () => { if (G.load()) show(); };
    $('#btn-continue').hidden = !G.hasSave();
  }
  function born(o) { G.clear(); G.newLife(o); tab = 'year'; show(); confetti(); }
  function show() {
    const S = G.S;
    $('#start').hidden = !!S;
    $('#app').hidden = !S || S.over;
    $('#ending').hidden = !(S && S.over);
    if (!S) return;
    if (S.over) renderEnding(); else render();
    window.scrollTo(0, 0);
  }

  // =============================================================
  // メイン描画
  // =============================================================
  function render() {
    const S = G.S;
    if (!S || S.over) return;
    renderProfile();
    renderStats();
    document.querySelectorAll('.tabs button').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
      b.setAttribute('aria-selected', b.dataset.tab === tab);
    });
    ['year', 'life', 'fam', 'me', 'log'].forEach(t => { $('#tab-' + t).hidden = t !== tab; });
    ({ year: renderYear, life: renderLife, fam: renderFam, me: renderMe, log: renderLog })[tab]();
    renderBar();
  }

  function renderProfile() {
    const S = G.S, i = G.info();
    $('#age-badge').innerHTML = `<span class="flame"></span><b>${i.age}</b>歳`;
    const ci = H.classInfo[i.cls];
    const liveTxt = i.live.code !== i.country.code ? `<div class="row"><span>🏠</span><span class="k">住まい</span><span class="v">${i.live.flag} ${esc(i.live.name)}・${esc(i.city)}</span></div>` : '';
    $('#profile').innerHTML = `
      <div class="p-name"><span class="p-flag">${i.country.flag}</span><div><h2>${esc(i.name)}</h2><div class="p-sub">${i.age}歳・${genderLabel(i.gender, i.age)}・${esc(i.city)}</div></div></div>
      <div class="rows">
        <div class="row"><span>📛</span><span class="k">名前</span><span class="v">${esc(i.name)}</span></div>
        <div class="row"><span>${i.country.flag}</span><span class="k">出身地</span><span class="v">${esc(i.country.name)}</span></div>
        ${liveTxt}
        <div class="row"><span>🚻</span><span class="k">性別</span><span class="v">${genderLabel(i.gender, i.age)}</span></div>
        <div class="row"><span>🧳</span><span class="k">仕事</span><span class="v">${esc(i.job)}</span></div>
        <div class="row"><span>🎓</span><span class="k">${S.school ? '学歴（在学中）' : '最終学歴'}</span><span class="v">${esc(i.edu)}</span></div>
        <div class="row"><span>👛</span><span class="k">お小遣い</span><span class="v">${i.indep ? '—' : `月${yen(i.allowance)}<span class="muted small">（自分の貯金 ${yen(i.pocket)}）</span>`}</span></div>
        <div class="row"><span>💵</span><span class="k">年収</span><span class="v num">${yen(i.income)}</span></div>
        <div class="row"><span>💰</span><span class="k">家の貯金</span><span class="v num">${yen(i.money)}${i.indep ? '' : '<span class="muted small">（親の家計）</span>'}</span></div>
        <div class="row"><span>🏷️</span><span class="k">階級</span><span class="v">${stars(i.cls)} ${ci.name}</span></div>
        ${i.house ? `<div class="row"><span>${i.house.e}</span><span class="k">マイホーム</span><span class="v">${i.house.n}</span></div>` : ''}
      </div>
      ${i.sick ? `<span class="sick-tag">🤒 ${esc(i.sick.n)}${i.sick.treated ? '（治療中）' : ''}</span>` : ''}`;
  }
  function renderStats() {
    const S = G.S;
    $('#stats').innerHTML = H.STATS.map(([k, e, n]) => {
      const v = S.stats[k];
      return `<div class="stat ${v < 20 ? 'low' : v >= 80 ? 'top' : ''}"><div class="st-h"><span>${e} ${n}</span><b>${v}</b></div><div class="bar"><i style="width:${v}%"></i></div></div>`;
    }).join('');
  }
  function renderBar() {
    const S = G.S, y = S.yr;
    const items = [];
    items.push(`<span class="${y.act.done ? 'ok' : ''}">${y.act.done ? '✔' : '・'} 行動</span>`);
    items.push(`<span class="${y.trait.done ? 'ok' : ''}">${y.trait.done ? '✔' : '・'} 性格</span>`);
    if (y.hobby) items.push(`<span class="${y.hobby.done ? 'ok' : ''}">${y.hobby.done ? '✔' : '・'} 趣味</span>`);
    const pend = G.pendingSpecial().length;
    if (pend) items.push(`<span class="need">❗ 大事な選択 ${pend}</span>`);
    $('#todo').innerHTML = items.join('');
    $('#btn-next').disabled = !G.canAdvance();
    $('#btn-auto').disabled = G.canAdvance();
    const dot = document.querySelector('.tabs [data-tab="year"]');
    dot.innerHTML = '📖 今年' + (!G.canAdvance() && tab !== 'year' ? '<span class="dot"></span>' : '');
  }

  // =============================================================
  // 今年タブ
  // =============================================================
  function feedHtml(items) {
    return items.map(it => `<div class="it ${it.k}${it.sad ? ' sad' : ''}">${esc(it.t)}</div>`).join('');
  }
  function renderYear() {
    const S = G.S;
    const y = S.yr;
    const L = H.countryMap[S.me.live];
    const yearLog = S.log.filter(l => l.age === S.me.age).flatMap(l => l.items);
    let html = `<div class="year-head"><div class="yh-age">${S.me.age}<small>歳</small></div><div><h2>${S.me.age === 0 ? 'はじめての一年' : `${S.me.age}歳の一年`}</h2><p>${L.flag} ${esc(L.name)}・${esc(S.me.city)}で暮らしている</p></div></div>`;
    html += `<section class="feed">${feedHtml(yearLog)}</section>`;
    // 大事な選択
    y.special.forEach((sp, i) => { html += specialCard(sp, i); });
    html += actCard();
    html += traitCard();
    if (y.hobby) html += hobbyCard();
    if (G.canAdvance()) html += `<p class="muted small" style="text-align:center;margin:4px 0">今年の選択はおしまい。「🎂 次の誕生日へ」で1年が経ちます。<br>恋人探しや仕事・ペットは「🧭 人生の選択」から。</p>`;
    $('#tab-year').innerHTML = html;
    bindYear();
  }
  function doneCard(title, res) { return `<div class="card done"><div class="card-h"><h3>${title}</h3><span class="res">✔ ${esc(res)}</span></div></div>`; }

  function actCard() {
    const c = G.S.yr.act;
    if (c.done) return doneCard('🎯 今年の行動', c.result);
    const opts = c.opts.map((o, k) => {
      const a = G.actionDef(o.i);
      const tags = (o.low ? '<span class="chip low">⬇ いちばん低いステータス</span>' : '') + (o.high ? '<span class="chip high">⬆ 得意をのばす</span>' : '');
      const ok = G.canPay(o.cost);
      return `<button class="opt" type="button" data-act="${k}" ${ok ? '' : 'disabled'}><span class="oe">${a.e}</span><span><span class="on">${esc(a.n)}</span><span class="os">${fxChips(a.fx)}${tags}</span></span><span class="or">${o.cost ? `<b>${yen(o.cost)}</b>${ok ? '' : 'お金が足りない'}` : '<b>無料</b>'}</span></button>`;
    }).join('');
    return `<div class="card"><div class="card-h"><h3>🎯 今年の行動</h3><span class="tag">ステータスを育てる</span></div><div class="opts">${opts}</div></div>`;
  }
  function traitCard() {
    const S = G.S, c = S.yr.trait;
    if (c.done) return doneCard('🧬 性格のタネ', c.result);
    const opts = c.opts.map((o, k) => {
      const t = H.TRAIT[o.id];
      const pts = S.traits.pts[o.id] || 0;
      const got = S.traits.has.includes(o.id);
      const need = H.TRAIT_NEED[t.stage];
      return `<button class="opt" type="button" data-trait="${k}"><span class="oe">${t.e}</span><span><span class="on">${esc(o.text)}</span><span class="os"><span class="chip ${got ? 'got' : ''}">${t.e} ${t.name}${got ? '（持っている）' : ` ${pts}/${need}pt`}</span></span></span><span class="or"></span></button>`;
    }).join('');
    const stage = S.me.age <= 5 ? '0〜5歳：1つだけ芽生える' : S.me.age <= 11 ? '6〜11歳：3つまで' : '12歳〜：5つまで';
    return `<div class="card"><div class="card-h"><h3>🧬 性格のタネ</h3><span class="tag">${stage}</span></div><p class="note">どんなふうに過ごした？ 同じ方向を選び続けると、その性格が芽生えます。</p><div class="opts">${opts}</div></div>`;
  }
  function hobbyCard() {
    const S = G.S, c = S.yr.hobby;
    if (c.done) return doneCard('🎨 趣味の時間', c.result);
    const opts = S.hobbies.map(h => {
      const d = H.HOBBY[h.id];
      const lv = G.hobbyLevel(G.hp(h.id));
      return `<button class="opt" type="button" data-hob="${h.id}"><span class="oe">${d.e}</span><span><span class="on">${d.n}を楽しむ${h.club ? `<span class="muted small">（${G.clubWord(S.school ? S.school.stage : 'elem')}）</span>` : ''}</span><span class="os">${fxChips(d.fx)}<span class="chip">Lv.${lv.lv}・${G.hp(h.id)}pt</span></span></span><span class="or">+1pt</span></button>`;
    }).join('') + `<button class="opt" type="button" data-hob="none"><span class="oe">☁️</span><span><span class="on">どれも楽しまない</span></span><span class="or"></span></button>`;
    return `<div class="card"><div class="card-h"><h3>🎨 趣味の時間</h3><span class="tag">楽しむとスキルが育つ</span></div><div class="opts">${opts}</div></div>`;
  }

  // ---------------- 大事な選択カード
  function schoolOptHtml(o) {
    const lock = o.lock ? `<span class="chip lock">🔒 ${esc(o.lock)}</span>` : '';
    const feeTxt = o.fee ? `年${yen(o.fee)}` : (o.free ? '授業料免除' : '無料');
    return `<button class="opt ${o.lock ? 'locked' : ''}" type="button" data-school='${esc(JSON.stringify({ stage: o.stage, tier: o.tier, track: o.track, fac: o.fac, esc: !!o.esc, name: o.name, fee: o.fee }))}' ${o.lock ? 'disabled' : ''}>
      <span class="oe">${o.esc ? '🛗' : ['🏰', '🏫', '🏠'][o.tier]}</span>
      <span><span class="on">${esc(o.name)}</span><span class="os"><span class="chip">${feeTxt}</span>${lock}</span></span>
      <span class="or"><b>${o.rate}%</b>合格率</span></button>`;
  }
  function specialCard(sp, i) {
    const S = G.S;
    const titles = { kinder: '🧸 幼稚園・保育園', care: '🤲 だれに見てもらう？', school: '🏫 進学先を選ぶ', club: '🎽 クラブ・部活・サークル', uni: '🎓 大学受験', grad: '🎓 大学院へ進む？', career: '💼 これからの進路', work12: '🧺 これからの暮らし', sick: '🤒 病気になった', scout: '🌟 スカウトされた！', proposal: '💐 プロポーズされた！', abroad: '✈️ 留学', abroadEnd: '🌍 卒業後はどこで暮らす？', retire: '🌅 65歳、これからの働き方' };
    let title = titles[sp.type] || '大事な選択';
    if (sp.type === 'school') title = `🏫 ${H.STAGES[sp.stage].n}を選ぶ`;
    if (sp.type === 'club') title = `🎽 ${G.clubWord(sp.stage)}を選ぶ`;
    if (sp.done) return doneCard(title, sp.result || '決定');
    let body = '';
    switch (sp.type) {
      case 'kinder': {
        body = `<p class="note">選んだところに通えなかったときは、その下の段の合格率で判定します。⭐の数（家庭の階級）で通いやすさが変わります。</p><div class="opts">${G.schoolOptions('kinder').map(schoolOptHtml).join('')}</div>`;
        break;
      }
      case 'school': {
        const opts = G.schoolOptions(sp.stage);
        const st = H.STAGES[sp.stage];
        let lists;
        if (sp.stage === 'high') {
          const by = {};
          opts.forEach(o => { const k = o.esc ? 'esc' : o.track; (by[k] = by[k] || []).push(o); });
          lists = Object.keys(by).map(k => `<div class="muted small" style="font-weight:700">${k === 'esc' ? '内部進学' : H.HS_TRACKS[k].n}</div><div class="opts">${by[k].map(schoolOptHtml).join('')}</div>`).join('');
        } else lists = `<div class="opts">${opts.map(schoolOptHtml).join('')}</div>`;
        const iq = st.iq ? `知性${st.iq[0]}以上で+5%、${st.iq[1]}以上で+10%。知性${st.free}以上なら授業料免除。` : '';
        body = `<p class="note">受験する学校を選んでください。不合格なら下の段の学校で判定します。${iq}${sp.stage === 'high' ? 'スポーツ科はスポーツ系の趣味が必要（5pt以上で+10%）。' : ''}</p>${lists}
          ${sp.stage !== 'elem' ? `<div class="btn-row"><button class="btn ghost sm" type="button" data-skip="${sp.stage}">進学しない</button></div>` : ''}`;
        break;
      }
      case 'uni': {
        const facs = Object.keys(H.FACULTIES);
        if (!uniFac || G.facultyOk(uniFac)) uniFac = facs.find(f => !G.facultyOk(f)) || null;
        const chips = facs.map(f => { const lock = G.facultyOk(f); return `<button class="fac ${uniFac === f ? 'on' : ''}" type="button" data-fac="${f}" ${lock ? 'disabled' : ''} title="${esc(lock || '')}">${H.FACULTIES[f].n}${H.FACULTIES[f].years === 6 ? '（6年）' : ''}</button>`; }).join('');
        const locked = facs.filter(f => G.facultyOk(f)).map(f => `${H.FACULTIES[f].n}：${G.facultyOk(f)}`).join(' / ');
        body = `<p class="note">学部を選んでから、受験する大学を選びます。知性70以上で+5%、90以上で+10%。知性95以上なら授業料免除。</p>
          <div class="fac-grid">${chips}</div>
          ${uniFac ? `<div class="opts">${G.schoolOptions('uni', uniFac).map(schoolOptHtml).join('')}</div>` : '<p class="note">進める学部がありません。</p>'}
          ${locked ? `<details class="more"><summary>進めない学部の理由</summary><p class="note">${esc(locked)}</p></details>` : ''}
          <div class="btn-row"><button class="btn ghost sm" type="button" data-skip="uni">大学には行かない</button></div>`;
        break;
      }
      case 'grad': {
        const fac = S.edu.uni.fac;
        body = `<p class="note">${H.FACULTIES[fac].n}を卒業しました。大学院（${H.FACULTIES[fac].grad.years}年）に進むと、${{ law: '弁護士・裁判官', med: '医者・歯医者', pharm: '薬剤師・薬学研究者' }[fac]}を目指せます。</p><div class="opts">${G.schoolOptions('grad', fac).map(schoolOptHtml).join('')}</div><div class="btn-row"><button class="btn ghost sm" type="button" data-skip="grad">大学院には行かず働く</button></div>`;
        break;
      }
      case 'care': {
        const ps = G.parentsAlive();
        body = `<p class="note">幼稚園・保育園には通えなかった…。小学校に入るまで、だれに見てもらう？</p><div class="opts">${H.CARE.map(c => {
          const need = c.half ? ps.find(p => (c.half === 'mom' ? p.rel === '母' : p.rel === '父') && p.sal > 0) : true;
          const extra = c.half ? '<span class="chip lock">その親の収入が半分に</span>' : '';
          return `<button class="opt" type="button" data-care="${c.id}" ${need ? '' : 'disabled'}><span class="oe">${c.e}</span><span><span class="on">${c.n}</span><span class="os">${fxChips(c.fx)}${extra}</span></span><span class="or"></span></button>`;
        }).join('')}</div>`;
        break;
      }
      case 'club': {
        const w = G.clubWord(sp.stage);
        const cur = S.hobbies.map(h => H.HOBBY[h.id].n);
        const opts = H.HOBBIES.filter(h => h.club).map(h => {
          const owned = S.hobbies.some(x => x.id === h.id);
          const full = !owned && S.hobbies.length >= 3;
          return `<button class="opt" type="button" data-club="${h.id}" ${full ? 'disabled' : ''}><span class="oe">${h.e}</span><span><span class="on">${h.n}${w}</span><span class="os">${fxChips(h.fx)}${owned ? '<span class="chip got">趣味から続ける</span>' : ''}<span class="chip">${G.hp(h.id)}pt</span></span></span><span class="or"></span></button>`;
        }).join('');
        body = `<p class="note">入った${w}は「趣味」として毎年楽しめます（趣味は${w}を含めて3つまで${cur.length ? `／今の趣味：${esc(cur.join('・'))}` : ''}）。</p>
          <div class="opts">${opts}<button class="opt" type="button" data-club="none"><span class="oe">${H.NOCLUB.e}</span><span><span class="on">${sp.stage === 'uni' ? 'サークルに入らない' : '帰宅' + w}</span><span class="os">${fxChips(H.NOCLUB.fx)}<span class="chip">毎年</span>${sp.stage === 'elem' ? '<span class="chip">ほかの趣味を探せる</span>' : ''}</span></span><span class="or"></span></button></div>`;
        break;
      }
      case 'career': {
        body = `<p class="note">${sp.ronin ? '大学には合格できなかった…。' : ''}働き先を探しますか？ 応募は1年に3回まで（残り${3 - S.yr.jobTries}回）。</p>${jobList(true)}
          <div class="btn-row">${sp.ronin && S.me.age < 22 ? '<button class="btn ghost sm" type="button" data-cskip="ronin">📚 浪人して来年もう一度</button>' : ''}<button class="btn ghost sm" type="button" data-cskip="none">今は働かない</button></div>`;
        break;
      }
      case 'work12': {
        const opts = G.work12Opts(sp);
        body = `<p class="note">12歳になった。これからどうやって暮らしていく？</p><div class="opts">${opts.map((o, k) => {
          if (o.kind === 'helper') return `<button class="opt" type="button" data-w12="${k}"><span class="oe">🧺</span><span><span class="on">家族の仕事を手伝う</span><span class="os"><span class="chip">親の収入の1/5</span></span></span><span class="or"></span></button>`;
          const j = H.JOB[o.id]; const c = o.country ? H.countryMap[o.country] : null;
          const sal = Math.round(j.start * 10000 * Math.max(0.05, (c || H.countryMap[S.me.live]).ppp));
          return `<button class="opt" type="button" data-w12="${k}"><span class="oe">${c ? c.flag : j.e}</span><span><span class="on">${c ? `${c.name}へ出稼ぎ：` : ''}${j.n}</span><span class="os"><span class="chip">月${yen(sal)}</span>${c ? '<span class="chip lock">国を出て暮らす</span>' : ''}</span></span><span class="or"></span></button>`;
        }).join('')}</div>`;
        break;
      }
      case 'sick': {
        const s = S.sick;
        if (!s) return '';
        const sev = ['', '軽い', '中くらい', '重い'][s.sev];
        const ok = G.canPay(s.cost);
        body = `<p class="note">${esc(s.n)}（${sev}病気）。放っておくと健康が下がり、病気を放置するたびに「健康なときの長生きボーナス」が減っていきます${S.neglect ? `（これまでに${S.neglect}回放置）` : ''}。</p>
          <div class="opts"><button class="opt" type="button" data-sick="treat" ${ok ? '' : 'disabled'}><span class="oe">🏥</span><span><span class="on">病院で治療する</span><span class="os"><span class="chip">${S.indep ? '自分の貯金から' : '家の貯金から'}</span></span></span><span class="or"><b>${yen(s.cost)}</b>${ok ? '' : 'お金が足りない'}</span></button>
          <button class="opt" type="button" data-sick="wait"><span class="oe">🛏️</span><span><span class="on">様子を見る（放置）</span><span class="os"><span class="chip lock">悪化するかも</span></span></span><span class="or">無料</span></button></div>`;
        break;
      }
      case 'scout': {
        const j = H.JOB[sp.job];
        body = `<p class="note">街を歩いていたら、芸能事務所の人に声をかけられた！「${S.me.gender === 'f' && j.nf ? j.nf : j.n}としてデビューしませんか？」${G.isStudent() ? '（学校に通いながら活動できます）' : ''}</p>
          <div class="btn-row"><button class="btn primary" type="button" data-scout="1">${j.e} 挑戦してみる（月${yen(G.price(j.start * 10000))}〜）</button><button class="btn ghost" type="button" data-scout="0">お断りする</button></div>`;
        break;
      }
      case 'proposal': {
        const p = G.lover();
        if (!p) return '';
        body = `<p class="note">${esc(p.first)}（${p.age}歳・${esc(p.job)}）から「結婚してください」と言われた！</p><div class="btn-row"><button class="btn primary" type="button" data-prop="1">💍 はい、よろこんで</button><button class="btn ghost" type="button" data-prop="0">ごめんなさい</button></div>`;
        break;
      }
      case 'abroad': {
        if (S.abroad) {
          const c = H.countryMap[S.abroad.to];
          body = `<p class="note">${c.flag} ${c.name}での留学生活。このまま続ける？</p><div class="btn-row"><button class="btn primary" type="button" data-ab="stay">📚 留学を続ける</button><button class="btn ghost" type="button" data-ab="back">🏡 帰ってくる（☺️+10）</button></div>`;
        } else if (sp.phase === 'pick') {
          body = `<p class="note">留学の選考に通った！ どこへ行く？（最初の留学は☺️-10）</p><div class="opts">${sp.countries.map(c => { const C = H.countryMap[c]; return `<button class="opt" type="button" data-abgo="${c}"><span class="oe">${C.flag}</span><span><span class="on">${C.name}</span><span class="os"><span class="chip">${esc(C.cities.slice(0, 2).join('・'))}</span></span></span><span class="or"></span></button>`; }).join('')}</div>`;
        } else {
          body = `<p class="note">今年は留学に挑戦する？ 行ける確率は家庭の階級・学校・知性で決まります。</p><div class="btn-row"><button class="btn primary" type="button" data-ab="try">✈️ 留学に挑戦（${G.abroadRate()}%）</button><button class="btn ghost" type="button" data-ab="no">留学しない（☺️+10）</button></div>`;
        }
        break;
      }
      case 'abroadEnd': {
        const c = H.countryMap[S.me.live], home = H.countryMap[S.abroad.home];
        body = `<p class="note">${c.flag} ${c.name}の学校を卒業した。このあとはどこで暮らす？</p><div class="btn-row"><button class="btn primary" type="button" data-abend="stay">${c.flag} ${c.name}に残る（☺️-10）</button><button class="btn ghost" type="button" data-abend="back">${home.flag} ${home.name}に帰る（☺️+10）</button></div>`;
        break;
      }
      case 'retire': {
        body = `<p class="note">65歳になった。${esc(S.job ? S.job.n : '')}の仕事はどうする？（70歳で全員引退します）</p><div class="btn-row"><button class="btn primary" type="button" data-ret="retire">🌅 引退する</button><button class="btn ghost" type="button" data-ret="part">⏳ 短時間で続ける（給料半分）</button><button class="btn ghost" type="button" data-ret="keep">💪 このまま続ける</button></div>`;
        break;
      }
    }
    return `<div class="card must" data-sp="${i}"><div class="card-h"><h3>${title}</h3><span class="tag">❗ 大事な選択</span></div>${body}</div>`;
  }
  function jobList(inCard) {
    const S = G.S;
    const all = G.jobOptions();
    const ok = all.filter(j => !j.lock && !j.cur);
    const ng = all.filter(j => j.lock && !j.cur);
    const row = j => `<button class="opt ${j.lock ? 'locked' : ''}" type="button" data-job="${j.id}" ${j.lock || S.yr.jobTries >= 3 ? 'disabled' : ''}>
      <span class="oe">${j.e}</span><span><span class="on">${esc(j.n)}</span><span class="os"><span class="chip">月${yen(j.sal)}〜</span><span class="chip">${{ low: '給料は上がりにくい', normal: '給料の上がり：ふつう', high: '給料が上がりやすい', volatile: '給料の波が大きい' }[j.grow]}</span>${j.lock ? `<span class="chip lock">🔒 ${esc(j.lock)}</span>` : ''}</span></span>
      <span class="or">${j.lock ? '' : `<b>${j.rate}%</b>採用率`}</span></button>`;
    return `<div class="opts">${ok.map(row).join('') || '<p class="note">今の条件で応募できる仕事はありません。</p>'}</div>
      <details class="more"><summary>条件を満たしていない仕事（${ng.length}）</summary><div class="opts">${ng.map(row).join('')}</div></details>
      <p class="note">🎬 俳優・女優、📸 モデル、🌟 アイドルは、外見80以上でスカウトされたときだけなれます。</p>`;
  }

  function bindYear() {
    const box = $('#tab-year');
    box.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const r = G.doAction(+b.dataset.act); if (r && !r.ok) toast(r.msg); });
    box.querySelectorAll('[data-trait]').forEach(b => b.onclick = () => G.chooseTrait(+b.dataset.trait));
    box.querySelectorAll('[data-hob]').forEach(b => b.onclick = () => G.enjoyHobby(b.dataset.hob));
    box.querySelectorAll('[data-school]').forEach(b => b.onclick = () => {
      const o = JSON.parse(b.dataset.school);
      const r = G.trySchool(o);
      toast(r && r.ok ? `🌸 ${r.name}へ！` : '📮 残念、通えなかった…');
    });
    box.querySelectorAll('[data-skip]').forEach(b => b.onclick = () => G.skipSchool(b.dataset.skip));
    box.querySelectorAll('[data-fac]').forEach(b => b.onclick = () => { uniFac = b.dataset.fac; render(); });
    box.querySelectorAll('[data-care]').forEach(b => b.onclick = () => G.careChoice(b.dataset.care));
    box.querySelectorAll('[data-club]').forEach(b => b.onclick = () => { const r = G.joinClub(b.dataset.club); if (r && !r.ok) toast(r.msg); });
    box.querySelectorAll('[data-job]').forEach(b => b.onclick = () => { const r = G.tryJob(b.dataset.job); toast(r && r.msg); });
    box.querySelectorAll('[data-cskip]').forEach(b => b.onclick = () => G.careerSkip(b.dataset.cskip));
    box.querySelectorAll('[data-w12]').forEach(b => b.onclick = () => { const sp = G.S.yr.special.find(x => x.type === 'work12' && !x.done); G.work12(sp.opts[+b.dataset.w12]); });
    box.querySelectorAll('[data-sick]').forEach(b => b.onclick = () => G.treat(b.dataset.sick));
    box.querySelectorAll('[data-scout]').forEach(b => b.onclick = () => G.scout(b.dataset.scout === '1'));
    box.querySelectorAll('[data-prop]').forEach(b => b.onclick = () => G.answerProposal(b.dataset.prop === '1'));
    box.querySelectorAll('[data-ab]').forEach(b => b.onclick = () => { G.abroadDecide(b.dataset.ab); const sp = G.S.yr.special.find(x => x.type === 'abroad'); if (sp && sp.result) toast(sp.result); });
    box.querySelectorAll('[data-abgo]').forEach(b => b.onclick = () => G.abroadDecide('go', b.dataset.abgo));
    box.querySelectorAll('[data-abend]').forEach(b => b.onclick = () => G.abroadEnd(b.dataset.abend));
    box.querySelectorAll('[data-ret]').forEach(b => b.onclick = () => G.retire(b.dataset.ret));
  }

  // =============================================================
  // 人生の選択タブ
  // =============================================================
  function sec(title, when, on, inner) {
    return `<section class="sec ${on ? '' : 'off'}"><div class="sec-h"><h3>${title}</h3><span class="when">${when}</span></div>${on ? inner : '<p class="note">まだ選べません。</p>'}</section>`;
  }
  function renderLife() {
    const S = G.S, a = S.me.age;
    let html = '';
    // クラブ
    const st = S.school ? S.school.stage : null;
    const clubOn = a >= 6 && G.isStudent() && st !== 'grad';
    let clubHtml = '';
    if (clubOn) {
      const w = G.clubWord(st);
      const c = G.club();
      if (c) clubHtml = `<div class="cur"><span>${H.HOBBY[c.id].e} ${H.HOBBY[c.id].n}${w}に所属中</span><button class="btn ghost sm danger" type="button" data-quitclub="1">退部する</button></div>`;
      else {
        clubHtml = `<div class="cur"><span>${S.noClub ? `${H.NOCLUB.e} ${st === 'uni' ? 'サークルに入っていない' : '帰宅' + w}` : 'まだ決めていない'}</span></div>
          <details class="more"><summary>${w}に入る</summary><div class="opts">${H.HOBBIES.filter(h => h.club).map(h => {
          const owned = S.hobbies.some(x => x.id === h.id); const full = !owned && S.hobbies.length >= 3;
          return `<button class="opt" type="button" data-joinclub="${h.id}" ${full ? 'disabled' : ''}><span class="oe">${h.e}</span><span><span class="on">${h.n}${w}</span><span class="os">${fxChips(h.fx)}${full ? '<span class="chip lock">趣味が3つでいっぱい</span>' : ''}</span></span><span class="or"></span></button>`;
        }).join('')}</div></details>`;
      }
    }
    html += sec('🎽 クラブ・部活・サークル', '6歳〜・学生のあいだ', clubOn, clubHtml);
    // 趣味
    const hobOn = G.canFindHobby();
    let hobHtml = '';
    if (hobOn || S.hobbies.length) {
      hobHtml = S.hobbies.map(h => { const d = H.HOBBY[h.id]; const lv = G.hobbyLevel(G.hp(h.id)); return `<div class="cur"><span>${d.e} ${d.n}${h.club ? '（クラブ）' : ''}　<span class="muted small">Lv.${lv.lv}・${G.hp(h.id)}pt</span></span>${h.club ? '' : `<button class="btn ghost sm" type="button" data-drophob="${h.id}">やめる</button>`}</div>`; }).join('');
      if (hobOn) {
        const pool = H.HOBBIES.filter(h => !S.hobbies.some(x => x.id === h.id) && (a >= 12 || h.cat === 'other'));
        hobHtml += `<details class="more" ${S.hobbies.length ? '' : 'open'}><summary>新しい趣味を見つける（${S.hobbies.length}/3）</summary><div class="opts">${pool.map(h => `<button class="opt" type="button" data-findhob="${h.id}" ${S.hobbies.length >= 3 ? 'disabled' : ''}><span class="oe">${h.e}</span><span><span class="on">${h.n}</span><span class="os">${fxChips(h.fx)}${G.hp(h.id) ? `<span class="chip">${G.hp(h.id)}pt</span>` : ''}</span></span><span class="or"></span></button>`).join('')}</div></details>`;
      }
    }
    html += sec('🎨 趣味', '12歳〜（帰宅部なら6歳〜）', hobOn || S.hobbies.length > 0, hobHtml);
    // 仕事
    const jobOn = a >= 10 && a <= 70;
    let jobHtml = '';
    if (jobOn) {
      if (S.job) jobHtml += `<div class="cur"><span>${S.job.e} ${esc(S.job.n)}・月${yen(S.job.sal)}${S.job.part ? '（パート：半分）' : ''}</span><span class="btn-row">${S.job.id !== 'helper' ? `<button class="btn ghost sm" type="button" data-part="1">${S.job.part ? 'フルタイムに戻す' : 'パート雇用に変更'}</button>` : ''}<button class="btn ghost sm danger" type="button" data-quitjob="1">仕事を辞める</button></span></div>`;
      if (G.isStudent()) jobHtml += `<p class="note">⚠️ 学生のうちに仕事に就くと、学校を退学することになります。</p>`;
      jobHtml += `<details class="more"><summary>${S.job ? '転職先を探す' : '仕事を探す'}（今年の応募 残り${3 - S.yr.jobTries}回）</summary>${jobList(false)}</details>`;
    }
    html += sec('💼 仕事', '10〜70歳', jobOn, jobHtml);
    // 恋愛
    const loveOn = a >= 10;
    let loveHtml = '';
    if (loveOn) {
      const p = S.fam.partner;
      if (p && p.alive) {
        const isSp = p.status === 'spouse';
        const conf = G.conflictsWith(p);
        loveHtml += `<div class="cur"><span>${isSp ? '💍 配偶者' : '💕 恋人'}：${H.countryMap[p.country].flag} ${esc(G.fullName(p))}（${p.age}歳・${esc(p.job)}）</span></div>
          <p class="note">相手の性格：${p.traits.map(t => H.TRAIT[t].e + H.TRAIT[t].name).join('・')}${conf ? `　<b style="color:var(--warn)">相反する性格 ${conf}つ</b>（別れやすさ +${conf * 10}%）` : ''}</p>
          <div class="btn-row">${!isSp ? `<button class="btn primary sm" type="button" data-propose="1" ${a < 18 || S.yr.propose ? 'disabled' : ''}>💍 プロポーズする（${G.marryRate()}%）</button>` : ''}<button class="btn ghost sm danger" type="button" data-break="1">${isSp ? '離婚する' : '別れる'}</button></div>
          ${a < 18 && !isSp ? '<p class="note">結婚は18歳から。</p>' : ''}`;
      } else {
        loveHtml += `<div class="cur"><span>いまはひとり</span><button class="btn primary sm" type="button" data-findlove="1" ${S.yr.love ? 'disabled' : ''}>💕 恋人・結婚相手を探す（${G.loveRate()}%）</button></div>`;
      }
      loveHtml += `<div class="btn-row" style="align-items:center"><span class="muted small">好きになる相手</span><span class="seg">${[['opp', '異性'], ['same', '同性'], ['any', 'どちらも']].map(([v, n]) => `<button type="button" data-pref="${v}" class="${S.love.pref === v ? 'on' : ''}">${n}</button>`).join('')}</span>
        <span class="muted small">子ども</span><span class="seg"><button type="button" data-kids="1" class="${S.love.wantKids ? 'on' : ''}">望む</button><button type="button" data-kids="0" class="${!S.love.wantKids ? 'on' : ''}">望まない</button></span></div>
        <p class="note">${H.countryMap[S.me.live].name}の平均初婚年齢は${H.countryMap[S.me.live].fm}歳。近づくほど恋も結婚もしやすくなります。</p>`;
    }
    html += sec('💕 恋愛・結婚', '10歳〜', loveOn, loveHtml);
    // ペット
    const petOn = a >= 10;
    let petHtml = '';
    if (petOn) {
      petHtml += S.pets.map(p => { const t = H.PETS.find(x => x.id === p.type); return `<div class="cur"><span>${t.e} ${esc(p.name)}（${p.age}歳）</span><span class="muted small">年${yen(G.price(t.cost))}</span></div>`; }).join('');
      petHtml += `<details class="more" ${S.pets.length ? '' : 'open'}><summary>ペットを迎える（${S.pets.length}/3）${!S.indep ? '・費用は家族の貯金から' : ''}</summary><div class="opts">${H.PETS.map(t => `<button class="opt" type="button" data-pet="${t.id}" ${S.pets.length >= 3 || S.yr.pet ? 'disabled' : ''}><span class="oe">${t.e}</span><span><span class="on">${t.n}</span><span class="os"><span class="chip">寿命 ${t.life[0]}〜${t.life[1]}年</span></span></span><span class="or"><b>${yen(G.price(t.cost))}</b>/年</span></button>`).join('')}</div></details>`;
    }
    html += sec('🐾 ペットを迎える', '10歳〜', petOn, petHtml);
    // 家
    const houseOn = a >= 15 && a <= 70 && !G.isStudent() && !(S.school && S.school.stage === 'grad');
    let houseHtml = '';
    if (houseOn) {
      houseHtml = `${S.house != null ? `<div class="cur"><span>${H.HOUSES[S.house].e} いまは${H.HOUSES[S.house].n}に住んでいる</span></div>` : ''}<div class="opts">${H.HOUSES.map((h, i) => { const c = G.price(h.cost); const ok = G.canPay(c); return `<button class="opt" type="button" data-house="${i}" ${ok && !S.yr.house && S.house !== i ? '' : 'disabled'}><span class="oe">${h.e}</span><span><span class="on">${h.n}</span><span class="os"><span class="chip">☺️+${h.happy}</span><span class="chip">毎年☺️+1</span></span></span><span class="or"><b>${yen(c)}</b>${ok ? '' : 'お金が足りない'}</span></button>`; }).join('')}</div><p class="note">いまの貯金：${yen(G.wallet())}</p>`;
    }
    html += sec('🏡 マイホームを建てる', '15〜70歳・学生以外', houseOn, houseHtml);
    $('#tab-life').innerHTML = html;
    bindLife();
  }
  function bindLife() {
    const box = $('#tab-life');
    const q = (s, f) => box.querySelectorAll(s).forEach(b => b.onclick = () => f(b));
    q('[data-joinclub]', b => { const r = G.joinClub(b.dataset.joinclub); toast(r && r.msg); });
    q('[data-quitclub]', () => confirmBox('退部する？', '今のクラブ・部活・サークルをやめます。これまでのポイントは残ります。', '退部する', () => G.quitClub()));
    q('[data-drophob]', b => G.dropHobby(b.dataset.drophob));
    q('[data-findhob]', b => { const r = G.findHobby(b.dataset.findhob); toast(r && r.msg); });
    q('[data-part]', () => G.togglePart());
    q('[data-quitjob]', () => confirmBox('仕事を辞める？', `${esc(G.S.job.n)}の仕事を辞めます。`, '辞める', () => G.quitJob()));
    q('[data-job]', b => {
      const go = () => { const r = G.tryJob(b.dataset.job); toast(r && r.msg); };
      if (G.isStudent()) confirmBox('学校を辞めて働く？', `${esc(G.S.school.name)}を退学して、仕事に応募します。`, '退学して応募する', go); else go();
    });
    q('[data-findlove]', () => { const r = G.findLove(); toast(r && r.msg); });
    q('[data-propose]', () => { const r = G.propose(); toast(r && r.msg); });
    q('[data-break]', () => { const p = G.S.fam.partner; const sp = p.status === 'spouse'; confirmBox(sp ? '離婚する？' : '別れる？', `${esc(p.first)}と${sp ? '離婚' : 'お別れ'}します。`, sp ? '離婚する' : '別れる', () => G.breakUp()); });
    q('[data-pref]', b => G.setPref(b.dataset.pref));
    q('[data-kids]', b => G.setWantKids(b.dataset.kids === '1'));
    q('[data-pet]', b => { const r = G.adoptPet(b.dataset.pet); toast(r && r.msg); });
    q('[data-house]', b => { const h = H.HOUSES[+b.dataset.house]; confirmBox(`${h.n}を建てる？`, `${yen(G.price(h.cost))}を支払います。`, '建てる', () => { const r = G.buyHouse(+b.dataset.house); toast(r && r.msg); }); });
  }

  // =============================================================
  // 家族タブ
  // =============================================================
  function personCard(p, rel, opt) {
    opt = opt || {};
    const c = H.countryMap[p.country] || H.countryMap[G.S.me.live];
    const alive = p.alive !== false;
    const income = p.sal ? `年収 ${yen(p.sal * 12)}` : '年収 0円';
    return `<div class="person ${alive ? '' : 'gone'}">
      <div class="ph"><b>${c ? c.flag : ''} ${esc(p.last ? G.fullName(p) : p.first)}</b><span class="rel">${esc(rel)}</span></div>
      <div>${alive ? `${p.age}歳` : `${p.deathAge}歳で他界`}・${p.gender === 'f' ? '女性' : '男性'}</div>
      ${p.job != null ? `<div>🧳 ${esc(p.job)}　<span class="muted small">${income}</span></div>` : ''}
      ${p.traits && p.traits.length ? `<div class="chips">${p.traits.map(t => `<span class="chip">${H.TRAIT[t].e}${H.TRAIT[t].name}</span>`).join('')}</div>` : ''}
      ${p.items && p.items.length ? `<div class="small muted">持ち物：${p.items.map(esc).join('・')}</div>` : ''}
      ${opt.extra || ''}
    </div>`;
  }
  function renderFam() {
    const S = G.S, i = G.info();
    let html = '<h3 class="fam-h">🙋 自分</h3><div class="people">';
    html += `<div class="person"><div class="ph"><b>${i.country.flag} ${esc(i.name)}</b><span class="rel">本人</span></div><div>${i.age}歳・${genderLabel(i.gender, i.age)}・${stars(i.cls)}</div><div>🧳 ${esc(i.job)}　<span class="muted small">年収 ${yen(i.income)}</span></div><div>🎓 ${esc(i.edu)}</div>
      <div class="chips">${S.traits.has.map(t => `<span class="chip got">${H.TRAIT[t].e}${H.TRAIT[t].name}</span>`).join('') || '<span class="muted small">性格はまだ芽生えていない</span>'}</div></div></div>`;
    html += '<h3 class="fam-h">👨‍👩 親</h3><div class="people">' + personCard(S.fam.dad, '父') + personCard(S.fam.mom, '母') + '</div>';
    const p = S.fam.partner;
    if (p || S.fam.exes.length) {
      html += '<h3 class="fam-h">💑 パートナー</h3><div class="people">';
      if (p) html += personCard(p, p.status === 'spouse' ? (p.gender === 'f' ? '妻' : '夫') : '恋人', { extra: `<div class="small muted">${p.status === 'spouse' ? `${p.marriedAt}歳で結婚` : `${p.since}歳から交際`}</div>` });
      S.fam.exes.slice(-4).reverse().forEach(x => { html += personCard(x, { 'ex-spouse': '元配偶者', ex: '元恋人', 'late-spouse': '亡き配偶者', late: '亡き恋人' }[x.status] || '元恋人'); });
      html += '</div>';
    }
    if (S.fam.kids.length) {
      html += '<h3 class="fam-h">👶 子ども</h3><div class="people">' + S.fam.kids.map(k => personCard(k, k.rel, { extra: k.spouse ? `<div class="small">💍 ${esc(k.spouse)}と結婚</div>` : '' })).join('') + '</div>';
    }
    const gks = G.grandkids();
    if (gks.length) {
      html += '<h3 class="fam-h">🍼 孫</h3><div class="people">' + gks.map(g => `<div class="person"><div class="ph"><b>${esc(g.first)}</b><span class="rel">${g.gender === 'f' ? '孫娘' : '孫息子'}</span></div><div>${g.age}歳・${esc(g.parent)}の子</div></div>`).join('') + '</div>';
    }
    if (!p && !S.fam.kids.length) html += '<p class="muted small" style="margin:4px">恋人や結婚相手、子どもができるとここに表示されます。</p>';
    $('#tab-fam').innerHTML = html;
  }

  // =============================================================
  // わたしタブ（性格・趣味・ペット）
  // =============================================================
  function renderMe() {
    const S = G.S;
    const stageInfo = { 1: '0〜5歳の性格（1つ）', 2: '6〜11歳の性格（3つ）', 3: '12歳〜の性格（5つ）' };
    let html = '<section class="sec"><div class="sec-h"><h3>🧬 性格</h3></div>';
    [1, 2, 3].forEach(st => {
      const all = H.TRAITS.filter(t => t.stage === st);
      const got = all.filter(t => S.traits.has.includes(t.id));
      const grow = all.filter(t => !S.traits.has.includes(t.id) && (S.traits.pts[t.id] || 0) > 0).sort((a, b) => (S.traits.pts[b.id] || 0) - (S.traits.pts[a.id] || 0)).slice(0, 8);
      html += `<div class="trait-stage"><h4>${stageInfo[st]}　${got.length}/${H.TRAIT_LIMIT[st]}</h4><div class="tchips">${got.map(t => `<span class="tchip got" title="${esc(t.desc)}">${t.e} ${t.name}</span>`).join('')}${grow.map(t => `<span class="tchip">${t.e} ${t.name}<small>${S.traits.pts[t.id]}/${H.TRAIT_NEED[st]}</small></span>`).join('')}${!got.length && !grow.length ? '<span class="muted small">まだなし</span>' : ''}</div></div>`;
    });
    html += `<p class="note">${S.traits.has.map(id => H.TRAIT[id]).filter(t => t.stage === 3 || S.me.age < 12).map(t => `${t.e}${t.name}：${esc(t.desc)}`).join('<br>')}</p></section>`;
    // 趣味スキル
    const pts = Object.keys(S.hp).filter(k => S.hp[k] > 0);
    html += `<section class="sec"><div class="sec-h"><h3>🎨 趣味のスキル</h3><span class="when">Lv.n には n ポイント必要</span></div>${pts.length ? pts.map(id => {
      const d = H.HOBBY[id]; const lv = G.hobbyLevel(S.hp[id]); const act = S.hobbies.some(h => h.id === id);
      return `<div class="hob"><span class="oe">${d.e}</span><span>${d.n}${act ? '' : '<span class="muted small">（お休み中）</span>'}<div class="bar" style="margin-top:4px"><i style="width:${Math.round(lv.rest / lv.need * 100)}%"></i></div></span><span class="num"><b>Lv.${lv.lv}</b> <span class="muted small">${S.hp[id]}pt</span></span></div>`;
    }).join('') : '<p class="note">趣味を楽しむとスキルが育ちます。</p>'}</section>`;
    // ペット
    html += `<section class="sec"><div class="sec-h"><h3>🐾 ペット</h3></div>${S.pets.length ? S.pets.map(p => { const t = H.PETS.find(x => x.id === p.type); return `<div class="cur"><span>${t.e} ${esc(p.name)}</span><span class="muted small">${p.age}歳・${p.since}歳のときに迎えた</span></div>`; }).join('') : '<p class="note">いまはペットがいません。</p>'}${S.petsGone.length ? `<p class="note">🌈 思い出の子：${S.petsGone.map(p => H.PETS.find(x => x.id === p.type).e + esc(p.name)).join('・')}</p>` : ''}</section>`;
    // 健康
    const dr = G.deathRate();
    html += `<section class="sec"><div class="sec-h"><h3>🩺 からだの具合</h3></div><p class="note">${S.sick ? `🤒 ${esc(S.sick.n)}にかかっている${S.sick.treated ? '（治療中）' : ''}` : '😊 いまは元気'}${S.neglect ? `　／　病気を放置した回数：${S.neglect}回` : ''}<br>病気にならない確率：${Math.max(5, Math.min(95, Math.round((S.stats.health * 2 + S.stats.stamina) / 2.5)))}%（健康×2＋体力）÷2.5<br>健康で長生きボーナス：死亡率 -${Math.max(0, 20 - 2 * S.neglect)}%</p></section>`;
    $('#tab-me').innerHTML = html;
    void dr;
  }

  // =============================================================
  // 年表タブ
  // =============================================================
  function renderLog() {
    const S = G.S;
    const html = S.log.slice().reverse().map(y => `<div class="tl-y"><div class="ya">${y.age}<small>歳</small></div><div class="feed">${feedHtml(y.items)}</div></div>`).join('');
    $('#tab-log').innerHTML = `<div class="tl">${html}</div>`;
  }

  // =============================================================
  // エンディング
  // =============================================================
  function renderEnding() {
    const S = G.S;
    const i = G.info();
    const c = i.country;
    const ci = H.classInfo[S.me.cls];
    const phrase = G.lifePhrase();
    const hls = G.highlights();
    const lastJob = S.lastJobId ? (H.JOB[S.lastJobId] ? (S.me.gender === 'f' && H.JOB[S.lastJobId].nf ? H.JOB[S.lastJobId].nf : H.JOB[S.lastJobId].n) : '家業の手伝い') : (S.me.age < 15 ? '—' : 'なし');
    const sp = S.fam.partner && S.fam.partner.status === 'spouse' ? S.fam.partner : S.fam.exes.find(x => x.status === 'late-spouse');
    const fam = [];
    fam.push(`👨 父 ${esc(S.fam.dad.first)}`, `👩 母 ${esc(S.fam.mom.first)}`);
    if (sp) fam.push(`💍 ${esc(sp.first)}`);
    S.fam.kids.forEach(k => fam.push(`${k.gender === 'f' ? '👧' : '👦'} ${esc(k.first)}`));
    const gks = G.grandkids();
    if (gks.length) fam.push(`🍼 孫 ${gks.length}人（${gks.slice(0, 4).map(g => esc(g.first)).join('・')}${gks.length > 4 ? '…' : ''}）`);
    S.pets.concat(S.petsGone).slice(0, 3).forEach(p => fam.push(`${H.PETS.find(x => x.id === p.type).e} ${esc(p.name)}`));
    const traits = S.traits.has.filter(id => H.TRAIT[id].stage === 3).map(id => `${H.TRAIT[id].e}${H.TRAIT[id].name}`);
    const topHob = Object.keys(S.hp).sort((a, b) => S.hp[b] - S.hp[a]).slice(0, 3).filter(id => S.hp[id] > 0).map(id => `${H.HOBBY[id].e}${H.HOBBY[id].n} Lv.${G.hobbyLevel(S.hp[id]).lv}`);
    $('#ending').innerHTML = `
      <div id="end-card" class="end-card">
        <div class="end-brand">Happy <span>Birth</span> Day</div>
        <div class="end-who"><div class="flag">${c.flag}</div><h2>${esc(i.name)}</h2><p>${esc(c.name)}・${esc(S.me.city)}生まれ　${S.me.gender === 'f' ? '女性' : '男性'}　${stars(S.me.cls)} ${ci.name}</p></div>
        <div class="end-phrase">「${esc(phrase)}」</div>
        <div class="end-years"><b>${S.deathAge}</b>歳　${esc(S.cause)}</div>
        <div class="end-sec"><h3>プロフィール</h3><div class="end-grid">
          <div><span>🧳 最後の仕事</span>${esc(lastJob)}</div>
          <div><span>🎓 最終学歴</span>${esc(S.eduFinal)}</div>
          <div><span>💵 いちばん多かった年収</span>${yen(S.peakIncome)}</div>
          <div><span>💰 のこした貯金</span>${yen(S.indep ? S.money.mine : S.money.parents)}</div>
          ${S.me.live !== S.me.country ? `<div><span>🏠 最後に暮らした国</span>${i.live.flag} ${esc(i.live.name)}</div>` : ''}
          ${S.house != null ? `<div><span>🏡 マイホーム</span>${H.HOUSES[S.house].n}</div>` : ''}
          ${traits.length ? `<div style="grid-column:1/-1"><span>🧬 性格</span>${traits.join('・')}</div>` : ''}
          ${topHob.length ? `<div style="grid-column:1/-1"><span>🎨 趣味</span>${topHob.join('・')}</div>` : ''}
        </div></div>
        <div class="end-sec"><h3>家族</h3><div class="end-fam">${fam.map(f => `<span class="chip">${f}</span>`).join('')}</div></div>
        <div class="end-sec"><h3>人生のハイライト</h3><ul class="end-hl">${hls.map(h => `<li><b>${h.age}歳</b><span>${esc(h.t)}</span></li>`).join('')}</ul></div>
      </div>
      <div class="end-actions">
        <button class="btn primary" type="button" id="btn-shot">📸 画像として保存</button>
        <button class="btn ghost" type="button" id="btn-endlog">📜 年表を見る</button>
        <button class="btn ghost" type="button" id="btn-again">🎂 もう一度生まれる</button>
      </div>
      ${/自死/.test(S.cause || '') ? '<p class="end-care">ゲームの中の出来事です。もし現実でつらい気持ちを抱えていたら、ひとりで抱えずに身近な人や相談窓口（厚生労働省「まもろうよ こころ」など）に話してみてください。</p>' : ''}`;
    $('#btn-shot').onclick = snapshot;
    $('#btn-again').onclick = () => { G.clear(); location.hash = ''; G.newLife({}); tab = 'year'; show(); confetti(); };
    $('#btn-endlog').onclick = () => {
      modal(`<h2>📜 ${esc(i.name)}の年表</h2><div class="tl">${S.log.map(y => `<div class="tl-y"><div class="ya">${y.age}<small>歳</small></div><div class="feed">${feedHtml(y.items)}</div></div>`).join('')}</div><div class="btn-row"><button class="btn primary" type="button" data-m="close">閉じる</button></div>`);
      $('#modal-body [data-m="close"]').onclick = closeModal;
    };
  }
  function snapshot() {
    const node = $('#end-card');
    if (!window.html2canvas) { toast('画像の保存機能を読み込めませんでした'); return; }
    const bg = getComputedStyle(document.body).backgroundColor;
    toast('画像を作っています…');
    window.html2canvas(node, { backgroundColor: bg, scale: 2, useCORS: true }).then(canvas => {
      const url = canvas.toDataURL('image/png');
      // ダウンロード（できない環境では下の画像を長押し・右クリックで保存）
      try { const a = document.createElement('a'); a.href = url; a.download = `happy-birth-day-${G.S.me.first}.png`; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* noop */ }
      modal(`<h2>📸 人生の記念写真</h2><p class="small muted">保存できなかったときは、画像を長押し（パソコンは右クリック）して「画像を保存」してください。</p><img src="${url}" alt="人生のまとめ画像"><div class="btn-row"><button class="btn primary" type="button" data-m="close">閉じる</button></div>`);
      $('#modal-body [data-m="close"]').onclick = closeModal;
    }).catch(() => toast('画像を作れませんでした'));
  }

  // =============================================================
  // 起動
  // =============================================================
  function helpHtml() {
    return `<h2>🎂 遊び方</h2>
      <p><b>1年ごとに3つ選ぶ</b>：「🎯 行動」でステータスを育て、「🧬 性格のタネ」で性格を、「🎨 趣味の時間」で趣味のスキルを伸ばします。</p>
      <p><b>❗ 大事な選択</b>：進学・就職・病気・プロポーズなどは、オレンジ枠のカードで決めます。</p>
      <p><b>🧭 人生の選択</b>：恋人探し、仕事探し・転職、ペット、マイホーム、クラブや趣味はこのタブからいつでも。</p>
      <p><b>🎂 次の誕生日へ</b>：選択を終えると1年が経ち、思い出（💭）がログに流れます。</p>
      <p><b>🎲 おまかせ</b>：残りの選択をランダムで決めて、テンポよく進めます。</p>
      <p class="small muted">死亡率や結婚のしやすさは国ごとの平均寿命・初婚年齢をもとにしています。進み具合はこのブラウザに自動保存されます。</p>
      <div class="btn-row"><button class="btn primary" type="button" data-m="close">わかった</button></div>`;
  }
  function boot() {
    initStart();
    G.on(() => { if (G.S && G.S.over) { show(); } else render(); });
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    $('#btn-next').onclick = () => {
      if (!G.canAdvance()) return;
      G.advance();
      if (G.S.over) { show(); return; }
      tab = 'year';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      confetti();
    };
    $('#btn-auto').onclick = () => { G.autoPick(); };
    $('#btn-help').onclick = () => { modal(helpHtml()); $('#modal-body [data-m="close"]').onclick = closeModal; };
    $('#btn-home').onclick = () => { G.save(); location.hash = ''; $('#app').hidden = true; $('#start').hidden = false; $('#btn-continue').hidden = !G.hasSave(); window.scrollTo(0, 0); };
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
