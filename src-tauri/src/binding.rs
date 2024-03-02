use std::{collections::HashMap, fs::{self, File}, path::Path, sync::Mutex};

use lazy_static::lazy_static;

use crate::config;

lazy_static! {
    static ref BINDING: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

pub fn get_whole_binding() -> HashMap<String, String> {
	let binding = BINDING.lock().unwrap();
    let b = binding;
    b.clone()
}

pub fn set_whole_binding(b: HashMap<String, String>) {
    let mut binding = BINDING.lock().unwrap();
    *binding = b;
}

pub fn get_binding_from_key<T>(key: T) -> Option<String>
where T: ToString {
	let binding = BINDING.lock().unwrap();
	binding.get(&key.to_string()).cloned()
}

pub fn set_binding_from_key<T, F>(key: T, value: F)
where T: ToString, F: ToString {
	let mut binding = BINDING.lock().unwrap();
	binding.insert(key.to_string(), value.to_string());
}

pub fn save_binding() {
	let binding = get_whole_binding();
    let config_string = serde_json::to_string(&binding).unwrap();
    println!("{}", config_string);
    if !Path::new(config::get_config_path().as_str()).exists() {
        File::create(config::get_config_path().as_str()).unwrap();
    }
    fs::write(Path::new(config::get_config_path().as_str()), config_string).unwrap();
}

pub fn load_binding() {
    if Path::new(config::get_config_path().as_str()).exists() {
        let binding = String::from_utf8(
            fs::read(Path::new(config::get_config_path().as_str())).unwrap()
        ).unwrap();
        let binding_map: HashMap<String, String> = serde_json::from_str(&binding).unwrap();
        println!("{:?}", binding_map);
		let mut binding = BINDING.lock().unwrap();
		*binding = binding_map;
    }
}
