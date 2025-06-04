import React, { Component, createRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  direction: number;
  velocity: number;
  velX: number;
  velY: number;
  friction: number;
  decay: number;
  gravity: number;
  explode: boolean;
}

class ParticleClass implements Particle {
  x: number;
  y: number;
  radius: number;
  direction: number;
  velocity: number;
  velX: number;
  velY: number;
  friction: number;
  decay: number;
  gravity: number;
  explode: boolean;

  constructor(options: Partial<Particle> = {}) {
    const defaults: Particle = {
      x: 0,
      y: 0,
      radius: 10,
      direction: 0,
      velocity: 0,
      velX: 0,
      velY: 0,
      friction: 0.9,
      decay: 0.9,
      gravity: 0.1,
      explode: false
    };

    Object.assign(this, defaults, options);
    this.velX = Math.cos(this.direction) * this.velocity;
    this.velY = Math.sin(this.direction) * this.velocity;
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

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 215, 0, 1)';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

interface ParticleCanvasProps {
  visible?: boolean;
  onAnimationComplete?: () => void;
}

interface ParticleCanvasState {}

class ParticleCanvas extends Component<ParticleCanvasProps, ParticleCanvasState> {
  private canvasRef = createRef<HTMLCanvasElement>();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ParticleClass[] = [];
  private rafId: number | null = null;
  private frame = 0;

  componentDidMount() {
    this.canvas = this.canvasRef.current;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setStage();
      window.addEventListener('resize', this.setStage);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setStage);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  setStage = () => {
    if (!this.canvas || !this.ctx) return;
    
    this.clear();
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
  }

  clear = () => {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'hsla(0, 0%, 0%, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = 'lighter';
  }

  createParticles = (x: number, y: number) => {
    let numParticles = 50;
    while (numParticles--) {
      const direction = Math.random() * Math.PI * 2;
      const velocity = this.randomBetween(10, 20);
      const radius = 10 + (Math.random() * 20);
      const particle = new ParticleClass({
        x,
        y,
        direction,
        velocity,
        radius,
        explode: true
      });
      this.particles.push(particle);
    }
  }

  loop = () => {
    this.clear();
    this.particles = this.particles.filter(particle => {
      particle.update();
      particle.draw(this.ctx!);
      return particle.radius > 0.5;
    });

    if (this.particles.length > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    } else if (this.props.onAnimationComplete) {
      this.props.onAnimationComplete();
    }
  }

  triggerExplosion = (x: number, y: number) => {
    console.log('Explosion triggered at:', x, y);
    this.createParticles(x, y);
    if (!this.rafId) {
      this.loop();
    }
  }

  boom = (e: React.MouseEvent) => {
    this.createParticles(e.clientX, e.clientY);
  }

  randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: this.props.visible ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          pointerEvents: 'none'
        }}
        onMouseDown={this.boom}
      />
    );
  }
}

export default ParticleCanvas;
