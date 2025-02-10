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

const BackgroundAnimation: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLCanvasElement>(null);
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

        // Add these variables after scene setup
        let time = 0;
        const rotationSpeed = params.rotationSpeed;
        const attractorScale = 0.8;
        
        // Add camera movement variables
        let cameraAngle = 100;
        let cameraRadius = 6;
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
                targetPosition.copy(intersects[0].point);
                targetLookAt.copy(intersects[0].point);
                currentLookAt.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
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

        // Animation loop modification
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Create organic breathing rhythm
            const breathingCycle = Math.sin(time * params.breathingSpeed) * Math.sin(time * 0.07);
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

                // Lorenz attractor influence
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                const dx = lorenzParams.sigma * (y - x);
                const dy = x * (lorenzParams.rho - z) - y;
                const dz = x * y - lorenzParams.beta * z;

                positions[i] += dx * lorenzParams.dt;
                positions[i + 1] += dy * lorenzParams.dt;
                positions[i + 2] += dz * lorenzParams.dt;

                // Attractor influence
                attractors.forEach((attractor, idx) => {
                    const dist = new THREE.Vector3(x, y, z).distanceTo(attractor);
                    const force = params.attractorStrength / (dist * dist);
                    
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
            shaderMaterial.uniforms.time.value += 0.005 * (1 + breathingCycle * 0.3);

            if (isTransitioning) {
                transitionProgress += 0.015; // Adjust speed
                const easing = 1 - Math.cos(transitionProgress * Math.PI * 0.5);
                
                const offset = new THREE.Vector3(0, 0, 2);
                const targetCameraPos = targetPosition.clone().add(offset);
                
                camera.position.lerp(targetCameraPos, easing);
                currentLookAt.lerp(targetLookAt, easing);
                camera.lookAt(currentLookAt);
                
                if (transitionProgress >= 1) {
                    isTransitioning = false;
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup on unmount
        return () => {
            currentMount?.removeChild(renderer.domElement);
            window.removeEventListener('click', handleClick);
        };
    }, [params.particleCount, params.rotationSpeed, params.attractorStrength, params.breathingSpeed]);

    // Add inside useEffect, before return:
    const updateStats = () => {
        setStats({
            fps: Math.round(1000 / (performance.now() - lastFrame)),
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
    };

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
