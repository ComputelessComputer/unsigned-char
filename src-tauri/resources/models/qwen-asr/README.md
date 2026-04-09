Place the bundled Qwen3-ASR model files in this directory.

Packaged Tauri builds copy `src-tauri/resources/models/**` into the app bundle,
and the app resolves the default bundled model from `models/qwen-asr`.

This placeholder keeps the directory in git. The app only treats the bundle as
ready when it finds `vocab.json` plus `model.safetensors` or `model-*.safetensors`
files here. Release builds now fail if those files are missing so packaged apps
cannot ship without a working bundled ASR model.
