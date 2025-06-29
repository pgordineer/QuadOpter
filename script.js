// --- QuadOpter: Single Digits Mode ---
// --- QuadOpter: Operations Mode & Variables Mode (stubs) ---
function showOperationsMode() {
  currentMode = 'operations';
  // TODO: Implement Operations mode logic
  alert('Operations mode coming soon!');
}

function showVariablesMode() {
  currentMode = 'variables';
  // TODO: Implement Variables mode logic
  alert('Variables mode coming soon!');
}

// Difficulty levels: 1 = Easy, 2 = Medium, 3 = Hard
let currentDifficulty = 2; // Default to Medium
let currentNumbers = [];
let currentSolution = null;
let currentMode = 'single'; // 'single', 'double', 'integers'

// Listen for difficulty slider changes
const difficultySlider = document.getElementById('difficulty-slider');
if (difficultySlider) {
  difficultySlider.addEventListener('input', function() {
    currentDifficulty = parseInt(difficultySlider.value, 10);
  });
}

// Utility: Generate a random integer in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random, always-solvable set of 4 single-digit numbers for the given difficulty
function generateSolvableSingleDigits(difficulty) {
  // Difficulty tuning: Easy = simple solutions, Hard = more complex
  // We'll use a reverse approach: generate a solution, then shuffle the numbers
  // and ensure the numbers are all single digits (1-9)
  let ops = ['+', '-', '*', '/'];
  let opCount = {1: 1, 2: 2, 3: 3}[difficulty] || 2;
  let allowedOps = ops.slice(0, opCount);
  let maxTries = 1000;
  for (let tries = 0; tries < maxTries; ++tries) {
    let target = 24;
    let nums = [randInt(1,9), randInt(1,9), randInt(1,9), randInt(1,9)];
    let solution = find24Solution(nums, allowedOps, target);
    if (solution) {
      return {numbers: nums, solution: solution};
    }
  }
  return {numbers: [randInt(1,9), randInt(1,9), randInt(1,9), randInt(1,9)], solution: null};
}

// Brute force solver for 24 with given numbers and allowed ops (for generation)
function find24Solution(nums, allowedOps, target) {
  // For now, use a simple check: try all permutations and op combinations
  // (This can be improved for performance later)
  function* permute(arr) {
    if (arr.length === 1) yield arr;
    else {
      for (let i = 0; i < arr.length; ++i) {
        let rest = arr.slice(0, i).concat(arr.slice(i+1));
        for (let p of permute(rest)) yield [arr[i]].concat(p);
      }
    }
  }
  function* opCombos(ops, n) {
    if (n === 0) yield [];
    else {
      for (let op of ops) {
        for (let rest of opCombos(ops, n-1)) yield [op].concat(rest);
      }
    }
  }
  // Helper to count unique operations in an array
  function uniqueOpCount(opsArr) {
    return new Set(opsArr).size;
  }
  for (let perm of permute(nums)) {
    for (let ops of opCombos(allowedOps, 3)) {
      // Enforce operation diversity for Medium/Hard
      let requireUniqueOps = 0;
      if (allowedOps.length === 2) requireUniqueOps = 2; // Medium
      if (allowedOps.length === 3) requireUniqueOps = 3; // Hard
      if (requireUniqueOps > 0 && uniqueOpCount(ops) < requireUniqueOps) continue;
      // Try all parenthesizations
      let exprs = [
        `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}${perm[2]}${ops[2]}${perm[3]}`,
        `(${perm[0]}${ops[0]}(${perm[1]}${ops[1]}${perm[2]}))${ops[2]}${perm[3]}`,
        `${perm[0]}${ops[0]}((${perm[1]}${ops[1]}${perm[2]})${ops[2]}${perm[3]})`,
        `${perm[0]}${ops[0]}(${perm[1]}${ops[1]}(${perm[2]}${ops[2]}${perm[3]}))`,
        `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}(${perm[2]}${ops[2]}${perm[3]})`
      ];
      for (let expr of exprs) {
        try {
          if (Math.abs(eval(expr) - target) < 1e-6) {
            return expr;
          }
        } catch (e) {}
      }
    }
  }
  return null;
}

// --- Single Digits UI Logic ---
const singleDigitsGameDiv = document.getElementById('single-digits-game');
const sdgNumbersDiv = document.getElementById('sdg-numbers');
const sdgOpsDiv = document.getElementById('sdg-ops');
const sdgExprDiv = document.getElementById('sdg-expression');
const sdgSubmitBtn = document.getElementById('sdg-submit');
const sdgFeedbackDiv = document.getElementById('sdg-feedback');
const sdgBackBtn = document.getElementById('sdg-back');
const sdgNextBtn = document.getElementById('sdg-next');
const sdgGiveUpBtn = document.getElementById('sdg-giveup');
const sdgUndoBtn = document.getElementById('sdg-undo');
const mainMenuDiv = document.getElementById('main-menu');

let sdgState = {
  numbers: [],
  used: [false, false, false, false],
  ops: [],
  expr: [],
  step: 0,
  finished: false // Track if round is finished
};

function resetSDGState(numbers) {
  sdgState.numbers = numbers.slice();
  sdgState.used = Array(numbers.length).fill(false);
  sdgState.selected = []; // indices of selected numbers
  sdgState.pendingOp = null;
  sdgState.steps = [];
  sdgState.finished = false;
}

function renderSDG() {
  const roundFinished = sdgState.finished;
  // Render numbers (stepwise merge)
  sdgNumbersDiv.innerHTML = '';
  sdgState.numbers.forEach((num, idx) => {
    if (sdgState.used[idx]) return;
    const btn = document.createElement('button');
    btn.textContent = num;
    btn.className = 'sdg-btn';
    btn.style.minWidth = '3.2em';
    btn.style.maxWidth = '5em';
    btn.style.textAlign = 'center';
    btn.style.margin = '0.2em';
    btn.disabled = roundFinished;
    // Highlight if selected
    if (sdgState.selected.includes(idx)) btn.style.background = '#e3f2fd';
    btn.onclick = function() {
      if (roundFinished) return;
      if (sdgState.selected.length < 2 && !sdgState.selected.includes(idx)) {
        sdgState.selected.push(idx);
        renderSDG();
      }
    };
    sdgNumbersDiv.appendChild(btn);
  });
  // Render ops (no parens)
  sdgOpsDiv.innerHTML = '';
  const opsRow = document.createElement('div');
  opsRow.style.display = 'flex';
  opsRow.style.justifyContent = 'center';
  opsRow.style.gap = '0.5em';
  opsRow.style.width = '100%';
  opsRow.style.flexWrap = 'wrap';
  ['+', '-', '×', '÷'].forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.className = 'sdg-op-btn';
    btn.style.flex = '1 1 0';
    btn.style.minWidth = '2.5em';
    btn.style.maxWidth = '5em';
    btn.style.margin = '0.2em';
    // Enable only if two numbers are selected and no pending op
    btn.disabled = roundFinished || sdgState.selected.length !== 2;
    btn.onclick = function() {
      if (roundFinished || sdgState.selected.length !== 2) return;
      sdgState.pendingOp = op;
      // Perform the operation
      const [i, j] = sdgState.selected;
      const a = sdgState.numbers[i];
      const b = sdgState.numbers[j];
      let result;
      if (op === '+') result = a + b;
      else if (op === '-') result = a - b;
      else if (op === '×') result = a * b;
      else if (op === '÷') {
        if (b === 0) {
          sdgFeedbackDiv.textContent = '❌ Division by zero!';
          return;
        }
        result = a / b;
      }
      // Mark used
      sdgState.used[i] = true;
      sdgState.used[j] = true;
      // Add result to numbers
      sdgState.numbers.push(result);
      sdgState.used.push(false);
      // Record step
      sdgState.steps.push(`${a} ${op} ${b} = ${result}`);
      // Reset selection and op
      sdgState.selected = [];
      sdgState.pendingOp = null;
      // Check for win
      if (sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1 && Math.abs(result - 24) < 1e-6) {
        sdgState.finished = true;
        sdgFeedbackDiv.textContent = '🎉 Correct!';
        sdgFeedbackDiv.style.color = '#1976d2';
        sdgNextBtn.style.display = '';
        sdgSubmitBtn.style.display = 'none';
        sdgGiveUpBtn.style.display = 'none';
      } else if (sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1) {
        sdgState.finished = true;
        sdgFeedbackDiv.textContent = '❌ Not 24!';
        sdgFeedbackDiv.style.color = '#c00';
        sdgNextBtn.style.display = '';
        sdgSubmitBtn.style.display = 'none';
        sdgGiveUpBtn.style.display = 'none';
      } else {
        sdgFeedbackDiv.textContent = '';
      }
      renderSDG();
    };
    opsRow.appendChild(btn);
  });
  sdgOpsDiv.appendChild(opsRow);
  // Render steps
  sdgExprDiv.innerHTML = sdgState.steps.map(s => `<div>${s}</div>`).join('');
  // Hide submit, enable give up if not finished
  sdgSubmitBtn.style.display = 'none';
  sdgGiveUpBtn.disabled = roundFinished;
}

function startSingleDigitsGame(numbers) {
  resetSDGState(numbers);
  renderSDG();
  sdgFeedbackDiv.textContent = '';
  singleDigitsGameDiv.style.display = '';
  mainMenuDiv.style.display = 'none';
  sdgNextBtn.style.display = 'none';
  sdgSubmitBtn.style.display = '';
  sdgGiveUpBtn.style.display = '';
  sdgGiveUpBtn.disabled = false;
}

function endSingleDigitsGame() {
  singleDigitsGameDiv.style.display = 'none';
  mainMenuDiv.style.display = '';
}

function showSingleDigitsMode() {
  currentMode = 'single';
  let {numbers, solution} = generateSolvableSingleDigits(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}

function showDoubleDigitsMode() {
  currentMode = 'double';
  let {numbers, solution} = generateSolvableDoubleDigits(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}

function showIntegersMode() {
  currentMode = 'integers';
  let {numbers, solution} = generateSolvableIntegers(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}

function showNextPuzzle() {
  let result;
  if (currentMode === 'single') {
    result = generateSolvableSingleDigits(currentDifficulty);
  } else if (currentMode === 'double') {
    result = generateSolvableDoubleDigits(currentDifficulty);
  } else if (currentMode === 'integers') {
    result = generateSolvableIntegers(currentDifficulty);
  } else {
    result = generateSolvableSingleDigits(currentDifficulty);
  }
  currentNumbers = result.numbers;
  currentSolution = result.solution;
  startSingleDigitsGame(result.numbers);
}
sdgNextBtn.onclick = function() {
  showNextPuzzle();
};

sdgSubmitBtn.onclick = function() {
  // Evaluate the built expression, allowing parentheses
  let expr = sdgState.expr.slice();
  // Replace × and ÷ with * and /
  let evalExpr = expr.map(x => x === '×' ? '*' : x === '÷' ? '/' : x).join(' ');
  let result = null;
  try {
    result = eval(evalExpr);
  } catch (e) {
    result = null;
  }
  if (Math.abs(result - 24) < 1e-6) {
    sdgFeedbackDiv.textContent = '🎉 Correct!';
    sdgFeedbackDiv.style.color = '#1976d2';
    sdgNextBtn.style.display = '';
    sdgSubmitBtn.style.display = 'none';
    sdgGiveUpBtn.style.display = 'none';
    // Mark round as finished
    sdgState.finished = true;
    renderSDG();
  } else {
    sdgFeedbackDiv.textContent = '❌ Try again!';
    sdgFeedbackDiv.style.color = '#c00';
  }
};

sdgGiveUpBtn.onclick = function() {
  sdgFeedbackDiv.innerHTML = `<span style='color:#c00;'>Solution: <b>${currentSolution || 'No solution found'}</b></span>`;
  sdgNextBtn.style.display = '';
  sdgSubmitBtn.style.display = 'none';
  sdgGiveUpBtn.style.display = 'none';
  // Mark round as finished
  sdgState.finished = true;
  renderSDG();
};

// Undo button logic (restore correct state)
sdgUndoBtn.onclick = function() {
  if (sdgState.expr.length === 0 || sdgState.finished) return;
  // Remove last entry
  const last = sdgState.expr.pop();
  // If it was a number, unmark it as used and decrement step
  if (typeof last === 'number') {
    // Find the first used index matching this number (from left)
    for (let i = 0; i < sdgState.numbers.length; ++i) {
      if (sdgState.numbers[i] === last && sdgState.used[i]) {
        sdgState.used[i] = false;
        break;
      }
    }
    sdgState.step--;
  } else if (['+', '-', '×', '÷'].includes(last)) {
    // If it was an op, just decrement step
    sdgState.step--;
  }
  // Parentheses do not affect step or used
  renderSDG();
};

sdgBackBtn.onclick = endSingleDigitsGame;

// Overwrite showSingleDigitsMode to launch the UI
function showSingleDigitsMode() {
  currentMode = 'single';
  let {numbers, solution} = generateSolvableSingleDigits(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}
// Hook up the Single Digits mode button
const singleDigitsBtn = document.getElementById('single-digit-mode-btn');
if (singleDigitsBtn) {
  singleDigitsBtn.addEventListener('click', showSingleDigitsMode);
}
// Hook up the Operations mode button
const operationsBtn = document.getElementById('operations-mode-btn');
if (operationsBtn) {
  operationsBtn.addEventListener('click', showOperationsMode);
}
// Hook up the Variables mode button
const variablesBtn = document.getElementById('variables-mode-btn');
if (variablesBtn) {
  variablesBtn.addEventListener('click', showVariablesMode);
}

// --- QuadOpter: Double Digits Mode ---
function generateSolvableDoubleDigits(difficulty) {
  let ops = ['+', '-', '*', '/'];
  let opCount = {1: 1, 2: 2, 3: 3}[difficulty] || 2;
  let allowedOps = ops.slice(0, opCount);
  let maxTries = 1000;
  for (let tries = 0; tries < maxTries; ++tries) {
    let target = 24;
    let nums = [randInt(1,24), randInt(1,24), randInt(1,24), randInt(1,24)];
    if (!nums.some(n => n >= 10)) continue;
    let solution = find24Solution(nums, allowedOps, target);
    if (solution) {
      return {numbers: nums, solution: solution};
    }
  }
  let fallback = [randInt(10,24), randInt(1,24), randInt(1,24), randInt(1,24)];
  return {numbers: fallback, solution: null};
}

function showDoubleDigitsMode() {
  currentMode = 'double';
  let {numbers, solution} = generateSolvableDoubleDigits(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}

const doubleDigitsBtn = document.getElementById('double-digit-mode-btn');
if (doubleDigitsBtn) {
  doubleDigitsBtn.addEventListener('click', showDoubleDigitsMode);
}

// --- QuadOpter: Integers Mode ---
function generateSolvableIntegers(difficulty) {
  let ops = ['+', '-', '*', '/'];
  let opCount = {1: 1, 2: 2, 3: 3}[difficulty] || 2;
  let allowedOps = ops.slice(0, opCount);
  let maxTries = 1000;
  for (let tries = 0; tries < maxTries; ++tries) {
    let target = 24;
    let nums = [];
    while (nums.length < 4) {
      let n = randInt(-24, 24);
      if (n !== 0) nums.push(n);
    }
    let solution = find24Solution(nums, allowedOps, target);
    if (solution) {
      return {numbers: nums, solution: solution};
    }
  }
  let fallback = [];
  while (fallback.length < 4) {
    let n = randInt(-24, 24);
    if (n !== 0) fallback.push(n);
  }
  return {numbers: fallback, solution: null};
}

function showIntegersMode() {
  currentMode = 'integers';
  let {numbers, solution} = generateSolvableIntegers(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}

const integersBtn = document.getElementById('integers-mode-btn');
if (integersBtn) {
  integersBtn.addEventListener('click', showIntegersMode);
}

// --- Daily Mode Calendar Popout (QuadOpter) ---
let dailySelectedDate = null;
let calendarMonth = null;
let calendarYear = null;

function getTodayDateStr() {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function renderDailyCalendar(selectedDateStr) {
  let selDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
  if (isNaN(selDate)) selDate = new Date();
  calendarMonth = selDate.getMonth();
  calendarYear = selDate.getFullYear();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  let html = `<div class='calendar-header'>`;
  html += `<button id='cal-prev' type='button'>&lt;</button>`;
  html += `<span>${firstDay.toLocaleString('default', { month: 'long' })} ${calendarYear}</span>`;
  html += `<button id='cal-next' type='button'>&gt;</button>`;
  html += `</div>`;
  html += `<div class='calendar-grid'>`;
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => html += `<div style='font-weight:bold;color:#888;'>${d}</div>`);
  html += `</div><div class='calendar-grid'>`;
  for (let i = 0; i < startDay; i++) html += `<div></div>`;
  const today = new Date();
  const todayStr = getTodayDateStr();
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${mm}/${dd}/${calendarYear}`;
    let classes = 'calendar-day';
    const [cm, cd, cy] = [parseInt(mm), parseInt(dd), parseInt(calendarYear)];
    const [tm, td, ty] = [today.getMonth() + 1, today.getDate(), today.getFullYear()];
    let isFuture = (cy > ty) || (cy === ty && cm > tm) || (cy === ty && cm === tm && cd > td);
    if (dateStr === todayStr) classes += ' today';
    if (dateStr === dailySelectedDate) classes += ' selected';
    if (isFuture) classes += ' future';
    html += `<div class='${classes}' data-date='${dateStr}'>${d}</div>`;
  }
  html += `</div>`;
  const dailyCalendarDiv = document.getElementById('daily-calendar');
  dailyCalendarDiv.innerHTML = html;
  dailyCalendarDiv.style.display = 'block';
}

// Event delegation for calendar
const dailyCalendarDiv = document.getElementById('daily-calendar');
dailyCalendarDiv.onclick = function(e) {
  e.stopPropagation();
  const prevBtn = e.target.closest('#cal-prev');
  const nextBtn = e.target.closest('#cal-next');
  const dayDiv = e.target.closest('.calendar-day');
  if (prevBtn) {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderDailyCalendar(`${String(calendarMonth+1).padStart(2,'0')}/01/${calendarYear}`);
    return;
  }
  if (nextBtn) {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderDailyCalendar(`${String(calendarMonth+1).padStart(2,'0')}/01/${calendarYear}`);
    return;
  }
  if (dayDiv && !dayDiv.classList.contains('future')) {
    const dateStr = dayDiv.getAttribute('data-date');
    dailyCalendarDiv.style.display = 'none';
    document.getElementById('daily-date-text').textContent = dateStr;
    dailySelectedDate = dateStr;
    return;
  }
};

// Hide calendar on body click (except when clicking the pill or calendar)
document.body.addEventListener('click', function(e) {
  const calendar = document.getElementById('daily-calendar');
  const pill = document.getElementById('daily-date-pill');
  if (!calendar || !pill) return;
  if (calendar.style.display !== 'block') return;
  if (calendar.contains(e.target) || pill.contains(e.target)) return;
  calendar.style.display = 'none';
});

// Daily mode button and pill click logic
const dailyModeBtn = document.getElementById('daily-mode-btn');
const dailyDatePill = document.getElementById('daily-date-pill');
const dailyDateText = document.getElementById('daily-date-text');
if (dailyDateText) {
  dailyDateText.textContent = getTodayDateStr();
}
if (dailyModeBtn) {
  dailyModeBtn.onclick = function(e) {
    // Only trigger if not clicking the date pill
    if (e.target.closest('#daily-date-pill')) return;
    // TODO: launch daily mode game logic here
  };
}
if (dailyDatePill) {
  dailyDatePill.onclick = function(e) {
    e.stopPropagation();
    const dailyCalendarDiv = document.getElementById('daily-calendar');
    if (dailyCalendarDiv.style.display === 'block') {
      dailyCalendarDiv.style.display = 'none';
      return;
    }
    renderDailyCalendar(dailySelectedDate || getTodayDateStr());
    // Position the calendar below the button
    const dailyBtn = document.getElementById('daily-mode-btn');
    const cal = dailyCalendarDiv;
    cal.style.display = 'block';
    cal.style.visibility = 'hidden';
    cal.style.position = 'fixed';
    cal.style.minWidth = '270px';
    cal.style.maxWidth = '340px';
    cal.style.width = '';
    cal.style.textAlign = 'center';
    setTimeout(() => {
      const calHeight = cal.offsetHeight;
      const calWidth = cal.offsetWidth;
      const dailyRect = dailyBtn.getBoundingClientRect();
      const left = Math.round(dailyRect.left + (dailyRect.width/2) - (calWidth/2));
      const top = Math.round(dailyRect.bottom);
      cal.style.left = left + 'px';
      cal.style.top = top + 'px';
      cal.style.visibility = 'visible';
      cal.style.zIndex = 1001;
    }, 0);
  };
}