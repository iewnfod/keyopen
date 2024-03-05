use std::{collections::HashMap, process::Command};

use log::debug;

use crate::{config, constants::OPEN, get_binding_from_key, get_whole_binding, save_binding, set_binding_from_key, set_whole_binding};


fn toggle_bool_config(key: &str, default: bool) {
    if if_bool_config_true(key, default) {
        set_binding_from_key(key, 0);
    } else {
        set_binding_from_key(key, 1);
    }
    save_binding();
}

pub fn if_bool_config_true(key: &str, default: bool) -> bool {
    if let Some(k) = get_binding_from_key(key) {
        k == "1".to_string()
    } else {
        default
    }
}

#[tauri::command]
pub fn get_system() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
}

#[tauri::command]
pub fn register(f : String, target_path : String) {
    debug!("New Register {} -> {}", &f, &target_path);
    set_binding_from_key(f, target_path);
    save_binding();
}

#[tauri::command]
pub fn open(f : String) {
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
pub fn get_binding() -> HashMap<String, String> {
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
pub fn get_settings() -> HashMap<String, bool> {
    let mut map = HashMap::new();
    map.insert("startup".to_string(), config::startup_exists());
    map.insert("show_when_open".to_string(), if_bool_config_true("show_when_open", true));
    map.insert("dark_mod".to_string(), if_bool_config_true("dark_mod", false));
    map
}

#[tauri::command]
pub fn toggle_settings(name: String) -> bool {
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
