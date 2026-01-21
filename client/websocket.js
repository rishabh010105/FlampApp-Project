export class SocketClient {
    constructor() {
        this.socket = io();
        this.callbacks = {};
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    connect() {
        this.socket.on('connect', () => {
            console.log('Connected to server', this.socket.id);
            this.emit('connected', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.emit('disconnected');
        });

        this.socket.on('init_state', (data) => {
            this.emit('init', data);
        });

        this.socket.on('user_joined', (user) => {
            this.emit('user_joined', user);
        });

        this.socket.on('user_left', (data) => {
            this.emit('user_left', data.id);
        });

        this.socket.on('user_update', (data) => {
            this.emit('cursor_moved', data);
        });

        this.socket.on('live_stroke_point', (data) => {
            this.emit('live_draw', data);
        });

        this.socket.on('new_stroke', (stroke) => {
            this.emit('stroke_mod', { type: 'add', stroke });
        });

        this.socket.on('history_undo', (data) => {
            this.emit('stroke_mod', { type: 'undo', id: data.id });
        });

        this.socket.on('canvas_clear', () => {
            this.emit('clear');
        });
    }

    sendDrawPoint(point) {
        this.socket.emit('draw_point', { point });
    }

    sendDrawEnd(points, width, color) {
        this.socket.emit('draw_end', { points, width, color });
    }

    sendCursorMove(x, y, isDrawing) {
        this.socket.emit('cursor_move', { x, y, isDrawing });
    }

    requestUndo() {
        this.socket.emit('undo_request');
    }

    requestRedo() {
        this.socket.emit('redo_request');
    }

    requestClear() {
        this.socket.emit('clear_request');
    }
}
