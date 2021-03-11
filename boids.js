

function degToRad(deg) {
    return deg * Math.PI/ 180;
}
function radToDeg(rad) {
    return rad * 180 / Math.PI;

}

function point2PointDegree(p1, dir1, p2) {

    let dir2 = new Vec(p2.x - p1.x, p2.y - p1.y);

    let dot = dir1.dot(dir2);

    let angle = radToDeg(Math.acos(dot / (dir1.length() * dir2.length())));
    return angle;

}
class Position {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    /// Distance between two points
    distanceTo(other) {
        let a = this.x - other.x;
        let b = this.y - other.y;

        return Math.sqrt( a*a + b*b );
    }
}

class Vec {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    subVec(other) {
        return new Vec(this.x - other.x, this.y - other.y);

    }

    multiply(val) {
        return new Vec(this.x * val, this.y * val);
    }

    normalized() {
        let l = this.length();
        return new Vec(this.x / l, this.y / l);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    rotation() {
        return Math.atan2(this.y, this.x);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Boid {
    constructor(pos, acc, speed){
        this.pos = pos;
        // Acceleration
        this.acc = acc;
        this.force = new Vec(0,0);
        this.color = "#3F00FF";
        this.viewFrustum = 120;
        this.viewSize = 150;
        this.speed = speed;
      }

    static width = 20;
    static height = 40;

    static separation = 0.00005;
    static alignment = 0.1;
    static cohesion = 0.5;


    /// Called before update to pass information about the world
    setWorldView(otherBoids, mousePos) {
        this.otherBoids = otherBoids;
        this.mousePos = mousePos;

    }
    update(deltaTime) {

        this.force = new Vec(0,0);

        this.steerAwayFromOtherBoids();
        this.steerAwayFromCursor();
        this.alignWithOtherBoids();
        this.moveToCenter();

        this.acc.x += this.force.x;
        this.acc.y += this.force.y;

        this.acc = this.acc.normalized().multiply(this.speed);

        this.pos.x += this.acc.x;
        this.pos.y += this.acc.y;

    }


    steerAwayFromOtherBoids() {
        let closeBoids = this.getCloseBoids();

        for(let i = 0; i < closeBoids.length; i++) {

            let boid = closeBoids[i];
            let dir = new Vec(boid.pos.x - this.pos.x, boid.pos.y - this.pos.y);

            

            let n = this.acc.normalized();
            let r = dir.subVec(n.multiply(2 * (dir.dot(n))));

            // The closer the bigger the force viewSize is the longest length

            let strength = (this.viewSize - dir.length()) * Boid.separation; 

            this.force.x -= r.x * strength;
            this.force.y -= r.y * strength;

        }

    }

    steerAwayFromCursor() {
        if(this.mousePos.getPos().distanceTo(this.pos) <= this.viewSize + this.mousePos.size
                 && point2PointDegree(this.pos, this.acc, this.mousePos.getPos()) < this.viewFrustum) {

            let dir = new Vec(this.mousePos.x - this.pos.x, this.mousePos.y - this.pos.y);
            let n = this.acc.normalized();
            let r = dir.subVec(n.multiply(2 * (dir.dot(n))));

            // The closer the bigger the force viewSize is the longest length

            let strength = (this.viewSize + this.mousePos.size - dir.length()) * Boid.separation; 

            this.force.x -= r.x * strength;
            this.force.y -= r.y * strength;
        } 
    }

    alignWithOtherBoids() {
        let closeBoids = this.getCloseBoids();

        let avgXAcc = 0;
        let avgYAcc = 0;

        if(closeBoids.length == 0) {
            return;
        }
        for(let i = 0; i < closeBoids.length; i++) {
            let boid = closeBoids[i]; 

            avgXAcc += boid.acc.x;
            avgYAcc += boid.acc.y;
        }

        avgXAcc /= closeBoids.length;
        avgYAcc /= closeBoids.length;

        let xDiff = this.acc.x - avgXAcc;
        let yDiff = this.acc.y - avgYAcc;

        let strength = Boid.alignment;
        this.force.x -= xDiff * strength;
        this.force.y -= yDiff * strength;
    }

    moveToCenter() {
        let closeBoids = this.getCloseBoids();

        if(closeBoids.length == 0) {
            return;
        }

        let avgX = 0;
        let avgY = 0;
        for(let i = 0; i < closeBoids.length; i++) {
            let boid = closeBoids[i];
            avgX += boid.pos.x;
            avgY += boid.pos.y;
        }

        let xCenter = (1/ closeBoids.length) * avgX;
        let yCenter = (1/ closeBoids.length) * avgY;

        let strength = Boid.cohesion;

        let dir = new Vec(this.pos.x - xCenter, this.pos.y - yCenter).normalized();

        this.force.x -= dir.x * strength;
        this.force.y -= dir.y * strength;
    }

    getCloseBoids() {
        return this.otherBoids.filter(
            boid => boid.pos.distanceTo(this.pos) <= this.viewSize
         && point2PointDegree(this.pos, this.acc, boid.pos) < this.viewFrustum
         );
    }


    /// If the boid is moving out of the screen, teleport it to the other side
    wrapPosition(xMax, yMax) {
        if(this.pos.x > xMax) {
            this.pos.x -= xMax;
        } else if(this.pos.x < 0) {
            this.pos.x += xMax;
        }

        if(this.pos.y > yMax) {
            this.pos.y -= yMax;
        } else if(this.pos.y < 0) {
            this.pos.y += yMax;
        }
    }

    render(ctx) {
        if(this.debugRender) {
            this.debugDrawGlobal();
        }

        // Transform to local space
        ctx.save();
        this.transformToLocalSpace(ctx);
        

        if(this.debugRender) {
            this.debugDrawLocal();
            
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Boid.width / 2, Boid.height);
        ctx.lineTo(Boid.width, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    
    transformToLocalSpace(ctx) {
        ctx.translate(this.pos.x, this.pos.y);

        // Rotation should be done through the center
        ctx.translate(Boid.width / 2, Boid.height / 2);
        ctx.rotate(this.acc.rotation() - degToRad(90));
        ctx.translate(-Boid.width / 2, -Boid.height / 2);
    }

    /// Draws debug informatino in global space
    debugDrawGlobal() {
        // Draw arrows to other boids that are near
        let nearBoids = this.getCloseBoids();


        for(let i = 0; i < nearBoids.length; i++) {
            let otherBoid = nearBoids[i];

            ctx.beginPath();


            // To the tip
            ctx.save();
            this.transformToLocalSpace(ctx);
            ctx.moveTo(Boid.width /2, Boid.height);
            ctx.restore();

            // To the center of the other boid
            ctx.lineTo(otherBoid.pos.x + Boid.width / 2, otherBoid.pos.y + Boid.height / 2);
            ctx.stroke();
        }

    }

    /// Draws debug informatino in local space
    debugDrawLocal() {
        // Draw bounding box
        ctx.beginPath();
        ctx.rect(0, 0, Boid.width, Boid.height);
        ctx.stroke();

        // Draw acc
        ctx.beginPath();
        ctx.moveTo(10, 40);
        ctx.lineTo(10, 40 + (10 * this.acc.length()));
        ctx.stroke();

        // Draw frustum
        ctx.beginPath();
        ctx.moveTo(Boid.width / 2, Boid.height / 2);
        ctx.arc(Boid.width / 2, Boid.height / 2,this.viewSize, degToRad(90 + -this.viewFrustum), degToRad(90 + this.viewFrustum));
        ctx.closePath();
        ctx.stroke();

    }
}