fn main() {
    #[cfg(target_os = "macos")]
    {
        swift_rs::SwiftLinker::new("14.2")
            .with_package("permissions-swift", "./swift-permissions/")
            .link();
    }

    println!("cargo:rerun-if-changed=resources/models/qwen-asr");

    tauri_build::build()
}
