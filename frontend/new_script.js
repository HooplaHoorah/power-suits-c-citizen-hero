// frontend/new_script.js
// Main UI + API glue for Power Suits C™: Citizen Hero™
// Handles: clarifying flow, quest rendering, SGXP mission bar, Suit Log, and
// optimistic delete / clear behavior wired to the Flask backend.

(function () {
  "use strict";

  const API_BASE_URL = (typeof window !== "undefined" && window.API_BASE_URL) || "";

  // ----- DOM LOOKUPS -------------------------------------------------------
  const formSection = document.getElementById("form-section");
  const clarifySection = document.getElementById("clarify-section");
  const questSection = document.getElementById("quest-section");
  const logSection = document.getElementById("log-section");

  const generateBtn = document.getElementById("generateBtn");
  const confirmMissionBtn = document.getElementById("confirmMissionBtn");

  const questionsContainer = document.getElementById("questions-container");
  const questOutput = document.getElementById("quest-output");

  const newQuestBtn = document.getElementById("newQuestBtn");
  const viewLogBtn = document.getElementById("viewLogBtn");

  const suitLogSortSelect = document.getElementById("suitLogSort");
  const deleteAllQuestsBtn = document.getElementById("deleteAllQuestsBtn");
  const backBtnTop = document.getElementById("backBtnTop");
  const backBtn = document.getElementById("backBtn");
  const logOutput = document.getElementById("log-output");

  const nicknameInput = document.getElementById("nickname");
  const ageRangeSelect = document.getElementById("ageRange");
  const missionIdeaInput = document.getElementById("missionIdea");

  // ----- STATE -------------------------------------------------------------
  const state = {
    basePayload: null,
    clarifyQuestions: [],
    currentQuest: null,
    suitLog: [],
    sortMode: "recent",
    clientId: getOrCreateClientId()
  };

  function getOrCreateClientId() {
    try {
      const key = "psc_client_id_v1";
      let id = window.localStorage.getItem(key);
      if (!id) {
        id = "psc-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch (err) {
      console.warn("ClientId localStorage unavailable:", err);
      return null;
    }
  }

  // ----- SECTION TOGGLING --------------------------------------------------
  function showSection(section) {
    formSection.style.display = section === "form" ? "" : "none";
    clarifySection.style.display = section === "clarify" ? "" : "none";
    questSection.style.display = section === "quest" ? "" : "none";
    logSection.style.display = section === "log" ? "" : "none";

    if (section !== "log") {
      backBtnTop.style.display = "none";
    }
  }

  // ----- HELPERS -----------------------------------------------------------
  function getSelectedHelpMode() {
    const radios = document.querySelectorAll("input[name='helpMode']");
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return "supplies";
  }

  function buildBasePayload() {
    const missionIdea = (missionIdeaInput.value || "").trim();
    if (!missionIdea) {
      alert("Tell Suit OS JayNova what's bugging you in your world first.");
      missionIdeaInput.focus();
      return null;
    }

    const payload = {
      mission_idea: missionIdea,
      help_mode: getSelectedHelpMode(),
      nickname: (nicknameInput.value || "").trim(),
      age_range: ageRangeSelect.value,
    };

    if (state.clientId) {
      payload.client_id = state.clientId;
    }
    return payload;
  }

  async function postJson(path, body) {
    const url = API_BASE_URL + path;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(body || {})
    };
    const resp = await fetch(url, options);
    return resp;
  }

  async function deleteRequest(path) {
    const url = API_BASE_URL + path;
    const options = {
      method: "DELETE",
      credentials: "include"
    };
    const resp = await fetch(url, options);
    return resp;
  }

  async function getJson(path) {
    const url = API_BASE_URL + path;
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) {
      throw new Error("GET " + path + " failed with " + resp.status);
    }
    return resp.json();
  }

  // ----- CLARIFYING FLOW ---------------------------------------------------
  async function handleGenerateClick() {
    const payload = buildBasePayload();
    if (!payload) return;

    state.basePayload = payload;

    // Try calling /clarify-mission; if that fails, fall back to static questions.
    let questions = [];
    try {
      const resp = await postJson("/clarify-mission", payload);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.questions)) {
          questions = data.questions;
        }
      }
    } catch (err) {
      console.warn("Clarify mission call failed; using static questions:", err);
    }

    if (!questions || questions.length === 0) {
      questions = [
        "Who is this mission for?",
        "Where will this mission happen?",
        "What does success look like for this mission?"
      ];
    }

    renderClarifyQuestions(questions);
    showSection("clarify");
  }

  function renderClarifyQuestions(questions) {
    state.clarifyQuestions = questions.slice();
    questionsContainer.innerHTML = "";
    questions.forEach((q, index) => {
      const group = document.createElement("div");
      group.className = "form-group";

      const label = document.createElement("label");
      label.textContent = q;
      label.setAttribute("for", "clarify-q-" + index);

      const input = document.createElement("input");
      input.type = "text";
      input.id = "clarify-q-" + index;
      input.dataset.index = String(index);

      group.appendChild(label);
      group.appendChild(input);
      questionsContainer.appendChild(group);
    });
  }

  async function handleConfirmMission() {
    if (!state.basePayload) {
      showSection("form");
      return;
    }

    const clarifications = {};
    state.clarifyQuestions.forEach((q, index) => {
      const input = document.getElementById("clarify-q-" + index);
      if (input) {
        clarifications["q" + index] = (input.value || "").trim();
      }
    });

    const payload = Object.assign({}, state.basePayload, {
      clarifications
    });

    try {
      const resp = await postJson("/generate-quest", payload);
      let questData;
      if (resp.ok) {
        questData = await resp.json();
      } else {
        console.warn("generate-quest returned non-OK status:", resp.status);
      }
      if (!questData) {
        questData = buildLocalFallbackQuest(state.basePayload);
      }

      const quest = normaliseQuest(questData);
      state.currentQuest = quest;
      upsertSuitLogEntry(quest);
      renderQuestView(quest);
      renderSuitLog();
      showSection("quest");
    } catch (err) {
      console.error("Error generating quest:", err);
      alert("Suit OS JayNova hit a glitch while forging your quest. Try again in a moment.");
    }
  }

  function buildLocalFallbackQuest(basePayload) {
    const idea = (basePayload && basePayload.mission_idea) || "your world";
    return {
      id: 0,
      created_at: "local-dev",
      quest_name: "Operation Citizen Hero",
      mission_summary: "Use your powers of curiosity and kindness to make a small but mighty change around " + idea + ".",
      difficulty: "Easy",
      estimated_duration_days: 7,
      help_mode: (basePayload && basePayload.help_mode) || "supplies",
      steps: [
        { id: 1, title: "Find your adult ally", description: "Ask a trusted adult to help you plan a safe mission.", sgxp_reward: 10 },
        { id: 2, title: "Clarify the challenge", description: "Write down what you want to change and why it matters.", sgxp_reward: 15 },
        { id: 3, title: "Design a tiny first step", description: "Choose one small action you can take this week.", sgxp_reward: 20 },
        { id: 4, title: "Take action", description: "Carry out your tiny step and notice what happens.", sgxp_reward: 25 },
        { id: 5, title: "Reflect & share", description: "Tell someone what you did and how it felt.", sgxp_reward: 30 }
      ],
      reflection_prompts: [
        "What did you notice when you took action?",
        "How did other people respond?",
        "What would you try next time?"
      ],
      safety_notes: [
        "Always involve a trusted adult before taking action.",
        "Stay in safe, familiar places when carrying out your mission."
      ]
    };
  }

  // ----- QUEST NORMALISATION & PROGRESS -----------------------------------
  function normaliseQuest(raw) {
    const steps = Array.isArray(raw.steps) ? raw.steps.map(function (s, idx) {
      return {
        id: typeof s.id === "number" ? s.id : idx + 1,
        title: s.title || "Step " + (idx + 1),
        description: s.description || "",
        sgxp_reward: typeof s.sgxp_reward === "number" ? s.sgxp_reward : 10
      };
    }) : [];

    const totalSgxp = steps.reduce(function (sum, s) {
      return sum + (s.sgxp_reward || 0);
    }, 0);

    const createdAt = raw.created_at || new Date().toISOString();

    const completed = Array.isArray(raw.completed_step_ids)
      ? raw.completed_step_ids.slice()
      : [];

    let earned = 0;
    if (completed.length && totalSgxp > 0) {
      steps.forEach(function (s) {
        if (completed.indexOf(s.id) !== -1) {
          earned += s.sgxp_reward || 0;
        }
      });
    }
    const initialPercent = totalSgxp > 0 ? Math.round((earned / totalSgxp) * 100) : 0;

    return {
      id: typeof raw.id === "number" ? raw.id : 0,
      created_at: createdAt,
      quest_name: raw.quest_name || "Citizen Hero Mission",
      mission_summary: raw.mission_summary || "",
      difficulty: raw.difficulty || "Easy",
      estimated_duration_days: raw.estimated_duration_days || raw.estimated_duration || 14,
      help_mode: raw.help_mode || "supplies",
      steps: steps,
      reflection_prompts: Array.isArray(raw.reflection_prompts) ? raw.reflection_prompts : [],
      safety_notes: Array.isArray(raw.safety_notes) ? raw.safety_notes : [],
      total_sgxp: totalSgxp,
      completed_step_ids: completed,
      earned_sgxp: earned,
      completion_percent: initialPercent
    };
  }

  function getBandClassForPercent(percent) {
    if (percent >= 100) return "progress-band-100";
    if (percent >= 80) return "progress-band-80";
    if (percent >= 60) return "progress-band-60";
    if (percent >= 40) return "progress-band-40";
    if (percent >= 20) return "progress-band-20";
    return "progress-band-0";
  }

  function syncQuestProgressFromSteps(quest, progressBarEl, summaryEl) {
    const total = quest.total_sgxp || 0;
    let earned = 0;
    quest.steps.forEach(function (s) {
      if (quest.completed_step_ids.indexOf(s.id) !== -1) {
        earned += s.sgxp_reward || 0;
      }
    });
    quest.earned_sgxp = earned;
    const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
    quest.completion_percent = percent;

    if (summaryEl) {
      summaryEl.textContent = "Mission SGXP: " + earned + " / " + total + " (" + percent + "% complete)";
    }
    if (progressBarEl) {
      progressBarEl.style.width = percent + "%";
      progressBarEl.className = "progress-bar " + getBandClassForPercent(percent);
    }
  }

  // ----- QUEST RENDERING ---------------------------------------------------
  function renderQuestView(quest) {
    questOutput.innerHTML = "";

    const card = document.createElement("div");
    card.className = "quest-card";

    const title = document.createElement("h3");
    title.textContent = quest.quest_name;

    const meta = document.createElement("p");
    meta.className = "hint";
    const days = quest.estimated_duration_days || 14;
    meta.textContent = "Difficulty: " + quest.difficulty + " • Estimated duration: " + days + " days";

    const summary = document.createElement("p");
    summary.textContent = quest.mission_summary;

    const sgxpSummary = document.createElement("p");
    sgxpSummary.className = "hint";

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressContainer.appendChild(progressBar);

    const stepsHeader = document.createElement("h4");
    stepsHeader.textContent = "Mission Steps";

    const stepsList = document.createElement("ul");
    stepsList.className = "step-list";

    quest.steps.forEach(function (step) {
      const li = document.createElement("li");
      li.className = "step-item";

      const row = document.createElement("div");
      row.className = "quest-step-row";

      const main = document.createElement("div");
      main.className = "quest-step-main";

      const label = document.createElement("label");
      label.textContent = step.title;

      const desc = document.createElement("div");
      desc.className = "hint";
      desc.textContent = step.description;

      main.appendChild(label);
      main.appendChild(desc);

      const controls = document.createElement("div");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.stepId = String(step.id);

      if (quest.completed_step_ids.indexOf(step.id) !== -1) {
        checkbox.checked = true;
        li.classList.add("step-completed");
      }

      const badge = document.createElement("span");
      badge.className = "sgxp-badge";
      badge.textContent = "+" + (step.sgxp_reward || 0) + " SGXP";

      controls.appendChild(checkbox);
      controls.appendChild(badge);

      row.appendChild(main);
      row.appendChild(controls);
      li.appendChild(row);
      stepsList.appendChild(li);

      checkbox.addEventListener("change", function () {
        const id = step.id;
        const idx = quest.completed_step_ids.indexOf(id);
        if (checkbox.checked) {
          if (idx === -1) quest.completed_step_ids.push(id);
          li.classList.add("step-completed");
        } else {
          if (idx !== -1) quest.completed_step_ids.splice(idx, 1);
          li.classList.remove("step-completed");
        }
        syncQuestProgressFromSteps(quest, progressBar, sgxpSummary);
        upsertSuitLogEntry(quest);
        renderSuitLog();
      });
    });

    syncQuestProgressFromSteps(quest, progressBar, sgxpSummary);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(summary);
    card.appendChild(progressContainer);
    card.appendChild(sgxpSummary);
    card.appendChild(stepsHeader);
    card.appendChild(stepsList);

    if (quest.reflection_prompts && quest.reflection_prompts.length) {
      const reflHeader = document.createElement("h4");
      reflHeader.textContent = "Reflection prompts";
      const reflList = document.createElement("ul");
      quest.reflection_prompts.forEach(function (prompt) {
        const li = document.createElement("li");
        li.textContent = prompt;
        reflList.appendChild(li);
      });
      card.appendChild(reflHeader);
      card.appendChild(reflList);
    }

    if (quest.safety_notes && quest.safety_notes.length) {
      const safeHeader = document.createElement("h4");
      safeHeader.textContent = "Safety notes";
      const safeList = document.createElement("ul");
      quest.safety_notes.forEach(function (note) {
        const li = document.createElement("li");
        li.textContent = note;
        safeList.appendChild(li);
      });
      card.appendChild(safeHeader);
      card.appendChild(safeList);
    }

    questOutput.appendChild(card);
  }

  // ----- SUIT LOG ----------------------------------------------------------
  function upsertSuitLogEntry(quest) {
    // If backend didn't assign an id, keep a single local entry per mission name.
    const keyId = quest.id || 0;
    const existingIndex = state.suitLog.findIndex(function (q) {
      if (keyId !== 0) return q.id === keyId;
      return q.id === 0 && q.quest_name === quest.quest_name && q.created_at === quest.created_at;
    });
    if (existingIndex === -1) {
      state.suitLog.unshift(cloneQuestForLog(quest));
    } else {
      state.suitLog[existingIndex] = cloneQuestForLog(quest);
    }
  }

  function cloneQuestForLog(quest) {
    return {
      id: quest.id,
      created_at: quest.created_at,
      quest_name: quest.quest_name,
      mission_summary: quest.mission_summary,
      help_mode: quest.help_mode,
      difficulty: quest.difficulty,
      total_sgxp: quest.total_sgxp,
      earned_sgxp: quest.earned_sgxp,
      completion_percent: quest.completion_percent
    };
  }

  function getStatusForPercent(percent) {
    if (percent >= 100) return { text: "Complete", cls: "quest-status-complete" };
    if (percent > 0) return { text: "In progress", cls: "quest-status-in-progress" };
    return { text: "Not started", cls: "quest-status-not-started" };
  }

  function getLogTintClass(percent) {
    if (percent >= 100) return "quest-progress-100";
    if (percent >= 75) return "quest-progress-75";
    if (percent >= 50) return "quest-progress-50";
    if (percent >= 25) return "quest-progress-25";
    return "quest-progress-0";
  }

  function getSortedSuitLog() {
    const items = state.suitLog.slice();
    const mode = state.sortMode;
    if (mode === "oldest") {
      items.sort(function (a, b) {
        return new Date(a.created_at) - new Date(b.created_at);
      });
    } else if (mode === "quest-sgxp-high") {
      items.sort(function (a, b) {
        return (b.total_sgxp || 0) - (a.total_sgxp || 0);
      });
    } else if (mode === "quest-sgxp-low") {
      items.sort(function (a, b) {
        return (a.total_sgxp || 0) - (b.total_sgxp || 0);
      });
    } else {
      // recent
      items.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    return items;
  }

  function renderSuitLog() {
    logOutput.innerHTML = "";
    const quests = getSortedSuitLog();
    if (!quests.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "No missions logged yet. Forge a quest to start your Suit Log.";
      logOutput.appendChild(empty);
      return;
    }

    quests.forEach(function (quest) {
      const card = document.createElement("div");
      card.className = "quest-card log-entry-card " + getLogTintClass(quest.completion_percent || 0);
      card.dataset.questId = String(quest.id || 0);

      const header = document.createElement("div");
      header.className = "log-card-header";

      const titleWrap = document.createElement("div");
      titleWrap.className = "log-card-title-wrap";

      const title = document.createElement("h4");
      title.textContent = quest.quest_name;

      const statusInfo = getStatusForPercent(quest.completion_percent || 0);
      const statusPill = document.createElement("span");
      statusPill.className = "quest-status-pill " + statusInfo.cls;
      statusPill.textContent = statusInfo.text;

      titleWrap.appendChild(title);
      titleWrap.appendChild(statusPill);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-quest-btn";
      deleteBtn.textContent = "×";

      header.appendChild(titleWrap);
      header.appendChild(deleteBtn);

      const meta = document.createElement("p");
      meta.className = "hint";
      const when = quest.created_at ? new Date(quest.created_at) : null;
      const whenText = when ? when.toLocaleString() : "just now";
      meta.textContent =
        "Forged: " + whenText + " • Help mode: " + (quest.help_mode || "supplies") + " • Difficulty: " + (quest.difficulty || "Easy");

      const sgxpLine = document.createElement("div");
      sgxpLine.className = "quest-log-sgxp-line";
      const total = quest.total_sgxp || 0;
      const earned = quest.earned_sgxp || 0;
      const pct = quest.completion_percent || 0;
      sgxpLine.textContent = "Quest SGXP: " + earned + " / " + total + " (" + pct + "%)";

      const track = document.createElement("div");
      track.className = "quest-log-progress-track";

      const bar = document.createElement("div");
      bar.className = "quest-log-progress-bar";
      bar.style.width = pct + "%";
      track.appendChild(bar);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(sgxpLine);
      card.appendChild(track);

      card.addEventListener("click", function () {
        // Drill into this mission in the Mission view
        if (state.currentQuest && state.currentQuest.id === quest.id) {
          showSection("quest");
          return;
        }
        // For now, just show the most recently generated quest; in a future
        // revision we could round-trip to the backend and re-render exactly.
        if (state.currentQuest) {
          renderQuestView(state.currentQuest);
          showSection("quest");
        }
      });

      deleteBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        handleDeleteQuest(quest);
      });

      logOutput.appendChild(card);
    });
  }

  async function handleDeleteQuest(quest) {
    // Optimistically remove from local Suit Log + refresh UI
    const id = quest.id || 0;
    const before = state.suitLog.length;
    state.suitLog = state.suitLog.filter(function (q) {
      if (id !== 0) return q.id !== id;
      // Local-dev quests: match on name + created_at
      return !(q.id === 0 && q.quest_name === quest.quest_name && q.created_at === quest.created_at);
    });
    const after = state.suitLog.length;

    if (after !== before) {
      renderSuitLog();
    }

    if (id === 0) {
      // No persistent id to delete; nothing else to do.
      return;
    }

    try {
      const query = state.clientId ? "?client_id=" + encodeURIComponent(state.clientId) : "";
      const resp = await deleteRequest("/quests/" + encodeURIComponent(id) + query);
      if (!resp.ok && resp.status !== 404) {
        console.warn("Backend delete for quest", id, "returned status", resp.status);
      }
    } catch (err) {
      console.warn("Network error while deleting quest", id, err);
    }
  }

  async function clearSuitLog() {
    // Optimistic local clear
    state.suitLog = [];
    renderSuitLog();

    // Soft-call backend; even if it fails, we keep the local wipe.
    try {
      const query = state.clientId ? "?client_id=" + encodeURIComponent(state.clientId) : "";
      const resp = await deleteRequest("/quests" + query);
      if (!resp.ok) {
        console.warn("Backend Clear Suit Log returned status", resp.status);
      }
    } catch (err) {
      console.warn("Network error during Clear Suit Log:", err);
    }
  }

  async function hydrateSuitLogFromBackend() {
    try {
      const query = state.clientId ? "?client_id=" + encodeURIComponent(state.clientId) : "";
      const quests = await getJson("/quests" + query);
      if (!Array.isArray(quests) || quests.length === 0) {
        return;
      }
      state.suitLog = quests.map(normaliseQuest).map(cloneQuestForLog);
      renderSuitLog();
    } catch (err) {
      console.warn("Suit Log hydration from backend failed:", err);
    }
  }

  // ----- BACK BUTTON VISIBILITY -------------------------------------------
  function wireBackButtonVisibility() {
    if (!("IntersectionObserver" in window)) {
      backBtnTop.style.display = "none";
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== backBtn) return;
        if (entry.isIntersecting || logSection.style.display === "none") {
          backBtnTop.style.display = "none";
        } else {
          backBtnTop.style.display = "";
        }
      });
    }, {
      root: null,
      threshold: 0.01
    });

    observer.observe(backBtn);
  }

  // ----- EVENT WIRING ------------------------------------------------------
  generateBtn.addEventListener("click", function () {
    handleGenerateClick();
  });

  confirmMissionBtn.addEventListener("click", function () {
    handleConfirmMission();
  });

  newQuestBtn.addEventListener("click", function () {
    // Reset clarifying state but keep form values.
    state.basePayload = null;
    state.clarifyQuestions = [];
    questionsContainer.innerHTML = "";
    showSection("form");
  });

  viewLogBtn.addEventListener("click", function () {
    renderSuitLog();
    showSection("log");
  });

  backBtn.addEventListener("click", function () {
    if (state.currentQuest) {
      showSection("quest");
    } else {
      showSection("form");
    }
  });

  backBtnTop.addEventListener("click", function () {
    if (state.currentQuest) {
      showSection("quest");
    } else {
      showSection("form");
    }
  });

  deleteAllQuestsBtn.addEventListener("click", function () {
    if (!state.suitLog.length) return;
    clearSuitLog();
  });

  suitLogSortSelect.addEventListener("change", function () {
    state.sortMode = suitLogSortSelect.value || "recent";
    renderSuitLog();
  });

  // ----- INITIALISATION ----------------------------------------------------
  showSection("form");
  wireBackButtonVisibility();
  hydrateSuitLogFromBackend();
})();