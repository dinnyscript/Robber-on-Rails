let canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

function dgei(id) {
    return document.getElementById(id);
}

//Configuration
let Configs = {
    resolution: [1920,1080],
    scale: 1,//conversion factor from pixels to in game length
    xdim : 80, //what the width of the screen should be in in-game length
};

let Keys = {
    mousePos : [40,22.5],
    mouseDown : false,
};
let audio = {};

function resize() {
    Configs.resolution = [window.innerWidth, window.innerHeight];
    let w = Math.round(window.innerHeight * 16/9);
    let h = Math.round(window.innerWidth * 9/16);
    let t = 0;
    let l = 0;
    if (w <= window.innerWidth) {
        l = (window.innerWidth-w)/2;
        Configs.resolution[0] = w;
    } else {
        t = (window.innerHeight-h)/2;
        Configs.resolution[1] = h;
    }
    canvas.width = Configs.resolution[0];
    canvas.height = Configs.resolution[1];
    canvas.style.width = Configs.resolution[0] + 'px';
    canvas.style.height = Configs.resolution[1] + 'px';
    canvas.style.top = t + 'px';
    canvas.style.left = l + 'px';
    Configs.scale = Configs.resolution[0]/Configs.xdim;

    ctx.transform(1,0,0,1,0,0);
    ctx.scale(Configs.scale, Configs.scale);
}
resize();
window.addEventListener("resize", resize);
window.addEventListener("keydown", function(e) {
    Keys[e.code] = true;
});
window.addEventListener("keyup", function(e) {
    Keys[e.code] = false;
});
window.addEventListener("mousemove", function(e) {
    Keys.mousePos = [(e.pageX - window.innerWidth/2) / Configs.scale, (e.pageY - window.innerHeight/2) / Configs.scale];
});
window.addEventListener("mousedown", function(e) {
    Keys.mouseDown = true;
});
window.addEventListener("mouseup", function(e) {
    Keys.mouseDown = false;
});

class Level {
    constructor(o) {
        for (let x in o) {
            this[x] = o[x];
        }
        this.path = new Path(this.points);
        this.numPts = this.points.length;
        this.bullets = [];
        this.numCams = this.cameras.length;
        this.mode = true;
        this.opener = 1;
        this.closeType = -1;
        this.toClose = 0;
        this.death = true;
    }
    init(opener = 1) {
        player.pos = 0;
        player.speed = 0; //TODO - maybe no reset, keep vel
        player.cam = [0,0];
        player.camV = [0,0];
        player.pastPos = [0,0];
        player.reloadState = 1;
        player.screenShake = 0;
        player.ammo = this.ammo;
        this.bullets = [];
        this.numCams = this.cameras.length;

        //revive all death and todeath vlaues, including the player's
        for (let i = 0; i < this.lasers.length; i++) {
            this.lasers[i].dead = false;
            this.lasers[i].toDeath = 0;
        }
        for (let i = 0; i < this.cameras.length; i++) {
            this.cameras[i].dead = false;
            this.cameras[i].toDeath = 0;
        }
        for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].opacity = 0;
        }
        player.dead = false;
        player.toDeath = 0;

        this.opener = opener;
        this.closeType = -1;
        this.toClose = 0;
        if (opener == 1) audio.play('opener');
    }
    reload() {
        this.init(0);
    }
    renderTrack() {
        ctx.fillStyle = rgba(0,0,0);
        ctx.beginPath();
        ctx.moveTo(this.points[0][0], this.points[0][1]);
        for (let i = 2; i < this.numPts; i += 2) {
            ctx.quadraticCurveTo(this.points[i-1][0], this.points[i-1][1], this.points[i][0], this.points[i][1]);
        }
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        ctx.strokeStyle = rgba(255,255,255);
        ctx.stroke();

        ctx.strokeStyle = rgba(150,150,150);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.setLineDash([.5, .1]);
        ctx.lineDashOffset = -0;
        ctx.strokeStyle = rgba(0,0,0);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = rgba(200, 255, 255);
        ctx.lineWidth = .15;
        ctx.beginPath();
        ctx.arc(this.points[0][0], this.points[0][1], 1.5 + Math.sin(now * 4) * .2 + Math.sin(now * 2) * .02, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    
        ctx.strokeStyle = rgba(255,200,200);
        if (this.numCams == 0) ctx.strokeStyle = rgba(200,255,200);
        ctx.beginPath();
        ctx.arc(this.points[this.numPts-1][0], this.points[this.numPts-1][1], 1.5 + Math.sin(now * 4) * .2 + Math.sin(now * 2) * .02, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = rgba(0,255,255);
        ctx.strokeStyle = rgba(255,255,255);
        
        ctx.beginPath();
        let c = [this.points[this.numPts-1][0], this.points[this.numPts-1][1]];
        let r = (1.5 + Math.sin(now * 4) * .13 + Math.sin(now * 2) * .013);
        let sc = .9 * r / 1.7;
        ctx.moveTo(c[0] - 1*sc, c[1] - .8*sc);
        ctx.lineTo(c[0] + 1*sc, c[1] - .8*sc);
        ctx.lineTo(c[0] + 1.2*sc, c[1] - .4*sc);
        ctx.lineTo(c[0], c[1] + 1*sc);
        ctx.lineTo(c[0] - 1.2*sc, c[1] - .4*sc);
        ctx.closePath();
        //ctx.fill();

        ctx.lineWidth = .1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c[0] - 1*sc, c[1] - .8*sc);
        ctx.lineTo(c[0] - .6*sc, c[1] - .4*sc);
        ctx.lineTo(c[0], c[1] - .8*sc);
        ctx.lineTo(c[0] + .6*sc, c[1] - .4*sc);
        ctx.lineTo(c[0] + 1*sc, c[1] - .8*sc);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c[0] + 1.2*sc, c[1] - .4*sc);
        ctx.lineTo(c[0] - 1.2*sc, c[1] - .4*sc);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c[0], c[1] + 1*sc);
        ctx.lineTo(c[0] - .6*sc, c[1] - .4*sc);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c[0], c[1] + 1*sc);
        ctx.lineTo(c[0] + .6*sc, c[1] - .4*sc);
        ctx.stroke();
    }
    renderEnemies() {
        let p = this.path.indexToPoint(player.pos);
        ctx.lineWidth = .15;
        for (let i = 0; i < this.cameras.length; i++) {
            let c = this.cameras[i];
            let angle = Math.atan2(p[1] - c.pos[1], p[0] - c.pos[0]);
            if (c.dead) {
                angle = c.angle;
            } else {
                c.angle = angle;
            }
            ctx.translate(c.pos[0], c.pos[1]);
            ctx.rotate(angle);
            
            ctx.lineWidth = .2;
            ctx.strokeStyle = rgba(255,255,255);
            
            ctx.fillStyle = rgba(55, 55, 55);

            if (c.dead) {
                let t = (1 - c.toDeath) * 255;
                ctx.fillStyle = rgba(t, t, t);
                ctx.strokeStyle = rgba(t, t, t);
            }
            ctx.beginPath();
            ctx.moveTo(1.5, -1);
            ctx.lineTo(2.3, -1.2);
            ctx.lineTo(2.3, 1.2);
            ctx.lineTo(1.5, 1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillRect(-1.6, -1.6,3.2, 3.2);
            ctx.strokeRect(-1.6,-1.6,3.2,3.2);

            let s = Math.sin(now * 5) * .3 + .7;
            ctx.fillStyle = rgba(100 * s,255 * s,100 * s);
            if (c.dead) {
                let t = (1 - c.toDeath) * 255;
                ctx.fillStyle = rgba(t, t, t);
                ctx.strokeStyle = rgba(t, t, t);
            }
            ctx.beginPath();
            ctx.arc(-.7,.7,0.3,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(-angle);

            ctx.translate(-c.pos[0], -c.pos[1]);

            if (!c.dead) {
                for (let i = this.bullets.length - 1; i>= 0; i--) {
                    if (dist2(c.pos, this.bullets[i].pos) <= (1.6 + .6)) {
                        c.dead = true;
                        audio.play('explosion');
                        this.bullets[i].dead = true;
                        player.screenShake = 1;
                        this.numCams--;
                    }
                }
            } else {
                c.toDeath = approach(c.toDeath, 1, 2*delta);
            }
        }
        for (let i = 0; i < this.lasers.length; i++) {
            let l = this.lasers[i];
            let pt = this.path.indexToPoint(l.pos);
            let dir = this.path.indexToDir(l.pos);
            dir = [-dir[1], dir[0]];
            let angle = Math.atan2(-dir[1], -dir[0]);
            if (l.radius < 0) angle += Math.PI;

            let p1 = [dir[0] * l.radius + pt[0], dir[1] * l.radius + pt[1]];
            let p2 = [-dir[0] * l.radius + pt[0], -dir[1] * l.radius + pt[1]];

            let s = Math.cos(now * 5.1) * .3 + .7;
            let c = Math.sin(now * 5.1) * .1 + .9;
            ctx.strokeStyle = rgba(255 * c,20 * c,20 * c);
            if (l.dead) {
                ctx.globalAlpha = (1 - l.toDeath)**3;
            }
            ctx.beginPath();
            ctx.moveTo(p1[0],p1[1]);
            ctx.lineTo(p2[0],p2[1]);
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.strokeStyle = rgba(255,255,255);
            ctx.fillStyle = rgba(55, 55, 55);
            if (l.dead) {
                let t = (1 - l.toDeath) * 255;
                ctx.fillStyle = rgba(t, t, t);
                ctx.strokeStyle = rgba(t, t, t);
            }
            
            ctx.translate(p1[0], p1[1]);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(1.5, -1.2);
            ctx.lineTo(2.3, -1.2);
            ctx.lineTo(2.3, 1.2);
            ctx.lineTo(1.5, 1.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillRect(-1.7,-1.7,3.4,3.4);
            ctx.strokeRect(-1.7,-1.7,3.4,3.4);
            ctx.fillStyle = rgba(255 * s,20 * s,20 * s);
            if (l.dead) {
                let t = (1 - l.toDeath) * 255;
                ctx.fillStyle = rgba(t, t, t);
                ctx.strokeStyle = rgba(t, t, t);
            }
            ctx.beginPath();
            ctx.arc(-.9,-.9,0.3,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(-angle);

            ctx.translate(-p1[0], -p1[1]);

            ctx.strokeStyle = rgba(255,255,255);
            ctx.fillStyle = rgba(55, 55, 55);
            ctx.translate(p2[0], p2[1]);
            ctx.rotate(angle);
            ctx.fillRect(-1.7,-1.7,3.4,3.4);
            ctx.strokeRect(-1.7,-1.7,3.4,3.4);
            ctx.rotate(-angle);
            ctx.translate(-p2[0], -p2[1]);

            for (let i = this.bullets.length - 1; i>= 0; i--) {
                if (dist2(p1, this.bullets[i].pos) <= (1.7 + .6) && !l.dead) {
                    l.dead = true;
                    audio.play('explosion');
                    player.screenShake = 1;
                    this.bullets[i].dead = true;
                }
                if (dist2(p2, this.bullets[i].pos) <= (1.7 + .6) && !this.bullets[i].dead) {
                    this.bullets[i].dead = true;
                    audio.play('nick');
                }
            }
            if (l.dead) {
                l.toDeath = approach(l.toDeath, 1, 2*delta);
            }
        }
    }
    renderPlayer() {
        ctx.lineWidth = .25;

        let pt = this.path.indexToPoint(player.pos);
        ctx.strokeStyle = rgba(255,255,255);
        let p = (200 * Math.pow(1 - player.reloadState, .2) + 55)/255;
        ctx.fillStyle = rgba(p * 255, p * 255, p * 255); //0, 255, 230
        if (player.dead) {
            let t = (1 - player.toDeath) * 255;
            ctx.fillStyle = rgba(255, 255, 255, t/255);
            ctx.strokeStyle = rgba(255, 255, 255, t/255);
        }
        ctx.translate(pt[0], pt[1]);
        ctx.rotate(player.aimAngle);
        ctx.beginPath();
        ctx.arc(0, 0, .9, Math.PI/2, 3/2 * Math.PI);
        ctx.lineTo(1.5, -.9);
        ctx.lineTo(1.5, .9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.rotate(-player.aimAngle);
    }
    renderBullets() {
        ctx.lineWidth = .2;
        for (let i = 0; i < this.bullets.length; i++) {
            let b = this.bullets[i];
            if (b.dead) {
                let s = 255 * (1 - b.toDeath);
                ctx.strokeStyle = rgba(s,s,s,s/255);
                ctx.fillStyle = rgba(s,s,s,s/255);
            } else {
                ctx.strokeStyle = rgba(255,255,255);
                ctx.fillStyle = rgba(0,0,0);
            }
            ctx.beginPath();
            ctx.arc(b.pos[0], b.pos[1], .5, 0, 2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    renderTexts() {
        let pt = this.path.indexToPoint(player.pos);
        for (let i = 0; i < this.texts.length; i++) {
            let t = this.texts[i];
            if (dist2(t.pos, pt) > t.radius) {
                t.opacity = approach(t.opacity, 0, 2*delta);
            } else {
                t.opacity = approach(t.opacity, 1, 2*delta);
            }
            ctx.fillStyle = rgba(255,255,255, t.opacity/1.5);
            ctx.font = t.size + "px 'Koulen', cursive";
            ctx.fillText(t.text, t.pos[0], t.pos[1]);
        }
    }
    simBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            if (!b.dead) {
                b.pos[0] += b.vel[0] * delta;
                b.pos[1] += b.vel[1] * delta;
            } else {
                b.toDeath = approach(b.toDeath, 1, 2*delta);
                if (b.toDeath == 1) {
                    this.bullets.splice(i, 1);
                }
            }
        }
    }
    simPlayer() {
        let past = player.pos;
        
        player.screenShake = approach(player.screenShake, 0, 4*delta);
        
        if (!player.dead) {
            player.pos = this.path.advance(player.pos, player.speed * delta);
            if (player.pos >= this.path.bezs.length && player.speed > 0) player.speed = 0;
            if (player.pos == 0 && player.speed < 0) player.speed = 0;
            let pt = this.path.indexToPoint(player.pos);
            let dir = this.path.indexToDir(player.pos);
            let vel = [dir[0] * player.speed, dir[1] * player.speed];
            player.aimAngle = Math.atan2(Keys.mousePos[1] - player.cam[1], Keys.mousePos[0] - player.cam[0]);

            
            player.reloadState = approach(player.reloadState, 1, 6*delta);
            if (this.closeType == -1) {
                if (Keys.mouseDown && player.reloadState == 1 && player.ammo > 0) {
                    Keys.mouseDown = false;
                    //shoot
                    let start = [pt[0] + 1 * Math.cos(player.aimAngle), pt[1] + 1 * Math.sin(player.aimAngle)];
                    let bulletSpeed = 60;
                    this.bullets.push(new Bullet(start, [bulletSpeed * Math.cos(player.aimAngle) + .0*vel[0], bulletSpeed * Math.sin(player.aimAngle) + .0*vel[1]]));
                    let c = .4;
                    let d = -dot(dir, [bulletSpeed * c * Math.cos(player.aimAngle), bulletSpeed * c * Math.sin(player.aimAngle)]);
                    player.speed += d;
                    player.reloadState = 0;
                    player.ammo--;
                    player.screenShake = 1;
                    audio.play('shoot');
                }
            
                for (let i = 0; i < this.lasers.length; i++) {
                    let th = this.path.advance(this.lasers[i].pos, -.5);
                    if (this.path.isBetween(th, past, player.pos) && !this.lasers[i].dead) {
                        player.pos = th;
                        player.dead = true;
                        audio.play('death');
                        player.speed = 0;
                        this.closeType = 0;
                    }
                }
            }
            let threshold = this.path.advance(this.path.bezs.length, -2.1)
            if (this.path.isBetween(threshold, past, player.pos)) {
                if (this.numCams > 0) {
                    player.pos = threshold;
                    audio.play('death');
                    player.dead = true;
                    player.speed = 0;
                    this.closeType = 0;
                } else {
                    //next level
                    audio.play('next');
                    this.closeType = 1;
                }
            }
        } else if (player.dead) {
            player.toDeath = approach(player.toDeath, 1, 2*delta);
        }
        //check if endpoint is still red
    }
    twistTransition(x) {
        let angle = Math.pow(1 - x,1.2) * 4 + Math.PI;
        let spacing = Math.pow(1 - x,5) * 100;
        ctx.fillStyle = rgba(0,0,0);
        ctx.translate(40, 22.5);
        ctx.rotate(angle);
        ctx.fillRect(-50, spacing, 100, 50);
        ctx.fillRect(-50, -spacing, 100, -50);
        ctx.rotate(-angle);
        ctx.translate(-40, -22.5);
    }
    render() {
        if (Keys['KeyR']) this.reload();
        this.simPlayer();
        this.simBullets();

        let pt = this.path.indexToPoint(player.pos);
        let dir = this.path.indexToDir(player.pos);

        let sc = .1 * player.speed;
        let target = [dir[0] * sc, dir[1] * sc];
        let disp = [target[0] - player.cam[0], target[1] - player.cam[1]];

        let s = [Math.sin(now * 50.1) + Math.sin(now * 70.221231) + Math.sin(Math.E *232* now), Math.cos(now * 52.1) + Math.sin(now * 232.221231) + Math.sin(Math.E *132* now)];
        let ss = pulse(player.screenShake) * .4;

        player.cam[0] += disp[0] * (1 - Math.exp(-2 * delta));
        player.cam[1] += disp[1] * (1 - Math.exp(-2 * delta));

        let centering = [40 + player.cam[0] + s[0] * ss, 22.5 + player.cam[1] + s[1] * ss];

        ctx.translate(-pt[0] + centering[0], -pt[1] + centering[1]);
        
        this.renderTrack();
        this.renderEnemies();
        this.renderBullets();
        this.renderTexts();
        
        this.renderPlayer();
        
        ctx.translate(-centering[0], -centering[1]);

        //render UI
        
        ctx.strokeStyle = rgba(255,255,255);
        ctx.fillStyle = rgba(0,0,0,.3);

        ctx.font = "1.5px 'Koulen', cursive";

        ctx.lineWidth = .15;
        ctx.beginPath();
        ctx.moveTo(71+2, 2.1);
        ctx.lineTo(72.3+2, 3.5);
        ctx.lineTo(81, 3.5);
        ctx.lineTo(81, 2.1);
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = .3;
        ctx.beginPath();
        ctx.moveTo(66+2+2, -1);
        ctx.lineTo(68+2+2, 2.1);
        ctx.lineTo(81, 2.1);
        ctx.lineTo(81, -1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = rgba(255,255,255);
        ctx.fillText("ammo: ", 68.5+2+2, 1.35);

        ctx.fillStyle = rgba(255,255,20);
        if (player.ammo == 0 && game.currentLevel > 0) {
            ctx.fillStyle = rgba(255,50,50,.3 * Math.sin(now * 3.2) + .4);
            ctx.fillText("Press R to restart", 68, 44);
            ctx.fillStyle = rgba(255,20,20);
        }
        ctx.fillText(player.ammo, 68.5 + 2 + 2 + 4, 1.35);

        ctx.fillStyle = rgba(255,255,255);
        ctx.font = ".9px 'Koulen', cursive";
        ctx.fillText("time: " + (Math.round(game.timer*10) / 10).toFixed(1), 73+2, 3);
        ctx.textAlign = "center";


        //render opener
        this.opener = approach(this.opener, 0, delta * 1);
        if (this.opener > 0) {
            this.twistTransition(this.opener);
        }
        if (this.closeType >= 0) {
            this.toClose = approach(this.toClose, 1, delta * 1);
            if (this.closeType == 1) {
                this.twistTransition(this.toClose);
                if (this.toClose == 1) {
                    game.nextLevel();
                }
            } else if (this.closeType == 0) {
                this.twistTransition(this.toClose);
                if (this.toClose == 1) {
                    this.init(1);
                }
            }
        }
    }
}

let split = 100; let epsilon = 1e-9;
class Bez {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.length = 0;
        this.lengths = [];
        let n = this.getPt(0);
        for (let i = 1; i <= split; i++) {
            let m = this.getPt(i/split);
            let l = Math.sqrt((n[0] - m[0])**2 + (n[1] - m[1])**2);
            this.lengths.push(l);
            this.length += l;
            n = m;
        }
        this.split = this.length / .2;
    }
    getPt(t) {
        let A = this.a[0] - this.b[0] + this.c[0] - this.b[0];
        let B = this.b[0] - this.a[0];
        let C = this.a[0];
        let ret = [A * t*t + 2 * B * t + C, 0];
        A = this.a[1] - this.b[1] + this.c[1] - this.b[1];
        B = this.b[1] - this.a[1];
        C = this.a[1];
        ret[1] = A * t*t + 2 * B * t + C;
        return ret;
    }
    getDir(t) {
        let A = this.a[0] - this.b[0] + this.c[0] - this.b[0];
        let B = this.b[0] - this.a[0];
        let ret = [2 * A * t + 2 * B, 0];
        A = this.a[1] - this.b[1] + this.c[1] - this.b[1];
        B = this.b[1] - this.a[1];
        ret[1] = 2 * A * t + 2 * B;
        return normalize(ret);
    }
    /*advance(t, amt) { //returns how much to advance index
        
    }*/
}

class Path {
    constructor(points) {
        //a list of points (length is odd) will be used to contruct splines
            //first point is start, every other point is a control point
        this.bezs = [];
        for (let i = 2; i < points.length; i+=2) {
            this.bezs.push(new Bez(points[i-2], points[i-1], points[i]));
        }
    }
    indexToPoint(index) {
        if (index >= this.bezs.length) {
            return this.bezs[this.bezs.length - 1].getPt(1);
        }
        //use index to figure out point
        return this.bezs[Math.floor(index)].getPt(index%1);
    }
    indexToDir(index) {
        if (index >= this.bezs.length) {
            return this.bezs[this.bezs.length - 1].getDir(1);
        }

        return this.bezs[Math.floor(index)].getDir(index%1);
    }
    isBetween(x, m, n) {
        //determine if index x is between indices m and n
        if (m > n) {
            let temp = n;
            n = m;
            m = temp; 
        }
        return m <= x && x <= n;
    }
    advance(index, amt) {
        //advance index by a distance amt

        if (amt > 0) {
            let i = Math.floor(index);
            let t = index%1;
            let s = Math.floor(t * split);
            let sr = t * split - s; //section remainder

            if (i >= this.bezs.length) return this.bezs.length; //too lazy to handle the edge case...
            
            if (this.bezs[i].lengths[s] * (1-sr) > amt) {
                return Math.min(index + (amt / this.bezs[i].lengths[s]) / split, this.bezs.length);
            } else {
                amt -= this.bezs[i].lengths[s] * (1-sr);
                if (s == split - 1) {
                    i++;
                    s = 0;
                } else {
                    s++;
                }
            }
            if (i >= this.bezs.length) return this.bezs.length; //too lazy to handle the edge case...
            while (amt - this.bezs[i].lengths[s] >= 0) {
                amt -= this.bezs[i].lengths[s];
                if (s == split - 1) i++;
                s = (s + 1)%split;
                if (i >= this.bezs.length) return this.bezs.length; //too lazy to handle the edge case...
            }
            return Math.min(i + (s + (amt/this.bezs[i].lengths[s])) / split, this.bezs.length);
        } else if (amt < 0) {
            amt *= -1;
            if (index >= this.bezs.length) index -= epsilon;
            let i = Math.floor(index);
            let t = index%1;
            let s = Math.floor(t * split);
            let sr = t * split - s; //section remainder

            if (this.bezs[i].lengths[s] * sr > amt) {
                return index - (amt / this.bezs[i].lengths[s]) / split;
            } else {
                amt -= this.bezs[i].lengths[s] * sr;
                if (s == 0) {
                    s = split - 1;
                    i--;
                } else {
                    s--;
                }
            }
            if (i < 0) return 0;
            while (amt - this.bezs[i].lengths[s] > 0) {
                amt -= this.bezs[i].lengths[s];
                if (s == 0) {
                    s = split - 1;
                    i--;
                } else {
                    s--;
                }
                if (i < 0) return 0;
            }
            return i + (s + 1 - (amt/this.bezs[i].lengths[s])) / split;
        } else {
            return index;
        }
    }
}

class Bullet {
    constructor(pos, vel) {
        this.pos = pos;
        this.vel = vel;
        this.dead = false;
        this.toDeath = 0;
    }
    step() {
        this.pos = [this.pos[0] + this.vel[0] * delta, this.pos[1] + this.vel[1] * delta];
    }
}

class Camera {
    constructor(pos) {
        this.dead = false;
        this.toDeath = 0;
        this.pos = pos;
        this.angle = 0;
    }
}

class Laser {
    constructor(pos, radius) {
        this.dead = false;
        this.toDeath = 0;
        this.pos = pos;
        this.radius = radius;
    }
}

class TextP {
    constructor(text, size, pos, radius) {
        this.text = text;
        this.size = size;
        this.pos = pos;
        this.radius = radius;
        this.opacity = 0;
    }
}

//leaderboard entry
class Entry {
    constructor(name, time) {
        this.name = name;
        this.time = time;
    }
}

function normalize(a) {
    let l = a[0]**2 + a[1]**2;
    if (l == 0) {
        return [0,0];
    } else {
        l = Math.sqrt(l);
        return [a[0]/l, a[1]/l];
    }
}
function dot(a,b) {
    let ret = 0;
    for (let i = 0; i < a.length; i++) {
        ret += a[i] * b[i];
    }
    return ret;
}
function rgba(r, g, b, a = 1) {
    return "rgba(" + [r,g,b,a].join(',') + ')';
}
function approach(a, b, x) {
    x = Math.abs(x);
    if (a < b) {
        return Math.min(a + x, b);
    } else {
        return Math.max(a - x, b);
    }
}
function pulse(x) {
    return Math.max(Math.exp(-Math.pow(x*x*4 -2,2))-.02,0);
}
function dist2(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

let player = {
    pos : 0,
    speed : 0,
    cam : [0,0],
    camV : [0,0],
    damping : 3,
    pastPos : [0,0],
    aimAngle : 0,
    reloadState : 1,
    screenShake : 0,
    ammo : 0,
    dead : false,
    toDeath : 0,
}
let game = {
    timer : 0,
    levels : [
        /*new Level({
            ammo: 10,
            points: [
                [0,0],
                [1,1],
                [2,2],
                [10,10],
                [50,10],
                [60, 12],
                [14, 50],
            ],
            cameras: [
                new Camera([0,15]),
            ],
            lasers: [
                new Laser(1.4, 5),
            ],
            texts: [
                new TextP("test", 1, [0,5], 10),
            ]
        }),*/

        /*
        new Level({
            ammo: ,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        */

        new Level({
            ammo: 3,
            points: [
                [0,0],
                [10,0],
                [20,0]
            ],
            cameras: [

            ],
            lasers: [

            ],
            texts: [
                new TextP("Click to shoot", 1.5, [10, -4], 30),
                new TextP("Use the recoil to move", 1.5, [10,5], 30)
            ]
        }),
        new Level({
            ammo: 3,
            points: [
                [0,0],
                [15,10],
                [30,0],
                [45,-10],
                [60,0],
            ],
            cameras: [
                new Camera([15,-10]),
            ],
            lasers: [

            ],
            texts: [
                new TextP("Destroy all security cams", 1.5, [15, -4], 20),
            ]
        }),

        new Level({
            ammo: 5,
            points: [
                [0,0],
                [-20,10],
                [-20,25],
                [-20,40],
                [0,40],
                [20,40],
                [20,25],
            ],
            cameras: [
                
            ],
            lasers: [
                new Laser(.5, 10),
                new Laser(1.9, 8),
            ],
            texts: [
                new TextP("Deactivate the laser detectors", 1.5, [-15, -4], 20),
            ]
        }),
        new Level({
            ammo: 3,
            points: [
                [0,0],
                [-10,0],
                [-20,0]
            ],
            cameras: [
                new Camera([8,0]),
                new Camera([-25,0]),
            ],
            lasers: [

            ],
            texts: [

            ]
        }),
        new Level({
            ammo: 10,
            points: [
                [0,0],
                [0,-10],
                [10,-10],
                [25,-10],
                [25,-20],
                [25,-30],
                [0,-30],
                [-15,-30],
                [-15,-15],
                [-15,-10],
                [-20,-5],
                [-30,5],
                [-35,0],
                [-45,-10],
                [-40,-25],
                [-35,-40],
                [-20,-45],
                [-5,-50],
                [0,-55],
                [5,-60],
                [25,-60],
                [40,-60],
                [45,-50],
            ],
            cameras: [
                new Camera([35, -20])
            ],
            lasers: [
                new Laser(1.,-7),
                new Laser(3, -7),
                new Laser(7, 9),
                new Laser(10,-7)
            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 4,
            points: [
                [0,0],
                [-10,0],
                [-10,-5],
                [-10,-10],
                [-5,-20],
                [0,-30],
                [15,-25],
                [30,-20],
                [25,5],
                [20,30],
                [0,25],
                [-20,20],
                [-25,10],
            ],
            cameras: [
                new Camera([-20,-20]),
                new Camera([10,-15]),
                new Camera([0, 35])
            ],
            lasers: [
            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 6,
            points: [
                [0,0],
                [0,-5],
                [0,-20],
                [0,-40],
                [0,-50],
                [0,-60],
                [-10,-60],
                [-20,-60],
                [-20,-50],
                [-20,-40],
                [-20,-20],
                [-20,0],
                [-20,10],
                [-20,20],
                [-20,30],
            ],
            cameras: [
                new Camera([20,-20])
            ],
            lasers: [
                new Laser(4,10),
                new Laser(4.6, 10),
                new Laser(5.2, 10)
            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 12,
            points: [
                [0,0],
                [5,5],
                [10,10],
                [15,15],
                [15, 30],
                [15,45],
                [20,50],
                [25,55],
                [35,55],
                [45,55],
                [50,50],
                [55,45],
                [55,15],
                [55,0],
                [70,0],
                [85,0],
                [95,10],
                [105,20],
                [95,30],
                [85,40],
                [85,45],
                [85,50],
                [90,55],
                [95,60],
                [110,65],
                [125,70],
                [130,80],
                [135,90],
                [120,100],
                [105,110],
                [95, 105],
                [85,100],
                [75,100],
                [65,100],
                [50,120]
            ],
            cameras: [
                new Camera([70,115]),
                new Camera([115,50]),
                new Camera([45,0])
            ],
            lasers: [
                new Laser(5, 12),
                new Laser(10, 10),
            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 7,
            points: [
                [0,0],
                [-5,5],
                [-15,15],
                [-20,20],
                [-15,35],
                [-10,50],
                [-15,55],
                [-20,60],
                [-30,55],
                [-50,45],
                [-55,30],
                [-60,15],
                [-60,0],
            ],
            cameras: [
                new Camera([-55, 10]),
                new Camera([-65, 25]),
                new Camera([-50, 25]),
                new Camera([-55, 50])
            ],
            lasers: [
                new Laser(2.1, 10),
            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 8,
            points: [
                [0,0],
                [-5,0],
                [-10,0],
                [-15,0],
                [-15,10],
                [-15,20],
                [-25,20],
                [-35,20],
                [-45,20],
                [-55,20],
                [-55,10],
                [-55,0],
                [-50,0],
                [-45,0],
                [-45,-10],
                [-45,-20],
                [-50,-25],
                [-55,-30],
                [-55,-40],
                [-55,-50],
                [-40,-50],
                [-25,-50],
                [-25,-40],
                [-25,-30],
                [-15,-30],
                [-5,-30],
                [-5,-40],
                [-5, -45],
                [-10,-45],
                [-15,-45],
                [-15,-50],
                [-15,-55],
                [0,-55],
                [15,-55],
                [15,-40],
                [15,-20],
                [5,-20],
                [-15,-20],
                [-15,-10],
            ],
            cameras: [
                new Camera([10,0]),
                new Camera([-30,5]),
                new Camera([-45, 10]),
                new Camera([-40, -40]),
                new Camera([-40, 5]),
            ],
            lasers: [
                new Laser(12.1, 7),
                new Laser(7.5, 10),
            ],
            texts: [
                
            ]
        }),
        /*new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),
        new Level({
            ammo: 0,
            points: [
                
            ],
            cameras: [
                
            ],
            lasers: [

            ],
            texts: [
                
            ]
        }),*/
        //new Level({

        //})
        //etc
    ],
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel == this.levels.length) {
            this.currentLevel = -2;
            //TODO - end timer
            game.addEntry(new Entry("You", Math.round(game.timer*100)/100));
        } else {
            this.levels[this.currentLevel].init();
        }
    },
    currentLevel: -1,
    opener: 1,
    end: false,
    toEnd: 0,
    leaderboard: [],
    menst : 0,
    newBest : false,
    timer: 0,
    addEntry(entry) {
        this.newBest = false;
        for (let i = 0; i < this.leaderboard.length; i++) {
            if (entry.time < this.leaderboard[i].time) {
                if (i == 0) {
                    this.newBest = true;
                }
                this.leaderboard.splice(i, 0, entry);
                i++;
                return;
            }
        }
        this.leaderboard.push(entry);
    }
}
//game.levels[game.currentLevel].init();

let now = performance.now()/1000;
let then = now;
let timescale = 1;
let delta = 0; let trueDelta = 0;
let tindex = 0;
document.fonts.ready.then(function (fontFaceSetEvent) {
    audio = {
        theme : dgei('theme'),
        explosion : dgei('explosion'),
        death : dgei('death'),
        shoot : dgei('shoot'),
        next : dgei('next'),
        nick : dgei('nick'),
        opener : dgei('opener'),
        
        play(type) {
            this[type].currentTime = 0;
            this[type].play();
        }
    }
    window.requestAnimationFrame(mainloop);
});
function mainloop() {
    window.requestAnimationFrame(mainloop);
    now = performance.now()/1000;
    delta = Math.min(now - then, .05) * timescale;
    trueDelta = Math.min(now - then, .05);
    tindex += trueDelta;
    then = now;

    let testmult = 2;
    delta /= testmult;

    for (let i = 0; i < testmult; i++) {
        ctx.clearRect(0,0,80,45);
        if (game.currentLevel >= 0) {
            game.timer+=delta;
            ctx.fillStyle = rgba(40, 40, 40);
            ctx.fillRect(0,0,80, 45);
            game.levels[game.currentLevel].render();
        } else if (game.currentLevel == -1) {
            ctx.fillStyle = rgba(40,40,40);
            ctx.fillRect(0,0,80, 45);
            game.menst += delta;
            game.opener = approach(game.opener, 0, delta);
            if (game.opener > 0) {
                ctx.fillStyle = rgba(0,0,0,game.opener);
                ctx.fillRect(0,0,80, 45);
            }
            let iv = 1 - Math.exp(-game.menst);
            

            if (game.menst > 1) {
                ctx.globalAlpha = Math.min(game.menst - 1, 1);
                ctx.strokeStyle = rgba(0,0,0);
                ctx.beginPath();
                ctx.moveTo(0, 27.9 - 15.3 * iv**.13);
                ctx.lineTo(80, 27.9 - 15.3 * iv**.13);

                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;
                ctx.strokeStyle = rgba(255,255,255);
                ctx.stroke();

                ctx.strokeStyle = rgba(150,150,150);
                ctx.lineWidth = 1.2;
                ctx.stroke();

                ctx.setLineDash([.5, .1]);
                ctx.lineDashOffset = -now;
                ctx.strokeStyle = rgba(0,0,0);
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.setLineDash([]);

                let p = Math.min(game.menst - 1, 1.2)/1.2;
                ctx.font = "3px 'Koulen', cursive";
                ctx.fillStyle = rgba(255,255,255, Math.sin(4 * game.menst) * .4 + .4);
                ctx.fillText("Press Space to play", 40, 29.5);
            }

            ctx.globalAlpha = iv;

            ctx.fillStyle = rgba(255,255,255);

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "4px 'Koulen', cursive";
            ctx.fillText("Robber on", 40, 22.5 - 15.3 * iv**.1);
            ctx.font = "8.2px 'Koulen', cursive";
            ctx.fillText("Rails", 40, 22.5 - 15.3 * iv**.13+6.7)
            if (Keys['Space'] && game.opener < .4 && !game.end) {
                game.end = true;
                dgei('opener').volume = .3;
                audio.play('next');
            }
            if (game.end) {
                game.toEnd = approach(game.toEnd, 1, .5*delta);
                ctx.fillStyle = rgba(0,0,0);
                ctx.fillRect(0,0,80, Math.pow(Math.min(game.toEnd, .7)/.7,5) * 45);
                if (game.toEnd == 1) {
                    game.currentLevel++;
                    game.opener = 1;
                    game.end = false;
                    game.toEnd = 0;
                    game.menst = 0;
                    game.levels[game.currentLevel].init();
                    game.timer = 0;

                    if (dgei('theme').paused) {
                        dgei('theme').volume = .35;
                        dgei('explosion').volume = .4;
                        dgei('shoot').volume = .6;
                        dgei('death').volume = .6;
                        dgei('next').volume = .5;
                        dgei('opener').volume = .6;

                        audio.play('theme');
                    }
                    //TODO - start timer
                }
            }
        } else if (game.currentLevel == -2) {
            ctx.fillStyle = rgba(20, 20, 60);
            ctx.fillRect(0,0,80, 45);
            game.opener = approach(game.opener, 0, 2*delta);
            if (game.opener > 0) {
                ctx.fillStyle = rgba(0,0,0,game.opener);
                ctx.fillRect(0,0,80, 45);
            }
            game.menst += delta;
            
            ctx.globalAlpha = 1-game.opener;
            ctx.fillStyle = rgba(255,255,255);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "2px 'Koulen', cursive";
            ctx.fillText("Thanks for playing!", 40, 4);
            if (game.menst > 1) {
                ctx.font = "3px 'Koulen', cursive";
                ctx.fillText("Your time: " + Math.round(game.timer*100) / 100 + " seconds", 40, 7);
            }
            if (game.menst > 2) {
                ctx.font = "2px 'Koulen', cursive";
                ctx.strokeStyle = rgba(255,255,255);
                ctx.lineWidth = .2;
                ctx.strokeRect(20, 13, 40, 25);
                ctx.fillText("Top 8 Leaderboard (offline):", 40, 11);
                ctx.font = "2.2px 'Koulen', cursive";
                ctx.textAlign = "left";
                for (let i = 0; i < game.leaderboard.length && i < 8; i++) {
                    let e = game.leaderboard[i];
                    ctx.fillText((i+1) + ". " + e.name + ": " + e.time + " seconds", 22, 15 + i*3);
                }
                ctx.textAlign = "center";
            }
            if (game.menst > 3) {
                let p = Math.min(game.menst - 3, 1.2)/1.2;
                ctx.font = "2px 'Koulen', cursive";
                ctx.fillStyle = rgba(255,255,255, Math.sin(4 * (game.menst-3)) * .4 + .4);
                ctx.fillText("Press Space to continue", 40, 40.5);
            }

            ctx.globalAlpha = 1;

            if (Keys['Space']) {
                game.end = true;
            }
            if (game.end) {
                game.toEnd = approach(game.toEnd, 1, 2*delta);
                ctx.fillStyle = rgba(0,0,0);
                ctx.fillRect(0,0,80, Math.pow(Math.min(game.toEnd, .7)/.7,5) * 45);
                
                if (game.toEnd == 1) {
                    game.opener = 1;
                    game.end = false;
                    game.toEnd = 0;
                    game.menst = 0;
                    game.currentLevel++;
                }
            }
        }
    }
}