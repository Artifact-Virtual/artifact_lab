// This file contains an example implementation of a decentralized app using the SNAppKit SDK.

fn main() {
    // Initialize the SNAppKit SDK
    let snappkit = snappkit::initialize();

    // Create a new decentralized application
    let app = snappkit.create_app("Hello Blacknet");

    // Define a simple handler for incoming requests
    app.on_request(|request| {
        // Process the request and generate a response
        let response = format!("Hello, {}! Welcome to Blacknet.", request.sender);
        response
    });

    // Start the application
    app.start();
}