# Real-Time Collaborative Drawing Canvas

A high-performance, real-time drawing application built with Node.js, Socket.io, and Vanilla HTML5 Canvas. Multiple users can draw simultaneously with synchronized state and global undo/redo capabilities.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1.  **Navigate to the project directory**:
    ```bash
    cd collaborative-canvas
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Running the Application

1.  **Start the server**:
    ```bash
    npm start
    ```
2.  **Access the client**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.
3.  **Collaborate**:
    Open the same URL in multiple tabs or devices to test real-time collaboration.

## 🧪 How to Test

1.  **Real-time Sync**: Open two windows side-by-side. Draw in one, and watch it appear in the other instantly.
2.  **Undo/Redo**: Draw a line in Window A. Draw a line in Window B. Click 'Undo' in Window A. Window B's line (the most recent global action) will disappear.
3.  **Cursors**: Move your mouse in one window to see your named cursor move in the other window.
4.  **Color**: Use the color picker to change your brush color.

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas. No external drawing libraries.
- **Backend**: Node.js, Express, Socket.io.
- **State Management**: Centralized server-side history acting as the single source of truth.

## ⚠️ Known Limitations

- **Canvas Resolution**: The canvas size is tied to the window size. Resizing the window may cause coordinate alignment issues if not refreshed (though the app attempts to handle it).
- **Network Latency**: While optimistic updates are used for the local user, high latency might cause a delay in seeing other users' strokes.

## ⏱️ Time Spent

Approximately 2 hours for design, implementation, and testing.
