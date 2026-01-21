const DrawingState = require('./drawing-state');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    getRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            console.log(`Creating new room: ${roomId}`);
            this.rooms.set(roomId, new DrawingState());
        }
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }

    cleanup() {
        for (const [id, room] of this.rooms.entries()) {
            if (room.getUsers().length === 0 && room.getHistory().length === 0) {
                this.rooms.delete(id);
            }
        }
    }
}

module.exports = RoomManager;
