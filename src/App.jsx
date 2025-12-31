import { useState, useCallback } from 'react';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function minimax(board, depth, isMaximizing, alpha, beta) {
  const result = checkWinner(board);
  if (result?.winner === 'O') return 10 - depth;
  if (result?.winner === 'X') return depth - 10;
  if (board.every(cell => cell !== null)) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const eval_ = minimax(board, depth + 1, false, alpha, beta);
        board[i] = null;
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        const eval_ = minimax(board, depth + 1, true, alpha, beta);
        board[i] = null;
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

function getBestMove(board, difficulty) {
  const available = board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
  
  if (difficulty === 'easy') {
    // 70% random, 30% optimal
    if (Math.random() < 0.7) {
      return available[Math.floor(Math.random() * available.length)];
    }
  } else if (difficulty === 'medium') {
    // 30% random, 70% optimal
    if (Math.random() < 0.3) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }
  
  // Optimal move using minimax
  let bestScore = -Infinity;
  let bestMove = available[0];
  
  for (const i of available) {
    board[i] = 'O';
    const score = minimax(board, 0, false, -Infinity, Infinity);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function Cell({ value, onClick, isWinning, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        w-24 h-24 text-5xl font-bold
        border-2 border-slate-600
        transition-all duration-200
        ${value === null && !disabled ? 'hover:bg-slate-700 cursor-pointer' : 'cursor-default'}
        ${isWinning ? 'bg-emerald-900/50' : 'bg-slate-800'}
        ${value === 'X' ? 'text-sky-400' : 'text-rose-400'}
      `}
    >
      {value}
    </button>
  );
}

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [gameMode, setGameMode] = useState('ai'); // 'ai' or 'local'

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setResult(null);
    setWinningLine([]);
  }, []);

  const handleCellClick = useCallback((index) => {
    if (board[index] !== null || gameOver) return;
    if (gameMode === 'ai' && !isPlayerTurn) return;

    const newBoard = [...board];
    const currentPlayer = isPlayerTurn ? 'X' : 'O';
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setGameOver(true);
      setResult(winResult.winner === 'X' ? 'Player 1 wins!' : (gameMode === 'ai' ? 'AI wins!' : 'Player 2 wins!'));
      setWinningLine(winResult.line);
      setScores(prev => ({
        ...prev,
        player: winResult.winner === 'X' ? prev.player + 1 : prev.player,
        ai: winResult.winner === 'O' ? prev.ai + 1 : prev.ai
      }));
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      setGameOver(true);
      setResult("It's a draw!");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    setIsPlayerTurn(!isPlayerTurn);

    // AI move
    if (gameMode === 'ai') {
      setTimeout(() => {
        const aiMove = getBestMove([...newBoard], difficulty);
        const aiBoard = [...newBoard];
        aiBoard[aiMove] = 'O';
        setBoard(aiBoard);

        const aiWinResult = checkWinner(aiBoard);
        if (aiWinResult) {
          setGameOver(true);
          setResult('AI wins!');
          setWinningLine(aiWinResult.line);
          setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
          return;
        }

        if (aiBoard.every(cell => cell !== null)) {
          setGameOver(true);
          setResult("It's a draw!");
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
          return;
        }

        setIsPlayerTurn(true);
      }, 400);
    }
  }, [board, gameOver, isPlayerTurn, difficulty, gameMode]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-rose-400">
        Tic Tac Toe
      </h1>

      {/* Game Mode & Difficulty */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => { setGameMode('ai'); resetGame(); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              gameMode === 'ai' ? 'bg-sky-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            vs AI
          </button>
          <button
            onClick={() => { setGameMode('local'); resetGame(); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              gameMode === 'local' ? 'bg-sky-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            2 Players
          </button>
        </div>

        {gameMode === 'ai' && (
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); resetGame(); }}
            className="px-4 py-2 rounded-lg bg-slate-700 border-none outline-none cursor-pointer"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Impossible</option>
          </select>
        )}
      </div>

      {/* Scoreboard */}
      <div className="flex gap-8 mb-6 text-lg">
        <div className="text-center">
          <div className="text-sky-400 font-bold">{gameMode === 'ai' ? 'You' : 'Player 1'}</div>
          <div className="text-2xl">{scores.player}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 font-bold">Draws</div>
          <div className="text-2xl">{scores.draws}</div>
        </div>
        <div className="text-center">
          <div className="text-rose-400 font-bold">{gameMode === 'ai' ? 'AI' : 'Player 2'}</div>
          <div className="text-2xl">{scores.ai}</div>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="mb-4 text-xl h-8">
        {!gameOver && (
          <span className={isPlayerTurn ? 'text-sky-400' : 'text-rose-400'}>
            {gameMode === 'ai' 
              ? (isPlayerTurn ? 'Your turn (X)' : 'AI thinking...')
              : (isPlayerTurn ? 'Player 1 (X)' : 'Player 2 (O)')
            }
          </span>
        )}
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-1 bg-slate-600 p-1 rounded-lg mb-6">
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => handleCellClick(index)}
            isWinning={winningLine.includes(index)}
            disabled={gameOver || (gameMode === 'ai' && !isPlayerTurn)}
          />
        ))}
      </div>

      {/* Result & Reset */}
      {gameOver && (
        <div className="text-center">
          <div className={`text-2xl font-bold mb-4 ${
            result?.includes('draw') ? 'text-slate-400' : 
            result?.includes('1') || result?.includes('You') ? 'text-sky-400' : 'text-rose-400'
          }`}>
            {result}
          </div>
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-rose-500 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Reset Scores */}
      <button
        onClick={() => { setScores({ player: 0, ai: 0, draws: 0 }); resetGame(); }}
        className="mt-6 text-slate-500 hover:text-slate-300 transition-colors text-sm"
      >
        Reset Scores
      </button>
    </div>
  );
}
