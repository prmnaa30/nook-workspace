const PORTS = [14231, 14232, 14233, 14234, 14235];
let currentPortIndex = 0;
let socket = null;
let reconnectTimeout = null;
let wasConnected = false;

function connectWebSocket() {
	if (socket && socket.readyState === WebSocket.OPEN) return;

	const port = PORTS[currentPortIndex];
	const wsUrl = `ws://127.0.0.1:${port}`;
	
	console.log(`[Workstation Dock] Mencoba mengetuk port ${port}...`);
	socket = new WebSocket(wsUrl);

	socket.onopen = () => {
		console.log(`[Workstation Dock] BINGO! Berhasil terhubung ke Tauri di port ${port}!`);
		wasConnected = true;
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
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
		socket = null;
		
		// Pindah ke target port berikutnya
		currentPortIndex = (currentPortIndex + 1) % PORTS.length;
		
		// Jika tadinya nyambung lalu putus, tunggu 3 detik (kasih waktu Tauri restart)
		// Jika tadinya memang belum nyambung (sedang sweeping), langsung gas 200ms
		const delay = wasConnected ? 3000 : 200;
		wasConnected = false;
		
		scheduleReconnect(delay);
	};

	socket.onerror = (err) => {
		// Dibiarkan kosong, karena error akan otomatis memicu onclose
	};
}

function scheduleReconnect(delay) {
	if (!reconnectTimeout) {
		reconnectTimeout = setTimeout(() => {
			reconnectTimeout = null;
			connectWebSocket();
		}, delay);
	}
}

connectWebSocket();
