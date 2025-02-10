'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './BackgroundAnimation.css';

const BackgroundAnimation: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Track mouse position
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - width / 2) / width;
            mouseY = (event.clientY - height / 2) / height;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Scene with darker background
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x030303); // Even darker background

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        currentMount?.appendChild(renderer.domElement);

        // Geometry and Material
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const originalPositions = [];

        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(20);
            const y = THREE.MathUtils.randFloatSpread(20);
            const z = THREE.MathUtils.randFloatSpread(20);
            
            vertices.push(x, y, z);
            originalPositions.push(x, y, z);

            // Even more subtle colors
            const baseColor = 0.05 + Math.random() * 0.08; // Much darker base
            colors.push(
                baseColor + Math.random() * 0.03, // Tiny red tint
                baseColor + Math.random() * 0.02, // Tiny green tint
                baseColor + Math.random() * 0.04  // Tiny blue tint
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            vertexColors: true,
            size: 0.06, // Smaller size
            transparent: true,
            opacity: 0.3, // Lower opacity
            blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // Shader for subtle glow
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
            },
            vertexShader: `
                uniform float time;
                attribute vec3 customColor;
                varying vec3 vColor;
                void main() {
                    vColor = customColor;
                    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition;
                    gl_PointSize = 1.5 + sin(time + position.x * 5.0) * 1.0;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
                    gl_FragColor = vec4(vColor, alpha * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const shaderPoints = new THREE.Points(geometry, shaderMaterial);
        scene.add(shaderPoints);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Smooth mouse movement
            targetX += (mouseX - targetX) * 0.02; // Slower response
            targetY += (mouseY - targetY) * 0.02;

            const positions = geometry.attributes.position.array as Float32Array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const originalX = originalPositions[i];
                const originalY = originalPositions[i + 1];
                const originalZ = originalPositions[i + 2];

                const angle = Math.atan2(originalY, originalX) + targetX * 0.3;
                const radius = Math.sqrt(originalX * originalX + originalY * originalY);
                
                positions[i] = Math.cos(angle) * radius + targetX * 1.5;
                positions[i + 1] = Math.sin(angle) * radius + targetY * 1.5;
                positions[i + 2] = originalZ + (targetX + targetY) * 1.5;
            }

            geometry.attributes.position.needsUpdate = true;
            shaderMaterial.uniforms.time.value += 0.01;
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup on unmount
        return () => {
            currentMount?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} className="background-animation" />;
};

export default BackgroundAnimation;
