const { v4: uuidv4 } = require('uuid');

class DrawingState {
    constructor() {
        this.history = [];
        this.redoStack = [];
        this.users = new Map();
    }

    addUser(socketId) {
        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
        this.users.set(socketId, {
            id: socketId,
            color: color,
            x: 0,
            y: 0,
            isDrawing: false
        });
        return this.users.get(socketId);
    }

    removeUser(socketId) {
        this.users.delete(socketId);
    }

    updateUserCursor(socketId, x, y, isDrawing) {
        const user = this.users.get(socketId);
        if (user) {
            user.x = x;
            user.y = y;
            user.isDrawing = isDrawing;
        }
    }

    addStroke(stroke) {
        const newStroke = {
            ...stroke,
            id: uuidv4(),
            timestamp: Date.now()
        };
        this.history.push(newStroke);
        this.redoStack = [];
        return newStroke;
    }

    undo() {
        if (this.history.length === 0) return null;
        const stroke = this.history.pop();
        this.redoStack.push(stroke);
        return stroke.id;
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        const stroke = this.redoStack.pop();
        this.history.push(stroke);
        return stroke;
    }

    getHistory() {
        return this.history;
    }

    getUsers() {
        return Array.from(this.users.values());
    }

    clear() {
        this.history = [];
        this.redoStack = [];
    }
}

module.exports = DrawingState;
