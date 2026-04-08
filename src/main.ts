import { invoke } from "@tauri-apps/api/core";

type SourceKey = "mic" | "system";

type AppBlueprint = {
  productName: string;
  engine: string;
  sources: string[];
  reference: string;
};

const state = {
  running: false,
  activeSources: new Set<SourceKey>(["mic", "system"]),
};

function updateSourceSummary() {
  const summary = document.querySelector<HTMLElement>("#source-summary");
  if (!summary) {
    return;
  }

  const active = [...state.activeSources];
  if (active.length === 0) {
    summary.textContent = "Selected: none. Pick at least one source to shape the capture flow.";
    return;
  }

  const labels = active.map((source) =>
    source === "mic" ? "microphone" : "system audio",
  );
  summary.textContent = `Selected: ${labels.join(" and ")}`;
}

function updateSessionState() {
  const sessionState = document.querySelector<HTMLElement>("#session-state");
  const sessionNote = document.querySelector<HTMLElement>("#session-note");
  const toggle = document.querySelector<HTMLButtonElement>("#session-toggle");
  const stages = document.querySelectorAll<HTMLElement>("[data-stage]");

  if (!sessionState || !sessionNote || !toggle) {
    return;
  }

  if (state.running) {
    sessionState.textContent = "Local session running";
    sessionNote.textContent =
      "This is still a scaffold, but the UI now reflects a live local-only transcription session.";
    toggle.textContent = "Stop simulated session";
  } else {
    sessionState.textContent = "Ready to wire native audio capture";
    sessionNote.textContent =
      "UI scaffold only. Native capture and Qwen inference are the next integration steps.";
    toggle.textContent = "Simulate local session";
  }

  stages.forEach((stage, index) => {
    const isActive = state.running || index === 0;
    stage.classList.toggle("is-active", isActive);
  });
}

function bindSourceChips() {
  const chips = document.querySelectorAll<HTMLButtonElement>("[data-source]");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const source = chip.dataset.source as SourceKey | undefined;
      if (!source) {
        return;
      }

      if (state.activeSources.has(source) && state.activeSources.size > 1) {
        state.activeSources.delete(source);
      } else {
        state.activeSources.add(source);
      }

      chip.classList.toggle("is-active", state.activeSources.has(source));
      updateSourceSummary();
    });
  });
}

async function loadBlueprint() {
  const blueprint = await invoke<AppBlueprint>("app_blueprint");

  document.title = blueprint.productName;
  document.querySelector("#engine-name")!.textContent = blueprint.engine;
  document.querySelector("#reference-engine")!.textContent = blueprint.engine;
  document.querySelector("#reference-path")!.textContent = blueprint.reference;

  const requestedSources = new Set(
    blueprint.sources
      .map((source) => source.toLowerCase())
      .filter((source): source is SourceKey => source === "mic" || source === "system"),
  );

  if (requestedSources.size > 0) {
    state.activeSources = requestedSources;
    document.querySelectorAll<HTMLButtonElement>("[data-source]").forEach((chip) => {
      const source = chip.dataset.source as SourceKey | undefined;
      chip.classList.toggle("is-active", Boolean(source && state.activeSources.has(source)));
    });
    updateSourceSummary();
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  bindSourceChips();
  updateSourceSummary();
  updateSessionState();

  document.querySelector<HTMLButtonElement>("#session-toggle")?.addEventListener("click", () => {
    state.running = !state.running;
    updateSessionState();
  });

  try {
    await loadBlueprint();
  } catch (error) {
    const note = document.querySelector<HTMLElement>("#session-note");
    if (note) {
      note.textContent = `Failed to load native app blueprint: ${String(error)}`;
    }
  }
});
