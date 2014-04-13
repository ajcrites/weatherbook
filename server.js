var server, db,
    io = require("socket.io"),
    express = require("express"),
    bodyParser = require("body-parser"),
    http = require("http"),
    path = require("path"),
    mysql = require("mysql2"),
    env = process.env.NODE_ENV || "development",
    config = require("./config"),
    app = express();

app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

server = http.createServer(app);

io = io.listen(server);

server.listen(process.env.PORT || 3000);

db = mysql.createConnection(config);

app.post("/weatherbook", function (req, res) {
    db.query("INSERT INTO Weatherbook (firstName, lastName, address) VALUES (?, ?, ?)",
        [req.body.firstName, req.body.lastName, req.body.address], function (err, data) {
            if (err) {
                res.writeHead(400);
            }
            else {
                res.writeHead(201);
                res.write("" + data.insertId);
            }

            res.end();

            io.sockets.emit("address-added", {
                wbID: data.insertId,
                firstName: data.firstName,
                lastName: data.lastName,
                address: data.address
            });
        });
});

io.sockets.on("connection", function (socket) {
    db.query("SELECT wbID, firstName, lastName, address FROM Weatherbook", function (err, rows) {
        if (err) {
            socket.emit("db-error", err);
        }
        else {
            socket.emit("init-book", rows);
        }
    });

});

