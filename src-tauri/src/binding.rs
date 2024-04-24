use std::{fs::File, io::Write, path::PathBuf, sync::Mutex};
use serde::{Deserialize, Serialize};
use lazy_static::lazy_static;

use crate::{config::get_config_dir, constants::BINDING_FILE_NAME};

lazy_static! {
    pub static ref BINDINGS: Mutex<Bindings> = Mutex::new(Bindings::default());
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum BType {
    Path,
    Shell,
    Map
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Binding {
    id: String,
    pub key: Vec<String>,
    #[serde(default = "default_b_type")]
    pub b_type: BType,
    pub value: String
}

fn default_b_type() -> BType {
    BType::Path
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bindings {
    b: Vec<Binding>
}

impl Bindings {
    pub fn new() -> Self {
        Self { b: vec![] }
    }

    fn get_save_path() -> PathBuf {
        let binding_path = get_config_dir().join(BINDING_FILE_NAME);
        if !binding_path.exists() {
            File::create(&binding_path).unwrap();
        }
        binding_path
    }

    pub fn from_save() -> Result<Self, ()> {
        let binding_path = Self::get_save_path();

        let binding_file = File::open(binding_path).unwrap();
        match serde_json::from_reader(binding_file) {
            Ok(b) => Ok(b),
            Err(_) => Err(())
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
        match Self::from_save() {
            Ok(b) => b,
            Err(_) => Self::new()
        }
    }
}

#[tauri::command]
pub fn get_bindings() -> Vec<Binding> {
    let bindings = BINDINGS.lock().unwrap();
    bindings.get_bindings()
}

#[tauri::command]
pub fn set_bindings(new_bindings: Vec<Binding>) {
    println!("{:?}", &new_bindings);
    let mut bindings = BINDINGS.lock().unwrap();
    bindings.set_bindings(new_bindings);
}
