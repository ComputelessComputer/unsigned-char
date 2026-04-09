import { invoke } from "@tauri-apps/api/core";

type PermissionKind = "microphone" | "systemAudio";
type PermissionStatus = "neverRequested" | "authorized" | "denied";
type View = "onboarding" | "home" | "meeting";
type MeetingStatus = "live" | "done";

type OnboardingState = {
  productName: string;
  engine: string;
  reference: string;
  permissions: Record<PermissionKind, PermissionStatus>;
  ready: boolean;
};

type Meeting = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: MeetingStatus;
  transcript: string[];
  exportPath: string | null;
};

type MarkdownExport = {
  title: string;
  createdAt: string;
  updatedAt: string;
  status: MeetingStatus;
  transcript: string;
};

const STORE_KEY = "unsigned-char-meetings";
const appRoot: HTMLElement = (() => {
  const node = document.querySelector<HTMLElement>("#app");
  if (!node) {
    throw new Error("Missing app root");
  }
  return node;
})();

const state = {
  view: "onboarding" as View,
  onboarding: null as OnboardingState | null,
  meetings: loadMeetings(),
  activeMeetingId: null as string | null,
  permissionBusy: null as PermissionKind | null,
  permissionNote: "",
  saveBusy: false,
  meetingNote: "",
  permissionPollId: 0 as number | undefined,
};

function loadMeetings(): Meeting[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isMeeting);
  } catch {
    return [];
  }
}

function isMeeting(value: unknown): value is Meeting {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    (candidate.status === "live" || candidate.status === "done") &&
    Array.isArray(candidate.transcript) &&
    (typeof candidate.exportPath === "string" || candidate.exportPath === null)
  );
}

function persistMeetings() {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state.meetings));
}

function sortedMeetings() {
  return [...state.meetings].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function getActiveMeeting() {
  return state.meetings.find((meeting) => meeting.id === state.activeMeetingId) ?? null;
}

function updateMeeting(id: string, updater: (meeting: Meeting) => Meeting) {
  state.meetings = state.meetings.map((meeting) =>
    meeting.id === id ? updater(meeting) : meeting,
  );
  persistMeetings();
}

function createMeeting() {
  const createdAt = new Date().toISOString();
  const meeting: Meeting = {
    id: crypto.randomUUID(),
    title: buildMeetingTitle(createdAt),
    createdAt,
    updatedAt: createdAt,
    status: "live",
    transcript: [],
    exportPath: null,
  };

  state.meetings = [meeting, ...state.meetings];
  state.activeMeetingId = meeting.id;
  state.view = "meeting";
  state.meetingNote = "";
  persistMeetings();
  render();
}

function buildMeetingTitle(iso: string) {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Meeting ${datePart} ${timePart}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function permissionActionLabel(permission: PermissionKind, status: PermissionStatus) {
  const label = permission === "microphone" ? "Mic" : "System audio";

  if (state.permissionBusy === permission) {
    return `${label} working...`;
  }
  if (status === "authorized") {
    return `${label} granted`;
  }
  if (status === "denied") {
    return `${label} settings`;
  }
  return `Allow ${label.toLowerCase()}`;
}

function renderOnboarding() {
  const onboarding = state.onboarding;
  if (!onboarding) {
    return `<section class="screen onboarding"><p class="body">Loading permissions...</p></section>`;
  }

  const rows = (["microphone", "systemAudio"] as PermissionKind[])
    .map((permission) => {
      const status = onboarding.permissions[permission];

      return `
        <div class="permission-item">
          <button
            class="button secondary"
            data-permission-action="${permission}"
            ${status === "authorized" || state.permissionBusy === permission ? "disabled" : ""}
            type="button"
          >
            ${permissionActionLabel(permission, status)}
          </button>
        </div>
      `;
    })
    .join("");

  return `
    <section class="screen onboarding">
      <div class="permission-simple-list">${rows}</div>
    </section>
  `;
}

function renderHome() {
  const items = sortedMeetings();
  const content =
    items.length === 0
      ? `
        <div class="empty-state">
          <p class="empty-title">No meetings yet</p>
          <p class="body">
            Create a meeting from the button below and transcripts will show up here.
          </p>
        </div>
      `
      : `
        <div class="meeting-list">
          ${items
            .map((meeting) => {
              const preview = meeting.transcript[meeting.transcript.length - 1] ?? "No transcript yet";
              return `
                <button class="meeting-row" data-open-meeting="${meeting.id}" type="button">
                  <div class="meeting-row-copy">
                    <div class="meeting-row-top">
                      <h2>${escapeHtml(meeting.title)}</h2>
                      <span class="status-badge ${meeting.status}">${meeting.status}</span>
                    </div>
                    <p class="meeting-preview">${escapeHtml(preview)}</p>
                    <p class="meeting-meta">
                      ${formatDate(meeting.updatedAt)} · ${meeting.transcript.length} lines
                    </p>
                  </div>
                </button>
              `;
            })
            .join("")}
        </div>
      `;

  return `
    <section class="screen home">
      <header class="screen-header screen-header-row">
        <div class="screen-header-copy">
          <p class="eyebrow">Home</p>
          <h1>Meetings</h1>
          <p class="body">Your saved transcripts live here.</p>
        </div>
        <button class="button primary header-action" id="new-meeting" type="button">
          New meeting
        </button>
      </header>

      ${content}
    </section>
  `;
}

function renderMeeting() {
  const meeting = getActiveMeeting();
  if (!meeting) {
    state.view = "home";
    return renderHome();
  }

  const transcript =
    meeting.transcript.length === 0
      ? `
        <div class="empty-state transcript-empty">
          <p class="empty-title">Live transcript</p>
          <p class="body">
            Transcript lines will appear here. For now, use the input below to simulate live text.
          </p>
        </div>
      `
      : `
        <div class="transcript-list">
          ${meeting.transcript
            .map(
              (line, index) => `
                <article class="transcript-line">
                  <span class="line-index">${index + 1}</span>
                  <p>${escapeHtml(line)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      `;

  const note = state.meetingNote || meeting.exportPath || "";

  return `
    <section class="screen meeting">
      <header class="meeting-header">
        <button class="back-button" id="back-home" type="button">Back</button>
        <div class="meeting-heading">
          <p class="eyebrow">Meeting</p>
          <h1>${escapeHtml(meeting.title)}</h1>
          <p class="meeting-subtitle">
            <span class="status-badge ${meeting.status}">${meeting.status}</span>
            <span>${formatTime(meeting.createdAt)}</span>
          </p>
        </div>
      </header>

      <div class="meeting-actions">
        <button class="button ghost" id="toggle-meeting-status" type="button">
          ${meeting.status === "live" ? "End live" : "Resume"}
        </button>
        <button class="button secondary" id="save-markdown" type="button" ${
          state.saveBusy ? "disabled" : ""
        }>
          ${state.saveBusy ? "Saving..." : "Save .md"}
        </button>
      </div>

      <section class="transcript-panel" id="transcript-panel">
        ${transcript}
      </section>

      <form class="composer" id="transcript-form">
        <input
          id="transcript-input"
          class="composer-input"
          name="line"
          autocomplete="off"
          placeholder="Add a transcript line"
        />
        <button class="button primary" type="submit">Add</button>
      </form>

      <p class="meta meeting-note">${escapeHtml(note)}</p>
    </section>
  `;
}

function render() {
  const markup =
    state.view === "onboarding"
      ? renderOnboarding()
      : state.view === "home"
        ? renderHome()
        : renderMeeting();

  appRoot.innerHTML = markup;
  bindViewHandlers();

  if (state.view === "meeting") {
    const panel = document.querySelector<HTMLElement>("#transcript-panel");
    if (panel) {
      panel.scrollTop = panel.scrollHeight;
    }
  }
}

function bindViewHandlers() {
  if (state.view === "onboarding") {
    (["microphone", "systemAudio"] as PermissionKind[]).forEach((permission) => {
      document
        .querySelector<HTMLButtonElement>(`[data-permission-action="${permission}"]`)
        ?.addEventListener("click", () => {
          void handlePermissionAction(permission);
        });
    });
    return;
  }

  if (state.view === "home") {
    document.querySelector<HTMLButtonElement>("#new-meeting")?.addEventListener("click", () => {
      createMeeting();
    });

    document.querySelectorAll<HTMLElement>("[data-open-meeting]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.openMeeting;
        if (!id) {
          return;
        }

        state.activeMeetingId = id;
        state.meetingNote = "";
        state.view = "meeting";
        render();
      });
    });
    return;
  }

  const meeting = getActiveMeeting();
  if (!meeting) {
    return;
  }

  document.querySelector<HTMLButtonElement>("#back-home")?.addEventListener("click", () => {
    state.activeMeetingId = null;
    state.meetingNote = "";
    state.view = "home";
    render();
  });

  document
    .querySelector<HTMLButtonElement>("#toggle-meeting-status")
    ?.addEventListener("click", () => {
      updateMeeting(meeting.id, (current) => ({
        ...current,
        status: current.status === "live" ? "done" : "live",
        updatedAt: new Date().toISOString(),
      }));
      state.meetingNote = "";
      render();
    });

  document
    .querySelector<HTMLButtonElement>("#save-markdown")
    ?.addEventListener("click", () => {
      void saveMeetingAsMarkdown(meeting);
    });

  document
    .querySelector<HTMLFormElement>("#transcript-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>("#transcript-input");
      const line = input?.value.trim() ?? "";
      if (!line) {
        return;
      }

      updateMeeting(meeting.id, (current) => ({
        ...current,
        transcript: [...current.transcript, line],
        updatedAt: new Date().toISOString(),
      }));
      state.meetingNote = "";
      render();
    });
}

async function handlePermissionAction(permission: PermissionKind) {
  const onboarding = state.onboarding;
  if (!onboarding) {
    return;
  }

  state.permissionBusy = permission;
  render();

  try {
    const current = onboarding.permissions[permission];
    if (current === "denied") {
      await invoke("open_permission_settings", { permission });
      state.permissionNote = "System Settings opened. Enable access there, then come back.";
    } else {
      await invoke("request_permission", { permission });
      state.permissionNote = "";
    }

    await refreshOnboarding(true);
  } catch (error) {
    state.permissionNote = `Permission flow failed: ${String(error)}`;
  } finally {
    state.permissionBusy = null;
    render();
  }
}

async function refreshOnboarding(silent = false) {
  try {
    const onboarding = await invoke<OnboardingState>("onboarding_state");
    state.onboarding = onboarding;

    if (onboarding.ready) {
      stopPermissionPolling();
      if (state.view === "onboarding") {
        state.view = "home";
      }
    } else {
      state.view = "onboarding";
      startPermissionPolling();
    }
  } catch (error) {
    if (!silent) {
      state.permissionNote = `Failed to load permissions: ${String(error)}`;
    }
  }

  render();
}

function startPermissionPolling() {
  if (state.permissionPollId) {
    return;
  }

  state.permissionPollId = window.setInterval(() => {
    void refreshOnboarding(true);
  }, 2000);
}

function stopPermissionPolling() {
  if (!state.permissionPollId) {
    return;
  }

  window.clearInterval(state.permissionPollId);
  state.permissionPollId = undefined;
}

async function saveMeetingAsMarkdown(meeting: Meeting) {
  state.saveBusy = true;
  state.meetingNote = "";
  render();

  const exportPayload: MarkdownExport = {
    title: meeting.title,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
    status: meeting.status,
    transcript: meeting.transcript.join("\n\n"),
  };

  try {
    const path = await invoke<string>("save_meeting_markdown", { export: exportPayload });
    updateMeeting(meeting.id, (current) => ({
      ...current,
      exportPath: path,
      updatedAt: new Date().toISOString(),
    }));
    state.meetingNote = `Saved to ${path}`;
  } catch (error) {
    state.meetingNote = `Save failed: ${String(error)}`;
  } finally {
    state.saveBusy = false;
    render();
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await refreshOnboarding();
});
