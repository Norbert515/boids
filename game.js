var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let boids = []; 
for(let i = 0; i < 50; i++) {
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    let boid = new Boid(new Position(x, y), getRanDirVec(), 4);
    if(i == 0) {
        boid.debugRender = true;
        boid.color = "#ff0000";
    }
    boids.push(boid);

}


function getRanDirVec () {
    return new Vec(getRanDir(), getRanDir());
}
function getRanDir() {
    return (Math.random() - 0.5) * 2;
}

class MousePos {

    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.size = 100;
    }

    getPos() {
        return new Position(this.x, this.y);
    }
}

let mousePos = new MousePos(0,0);

(function() {
    document.onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        mousePos = new MousePos(event.pageX, event.pageY);
    }
})();

function loop(timestamp) {
    var progress = timestamp - lastRender
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < boids.length; i++) {
        let boid = boids[i];
        boid.setWorldView(boids, mousePos);
        boid.update(progress);
        boid.wrapPosition(canvas.width, canvas.height);
        boid.render(ctx);
    }
  
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, mousePos.size, 0, Math.PI * 2);
    ctx.stroke();

    lastRender = timestamp;
    window.requestAnimationFrame(loop);
  }
  var lastRender = 0;
  window.requestAnimationFrame(loop);
