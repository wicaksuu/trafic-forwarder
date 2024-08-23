const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const net = require("net");

const app = express();
app.use(bodyParser.json());

const PUBLIC_IP = "103.132.230.116";
const PUBLIC_PORT_START = 4000;
const PUBLIC_PORT_END = 6000;

const db = mysql.createConnection({
  host: "103.132.230.97",
  user: "wicaksu",
  password: "Jack03061997",
  database: "trafic_forwarder",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
  autoMigrate();
  checkAndForward();
});

const autoMigrate = () => {
  const createDatabaseQuery = "CREATE DATABASE IF NOT EXISTS trafic_forwarder";
  db.query(createDatabaseQuery, (err, result) => {
    if (err) {
      console.error("Error creating database:", err);
      return;
    }
    console.log("Database checked/created");

    const useDatabaseQuery = "USE trafic_forwarder";
    db.query(useDatabaseQuery, (err, result) => {
      if (err) {
        console.error("Error using database:", err);
        return;
      }
      console.log("Using database");

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS forwards (
          id INT AUTO_INCREMENT PRIMARY KEY,
          internal_ip VARCHAR(255) NOT NULL,
          internal_port INT NOT NULL,
          external_port INT NOT NULL,
          namespace VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL
        )
      `;
      db.query(createTableQuery, (err, result) => {
        if (err) {
          console.error("Error creating table:", err);
          return;
        }
        console.log("Table checked/created");
      });
    });
  });
};

const checkAndForward = () => {
  const query = 'SELECT * FROM forwards WHERE status = "offline"';
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL:", err);
      return;
    }
    results.forEach((forward) => {
      // Implement the forwarding logic here

      console.log(
        `Forwarding from ${forward.internal_ip}:${forward.internal_port} to external port ${forward.external_port}`
      );
      // Update status to online
      const updateQuery = 'UPDATE forwards SET status = "online" WHERE id = ?';
      db.query(updateQuery, [forward.id], (err, result) => {
        if (err) {
          console.error("Error updating status in MySQL:", err);
        }
      });
    });
  });
};

app.post("/forward", (req, res) => {
  const { internal_ip, internal_port, external_port, namespace, name } =
    req.body;

  if (!internal_ip || !internal_port || !external_port || !namespace || !name) {
    return res.status(400).send("All fields are required");
  }

  const query =
    'INSERT INTO forwards (internal_ip, internal_port, external_port, namespace, name, status) VALUES (?, ?, ?, ?, ?, "offline")';
  db.query(
    query,
    [internal_ip, internal_port, external_port, namespace, name],
    (err, result) => {
      if (err) {
        console.error("Error inserting data into MySQL:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.status(201).send("Forwarding rule created successfully");
      checkAndForward();
    }
  );
});

app.get("/forwards", (req, res) => {
  const query = "SELECT * FROM forwards";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.status(200).json(results);
  });
});

app.put("/forward/:id", (req, res) => {
  const { id } = req.params;
  const { internal_ip, internal_port, external_port, namespace, name, status } =
    req.body;

  const query =
    "UPDATE forwards SET internal_ip = ?, internal_port = ?, external_port = ?, namespace = ?, name = ?, status = ? WHERE id = ?";
  db.query(
    query,
    [internal_ip, internal_port, external_port, namespace, name, status, id],
    (err, result) => {
      if (err) {
        console.error("Error updating data in MySQL:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.status(200).send("Forwarding rule updated successfully");
    }
  );
});

app.delete("/forward/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM forwards WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting data from MySQL:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.status(200).send("Forwarding rule deleted successfully");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
