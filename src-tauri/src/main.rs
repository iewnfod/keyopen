// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, process::Command, path::Path, fs::{File, self}};

use lazy_mut::lazy_mut;
use tauri::{SystemTray, SystemTrayEvent, Manager, RunEvent, WindowEvent, ActivationPolicy};

mod config;

lazy_mut! {
    static mut BINDING: HashMap<String, String> = HashMap::new();
}

fn if_window_will_show_when_open() -> bool {
    if unsafe { BINDING.contains_key("show_when_open") } {
        if unsafe { *BINDING.get("show_when_open").unwrap() == "1".to_string() } {
            true
        } else {
            false
        }
    } else {
        true
    }
}

fn toggle_show_window_when_open() {
    if if_window_will_show_when_open() {
        unsafe {
            BINDING.insert("show_when_open".to_string(), "0".to_string());
        }
    } else {
        unsafe {
            BINDING.insert("show_when_open".to_string(), "1".to_string());
        }
    }
    save_binding();
}

fn save_binding() {
    let binding = unsafe {
        BINDING.clone()
    }.unwrap();
    let config_string = serde_json::to_string(&binding).unwrap();
    println!("{}", config_string);
    if !Path::new(config::get_config_path().as_str()).exists() {
        File::create(config::get_config_path().as_str()).unwrap();
    }
    fs::write(Path::new(config::get_config_path().as_str()), config_string).unwrap();
}

fn load_binding() {
    if Path::new(config::get_config_path().as_str()).exists() {
        let binding = String::from_utf8(
            fs::read(Path::new(config::get_config_path().as_str())).unwrap()
        ).unwrap();
        let binding_map: HashMap<String, String> = serde_json::from_str(&binding).unwrap();
        println!("{:?}", binding_map);
        unsafe {
            BINDING = lazy_mut::LazyMut::Value(binding_map);
        };
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn register(f : String, target_path : String) {
    println!("New Register {} -> {}", &f, &target_path);
    unsafe {
        BINDING.insert(f, target_path);
    };
    save_binding();
}

#[tauri::command]
fn open(f : String) {
    if unsafe { BINDING.contains_key(&f) } {
        let target_path = unsafe {
            BINDING.get(&f)
        }.unwrap();

        if target_path.is_empty() {
            println!("Empty Binding {}", &f);
            return;
        }

        println!("Open Key Binding {} -> {}", &f, &target_path);

        let mut command = Command::new("open");
        command.arg(target_path);

        command.spawn().unwrap();
    } else {
        println!("Key Binding {} not found", &f);
    }
}

#[tauri::command]
fn get_binding() -> HashMap<String, String> {
    unsafe {
        BINDING.clone().unwrap()
    }
}

#[tauri::command]
fn get_settings() -> HashMap<String, bool> {
    let mut map = HashMap::new();
    map.insert("startup".to_string(), config::startup_exists());
    map.insert("show_when_open".to_string(), if_window_will_show_when_open());
    map
}

#[tauri::command]
fn toggle_settings(name: String) {
    println!("Toggle setting {}", name);
    match name.as_str() {
        "startup" => {
            config::toggle_startup();
        },
        "show_when_open" => {
            toggle_show_window_when_open();
        },
        _ => {}
    }
}

fn main() {
    unsafe { BINDING.init() };

    config::init();
    load_binding();

    let mut app = tauri::Builder::default()
        .system_tray(SystemTray::new())
        .on_system_tray_event(|app_handle, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app_handle.get_window("main").unwrap();
                    tauri::AppHandle::show(
                        &window.app_handle()
                    ).unwrap();
                    window.set_focus().unwrap();
                },
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![register, open, get_binding, get_settings, toggle_settings])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.set_activation_policy(ActivationPolicy::Accessory);

    // 如果启动显示窗口，就显示
    if if_window_will_show_when_open() {
        app.get_window("main").unwrap().show().unwrap();
    }

    app.run(|app_handle, event| {
        match event {
            RunEvent::WindowEvent { label, event, .. } => {
                match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        tauri::AppHandle::hide(
                            &app_handle.get_window(label.as_str())
                                .unwrap()
                                .app_handle()
                        ).unwrap();
                        api.prevent_close();
                    },
                    _ => {}
                }
            },
            _ => {}
        }
    });
}
