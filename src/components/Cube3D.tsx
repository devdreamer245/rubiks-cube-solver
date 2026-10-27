import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FaceletState } from '../core/types';
import { COLOR_HEX } from './CubeNetEditor';

interface Cube3DProps {
  state: FaceletState;
  activeMove?: string | null;
}

const INNER_COLOR = 0x111827; // Dark slate for internal faces

export const Cube3D: React.FC<Cube3DProps> = ({ state }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeletsRef = useRef<THREE.Mesh[]>([]);

  // Orbit camera rotation state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationGroupRef = useRef<THREE.Group | null>(null);

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.5, 3.8, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-8, -6, -6);
    scene.add(dirLight2);

    // 3. Cubelets Group
    const rotationGroup = new THREE.Group();
    scene.add(rotationGroup);
    rotationGroupRef.current = rotationGroup;

    // Generate 27 cubelets
    const cubeletGeometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const cubelets: THREE.Mesh[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Materials for 6 faces: [Right, Left, Top, Bottom, Front, Back]
          const materials = [
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: INNER_COLOR, roughness: 0.2 }),
          ];

          const mesh = new THREE.Mesh(cubeletGeometry, materials);
          mesh.position.set(x, y, z);
          mesh.userData = { gridX: x, gridY: y, gridZ: z };

          rotationGroup.add(mesh);
          cubelets.push(mesh);
        }
      }
    }

    cubeletsRef.current = cubelets;

    // 4. Mouse / Touch Drag Rotation Handling
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !rotationGroupRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rotationGroupRef.current.rotation.y += deltaX * 0.008;
      rotationGroupRef.current.rotation.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 5. Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Subtle gentle auto-rotation when user is not interacting
      if (!isDraggingRef.current && rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y += 0.0015;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 360;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Facelet Colors whenever state updates
  useEffect(() => {
    if (!cubeletsRef.current.length || state.length !== 54) return;

    // Helper: convert face character to THREE.Color
    const getColor = (f: string) => new THREE.Color(COLOR_HEX[f as keyof typeof COLOR_HEX] || '#ffffff');

    cubeletsRef.current.forEach((mesh) => {
      const { gridX, gridY, gridZ } = mesh.userData;
      const materials = mesh.material as THREE.MeshStandardMaterial[];

      // Right Face (+x = 1, face R): indices 9..17
      if (gridX === 1) {
        // row: top is y=1, middle is y=0, bottom is y=-1
        // col: front is z=1, center is z=0, back is z=-1
        const r = 1 - gridY; // 0, 1, 2
        const c = 1 - gridZ; // 0 (z=1), 1 (z=0), 2 (z=-1)
        const idx = 9 + r * 3 + c;
        materials[0].color = getColor(state[idx]);
      } else {
        materials[0].color = new THREE.Color(INNER_COLOR);
      }

      // Left Face (-x = -1, face L): indices 36..44
      if (gridX === -1) {
        // row: top is y=1 (0), middle is y=0 (1), bottom is y=-1 (2)
        // col: back is z=-1 (0), center is z=0 (1), front is z=1 (2)
        const r = 1 - gridY;
        const c = gridZ + 1; // 0 (z=-1), 1 (z=0), 2 (z=1)
        const idx = 36 + r * 3 + c;
        materials[1].color = getColor(state[idx]);
      } else {
        materials[1].color = new THREE.Color(INNER_COLOR);
      }

      // Up Face (+y = 1, face U): indices 0..8
      if (gridY === 1) {
        // row: back is z=-1 (0), center is z=0 (1), front is z=1 (2)
        // col: left is x=-1 (0), center is x=0 (1), right is x=1 (2)
        const r = gridZ + 1;
        const c = gridX + 1;
        const idx = r * 3 + c;
        materials[2].color = getColor(state[idx]);
      } else {
        materials[2].color = new THREE.Color(INNER_COLOR);
      }

      // Down Face (-y = -1, face D): indices 27..35
      if (gridY === -1) {
        // row: front is z=1 (0), center is z=0 (1), back is z=-1 (2)
        // col: left is x=-1 (0), center is x=0 (1), right is x=1 (2)
        const r = 1 - gridZ;
        const c = gridX + 1;
        const idx = 27 + r * 3 + c;
        materials[3].color = getColor(state[idx]);
      } else {
        materials[3].color = new THREE.Color(INNER_COLOR);
      }

      // Front Face (+z = 1, face F): indices 18..26
      if (gridZ === 1) {
        // row: top is y=1 (0), center is y=0 (1), bottom is y=-1 (2)
        // col: left is x=-1 (0), center is x=0 (1), right is x=1 (2)
        const r = 1 - gridY;
        const c = gridX + 1;
        const idx = 18 + r * 3 + c;
        materials[4].color = getColor(state[idx]);
      } else {
        materials[4].color = new THREE.Color(INNER_COLOR);
      }

      // Back Face (-z = -1, face B): indices 45..53
      if (gridZ === -1) {
        // row: top is y=1 (0), center is y=0 (1), bottom is y=-1 (2)
        // col: right is x=1 (0), center is x=0 (1), left is x=-1 (2)
        const r = 1 - gridY;
        const c = 1 - gridX;
        const idx = 45 + r * 3 + c;
        materials[5].color = getColor(state[idx]);
      } else {
        materials[5].color = new THREE.Color(INNER_COLOR);
      }
    });
  }, [state]);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
      <div ref={mountRef} className="w-full h-full" />

      {/* Interactive Helper Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 select-none pointer-events-none flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Drag to orbit in 3D</span>
      </div>
    </div>
  );
};
