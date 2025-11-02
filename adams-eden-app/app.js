const express = require('express');
const path = require('path');
// use built-in express.json() instead of body-parser
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple in-memory store for demo purposes
const items = [];

// Serve static files (index.html + client JS)
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get all items
app.get('/api/items', (req, res) => {
	res.json(items);
});

// Identify plant via plant.id
// Accepts { image_url } or { image_base64 } in the POST body
app.post('/api/identify', async (req, res) => {
	const apiKey = process.env.PLANT_ID_API_KEY;
	if (!apiKey) return res.status(500).json({ error: 'PLANT_ID_API_KEY not set' });

	const { image_url, image_base64 } = req.body;
	if (!image_url && !image_base64) return res.status(400).json({ error: 'Provide image_url or image_base64' });

	try {
		const payload = {
			api_key: apiKey,
			images: image_base64 ? [image_base64] : [image_url],
			modifiers: ['crops_fast', 'similar_images'],
			plant_language: 'en',
			plant_details: ['common_names', 'url', 'wiki_description', 'taxonomy']
		};

		const response = await axios.post('https://api.plant.id/v2/identify', payload, {
			headers: { 'Content-Type': 'application/json' }
		});

		res.json(response.data);
	} catch (err) {
		const message = err.response && err.response.data ? err.response.data : err.message;
		res.status(502).json({ error: 'plant.id request failed', detail: message });
	}
});

// Create an item
app.post('/api/items', (req, res) => {
	const { name } = req.body;
	if (!name || typeof name !== 'string') {
		return res.status(400).json({ error: 'Invalid name' });
	}
	const item = { id: uuidv4(), name, createdAt: new Date().toISOString() };
	items.push(item);
	res.status(201).json(item);
});

// Delete an item
app.delete('/api/items/:id', (req, res) => {
	const { id } = req.params;
	const index = items.findIndex(i => i.id === id);
	if (index === -1) return res.status(404).json({ error: 'Not found' });
	const [removed] = items.splice(index, 1);
	res.json(removed);
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
