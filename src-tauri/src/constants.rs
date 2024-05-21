use enigo::Key;
use phf::phf_map;

#[cfg(target_os = "linux")]
pub const OPEN: &str = "xdg-open";
#[cfg(target_os = "windows")]
pub const OPEN: &str = "explorer";
#[cfg(target_os = "macos")]
pub const OPEN: &str = "open";

pub const APP_BUNDLE_ID: &str = "com.iewnfod.keyopen";

pub const BINDING_FILE_NAME: &str = "bindings.json";
pub const SETTING_FILE_NAME: &str = "settings.json";

pub const MOD_KEY_MAP: phf::Map<&str, Key> = phf_map! [
	"alt" => Key::Alt,
	"meta" => Key::Meta,
	"command" => Key::Meta,
	"ctrl" => Key::Control,
	"shift" => Key::Shift,
	"enter" => Key::Return,
	"backspace" => Key::Backspace,
	"escape" => Key::Escape,
	"tab" => Key::Tab,
	"space" => Key::Space,
	"up" => Key::UpArrow,
	"down" => Key::DownArrow,
	"left" => Key::LeftArrow,
	"right" => Key::RightArrow,
	"capslock" => Key::CapsLock,
	"backquote" => Key::Unicode('`'),
	"quote" => Key::Unicode('\''),
	"slash" => Key::Unicode('/'),
	"equal" => Key::Unicode('='),
	"minus" => Key::Unicode('-')
];
