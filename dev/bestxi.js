/* ===== P2 베스트11(스쿼드) — dev 전용 애드온 ===== */
(function () {
  if (typeof PLAYERS === 'undefined') return;
  var nav = document.getElementById('dexNav');
  if (!nav) return;

  /* ---- 튜닝 상수 ---- */
  var OVR = { ultra: 99, legend: 92, star: 85, manager: 90, standard: 78 };
  var FORMATIONS = {
    '4-3-3':   [{ pos: 'FW', n: 3 }, { pos: 'MF', n: 3 }, { pos: 'DF', n: 4 }, { pos: 'GK', n: 1 }],
    '4-4-2':   [{ pos: 'FW', n: 2 }, { pos: 'MF', n: 4 }, { pos: 'DF', n: 4 }, { pos: 'GK', n: 1 }],
    '4-2-3-1': [{ pos: 'FW', n: 1 }, { pos: 'MF', n: 3 }, { pos: 'MF', n: 2 }, { pos: 'DF', n: 4 }, { pos: 'GK', n: 1 }],
    '3-4-3':   [{ pos: 'FW', n: 3 }, { pos: 'MF', n: 4 }, { pos: 'DF', n: 3 }, { pos: 'GK', n: 1 }]
  };
  var SQ_KEY = 'gSquad';

  function ownedMap() { try { return JSON.parse(localStorage.getItem('gCollection') || '{}'); } catch (e) { return {}; } }
  function cid(p) { return slugOf(p); }
  function playerById(id) { for (var i = 0; i < PLAYERS.length; i++) if (cid(PLAYERS[i]) === id) return PLAYERS[i]; return null; }
  function ovrOf(p) { return OVR[p.tier] || 78; }
  /* 포메이션별로 각각 라인업 저장: { cur:'4-3-3', f:{ '4-3-3':{slots,manager}, ... } } */
  function loadAll() {
    try { var a = JSON.parse(localStorage.getItem(SQ_KEY) || 'null'); if (a && a.f) return a; } catch (e) {}
    return { cur: '4-3-3', f: {} };
  }
  function saveAll(a) { try { localStorage.setItem(SQ_KEY, JSON.stringify(a)); } catch (e) {} }
  function loadSquad() {
    var a = loadAll(), f = a.f[a.cur] || { slots: {}, manager: null };
    return { formation: a.cur, slots: f.slots || {}, manager: f.manager || null };
  }
  function saveSquad(s) {
    var a = loadAll(); a.cur = s.formation; a.f[s.formation] = { slots: s.slots, manager: s.manager }; saveAll(a);
  }
  function setFormation(f) {
    var a = loadAll(); a.cur = f; if (!a.f[f]) a.f[f] = { slots: {}, manager: null }; saveAll(a);
  }

  function slotList(form) {
    var out = [], lines = FORMATIONS[form] || FORMATIONS['4-3-3'];
    for (var i = 0; i < lines.length; i++) for (var j = 0; j < lines[i].n; j++) out.push({ pos: lines[i].pos, line: i });
    return out;
  }
  function placedIds(s) {
    var arr = [];
    for (var k in s.slots) if (s.slots[k]) arr.push(s.slots[k]);
    if (s.manager) arr.push(s.manager);
    return arr;
  }
  function squadRating(s) {
    var slots = slotList(s.formation), sum = 0;
    for (var i = 0; i < slots.length; i++) { var p = s.slots[i] ? playerById(s.slots[i]) : null; sum += p ? ovrOf(p) : 0; }
    var r = Math.round(sum / slots.length);
    if (s.manager) { var m = playerById(s.manager); r += (m && m.tier === 'ultra') ? 5 : 3; }
    return Math.min(99, r);
  }
  function filledCount(s) { var slots = slotList(s.formation), c = 0; for (var i = 0; i < slots.length; i++) if (s.slots[i]) c++; return c; }
  function squadBoost(s) { return Math.max(0, Math.min(8, Math.round((squadRating(s) - 60) / 5))); }

  /* ---- 네비 + 패널 ---- */
  var btn = document.createElement('button');
  btn.dataset.v = 'squad';
  btn.innerHTML = '<span class="ic">⚽</span>스쿼드';
  nav.appendChild(btn);
  var panel = document.createElement('section');
  panel.id = 'squad';
  document.body.appendChild(panel);

  function hideSquad() { panel.classList.remove('show'); btn.classList.remove('active'); }
  function showSquad() {
    var bs = nav.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) bs[i].classList.remove('active');
    btn.classList.add('active');
    panel.classList.add('show'); renderSquad(); panel.scrollTop = 0;
  }
  btn.onclick = showSquad;
  var others = nav.querySelectorAll('button[data-v="fortune"],button[data-v="dex"]');
  for (var i = 0; i < others.length; i++) others[i].addEventListener('click', hideSquad);

  /* ---- 카드 선택 시트 ---- */
  var pick = document.createElement('div');
  pick.className = 'sq-pick';
  document.body.appendChild(pick);
  function miniCard(p, cls) {
    var ph = p.img ? '<div class="ph"><img src="' + p.img + '"></div>'
      : '<div class="ph"><div class="dexc-ini" style="font-size:24px">' + p.en.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</div></div>';
    return '<div class="' + cls + ' t-' + p.tier + '" data-id="' + cid(p) + '"><span class="o">' + ovrOf(p) + '</span>' + ph + '<span class="n">' + p.name + '</span></div>';
  }
  function openPicker(opts) {
    /* opts: { title, candidates[], onPick(id), filled(bool), onClear } */
    var grid = '';
    if (opts.candidates.length) for (var i = 0; i < opts.candidates.length; i++) grid += miniCard(opts.candidates[i], 'sq-pick-c');
    else grid = '<div class="sq-pick-empty">배치할 수 있는 카드가 없어요.<br>도감에서 ' + opts.posLabel + ' 카드를 더 모아보세요.</div>';
    pick.innerHTML = '<div class="sq-pick-sheet"><div class="sq-pick-h">' + opts.title + '</div>'
      + (opts.candidates.length ? '<div class="sq-pick-hint">← 좌우로 넘겨서 골라 →</div>' : '')
      + '<div class="sq-pick-row">' + grid + '</div>'
      + '<div class="sq-pick-btns">' + (opts.filled ? '<button class="clear" id="sqClear">이 자리 비우기</button>' : '') + '<button id="sqCancel">닫기</button></div></div>';
    pick.classList.add('show');
    var cards = pick.querySelectorAll('.sq-pick-c');
    for (var j = 0; j < cards.length; j++) (function (el) { el.onclick = function () { opts.onPick(el.dataset.id); pick.classList.remove('show'); }; })(cards[j]);
    var cl = document.getElementById('sqClear'); if (cl) cl.onclick = function () { opts.onClear(); pick.classList.remove('show'); };
    document.getElementById('sqCancel').onclick = function () { pick.classList.remove('show'); };

    /* 커버플로우: 가운데 카드 포커스(크게) + 양옆 기울임 */
    var row = pick.querySelector('.sq-pick-row');
    if (row) {
      var raf;
      var updateFocus = function () {
        var rc = row.getBoundingClientRect(), cx = rc.left + rc.width / 2;
        var cs = row.querySelectorAll('.sq-pick-c');
        for (var i = 0; i < cs.length; i++) {
          var b = cs[i].getBoundingClientRect(), d = (b.left + b.width / 2 - cx) / b.width;
          var ad = Math.min(1.4, Math.abs(d));
          var scale = Math.max(0.7, 1.1 - ad * 0.32);
          var rot = Math.max(-34, Math.min(34, -d * 26));
          cs[i].style.transform = 'rotateY(' + rot + 'deg) scale(' + scale + ')';
          cs[i].style.opacity = String(Math.max(0.42, 1 - ad * 0.45));
          cs[i].style.zIndex = String(100 - Math.round(ad * 50));
          cs[i].classList.toggle('focus', ad < 0.3);
        }
      };
      row.addEventListener('scroll', function () { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(updateFocus); });
      setTimeout(updateFocus, 30);
    }
  }
  pick.onclick = function (e) { if (e.target === pick) pick.classList.remove('show'); };

  function ownedCandidates(pos, s, exceptSlot) {
    var own = ownedMap(), used = placedIds(s), out = [];
    /* exceptSlot 의 현재 카드는 후보에서 교체 가능하게 used 에서 제외 */
    var selfId = exceptSlot != null ? s.slots[exceptSlot] : (exceptSlot === 'mgr' ? s.manager : null);
    for (var i = 0; i < PLAYERS.length; i++) {
      var p = PLAYERS[i];
      if (p.pos !== pos) continue;
      if (!own[cid(p)]) continue;
      if (used.indexOf(cid(p)) >= 0 && cid(p) !== selfId) continue;
      out.push(p);
    }
    out.sort(function (a, b) { return ovrOf(b) - ovrOf(a); });
    return out;
  }

  /* ---- 렌더 ---- */
  function renderSquad() {
    var s = loadSquad();
    /* 포메이션에 안 맞는 배치 정리 */
    var slots = slotList(s.formation);
    for (var k in s.slots) { var ki = +k; if (ki >= slots.length || !s.slots[k]) { delete s.slots[k]; continue; } var pp = playerById(s.slots[k]); if (!pp || pp.pos !== slots[ki].pos) delete s.slots[k]; }
    saveSquad(s);

    var rating = squadRating(s), boost = squadBoost(s), filled = filledCount(s);
    var mgr = s.manager ? playerById(s.manager) : null;

    var h = '<div class="sq-title">MY 베스트 11</div><div class="sq-sub">모은 카드로 스쿼드를 짜면 오늘 운세가 강해져</div>';
    h += '<div class="sq-forms">';
    ['4-3-3', '4-4-2', '4-2-3-1', '3-4-3'].forEach(function (f) { h += '<button class="sq-form' + (s.formation === f ? ' on' : '') + '" data-f="' + f + '">' + f + '</button>'; });
    h += '</div>';

    h += '<div class="sq-rate"><div class="col"><div class="k">스쿼드 OVR</div><div class="ovr">' + rating + '</div></div>'
      + '<div class="col"><div class="k">완성도</div><div class="v">' + filled + '/11</div></div>'
      + '<div class="col"><div class="k">오늘 승률</div><div class="v boost">+' + boost + '%p</div></div></div>';
    h += '<div class="sq-boostline">' + (filled < 11 ? '11명 다 채우고 좋은 카드일수록 보너스 ↑' : (boost >= 6 ? '월드클래스 스쿼드! 🔥' : '스쿼드 완성!')) + '</div>';

    /* 감독 슬롯 */
    h += '<div class="sq-mgr" id="sqMgr"><div class="mthumb">' + (mgr && mgr.img ? '<img src="' + mgr.img + '">' : '') + '</div>'
      + '<div style="flex:1"><div class="mlabel">MANAGER · 감독</div>'
      + (mgr ? '<div class="mname">' + mgr.name + ' <span style="color:#9fc0f0;font-size:12px">(+' + (mgr.tier === 'ultra' ? 5 : 3) + ' OVR)</span></div>' : '<div class="mempty">감독 카드를 배치하면 팀 전체 +OVR</div>') + '</div>'
      + '<span style="color:#9fc0f0;font-size:20px">' + (mgr ? '↻' : '+') + '</span></div>';

    /* 피치 */
    h += '<div class="sq-pitch">';
    var lines = FORMATIONS[s.formation], idx = 0;
    for (var li = 0; li < lines.length; li++) {
      h += '<div class="sq-line">';
      for (var n = 0; n < lines[li].n; n++) {
        var pos = lines[li].pos, pid = s.slots[idx], pl = pid ? playerById(pid) : null;
        if (pl) {
          var ph = pl.img ? '<div class="ph"><img src="' + pl.img + '"></div>' : '<div class="ph"><div class="dexc-ini" style="font-size:20px">' + pl.en.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</div></div>';
          h += '<div class="sq-slot filled t-' + pl.tier + '" data-slot="' + idx + '" data-pos="' + pos + '"><div class="holder"><span class="sovr">' + ovrOf(pl) + '</span>' + ph + '</div><div class="pname">' + pl.name + '</div></div>';
        } else {
          h += '<div class="sq-slot empty" data-slot="' + idx + '" data-pos="' + pos + '"><div class="holder"><span class="pos">' + pos + '</span><span class="plus">＋</span></div><div class="pname">' + pos + '</div></div>';
        }
        idx++;
      }
      h += '</div>';
    }
    h += '</div>';
    panel.innerHTML = h;

    /* 이벤트 */
    var forms = panel.querySelectorAll('.sq-form');
    for (var a = 0; a < forms.length; a++) (function (el) { el.onclick = function () { setFormation(el.dataset.f); renderSquad(); }; })(forms[a]);

    var sl = panel.querySelectorAll('.sq-slot');
    for (var b = 0; b < sl.length; b++) (function (el) {
      el.onclick = function () {
        var si = +el.dataset.slot, pos = el.dataset.pos, ss = loadSquad();
        openPicker({
          title: pos + ' 자리에 배치', posLabel: pos,
          candidates: ownedCandidates(pos, ss, si),
          filled: !!ss.slots[si],
          onPick: function (id) { ss.slots[si] = id; saveSquad(ss); renderSquad(); },
          onClear: function () { delete ss.slots[si]; saveSquad(ss); renderSquad(); }
        });
      };
    })(sl[b]);

    document.getElementById('sqMgr').onclick = function () {
      var ss = loadSquad();
      openPicker({
        title: '감독 배치', posLabel: '감독',
        candidates: ownedCandidates('MANAGER', ss, 'mgr'),
        filled: !!ss.manager,
        onPick: function (id) { ss.manager = id; saveSquad(ss); renderSquad(); },
        onClear: function () { ss.manager = null; saveSquad(ss); renderSquad(); }
      });
    };
  }

  /* ---- 운세 게이지에 스쿼드 보너스 적용 ---- */
  function applyBoost() {
    if (typeof currentFortune === 'undefined' || !currentFortune) return;
    var pctEl = document.getElementById('wrPct'); if (!pctEl) return;
    var b = squadBoost(loadSquad());
    var total = Math.min(99, currentFortune.winRate + b);
    pctEl.textContent = total + '%';
    var fill = document.getElementById('wrFill'); if (fill) { fill.style.width = '0%'; setTimeout(function () { fill.style.width = total + '%'; }, 240); }
    if (typeof winVerdict === 'function') {
      var wv = winVerdict(total);
      var vEl = document.getElementById('wrVerdict'); if (vEl) vEl.textContent = wv.word;
      var fEl = document.getElementById('wrFoot'); if (fEl) fEl.textContent = wv.foot;
    }
    var foot = document.getElementById('wrFoot');
    var tag = document.getElementById('wrSquadTag');
    if (b > 0 && foot) {
      if (!tag) { tag = document.createElement('span'); tag.id = 'wrSquadTag'; tag.className = 'wr-squad'; foot.parentNode.appendChild(tag); }
      tag.textContent = '⚽ 베스트11 보너스 +' + b + '%p';
    } else if (tag) { tag.remove(); }
  }
  if (window.showFortune && !window._sfBoostHook) {
    window._sfBoostHook = true;
    var _sf = window.showFortune;
    window.showFortune = function () { _sf.apply(this, arguments); try { applyBoost(); } catch (e) {} };
  }
  /* 운세 탭으로 돌아올 때도 재적용(스쿼드 바꿨을 수 있음) */
  var fb = nav.querySelector('button[data-v="fortune"]');
  if (fb) fb.addEventListener('click', function () { setTimeout(function () { try { applyBoost(); } catch (e) {} }, 60); });
  /* 첫 로드시(이미 운세 떠 있으면) 한 번 */
  setTimeout(function () { try { applyBoost(); } catch (e) {} }, 400);
})();
