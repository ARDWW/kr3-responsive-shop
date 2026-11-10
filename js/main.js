// main.js: меню, модальное окно, фильтр каталога, страница товара, формы
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };

  /* ---------- мобильная навигация ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  if (toggle && nav) {
    var setNav = function (open, returnFocus) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (!open && returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Esc закрывает меню и возвращает фокус на кнопку
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setNav(false, true);
    });
    // клик вне меню закрывает его
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
    // при переходе на широкий экран сбрасываем состояние
    window.matchMedia('(min-width: 48em)').addEventListener('change', function (e) {
      if (e.matches) setNav(false);
    });
  }

  /* ---------- модальное окно на <dialog> (клавиатура, Esc и фокус обрабатывает браузер) ---------- */
  var dialog = $('#askDialog');
  if (dialog && typeof dialog.showModal === 'function') {
    $$('[data-open-dialog]').forEach(function (b) {
      b.addEventListener('click', function () { dialog.showModal(); });
    });
    $$('[data-close-dialog]').forEach(function (b) {
      b.addEventListener('click', function () { dialog.close(); });
    });
    // клик по затемнению закрывает окно
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    var askForm = $('#askForm');
    var askStatus = $('#askStatus');
    askForm.addEventListener('submit', function (e) {
      e.preventDefault();
      askStatus.hidden = false;
      askStatus.textContent = 'Спасибо! Мы ответим в течение рабочего дня.';
      askForm.reset();
    });
    dialog.addEventListener('close', function () { askStatus.hidden = true; });
  }

  /* ---------- сообщение "добавлено в корзину" ---------- */
  var live = $('#live');
  var liveTimer;
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn || !live) return;
    live.textContent = 'Игра «' + btn.getAttribute('data-title') + '» добавлена в корзину';
    live.hidden = false;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { live.hidden = true; }, 3000);
  });

  /* ---------- каталог: фильтр, цена, сортировка; на мобильном панель раскрывается ---------- */
  var filters = $('#filters');
  if (filters) {
    var fToggle = $('#filtersToggle');
    var list = $('#cardList');
    var items = $$('li[data-id]', list);
    var maxInput = $('#fMax');
    var maxOut = $('#fMaxOut');
    var sortSel = $('#fSort');
    var countEl = $('#count');
    var emptyEl = $('#empty');

    fToggle.addEventListener('click', function () {
      var open = !filters.classList.contains('is-open');
      filters.classList.toggle('is-open', open);
      fToggle.setAttribute('aria-expanded', String(open));
    });

    var apply = function () {
      var cats = $$('input[name="cat"]:checked', filters).map(function (i) { return i.value; });
      var limit = parseInt(maxInput.value, 10);
      maxOut.textContent = money(limit);
      var shown = items.filter(function (li) {
        var ok = (!cats.length || cats.indexOf(li.dataset.cat) !== -1) && parseInt(li.dataset.price, 10) <= limit;
        li.hidden = !ok;
        return ok;
      });
      var mode = sortSel.value;
      shown.sort(function (a, b) {
        if (mode === 'asc') return a.dataset.price - b.dataset.price;
        if (mode === 'desc') return b.dataset.price - a.dataset.price;
        return a.dataset.id - b.dataset.id;
      }).forEach(function (li) { list.appendChild(li); });
      countEl.textContent = 'Найдено игр: ' + shown.length;
      emptyEl.hidden = shown.length > 0;
    };
    filters.addEventListener('input', apply);
    filters.addEventListener('change', apply);
    filters.addEventListener('reset', function () { setTimeout(apply, 0); });
    apply();
  }

  /* ---------- страница товара: данные по ?id= ---------- */
  var pTitle = $('#pTitle');
  if (pTitle && typeof PRODUCTS !== 'undefined') {
    var id = parseInt(new URLSearchParams(location.search).get('id'), 10) || 1;
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0] || PRODUCTS[0];
    var BADGE = { 'Хит': 'badge--hit', 'Новинка': 'badge--new', 'Скидка': 'badge--sale' };
    document.title = p.t + ' - Ход конём';
    $('#bcName').textContent = p.t;
    pTitle.textContent = p.t;
    $('#pShort').textContent = p.s;
    $('#pDesc').textContent = p.d;
    $('#pPrice').textContent = money(p.price);
    var set = function (ext) { return [480, 640, 960].map(function (w) { return 'images/p' + p.id + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', '); };
    $('#pWebp').srcset = set('webp');
    var img = $('#pImg');
    img.srcset = set('png');
    img.src = 'images/p' + p.id + '-640.png';
    img.alt = 'Коробка настольной игры «' + p.t + '»';
    var badges = $('#pBadges');
    badges.textContent = '';
    if (p.badge) { var b1 = document.createElement('span'); b1.className = 'badge ' + BADGE[p.badge]; b1.textContent = p.badge; badges.appendChild(b1); }
    var b2 = document.createElement('span'); b2.className = 'badge'; b2.textContent = p.cat; badges.appendChild(b2);
    var rows = [['Категория', p.cat], ['Игроков', p.pl], ['Время партии', p.time], ['Возраст', p.age], ['Цена', money(p.price)]];
    var tb = $('#pSpecs');
    tb.textContent = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var th = document.createElement('th'); th.scope = 'row'; th.textContent = r[0];
      var td = document.createElement('td'); td.textContent = r[1];
      tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
    });
    var add = $('#pAdd'); add.setAttribute('data-title', p.t);
    $('#pOrder').href = 'order.html?product=' + p.id;
  }

  /* ---------- формы: заявка и обратная связь (сервера нет) ---------- */
  var orderForm = $('#orderForm');
  if (orderForm) {
    var sel = $('#oProduct');
    var pre = new URLSearchParams(location.search).get('product');
    if (pre && sel.querySelector('option[value="' + pre + '"]')) sel.value = pre;
  }
  [['#orderForm', '#orderStatus', function (f) { return 'Спасибо, ' + f.name.value.trim() + '! Заявка принята, менеджер скоро позвонит.'; }],
   ['#contactForm', '#contactStatus', function (f) { return 'Спасибо, ' + f.name.value.trim() + '! Сообщение отправлено.'; }]
  ].forEach(function (cfg) {
    var form = $(cfg[0]);
    if (!form) return;
    var status = $(cfg[1]);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // браузер уже проверил required и type, сюда попадаем только с валидной формой
      status.textContent = cfg[2](form);
      status.hidden = false;
      form.reset();
      status.focus();
    });
  });
})();
