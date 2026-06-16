/* ===== 도감 P1 애드온 (수집/도감/네비) — localStorage 전용, 백엔드 없음 ===== */
(function () {
  if (typeof PLAYERS === 'undefined') return;
  var TOTAL = PLAYERS.length;
  var KEY = 'gCollection';

  /* 전체 도감 리셋 토큰 — 이 값 바꾸면 모든 유저 도감이 다음 접속 때 1회 0개로 초기화 */
  var RESET_VER = 'reset-2026-06-15';
  try {
    if (localStorage.getItem('gColVer') !== RESET_VER) {
      localStorage.removeItem('gCollection');
      localStorage.removeItem('gDexSeen');
      localStorage.setItem('gColVer', RESET_VER);
    }
  } catch (e) {}
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function tkey() { return dateKey(new Date()); }
  function cid(p) { return slugOf(p); }
  function ownedCount() { return Object.keys(load()).length; }

  /* 수집: 한 번도 없던 카드만 'new', 이미 가진 건 'dupe'(꽝) */
  function collect(p) {
    var c = load(), id = cid(p);
    if (!c[id]) { c[id] = tkey(); save(c); return 'new'; }
    return 'dupe';
  }
  var justAddedId = null;

  /* ---- 꽝 토스트 (작게) ---- */
  var toast = document.createElement('div');
  toast.className = 'collect-toast';
  document.body.appendChild(toast);
  var toastT;
  function showDupe() {
    toast.className = 'collect-toast dupe';
    toast.textContent = '이미 보유한 카드 — 꽝!';
    requestAnimationFrame(function () { toast.classList.add('show'); });
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  /* ---- NEW 카드 배너 (크게) ---- */
  var banner = document.createElement('div');
  banner.className = 'newcard-banner';
  document.body.appendChild(banner);
  var bannerT;
  function showNewBanner(p) {
    banner.innerHTML = '<div class="nc-tag">NEW CARD ✨</div>' +
      '<div class="nc-title"><b>' + p.name + '</b> 획득!</div>' +
      '<button class="nc-btn" id="ncReg">📖 도감에 등록하기 →</button>';
    banner.classList.add('show');
    document.getElementById('ncReg').onclick = function () {
      banner.classList.remove('show');
      flyToDex(p, function () {
        /* 자동 이동 X — 도감 아이콘이 계속 반짝여서 유저가 직접 누르게 */
        justAddedId = cid(p);
        var db = nav.querySelector('button[data-v="dex"]');
        if (db) db.classList.add('invite');
        updateNav();
      });
    };
    clearTimeout(bannerT);
    bannerT = setTimeout(function () { banner.classList.remove('show'); }, 5000);
  }

  /* 카드 앞면 HTML (모달/플라이 공용) */
  function cardFaceHtml(p) {
    var photo = p.img ? '<img src="' + p.img + '" alt="">' :
      '<div class="fut-fallback">' + p.en.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</div>';
    var badge = p.tier === 'ultra' ? '⚜ THE INVINCIBLE' : p.tier === 'legend' ? '★ LEGEND' :
      p.tier === 'manager' ? '◆ HEAD COACH' : p.tier === 'star' ? '★ STAR' : 'FIRST TEAM';
    return '<div class="card-face card-front-face t-' + p.tier + '">' +
      '<div class="fut-top"><span class="fut-num">' + p.num + '</span><span class="fut-pos">' + p.pos + '</span></div>' +
      '<span class="p-badge">' + badge + '</span>' +
      '<div class="fut-photo">' + photo + '</div>' +
      '<div class="fut-body"><div class="fut-name">' + p.name + '</div><div class="fut-name-en">' + p.en + '</div>' +
      '<p class="fut-chant">' + p.chant + '</p><div class="fut-chant-label">' + (p.real ? '— 실제 에미레이츠 챈트 🎵' : '— 오늘의 응원') + '</div></div>' +
      '</div>';
  }

  /* ---- 카드 → 도감 플라이 모션 (실제 카드가 도감으로 부드럽게 흡수) ---- */
  function flyToDex(p, cb) {
    var box = document.querySelector('.flip-box');
    var navb = nav.querySelector('button[data-v="dex"]');
    if (!box || !navb) { if (cb) cb(); return; }
    var r1 = box.getBoundingClientRect(), r2 = navb.getBoundingClientRect();
    var fly = document.createElement('div');
    fly.className = 'card-fly t-' + p.tier;
    fly.style.left = r1.left + 'px'; fly.style.top = r1.top + 'px';
    fly.style.width = r1.width + 'px'; fly.style.height = r1.height + 'px';
    fly.innerHTML = cardFaceHtml(p);
    document.body.appendChild(fly);
    var dx = (r2.left + r2.width / 2) - (r1.left + r1.width / 2);
    var dy = (r2.top + r2.height / 2) - (r1.top + r1.height / 2);
    requestAnimationFrame(function () {
      fly.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.04) rotate(540deg)';
      fly.style.opacity = '0';
    });
    setTimeout(function () {
      fly.remove();
      navb.classList.remove('absorb'); void navb.offsetWidth; navb.classList.add('absorb');
      if (cb) cb();
    }, 780);
  }

  /* ---- 카드 상세 모달 ---- */
  function openCardModal(p) {
    var m = document.getElementById('dexModal');
    if (!m) { m = document.createElement('div'); m.id = 'dexModal'; m.className = 'dex-modal'; document.body.appendChild(m); }
    m.innerHTML = '<div class="dm-wrap">' + cardFaceHtml(p) +
      '<p class="dm-cheer">' + p.cheer + '</p>' +
      '<button class="dm-close">닫기</button>' +
      '</div>';
    m.classList.add('show');
    m.onclick = function (e) {
      if (e.target === m || (e.target.className && e.target.className.indexOf('dm-close') >= 0)) m.classList.remove('show');
    };
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
      setTimeout(function () {
        updateNav();
        if (st === 'new') {
          showNewBanner(currentPlayer);
          var db = nav.querySelector('button[data-v="dex"]');
          if (db) { db.classList.remove('newglow'); void db.offsetWidth; db.classList.add('newglow'); }
        } else {
          showDupe();
        }
      }, d);
    }
  };

  /* ---- 하단 네비 ---- */
  var nav = document.createElement('div');
  nav.id = 'dexNav';
  nav.innerHTML =
    '<button data-v="fortune" class="active"><span class="ic">🃏</span>운세</button>' +
    '<button data-v="dex"><span class="dex-dot" id="dexDot"></span><span class="ic">📖</span><span id="dexNavLbl">도감</span></button>';
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
      localStorage.setItem('gDexSeen', String(ownedCount()));
      var db = nav.querySelector('button[data-v="dex"]');
      if (db) { db.classList.remove('newglow'); db.classList.remove('invite'); }
      updateNav();
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
          var jc = (cid(p) === justAddedId) ? ' just' : '';
          h += '<div class="dexc owned t-' + p.tier + jc + '" data-pi="' + PLAYERS.indexOf(p) + '"><div class="dexc-num">' + p.num + '</div>' +
            '<div class="dexc-ph">' + inner + '</div><div class="dexc-nm">' + p.name + '</div></div>';
        } else {
          h += '<div class="dexc locked"><span class="dexc-q">?</span><div class="dexc-nm">???</div></div>';
        }
      });
      h += '</div>';
    });
    var DEV = location.pathname.indexOf('/dev/') >= 0 || window.__DEVTEST === true;
    if (DEV) h += '<button id="dexDemo">🎬 새 카드 획득 연출 다시보기</button>' +
      '<button id="dexTest">🎲 테스트로 랜덤 5장 모으기</button>' +
      '<button id="dexReset">⚠️ 도감 전체 초기화</button>';
    dex.innerHTML = h;
    if (DEV) {
    document.getElementById('dexDemo').onclick = function () {
      var c = load();
      var pool = PLAYERS.filter(function (p) { return !c[cid(p)]; });
      var p = pool.length ? pool[Math.floor(Math.random() * pool.length)] : PLAYERS[Math.floor(Math.random() * PLAYERS.length)];
      /* 그 선수 카드를 실제로 띄움(앞면) → 배너/플라이가 화면 카드와 100% 일치 */
      document.getElementById('gate').style.display = 'none';
      dex.classList.remove('show');
      document.getElementById('pitch').style.display = 'block';
      var nb = nav.querySelectorAll('button');
      for (var i = 0; i < nb.length; i++) nb[i].classList.toggle('active', nb[i].dataset.v === 'fortune');
      window.scrollTo(0, 0);
      currentPlayer = p;
      if (typeof renderPlayer === 'function') renderPlayer(p);
      var card = document.getElementById('flipCard');
      if (card) card.classList.add('flipped');
      collect(p); updateNav();
      setTimeout(function () { showNewBanner(p); }, 280);
    };
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
      localStorage.removeItem(KEY); localStorage.removeItem('gDexSeen'); renderDex(); updateNav();
    };
    }
    var owns = dex.querySelectorAll('.dexc.owned');
    for (var k = 0; k < owns.length; k++) {
      (function (el) { el.onclick = function () { openCardModal(PLAYERS[+el.dataset.pi]); }; })(owns[k]);
    }
    justAddedId = null;
  }

  function getSeen() { return parseInt(localStorage.getItem('gDexSeen') || '0', 10) || 0; }
  function updateNav() {
    var owned = ownedCount();
    var lbl = document.getElementById('dexNavLbl');
    if (lbl) lbl.textContent = '도감 ' + owned + '/' + TOTAL;
    var dot = document.getElementById('dexDot');
    if (dot) dot.style.display = (owned > getSeen()) ? 'block' : 'none';
  }
  updateNav();
})();
