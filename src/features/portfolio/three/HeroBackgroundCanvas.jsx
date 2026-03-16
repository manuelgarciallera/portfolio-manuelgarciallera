import { useEffect, useRef } from "react";
import * as THREE from "three";

import { HERO_FRAGMENT_SHADER, HERO_VERTEX_SHADER } from "./heroShaders";

export function HeroBackgroundCanvas({ wrapRef, heroSectionRef, prefRM }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let heroVisible = true;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 4.5;

    const sphereGeometry = new THREE.SphereGeometry(1.4, 96, 96);
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: HERO_VERTEX_SHADER,
      fragmentShader: HERO_FRAGMENT_SHADER,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    const rings = [];
    [[2.2, 0.005, 0.12, Math.PI / 2.8], [2.65, 0.004, 0.07, Math.PI / 4]].forEach(([r, t, o, rx]) => {
      const ringGeometry = new THREE.TorusGeometry(r, t, 8, 140);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x5ec4c8,
        transparent: true,
        opacity: o,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = rx;
      scene.add(ring);
      rings.push(ring);
    });

    const trail = [];
    for (let i = 0; i < 5; i += 1) {
      const trailGeometry = new THREE.SphereGeometry(1.4, 32, 32);
      const trailMaterial = new THREE.ShaderMaterial({
        vertexShader: HERO_VERTEX_SHADER,
        fragmentShader: HERO_FRAGMENT_SHADER,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
      });
      const mesh = new THREE.Mesh(trailGeometry, trailMaterial);
      mesh.visible = false;
      scene.add(mesh);
      trail.push({ mesh, material: trailMaterial, index: i });
    }

    const particleCount = 260;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.2 + Math.random() * 2.6;
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8adde0,
      size: 0.032,
      transparent: true,
      opacity: 0.32,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);

    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 1.6;
      mouse.ty = -((event.clientY - rect.top) / rect.height - 0.5) * 1.2;
    };
    canvas.addEventListener("mousemove", onMouseMove, { passive: true });

    const resize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const heroObserver = new IntersectionObserver(
      (entries) => {
        heroVisible = entries[0]?.isIntersecting ?? true;
      },
      { root: wrapRef.current, threshold: 0.05, rootMargin: "240px 0px 240px 0px" }
    );
    if (heroSectionRef.current) heroObserver.observe(heroSectionRef.current);

    let time = 0;
    let frame = 0;
    const history = [];
    for (let i = 0; i < 6; i += 1) {
      history.push({ x: 0, y: 0, ry: 0, rx: 0, scale: 1 });
    }

    let rafId;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      time += 0.009;
      frame += 1;

      if (!heroVisible) return;

      if (!prefRM.current) {
        mouse.x += (mouse.tx - mouse.x) * 0.042;
        mouse.y += (mouse.ty - mouse.y) * 0.042;
        sphereMaterial.uniforms.uTime.value = time;

        sphere.rotation.y += 0.0032;
        sphere.rotation.x += 0.0007;
        sphere.position.x += (mouse.x * 0.34 - sphere.position.x) * 0.038;
        sphere.position.y += (mouse.y * 0.24 - sphere.position.y) * 0.038;
        rings[0].rotation.z += 0.0014;
        rings[1].rotation.z -= 0.001;
        points.rotation.y += 0.0004;

        sphere.scale.setScalar(Math.sin(time * 0.7) * 0.04 + 1);

        if (frame % 2 === 0) {
          history.unshift({
            x: sphere.position.x,
            y: sphere.position.y,
            ry: sphere.rotation.y,
            rx: sphere.rotation.x,
            scale: sphere.scale.x,
          });
          history.pop();
        }

        trail.forEach((entry, index) => {
          const h = history[Math.min(index + 1, history.length - 1)];
          entry.mesh.position.x = h.x;
          entry.mesh.position.y = h.y;
          entry.mesh.rotation.y = h.ry;
          entry.mesh.rotation.x = h.rx;
          entry.mesh.scale.setScalar(h.scale);
          entry.material.uniforms.uTime.value = time - (entry.index * 0.08);
          entry.material.opacity = (5 - index) * 0.026;
          entry.mesh.visible = true;
        });
      }

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
      });
      trail.forEach((entry) => {
        entry.mesh.geometry.dispose();
        entry.material.dispose();
      });
      renderer.dispose();
      resizeObserver.disconnect();
      heroObserver.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [heroSectionRef, prefRM, wrapRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
