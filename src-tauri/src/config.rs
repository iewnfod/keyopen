use home::home_dir;
use std::fs::create_dir_all;
use std::path::PathBuf;

use crate::constants::*;

pub fn get_config_dir() -> PathBuf {
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

    config_path
}
