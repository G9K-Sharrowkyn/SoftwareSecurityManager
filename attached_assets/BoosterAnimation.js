import React, { Component } from 'react';

class Particle {
  constructor(options) {
    const defaults = {
      x: 0,
      y: 0,
      radius: 10,
      direction: 0,
      velocity: 0,
      explode: false
    };

    Object.assign(this, defaults, options);
    this.velX = Math.cos(this.direction) * this.velocity;
    this.velY = Math.sin(this.direction) * this.velocity;
    this.friction = 0.9;
    this.decay = this.randomBetween(90, 91) * 0.01;
    this.gravity = this.radius * 0.01;
  }

  update() {
    this.x += this.velX;
    this.y += this.velY;
    this.velX *= this.friction;
    this.velY *= this.friction;
    this.velocity *= this.friction;
    this.radius *= this.decay;
    this.gravity += 0.05;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

class ParticleCanvas extends Component {
    constructor(props) {
      super(props);
      this.canvasRef = React.createRef();
      this.particles = [];
      this.rafId = null;
      this.frame = 0;
    }

  componentDidMount() {
    this.canvas = this.canvasRef.current;
    this.ctx = this.canvas.getContext('2d');
    this.setStage();
    this.createRandomParticles();
    this.loop();
    window.addEventListener('resize', this.setStage);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setStage);
    cancelAnimationFrame(this.rafId);
  }

  setStage = () => {
    this.clear();
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
  }

  clear = () => {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'hsla(0, 0%, 0%, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
  }

  createRandomParticles = () => {
    const margin = 100;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const x = this.randomBetween(margin, canvasWidth - margin);
    const y = this.randomBetween(margin, canvasHeight - margin);
    this.createParticles(x, y);
  }

  createParticles = (x, y) => {
    let numParticles = 50;
    while (numParticles--) {
      const direction = Math.random() * Math.PI * 2;
      const velocity = this.randomBetween(10, 20);
      const radius = 10 + (Math.random() * 20);
      const explode = true;
      const particle = new Particle({
        x,
        y,
        direction,
        velocity,
        radius,
        explode
      });
      this.particles.push(particle);
    }
  }

  loop = () => {
    this.clear();
    this.particles.forEach((particle, index) => {
      particle.update();
      particle.draw(this.ctx);
    });
    if (this.particles.length > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  triggerExplosion = (x, y) => {
    console.log('Explosion triggered at:', x, y);
    this.createParticles(x, y);
    if (!this.rafId) {
      this.loop();
    }
  }

  boom = (e) => {
    this.createParticles(e.clientX, e.clientY);
  }

  randomBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        style={{ width: '100%', height: '100%', display: this.props.visible ? 'block' : 'none' }}
        onMouseDown={this.boom}
      />
    );
  }
}

export default ParticleCanvas;
