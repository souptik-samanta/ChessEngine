
const port = 34445; 
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

function getAIMove() {
    fetch('https://cors-anywhere.herokuapp.com/corsdemo/http://37.27.51.34:34445//get-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: chess.fen() })
    })
    .then(response => response.json())
    .then(data => {
        if (data.move) {
            const move = chess.move(data.move);
            board.position(chess.fen());
            addMoveToList(move, 'AI');
            statusElement.textContent = 'Your turn! Drag and drop pieces to make a move.';
        } else {
            statusElement.textContent = 'AI has no valid moves. Game over!';
        }
    })
    .catch(err => {
        console.error(err);
        statusElement.textContent = 'Error getting AI move.';
    });
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
