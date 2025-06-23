// This file implements the server functionality for the SNApp host.

use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::thread;

fn handle_client(mut stream: TcpStream) {
    let mut buffer = [0; 512];
    match stream.read(&mut buffer) {
        Ok(_) => {
            // Process the request and send a response
            let response = "HTTP/1.1 200 OK\r\n\r\nHello from SNApp Host!";
            stream.write(response.as_bytes()).unwrap();
        }
        Err(e) => {
            eprintln!("Failed to read from client: {}", e);
        }
    }
}

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").expect("Could not bind to address");
    println!("SNApp Host server running on port 8080");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(move || {
                    handle_client(stream);
                });
            }
            Err(e) => {
                eprintln!("Connection failed: {}", e);
            }
        }
    }
}