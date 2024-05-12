const express = require("express");
const mongo = require("mongodb");
const timeManager = require("../timeManager.js"); // I MADE THIS! It uses ISO 8601 and turns it into time in milliseconds to enable easy comparisons from time
const app = express();

const sanitize = data => { // Redefining it because we felt it was easier to copy paste instead of importing it
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

// add_post {
//     author_id,
//     title,
//     content,
//     city,
//     is_comment
// }

const client = new mongo.MongoClient(process.env.uri); // The mongoDB setup code

client.connect();

const db = client.db("town");

const posts = db.collection("posts");
const users = db.collection("users");





const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

