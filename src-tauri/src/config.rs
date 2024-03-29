use auto_launch::AutoLaunch;
use home::home_dir;
use log::debug;
use std::env::current_exe;
use std::fs::create_dir_all;

use crate::constants::*;

fn get_auto_launcher() -> AutoLaunch {
    let mut exe_path = current_exe().unwrap();
    while exe_path.is_symlink() {
        exe_path = exe_path.read_link().unwrap();
    }

    let os_str_exe_path = exe_path.as_mut_os_str();
    let str_exe_path = os_str_exe_path.to_str().unwrap();
    let args = [""];

    #[cfg(target_os = "linux")]
    let launcher = AutoLaunch::new(APP_NAME, str_exe_path, &args);

    #[cfg(target_os = "macos")]
    let launcher = AutoLaunch::new(APP_NAME, str_exe_path, false, &args);

    launcher
}

fn set_startup() -> bool {
    get_auto_launcher().enable().is_ok()
}

fn remove_startup() -> bool {
    get_auto_launcher().disable().is_ok()
}

fn generate_config_path() {
    let home = home_dir().unwrap();
    let mut config_path = home.join(".config").join(APP_ID);
    if cfg!(target_os = "macos") {
        config_path = home
            .join("Library")
            .join("Application Support")
            .join(APP_ID);
    }

    if !config_path.exists() {
        create_dir_all(&config_path).unwrap();
    }

    let config_file = config_path.join(CONFIG_NAME);
    let string_path = config_file.as_os_str().to_str().unwrap();

    debug!("{}", &string_path);
    set_config_path(&string_path);
}

// public functions
pub fn init() {
    generate_config_path();
}

pub fn startup_exists() -> bool {
    get_auto_launcher().is_enabled().unwrap()
}

pub fn toggle_startup() -> bool {
    if startup_exists() {
        remove_startup()
    } else {
        set_startup()
    }
}

pub fn get_config_path() -> String {
    let config_path = CONFIG_PATH.lock().unwrap();
    config_path.to_string()
}

pub fn set_config_path<T>(s: T)
where
    T: ToString,
{
    let mut config_path = CONFIG_PATH.lock().unwrap();
    *config_path = s.to_string();
}
