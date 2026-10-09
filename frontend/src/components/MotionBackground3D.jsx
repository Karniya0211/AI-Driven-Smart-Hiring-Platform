import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MotionBackground3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x051326, 0.018);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 130);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050d18, 1);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xe2ecff, 1.3);
    scene.add(ambient);

    const cyanLight = new THREE.PointLight(0x52d6ff, 25, 320, 2);
    cyanLight.position.set(-40, 25, 60);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x7c3aed, 24, 340, 2);
    violetLight.position.set(36, -12, 52);
    scene.add(violetLight);

    const backGlow = new THREE.PointLight(0x1d4ed8, 18, 260, 2);
    backGlow.position.set(0, 10, 28);
    scene.add(backGlow);

    const group = new THREE.Group();
    group.position.set(0, 0, -10);
    scene.add(group);

    const waveGeometry = new THREE.PlaneGeometry(160, 72, 220, 35);
    const wavePosition = waveGeometry.attributes.position;
    for (let i = 0; i < wavePosition.count; i++) {
      const x = wavePosition.getX(i);
      const y = wavePosition.getY(i);
      const curve = Math.sin(x * 0.22) * 10 + Math.cos(y * 0.35) * 4;
      wavePosition.setZ(i, curve);
    }
    waveGeometry.computeVertexNormals();

    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf3f5f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
      roughness: 0.9,
      metalness: 0.08,
    });

    const blueMat = new THREE.MeshPhysicalMaterial({
      color: 0x072e8a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
      roughness: 0.75,
      metalness: 0.18,
    });

    const whiteWave = new THREE.Mesh(waveGeometry, whiteMat);
    whiteWave.position.set(-14, -8, -30);
    whiteWave.rotation.x = -0.34;
    whiteWave.rotation.z = 0.18;
    group.add(whiteWave);

    const blueWave = new THREE.Mesh(waveGeometry, blueMat);
    blueWave.position.set(12, 0, -18);
    blueWave.rotation.x = -0.32;
    blueWave.rotation.z = -0.22;
    blueWave.scale.set(1.15, 0.9, 1);
    group.add(blueWave);

    const darkBlueLayer = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 62, 60, 30),
      new THREE.MeshPhysicalMaterial({
        color: 0x061b54,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
      })
    );
    darkBlueLayer.position.set(18, -23, -42);
    darkBlueLayer.rotation.x = -0.32;
    darkBlueLayer.rotation.z = -0.48;
    group.add(darkBlueLayer);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(8.4, 28, 28),
      new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        wireframe: true,
        transparent: true,
        opacity: 0.48,
      })
    );
    core.position.set(22, 8, -16);
    group.add(core);

    const wireframe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(17, 2),
      new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      })
    );
    wireframe.position.set(22, 8, -18);
    group.add(wireframe);

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(27, 0.35, 18, 180),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.42 })
    );
    ring1.rotation.x = Math.PI / 2.6;
    ring1.rotation.y = Math.PI / 5;
    ring1.position.set(22, 8, -18);
    group.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(35, 0.28, 18, 200),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.35 })
    );
    ring2.rotation.x = Math.PI / 3.1;
    ring2.rotation.z = Math.PI / 5;
    ring2.position.set(22, 8, -18);
    group.add(ring2);

    const particleCount = 700;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color(0x67e8f9);
    const blue = new THREE.Color(0x60a5fa);
    const violet = new THREE.Color(0xc084fc);

    for (let i = 0; i < particleCount; i++) {
      const radius = 18 + Math.random() * 74;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) - 20;

      const color = Math.random() > 0.7 ? cyan : Math.random() > 0.35 ? blue : violet;
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.7,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMove = (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleTouch = (event) => {
      if (!event.touches || !event.touches[0]) return;
      targetX = (event.touches[0].clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouch);
    window.addEventListener('resize', handleResize);

    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      group.rotation.y = t * 0.2 + mouseX * 0.45;
      group.rotation.x = Math.sin(t * 0.5) * 0.14 - mouseY * 0.42;
      group.position.x = mouseX * 3;
      group.position.y = mouseY * 1.8;

      whiteWave.rotation.z = 0.18 + Math.sin(t * 0.8) * 0.12;
      blueWave.rotation.z = -0.22 - Math.cos(t * 0.9) * 0.14;
      core.rotation.y = -t * 0.5;
      core.rotation.x = t * 0.35;
      wireframe.rotation.x = t * 0.28;
      wireframe.rotation.y = t * 0.32;
      ring1.rotation.z = t * 0.25;
      ring2.rotation.y = -t * 0.2;
      particles.rotation.y = t * 0.05 + mouseX * 0.15;
      particles.rotation.x = -mouseY * 0.12;

      cyanLight.position.x = -40 + Math.sin(t * 1.1) * 24;
      violetLight.position.x = 38 + Math.cos(t * 0.9) * 18;
      backGlow.position.z = 28 + Math.sin(t * 1.3) * 9;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      waveGeometry.dispose();
      particlesGeometry.dispose();
      whiteMat.dispose();
      blueMat.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 h-full w-full overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 30% 25%, rgba(96,165,250,0.16), rgba(2,6,23,0) 35%), linear-gradient(120deg, #edf1f6 0%, #eef2f7 40%, #eef2f7 42%, #0b2f8d 54%, #050d18 100%)',
      }}
    />
  );
}
