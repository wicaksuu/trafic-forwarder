const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/ip_port_forwarder", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// IP and Port Schema
const ipPortSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  port: { type: Number, required: true },
});

const IpPort = mongoose.model("IpPort", ipPortSchema);

// CRUD Routes
// Create
app.post("/api/ipport", async (req, res) => {
  try {
    const newIpPort = new IpPort(req.body);
    const savedIpPort = await newIpPort.save();
    res.status(201).json(savedIpPort);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Read
app.get("/api/ipport", async (req, res) => {
  try {
    const ipPorts = await IpPort.find();
    res.status(200).json(ipPorts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update
app.put("/api/ipport/:id", async (req, res) => {
  try {
    const updatedIpPort = await IpPort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedIpPort);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete
app.delete("/api/ipport/:id", async (req, res) => {
  try {
    await IpPort.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "IP and Port deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
