$(function(){
    var nbReconnection = 5;

    var socket = null;

    var logout = '#logout';

    var loginForm    = '#loginForm';
    var loginWrapper = '#loginWrapper';
    var chatWrapper  = '#chatWrapper';

    var connectedLogout     = '#connectedLogout';
    var connectedLogin      = '#connectedLogin';
    var displayedUsername   = '#displayedUsername';

    var username = null;

    /**
     * @param string login
     */
    function connect()
    {
        socket = io.connect('http://localhost:1337', {
            'force new connection'      : true,
            'reconnect'                 : true,
            'reconnection delay'        : 500,
            'max reconnection attempts' : nbReconnection,
            'log level'                 : 1
        });

        handleEvent();
    }

    function disconnect()
    {
        if(null != socket)
        {
            socket.disconnect();

            $(loginWrapper).show();
            $(chatWrapper).hide();

            $(connectedLogin).hide();
            $(connectedLogout).hide();
        }
    }

    function handleEvent()
    {
        socket.on('connect', function()
        {
            socket.emit('authenticate', username);

            console.log('connected');
        });

        socket.on('authenticated', function(connectedUsername)
        {
            $(displayedUsername).html(connectedUsername);

            $(loginWrapper).hide();
            $(chatWrapper).show();

            $(connectedLogin).show();
            $(connectedLogout).show();

            console.log('authenticated');
        });

        socket.on('connecting', function(transportType)
        {
            console.log('connecting...');
        });

        socket.on('disconnect', function()
        {
            console.log('disconnected');
        });

        socket.on('reconnecting', function(reconnectionDelay, reconnectionAttempts)
        {
            console.log('server reconnecting...' + reconnectionAttempts);
            console.log(reconnectionDelay);
            if(nbReconnection <= reconnectionAttempts)
            {
                console.log('all reconnect attempts failed');
            }
        });

        socket.on('reconnect', function(transportType, reconnectionAttempts)
        {
            console.log('reconnected');
        });

        // Event never send, see https://github.com/LearnBoost/socket.io/issues/652
        socket.on('reconnect_failed', function()
        {
            console.log('reconnection failed');
        });
    }

    $(loginForm).on('submit', function(event)
    {
        handleLogin();
        event.preventDefault();
    });

    function handleLogin()
    {
        username = $('#username').val();

        if('' != username)
        {
            connect();
        }
        else
        {
            console.log('pouet');
        }
    }

    $(logout).on('click', function(){
        disconnect();
    });

    function getRooms()
    {
        socket = io.connect('http://localhost:1337', {
            'force new connection'      : true,
            'reconnect'                 : true,
            'reconnection delay'        : 500,
            'max reconnection attempts' : nbReconnection,
            'log level'                 : 1
        });

        socket.on('connection', function(socket)
        {
            console.log(socket._events);
//            socket.on('ping', function(data)
//            {
//                console.log(socket._events);
//            });
        });
    }
});
