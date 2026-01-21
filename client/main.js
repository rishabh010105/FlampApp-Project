import { SocketClient } from './websocket.js';
import { CanvasManager } from './canvas.js';

class App {
    constructor() {
        this.socket = new SocketClient();
        this.canvas = new CanvasManager(document.getElementById('drawing-canvas'), this.socket);

        this.ui = {
            statusDot: document.getElementById('connection-status'),
            brushBtn: document.getElementById('btn-brush'),
            eraserBtn: document.getElementById('btn-eraser'),
            undoBtn: document.getElementById('btn-undo'),
            redoBtn: document.getElementById('btn-redo'),
            sizeInput: document.getElementById('brush-size'),
            colorPicker: document.getElementById('color-picker'),
            usersList: document.getElementById('users-container'),
            cursorsLayer: document.getElementById('cursors-layer')
        };

        this.cursors = new Map();

        this.init();
    }

    init() {
        this.socket.connect();

        this.socket.on('connected', (id) => {
            this.ui.statusDot.classList.add('connected');
            this.ui.statusDot.title = `Connected: ${id}`;
        });

        this.socket.on('disconnected', () => {
            this.ui.statusDot.classList.remove('connected');
        });

        this.socket.on('init', (data) => {
            this.canvas.setHistory(data.history);
            this.canvas.setColor(data.me.color);
            this.ui.colorPicker.value = this.rgbToHex(data.me.color) || '#000000';

            this.renderUserList(data.users);
        });

        this.socket.on('user_joined', (user) => {
            this.addUserToList(user);
        });

        this.socket.on('user_left', (userId) => {
            this.removeUserFromList(userId);
            this.removeCursor(userId);
            this.canvas.clearRemoteStream(userId);
        });

        this.socket.on('stroke_mod', (mod) => {
            if (mod.type === 'add') {
                this.canvas.addStroke(mod.stroke);
                this.canvas.clearRemoteStream(mod.stroke.userId);
            } else if (mod.type === 'undo') {
                this.canvas.removeStroke(mod.id);
            }
        });

        this.socket.on('live_draw', (data) => {
            this.canvas.updateRemoteStream(data.userId, data.point, data.color);
        });

        this.socket.on('clear', () => {
            this.canvas.clear();
        });

        this.socket.on('cursor_moved', (data) => {
            this.updateCursor(data);
        });

        this.ui.brushBtn.addEventListener('click', () => {
            this.setTool('brush');
        });

        this.ui.eraserBtn.addEventListener('click', () => {
            this.setTool('eraser');
        });

        this.ui.undoBtn.addEventListener('click', () => {
            this.socket.requestUndo();
        });

        this.ui.redoBtn.addEventListener('click', () => {
            this.socket.requestRedo();
        });

        this.ui.sizeInput.addEventListener('input', (e) => {
            this.canvas.setWidth(e.target.value);
        });

        this.ui.colorPicker.addEventListener('input', (e) => {
            this.setTool('brush');
            this.canvas.setColor(e.target.value);
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.socket.requestUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.socket.requestRedo();
            }
        });

        this.lastColor = '#000000';
    }

    setTool(tool) {
        if (tool === 'brush') {
            this.ui.brushBtn.classList.add('active');
            this.ui.eraserBtn.classList.remove('active');
            const color = this.ui.colorPicker.value;
            this.canvas.setColor(color);
            this.lastColor = color;
        } else if (tool === 'eraser') {
            this.ui.eraserBtn.classList.add('active');
            this.ui.brushBtn.classList.remove('active');
            this.lastColor = this.ui.colorPicker.value;
            this.canvas.setColor('#ffffff');
        }
    }

    rgbToHex(hslOrRgb) {
        return null;
    }

    renderUserList(users) {
        this.ui.usersList.innerHTML = '';
        users.forEach(u => this.addUserToList(u));
    }

    addUserToList(user) {
        if (document.getElementById(`user-${user.id}`)) return;

        const li = document.createElement('li');
        li.id = `user-${user.id}`;
        li.className = 'user-item';
        li.innerHTML = `
            <div class="user-dot" style="background-color: ${user.color}"></div>
            <span>User ${user.id.substr(0, 4)}</span>
        `;
        this.ui.usersList.appendChild(li);
    }

    removeUserFromList(userId) {
        const el = document.getElementById(`user-${userId}`);
        if (el) el.remove();
    }

    updateCursor(data) {
        let cursor = this.cursors.get(data.id);
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'cursor';
            cursor.innerHTML = `
                <svg class="cursor-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="white" stroke="black"></path>
                </svg>
                <span class="cursor-label">User ${data.id.substr(0, 4)}</span>
            `;
            this.ui.cursorsLayer.appendChild(cursor);
            this.cursors.set(data.id, cursor);
        }

        cursor.style.transform = `translate(${data.x}px, ${data.y}px)`;
    }

    removeCursor(userId) {
        const cursor = this.cursors.get(userId);
        if (cursor) {
            cursor.remove();
            this.cursors.delete(userId);
        }
    }
}

window.addEventListener('load', () => {
    new App();
});
