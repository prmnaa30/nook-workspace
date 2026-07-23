use crate::ws_server::AppState;
use tauri_plugin_opener::OpenerExt;

#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::{BOOL, HWND, LPARAM};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowTextW, IsIconic, SetForegroundWindow, ShowWindow, SW_RESTORE, SW_SHOW,
};
#[cfg(target_os = "windows")]
struct BrowserSearchState {
    targets: Vec<String>,
    found_hwnd: Option<HWND>,
}
#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_browser_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let state = &mut *(lparam as *mut BrowserSearchState);
    let mut buffer = [0u16; 512];

    let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
    if len > 0 {
        let title = String::from_utf16_lossy(&buffer[..len as usize]).to_lowercase();
        for target in &state.targets {
            if title.contains(target) {
                state.found_hwnd = Some(hwnd);
                return 0;
            }
        }
    }
    1
}
#[cfg(target_os = "windows")]
fn focus_browser_window(browser_path: Option<&str>) -> bool {
    let mut targets = vec![];

    if let Some(path) = browser_path {
        let stem = std::path::Path::new(path)
            .file_stem()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default();
        if !stem.is_empty() {
            if stem == "msedge" {
                targets.push("edge".to_string());
            } else {
                targets.push(stem);
            }
        }
    }

    if targets.is_empty() {
        targets = vec![
            "brave".to_string(),
            "chrome".to_string(),
            "edge".to_string(),
            "firefox".to_string(),
        ];
    }
    let mut state = BrowserSearchState {
        targets,
        found_hwnd: None,
    };
    unsafe {
        EnumWindows(
            Some(enum_browser_window_callback),
            &mut state as *mut BrowserSearchState as LPARAM,
        );
        if let Some(hwnd) = state.found_hwnd {
            if IsIconic(hwnd) != 0 {
                ShowWindow(hwnd, SW_RESTORE);
            } else {
                ShowWindow(hwnd, SW_SHOW);
            }
            SetForegroundWindow(hwnd);
            return true;
        }
    }
    false
}

#[cfg(not(target_os = "windows"))]
fn focus_browser_window(_browser_path: Option<&str>) -> bool {
    false
}

#[tauri::command]
pub async fn execute_shortcut(
    app: tauri::AppHandle,
    path: String,
    shortcut_type: String,
    browser: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    match shortcut_type.as_str() {
        "web" => {
            let msg = serde_json::json!({
                "action": "open_or_focus",
                "url": path
            })
            .to_string();
            if state.ws_sender.receiver_count() > 0 {
                let _ = state.ws_sender.send(msg);

                focus_browser_window(browser.as_deref());

                return Ok(());
            }
            if let Some(browser_exe) = browser {
                if !browser_exe.trim().is_empty() {
                    let _ = std::process::Command::new(browser_exe)
                        .arg(&path)
                        .spawn()
                        .map_err(|e| format!("Failed to open browser: {}", e))?;
                    return Ok(());
                }
            }
            app.opener()
                .open_url(&path, None::<&str>)
                .map_err(|e| e.to_string())?;
        }

        "folder" | "file" => {
            app.opener()
                .open_path(&path, None::<&str>)
                .map_err(|e| e.to_string())?;
        }

        _ => return Err("Unknown shortcut type.".to_string()),
    }

    Ok(())
}

#[tauri::command]
pub async fn open_main_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(float_win) = app.get_webview_window("floating") {
        let _ = float_win.hide();
    }
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.unminimize();
        let _ = main_win.show();
        let _ = main_win.set_focus();
    }
    Ok(())
}

#[tauri::command]
pub async fn resize_floating_window(app: tauri::AppHandle, width: f64, height: f64) -> Result<(), String> {
    use tauri::{Manager, LogicalSize};
    if let Some(float_win) = app.get_webview_window("floating") {
        let _ = float_win.set_size(LogicalSize::new(width, height));
    }
    Ok(())
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
