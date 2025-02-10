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

            // Much darker colors
            const baseColor = 0.52 + Math.random() * 0.04;
            colors.push(
                baseColor + Math.random() * 0.15,
                baseColor + Math.random() * 0.1,
                baseColor + Math.random() * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            vertexColors: true,
            size: 0.03, // Even smaller size
            transparent: true,
            opacity: 0.2, // Lower opacity
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneFactor,
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
                    float alpha = 1.0 - smoothstep(0.3, 0.4, dist);
                    gl_FragColor = vec4(vColor, alpha * 0.2);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const shaderPoints = new THREE.Points(geometry, shaderMaterial);
        scene.add(shaderPoints);

        // Add these variables after scene setup
        let time = 0;
        const rotationSpeed = 0.0001; // Slower base rotation
        const attractorScale = 0.8;
        
        // Add camera movement variables
        let cameraAngle = 100;
        let cameraRadius = 9;
        let cameraHeight = 0;
        
        // Animation loop modification
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Create organic breathing rhythm
            const breathingCycle = Math.sin(time * 0.2) * Math.sin(time * 0.07);
            const pulseFactor = Math.pow(Math.sin(time * 0.15), 3);
            time += 0.001 * (1 + breathingCycle * 0.5);
            
            // Much slower camera movement
            cameraAngle += 0.00002 * (1 + breathingCycle * 0.02); // Reduced speed
            cameraHeight = Math.sin(time * 0.05) * 1.5; // Slower vertical movement
            
            camera.position.x = Math.cos(cameraAngle) * cameraRadius;
            camera.position.y = cameraHeight;
            camera.position.z = Math.sin(cameraAngle) * cameraRadius *  Math.cos(time)*2;
            
            // Slower look-at movement
            camera.lookAt(
                Math.sin(time * 0.1) * 0.3,
                Math.cos(time * 0.15) * 0.3,
                0
            );

            // Smooth mouse movement with breathing influence
            targetX += (mouseX - targetX) * (0.01 + Math.abs(breathingCycle) * 0.01);
            targetY += (mouseY - targetY) * (0.01 + Math.abs(breathingCycle) * 0.01);

            const positions = geometry.attributes.position.array as Float32Array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const originalX = originalPositions[i];
                const originalY = originalPositions[i + 1];
                const originalZ = originalPositions[i + 2];

                const radius = Math.sqrt(originalX * originalX + originalY * originalY);
                const baseAngle = Math.atan2(originalY, originalX);
                
                // Organic rotation with pauses
                const rotationAngle = baseAngle + 
                    time * (0.5 + pulseFactor * 0.5) * rotationSpeed + 
                    Math.sin(time * 0.3 + radius) * 0.1;

                // Breathing motion
                const breathingAmplitude = 0.3 + Math.abs(breathingCycle) * 0.2;
                const heightOffset = Math.sin(time * 0.4 + radius) * breathingAmplitude;
                const spiralRadius = radius + breathingCycle * 0.3;

                positions[i] = (Math.cos(rotationAngle) * spiralRadius + targetX) * attractorScale;
                positions[i + 1] = (Math.sin(rotationAngle) * spiralRadius + targetY) * attractorScale;
                positions[i + 2] = (originalZ + heightOffset) * attractorScale * (1 + pulseFactor * 0.2);
            }

            geometry.attributes.position.needsUpdate = true;
            shaderMaterial.uniforms.time.value += 0.005 * (1 + breathingCycle * 0.3);
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
