use std::collections::HashMap;
use log::debug;

use crate::{
    config, get_binding_from_key, get_whole_binding, open::sub_open, save_binding, set_binding_from_key, set_whole_binding
};

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
        &k == "1"
    } else {
        default
    }
}

#[tauri::command]
pub fn get_system() -> &'static str {
    #[cfg(target_os = "windows")]
    return "windows";
    #[cfg(target_os = "macos")]
    return "macos";
    #[cfg(target_os = "linux")]
    return "linux";
}

#[tauri::command]
pub fn register(f: String, target_path: String) {
    debug!("New Register {} -> {}", &f, &target_path);
    set_binding_from_key(f, target_path);
    save_binding();
}

#[tauri::command]
pub fn open(f: String) {
    if let Some(target_path) = get_binding_from_key(&f) {
        if target_path.is_empty() {
            debug!("Empty Binding {}", &f);
            return;
        }

        debug!("Open Key Binding {} -> {}", &f, &target_path);

        sub_open(&target_path);
    } else {
        debug!("Key Binding {} not found", &f);
    }
}

#[tauri::command]
pub fn get_binding() -> Vec<HashMap<String, String>> {
    let binding = get_whole_binding();

    let mut bindings: Vec<HashMap<String, String>> = vec![];
    for (key, value) in binding.iter() {
        if !value.is_empty() {
            let mut b = HashMap::new();
            b.insert("key".to_string(), key.to_string());
            b.insert("value".to_string(), value.to_string());
            bindings.push(b);
        }
    }

    bindings
}

#[tauri::command]
pub fn get_settings() -> HashMap<String, bool> {
    let mut map = HashMap::new();
    map.insert("startup".to_string(), config::startup_exists());
    map.insert(
        "show_when_open".to_string(),
        if_bool_config_true("show_when_open", true),
    );
    map.insert(
        "dark_mod".to_string(),
        if_bool_config_true("dark_mod", false),
    );
    map
}

#[tauri::command]
pub fn toggle_settings(name: String) -> bool {
    debug!("Toggle setting {}", name);
    match name.as_str() {
        "startup" => config::toggle_startup(),
        "show_when_open" => {
            toggle_bool_config("show_when_open", true);
            true
        },
        "dark_mod" => {
            toggle_bool_config("dark_mod", false);
            true
        },
        _ => true
    }
}
