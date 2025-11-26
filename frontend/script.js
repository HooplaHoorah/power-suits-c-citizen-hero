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

document.getElementById('newQuestBtn').addEventListener('click', () => {
  document.getElementById('quest-section').style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
});

function displayQuest

 test
// Event listeners for viewing and returning from the Suit Log

document.getElementById('viewLogBtn').addEventListener('click', () => {
  fetch('/quests')
    .then(response => response.json())
    .then(quests => {
      const logOutput = document.getElementById('log-output');
      logOutput.innerHTML = '';
      if (!Array.isArray(quests) || quests.length === 0) {
        logOutput.textContent = 'No quests found.';
      } else {
        quests.forEach((quest) => {
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
    .catch(error => {
      console.error('Error fetching quests:', error);
      alert('Failed to load your quest log. Please try again.');
    });
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('log-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
});
