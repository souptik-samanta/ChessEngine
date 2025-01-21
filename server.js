const express = require('express');
const cors = require('cors');
const { Chess } = require('chess.js');
const PositionEvaluator = require('./evaluator');

const app = express();

app.use(cors());
app.use(express.json());
const openingBook = {
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': [
        { from: 'c7', to: 'c5' },
        { from: 'e7', to: 'e5' }
    ],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2': [
        { from: 'g1', to: 'f3' }
    ],
    'rnbqkbnr/pp1ppppp/8/2p4P/4P3/8/PPPP1PP1/RNBQKBNR b KQkq - 0 2': [
        { from: 'd7', to: 'd5' }
    ],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': [
        { from: 'g8', to: 'f6' },
        { from: 'd7', to: 'd5' }
    ]
};

const evaluator = new PositionEvaluator();

function getBestMove(chess, depth) {
    const position = chess.fen();
    if (openingBook[position]) {
        const bookMoves = openingBook[position];
        return bookMoves[Math.floor(Math.random() * bookMoves.length)];
    }
    return getBestMoveWithNegamax(chess, depth);
}

function getBestMoveWithNegamax(chess, depth) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
        chess.move(move);
        const score = -negamax(chess, depth - 1, -Infinity, Infinity, -1);
        chess.undo();

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function negamax(chess, depth, alpha, beta, color) {
    if (depth === 0 || chess.game_over()) {
        return color * evaluator.evaluatePosition(chess);
    }

    let maxScore = -Infinity;
    const moves = chess.moves();

    for (const move of moves) {
        chess.move(move);
        const score = -negamax(chess, depth - 1, -beta, -alpha, -color);
        chess.undo();

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break;
    }

    return maxScore;
}

app.post('/evaluate', (req, res) => {
    const { fen } = req.body;
    try {
        const chess = new Chess(fen);
        const evaluation = evaluator.evaluatePosition(chess);
        res.json({ evaluation: evaluation.toFixed(2) });
    } catch (error) {
        res.json({ evaluation: 0 });
    }
});

app.post('/get-move', (req, res) => {
    const { fen } = req.body;
    try {
        const chess = new Chess(fen);
        const move = getBestMove(chess, 3);
        res.json({ move });
    } catch (error) {
        res.json({ move: null });
    }
});

app.post('/validate-move', (req, res) => {
    const { fen, move } = req.body;
    try {
        const chess = new Chess(fen);
        const result = chess.move(move);
        res.json({
            valid: result !== null,
            newFen: result ? chess.fen() : null
        });
    } catch (error) {
        res.json({ valid: false, newFen: null });
    }
});

const port =44569 ;
app.listen(port,'0.0.0.0', () => {
    console.log(`Chess server running on port ${port}`);
});