const log = console.log; console.log = () => {};
const { sheets, BEATS } = await import('./parse.mjs');
console.log = log;
const short = (t) => t.replace(/^(The |A )/, '').split(/[ ,:!]/)[0];
// ---- consensus board: 40 slots on the card clock; each show contributes the unit covering the slot centre
log('== CONSENSUS BOARD (card clock, 40 slots; label share · sung share · example) ==');
for (let k = 0; k < 40; k++) {
  const c = (k + 0.5) / 40, picks = [];
  for (const s of sheets) { const n = s.cards.length, u = s.cards[Math.min(n - 1, Math.floor(c * n))]; picks.push({ s, u }); }
  const lab = {}; picks.forEach(({ u }) => (u.labels.length ? u.labels : ['—']).forEach(l => lab[l] = (lab[l] || 0) + 1 / (u.labels.length || 1)));
  const top = Object.entries(lab).sort((a, b) => b[1] - a[1]);
  const sung = picks.filter(({ u }) => u.type[0] === 'S').length;
  const a2 = picks.filter(({ u }) => u.act === 'A2').length;
  const ex = picks.filter(({ u }) => u.labels.includes(top[0][0])).slice(0, 2).map(({ s, u }) => `${short(s.title)}: ${u.type[0] === 'S' ? '♪' + u.title : u.event.slice(0, 60)}`).join(' | ');
  log(`${String(k + 1).padStart(2)} ${top.slice(0, 2).map(([l, v]) => `${l} ${Math.round(v)}`).join(', ').padEnd(38)} sung ${String(sung).padStart(2)}/20 A2 ${String(a2).padStart(2)}  ${ex}`);
}
// ---- checks
log('\n== ACT ONE CURTAIN: label of the last A1 unit ==');
log(sheets.map(s => { const u = [...s.cards].reverse().find(x => x.act === 'A1'); return `${short(s.title)}: ${u.rawLabel}`; }).join(' · '));
log('\n== ALL IS LOST in Act One ==');
sheets.forEach(s => { const u = s.cards.find(x => x.labels.includes('All Is Lost')); if (u && u.act === 'A1') log(`  ${s.title}: ${u.type} ${u.title} | ${u.event}`); });
log('\n== B STORY before or after BREAK INTO TWO (card order), by era ==');
for (const [lab, f] of [['pre-1990', y => y < 1990], ['1990+', y => y >= 1990]]) {
  const r = sheets.filter(s => f(s.year)).map(s => { const b = s.cards.findIndex(x => x.labels.includes('B Story')), t = s.cards.findIndex(x => x.labels.includes('Break into Two')); return `${short(s.title)} ${b < t ? 'BEFORE' : 'after'}`; });
  log(`  ${lab}: ${r.join(', ')}`);
}
log('\n== sung units by beat (who sings the beats) ==');
for (const b of ['Theme Stated', 'Catalyst', 'Break into Two', 'Dark Night of the Soul', 'Break into Three', 'Final Image']) {
  const us = sheets.flatMap(s => s.cards.filter(x => x.labels.includes(b)).slice(0, 1).map(u => ({ s, u })));
  log(`  ${b}: sung → ${us.filter(x => x.u.type[0] === 'S').map(x => `${short(x.s.title)} ♪${x.u.title}`).join('; ')}`);
  log(`     spoken → ${us.filter(x => x.u.type === 'B').map(x => `${short(x.s.title)}: ${x.u.event.slice(0, 55)}`).join('; ')}`);
}
