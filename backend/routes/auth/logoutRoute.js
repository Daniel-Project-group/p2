const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const router = express.Router();

const dataPath = (file) => path.join(__dirname, "../json", file);