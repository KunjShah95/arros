import { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  cluster: number;
}

const CLUSTER_COLORS = ['#ff7b00', '#d4af37', '#00e5c9', '#ff4d4d', '#9b59b6'];
const CLUSTER_COUNT = 5;
const PARTICLES_PER_CLUSTER = 30;

export function ParticleHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const centerRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
      initParticles(canvas.width, canvas.height);
    };

    const initParticles = (w: number, h: number) => {
      particlesRef.current = [];
      for (let c = 0; c < CLUSTER_COUNT; c++) {
        const angle = (c / CLUSTER_COUNT) * Math.PI * 2;
        const orbitRadius = Math.min(w, h) * 0.15;
        for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
          const spread = Math.random() * 50;
          const cx = w / 2 + Math.cos(angle) * orbitRadius;
          const cy = h / 2 + Math.sin(angle) * orbitRadius;
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * spread,
            y: cy + (Math.random() - 0.5) * spread,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            color: CLUSTER_COLORS[c],
            cluster: c
          });
        }
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = centerRef.current.x;
      const cy = centerRef.current.y;

      // Draw core glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      gradient.addColorStop(0, 'rgba(255, 123, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 123, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 123, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw particles
      particlesRef.current.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Orbit force toward cluster center
        const clusterAngle = (p.cluster / CLUSTER_COUNT) * Math.PI * 2;
        const orbitRadius = Math.min(canvas.width, canvas.height) * 0.15;
        const targetX = cx + Math.cos(clusterAngle + dist * 0.001) * orbitRadius;
        const targetY = cy + Math.sin(clusterAngle + dist * 0.001) * orbitRadius;

        p.vx += (targetX - p.x) * 0.001;
        p.vy += (targetY - p.y) * 0.001;

        // Mouse repel
        const mdx = p.x - mousePos.x;
        const mdy = p.y - mousePos.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 120 && mDist > 0) {
          const force = (120 - mDist) / 120 * 2;
          p.vx += (mdx / mDist) * force;
          p.vy += (mdy / mDist) * force;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ background: '#030305' }}
    />
  );
}