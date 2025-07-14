import { useEffect, useRef } from 'react';
import { MeshNode } from '@/types/mesh';

interface RadarViewProps {
  nodes: MeshNode[];
}

export function RadarView({ nodes }: RadarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const radius = (maxRadius / 4) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radar sweep
      const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw nodes
      nodes.forEach((node) => {
        const angle = Math.random() * Math.PI * 2; // Random angle for demo
        const distance = (node.distance / 100) * maxRadius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        // Node color based on connection type
        let color = '#00FFFF'; // cyan
        if (node.connectionType === 'bluetooth') color = '#FF00FF'; // magenta
        if (node.connectionType === 'wifi') color = '#00FF88'; // green

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw center node (self)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(animate);
    };

    animate();
  }, [nodes]);

  return (
    <div className="relative w-full h-48 bg-[var(--cyber-dark)] rounded-lg border border-gray-800 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={300}
        height={192}
        className="w-full h-full"
      />
    </div>
  );
}
