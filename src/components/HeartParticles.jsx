import { useState, useEffect, useCallback } from 'react';

let nextId = 0;

export default function HeartParticles({ trigger }) {
  const [particles, setParticles] = useState([]);

  const spawn = useCallback(() => {
    const count = 5;
    const newParticles = Array.from({ length: count }, () => ({
      id: nextId++,
      x: 40 + Math.random() * 20, // % from left
      delay: Math.random() * 0.25,
      size: 14 + Math.random() * 10,
    }));

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
    }, 1100);
  }, []);

  useEffect(() => {
    if (trigger > 0) spawn();
  }, [trigger, spawn]);

  if (particles.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute animate-heart-pop select-none"
          style={{
            left: `${p.x}%`,
            bottom: '50%',
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
