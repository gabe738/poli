const express = require("express");
const mongo = require("mongodb");
const crypto = require("crypto");
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
app.use(express.json());

const sanitize = data => {
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

app.get("/signUp", (req, res) => {

})

app.post("/login", (req, res) => {
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);

    if (!username || !password) {
        res.sendStatus(401);
        return;
    }

    const passHash = crypto.createHash("sha256");
    passHash.update(password);
    
    const foundUser = users.findOne({ username_lower: username.toLowerCase() })
    
    if (!foundUser) {
        res.sendStatus(400);
        return;
    }

    if (foundUser.password_hash != passHash.digest("hex")) {
        res.sendStatus(401);
        return;
    }

    // successfully loged in !!! (need ot code)
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`));