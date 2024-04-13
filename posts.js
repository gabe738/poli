const express = require("express");
const mongo = require("mongodb");
const app = express();
const formattedTime = require("./timeManager.js");

const newPost = (contentIn) => async () => {
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");   
    const posts = db.collection("posts");

    const time = formattedTime.getTime();

    await posts.insertOne({
        content: contentIn,
        time: time
    });
};

const reviewPosts = async () => {
    const client = new mongo.MongoClient(process.env.uri);

    await client.connect();

    const db = client.db("town");

    const posts = db.collection("posts");

    const poop = await posts.find().toArray();

    console.log(poop);
};

newPost("test");

reviewPosts();

// console.log(formattedTime.getTime())

const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

