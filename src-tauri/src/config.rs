use std::{path::Path, fs::create_dir_all};

const APP_ID: &str = "com.iewnfod.keyopen";
const CONFIG_NAME: &str = "keyopen_config.json";

static mut CONFIG_PATH: Option<String> = None;


pub fn get_config_path() -> String {
	unsafe {
		CONFIG_PATH.clone().unwrap().to_string()
	}
}

pub fn init() {
	let user = users::get_user_by_uid(users::get_current_uid()).unwrap();

	let home = Path::new("/Users").join(user.name());
	let config_path = home.join("Library").join("Application Support").join(APP_ID);
	if !config_path.exists() {
		create_dir_all(&config_path).unwrap();
	}

	let config_file = config_path.join(CONFIG_NAME);
	let string_path = config_file.as_os_str().to_str().unwrap();

	println!("{}", string_path);
	unsafe {
		CONFIG_PATH = Some(string_path.to_string());
	};
}
