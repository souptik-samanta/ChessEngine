const chess = new Chess();
let moveNumber = 1;

const config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    pieceTheme: (piece) => {
        const pieceMap = {
            'bR': 'img/br.png',
            'bN': 'img/bn.png',
            'bB': 'img/bb.png',
            'bQ': 'img/bq.png',
            'bK': 'img/bk.png',
            'bP': 'img/bp.png',
            'wR': 'img/wr.png',
            'wN': 'img/wn.png',
            'wB': 'img/wb.png',
            'wQ': 'img/wq.png',
            'wK': 'img/wk.png',
            'wP': 'img/wp.png'
        };
        return pieceMap[piece];
    }
};

const board = Chessboard('board', config);
const statusElement = document.getElementById('status');
const movesListElement = document.getElementById('moves-list');

function addMoveToList(move, player) {
    const moveEntry = document.createElement('div');
    moveEntry.className = 'move-entry';
    
    const moveNumberSpan = document.createElement('span');
    moveNumberSpan.className = 'move-number';
    moveNumberSpan.textContent = `${Math.ceil(moveNumber / 2)}.`;
    
    const moveText = document.createElement('span');
    moveText.textContent = `${player}: ${move.from}-${move.to}`;
    
    moveEntry.appendChild(moveNumberSpan);
    moveEntry.appendChild(moveText);
    movesListElement.appendChild(moveEntry);
    movesListElement.scrollTop = movesListElement.scrollHeight;
    moveNumber++;
}

function onDrop(source, target) {
    const move = chess.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) {
        statusElement.textContent = 'Invalid move! Try again.';
        return 'snapback';
    }

    addMoveToList(move, 'Player');
    board.position(chess.fen());

    if (chess.game_over()) {
        statusElement.textContent = 'Game over!';
    } else {
        statusElement.textContent = 'AI is thinking...';
        getAIMove();
    }
}

async function getAIMove() {
    try {
        // Use a CORS proxy to avoid CORS issues
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = 'https://chess-api-gamma.vercel.app/get-move'; // Removed extra slash
        
        const response = await fetch(proxyUrl + apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin,
            },
            body: JSON.stringify({ fen: chess.fen() })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.move) {
            const move = chess.move(data.move);
            if (move) {
                board.position(chess.fen());
                addMoveToList(move, 'AI');
                statusElement.textContent = 'Your turn! Drag and drop pieces to make a move.';
            } else {
                statusElement.textContent = 'Invalid AI move received. Try again.';
            }
        } else {
            statusElement.textContent = 'AI has no valid moves. Game over!';
        }
    } catch (error) {
        console.error('Error:', error);
        statusElement.textContent = 'Error getting AI move. Using fallback...';
        // Fallback: Make a random legal move
        const moves = chess.moves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const move = chess.move(randomMove);
            board.position(chess.fen());
            addMoveToList(move, 'AI');
            statusElement.textContent = 'Your turn! Drag and drop pieces to make a move.';
        } else {
            statusElement.textContent = 'No valid moves available. Game over!';
        }
    }
}

document.getElementById('aiMove').addEventListener('click', getAIMove);

document.getElementById('resetGame').addEventListener('click', () => {
    chess.reset();
    board.start();
    moveNumber = 1;
    movesListElement.innerHTML = '';
    statusElement.textContent = 'Game reset. Your turn!';
});

document.getElementById('undoMove').addEventListener('click', () => {
    chess.undo();
    chess.undo(); // Undo both player and AI moves
    board.position(chess.fen());
    moveNumber = Math.max(1, moveNumber - 2);
    if (movesListElement.lastChild && movesListElement.lastChild.previousSibling) {
        movesListElement.removeChild(movesListElement.lastChild);
        movesListElement.removeChild(movesListElement.lastChild);
    }
    statusElement.textContent = 'Moves undone. Your turn!';
});
