require('dotenv').config();

// Program constants and enviroment stuff
const { PORT, IP } = require('./constants');

// Local imports
const problemRouter = require("./routes/problems");

// create express server
const express = require("express");
const app = express();

// create socket.io conneciton
const http = require("http").createServer(app);
const io = require('socket.io')(http);

// set static asset folder and user JSON body parsers
app.use(express.static("client/"));
app.use(express.json());

/**
 * Listen for socket connection and disconnections.
 */
io.on("connection", socket => {
    // when the socket first connects
    console.log("User connected.");
    socket.emit("problem", { problem: "n_fib" });
    
    // propagate problem set message to all clients
    socket.on("setProblem", msg => {
        io.emit("problem", msg);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected.");
    });
});

/**
* Start the server listening at PORT number.
*/
http.listen(PORT, IP, () => {
    console.log("Server running on http://" + IP + ":" + PORT);
});

/**
 * Serve the web application.
 */
app.get("/", (req, res) => {
    res.sendFile("index.html");
});

app.get("/admin", (req, res) => {
    res.sendFile("admin.html", { root: "client/"});
});

app.use("/problem", problemRouter);