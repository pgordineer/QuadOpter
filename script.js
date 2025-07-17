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

function renderSDG() {
  const roundFinished = sdgState.finished;
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
              sdgFeedbackDiv.textContent = 'Set variable(s) first!';
              return;
            }
            a = sdgState.algebraExpr.evalFn(
              /x/.test(sdgState.algebraExpr.display) ? sdgState.xValue : 0,
              /y/.test(sdgState.algebraExpr.display) ? sdgState.yValue : 0
            );
            if (isNaN(a) || !isFinite(a)) {
              sdgFeedbackDiv.textContent = 'Expression is not a number!';
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
            sdgFeedbackDiv.textContent = '❌ Division by zero!';
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
            sdgFeedbackDiv.textContent = 'Set variable(s) first!';
            return;
          }
          b = sdgState.algebraExpr.evalFn(sdgState.xValue, sdgState.yValue);
          if (isNaN(b) || !isFinite(b)) {
            sdgFeedbackDiv.textContent = 'Expression is not a number!';
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
            sdgFeedbackDiv.textContent = '❌ Division by zero!';
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
  // Render steps
  sdgExprDiv.innerHTML = sdgState.steps.map(s => `<div>${s}</div>`).join('');
  // Show solution if round is finished and correct
  // If finished and correct, show solution and disable undo
  // Only end the round if there is one number box (or expr) remaining
  const numRemaining = sdgState.numbers.length - sdgState.used.filter(Boolean).length + (sdgState.algebraExpr ? 1 : 0);
  if (sdgState.finished && numRemaining === 1 && Math.abs(sdgState.numbers.find((n, i) => !sdgState.used[i]) - 24) < 1e-6) {
    let html = `<div style='color:#1976d2;'><div>🎉 Correct!</div>`;
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
    showDailyMode();
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
// --- Daily Mode Implementation ---
let dailyState = {
  numbers: [],
  used: Array(16).fill(false),
  steps: [],
  selected: [],
  pendingOp: null,
  finished: false,
  solution: null,
};

function showDailyMode() {
  currentMode = 'daily';
  let { numbers, solution } = generateSolvableDailyMode();
  dailyState.numbers = numbers;
  dailyState.used = Array(16).fill(false);
  dailyState.steps = [];
  dailyState.selected = [];
  dailyState.pendingOp = null;
  dailyState.finished = false;
  dailyState.solution = solution;
  renderDailyGrid();
  document.getElementById('daily-mode-game').style.display = '';
  mainMenuDiv.style.display = 'none';
  document.getElementById('daily-feedback').textContent = '';
}

function generateSolvableDailyMode() {
  let ops = ['+', '-', '*', '/'];
  let expOps = [
    { fn: x => x * x, str: a => `(${a})²`, check: x => Math.abs(x) < 100 },
    { fn: x => x * x * x, str: a => `(${a})³`, check: x => Math.abs(x) < 22 },
    { fn: x => x >= 0 ? Math.sqrt(x) : NaN, str: a => `√(${a})`, check: x => x >= 0 },
    { fn: x => Math.cbrt(x), str: a => `∛(${a})`, check: x => true }
  ];
  let maxTries = 20000;
  for (let tries = 0; tries < maxTries; ++tries) {
    let nums = [];
    while (nums.length < 16) {
      let n = randInt(-99, 99);
      if (Math.abs(n) > 9) nums.push(n);
    }
    let solution = find24Daily(nums, ops, expOps, 24);
    if (solution) {
      return { numbers: nums, solution };
    }
  }
  let nums = [];
  while (nums.length < 16) {
    let n = randInt(-99, 99);
    if (Math.abs(n) > 9) nums.push(n);
  }
  return { numbers: nums, solution: null };
}

function find24Daily(nums, allowedOps, expOps, target) {
  for (let i = 0; i < nums.length; ++i) {
    for (let j = 0; j < nums.length; ++j) {
      if (i === j) continue;
      for (let op of allowedOps) {
        let a = nums[i], b = nums[j];
        let result = evalBinary(a, op, b);
        if (Math.abs(result - target) < 1e-6 && isFinite(result)) {
          return [`${a} ${op} ${b} = ${result}`];
        }
        for (let exp of expOps) {
          if (exp.check(a)) {
            let ea = exp.fn(a);
            let r2 = evalBinary(ea, op, b);
            if (Math.abs(r2 - target) < 1e-6 && isFinite(r2)) {
              return [`${exp.str(a)} = ${ea}`, `${ea} ${op} ${b} = ${r2}`];
            }
          }
          if (exp.check(b)) {
            let eb = exp.fn(b);
            let r2 = evalBinary(a, op, eb);
            if (Math.abs(r2 - target) < 1e-6 && isFinite(r2)) {
              return [`${exp.str(b)} = ${eb}`, `${a} ${op} ${eb} = ${r2}`];
            }
          }
        }
      }
    }
  }
  return null;
}

function renderDailyGrid() {
  for (let i = 0; i < 16; ++i) {
    const cell = document.getElementById(`cell-${i}`);
    cell.className = 'diamond-cell';
    cell.textContent = dailyState.used[i] ? '' : dailyState.numbers[i];
    if (dailyState.used[i]) cell.classList.add('blank');
    if (dailyState.selected.length === 1 && dailyState.selected[0] === i) cell.classList.add('selected');
    cell.onclick = function() {
      if (dailyState.finished || dailyState.used[i]) return;
      if (dailyState.selected.length === 0 && !dailyState.pendingOp) {
        dailyState.selected = [i];
        renderDailyGrid();
      } else if (dailyState.selected.length === 1 && dailyState.pendingOp && dailyState.selected[0] !== i) {
        let aIdx = dailyState.selected[0], bIdx = i;
        let a = dailyState.numbers[aIdx], b = dailyState.numbers[bIdx];
        let op = dailyState.pendingOp;
        let result;
        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '×' || op === '*') result = a * b;
        else if (op === '÷' || op === '/') {
          if (b === 0) {
            document.getElementById('daily-feedback').textContent = '❌ Division by zero!';
            return;
          }
          result = a / b;
        }
        dailyState.used[aIdx] = true;
        dailyState.numbers[bIdx] = result;
        dailyState.steps.push(`${a} ${op} ${b} = ${result}`);
        dailyState.selected = [];
        dailyState.pendingOp = null;
        let usableCount = dailyState.numbers.reduce((acc, n, idx) => acc + (!dailyState.used[idx] ? 1 : 0), 0);
        if (usableCount === 1 && Math.abs(result - 24) < 1e-6) {
          dailyState.finished = true;
        } else if (usableCount === 1) {
          dailyState.finished = true;
        }
        renderDailyGrid();
      } else if (dailyState.selected.length === 1 && !dailyState.pendingOp) {
        if (dailyState.selected[0] !== i) {
          dailyState.selected = [i];
          renderDailyGrid();
        }
      }
    };
  }
  const opsRow = document.getElementById('daily-ops-row');
  opsRow.innerHTML = '';
  // Standard operations row
  const stdOpsDiv = document.createElement('div');
  stdOpsDiv.className = 'ops-row';
  ['+', '-', '×', '÷'].forEach(op => {
    const btn = document.createElement('button');
    btn.textContent = op;
    btn.className = 'sdg-op-btn';
    btn.disabled = dailyState.finished || dailyState.selected.length !== 1;
    btn.onclick = function() {
      if (dailyState.finished || dailyState.selected.length !== 1) return;
      dailyState.pendingOp = op;
      renderDailyGrid();
    };
    if (dailyState.pendingOp === op) btn.style.background = '#ffe082';
    stdOpsDiv.appendChild(btn);
  });
  opsRow.appendChild(stdOpsDiv);
  // Exponential operations row
  const expOpsDiv = document.createElement('div');
  expOpsDiv.className = 'ops-row';
  ['x²','x³','√x','∛x'].forEach((label, idx) => {
    const btn = document.createElement('button');
    btn.innerHTML = label;
    btn.className = 'sdg-op-btn';
    btn.disabled = dailyState.finished || dailyState.selected.length !== 1;
    btn.onclick = function() {
      if (btn.disabled) return;
      const expOps = ['square','cube','sqrt','cbrt'];
      const exp = expOps[idx];
      const i = dailyState.selected[0];
      let a = dailyState.numbers[i];
      let result, stepStr;
      if (exp === 'square') {
        result = a * a;
        stepStr = `${a}² = ${result}`;
      } else if (exp === 'cube') {
        result = a * a * a;
        stepStr = `${a}³ = ${result}`;
      } else if (exp === 'sqrt') {
        if (a < 0) {
          document.getElementById('daily-feedback').textContent = '❌ Cannot sqrt negative!';
          return;
        }
        result = Math.sqrt(a);
        stepStr = `√${a} = ${result}`;
      } else if (exp === 'cbrt') {
        result = Math.cbrt(a);
        stepStr = `∛${a} = ${result}`;
      }
      dailyState.used[i] = true;
      let blankIdx = dailyState.used.findIndex(u => u);
      if (blankIdx === -1) blankIdx = i;
      dailyState.numbers[blankIdx] = result;
      dailyState.used[blankIdx] = false;
      dailyState.steps.push(stepStr);
      dailyState.selected = [];
      dailyState.pendingOp = null;
      renderDailyGrid();
    };
    expOpsDiv.appendChild(btn);
  });
  opsRow.appendChild(expOpsDiv);
  const stepList = document.getElementById('daily-step-list');
  stepList.innerHTML = dailyState.steps.map(s => `<div>${s}</div>`).join('');
  const feedbackDiv = document.getElementById('daily-feedback');
  if (dailyState.finished) {
    let usableIdx = dailyState.numbers.findIndex((n, idx) => !dailyState.used[idx]);
    let result = usableIdx !== -1 ? dailyState.numbers[usableIdx] : null;
    if (Math.abs(result - 24) < 1e-6) {
      let html = `<div style='color:#1976d2;'><div>🎉 Correct!</div>`;
      if (dailyState.solution) {
        html += `<div style='margin-top:0.5em;'>Solution:</div>`;
        for (const step of dailyState.solution) {
          html += `<div><b>${step}</b></div>`;
        }
      }
      html += `</div>`;
      feedbackDiv.innerHTML = html;
    } else {
      feedbackDiv.innerHTML = `<span style='color:#c00;'>Not 24!</span>`;
    }
  } else {
    feedbackDiv.textContent = '';
  }
}

document.getElementById('daily-undo').onclick = function() {
  if (dailyState.steps.length === 0) {
    showDailyMode();
    return;
  }
  const lastStep = dailyState.steps.pop();
  const match = lastStep.match(/(-?\d+(?:\.\d+)?) ([+\-×÷]) (-?\d+(?:\.\d+)?) = (-?\d+(?:\.\d+)?)/);
  if (match) {
    const a = Number(match[1]);
    const op = match[2];
    const b = Number(match[3]);
    const result = Number(match[4]);
    let resultIdx = dailyState.numbers.lastIndexOf(result);
    if (resultIdx !== -1) {
      dailyState.numbers[resultIdx] = b;
      dailyState.used[resultIdx] = false;
    }
    let aIdx = dailyState.numbers.indexOf(a);
    if (aIdx !== -1) dailyState.used[aIdx] = false;
    dailyState.finished = false;
    dailyState.selected = [];
    dailyState.pendingOp = null;
    renderDailyGrid();
    return;
  }
  if (lastStep.includes('²') || lastStep.includes('³') || lastStep.startsWith('√') || lastStep.startsWith('∛')) {
    const resultMatch = lastStep.match(/= (-?\d+(?:\.\d+)?)/);
    let result = resultMatch ? Number(resultMatch[1]) : null;
    let resultIdx = dailyState.numbers.lastIndexOf(result);
    if (resultIdx !== -1) {
      dailyState.numbers[resultIdx] = 0;
      dailyState.used[resultIdx] = true;
    }
    dailyState.finished = false;
    dailyState.selected = [];
    dailyState.pendingOp = null;
    renderDailyGrid();
    return;
  }
};
document.getElementById('daily-giveup').onclick = function() {
  dailyState.finished = true;
  renderDailyGrid();
};
document.getElementById('daily-back').onclick = function() {
  document.getElementById('daily-mode-game').style.display = 'none';
  mainMenuDiv.style.display = '';
};
}