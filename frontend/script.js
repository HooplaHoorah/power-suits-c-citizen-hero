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

function displayQuest(quest) {
  const output = document.getElementById('quest-output');
  output.innerHTML = '';
  const titleElem = document.createElement('h3');
  titleElem.textContent = quest.quest_name || 'Hero Quest';
  output.appendChild(titleElem);

  const mission = document.createElement('p');
  mission.textContent = quest.mission_summary;
  output.appendChild(mission);

  const difficulty = document.createElement('p');
  difficulty.textContent = `Difficulty: ${quest.difficulty}, Estimated duration: ${quest.estimated_duration_days} days`;
  output.appendChild(difficulty);

  const stepsList = document.createElement('ol');
  quest.steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = `${step.title}: ${step.description} (+${step.sgxp_reward} SGXP)`;
    stepsList.appendChild(li);
  });
  output.appendChild(stepsList);

  if (quest.reflection_prompts && quest.reflection_prompts.length > 0) {
    const reflectionHeading = document.createElement('h4');
    reflectionHeading.textContent = 'Reflection';
    output.appendChild(reflectionHeading);
    const reflectionList = document.createElement('ul');
    quest.reflection_prompts.forEach(prompt => {
      const li = document.createElement('li');
      li.textContent = prompt;
      reflectionList.appendChild(li);
    });
    output.appendChild(reflectionList);
  }

  if (quest.safety_notes && quest.safety_notes.length > 0) {
    const safetyHeading = document.createElement('h4');
    safetyHeading.textContent = 'Safety Notes';
    output.appendChild(safetyHeading);
    const safetyList = document.createElement('ul');
    quest.safety_notes.forEach(note => {
      const li = document.createElement('li');
      li.textContent = note;
      safetyList.appendChild(li);
    });
    output.appendChild(safetyList);
  }

  document.getElementById('form-section').style.display = 'none';
  document.getElementById('quest-section').style.display = 'block';
}
