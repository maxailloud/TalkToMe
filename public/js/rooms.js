$(function()
{
    var socket = io.connect('http://localhost:1337');

    socket.emit('rooms', {});

    socket.on('rooms', function(data)
    {
        // Delete default room
        delete data[''];

        var roomList = '';
        var nbRoom = 0;

        for(var i in data)
        {
            roomList += '<li>' + i + '(' + data[i].length + ')</li>';
            nbRoom++;
        }

        if(0 == nbRoom)
        {
            roomList = '<li>Aucun salon</li>';
        }

        $('#roomList').html(roomList);
    });
});
