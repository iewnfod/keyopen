use std::{fs::File, io::Write, path::PathBuf, sync::Mutex};
use log::debug;
use serde::{Deserialize, Serialize};
use lazy_static::lazy_static;

use crate::{config::get_config_dir, constants::BINDING_FILE_NAME};

lazy_static! {
    pub static ref BINDINGS: Mutex<Bindings> = Mutex::new(Bindings::new());
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum BType {
    Path,
    Shell,
    Map
}

impl Default for BType {
    fn default() -> Self {
        Self::Path
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Binding {
    id: String,
    pub key: Vec<String>,
    #[serde(default)]
    pub b_type: BType,
    pub value: String
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bindings {
    b: Vec<Binding>
}

impl Bindings {
    pub fn new() -> Self {
        match Self::from_save() {
            Some(b) => b,
            None => Self::default()
        }
    }

    fn get_save_path() -> PathBuf {
        let binding_path = get_config_dir().join(BINDING_FILE_NAME);
        if !binding_path.exists() {
            File::create(&binding_path).unwrap();
        }
        binding_path
    }

    pub fn from_save() -> Option<Self> {
        let binding_path = Self::get_save_path();
        let binding_file = File::open(binding_path).unwrap();
        match serde_json::from_reader(binding_file) {
            Ok(b) => Some(b),
            Err(_) => None
        }
    }

    pub fn set_bindings(&mut self, new_bindings: Vec<Binding>) {
        self.b = new_bindings;

        let s = serde_json::to_string_pretty(self).unwrap();
        let mut file = File::create(Self::get_save_path()).unwrap();
        file.write_all(s.as_bytes()).unwrap();
    }

    pub fn get_bindings(&self) -> Vec<Binding> {
        self.b.clone()
    }
}

impl Default for Bindings {
    fn default() -> Self {
        Self { b: vec![] }
    }
}

#[tauri::command]
pub fn get_bindings() -> Vec<Binding> {
    let bindings = BINDINGS.lock().unwrap();
    bindings.get_bindings()
}

#[tauri::command]
pub fn set_bindings(new_bindings: Vec<Binding>) {
    debug!("{:?}", &new_bindings);
    let mut bindings = BINDINGS.lock().unwrap();
    bindings.set_bindings(new_bindings);
}
