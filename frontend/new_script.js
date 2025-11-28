// Event listener for generating a new quest
document.getElementById('generateBtn').addEventListener('click', async () => {
  const nickname = document.getElementById('nickname').value;
  const ageRange = document.getElementById('ageRange').value;
  const missionIdea = document.getElementById('missionIdea').value;
  const helpModeElement = document.querySelector('input[name="helpMode"]:checked');
  const helpMode = helpModeElement ? helpModeElement.value : '';

  // Build payload; mission_idea and help_mode are required by backend
  const payload = {
    mission_idea: missionIdea,
    help_mode: helpMode,
    // include optional fields for future use
    nickname: nickname,
    age_range: ageRange
  };

  try {
    const response = await fetch('http://localhost:5000/generate-quest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const data = await response.json();
    // Expect data to have shape { id, quest }
    currentQuestId = data.id;
    displayQuest(data);
  } catch (err) {
    alert('Error generating quest. Please try again.');
    console.error(err);
  }
});

// Global variable to track current quest id
let currentQuestId = null;

// New quest button resets form and shows input section again
document.getElementById('newQuestBtn').addEventListener('click', () => {
  document.getElementById('quest-section').style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
});

// Display quest details with SGXP progress bar and interactive steps
function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';

  const questContainer = document.createElement('div');
  questContainer.className = 'quest-card';

  // Compute total SGXP from all steps
  const totalSGXP = Array.isArray(quest.steps)
    ? quest.steps.reduce((acc, step) => acc + (step.sgxp_reward || 0), 0)
    : 0;

  // Build the HTML structure of the quest
  questContainer.innerHTML = `
    <h3>${quest.quest_name}</h3>
    <div class="progress-container"><div class="progress-bar" style="width:0%"></div></div>
    <p>${quest.mission_summary}</p>
    <h4>Steps</h4>
    <ol class="step-list"></ol>
    <h4>Reflection Prompts</h4>
    <ul class="reflection-list">${Array.isArray(quest.reflection_prompts)
      ? quest.reflection_prompts.map((prompt) => `<li>${prompt}</li>`).join('')
      : ''
    }</ul>
    <h4>Safety Notes</h4>
    <ul class="safety-list">${Array.isArray(quest.safety_notes)
      ? quest.safety_notes.map((note) => `<li>${note}</li>`).join('')
      : ''
    }</ul>
    <p><strong>Total SGXP:</strong> ${totalSGXP}</p>
  `;

  // Populate the ordered list with step items containing checkboxes
  const stepList = questContainer.querySelector('.step-list');
  if (Array.isArray(quest.steps)) {
    quest.steps.forEach((step, idx) => {
      const li = document.createElement('li');
      li.className = 'step-item';
      li.innerHTML = `
        <input type="checkbox" class="step-checkbox" id="step-${idx}" data-reward="${step.sgxp_reward}">
        <label for="step-${idx}"><strong>${step.title}</strong>: ${step.description} <span class="sgxp-badge">${step.sgxp_reward} SGXP</span></label>
      `;
      stepList.appendChild(li);
    });
  }

  // Attach event listeners to update progress when steps are checked
  const progressBar = questContainer.querySelector('.progress-bar');
  const checkboxes = questContainer.querySelectorAll('.step-checkbox');
  function updateProgress() {
    let gained = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        gained += parseInt(cb.dataset.reward);
      }
    });
    const ratio = totalSGXP > 0 ? (gained / totalSGXP) * 100 : 0;
    progressBar.style.width = ratio + '%';
  }
  checkboxes.forEach((cb) => {
    cb.addEventListener('change', updateProgress);
  });

  output.appendChild(questContainer);

  // Hide form and show quest
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}

// View log button
document.getElementById('viewLogBtn').addEventListener('click', () => {
  fetch('/quests')
    .then((response) => response.json())
    .then((entries) => {
      const logOutput = document.getElementById('log-output');
      logOutput.innerHTML = '';

      if (!Array.isArray(entries) || entries.length === 0) {
        logOutput.textContent = 'No quests found.';
      } else {
        // Compute total SGXP across all quests
        let cumulativeSGXP = 0;
        entries.forEach((entry) => {
          if (Array.isArray(entry.steps)) {
            entry.steps.forEach((step) => {
              cumulativeSGXP += step.sgxp_reward || 0;
            });
          }
        });
        // Show total SGXP earned
        const totalPara = document.createElement('p');
        totalPara.innerHTML =
          '<strong>Total SGXP across quests:</strong> ' + cumulativeSGXP;
        logOutput.appendChild(totalPara);

        // Display each saved quest summary
        entries.forEach((entry) => {
          const { id, quest_name, mission_summary } = entry;
          const card = document.createElement('div');
          card.className = 'quest-card';
          card.innerHTML = `
            <h4>${quest_name}</h4>
            <p>${mission_summary}</p>
          `;
          // Click handler to view details of this quest
          card.addEventListener('click', () => {
            fetch(`/quests/${id}`)
              .then((res) => res.json())
              .then((data) => {
                currentQuestId = data.id;
                // Pass the data directly since it has top-level fields
                displayQuest(data);
                // Hide log and show quest details
                document.getElementById('log-section').style.display = 'none';
              })
              .catch((err) => {
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
    .catch((err) => {
      console.error('Error fetching quests:', err);
      alert('Failed to load your quest log. Please try again.');
    });
});

// Back button on log section
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('log-section').style.display = 'none';
  // If there is a quest currently displayed, show it; else show form
  if (currentQuestId !== null) {
    document.getElementById('quest-section').style.display = 'block';
  } else {
    document.getElementById('form-section').style.display = 'block';
  }
});
