// --- Custom Modal Dialog for Variable Input ---
function showVarInputDialog(varName, currentValue, callback) {
  // Remove any existing dialog
  let old = document.getElementById('var-input-modal');
  if (old) old.remove();
  // Create modal elements
  const modal = document.createElement('div');
  modal.id = 'var-input-modal';
  modal.className = 'sdg-modal-bg';
  // Dialog box
  const box = document.createElement('div');
  box.className = 'sdg-modal-box';
  // Title
  const title = document.createElement('div');
  title.className = 'sdg-modal-title';
  title.textContent = `Set ${varName}`;
  box.appendChild(title);
  // Input
  const input = document.createElement('input');
  input.type = 'number';
  input.min = -24;
  input.max = 24;
  input.step = 1;
  input.value = currentValue !== null && currentValue !== undefined ? currentValue : '';
  input.className = 'sdg-modal-input';
  box.appendChild(input);
  // Error message
  const err = document.createElement('div');
  err.className = 'sdg-modal-error';
  box.appendChild(err);
  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'sdg-modal-btn-row';
  // OK
  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  okBtn.className = 'sdg-op-btn sdg-modal-btn';
  okBtn.onclick = function() {
    let val = input.value.trim();
    if (!/^[-]?\d{1,2}$/.test(val)) {
      err.textContent = 'Enter integer -24 to 24.';
      return;
    }
    let n = parseInt(val, 10);
    if (n < -24 || n > 24) {
      err.textContent = 'Enter integer -24 to 24.';
      return;
    }
    modal.remove();
    callback(n);
  };
  // Cancel
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'sdg-op-btn sdg-modal-btn';
  cancelBtn.onclick = function() {
    modal.remove();
    callback(null);
  };
  btnRow.appendChild(okBtn);
  btnRow.appendChild(cancelBtn);
  box.appendChild(btnRow);
  // Keyboard events
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') okBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
  // Focus input
  setTimeout(() => { input.focus(); input.select(); }, 50);
  modal.appendChild(box);
  document.body.appendChild(modal);
}
// --- Prevent double-tap zoom on mobile browsers ---
// This disables double-tap zoom for all buttons and the main game area
// (Best effort: some browsers may require viewport meta tag changes in HTML)

// Attach robust event listeners for operator and number buttons
function attachButtonListeners() {
  // Operator buttons: always mark selected and yellow instantly on pointerup/click
  document.querySelectorAll('.sdg-op-btn').forEach(btn => {
    // Remove previous listeners if any
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.sdg-op-btn').forEach(btn => {
    function markSelected(e) {
      document.querySelectorAll('.sdg-op-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      });
      btn.classList.add('selected');
      btn.style.background = '#ffe082';
      btn.style.color = '#222';
      btn.style.borderColor = '#fbc02d';
    }
    // Use pointerup for best mobile/desktop reliability
    btn.addEventListener('pointerup', function(e) {
      markSelected(e);
      if (typeof btn._originalHandler === 'function') btn._originalHandler.call(this, e);
    });
    btn.addEventListener('click', function(e) {
      markSelected(e);
      if (typeof btn._originalHandler === 'function') btn._originalHandler.call(this, e);
    });
    // Save original handler if set via onclick
    if (btn.onclick) {
      btn._originalHandler = btn.onclick;
      btn.onclick = null;
    }
  });
  // Number buttons: just use click and pointerup for instant response
  document.querySelectorAll('.sdg-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.sdg-btn').forEach(btn => {
    if (btn.onclick) {
      const handler = btn.onclick;
      btn.onclick = null;
      btn.addEventListener('pointerup', function(e) { handler.call(this, e); });
      btn.addEventListener('click', function(e) { handler.call(this, e); });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachButtonListeners);
} else {
  attachButtonListeners();
}
// If you dynamically create buttons elsewhere, call attachButtonListeners() after.
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Also set touch-action CSS for all buttons to prevent double-tap zoom
window.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    button, .sdg-btn, .sdg-op-btn {
      touch-action: manipulation !important;
    }
  `;
  document.head.appendChild(style);
});
// --- QuadOpter: Single Digits Mode ---
// --- QuadOpter: Operations Mode & Variables Mode (stubs) ---
function showOperationsMode() {
  currentMode = 'operations';
  let { numbers, solution } = generateSolvableOperationsMode(currentDifficulty);
  currentNumbers = numbers;
  currentSolution = solution;
  startSingleDigitsGame(numbers);
}
// --- Operations Mode Generator ---
// Try all possible ways to use one exponential op at any step, then solve for 24
function generateSolvableOperationsMode(difficulty) {
  // Allowed binary ops for difficulty
  let ops = ['+', '-', '*', '/'];
  let opCount = {1: 1, 2: 2, 3: 3}[difficulty] || 2;
  let allowedOps = ops.slice(0, opCount);
  let maxTries = 10000;
  // Limit exp ops by difficulty
  let allExpOps = [
    { fn: x => x * x, str: a => `(${a})²`, check: x => Math.abs(x) < 100 },
    { fn: x => x * x * x, str: a => `(${a})³`, check: x => Math.abs(x) < 22 },
    { fn: x => x >= 0 ? Math.sqrt(x) : NaN, str: a => `√(${a})`, check: x => x >= 0 },
    { fn: x => Math.cbrt(x), str: a => `∛(${a})`, check: x => true }
  ];
  let expOps;
  if (difficulty === 1) {
    expOps = allExpOps.slice(0, 1); // Easy: only square
  } else if (difficulty === 2) {
    expOps = allExpOps.slice(0, 2); // Medium: square, cube
  } else {
    expOps = allExpOps; // Hard: all exp ops
  }
  // Try random sets, for each try, pick a single random exp op to use
  for (let tries = 0; tries < maxTries; ++tries) {
    let nums = [randInt(1,24), randInt(1,24), randInt(1,24), randInt(1,24)];
    // Pick a single random exp op for this attempt
    const expOp = expOps[Math.floor(Math.random() * expOps.length)];
    let solution = find24WithOneExp(nums, allowedOps, [expOp], 24);
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
        // Shuffle expOps for each exp op placement to increase variety
        let shuffledExpOps = expOps.slice();
        for (let i = shuffledExpOps.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledExpOps[i], shuffledExpOps[j]] = [shuffledExpOps[j], shuffledExpOps[i]];
        }
        for (let exp of shuffledExpOps) {
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

function showVariablesMode() {
  currentMode = 'variables';
  let { numbers, exprObj } = generateVariablesModePuzzle();
  currentNumbers = numbers;
  // Generate a solution for variables mode
  currentSolution = generateVariablesModeSolution(numbers, exprObj);
  startVariablesGame(numbers, exprObj);
}
// Generate a stepwise solution for Variables mode
function generateVariablesModeSolution(numbers, exprObj) {
  // Try all integer values for x and y in range -24 to 24
  // Try all permutations of the 3 numbers and the expression as the 4th operand
  let nums = numbers.slice();
  let target = 24;
  // Try all x and y values
  for (let x = -24; x <= 24; ++x) {
    for (let y = -24; y <= 24; ++y) {
      let exprVal;
      try {
        exprVal = exprObj.evalFn(x, y);
      } catch (e) { continue; }
      if (exprVal === null || isNaN(exprVal) || !isFinite(exprVal)) continue;
      // Try all permutations of the 3 numbers
      function* permute(arr) {
        if (arr.length === 1) yield arr;
        else {
          for (let i = 0; i < arr.length; ++i) {
            let rest = arr.slice(0, i).concat(arr.slice(i+1));
            for (let p of permute(rest)) yield [arr[i]].concat(p);
          }
        }
      }
      for (let perm of permute(nums)) {
        // Try all positions for the exprVal (as 1st, 2nd, 3rd, or 4th operand)
        for (let pos = 0; pos < 4; ++pos) {
          let operands = perm.slice();
          operands.splice(pos, 0, exprVal);
          // Try all op combos
          let ops = ['+', '-', '*', '/'];
          function* opCombos(ops, n) {
            if (n === 0) yield [];
            else {
              for (let op of ops) {
                for (let rest of opCombos(ops, n-1)) yield [op].concat(rest);
              }
            }
          }
          for (let opSet of opCombos(ops, 3)) {
            // Try all parenthesizations, build stepwise solution
            // 1. ((a op0 b) op1 c) op2 d
            let a = operands[0], b = operands[1], c = operands[2], d = operands[3];
            let s1 = evalVarStep(a, opSet[0], b);
            if (!s1) continue;
            let s2 = evalVarStep(s1.res, opSet[1], c);
            if (!s2) continue;
            let s3 = evalVarStep(s2.res, opSet[2], d);
            if (!s3) continue;
            if (Math.abs(s3.res - target) < 1e-6 && isFinite(s3.res)) {
              // Build stepwise solution
              let steps = [];
              // Add variable assignments
              if (/x/.test(exprObj.display)) steps.push(`X = ${x}`);
              if (/y/.test(exprObj.display)) steps.push(`Y = ${y}`);
              // Show the value of the expression
              let exprLabel = exprObj.display.replace(/x/g, x).replace(/y/g, y);
              let exprStep = `${exprObj.display} = ${exprVal}`;
              // Find which operand is the expr
              let exprIdx = operands.indexOf(exprVal);
              let opLabels = perm.slice();
              opLabels.splice(exprIdx, 0, `[${exprObj.display}]`);
              // Build stepwise with labels
              let labelA = exprIdx === 0 ? `[${exprObj.display}]` : operands[0];
              let labelB = exprIdx === 1 ? `[${exprObj.display}]` : operands[1];
              let labelC = exprIdx === 2 ? `[${exprObj.display}]` : operands[2];
              let labelD = exprIdx === 3 ? `[${exprObj.display}]` : operands[3];
              let s1str = `${labelA} ${opSet[0]} ${labelB} = ${s1.res}`;
              let s2str = `${s1.res} ${opSet[1]} ${labelC} = ${s2.res}`;
              let s3str = `${s2.res} ${opSet[2]} ${labelD} = ${s3.res}`;
              steps.push(exprStep);
              steps.push(s1str);
              steps.push(s2str);
              steps.push(s3str);
              return steps.join('<br>');
            }
          }
        }
      }
    }
  }
  return null;
}

function evalVarStep(a, op, b) {
  let res;
  if (op === '+') res = a + b;
  else if (op === '-') res = a - b;
  else if (op === '*') res = a * b;
  else if (op === '/') {
    if (b === 0) return null;
    res = a / b;
  } else return null;
  if (!isFinite(res)) return null;
  return { res };
}

// Generate 3 random integers and 1 random algebraic expression
function generateVariablesModePuzzle() {
  // Expression templates: each returns { display, evalFn }
  const templates = [
    // 2(x+y)
    () => {
      let c = randInt(2, 4);
      return {
        display: `${c}(x+y)`,
        evalFn: (x, y) => c * (x + y)
      };
    },
    // 3(y-2)+6
    () => {
      let c = randInt(2, 4), d = randInt(1, 6);
      return {
        display: `${c}(y-2)+${d}`,
        evalFn: (x, y) => c * (y - 2) + d
      };
    },
    // 3x^2+2
    () => {
      let c = randInt(2, 4), d = randInt(1, 6);
      return {
        display: `${c}x²+${d}`,
        evalFn: (x, y) => c * x * x + d
      };
    },
    // y^3/y^2-3
    () => {
      let d = randInt(1, 6);
      return {
        display: `y³/y²-${d}`,
        evalFn: (x, y) => (y !== 0 ? y * y * y / (y * y) - d : NaN)
      };
    },
    // (-2x-6x)/-4
    () => {
      return {
        display: '(-2x-6x)/-4',
        evalFn: (x, y) => ((-2 * x - 6 * x) / -4)
      };
    },
    // x^2-2y^2
    () => {
      return {
        display: 'x²-2y²',
        evalFn: (x, y) => x * x - 2 * y * y
      };
    },
    // (x^2+2)/(y^2)
    () => {
      return {
        display: '(x²+2)/(y²)',
        evalFn: (x, y) => (y !== 0 ? (x * x + 2) / (y * y) : NaN)
      };
    },
    // New templates below:
    // (2x+3y)
    () => {
      let a = randInt(2, 3), b = randInt(2, 4);
      return {
        display: `${a}x+${b}y`,
        evalFn: (x, y) => a * x + b * y
      };
    },
    // (x-y)^2
    () => {
      return {
        display: '(x-y)²',
        evalFn: (x, y) => (x - y) * (x - y)
      };
    },
    // (y+4)^2-3
    () => {
      let d = randInt(2, 5);
      return {
        display: `(y+4)²-${d}`,
        evalFn: (x, y) => (y + 4) * (y + 4) - d
      };
    },
    // (x+1)(y-1)
    () => {
      return {
        display: '(x+1)(y-1)',
        evalFn: (x, y) => (x + 1) * (y - 1)
      };
    },
    // (x^3-y^3)/x
    () => {
      return {
        display: '(x³-y³)/x',
        evalFn: (x, y) => (x !== 0 ? (x * x * x - y * y * y) / x : NaN)
      };
    },
    // (2x^2+3y^2)
    () => {
      let a = randInt(2, 3), b = randInt(2, 4);
      return {
        display: `${a}x²+${b}y²`,
        evalFn: (x, y) => a * x * x + b * y * y
      };
    },
    // (x+y+3)
    () => {
      let d = randInt(2, 6);
      return {
        display: `x+y+${d}`,
        evalFn: (x, y) => x + y + d
      };
    },
    // (x^2+y^2)/2
    () => {
      return {
        display: '(x²+y²)/2',
        evalFn: (x, y) => (x * x + y * y) / 2
      };
    },
    // (3x-2y)+5
    () => {
      return {
        display: '(3x-2y)+5',
        evalFn: (x, y) => (3 * x - 2 * y) + 5
      };
    },
    // (x/y)+4
    () => {
      return {
        display: '(x/y)+4',
        evalFn: (x, y) => (y !== 0 ? (x / y) + 4 : NaN)
      };
    }
  ];
  let maxTries = 10000;
  for (let tries = 0; tries < maxTries; ++tries) {
    // 3 random integers (nonzero, -24 to 24)
    let nums = [];
    while (nums.length < 3) {
      let n = randInt(-24, 24);
      if (n !== 0) nums.push(n);
    }
    // Pick a random template
    const exprObj = templates[randInt(0, templates.length - 1)]();
    // Check if this combination is solvable
    let solution = generateVariablesModeSolution(nums, exprObj);
    if (solution) {
      return { numbers: nums, exprObj };
    }
  }
  // Fallback: just return random
  let nums = [];
  while (nums.length < 3) {
    let n = randInt(-24, 24);
    if (n !== 0) nums.push(n);
  }
  const exprObj = templates[randInt(0, templates.length - 1)]();
  return { numbers: nums, exprObj };
}

function startVariablesGame(numbers, exprObj) {
  resetSDGState(numbers);
  // Store the algebraic expression object in sdgState
  sdgState.algebraExpr = exprObj;
  // For Undo: keep a reference to restore the exprObj if needed
  sdgState._lastExprObj = exprObj;
  renderSDG();
  sdgFeedbackDiv.textContent = '';
  singleDigitsGameDiv.style.display = '';
  mainMenuDiv.style.display = 'none';
  sdgNextBtn.style.display = 'none';
  sdgGiveUpBtn.style.display = '';
  sdgGiveUpBtn.disabled = false;
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
  let maxTries = 10000;
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

// Fix Back to Menu button for all modes
if (sdgBackBtn) {
  sdgBackBtn.onclick = function() {
    singleDigitsGameDiv.style.display = 'none';
    mainMenuDiv.style.display = '';
  };
}

let sdgState = {
  numbers: [],
  used: [false, false, false, false],
  ops: [],
  expr: [],
  step: 0,
  finished: false, // Track if round is finished
  expUsed: false, // Track if exponential op has been used (for operations mode)
  expStep: null, // Track which exp op was used (optional, for undo)
  xValue: null, // For variables mode: current value of x
  yValue: null  // For variables mode: current value of y
};

function resetSDGState(numbers) {
  sdgState.numbers = numbers.slice();
  sdgState.used = Array(numbers.length).fill(false);
  sdgState.selected = [];
  sdgState.pendingOp = null;
  sdgState.steps = [];
  sdgState.finished = false;
  sdgState.expUsed = false;
  sdgState.expStep = null;
  sdgState.xValue = null;
  sdgState.yValue = null;
  sdgState.algebraExpr = null;
}

function showTemporaryMessage(message, color = '#c00', duration = 3000) {
  sdgFeedbackDiv.textContent = message;
  sdgFeedbackDiv.style.color = color;
  
  // Clear any existing timeout
  if (window.sdgMessageTimeout) {
    clearTimeout(window.sdgMessageTimeout);
  }
  
  // Set new timeout to clear message
  window.sdgMessageTimeout = setTimeout(() => {
    sdgFeedbackDiv.textContent = '';
    sdgFeedbackDiv.style.color = '';
  }, duration);
}

function updateSDGInstructions() {
  let instructionText = '';
  
  if (sdgState.finished) {
    // Game is over, show appropriate message
    const numRemaining = sdgState.numbers.length - sdgState.used.filter(Boolean).length + (sdgState.algebraExpr ? 1 : 0);
    if (numRemaining === 1) {
      const finalResult = sdgState.numbers.find((n, i) => !sdgState.used[i]);
      if (Math.abs(finalResult - 24) < 1e-6) {
        instructionText = 'Excellent work! You reached 24!';
      } else {
        instructionText = `You have ${finalResult}. Try again to reach 24!`;
      }
    } else {
      instructionText = 'Game over. Use Give Up to see a solution.';
    }
  } else if (sdgState.pendingOp) {
    // User has selected a number and operation, needs second number
    const selectedNum = sdgState.selected[0];
    let numText = selectedNum === 'expr' ? 'expression' : sdgState.numbers[selectedNum];
    instructionText = `${numText} ${sdgState.pendingOp} ? → Select the second number`;
  } else if (sdgState.selected.length === 1) {
    // User has selected a number, needs operation
    const selectedNum = sdgState.selected[0];
    let numText = selectedNum === 'expr' ? 'expression' : sdgState.numbers[selectedNum];
    instructionText = `${numText} ? → Choose an operation (+, -, ×, ÷)`;
  } else {
    // No selection, provide mode-specific instruction
    if (currentMode === 'variables') {
      if (sdgState.xValue === null && /x/.test(sdgState.algebraExpr?.display || '')) {
        instructionText = 'Set the value of X using the numbers';
      } else if (sdgState.yValue === null && /y/.test(sdgState.algebraExpr?.display || '')) {
        instructionText = 'Set the value of Y using the numbers';
      } else {
        instructionText = 'Combine numbers and operations to make 24!';
      }
    } else if (currentMode === 'operations') {
      instructionText = 'Use numbers and operations (including powers/roots) to make 24!';
    } else {
      instructionText = 'Select a number to start building an expression that equals 24!';
    }
  }
  
  // Update the expression div with instruction text
  if (sdgState.steps.length === 0) {
    sdgExprDiv.innerHTML = `<div class="game-instructions">${instructionText}</div>`;
  } else {
    // Show steps with instruction text above
    let stepsHtml = sdgState.steps.map(s => `<div>${s}</div>`).join('');
    sdgExprDiv.innerHTML = `<div class="game-instructions" style="margin-bottom: 0.8em;">${instructionText}</div>${stepsHtml}`;
  }
}

function renderSDG() {
  const roundFinished = sdgState.finished;
  
  // Update instruction text based on game state
  updateSDGInstructions();
  
  // Responsive flex container for numbers row
  sdgNumbersDiv.innerHTML = '';
  sdgNumbersDiv.style.display = 'flex';
  sdgNumbersDiv.style.flexWrap = 'nowrap';
  sdgNumbersDiv.style.justifyContent = 'center';
  sdgNumbersDiv.style.gap = '0.3em';
  // Gather all number/expr strings for measurement
  let numRowCount = sdgState.numbers.filter((n, i) => !sdgState.used[i]).length;
  let numRowContents = sdgState.numbers.filter((n, i) => !sdgState.used[i]).map(String);
  let exprContent = null;
  if (currentMode === 'variables' && sdgState.algebraExpr) {
    let exprStr = sdgState.algebraExpr.display;
    if (sdgState.xValue !== null || sdgState.yValue !== null) {
      exprStr = exprStr.replace(/x/g, sdgState.xValue !== null ? `(${sdgState.xValue})` : 'x')
                       .replace(/y/g, sdgState.yValue !== null ? `(${sdgState.yValue})` : 'y');
    }
    exprContent = exprStr;
    numRowContents.push(exprContent);
    numRowCount++;
  }
  // Try font sizes from largest to smallest until all fit
  const fontSizes = ["1.15em", "1.05em", "0.95em", "0.85em", "0.75em", "0.65em"];
  let chosenFontSize = fontSizes[0];
  let containerWidth = sdgNumbersDiv.offsetWidth || sdgNumbersDiv.clientWidth || 400;
  // Create a hidden div for measurement
  let measureDiv = document.createElement('div');
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.position = 'absolute';
  measureDiv.style.left = '-9999px';
  measureDiv.style.top = '-9999px';
  measureDiv.style.whiteSpace = 'nowrap';
  document.body.appendChild(measureDiv);
  let boxPadding = 24; // px, estimate for button padding/margin/border
  let gapPx = 6; // px, estimate for gap between buttons
  for (let fs of fontSizes) {
    let maxWidth = 0;
    for (let content of numRowContents) {
      measureDiv.style.fontSize = fs;
      measureDiv.textContent = content;
      let w = measureDiv.offsetWidth + boxPadding;
      if (w > maxWidth) maxWidth = w;
    }
    let totalWidth = maxWidth * numRowCount + gapPx * (numRowCount - 1);
    if (totalWidth <= containerWidth) {
      chosenFontSize = fs;
      break;
    }
    // If none fit, will use smallest
    chosenFontSize = fs;
  }
  document.body.removeChild(measureDiv);
  // Now render all number buttons with chosenFontSize and equal width
  let buttonWidth = `calc((100% - ${(numRowCount - 1) * 0.3}em) / ${numRowCount})`;
  sdgState.numbers.forEach((num, idx) => {
    if (sdgState.used[idx]) return;
    const btn = document.createElement('button');
    btn.textContent = num;
    btn.className = 'sdg-btn';
    btn.style.flex = `1 1 0`;
    btn.style.width = buttonWidth;
    btn.style.fontSize = chosenFontSize;
    btn.style.textAlign = 'center';
    btn.style.margin = '0';
    btn.style.overflow = 'visible';
    btn.style.textOverflow = 'clip';
    btn.style.whiteSpace = 'normal';
    btn.disabled = roundFinished;
    btn.classList.remove('selected');
    if (sdgState.selected.length === 1 && sdgState.selected[0] === idx) {
      btn.classList.add('selected');
    }
    btn.onclick = function() {
      if (roundFinished) return;
      // ...existing code for button click...
      if (sdgState.selected.length === 0 && !sdgState.pendingOp) {
        sdgState.selected = [idx];
        window.requestAnimationFrame(renderSDG);
      }
      else if (sdgState.selected.length === 1 && sdgState.pendingOp && sdgState.selected[0] !== idx) {
        // ...existing code for operation...
        let i = sdgState.selected[0];
        let a, b, aLabel = '', bLabel = '', usedExpr = false;
        if (i === 'expr') {
          if (sdgState.algebraExpr) {
            const needsX = /x/.test(sdgState.algebraExpr.display);
            const needsY = /y/.test(sdgState.algebraExpr.display);
            if ((needsX && sdgState.xValue === null) || (needsY && sdgState.yValue === null)) {
              showTemporaryMessage('Set variable(s) first!');
              return;
            }
            a = sdgState.algebraExpr.evalFn(
              /x/.test(sdgState.algebraExpr.display) ? sdgState.xValue : 0,
              /y/.test(sdgState.algebraExpr.display) ? sdgState.yValue : 0
            );
            if (isNaN(a) || !isFinite(a)) {
              showTemporaryMessage('Expression is not a number!');
              return;
            }
            b = sdgState.numbers[idx];
            aLabel = `[${sdgState.algebraExpr.display}]`;
            bLabel = b;
            usedExpr = true;
          } else {
            a = sdgState.numbers[i];
            b = sdgState.numbers[idx];
            aLabel = a;
            bLabel = b;
          }
        } else {
          a = sdgState.numbers[i];
          b = sdgState.numbers[idx];
          aLabel = a;
          bLabel = b;
        }
        const op = sdgState.pendingOp;
        let result;
        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '×') result = a * b;
        else if (op === '÷') {
          if (b === 0) {
            showTemporaryMessage('Cannot divide by zero!');
            return;
          }
          result = a / b;
        }
        if (i === 'expr' && sdgState.algebraExpr) {
          sdgState.algebraExpr = null;
        } else {
          sdgState.used[i] = true;
        }
        sdgState.used[idx] = true;
        sdgState.numbers.unshift(result);
        sdgState.used.unshift(false);
        sdgState.steps.push(`${aLabel} ${op} ${bLabel} = ${result}`);
        sdgState.selected = [];
        sdgState.pendingOp = null;
        // Only end round if exactly one usable number remains (not two), and algebraic expression is not present
        const usableCount = sdgState.numbers.reduce((acc, n, i) => acc + (!sdgState.used[i] ? 1 : 0), 0);
        const algebraUsedUp = !sdgState.algebraExpr;
        if (algebraUsedUp && usableCount === 1 && Math.abs(result - 24) < 1e-6) {
          sdgState.finished = true;
        } else if (algebraUsedUp && usableCount === 1) {
          sdgState.finished = true;
        }
        window.requestAnimationFrame(renderSDG);
      }
      else if (sdgState.selected.length === 1 && !sdgState.pendingOp) {
        if (sdgState.selected[0] !== idx) {
          sdgState.selected = [idx];
          window.requestAnimationFrame(renderSDG);
        }
      }
    };
    sdgNumbersDiv.appendChild(btn);
  });
  // For variables mode, add the algebraic expression as a button in the number row
  if (currentMode === 'variables' && sdgState.algebraExpr) {
    const exprBtn = document.createElement('button');
    exprBtn.className = 'sdg-btn sdg-expr-btn';
    exprBtn.disabled = roundFinished;
    exprBtn.style.flex = `1 1 0`;
    exprBtn.style.width = buttonWidth;
    exprBtn.style.fontSize = chosenFontSize;
    exprBtn.style.textAlign = 'center';
    exprBtn.style.margin = '0';
    exprBtn.style.overflow = 'visible';
    exprBtn.style.textOverflow = 'clip';
    exprBtn.style.whiteSpace = 'normal';
    let exprStr = sdgState.algebraExpr.display;
    let showVal = false;
    let val = null;
    const exprStrLower = sdgState.algebraExpr.display.toLowerCase();
    const needsX = /x/.test(exprStrLower);
    const needsY = /y/.test(exprStrLower);
    const xSet = !needsX || sdgState.xValue !== null;
    const ySet = !needsY || sdgState.yValue !== null;
    if (xSet && ySet) {
      try {
        val = sdgState.algebraExpr.evalFn(
          needsX ? sdgState.xValue : 0,
          needsY ? sdgState.yValue : 0
        );
        if (isNaN(val) || !isFinite(val)) val = 'NaN';
        showVal = true;
      } catch (e) { val = 'NaN'; showVal = true; }
    }
    let simplified = exprStr;
    if (sdgState.xValue !== null || sdgState.yValue !== null) {
      simplified = exprStr.replace(/x/g, sdgState.xValue !== null ? `(${sdgState.xValue})` : 'x')
                         .replace(/y/g, sdgState.yValue !== null ? `(${sdgState.yValue})` : 'y');
    }
    exprBtn.innerHTML = showVal ? `<b>${val}</b>` : simplified;
    exprBtn.onclick = function() {
      if (roundFinished) return;
      if (sdgState.selected.length === 0 && !sdgState.pendingOp) {
        sdgState.selected = ['expr'];
        window.requestAnimationFrame(renderSDG);
      }
      else if (sdgState.selected.length === 1 && sdgState.pendingOp && sdgState.selected[0] !== 'expr') {
        let i = sdgState.selected[0];
        let a, b, aLabel = '', bLabel = '', usedExpr = false;
        if (i === 'expr') {
          return;
        } else {
          a = sdgState.numbers[i];
          const needsX = /x/.test(sdgState.algebraExpr.display);
          const needsY = /y/.test(sdgState.algebraExpr.display);
          if ((needsX && sdgState.xValue === null) || (needsY && sdgState.yValue === null)) {
            showTemporaryMessage('Set variable(s) first!');
            return;
          }
          b = sdgState.algebraExpr.evalFn(sdgState.xValue, sdgState.yValue);
          if (isNaN(b) || !isFinite(b)) {
            showTemporaryMessage('Expression is not a number!');
            return;
          }
          aLabel = a;
          bLabel = `[${sdgState.algebraExpr.display}]`;
          usedExpr = true;
        }
        const op = sdgState.pendingOp;
        let result;
        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '×') result = a * b;
        else if (op === '÷') {
          if (b === 0) {
            showTemporaryMessage('Cannot divide by zero!');
            return;
          }
          result = a / b;
        }
        sdgState.used[i] = true;
        sdgState.algebraExpr = null;
        sdgState.numbers.unshift(result);
        sdgState.used.unshift(false);
        sdgState.steps.push(`${aLabel} ${op} ${bLabel} = ${result}`);
        sdgState.selected = [];
        sdgState.pendingOp = null;
        // Only end round if exactly one usable number remains (not two), and algebraic expression is not present
        const usableCountExpr = sdgState.numbers.reduce((acc, n, i) => acc + (!sdgState.used[i] ? 1 : 0), 0);
        const algebraUsedUpExpr = !sdgState.algebraExpr;
        if (algebraUsedUpExpr && usableCountExpr === 1 && Math.abs(result - 24) < 1e-6) {
          sdgState.finished = true;
        } else if (algebraUsedUpExpr && usableCountExpr === 1) {
          sdgState.finished = true;
        }
        window.requestAnimationFrame(renderSDG);
      }
      else if (sdgState.selected.length === 1 && !sdgState.pendingOp) {
        if (sdgState.selected[0] !== 'expr') {
          sdgState.selected = ['expr'];
          window.requestAnimationFrame(renderSDG);
        }
      }
    };
    if (sdgState.selected.length === 1 && sdgState.selected[0] === 'expr') {
      exprBtn.classList.add('selected');
    }
    sdgNumbersDiv.appendChild(exprBtn);
  }
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
    // Only disable if round is finished or no number is selected
    btn.disabled = roundFinished || sdgState.selected.length !== 1;
    btn.onclick = function() {
      if (roundFinished || sdgState.selected.length !== 1) return;
      sdgState.pendingOp = op;
      renderSDG();
    };
    if (sdgState.pendingOp === op) btn.style.background = '#ffe082';
    opsRow.appendChild(btn);
  });
  sdgOpsDiv.appendChild(opsRow);

  // Exponential operations row (second row)
  if (currentMode === 'operations') {
    // ...existing code for exp ops row...
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
            showTemporaryMessage('Cannot take square root of negative number!');
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
  } else if (currentMode === 'variables') {
  // Variables mode: show X= and Y= input buttons, styled like other op buttons, responsive
  const varRow = document.createElement('div');
  varRow.style.display = 'flex';
  varRow.style.justifyContent = 'center';
  varRow.style.gap = '0.5em';
  varRow.style.width = '100%';
  varRow.style.marginTop = '0.7em';
  // Responsive width for variable buttons
  const varBtnFlex = numRowCount > 5 ? '1 1 0' : '2 1 0';
  // X button
  const xBtn = document.createElement('button');
  xBtn.className = 'sdg-op-btn sdg-var-btn';
  xBtn.style.flex = varBtnFlex;
  xBtn.style.minWidth = '2.2em';
  xBtn.style.maxWidth = '7em';
  xBtn.style.overflow = 'visible';
  xBtn.style.textOverflow = 'clip';
  xBtn.style.whiteSpace = 'normal';
  xBtn.disabled = false;
  xBtn.style.opacity = '';
  xBtn.style.background = '';
  xBtn.style.color = '';
  xBtn.style.borderColor = '';
  const exprUsesX = sdgState.algebraExpr && /x/.test(sdgState.algebraExpr.display);
  xBtn.innerHTML = `X = <b>${sdgState.xValue !== null ? sdgState.xValue : '?'}</b>`;
  if (!exprUsesX) {
    xBtn.disabled = true;
    xBtn.style.opacity = '0.45';
    xBtn.style.background = '#eee';
    xBtn.style.color = '#888';
    xBtn.style.borderColor = '#ccc';
  } else if (sdgState.xValue !== null) {
    xBtn.disabled = true;
    xBtn.style.opacity = '0.45';
    xBtn.style.background = '#eee';
    xBtn.style.color = '#888';
    xBtn.style.borderColor = '#ccc';
  } else {
    xBtn.onclick = function() {
      showVarInputDialog('X', sdgState.xValue, function(val) {
        if (val === null) return;
        if (val === sdgState.xValue) return;
        sdgState.steps.push(`X = ${val}`);
        sdgState.xValue = val;
        renderSDG();
      });
    };
  }
  varRow.appendChild(xBtn);
  // Y button
  const yBtn = document.createElement('button');
  yBtn.className = 'sdg-op-btn sdg-var-btn';
  yBtn.style.flex = varBtnFlex;
  yBtn.style.minWidth = '2.2em';
  yBtn.style.maxWidth = '7em';
  yBtn.style.overflow = 'visible';
  yBtn.style.textOverflow = 'clip';
  yBtn.style.whiteSpace = 'normal';
  yBtn.disabled = false;
  yBtn.style.opacity = '';
  yBtn.style.background = '';
  yBtn.style.color = '';
  yBtn.style.borderColor = '';
  const exprUsesY = sdgState.algebraExpr && /y/.test(sdgState.algebraExpr.display);
  yBtn.innerHTML = `Y = <b>${sdgState.yValue !== null ? sdgState.yValue : '?'}</b>`;
  if (!exprUsesY) {
    yBtn.disabled = true;
    yBtn.style.opacity = '0.45';
    yBtn.style.background = '#eee';
    yBtn.style.color = '#888';
    yBtn.style.borderColor = '#ccc';
  } else if (sdgState.yValue !== null) {
    yBtn.disabled = true;
    yBtn.style.opacity = '0.45';
    yBtn.style.background = '#eee';
    yBtn.style.color = '#888';
    yBtn.style.borderColor = '#ccc';
  } else {
    yBtn.onclick = function() {
      showVarInputDialog('Y', sdgState.yValue, function(val) {
        if (val === null) return;
        if (val === sdgState.yValue) return;
        sdgState.steps.push(`Y = ${val}`);
        sdgState.yValue = val;
        renderSDG();
      });
    };
  }
  varRow.appendChild(yBtn);
  sdgOpsDiv.appendChild(varRow);
  }
  // Show solution if round is finished and correct
  // If finished and correct, show solution and disable undo
  // Only end the round if there is one number box (or expr) remaining
  const numRemaining = sdgState.numbers.length - sdgState.used.filter(Boolean).length + (sdgState.algebraExpr ? 1 : 0);
  if (sdgState.finished && numRemaining === 1 && Math.abs(sdgState.numbers.find((n, i) => !sdgState.used[i]) - 24) < 1e-6) {
    let html = `<div style='color:#1976d2;'><div>Perfect!</div>`;
    if (currentSolution) {
      const steps = currentSolution.split('<br>');
      html += `<div style='margin-top:0.5em;'>Solution:</div>`;
      for (const step of steps) {
        html += `<div><b>${step}</b></div>`;
      }
    } else if (currentMode === 'variables') {
      html += `<div style='margin-top:0.5em;'>No solution found</div>`;
    }
    html += `</div>`;
    sdgFeedbackDiv.innerHTML = html;
    sdgNextBtn.style.display = '';
    sdgGiveUpBtn.style.display = 'none';
  } else if (sdgState.finished && numRemaining === 1) {
    // If finished and incorrect, allow undo
    showTemporaryMessage('Result must equal 24!');
    sdgFeedbackDiv.style.color = '#c00';
    sdgNextBtn.style.display = '';
    sdgGiveUpBtn.style.display = 'none';
    // Do NOT disable undo here
  } else {
    // Hide give up if finished, otherwise enable/disable
    sdgFeedbackDiv.textContent = '';
    sdgGiveUpBtn.disabled = roundFinished;
  }

}

function startSingleDigitsGame(numbers) {
  resetSDGState(numbers);
  renderSDG();
  sdgFeedbackDiv.textContent = '';
  sdgFeedbackDiv.style.color = '';
  // Clear any temporary message timeouts
  if (window.sdgMessageTimeout) {
    clearTimeout(window.sdgMessageTimeout);
  }
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
    currentNumbers = result.numbers;
    currentSolution = result.solution;
    startSingleDigitsGame(result.numbers);
  } else if (currentMode === 'single') {
    result = generateSolvableSingleDigits(currentDifficulty);
    currentNumbers = result.numbers;
    currentSolution = result.solution;
    startSingleDigitsGame(result.numbers);
  } else if (currentMode === 'double') {
    result = generateSolvableDoubleDigits(currentDifficulty);
    currentNumbers = result.numbers;
    currentSolution = result.solution;
    startSingleDigitsGame(result.numbers);
  } else if (currentMode === 'integers') {
    result = generateSolvableIntegers(currentDifficulty);
    currentNumbers = result.numbers;
    currentSolution = result.solution;
    startSingleDigitsGame(result.numbers);
  } else if (currentMode === 'variables') {
    let { numbers, exprObj } = generateVariablesModePuzzle();
    currentNumbers = numbers;
    currentSolution = generateVariablesModeSolution(numbers, exprObj);
    startVariablesGame(numbers, exprObj);
  } else {
    result = generateSolvableSingleDigits(currentDifficulty);
    currentNumbers = result.numbers;
    currentSolution = result.solution;
    startSingleDigitsGame(result.numbers);
  }
}
sdgNextBtn.onclick = function() {
  showNextPuzzle();
};



sdgGiveUpBtn.onclick = function() {
  // Mark round as finished first so renderSDG disables UI
  sdgState.finished = true;
  // Always show solution and message
  let html = '';
  if (currentMode === 'variables') {
    // Show solution for variables mode if available
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
    return;
  }
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
  if (sdgState.steps.length === 0) {
    if (currentMode === 'variables') {
      let { numbers, exprObj } = generateVariablesModePuzzle();
      startVariablesGame(numbers, exprObj);
    } else {
      startSingleDigitsGame(currentNumbers);
    }
    return;
  }
  const lastStep = sdgState.steps.pop();
  // Undo for operations mode exponential op
  if (currentMode === 'operations' && sdgState.expUsed && sdgState.expStep && (lastStep.includes('²') || lastStep.includes('³') || lastStep.startsWith('√') || lastStep.startsWith('∛'))) {
    let resultIdx = sdgState.numbers.lastIndexOf(sdgState.expStep.result);
    if (resultIdx !== -1) {
      sdgState.numbers.splice(resultIdx, 1);
      sdgState.used.splice(resultIdx, 1);
    }
    if (typeof sdgState.expStep.idx === 'number') {
      sdgState.used[sdgState.expStep.idx] = false;
    }
    sdgState.expUsed = false;
    sdgState.expStep = null;
    sdgState.selected = [];
    sdgState.pendingOp = null;
    sdgState.finished = false;
    sdgFeedbackDiv.textContent = '';
    sdgNextBtn.style.display = 'none';
    sdgGiveUpBtn.style.display = '';
    renderSDG();
    return;
  }
  // Undo for variables mode: check if last step used the algebraic expression
  if (currentMode === 'variables') {
    // Undo X= or Y= step
    if (lastStep && lastStep.startsWith('X = ')) {
      // Remove X value
      sdgState.xValue = null;
      sdgState.selected = [];
      sdgState.pendingOp = null;
      sdgState.finished = false;
      sdgFeedbackDiv.textContent = '';
      sdgNextBtn.style.display = 'none';
      sdgGiveUpBtn.style.display = '';
      renderSDG();
      return;
    }
    if (lastStep && lastStep.startsWith('Y = ')) {
      // Remove Y value
      sdgState.yValue = null;
      sdgState.selected = [];
      sdgState.pendingOp = null;
      sdgState.finished = false;
      sdgFeedbackDiv.textContent = '';
      sdgNextBtn.style.display = 'none';
      sdgGiveUpBtn.style.display = '';
      renderSDG();
      return;
    }
    // Undo algebraic expression use
    if (lastStep && lastStep.match(/\[.*\]/)) {
      // Remove last number (the result)
      const resultMatch = lastStep.match(/= (-?\d+(?:\.\d+)?)/);
      let result = resultMatch ? Number(resultMatch[1]) : null;
      let resultIdx = result !== null ? sdgState.numbers.lastIndexOf(result) : -1;
      if (resultIdx !== -1) {
        sdgState.numbers.splice(resultIdx, 1);
        sdgState.used.splice(resultIdx, 1);
      }
      // If the step used a number and the expr, unmark the number as used and restore the expr
      const numMatch = lastStep.match(/^(-?\d+(?:\.\d+)?) [+\-×÷] \[.*\]/);
      if (numMatch) {
        const a = Number(numMatch[1]);
        // Find the most recent used number matching a
        for (let i = sdgState.numbers.length - 1; i >= 0; --i) {
          if (sdgState.used[i] && sdgState.numbers[i] === a) {
            sdgState.used[i] = false;
            break;
          }
        }
      }
      // Restore the algebraic expression (if not present)
      if (!sdgState.algebraExpr && typeof currentNumbers !== 'undefined') {
        // Regenerate the exprObj for this round
        // (We store it in sdgState._lastExprObj for undo)
        if (sdgState._lastExprObj) {
          sdgState.algebraExpr = sdgState._lastExprObj;
        }
      }
      sdgState.selected = [];
      sdgState.pendingOp = null;
      sdgState.finished = false;
      sdgFeedbackDiv.textContent = '';
      sdgNextBtn.style.display = 'none';
      sdgGiveUpBtn.style.display = '';
      renderSDG();
      return;
    }
  }
  // Otherwise, handle normal undo for binary ops
  const match = lastStep.match(/(-?\d+(?:\.\d+)?) ([+\-×÷]) (-?\d+(?:\.\d+)?) = (-?\d+(?:\.\d+)?)/);
  if (!match) return;
  const a = Number(match[1]);
  const op = match[2];
  const b = Number(match[3]);
  const result = Number(match[4]);
  let resultIdx = sdgState.numbers.lastIndexOf(result);
  if (resultIdx === -1) return;
  sdgState.numbers.splice(resultIdx, 1);
  sdgState.used.splice(resultIdx, 1);
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
  sdgState.selected = [];
  sdgState.pendingOp = null;
  sdgState.finished = false;
  sdgFeedbackDiv.textContent = '';
  sdgNextBtn.style.display = 'none';
  sdgGiveUpBtn.style.display = '';
  renderSDG();
};

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
  let maxTries = 10000;
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
  let maxTries = 10000;
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

// --- Challenge Mode Implementation (Le compte est bon) ---
let challengeState = {
  numbers: [],
  originalNumbers: [],
  target: 0,
  steps: [],
  selectedNumber: null,
  pendingOp: null,
  finished: false,
  usedNumbers: [],
  startTime: null,
  timerInterval: null,
  solution: null
};

function showChallengeMode() {
  currentMode = 'challenge';
  generateNewChallenge();
  document.getElementById('challenge-mode-game').style.display = '';
  mainMenuDiv.style.display = 'none';
  // Clear any previous feedback
  document.getElementById('challenge-feedback').innerHTML = '';
  renderChallengeGame();
}

function generateNewChallenge() {
  let attempts = 0;
  let maxAttempts = 100;
  
  do {
    // Generate 6 random numbers from the Le compte est bon number set
    // Numbers 1-10 (can appear multiple times) and special numbers 25, 50, 75, 100
    const smallNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const largeNumbers = [25, 50, 75, 100];
    
    challengeState.numbers = [];
    challengeState.originalNumbers = [];
    
    // Generate 6 numbers (typically 1-2 large numbers and the rest small)
    const numLarge = Math.floor(Math.random() * 2) + 1; // 1-2 large numbers
    
    // Add large numbers
    for (let i = 0; i < numLarge; i++) {
      const num = largeNumbers[Math.floor(Math.random() * largeNumbers.length)];
      challengeState.numbers.push(num);
    }
    
    // Add small numbers
    for (let i = 0; i < (6 - numLarge); i++) {
      const num = smallNumbers[Math.floor(Math.random() * smallNumbers.length)];
      challengeState.numbers.push(num);
    }
    
    challengeState.originalNumbers = [...challengeState.numbers];
    
    // Generate target number between 101-999
    challengeState.target = Math.floor(Math.random() * 899) + 101;
    
    // Try to find a solution
    challengeState.solution = findChallengeSolution([...challengeState.numbers], challengeState.target);
    attempts++;
    
  } while (!challengeState.solution && attempts < maxAttempts);
  
  // If no solution found after many attempts, use a simpler target
  if (!challengeState.solution) {
    challengeState.target = challengeState.numbers[0] + challengeState.numbers[1];
    challengeState.solution = [`${challengeState.numbers[0]} + ${challengeState.numbers[1]} = ${challengeState.target}`];
  }
  
  // Reset game state
  challengeState.steps = [];
  challengeState.selectedNumber = null;
  challengeState.pendingOp = null;
  challengeState.finished = false;
  challengeState.usedNumbers = [];
  challengeState.startTime = new Date();
  
  // Start timer
  if (challengeState.timerInterval) {
    clearInterval(challengeState.timerInterval);
  }
  challengeState.timerInterval = setInterval(updateTimer, 1000);
}

function findChallengeSolution(nums, target, maxSteps = 5) {
  // Simple solution finder - try basic combinations
  function tryAllCombinations(numbers, targetNum, steps = [], depth = 0) {
    if (depth > maxSteps) return null;
    
    // Check if we have the target
    if (numbers.includes(targetNum)) {
      return steps;
    }
    
    // Try all pairs of numbers with all operations
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const num1 = numbers[i];
        const num2 = numbers[j];
        const operations = ['+', '-', '×', '÷'];
        
        for (const op of operations) {
          let result;
          let stepStr;
          
          switch(op) {
            case '+':
              result = num1 + num2;
              stepStr = `${num1} + ${num2} = ${result}`;
              break;
            case '-':
              if (num1 > num2) {
                result = num1 - num2;
                stepStr = `${num1} - ${num2} = ${result}`;
              } else {
                result = num2 - num1;
                stepStr = `${num2} - ${num1} = ${result}`;
              }
              break;
            case '×':
              result = num1 * num2;
              stepStr = `${num1} × ${num2} = ${result}`;
              break;
            case '÷':
              if (num2 !== 0 && num1 % num2 === 0) {
                result = num1 / num2;
                stepStr = `${num1} ÷ ${num2} = ${result}`;
              } else if (num1 !== 0 && num2 % num1 === 0) {
                result = num2 / num1;
                stepStr = `${num2} ÷ ${num1} = ${result}`;
              } else {
                continue; // Skip non-integer divisions
              }
              break;
          }
          
          if (result > 0 && result === Math.floor(result) && result < 10000) {
            const newNumbers = [...numbers];
            newNumbers.splice(j, 1); // Remove larger index first
            newNumbers.splice(i, 1); // Then smaller index
            newNumbers.push(result);
            
            const newSteps = [...steps, stepStr];
            
            if (result === targetNum) {
              return newSteps;
            }
            
            const solution = tryAllCombinations(newNumbers, targetNum, newSteps, depth + 1);
            if (solution) {
              return solution;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  return tryAllCombinations(nums, target);
}

function updateTimer() {
  if (challengeState.finished || !challengeState.startTime) return;
  
  const elapsed = Math.floor((new Date() - challengeState.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  const timerDiv = document.getElementById('challenge-timer');
  if (timerDiv) {
    timerDiv.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function renderChallengeGame() {
  // Render target number
  const targetDiv = document.getElementById('challenge-target');
  targetDiv.innerHTML = `<div class="target-label">Target:</div><div class="target-number">${challengeState.target}</div>`;
  
  // Render available numbers
  const numbersDiv = document.getElementById('challenge-numbers');
  numbersDiv.innerHTML = '';
  
  challengeState.numbers.forEach((num, idx) => {
    const numBtn = document.createElement('button');
    numBtn.className = 'challenge-number-btn';
    numBtn.textContent = num;
    numBtn.disabled = challengeState.finished;
    
    // Highlight selected number or if we're waiting for second number
    if (challengeState.selectedNumber === idx || 
        (challengeState.pendingOp && challengeState.selectedNumber === null)) {
      numBtn.classList.add('selected');
    }
    
    numBtn.onclick = function() {
      if (challengeState.finished) return;
      
      if (!challengeState.pendingOp) {
        // First number selection
        challengeState.selectedNumber = idx;
        renderChallengeGame();
      } else {
        // Second number selection - perform operation
        if (idx !== challengeState.selectedNumber) {
          performOperation(challengeState.pendingOp, challengeState.selectedNumber, idx);
        }
      }
    };
    
    numbersDiv.appendChild(numBtn);
  });
  
  // Render operations
  const opsRow = document.getElementById('challenge-ops-row');
  opsRow.innerHTML = '';
  
  const operations = ['+', '-', '×', '÷'];
  operations.forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.className = 'sdg-op-btn';
    btn.disabled = challengeState.finished || challengeState.selectedNumber === null;
    
    if (challengeState.pendingOp === op) {
      btn.classList.add('selected');
      btn.style.background = '#ffe082';
      btn.style.color = '#222';
      btn.style.borderColor = '#fbc02d';
    }
    
    btn.onclick = function() {
      if (btn.disabled) return;
      challengeState.pendingOp = op;
      renderChallengeGame();
    };
    
    opsRow.appendChild(btn);
  });
  
  // Add instruction text
  let instructionText = '';
  if (challengeState.finished) {
    instructionText = 'Game finished! Use the buttons below to continue.';
  } else if (challengeState.selectedNumber === null && !challengeState.pendingOp) {
    instructionText = 'Select a number to start';
  } else if (challengeState.selectedNumber !== null && !challengeState.pendingOp) {
    instructionText = `Selected: ${challengeState.numbers[challengeState.selectedNumber]} - Now select an operation`;
  } else if (challengeState.pendingOp && challengeState.selectedNumber !== null) {
    instructionText = `${challengeState.numbers[challengeState.selectedNumber]} ${challengeState.pendingOp} ? - Select second number`;
  }
  
  // Update the instruction display
  const instructionsDiv = document.querySelector('.challenge-instructions');
  if (instructionsDiv) {
    instructionsDiv.innerHTML = instructionText || 'Use the 6 numbers and basic operations (+, -, ×, ÷) to reach the target. Select number → operation → number!';
  }
  
  // Render calculation steps
  const stepList = document.getElementById('challenge-step-list');
  stepList.innerHTML = challengeState.steps.map(s => `<div class="calculation-step">${s}</div>`).join('');
  
  // Check for win condition
  checkWinCondition();
}

function performOperation(op, idx1, idx2) {
  if (idx1 === idx2 || idx1 === null || idx2 === null) return;
  
  const num1 = challengeState.numbers[idx1];
  const num2 = challengeState.numbers[idx2];
  
  let result;
  let stepStr;
  
  switch(op) {
    case '+':
      result = num1 + num2;
      stepStr = `${num1} + ${num2} = ${result}`;
      break;
    case '-':
      // Always subtract smaller from larger to avoid negatives
      if (num1 >= num2) {
        result = num1 - num2;
        stepStr = `${num1} - ${num2} = ${result}`;
      } else {
        result = num2 - num1;
        stepStr = `${num2} - ${num1} = ${result}`;
      }
      break;
    case '×':
      result = num1 * num2;
      stepStr = `${num1} × ${num2} = ${result}`;
      break;
    case '÷':
      // Check for division by zero and ensure clean division
      if (num2 === 0 || num1 === 0) {
        document.getElementById('challenge-feedback').innerHTML = '<div style="color: #d32f2f; font-weight: 500;">Cannot divide by zero!</div>';
        setTimeout(() => {
          document.getElementById('challenge-feedback').textContent = '';
        }, 2000);
        return;
      }
      
      // For Le compte est bon, we want integer results when possible
      if (num1 >= num2 && num1 % num2 === 0) {
        result = num1 / num2;
        stepStr = `${num1} ÷ ${num2} = ${result}`;
      } else if (num2 > num1 && num2 % num1 === 0) {
        result = num2 / num1;
        stepStr = `${num2} ÷ ${num1} = ${result}`;
      } else {
        // Allow non-integer results but prefer cleaner ones
        result = num1 / num2;
        stepStr = `${num1} ÷ ${num2} = ${result}`;
        if (result !== Math.floor(result)) {
          result = Math.round(result * 100) / 100; // Round to 2 decimal places
          stepStr = `${num1} ÷ ${num2} = ${result}`;
        }
      }
      break;
  }
  
      // Only allow positive results (as per Le compte est bon rules)
  if (result <= 0 || !isFinite(result)) {
    document.getElementById('challenge-feedback').innerHTML = '<div style="color: #d32f2f; font-weight: 500;">Result must be positive!</div>';
    setTimeout(() => {
      document.getElementById('challenge-feedback').textContent = '';
    }, 2000);
    return;
  }  // Record the step
  challengeState.steps.push(stepStr);
  challengeState.usedNumbers.push(num1, num2);
  
  // Remove the two used numbers and add the result
  const [smallerIdx, largerIdx] = [idx1, idx2].sort((a, b) => a - b);
  challengeState.numbers.splice(largerIdx, 1); // Remove larger index first
  challengeState.numbers.splice(smallerIdx, 1); // Then remove smaller index
  challengeState.numbers.push(result);
  
  // Clear selection state
  challengeState.selectedNumber = null;
  challengeState.pendingOp = null;
  
  // Clear any previous feedback
  document.getElementById('challenge-feedback').textContent = '';
  
  // Re-render
  renderChallengeGame();
}

function checkWinCondition() {
  const feedbackDiv = document.getElementById('challenge-feedback');
  
  // Check if we have exactly the target in our numbers
  if (challengeState.numbers.includes(challengeState.target)) {
    challengeState.finished = true;
    if (challengeState.timerInterval) {
      clearInterval(challengeState.timerInterval);
    }
    const elapsed = Math.floor((new Date() - challengeState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    feedbackDiv.innerHTML = `<div class="success-message">Perfect! You found ${challengeState.target} in ${timeStr}!</div>`;
    return;
  }
  
  // If only one number left, check how close we are
  if (challengeState.numbers.length === 1) {
    challengeState.finished = true;
    if (challengeState.timerInterval) {
      clearInterval(challengeState.timerInterval);
    }
    const result = challengeState.numbers[0];
    const difference = Math.abs(result - challengeState.target);
    const elapsed = Math.floor((new Date() - challengeState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (difference === 0) {
      feedbackDiv.innerHTML = `<div class="success-message">Perfect! You found ${challengeState.target} in ${timeStr}!</div>`;
    } else {
      feedbackDiv.innerHTML = `<div class="close-message">Close! You got ${result}, target was ${challengeState.target} (off by ${difference}) - Time: ${timeStr}</div>`;
    }
  }
}


// Challenge mode button handlers
document.addEventListener('DOMContentLoaded', function() {
  const challengeModeBtn = document.getElementById('challenge-mode-btn');
  if (challengeModeBtn) {
    challengeModeBtn.onclick = showChallengeMode;
  }
  
  const challengeUndoBtn = document.getElementById('challenge-undo');
  if (challengeUndoBtn) {
    challengeUndoBtn.onclick = function() {
      if (challengeState.steps.length === 0) {
        // If no steps to undo, just clear current selection
        challengeState.selectedNumber = null;
        challengeState.pendingOp = null;
        renderChallengeGame();
        return;
      }
      
      // Remove the last step and reset to original, then replay
      challengeState.steps.pop();
      challengeState.numbers = [...challengeState.originalNumbers];
      challengeState.usedNumbers = [];
      challengeState.selectedNumber = null;
      challengeState.pendingOp = null;
      challengeState.finished = false;
      
      // Replay all remaining steps
      const stepsToReplay = [...challengeState.steps];
      challengeState.steps = [];
      
      for (const step of stepsToReplay) {
        const match = step.match(/(\d+(?:\.\d+)?) ([+\-×÷]) (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)/);
        if (match) {
          const num1 = parseFloat(match[1]);
          const op = match[2];
          const num2 = parseFloat(match[3]);
          
          const idx1 = challengeState.numbers.findIndex(n => Math.abs(n - num1) < 0.001);
          const idx2 = challengeState.numbers.findIndex((n, i) => Math.abs(n - num2) < 0.001 && i !== idx1);
          
          if (idx1 !== -1 && idx2 !== -1) {
            performOperation(op, idx1, idx2);
          }
        }
      }
      
      renderChallengeGame();
    };
  }
  
  const challengeGiveUpBtn = document.getElementById('challenge-give-up');
  if (challengeGiveUpBtn) {
    challengeGiveUpBtn.onclick = function() {
      challengeState.finished = true;
      if (challengeState.timerInterval) {
        clearInterval(challengeState.timerInterval);
      }
      
      const feedbackDiv = document.getElementById('challenge-feedback');
      let solutionHtml = '<div style="color: #f57c00; font-weight: 600; margin-bottom: 1em;">Game Over!</div>';
      
      if (challengeState.solution && challengeState.solution.length > 0) {
        solutionHtml += '<div style="margin-bottom: 0.5em; font-weight: 600;">One possible solution:</div>';
        challengeState.solution.forEach(step => {
          solutionHtml += `<div style="background: #fff3e0; border: 1px solid #ffcc02; padding: 0.5em; margin: 0.3em 0; border-radius: 0.3em;">${step}</div>`;
        });
      } else {
        solutionHtml += '<div>No solution was found for this combination.</div>';
      }
      
      feedbackDiv.innerHTML = solutionHtml;
      renderChallengeGame();
    };
  }
  
  const challengeResetBtn = document.getElementById('challenge-reset');
  if (challengeResetBtn) {
    challengeResetBtn.onclick = function() {
      challengeState.numbers = [...challengeState.originalNumbers];
      challengeState.steps = [];
      challengeState.selectedNumber = null;
      challengeState.pendingOp = null;
      challengeState.finished = false;
      challengeState.usedNumbers = [];
      challengeState.startTime = new Date();
      if (challengeState.timerInterval) {
        clearInterval(challengeState.timerInterval);
      }
      challengeState.timerInterval = setInterval(updateTimer, 1000);
      document.getElementById('challenge-feedback').innerHTML = '';
      renderChallengeGame();
    };
  }
  
  const challengeNewBtn = document.getElementById('challenge-new');
  if (challengeNewBtn) {
    challengeNewBtn.onclick = function() {
      // Clear any previous feedback before generating new challenge
      document.getElementById('challenge-feedback').innerHTML = '';
      generateNewChallenge();
      renderChallengeGame();
    };
  }
  
  const challengeBackBtn = document.getElementById('challenge-back');
  if (challengeBackBtn) {
    challengeBackBtn.onclick = function() {
      // Clear feedback and stop timer when going back to main menu
      document.getElementById('challenge-feedback').innerHTML = '';
      if (challengeState.timerInterval) {
        clearInterval(challengeState.timerInterval);
      }
      document.getElementById('challenge-mode-game').style.display = 'none';
      mainMenuDiv.style.display = '';
    };
  }
});