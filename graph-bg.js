// ========== ANIMATED CONNECTED GRAPH BACKGROUND ==========
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

// Set canvas size
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

// Mouse position
const bgMouse = {
    x: null,
    y: null,
    radius: 150
};

// Track mouse movement
window.addEventListener('mousemove', (e) => {
    bgMouse.x = e.clientX;
    bgMouse.y = e.clientY;
});

window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initNodes();
});

// Simple Node class
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = 3;

        // Ambient movement
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.02;
        this.ambientRadius = 15;
        this.orbitPhase = Math.random() * Math.PI * 2;

        // Visual
        this.opacity = 0.6 + Math.random() * 0.4;
    }

    update() {
        // Gentle ambient movement
        this.angle += this.angularVelocity;
        this.orbitPhase += 0.015;
        const ambientX = Math.cos(this.angle) * this.ambientRadius;
        const ambientY = Math.sin(this.angle) * this.ambientRadius + Math.cos(this.orbitPhase) * 8;

        // Mouse interaction - repulsion
        const dx = bgMouse.x - this.x;
        const dy = bgMouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bgMouse.radius) {
            const force = (bgMouse.radius - distance) / bgMouse.radius;
            const angle = Math.atan2(dy, dx);

            // Repel from mouse
            this.x -= Math.cos(angle) * force * 8;
            this.y -= Math.sin(angle) * force * 8;
        } else {
            // Return to base position with ambient movement
            this.x += (this.baseX + ambientX - this.x) * 0.05;
            this.y += (this.baseY + ambientY - this.y) * 0.05;
        }
    }

    draw() {
        bgCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

// Create nodes
let nodes = [];

function initNodes() {
    nodes = [];
    const spacing = 100;
    const cols = Math.ceil(bgCanvas.width / spacing);
    const rows = Math.ceil(bgCanvas.height / spacing);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * spacing + (Math.random() - 0.5) * 40;
            const y = (j + 0.5) * spacing + (Math.random() - 0.5) * 40;
            nodes.push(new Node(x, y));
        }
    }
}

// Draw connections between nearby nodes
function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const opacity = (1 - (distance / 150)) * 0.3;
                bgCtx.strokeStyle = `rgba(200, 200, 220, ${opacity})`;
                bgCtx.lineWidth = 1;
                bgCtx.beginPath();
                bgCtx.moveTo(nodes[i].x, nodes[i].y);
                bgCtx.lineTo(nodes[j].x, nodes[j].y);
                bgCtx.stroke();
            }
        }
    }
}

// Animation loop
function animateBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Draw connections first
    drawConnections();

    // Update and draw nodes
    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    requestAnimationFrame(animateBackground);
}

// Start
initNodes();
animateBackground();
