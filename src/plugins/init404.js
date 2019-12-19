function Wave(window) {
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;
  const WAVE_DETAIL = Math.round(WIDTH / 50);
  const DENSITY = 0.96;
  const AIR_DENSITY = 1.02;
  const WATER_DENSITY = 1.2;
  const FRICTION = 0.91;
  const AREA_OF_EFFECT = 120;
  const MOUSE_PULL_SPEED = 0.162;
  const IMPULSE_INTERVAL = 4000;
  const NUM_BUBBLES = 20;
  const DIVING_FORCE = 40;
  const DISSOLVED_BUBBLE_SIZE = 10;
  const CHAR_DISTANCE = 120;

  let waves;
  let bubbles;
  let textArray;
  let characters;
  let images;
  let context;
  let idleTime = 0;
  const letters = ['4', '0', '4'];
  let setTimeUpdate = null;
  let impulseTimeUpdate = null;
  let bubblesUpdate = null;
  let index = 0;
  let isMouseDown = false;

  const mousePos = { x: 0, y: 0 };
  const mouseSpeed = { x: 0, y: 0 };
  const oldMousePos = { x: 0, y: 0 };

  function MouseMove(e) {
    idleTime = 0;

    mouseSpeed.x = Math.max(Math.min(mousePos.x - e.clientX, 40), -40);
    mouseSpeed.y = Math.max(Math.min(mousePos.y - e.clientY, 40), -40);

    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    oldMousePos.x = mousePos.x;
    oldMousePos.y = mousePos.y;
  }

  function Text(character, px, py, vx, vy) {
    if (character === null || character === undefined) {
      character.concat(textArray);
    }

    this.character = character;
    this.px = px;
    this.py = py;
    this.vx = vx;
    this.vy = vy;
    this.sx = this.px;
    this.sy = this.py;
    const pos = letters.indexOf(character);

    if (pos !== -1) {
      const data = `
        data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
          <foreignObject width='100%' height='100%'>
            <div xmlns='http://www.w3.org/1999/xhtml' style='font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 180px; font-weight:bold'>
              <span style='color:rgb(32,124,202); opacity: 0.8; -webkit-text-stroke-color: white; -webkit-text-stroke-width: 2px'>
                ${letters[pos]}
              </span>
            </div>
          </foreignObject>
        </svg>`;
      characters.push(data);
    }
  }

  function DissolveBubble(indexInner) {
    let i = 0;
    const bubble = bubbles[indexInner];
    if (bubble.dissolved === false) {
      bubble.dissolved = true;

      setTimeout(() => {
        for (; i < bubbles.length; i += 1) {
          if (bubble === bubbles[i]) {
            bubbles.splice(i, 1);
            break;
          }
        }
      }, 1000);
    }
  }

  function getMousePosition(e, canvas, world) {
    const offsetCanvas = canvas.getBoundingClientRect();
    const offsetWorld = world.getBoundingClientRect();

    const x = e.clientX + offsetWorld.left - offsetCanvas.left;
    const y = e.clientY + offsetWorld.top - offsetCanvas.top;

    return { x, y };
  }

  function Bubble(x, y, size, velocity, mass) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.mass = mass;
    this.velocity = velocity;
    this.dissolved = false;
    this.dissolvedBubbleSize = DISSOLVED_BUBBLE_SIZE;
    this.children = [];

    this.draw = () => {
      context.fillStyle = '#rgba(38,85,139,1)';
      context.beginPath();
      context.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
      context.closePath();
      context.fill();
    };
  }

  function RandomWave(position, force) {
    const wave = waves[Math.floor((position / WIDTH) * (Math.random() * waves.length))];

    if (wave) {
      wave.force.y += force;
      wave.force.y *= FRICTION;
    }
  }

  function GetDistanceBetween(p1, p2) {
    const posX = p2.x - p1.x;
    const posY = p2.y - p1.y;
    return Math.sqrt(posX * posX + posY * posY);
  }

  function FindClosestWave(point) {
    let closestWave = 200;
    let indexInner = 0;

    const { length } = waves;
    for (let i = 0; i < length; i += 1) {
      const dist = GetDistanceBetween(point, waves[i]);
      if (closestWave > dist) {
        closestWave = dist;
        indexInner = i;
      }
    }
    return waves[indexInner];
  }

  this.Init = function Init(canvas, world) {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
    context = canvas.getContext('2d');

    world.width = window.innerWidth;
    world.height = window.innerHeight;
    const ctx = world.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c9dbe9');
    gradient.addColorStop(1, '#fff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    waves = [];
    bubbles = [];
    textArray = [];
    characters = [];
    images = new Array(letters.length);

    let i = 0;

    for (; i < letters.length; i += 1) {
      const textPosition = WIDTH / 2 - (letters.length * CHAR_DISTANCE) / 2;
      const txt = new Text(
        letters[i],
        textPosition + i * CHAR_DISTANCE,
        HEIGHT / 2,
        Math.random() * 3 + 5,
        -Math.random() * 10 + 5,
      );

      images[i] = new Image();
      images[i].src = characters[i];
      textArray.push(txt);
    }

    for (i = 0; i < WAVE_DETAIL; i += 1) {
      waves.push({
        x: (WIDTH / (WAVE_DETAIL - 4)) * (i - 2),
        y: HEIGHT * 0.2,
        original: { x: 0, y: HEIGHT * 0.5 },
        velocity: { x: 0, y: Math.round(Math.random() * 3) + 5 },
        force: { x: 0, y: 0 },
        mass: 10,
      });
    }

    this.draw();
    this.ResizeCanvas(canvas, world);
    bubblesUpdate = window.setInterval(this.CreateBubbles, 800);
    impulseTimeUpdate = window.setInterval(() => {
      this.InjectImpulse(canvas);
    }, IMPULSE_INTERVAL);

    canvas.addEventListener('mousemove', MouseMove);

    canvas.addEventListener('mousedown', (e) => {
      const pos = { x: 0, y: 0 };
      isMouseDown = true;
      const mouseCoordinate = getMousePosition(e, canvas, world);
      for (let ind = 0; ind < bubbles.length; ind += 1) {
        const bubble = bubbles[ind];
        if (
          mouseCoordinate.x > bubble.x
          && mouseCoordinate.x < bubble.x + bubble.size
          && mouseCoordinate.y > bubble.y && mouseCoordinate.y < bubble.y + bubble.size
        ) {
          index = bubbles.indexOf(bubble, 0);
          pos.x = mouseCoordinate.x;
          pos.y = mouseCoordinate.y;
          break;
        }
      }

      if (
        isMouseDown
        && pos.x < bubbles[index].x + bubbles[index].size
        && pos.x > bubbles[index].x
        && pos.y < bubbles[index].y + bubbles[index].size
        && pos.y > bubbles[index].y
      ) {
        DissolveBubble(index);
      }
    });

    canvas.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });
  };

  this.draw = () => {
    this.UpdateCanvas();
    setTimeUpdate = window.requestAnimationFrame(() => {
      this.draw();
    });
  };

  this.UpdateCanvas = function UpdateCanvas() {
    const linearGradient = context.createLinearGradient(0, HEIGHT * 0.3, 0, HEIGHT);
    linearGradient.addColorStop(0, '#4bb8f0');
    linearGradient.addColorStop(1, 'rgba(38, 85, 139, 0.5)');

    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = linearGradient;
    context.beginPath();
    context.moveTo(waves[0].x, waves[0].y);

    const { length } = waves;
    let previous;
    let current;
    let next;
    for (let i = 0; i < length; i += 1) {
      previous = waves[i - 1];
      current = waves[i];
      next = waves[i + 1];

      if (previous != null && next != null) {
        const force = -DENSITY * (previous.y - current.y)
          + DENSITY * (current.y - next.y)
          + (DENSITY / 15) * (current.y - current.original.y);

        current.velocity.y -= force / previous.mass + current.force.y;
        current.force.y *= FRICTION;
        current.velocity.y *= FRICTION;
        current.y += current.velocity.y;

        const distanceFromMouse = GetDistanceBetween(current, mousePos);
        if (distanceFromMouse < AREA_OF_EFFECT) {
          const dist = GetDistanceBetween({
            x: current.original.x,
            y: current.original.y,
          }, mousePos);
          mouseSpeed.x *= 0.95;
          mouseSpeed.y *= 0.95;

          current.force.y += MOUSE_PULL_SPEED * (1 - dist / AREA_OF_EFFECT) * mouseSpeed.y * 0.4;
        }
        context.quadraticCurveTo(
          previous.x,
          previous.y,
          previous.x + (current.x - previous.x) / 2,
          previous.y + (current.y - previous.y) / 2,
        );
      }
    }

    context.lineTo(waves[waves.length - 1].x, waves[waves.length - 1].y);
    context.lineTo(WIDTH, HEIGHT);
    context.lineTo(0, HEIGHT);
    context.lineTo(waves[0].x, waves[0].y);

    context.fill();
    idleTime += 1;
    for (let i = 0; i < bubbles.length; i += 1) {
      const bubble = bubbles[i];
      const wave = FindClosestWave(bubble);
      const dist = GetDistanceBetween(wave, mousePos);
      bubble.velocity.y /= bubble.y > wave.y ? WATER_DENSITY : AIR_DENSITY;
      bubble.velocity.y
        -= bubble.y > wave.y ? 1 / bubble.mass : (-(wave.y - bubble.y) * 0.01) / bubble.mass;
      bubble.y += bubble.velocity.y;

      bubble.velocity.x /= Math.min(1.95, Math.max(1.98, Math.random()));
      bubble.velocity.x
        += bubble.velocity.x < 0
          ? Math.max(bubble.velocity.x, -0.8 / bubble.mass)
          : Math.min(bubble.velocity.x, 0.8 / bubble.mass);
      bubble.x += bubble.velocity.x;
      bubble.draw();

      if (bubble.x + bubble.size > WIDTH) {
        bubble.velocity.x *= -0.82;
      }
      if (bubble.x - bubble.size < 0) {
        bubble.velocity.x *= -0.82;
      }

      if (dist < AREA_OF_EFFECT) {
        bubble.velocity.x
          += mousePos.y < oldMousePos.y
            ? ((MOUSE_PULL_SPEED * ((AREA_OF_EFFECT - dist) / AREA_OF_EFFECT) * 1) / bubble.mass)
              * mouseSpeed.x
            : ((MOUSE_PULL_SPEED * ((AREA_OF_EFFECT - dist) / AREA_OF_EFFECT) * 1) / bubble.mass)
              * -mouseSpeed.x;
      }

      if (bubble.dissolved) {
        let j = 0;
        while (bubble.children.length < bubble.dissolvedBubbleSize) {
          const smallBubble = new Bubble(
            bubble.x,
            bubble.y,
            Math.random() * bubble.dissolvedBubbleSize,
            { x: Math.random() * 20 - 10, y: -Math.random() * 10 },
            Math.random() * bubble.dissolveSize + bubble.dissolveSize * 0.5,
          );
          bubble.children.push(smallBubble);
        }

        const smallBubblesLength = bubble.children.length;
        for (; j < smallBubblesLength; j += 1) {
          const smallBubble = bubble.children[j];
          bubble.size = smallBubble.size;
          smallBubble.x += smallBubble.velocity.x;
          smallBubble.y += smallBubble.velocity.y;

          smallBubble.velocity.x /= 1.02;
          smallBubble.velocity.y += 0.35;
          smallBubble.size /= 1.1;

          context.moveTo(bubble.x + smallBubble.x, bubble.y + bubble.y);
          smallBubble.draw();
        }
      }
    }

    let force;
    let angle;
    const textArrayLength = textArray.length;

    for (let k = 0; k < textArrayLength; k += 1) {
      context.save();
      const letter = textArray[k];
      const closestWave = FindClosestWave(letter);
      letter.vy /= letter.py > closestWave.y ? WATER_DENSITY : AIR_DENSITY;

      let dx = mousePos.x - letter.sx;
      let dy = mousePos.y - letter.sy;
      const distSQ = Math.sqrt(dx * dx + dy * dy);
      if (distSQ < 150) {
        dx = mousePos.x - letter.px;
        dy = mousePos.y - letter.py;

        force = 1 - distSQ / 250;
        angle = Math.atan2(dy, dx);
        letter.vx += Math.cos(angle) * force;
        letter.vy += Math.sin(angle) * force;
      } else {
        letter.vx += (letter.sx - letter.px) * 0.01;
        letter.vy += (letter.sy - letter.py) * 0.01;
      }
      letter.px += letter.vx;
      letter.py += letter.vy;
      letter.vx *= 0.975;
      letter.vy *= 0.975;

      context.translate(letter.px, letter.py);
      const dwx = letter.px - closestWave.x;
      const dwy = letter.py - closestWave.y;
      const dsq = Math.sqrt(dwx * dwx + dwy * dwy);
      const a = Math.atan2(dwy, dwx);
      if (dsq < 100) {
        if (letter.vx < 0 && letter.vy < 0) {
          context.translate(letter.px + 50, letter.py + 50);
          context.rotate((Math.sin(a) * 0.65 * dsq * Math.PI) / 180);
          context.translate(letter.px - 50, letter.py - 50);
        } else {
          context.translate(letter.px + 50, letter.py + 50);
          context.rotate((-Math.sin(a) * 0.65 * dsq * Math.PI) / 180);
          context.translate(letter.px - 50, letter.py - 50);
        }
      }
      context.rotate((Math.sin(a) * 0.65 * dsq * Math.PI) / 180);
      context.drawImage(images[k], 0, 0);
      context.restore();
    }
  };

  this.InjectImpulse = function InjectImpulse(canvas) {
    if (idleTime > 7 || mouseSpeed.x < 4 || mouseSpeed.y < 4) {
      canvas.removeEventListener('mousemove', this);
      const force = 2;
      const random = Math.random();
      RandomWave(WIDTH * random, random * (force / 4 + force));
    }
  };

  this.CreateBubbles = function CreateBubbles() {
    if (bubbles.length > NUM_BUBBLES) {
      let i = 0;
      if (bubbles[i].dissolved) {
        for (; i < bubbles.length; i += 1) {
          if (bubbles[i].dissolved === false) {
            bubbles[i].size = DISSOLVED_BUBBLE_SIZE;
            DissolveBubble(i);
            break;
          }
        }
      } else {
        DissolveBubble(i);
      }
    }

    const minSize = 16;
    const maxSize = 48;
    const size = minSize + (Math.random() * (maxSize - minSize)) / 2;
    const bubble = new Bubble(
      maxSize + Math.random() * (WIDTH - maxSize),
      HEIGHT - maxSize,
      size,
      { x: Math.random() * DIVING_FORCE - DIVING_FORCE / 2, y: 0 },
      size / maxSize + 1,
    );
    bubbles.push(bubble);
  };

  this.ResizeCanvas = (canvas, world) => {
    const widthInner = window.innerWidth;
    const heightInner = window.innerHeight;

    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);

    world.setAttribute('width', window.innerWidth);
    world.setAttribute('height', window.innerHeight);

    for (let i = 0; i < WAVE_DETAIL; i += 1) {
      waves[i].x = (widthInner / (WAVE_DETAIL - 4)) * (i - 2);
      waves[i].y = heightInner * 0.5;

      waves[i].original.x = waves[i].x;
      waves[i].original.y = waves[i].y;
    }
  };
  this.destroy404 = () => {
    window.cancelAnimationFrame(setTimeUpdate);
    window.clearTimeout(impulseTimeUpdate);
    window.clearTimeout(bubblesUpdate);

    window.removeEventListener('resize', this.ResizeCanvas);
  };

  HTMLCanvasElement.prototype.getMousePosition = getMousePosition;
}

export default function init404(window, canvas, world) {
  let lastTime = 0;
  const vendors = ['ms', 'moz', 'webkit', 'o'];

  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
    window.requestAnimationFrame = window[`${vendors[x]}RequestAnimationFrame`];
    window.cancelAnimationFrame = window[`${vendors[x]}CancelAnimationFrame`]
      || window[`${vendors[x]}CancelRequestAnimationFrame`];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }

  const wave = new Wave(window);
  wave.Init(canvas, world);

  window.addEventListener('resize', wave.ResizeCanvas(canvas, world));

  return wave;
}
