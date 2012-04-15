/**
 * Module dependencies.
 */
const
    path    = require('path'),
    express = require('express'),
    app     = express.createServer(),
    port    = process.env.PORT || 1337
    io      = require('socket.io').listen(app)
;

// Configuration
app.configure(function() {
    this.set('views', path.join(__dirname, 'views'));
    this.set('view engine', 'ejs');
    this.set("view options", { layout: false });
    this.use(express.static(path.join(__dirname, '/public')));

    // Allow parsing cookies from request headers
    this.use(express.cookieParser());

    // Session management
    this.use(express.session({
        // Private crypting key
        "secret": "some private string",
        // Internal session data storage engine, this is the default engine embedded with connect.
        // Much more can be found as external modules (Redis, Mongo, Mysql, file...).
        // Look at "npm search connect session store"
        "store":  new express.session.MemoryStore({ reapInterval: 60000 * 10 })
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

// Routes
app.get('/', function (req, res, next) {
    res.render('index.ejs');
});

// Start server
app.listen(port, function(){
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});