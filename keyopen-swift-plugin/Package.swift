// swift-tools-version: 5.10
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "keyopen-swift-plugin",
    platforms: [
        .macOS(.v11)
    ],
    products: [
        .library(
            name: "keyopen-swift-plugin",
            type: .static,
            targets: ["keyopen-swift-plugin"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/Brendonovich/swift-rs", from: "1.0.6")
    ],
    targets: [
        .target(
            name: "keyopen-swift-plugin",
            // Must specify swift-rs as a dependency of your target
            dependencies: [
                .product(
                    name: "SwiftRs",
                    package: "swift-rs"
                )
            ]
        )
    ]
)
