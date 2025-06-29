// --- QuadOpter: Single Digits Mode ---
// --- QuadOpter: Operations Mode & Variables Mode (stubs) ---
function showOperationsMode() {
  currentMode = 'operations';
  let { numbers, solution } = generateSolvableOperationsMode(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
// --- Operations Mode Generator ---
// Try all possible ways to use one exponential op at any step, then solve for 24
function generateSolvableOperationsMode(difficulty) {
  // Allowed binary ops for difficulty
  let ops = ['+', '-', '*', '/'];
  let opCount = {1: 1, 2: 2, 3: 3}[difficulty] || 2;
  let allowedOps = ops.slice(0, opCount);
  let maxTries = 2000;
  let expOps = [
    { fn: x => x * x, str: a => `(${a})²`, check: x => Math.abs(x) < 100 },
    { fn: x => x * x * x, str: a => `(${a})³`, check: x => Math.abs(x) < 22 },
    { fn: x => x >= 0 ? Math.sqrt(x) : NaN, str: a => `√(${a})`, check: x => x >= 0 },
    { fn: x => Math.cbrt(x), str: a => `∛(${a})`, check: x => true }
  ];
  // Try random sets, then for each, try all ways to apply one exp op at any step
  for (let tries = 0; tries < maxTries; ++tries) {
    let nums = [randInt(1,9), randInt(1,9), randInt(1,9), randInt(1,9)];
    // Try all ways to insert one exp op at any step in the solution
    let solution = find24WithOneExp(nums, allowedOps, expOps, 24);
    if (solution) {
      return { numbers: nums, solution };
    }
  }
  // Fallback: just return random numbers
  return { numbers: [randInt(1,9), randInt(1,9), randInt(1,9), randInt(1,9)], solution: null };
}

// Try all ways to use one exp op at any step in the solution
function find24WithOneExp(nums, allowedOps, expOps, target) {
  // Try all permutations of numbers
  function* permute(arr) {
    if (arr.length === 1) yield arr;
    else {
      for (let i = 0; i < arr.length; ++i) {
        let rest = arr.slice(0, i).concat(arr.slice(i+1));
        for (let p of permute(rest)) yield [arr[i]].concat(p);
      }
    }
  }
  // Try all op combos
  function* opCombos(ops, n) {
    if (n === 0) yield [];
    else {
      for (let op of ops) {
        for (let rest of opCombos(ops, n-1)) yield [op].concat(rest);
      }
    }
  }
  // Try all parenthesizations, with one exp op applied at any step
  for (let perm of permute(nums)) {
    for (let ops of opCombos(allowedOps, 3)) {
      // Try all exp op placements: before any op, or after any op result
      // 5 slots: before 1st, after 1st, after 2nd, after 3rd, after final
      for (let expIdx = 0; expIdx < 5; ++expIdx) {
        for (let exp of expOps) {
          // Build the expression step by step
          let vals = perm.slice();
          let usedExp = false;
          let expStepDesc = '';
          let applyExp = (x, idx) => {
            if (!usedExp && exp.check(x)) {
              usedExp = true;
              expStepDesc = exp.str(x);
              return exp.fn(x);
            }
            return x;
          };
          let a = vals[0], b = vals[1], c = vals[2], d = vals[3];
          let v1 = expIdx === 0 ? applyExp(a, 0) : a;
          let v2 = expIdx === 1 ? applyExp(b, 1) : b;
          let v3 = expIdx === 2 ? applyExp(c, 2) : c;
          let v4 = expIdx === 3 ? applyExp(d, 3) : d;
          // Now try all parenthesizations, applying exp op after any op result
          let exprs = [
            () => {
              let steps = [];
              let r1 = evalBinary(v1, ops[0], v2); steps.push(`(${v1} ${ops[0]} ${v2}) = ${r1}`);
              if (expIdx === 4 && !usedExp) { r1 = applyExp(r1, 4); if (usedExp) steps.push(`${expStepDesc} = ${r1}`); }
              let r2 = evalBinary(r1, ops[1], v3); steps.push(`(${r1} ${ops[1]} ${v3}) = ${r2}`);
              if (expIdx === 4 && !usedExp) { r2 = applyExp(r2, 4); if (usedExp) steps.push(`${expStepDesc} = ${r2}`); }
              let r3 = evalBinary(r2, ops[2], v4); steps.push(`(${r2} ${ops[2]} ${v4}) = ${r3}`);
              if (expIdx === 4 && !usedExp) { r3 = applyExp(r3, 4); if (usedExp) steps.push(`${expStepDesc} = ${r3}`); }
              return { result: r3, steps };
            },
            () => {
              let steps = [];
              let r1 = evalBinary(v2, ops[1], v3); steps.push(`(${v2} ${ops[1]} ${v3}) = ${r1}`);
              if (expIdx === 4 && !usedExp) { r1 = applyExp(r1, 4); if (usedExp) steps.push(`${expStepDesc} = ${r1}`); }
              let r2 = evalBinary(v1, ops[0], r1); steps.push(`(${v1} ${ops[0]} ${r1}) = ${r2}`);
              if (expIdx === 4 && !usedExp) { r2 = applyExp(r2, 4); if (usedExp) steps.push(`${expStepDesc} = ${r2}`); }
              let r3 = evalBinary(r2, ops[2], v4); steps.push(`(${r2} ${ops[2]} ${v4}) = ${r3}`);
              if (expIdx === 4 && !usedExp) { r3 = applyExp(r3, 4); if (usedExp) steps.push(`${expStepDesc} = ${r3}`); }
              return { result: r3, steps };
            },
            () => {
              let steps = [];
              let r1 = evalBinary(v3, ops[2], v4); steps.push(`(${v3} ${ops[2]} ${v4}) = ${r1}`);
              if (expIdx === 4 && !usedExp) { r1 = applyExp(r1, 4); if (usedExp) steps.push(`${expStepDesc} = ${r1}`); }
              let r2 = evalBinary(v2, ops[1], r1); steps.push(`(${v2} ${ops[1]} ${r1}) = ${r2}`);
              if (expIdx === 4 && !usedExp) { r2 = applyExp(r2, 4); if (usedExp) steps.push(`${expStepDesc} = ${r2}`); }
              let r3 = evalBinary(v1, ops[0], r2); steps.push(`(${v1} ${ops[0]} ${r2}) = ${r3}`);
              if (expIdx === 4 && !usedExp) { r3 = applyExp(r3, 4); if (usedExp) steps.push(`${expStepDesc} = ${r3}`); }
              return { result: r3, steps };
            }
          ];
          for (let e of exprs) {
            usedExp = false;
            expStepDesc = '';
            let { result, steps } = e();
            if (usedExp && Math.abs(result - target) < 1e-6 && isFinite(result)) {
              // Return the steps as a solution string
              return steps.join('<br>');
            }
          }
        }
      }
    }
  }
  return null;
}

function evalBinary(a, op, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return b !== 0 ? a / b : NaN;
  return NaN;
}
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
  // Helper for stepwise solution
  function stepwise(a, op, b) {
    let symbol = op === '*' ? '×' : op === '/' ? '÷' : op;
    let res;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') res = b !== 0 ? a / b : NaN;
    return { res, str: `${a} ${symbol} ${b} = ${res}` };
  }
  for (let perm of permute(nums)) {
    for (let ops of opCombos(allowedOps, 3)) {
      // Enforce operation diversity for Medium/Hard
      let requireUniqueOps = 0;
      if (allowedOps.length === 2) requireUniqueOps = 2; // Medium
      if (allowedOps.length === 3) requireUniqueOps = 3; // Hard
      if (requireUniqueOps > 0 && uniqueOpCount(ops) < requireUniqueOps) continue;
      // Try all parenthesizations, but now build stepwise solution
      // 1. ((a op0 b) op1 c) op2 d
      let s1 = stepwise(perm[0], ops[0], perm[1]);
      let s2 = stepwise(s1.res, ops[1], perm[2]);
      let s3 = stepwise(s2.res, ops[2], perm[3]);
      if (Math.abs(s3.res - target) < 1e-6 && isFinite(s3.res)) {
        return [s1.str, s2.str, s3.str].join('<br>');
      }
      // 2. (a op0 (b op1 c)) op2 d
      let s21 = stepwise(perm[1], ops[1], perm[2]);
      let s22 = stepwise(perm[0], ops[0], s21.res);
      let s23 = stepwise(s22.res, ops[2], perm[3]);
      if (Math.abs(s23.res - target) < 1e-6 && isFinite(s23.res)) {
        return [s21.str, s22.str, s23.str].join('<br>');
      }
      // 3. a op0 ((b op1 c) op2 d)
      let s31 = stepwise(perm[1], ops[1], perm[2]);
      let s32 = stepwise(s31.res, ops[2], perm[3]);
      let s33 = stepwise(perm[0], ops[0], s32.res);
      if (Math.abs(s33.res - target) < 1e-6 && isFinite(s33.res)) {
        return [s31.str, s32.str, s33.str].join('<br>');
      }
      // 4. a op0 (b op1 (c op2 d))
      let s41 = stepwise(perm[2], ops[2], perm[3]);
      let s42 = stepwise(perm[1], ops[1], s41.res);
      let s43 = stepwise(perm[0], ops[0], s42.res);
      if (Math.abs(s43.res - target) < 1e-6 && isFinite(s43.res)) {
        return [s41.str, s42.str, s43.str].join('<br>');
      }
      // 5. (a op0 b) op1 (c op2 d)
      let s51 = stepwise(perm[0], ops[0], perm[1]);
      let s52 = stepwise(perm[2], ops[2], perm[3]);
      let s53 = stepwise(s51.res, ops[1], s52.res);
      if (Math.abs(s53.res - target) < 1e-6 && isFinite(s53.res)) {
        return [s51.str, s52.str, s53.str].join('<br>');
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
  finished: false, // Track if round is finished
  expUsed: false, // Track if exponential op has been used (for operations mode)
  expStep: null // Track which exp op was used (optional, for undo)
};

function resetSDGState(numbers) {
  sdgState.numbers = numbers.slice();
  sdgState.used = Array(numbers.length).fill(false);
  sdgState.selected = []; // indices of selected numbers
  sdgState.pendingOp = null;
  sdgState.steps = [];
  sdgState.finished = false;
  sdgState.expUsed = false;
  sdgState.expStep = null;
}

function renderSDG() {
  const roundFinished = sdgState.finished;
  // Render numbers (stepwise merge)
  sdgNumbersDiv.innerHTML = '';
  // Remove .selected from all number buttons before rendering (defensive, in case of DOM reuse)
  // (Not strictly needed with full re-render, but safe for mobile browsers)
  // Actually, since we clear innerHTML, we just need to ensure only the selected gets the class
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
    // Always remove .selected (defensive, in case of DOM reuse)
    btn.classList.remove('selected');
    // Highlight if selected: add .selected class
    if (sdgState.selected.length === 1 && sdgState.selected[0] === idx) {
      btn.classList.add('selected');
    }
    btn.onclick = function() {
      // Remove focus/active state to prevent mobile hover/focus bug
      this.blur();
      if (roundFinished) return;
      // If no number is selected and no pendingOp, select this as first operand
      if (sdgState.selected.length === 0 && !sdgState.pendingOp) {
        sdgState.selected = [idx];
        renderSDG();
      }
      // If one number is selected and a pendingOp, and this is a different number, perform the operation
      else if (sdgState.selected.length === 1 && sdgState.pendingOp && sdgState.selected[0] !== idx) {
        const i = sdgState.selected[0];
        const j = idx;
        const a = sdgState.numbers[i];
        const b = sdgState.numbers[j];
        const op = sdgState.pendingOp;
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
        // Add result to numbers at the start (left-most)
        sdgState.numbers.unshift(result);
        sdgState.used.unshift(false);
        // Record step
        sdgState.steps.push(`${a} ${op} ${b} = ${result}`);
        // Reset selection and op
        sdgState.selected = [];
        sdgState.pendingOp = null;
        // Check for win
        if (sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1 && Math.abs(result - 24) < 1e-6) {
          sdgState.finished = true;
        } else if (sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1) {
          sdgState.finished = true;
        }
        renderSDG();
      }
      // If a number is already selected but no pendingOp, allow changing selection
      else if (sdgState.selected.length === 1 && !sdgState.pendingOp) {
        if (sdgState.selected[0] !== idx) {
          sdgState.selected = [idx];
          renderSDG();
        }
      }
    };
    sdgNumbersDiv.appendChild(btn);
  });
  // Render ops (no parens)
  // Clear container
  sdgOpsDiv.innerHTML = '';
  // Standard operations row (always first row)
  const opsRow = document.createElement('div');
  opsRow.style.display = 'flex';
  opsRow.style.justifyContent = 'center';
  opsRow.style.gap = '0.5em';
  opsRow.style.width = '100%';
  ['+', '-', '×', '÷'].forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.className = 'sdg-op-btn';
    btn.style.flex = '1 1 0';
    btn.style.minWidth = '2.5em';
    btn.style.maxWidth = '5em';
    btn.style.margin = '0.2em';
    btn.disabled = roundFinished || sdgState.selected.length !== 1 || sdgState.pendingOp;
    btn.onclick = function() {
      if (roundFinished || sdgState.selected.length !== 1 || sdgState.pendingOp) return;
      sdgState.pendingOp = op;
      renderSDG();
    };
    if (sdgState.pendingOp === op) btn.style.background = '#ffe082';
    opsRow.appendChild(btn);
  });
  sdgOpsDiv.appendChild(opsRow);

  // Exponential operations row (second row, only in operations mode)
  if (currentMode === 'operations') {
    const expRow = document.createElement('div');
    expRow.style.display = 'flex';
    expRow.style.justifyContent = 'center';
    expRow.style.gap = '0.5em';
    expRow.style.width = '100%';
    expRow.style.marginTop = '0.7em';
    ['x<sup>2</sup>','x<sup>3</sup>','√x','∛x'].forEach((label, idx) => {
      const btn = document.createElement('button');
      btn.innerHTML = label;
      btn.className = 'sdg-op-btn';
      btn.style.flex = '1 1 0';
      btn.style.minWidth = '2.5em';
      btn.style.maxWidth = '5em';
      btn.style.margin = '0.2em';
      btn.title = ['Square (x²)','Cube (x³)','Square Root (√x)','Cube Root (∛x)'][idx];
      btn.disabled = roundFinished || sdgState.selected.length !== 1 || sdgState.expUsed;
      btn.onclick = function() {
        if (btn.disabled) return;
        const expOps = ['square','cube','sqrt','cbrt'];
        const exp = expOps[idx];
        const i = sdgState.selected[0];
        let a = sdgState.numbers[i];
        let result, stepStr;
        if (exp === 'square') {
          result = a * a;
          stepStr = `${a}² = ${result}`;
        } else if (exp === 'cube') {
          result = a * a * a;
          stepStr = `${a}³ = ${result}`;
        } else if (exp === 'sqrt') {
          if (a < 0) {
            sdgFeedbackDiv.textContent = '❌ Cannot sqrt negative!';
            return;
          }
          result = Math.sqrt(a);
          stepStr = `√${a} = ${result}`;
        } else if (exp === 'cbrt') {
          result = Math.cbrt(a);
          stepStr = `∛${a} = ${result}`;
        }
        sdgState.used[i] = true;
        sdgState.numbers.unshift(result);
        sdgState.used.unshift(false);
        sdgState.steps.push(stepStr);
        sdgState.expUsed = true;
        sdgState.expStep = { idx: i, op: exp, input: a, result };
        sdgState.selected = [];
        sdgState.pendingOp = null;
        renderSDG();
      };
      if (sdgState.expUsed) btn.style.opacity = '0.5';
      expRow.appendChild(btn);
    });
    sdgOpsDiv.appendChild(expRow);
  }
  // Render steps
  sdgExprDiv.innerHTML = sdgState.steps.map(s => `<div>${s}</div>`).join('');
  // Show solution if round is finished and correct
  // If finished and correct, show solution and disable undo
  if (sdgState.finished && sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1 && Math.abs(sdgState.numbers.find((n, i) => !sdgState.used[i]) - 24) < 1e-6) {
    let html = `<div style='color:#1976d2;'><div>🎉 Correct!</div>`;
    if (currentSolution) {
      const steps = currentSolution.split('<br>');
      html += `<div style='margin-top:0.5em;'>Solution:</div>`;
      for (const step of steps) {
        html += `<div><b>${step}</b></div>`;
      }
    }
    html += `</div>`;
    sdgFeedbackDiv.innerHTML = html;
    sdgNextBtn.style.display = '';
    sdgGiveUpBtn.style.display = 'none';
  } else if (sdgState.finished && sdgState.numbers.length - sdgState.used.filter(Boolean).length === 1) {
    // If finished and incorrect, allow undo
    sdgFeedbackDiv.textContent = '❌ Not 24!';
    sdgFeedbackDiv.style.color = '#c00';
    sdgNextBtn.style.display = '';
    sdgGiveUpBtn.style.display = 'none';
    // Do NOT disable undo here
  } else {
    // Hide give up if finished, otherwise enable/disable
    sdgFeedbackDiv.textContent = '';
    sdgGiveUpBtn.disabled = roundFinished;
  }

  // --- Fix: Remove focus from any number button after re-render to prevent mobile highlight bug ---
  // If the active element is a .sdg-btn, blur it
  if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('sdg-btn')) {
    document.activeElement.blur();
  }
}

function startSingleDigitsGame(numbers) {
  resetSDGState(numbers);
  renderSDG();
  sdgFeedbackDiv.textContent = '';
  singleDigitsGameDiv.style.display = '';
  mainMenuDiv.style.display = 'none';
  sdgNextBtn.style.display = 'none';
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
  if (currentMode === 'operations') {
    result = generateSolvableOperationsMode(currentDifficulty);
  } else if (currentMode === 'single') {
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


sdgGiveUpBtn.onclick = function() {
  // Mark round as finished first so renderSDG disables UI
  sdgState.finished = true;
  // Always show solution and message
  let html = '';
  if (currentSolution) {
    const steps = currentSolution.split('<br>');
    html = `<div style='color:#c00;'><div>Solution:</div>`;
    for (const step of steps) {
      html += `<div><b>${step}</b></div>`;
    }
    html += `</div>`;
  } else {
    html = `<span style='color:#c00;'>Solution: <b>No solution found</b></span>`;
  }
  sdgFeedbackDiv.innerHTML = html;
  sdgNextBtn.style.display = '';
  sdgGiveUpBtn.style.display = 'none';
};

// Undo button logic (restore correct state)
sdgUndoBtn.onclick = function() {
  if (sdgState.steps.length === 0) return;
  // Remove last step
  const lastStep = sdgState.steps.pop();
  // Check if last step was an exponential op (for operations mode)
  if (currentMode === 'operations' && sdgState.expUsed && sdgState.expStep && (lastStep.includes('²') || lastStep.includes('³') || lastStep.startsWith('√') || lastStep.startsWith('∛'))) {
    // Remove last number (the result)
    let resultIdx = sdgState.numbers.lastIndexOf(sdgState.expStep.result);
    if (resultIdx !== -1) {
      sdgState.numbers.splice(resultIdx, 1);
      sdgState.used.splice(resultIdx, 1);
    }
    // Unmark the original number as used
    if (typeof sdgState.expStep.idx === 'number') {
      sdgState.used[sdgState.expStep.idx] = false;
    }
    // Reset exp op state
    sdgState.expUsed = false;
    sdgState.expStep = null;
    // Reset selection and op
    sdgState.selected = [];
    sdgState.pendingOp = null;
    // Unfinish round if it was finished
    sdgState.finished = false;
    sdgFeedbackDiv.textContent = '';
    sdgNextBtn.style.display = 'none';
    sdgGiveUpBtn.style.display = '';
    renderSDG();
    return;
  }
  // Otherwise, handle normal undo for binary ops
  const match = lastStep.match(/(-?\d+(?:\.\d+)?) ([+\-×÷]) (-?\d+(?:\.\d+)?) = (-?\d+(?:\.\d+)?)/);
  if (!match) return;
  const a = Number(match[1]);
  const op = match[2];
  const b = Number(match[3]);
  const result = Number(match[4]);
  // Remove last number (the result)
  let resultIdx = sdgState.numbers.lastIndexOf(result);
  if (resultIdx === -1) return;
  sdgState.numbers.splice(resultIdx, 1);
  sdgState.used.splice(resultIdx, 1);
  // Find the two most recent used numbers matching a and b, and unmark them
  let foundA = false, foundB = false;
  for (let i = sdgState.numbers.length - 1; i >= 0; --i) {
    if (sdgState.used[i]) {
      if (!foundB && sdgState.numbers[i] === b) {
        sdgState.used[i] = false;
        foundB = true;
      } else if (!foundA && sdgState.numbers[i] === a) {
        sdgState.used[i] = false;
        foundA = true;
      }
      if (foundA && foundB) break;
    }
  }
  // Reset selection and op
  sdgState.selected = [];
  sdgState.pendingOp = null;
  // Unfinish round if it was finished
  sdgState.finished = false;
  sdgFeedbackDiv.textContent = '';
  sdgNextBtn.style.display = 'none';
  sdgGiveUpBtn.style.display = '';
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
  let fallbackSolution = find24Solution(fallback, allowedOps, 24);
  return {numbers: fallback, solution: fallbackSolution};
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
  let fallbackSolution = find24Solution(fallback, allowedOps, 24);
  return {numbers: fallback, solution: fallbackSolution};
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