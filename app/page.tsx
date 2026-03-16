'use client';

/**
 * Space Invaders Duel — Turn-Based Battleship Game (Platform Mode)
 *
 * Two players each have an 8x6 grid. Place ships in setup phase,
 * then take turns firing shots at opponent's grid. Retro Sega aesthetic.
 *
 * Flow: Usion.init → game.connect → game.join → game.action → game.onAction
 *
 * SDK: @usions/sdk (loaded via <Script>)
 */

import Script from 'next/script';

export default function GamePage() {
  return (
    <>
      <Script src="/usion-sdk.js" strategy="beforeInteractive" />

      <Script id="game-logic" strategy="afterInteractive">{`
(function() {
  'use strict';

  var ROWS = 6, COLS = 8;
  var SHIP_SIZES = [3, 2, 2];
  var CELL_SIZE = 36;

  var state = {
    phase: 'connecting',
    myId: null,
    roomId: null,
    playerIds: [],
    myGrid: createEmptyGrid(),
    enemyGrid: createEmptyGrid(),
    placingShipIdx: 0,
    placingHorizontal: true,
    myTurn: false,
    winner: null,
    error: null,
    opponentReady: false,
    myReady: false,
    myShips: [],
    shipsPlaced: [],
  };

  function createEmptyGrid() {
    var g = [];
    for (var r = 0; r < ROWS; r++) {
      g[r] = [];
      for (var c = 0; c < COLS; c++) g[r][c] = 'empty';
    }
    return g;
  }

  var $ = function(s) { return document.querySelector(s); };

  // ─── Debug Logging ────────────────────────────────────────
  var LOG_PREFIX = '[SpaceInvaders]';
  function log() {
    var args = [LOG_PREFIX].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
  }
  function logState(label) {
    log(label, '| phase=' + state.phase,
      '| myId=' + state.myId,
      '| players=' + JSON.stringify(state.playerIds),
      '| myReady=' + state.myReady,
      '| opponentReady=' + state.opponentReady,
      '| myTurn=' + state.myTurn);
  }

  // ─── Rendering ────────────────────────────────────────────
  function render() {
    var app = $('#app');
    if (!app) return;

    var html = '<div class="error-banner" id="error"' +
      (state.error ? '' : ' style="display:none"') + '>' +
      (state.error || '') + '</div>';

    html += '<div class="title">SPACE INVADERS DUEL</div>';
    html += '<div class="status">' + getStatusText() + '</div>';

    if (state.phase === 'connecting' || state.phase === 'waiting') {
      html += '<div class="overlay">' +
        '<div class="scanline"></div>' +
        '<div class="overlay-text">' +
        (state.phase === 'connecting' ? 'CONNECTING...' : 'WAITING FOR OPPONENT...') +
        '</div></div>';
    } else if (state.phase === 'setup') {
      html += renderSetupPhase();
    } else if (state.phase === 'battle' || state.phase === 'finished') {
      html += renderBattlePhase();
    }

    if (state.phase === 'finished') {
      var msg = state.winner === state.myId ? 'VICTORY!' : 'DEFEAT!';
      html += '<div class="overlay">' +
        '<div class="overlay-text result">' + msg + '</div>' +
        '<button class="btn" onclick="window._rematch()">REMATCH</button>' +
        '</div>';
    }

    app.innerHTML = html;
  }

  function getStatusText() {
    switch (state.phase) {
      case 'connecting': return 'INITIALIZING SYSTEMS...';
      case 'waiting': return 'SCANNING FOR ENEMY...';
      case 'setup':
        if (state.placingShipIdx < SHIP_SIZES.length) {
          return 'DEPLOY SHIP (' + SHIP_SIZES[state.placingShipIdx] + ' cells) — ' +
            (state.placingHorizontal ? 'HORIZONTAL' : 'VERTICAL') +
            ' [R to rotate]';
        }
        if (state.myReady && state.opponentReady) return 'BATTLE STARTING...';
        if (state.myReady) return 'FLEET DEPLOYED — WAITING FOR ENEMY...';
        return state.opponentReady ? 'ENEMY READY — DEPLOY YOUR FLEET!' : 'DEPLOY ALL SHIPS THEN CLICK BATTLE STATIONS!';
      case 'battle':
        return state.myTurn ? '>>> YOUR TURN — SELECT TARGET <<<' : '--- ENEMY TARGETING ---';
      case 'finished':
        return state.winner === state.myId ? 'ALL ENEMY SHIPS DESTROYED' : 'YOUR FLEET HAS BEEN DESTROYED';
      default: return '';
    }
  }

  function renderGrid(grid, id, clickable, showShips) {
    var html = '<div class="grid" id="' + id + '">';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = grid[r][c];
        var cls = 'cell';
        if (cell === 'ship' && showShips) cls += ' ship';
        if (cell === 'hit') cls += ' hit';
        if (cell === 'miss') cls += ' miss';
        if (clickable && cell === 'empty') cls += ' clickable';

        var onclick = clickable ? ' onclick="window._gridClick(\\''+id+'\\','+r+','+c+')"' : '';
        html += '<div class="' + cls + '"' + onclick + '></div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderSetupPhase() {
    var html = '<div class="grids-container">';
    html += '<div class="grid-section">';
    html += '<div class="grid-label">YOUR FLEET</div>';
    html += renderGrid(state.myGrid, 'my-grid', state.placingShipIdx < SHIP_SIZES.length, true);
    html += '</div>';
    html += '</div>';

    if (state.placingShipIdx < SHIP_SIZES.length) {
      html += '<button class="btn" onclick="window._rotate()">ROTATE [R]</button>';
    } else if (!state.myReady) {
      html += '<button class="btn ready-btn" onclick="window._ready()">BATTLE STATIONS!</button>';
    } else {
      html += '<div class="status" style="margin-top:16px;animation:blink 1s infinite">FLEET DEPLOYED — STANDING BY...</div>';
    }
    return html;
  }

  function renderBattlePhase() {
    var html = '<div class="grids-container battle">';
    html += '<div class="grid-section">';
    html += '<div class="grid-label">ENEMY SECTOR</div>';
    html += renderGrid(state.enemyGrid, 'enemy-grid', state.myTurn && state.phase === 'battle', false);
    html += '</div>';
    html += '<div class="grid-section">';
    html += '<div class="grid-label">YOUR FLEET</div>';
    html += renderGrid(state.myGrid, 'my-grid', false, true);
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ─── Ship Placement ──────────────────────────────────────
  function canPlaceShip(grid, row, col, size, horizontal) {
    for (var i = 0; i < size; i++) {
      var r = horizontal ? row : row + i;
      var c = horizontal ? col + i : col;
      if (r >= ROWS || c >= COLS) return false;
      if (grid[r][c] !== 'empty') return false;
    }
    return true;
  }

  function placeShip(grid, row, col, size, horizontal) {
    for (var i = 0; i < size; i++) {
      var r = horizontal ? row : row + i;
      var c = horizontal ? col + i : col;
      grid[r][c] = 'ship';
    }
  }

  // ─── Win Check ────────────────────────────────────────────
  function allShipsSunk(grid) {
    for (var r = 0; r < ROWS; r++)
      for (var c = 0; c < COLS; c++)
        if (grid[r][c] === 'ship') return false;
    return true;
  }

  // ─── Event Handlers ──────────────────────────────────────
  window._gridClick = function(gridId, row, col) {
    if (state.phase === 'setup' && gridId === 'my-grid') {
      if (state.placingShipIdx >= SHIP_SIZES.length) return;
      var size = SHIP_SIZES[state.placingShipIdx];
      if (!canPlaceShip(state.myGrid, row, col, size, state.placingHorizontal)) {
        state.error = 'Cannot place ship here!';
        render();
        setTimeout(function() { state.error = null; render(); }, 2000);
        return;
      }
      placeShip(state.myGrid, row, col, size, state.placingHorizontal);
      state.shipsPlaced.push({ row: row, col: col, size: size, horizontal: state.placingHorizontal });
      state.placingShipIdx++;
      render();
    } else if (state.phase === 'battle' && gridId === 'enemy-grid') {
      if (!state.myTurn) return;
      if (state.enemyGrid[row][col] !== 'empty') return;
      Usion.game.action('fire', { row: row, col: col }).catch(function(err) {
        state.error = 'TRANSMISSION FAILED: ' + err.message;
        render();
      });
    }
  };

  window._rotate = function() {
    state.placingHorizontal = !state.placingHorizontal;
    render();
  };

  window._ready = function() {
    state.myReady = true;
    render();
    Usion.game.action('ready', { ships: state.shipsPlaced }).catch(function(err) {
      state.myReady = false;
      state.error = 'FAILED TO DEPLOY: ' + err.message;
      render();
    });
    // Check if opponent was already ready
    if (state.opponentReady) {
      state.phase = 'battle';
      state.myTurn = state.playerIds[0] === state.myId;
      render();
    }
  };

  window._rematch = function() {
    Usion.game.requestRematch();
  };

  // Keyboard rotate
  window.addEventListener('keydown', function(e) {
    if (e.key === 'r' || e.key === 'R') {
      if (state.phase === 'setup') {
        state.placingHorizontal = !state.placingHorizontal;
        render();
      }
    }
  });

  // ─── SDK Init ─────────────────────────────────────────────
  log('Waiting for Usion.init...');
  Usion.init(function(config) {
    state.myId = config.userId;
    state.roomId = config.roomId;
    log('INIT received', '| userId=' + config.userId, '| roomId=' + config.roomId);
    log('Full config:', JSON.stringify(config));

    log('Calling game.connect()...');
    Usion.game.connect()
      .then(function() {
        log('game.connect() SUCCESS — socket connected');
        log('Calling game.join(' + config.roomId + ')...');
        return Usion.game.join(config.roomId);
      })
      .then(function(joinData) {
        log('game.join() SUCCESS', '| joinData:', JSON.stringify(joinData));
        state.playerIds = joinData.player_ids || [];
        if (state.playerIds.length >= 2) {
          state.phase = 'setup';
        } else {
          state.phase = 'waiting';
        }
        logState('After join');
        render();
      })
      .catch(function(err) {
        log('CONNECTION ERROR:', err.message, err.stack || '');
        state.error = 'CONNECTION FAILED: ' + err.message;
        render();
      });

    Usion.game.onPlayerJoined(function(data) {
      log('EVENT: onPlayerJoined', JSON.stringify(data));
      state.playerIds = data.player_ids || state.playerIds;
      if (state.playerIds.length >= 2 && state.phase === 'waiting') {
        state.phase = 'setup';
        log('Transitioning to setup — 2 players present');
      }
      logState('After playerJoined');
      render();
    });

    Usion.game.onStateUpdate(function(data) {
      log('EVENT: onStateUpdate', JSON.stringify(data));
      if (data.game_state) {
        if (data.game_state.phase) state.phase = data.game_state.phase;
        if (data.game_state.myTurn !== undefined) state.myTurn = data.game_state.myTurn;
      }
      logState('After stateUpdate');
      render();
    });

    Usion.game.onAction(function(data) {
      var type = data.action_type;
      var d = data.action_data || {};
      var fromMe = data.player_id === state.myId;
      log('EVENT: onAction', '| type=' + type, '| fromMe=' + fromMe, '| player=' + data.player_id, '| data:', JSON.stringify(d));

      if (type === 'ready') {
        if (fromMe) {
          state.myReady = true;
          log('My ready confirmed via onAction');
        } else {
          state.opponentReady = true;
          log('Opponent ready received');
        }
        // Both ready → start battle
        if (state.myReady && state.opponentReady) {
          state.phase = 'battle';
          state.myTurn = state.playerIds[0] === state.myId;
          log('BOTH READY — starting battle! myTurn=' + state.myTurn);
        }
        logState('After ready');
        render();
        return;
      }

      if (type === 'fire') {
        if (fromMe) {
          log('Ignoring own fire echo');
          return;
        }
        var isHit = state.myGrid[d.row][d.col] === 'ship';
        log('Opponent fired at [' + d.row + ',' + d.col + '] — ' + (isHit ? 'HIT' : 'MISS'));
        if (isHit) {
          state.myGrid[d.row][d.col] = 'hit';
        } else {
          state.myGrid[d.row][d.col] = 'miss';
        }
        state.myTurn = true;

        var allSunk = isHit && allShipsSunk(state.myGrid);
        log('Sending fire_result back | result=' + (isHit ? 'hit' : 'miss') + ' | allSunk=' + allSunk);
        Usion.game.action('fire_result', {
          row: d.row,
          col: d.col,
          result: isHit ? 'hit' : 'miss',
          attacker: data.player_id,
          allSunk: allSunk,
        });

        if (allSunk) {
          state.phase = 'finished';
          state.winner = data.player_id;
          log('ALL SHIPS SUNK — I lost! Winner: ' + data.player_id);
        }
        logState('After opponent fire');
        render();
        return;
      }

      if (type === 'fire_result') {
        if (fromMe) {
          log('Ignoring own fire_result echo');
          return;
        }
        log('Fire result received: [' + d.row + ',' + d.col + '] = ' + d.result + ' | allSunk=' + d.allSunk);
        state.enemyGrid[d.row][d.col] = d.result;
        state.myTurn = false;

        if (d.allSunk) {
          state.phase = 'finished';
          state.winner = state.myId;
          log('ALL ENEMY SHIPS SUNK — I win!');
        }
        logState('After fire_result');
        render();
        return;
      }

      log('Unhandled action type:', type);
      render();
    });

    Usion.game.onGameFinished(function(data) {
      log('EVENT: onGameFinished', JSON.stringify(data));
      state.phase = 'finished';
      state.winner = data.winner_ids && data.winner_ids[0] ? data.winner_ids[0] : null;
      logState('After gameFinished');
      render();
    });

    Usion.game.onGameRestarted(function() {
      log('EVENT: onGameRestarted');
      state.myGrid = createEmptyGrid();
      state.enemyGrid = createEmptyGrid();
      state.placingShipIdx = 0;
      state.placingHorizontal = true;
      state.myShips = [];
      state.shipsPlaced = [];
      state.winner = null;
      state.myTurn = false;
      state.opponentReady = false;
      state.myReady = false;
      state.phase = 'setup';
      logState('After restart');
      render();
    });

    Usion.game.onError(function(data) {
      log('EVENT: onError', JSON.stringify(data));
      state.error = data.message || 'SYSTEM ERROR';
      render();
      setTimeout(function() { state.error = null; render(); }, 4000);
    });

    Usion.game.onDisconnect(function() {
      log('EVENT: onDisconnect');
      state.error = 'CONNECTION LOST';
      render();
    });

    Usion.game.onReconnect(function() {
      log('EVENT: onReconnect');
      state.error = null;
      Usion.game.requestSync();
      render();
    });
  });

  document.addEventListener('DOMContentLoaded', function() { render(); });
})();
      `}</Script>

      <div id="app" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          height: 100%;
          background: #001100;
          color: #00ff00;
          font-family: 'Press Start 2P', 'Courier New', monospace;
          overflow-x: hidden;
        }

        #app {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 16px;
          position: relative;
        }

        .title {
          font-size: 16px;
          letter-spacing: 4px;
          margin: 16px 0 8px;
          text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00;
          text-align: center;
        }

        .status {
          font-size: 9px;
          color: #00cc00;
          margin-bottom: 16px;
          text-align: center;
          min-height: 20px;
          letter-spacing: 1px;
        }

        .error-banner {
          position: fixed;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: #330000;
          color: #ff3300;
          border: 1px solid #ff3300;
          padding: 6px 14px;
          font-size: 8px;
          z-index: 100;
          max-width: 90%;
          font-family: 'Press Start 2P', monospace;
        }

        .grids-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }

        .grids-container.battle {
          flex-direction: row;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .grid-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .grid-label {
          font-size: 8px;
          color: #006600;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(8, ${36}px);
          grid-template-rows: repeat(6, ${36}px);
          gap: 2px;
          border: 2px solid #004400;
          padding: 2px;
          background: #002200;
        }

        .cell {
          width: 36px;
          height: 36px;
          background: #001a00;
          border: 1px solid #003300;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.1s;
          position: relative;
          cursor: default;
        }

        .cell.clickable {
          cursor: crosshair;
        }

        .cell.clickable:hover {
          background: #003300;
          box-shadow: inset 0 0 8px #00ff00;
        }

        .cell.ship {
          background: #004400;
          box-shadow: inset 0 0 6px #00ff00;
        }

        .cell.hit {
          background: #330000;
          box-shadow: inset 0 0 10px #ff3300;
        }

        .cell.hit::after {
          content: 'X';
          color: #ff3300;
          font-size: 14px;
          font-family: 'Press Start 2P', monospace;
          text-shadow: 0 0 6px #ff3300;
        }

        .cell.miss {
          background: #111100;
        }

        .cell.miss::after {
          content: '.';
          color: #666600;
          font-size: 18px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 17, 0, 0.92);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .overlay-text {
          font-size: 14px;
          color: #00ff00;
          text-shadow: 0 0 15px #00ff00;
          letter-spacing: 3px;
          animation: blink 1.2s infinite;
        }

        .overlay-text.result {
          font-size: 24px;
          margin-bottom: 24px;
          animation: none;
          text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00;
        }

        .scanline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 255, 0, 0.1);
          animation: scan 3s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .btn {
          background: transparent;
          color: #00ff00;
          border: 2px solid #00ff00;
          padding: 10px 24px;
          font-size: 10px;
          font-family: 'Press Start 2P', monospace;
          cursor: pointer;
          letter-spacing: 2px;
          margin-top: 16px;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .btn:hover {
          background: #00ff00;
          color: #001100;
          box-shadow: 0 0 15px #00ff00;
        }

        .ready-btn {
          border-color: #ffcc00;
          color: #ffcc00;
          animation: blink 1s infinite;
        }

        .ready-btn:hover {
          background: #ffcc00;
          color: #001100;
          box-shadow: 0 0 15px #ffcc00;
        }

        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(8, 28px);
            grid-template-rows: repeat(6, 28px);
          }
          .cell { width: 28px; height: 28px; }
          .title { font-size: 12px; }
          .grids-container.battle { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
