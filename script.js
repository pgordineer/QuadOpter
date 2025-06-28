// --- Saviour Mode (Daily) ---
let saviourDailyDate = null; // MM/DD/YYYY string
let saviourDailyCurrentScore = 0; // actions in current game
let saviourDailyHighScore = 0; // lowest actions in a win for the day
let saviourDailyHighTotal = 0; // grid size for that win

function getTodayDateStr() {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getSaviourDailyKey(dateStr) {
  return `flagellum_saviour_daily_${dateStr}`;
}

function loadSaviourDailyScores(dateStr) {
  const key = getSaviourDailyKey(dateStr);
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  saviourDailyHighScore = data.highScore || 0;
  saviourDailyHighTotal = data.highTotal || 0;
  // Do not load running score for the day
  // saviourDailyCurrentScore is NOT reset here anymore
}

function saveSaviourDailyScores(dateStr) {
  const key = getSaviourDailyKey(dateStr);
  // Only save if there is a high score (win)
  const data = {
    highScore: saviourDailyHighScore,
    highTotal: saviourDailyHighTotal
  };
  localStorage.setItem(key, JSON.stringify(data));
}

// Launch Saviour Mode Daily with date pill
document.getElementById('saviour-daily-mode-btn').onclick = function(e) {
  // Only trigger if not clicking the date pill
  if (e.target.closest('#saviour-daily-date-pill')) return;
  const dateText = document.getElementById('saviour-daily-date-text').textContent.trim();
  saviourDailyDate = dateText;
  loadSaviourDailyScores(saviourDailyDate);
  showSaviourModeDaily();
};

// Date pill click opens calendar
document.getElementById('saviour-daily-date-pill').onclick = function(e) {
  e.stopPropagation();
  const dailyCalendarDiv = document.getElementById('saviour-daily-calendar');
  // Toggle: if already open, close it
  if (dailyCalendarDiv.style.display === 'block') {
    dailyCalendarDiv.style.display = 'none';
    return;
  }
  renderSaviourDailyCalendar(saviourDailyDate || getTodayDateStr());
  // Always use position: fixed and align bottom of calendar to bottom of Saviour Mode button
  const savBtn = document.getElementById('saviour-mode-btn');
  const dailyBtn = document.getElementById('saviour-daily-mode-btn');
  const cal = dailyCalendarDiv;
  cal.style.display = 'block';
  cal.style.visibility = 'hidden';
  cal.style.position = 'fixed';
  cal.style.minWidth = '270px';
  cal.style.maxWidth = '340px';
  cal.style.width = '';
  cal.style.textAlign = 'center';
  // Wait for render to get correct height
  setTimeout(() => {
    const calHeight = cal.offsetHeight;
    const calWidth = cal.offsetWidth;
    const savRect = savBtn.getBoundingClientRect();
    // Align bottom of calendar to bottom of Saviour Mode button, and center horizontally to Saviour Mode Daily button
    const dailyRect = dailyBtn.getBoundingClientRect();
    const left = Math.round(dailyRect.left + (dailyRect.width/2) - (calWidth/2));
    const bottom = Math.round(savRect.bottom); // align to bottom of Saviour Mode
    const top = bottom - calHeight;
    cal.style.left = left + 'px';
    cal.style.top = top + 'px';
    cal.style.visibility = 'visible';
    cal.style.zIndex = 1001;
  }, 0);
};



// --- Calendar UI for Saviour Mode Daily ---
const dailyDateText = document.getElementById('saviour-daily-date-text');
const dailyCalendarDiv = document.getElementById('saviour-daily-calendar');
let calendarMonth = null;
let calendarYear = null;


function renderSaviourDailyCalendar(selectedDateStr) {
  // Parse selected date
  let selDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
  if (isNaN(selDate)) selDate = new Date();
  calendarMonth = selDate.getMonth();
  calendarYear = selDate.getFullYear();
  // Start of month
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  // Header
  let html = `<div class='calendar-header'>`;
  html += `<button id='cal-prev' type='button'>&lt;</button>`;
  html += `<span>${firstDay.toLocaleString('default', { month: 'long' })} ${calendarYear}</span>`;
  html += `<button id='cal-next' type='button'>&gt;</button>`;
  html += `</div>`;
  // Days of week
  html += `<div class='calendar-grid'>`;
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => html += `<div style='font-weight:bold;color:#888;'>${d}</div>`);
  html += `</div><div class='calendar-grid'>`;
  // Empty days
  for (let i = 0; i < startDay; i++) html += `<div></div>`;
  // Days with scores
  const today = new Date();
  const todayStr = getTodayDateStr();
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${mm}/${dd}/${calendarYear}`;
    const key = getSaviourDailyKey(dateStr);
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    let badge = '';
    if (data.highScore > 0) badge = `<span class='score-badge'>${data.highScore}</span>`;
    let classes = 'calendar-day';
    // Compare dateStr to todayStr (MM/DD/YYYY)
    const [cm, cd, cy] = [parseInt(mm), parseInt(dd), parseInt(calendarYear)];
    const [tm, td, ty] = [today.getMonth() + 1, today.getDate(), today.getFullYear()];
    let isFuture = (cy > ty) || (cy === ty && cm > tm) || (cy === ty && cm === tm && cd > td);
    if (dateStr === todayStr) classes += ' today';
    if (dateStr === saviourDailyDate) classes += ' selected';
    if (isFuture) classes += ' future';
    html += `<div class='${classes}' data-date='${dateStr}'>${d}${badge}</div>`;
  }
  html += `</div>`;
  dailyCalendarDiv.innerHTML = html;
  dailyCalendarDiv.style.display = 'block';
  // Do not set position/top/left here; handled in pill click logic
}

// Event delegation for calendar
dailyCalendarDiv.onclick = function(e) {
  e.stopPropagation();
  const prevBtn = e.target.closest('#cal-prev');
  const nextBtn = e.target.closest('#cal-next');
  const dayDiv = e.target.closest('.calendar-day');
  if (prevBtn) {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderSaviourDailyCalendar(`${String(calendarMonth+1).padStart(2,'0')}/01/${calendarYear}`);
    return;
  }
  if (nextBtn) {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderSaviourDailyCalendar(`${String(calendarMonth+1).padStart(2,'0')}/01/${calendarYear}`);
    return;
  }
  if (dayDiv && !dayDiv.classList.contains('future')) {
    const dateStr = dayDiv.getAttribute('data-date');
    dailyCalendarDiv.style.display = 'none';
    dailyDateText.textContent = dateStr;
    saviourDailyDate = dateStr;
    loadSaviourDailyScores(dateStr);
    updateMainMenuHighscores();
    updateSaviourDailyButtonLabel();
    return;
  }
};


// Hide calendar on body click

// Hide calendar only if clicking outside the calendar or date pill
document.body.addEventListener('click', function(e) {
  const calendar = document.getElementById('saviour-daily-calendar');
  const pill = document.getElementById('saviour-daily-date-pill');
  if (!calendar || !pill) return;
  if (calendar.style.display !== 'block') return;
  if (calendar.contains(e.target) || pill.contains(e.target)) return;
  calendar.style.display = 'none';
});

// --- Main Menu Highscores: Add Saviour Daily ---
const origUpdateMainMenuHighscores = updateMainMenuHighscores;
updateMainMenuHighscores = function() {
  origUpdateMainMenuHighscores();
  // Add Saviour Daily below main-highscores
  const mainHigh = document.getElementById('main-highscores');
  if (!mainHigh) return;
  let date = saviourDailyDate || getTodayDateStr();
  loadSaviourDailyScores(date);
  let dailyRow = document.getElementById('main-highscore-saviour-daily');
  if (!dailyRow) {
    dailyRow = document.createElement('div');
    dailyRow.id = 'main-highscore-saviour-daily';
    dailyRow.className = 'main-highscore-row';
    mainHigh.appendChild(dailyRow);
  }
  dailyRow.innerHTML = `Saviour Mode Daily <span style='color:#888;font-size:0.98em;'>(${date})</span>: <b>${saviourDailyHighScore > 0 ? saviourDailyHighScore : '-'}</b>`;
};

// --- In-Game UI: Show Saviour Daily stats if in daily mode ---
let inSaviourDailyMode = false;
function showSaviourModeDaily() {
  inSaviourDailyMode = true;
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'none';
  document.getElementById('study-page').style.display = 'none';
  document.getElementById('game-saviour').style.display = 'flex';
  // Add game mode title
  setGameModeTitle('game-saviour', `Saviour Mode Daily (${saviourDailyDate || getTodayDateStr()})`);
  const resultDiv = document.getElementById('result-saviour');
  if (resultDiv) resultDiv.innerHTML = '';
  // Only reset current score at the start of a new daily game
  saviourDailyCurrentScore = 0;
  updateSaviourScoreDisplays();
  setupSaviourGrid();
  setupSaviourActions();
}

// Helper to set the game mode title at the top of each game screen
function setGameModeTitle(containerId, title) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let titleDiv = container.querySelector('.game-mode-title');
  if (!titleDiv) {
    titleDiv = document.createElement('div');
    titleDiv.className = 'game-mode-title';
    // Insert before the first score row or as first child
    let firstScoreRow = container.querySelector('.score-row');
    if (firstScoreRow) {
      container.insertBefore(titleDiv, firstScoreRow);
    } else {
      container.insertBefore(titleDiv, container.firstChild);
    }
  }
  titleDiv.textContent = title;
}

// Patch updateSaviourScoreDisplays to show daily stats if in daily mode
const origUpdateSaviourScoreDisplays = updateSaviourScoreDisplays;
updateSaviourScoreDisplays = function() {
  if (inSaviourDailyMode) {
    document.getElementById('score-saviour').innerHTML = `<span style="color:#0078d7;font-weight:500;">Actions Used:</span> ${saviourDailyCurrentScore}`;
    let savHS = `<span style="color:#0078d7;font-weight:500;">High Score:</span> ${saviourDailyHighScore > 0 ? saviourDailyHighScore : '-'}`;
    let nhs = '';
    if (saviourDailyCurrentScore > 0 && (saviourDailyHighScore === 0 || saviourDailyCurrentScore < saviourDailyHighScore)) {
      nhs = '<div class="new-highscore">New High Score!</div>';
    }
    document.getElementById('highscore-saviour').innerHTML = savHS + nhs;
  } else {
    origUpdateSaviourScoreDisplays();
  }
};



function updateSaviourDailyButtonLabel() {
  const btnLabel = document.getElementById('saviour-daily-btn-label');
  if (btnLabel) {
    btnLabel.textContent = 'Saviour Mode Daily';
  }
}

window.addEventListener('DOMContentLoaded', function() {
  const dateText = document.getElementById('saviour-daily-date-text');
  if (dateText) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    dateText.textContent = `${mm}/${dd}/${yyyy}`;
    updateSaviourDailyButtonLabel();
  }
});
// --- Saviour Mode ---
let saviourScore = 0;
let saviourTotal = 0;
let saviourHighScore = 0;
let saviourHighTotal = 0;
let saviourStreak = 0;
let saviourLongestStreak = 0;
let saviourGrid = [];
let saviourHighlightIndex = 12; // Center of 5x5 grid
let saviourActive = [];
const SAVIOUR_GRID_SIZE = 5;
const SAVIOUR_ACTIONS = [
  { name: 'Freeze Ray', icon: '❄️' },
  { name: 'Heat Ray', icon: '🔥' },
  { name: 'Tailor', icon: '✂️' },
  { name: 'Shrink Ray', icon: '🔬' },
  { name: 'Money Bags', icon: '💰' },
  { name: 'Penny Pincher', icon: '🪙' },
  { name: 'Tidal Force', icon: '🌊' },
  { name: 'Landlocked', icon: '🏜️' },
  { name: 'Baby Boomer', icon: '👶' },
  { name: 'Gamma Burst', icon: '☢️' }
];

// --- Saviour Mode Undo/Redo State ---
let saviourActionHistory = [];
let saviourActionPointer = -1;
let saviourUsedActions = [];
let saviourGameOver = false;

// --- Saviour Mode Undo/Redo Implementation ---
function saveSaviourActionState(actionName) {
  // If we are not at the end, slice off redo history
  if (saviourActionPointer < saviourActionHistory.length - 1) {
    saviourActionHistory = saviourActionHistory.slice(0, saviourActionPointer + 1);
  }
  saviourActionHistory.push({
    saviourActive: JSON.parse(JSON.stringify(saviourActive)),
    saviourUsedActions: JSON.parse(JSON.stringify(saviourUsedActions)),
    saviourScore,
    saviourDailyCurrentScore, // <-- Save daily score as well
    saviourGameOver,
    actionName,
    grid: JSON.parse(JSON.stringify(saviourGrid)),
    highlight: saviourHighlightIndex,
    streak: saviourStreak,
    total: saviourTotal,
    longestStreak: saviourLongestStreak
  });
  saviourActionPointer = saviourActionHistory.length - 1;
  renderSaviourUndoRedo();
}

function handleGameOverAction(actionName) {
  // saveSaviourActionState(actionName); // <-- REMOVE THIS LINE
  saviourGameOver = true;
}

function undoSaviourAction() {
  if (saviourActionPointer <= 0) return;
  saviourActionPointer--;
  restoreSaviourActionState(saviourActionHistory[saviourActionPointer]);
}

function redoSaviourAction() {
  if (saviourActionPointer >= saviourActionHistory.length - 1) return;
  saviourActionPointer++;
  restoreSaviourActionState(saviourActionHistory[saviourActionPointer]);
}

function restoreSaviourActionState(state) {
  saviourActive = JSON.parse(JSON.stringify(state.saviourActive));
  saviourUsedActions = JSON.parse(JSON.stringify(state.saviourUsedActions));
  saviourScore = state.saviourScore;
  saviourDailyCurrentScore = state.saviourDailyCurrentScore; // <-- Restore daily score as well
  saviourGameOver = state.saviourGameOver;
  saviourGrid = JSON.parse(JSON.stringify(state.grid));
  saviourHighlightIndex = state.highlight;
  saviourStreak = state.streak;
  saviourTotal = state.total;
  saviourLongestStreak = state.longestStreak;
  renderSaviourGrid(saviourGameOver);
  updateSaviourScoreDisplays();
  renderSaviourActions();
  renderSaviourUndoRedo();
  if (saviourGameOver) showSaviourGameOver();
  else document.getElementById('result-saviour').innerHTML = '';
}

function renderSaviourUndoRedo() {
  const undoRedoDiv = document.getElementById('saviour-undo-redo');
  if (!undoRedoDiv) return;
  undoRedoDiv.innerHTML = '';
  const undoBtn = document.createElement('button');
  undoBtn.className = 'back-to-menu-study';
  undoBtn.textContent = 'Undo';
  undoBtn.disabled = saviourActionPointer <= 0;
  undoBtn.onclick = undoSaviourAction;
  const redoBtn = document.createElement('button');
  redoBtn.className = 'back-to-menu-study';
  redoBtn.textContent = 'Redo';
  redoBtn.disabled = saviourActionPointer >= saviourActionHistory.length - 1;
  redoBtn.onclick = redoSaviourAction;
  // Place on same line
  undoRedoDiv.style.display = 'flex';
  undoRedoDiv.style.justifyContent = 'center';
  undoRedoDiv.style.gap = '0.7em';
  undoRedoDiv.appendChild(undoBtn);
  undoRedoDiv.appendChild(redoBtn);
}

function loadHighScores() {
  entryHighScore = parseFloat(localStorage.getItem('flagellum_entry_highscore')) || 0;
  entryHighTotal = parseInt(localStorage.getItem('flagellum_entry_hightotal')) || 0;
  entryLongestStreak = parseInt(localStorage.getItem('flagellum_entry_longeststreak')) || 0;
  mcHighScore = parseFloat(localStorage.getItem('flagellum_mc_highscore')) || 0;
  mcHighTotal = parseInt(localStorage.getItem('flagellum_mc_hightotal')) || 0;
  mcLongestStreak = parseInt(localStorage.getItem('flagellum_mc_longeststreak')) || 0;
  rcHighScore = parseFloat(localStorage.getItem('flagellum_rc_highscore')) || 0;
  rcHighTotal = parseInt(localStorage.getItem('flagellum_rc_hightotal')) || 0;
  rcLongestStreak = parseInt(localStorage.getItem('flagellum_rc_longeststreak')) || 0;
  saviourHighScore = parseInt(localStorage.getItem('flagellum_saviour_highscore')) || 0;
  saviourHighTotal = parseInt(localStorage.getItem('flagellum_saviour_hightotal')) || 0;
  saviourLongestStreak = parseInt(localStorage.getItem('flagellum_saviour_longeststreak')) || 0;
}

// Update: Saviour mode high score is lowest number of actions (minimum, not maximum)
function saveHighScores() {
  // Entry mode
  if (
    entryScore > entryHighScore ||
    (entryScore === entryHighScore && entryTotal < entryHighTotal)
  ) {
    // Only update if this is a better score (higher score, or same score but fewer total)
    localStorage.setItem('flagellum_entry_highscore', entryScore);
    localStorage.setItem('flagellum_entry_hightotal', entryTotal);
    entryHighScore = entryScore;
    entryHighTotal = entryTotal;
  }
  if (entryStreak > entryLongestStreak) {
    entryLongestStreak = entryStreak;
    localStorage.setItem('flagellum_entry_longeststreak', entryLongestStreak);
  }
  // MC mode
  if (
    mcScore > mcHighScore ||
    (mcScore === mcHighScore && mcTotal < mcHighTotal)
  ) {
    localStorage.setItem('flagellum_mc_highscore', mcScore);
    localStorage.setItem('flagellum_mc_hightotal', mcTotal);
    mcHighScore = mcScore;
    mcHighTotal = mcTotal;
  }
  if (mcStreak > mcLongestStreak) {
    mcLongestStreak = mcStreak;
    localStorage.setItem('flagellum_mc_longeststreak', mcLongestStreak);
  }
  // Reverse Choice mode
  if (
    rcScore > rcHighScore ||
    (rcScore === rcHighScore && rcTotal < rcHighTotal)
  ) {
    localStorage.setItem('flagellum_rc_highscore', rcScore);
    localStorage.setItem('flagellum_rc_hightotal', rcTotal);
    rcHighScore = rcScore;
    rcHighTotal = rcTotal;
  }
  if (rcStreak > rcLongestStreak) {
    rcLongestStreak = rcStreak;
    localStorage.setItem('flagellum_rc_longeststreak', rcLongestStreak);
  }
  // Saviour mode (lower is better, but must be >0)
  // --- Only update regular Saviour mode if NOT in daily mode ---
  if (
    !inSaviourDailyMode &&
    (
      (saviourScore > 0 && (saviourHighScore === 0 || saviourScore < saviourHighScore)) ||
      (saviourScore === saviourHighScore && saviourTotal < saviourHighTotal && saviourScore > 0)
    )
  ) {
    localStorage.setItem('flagellum_saviour_highscore', saviourScore);
    localStorage.setItem('flagellum_saviour_hightotal', saviourTotal);
    saviourHighScore = saviourScore;
    saviourHighTotal = saviourTotal;
  }
  if (!inSaviourDailyMode && saviourStreak > saviourLongestStreak) {
    saviourLongestStreak = saviourStreak;
    localStorage.setItem('flagellum_saviour_longeststreak', saviourLongestStreak);
  }
}

function updateScoreDisplays() {
  // Entry mode
  document.getElementById('score-entry').innerHTML = `Score: ${entryScore > 0 ? formatScore(entryScore) : '-'} of ${entryTotal > 0 ? entryTotal : '-'}`;
  document.getElementById('streak-entry').innerHTML = `Streak: ${entryStreak > 0 ? entryStreak : '-'} <span class="score-streak-green">(Longest: ${entryLongestStreak > 0 ? entryLongestStreak : '-'})</span>`;
  let entryHS = `High Score: ${entryHighScore > 0 ? formatScore(entryHighScore) : '-'} of ${entryHighTotal > 0 ? Math.floor(entryHighTotal) : '-'}`;
  let nhs = '';
  if (
    entryScore > entryHighScore ||
    (entryScore === entryHighScore && entryTotal < entryHighTotal && entryHighScore > 0)
  ) {
    nhs = '<div class="new-highscore">New High Score!</div>';
  }
  document.getElementById('highscore-entry').innerHTML = entryHS + nhs;


  // MC mode
  document.getElementById('score-mc').innerHTML = `Score: ${mcScore > 0 ? formatScore(mcScore) : '-'} of ${mcTotal > 0 ? mcTotal : '-'}`;
  document.getElementById('streak-mc').innerHTML = `Streak: ${mcStreak > 0 ? mcStreak : '-'} <span class="score-streak-green">(Longest: ${mcLongestStreak > 0 ? mcLongestStreak : '-'})</span>`;
  let mcHS = `High Score: ${mcHighScore > 0 ? formatScore(mcHighScore) : '-'} of ${mcHighTotal > 0 ? Math.floor(mcHighTotal) : '-'}`;
  let nhsMC = '';
  if (
    mcScore > mcHighScore ||
    (mcScore === mcHighScore && mcTotal < mcHighTotal && mcHighScore > 0)
  ) {
    nhsMC = '<div class="new-highscore">New High Score!</div>';
  }
  document.getElementById('highscore-mc').innerHTML = mcHS + nhsMC;

  // Reverse Choice mode
  document.getElementById('score-rc').innerHTML = `Score: ${rcScore > 0 ? formatScore(rcScore) : '-'} of ${rcTotal > 0 ? rcTotal : '-'}`;
  document.getElementById('streak-rc').innerHTML = `Streak: ${rcStreak > 0 ? rcStreak : '-'} <span class="score-streak-green">(Longest: ${rcLongestStreak > 0 ? rcLongestStreak : '-'})</span>`;
  let rcHS = `High Score: ${rcHighScore > 0 ? formatScore(rcHighScore) : '-'} of ${rcHighTotal > 0 ? Math.floor(rcHighTotal) : '-'}`;
  let nhsRC = '';
  if (
    rcScore > rcHighScore ||
    (rcScore === rcHighScore && rcTotal < rcHighTotal && rcHighScore > 0)
  ) {
    nhsRC = '<div class="new-highscore">New High Score!</div>';
  }
  document.getElementById('highscore-rc').innerHTML = rcHS + nhsRC;

  // Saviour mode
  document.getElementById('score-saviour').innerHTML = `Actions: ${saviourScore > 0 ? saviourScore : '-'} of ${saviourTotal > 0 ? saviourTotal : '-'}`;
  let savHS = `High Score: ${saviourHighScore > 0 ? Math.floor(saviourHighScore) : '-'} of ${saviourHighTotal > 0 ? Math.floor(saviourHighTotal) : '-'}`;
  let nhsSaviour = '';
  if (
    (saviourScore > 0 && (saviourHighScore === 0 || saviourScore < saviourHighScore)) ||
    (saviourScore === saviourHighScore && saviourTotal < saviourHighTotal && saviourHighScore > 0)
  ) {
    nhsSaviour = '<div class="new-highscore">New High Score!</div>';
  }
  document.getElementById('highscore-saviour').innerHTML = savHS + nhsSaviour;
}

function formatScore(score) {
  // Show as integer if whole, else as fraction (e.g. 1 2/3)
  // Always show as integer if whole, else as mixed fraction or decimal
  if (Number.isInteger(score) || Math.abs(score - Math.round(score)) < 0.01) {
    return score === 0 ? '0' : Math.round(score).toString();
  }
  let intPart = Math.floor(score);
  let frac = score - intPart;
  let fracStr = '';
  if (Math.abs(frac - 2/3) < 0.01) fracStr = '2/3';
  else if (Math.abs(frac - 1/3) < 0.01) fracStr = '1/3';
  else if (Math.abs(frac - 0.5) < 0.01) fracStr = '1/2';
  else fracStr = (Math.round(frac * 100) / 100).toFixed(2);
  if (intPart === 0 && fracStr) return fracStr;
  if (fracStr && intPart > 0) return `${intPart} ${fracStr}`;
  return score.toFixed(2);
}

function updateMainMenuHighscores() {
  const mainHigh = document.getElementById('main-highscores');
  mainHigh.innerHTML =
    `<h2>Personal High Scores</h2>` +
    `<div class="main-highscore-row">Entry Mode: <b>${entryHighScore > 0 ? formatScore(entryHighScore) : '-'} of ${entryHighTotal > 0 ? Math.floor(entryHighTotal) : '-'}</b> <span class="score-streak">Longest Streak: ${entryLongestStreak > 0 ? entryLongestStreak : '-'}</span></div>` +
    `<div class="main-highscore-row">Multiple Choice: <b>${mcHighScore > 0 ? formatScore(mcHighScore) : '-'} of ${mcHighTotal > 0 ? Math.floor(mcHighTotal) : '-'}</b> <span class="score-streak">Longest Streak: ${mcLongestStreak > 0 ? mcLongestStreak : '-'}</span></div>` +
    `<div class="main-highscore-row">Reverse Choice: <b>${rcHighScore > 0 ? formatScore(rcHighScore) : '-'} of ${rcHighTotal > 0 ? Math.floor(rcHighTotal) : '-'}</b> <span class="score-streak">Longest Streak: ${rcLongestStreak > 0 ? rcLongestStreak : '-'}</span></div>` +
    `<div class="main-highscore-row">Saviour Mode: <b>${saviourHighScore > 0 ? Math.floor(saviourHighScore) : '-'} of ${saviourHighTotal > 0 ? Math.floor(saviourHighTotal) : '-'}</b> <span class="score-streak">Longest Streak: ${saviourLongestStreak > 0 ? saviourLongestStreak : '-'}</span></div>`;
}

function showMainMenu() {
  updateMainMenuHighscores();
  document.getElementById('main-menu').style.display = 'flex';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'none';
  document.getElementById('study-page').style.display = 'none';
  document.getElementById('congrats').style.display = 'none';
  document.getElementById('game-saviour').style.display = 'none'; // Hide Saviour mode when returning to menu
  // --- Clear Saviour result message when returning to menu ---
  const resultDiv = document.getElementById('result-saviour');
  if (resultDiv) resultDiv.innerHTML = '';
}

function showEntryMode() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'block';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'none';
  // Add game mode title
  setGameModeTitle('game-entry', 'Entry Mode');
  usedHint = false;
  entryStreak = 0;
  updateScoreDisplays();
  pickRandomFlag();
  document.getElementById('guess').focus();
  setupAutocomplete();
  addFlagClickHandlers();
}

function showMCMode() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'block';
  document.getElementById('game-rc').style.display = 'none';
  // Add game mode title
  setGameModeTitle('game-mc', 'Multiple Choice Mode');
  mcAttempts = 0;
  mcTried = [];
  mcStreak = 0;
  updateScoreDisplays();
  pickRandomFlagMC();
  addFlagClickHandlers();
}

function showRCMode() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'block';
  // Add game mode title
  setGameModeTitle('game-rc', 'Reverse Choice Mode');
  rcAttempts = 0;
  rcTried = [];
  rcStreak = 0;
  updateScoreDisplays();
  pickRandomFlagRC();
  addFlagClickHandlers();
}

function showStudyPage() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('study-page').style.display = 'block';
  renderStudyTable('country');
  addFlagClickHandlers();
}

function renderStudyTable(sortKey, sortDir = 'asc') {
  let sorted = [...flags];
  // Determine if the column is numeric
  const numericCols = ['gdp', 'area', 'coastline_km', 'min_lat', 'max_lat', 'min_lng', 'max_lng'];
  sorted.sort((a, b) => {
    let vA = a[sortKey];
    let vB = b[sortKey];
    if (numericCols.includes(sortKey)) {
      vA = vA !== undefined && vA !== null ? Number(vA) : -Infinity;
      vB = vB !== undefined && vB !== null ? Number(vB) : -Infinity;
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    } else if (sortKey === 'nuclear_arms') {
      // Sort 'Yes' before 'No' in ascending
      vA = a.nuclear_arms ? 1 : 0;
      vB = b.nuclear_arms ? 1 : 0;
      if (vA < vB) return sortDir === 'asc' ? 1 : -1;
      if (vA > vB) return sortDir === 'asc' ? -1 : 1;
      return 0;
    } else {
      vA = vA ? vA.toString().toLowerCase() : '';
      vB = vB ? vB.toString().toLowerCase() : '';
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }
  });
  const tbody = document.getElementById('study-tbody');
  tbody.innerHTML = '';
  for (const flag of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${flag.country}</td>
      <td>${flag.code}</td>
      <td style="font-size:1.5em;">${flag.emoji}</td>
      <td><a href="https://en.wikipedia.org/wiki/${flag.wiki}" target="_blank">Wiki</a></td>
      <td><img src="${flag.img}" alt="Flag of ${flag.country}" /></td>
      <td>${flag.gdp ? (flag.gdp/1e6).toLocaleString(undefined, {maximumFractionDigits:0}) : ''}</td>
      <td>${flag.area ? flag.area.toLocaleString() : ''}</td>
      <td>${flag.coastline_km !== undefined ? flag.coastline_km.toLocaleString() : ''}</td>
      <td>${flag.nuclear_arms ? 'Yes' : 'No'}</td>
      <td>${flag.min_lat !== undefined ? flag.min_lat : ''}</td>
      <td>${flag.max_lat !== undefined ? flag.max_lat : ''}</td>
      <td>${flag.min_lng !== undefined ? flag.min_lng : ''}</td>
      <td>${flag.max_lng !== undefined ? flag.max_lng : ''}</td>
    `;
    tbody.appendChild(tr);
  }
  // Set up sorting buttons
  const ths = document.querySelectorAll('.sort-btn');
  ths.forEach(btn => {
    btn.onclick = () => {
      let newDir = sortKey === btn.dataset.sort && sortDir === 'asc' ? 'desc' : 'asc';
      renderStudyTable(btn.dataset.sort, newDir);
    };
  });
  addFlagClickHandlers(); // Ensure click handler is always set after DOM update
}

// Prevent immediate repeats in Entry mode
let lastEntryFlag = null;
function pickRandomFlag() {
  if (!flags.length) return;
  let possibleFlags = flags;
  if (lastEntryFlag && flags.length > 1) {
    possibleFlags = flags.filter(f => f !== lastEntryFlag);
  }
  currentFlag = possibleFlags[Math.floor(Math.random() * possibleFlags.length)];
  lastEntryFlag = currentFlag;
  document.getElementById('flag-image-entry').innerHTML = `
    <div style="background:#fff;padding:1.5em 1.2em 1.2em 1.2em;border-radius:1.1em;max-width:95vw;box-shadow:0 2px 16px #0003;min-width:270px;position:relative;display:flex;flex-direction:column;align-items:center;margin:auto;">
      <img src="${currentFlag.img}" alt="Flag of ${currentFlag.country}" style="max-width:220px;max-height:120px;object-fit:contain;background:#fff;border-radius:0.5em;border:1px solid #ccc;box-shadow:0 2px 8px #0002;margin-bottom:0.5em;" />
    </div>
  `;
  document.getElementById('guess').value = '';
  document.getElementById('result').textContent = '';
  document.getElementById('wiki-link').innerHTML = '';
  document.getElementById('submit').textContent = 'Guess';
  document.getElementById('submit').disabled = false;
  document.getElementById('guess').disabled = false;
  document.getElementById('hint').style.display = 'block';
  document.getElementById('hint').textContent = 'Hint';
  document.getElementById('hint').disabled = false;
  document.getElementById('skip').style.display = 'inline-block';
  document.getElementById('hint-text').textContent = '';
  document.getElementById('submit').onclick = checkGuess;
  addFlagClickHandlers(); // Ensure click handler is always set after DOM update
}

function showHint() {
  usedHint = true;
  document.getElementById('hint').textContent = `Country code: ${currentFlag.code}`;
  document.getElementById('hint').disabled = true;
  document.getElementById('hint').style.display = 'block';
  document.getElementById('hint-text').textContent = '';
}

function checkGuess() {
  const guess = document.getElementById('guess').value.trim().toLowerCase();
  const answer = currentFlag.country.toLowerCase();
  const code = currentFlag.code.toLowerCase();
  if (guess === answer || guess === code) {
    let addScore = usedHint ? 0.5 : 1;
    entryScore += addScore;
    entryTotal++;
    // Streak logic
    if (!usedHint && addScore === 1) {
      entryStreak++;
      if (entryStreak > entryLongestStreak) entryLongestStreak = entryStreak;
    } else {
      entryStreak = 0;
    }
    updateScoreDisplays();
    saveHighScores();
    const pointStr = addScore === 1 ? '1 Point!' : (addScore === 0.5 ? '1/2 Point!' : `${addScore} Point!`);
    document.getElementById('result').innerHTML = `✅ Correct! <span class='fraction'>${pointStr}</span> ${currentFlag.country} (${currentFlag.code})`;
    document.getElementById('result').style.color = '#2e7d32';
    document.getElementById('wiki-link').innerHTML = `<a href="https://en.wikipedia.org/wiki/${currentFlag.wiki}" target="_blank">Learn more on Wikipedia</a>`;
    document.getElementById('submit').textContent = 'Next Flag';
    document.getElementById('guess').disabled = true;
    document.getElementById('submit').onclick = function() {
      usedHint = false;
      pickRandomFlag();
      document.getElementById('guess').focus();
    };
    document.getElementById('hint').style.display = 'none';
    document.getElementById('skip').style.display = 'none';
    document.getElementById('hint-text').textContent = '';
  } else {
    entryStreak = 0;
    document.getElementById('result').textContent = '❌ Try again!';
    document.getElementById('result').style.color = '#c62828';
    document.getElementById('hint').style.display = 'block';
    document.getElementById('hint').textContent = 'Hint';
    document.getElementById('hint').disabled = false;
    document.getElementById('skip').style.display = 'inline-block';
    document.getElementById('hint-text').textContent = '';
    document.getElementById('submit').onclick = checkGuess;
  }
}

function skipEntryFlag() {
  entryTotal++;
  entryStreak = 0;
  updateScoreDisplays();
  saveHighScores();
  pickRandomFlag();
  document.getElementById('guess').focus();
}

// Prevent immediate repeats in Multiple Choice mode
let lastMCFlag = null;
function pickRandomFlagMC() {
  if (!flags.length) return;
  let possibleFlags = flags;
  if (lastMCFlag && flags.length > 1) {
    possibleFlags = flags.filter(f => f !== lastMCFlag);
  }
  // Pick correct flag
  currentFlag = possibleFlags[Math.floor(Math.random() * possibleFlags.length)];
  lastMCFlag = currentFlag;
  // Pick 3 other random, unique countries
  let options = [currentFlag];
  let used = new Set([currentFlag.country]);
  while (options.length < 4) {
    let f = flags[Math.floor(Math.random() * flags.length)];
    if (!used.has(f.country)) {
      options.push(f);
      used.add(f.country);
    }
  }
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  mcCorrectIndex = options.findIndex(f => f.country === currentFlag.country);
  mcAttempts = 0;
  mcTried = [false, false, false, false];
  // Show flag and options
  document.getElementById('flag-image-mc').innerHTML = `
    <div style="background:#fff;padding:1.5em 1.2em 1.2em 1.2em;border-radius:1.1em;max-width:95vw;box-shadow:0 2px 16px #0003;min-width:270px;position:relative;display:flex;flex-direction:column;align-items:center;margin:auto;">
      <img src="${currentFlag.img}" alt="Flag of ${currentFlag.country}" style="max-width:220px;max-height:120px;object-fit:contain;background:#fff;border-radius:0.5em;border:1px solid #ccc;box-shadow:0 2px 8px #0002;margin-bottom:0.5em;" />
    </div>
  `;
  const mcOptionsDiv = document.getElementById('mc-options');
  mcOptionsDiv.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'mc-option-btn';
    btn.textContent = `${opt.country} (${opt.code})`;
    btn.disabled = false;
    btn.onclick = () => checkMCAnswer(idx, options, btns);
    mcOptionsDiv.appendChild(btn);
  });
  // Store buttons for disabling
  let btns = Array.from(mcOptionsDiv.children);
  btns.forEach((btn, idx) => {
    btn.onclick = () => checkMCAnswer(idx, options, btns);
  });
  document.getElementById('result-mc').textContent = '';
  document.getElementById('wiki-link-mc').innerHTML = '';
  document.getElementById('hint-text-mc').textContent = '';
  document.getElementById('next-mc').style.display = 'none';
  addFlagClickHandlers(); // Ensure click handler is always set after DOM update
}

function checkMCAnswer(idx, options, btns) {
  if (mcTried[idx]) return;
  mcTried[idx] = true;
  btns[idx].disabled = true;
  mcAttempts++;
  let addScore = 0;
  if (idx === mcCorrectIndex) {
    if (mcAttempts === 1) addScore = 1;
    else if (mcAttempts === 2) addScore = 2/3;
    else if (mcAttempts === 3) addScore = 1/3;
    else addScore = 0;
    mcScore += addScore;
    mcTotal++;
    // Streak logic
    if (mcAttempts === 1 && addScore === 1) {
      mcStreak++;
      if (mcStreak > mcLongestStreak) mcLongestStreak = mcStreak;
    } else {
      mcStreak = 0;
    }
    updateScoreDisplays();
    saveHighScores();
    let pointStr = addScore === 1 ? '1 Point!' : (addScore === 2/3 ? '2/3 Point!' : (addScore === 1/3 ? '1/3 Point!' : '0 Point!'));
    document.getElementById('result-mc').innerHTML = `✅ Correct! <span class='fraction'>${pointStr}</span> ${currentFlag.country} (${currentFlag.code})`;
    document.getElementById('result-mc').style.color = '#2e7d32';
    document.getElementById('wiki-link-mc').innerHTML = `<a href="https://en.wikipedia.org/wiki/${currentFlag.wiki}" target="_blank">Learn more on Wikipedia</a>`;
    btns.forEach(b => b.disabled = true);
    document.getElementById('next-mc').style.display = 'block';
  } else {
    mcStreak = 0;
    // If this was the last possible attempt, finish the round
    if (mcAttempts >= 4 || mcTried.filter(Boolean).length === 4) {
      mcScore += 0;
      mcTotal++;
      updateScoreDisplays();
      saveHighScores();
      document.getElementById('result-mc').textContent = `❌ Out of tries! Correct: ${currentFlag.country} (${currentFlag.code})`;
      document.getElementById('result-mc').style.color = '#c62828';
      document.getElementById('wiki-link-mc').innerHTML = `<a href="https://en.wikipedia.org/wiki/${currentFlag.wiki}" target="_blank">Learn more on Wikipedia</a>`;
      btns.forEach(b => b.disabled = true);
      document.getElementById('next-mc').style.display = 'block';
    }
  }
}

// Prevent immediate repeats in Reverse Choice mode
let lastRCFlag = null;
function pickRandomFlagRC() {
  if (!flags.length) return;
  let possibleFlags = flags;
  if (lastRCFlag && flags.length > 1) {
    possibleFlags = flags.filter(f => f !== lastRCFlag);
  }
  rcCurrentFlag = possibleFlags[Math.floor(Math.random() * possibleFlags.length)];
  lastRCFlag = rcCurrentFlag;
  // Pick 3 other random, unique countries
  rcOptions = [rcCurrentFlag];
  let used = new Set([rcCurrentFlag.country]);
  while (rcOptions.length < 4) {
    let f = flags[Math.floor(Math.random() * flags.length)];
    if (!used.has(f.country)) {
      rcOptions.push(f);
      used.add(f.country);
    }
  }
  // Shuffle options
  for (let i = rcOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rcOptions[i], rcOptions[j]] = [rcOptions[j], rcOptions[i]];
  }
  rcCorrectIndex = rcOptions.findIndex(f => f.country === rcCurrentFlag.country);
  rcAttempts = 0;
  rcTried = [false, false, false, false];
  // Show country and code
  document.getElementById('rc-country').innerHTML = `${rcCurrentFlag.country} <span style="color:#888;">(${rcCurrentFlag.code})</span>`;
  // Show flag image options in a 2x2 grid with zoom button
  const rcOptionsDiv = document.getElementById('rc-options');
  rcOptionsDiv.innerHTML = '';
  rcOptions.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'rc-option-btn';
    btn.disabled = false;
    btn.tabIndex = 0;
    btn.innerHTML = `
      <img src="${opt.img}" alt="Flag of ${opt.country}" style="width:90px;height:60px;object-fit:contain;background:#fff;vertical-align:middle;border-radius:0.3em;border:1px solid #ccc;box-shadow:0 2px 8px #0001;margin-bottom:0.5em;" />
      <span class="rc-zoom-btn" title="Enlarge flag" tabindex="-1">+</span>
    `;
    btn.onclick = (e) => {
      // Only trigger answer if not clicking zoom
      if (e.target.classList.contains('rc-zoom-btn')) return;
      checkRCAnswer(idx, rcOptions, btns);
    };
    // Zoom button event
    btn.querySelector('.rc-zoom-btn').onclick = (e) => {
      e.stopPropagation();
      showFlagModal(opt.img, `Flag of ${opt.country}`);
    };
    rcOptionsDiv.appendChild(btn);
  });
  // Store buttons for disabling
  let btns = Array.from(rcOptionsDiv.children);
  document.getElementById('result-rc').textContent = '';
  document.getElementById('wiki-link-rc').innerHTML = '';
  document.getElementById('next-rc').style.display = 'none';
  addFlagClickHandlers();
}

function checkRCAnswer(idx, options, btns) {
  if (rcTried[idx]) return;
  rcTried[idx] = true;
  btns[idx].disabled = true;
  rcAttempts++;
  let addScore = 0;
  if (idx === rcCorrectIndex) {
    if (rcAttempts === 1) addScore = 1;
    else if (rcAttempts === 2) addScore = 2/3;
    else if (rcAttempts === 3) addScore = 1/3;
    else addScore = 0;
    rcScore += addScore;
    rcTotal++;
    // Streak logic
    if (rcAttempts === 1 && addScore === 1) {
      rcStreak++;
      if (rcStreak > rcLongestStreak) rcLongestStreak = rcStreak;
    } else {
      rcStreak = 0;
    }
    updateScoreDisplays();
    saveHighScores();
    let pointStr = addScore === 1 ? '1 Point!' : (addScore === 2/3 ? '2/3 Point!' : (addScore === 1/3 ? '1/3 Point!' : '0 Point!'));
    document.getElementById('result-rc').innerHTML = `✅ Correct! <span class='fraction'>${pointStr}</span> ${rcCurrentFlag.country} (${rcCurrentFlag.code})`;
    document.getElementById('result-rc').style.color = '#2e7d32';
    document.getElementById('wiki-link-rc').innerHTML = `<a href="https://en.wikipedia.org/wiki/${rcCurrentFlag.wiki}" target="_blank">Learn more on Wikipedia</a>`;
    btns.forEach(b => b.disabled = true);
    document.getElementById('next-rc').style.display = 'block';
  } else {
    rcStreak = 0;
    // If this was the last possible attempt, finish the round
    if (rcAttempts >= 4 || rcTried.filter(Boolean).length === 4) {
      rcScore += 0;
      rcTotal++;
      updateScoreDisplays();
      saveHighScores();
      document.getElementById('result-rc').textContent = `❌ Out of tries! Correct: ${rcCurrentFlag.country} (${rcCurrentFlag.code})`;
      document.getElementById('result-rc').style.color = '#c62828';
      document.getElementById('wiki-link-rc').innerHTML = `<a href="https://en.wikipedia.org/wiki/${rcCurrentFlag.wiki}" target="_blank">Learn more on Wikipedia</a>`;
      btns.forEach(b => b.disabled = true);
      document.getElementById('next-rc').style.display = 'block';
    }
  }
}

// --- Saviour Mode ---
function showSaviourMode() {
  inSaviourDailyMode = false;
  saviourDailyDate = null;
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'none';
  document.getElementById('study-page').style.display = 'none';
  document.getElementById('game-saviour').style.display = 'flex';
  // Add game mode title
  setGameModeTitle('game-saviour', 'Saviour Mode');
  saviourStreak = 0;
  updateSaviourScoreDisplays();
  // --- NEW: Clear result message on new game ---
  const resultDiv = document.getElementById('result-saviour');
  if (resultDiv) resultDiv.innerHTML = '';
  setupSaviourGrid();
  setupSaviourActions();
}

function updateSaviourScoreDisplays() {
  document.getElementById('score-saviour').innerHTML = `<span style="color:#0078d7;font-weight:500;">Actions Used:</span> ${saviourScore}`;
  document.getElementById('streak-saviour').innerHTML = `<span style="color:#0078d7;font-weight:500;">Streak:</span> ${saviourStreak} <span class="score-streak">(Longest: ${saviourLongestStreak})</span>`;
  let savHS = `<span style="color:#0078d7;font-weight:500;">High Score:</span> ${saviourHighScore > 0 ? saviourHighScore : '-'}`;
  let nhs = '';
  if (
    (saviourScore > 0 && (saviourHighScore === 0 || saviourScore < saviourHighScore)) ||
    (saviourScore === saviourHighScore && saviourTotal < saviourHighTotal && saviourHighScore > 0)
  ) {
    nhs = '<div class="new-highscore">New High Score!</div>';
  }
  document.getElementById('highscore-saviour').innerHTML = savHS + nhs;
}

// --- Deterministic Seeded Shuffle for Saviour Daily ---
function seededRandom(seed) {
  // Mulberry32 PRNG
  let t = seed;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

function stringToSeed(str) {
  // Simple hash from string to int
  let hash = 0, i, chr;
  if (str.length === 0) return 0;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit int
  }
  return hash;
}

function seededShuffle(array, seedStr) {
  let arr = array.slice();
  let rand = seededRandom(stringToSeed(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setupSaviourGrid() {
  if (flags.length < 25) return;
  let shuffled;
  if (inSaviourDailyMode && saviourDailyDate) {
    // Deterministic shuffle for daily mode
    shuffled = seededShuffle(flags, saviourDailyDate);
  } else {
    shuffled = [...flags].sort(() => Math.random() - 0.5);
  }
  saviourGrid = shuffled.slice(0, 25);
  saviourActive = Array(25).fill(true);
  saviourUsedActions = Array(SAVIOUR_ACTIONS.length).fill(false);
  // Only reset saviourScore if NOT in daily mode
  if (inSaviourDailyMode) {
    // Do not reset saviourDailyCurrentScore here!
  } else {
    saviourScore = 0;
  }
  saviourGameOver = false;
  saviourActionHistory = [];
  saviourActionPointer = -1;
  saveSaviourActionState('Start');
  renderSaviourGrid();
}

function renderSaviourGrid(gameOver = false) {
  const gridDiv = document.getElementById('saviour-grid');
  gridDiv.innerHTML = '';
  let activeCount = 0;
  let lastActiveIdx = -1;
  for (let i = 0; i < saviourGrid.length; i++) {
    if (saviourActive[i]) {
      activeCount++;
      lastActiveIdx = i;
    }
  }
  // Win detection: only the highlighted flag remains
  if (activeCount === 1 && lastActiveIdx === saviourHighlightIndex && !gameOver) {
    saviourGameOver = true;
    if (inSaviourDailyMode) {
      // Only update high score if this is a win and it's better (lower) than previous
      if (
        (saviourDailyCurrentScore > 0 && (saviourDailyHighScore === 0 || saviourDailyCurrentScore < saviourDailyHighScore))
      ) {
        saviourDailyHighScore = saviourDailyCurrentScore;
        saviourDailyHighTotal = saviourGrid.length;
        saveSaviourDailyScores(saviourDailyDate);
      }
      updateSaviourScoreDisplays();
      renderSaviourGrid(true);
      document.getElementById('result-saviour').innerHTML = `<span style=\"color:#2e7d32;font-weight:bold;\">🎉 Congratulations! You saved ${saviourGrid[saviourHighlightIndex].country} (${saviourGrid[saviourHighlightIndex].code}) and won Saviour Mode (Daily)!</span>`;
      updateMainMenuHighscores();
      return;
    } else {
      if (
        (saviourScore > 0 && (saviourHighScore === 0 || saviourScore < saviourHighScore)) ||
        (saviourScore === saviourHighScore && saviourGrid.length < saviourHighTotal && saviourHighScore > 0)
      ) {
        saviourHighScore = saviourScore;
        saviourHighTotal = saviourGrid.length;
        localStorage.setItem('flagellum_saviour_highscore', saviourHighScore);
        localStorage.setItem('flagellum_saviour_hightotal', saviourHighTotal);
      }
      updateSaviourScoreDisplays();
      renderSaviourGrid(true);
      document.getElementById('result-saviour').innerHTML = `<span style=\"color:#2e7d32;font-weight:bold;\">🎉 Congratulations! You saved ${saviourGrid[saviourHighlightIndex].country} (${saviourGrid[saviourHighlightIndex].code}) and won Saviour Mode!</span>`;
      return;
    }
  }
  for (let i = 0; i < saviourGrid.length; i++) {
    const flag = saviourGrid[i];
    const btn = document.createElement('button');
    btn.className = 'saviour-flag-btn' + (i === saviourHighlightIndex ? ' saviour-highlight' : '');
    btn.disabled = !saviourActive[i] || gameOver;
    if (!saviourActive[i]) {
      btn.style.filter = 'grayscale(1)';
      btn.style.opacity = '0.5';
    }
    if (gameOver) {
      btn.style.background = '#ffdddd';
      btn.style.borderColor = '#c62828';
    }
    // Remove title attribute to prevent hover country name
    btn.innerHTML = `<img src="${flag.img}" alt="Flag" style="width:64px;height:44px;object-fit:contain;background:#fff;border-radius:0.5em;border:1px solid #ccc;box-shadow:0 2px 8px #0002;" />`;
    // Add click handler for popout entry
    if (saviourActive[i] && !gameOver) {
      btn.onclick = function() {
        showSaviourFlagEntryModal(i);
      };
    }
    gridDiv.appendChild(btn);
  }
}

function showSaviourFlagEntryModal(idx) {
  if (saviourGameOver) return; // Prevent opening modal after game over
  // Remove existing modal if present
  let existing = document.getElementById('saviour-flag-entry-modal');
  if (existing) existing.remove();
  const flag = saviourGrid[idx];
  // Modal container
  const modal = document.createElement('div');
  modal.id = 'saviour-flag-entry-modal';
  modal.style.position = 'fixed';
  modal.style.zIndex = '2000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.55)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  // Modal content
  modal.innerHTML = `
    <div style="background:#fff;padding:1.5em 1.2em 1.2em 1.2em;border-radius:1.1em;max-width:95vw;box-shadow:0 2px 16px #0003;min-width:270px;position:relative;display:flex;flex-direction:column;align-items:center;">
      <button id="saviour-flag-entry-close" style="position:absolute;top:0.5em;right:0.7em;font-size:1.5em;background:none;border:none;cursor:pointer;">&times;</button>
      <img src="${flag.img}" alt="Flag of ${flag.country}" style="max-width:220px;max-height:120px;object-fit:contain;background:#fff;border-radius:0.5em;border:1px solid #ccc;box-shadow:0 2px 8px #0002;margin-bottom:1em;" />
      <div style="width:100%;max-width:320px;">
        <input type="text" id="saviour-flag-entry-input" placeholder="Enter country or code..." autocomplete="off" style="width:100%;padding:0.7rem;font-size:1.1rem;border:1px solid #ddd;border-radius:0.5rem;margin-bottom:0.5rem;box-sizing:border-box;" />
        <div id="saviour-flag-entry-autocomplete" class="autocomplete-list" style="display:none;"></div>
        <button id="saviour-flag-entry-submit" style="width:100%;padding:0.7rem;font-size:1.1rem;border:none;border-radius:0.5rem;background:#0078d7;color:#fff;margin-bottom:0.5rem;cursor:pointer;">Submit</button>
        <button id="saviour-hint-btn" style="width:100%;padding:0.7rem;font-size:1.1rem;border:none;border-radius:0.5rem;background:#0078d7;color:#fff;margin-bottom:0.5rem;cursor:pointer;">Hint</button>
        <div id="saviour-flag-entry-result" style="min-height:1.5em;text-align:center;margin-bottom:0.5rem;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // Close logic
  document.getElementById('saviour-flag-entry-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  // Autocomplete logic (reuse Entry Mode)
  setupSaviourFlagEntryAutocomplete(idx);
  // Submit logic
  document.getElementById('saviour-flag-entry-submit').onclick = function() {
    handleSaviourFlagEntrySubmit(idx);
  };
  document.getElementById('saviour-flag-entry-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      handleSaviourFlagEntrySubmit(idx);
    }
  });
  // Hint button logic
  document.getElementById('saviour-hint-btn').onclick = function() {
    const resultDiv = document.getElementById('saviour-flag-entry-result');
    resultDiv.textContent = `Hint: Country code is '${flag.code}'.`;
    resultDiv.style.color = '#0078d7';
  };
  setTimeout(() => document.getElementById('saviour-flag-entry-input').focus(), 100);
}

function setupSaviourFlagEntryAutocomplete(idx) {
  const input = document.getElementById('saviour-flag-entry-input');
  const listDiv = document.getElementById('saviour-flag-entry-autocomplete');
  let currentFocus = -1;
  let lastFiltered = [];
  function closeList() {
    listDiv.style.display = 'none';
    listDiv.innerHTML = '';
    currentFocus = -1;
  }
  function filterFlags(val) {
    if (!val) return [];
    const lowerVal = val.toLowerCase();
    // First: exact code matches, then code contains, then country contains
    let codeExact = flags.filter(f => f.code.toLowerCase() === lowerVal);
    let codeContains = flags.filter(f => f.code.toLowerCase().includes(lowerVal) && f.code.toLowerCase() !== lowerVal);
    let countryContains = flags.filter(f =>
      f.country.toLowerCase().includes(lowerVal) &&
      !codeExact.includes(f) &&
      !codeContains.includes(f)
    );
    let combined = [...codeExact, ...codeContains, ...countryContains].slice(0, 15);
    return combined;
  }
  function renderList(filtered) {
    lastFiltered = filtered;
    if (!filtered.length) {
      closeList();
      return;
    }
    listDiv.innerHTML = '';
    filtered.forEach((flag, idx2) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `${flag.country} <span style='color:#888;'>(${flag.code})</span>`;
      item.onclick = function() {
        input.value = `${flag.country}`;
        closeList();
        input.focus();
      };
      listDiv.appendChild(item);
    });
    listDiv.style.display = 'block';
  }
  input.addEventListener('input', function() {
    const val = this.value;
    const filtered = filterFlags(val);
    renderList(filtered);
  });
  input.addEventListener('focus', function() {
    const val = this.value;
    const filtered = filterFlags(val);
    renderList(filtered);
  });
  input.addEventListener('keydown', function(e) {
    const items = listDiv.querySelectorAll('.autocomplete-item');
    if (!items.length || listDiv.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      setActive(items, currentFocus);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      setActive(items, currentFocus);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (currentFocus > -1) {
        items[currentFocus].click();
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      closeList();
    }
  });
  function setActive(items, idx) {
    items.forEach(i => i.classList.remove('active'));
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('active');
      items[idx].scrollIntoView({block:'nearest'});
    }
  }
  document.addEventListener('click', function(e) {
    if (e.target !== input && e.target.parentNode !== listDiv) {
      closeList();
    }
  });
}

function handleSaviourFlagEntrySubmit(idx) {
  if (saviourGameOver) return;
  const input = document.getElementById('saviour-flag-entry-input');
  const resultDiv = document.getElementById('saviour-flag-entry-result');
  const guess = input.value.trim().toLowerCase();
  const flag = saviourGrid[idx];
  // Patch: Hint button always clears error and shows hint
  const hintBtn = document.getElementById('saviour-hint-btn');
  if (hintBtn) {
    hintBtn.onclick = function() {
      resultDiv.textContent = `Hint: Country code is '${flag.code}'.`;
      resultDiv.style.color = '#0078d7';
    };
  }
  if (!guess) {
    resultDiv.textContent = 'Please enter a country or code.';
    resultDiv.style.color = '#c62828';
    return;
  }
  if (guess === flag.country.toLowerCase() || guess === flag.code.toLowerCase()) {
    // --- Move increment BEFORE saving state ---
    if (inSaviourDailyMode) {
      saviourDailyCurrentScore++;
    } else {
      saviourScore++;
    }
    saveSaviourActionState('Click and Entry');
    saviourActive[idx] = false;
    if (idx === saviourHighlightIndex) {
      saviourGameOver = true;
      resultDiv.innerHTML = `<span style='color:#c62828;font-weight:bold;'>❌ You eliminated the saviour flag (${flag.country})!</span>`;
      const mainResultDiv = document.getElementById('result-saviour');
      if (mainResultDiv) mainResultDiv.innerHTML = `<span style=\"color:#c62828;font-weight:bold;\">❌ Game Over! The saviour flag (${flag.country}) was eliminated.</span>`;
      setTimeout(() => {
        let modal = document.getElementById('saviour-flag-entry-modal');
        if (modal) modal.remove();
        showSaviourGameOver();
      }, 700);
      return;
    }
    resultDiv.innerHTML = `<span style='color:#2e7d32;font-weight:bold;'>✅ Eliminated ${flag.country} (${flag.code})</span>`;
    setTimeout(() => {
      let modal = document.getElementById('saviour-flag-entry-modal');
      if (modal) modal.remove();
      renderSaviourGrid();
      updateSaviourScoreDisplays();
      renderSaviourActions();
    }, 700);
  } else {
    resultDiv.textContent = '❌ Incorrect. Try again!';
    resultDiv.style.color = '#c62828';
  }
}

// Saviour action descriptions for info popout
const SAVIOUR_ACTION_DESCRIPTIONS = [
  { name: 'Freeze Ray', icon: '❄️', desc: 'Eliminate all countries with territory in the polar circles.' },
  { name: 'Heat Ray', icon: '🔥', desc: 'Eliminate all countries with territory in the tropics.' },
  { name: 'Tailor', icon: '✂️', desc: 'Eliminate all countries with area at or over 83,879 km².' },
  { name: 'Shrink Ray', icon: '🔬', desc: 'Eliminate all countries with area under 83,879 km².' },
  { name: 'Money Bags', icon: '💰', desc: 'Eliminate all countries with GDP of 25,000,000,000 or over.' },
  { name: 'Penny Pincher', icon: '🪙', desc: 'Eliminate all countries with GDP under 25,000,000,000.' },
  { name: 'Tidal Force', icon: '🌊' , desc: 'Eliminate all countries with a coastline.' },
  { name: 'Landlocked', icon: '🏜️', desc: 'Eliminate all countries with no coastline.' },
  { name: 'Baby Boomer', icon: '👶', desc: 'Special action (not yet implemented).' },
  { name: 'Gamma Burst', icon: '☢️', desc: 'Eliminate all countries with nuclear arms.' },
  { name: 'Click and Entry', icon: '🖱️', desc: 'Click a flag to zoom and enter its country or code. If correct, that flag is eliminated as an action.' }
];

function renderSaviourActions() {
  const actionsDiv = document.getElementById('saviour-actions');
  actionsDiv.innerHTML = '';
  // Render as two columns, five rows
  for (let row = 0; row < 5; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.gap = '0.5em';
    rowDiv.style.marginBottom = '0.5em';
    for (let col = 0; col < 2; col++) {
      const idx = row * 2 + col;
      if (idx >= SAVIOUR_ACTIONS.length) continue;
      const action = SAVIOUR_ACTIONS[idx];
      const btn = document.createElement('button');
      btn.className = 'saviour-action-btn';
      btn.innerHTML = `${action.icon} <span style="font-size:0.95em;">${action.name}</span>`;
      // Only disable if already used or game over
      btn.disabled = !!saviourUsedActions[idx] || saviourGameOver;
      // Action handlers
      let handler = null;
      switch (action.name) {
        case 'Gamma Burst': handler = () => gammaBurstAction(idx); break;
        case 'Freeze Ray': handler = () => freezeRayAction(idx); break;
        case 'Heat Ray': handler = () => heatRayAction(idx); break;
        case 'Tidal Force': handler = () => tidalForceAction(idx); break;
        case 'Landlocked': handler = () => landlockedAction(idx); break;
        case 'Tailor': handler = () => tailorAction(idx); break;
        case 'Penny Pincher': handler = () => pennyPincherAction(idx); break;
        case 'Money Bags': handler = () => moneyBagsAction(idx); break;
        case 'Shrink Ray': handler = () => shrinkRayAction(idx); break;
        case 'Baby Boomer': handler = () => babyBoomerAction ? babyBoomerAction(idx) : () => {}; break;
        default: handler = () => {};
      }
      btn.onclick = handler;
      rowDiv.appendChild(btn);
    }
    actionsDiv.appendChild(rowDiv);
  }
}

function processSaviourAction(idx, actionName, eliminationCondition) {
  if (saviourUsedActions[idx] || saviourGameOver) return;
  let eliminatedSaviour = false;
  for (let i = 0; i < saviourGrid.length; i++) {
    if (saviourActive[i] && eliminationCondition(saviourGrid[i])) {
      saviourActive[i] = false;
      if (i === saviourHighlightIndex) eliminatedSaviour = true;
    }
  }
  saviourUsedActions[idx] = true;
  if (inSaviourDailyMode) {
    saviourDailyCurrentScore++;
  } else {
    saviourScore++;
  }
  saveSaviourActionState(actionName);
  renderSaviourGrid();
  updateSaviourScoreDisplays();
  renderSaviourActions();
  if (inSaviourDailyMode) {
    updateMainMenuHighscores();
  }
  // --- Only now handle game over ---
  if (eliminatedSaviour) {
    saviourGameOver = true;
    const mainResultDiv = document.getElementById('result-saviour');
    if (mainResultDiv) {
      mainResultDiv.innerHTML = `<span style='color:#c62828;font-weight:bold;'>❌ Game Over! The saviour flag was eliminated.</span>`;
    }
    if (inSaviourDailyMode) {
      updateMainMenuHighscores();
    }
    showSaviourGameOver();
    return;
  }
}

function gammaBurstAction(idx) {
  processSaviourAction(idx, 'Gamma Burst', flag => flag.nuclear_arms);
}

function freezeRayAction(idx) {
  processSaviourAction(idx, 'Freeze Ray', flag => flag.max_lat > 66.5 || flag.min_lat < -66.5);
}

function heatRayAction(idx) {
  processSaviourAction(idx, 'Heat Ray', flag => flag.min_lat > 23.5 || flag.max_lat < -23.5);
}

function tidalForceAction(idx) {
  processSaviourAction(idx, 'Tidal Force', flag => flag.coastline_km > 0);
}

function landlockedAction(idx) {
  processSaviourAction(idx, 'Landlocked', flag => flag.coastline_km === 0);
}

function tailorAction(idx) {
  processSaviourAction(idx, 'Tailor', flag => flag.area >= 83879);
}

function shrinkRayAction(idx) {
  processSaviourAction(idx, 'Shrink Ray', flag => flag.area < 83879);
}

function pennyPincherAction(idx) {
  processSaviourAction(idx, 'Penny Pincher', flag => flag.gdp < 25000000000);
}

function moneyBagsAction(idx) {
  processSaviourAction(idx, 'Money Bags', flag => flag.gdp >= 25000000000);
}

function babyBoomerAction(idx) {

  // Placeholder for future implementation
  alert('Baby Boomer action is not yet implemented.');
}

function setupSaviourActions() {
  renderSaviourActions();
  renderSaviourUndoRedo();
  setTimeout(() => {
    const infoBtn = document.getElementById('saviour-info-btn');
    if (infoBtn) infoBtn.onclick = showSaviourInfoPopout;
  }, 0);
}

function showSaviourInfoPopout() {
  // Remove if already present
  let existing = document.getElementById('saviour-info-popout');
  if (existing) existing.remove();
  // Create popout
  const pop = document.createElement('div');
  pop.id = 'saviour-info-popout';
  pop.style.position = 'fixed';
  pop.style.zIndex = '2000';
  pop.style.left = '0';
  pop.style.top = '0';
  pop.style.width = '100vw';
  pop.style.height = '100vh';
  pop.style.background = 'rgba(0,0,0,0.45)';
  pop.style.display = 'flex';
  pop.style.alignItems = 'center';
  pop.style.justifyContent = 'center';
  pop.innerHTML = `
    <div style="background:#fff;padding:1.5em 1.2em 1.2em 1.2em;border-radius:1.1em;max-width:95vw;box-shadow:0 2px 16px #0003;min-width:270px;position:relative;">
      <button id="saviour-info-close" style="position:absolute;top:0.5em;right:0.7em;font-size:1.5em;background:none;border:none;cursor:pointer;">&times;</button>
      <h3 style="margin-top:0;text-align:center;font-size:1.2em;">Saviour Actions</h3>
      <div style="display:grid;grid-template-columns:1.5em 1fr;gap:0.5em 0.7em;align-items:center;">
        ${SAVIOUR_ACTION_DESCRIPTIONS.map(a => `<span>${a.icon}</span><span><b>${a.name}:</b> ${a.desc}</span>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(pop);
  document.getElementById('saviour-info-close').onclick = () => pop.remove();
  pop.onclick = e => { if (e.target === pop) pop.remove(); };
}

// Patch showSaviourMode to call setupSaviourActions
const _origShowSaviourMode = showSaviourMode;
showSaviourMode = function() {
  inSaviourDailyMode = false;
  saviourDailyDate = null;
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-entry').style.display = 'none';
  document.getElementById('game-mc').style.display = 'none';
  document.getElementById('game-rc').style.display = 'none';
  document.getElementById('study-page').style.display = 'none';
  document.getElementById('game-saviour').style.display = 'flex';
  // Add game mode title
  setGameModeTitle('game-saviour', 'Saviour Mode');
  saviourStreak = 0;
  updateSaviourScoreDisplays();
  // --- NEW: Clear result message on new game ---
  const resultDiv = document.getElementById('result-saviour');
  if (resultDiv) resultDiv.innerHTML = '';
  setupSaviourGrid();
  setupSaviourActions();
};

// Patch: Always clear result-saviour when returning to menu from Saviour/Saviour Daily
(function() {
  var origBackToMenuSaviour = document.getElementById('back-to-menu-saviour').onclick;
  document.getElementById('back-to-menu-saviour').onclick = function() {
    var resultDiv = document.getElementById('result-saviour');
    if (resultDiv) resultDiv.innerHTML = '';
    if (typeof origBackToMenuSaviour === 'function') origBackToMenuSaviour();
  };
})();

// --- Patch: Always clear result-saviour when returning to menu from Saviour Daily ---
(function() {
  // If there is a separate button for Saviour Daily, patch it too.
  var btn = document.getElementById('back-to-menu-saviour-daily');
  if (btn) {
    var orig = btn.onclick;
    btn.onclick = function() {
      var resultDiv = document.getElementById('result-saviour');
      if (resultDiv) resultDiv.innerHTML = '';
      if (typeof orig === 'function') orig();
    };
  }
})();