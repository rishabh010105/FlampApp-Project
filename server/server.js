const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const roomManager = new RoomManager();

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
    const roomId = 'general';
    socket.join(roomId);

    console.log(`User connected: ${socket.id} to room: ${roomId}`);

    const state = roomManager.getRoom(roomId);

    const user = state.addUser(socket.id);

    socket.emit('init_state', {
        history: state.getHistory(),
        users: state.getUsers(),
        me: user
    });

    socket.to(roomId).emit('user_joined', user);

    socket.on('cursor_move', (data) => {
        state.updateUserCursor(socket.id, data.x, data.y, data.isDrawing);
        socket.to(roomId).emit('user_update', { id: socket.id, x: data.x, y: data.y, isDrawing: data.isDrawing });
    });

    socket.on('draw_point', (data) => {
        socket.to(roomId).emit('live_stroke_point', {
            userId: socket.id,
            point: data.point,
            color: user.color
        });
    });

    socket.on('draw_end', (data) => {
        const stroke = state.addStroke({
            points: data.points,
            color: data.color || user.color,
            width: data.width,
            userId: socket.id
        });
        io.to(roomId).emit('new_stroke', stroke);
    });

    socket.on('undo_request', () => {
        const undoneStrokeId = state.undo();
        if (undoneStrokeId) {
            io.to(roomId).emit('history_undo', { id: undoneStrokeId });
        }
    });

    socket.on('redo_request', () => {
        const redoneStroke = state.redo();
        if (redoneStroke) {
            io.to(roomId).emit('new_stroke', redoneStroke);
        }
    });

    socket.on('clear_request', () => {
        state.clear();
        io.to(roomId).emit('canvas_clear');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        state.removeUser(socket.id);
        io.to(roomId).emit('user_left', { id: socket.id });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
