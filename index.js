const express = require("express");
const mongo = require("mongodb");
const app = express();

const PORT = process.env.PORT || 6969;

app.use(express.static("./public"));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));