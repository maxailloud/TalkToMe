$(function(){
    var nbReconnection = 5;

    var socket = null;

    var logout       = '#logout';

    var loginForm        = '#loginForm';
    var loginWrapper     = '#loginWrapper';
    var connectedWrapper = '#connectedWrapper';
    var chatWrapper      = '#chatWrapper';
    var roomForm         = '#roomForm';
    var roomInput        = '#roomInput';
    var roomsWrapper     = '#roomsWrapper';
    var roomList         = '#roomList';

    var messageForm      = '#messageForm';
    var messageInput     = '#messageInput';

    var connectedLogout     = '#connectedLogout';
    var connectedLogin      = '#connectedLogin';
    var displayedUsername   = '#displayedUsername';

    var currentUsername = null;

    createWeSocket();

    socket.on('connect', function()
    {
        console.log('connected');
    });

    socket.on('error', function(reason)
    {
        console.error('Unable to connect Socket.IO', reason);
    });

    socket.on('authenticated', function(username, rooms)
    {
        connect(username, rooms);

        console.log('authenticated');
    });

    socket.on('alreadyAuthenticated', function(username, rooms)
    {
        connect(username, rooms);

        console.log('alreadyAuthenticated');
    });

    socket.on('connecting', function(transportType)
    {
        console.log('connecting...');
    });

    socket.on('disconnect', function()
    {
        console.log('disconnect');
    });

    socket.on('disconnected', function()
    {
        socket.disconnect();

        $(loginWrapper).show();
        $(roomsWrapper).hide();
        $(connectedWrapper).hide();

        socket = null;

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

    socket.on('read', function(data)
    {
        console.log(data);
    });

    socket.on('room created', function()
    {
        console.log('room created');
    });

    function createWeSocket()
    {
        socket = io.connect('http://localhost:1337',
        {
            'force new connection'      : true,
            'reconnect'                 : true,
            'reconnection delay'        : 500,
            'max reconnection attempts' : nbReconnection,
            'log level'                 : 1
        });
    }

    function displayRooms(rooms)
    {
        console.log(rooms);
        var listRooms = '';
        if(0 == rooms.length)
        {
            listRooms = 'No room';
        }
        else
        {
            for(var i =0; i < rooms.length; i++)
            {
                listRooms += '<li>' + i + '(' + rooms[i].length + ')</li>';
            }
        }

        $(roomList).html(listRooms);
    }

    function connect(username, rooms)
    {
        currentUsername = username;

        displayRooms(rooms);

        $(displayedUsername).html(username);

        $(loginWrapper).hide();
        $(roomsWrapper).show();
        $(connectedWrapper).show();
    }

    function disconnect()
    {
        if(null != socket)
        {
            socket.emit('disconnectUser');
        }
    }

    function handleLogin()
    {
        currentUsername = $('#username').val();

        if('' != currentUsername)
        {
            if(null == socket)
            {
                createWeSocket();
            }

            socket.emit('authenticate', currentUsername);
        }
        else
        {
            console.log('no login');
        }
    }

    $(loginForm).on('submit', function(event)
    {
        handleLogin();

        event.preventDefault();
    });

    function sendMessage()
    {
        var message = $(messageInput).val();
        socket.emit('write', message);
    }

    function createRoom()
    {
        var room = $(roomInput).val();

        if('' != room)
        {
            socket.emit('create room', currentUsername);
        }
        else
        {
            console.log('no room');
        }
    }

    $(logout).on('click', function(event)
    {
        disconnect();

        event.preventDefault();
    });

    $(roomForm).on('submit', function(event)
    {
        createRoom();

        event.preventDefault();
    });

    $(messageForm).on('submit', function(event)
    {
        sendMessage();

        event.preventDefault();
    });
});
