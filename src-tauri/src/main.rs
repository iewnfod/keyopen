// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, process::Command, path::Path, fs::{File, self}};

use lazy_mut::lazy_mut;
use tauri::{SystemTray, CustomMenuItem, SystemTrayMenu, SystemTrayEvent, Manager, RunEvent, WindowEvent};

mod config;

lazy_mut! {
    static mut BINDING: HashMap<String, String> = HashMap::new();
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
fn hello() -> String {
    "Hello World!".into()
}

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

fn main() {
    config::init();
    load_binding();

    tauri::Builder::default()
        .system_tray(SystemTray::new())
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                },
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![hello, register, open, get_binding])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            match event {
                RunEvent::WindowEvent { label, event, .. } => {
                    match event {
                        WindowEvent::CloseRequested { api, .. } => {
                            let win = app.get_window(label.as_str()).unwrap();
                            win.hide().unwrap();
                            api.prevent_close();
                        },
                        _ => {}
                    }
                },
                _ => {}
            }
        });
}
