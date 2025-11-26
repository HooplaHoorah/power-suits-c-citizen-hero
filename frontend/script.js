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
    const response = await fetch('/generate-quest', {
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
    displayQuest(data.quest);
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

// Display quest details
function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';

  const questContainer = document.createElement('div');
  questContainer.className = 'quest';

  questContainer.innerHTML = `
    <h2>${quest.quest_name}</h2>
    <p>${quest.mission_summary}</p>
    <h3>Steps</h3>
    <ol>${quest.steps.map(step => `
      <li><strong>${step.title}</strong>: ${step.description} (SGXP ${step.sgxp_reward})</li>
    `).join('')}</ol>
    <h3>Reflection Prompts</h3>
    <ul>${quest.reflection_prompts.map(prompt => `<li>${prompt}</li>`).join('')}</ul>
    <h3>Safety Notes</h3>
    <ul>${quest.safety_notes.map(note => `<li>${note}</li>`).join('')}</ul>
  `;
  output.appendChild(questContainer);

  // Hide form and show quest
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}

// View log button
document.getElementById('viewLogBtn').addEventListener('click', () => {
  fetch('/quests')
    .then(response => response.json())
    .then(entries => {
      const logOutput = document.getElementById('log-output');
      logOutput.innerHTML = '';
      if (!Array.isArray(entries) || entries.length === 0) {
        logOutput.textContent = 'No quests found.';
      } else {
        entries.forEach(entry => {
          const { id, quest } = entry;
          const card = document.createElement('div');
          card.className = 'quest-card';
          card.innerHTML = `
            <h4>${quest.quest_name}</h4>
            <p>${quest.mission_summary}</p>
          `;
          // Click handler to view details of this quest
          card.addEventListener('click', () => {
            fetch(`/quests/${id}`)
              .then(res => res.json())
              .then(data => {
                currentQuestId = data.id;
                displayQuest(data.quest);
                // Hide log and show quest details
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
