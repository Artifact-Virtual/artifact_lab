// This file contains the implementation of the tunnel functionality for the client.

use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::{Arc, Mutex};
use tokio::net::UdpSocket;
use tokio::task;

pub struct Tunnel {
    socket: Arc<Mutex<UdpSocket>>,
}

impl Tunnel {
    pub fn new(bind_addr: &str) -> Self {
        let socket = UdpSocket::bind(bind_addr).await.unwrap();
        Tunnel {
            socket: Arc::new(Mutex::new(socket)),
        }
    }

    pub async fn send(&self, addr: IpAddr, port: u16, data: &[u8]) {
        let socket = self.socket.lock().unwrap();
        let target = SocketAddr::new(addr, port);
        socket.send_to(data, target).await.unwrap();
    }

    pub async fn receive(&self) -> (Vec<u8>, SocketAddr) {
        let socket = self.socket.lock().unwrap();
        let mut buf = vec![0; 1024];
        let (len, addr) = socket.recv_from(&mut buf).await.unwrap();
        buf.truncate(len);
        (buf, addr)
    }

    pub async fn start(&self) {
        loop {
            let (data, addr) = self.receive().await;
            // Process received data
            task::spawn(async move {
                // Handle data from addr
            });
        }
    }
}