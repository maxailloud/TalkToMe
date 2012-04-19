/**
 * Module dependencies.
 */
const path        = require('path');
const express     = require('express');
const app         = express.createServer();
const port        = process.env.PORT || 1337;
const io          = require('socket.io').listen(app);
const parseCookie = require('connect').utils.parseCookie;

var users = {};

// Configuration
app.configure(function() {
    this.set('views', path.join(__dirname, 'views'));
    this.set('view engine', 'ejs');
    this.set("view options", { layout: false });
    this.use(express.static(path.join(__dirname, '/public')));

    // Allow parsing cookies from request headers
    this.use(express.cookieParser());

    // Allow parsing form data
    this.use(express.bodyParser());

    // Session management
    // Internal session data storage engine, this is the default engine embedded with connect.
    // Much more can be found as external modules (Redis, Mongo, Mysql, file...).
    // Look at "npm search connect session store"
    this.sessionStore = new express.session.MemoryStore({ reapInterval: 60000 * 10 });
    this.use(express.session({
        // Private crypting key
        "secret": "some private string",
        "store":  this.sessionStore
    }));
});
app.configure('development', function() {
    this.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function() {
    this.use(express.errorHandler());
});

// WebSocket communication
io.sockets.on('connection', function(socket) {

    if(undefined !== users[socket.handshake.sessionID] && null != users[socket.handshake.sessionID]) {
        socket.emit('alreadyAuthenticated', { 'username': users[socket.handshake.sessionID], 'rooms': getRooms() });
    }

    socket.on('disconnect', function() {
        console.log('user disconnected or refreshing');
    });

    socket.on('disconnectUser', function() {
        delete users[socket.handshake.sessionID];

        socket.emit('disconnected');
    });

    socket.on('authenticate', function(username) {
        socket.handshake.username = username;
        users[socket.handshake.sessionID] = username;

        socket.emit('authenticated', { 'username': username, 'rooms': getRooms() });
    });

    socket.on('create room', function(roomName) {
        var rooms = getRooms();

        if(undefined === rooms[roomName]) {
            socket.join(roomName);

            var updatedRooms = getRooms();

            socket.broadcast.to('').emit('update rooms', updatedRooms);

            socket.emit('room created', roomName);
        }
        else
        {
            socket.emit('room not created', 'Room "' + roomName + '" already exists, join it if you want to talk into.');
        }
    });

    socket.on('leave room', function(roomName) {
        socket.leave(roomName);

        var rooms = getRooms();

        socket.broadcast.to('').emit('update rooms', rooms);

        socket.emit('room leaved', rooms);
    });
});

function getRooms() {
    var rooms = io.sockets.manager.rooms;

    var roomList = {};

    for(var i in rooms) {
        if('' !== i) {
            roomList[i.replace('/', '')] = rooms[i].length;
        }
    }

    return roomList;
}

// Websokcet authorization configuration
io.sockets.authorization(function(handshakeData, callback) {
    // Read cookies from handshake headers
    var cookies = parseCookie(handshakeData.headers.cookie);

    // We're now able to retrieve session ID
    var sessionID = cookies['connect.sid'];

    // No session? Refuse connection
    if(!sessionID) {
        callback('No session found', false);
    }
    else {
        handshakeData.sessionID = sessionID;
        callback(null, true);
    }
});

// Routes
app.get('/', function (req, res, next) {
    res.render('index');
});

// Start server
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});