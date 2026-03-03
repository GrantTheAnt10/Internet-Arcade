/* ============================================================
   Internet Arcade – JavaScript
   ============================================================ */

(function () {
  'use strict';

  // ── Game data ─────────────────────────────────────────────
  const GAMES = [
    {
      id: 'arcade_pacman',
      title: 'Pac-Man',
      year: '1980',
      genre: 'Maze',
      color: '#ffe600',
    },
    {
      id: 'mspacman',
      title: 'Ms. Pac-Man',
      year: '1981',
      genre: 'Maze',
      color: '#ff00cc',
    },
    {
      id: 'arcade_galaga',
      title: 'Galaga',
      year: '1981',
      genre: 'Shoot \'em up',
      color: '#00f0ff',
    },
    {
      id: 'arcade_digdug',
      title: 'Dig Dug',
      year: '1982',
      genre: 'Action',
      color: '#39ff14',
    },
    {
      id: 'arcade_dkong',
      title: 'Donkey Kong',
      year: '1981',
      genre: 'Platform',
      color: '#ff6600',
    },
    {
      id: 'arcade_defender',
      title: 'Defender',
      year: '1981',
      genre: 'Shoot \'em up',
      color: '#ff00cc',
    },
    {
      id: 'arcade_frogger',
      title: 'Frogger',
      year: '1981',
      genre: 'Action',
      color: '#39ff14',
    },
    {
      id: 'arcade_centipede',
      title: 'Centipede',
      year: '1980',
      genre: 'Shoot \'em up',
      color: '#00f0ff',
    },
    {
      id: 'arcade_asteroids',
      title: 'Asteroids',
      year: '1979',
      genre: 'Shooter',
      color: '#ffe600',
    },
    {
      id: 'arcade_missile',
      title: 'Missile Command',
      year: '1980',
      genre: 'Strategy',
      color: '#ff6600',
    },
    {
      id: 'arcade_tron',
      title: 'Tron',
      year: '1982',
      genre: 'Multi-game',
      color: '#00f0ff',
    },
    {
      id: 'qbert',
      title: "Q*bert",
      year: '1982',
      genre: 'Platform',
      color: '#ff6600',
    },
    {
      id: 'arcade_burgertime',
      title: 'BurgerTime',
      year: '1982',
      genre: 'Action',
      color: '#ffe600',
    },
    {
      id: 'arcade_joust',
      title: 'Joust',
      year: '1982',
      genre: 'Platform',
      color: '#ff00cc',
    },
    {
      id: 'zaxxon',
      title: 'Zaxxon',
      year: '1982',
      genre: 'Shoot \'em up',
      color: '#39ff14',
    },
    {
      id: 'stargate_williams',
      title: 'Stargate',
      year: '1981',
      genre: 'Shoot \'em up',
      color: '#00f0ff',
    },
  ];

  // ── Build thumbnail URL from archive.org ──────────────────
  function thumbUrl(id) {
    return `https://archive.org/services/img/${id}`;
  }

  // ── Build embed URL ────────────────────────────────────────
  function embedUrl(id) {
    return `https://archive.org/embed/${id}&autoplay=1`;
  }

  // ── Render cabinets ────────────────────────────────────────
  function buildCabinets() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    GAMES.forEach(function (game) {
      const cabinet = document.createElement('div');
      cabinet.className = 'cabinet';
      cabinet.setAttribute('role', 'button');
      cabinet.setAttribute('tabindex', '0');
      cabinet.setAttribute('aria-label', 'Play ' + game.title);
      cabinet.dataset.id    = game.id;
      cabinet.dataset.title = game.title;

      cabinet.innerHTML = `
        <div class="cabinet-body">
          <div class="cabinet-marquee">
            <span>${game.title}</span>
          </div>
          <div class="cabinet-screen-wrap">
            <img
              src="${thumbUrl(game.id)}"
              alt="${game.title} screenshot"
              loading="lazy"
              onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22240%22%3E%3Crect fill=%22%23000%22 width=%22320%22 height=%22240%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%2300f0ff%22 font-size=%2218%22 font-family=%22monospace%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EPRESS START%3C/text%3E%3C/svg%3E'"
            />
          </div>
          <div class="cabinet-controls">
            <div class="joystick"></div>
            <div class="buttons-row">
              <div class="btn-circle red"></div>
              <div class="btn-circle blue"></div>
              <div class="btn-circle yellow"></div>
            </div>
          </div>
          <div class="cabinet-label">${game.title} &bull; ${game.year}</div>
        </div>
        <div class="play-overlay">
          <div class="play-icon"></div>
          <div class="play-text">Insert Coin</div>
        </div>
      `;

      cabinet.addEventListener('click', function () {
        openModal(game);
      });
      cabinet.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(game);
        }
      });

      grid.appendChild(cabinet);
    });
  }

  // ── Modal logic ────────────────────────────────────────────
  var currentIframe = null;

  function openModal(game) {
    var overlay  = document.getElementById('modal-overlay');
    var title    = document.getElementById('modal-title');
    var gameWrap = document.getElementById('modal-game-wrap');
    var loading  = document.getElementById('modal-loading');

    title.textContent = game.title + ' (' + game.year + ')';

    // Remove previous iframe
    if (currentIframe) {
      currentIframe.remove();
      currentIframe = null;
    }

    // Show loading spinner
    loading.style.opacity = '1';
    loading.style.pointerEvents = 'all';

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Create iframe after a tick so the modal animation plays first
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      iframe.src = embedUrl(game.id);
      iframe.allow = 'autoplay; fullscreen';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('title', game.title);

      iframe.addEventListener('load', function () {
        loading.style.opacity = '0';
        loading.style.pointerEvents = 'none';
      });

      gameWrap.appendChild(iframe);
      currentIframe = iframe;
    }, 350);
  }

  function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Tear down iframe after transition
    setTimeout(function () {
      if (currentIframe) {
        currentIframe.remove();
        currentIframe = null;
      }
    }, 400);
  }

  // ── Wire up close button & backdrop click ──────────────────
  function initModal() {
    var overlay   = document.getElementById('modal-overlay');
    var closeBtn  = document.getElementById('modal-close');

    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ── Coin counter easter egg ────────────────────────────────
  function initCoinCounter() {
    var coins = 0;
    var insertCoin = document.getElementById('insert-coin');
    if (!insertCoin) return;

    document.addEventListener('keydown', function (e) {
      if (e.key === 'c' || e.key === 'C') {
        coins++;
        insertCoin.textContent = 'CREDITS: ' + coins + '   INSERT COIN';
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    buildCabinets();
    initModal();
    initCoinCounter();
  });
}());
