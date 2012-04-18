$(function() {
    var nbReconnection      = 5;

    var socket              = null;

    var logout              = '#logout';

    var loginForm           = '#loginForm';
    var loginWrapper        = '#loginWrapper';
    var connectedWrapper    = '#connectedWrapper';

    var roomForm            = '#roomForm';
    var roomInput           = '#roomInput';
    var roomsWrapper        = '#roomsWrapper';
    var roomList            = '#roomList';

    var chatWrapper         = '#chatWrapper';
    var nbUser              = '#nbUser';
    var roomName            = '#roomName';
    var userList            = '#userList';

    var roomLeave           = '#roomLeave';

    var messageForm         = '#messageForm';
    var messageInput        = '#messageInput';

    var connectedLogout     = '#connectedLogout';
    var connectedLogin      = '#connectedLogin';
    var displayedUsername   = '#displayedUsername';

    var currentUsername     = null;
    var currentRoom         = null;

    createWeSocket();

    function createWeSocket()
    {
        socket = io.connect('http://localhost:1337', {
            'force new connection'      : true,
            'reconnect'                 : true,
            'reconnection delay'        : 500,
            'max reconnection attempts' : nbReconnection,
            'log level'                 : 1
        });
    }

    socket.on('connect', function() {
        console.log('connected');
    });

    socket.on('error', function(reason) {
        console.error('Unable to connect Socket.IO', reason);
    });

    socket.on('authenticated', function(data) {
        connect(data['username'], data['rooms']);

        console.log('authenticated');
    });

    socket.on('alreadyAuthenticated', function(data) {
        connect(data['username'], data['rooms']);

        console.log('alreadyAuthenticated');
    });

    socket.on('connecting', function(transportType) {
        console.log('connecting...');
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
    });

    socket.on('disconnected', function() {
        socket.disconnect();

        $(loginWrapper).show();
        $(roomsWrapper).hide();
        $(connectedWrapper).hide();

        socket = null;

        console.log('disconnected');
    });

    socket.on('reconnecting', function(reconnectionDelay, reconnectionAttempts) {
        console.log('server reconnecting...' + reconnectionAttempts);
        console.log(reconnectionDelay);
        if(nbReconnection <= reconnectionAttempts)
        {
            console.log('all reconnect attempts failed');
        }
    });

    socket.on('reconnect', function(transportType, reconnectionAttempts) {
        console.log('reconnected');
    });

    // Event never send, see https://github.com/LearnBoost/socket.io/issues/652
    socket.on('reconnect_failed', function() {
        console.log('reconnection failed');
    });

    socket.on('read', function(data) {
        console.log(data);
    });

    socket.on('room created', function(roomName) {
        console.log('room created');

        roomJoined(roomName);
    });

    socket.on('room leaved', function(rooms) {
        console.log('room leaved');

        roomLeaved(rooms);
    });

    socket.on('room not created', function(error) {
        alert(error);
    });

    socket.on('new user', function() {
        console.log('new user');
    });

    socket.on('update rooms', function(rooms) {
        console.log('update rooms');
        displayRooms(rooms);
    });

    function displayRooms(rooms) {
        var listRooms = '';
        var nbRoom = 0;
        for(var i in rooms) {
            listRooms += '<li>' + i + ' (' + rooms[i] + ' user' + (1 < rooms[i] ? 's' : '') + ')</li>';
            nbRoom++;
        }
        
        if(0 === nbRoom)
        {
            listRooms = '<li>No room</li>';
        }

        $(roomList).html(listRooms);
    }

    function roomJoined(room) {
        currentRoom = room;

        $(roomName).html(room);
        $(nbUser).html(1);

        $(chatWrapper).show();

        $(roomsWrapper).hide();
    }

    function leaveRoom() {
        socket.emit('leave room', currentRoom);
    }

    function roomLeaved(rooms) {
        currentRoom = null;

        displayRooms(rooms);

        $(chatWrapper).hide();

        $(roomsWrapper).show();
    }

    function connect(username, rooms) {
        currentUsername = username;

        displayRooms(rooms);

        $(displayedUsername).html(username);

        $(loginWrapper).hide();
        $(roomsWrapper).show();
        $(connectedWrapper).show();
    }

    function disconnect() {
        if(null != socket) {
            socket.emit('disconnectUser');
        }
    }

    function handleLogin() {
        currentUsername = $('#username').val();

        if('' != currentUsername) {
            if(null === socket) {
                createWeSocket();
            }

            socket.emit('authenticate', currentUsername);
        }
        else {
            console.log('no login');
        }
    }

    $(loginForm).on('submit', function(event) {
        handleLogin();

        event.preventDefault();
    });

    function sendMessage() {
        var message = $(messageInput).val();
        socket.emit('write', message);
    }

    function createRoom() {
        var room = $(roomInput).val();

        if('' != room) {
            socket.emit('create room', room);
        }
        else {
            console.log('no room');
        }
    }

    $(logout).on('click', function(event) {
        disconnect();

        event.preventDefault();
    });

    $(roomForm).on('submit', function(event) {
        createRoom();

        event.preventDefault();
    });

    $(messageForm).on('submit', function(event) {
        sendMessage();

        event.preventDefault();
    });

    $(roomLeave).on('click', function(event) {
        leaveRoom();

        event.preventDefault();
    });
});
