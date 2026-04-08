use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppBlueprint {
    product_name: &'static str,
    engine: &'static str,
    sources: [&'static str; 2],
    reference: &'static str,
}

#[tauri::command]
fn app_blueprint() -> AppBlueprint {
    AppBlueprint {
        product_name: "unsigned char",
        engine: "Qwen ASR",
        sources: ["mic", "system"],
        reference: "../char",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_blueprint])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
