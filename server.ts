import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch, runTransaction, getDoc } from "firebase/firestore";

// Load environment variables
dotenv.config();

// Clean GEMINI_API_KEY if there are quotes or whitespace
if (process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.trim();
  if (process.env.GEMINI_API_KEY.startsWith('"') && process.env.GEMINI_API_KEY.endsWith('"')) {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.slice(1, -1);
  } else if (process.env.GEMINI_API_KEY.startsWith("'") && process.env.GEMINI_API_KEY.endsWith("'")) {
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY.slice(1, -1);
  }
}

console.log("🔑 [SYSTEM CONFIG] Environment Variables Check:");
if (process.env.GEMINI_API_KEY) {
  const k = process.env.GEMINI_API_KEY;
  console.log(`   - GEMINI_API_KEY: Present (Length: ${k.length}, Starts with: "${k.substring(0, Math.min(4, k.length))}...", Ends with: "...${k.substring(Math.max(0, k.length - 4))}")`);
} else {
  console.log("   - GEMINI_API_KEY: NOT DEFINED or empty.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent user notes backup path (local failover)
const NOTES_FILE_PATH = process.env.VERCEL
  ? path.join("/tmp", "user_notes.json")
  : path.join(process.cwd(), "user_notes.json");
const CONFIG_FILE_PATH = process.env.VERCEL
  ? path.join("/tmp", "system_config.json")
  : path.join(process.cwd(), "system_config.json");

// Default universal seed notes
const DEFAULT_UNIVERSAL_NOTES = [
  {
    id: "univ-note-1",
    title: "Understanding Graph Traversal: BFS vs DFS Algorithms",
    content: "Graph traversal forms the core of network analysis, routing, and search space discovery.\n\n### Breadth-First Search (BFS)\n- **Strategy**: Explores level-by-level, visiting all neighbor vertices of a node before moving to deeper levels.\n- **Data Structure**: Uses a **Queue** (First-In, First-Out).\n- **Complexity**: $O(V + E)$ where $V$ is vertices and $E$ is edges.\n- **Key Use Case**: Finding the absolute shortest path on unweighted graphs.\n\n### Depth-First Search (DFS)\n- **Strategy**: Plunges as deep as possible along each branch before backtracking.\n- **Data Structure**: Uses a **Stack** (implicitly via recursion or explicitly).\n- **Complexity**: $O(V + E)$.\n- **Key Use Case**: Topological sorting, checking for cycles, and solving mazes.\n\n```python\n# Basic recursive DFS representation in Python\ndef dfs(graph, node, visited=None):\n    if visited is None:\n        visited = set()\n    if node not in visited:\n        print(f'Visiting vertex: {node}')\n        visited.add(node)\n        for neighbor in graph[node]:\n            dfs(graph, neighbor, visited)\n    return visited\n```",
    subjectName: "Data Structures & Algorithms",
    subjectCode: "CS-201",
    topicName: "Graph Algorithms",
    uploaderName: "Dr. Alisha Vance",
    uploaderRole: "Professor",
    uploaderEmail: "alisha.vance@university.edu",
    uploadedAt: "2026-06-29T10:30:00.000Z",
    likes: 42
  },
  {
    id: "univ-note-2",
    title: "The Schrödinger Equation & Wave Functions Demystified",
    content: "The Schrödinger Equation represents the cornerstone of modern quantum mechanics, describing how the quantum state of a physical system changes over time.\n\n### Time-Independent Schrödinger Equation\n$$\\hat{H}\\psi = E\\psi$$\n- $\\hat{H}$ is the Hamiltonian Operator (representing total energy).\n- $\\psi$ is the Wave Function (describes spatial probability amplitude).\n- $E$ is the total energy eigenvalue.\n\n### Interpretations of the Wave Function\nMax Born proposed that the square of the magnitude of the wave function, $|\\psi(x)|^2$, represents the probability density of finding a particle at a given coordinate $x$ at a specific time.\n\n- **Normalisation**: The probability of finding the particle *somewhere* in the universe must sum to 1.\n$$\\int_{-\\infty}^{\\infty} |\\psi(x)|^2 dx = 1$$",
    subjectName: "Advanced Quantum Mechanics",
    subjectCode: "PHYS-402",
    topicName: "Quantum Foundations",
    uploaderName: "Chetana Agle",
    uploaderRole: "Lead TA",
    uploaderEmail: "chetanaagle2007@gmail.com",
    uploadedAt: "2026-06-30T04:15:00.000Z",
    likes: 38
  },
  {
    id: "univ-note-3",
    title: "Key Macroeconomic Indicators & Policy Impacts",
    content: "How governments manipulate variables to direct national markets:\n\n1. **Gross Domestic Product (GDP)**:\n   $$GDP = C + I + G + (X - M)$$\n   - $C$: Private Consumption\n   - $I$: Capital Investments\n   - $G$: Government Spending\n   - $(X-M)$: Net Exports (Exports minus Imports)\n\n2. **Fiscal Policy Tools**:\n   - **Taxation Changes**: Adjusts consumer disposable income and spending power.\n   - **Government Investment**: Directly stimulates target industries and increases public employment.\n\n3. **Monetary Policy Tools** (Managed by Central Banks):\n   - **Reserve Requirements**: Minimum liquid cash reserves banks must hold.\n   - **Discount Rate**: The lending rate charged to commercial entities.\n   - **Open Market Operations**: Buying/selling treasury bills to influence cash liquidity.",
    subjectName: "Macroeconomic Theory",
    subjectCode: "ECON-101",
    topicName: "Economic Indicators",
    uploaderName: "Amit Sharma",
    uploaderRole: "Student",
    uploaderEmail: "amit.sharma99@student.edu",
    uploadedAt: "2026-06-30T07:45:00.000Z",
    likes: 19
  }
];

const DEFAULT_CONFIG = {
  announcement: "🎓 Welcome to the new Notsopedia Universal Hub! Download community notes, access the Live AI Search, and share research notes permanently.",
  announcementActive: true,
  enableSimulator: false,
  enableSubmissions: true
};

// ----------------- FIRESTORE SETUP -----------------
let db: any = null;
let useFirestore = false;

try {
  let firebaseConfig: any = null;
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else if (process.env.FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || ""
    };
  }

  if (firebaseConfig) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    useFirestore = true;
    console.log("🔥 Connected to Google Cloud Firestore database successfully.");
  } else {
    console.warn("⚠️ No Firebase configuration file or environment variables found. Using offline file backup.");
  }
} catch (err) {
  console.warn("⚠️ Local mode: Firestore failed to initialize, using local files fallback.", err);
  useFirestore = false;
}

// Seeding Firestore helper
async function seedFirestoreIfNeeded() {
  if (!useFirestore || !db) return;
  try {
    const notesCol = collection(db, "notes");
    const snapshot = await getDocs(notesCol);
    if (snapshot.empty) {
      console.log("📥 Seeding default universal notes to Cloud Firestore...");
      for (const note of DEFAULT_UNIVERSAL_NOTES) {
        const { id, ...data } = note;
        await setDoc(doc(db, "notes", id), data);
      }
      console.log("✅ Successfully seeded default universal notes in Firestore.");
    }
    
    // Seed default config
    const configDocRef = doc(db, "system_config", "main");
    const configDoc = await getDoc(configDocRef);
    if (!configDoc.exists()) {
      await setDoc(configDocRef, DEFAULT_CONFIG);
      console.log("✅ Seeded default system configuration in Firestore.");
    }
  } catch (err) {
    console.warn("❌ Firestore seeding failed (probably running local dev without credentials)", err);
  }
}

// Local files fallback backup helpers
function readNotesFromFile(): any[] {
  try {
    if (fs.existsSync(NOTES_FILE_PATH)) {
      const data = fs.readFileSync(NOTES_FILE_PATH, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(DEFAULT_UNIVERSAL_NOTES, null, 2), "utf8");
      return DEFAULT_UNIVERSAL_NOTES;
    }
  } catch (err) {
    return DEFAULT_UNIVERSAL_NOTES;
  }
}

function writeNotesToFile(notes: any[]) {
  try {
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2), "utf8");
  } catch (err) {
    console.error("Error backing up notes locally:", err);
  }
}

function readConfigFromFile(): any {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
      return DEFAULT_CONFIG;
    }
  } catch (err) {
    return DEFAULT_CONFIG;
  }
}

function writeConfigToFile(config: any) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Error backing up config locally:", err);
  }
}

// ----------------- API ENDPOINTS -----------------

// 1. GET ALL NOTES (with real-time Firestore fetch)
app.get("/api/notes", async (req, res) => {
  if (useFirestore && db) {
    try {
      const snapshot = await getDocs(collection(db, "notes"));
      const notes: any[] = [];
      snapshot.forEach(doc => {
        notes.push({ id: doc.id, ...doc.data() });
      });
      // Sort newest first
      notes.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      if (notes.length > 0) {
        // Keep local backup synchronized
        writeNotesToFile(notes);
        return res.json(notes);
      }
    } catch (err) {
      console.warn("Firestore fetch notes failed, using offline file backup.", err);
    }
  }
  // Fallback to local files
  res.json(readNotesFromFile());
});

// 2. CREATE A NOTE (with instant Firestore write)
app.post("/api/notes", async (req, res) => {
  try {
    const { title, content, subjectName, subjectCode, topicName, uploaderName, uploaderRole, uploaderEmail } = req.body;
    
    if (!title || !content || !subjectName || !uploaderName) {
      return res.status(400).json({ error: "Missing required note details (title, content, subject, uploader name)" });
    }

    const newId = "note-" + Date.now();
    const newNote = {
      title,
      content,
      subjectName,
      subjectCode: subjectCode || "GEN-ACAD",
      topicName: topicName || "General Topic",
      uploaderName,
      uploaderRole: uploaderRole || "Student",
      uploaderEmail: uploaderEmail || "",
      uploadedAt: new Date().toISOString(),
      likes: 0
    };

    if (useFirestore && db) {
      try {
        await setDoc(doc(db, "notes", newId), newNote);
        console.log(`✅ Permanent storage written: Saved note ${newId} to Firestore.`);
      } catch (err) {
        console.error("Failed to write to Cloud Firestore, fallback to local files.", err);
      }
    }

    // Sync to local files regardless
    const localNotes = readNotesFromFile();
    localNotes.unshift({ id: newId, ...newNote });
    writeNotesToFile(localNotes);

    res.status(201).json({ id: newId, ...newNote });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload study note." });
  }
});

// 3. LIKE A NOTE (with dynamic Firestore transaction)
app.post("/api/notes/:id/like", async (req, res) => {
  const { id } = req.params;
  let success = false;

  if (useFirestore && db) {
    try {
      const docRef = doc(db, "notes", id);
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        if (sfDoc.exists()) {
          const currentLikes = sfDoc.data()?.likes || 0;
          transaction.update(docRef, { likes: currentLikes + 1 });
          success = true;
        }
      });
    } catch (err) {
      console.error("Firestore transaction like failed, using offline file modification.", err);
    }
  }

  // Update local backup
  const localNotes = readNotesFromFile();
  const index = localNotes.findIndex(n => n.id === id);
  if (index !== -1) {
    localNotes[index].likes = (localNotes[index].likes || 0) + 1;
    writeNotesToFile(localNotes);
    return res.json(localNotes[index]);
  }

  if (success) {
    return res.json({ id, status: "liked" });
  }
  res.status(404).json({ error: "Note not found" });
});

// 4. DELETE A NOTE (Administrator moderation option)
app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  let deleted = false;

  if (useFirestore && db) {
    try {
      await deleteDoc(doc(db, "notes", id));
      deleted = true;
      console.log(`✅ Note ${id} deleted from Cloud Firestore permanently.`);
    } catch (err) {
      console.error("Firestore delete note failed.", err);
    }
  }

  const localNotes = readNotesFromFile();
  const filtered = localNotes.filter(n => n.id !== id);
  if (localNotes.length !== filtered.length) {
    writeNotesToFile(filtered);
    deleted = true;
  }

  if (deleted) {
    return res.json({ success: true, id });
  }
  res.status(404).json({ error: "Note not found" });
});

// 5. UPDATE A NOTE (Administrator moderation edits)
app.put("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, subjectName, subjectCode, topicName, uploaderName, uploaderRole, uploaderEmail } = req.body;
  let updated = false;

  const updateFields: any = {};
  if (title) updateFields.title = title;
  if (content) updateFields.content = content;
  if (subjectName) updateFields.subjectName = subjectName;
  if (subjectCode) updateFields.subjectCode = subjectCode;
  if (topicName) updateFields.topicName = topicName;
  if (uploaderName) updateFields.uploaderName = uploaderName;
  if (uploaderRole) updateFields.uploaderRole = uploaderRole;
  if (uploaderEmail !== undefined) updateFields.uploaderEmail = uploaderEmail;

  if (useFirestore && db) {
    try {
      await updateDoc(doc(db, "notes", id), updateFields);
      updated = true;
      console.log(`✅ Note ${id} updated in Cloud Firestore permanently.`);
    } catch (err) {
      console.error("Firestore update note failed.", err);
    }
  }

  const localNotes = readNotesFromFile();
  const index = localNotes.findIndex(n => n.id === id);
  if (index !== -1) {
    localNotes[index] = { ...localNotes[index], ...updateFields };
    writeNotesToFile(localNotes);
    return res.json(localNotes[index]);
  }

  if (updated) {
    return res.json({ id, ...updateFields });
  }
  res.status(404).json({ error: "Note not found" });
});

// 6. SYSTEM CONFIGURATION GET & UPDATE (with live Firestore sync)
app.get("/api/system/config", async (req, res) => {
  if (useFirestore && db) {
    try {
      const configDocRef = doc(db, "system_config", "main");
      const configDoc = await getDoc(configDocRef);
      if (configDoc.exists()) {
        const data = configDoc.data();
        writeConfigToFile(data);
        return res.json(data);
      }
    } catch (err) {
      console.warn("Firestore config read failed, using offline backup.");
    }
  }
  res.json(readConfigFromFile());
});

app.post("/api/system/config", async (req, res) => {
  try {
    const currentLocal = readConfigFromFile();
    const updated = { ...currentLocal, ...req.body };

    if (useFirestore && db) {
      try {
        await setDoc(doc(db, "system_config", "main"), updated);
        console.log("✅ Updated system configuration in Cloud Firestore permanently.");
      } catch (err) {
        console.error("Firestore config write failed.", err);
      }
    }

    writeConfigToFile(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update system configuration" });
  }
});

// 7. FACTORY RESET NOTES TO DEFAULT
app.post("/api/notes/reset", async (req, res) => {
  try {
    if (useFirestore && db) {
      try {
        // Clear old notes collection
        const snapshot = await getDocs(collection(db, "notes"));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // Seed fresh ones
        for (const note of DEFAULT_UNIVERSAL_NOTES) {
          const { id, ...data } = note;
          await setDoc(doc(db, "notes", id), data);
        }
        console.log("✅ Firestore notes factory reset completed.");
      } catch (err) {
        console.error("Firestore factory reset failed.", err);
      }
    }

    writeNotesToFile(DEFAULT_UNIVERSAL_NOTES);
    res.json(DEFAULT_UNIVERSAL_NOTES);
  } catch (err) {
    res.status(500).json({ error: "Failed to reset database" });
  }
});

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 8. UNIVERSAL AI DISCOVERY & EXPLAINER (with optional real-time search grounding!)
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, mode, noteContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    let responseText = "";
    let sources: any[] = [];
    let isFallback = false;
    let geminiErrorDetail = "";

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY is not defined. Initiating offline academic search fallback.");
      isFallback = true;
    } else {
      try {
        const ai = getGemini();
        let prompt = "";
        let useGrounding = false;

        if (mode === "news-gk") {
          useGrounding = true;
          prompt = `You are the Notsopedia Live Global AI Agent, connected to real-time search streams.
The user is asking a general knowledge, world news, or up-to-the-minute question: "${question}".
Use Google Search grounding to retrieve the absolute latest and most accurate current events.
Write a structured, elegant, informative response using Markdown.
Conclude with a brief '🔍 Live Fact-Check & Data Sources' section detailing the retrieved facts.`;
        } else if (mode === "notes-expert") {
          prompt = `You are the Notsopedia Academic Librarian & Smart Search Engine.
The student is asking: "${question}" based on study materials and notes in our repository.

Here is the exact contextual content retrieved from user-uploaded notes:
${noteContext || "No context materials provided. Please use your deep academic knowledge base to answer fully instead."}

Analyze the note context and formulate a precise, highly-organized explanation. Supplement any gaps using your native academic intelligence, making sure to highlight if any information is sourced directly from their uploaded notes.`;
        } else {
          // Study Companion / Exam Prep Mode
          prompt = `You are the Notsopedia Masterclass Grader & Exam Study Buddy.
The student asks: "${question}".
Draft a comprehensive, premium-grade university level textbook-style answer.
Incorporate:
1. **Rigor Definition**: Concise, highly professional definitions.
2. **Key Core Mechanics / Formulas**: Detail any math models, code syntaxes, or logical paradigms in tidy boxes.
3. **Deep Structural Analysis**: bulleted list of operations, components, or features.
4. **Pros & Practical Importance**: Advantages and constraints in a table or list.
5. **Practical Application / Case Study**: Provide a solved scenario or full-length descriptive example.`;
        }

        const config: any = {};
        if (useGrounding) {
          config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: config
        });

        responseText = response.text || "";

        // Parse Search grounding references if available
        try {
          const candidates = (response as any).candidates;
          if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
            sources = candidates[0].groundingMetadata.groundingChunks
              .map((chunk: any) => ({
                title: chunk.web?.title || "Web Reference",
                uri: chunk.web?.uri || "#"
              }))
              .filter((src: any) => src.uri !== "#");
          }
        } catch (e) {
          // Grounding not supported/failed, ignored silently
        }
      } catch (geminiError: any) {
        console.error("⚠️ Gemini API Call failed. Activating intelligent local fallback.", geminiError);
        geminiErrorDetail = geminiError.message || String(geminiError);
        isFallback = true;
      }
    }

    if (isFallback) {
      const query = question.toLowerCase();
      const matchedNotes = DEFAULT_UNIVERSAL_NOTES.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        note.subjectName.toLowerCase().includes(query) ||
        note.topicName.toLowerCase().includes(query)
      );

      if (geminiErrorDetail) {
        responseText = `ℹ️ **Offline Study Assistant Active (API Call Failure)**  \n*Notsopedia tried to query the Gemini API with your configured GEMINI_API_KEY, but the API returned an error message:*  \n\n> **${geminiErrorDetail}**  \n\n*Please ensure your API Key is correct under Settings > Secrets. In the meantime, we have generated a local academic match:*  \n\n`;
      } else {
        responseText = `ℹ️ **Offline Study Assistant Active (API Key Not Configured)**  \n*Notsopedia was unable to connect to the live Gemini API (GEMINI_API_KEY is not configured inside AI Studio Settings). Once you configure it, the live tutor will be fully connected!*  \n\nHere is a local search response matched from our verified Academic Database:\n\n`;
      }

      if (matchedNotes.length > 0) {
        const best = matchedNotes[0];
        responseText += `### Sourced from Lecture Note: "${best.title}" (${best.subjectCode})\n*Uploaded by ${best.uploaderName} (${best.uploaderRole})*\n\n${best.content}`;
        sources = matchedNotes.slice(0, 3).map(n => ({
          title: `Local Note: ${n.title}`,
          uri: `#local-note-${n.id}`
        }));
      } else {
        responseText += `### Topic: "${question}"  \n\nNo exact matches found in local study files. However, our offline indexer has synthesized these study resources for you:\n\n1. **Recommended Study Plan**: Review **Graph Traversal (CS-201)** or **Quantum Mechanics (PHYS-402)** in the Note Explorer to see deep code samples and markdown equations.\n2. **Academic Blueprint**: Connect your profile above to upload peer-reviewed documents to automatically index them on this topic.\n3. **Quick Fact**: Graph traversals like DFS/BFS run in $O(V + E)$ complexity, while the Schrödinger equation describes quantum state wave mechanics via $\\hat{H}\\psi = E\\psi$.`;
        sources = [
          { title: "Universal Syllabus CS-201", uri: "#cs201" },
          { title: "Quantum Physics PHYS-402", uri: "#phys402" }
        ];
      }
    }

    res.json({
      text: responseText,
      sources: sources
    });

  } catch (error: any) {
    console.error("General AI explainer error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", firestore: useFirestore, time: new Date().toISOString() });
});

// Setup Vite or Production Static Serving
async function startServer() {
  // Ensure seed run at startup
  await seedFirestoreIfNeeded();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Notsopedia Hub backend server booted successfully on port ${PORT}`);
    });
  } else {
    console.log("☁️ Running on Vercel serverless environment. Dynamic port binding skipped.");
  }
}

startServer();

export default app;
