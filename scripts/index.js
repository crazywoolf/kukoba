const dino = document.getElementById("dino");
const obstacles = document.getElementById("obstacles");
const items = document.getElementById("items");
const energyFill = document.getElementById("energy-fill");
const scoreElement = document.getElementById("score");
const fireworks = document.getElementById("fireworks");
const gameOverElement = document.getElementById("game-over");
const gameOverReason = document.getElementById("game-over-reason");

const obstacleSequence = ["mountain", "mountain", "mountain", "mountain", "mountain", "temple"];
const intervals = [1320, 1640, 1460, 1920, 1560, 2240, 1380, 1780];
const itemIntervals = [2100, 2700, 2400, 3300, 2600, 3700];
const itemSequence = ["ice", "whiskey", "ice", "manzherok", "ice", "whiskey"];
const initialSpeed = 238;
const maxSpeed = 420;
const accelerationPerSecond = 8.2;
const jumpDuration = 680;
const energyDrainPerSecond = 5.5;
const scoreDistanceRatio = 10;
const fireworkDuration = 3000;
const dinoGrowthDuration = 3000;
const itemBonus = {
    whiskey: 22,
    ice: 12,
};

let sequenceIndex = 0;
let intervalIndex = 0;
let itemIndex = 0;
let itemIntervalIndex = 0;
let lastSpawnTime = 0;
let lastItemSpawnTime = 0;
let nextSpawnDelay = 520;
let nextItemSpawnDelay = 1700;
let previousTime = 0;
let energy = 100;
let speed = initialSpeed;
let distance = 0;
let score = 0;
let gameOver = false;
let fireworkTimeout = null;
let dinoGrowthTimeout = null;

function jump() {
    if (gameOver || dino.classList.contains("jump")) {
        return;
    }

    dino.classList.add("jump");

    setTimeout(function () {
        dino.classList.remove("jump");
    }, jumpDuration);
}

function nextObstacleType() {
    const type = obstacleSequence[sequenceIndex];
    sequenceIndex = (sequenceIndex + 1) % obstacleSequence.length;
    return type;
}

function nextInterval() {
    const interval = intervals[intervalIndex];
    intervalIndex = (intervalIndex + 1) % intervals.length;
    return interval;
}

function nextItemType() {
    const type = itemSequence[itemIndex];
    itemIndex = (itemIndex + 1) % itemSequence.length;
    return type;
}

function nextItemInterval() {
    const interval = itemIntervals[itemIntervalIndex];
    itemIntervalIndex = (itemIntervalIndex + 1) % itemIntervals.length;
    return interval;
}

function spawnObstacle() {
    const obstacle = document.createElement("div");
    obstacle.className = `obstacle ${nextObstacleType()}`;
    obstacle.style.left = "620px";
    obstacles.appendChild(obstacle);
    nextSpawnDelay = nextInterval();
}

function spawnItem() {
    const item = document.createElement("div");
    item.className = `item ${nextItemType()}`;
    item.style.left = "620px";
    items.appendChild(item);
    nextItemSpawnDelay = nextItemInterval();
}

function rectsCollide(a, b) {
    const horizontalPadding = 8;
    const verticalPadding = 10;

    return (
        a.left + horizontalPadding < b.right - horizontalPadding &&
        a.right - horizontalPadding > b.left + horizontalPadding &&
        a.top + verticalPadding < b.bottom - verticalPadding &&
        a.bottom - verticalPadding > b.top + verticalPadding
    );
}

function headCollidesWithItem(dinoRect, itemRect) {
    const headRect = {
        left: dinoRect.left + 10,
        right: dinoRect.right - 10,
        top: dinoRect.top,
        bottom: dinoRect.top + 18,
    };

    return (
        headRect.left < itemRect.right &&
        headRect.right > itemRect.left &&
        headRect.top < itemRect.bottom &&
        headRect.bottom > itemRect.top
    );
}

function setEnergy(value) {
    energy = Math.max(0, Math.min(100, value));
    energyFill.style.width = `${energy}%`;
}

function updateScore(value) {
    score = value;
    scoreElement.textContent = String(score);
}

function endGame(message = `Набранные очки: ${score}`) {
    gameOver = true;
    gameOverReason.textContent = message;
    gameOverElement.classList.add("visible");
}

function showFireworks() {
    const colors = ["#737373", "#8f8f8f", "#555555", "#bdbdbd"];
    fireworks.innerHTML = "";
    fireworks.classList.add("active");

    for (let i = 0; i < 42; i += 1) {
        const spark = document.createElement("span");
        const angle = (Math.PI * 2 * i) / 14;
        const radius = 24 + (i % 3) * 18;
        const centerX = 170 + (i % 3) * 130;
        const centerY = 62 + (i % 2) * 34;

        spark.style.left = `${centerX}px`;
        spark.style.top = `${centerY}px`;
        spark.style.backgroundColor = colors[i % colors.length];
        spark.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * radius}px`);
        fireworks.appendChild(spark);
    }

    clearTimeout(fireworkTimeout);
    fireworkTimeout = setTimeout(function () {
        fireworks.classList.remove("active");
        fireworks.innerHTML = "";
    }, fireworkDuration);
}

function growDino() {
    dino.classList.add("grown");

    clearTimeout(dinoGrowthTimeout);
    dinoGrowthTimeout = setTimeout(function () {
        dino.classList.remove("grown");
    }, dinoGrowthDuration);
}

function clearEffects() {
    clearTimeout(fireworkTimeout);
    clearTimeout(dinoGrowthTimeout);
    fireworks.classList.remove("active");
    fireworks.innerHTML = "";
    dino.classList.remove("grown", "jump");
}

function resetGame() {
    sequenceIndex = 0;
    intervalIndex = 0;
    itemIndex = 0;
    itemIntervalIndex = 0;
    lastSpawnTime = 0;
    lastItemSpawnTime = 0;
    nextSpawnDelay = 520;
    nextItemSpawnDelay = 1700;
    previousTime = 0;
    speed = initialSpeed;
    distance = 0;
    gameOver = false;

    obstacles.innerHTML = "";
    items.innerHTML = "";
    gameOverElement.classList.remove("visible");
    gameOverReason.textContent = "";
    clearEffects();
    setEnergy(100);
    updateScore(0);
    spawnObstacle();
    requestAnimationFrame(update);
}

function update(currentTime) {
    if (!previousTime) {
        previousTime = currentTime;
        lastSpawnTime = currentTime;
        lastItemSpawnTime = currentTime;
    }

    const delta = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    speed = Math.min(maxSpeed, speed + accelerationPerSecond * delta);
    distance += speed * delta;
    updateScore(Math.floor(distance / scoreDistanceRatio));
    setEnergy(energy - energyDrainPerSecond * delta);

    if (energy <= 0) {
        endGame("УСТАЛ!");
        return;
    }

    if (currentTime - lastSpawnTime >= nextSpawnDelay) {
        spawnObstacle();
        lastSpawnTime = currentTime;
    }

    if (currentTime - lastItemSpawnTime >= nextItemSpawnDelay) {
        spawnItem();
        lastItemSpawnTime = currentTime;
    }

    const dinoRect = dino.getBoundingClientRect();
    const activeObstacles = [...document.querySelectorAll(".obstacle")];
    const activeItems = [...document.querySelectorAll(".item")];

    activeObstacles.forEach((obstacle) => {
        const currentLeft = parseFloat(obstacle.style.left);
        const nextLeft = currentLeft - speed * delta;
        obstacle.style.left = `${nextLeft}px`;

        if (nextLeft < -60) {
            obstacle.remove();
            return;
        }

        if (rectsCollide(dinoRect, obstacle.getBoundingClientRect())) {
            endGame();
        }
    });

    activeItems.forEach((item) => {
        const currentLeft = parseFloat(item.style.left);
        const nextLeft = currentLeft - speed * delta;
        item.style.left = `${nextLeft}px`;

        if (nextLeft < -60) {
            item.remove();
            return;
        }

        if (item.classList.contains("manzherok")) {
            if (headCollidesWithItem(dinoRect, item.getBoundingClientRect())) {
                item.remove();
                setEnergy(100);
                showFireworks();
                growDino();
            }
            return;
        }

        if (rectsCollide(dinoRect, item.getBoundingClientRect())) {
            const type = item.classList.contains("whiskey") ? "whiskey" : "ice";
            setEnergy(energy + itemBonus[type]);
            item.remove();
        }
    });

    if (!gameOver) {
        requestAnimationFrame(update);
    }
}

document.addEventListener("keydown", function(event) {
    if (gameOver && (event.code === "Enter" || event.code === "Space")) {
        event.preventDefault();
        resetGame();
        return;
    }

    if (event.code === "Enter" || event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
    }
});

document.addEventListener("click", function() {
    if (gameOver) {
        resetGame();
        return;
    }

    jump();
});

document.addEventListener("touchstart", function(event) {
    event.preventDefault();

    if (gameOver) {
        resetGame();
        return;
    }

    jump();
});

resetGame();
