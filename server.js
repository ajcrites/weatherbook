var server, db, wunder,
    io = require("socket.io"),
    express = require("express"),
    bodyParser = require("body-parser"),
    WunderNodeClient = require("wundernode"),
    http = require("http"),
    path = require("path"),
    mysql = require("mysql2"),
    env = process.env.NODE_ENV || "development",
    config = require("./config"),
    app = express();

app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

server = http.createServer(app);

io = io.listen(server, {log: false});

server.listen(process.env.PORT || 3000);

db = mysql.createConnection(config[env].db);

wunder = new WunderNodeClient(config[env].weather["api-key"], false, 10, "minute");

app.get("/weather", function (req, res) {
    wunder.conditions(req.query.address, function (err, data) {
        if (err) {
            res.writeHead(400);
        }
        else {
            res.writeHead(200);
            res.write(data);
        }

        res.end();
    });
});

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

app.delete("/weatherbook/:wbID", function (req, res) {
    db.query("DELETE FROM Weatherbook WHERE wbID = ?", [req.params.wbID], function (err, data) {
        if (err) {
            res.writeHead(400);
        }
        else {
            res.writeHead(200);
        }

        res.end();

        io.sockets.emit("address-removed", req.params.wbID);
    });
});

app.patch("/weatherbook", function (req, res) {
    db.query("UPDATE Weatherbook SET firstName = ?, lastName = ?, address = ? WHERE wbID = ?",
        [req.body.firstName, req.body.lastName, req.body.address, req.body.wbID], function (err, data) {
            if (err) {
                res.writeHead(400);
            }
            else {
                res.writeHead(200);
            }

            res.end();
            io.sockets.emit("address-updated", req.body);
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

