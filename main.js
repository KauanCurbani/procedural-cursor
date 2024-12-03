const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let rootDot = { x: canvas.width / 2, y: canvas.height / 2, size: 35 };
let chain = [
  { x: canvas.width / 2, y: canvas.height / 2, size: 32 },
  { x: canvas.width / 2, y: canvas.height / 2, size: 38 },
  { x: canvas.width / 2, y: canvas.height / 2, size: 32 },
  { x: canvas.width / 2, y: canvas.height / 2, size: 24 },
  { x: canvas.width / 2, y: canvas.height / 2, size: 12 },
  { x: canvas.width / 2, y: canvas.height / 2, size: 6 },
];
let chainSilhouettePoints = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("mousemove", (e) => {
  rootDot = { x: e.clientX, y: e.clientY, size: rootDot.size };
});

const CONSTRAINT = 32;
const SHOW_CONSTRAINT = false;
const SHOW_DOT = true;
const SHOW_SEGMENT = false;
const SHOW_SILHOUETTE = true;

const calculateSilhouette = () => {
  chainSilhouettePoints = [];

  const nextDot = chain[1];
  const dx = nextDot.x - rootDot.x;
  const dy = nextDot.y - rootDot.y;
  const angle = Math.atan2(dy, dx) + Math.PI;

  const silhouettePoint = {
    x: rootDot.x + rootDot.size * Math.cos(angle),
    y: rootDot.y + rootDot.size * Math.sin(angle),
  };

  chainSilhouettePoints.push(silhouettePoint);

  for (let i = 0; i < chain.length; i++) {
    let haveNext = chain[i + 1];
    let referenceDot = chain[i + 1] ?? chain[i - 1];
    const currentDot = chain[i];
    const dx = referenceDot.x - currentDot.x;
    const dy = referenceDot.y - currentDot.y;

    const angle = Math.atan2(dy, dx) + (haveNext ? Math.PI / 2 : -Math.PI / 2);

    const silhouettePoint = {
      x: currentDot.x + currentDot.size * Math.cos(angle),
      y: currentDot.y + currentDot.size * Math.sin(angle),
    };

    chainSilhouettePoints.push(silhouettePoint);
  }

  for (let i = chain.length - 1; i >= 0; i--) {
    let haveNext = chain[i - 1];
    let referenceDot = chain[i - 1] ?? chain[i + 1];
    const currentDot = chain[i];
    const dx = referenceDot.x - currentDot.x;
    const dy = referenceDot.y - currentDot.y;

    const angle = Math.atan2(dy, dx) + (haveNext ? Math.PI / 2 : -Math.PI / 2);

    const silhouettePoint = {
      x: currentDot.x + currentDot.size * Math.cos(angle),
      y: currentDot.y + currentDot.size * Math.sin(angle),
    };

    chainSilhouettePoints.push(silhouettePoint);
  }
  chainSilhouettePoints.push(silhouettePoint);
};

const drawSilhouette = () => {
  if (chainSilhouettePoints.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(chainSilhouettePoints[0].x, chainSilhouettePoints[0].y);

  for (let i = 1; i < chainSilhouettePoints.length; i++) {
    // smooth curve
    let nextDot = chainSilhouettePoints[i + 1];
    if (nextDot) {
      ctx.quadraticCurveTo(
        chainSilhouettePoints[i].x,
        chainSilhouettePoints[i].y,
        (chainSilhouettePoints[i].x + nextDot.x) / 2,
        (chainSilhouettePoints[i].y + nextDot.y) / 2
      );
    }

    // straight line
    else {
      ctx.lineTo(chainSilhouettePoints[i].x, chainSilhouettePoints[i].y);
    }
  }

  ctx.fillStyle = "#5f656e";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
};

const drawDot = (dot, idx) => {
  if (SHOW_DOT) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (SHOW_CONSTRAINT) {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.arc(dot.x, dot.y, CONSTRAINT, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (SHOW_SEGMENT) {
    ctx.beginPath();
    ctx.setLineDash([0]);
    ctx.arc(dot.x, dot.y, dot.size ?? 3, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.stroke();
  }
};

const drawEyes = (dot) => {
  const SPACING = 15;
  const lastDot = chain[1];
  const dx = dot.x - lastDot.x;
  const dy = dot.y - lastDot.y;
  const angle = Math.atan2(dy, dx) + Math.PI / 2;

  const eye1 = {
    x: dot.x + Math.cos(angle) * SPACING,
    y: dot.y + Math.sin(angle) * SPACING,
  };
  const eye2 = {
    x: dot.x + Math.cos(angle) * -SPACING,
    y: dot.y + Math.sin(angle) * -SPACING,
  };

  // draw eyes
  drawDot({ ...eye1, size: 5 });
  drawDot({ ...eye2, size: 5 });
};

let curvature = 0;
const calculateCurvature = () => {
  // calculate chain curvature
  // if chain is aligned should be 0
  // if chain is curved to the right +value
  // if chain is curved to the left -value
  // calc using all chain points

  let sum = 0;

  for (let i = 0; i < chain.length - 2; i++) {
    const p0 = chain[i];
    const p1 = chain[i + 1];
    const p2 = chain[i + 2];

    const dx1 = p1.x - p0.x;
    const dy1 = p1.y - p0.y;
    const dx2 = p2.x - p1.x;
    const dy2 = p2.y - p1.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    const diff = angle2 - angle1;
    sum += diff;
  }

  curvature = sum;
};

const update = () => {
  chain[0] = rootDot;
  for (let i = 1; i < chain.length; i++) {
    const dx = chain[i].x - chain[i - 1].x;
    const dy = chain[i].y - chain[i - 1].y;
    const angle = Math.atan2(dy, dx);

    chain[i].x = chain[i - 1].x + CONSTRAINT * Math.cos(angle);
    chain[i].y = chain[i - 1].y + CONSTRAINT * Math.sin(angle);
  }
};

const drawFishTailWithCurvature = () => {
  ctx.beginPath();
  ctx.moveTo(chain[1].x, chain[1].y);

  for (let i = 1; i < 4; i++) {
    let nextDot = chain[i + 1];

    if (nextDot) {
      ctx.quadraticCurveTo(
        chain[i].x,
        chain[i].y,
        (chain[i].x + nextDot.x) / 2,
        (chain[i].y + nextDot.y) / 2
      );
    } else {
      ctx.lineTo(chain[i].x, chain[i].y);
    }
  }

  for (let i = 3; i > 1; i--) {
    let nextDot = chain[i - 1];
    if (nextDot) {
      const dx = nextDot.x - chain[i].x;
      const dy = nextDot.y - chain[i].y;
      const angle = Math.atan2(dy, dx) + curvature;
      const curvaturePoint = {
        x: chain[i].x + 10 * Math.cos(angle),
        y: chain[i].y + 10 * Math.sin(angle),
      };
      ctx.lineTo(curvaturePoint.x, curvaturePoint.y);
    } else {
      ctx.lineTo(chain[i].x, chain[i].y);
    }
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fill();
  ctx.stroke();
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // chain.forEach((dot, idx) => drawDot(dot, idx));
  calculateSilhouette();
  SHOW_SILHOUETTE && drawSilhouette();
  calculateCurvature();
  drawFishTailWithCurvature();
  drawEyes(chain[0]);
};

const loop = () => {
  update();
  draw();
  requestAnimationFrame(loop);
};

loop();
