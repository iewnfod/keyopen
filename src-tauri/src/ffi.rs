use swift_rs::{swift, SRString};

swift!(fn _open_file(p: SRString));

pub fn open_file(p: &str) {
	unsafe { _open_file(SRString::from(p)) }
}
