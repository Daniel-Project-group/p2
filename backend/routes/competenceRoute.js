

// Imports
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// We cd up to json folder when referencing dataPath
const dataPath = (file) => path.join(__dirname, "../json", file);

// Furthermore we'll need some linker to LLM Api

// This file should contain the array of LLM generated keywords
// Per that speciic curicculum