const express = require("express");
const mongo = require("mongodb");
const app = express();

const newPost = (contentIn) => async () => {
    const client = new mongo.MongoClient(process.env.uri);

    const db = client.db("town");   

    const posts = db.collection("posts");

    posts.insertOne({
        content: contentIn
    });
};

const reviewPosts = async () => {
    const client = new mongo.MongoClient(process.env.uri);

    const db = client.db("town");

    const posts = db.collection("posts");

    const poop = await posts.find().toArray();

    console.log(poop);
};

newPost("test");

reviewPosts();

const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

