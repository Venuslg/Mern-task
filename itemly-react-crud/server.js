import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "20kb" }));

let items = [
  { id: 1, name: "Book", price: 250 },
  { id: 2, name: "Pen", price: 25 }
];
let nextId = 3;

function parseItem(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const rawPrice = body?.price;
  const price = Number(rawPrice);

  if (
    !name ||
    name.length > 80 ||
    rawPrice === "" ||
    rawPrice === null ||
    rawPrice === undefined ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return null;
  }

  return { name, price };
}

// READ: return every item in the in-memory collection.
app.get("/api/items", (req, res) => {
  res.json(items);
});

// CREATE: validate and add one item.
app.post("/api/items", (req, res) => {
  const values = parseItem(req.body);
  if (!values) {
    return res.status(400).json({
      message: "Enter a name (up to 80 characters) and a non-negative price."
    });
  }

  const item = { id: nextId++, ...values };
  items.push(item);
  res.status(201).json(item);
});

// UPDATE: change the name and price of an existing item.
app.put("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = Number.isInteger(id) ? items.find((entry) => entry.id === id) : null;
  if (!item) return res.status(404).json({ message: "Item not found." });

  const values = parseItem(req.body);
  if (!values) {
    return res.status(400).json({
      message: "Enter a name (up to 80 characters) and a non-negative price."
    });
  }

  Object.assign(item, values);
  res.json(item);
});

// DELETE: remove an item from the collection.
app.delete("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = Number.isInteger(id) ? items.findIndex((entry) => entry.id === id) : -1;
  if (index === -1) return res.status(404).json({ message: "Item not found." });

  const [deletedItem] = items.splice(index, 1);
  res.json({ message: "Item deleted successfully.", item: deletedItem });
});

// Serve the production React build when it exists.
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) res.status(404).send("Build the React app first using npm run build.");
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({
    message: status === 400 ? "The request body must be valid JSON." : "The server could not complete the request."
  });
});

app.listen(PORT, () => {
  console.log(`Itemly API running at http://localhost:${PORT}`);
});
