use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};

/// Called from the web app whenever the streak or today's status changes, so
/// the menu-bar icon reflects it without the window needing to be open.
#[tauri::command]
fn set_tray_status(app: tauri::AppHandle, text: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_title(Some(text)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_tray_status])
        .setup(|app| {
            let handle = app.handle();

            let show_item = MenuItemBuilder::with_id("show", "Show Meal Plan").build(handle)?;
            let menu = MenuBuilder::new(handle)
                .item(&show_item)
                .separator()
                .quit()
                .build()?;

            TrayIconBuilder::with_id("main-tray")
                .icon(handle.default_window_icon().cloned().unwrap())
                .tooltip("Meal Plan")
                .title("Meal Plan")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    if event.id().as_ref() == "show" {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(handle)?;

            // Closing the window hides it instead of quitting, since the tray
            // icon is the app's real "always running" home. Quit lives in the
            // tray menu.
            if let Some(window) = app.get_webview_window("main") {
                let window_to_hide = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_to_hide.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
