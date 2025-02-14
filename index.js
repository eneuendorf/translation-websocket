import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import http from 'http';

const PORT = process.env.PORT || 8080;
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5JdML04OoFrodXgz48fg359ORwvG947UK50_xAEI4TgkLGQlz9fm1LFJGY3tLR-D4xg/exec";

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running.\n');
});

// Attach WebSocket server
const wss = new WebSocketServer({ server });

let lastTranslation = ""; // Store last translation

console.log(`Server listening on port ${PORT}`);
console.log(`WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log("New student connected");

    // Send the latest translation to the new student
    if (lastTranslation) {
        ws.send(JSON.stringify(lastTranslation));
    }

    ws.on('close', () => {
        console.log("Student disconnected");
    });
});

// Function to fetch translations and log the response
async function fetchAndBroadcast() {
    try {
        console.log("Fetching latest translation from Apps Script...");

        const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
        const data = await response.json();

        console.log("Received from Apps Script:", JSON.stringify(data, null, 2)); // Log response

        if (JSON.stringify(data) !== JSON.stringify(lastTranslation)) {
            console.log("New translation detected, broadcasting...");
            lastTranslation = data;

            wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN = 1
                    client.send(JSON.stringify(lastTranslation));
                }
            });
        } else {
            console.log("No new updates.");
        }
    } catch (error) {
        console.error("Error fetching translations:", error);
    }
}

// Fetch new translations every 3 seconds
setInterval(fetchAndBroadcast, 3000);

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
