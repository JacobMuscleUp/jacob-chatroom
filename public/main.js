$(document).ready(function () {
    const socket = io();
    //const socket = io('http://localhost:3000');
    //const socket = io('http://127.0.0.1:4000');
    if (socket === undefined) return;

    const FADE_TIME = 1000;
    const COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    const $window = $(window);
    const $chatPage = $('.chat.page');
    const $loginPage = $('.login.page');
    const $notification = $('.notification');
    const $messages = $('.messages');
    const $inputMessage = $('.inputMessage');
    const $status = $('.status');
    const $clearHistory = $('#clearHistory');
    const $greeting = $('.greeting');
    const $userCount = $('.userCount');

    var userName;

    $chatPage.fadeOut();

    $window.keydown((event) => {
        var $userNameInput = $('.userNameInput');
        if (event.which === 13) {
            if (userName) {
                socket.emit('input', {
                    name: userName,
                    message: $inputMessage.val()
                });
            }
            else {
                userName = $userNameInput.val();
                $chatPage.show();
                $loginPage.fadeOut();
                $greeting.text(`welcome to ${userName}`);
                if (userName !== 'admin')
                    $clearHistory.fadeOut();

                socket.emit('add user', {
                    userName: userName
                });
            }
        }
    });

    $clearHistory.on('click', function () {
        socket.emit('clear history');
    });

    socket.on('output', function (data) {
        const { msgArray, init } = data;
        
        if (msgArray.length) {
            if (init)
                $messages.empty();
            for (var i = 0; i < msgArray.length; ++i) {
                addChatMessage(msgArray[i].name, msgArray[i].message);
                //var message = document.createElement('div');
                //message.setAttribute('class', 'chat-message');
                //message.textContent = `${msgArray[i].name}: ${msgArray[i].message}`;
                //$messages.prepend(message);
            }
        }
    });

    socket.on('status', function (data) {
        setStatus(data.message);
        if (data.clear)
            $inputMessage.val('');
    });

    socket.on('history cleared', function () {
        $messages.empty();
        log('the admin has cleared the chat history', { prepend: true });
    });

    socket.on('user count updated', (data) => {
        const { numUsers } = data;
        $userCount.text(`${numUsers} ${(numUsers < 2) ? 'user' : 'users'}`);
    });

    socket.on('user added', (data) => {
        const { userName } = data;
        log(`${userName} joined`, { 
            prepend: true,
            modifier: function() {// this refers to elem
                this.css('color', getUserColor(userName));
            }
        });
    });

    socket.on('user removed', (data) => {
        const { userName } = data;
        log(`${userName} left`, {
            prepend: true,
            modifier: function () {// this refers to elem
                this.css('color', getUserColor(userName));
            }
        });
    });

    socket.on('disconnect', () => {
        log('you have been disconnected', { prepend: true });
    });

    socket.on('reconnect', () => {
        log('you have been reconnected', { prepend: true });
        if (userName) {
            socket.emit('add user', {
                userName: userName
            });
        }
    });

    socket.on('reconnect_error', () => {
        log('attempt to reconnect has failed', { prepend: true });
    });

    const statusDefault = $status.text();
    const setStatus = function (s) {
        $status.text(s).addClass('status');

        if (s !== statusDefault) {
            var delay = setTimeout(function () {
                setStatus(statusDefault);
            }, 4000);
        }
    }

    function log(msg, options) {
        const { modifier } = options;
        var $elem = $('<li>').text(msg).addClass('log');
        if (modifier)
            modifier.apply($elem);

        addMessageElement($notification, $elem, options);
    }

    function addChatMessage(userName, msg) {
        var $elem = $('<li>').text(`${userName}: ${msg}`).css('color', getUserColor(userName));
        addMessageElement($messages, $elem, { prepend: true });
    }

    const addMessageElement = (target, elem, options) => {
        const $target = $(target);
        const $elem = $(elem);

        if (!options)
            options = {};
        if (typeof options.fade === 'undefined')
            options.fade = true;
        if (typeof options.prepend === 'undefined')
            options.prepend = false;

        if (options.fade)
            $elem.hide().fadeIn(FADE_TIME);

        if (options.prepend)
            $target.prepend($elem);
        else
            $target.append($elem);
    }

    const getUserColor = (userName) => {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < userName.length; i++) 
           hash = userName.charCodeAt(i) + (hash << 5) - hash;
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
      }
});