/**
 * Module dependencies.
 */
const
    path        = require('path'),
    express     = require('express'),
    app         = express.createServer(),
    port        = process.env.PORT || 1337
    io          = require('socket.io').listen(app),
    parseCookie = require('connect').utils.parseCookie;
;

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
app.configure('development', function(){
    this.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
    this.use(express.errorHandler());
});

// WebSocket communication
io.sockets.on('connection', function(socket)
{
    socket.join('test');
    socket.broadcast.to('test').emit('new tester');

    console.log(users[socket.handshake.sessionID]);
    if(undefined != users[socket.handshake.sessionID] && null != users[socket.handshake.sessionID])
    {
        socket.emit('alreadyAuthenticated', users[socket.handshake.sessionID], getRooms());
    }

    socket.on('disconnect', function()
    {
        console.log('user disconnected or refreshing');
    });

    socket.on('disconnectUser', function()
    {
        delete users[socket.handshake.sessionID];

        socket.emit('disconnected');
    });

    socket.on('authenticate', function(username)
    {
        socket.handshake.username = username;
        users[socket.handshake.sessionID] = username;

        console.log('rooms : ' + getRooms());
        socket.emit('authenticated', username, getRooms());
    });

    socket.on('create room', function(roomName)
    {
//        socket.join(roomName);

        socket.emit('room created');
    });
});

function getRooms()
{
    var rooms = io.sockets.manager.rooms;
    console.log(rooms);

    // Delete default room
    delete rooms[''];

    console.log(rooms);

    var roomList = Array();

    for(var i in rooms)
    {
        console.log(i);
        console.log(rooms[i]);
        roomList[i] = rooms[i].length;
    }

    console.log(roomList);

    return roomList;
}

// Websokcet authorization configuration
io.sockets.authorization(function(handshakeData, callback)
{
    // Read cookies from handshake headers
    var cookies = parseCookie(handshakeData.headers.cookie);

    // We're now able to retrieve session ID
    var sessionID = cookies['connect.sid'];

    // No session? Refuse connection
    if(!sessionID)
    {
        callback('No session found', false);
    }
    else
    {
        handshakeData.sessionID = sessionID;
        callback(null, true);
    }
});

// Routes
app.get('/', function (req, res, next)
{
    res.render('index');
});

// Start server
app.listen(port, function()
{
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});