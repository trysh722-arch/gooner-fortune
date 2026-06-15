/* ===== 도감 P1 애드온 (수집/도감/네비) — localStorage 전용, 백엔드 없음 ===== */
(function () {
  if (typeof PLAYERS === 'undefined') return;
  var TOTAL = PLAYERS.length;
  var KEY = 'gCollection';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function tkey() { return dateKey(new Date()); }
  function cid(p) { return slugOf(p); }
  function ownedCount() { return Object.keys(load()).length; }

  /* 수집: 새 카드면 'new', 이미 가진 카드면 'dupe'(꽝). 오늘 처음이면 new 유지 */
  function collect(p) {
    var c = load(), id = cid(p), t = tkey();
    if (!c[id]) { c[id] = t; save(c); return 'new'; }
    if (c[id] === t) return 'new';
    return 'dupe';
  }

  /* ---- 수집 토스트 ---- */
  var toast = document.createElement('div');
  toast.className = 'collect-toast';
  document.body.appendChild(toast);
  var toastT;
  function showToast(st) {
    toast.className = 'collect-toast ' + (st === 'new' ? 'new' : 'dupe');
    toast.textContent = st === 'new' ? '도감 등록 완료! NEW ✨' : '이미 보유 — 꽝!';
    requestAnimationFrame(function () { toast.classList.add('show'); });
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  /* ---- flipCard 후킹: 카드 공개되면 수집 ---- */
  var _flip = window.flipCard;
  window.flipCard = function () {
    var card = document.getElementById('flipCard');
    var was = card && card.classList.contains('flipped');
    if (_flip) _flip();
    if (!was && typeof currentPlayer !== 'undefined' && currentPlayer) {
      var st = collect(currentPlayer);
      var d = currentPlayer.tier === 'ultra' ? 1900 : currentPlayer.tier === 'legend' ? 1700 : 1100;
      setTimeout(function () { showToast(st); updateNav(); }, d);
    }
  };

  /* ---- 하단 네비 ---- */
  var nav = document.createElement('div');
  nav.id = 'dexNav';
  nav.innerHTML =
    '<button data-v="fortune" class="active"><span class="ic">🃏</span>운세</button>' +
    '<button data-v="dex"><span class="ic">📖</span><span id="dexNavLbl">도감</span></button>';
  document.body.appendChild(nav);

  var dex = document.createElement('section');
  dex.id = 'dex';
  document.querySelector('.wrap').appendChild(dex);

  function showView(v) {
    var btns = nav.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.v === v);
    var gate = document.getElementById('gate'), pitch = document.getElementById('pitch');
    if (v === 'dex') {
      gate.style.display = 'none'; pitch.style.display = 'none';
      dex.classList.add('show'); renderDex(); window.scrollTo(0, 0);
    } else {
      dex.classList.remove('show');
      if (typeof currentFortune !== 'undefined' && currentFortune) pitch.style.display = 'block';
      else gate.style.display = 'block';
      window.scrollTo(0, 0);
    }
  }
  var navBtns = nav.querySelectorAll('button');
  for (var i = 0; i < navBtns.length; i++) {
    (function (b) { b.onclick = function () { showView(b.dataset.v); }; })(navBtns[i]);
  }

  function groupOf(t) { return (t === 'ultra' || t === 'legend') ? '레전드' : t === 'manager' ? '감독' : '현역'; }

  function renderDex() {
    var own = load(), n = Object.keys(own).length, pct = Math.round(n / TOTAL * 100);
    var h = '<div class="dex-head"><div class="dex-title">MY 구너 도감</div>' +
      '<div class="dex-prog"><div class="dex-prog-bar" style="width:' + pct + '%"></div></div>' +
      '<div class="dex-cnt">' + n + ' / ' + TOTAL + ' 수집 (' + pct + '%)</div></div>';
    var groups = { '현역': [], '레전드': [], '감독': [] };
    PLAYERS.forEach(function (p) { groups[groupOf(p.tier)].push(p); });
    ['현역', '레전드', '감독'].forEach(function (g) {
      h += '<div class="dex-sec">' + g + '</div><div class="dex-grid">';
      groups[g].forEach(function (p) {
        if (own[cid(p)]) {
          var inner = p.img ? '<img src="' + p.img + '" alt="">'
            : '<div class="dexc-ini">' + p.en.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</div>';
          h += '<div class="dexc owned t-' + p.tier + '"><div class="dexc-num">' + p.num + '</div>' +
            '<div class="dexc-ph">' + inner + '</div><div class="dexc-nm">' + p.name + '</div></div>';
        } else {
          h += '<div class="dexc locked"><span class="dexc-q">?</span><div class="dexc-nm">???</div></div>';
        }
      });
      h += '</div>';
    });
    h += '<button id="dexTest">🎲 테스트로 랜덤 5장 모으기</button>' +
      '<button id="dexReset">도감 초기화 (테스트)</button>';
    dex.innerHTML = h;
    document.getElementById('dexTest').onclick = function () {
      var c = load(), added = 0, tries = 0;
      while (added < 5 && tries < 300) {
        tries++;
        var p = PLAYERS[Math.floor(Math.random() * PLAYERS.length)], id = cid(p);
        if (!c[id]) { c[id] = '2026-1-1'; added++; }
      }
      save(c); renderDex(); updateNav();
    };
    document.getElementById('dexReset').onclick = function () {
      localStorage.removeItem(KEY); renderDex(); updateNav();
    };
  }

  function updateNav() {
    var lbl = document.getElementById('dexNavLbl');
    if (lbl) lbl.textContent = '도감 ' + ownedCount() + '/' + TOTAL;
  }
  updateNav();
})();
