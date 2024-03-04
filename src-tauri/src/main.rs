// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, process::Command};

use binding::*;
use log::debug;
use tauri::{SystemTray, SystemTrayEvent, Manager, RunEvent, WindowEvent, SystemTrayMenu, CustomMenuItem};

mod config;
mod binding;

#[cfg(target_os = "linux")]
const OPEN: &str = "xdg-open";
#[cfg(target_os = "windows")]
const OPEN: &str = "explorer";
#[cfg(target_os = "macos")]
const OPEN: &str = "open";

fn if_bool_config_true(key: &str, default: bool) -> bool {
    if let Some(k) = get_binding_from_key(key) {
        k == "1".to_string()
    } else {
        default
    }
}

fn toggle_bool_config(key: &str, default: bool) {
    if if_bool_config_true(key, default) {
        set_binding_from_key(key, 0);
    } else {
        set_binding_from_key(key, 1);
    }
    save_binding();
}

#[tauri::command]
fn get_system() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
}

#[tauri::command]
fn register(f : String, target_path : String) {
    debug!("New Register {} -> {}", &f, &target_path);
    set_binding_from_key(f, target_path);
    save_binding();
}

#[tauri::command]
fn open(f : String) {
    if let Some(target_path) = get_binding_from_key(&f) {
        if target_path.is_empty() {
            debug!("Empty Binding {}", &f);
            return;
        }

        debug!("Open Key Binding {} -> {}", &f, &target_path);

        let mut command = Command::new(OPEN);
        command.arg(&target_path);

        let result = command.output().unwrap();

        // 如果没有成功，就尝试直接运行这个东西
        if !result.status.success() {
            debug!("Open Key Binding {} -> {} Failed", &f, &target_path);
            debug!("Try to run directly");
            let mut target_command = Command::new(target_path);
            let _ = target_command.spawn();
        }
    } else {
        debug!("Key Binding {} not found", &f);
    }
}

#[tauri::command]
fn get_binding() -> HashMap<String, String> {
    let mut binding = get_whole_binding();

    let mut remove_keys = vec![];
    for (key, value) in binding.iter() {
        if value.is_empty() {
            remove_keys.push(key.clone());
        }
    }

    if !remove_keys.is_empty() {
        // 删除
        for key in remove_keys.iter_mut() {
            binding.remove(key);
        }
        // 保存
        set_whole_binding(binding.clone());
        save_binding();

        debug!("Clean Up Binding: {:?}", &binding);
    }

    binding
}

#[tauri::command]
fn get_settings() -> HashMap<String, bool> {
    let mut map = HashMap::new();
    map.insert("startup".to_string(), config::startup_exists());
    map.insert("show_when_open".to_string(), if_bool_config_true("show_when_open", true));
    map.insert("dark_mod".to_string(), if_bool_config_true("dark_mod", false));
    map
}

#[tauri::command]
fn toggle_settings(name: String) -> bool {
    debug!("Toggle setting {}", name);
    match name.as_str() {
        "startup" => {
            config::toggle_startup()
        },
        "show_when_open" => {
            toggle_bool_config("show_when_open", true);
            true
        },
        "dark_mod" => {
            toggle_bool_config("dark_mod", false);
            true
        },
        _ => { true }
    }
}

fn main() {
    env_logger::init();
    config::init();
    load_binding();

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show Window").accelerator("Command+S"))
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit").accelerator("Command+Q"));

    let tray = SystemTray::new()
        .with_menu(tray_menu);

    let mut app = tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app_handle, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            std::process::exit(0);
                        },
                        "show" => {
                            debug!("Show Request");
                            let window = app_handle.get_window("main").unwrap();

                            #[cfg(target_os = "macos")]
                            tauri::AppHandle::show(
                                &window.app_handle()
                            ).unwrap();

                            #[cfg(target_os = "linux")]
                            window.show().unwrap();

                            window.set_focus().unwrap();
                        },
                        _ => {}
                    }
                },
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            register,
            open,
            get_binding,
            get_settings,
            toggle_settings,
            get_system,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    // 如果启动显示窗口，就显示
    if if_bool_config_true("show_when_open", true) {
        app.get_window("main").unwrap().show().unwrap();
    }

    app.run(|app_handle, event| {
        match event {
            RunEvent::WindowEvent { label, event, .. } => {
                match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        debug!("Hide Request");

                        #[cfg(target_os = "macos")]
                        tauri::AppHandle::hide(
                            &app_handle.get_window(label.as_str())
                            .unwrap().app_handle()
                        ).unwrap();

                        #[cfg(target_os = "linux")]
                        app_handle.get_window(label.as_str())
                            .unwrap().hide().unwrap();

                        api.prevent_close();
                    },
                    _ => {}
                }
            },
            _ => {}
        }
    });
}
