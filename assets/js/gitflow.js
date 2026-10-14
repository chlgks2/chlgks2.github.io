/* git flow 그래프 — 화면에 들어오면 한 브랜치씩 그려지고,
   아래 단계 카드와 서로 가리킨다. 2026-10-15 */
(function () {
  var box = document.getElementById('gitflow');
  if (!box) return;

  var branches = [].slice.call(box.querySelectorAll('.gf-br'));
  var steps = [].slice.call(document.querySelectorAll('.steps .step'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. 스크롤로 들어오면 그리기 시작 — 한 번만 */
  if (still) {
    box.classList.remove('armed');   /* 움직임을 줄이는 설정 — 그냥 그려 둔다 */
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        box.classList.add('run');
        io.disconnect();
      });
    }, { threshold: 0.3 });
    io.observe(box);
  } else {
    box.classList.add('run');
  }

  /* 2. 카드 ↔ 브랜치 연결 */
  function lit(i) {
    branches.forEach(function (b) {
      var on = b.getAttribute('data-i') === String(i);
      b.classList.toggle('lit', on);
      b.classList.toggle('dim', i !== 0 && !on);
    });
    steps.forEach(function (s) {
      s.classList.toggle('lit', s.getAttribute('data-i') === String(i));
    });
  }
  function clear() { lit(0); }

  steps.forEach(function (s) {
    var i = s.getAttribute('data-i');
    s.addEventListener('mouseenter', function () { lit(i); });
    s.addEventListener('mouseleave', clear);
  });
  branches.forEach(function (b) {
    var i = b.getAttribute('data-i');
    b.addEventListener('mouseenter', function () { lit(i); });
    b.addEventListener('mouseleave', clear);
  });

  /* 3. 터치 화면 — 지금 보고 있는 카드를 밝힌다 */
  if (!still && window.matchMedia('(hover: none)').matches &&
      'IntersectionObserver' in window) {
    var cur = 0;
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = e.target.getAttribute('data-i');
        if (i !== cur) { cur = i; lit(i); }
      });
    }, { threshold: 0.65 });
    steps.forEach(function (s) { io2.observe(s); });
  }
})();
