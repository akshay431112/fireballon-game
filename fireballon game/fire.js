let playBtn, player, canvas, ctx, obstacles = [], foods = [], componentCreateCounter = 0, score = 0, gameStarted = false, gameOver = false;

let STATIC_ACCELERATOR;

// now, delta, nextTimeout, currentTimeout
const time = {};

const sprite = new Image();

sprite.load = new Promise((rs, rj) => {
    sprite.onload = () => rs(true);
    sprite.onerror = () => rj("Something went wrong :(");
});

const rectCollision = (r1, r2) => !(r1.x > r2.x + r2.w || r1.x + r1.w < r2.x || r1.y > r2.y + r2.h || r1.y + r1.h < r2.y);


sprite.afterLoaded = e => {
    player = new HAB(0, canvas.height/2);
    document.getElementById("loading").style.display = "none";
    canvas.style.display = "block";
    playBtn.style.display = "block";
    new Food(50, 50, 0, "magnetic");
    new Food(canvas.width/2, canvas.height/2, 0, "magnetic");
    Food.create(15);
    requestAnimationFrame(update);
};

class HAB {
    constructor(x, y) {
        this.w = 100 / 3;
        this.h = 150 / 3;
        this.x = canvas.width/2 - this.w/2;
        this.y = canvas.height/2 + canvas.height/5;
        this.state = "normal"; //normal, magnetic
        this.lastMagneticStatetime = null;
        this.magnetStateTimeout = 5000;
    }

    update() {
        if(this.lastMagneticStatetime != null) {
            if(Math.abs(new Date().getTime() - this.lastMagneticStatetime) 
            >= this.magnetStateTimeout) {
                this.lastMagneticStatetime = null;
                this.state = "normal";
            }
        }
        ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
    }
};


class Obstacle {
    constructor() {
        this.w = Math.random() * (canvas.width * 0.4) + 50;
        this.x = random(0, canvas.width - this.w);
        this.h = 5;
        this.y = -this.h; 
        this.vel = {x:0, y:110};
        obstacles.push(this);
    }

    draw() {
        ctx.fillStyle = "#222";
        ctx.fillRect(this.x, this.y, this.w, this.h);
        for(let i=0; i < this.w; i+=5) {
            let px = this.x + i;
            let py = i % 2 ? this.y + this.h : this.y + this.h + 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px, py + 2);
            ctx.closePath();
            ctx.strokeStyle = "#222";
            ctx.stroke();
        }
    }

    update() {
        this.y += ((this.vel.y + STATIC_ACCELERATOR) * time.delta);
        if(this.y + this.h > canvas.height) 
            obstacles.splice(obstacles.indexOf(this), 1);
        this.draw();
    }
};



class Food {
    constructor(x, y, velRate, type="static") {
        this.x = x;
        this.y = y;
        this.type = type; //[static, magnetic]
        this.r = 8;
        this.w = this.r / 2 - 1;
        this.h = 10;
        this.vel = {x:0, y:90+velRate};
        this.c = "#222";
        foods.push(this);
    }

    draw() {
        if(this.type === "static") {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = this.c;
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillRect(this.x + this.w + 4, this.y, this.w, this.h);
            ctx.fillRect(this.x, this.y+this.h, this.r, 2);
        }
    }

    update() {
        if(gameStarted && !gameOver) {
            if(player.state === "magnetic") {
                let diffX = player.x - this.x;
                let diffY = player.y - this.y;
                let dist = Math.hypot(diffX, diffY);
                let ang = Math.atan2(diffY, diffX);
                if(dist <= 100) {
                    this.c = "red";
                    this.x += Math.cos(ang);
                    this.y += Math.sin(ang);
                }
            }
            this.y += (this.vel.y * time.delta);
        }
        if(this.y + this.r > canvas.height)
            foods.splice(foods.indexOf(this), 1);
        if(this.type === "static") {
            let r = {x:this.x-this.r, y:this.y-this.r, w:this.r*2, h:this.r*2};
            if(rectCollision(player, r)) {
                foods.splice(foods.indexOf(this), 1);
                score += 2;
            }
        } else {
            let r = {x:this.x, y:this.y, w:this.w*3, h:this.h};
            if(rectCollision(player, r)) {
                foods.splice(foods.indexOf(this), 1);
                player.state = "magnetic";
                player.lastMagneticStatetime = new Date().getTime();
            }
        }
        this.draw();
    }

    /** Create Many non-overlapping circles
     *  Adapted from: https://code.sololearn.com/WoF8B2e56Pd3/#
     */
    static create(amt, type) {
        for(let i=0; i < amt; i++) {
            let radius = 8;
            let x = random(radius, canvas.width - radius);
            let y = gameStarted ? -radius*2 : random(radius, canvas.height - radius);
            // make sure particles are not overlapping
            if(i !== 0) {
                for(let j=0; j < foods.length; j++) {
                    let diffX = x - foods[j].x;
                    let diffY = y - foods[j].y;
                    let isColliding = Math.hypot(diffX, diffY) < radius+radius;
                    if(isColliding) {
                            // overlapping particles => generate new pos
                            x = random(radius, canvas.width - radius);
                            y = gameStarted ? random(-radius*2, -radius-4) : random(radius, canvas.height - radius);
        
                            j = -1;
                        }
                }
            }
            new Food(x, y, 0, type);
        };
    }
};

const random = (min, max) => Math.random() * (max - min + 1)+min;


const game = {
    firstInit: true,
    start() {
        playBtn.style.display = "none";
        time.t0 = new Date().getTime();
        time.nextTimeOut = new Date().getTime();
        time.currentTimeout = 1500;
        time.nextFoodTimeout = 500;
        time.currentFoodTimeout = 1500;
        player = new HAB(0, canvas.height/2);
        gameStarted = true;
        gameOver = false;
        score = 0;
        STATIC_ACCELERATOR = 0;
        if(!this.firstInit) {
            foods = [];
            obstacles = [];
        }
    },
    end() {
        this.firstInit = false;
        gameOver = true;
        playBtn.style.display = "block";
    }
};

const update = () => {
    time.now = new Date().getTime();
    time.delta = Math.abs(time.now - time.t0) * 0.001;
    time.t0 = time.now;
    if(Math.abs(time.now - time.nextTimeOut) >= time.currentTimeout/2) {
        componentCreateCounter++;
        if(!gameOver) {
            Food.create(random(4, 6), "static");
           // if(!(componentCreateCounter % 2)) 
                new Obstacle();
            if(!(componentCreateCounter % 30))
                Food.create(1, "magnetic");
              //  STATIC_ACCELERATOR += 60;
            if(!(componentCreateCounter % 10)) 
                STATIC_ACCELERATOR += 60;
        }
        time.nextTimeOut = time.now;
    }
    if(time.delta > 0.2) time.delta = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    obstacles.forEach(obs => {
        if(rectCollision(player, obs)) 
            game.end();
        if(!gameOver) obs.update();
        else obs.draw();
    });
    foods.forEach(food => food.update());
    ctx.fillStyle = "#222";
    ctx.font = "bold 20px Monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${score}`, 20, 20);
    requestAnimationFrame(update);
};


onload = () => {
    canvas = document.getElementById("canvas");
    playBtn = document.getElementById("play");
    canvas.width = Math.min(innerWidth, 420);
    canvas.height = Math.min(innerHeight, 580);
    canvas.style.border = "1px solid #222";
    canvas.style.position = "absolute";
    canvas.style.left = `${innerWidth/2 - canvas.width/2}px`;
    canvas.style.top = `${innerHeight/2 - canvas.height/2}px`;
    playBtn.style.left = `${innerWidth/2 - 45}px`;
    playBtn.style.top = `${innerHeight/2 + canvas.height/3}px`;
    ctx = canvas.getContext("2d");
    sprite.src = "https://i.ibb.co/R74qqS5/unnamed.png";
    sprite.load.then(e => {
        sprite.afterLoaded(e);
    }).catch(e => {
        document.getElementById("loading").innerHTML = e;
    });

    playBtn.onclick = () => game.start();

    canvas.onmousemove = e => {
        if(gameStarted && !gameOver) {
            let bRect = canvas.getBoundingClientRect();
            let tLeft = e.clientX - bRect.left;
            player.x = tLeft - player.w/2;
        }
    };

    canvas.ontouchmove = e => {
        if(gameStarted && !gameOver) {
            let bRect = canvas.getBoundingClientRect();
            let tLeft = e.touches[0].pageX - bRect.left;
            player.x = tLeft - player.w/2;
        }
    };

};