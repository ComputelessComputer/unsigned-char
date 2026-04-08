mod permissions;

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use permissions::{PermissionKind, PermissionSnapshot};
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OnboardingState {
    product_name: &'static str,
    engine: &'static str,
    reference: &'static str,
    permissions: PermissionSnapshot,
    ready: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MarkdownExport {
    title: String,
    created_at: String,
    updated_at: String,
    status: String,
    transcript: String,
}

#[tauri::command]
fn onboarding_state() -> Result<OnboardingState, String> {
    let permissions = permissions::snapshot()?;

    Ok(OnboardingState {
        product_name: "unsigned char",
        engine: "Qwen ASR",
        reference: "fastrepl/char",
        ready: permissions.ready(),
        permissions,
    })
}

#[tauri::command]
fn request_permission(permission: PermissionKind) -> Result<permissions::PermissionStatus, String> {
    permissions::request(permission)
}

#[tauri::command]
fn open_permission_settings(permission: PermissionKind) -> Result<(), String> {
    permissions::open_settings(permission)
}

#[tauri::command]
fn save_meeting_markdown<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    export: MarkdownExport,
) -> Result<String, String> {
    let target_dir = app
        .path()
        .document_dir()
        .map_err(|error| error.to_string())?
        .join("unsigned char");

    std::fs::create_dir_all(&target_dir).map_err(|error| error.to_string())?;

    let file_name = format!(
        "{}-{}.md",
        sanitize_path_component(&export.title),
        sanitize_path_component(&export.created_at)
    );
    let file_path = unique_path(target_dir.join(file_name));

    std::fs::write(&file_path, build_markdown(&export)).map_err(|error| error.to_string())?;

    Ok(file_path.display().to_string())
}

fn build_markdown(export: &MarkdownExport) -> String {
    format!(
        "# {title}\n\n- Created: {created_at}\n- Updated: {updated_at}\n- Status: {status}\n\n## Transcript\n\n{transcript}\n",
        title = export.title.trim(),
        created_at = export.created_at.trim(),
        updated_at = export.updated_at.trim(),
        status = export.status.trim(),
        transcript = if export.transcript.trim().is_empty() {
            "_No transcript yet._".to_string()
        } else {
            export.transcript.trim().to_string()
        }
    )
}

fn sanitize_path_component(input: &str) -> String {
    let mut output = String::with_capacity(input.len());
    let mut last_was_dash = false;

    for character in input.chars() {
        let normalized = if character.is_ascii_alphanumeric() {
            last_was_dash = false;
            character.to_ascii_lowercase()
        } else if !last_was_dash {
            last_was_dash = true;
            '-'
        } else {
            continue;
        };

        output.push(normalized);
    }

    let output = output.trim_matches('-');
    if output.is_empty() {
        "meeting".to_string()
    } else {
        output.to_string()
    }
}

fn unique_path(path: PathBuf) -> PathBuf {
    if !path.exists() {
        return path;
    }

    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("meeting");
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or("md");
    let parent = path.parent().map(PathBuf::from).unwrap_or_default();

    for index in 2..1000 {
        let candidate = parent.join(format!("{stem}-{index}.{extension}"));
        if !candidate.exists() {
            return candidate;
        }
    }

    parent.join(format!("{stem}-copy.{extension}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            onboarding_state,
            request_permission,
            open_permission_settings,
            save_meeting_markdown
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
