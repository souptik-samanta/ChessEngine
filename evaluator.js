//made a differet file from server.js

class PositionEvaluator {
    constructor() {
        // Piece worth
        this.pieceValues = {
            p: 100,  // pawn
            n: 320,  // knight
            b: 330,  // bishop
            r: 500,  // rook
            q: 900,  // queen
            k: 20000 // king
        };

        this.weights = {
            pawnStructure: 0.6,
            castlingRights: 0.4,
            enPassantOpportunity: 0.2,
            development: 0.5,
            tempo: 0.3,
            mobility: 0.4,
            centerControl: 0.5
        };
    }

    evaluatePosition(chess) {
        if (chess.game_over()) {
            if (chess.in_checkmate()) {
                return chess.turn() === 'w' ? -Infinity : Infinity;
            }
            return 0; // Draw
        }

        const materialScore = this.evaluateMaterial(chess);
        const pawnStructure = this.evaluatePawnStructure(chess) * this.weights.pawnStructure;
        const castling = this.evaluateCastlingRights(chess) * this.weights.castlingRights;
        const enPassant = this.evaluateEnPassant(chess) * this.weights.enPassantOpportunity;
        const development = this.evaluateDevelopment(chess) * this.weights.development;
        const tempo = this.evaluateTempo(chess) * this.weights.tempo;
        const mobility = this.evaluateMobility(chess) * this.weights.mobility;
        const centerControl = this.evaluateCenterControl(chess) * this.weights.centerControl;

        return materialScore + pawnStructure + castling + enPassant + 
               development + tempo + mobility + centerControl;
    }

    evaluateMaterial(chess) {
        const board = chess.board();
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const value = this.pieceValues[piece.type];
                    score += piece.color === 'w' ? value : -value;
                }
            }
        }

        return score / 100; // 
    }

    evaluatePawnStructure(chess) {
        let score = 0;
        const board = chess.board();

        // eval p
        for (let col = 0; col < 8; col++) {
            let whitePawns = 0;
            let blackPawns = 0;
            for (let row = 0; row < 8; row++) {
                const piece = board[row][col];
                if (piece && piece.type === 'p') {
                    if (piece.color === 'w') whitePawns++;
                    else blackPawns++;
                }
            }
            if (whitePawns > 1) score -= 0.3 * (whitePawns - 1);
            if (blackPawns > 1) score += 0.3 * (blackPawns - 1);
        }

        // Eval isp
        for (let col = 0; col < 8; col++) {
            for (let row = 0; row < 8; row++) {
                const piece = board[row][col];
                if (piece && piece.type === 'p') {
                    // ? isp
                    let isIsolated = true;
                    if (col > 0 && this.hasPawnInFile(board, col - 1, piece.color)) isIsolated = false;
                    if (col < 7 && this.hasPawnInFile(board, col + 1, piece.color)) isIsolated = false;
                    
                    if (isIsolated) {
                        score += piece.color === 'w' ? -0.3 : 0.3;
                    }

                    // ? p
                    if (this.isPassedPawn(board, row, col, piece.color)) {
                        const rank = piece.color === 'w' ? 7 - row : row;
                        const bonus = 0.2 + (rank * 0.1);
                        score += piece.color === 'w' ? bonus : -bonus;
                    }
                }
            }
        }

        return score;
    }

    hasPawnInFile(board, file, color) {
        for (let row = 0; row < 8; row++) {
            const piece = board[row][file];
            if (piece && piece.type === 'p' && piece.color === color) {
                return true;
            }
        }
        return false;
    }

    isPassedPawn(board, row, col, color) {
        const direction = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? row - 1 : row + 1;
        
        for (let r = startRank; r >= 0 && r < 8; r += direction) {
            for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
                const piece = board[r][c];
                if (piece && piece.type === 'p' && piece.color !== color) {
                    return false;
                }
            }
        }
        return true;
    }

    evaluateCastlingRights(chess) {
        let score = 0;
        const castling = chess.fen().split(' ')[2];
        
        if (castling.includes('K')) score += 0.2;
        if (castling.includes('Q')) score += 0.2;
        if (castling.includes('k')) score -= 0.2;
        if (castling.includes('q')) score -= 0.2;

        
        //check 0 0 done?
        const board = chess.board();
        if (board[7][6] && board[7][6].type === 'k') score += 0.4;
        if (board[0][6] && board[0][6].type === 'k') score -= 0.4;
        
        return score;
    }

    evaluateEnPassant(chess) {
        const enPassantSquare = chess.fen().split(' ')[3];
        if (enPassantSquare === '-') return 0;

        const file = enPassantSquare.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = 8 - parseInt(enPassantSquare[1]);
        let score = 0;

        const board = chess.board();
        const color = rank === 2 ? 'w' : 'b';
        
        if (file > 0) {
            const piece = board[rank][file - 1];
            if (piece && piece.type === 'p' && piece.color === color) {
                score += color === 'w' ? 0.1 : -0.1;
            }
        }
        if (file < 7) {
            const piece = board[rank][file + 1];
            if (piece && piece.type === 'p' && piece.color === color) {
                score += color === 'w' ? 0.1 : -0.1;
            }
        }

        return score;
    }

    evaluateDevelopment(chess) {
        let score = 0;
        const board = chess.board();
        
        if (board[7][1] && board[7][1].type === 'n') score -= 0.2;
        if (board[7][6] && board[7][6].type === 'n') score -= 0.2;
        if (board[7][2] && board[7][2].type === 'b') score -= 0.2;
        if (board[7][5] && board[7][5].type === 'b') score -= 0.2;
        
        if (board[0][1] && board[0][1].type === 'n') score += 0.2;
        if (board[0][6] && board[0][6].type === 'n') score += 0.2;
        if (board[0][2] && board[0][2].type === 'b') score += 0.2;
        if (board[0][5] && board[0][5].type === 'b') score += 0.2;
        
        return score;
    }

    evaluateMobility(chess) {
        const whiteMoves = chess.turn() === 'w' ? chess.moves().length : 0;
        chess.move('e3'); 
        const blackMoves = chess.turn() === 'b' ? chess.moves().length : 0;
        chess.undo();
        
        return (whiteMoves - blackMoves) * 0.1;
    }

    evaluateCenterControl(chess) {
        const centerSquares = ['d4', 'd5', 'e4', 'e5'];
        let score = 0;
        
        for (const square of centerSquares) {
            const piece = chess.get(square);
            if (piece) {
                const value = 0.2;
                score += piece.color === 'w' ? value : -value;
            }
        }
        
        return score;
    }

    evaluateTempo(chess) {
        return chess.turn() === 'w' ? 0.1 : -0.1;
    }
}

module.exports = PositionEvaluator;