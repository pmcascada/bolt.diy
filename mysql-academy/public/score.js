/* Pontuação e níveis – partilhado entre a app (browser) e o servidor (Node),
   para que o ranking seja recalculado a partir do progresso e não só "confiado". */
(function (root) {
  const C = typeof require !== 'undefined' ? require('./content.js') : root.CONTENT;
  const BASE = { quiz: 10, code: 15, query: 20, ddl: 20 };
  const LESSON_BONUS = 20, CHAPTER_BONUS = 100, HINT_COST = 3;
  const TEST_WEIGHT = 3; // peso do miniteste no progresso do capítulo, equivalente a 3 exercícios
  const TITLES = ['Aprendiz', 'Explorador', 'Consultor', 'Analista', 'Arquiteto', 'Mestre', 'Lenda'];

  const EXS = {};
  C.CHAPTERS.forEach((c) => c.lessons.forEach((l) => l.ex.forEach((e) => (EXS[e.id] = e))));
  const TOTAL_EX = Object.keys(EXS).length;

  // XP base de um exercício: o valor do tipo, ou o indicado no próprio exercício (ex.: desafios).
  const baseOf = (ex) => (typeof ex === 'string' ? BASE[ex] : ex.xp || BASE[ex.t]);
  const exXp = (ex, tries, hints) =>
    Math.max(1, (tries <= 1 ? baseOf(ex) : Math.round(baseOf(ex) * 0.6)) - HINT_COST * (hints || 0));

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

  // Uma lição está concluída quando todos os exercícios foram resolvidos (ou a solução foi consultada).
  // Um capítulo está concluído quando todas as lições estão concluídas E o miniteste foi aprovado.
  function summarize(state, now) {
    const done = state.done || {}, rev = state.rev || {}, tests = state.tests || {};
    let xp = 0, exDone = 0, firstTry = 0, testsPassed = 0, perfectTests = 0, allOk = 0, allTot = 0;
    const lessonsDone = [], chaptersDone = [], perChapter = {};
    for (const [id, d] of Object.entries(done)) {
      const e = EXS[id]; if (!e) continue;
      exDone++; if ((d.tries || 1) <= 1) firstTry++;
      xp += exXp(e, d.tries || 1, d.hints || 0);
    }
    for (const c of C.CHAPTERS) {
      let ok = 0, tot = 0, lessonsOk = 0;
      for (const l of c.lessons) {
        const n = l.ex.filter((e) => done[e.id] || rev[e.id]).length;
        tot += l.ex.length; ok += n;
        if (n === l.ex.length) { lessonsDone.push(l.id); lessonsOk++; xp += LESSON_BONUS; }
      }
      const t = tests[c.id] || {};
      const unlocked = lessonsOk === c.lessons.length;
      const passed = unlocked && (t.best || 0) >= C.PASS_MARK;
      if (passed) { chaptersDone.push(c.id); xp += CHAPTER_BONUS; testsPassed++; if (t.best === 100) perfectTests++; }
      perChapter[c.id] = { ok, tot, lessonsOk, lessons: c.lessons.length, unlocked, test: { best: t.best || 0, attempts: t.attempts || 0, passed },
        pct: Math.round((100 * (ok + (passed ? TEST_WEIGHT : 0))) / (tot + TEST_WEIGHT)), complete: passed };
      allOk += ok + (passed ? TEST_WEIGHT : 0); allTot += tot + TEST_WEIGHT;
    }
    const streak = streakOf(state.days, now);
    const level = levelOf(xp);
    const s = { xp, level, title: titleOf(level), exDone, firstTry, testsPassed, perfectTests, lessonsDone, chaptersDone, perChapter, streak,
      pct: Math.round((100 * allOk) / allTot), next: levelStart(level + 1), cur: levelStart(level) };
    s.badges = C.BADGES.filter((b) => b.test(s)).map((b) => b.id);
    return s;
  }

  const api = { BASE, baseOf, HINT_COST, PASS_MARK: C.PASS_MARK, LESSON_BONUS, CHAPTER_BONUS, EXS, TOTAL_EX, exXp, levelOf, levelStart, titleOf, dayKey, streakOf, summarize };
  if (typeof module !== 'undefined') module.exports = api; else root.SCORE = api;
})(typeof window !== 'undefined' ? window : globalThis);
