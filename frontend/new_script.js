// Global variable to store mission payload during clarification
let currentMissionPayload = null;
let currentQuestId = null;
let lastFetchedSuitLogEntries = [];
let currentSuitLogSort = 'recent';

// Stable per-browser client id, used instead of fragile cross-site cookies
const CLIENT_ID_STORAGE_KEY = 'psc_citizen_hero_client_id';

function getOrCreateClientId() {
  try {
    const stored = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (stored) return stored;
    let newId;
    if (window.crypto && window.crypto.randomUUID) {
      newId = window.crypto.randomUUID();
    } else {
      newId = 'ch-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, newId);
    return newId;
  } catch (e) {
    // Fallback if localStorage is unavailable
    return 'ch-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

const CLIENT_ID = getOrCreateClientId();

// Storage key and helpers for persisting quest progress per quest id.
const PROGRESS_STORAGE_KEY = 'psc_citizen_hero_progress';

/**
 * Load saved progress for a quest by its id. Returns
 * an object of shape { earned: number, stepStatus: { [idx]: boolean } }
 * or null when no progress is saved.
 */
function loadQuestProgress(id) {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[id] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Save progress for a quest. The progress object should have
 * shape { earned: number, stepStatus: { [idx]: boolean } }.
 */
function saveQuestProgress(id, progress) {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[id] = progress;
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // Ignore storage errors
  }
}

// Helper to reset the entire UI and state
function resetAll() {
  // Reset form fields
  const nicknameInput = document.getElementById('nickname');
  if (nicknameInput) nicknameInput.value = '';
  const ageSelect = document.getElementById('ageRange');
  if (ageSelect) ageSelect.selectedIndex = 0;
  const missionTextarea = document.getElementById('missionIdea');
  if (missionTextarea) missionTextarea.value = '';
  // Reset help mode to default ("supplies")
  const defaultHelpRadio = document.querySelector('input[name="helpMode"][value="supplies"]');
  if (defaultHelpRadio) defaultHelpRadio.checked = true;
  // Clear clarifying answers
  document.querySelectorAll('.clarify-answer').forEach(input => {
    input.value = '';
  });
  // Clear questions container
  const questionsContainer = document.getElementById('questions-container');
  if (questionsContainer) questionsContainer.innerHTML = '';
  // Reset internal state
  currentMissionPayload = null;
  currentQuestId = null;
  // Hide all sections and show fresh form
  document.getElementById('quest-section').style.display = 'none';
  document.getElementById('clarify-section').style.display = 'none';
  document.getElementById('log-section').style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
}

// Event listener for generating a new quest (starts clarification)
document.getElementById('generateBtn').addEventListener('click', async () => {
  const nickname = document.getElementById('nickname').value;
  const ageRange = document.getElementById('ageRange').value;
  const missionIdea = document.getElementById('missionIdea').value;
  const helpModeElement = document.querySelector('input[name="helpMode"]:checked');
  const helpMode = helpModeElement ? helpModeElement.value : '';

  // Build payload
  currentMissionPayload = {
    mission_idea: missionIdea,
    help_mode: helpMode,
    nickname: nickname,
    age_range: ageRange,
    client_id: CLIENT_ID,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/clarify-mission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentMissionPayload)
    });
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    if (data.questions && data.questions.length > 0) {
      displayClarifyingQuestions(data.questions);
    } else {
      // If no clarifying questions are returned, jump straight to quest generation
      generateQuest(currentMissionPayload);
    }
  } catch (err) {
    console.error(err);
    alert('Error starting mission. Please try again.');
  }
});

// Display clarifying questions with helpful hints
function displayClarifyingQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  const hints = [
    {
      description: 'Describe the person, group, or organization you want to help.',
      example: 'Example: "Cats and dogs at the Pine Street Animal Shelter."',
    },
    {
      description: 'Give a rough time frame so JayNova can size your quest.',
      example: 'Example: "Within the next two weeks."',
    },
    {
      description: 'List one to three key items you want to collect or provide.',
      example: 'Example: "Blankets, canned pet food, and kitty litter."',
    },
  ];
  questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    const hint = hints[idx] || {};
    const hintHtml = hint.description
      ? `<span class="hint">${hint.description}<br><em>${hint.example || ''}</em></span>`
      : '';
    div.innerHTML = `
      <label>${q}</label>
      ${hintHtml}
      <input type="text" class="clarify-answer" data-idx="${idx}">
    `;
    container.appendChild(div);
  });
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('clarify-section').style.display = 'block';
}

// Confirm clarifying answers and generate quest
document.getElementById('confirmMissionBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('.clarify-answer');
  const answers = [];
  inputs.forEach(input => answers.push(input.value));
  if (!currentMissionPayload) {
    currentMissionPayload = {};
  }
  currentMissionPayload.clarifying_answers = answers;
  generateQuest(currentMissionPayload);
});

// Generate quest from backend
async function generateQuest(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-quest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    currentQuestId = data.id;
    document.getElementById('clarify-section').style.display = 'none';
    document.getElementById('form-section').style.display = 'none';
    displayQuest(data);
  } catch (err) {
    console.error(err);
    alert('Error generating quest. Please try again.');
    // Show form again on error
    document.getElementById('form-section').style.display = 'block';
    document.getElementById('clarify-section').style.display = 'none';
  }
}

// New quest button – full reset
document.getElementById('newQuestBtn').addEventListener('click', resetAll);

// Helper to apply 6-color band classes to mission progress bar
function applyProgressBandClass(barEl, percent) {
  if (!barEl) return;
  const classes = ['progress-band-0', 'progress-band-20', 'progress-band-40', 'progress-band-60', 'progress-band-80', 'progress-band-100'];
  classes.forEach(c => barEl.classList.remove(c));
  let cls;
  if (percent >= 99.5) {
    cls = 'progress-band-100';
  } else if (percent >= 80) {
    cls = 'progress-band-80';
  } else if (percent >= 60) {
    cls = 'progress-band-60';
  } else if (percent >= 40) {
    cls = 'progress-band-40';
  } else if (percent >= 20) {
    cls = 'progress-band-20';
  } else {
    cls = 'progress-band-0';
  }
  barEl.classList.add(cls);
}

// Display quest details with SGXP progress and interactive steps
function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';
  const questContainer = document.createElement('div');
  questContainer.className = 'quest-card';

  // Record current quest id for persistence
  currentQuestId = quest.id;

  const totalSGXP = Array.isArray(quest.steps)
    ? quest.steps.reduce((acc, step) => acc + (step.sgxp_reward || 0), 0)
    : 0;

  questContainer.innerHTML = `
    <h3>${quest.quest_name}</h3>
    <div class="progress-container"><div class="progress-bar progress-band-0" style="width:0%"></div></div>
    <p>${quest.mission_summary}</p>
    <h4>Steps</h4>
    <ol class="step-list"></ol>
    <h4>Reflection Prompts</h4>
    <ul class="reflection-list">${
      Array.isArray(quest.reflection_prompts)
        ? quest.reflection_prompts.map(p => `<li>${p}</li>`).join('')
        : ''
    }</ul>
    <h4>Safety Notes</h4>
    <ul class="safety-list">${
      Array.isArray(quest.safety_notes)
        ? quest.safety_notes.map(n => `<li>${n}</li>`).join('')
        : ''
    }</ul>
    <p><strong>Total SGXP:</strong> <span class="sgxp-earned">0</span> / ${totalSGXP}</p>
  `;

  // Populate steps with checkboxes
  const stepList = questContainer.querySelector('.step-list');
  if (Array.isArray(quest.steps)) {
    quest.steps.forEach((step, idx) => {
      const li = document.createElement('li');
      li.className = 'step-item';
      li.innerHTML = `
        <div class="quest-step-row">
          <div class="quest-step-main">
            <input type="checkbox" class="step-checkbox" id="step-${idx}" data-reward="${step.sgxp_reward}" />
            <label for="step-${idx}">
              ${step.title ? `<strong>${step.title}</strong>` : ''} ${step.description || ''}
            </label>
          </div>
          <span class="sgxp-badge">${step.sgxp_reward} SGXP</span>
        </div>
      `;
      stepList.appendChild(li);
    });
  }

  // Progress logic
  const progressBar = questContainer.querySelector('.progress-bar');
  const checkboxes = questContainer.querySelectorAll('.step-checkbox');
  const sgxpEarnedEl = questContainer.querySelector('.sgxp-earned');

  // Load previously saved progress for this quest
  const saved = loadQuestProgress(currentQuestId) || { earned: 0, stepStatus: {} };
  // Restore checkbox states
  checkboxes.forEach((cb, index) => {
    if (saved.stepStatus && saved.stepStatus[index]) {
      cb.checked = true;
    }
  });

  function updateProgress() {
    let gained = 0;
    const stepStatus = {};
    checkboxes.forEach((cb, index) => {
      const li = cb.closest('.step-item');
      if (cb.checked) {
        gained += parseInt(cb.dataset.reward || '0', 10);
        if (li) li.classList.add('step-completed');
      } else if (li) {
        li.classList.remove('step-completed');
      }
      stepStatus[index] = cb.checked;
    });
    const ratio = totalSGXP > 0 ? (gained / totalSGXP) * 100 : 0;
    if (progressBar) {
      progressBar.style.width = `${ratio}%`;
      applyProgressBandClass(progressBar, ratio);
    }
    if (sgxpEarnedEl) sgxpEarnedEl.textContent = gained;
    // Persist progress
    saveQuestProgress(currentQuestId, { earned: gained, stepStatus });
  }
  checkboxes.forEach(cb => cb.addEventListener('change', updateProgress));
  // Initialise progress with saved values
  updateProgress();

  output.appendChild(questContainer);
  // Show quest section
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}

// View log button – shows all saved quests and cumulative SGXP
document.getElementById('viewLogBtn').addEventListener('click', () => {
  const url = `${API_BASE_URL}/quests?client_id=${encodeURIComponent(CLIENT_ID)}`;
  fetch(url)
    .then(res => res.json())
    .then(entries => {
      lastFetchedSuitLogEntries = Array.isArray(entries) ? entries : [];
      const sortSelect = document.getElementById('suitLogSort');
      if (sortSelect) {
        currentSuitLogSort = sortSelect.value || 'recent';
      } else {
        currentSuitLogSort = 'recent';
      }
      renderSuitLogEntries(lastFetchedSuitLogEntries, currentSuitLogSort);
      document.getElementById('quest-section').style.display = 'none';
      document.getElementById('log-section').style.display = 'block';
    })
    .catch(err => {
      console.error('Error fetching quests:', err);
      alert('Failed to load your quest log. Please try again.');
    });
});

// Render Suit Log entries with sorting and local SGXP progress
function renderSuitLogEntries(entries, sortMode = 'recent') {
  const logOutput = document.getElementById('log-output');
  if (!logOutput) return;
  logOutput.innerHTML = '';

  if (!Array.isArray(entries) || entries.length === 0) {
    logOutput.textContent = 'No quests found. Complete a mission to populate your Suit Log!';
    return;
  }

  // Load local progress
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  const progressMap = raw ? JSON.parse(raw) : {};

  const questsWithStats = entries.map(entry => {
    const steps = Array.isArray(entry.steps) ? entry.steps : [];
    const questTotal = steps.reduce((sum, s) => sum + parseInt(s.sgxp_reward || 0, 10), 0);

    const saved = progressMap[entry.id];
    let earned = 0;
    if (saved && typeof saved.earned === 'number') {
      earned = saved.earned;
    } else if (saved && saved.stepStatus) {
      earned = steps.reduce((sum, s, idx) => {
        return sum + (saved.stepStatus[idx] ? parseInt(s.sgxp_reward || 0, 10) : 0);
      }, 0);
    }

    return {
      ...entry,
      questTotal,
      earned,
      createdAt: entry.created_at || entry.createdAt || entry.created || null
    };
  });

  // Sorting
  const sorted = [...questsWithStats];
  if (sortMode === 'oldest') {
    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortMode === 'quest-sgxp-high') {
    sorted.sort((a, b) => b.earned - a.earned);
  } else if (sortMode === 'quest-sgxp-low') {
    sorted.sort((a, b) => a.earned - b.earned);
  } else {
    // most recent
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const totalAcross = questsWithStats.reduce((sum, q) => sum + q.earned, 0);
  const totalPara = document.createElement('p');
  totalPara.innerHTML = `<strong>Total SGXP across quests:</strong> ${totalAcross}`;
  logOutput.appendChild(totalPara);

  sorted.forEach(entry => {
    const { id, quest_name, mission_summary, questTotal, earned } = entry;
    const createdText = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '';
    const percent = questTotal > 0 ? Math.min(100, Math.round((earned / questTotal) * 100)) : 0;

    let statusLabel;
    let statusClass;
    if (percent >= 100 && questTotal > 0) {
      statusLabel = 'Completed';
      statusClass = 'quest-status-complete';
    } else if (earned > 0) {
      statusLabel = 'In progress';
      statusClass = 'quest-status-in-progress';
    } else {
      statusLabel = 'Not started';
      statusClass = 'quest-status-not-started';
    }

    let tintClass;
    if (percent >= 100) {
      tintClass = 'quest-progress-100';
    } else if (percent >= 75) {
      tintClass = 'quest-progress-75';
    } else if (percent >= 50) {
      tintClass = 'quest-progress-50';
    } else if (percent >= 25) {
      tintClass = 'quest-progress-25';
    } else {
      tintClass = 'quest-progress-0';
    }

    const card = document.createElement('div');
    card.className = `quest-card log-entry-card ${tintClass}`;
    card.innerHTML = `
      <div class="log-card-header">
        <div class="log-card-title-wrap">
          <h4>${quest_name}</h4>
          <div class="quest-status-pill ${statusClass}">
            ${statusLabel}
          </div>
        </div>
        <button
          type="button"
          class="delete-quest-btn"
          aria-label="Delete this quest from your Suit Log"
          title="Delete this quest from your Suit Log"
        >&times;</button>
      </div>
      <p>${mission_summary}</p>
      <p><strong>Created:</strong> ${createdText}</p>
      <p class="quest-log-sgxp-line">
        <strong>Quest SGXP:</strong> ${earned} / ${questTotal} (${percent}%)
      </p>
      <div class="quest-log-progress-track">
        <div class="quest-log-progress-bar" style="width: ${percent}%;"></div>
      </div>
    `;

    // Clicking the card opens quest detail
    card.addEventListener('click', () => {
      const detailUrl = `${API_BASE_URL}/quests/${id}?client_id=${encodeURIComponent(CLIENT_ID)}`;
      fetch(detailUrl)
        .then(r => r.json())
        .then(data => {
          currentQuestId = data.id;
          displayQuest(data);
          document.getElementById('log-section').style.display = 'none';
        })
        .catch(err => {
          console.error('Error fetching quest details:', err);
          alert('Failed to load the quest. Please try again.');
        });
    });

    // Delete button (stop click from opening quest)
    const deleteBtn = card.querySelector('.delete-quest-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (evt) => {
                  evt.stopImmediatePropagation();
        evt.stopPropagation();
            evt.preventDefault();
                const confirmed = window.confirm('Remove this quest from your Suit Log? This does not delete your real-world actions.');
        if (!confirmed) return;

        fetch(`${API_BASE_URL}/quests/${id}?client_id=${encodeURIComponent(CLIENT_ID)}`, {
          method: 'DELETE',
        })
          .then(res => {
            if (!res.ok && res.status !== 204) {
              throw new Error('Delete failed');
            }
            // Clear local progress for this quest
            try {
              const rawLocal = localStorage.getItem(PROGRESS_STORAGE_KEY);
              if (rawLocal) {
                const map = JSON.parse(rawLocal);
                delete map[id];
                localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
              }
            } catch (e) {
              console.warn('Unable to update local progress map after deletion', e);
            }
            // Remove from cached entries and re-render
            lastFetchedSuitLogEntries = lastFetchedSuitLogEntries.filter(q => q.id !== id);
            renderSuitLogEntries(lastFetchedSuitLogEntries, currentSuitLogSort);
          })
          .catch(err => {
            console.error('Error deleting quest:', err);
            alert('Sorry, I could not delete that quest. Please try again.');
          });
      });
    }

    logOutput.appendChild(card);
  });
}

// Listen for sort changes on Suit Logs
document.addEventListener('DOMContentLoaded', () => {
  const sortSelect = document.getElementById('suitLogSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSuitLogSort = e.target.value || 'recent';
      renderSuitLogEntries(lastFetchedSuitLogEntries, currentSuitLogSort);
    });
  }

  const deleteAllBtn = document.getElementById('deleteAllQuestsBtn');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Clear your Suit Log? This only removes saved quests here – your real-world hero work stays with you.');
      if (!confirmed) return;

      fetch(`${API_BASE_URL}/quests?client_id=${encodeURIComponent(CLIENT_ID)}`, {
        method: 'DELETE',
      })
        .then(res => {
        if (!res.ok && res.status !== 200 && res.status !== 204) {
            throw new Error('Delete all failed');
          }
          // Clear all local quest progres
          try {
            window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
          } catch (e) {
            console.warn('Unable to clear local progress after bulk delete', e);
          }
          
          lastFetchedSuitLogEntries = [];
          renderSuitLogEntries([], currentSuitLogSort);
        })
        .catch(err => {
          console.error('Error clearing Suit Log:', err);
          alert('Sorry, I could not clear your Suit Log. Please try again.');
        });
    });
  }
});

// Back button from log view
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('log-section').style.display = 'none';
  if (currentQuestId !== null) {
    document.getElementById('quest-section').style.display = 'block';
  } else {
    document.getElementById('form-section').style.display = 'block';
  }
});


// Back to mission from top of Suit Log view
const backBtnTop = document.getElementById('backBtnTop');
if (backBtnTop) {
  backBtnTop.addEventListener('click', () => {
    document.getElementById('log-section').style.display = 'none';
    if (currentQuestId != null) {
      document.getElementById('quest-section').style.display = 'block';
    } else {
      document.getElementById('form-section').style.display = 'block';
    }
  });
}
