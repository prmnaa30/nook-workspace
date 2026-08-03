use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_tungstenite::accept_async;

pub struct AppState {
    pub ws_sender: broadcast::Sender<String>,
}

pub fn spawn_server(tx_server: broadcast::Sender<String>) {
    tauri::async_runtime::spawn(async move {
        let fallback_ports = [14231, 14232, 14233, 14234, 14235];
        let mut listener = None;
        let mut active_port = 0;

        for port in fallback_ports {
            let addr = format!("127.0.0.1:{}", port);
            match TcpListener::bind(&addr).await {
                Ok(l) => {
                    println!("WebSocket Server berhasil bind di port: {}", port);
                    listener = Some(l);
                    active_port = port;
                    break;
                }
                Err(e) => {
                    println!("Gagal bind di port {}, error: {:?}", port, e);
                }
            }
        }

        let listener = match listener {
            Some(l) => l,
            None => {
                println!("Gagal bind ke semua port fallback. WebSocket server mati.");
                return;
            }
        };

        while let Ok((stream, _)) = listener.accept().await {
            let tx_client = tx_server.clone();

            tokio::spawn(async move {
                if let Ok(mut ws_stream) = accept_async(stream).await {
                    println!("Browser Extension Connected on port {}!", active_port);
                    let mut rx_channel = tx_client.subscribe();

                    loop {
                        tokio::select! {
                            Ok(msg) = rx_channel.recv() => {
                                if ws_stream.send(tokio_tungstenite::tungstenite::Message::Text(msg)).await.is_err() {
                                    break;
                                }
                            }
                            Some(Ok(_)) = ws_stream.next() => {
                              //
                            }
                            else => {
                                break;
                            }
                        }
                    }
                    println!("Browser Extension Disconnected.");
                }
            });
        }
    });
}
