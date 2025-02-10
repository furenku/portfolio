'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './BackgroundAnimation.css';

// Add these interfaces after imports
interface AnimationParams {
    rotationSpeed: number;
    particleCount: number;
    attractorStrength: number;
    breathingSpeed: number;
}

interface Particle {
    type: 'alpha' | 'beta' | 'delta' | 'gamma';
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    energy: number;
    mesh?: THREE.Mesh;
}

const getDevicePerformanceLevel = () => {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const gpu = (navigator as any).gpu; // WebGPU check
    
    if (isMobile) {
        return window.devicePixelRatio > 2 ? 'medium' : 'low';
    }
    return gpu ? 'high' : 'medium';
};

const performanceSettings = {
    low: {
        pointSize: 30,
        sampleSteps: 2,
        intensity: 0.2,
        alpha: 0.15
    },
    medium: {
        pointSize: 40,
        sampleSteps: 3,
        intensity: 0.25,
        alpha: 0.2
    },
    high: {
        pointSize: 50,
        sampleSteps: 4,
        intensity: 0.3,
        alpha: 0.25
    }
};

const perfLevel = getDevicePerformanceLevel();
const settings = performanceSettings[perfLevel];

const BackgroundAnimation: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLCanvasElement>(null);
    const particleGroupRef = useRef<THREE.Group>(null);
    const [params, setParams] = useState<AnimationParams>({
        rotationSpeed: 0.0001,
        particleCount: 20000,
        attractorStrength: 0.85,
        breathingSpeed: 0.9
    });
    const [stats, setStats] = useState({
        fps: 0,
        time: 0,
        cameraPos: { x: 0, y: 0, z: 0 },
        particleCenter: { x: 0, y: 0, z: 0 }
    });
    const [particles, setParticles] = useState<Particle[]>([]);
    const [particleGeometries] = useState({
        alpha: new THREE.SphereGeometry(0.1, 8, 8),
        beta: new THREE.BoxGeometry(0.1, 0.1, 0.1),
        delta: new THREE.ConeGeometry(0.1, 0.2, 8),
        gamma: new THREE.TorusGeometry(0.1, 0.03, 8, 16)
    });

    const [particleMaterials] = useState({
        alpha: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 }),
        beta: new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 }),
        delta: new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 }),
        gamma: new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 })
    });

    useEffect(() => {
        const currentMount = mountRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Track mouse position
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        // Add shift key tracking
        let isShiftPressed = false;
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Shift') isShiftPressed = true;
        };
        
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'Shift') isShiftPressed = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Add after scene setup
        let lastUserInteractionTime = Date.now();
        let isUserControlling = false;
        const AUTO_MOVEMENT_DELAY = 5000; // 5 seconds of inactivity before auto movement

        // Modify handleMouseMove
        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - width / 2) / width;
            mouseY = (event.clientY - height / 2) / height;
            
            if (!isTransitioning) {
                isUserControlling = true;
                lastUserInteractionTime = Date.now();
                
                if (isShiftPressed) {
                    camera.position.x += (mouseX - camera.position.x) * 0.05;
                    camera.position.y += (-mouseY - camera.position.y) * 0.05;
                } else {
                    camera.position.x += mouseX * 0.1;
                    camera.position.y += -mouseY * 0.1;
                }
            }
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

        for (let i = 0; i < params.particleCount; i++) {
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

        // const material = new THREE.PointsMaterial({
        //     vertexColors: true,
        //     size: 0.03, // Even smaller size
        //     transparent: true,
        //     opacity: 0.2, // Lower opacity
        //     blending: THREE.CustomBlending,
        //     blendEquation: THREE.AddEquation,
        //     blendSrc: THREE.SrcAlphaFactor,
        //     blendDst: THREE.OneFactor,
        // });
        const material = new THREE.PointsMaterial({
            vertexColors: true,
            size: 0.02,
            transparent: true,
            opacity: 0.25,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneFactor,
            // map: new THREE.TextureLoader().load(
            //     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMjNUMTY6Mzk6NDctMDU6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMjNUMTY6Mzk6NDctMDU6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTIzVDE2OjM5OjQ3LTA1OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjNhMWY4ZmE0LTNkZDAtNDI0ZC1hMzBhLTBlNjM4MzVkMzM0ZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY3ZDFmYWE1LTY0ZDAtYzU0OC1hNzA3LTBiYzFiZmI5ZjJhYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY0ZTI5ZjZhLTNkZDAtNDI0ZC1hMzBhLTBlNjM4MzVkMzM0ZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY0ZTI5ZjZhLTNkZDAtNDI0ZC1hMzBhLTBlNjM4MzVkMzM0ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0yM1QxNjozOTo0Ny0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjNhMWY4ZmE0LTNkZDAtNDI0ZC1hMzBhLTBlNjM4MzVkMzM0ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0yM1QxNjozOTo0Ny0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+YoqsBwAAAGNJREFUGJV9kDEOgCAQBPc0/oE/4Jf8AQUJhYWVlbHwzrDGRC4hF3aTKXYvAkBmXhHxrPQqM1cGwzCzHhFjpVdm1g0GwwXgBXB19k5ETJIGwA5gqfTKzHYDwCRpfv//QS/UGyFlITKqm3y0AAAAAElFTkSuQmCC'
            // ),
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

        // Add after scene setup
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                positions: { value: new Float32Array(params.particleCount * 3) },
                particleCount: { value: params.particleCount },
                pointSize: { value: settings.pointSize },
                intensity: { value: settings.intensity },
                alpha: { value: settings.alpha }
            },
            vertexShader: `
                uniform float time;
                uniform float pointSize;
                varying vec3 vPosition;
                varying float vDistance;
                
                void main() {
                    vPosition = position;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDistance = length(mvPosition.xyz);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Scale point size based on distance
                    gl_PointSize = pointSize * (1.0 / (1.0 + 0.1 * vDistance));
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                uniform float alpha;
                varying vec3 vPosition;
                varying float vDistance;
                
                // Optimized density calculation using distance field
                float getDensity(vec2 coord) {
                    float d = length(coord);
                    return exp(-d * d * 8.0); // Gaussian falloff
                }
                
                void main() {
                    vec2 coord = gl_PointCoord * 2.0 - 1.0;
                    float density = getDensity(coord);
                    
                    // Distance-based intensity falloff
                    float distanceFactor = 1.0 / (1.0 + 0.1 * vDistance);
                    float finalIntensity = intensity * distanceFactor;
                    
                    // Color gradient based on density and distance
                    vec3 color = mix(
                        vec3(0.5, 0.8, 1.0),
                        vec3(1.0, 0.4, 0.2),
                        density * finalIntensity
                    );
                    
                    // Optimized alpha calculation
                    float finalAlpha = density * alpha * distanceFactor;
                    
                    gl_FragColor = vec4(color, finalAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const glowPoints = new THREE.Points(geometry, glowMaterial);
        scene.add(glowPoints);

        // Add these variables after scene setup
        let time = 0;
        const rotationSpeed = params.rotationSpeed;
        const attractorScale = 0.8;
        
        // Add camera movement variables
        let cameraAngle = 100;
        const cameraRadius = 6;
        let cameraHeight = 0;
        
        // Modify these variables after scene setup
        const targetPosition = new THREE.Vector3();
        const currentLookAt = new THREE.Vector3();
        const targetLookAt = new THREE.Vector3();
        let isTransitioning = false;
        let transitionProgress = 0;
        
        const handleClick = (event: MouseEvent) => {
            const mouse = new THREE.Vector2(
                (event.clientX / width) * 2 - 1,
                -(event.clientY / height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.params.Points!.threshold = 0.1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObject(points);
            
            if (intersects.length > 0) {
                const offset = new THREE.Vector3(0, 0, 2); // Camera offset from target
                targetPosition.copy(intersects[0].point).add(offset);
                targetLookAt.copy(intersects[0].point);
                isTransitioning = true;
                transitionProgress = 0;
            }
        };

        window.addEventListener('click', handleClick);

        // After scene setup, add these constants
        const lorenzParams = {
            sigma: 10,
            rho: 28,
            beta: 8/3,
            dt: 0.001
        };

        const attractors = [
            new THREE.Vector3(2.5, -1.2, 0.8),
            new THREE.Vector3(-1.8, 1.5, -0.5),
            new THREE.Vector3(0.7, -2.1, 1.9),
            new THREE.Vector3(-2.4, 0.9, -1.7),
            new THREE.Vector3(1.6, -1.8, 2.3),
            new THREE.Vector3(-0.9, 2.2, -1.1),
            new THREE.Vector3(2.1, -0.6, 1.4),
            new THREE.Vector3(-1.5, 1.7, -2.0),
            new THREE.Vector3(0.4, -1.9, 0.6),
            new THREE.Vector3(1.9, 1.1, -1.3),
        ];

        // Add after attractors array definition
        const calculateAttractorCentroid = () => {
            const centroid = new THREE.Vector3();
            attractors.forEach(attractor => {
                centroid.add(attractor);
            });
            return centroid.divideScalar(attractors.length);
        };

        // Animation loop modification
        let frameCount = 0;
        const frameSkip = perfLevel === 'low' ? 2 : perfLevel === 'medium' ? 1 : 0;

        // Add these variables after scene setup
        let lastFrame = performance.now();
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            frameCount++;
            if (frameCount % (frameSkip + 1) !== 0) return;

            // Update lastFrame for FPS calculation
            const currentTime = performance.now();
            lastFrame = currentTime;
            
            // Enhanced breathing and pulsation
            const breathingCycle = Math.sin(time * params.breathingSpeed) * Math.sin(time * 0.07);
            const pulseFactor = Math.pow(Math.sin(time * 0.15), 3) * 0.5; // Stronger pulse
            const combinedEffect = breathingCycle + pulseFactor;
            
            // More dramatic time modification
            time += 0.001 * (1 + combinedEffect * 1.5); // Increased influence

            // Apply pulsation to particle size and opacity
            material.size = 0.02 * (1 + Math.abs(combinedEffect) * 0.3);
            material.opacity = 0.25 * (1 + Math.abs(combinedEffect) * 0.4);
            
            // Apply to shader points as well
            shaderMaterial.uniforms.time.value += 0.005 * (1 + combinedEffect * 0.8);
            
            // Much slower camera movement
            cameraAngle += 0.00002 * (1 + breathingCycle * 0.02); // Reduced speed
            cameraHeight = Math.sin(time * 0.05) * 1.5; // Slower vertical movement
            
            if (!isTransitioning && !isUserControlling) {
                const timeSinceLastInteraction = Date.now() - lastUserInteractionTime;
                
                if (timeSinceLastInteraction > AUTO_MOVEMENT_DELAY) {
                    // Even slower transition to automatic movement
                    const autoMovementBlend = Math.min((timeSinceLastInteraction - AUTO_MOVEMENT_DELAY) / 2000, 1); // Slower blend
                    
                    const autoX = Math.cos(cameraAngle) * cameraRadius;
                    const autoY = cameraHeight;
                    const autoZ = Math.sin(cameraAngle) * cameraRadius * Math.cos(time) * 2;
                    
                    // Much gentler lerping
                    camera.position.x += (autoX - camera.position.x) * 0.005 * autoMovementBlend;
                    camera.position.y += (autoY - camera.position.y) * 0.005 * autoMovementBlend;
                    camera.position.z += (autoZ - camera.position.z) * 0.005 * autoMovementBlend;
                    
                    // Smoother look-at transition
                    const targetLookAt = new THREE.Vector3(
                        Math.sin(time * 0.1) * 0.3,
                        Math.cos(time * 0.15) * 0.3,
                        0
                    );
                    
                    currentLookAt.lerp(targetLookAt, 0.005 * autoMovementBlend);
                    camera.lookAt(currentLookAt);
                }
            }

            // Reset user control flag each frame
            isUserControlling = false;

            // Smooth mouse movement with breathing influence
            targetX += (mouseX - targetX) * (0.01 + Math.abs(breathingCycle) * 0.01);
            targetY += (mouseY - targetY) * (0.01 + Math.abs(breathingCycle) * 0.01);

            const positions = geometry.attributes.position.array as Float32Array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Modified rotation effect with bounds checking
                const x = positions[i];
                const z = positions[i + 2];
                const radius = Math.sqrt(x * x + z * z);
                const angle = Math.atan2(x, z) + rotationSpeed;
                
                // Apply rotation with original radius to maintain distance
                positions[i] = THREE.MathUtils.clamp(radius * Math.sin(angle), -10, 10);
                positions[i + 2] = THREE.MathUtils.clamp(radius * Math.cos(angle), -10, 10);

                // Lorenz attractor influence
                const y = positions[i + 1];
                
                const dx = lorenzParams.sigma * (y - x);
                const dy = x * (lorenzParams.rho - z) - y;
                const dz = x * y - lorenzParams.beta * z;

                positions[i] += dx * lorenzParams.dt;
                positions[i + 1] += dy * lorenzParams.dt;
                positions[i + 2] += dz * lorenzParams.dt;

                // Attractor influence
                attractors.forEach((attractor, idx) => {
                    const dist = new THREE.Vector3(x, y, z).distanceTo(attractor);
                    const force = (params.attractorStrength * attractorScale) / (dist * dist);
                    
                    positions[i] += (attractor.x - x) * force;
                    positions[i + 1] += (attractor.y - y) * force;
                    positions[i + 2] += (attractor.z - z) * force;
                    
                    // Add local tornado effect
                    const angle = time * (0.5 + idx * 0.2);
                    positions[i] += Math.sin(angle) * force * 0.5;
                    positions[i + 1] += Math.cos(angle) * force * 0.5;
                });

                // Add bounds to prevent particles from escaping
                positions[i] = THREE.MathUtils.clamp(positions[i], -10, 10);
                positions[i + 1] = THREE.MathUtils.clamp(positions[i + 1], -10, 10);
                positions[i + 2] = THREE.MathUtils.clamp(positions[i + 2], -10, 10);
            }

            geometry.attributes.position.needsUpdate = true;

            if (isTransitioning) {
                transitionProgress += 0.005; // Slower transition
                const easing = 1 - Math.cos(transitionProgress * Math.PI * 0.5); // Smooth easing
                
                camera.position.lerp(targetPosition, easing * 0.02); // Gentler movement
                currentLookAt.lerp(targetLookAt, easing * 0.02);
                camera.lookAt(currentLookAt);
                
                if (transitionProgress >= 1) {
                    isTransitioning = false;
                }
            } else {
                // Look at centroid when not transitioning to clicked position
                camera.lookAt(calculateAttractorCentroid());
            }

            // Update glow with distance-based optimization
            glowMaterial.uniforms.time.value = time;
            glowMaterial.uniforms.positions.value = geometry.attributes.position.array;

            // Add stats update at the end of animate function
            setStats({
                fps: Math.round(1000 / (currentTime - lastFrame)),
                time: time,
                cameraPos: {
                    x: Number(camera.position.x.toFixed(2)),
                    y: Number(camera.position.y.toFixed(2)),
                    z: Number(camera.position.z.toFixed(2))
                },
                particleCenter: {
                    x: Number(points.position.x.toFixed(2)),
                    y: Number(points.position.y.toFixed(2)),
                    z: Number(points.position.z.toFixed(2))
                }
            });

            // Add after scene setup, before animate function
            const createGlowEffect = (position: THREE.Vector3) => {
                const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
                const glowMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        color: { value: new THREE.Color(0x00ffff) },
                        center: { value: position }
                    },
                    vertexShader: `
                        varying vec3 vPosition;
                        void main() {
                            vPosition = position;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform vec3 color;
                        uniform vec3 center;
                        varying vec3 vPosition;
                        
                        void main() {
                            float dist = length(vPosition - center);
                            float alpha = (1.0 - dist) * exp(-dist * 2.0);
                            vec3 finalColor = color * (1.0 + sin(time * 10.0) * 0.2);
                            gl_FragColor = vec4(finalColor, alpha);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.copy(position);
                scene.add(glow);

                // Animate and remove
                let size = 0.1;
                const expandGlow = () => {
                    size += 0.1;
                    glow.scale.set(size, size, size);
                    glowMaterial.uniforms.time.value += 0.1;
                    
                    if (size < 3) {
                        requestAnimationFrame(expandGlow);
                    } else {
                        scene.remove(glow);
                        glowGeometry.dispose();
                        glowMaterial.dispose();
                    }
                };
                
                expandGlow();
            };

            const createExplosiveWave = (position: THREE.Vector3) => {
                const waveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
                const waveMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        center: { value: position },
                        radius: { value: 0.1 },
                        color: { value: new THREE.Color(0xff3300) }
                    },
                    vertexShader: `
                        uniform float radius;
                        varying vec2 vUv;
                        
                        void main() {
                            vUv = uv;
                            vec3 pos = position;
                            pos.xy *= radius;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform vec3 color;
                        varying vec2 vUv;
                        
                        void main() {
                            float intensity = sin(time * 5.0) * 0.5 + 0.5;
                            float edge = 1.0 - smoothstep(0.0, 0.1, abs(length(vUv - 0.5) - 0.5));
                            vec3 finalColor = color * intensity;
                            float alpha = edge * (1.0 - time * 0.5);
                            gl_FragColor = vec4(finalColor, alpha);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });

                const wave = new THREE.Mesh(waveGeometry, waveMaterial);
                wave.position.copy(position);
                scene.add(wave);

                // Destroy nearby particles
                particles.forEach((particle, index) => {
                    const distance = particle.position.distanceTo(position);
                    if (distance < 2) {
                        particlesToRemove.add(index);
                    }
                });

                // Animate and remove
                let size = 0.1;
                const expandWave = () => {
                    size += 0.2;
                    waveMaterial.uniforms.radius.value = size;
                    waveMaterial.uniforms.time.value += 0.05;
                    
                    if (size < 5) {
                        requestAnimationFrame(expandWave);
                    } else {
                        scene.remove(wave);
                        waveGeometry.dispose();
                        waveMaterial.dispose();
                    }
                };
                
                expandWave();
            };

            // Modify animate function to include particle physics
            const updateParticles = () => {
                if (!particleGroupRef.current) return;
                
                const newParticles = [...particles];
                const particlesToAdd: Particle[] = [];
                const particlesToRemove: Set<number> = new Set();

                newParticles.forEach((particle, i) => {
                    // Update particle position
                    particle.position.add(particle.velocity);
                    particle.mesh?.position.copy(particle.position);
                    
                    // Check collisions
                    newParticles.forEach((other, j) => {
                        if (i === j) return;
                        
                        const distance = particle.position.distanceTo(other.position);
                        if (distance < 0.5) {
                            if (particle.type === other.type) {
                                // Same type collision
                                if (!particlesToRemove.has(i) && !particlesToRemove.has(j)) {
                                    particlesToRemove.add(j);
                                    particle.energy += other.energy;
                                    particleGroupRef.current.remove(other.mesh);
                                }
                            } else if (
                                (particle.type === 'alpha' && other.type === 'beta') ||
                                (particle.type === 'beta' && other.type === 'alpha')
                            ) {
                                // Alpha-Beta collision
                                particlesToRemove.add(i);
                                particlesToRemove.add(j);
                                particleGroupRef.current.remove(particle.mesh);
                                particleGroupRef.current.remove(other.mesh);
                                
                                // Create delta and gamma particles
                                for (let k = 0; k < 2; k++) {
                                    ['delta', 'gamma'].forEach(type => {
                                        const newParticle = {
                                            type: type as 'delta' | 'gamma',
                                            position: particle.position.clone(),
                                            velocity: new THREE.Vector3(
                                                Math.random() - 0.5,
                                                Math.random() - 0.5,
                                                Math.random() - 0.5
                                            ).multiplyScalar(0.05),
                                            energy: 1
                                        };

                                        const mesh = new THREE.Mesh(
                                            particleGeometries[type as 'delta' | 'gamma'],
                                            particleMaterials[type as 'delta' | 'gamma']
                                        );
                                        mesh.position.copy(newParticle.position);
                                        particleGroupRef.current.add(mesh);

                                        particlesToAdd.push({ ...newParticle, mesh });
                                    });
                                }
                            }
                        }
                    });

                    // Special particle effects
                    if (particle.type === 'gamma' && particle.energy >= 40) {
                        particlesToRemove.add(i);
                        particleGroupRef.current.remove(particle.mesh);
                        createGlowEffect(particle.position);
                        
                        const newAlpha = {
                            type: 'alpha' as const,
                            position: particle.position.clone(),
                            velocity: new THREE.Vector3(),
                            energy: 1
                        };

                        const mesh = new THREE.Mesh(
                            particleGeometries.alpha,
                            particleMaterials.alpha
                        );
                        mesh.position.copy(newAlpha.position);
                        particleGroupRef.current.add(mesh);

                        particlesToAdd.push({ ...newAlpha, mesh });
                    }

                    if (particle.type === 'delta' && particle.energy >= 40) {
                        particlesToRemove.add(i);
                        particleGroupRef.current.remove(particle.mesh);
                        createExplosiveWave(particle.position);
                        
                        // Create beta particles
                        for (let k = 0; k < 10; k++) {
                            const newBeta = {
                                type: 'beta' as const,
                                position: particle.position.clone(),
                                velocity: new THREE.Vector3(
                                    Math.random() - 0.5,
                                    Math.random() - 0.5,
                                    Math.random() - 0.5
                                ).multiplyScalar(0.1),
                                energy: 1
                            };

                            const mesh = new THREE.Mesh(
                                particleGeometries.beta,
                                particleMaterials.beta
                            );
                            mesh.position.copy(newBeta.position);
                            particleGroupRef.current.add(mesh);

                            particlesToAdd.push({ ...newBeta, mesh });
                        }
                    }
                });

                // Update particle array
                const updatedParticles = newParticles
                    .filter((_, i) => !particlesToRemove.has(i))
                    .concat(particlesToAdd);
                    
                setParticles(updatedParticles);
            };

            // Add to animate function, before renderer.render:
            updateParticles();

            renderer.render(scene, camera);
        };

        animate();

        // Create particle group and add to scene
        const particleGroup = new THREE.Group();
        particleGroupRef.current = particleGroup;
        scene.add(particleGroup);

        // Modify shootParticle to use particleGroup from ref
        const shootParticle = (event: MouseEvent, type: 'alpha' | 'beta') => {
            if (!particleGroupRef.current) return;
            
            const mouse = new THREE.Vector2(
                (event.clientX / width) * 2 - 1,
                -(event.clientY / height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const direction = raycaster.ray.direction;
            const startPos = camera.position.clone();
            
            const newParticle: Particle = {
                type,
                position: startPos,
                velocity: direction.multiplyScalar(0.1),
                energy: 1
            };

            const mesh = new THREE.Mesh(
                particleGeometries[type],
                particleMaterials[type]
            );
            mesh.position.copy(startPos);
            particleGroupRef.current.add(mesh);

            setParticles(prev => [...prev, { ...newParticle, mesh }]);
        };

        // Add shoot+click handler
        const handleShootClick = (event: MouseEvent) => {
            if (!event.altKey) return;
            event.preventDefault();
            
            const type = event.button === 0 ? 'alpha' : 'beta';
            shootParticle(event, type);
        };

        window.addEventListener('mousedown', handleShootClick);

        // Cleanup on unmount
        return () => {
            currentMount?.removeChild(renderer.domElement);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleShootClick);
            particleGeometries.alpha.dispose();
            particleGeometries.beta.dispose();
            particleGeometries.delta.dispose();
            particleGeometries.gamma.dispose();
            particleMaterials.alpha.dispose();
            particleMaterials.beta.dispose();
            particleMaterials.delta.dispose();
            particleMaterials.gamma.dispose();
        };
    }, [params.particleCount, params.rotationSpeed, params.attractorStrength, params.breathingSpeed]);

    return (
        <>
            <div ref={mountRef} className="background-animation" />
            <div className="floating-ui" aria-label="Animation Controls">
                <div className="controls-section">
                    <h3>Controls</h3>
                    {Object.entries(params).map(([key, value]) => (
                        <div key={key} className="control-item">
                            <label htmlFor={key}>{key}</label>
                            <input
                                id={key}
                                type="range"
                                min={0}
                                max={key === 'particleCount' ? 20000 : 1}
                                step={key === 'particleCount' ? 1000 : 0.001}
                                value={value}
                                onChange={(e) => setParams({
                                    ...params,
                                    [key]: parseFloat(e.target.value)
                                })}
                                aria-label={`Adjust ${key}`}
                            />
                            <span>{value.toFixed(3)}</span>
                        </div>
                    ))}
                </div>
                
                <div className="stats-section">
                    <h3>Stats</h3>
                    <div>FPS: {stats.fps}</div>
                    <div>Time: {stats.time.toFixed(2)}</div>
                    <div>Camera: ({stats.cameraPos.x}, {stats.cameraPos.y}, {stats.cameraPos.z})</div>
                </div>

                <div className="minimap" aria-label="Scene Minimap">
                    <canvas ref={minimapRef} width="150" height="150" />
                </div>
            </div>
        </>
    );
};

export default BackgroundAnimation;
