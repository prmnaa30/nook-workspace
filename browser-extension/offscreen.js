// URL WebSocket ke aplikasi Tauri
const WS_URL = "ws://127.0.0.1:48531";
let socket = null;
let reconnectInterval = null;

// Fungsi untuk menghubungkan WebSocket
function connectWebSocket() {
	if (socket && socket.readyState === WebSocket.OPEN) return;

	console.log("[Workstation Dock] Connecting to Tauri App...");
	socket = new WebSocket(WS_URL);

	socket.onopen = () => {
		console.log("[Workstation Dock] Connected to Tauri!");
		if (reconnectInterval) {
			clearInterval(reconnectInterval);
			reconnectInterval = null;
		}
	};

	socket.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			console.log("[Workstation Dock] Receiving messages:", data);

			if (data.action === "open_or_focus" && data.url) {
				chrome.runtime.sendMessage({
          action: "open_or_focus",
          url: data.url
        });
			}
		} catch (e) {
			console.error("Failed processing JSON:", e);
		}
	};

	socket.onclose = () => {
		console.log(
			"[Workstation Dock] Connection lost. Trying in 3 seconds...",
		);
		socket = null;
		scheduleReconnect();
	};

	socket.onerror = (err) => {
		socket.close();
	};
}

function scheduleReconnect() {
	if (!reconnectInterval) {
		reconnectInterval = setInterval(() => {
			connectWebSocket();
		}, 3000);
	}
}

connectWebSocket();
