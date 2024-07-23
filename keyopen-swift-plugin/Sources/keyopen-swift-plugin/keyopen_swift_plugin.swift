// The Swift Programming Language
// https://docs.swift.org/swift-book

import Foundation
import SwiftUI
import Combine
import SwiftRs

@_cdecl("_open_file")
public func openFile(p: SRString) {
    let path = p.toString()
    let url = URL(fileURLWithPath: path)
    let configure = NSWorkspace.OpenConfiguration.init()
    configure.activates = true
    configure.promptsUserIfNeeded = true

    if path.hasSuffix(".app") {
        NSWorkspace.shared.openApplication(at: url, configuration: configure, completionHandler: nil)
        print("activate application", path)
    } else {
        NSWorkspace.shared.open(url)
        print("open file", path)
    }
}
