const BASE_URL = "https://www.classicgamesarcade.com";
const FALLBACK_GAMES = [
  "/games/asteroids-arcade-game.html",
  "/games/pacman-arcade-game.html",
  "/games/galaga-arcade-game.html",
];

const machineGrid = document.getElementById("machineGrid");
const machines = Array.from(document.querySelectorAll(".machine"));
const screenWrap = document.getElementById("screenWrap");
const frame = document.getElementById("gameFrame");
const statusText = document.getElementById("status");

let gameLinks = [...FALLBACK_GAMES];

const absoluteUrl = (path) => (path.startsWith("http") ? path : `${BASE_URL}${path}`);

const loadGame = (path) => {
  frame.src = absoluteUrl(path);
  statusText.textContent = `Now loading: ${path.split("/").pop()}`;
};

const setActiveMachine = (button) => {
  machines.forEach((machine) => machine.classList.remove("active"));
  button.classList.add("active");
  document.body.classList.add("focus-on-machine");
  screenWrap.scrollIntoView({ behavior: "smooth", block: "center" });
};

const chooseGameForMachine = (machineIndex) => {
  if (!gameLinks.length) {
    return FALLBACK_GAMES[0];
  }
  return gameLinks[machineIndex % gameLinks.length] || FALLBACK_GAMES[0];
};

const wireMachines = () => {
  machines.forEach((machine, index) => {
    machine.addEventListener("click", () => {
      const preferredGame = machine.dataset.game || chooseGameForMachine(index);
      setActiveMachine(machine);
      loadGame(preferredGame);
    });
  });
};

const parseGameLinks = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll('a[href*="/games/"]'))
    .map((a) => a.getAttribute("href"))
    .filter((href) => href && href.endsWith(".html"));
};

const loadGamesList = async () => {
  try {
    const response = await fetch(`${BASE_URL}/`, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const links = parseGameLinks(html);
    if (links.length > 0) {
      gameLinks = [...new Set(links)];
      statusText.textContent = "Fetched games from classicgamesarcade.com";
      return;
    }
    throw new Error("No game links found");
  } catch (error) {
    console.warn("Could not fetch game list from classicgamesarcade.com:", error);
    statusText.textContent = "Using curated classicgamesarcade.com game list.";
  }
};

const init = async () => {
  wireMachines();
  await loadGamesList();
  const first = machines[0];
  if (first) {
    setActiveMachine(first);
    loadGame(first.dataset.game || FALLBACK_GAMES[0]);
  }
};

init();
