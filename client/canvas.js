export class CanvasManager {
    constructor(canvas, socketClient) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.socket = socketClient;

        this.isDrawing = false;
        this.currentStroke = [];
        this.history = [];
        this.remoteStreams = new Map();

        this.myColor = '#000000';
        this.myWidth = 5;
        this.scale = 1;

        this.setupCanvas();
        this.bindEvents();
        this.startRenderLoop();
    }

    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startStroke(e));
        window.addEventListener('mousemove', (e) => this.moveStroke(e));
        window.addEventListener('mouseup', () => this.endStroke());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startStroke(touch);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.moveStroke(touch);
        }, { passive: false });

        window.addEventListener('touchend', () => this.endStroke());
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startStroke(e) {
        if (e.target !== this.canvas && e.type === 'mousedown') return;

        this.isDrawing = true;
        const pos = this.getPos(e);
        this.currentStroke = [pos];

        this.broadcastCursor(pos.x, pos.y, true);
    }

    moveStroke(e) {
        const pos = this.getPos(e);

        this.broadcastCursor(pos.x, pos.y, this.isDrawing);

        if (!this.isDrawing) return;

        this.currentStroke.push(pos);
        this.socket.sendDrawPoint(pos);
    }

    endStroke() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.currentStroke.length > 0) {
            this.socket.sendDrawEnd(this.currentStroke, this.myWidth, this.myColor);
        }

        this.currentStroke = [];
        this.broadcastCursor(0, 0, false);
    }

    broadcastCursor(x, y, isDrawing) {
        this.socket.sendCursorMove(x, y, isDrawing);
    }

    setColor(color) {
        this.myColor = color;
    }

    setWidth(width) {
        this.myWidth = width;
    }

    setHistory(history) {
        this.history = history;
    }

    addStroke(stroke) {
        this.history.push(stroke);
    }

    removeStroke(id) {
        this.history = this.history.filter(s => s.id !== id);
    }

    updateRemoteStream(userId, point, color) {
        if (!this.remoteStreams.has(userId)) {
            this.remoteStreams.set(userId, { points: [], color, lastUpdate: Date.now() });
        }
        const stream = this.remoteStreams.get(userId);
        stream.points.push(point);
        stream.color = color;
        stream.lastUpdate = Date.now();
    }

    clearRemoteStream(userId) {
        this.remoteStreams.delete(userId);
    }

    clear() {
        this.history = [];
        this.remoteStreams.clear();
        this.currentStroke = [];
    }

    startRenderLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.history.forEach(stroke => {
            this.drawPath(stroke.points, stroke.color, stroke.width);
        });

        this.remoteStreams.forEach((stream, userId) => {
            if (Date.now() - stream.lastUpdate > 5000) {
                this.remoteStreams.delete(userId);
                return;
            }
            this.ctx.globalAlpha = 0.5;
            this.drawPath(stream.points, stream.color, 5);
            this.ctx.globalAlpha = 1.0;
        });

        if (this.currentStroke.length > 0) {
            this.drawPath(this.currentStroke, this.myColor, this.myWidth);
        }
    }

    drawPath(points, color, width) {
        if (points.length < 2) {
            if (points.length === 1) {
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            return;
        }

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;

        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        if (points.length > 2) {
            this.ctx.quadraticCurveTo(
                points[points.length - 2].x,
                points[points.length - 2].y,
                points[points.length - 1].x,
                points[points.length - 1].y
            );
        } else {
            this.ctx.lineTo(points[1].x, points[1].y);
        }

        this.ctx.stroke();
    }
}
