// Imports
const fs = require('fs');
const path = require('path');

// Function for going up the folder
function dataPath(fileName) {
    return path.join(__dirname, "../json", fileName);
}

// Function for reading the general json file, which we define in each unique js files

function readJson(fileName) {
    // Logic chunk now with fileName
    if (fs.existsSync(dataPath(fileName))) {
                const data = fs.readFileSync(dataPath(fileName), "utf-8");
            return data.trim() ? JSON.parse(data) : [];
     }
     // Fallback if the file doesnt exist
     return [];
 }

 function writeJson(fileName,data){
    fs.writeFileSync(dataPath(fileName),JSON.stringify(data,null,2));
 }

 module.exports = {
    readJson,
    writeJson
};
