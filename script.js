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
  function stepwise(a, op1, b, op2, c, op3, d, parenType) {
    let steps = [];
    let r1, r2, r3;
    if (parenType === 0) {
      r1 = evalBinary(a, op1, b); steps.push(`(${a} ${op1} ${b}) = ${r1}`);
      r2 = evalBinary(r1, op2, c); steps.push(`(${r1} ${op2} ${c}) = ${r2}`);
      r3 = evalBinary(r2, op3, d); steps.push(`(${r2} ${op3} ${d}) = ${r3}`);
    } else if (parenType === 1) {
      r1 = evalBinary(b, op2, c); steps.push(`(${b} ${op2} ${c}) = ${r1}`);
      r2 = evalBinary(a, op1, r1); steps.push(`(${a} ${op1} ${r1}) = ${r2}`);
      r3 = evalBinary(r2, op3, d); steps.push(`(${r2} ${op3} ${d}) = ${r3}`);
    } else if (parenType === 2) {
      r1 = evalBinary(c, op3, d); steps.push(`(${c} ${op3} ${d}) = ${r1}`);
      r2 = evalBinary(b, op2, r1); steps.push(`(${b} ${op2} ${r1}) = ${r2}`);
      r3 = evalBinary(a, op1, r2); steps.push(`(${a} ${op1} ${r2}) = ${r3}`);
    } else if (parenType === 3) {
      r1 = evalBinary(b, op2, c); steps.push(`(${b} ${op2} ${c}) = ${r1}`);
      r2 = evalBinary(c, op3, d); steps.push(`(${c} ${op3} ${d}) = ${r2}`);
      r3 = evalBinary(a, op1, evalBinary(r1, op3, d)); // Not used, but for completeness
    } else if (parenType === 4) {
      r1 = evalBinary(a, op1, b); steps.push(`(${a} ${op1} ${b}) = ${r1}`);
      r2 = evalBinary(c, op3, d); steps.push(`(${c} ${op3} ${d}) = ${r2}`);
      r3 = evalBinary(r1, op2, r2); steps.push(`(${r1} ${op2} ${r2}) = ${r3}`);
    }
    return { result: r3, steps };
  }
  for (let perm of permute(nums)) {
    for (let ops of opCombos(allowedOps, 3)) {
      // Enforce operation diversity for Medium/Hard
      let requireUniqueOps = 0;
      if (allowedOps.length === 2) requireUniqueOps = 2; // Medium
      if (allowedOps.length === 3) requireUniqueOps = 3; // Hard
      if (requireUniqueOps > 0 && uniqueOpCount(ops) < requireUniqueOps) continue;
      // Try all parenthesizations, return stepwise solution if found
      let parenTypes = [0, 1, 2, 3, 4];
      for (let pType of parenTypes) {
        let { result, steps } = stepwise(perm[0], ops[0], perm[1], ops[1], perm[2], ops[2], perm[3], pType);
        if (Math.abs(result - target) < 1e-6 && isFinite(result)) {
          return steps.join('<br>');
        }
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
    if (sdgState.selected.length === 1 && sdgState.selected[0] === idx) btn.style.background = '#e3f2fd';
    btn.onclick = function() {
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
  sdgOpsDiv.innerHTML = '';
  // --- Standard operations row: +, -, ×, ÷ ---
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
    // Enable only if one number is selected, no pending op, and not finished
    btn.disabled = roundFinished || sdgState.selected.length !== 1 || sdgState.pendingOp;
    btn.onclick = function() {
      if (roundFinished || sdgState.selected.length !== 1 || sdgState.pendingOp) return;
      sdgState.pendingOp = op;
      renderSDG();
    };
    // Highlight if pendingOp
    if (sdgState.pendingOp === op) btn.style.background = '#ffe082';
    opsRow.appendChild(btn);
  });
  sdgOpsDiv.appendChild(opsRow);

  // --- Exponential operations row: x², x³, √x, ∛x (only in operations mode) ---
  if (currentMode === 'operations') {
    const expRow = document.createElement('div');
    expRow.style.display = 'flex';
    expRow.style.justifyContent = 'center';
    expRow.style.gap = '0.5em';
    expRow.style.width = '100%';
    expRow.style.flexWrap = 'wrap';
    // Button labels: x², x³, √x, ∛x
    const expOps = [
      { label: 'x<sup>2</sup>', title: 'Square (x²)', op: 'square' },
      { label: 'x<sup>3</sup>', title: 'Cube (x³)', op: 'cube' },
      { label: '√x', title: 'Square Root (√x)', op: 'sqrt' },
      { label: '∛x', title: 'Cube Root (∛x)', op: 'cbrt' }
    ];
    expOps.forEach(exp => {
      const btn = document.createElement('button');
      btn.innerHTML = exp.label;
      btn.title = exp.title;
      btn.className = 'sdg-op-btn';
      btn.style.flex = '1 1 0';
      btn.style.minWidth = '2.5em';
      btn.style.maxWidth = '5em';
      btn.style.margin = '0.2em';
      // Enable only in operations mode, if one number is selected, not finished, and exp not used
      btn.disabled = roundFinished || sdgState.selected.length !== 1 || sdgState.expUsed;
      btn.onclick = function() {
        if (btn.disabled) return;
        // Only allow if one number is selected and not used exp yet
        const idx = sdgState.selected[0];
        let a = sdgState.numbers[idx];
        let result, stepStr;
        if (exp.op === 'square') {
          result = a * a;
          stepStr = `${a}² = ${result}`;
        } else if (exp.op === 'cube') {
          result = a * a * a;
          stepStr = `${a}³ = ${result}`;
        } else if (exp.op === 'sqrt') {
          if (a < 0) {
            sdgFeedbackDiv.textContent = '❌ Cannot sqrt negative!';
            return;
          }
          result = Math.sqrt(a);
          stepStr = `√${a} = ${result}`;
        } else if (exp.op === 'cbrt') {
          result = Math.cbrt(a);
          stepStr = `∛${a} = ${result}`;
        }
        // Mark used
        sdgState.used[idx] = true;
        // Add result to numbers at the start (left-most)
        sdgState.numbers.unshift(result);
        sdgState.used.unshift(false);
        // Record step
        sdgState.steps.push(stepStr);
        // Mark exp op as used
        sdgState.expUsed = true;
        sdgState.expStep = { idx, op: exp.op, input: a, result };
        // Reset selection and op
        sdgState.selected = [];
        sdgState.pendingOp = null;
        renderSDG();
      };
      // Gray out if exp op has been used
      if (sdgState.expUsed) btn.style.opacity = '0.5';
      expRow.appendChild(btn);
    });
    sdgOpsDiv.appendChild(expRow);
  }
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
  if (sdgState.steps.length === 0 || sdgState.finished) return;
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
    sdgSubmitBtn.style.display = 'none';
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
  sdgSubmitBtn.style.display = 'none';
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