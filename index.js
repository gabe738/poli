const express = require("express");
const mongo = require("mongodb");

const client = new mongo.MongoClient(process.env.uri);

(async () => {
    await client.connect();

    const db = client.db("db");

    db.createCollection("users");
})()

const app = express();
const PORT = process.env.PORT || 6969;

app.use(express.static("./public"));

console.log(process.env.uri)

app.listen(PORT, () => console.log(`listening on port ${PORT}`));