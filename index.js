const express = require("express");
const mongo = require("mongodb");
const crypto = require("crypto");
const path = require("path");
const app = express();


const client = new mongo.MongoClient(process.env.uri);

const db = client.db("town");   

const users = db.collection("users");
const posts = db.collection("posts");

const PORT = process.env.PORT || 6969;

app.set("view engine", "ejs");
app.use(express.json());

const sanitize = data => {
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim(); // improve fr
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/main/index.html"));
})

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/createAccount/index.html"));
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/login/login.html"));
})

app.post("/signup", async (req, res) => {
    const name = sanitize(req.body.name);
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const confirmed_password = sanitize(req.body.confirm_password);
    const email = sanitize(req.body.email);
    const phoneNumber = sanitize(req.body.phone);

    if (!username || !password) {
        res.sendStatus(400); // bad request
        return;
    }

    if (password != confirmed_password) {
        res.status(400).send("uh oh. youre so skibidi, on toilet!!!!!");
        return;
    }


    const passHash = crypto.createHash("sha256");
    passHash.update(password);

    const foundUser = await users.findOne({ username_lower: username.toLowerCase() })
    
    if (foundUser) {
        res.status(400).send("uh ohh.. A SKbidi user with that name ALREADY EXISTS. on toilet bro..a"); // bad request
        return;
    }

    const userCookie = crypto.randomUUID();

    users.insertOne({
        name: name,
        username: username,
        username_lower: username.toLowerCase(),
        password_hash: passHash.digest("hex"),
        email: email,
        phone: phoneNumber,
        cookie: userCookie
    })

    res.status(200).json({
        cookie: userCookie
    });

    console.log("user created:", username);
})

app.post("/login", (req, res) => {
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);

    if (!username || !password) {
        res.sendStatus(400); // bad request
        return;
    }

    const passHash = crypto.createHash("sha256");
    passHash.update(password);
    
    const foundUser = users.findOne({ username_lower: username.toLowerCase() })
    
    if (!foundUser) {
        res.sendStatus(400); // bad request
        return;
    }

    if (foundUser.password_hash != passHash.digest("hex")) {
        res.sendStatus(401); // unauthorized
        return;
    }

    // successfully loged in !!! (need ot code)
})

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./404.html"));
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`));