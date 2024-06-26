const express = require("express");
const mongo = require("mongodb");
const fs = require("fs");
const { parse } = require("csv-parse");
const app = express();

app.use(express.json());

const sanitize = data => {
    // deletes characters that could cause cross-site scripting
    return escape(data.replaceAll(/(<|>|\/|"|'|`|\\)/g, "")).trim();
}

// const temp = async () => {
app.post("/searchCities", async (req, res) => { // searchTerm
    console.log(req)

    const search = sanitize(req.body.searchTerm);
    // const search = "lawrence";
    
    const client = new mongo.MongoClient(process.env.uri);

    client.connect();

    const db = client.db("town");

    const users = db.collection("users");

    // const allPosts = posts.find({
    //     title: search
    // }).toArray();

    // console.log("hello mario");

    const ret = [];

    // fs.createReadStream("./output2.csv")
    // .pipe(parse({ delimiter: ",", from_line: 1 }))
    // .on("data", async function (row) {
    //     // console.log(row);
    //     await ret.push(row);
    // })

    const output2 = fs.readFileSync("./output2.csv", { encoding: "utf8" });

    for (let line of output2.split("\n")) {
        line = line.replaceAll("\r", "").split(",");
        if ((line[0] + ", " + line[1]).toLowerCase().startsWith(search.toLowerCase())) ret.push(line);
    }
    
    client.close();

    res.json(ret);

});

// deprecated
// app.get("/changeCity", async (req, res) => { // userId, newCity

//     const userId = req.body.userId;
//     const newCity = req.body.newCity;
    
//     const client = new mongo.MongoClient(process.env.uri);

//     client.connect();

//     const db = client.db("town");

//     const users = db.collection("users");

//     posts.updateOne({_id: userId}, { $set: {
//         city: newCity
//     }});
    
//     client.close();

// });

const PORT = process.env.PORT || 6969;

app.use(express.static("./"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

