use std::{env, fs, path::PathBuf};

fn main() {
    #[cfg(target_os = "macos")]
    {
        swift_rs::SwiftLinker::new("14.2")
            .with_package("permissions-swift", "./swift-permissions/")
            .link();
    }

    println!("cargo:rerun-if-changed=resources/models/qwen-asr");

    if env::var("PROFILE").ok().as_deref() == Some("release") {
        assert_bundled_model_ready();
    }

    tauri_build::build()
}

fn assert_bundled_model_ready() {
    let model_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("resources")
        .join("models")
        .join("qwen-asr");

    let entries = fs::read_dir(&model_path).unwrap_or_else(|error| {
        panic!(
            "Release builds require a bundled Qwen3-ASR model at {}: {error}",
            model_path.display()
        )
    });

    let mut has_vocab = false;
    let mut has_model = false;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let Some(file_name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        let file_name = file_name.to_ascii_lowercase();

        if file_name == "vocab.json" {
            has_vocab = true;
            continue;
        }

        if file_name == "model.safetensors"
            || (file_name.starts_with("model-") && file_name.ends_with(".safetensors"))
        {
            has_model = true;
        }
    }

    if !has_vocab || !has_model {
        panic!(
            "Release builds require a bundled Qwen3-ASR snapshot at {} with vocab.json and model safetensors files.",
            model_path.display()
        );
    }
}
