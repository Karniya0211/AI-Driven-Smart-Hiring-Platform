import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 point = position;
    float firstWave = point.x * 3.8 + point.y * 1.25 + uTime * 0.22;
    float secondWave = point.y * 4.6 - point.x * 1.15 - uTime * 0.16;
    point.z += sin(firstWave) * 0.055 + sin(secondWave) * 0.035;

    float slopeX = cos(firstWave) * 3.8 * 0.055 - cos(secondWave) * 1.15 * 0.035;
    float slopeY = cos(firstWave) * 1.25 * 0.055 + cos(secondWave) * 4.6 * 0.035;
    vNormal = normalize(normalMatrix * vec3(-slopeX, -slopeY, 1.0));
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float boundary = 0.28 + vUv.y * 0.37
      + sin(vUv.y * 10.0 + uTime * 0.08) * 0.025
      + sin(vUv.y * 24.0 - uTime * 0.06) * 0.012;
    float distanceFromEdge = vUv.x - boundary;
    vec3 color = vec3(0.945, 0.960, 0.965);

    if (distanceFromEdge > 0.0) {
      float band = mod(floor(distanceFromEdge * 8.5), 5.0);
      if (band < 1.0) color = vec3(0.055, 0.205, 0.565);
      else if (band < 2.0) color = vec3(0.075, 0.285, 0.690);
      else if (band < 3.0) color = vec3(0.040, 0.175, 0.500);
      else if (band < 4.0) color = vec3(0.065, 0.235, 0.605);
      else color = vec3(0.035, 0.145, 0.445);

      float deepSpace = smoothstep(0.30, 0.70, distanceFromEdge);
      color = mix(color, vec3(0.025, 0.105, 0.340), deepSpace * 0.48);
    }

    vec3 lightDirection = normalize(vec3(-0.38, 0.62, 0.68));
    float diffuse = 0.88 + max(dot(normalize(vNormal), lightDirection), 0.0) * 0.12;
    float highlight = pow(max(dot(normalize(vNormal), lightDirection), 0.0), 10.0) * 0.08;
    color = color * diffuse + highlight;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function ContourBackground3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0xf1f4f5, 1);
    container.appendChild(renderer.domElement);

    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const geometry = new THREE.PlaneGeometry(2, 2, 180, 180);
    const surface = new THREE.Mesh(geometry, material);
    scene.add(surface);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      surface.scale.set((viewHeight * aspect) / 2, viewHeight / 2, 1);
      renderer.setSize(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    let animationFrameId;
    const animate = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none"
      style={{ background: '#f1f4f5' }}
    />
  );
}