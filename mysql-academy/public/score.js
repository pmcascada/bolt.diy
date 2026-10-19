/* Pontuação e níveis – partilhado entre a app (browser) e o servidor (Node),
   para que o ranking seja recalculado a partir do progresso e não só "confiado". */
(function (root) {
  const C = typeof require !== 'undefined' ? require('./content.js') : root.CONTENT;
  const BASE = { quiz: 10, code: 15, query: 20 };
  const LESSON_BONUS = 20, CHAPTER_BONUS = 100, HINT_COST = 3;
  const TITLES = ['Aprendiz', 'Explorador', 'Consultor', 'Analista', 'Arquiteto', 'Mestre', 'Lenda'];

  const EXS = {};
  C.CHAPTERS.forEach((c) => c.lessons.forEach((l) => l.ex.forEach((e) => (EXS[e.id] = e))));
  const TOTAL_EX = Object.keys(EXS).length;

  const exXp = (type, tries, hints) =>
    Math.max(1, (tries <= 1 ? BASE[type] : Math.round(BASE[type] * 0.6)) - HINT_COST * (hints || 0));

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

  function summarize(state, now) {
    const done = state.done || {};
    let xp = 0, exDone = 0, firstTry = 0;
    const lessonsDone = [], chaptersDone = [], perChapter = {};
    for (const [id, d] of Object.entries(done)) {
      const e = EXS[id]; if (!e) continue;
      exDone++; if ((d.tries || 1) <= 1) firstTry++;
      xp += exXp(e.t, d.tries || 1, d.hints || 0);
    }
    for (const c of C.CHAPTERS) {
      let ok = 0, tot = 0, lessonsOk = 0;
      for (const l of c.lessons) {
        const n = l.ex.filter((e) => done[e.id]).length;
        tot += l.ex.length; ok += n;
        if (n === l.ex.length) { lessonsDone.push(l.id); lessonsOk++; xp += LESSON_BONUS; }
      }
      const complete = lessonsOk === c.lessons.length;
      if (complete) { chaptersDone.push(c.id); xp += CHAPTER_BONUS; }
      perChapter[c.id] = { ok, tot, pct: Math.round((100 * ok) / tot), complete };
    }
    const streak = streakOf(state.days, now);
    const level = levelOf(xp);
    const s = { xp, level, title: titleOf(level), exDone, firstTry, lessonsDone, chaptersDone, perChapter, streak,
      pct: Math.round((100 * exDone) / TOTAL_EX), next: levelStart(level + 1), cur: levelStart(level) };
    s.badges = C.BADGES.filter((b) => b.test(s)).map((b) => b.id);
    return s;
  }

  const api = { BASE, HINT_COST, LESSON_BONUS, CHAPTER_BONUS, EXS, TOTAL_EX, exXp, levelOf, levelStart, titleOf, dayKey, streakOf, summarize };
  if (typeof module !== 'undefined') module.exports = api; else root.SCORE = api;
})(typeof window !== 'undefined' ? window : globalThis);
