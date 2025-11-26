document.getElementById('generateBtn').addEventListener('click', async () => {
  const nickname = document.getElementById('nickname').value;
  const ageRange = document.getElementById('ageRange').value;
  const missionIdea = document.getElementById('missionIdea').value;
  const helpMode = document.querySelector('input[name="helpMode"]:checked').value;

  const payload = {
    nickname: nickname,
    age_range: ageRange,
    mission_idea: missionIdea,
    help_mode: helpMode
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
    const quest = await response.json();
    displayQuest(quest);
  } catch (err) {
    alert('Error generating quest. Please try again.');
    console.error(err);
  }
});

// New quest button resets form and shows input section again
document.getElementById('newQuestBtn').addEventListener('click', () => {
  document.getElementById('quest-section').style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
});

// display quest details
function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';

  const questContainer = document.createElement('div');
  questContainer.className = 'quest';

  // title and summary
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

  // hide form and show quest
  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}

// view log button
document.getElementById('viewLogBtn').addEventListener('click', () => {
  fetch('/quests')
    .then(response => response.json())
    .then(quests => {
      const logOutput = document.getElementById('log-output');
      logOutput.innerHTML = '';
      if (!Array.isArray(quests) || quests.length === 0) {
        logOutput.textContent = 'No quests found.';
      } else {
        quests.forEach(quest => {
          const card = document.createElement('div');
          card.className = 'quest-card';
          card.innerHTML = `
            <h4>${quest.quest_name}</h4>
            <p>${quest.mission_summary}</p>
          `;
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

// back button on log section
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('log-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
});
