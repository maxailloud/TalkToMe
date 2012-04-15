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
    socket.on('disconnect', function()
    {
        console.log('user disconnected');
    });

    socket.on('authenticate', function(username)
    {
        socket.emit('authenticated', username);
    });
});

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
        callback('No session', false);
    }
    else
    {
//        console.log('pouet : ');
//        console.log(cookies);

        // Store session ID in handshake data, we'll use it later to associate
        // session with open sockets
//        handshakeData.sessionID = sessionID;
        // On récupère la session utilisateur, et on en extrait son username
//        app.sessionStore.get(sessionID, function(err, session)
//        {
//            if(!err && session && session.username)
//            {
//                // On stocke ce username dans les données de l'authentification, pour réutilisation directe plus tard
//                handshakeData.username = session.username;
//                // OK, on accepte la connexion
                callback(null, true);
//            }
//            else
//            {
//                // Session incomplète, ou non trouvée
//                callback(err || 'User not authenticated', false);
//            }
//        });
    }
});

// Middleware for limited access
function requireLogin (req, res, next)
{
    if(req.session.username)
    {
        // User is authenticated, let him go
        next();
    }
    else
    {
        // Otherwise, we redirect him to login form
        res.redirect("/login");
    }
}

// Routes
app.get('/', [requireLogin], function (req, res, next)
{
    var rooms = io.sockets.manager.rooms;

    // Delete default room
    delete rooms[''];

    var roomList = '';
    var nbRoom = 0;

    for(var i in rooms)
    {
        roomList += '<li><a href="/room/"' + i + ' title="Go to ' + i + ' room">' + i + '</a>(' + rooms[i].length + ')</li>';
        nbRoom++;
    }

    if(0 == nbRoom)
    {
        roomList = '<li>Aucun salon</li>';
    }

    res.render('index', { 'username': req.session.username, 'rooms': roomList });
});

app.get("/login", function (req, res)
{
    // Show form, default value = current username
    res.render("login", { "username": req.session.username, "error": null });
});
app.post("/login", function (req, res)
{
    var options = { "username": req.body.username, "error": null };

    if(!req.body.username)
    {
        options.error = "User name is required";
        res.render("login", options);
    }
    else if(req.body.username == req.session.username)
    {
        // User has not changed username, accept it as-is
        res.redirect("/");
    }
    else if(!req.body.username.match(/^[a-zA-Z0-9\-_]{3,}$/))
    {
        options.error = "User name must have at least 3 alphanumeric characters";
        res.render("login", options);
    }
    else
    {
        // Validate if username is free
        req.sessionStore.all(function (err, sessions)
        {
            if(!err)
            {
                var found = false;
                for(var i = 0; i < sessions.length; i++)
                {
                    var session = JSON.parse(sessions[i]); // Si les sessions sont stockées en JSON
                    if(session.username == req.body.username)
                    {
                        err = "User name already used by someone else";
                        found = true;
                        break;
                    }
                }
            }
            if(err)
            {
                options.error = ""+err;
                res.render("login", options);
            }
            else
            {
                req.session.username = req.body.username;
                res.redirect("/");
            }
        });
    }
});

app.get('/room/:room', function (req, res, next)
{
    console.log(req.params.room);
    var rooms = io.sockets.manager.rooms;
    console.log(rooms);
    res.render('room', { "username": req.session.username });
});

// Start server
app.listen(port, function()
{
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});