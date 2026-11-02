/* HideMarkov process mining mini game. Vanilla JS, no dependencies. All data is fictional. */
(function () {
  'use strict';

  var CASES = 80;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Processes (one per level). Each game draws new probabilities. ---------- */
  function pick(r, a, b) { return a + (b - a) * r(); }
  function split3(r, rest) {
    var w = [pick(r, 0.4, 0.6), pick(r, 0.2, 0.35), pick(r, 0.08, 0.2)], s = w[0] + w[1] + w[2];
    return shuffle(w.map(function (x) { return x / s * rest; }), r);
  }
  var PROCS = [
    { // Level 1: order to cash
      file: 'orders', pre: 'A', start: 'rec', warm: 'rec', ask: ['chk', 'app', 'inv'],
      cfg: { d: 0, rounds: 4, ms: 9000, opts: 3, snips: 9, gap: 0.1 },
      map: { invB: 'inv', payB: 'pay', shp2: 'shp' },
      build: function (r) {
        var strict = r() < 0.35;
        var pA = strict ? pick(r, 0.28, 0.36) : pick(r, 0.55, 0.7), pR = strict ? pick(r, 0.42, 0.5) : pick(r, 0.1, 0.2);
        var sf = r() < 0.5 ? pick(r, 0.65, 0.85) : pick(r, 0.15, 0.35), rw = r() < 0.35 ? pick(r, 0.56, 0.64) : pick(r, 0.12, 0.3);
        return { rec: [['chk', 1]], chk: [['chk', 1 - pA - pR], ['app', pA], ['rej', pR]], app: [['shp', sf], ['invB', 1 - sf]],
          shp: [['inv', 1]], inv: [['inv', rw], ['pay', 1 - rw]], invB: [['invB', rw], ['payB', 1 - rw]], payB: [['shp2', 1]] };
      },
      layout: {
        wide: { w: 1100, h: 470, pos: { rec: [100, 250], chk: [310, 250], app: [520, 140], rej: [520, 380], shp: [730, 140], inv: [950, 140], pay: [950, 360] },
          loops: { chk: 'top', inv: 'top' }, bend: { 'app>inv': -95, 'pay>shp': -30 } },
        tall: { w: 500, h: 920, pos: { rec: [250, 50], chk: [250, 190], app: [170, 350], rej: [390, 350], shp: [170, 520], inv: [170, 690], pay: [170, 860] },
          loops: { chk: 'right', inv: 'right' }, bend: { 'app>inv': 215, 'pay>shp': 440 } }
      }
    },
    { // Level 2: loan approval at a bank
      file: 'loans', pre: 'K', start: 'app', warm: 'app', ask: ['doc', 'sco', 'off'],
      cfg: { d: 1, rounds: 4, ms: 8000, opts: 3, snips: 8, gap: 0.08 },
      build: function (r) {
        var miss = r() < 0.3 ? pick(r, 0.56, 0.64) : pick(r, 0.15, 0.4), ok = r() < 0.3 ? pick(r, 0.25, 0.4) : pick(r, 0.6, 0.8), w = split3(r, 1);
        return { app: [['doc', 1]], doc: [['req', miss], ['sco', 1 - miss]], req: [['doc', 1]], sco: [['off', ok], ['dec', 1 - ok]],
          off: [['off', w[0]], ['wd', w[1]], ['sig', w[2]]], sig: [['pay', 1]] };
      },
      layout: {
        wide: { w: 1100, h: 440, pos: { app: [100, 150], doc: [310, 150], sco: [520, 150], off: [730, 150], sig: [940, 150], req: [310, 360], dec: [520, 360], wd: [730, 360], pay: [940, 360] },
          loops: { off: 'top' }, bend: {} },
        tall: { w: 560, h: 850, pos: { app: [190, 50], doc: [190, 180], req: [430, 180], sco: [190, 330], dec: [430, 330], off: [190, 490], wd: [430, 570], sig: [190, 650], pay: [190, 800] },
          loops: { off: 'left' }, bend: {} }
      }
    },
    { // Level 3: returns
      file: 'returns', pre: 'R', start: 'req', ask: ['req', 'chk', 'rep', 'exc'],
      cfg: { d: 1, rounds: 4, ms: 8000, opts: 3, snips: 8, gap: 0.08 },
      build: function (r) {
        var c = r() < 0.25 ? pick(r, 0.56, 0.66) : pick(r, 0.08, 0.3), re = pick(r, 0.05, 0.15), w = split3(r, 1 - re);
        var x = r() < 0.5 ? pick(r, 0.6, 0.75) : pick(r, 0.25, 0.4), y = r() < 0.3 ? pick(r, 0.58, 0.7) : pick(r, 0.15, 0.35);
        return { req: [['cnc', c], ['rcv', 1 - c]], rcv: [['chk', 1]], chk: [['chk', re], ['ref', w[0]], ['exc', w[1]], ['rep', w[2]]],
          rep: [['chk', x], ['snd', 1 - x]], exc: [['ref', y], ['snd', 1 - y]], ref: [['cls', 1]], snd: [['cls', 1]] };
      },
      layout: {
        wide: { w: 1100, h: 470, pos: { req: [100, 140], cnc: [100, 370], rcv: [310, 140], chk: [520, 250], ref: [750, 80], exc: [750, 250], rep: [750, 410], cls: [980, 80], snd: [980, 330] },
          loops: { chk: 'bottom' }, bend: {} },
        tall: { w: 580, h: 820, pos: { req: [150, 50], cnc: [430, 50], rcv: [150, 190], chk: [290, 340], ref: [100, 520], exc: [290, 600], rep: [480, 520], cls: [100, 760], snd: [400, 760] },
          loops: { chk: 'right' }, bend: { 'exc>ref': 30, 'chk>exc': 30 } }
      }
    },
    { // Level 4: an insurer calculates a premium quote
      file: 'quotes', pre: 'V', start: 'req', ask: ['dat', 'miss', 'tar', 'man', 'off'],
      cfg: { d: 2, rounds: 5, ms: 7000, opts: 4, snips: 7, gap: 0.07 },
      build: function (r) {
        var w = split3(r, 1), v = split3(r, 1);
        return { req: [['dat', 1]], dat: [['miss', r() < 0.3 ? pick(r, 0.55, 0.62) : pick(r, 0.12, 0.38)], ['tar', 0.6]],
          miss: [['dat', pick(r, 0.2, 0.8)], ['tar', 0.5]], tar: [['man', w[0]], ['dis', w[1]], ['off', w[2]]],
          man: [['tar', pick(r, 0.2, 0.8)], ['off', 0.5]], dis: [['off', 1]], off: [['dat', v[0]], ['rej', v[1]], ['acc', v[2]]] };
      },
      layout: {
        wide: { w: 1100, h: 480, pos: { req: [100, 240], dat: [310, 240], miss: [310, 420], dis: [645, 75], tar: [530, 240], man: [530, 420], off: [760, 240], acc: [990, 130], rej: [990, 360] },
          loops: {}, bend: { 'off>dat': 110 } },
        tall: { w: 560, h: 840, pos: { req: [190, 50], dat: [190, 180], miss: [430, 180], tar: [190, 350], man: [430, 350], dis: [430, 520], off: [190, 600], acc: [110, 780], rej: [400, 780] },
          loops: {}, bend: { 'off>dat': -230, 'man>off': 30 } }
      }
    },
    { // Level 5: support tickets with ping pong loops
      file: 'tickets', pre: 'T', start: 'opn', ask: ['opn', 'tri', 'ans', 'wai', 'esc', 'sol', 'reo'],
      cfg: { d: 2, rounds: 5, ms: 7000, opts: 4, snips: 7, gap: 0.07 },
      build: function (r) {
        var w = split3(r, 1);
        return { opn: [['ans', pick(r, 0.15, 0.85)], ['tri', 0.5]], tri: [['esc', pick(r, 0.15, 0.6)], ['ans', 0.5]],
          ans: [['wai', pick(r, 0.35, 0.8)], ['sol', 0.4]], wai: [['ans', w[0]], ['esc', w[1]], ['sol', w[2]]],
          esc: [['ans', pick(r, 0.25, 0.75)], ['sol', 0.5]], sol: [['reo', pick(r, 0.1, 0.45)], ['cls', 0.6]],
          reo: [['tri', pick(r, 0.2, 0.8)], ['ans', 0.5]] };
      },
      layout: {
        wide: { w: 1120, h: 490, pos: { opn: [100, 245], tri: [300, 120], esc: [520, 45], ans: [520, 245], wai: [770, 150], sol: [770, 380], reo: [520, 440], cls: [1010, 380] },
          loops: {}, bend: { 'esc>sol': -40, 'reo>tri': -40 } },
        tall: { w: 580, h: 930, pos: { opn: [290, 50], tri: [110, 205], esc: [470, 205], ans: [290, 370], wai: [470, 535], sol: [290, 705], reo: [100, 535], cls: [290, 880] },
          loops: {}, bend: { 'esc>sol': -110, 'tri>esc': -60 } }
      }
    },
    { // Level 6: warehouse with steps in varying order
      file: 'warehouse', pre: 'W', start: 'rcv', ask: ['rcv', 'qc', 'pck', 'cnt', 'lab', 'pak'],
      cfg: { d: 3, rounds: 5, ms: 6000, opts: 4, snips: 6, gap: 0.05 },
      map: { labA: 'lab', labB: 'lab', pakA: 'pak', pakB: 'pak' },
      build: function (r) {
        var c = pick(r, 0.05, 0.3), l = pick(r, 0.3, 0.7), rp = pick(r, 0.05, 0.4), a = pick(r, 0.05, 0.25), b = pick(r, 0.1, 0.35);
        return { rcv: [['qc', pick(r, 0.3, 0.75)], ['sto', 0.5]], qc: [['qc', a], ['cnt', b], ['sto', pick(r, 0.2, 0.6)]],
          sto: [['pck', 1]], pck: [['cnt', c], ['labA', l * (1 - c)], ['pakA', (1 - l) * (1 - c)]], cnt: [['sto', pick(r, 0.2, 0.8)], ['pck', 0.5]],
          labA: [['pakB', 1]], pakA: [['pakA', rp], ['labB', 1 - rp]], pakB: [['pakB', rp], ['shp', 1 - rp]], labB: [['shp', 1]] };
      },
      layout: {
        wide: { w: 1240, h: 480, pos: { rcv: [100, 245], qc: [300, 110], cnt: [300, 390], sto: [510, 245], pck: [720, 245], lab: [930, 110], pak: [930, 380], shp: [1140, 245] },
          loops: { qc: 'top', pak: 'bottom' }, bend: { 'rcv>sto': 50 } },
        tall: { w: 580, h: 900, pos: { rcv: [290, 50], qc: [130, 190], sto: [420, 330], cnt: [130, 450], pck: [330, 580], lab: [120, 720], pak: [450, 720], shp: [290, 860] },
          loops: { qc: 'right', pak: 'bottom' }, bend: {} }
      }
    }
  ];

  /* ---------- Strings (one object per language) ---------- */
  var STR = {
    de: {
      htmlLang: 'de',
      title: 'Process Mining Minispiel - HideMarkov',
      introLabel: '> cat README.txt',
      intro1: 'Jedes Unternehmen hat einen versteckten Prozess.',
      intro2: 'Seine Spuren liegen in den Logs.',
      introSub: 'Finden Sie ihn in 60 Sekunden: Schauen Sie auf die Daten und tippen Sie, welcher Schritt als Nächstes kommt. Genau das macht Process Mining, nur automatisch.',
      start: '> Logs durchsuchen',
      startLevel: function (n) { return '> Level ' + n + ' spielen'; },
      levelsBtn: '> Levels ansehen',
      levelsTitle: 'Level wählen',
      levelsSub: 'Jedes Level ist ein anderer, fiktiver Prozess. Je höher, desto mehr Schleifen, knappere Prozente und weniger Zeit.',
      levelsBack: '> Zurück',
      diff: ['Einfach', 'Mittel', 'Schwer', 'Experte'],
      meta: function (c) { return c.rounds + ' Runden, ' + (c.ms / 1000) + ' s, ' + c.opts + ' Antworten'; },
      locked: function (n, need, rounds) { return 'Gesperrt: ' + need + '/' + rounds + ' richtig in Level ' + n; },
      play: '> Spielen',
      lockedBtn: 'Gesperrt',
      bestOf: function (b) { return 'Rekord ' + b; },
      noBest: 'Noch nicht gespielt',
      best: function (b) { return 'Ihr Rekord: ' + b + ' Punkte'; },
      level: 'Level', round: 'Runde', score: 'Punkte',
      combo: function (n) { return 'Combo x' + n; },
      rawCap: 'Rohdaten: jede Zeile = Zeit, Fall, Schritt. Alles durcheinander.',
      sortCap: 'Nach Fall sortiert. Grün = der Schritt direkt danach.',
      sorting: function (e, c) { return '> sortiere ' + e + ' Ereignisse nach ' + c + ' Fällen ...'; },
      askLabel: function (i, n) { return '> frage ' + i + '/' + n; },
      q: function (x) { return 'Welcher Schritt folgt am häufigsten auf <span class="x">' + x + '</span>?'; },
      optsAria: function (n) { return 'Antworten, Tasten 1 bis ' + n; },
      right: 'Richtig!', wrong: 'Knapp daneben.', timeout: 'Zeit abgelaufen.',
      fact: function (x, y, p) { return 'Im ganzen Log folgt auf <b>' + x + '</b> in <b>' + p + '%</b> der Fälle <b>' + y + '</b>.'; },
      watching: 'Beobachten Sie die Daten ...',
      revealTitle: function (n) { return 'Der versteckte Prozess: ' + n; },
      result: function (s, c, n) { return 'Punkte <b>' + s + '</b> &nbsp; Richtig <b>' + c + '/' + n + '</b>'; },
      newBest: 'Neuer Rekord!',
      bestShort: function (b) { return 'Rekord ' + b; },
      unlocked: function (n) { return 'Level ' + n + ' freigeschaltet!'; },
      allDone: 'Alle Level geschafft!',
      ranks: ['Rang: Log-Rauschen', 'Rang: Spur gefunden', 'Rang: Muster erkannt', 'Rang: Prozess entdeckt', 'Rang: Process Miner'],
      revealText: 'Das ist ein Directly-Follows-Graph: Kästen sind Schritte, Pfeile zeigen, wie oft ein Schritt direkt auf einen anderen folgt. Schleifen sind Nacharbeit.',
      revealText2: 'Mit Häufigkeiten gelesen wirkt er wie eine Markov-Kette der Aktivitäten, versteckt in den Daten.',
      step1: 'Logs sammeln', step2: 'nach Fall ordnen', step3: 'Prozess entdecken',
      revealNote: 'Genau genommen ist das kein formales Hidden-Markov-Modell, sondern gezählte Übergänge. Jedes Spiel erzeugt einen neuen, fiktiven Prozess.',
      graphDesc: function (list) { return 'Directly-Follows-Graph mit Übergangshäufigkeiten: ' + list; },
      nextLevel: function (n) { return '> Weiter mit Level ' + n; },
      retry: '> Level nochmal',
      toCode: '> So macht es PM4Py',
      codeTitle: 'So macht es PM4Py',
      codeText: 'PM4Py ist eine Open-Source-Python-Bibliothek für Process Mining.',
      codeNote: 'discover_dfg liefert absolute Häufigkeiten. Die Prozente im Graph sind diese Zahlen geteilt durch alle Übergänge ab demselben Schritt.',
      c1: '# Event Log laden (pandas DataFrame)',
      c2: '# Directly-Follows-Graph: (Schritt, nächster Schritt) -> Anzahl',
      c3: '# Prozessmodell als Petri-Netz (Inductive Miner)',
      cta: 'Möchten Sie Ihren eigenen versteckten Prozess sehen?',
      ctaBtn: '> Kontakt aufnehmen',
      ctaHref: 'https://hidemarkov.com/#kontakt',
      again: '> Nochmal spielen',
      foot: 'Fiktive Daten. Keine Cookies, kein Tracking.',
      proc: [
        { name: 'Bestellung', act: { rec: 'Auftrag erhalten', chk: 'Bonität prüfen', app: 'Freigeben', rej: 'Ablehnen', shp: 'Versenden', inv: 'Rechnung stellen', pay: 'Zahlung erhalten' } },
        { name: 'Kreditvergabe', act: { app: 'Antrag eingegangen', doc: 'Unterlagen prüfen', req: 'Unterlagen anfordern', sco: 'Bonität bewerten', off: 'Angebot erstellen', dec: 'Ablehnen', wd: 'Zurück\u00ADgezogen', sig: 'Vertrag signiert', pay: 'Auszahlen' } },
        { name: 'Retoure', act: { req: 'Retoure angemeldet', cnc: 'Storniert', rcv: 'Ware eingegangen', chk: 'Ware prüfen', ref: 'Erstatten', exc: 'Umtauschen', rep: 'Reparieren', snd: 'Zurück\u00ADsenden', cls: 'Abschließen' } },
        { name: 'Versicherungsprämie', act: { req: 'Anfrage erhalten', dat: 'Daten erfassen', miss: 'Rückfrage Kunde', tar: 'Prämie berechnen', man: 'Manuell prüfen', dis: 'Rabatt anwenden', off: 'Angebot senden', acc: 'Police ausgestellt', rej: 'Abgelehnt' } },
        { name: 'Support-Ticket', act: { opn: 'Ticket eröffnet', tri: 'Einordnen', ans: 'Antworten', wai: 'Kunde antwortet', esc: 'Eskalieren', sol: 'Lösen', reo: 'Wieder\u00ADeröffnen', cls: 'Schließen' } },
        { name: 'Lager', act: { rcv: 'Ware angenommen', qc: 'Qualität prüfen', sto: 'Einlagern', pck: 'Kommis\u00ADsionieren', cnt: 'Nachzählen', lab: 'Etikett drucken', pak: 'Verpacken', shp: 'Versenden' } }
      ]
    },
    en: {
      htmlLang: 'en',
      title: 'Process Mining Mini Game - HideMarkov',
      introLabel: '> cat README.txt',
      intro1: 'Every company runs a hidden process.',
      intro2: 'Its traces sit in the logs.',
      introSub: 'Find it in 60 seconds: watch the data and tap which step comes next. That is exactly what process mining does, just automatically.',
      start: '> Mine the logs',
      startLevel: function (n) { return '> Play level ' + n; },
      levelsBtn: '> View levels',
      levelsTitle: 'Choose a level',
      levelsSub: 'Every level is a different, fictional process. The higher you go, the more loops, the closer the percentages and the less time.',
      levelsBack: '> Back',
      diff: ['Easy', 'Medium', 'Hard', 'Expert'],
      meta: function (c) { return c.rounds + ' rounds, ' + (c.ms / 1000) + ' s, ' + c.opts + ' answers'; },
      locked: function (n, need, rounds) { return 'Locked: get ' + need + '/' + rounds + ' right in level ' + n; },
      play: '> Play',
      lockedBtn: 'Locked',
      bestOf: function (b) { return 'Best ' + b; },
      noBest: 'Not played yet',
      best: function (b) { return 'Your best: ' + b + ' points'; },
      level: 'Level', round: 'Round', score: 'Score',
      combo: function (n) { return 'Combo x' + n; },
      rawCap: 'Raw data: each line = time, case, step. All mixed up.',
      sortCap: 'Sorted by case. Green = the step right after.',
      sorting: function (e, c) { return '> sorting ' + e + ' events into ' + c + ' cases ...'; },
      askLabel: function (i, n) { return '> question ' + i + '/' + n; },
      q: function (x) { return 'Which step most often follows <span class="x">' + x + '</span>?'; },
      optsAria: function (n) { return 'Answers, keys 1 to ' + n; },
      right: 'Correct!', wrong: 'Not quite.', timeout: 'Time is up.',
      fact: function (x, y, p) { return 'In the full log, <b>' + y + '</b> follows <b>' + x + '</b> in <b>' + p + '%</b> of cases.'; },
      watching: 'Watch the data ...',
      revealTitle: function (n) { return 'The hidden process: ' + n; },
      result: function (s, c, n) { return 'Score <b>' + s + '</b> &nbsp; Correct <b>' + c + '/' + n + '</b>'; },
      newBest: 'New best!',
      bestShort: function (b) { return 'Best ' + b; },
      unlocked: function (n) { return 'Level ' + n + ' unlocked!'; },
      allDone: 'All levels cleared!',
      ranks: ['Rank: Log noise', 'Rank: Trace found', 'Rank: Pattern spotted', 'Rank: Process discovered', 'Rank: Process miner'],
      revealText: 'This is a directly-follows graph: boxes are steps, arrows show how often one step directly follows another. Loops are rework.',
      revealText2: 'Read with frequencies, it works like a Markov chain of activities hidden in the data.',
      step1: 'collect logs', step2: 'sort by case', step3: 'discover the process',
      revealNote: 'Strictly speaking, this is not a formal hidden Markov model, just counted transitions. Every game generates a new, fictional process.',
      graphDesc: function (list) { return 'Directly-follows graph with transition frequencies: ' + list; },
      nextLevel: function (n) { return '> On to level ' + n; },
      retry: '> Retry level',
      toCode: '> This is how PM4Py does it',
      codeTitle: 'This is how PM4Py does it',
      codeText: 'PM4Py is an open-source Python library for process mining.',
      codeNote: 'discover_dfg returns absolute frequencies. The percentages in the graph are those counts divided by all transitions leaving the same step.',
      c1: '# load the event log (pandas DataFrame)',
      c2: '# directly-follows graph: (step, next step) -> count',
      c3: '# process model as a Petri net (Inductive Miner)',
      cta: 'Want to see your own hidden process?',
      ctaBtn: '> Get in touch',
      ctaHref: 'https://hidemarkov.com/en/#kontakt',
      again: '> Play again',
      foot: 'Fictional data. No cookies, no tracking.',
      proc: [
        { name: 'Order', act: { rec: 'Order received', chk: 'Check credit', app: 'Approve', rej: 'Reject', shp: 'Ship', inv: 'Invoice', pay: 'Pay' } },
        { name: 'Loan approval', act: { app: 'Application received', doc: 'Check documents', req: 'Request documents', sco: 'Credit scoring', off: 'Make offer', dec: 'Decline', wd: 'Withdrawn', sig: 'Contract signed', pay: 'Pay out' } },
        { name: 'Returns', act: { req: 'Return requested', cnc: 'Cancelled', rcv: 'Item received', chk: 'Inspect item', ref: 'Refund', exc: 'Exchange', rep: 'Repair', snd: 'Send back', cls: 'Close' } },
        { name: 'Insurance premium', act: { req: 'Quote requested', dat: 'Enter details', miss: 'Ask customer', tar: 'Calculate premium', man: 'Manual review', dis: 'Apply discount', off: 'Send quote', acc: 'Policy issued', rej: 'Declined' } },
        { name: 'Support ticket', act: { opn: 'Ticket opened', tri: 'Triage', ans: 'Reply', wai: 'Customer replies', esc: 'Escalate', sol: 'Resolve', reo: 'Reopen', cls: 'Close' } },
        { name: 'Warehouse', act: { rcv: 'Goods received', qc: 'Quality check', sto: 'Store', pck: 'Pick', cnt: 'Recount', lab: 'Print label', pak: 'Pack', shp: 'Ship' } }
      ]
    }
  };

  /* ---------- Helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function qs() { var o = {}; location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (m, k, v) { o[k] = decodeURIComponent(v); }); return o; }
  var params = qs();
  var lang = params.lang === 'en' || params.lang === 'de' ? params.lang :
    ((navigator.language || 'de').toLowerCase().indexOf('de') === 0 ? 'de' : 'en');
  function T() { return STR[lang]; }
  function A(id) { return STR[lang].proc[S.lv].act[id]; }
  function AP(id) { return A(id).replace(/\u00AD/g, ''); }
  function PN(lv) { return STR[lang].proc[lv].name; }
  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function focusH(id) { var h = $(id); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }

  /* Progress: unlocked level count and best score per level. Kept in memory if storage is blocked. */
  var PROG = { unlocked: 1, best: [0, 0, 0, 0, 0, 0] };
  try { var saved = JSON.parse(localStorage.getItem('hm_pm_prog2') || 'null'); if (saved && saved.best) PROG = saved; } catch (e) { /* ignore */ }
  if (params.unlock === 'all') PROG.unlocked = PROCS.length;
  function saveProg() { try { localStorage.setItem('hm_pm_prog2', JSON.stringify(PROG)); } catch (e) { /* ignore */ } }
  function needFor(lv) { return PROCS[lv].cfg.rounds - 1; }

  /* ---------- Event log generation ---------- */
  function walk(p, tr, r) {
    var s = p.start, out = [], visits = {};
    while (s && out.length < 40) {
      out.push((p.map && p.map[s]) || s);
      visits[s] = (visits[s] || 0) + 1;
      var opts = tr[s];
      if (!opts) break;
      var ok = opts.filter(function (o) { return (visits[o[0]] || 0) < 4; });
      if (!ok.length) ok = [opts[opts.length - 1]];
      var sum = ok.reduce(function (t, o) { return t + o[1]; }, 0), u = r() * sum, next = ok[ok.length - 1][0];
      for (var i = 0; i < ok.length; i++) { u -= ok[i][1]; if (u <= 0) { next = ok[i][0]; break; } }
      s = next;
    }
    return out;
  }
  function makeLog(p, r) {
    var tr = p.build(r), cases = [], events = [];
    var base = Date.UTC(2026, 2, 2, 7, 0, 0), prefix = p.pre;
    for (var i = 0; i < CASES; i++) {
      var id = prefix + '-' + (1040 + i * 3 + Math.floor(r() * 3));
      var t = walk(p, tr, r), ts = base + Math.floor(r() * 3 * 24 * 60) * 60000;
      cases.push({ id: id, trace: t });
      for (var j = 0; j < t.length; j++) {
        events.push({ c: id, a: t[j], t: ts });
        ts += (5 + Math.floor(r() * 300)) * 60000 + Math.floor(r() * 60) * 1000;
      }
    }
    events.sort(function (x, y) { return x.t - y.t; });
    // directly-follows counts, derived from the generated log itself
    var dfg = {}, out = {};
    cases.forEach(function (c) {
      for (var j = 0; j < c.trace.length - 1; j++) {
        var a = c.trace[j], b = c.trace[j + 1];
        dfg[a] = dfg[a] || {}; dfg[a][b] = (dfg[a][b] || 0) + 1;
        out[a] = (out[a] || 0) + 1;
      }
    });
    return { cases: cases, events: events, dfg: dfg, out: out };
  }
  function successors(log, x) {
    var d = log.dfg[x] || {};
    return Object.keys(d).map(function (b) { return { b: b, n: d[b], p: d[b] / log.out[x] }; })
      .sort(function (u, v) { return v.n - u.n; });
  }
  function pct(v) { return Math.round(v * 100); }
  function acts(p) { return Object.keys(p.layout.wide.pos); }

  /* ---------- State ---------- */
  var S = { lv: 0, screen: 'intro', games: 0 };
  function clearQuestion(log, x, gap) {
    var s = successors(log, x);
    return s.length > 1 && s[0].n - s[1].n >= 3 && s[0].p - s[1].p >= gap;
  }
  function newGame(lv) {
    var p = PROCS[lv], cfg = p.cfg;
    var seed = params.seed ? (parseInt(params.seed, 10) || 1) + S.games * 7919 + lv : Math.floor(Math.random() * 1e9);
    var r = rng(seed), log, xs = [], need = cfg.rounds - (p.warm ? 1 : 0);
    for (var tries = 0; tries < 40; tries++) {
      log = makeLog(p, r);
      xs = shuffle(p.ask.filter(function (x) { return clearQuestion(log, x, cfg.gap); }), r);
      if (xs.length >= need) break;
    }
    // last resort: relax the gap rule, never ask a question without a clear winner
    if (xs.length < need) xs = xs.concat(p.ask.filter(function (x) { return xs.indexOf(x) < 0 && clearQuestion(log, x, 0); }));
    xs = xs.slice(0, need);
    if (p.warm) xs.unshift(p.warm);
    S = { lv: lv, games: S.games + 1, r: r, log: log, cfg: cfg, screen: S.screen,
      rounds: xs.map(function (x) { return makeRound(p, log, x, r, cfg); }),
      i: -1, score: 0, correct: 0, streak: 0 };
  }
  function makeRound(p, log, x, r, cfg) {
    var succ = successors(log, x), correct = succ[0].b;
    var opts = [correct];
    succ.slice(1).forEach(function (s) { if (opts.length < cfg.opts) opts.push(s.b); });
    var pool = shuffle(acts(p).filter(function (a) { return a !== x && opts.indexOf(a) < 0; }), r);
    while (opts.length < cfg.opts && pool.length) opts.push(pool.shift());
    // sample of case snippets whose majority matches the full log (fair: what you see is what is true)
    var occ = [];
    log.cases.forEach(function (c) {
      for (var j = 0; j < c.trace.length - 1; j++) if (c.trace[j] === x) occ.push({ c: c.id, tr: c.trace, j: j });
    });
    var snips, good = false;
    for (var t = 0; t < 60 && !good; t++) {
      snips = shuffle(occ.slice(), r).slice(0, cfg.snips);
      good = sampleTop(snips) === correct;
    }
    if (!good) {
      var right = occ.filter(function (o) { return o.tr[o.j + 1] === correct; });
      for (var k = 0; k < snips.length && sampleTop(snips) !== correct; k++) {
        if (snips[k].tr[snips[k].j + 1] !== correct) snips[k] = right[k % right.length];
      }
    }
    return { x: x, correct: correct, p: succ[0].p, opts: shuffle(opts, r), snips: snips, answered: null, gain: 0 };
  }
  function sampleTop(snips) {
    var cnt = {}; snips.forEach(function (s) { var b = s.tr[s.j + 1]; cnt[b] = (cnt[b] || 0) + 1; });
    var k = Object.keys(cnt).sort(function (u, v) { return cnt[v] - cnt[u]; });
    return k.length > 1 && cnt[k[0]] === cnt[k[1]] ? null : k[0];
  }

  /* ---------- Screens ---------- */
  var screens = ['intro', 'levels', 'play', 'reveal', 'code'];
  function show(name) {
    S.screen = name;
    screens.forEach(function (s) { $('s-' + s).hidden = s !== name; });
    window.scrollTo(0, 0);
    // Embedded in hidemarkov.com: bring the game's top back into view when it is scrolled above the screen
    try {
      var fe = window.frameElement;
      if (fe && fe.getBoundingClientRect().top < 0) fe.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (e) { /* cross-origin parent: nothing to do */ }
  }
  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(S.raf); }

  function bestTotal() { return Math.max.apply(null, PROG.best.map(function (b) { return b || 0; })); }
  function applyStatic() {
    var t = T();
    document.documentElement.lang = t.htmlLang;
    document.title = t.title;
    each('[data-t]', function (el) { var v = t[el.getAttribute('data-t')]; if (typeof v === 'string') el.textContent = v; });
    each('.btn-lang', function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    $('cta-link').href = t.ctaHref;
    var best = bestTotal();
    $('best-intro').hidden = !best; $('best-intro').textContent = best ? t.best(best) : '';
    var top = Math.min(PROG.unlocked, PROCS.length);
    $('btn-start').textContent = top > 1 ? t.startLevel(top) : t.start;
  }
  function setLang(l) {
    lang = l; applyStatic();
    if (S.screen === 'levels') renderLevels();
    if (S.screen === 'play') renderPlay();
    if (S.screen === 'reveal') renderReveal(false);
    if (S.screen === 'code') renderCode();
  }

  /* ---------- Level select ---------- */
  function showLevels() {
    clearTimers(); show('levels'); renderLevels(); focusH('levels-h');
  }
  function renderLevels() {
    var t = T(), box = $('level-list');
    box.innerHTML = '';
    PROCS.forEach(function (p, lv) {
      var open = lv < PROG.unlocked, li = document.createElement('li');
      var lockTxt = lv ? t.locked(lv, needFor(lv - 1), PROCS[lv - 1].cfg.rounds) : '';
      li.className = 'lvl' + (open ? '' : ' locked');
      var pips = '';
      for (var k = 0; k < 4; k++) pips += '<i class="' + (k <= p.cfg.d ? 'on' : '') + '"></i>';
      li.innerHTML = '<div class="lvl-top mono"><span>' + t.level + ' ' + (lv + 1) + '</span><span class="pips" aria-hidden="true">' + pips + '</span></div>' +
        '<h3>' + esc(PN(lv)) + '</h3>' +
        '<p class="lvl-diff mono">' + esc(t.diff[p.cfg.d]) + '</p>' +
        '<p class="lvl-meta mono">' + esc(t.meta(p.cfg)) + '</p>' +
        '<p class="lvl-best mono">' + esc(open ? (PROG.best[lv] ? t.bestOf(PROG.best[lv]) : t.noBest) : lockTxt) + '</p>';
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn mono' + (open ? ' btn-main' : '');
      b.textContent = open ? t.play : t.lockedBtn;
      b.disabled = !open;
      b.setAttribute('aria-label', t.level + ' ' + (lv + 1) + ', ' + PN(lv) + ', ' + t.diff[p.cfg.d] + (open ? '' : ', ' + lockTxt));
      if (open) b.addEventListener('click', function () { startPlay(lv); });
      li.appendChild(b);
      box.appendChild(li);
    });
  }

  /* ---------- Play: raw stream, then rounds ---------- */
  var body = $('term-body');
  function line(html, cls) {
    var d = document.createElement('div'); d.className = cls || 'ln'; d.innerHTML = html;
    body.appendChild(d);
    while (body.children.length > 40) body.removeChild(body.firstChild);
    return d;
  }
  function evLine(e) {
    var d = new Date(e.t);
    return '<span class="t"><span class="dt">' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' </span>' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + '<span class="sec">:' + pad(d.getUTCSeconds()) +
      '</span></span>  <span class="c">' + e.c + '</span>  <span class="a" data-a="' + e.a + '">' + esc(A(e.a)) + '</span>';
  }
  function startPlay(lv) {
    clearTimers(); newGame(lv === undefined ? S.lv : lv); show('play'); S.phase = 'raw';
    body.innerHTML = '';
    renderPlay();
    var n = 0, total = reduced ? 24 : 34;
    (function tick() {
      if (n >= total) return sortPhase();
      line(evLine(S.log.events[n]), 'ln new'); n++;
      later(tick, reduced ? 0 : 85);
    })();
  }
  function sortPhase() {
    S.phase = 'sort'; renderPlay();
    line('<span class="sys">' + esc(T().sorting(S.log.events.length, S.log.cases.length)) + '</span>', 'ln');
    later(nextRound, reduced ? 300 : 1100);
  }
  function nextRound() {
    S.i++;
    if (S.i >= S.rounds.length) return later(function () { showReveal(); }, 200);
    S.phase = 'round'; S.t0 = performance.now(); S.locked = false;
    renderPlay();
    focusH('play-h');
    var rd = S.rounds[S.i], k = 0;
    (function drip() {
      if (S.phase !== 'round' || k >= rd.snips.length) return;
      line(snipHtml(rd.snips[k], rd.x), 'snip ln new'); k++;
      rd.shown = k;
      later(drip, reduced ? 0 : 240);
    })();
    runTimer();
  }
  function snipHtml(s, x) {
    var h = '<span class="c">' + s.c + '&nbsp; </span>';
    if (s.j > 0) h += '<span class="p">' + esc(A(s.tr[s.j - 1])) + ' &gt;</span> ';
    h += '<span class="x">' + esc(A(x)) + '</span> &gt; <span class="n">' + esc(A(s.tr[s.j + 1])) + '</span>';
    return h;
  }
  function runTimer() {
    var fill = $('timer-fill');
    (function frame() {
      if (S.phase !== 'round' || S.locked) return;
      var left = 1 - (performance.now() - S.t0) / S.cfg.ms;
      if (left <= 0) { fill.style.transform = 'scaleX(0)'; return answer(null); }
      fill.style.transform = 'scaleX(' + left + ')';
      fill.classList.toggle('low', left < 0.3);
      S.raf = requestAnimationFrame(frame);
    })();
  }
  function updateHud() {
    var n = S.rounds.length;
    $('hud-level').textContent = (S.lv + 1) + ' ' + PN(S.lv);
    $('hud-round').textContent = Math.max(0, Math.min(S.i + 1, n)) + '/' + n;
    $('hud-score').textContent = S.score;
    var c = $('hud-combo'); c.hidden = S.streak < 2; c.textContent = T().combo(S.streak);
  }
  function renderPlay() {
    var t = T(), raw = S.phase === 'raw' || S.phase === 'sort', file = PROCS[S.lv].file;
    updateHud();
    $('term-title').textContent = raw ? '> tail -f ' + file + '.log' : '> hidemarkov --mine ' + file + '.log';
    $('term-cap').textContent = raw ? t.rawCap : t.sortCap;
    var opts = $('opts');
    if (raw) {
      $('ask-label').textContent = '> ...';
      $('play-h').textContent = t.watching;
      opts.innerHTML = ''; $('feedback').innerHTML = '';
      $('timer-fill').style.transform = 'scaleX(1)';
      each('#term-body [data-a]', function (el) { el.textContent = A(el.getAttribute('data-a')); });
      return;
    }
    var rd = S.rounds[S.i];
    $('ask-label').textContent = t.askLabel(S.i + 1, S.rounds.length);
    $('play-h').innerHTML = t.q(esc(A(rd.x)));
    opts.setAttribute('aria-label', t.optsAria(rd.opts.length));
    opts.className = 'opts n' + rd.opts.length;
    opts.innerHTML = '';
    rd.opts.forEach(function (a, n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.setAttribute('data-a', a);
      b.innerHTML = '<span class="k" aria-hidden="true">' + (n + 1) + '</span><span>' + esc(A(a)) + '</span>';
      b.addEventListener('click', function () { answer(a); });
      if (rd.answered !== null) {
        b.disabled = true;
        if (a === rd.correct) b.classList.add('right');
        else if (a === rd.answered) b.classList.add('wrong');
      }
      opts.appendChild(b);
    });
    // (re)draw the snippets already shown, e.g. after a language switch
    body.innerHTML = '';
    for (var k = 0; k < (rd.shown || 0); k++) line(snipHtml(rd.snips[k], rd.x), 'snip ln');
    if (rd.answered !== null) renderFeedback(rd); else $('feedback').innerHTML = '';
  }
  function answer(a) {
    if (S.phase !== 'round' || S.locked) return;
    S.locked = true; cancelAnimationFrame(S.raf);
    var rd = S.rounds[S.i];
    var left = Math.max(0, 1 - (performance.now() - S.t0) / S.cfg.ms);
    rd.answered = a === null ? '' : a;
    if (a === rd.correct) {
      S.streak++; S.correct++;
      rd.gain = (100 + Math.round(left * 100) + (S.streak >= 2 ? 50 * (S.streak - 1) : 0)) * (S.lv + 1);
      S.score += rd.gain;
    } else { S.streak = 0; rd.gain = 0; }
    S.phase = 'feedback';
    renderPlay();
    later(nextRound, 2000);
  }
  function renderFeedback(rd) {
    var t = T(), head = rd.answered === rd.correct ? t.right : (rd.answered === '' ? t.timeout : t.wrong);
    $('feedback').innerHTML = '<b>' + head + '</b>' + (rd.gain ? ' <span class="plus">+' + rd.gain + '</span>' : '') + '<br>' +
      t.fact(esc(A(rd.x)), esc(A(rd.correct)), pct(rd.p));
  }

  /* ---------- Reveal: directly-follows graph ---------- */
  var NW = 176, NH = 46, LFS = 14, PLACED = [];
  // percent labels must not touch a box, another label or the edge of the picture
  function labelBox(x, y, n) { var w = LFS * 0.6 * n + 6, h = LFS * 1.15; return { x: x - w / 2, y: y - h / 2, w: w, h: h }; }
  function hits(L, b) {
    for (var k in L.pos) {
      var q = L.pos[k];
      if (b.x < q[0] + NW / 2 + 2 && q[0] - NW / 2 - 2 < b.x + b.w && b.y < q[1] + NH / 2 + 2 && q[1] - NH / 2 - 2 < b.y + b.h) return true;
    }
    for (var i = 0; i < PLACED.length; i++) {
      var o = PLACED[i];
      if (b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h) return true;
    }
    return b.x < 0 || b.y < 0 || b.x + b.w > L.w || b.y + b.h > L.h;
  }
  function freeSpot(L, x, y, n, ux, uy) { // slide sideways in growing steps until the label is clear
    var steps = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5], d = LFS * 0.7;
    for (var i = 0; i < steps.length; i++) {
      var cx = x + ux * steps[i] * d, cy = y + uy * steps[i] * d, b = labelBox(cx, cy, n);
      if (!hits(L, b)) { PLACED.push(b); return [cx, cy]; }
    }
    PLACED.push(labelBox(x, y, n));
    return [x, y];
  }
  function clip(cx, cy, tx, ty) {
    var dx = tx - cx, dy = ty - cy;
    var t = Math.min(dx ? (NW / 2 + 4) / Math.abs(dx) : 1e9, dy ? (NH / 2 + 4) / Math.abs(dy) : 1e9);
    return [cx + dx * t, cy + dy * t];
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function showReveal() {
    clearTimers(); S.phase = 'done';
    var lv = S.lv;
    S.newBest = S.score > (PROG.best[lv] || 0);
    if (S.newBest) PROG.best[lv] = S.score;
    S.cleared = S.correct >= S.rounds.length - 1;
    S.unlockedNow = S.cleared && lv + 1 < PROCS.length && PROG.unlocked < lv + 2;
    if (S.unlockedNow) PROG.unlocked = lv + 2;
    saveProg();
    show('reveal'); applyStatic(); renderReveal(true);
    focusH('reveal-h');
  }
  function renderReveal(animate) {
    var t = T(), lv = S.lv, n = S.rounds.length;
    $('reveal-h').textContent = t.revealTitle(PN(lv));
    var rank = t.ranks[Math.floor(S.correct / n * 4)];
    var extra = S.unlockedNow ? t.unlocked(lv + 2) : (S.cleared && lv + 1 === PROCS.length ? t.allDone : '');
    $('result').innerHTML = '<span>' + t.result(S.score, S.correct, n) + '</span><span class="rank">' + esc(rank) + '</span><span>' +
      (S.newBest ? '<b>' + esc(t.newBest) + '</b>' : esc(t.bestShort(PROG.best[lv]))) + '</span>' + (extra ? '<span class="unlock"><b>' + esc(extra) + '</b></span>' : '');
    var nx = $('btn-next'), canNext = lv + 1 < PROCS.length && lv + 1 < PROG.unlocked;
    nx.textContent = canNext ? t.nextLevel(lv + 2) : t.retry;
    nx.onclick = function () { startPlay(canNext ? lv + 1 : lv); };
    drawGraph(animate);
  }
  function drawGraph(animate) {
    var t = T(), p = PROCS[S.lv], svg = $('graph');
    var L = svg.getBoundingClientRect().width < 640 || window.innerWidth < 640 ? p.layout.tall : p.layout.wide;
    var tall = L === p.layout.tall, scale = (svg.getBoundingClientRect().width || L.w) / L.w;
    var fs = Math.max(tall ? 18 : 15, 12.5 / scale), perLine = Math.floor((NW - 16) / (fs * 0.56));
    var two = acts(p).some(function (a) { return AP(a).length > perLine; });
    NH = two ? Math.max(62, Math.ceil(fs * 2.6 + 6)) : 46; LFS = Math.max(tall ? 18 : 14, 12 / scale);
    var desc = $('graph-desc');
    svg.innerHTML = ''; svg.appendChild(desc);
    svg.setAttribute('viewBox', '0 0 ' + L.w + ' ' + L.h);
    svg.setAttribute('class', (L === p.layout.tall ? 'tall' : 'wide') + (animate && !reduced ? ' anim' : ''));
    var defs = svgEl('defs', {});
    var mk = svgEl('marker', { id: 'arr', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '12', markerHeight: '12', orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
    mk.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#2CF97A' }));
    defs.appendChild(mk); svg.appendChild(defs);
    var gE = svgEl('g', {}), gN = svgEl('g', {}), gL = svgEl('g', {});
    PLACED = [];
    svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gL);
    var order = acts(p), items = [], descs = [], maxN = 1;
    order.forEach(function (a) { successors(S.log, a).forEach(function (s) { if (s.n > maxN) maxN = s.n; }); });
    order.forEach(function (a, idx) {
      var q = L.pos[a], g = svgEl('g', { 'class': 'node' + (a === p.start ? ' start' : '') });
      g.appendChild(svgEl('rect', { x: q[0] - NW / 2, y: q[1] - NH / 2, width: NW, height: NH, rx: 9 }));
      var tx = svgEl('text', { x: q[0], y: q[1] }), name = A(a), lines = [AP(a)];
      tx.style.fontSize = fs.toFixed(1) + 'px';
      if (AP(a).length > perLine) { // break at a space or soft hyphen so the longer line is as short as possible
        var best = null;
        for (var c = 0; c < name.length; c++) {
          if (name[c] !== ' ' && name[c] !== '\u00AD') continue;
          var l1 = name.slice(0, c).replace(/\u00AD/g, '') + (name[c] === ' ' ? '' : '-'), l2 = name.slice(c + 1).replace(/\u00AD/g, '');
          if (!best || Math.max(l1.length, l2.length) < Math.max(best[0].length, best[1].length)) best = [l1, l2];
        }
        if (best) lines = best;
      }
      lines.forEach(function (ln, k) {
        var ts = svgEl('tspan', { x: q[0], dy: lines.length < 2 ? '0' : (k ? '1.15em' : '-0.55em') });
        ts.textContent = ln; tx.appendChild(ts);
      });
      g.appendChild(tx); gN.appendChild(g);
      var len = Math.max.apply(null, Array.prototype.map.call(tx.childNodes, function (n) { return n.getComputedTextLength(); }));
      if (len > NW - 14) tx.style.fontSize = (fs * (NW - 14) / len).toFixed(1) + 'px'; // still too long: shrink to fit
      items.push({ el: g, at: idx * 200 });
      successors(S.log, a).forEach(function (s) {
        var e = edge(L, a, s, maxN); gE.appendChild(e.g); gL.appendChild(e.label);
        items.push({ el: e.g, at: idx * 200 + 150 }); items.push({ el: e.label, at: idx * 200 + 300 });
        descs.push(AP(a) + ' > ' + AP(s.b) + ' ' + pct(s.p) + '%');
      });
    });
    desc.textContent = t.graphDesc(descs.join(', '));
    if (animate && !reduced) items.forEach(function (it) { later(function () { it.el.classList.add('show'); }, 150 + it.at); });
  }
  function edge(L, a, s, maxN) {
    var A0 = L.pos[a], B0 = L.pos[s.b], d, lx, ly, ux = 1, uy = 0, minor = s.p < 0.2 ? ' minor' : '';
    var g = svgEl('g', { 'class': 'edge' + minor });
    if (a === s.b) {
      var side = L.loops[a] || 'top', x = A0[0], y = A0[1], v = side === 'top' ? -1 : 1;
      if (side === 'top' || side === 'bottom') {
        var ey = y + v * NH / 2;
        d = 'M' + (x - 24) + ',' + (ey + v * 2) + ' C' + (x - 50) + ',' + (ey + v * 64) + ' ' + (x + 50) + ',' + (ey + v * 64) + ' ' + (x + 24) + ',' + (ey + v * 4);
        lx = x + 66; ly = ey + v * 40;
      } else {
        var sx = side === 'right' ? 1 : -1, ex = x + sx * NW / 2;
        d = 'M' + (ex + sx * 2) + ',' + (y - 12) + ' C' + (ex + sx * 64) + ',' + (y - 44) + ' ' + (ex + sx * 64) + ',' + (y + 44) + ' ' + (ex + sx * 4) + ',' + (y + 12);
        lx = ex + sx * 52; ly = y - 44; ux = 0; uy = -1;
      }
    } else {
      var mx = (A0[0] + B0[0]) / 2, my = (A0[1] + B0[1]) / 2, dx = B0[0] - A0[0], dy = B0[1] - A0[1], len = Math.sqrt(dx * dx + dy * dy);
      var bend = L.bend[a + '>' + s.b];
      if (bend === undefined) bend = S.log.dfg[s.b] && S.log.dfg[s.b][a] ? 44 : 0; // two way pairs get separate arcs
      var cx = mx - dy / len * bend, cy = my + dx / len * bend;
      ux = -dy / len; uy = dx / len;
      var p0 = clip(A0[0], A0[1], cx, cy), p2 = clip(B0[0], B0[1], cx, cy);
      d = 'M' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
      lx = 0.25 * p0[0] + 0.5 * cx + 0.25 * p2[0]; ly = 0.25 * p0[1] + 0.5 * cy + 0.25 * p2[1];
      if (!bend && !dy && Math.abs(dx) - NW < LFS * 2.6) ly = A0[1] - NH / 2 - LFS * 0.75; // close neighbours in a row: label sits above the gap
      else if (!bend) { if (Math.abs(dx) > Math.abs(dy)) ly -= 13; else lx += 20; }
    }
    g.appendChild(svgEl('path', { d: d, pathLength: '1', 'stroke-width': (1.6 + 5 * s.n / maxN).toFixed(1), 'marker-end': 'url(#arr)' }));
    var spot = freeSpot(L, lx, ly, (pct(s.p) + '%').length, ux, uy); lx = spot[0]; ly = spot[1];
    // labels live in their own layer above the boxes so no arrow or box hides them
    var label = svgEl('text', { x: lx.toFixed(1), y: ly.toFixed(1), 'class': 'elabel' + minor, 'data-e': a + '>' + s.b }); label.textContent = pct(s.p) + '%';
    label.style.fontSize = LFS.toFixed(1) + 'px';
    return { g: g, label: label };
  }

  /* ---------- PM4Py code panel ---------- */
  function renderCode() {
    var t = T(), top = [];
    Object.keys(S.log.dfg).forEach(function (a) { Object.keys(S.log.dfg[a]).forEach(function (b) { top.push([a, b, S.log.dfg[a][b]]); }); });
    top.sort(function (u, v) { return v[2] - u[2]; });
    var ex = top.slice(0, 2).map(function (e) { return "('" + AP(e[0]) + "', '" + AP(e[1]) + "'): " + e[2]; }).join(', ');
    var cm = function (s) { return '<span class="cm">' + esc(s) + '</span>'; };
    var fn = function (s) { return 'pm4py.<span class="fn">' + s + '</span>'; };
    $('code').innerHTML =
      '<span class="kw">import</span> pm4py\n\n' +
      cm(t.c1) + '\nlog = ' + fn('read_xes') + '(<span class="st">"' + PROCS[S.lv].file + '.xes"</span>)\n\n' +
      cm(t.c2) + '\ndfg, start_activities, end_activities = ' + fn('discover_dfg') + '(log)\n' +
      cm('# {' + ex + ', ...}') + '\n\n' +
      cm(t.c3) + '\nnet, initial_marking, final_marking = ' + fn('discover_petri_net_inductive') + '(log)';
  }

  /* ---------- Digital rain (off with reduced motion) ---------- */
  function rain() {
    if (reduced) return;
    var c = $('rain'), x = c.getContext('2d'), cols, drops, fs = 16, last = 0;
    var chars = '01ABCDEF<>/=#{}[]:;+*'.split('');
    function size() {
      c.width = window.innerWidth; c.height = window.innerHeight;
      cols = Math.ceil(c.width / fs); drops = [];
      for (var i = 0; i < cols; i++) drops.push(Math.random() * c.height / fs);
    }
    size(); window.addEventListener('resize', size);
    (function frame(ts) {
      requestAnimationFrame(frame);
      if (document.hidden || ts - last < 60) return;
      last = ts;
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#2CF97A'; x.font = fs + 'px Consolas, monospace';
      for (var i = 0; i < cols; i++) {
        if (Math.random() < 0.5) continue;
        x.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, drops[i] * fs);
        if (drops[i] * fs > c.height && Math.random() > 0.97) drops[i] = 0;
        drops[i] += 1;
      }
    })(0);
  }

  /* ---------- Wiring ---------- */
  $('btn-start').addEventListener('click', function () { startPlay(Math.min(PROG.unlocked, PROCS.length) - 1); });
  each('.btn-levels', function (b) { b.addEventListener('click', showLevels); });
  $('btn-levels-back').addEventListener('click', function () { show('intro'); applyStatic(); focusH('intro-h'); });
  $('btn-code').addEventListener('click', function () { clearTimers(); show('code'); renderCode(); focusH('code-h'); });
  each('.btn-again', function (b) { b.addEventListener('click', function () { startPlay(S.lv); }); });
  each('.btn-lang', function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });
  document.addEventListener('keydown', function (e) {
    if (S.screen === 'play' && S.phase === 'round' && /^[1-4]$/.test(e.key)) {
      var a = S.rounds[S.i].opts[+e.key - 1];
      if (a) { answer(a); e.preventDefault(); }
    }
    if (e.key === ' ' && e.target === document.body) e.preventDefault();
  });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (S.screen === 'reveal' && (lastW < 640) !== (window.innerWidth < 640)) drawGraph(false);
    lastW = window.innerWidth;
  });

  applyStatic();
  rain();
  // test hooks: ?demo=reveal&level=N shows a finished game, ?demo=levels opens the level view
  if (params.demo === 'reveal') { newGame(Math.max(0, Math.min(PROCS.length - 1, (parseInt(params.level, 10) || 1) - 1))); S.score = 640; S.correct = S.rounds.length - 1; showReveal(); }
  if (params.demo === 'levels') showLevels();
})();
