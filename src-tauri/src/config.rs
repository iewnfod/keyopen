use std::{path::Path, fs::create_dir_all, fs};
use std::env::current_exe;
use std::fs::File;
use std::path::PathBuf;
use plist::Value;

const APP_ID: &str = "com.iewnfod.keyopen";
const CONFIG_NAME: &str = "keyopen_config.json";

static mut CONFIG_PATH: Option<String> = None;


pub fn get_config_path() -> String {
	unsafe {
		CONFIG_PATH.clone().unwrap().to_string()
	}
}

fn get_user_home() -> PathBuf {
	let user = users::get_user_by_uid(users::get_current_uid()).unwrap();
	if cfg!(target_os = "macos") {
		Path::new("/Users").join(user.name())
	} else if cfg!(target_os = "linux") {
		Path::new("/home").join(user.name())
	} else {
		Path::new(user.name()).to_path_buf()
	}
}

fn get_startup_plist_path() -> PathBuf {
	let home = get_user_home();
	home.join("Library")
		.join("LaunchAgents")
		.join(APP_ID.to_owned() + ".plist")
}

fn set_startup() {
	let plist_path = get_startup_plist_path();

	let mut exe_path = current_exe().unwrap();
	while exe_path.is_symlink() {
		exe_path = exe_path.read_link().unwrap();
	}

	let mut p_dict = plist::Dictionary::new();
	p_dict.insert("Label".to_string(), Value::from(APP_ID));
	p_dict.insert(
		"ProgramArguments".to_string(),
		Value::from(vec![
			Value::from(exe_path.to_str().unwrap().to_string().as_str())
		])
	);
	p_dict.insert("RunAtLoad".to_string(), Value::from(true));
	p_dict.insert("StandardOutPath".to_string(), Value::from("/dev/null"));
	p_dict.insert("StandardErrorPath".to_string(), Value::from("/dev/null"));
	let p_value = Value::from(p_dict);

	let mut xml_byte_buffer: Vec<u8> = vec![];
	p_value.to_writer_xml(&mut xml_byte_buffer).unwrap();

	let string_value = String::from_utf8(xml_byte_buffer).unwrap();

	if !plist_path.exists() {
		File::create(&plist_path).unwrap();
	}
	fs::write(&plist_path, &string_value).unwrap();
}

fn generate_config_path() {
	let home = get_user_home();
	let mut config_path = home.join(".config").join(APP_ID);
	if cfg!(target_os = "macos") {
		config_path = home.join("Library").join("Application Support").join(APP_ID);
	}

	if !config_path.exists() {
		create_dir_all(&config_path).unwrap();
	}

	let config_file = config_path.join(CONFIG_NAME);
	let string_path = config_file.as_os_str().to_str().unwrap();

	println!("{}", string_path);
	unsafe {
		CONFIG_PATH = Some(string_path.to_string());
	}
}

pub fn init() {
	generate_config_path();
}

pub fn startup_exists() -> bool {
	get_startup_plist_path().exists()
}

pub fn toggle_startup() {
	if startup_exists() {
		fs::remove_file(get_startup_plist_path()).unwrap();
	} else {
		set_startup();
	}
}
