// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::debug;
use tauri::{
    App, AppHandle, Builder, CustomMenuItem, Manager, RunEvent, Runtime, SystemTray,
    SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, WindowEvent,
};
use window_shadows::set_shadow;

mod binding;
mod config;
mod constants;
mod open;
mod setting;
#[cfg(target_os = "macos")]
mod ffi;

use crate::binding::{get_bindings, set_bindings};
use crate::open::open_key;
use crate::setting::{get_settings, set_settings};

#[cfg(target_os = "macos")]
fn build_app<T>(builder: Builder<T>) -> App<T>
where
    T: Runtime,
{
    let mut app = builder.build(tauri::generate_context!()).unwrap();
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);
    app
}

#[cfg(not(target_os = "macos"))]
fn build_app<T>(builder: Builder<T>) -> App<T>
where
    T: Runtime,
{
    let app = builder.build(tauri::generate_context!()).unwrap();
    app
}

fn build_tray() -> SystemTray {
    #[cfg(target_os="macos")]
    let accelerator = "Command";

    #[cfg(not(target_os="macos"))]
    let accelerator = "Control";

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show Window")
            .accelerator(format!("{}+S", &accelerator)))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit")
            .accelerator(format!("{}+Q", &accelerator)));

    SystemTray::new().with_menu(tray_menu)
}

fn tray_event(app_handle: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "quit" => {
                std::process::exit(0);
            }
            "show" => {
                debug!("Show Request");
                let window = app_handle.get_window("main").unwrap();

                #[cfg(target_os = "macos")]
                tauri::AppHandle::show(&window.app_handle()).unwrap();

                #[cfg(not(target_os = "macos"))]
                window.show().unwrap();

                window.set_focus().unwrap();
            }
            _ => {}
        },
        _ => {}
    }
}

fn main_loop(app_handle: &AppHandle, event: RunEvent) {
    match event {
        RunEvent::WindowEvent { label, event, .. } => match event {
            WindowEvent::CloseRequested { api, .. } => {
                debug!("Hide Request");

                #[cfg(target_os = "macos")]
                tauri::AppHandle::hide(
                    &app_handle.get_window(label.as_str()).unwrap().app_handle(),
                )
                .unwrap();

                #[cfg(not(target_os = "macos"))]
                app_handle
                    .get_window(label.as_str())
                    .unwrap()
                    .hide()
                    .unwrap();

                api.prevent_close();
            }
            _ => {}
        },
        _ => {}
    }
}

fn main() {
    env_logger::init();

    let builder = tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_window("main") {
                set_shadow(&window, true).unwrap();
            }
            Ok(())
        })
        .system_tray(build_tray())
        .on_system_tray_event(tray_event)
        .invoke_handler(tauri::generate_handler![
            get_bindings,
            set_bindings,
            open_key,
            get_settings,
            set_settings,
        ]);

    let app = build_app(builder);

    // 如果启动显示窗口，就显示
    if !get_settings().hidden_mode {
        println!("show windows");
        app.get_window("main").unwrap().show().unwrap();
    }

    app.run(main_loop);
}
