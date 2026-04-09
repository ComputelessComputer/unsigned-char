Place the bundled Qwen ASR model files in this directory.

Packaged Tauri builds copy `src-tauri/resources/models/**` into the app bundle,
and the app resolves the default bundled model from `models/qwen-asr`.

This placeholder keeps the directory in git. The app only treats the bundle as
ready when it finds likely model artifacts such as `.gguf`, `.onnx`, `.bin`,
or `.safetensors` files here.
