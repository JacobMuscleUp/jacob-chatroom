/*
const mongoClient = require('mongodb').MongoClient;
const socketClient = require('socket.io').listen(4000).sockets;

require('dotenv').config();

var numUsers = 0;
*/

'use strict';

const mongoClient = require('mongodb').MongoClient;
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
//const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .use(express.static(path.join(__dirname, 'public')))
    //.use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const socketClient = socketIO(server);

var numUsers = 0;

mongoClient.connect(
    `mongodb://${process.env.USER_NAME}:${process.env.USER_PW}@cluster0-shard-00-00-novoa.mongodb.net:27017,cluster0-shard-00-01-novoa.mongodb.net:27017,cluster0-shard-00-02-novoa.mongodb.net:27017/test?ssl=true&replicaSet=cluster0-shard-0&authSource=admin&retryWrites=true`,
    { useNewUrlParser: true },
    function (err, mongoClient) {
        if (err) 
            throw err;
        console.log('database connection established.');
        let chat = mongoClient.db('jacob').collection('chatroom');

        socketClient.on('connection', function (socket) {
            chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
                if (err) 
                    throw err;
                socket.emit('output', {
                    msgArray: res,
                    init: true
                });
            });
            
            socket.on('input', function (data) {
                const { name, message } = data;

                if (name == '' || message == '') {
                    socket.emit('status', 'Please enter a name and message');
                } 
                else {
                    chat.insert({ name: name, message: message }, function () {
                        socket.emit('output', {
                            msgArray: [data],
                            init: false
                        });
                        socket.broadcast.emit('output', {
                            msgArray: [data],
                            init: false
                        });

                        socket.emit('status', {
                            message: 'Message sent',
                            clear: true
                        });
                    });
                }
            });

            socket.on('add user', function(data) {
                const { userName } = data;
                socket.userName = userName;
                ++numUsers;

                socket.emit('user count updated', {
                    numUsers: numUsers
                });
                socket.broadcast.emit('user count updated', {
                    numUsers: numUsers
                });

                socket.broadcast.emit('user added', {
                    userName: userName
                });
            });

            socket.on('disconnect', function() {
                //if (!socket.userName) return; 

                --numUsers;

                socket.emit('user count updated', {
                    numUsers: numUsers
                });
                socket.broadcast.emit('user count updated', {
                    numUsers: numUsers
                });

                socket.broadcast.emit('user removed', {
                    userName: socket.userName
                });
            });

            socket.on('disconnecting', function(reason) {
                socket.emit('disconnect');
            });

            socket.on('clear history', function (data) {
                chat.remove({}, function () {
                    socket.emit('history cleared');
                    socket.broadcast.emit('history cleared');
                });
            });
        });
    });