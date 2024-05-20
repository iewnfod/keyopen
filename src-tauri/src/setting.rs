use std::{fs::File, io::Write, path::PathBuf, sync::Mutex};
use log::debug;
use serde::{Deserialize, Serialize};
use lazy_static::lazy_static;

use crate::{config::{bool_default_false, get_config_dir}, constants::SETTING_FILE_NAME};

lazy_static! {
    pub static ref SETTINGS: Mutex<Settings> = Mutex::new(Settings::new());
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default = "bool_default_false")]
	pub dark_mode: bool,

    #[serde(default = "bool_default_false")]
	pub start_at_login: bool,

    #[serde(default = "bool_default_false")]
	pub hidden_mode: bool,

	#[serde(default = "default_theme_color")]
	pub theme_color: String,

	// unit: ms
	#[serde(default = "default_map_delay_time")]
	pub map_delay_time: u64,
}

fn default_theme_color() -> String { "#5B62BC".to_string() }
fn default_map_delay_time() -> u64 { 100 }

impl Default for Settings {
	fn default() -> Self {
		Self {
			dark_mode: false,
			start_at_login: false,
			hidden_mode: false,
			theme_color: default_theme_color(),
			map_delay_time: default_map_delay_time(),
		}
	}
}

impl Settings {
	pub fn new() -> Self {
		match Self::from_save() {
			Some(s) => s,
			None => Self::default()
		}
	}

	fn get_save_path() -> PathBuf {
        let setting_path = get_config_dir().join(SETTING_FILE_NAME);
        if !setting_path.exists() {
            File::create(&setting_path).unwrap();
        }
        setting_path
    }

	pub fn from_save() -> Option<Self> {
		let save_path = Self::get_save_path();
		let save_file = File::open(save_path).unwrap();
		match serde_json::from_reader(save_file) {
			Ok(s) => Some(s),
			Err(_) => None
		}
	}

	pub fn save(&self) {
		let s = serde_json::to_string_pretty(self).unwrap();
        let mut file = File::create(Self::get_save_path()).unwrap();
        file.write_all(s.as_bytes()).unwrap();
	}

	pub fn into_self(&self) -> Self {
		self.clone()
	}
}

#[tauri::command]
pub fn get_settings() -> Settings {
	SETTINGS.lock().unwrap().into_self()
}

#[tauri::command]
pub fn set_settings(new_settings: Settings) {
    debug!("{:?}", &new_settings);
    let mut settings = SETTINGS.lock().unwrap();
    *settings = new_settings;
	settings.save();
}
