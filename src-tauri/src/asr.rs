use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tracing::info;

#[cfg(target_os = "macos")]
use swift_rs::{swift, Bool, SRString};

#[cfg(target_os = "macos")]
swift!(fn _speech_model_cache_dir() -> SRString);
#[cfg(target_os = "macos")]
swift!(fn _speech_model_download_state() -> SRString);
#[cfg(target_os = "macos")]
swift!(fn _speech_model_start_download() -> Bool);
#[cfg(target_os = "macos")]
swift!(fn _speech_model_reset() -> Bool);
#[cfg(target_os = "macos")]
swift!(fn _speech_live_transcription_start() -> SRString);
#[cfg(target_os = "macos")]
swift!(fn _speech_live_transcription_state() -> SRString);
#[cfg(target_os = "macos")]
swift!(fn _speech_live_transcription_stop() -> SRString);

#[derive(Default)]
pub struct TranscriptionManager;

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveTranscriptionState {
    pub running: bool,
    pub text: String,
    pub error: Option<String>,
}

#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeechModelDownloadState {
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub current_file: Option<String>,
    #[serde(default)]
    pub error: Option<String>,
}

impl TranscriptionManager {
    pub fn start(&mut self, _model_path: &Path) -> Result<LiveTranscriptionState, String> {
        let _ = self.stop();
        info!("Starting speech-swift transcription session");
        speech_live_transcription_start()
    }

    pub fn preload(&mut self, _model_path: &Path) {}

    pub fn clear_preload(&mut self) {}

    pub fn request_stop(&mut self) -> Result<LiveTranscriptionState, String> {
        info!("Requesting speech-swift transcription shutdown");
        speech_live_transcription_stop()
    }

    pub fn state(&mut self) -> Result<LiveTranscriptionState, String> {
        speech_live_transcription_state()
    }

    pub fn stop(&mut self) -> Result<LiveTranscriptionState, String> {
        speech_live_transcription_stop()
    }
}

pub fn managed_model_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        let path = unsafe { _speech_model_cache_dir() };
        Ok(PathBuf::from(path.as_str()))
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

pub fn managed_model_download_state() -> Result<SpeechModelDownloadState, String> {
    #[cfg(target_os = "macos")]
    {
        decode_json(
            unsafe { _speech_model_download_state() },
            "speech-swift model download state",
        )
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

pub fn start_managed_model_download() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if unsafe { _speech_model_start_download() } {
            return Ok(());
        }

        Err("Failed to start the speech-swift model download.".to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

pub fn reset_managed_model() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if unsafe { _speech_model_reset() } {
            return Ok(());
        }

        Err("Failed to reset the speech-swift model state.".to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

fn speech_live_transcription_start() -> Result<LiveTranscriptionState, String> {
    #[cfg(target_os = "macos")]
    {
        decode_json(
            unsafe { _speech_live_transcription_start() },
            "speech-swift transcription state",
        )
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

fn speech_live_transcription_state() -> Result<LiveTranscriptionState, String> {
    #[cfg(target_os = "macos")]
    {
        decode_json(
            unsafe { _speech_live_transcription_state() },
            "speech-swift transcription state",
        )
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

fn speech_live_transcription_stop() -> Result<LiveTranscriptionState, String> {
    #[cfg(target_os = "macos")]
    {
        decode_json(
            unsafe { _speech_live_transcription_stop() },
            "speech-swift transcription state",
        )
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("speech-swift is only available on macOS.".to_string())
    }
}

#[cfg(target_os = "macos")]
fn decode_json<T>(value: SRString, label: &str) -> Result<T, String>
where
    T: for<'de> Deserialize<'de>,
{
    serde_json::from_str(value.as_str())
        .map_err(|error| format!("Failed to decode {label}: {error}"))
}
