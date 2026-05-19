const express = require("express");
const bcrypt = require("bcrypt");

// Helper function
const { readJson, writeJson } = require("../../utils/jsonDb");

const router = express.Router();

const sessions = require("../../sessionStorage");

// Redundant with helper: const dataPath = (file) => path.join(__dirname, "../json", file);

router.post("/", (req, res) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
        sessions.delete(sessionId);
    }

    res.clearCookie("sessionId");

    res.json({ message: "Logged out successfully" });
});

module.exports = router;
