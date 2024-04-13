const express = require("express");
const mongo = require("mongodb");
const app = express();

(async () => {
    const client = new mongo.MongoClient(process.env.uri);

    const db = client.db("town");   

    const users = db.collection("users");

    // name, username, email, password (hashed), phone number, dob
    const user = await users.findOne({
        username: "gay"
    })

    console.log(user);
})()

const PORT = process.env.PORT || 6969;

app.use(express.static("./public"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));