// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, fs::{self, File}, path::Path, process::Command};

use lazy_mut::{lazy_mut, LazyMut};
use tauri::{SystemTray, SystemTrayEvent, Manager, RunEvent, WindowEvent, SystemTrayMenu, CustomMenuItem};

mod config;

#[cfg(target_os = "linux")]
const OPEN: &str = "xdg-open";
#[cfg(target_os = "windows")]
const OPEN: &str = "explorer";
#[cfg(target_os = "macos")]
const OPEN: &str = "open";

lazy_mut! {
    static mut BINDING: HashMap<String, String> = HashMap::new();
}

fn if_bool_config_true(key: &str, default: bool) -> bool {
    if unsafe { BINDING.contains_key(key) } {
        unsafe { *BINDING.get(key).unwrap() == "1".to_string() }
    } else {
        default
    }
}

fn toggle_bool_config(key: &str, default: bool) {
    if if_bool_config_true(key, default) {
        unsafe {
            BINDING.insert(key.to_string(), "0".to_string());
        }
    } else {
        unsafe {
            BINDING.insert(key.to_string(), "1".to_string());
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

        let mut command = Command::new(OPEN);
        command.arg(target_path);

        let result = command.output().unwrap();

        // 如果没有成功，就尝试直接运行这个东西
        if !result.status.success() {
            println!("Open Key Binding {} -> {} Failed", &f, &target_path);
            println!("Try to run directly");
            let mut target_command = Command::new(target_path);
            let _ = target_command.spawn();
        }
    } else {
        println!("Key Binding {} not found", &f);
    }
}

#[tauri::command]
fn get_binding() -> HashMap<String, String> {
    let mut binding = unsafe {
        BINDING.clone()
    }.unwrap();

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
        unsafe {
            BINDING = LazyMut::Value(binding.clone());
        }
        save_binding();

        println!("Clean Up Binding: {:?}", &binding);
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
    println!("Toggle setting {}", name);
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
    unsafe { BINDING.init() };

    config::init();
    load_binding();

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show Window"))
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

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
                            println!("Show Request");
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
                        println!("Hide Request");

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
