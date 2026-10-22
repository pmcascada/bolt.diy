/* Pontuação e níveis – partilhado entre a app (browser) e o servidor (Node),
   para que o ranking seja recalculado a partir do progresso e não só "confiado". */
(function (root) {
  const C = typeof require !== 'undefined' ? require('./content.js') : root.CONTENT;
  const G = typeof require !== 'undefined' ? (require('./game/levels.js'), globalThis.GAME) : root.GAME;
  const ROOMS = G ? G.LEVELS : [];
  const BASE = { quiz: 10, order: 10, code: 15, dml: 15, query: 20, ddl: 20 };
  const LESSON_BONUS = 20, CHAPTER_BONUS = 100, HINT_COST = 3, REVIEW_XP = 5, REVIEW_MAX = 4;
  const BOXES = [1, 3, 7, 14]; // revisão espaçada: dias até à revisão seguinte em cada caixa
  const TEST_WEIGHT = 3; // peso do miniteste no progresso do capítulo, equivalente a 3 exercícios
  const TITLES = ['Aprendiz', 'Explorador', 'Consultor', 'Analista', 'Arquiteto', 'Mestre', 'Lenda'];

  const EXS = {};
  C.CHAPTERS.forEach((c) => c.lessons.forEach((l) => l.ex.forEach((e) => (EXS[e.id] = e))));
  const TOTAL_EX = Object.keys(EXS).length;

  // XP base de um exercício: o valor do tipo, ou o indicado no próprio exercício (ex.: desafios).
  const baseOf = (ex) => (typeof ex === 'string' ? BASE[ex] : ex.xp || BASE[ex.t]);
  const exXp = (ex, tries, hints) =>
    Math.max(1, (tries <= 1 ? baseOf(ex) : Math.round(baseOf(ex) * 0.6)) - HINT_COST * (hints || 0));

  // XP de uma sala do jogo: perde 5 por dica e tudo se a solução foi vista.
  const roomXp = (room, d) => (d.rev ? 0 : Math.max(10, room.xp - 5 * (d.hints || 0)));

  const levelOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;
  const levelStart = (lv) => 50 * (lv - 1) * (lv - 1);
  const titleOf = (lv) => TITLES[Math.min(lv, TITLES.length) - 1];

  function dayKey(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }

  function streakOf(days, now) {
    const set = new Set(days || []);
    const d = new Date(now || Date.now());
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1); // hoje ainda pode não ter estudado
    let n = 0;
    while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // Revisão espaçada: cada revisão certa dá REVIEW_XP (no máximo REVIEW_MAX vezes por exercício).
  const reviewXp = (r) => REVIEW_XP * Math.min(REVIEW_MAX, (r && r.ok) || 0);

  // Uma lição está concluída quando todos os exercícios foram resolvidos (ou a solução foi consultada);
  // o bónus da lição só é dado se todos foram resolvidos sem consultar a solução.
  // Um capítulo está concluído quando todas as lições estão concluídas E o miniteste foi aprovado.
  function summarize(state, now) {
    now = now || Date.now();
    const week = now - 7 * 864e5;
    const done = state.done || {}, rev = state.rev || {}, tests = state.tests || {}, game = (state.game && state.game.done) || {};
    const review = state.review || {}, real = state.real || {};
    let xp = 0, weekXp = 0, exDone = 0, firstTry = 0, testsPassed = 0, perfectTests = 0, allOk = 0, allTot = 0, reviews = 0;
    const lessonsDone = [], chaptersDone = [], cleanChapters = [], realDone = [], perChapter = {};
    for (const [id, d] of Object.entries(done)) {
      const e = EXS[id]; if (!e) continue;
      exDone++; if ((d.tries || 1) <= 1) firstTry++;
      const x = exXp(e, d.tries || 1, d.hints || 0);
      xp += x; if ((d.at || 0) >= week) weekXp += x;
    }
    for (const c of C.CHAPTERS) {
      let ok = 0, tot = 0, lessonsOk = 0, revealed = 0;
      for (const l of c.lessons) {
        const n = l.ex.filter((e) => done[e.id] || rev[e.id]).length;
        tot += l.ex.length; ok += n;
        revealed += l.ex.filter((e) => rev[e.id] && !done[e.id]).length;
        if (n === l.ex.length) {
          lessonsDone.push(l.id); lessonsOk++;
          if (l.ex.every((e) => done[e.id])) {
            xp += LESSON_BONUS;
            if (Math.max(...l.ex.map((e) => done[e.id].at || 0)) >= week) weekXp += LESSON_BONUS;
          }
        }
      }
      const t = tests[c.id] || {};
      const unlocked = lessonsOk === c.lessons.length;
      const passed = unlocked && (t.best || 0) >= C.PASS_MARK;
      if (passed) {
        chaptersDone.push(c.id); xp += CHAPTER_BONUS; testsPassed++; if (t.best === 100) perfectTests++;
        if ((t.passAt || t.at || 0) >= week) weekXp += CHAPTER_BONUS;
        if (!revealed) cleanChapters.push(c.id);
      }
      const r = real[c.id] || [];
      if (c.real && c.real.length && c.real.every((x, i) => r.includes(i))) realDone.push(c.id);
      perChapter[c.id] = { ok, tot, lessonsOk, lessons: c.lessons.length, unlocked, revealed, test: { best: t.best || 0, attempts: t.attempts || 0, passed },
        real: c.real ? c.real.filter((x, i) => r.includes(i)).length : 0, realTot: c.real ? c.real.length : 0,
        pct: Math.round((100 * (ok + (passed ? TEST_WEIGHT : 0))) / (tot + TEST_WEIGHT)), complete: passed };
      allOk += ok + (passed ? TEST_WEIGHT : 0); allTot += tot + TEST_WEIGHT;
    }
    for (const [id, r] of Object.entries(review)) {
      if (!EXS[id]) continue;
      const x = reviewXp(r); xp += x; reviews += Math.min(REVIEW_MAX, r.ok || 0);
      if ((r.last || 0) >= week && r.ok) weekXp += REVIEW_XP;
    }
    const gameRooms = ROOMS.filter((r) => game[r.id]).map((r) => r.id);
    for (const r of ROOMS) if (game[r.id]) { const x = roomXp(r, game[r.id]); xp += x; if ((game[r.id].at || 0) >= week) weekXp += x; }
    const streak = streakOf(state.days, now);
    const level = levelOf(xp);
    const projectSent = !!(state.project && state.project.sent);
    const s = { xp, weekXp, level, title: titleOf(level), exDone, firstTry, testsPassed, perfectTests, gameRooms, gameDone: gameRooms.length, lessonsDone, chaptersDone, cleanChapters,
      reviews, realDone, projectSent, perChapter, streak, pct: Math.round((100 * allOk) / allTot), next: levelStart(level + 1), cur: levelStart(level) };
    s.badges = C.BADGES.filter((b) => b.test(s)).map((b) => b.id);
    return s;
  }

  // Exercícios a rever: os que foram resolvidos com dificuldade (2+ tentativas ou dicas) ou cuja solução foi vista.
  const needsReview = (d, revealed) => revealed || (d && ((d.tries || 1) >= 2 || (d.hints || 0) > 0));
  const nextDue = (box, now) => (now || Date.now()) + BOXES[Math.min(box, BOXES.length) - 1] * 864e5;

  const api = { BASE, baseOf, ROOMS, roomXp, HINT_COST, REVIEW_XP, REVIEW_MAX, BOXES, reviewXp, needsReview, nextDue, PASS_MARK: C.PASS_MARK, LESSON_BONUS, CHAPTER_BONUS, EXS, TOTAL_EX, exXp, levelOf, levelStart, titleOf, dayKey, streakOf, summarize };
  if (typeof module !== 'undefined') module.exports = api; else root.SCORE = api;
})(typeof window !== 'undefined' ? window : globalThis);
