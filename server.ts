import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import dotenv from 'dotenv';

// Configure environment
dotenv.config();

const app = express();
const PORT = 3000;

// Directories to create
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CARDS_FILE)) {
  // Let's seed with some sample cards so there's always something beautiful to test
  const demoCards = [
    {
      id: "demo-card",
      name: "Dear Friend",
      code: "WELCOME",
      createdAt: Date.now(),
      bgType: "gradient",
      bgColor: "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #030712 100%)",
      bgMusicEnabled: false,
      elements: [
        {
          id: "demo-txt-1",
          type: "text",
          x: 40,
          y: 60,
          width: 370,
          height: 120,
          rotate: 0,
          content: "To My Amazing Friend...",
          fontSize: 28,
          color: "#ffd700",
          fontWeight: "bold",
          textAlign: "center"
        },
        {
          id: "demo-txt-2",
          type: "text",
          x: 40,
          y: 200,
          width: 370,
          height: 180,
          rotate: -2,
          content: "Thank you so much for your sweet birthday wishes, your lovely support, and for making my day extra special! Having you in my life is the best gift ever. ✨ ❤️",
          fontSize: 16,
          color: "#f3f4f6",
          fontWeight: "normal",
          textAlign: "center",
          bgColor: "#1e1b4b99",
          borderRadius: 16,
          padding: 16
        },
        {
          id: "demo-txt-3",
          type: "text",
          x: 100,
          y: 400,
          width: 250,
          height: 60,
          rotate: 2,
          content: "Tap around to explore!",
          fontSize: 14,
          color: "#a78bfa",
          fontWeight: "bold",
          textAlign: "center",
          bgColor: "#ffffff1c",
          borderRadius: 20,
          padding: 8
        }
      ],
      personalNote: "Welcome to our special thank you zone!"
    }
  ];
  fs.writeFileSync(CARDS_FILE, JSON.stringify(demoCards, null, 2), 'utf-8');
}

// Support JSON payloads with increased limits for handling heavy graphics
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve custom file uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Setup Molter for flexible audio, photo and video content uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB max
});

// Helper database functions
function getCards(): any[] {
  try {
    if (!fs.existsSync(CARDS_FILE)) return [];
    const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Database reading error:", err);
    return [];
  }
}

function saveCards(cards: any[]) {
  try {
    fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (err) {
    console.error("Database writing error:", err);
  }
}

/* API Endpoints */

// Serve list of all templates for the custom admin panel
app.get('/api/cards', (req, res) => {
  const cards = getCards();
  res.json(cards);
});

// Access specific card by passcode (Case Insensitive!)
app.get('/api/cards/code/:code', (req, res) => {
  const codeParam = req.params.code.trim().toUpperCase();
  const cards = getCards();
  const match = cards.find(c => c.code.trim().toUpperCase() === codeParam);
  if (match) {
    res.json(match);
  } else {
    res.status(404).json({ error: "No custom card found for this secret code. Try 'WELCOME'." });
  }
});

// Save a new dynamic card
app.post('/api/cards', (req, res) => {
  try {
    const { name, code, bgType, bgColor, elements, bgMusicEnabled, bgMusicUrl, personalNote } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: "Friend's Name and Secret Entrance Code are required!" });
    }

    const cards = getCards();
    // Validate uppercase unique code
    const checkCode = code.trim().toUpperCase();
    if (cards.some(c => c.code.trim().toUpperCase() === checkCode)) {
      return res.status(400).json({ error: "Access Code must be unique. This code is already in use by another card!" });
    }

    const newCard = {
      id: 'card-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      code: checkCode,
      createdAt: Date.now(),
      bgType: bgType || 'gradient',
      bgColor: bgColor || 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #030712 100%)',
      elements: elements || [],
      bgMusicEnabled: bgMusicEnabled || false,
      bgMusicUrl: bgMusicUrl || '',
      personalNote: personalNote || ''
    };

    cards.push(newCard);
    saveCards(cards);
    res.status(201).json(newCard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update an existing card template
app.put('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, bgType, bgColor, elements, bgMusicEnabled, bgMusicUrl, personalNote } = req.body;

    const cards = getCards();
    const index = cards.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Card not found!" });
    }

    if (name) cards[index].name = name.trim();
    if (code) {
      const parsedCode = code.trim().toUpperCase();
      // Ensure unique code among OTHER cards
      if (cards.some((c, j) => j !== index && c.code.trim().toUpperCase() === parsedCode)) {
        return res.status(400).json({ error: "Access Code is already assigned to a different card!" });
      }
      cards[index].code = parsedCode;
    }
    
    if (bgType) cards[index].bgType = bgType;
    if (bgColor !== undefined) cards[index].bgColor = bgColor;
    if (elements !== undefined) cards[index].elements = elements;
    if (bgMusicEnabled !== undefined) cards[index].bgMusicEnabled = bgMusicEnabled;
    if (bgMusicUrl !== undefined) cards[index].bgMusicUrl = bgMusicUrl;
    if (personalNote !== undefined) cards[index].personalNote = personalNote;

    saveCards(cards);
    res.json(cards[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a card template
app.delete('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cards = getCards();
    const filtered = cards.filter(c => c.id !== id);
    if (cards.length === filtered.length) {
      return res.status(404).json({ error: "Card not found!" });
    }
    saveCards(filtered);
    res.json({ success: true, message: "Card deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint (handling photos, music and recordings)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was selected or uploaded!" });
    }
    // Return relative url path accessible from browser
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      fileName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup server integration with frontend (Vite or built files)
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve production bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

boot().catch(err => {
  console.error("Failed to start the Express full-stack host server:", err);
});
