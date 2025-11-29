// Global variable to store mission payload during clarification
let currentMissionPayload = null;
let currentQuestId = null;

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
  document.querySelectorAll('.clarify-answer').forEach(input => input.value = '');
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
  };

  try {
    const response = await fetch('http://localhost:5000/clarify-mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentMissionPayload),
    });
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    if (data.questions && data.questions.length > 0) {
      displayClarifyingQuestions(data.questions);
    } else {
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
  currentMissionPayload.clarifying_answers = answers;
  generateQuest(currentMissionPayload);
});

// Generate quest from backend
async function generateQuest(payload) {
  try {
    const response = await fetch('http://localhost:5000/generate-quest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

// Display quest details with SGXP progress and interactive steps
function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';
  const questContainer = document.createElement('div');
  questContainer.className = 'quest-card';

  const totalSGXP = Array.isArray(quest.steps)
    ? quest.steps.reduce((acc, step) => acc + (step.sgxp_reward || 0), 0)
    : 0;

  questContainer.innerHTML = `
    <h3>${quest.quest_name}</h3>
    <div class="progress-container"><div class="progress-bar" style="width:0%"></div></div>
    <p>${quest.mission_summary}</p>
    <h4>Steps</h4>
    <ol class="step-list"></ol>
    <h4>Reflection Prompts</h4>
    <ul class="reflection-list">${Array.isArray(quest.reflection_prompts)
      ? quest.reflection_prompts.map(p => `<li>${p}</li>`).join('')
      : ''}</ul>
    <h4>Safety Notes</h4>
    <ul class="safety-list">${Array.isArray(quest.safety_notes)
      ? quest.safety_notes.map(n => `<li>${n}</li>`).join('')
      : ''}</ul>
    <p><strong>Total SGXP:</strong> <span class="sgxp-earned">0</span> / ${totalSGXP}</p>
  `;

  // Populate steps with checkboxes
  const stepList = questContainer.querySelector('.step-list');
  if (Array.isArray(quest.steps)) {
    quest.steps.forEach((step, idx) => {
      const li = document.createElement('li');
      li.className = 'step-item';
      li.innerHTML = `
        <input type="checkbox" class="step-checkbox" id="step-${idx}" data-reward="${step.sgxp_reward}" />
        <label for="step-${idx}"><strong>${step.title}</strong>: ${step.description} <span class="sgxp-badge">${step.sgxp_reward} SGXP</span></label>
      `;
      stepList.appendChild(li);
    });
  }

  // Progress logic
  const progressBar = questContainer.querySelector('.progress-bar');
  const checkboxes = questContainer.querySelectorAll('.step-checkbox');
  const sgxpEarnedEl = questContainer.querySelector('.sgxp-earned');
  function updateProgress() {
    let gained = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) gained += parseInt(cb.dataset.reward || '0', 10);
    });
    const ratio = totalSGXP > 0 ? (gained / totalSGXP) * 100 : 0;
    progressBar.style.width = ratio + '%';
    if (sgxpEarnedEl) sgxpEarnedEl.textContent = gained;
  }
  checkboxes.forEach(cb => cb.addEventListener('change', updateProgress));
  // Initialise progress
  updateProgress();

  output.appendChild(questContainer);
  // Show quest section
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}

// View log button – shows all saved quests and cumulative SGXP
document.getElementById('viewLogBtn').addEventListener('click', () => {
  fetch('/quests')
    .then(res => res.json())
    .then(entries => {
      const logOutput = document.getElementById('log-output');
      logOutput.innerHTML = '';
      if (!Array.isArray(entries) || entries.length === 0) {
        logOutput.textContent = 'No quests found.';
      } else {
        let cumulativeSGXP = 0;
        entries.forEach(entry => {
          if (Array.isArray(entry.steps)) {
            entry.steps.forEach(step => cumulativeSGXP += step.sgxp_reward || 0);
          }
        });
        const totalPara = document.createElement('p');
        totalPara.innerHTML = `<strong>Total SGXP across quests:</strong> ${cumulativeSGXP}`;
        logOutput.appendChild(totalPara);
        entries.forEach(entry => {
          const { id, quest_name, mission_summary } = entry;
          const card = document.createElement('div');
          card.className = 'quest-card';
          card.innerHTML = `<h4>${quest_name}</h4><p>${mission_summary}</p>`;
          card.addEventListener('click', () => {
            fetch(`/quests/${id}`)
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
          logOutput.appendChild(card);
        });
      }
      document.getElementById('quest-section').style.display = 'none';
      document.getElementById('log-section').style.display = 'block';
    })
    .catch(err => {
      console.error('Error fetching quests:', err);
      alert('Failed to load your quest log. Please try again.');
    });
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
