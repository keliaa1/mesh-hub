"use client";

import React, { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export interface MeshDetail {
  uuid: string;
  name: string;
  vertices: number;
  faces: number;
  triangles: number;
  edges: number;
  materialName: string;
  hasNormals: boolean;
  hasUv: boolean;
}

export interface ModelStats {
  vertices: number;
  faces: number;
  triangles: number;
  edges: number;
  objects: number;
  materials: string[];
  dimensions: { x: number; y: number; z: number };
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  hasNormals: boolean;
  hasUvs: boolean;
  animations: string[];
  meshes: MeshDetail[];
}

type ShadingMode = 'material' | 'solid' | 'normals' | 'wireframe';
type CameraView = 'front' | 'top' | 'side' | 'reset' | null;

interface ModelSceneProps {
  url: string;
  shadingMode: ShadingMode;
  wireframeOverlay: boolean;
  showBounds: boolean;
  hiddenMeshUuids: string[];
  onStatsExtracted: (stats: ModelStats) => void;
  animPlaying: boolean;
  selectedAnimIndex: number;
  cameraCommand: CameraView;
  onCameraCommandHandled: () => void;
  controlsRef: React.RefObject<any>;
}

function InnerModel({
  url,
  shadingMode,
  wireframeOverlay,
  showBounds,
  hiddenMeshUuids,
  onStatsExtracted,
  animPlaying,
  selectedAnimIndex,
}: {
  url: string;
  shadingMode: ShadingMode;
  wireframeOverlay: boolean;
  showBounds: boolean;
  hiddenMeshUuids: string[];
  onStatsExtracted: (stats: ModelStats) => void;
  animPlaying: boolean;
  selectedAnimIndex: number;
}) {
  const gltf = useGLTF(url);
  const { scene, animations } = gltf;

  // Setup animations if present
  const { actions, names } = useAnimations(animations, scene);

  useEffect(() => {
    if (names.length === 0) return;
    const name = names[selectedAnimIndex] || names[0];
    const currentAction = actions[name];

    if (currentAction) {
      if (animPlaying) {
        currentAction.reset().fadeIn(0.2).play();
      } else {
        currentAction.paused = true;
      }
    }

    return () => {
      currentAction?.fadeOut(0.2);
    };
  }, [actions, names, animPlaying, selectedAnimIndex]);

  // Extract statistics once per loaded scene
  useEffect(() => {
    if (!scene) return;

    let totalVertices = 0;
    let totalTriangles = 0;
    let totalEdges = 0;
    const materialSet = new Set<string>();
    const meshDetails: MeshDetail[] = [];
    let detectedNormals = false;
    let detectedUvs = false;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom) return;

        const pos = geom.attributes.position;
        const vCount = pos ? pos.count : 0;
        const tCount = geom.index ? geom.index.count / 3 : vCount / 3;

        if (geom.attributes.normal) detectedNormals = true;
        if (geom.attributes.uv) detectedUvs = true;

        let mEdges = 0;
        if (geom.index) {
          const idxArr = geom.index.array;
          const edgeSet = new Set<string>();
          for (let i = 0; i < idxArr.length; i += 3) {
            const a = idxArr[i];
            const b = idxArr[i + 1];
            const c = idxArr[i + 2];
            edgeSet.add(a < b ? `${a}_${b}` : `${b}_${a}`);
            edgeSet.add(b < c ? `${b}_${c}` : `${c}_${b}`);
            edgeSet.add(c < a ? `${c}_${a}` : `${a}_${c}`);
          }
          mEdges = edgeSet.size;
        } else {
          mEdges = Math.round(tCount * 1.5);
        }

        let matName = 'Default Material';
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if (m) {
              const name = m.name || m.type;
              materialSet.add(name);
              matName = name;
            }
          });
        } else if (mesh.material) {
          matName = mesh.material.name || mesh.material.type;
          materialSet.add(matName);
        }

        totalVertices += vCount;
        totalTriangles += tCount;
        totalEdges += mEdges;

        meshDetails.push({
          uuid: mesh.uuid,
          name: mesh.name || `Mesh_${meshDetails.length + 1}`,
          vertices: vCount,
          faces: Math.round(tCount),
          triangles: Math.round(tCount),
          edges: mEdges,
          materialName: matName,
          hasNormals: !!geom.attributes.normal,
          hasUv: !!geom.attributes.uv,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    onStatsExtracted({
      vertices: totalVertices,
      faces: Math.round(totalTriangles),
      triangles: Math.round(totalTriangles),
      edges: totalEdges,
      objects: meshDetails.length,
      materials: Array.from(materialSet),
      dimensions: {
        x: Number(size.x.toFixed(3)),
        y: Number(size.y.toFixed(3)),
        z: Number(size.z.toFixed(3)),
      },
      boundingBox: {
        min: [Number(box.min.x.toFixed(2)), Number(box.min.y.toFixed(2)), Number(box.min.z.toFixed(2))],
        max: [Number(box.max.x.toFixed(2)), Number(box.max.y.toFixed(2)), Number(box.max.z.toFixed(2))],
      },
      hasNormals: detectedNormals,
      hasUvs: detectedUvs,
      animations: animations.map((a, i) => a.name || `Animation ${i + 1}`),
      meshes: meshDetails,
    });
  }, [scene, animations, onStatsExtracted]);

  // Shading materials
  const solidMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xd6d6d6,
        roughness: 0.45,
        metalness: 0.08,
      }),
    []
  );

  const normalMat = useMemo(() => new THREE.MeshNormalMaterial(), []);

  const wireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
      }),
    []
  );

  // Apply shading modes & visibility
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Visibility
        mesh.visible = !hiddenMeshUuids.includes(mesh.uuid);

        // Store original material if not stored
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material;
        }

        if (shadingMode === 'material') {
          mesh.material = mesh.userData.originalMaterial;
        } else if (shadingMode === 'solid') {
          mesh.material = solidMat;
        } else if (shadingMode === 'normals') {
          mesh.material = normalMat;
        } else if (shadingMode === 'wireframe') {
          mesh.material = wireMat;
        }
      }
    });
  }, [scene, shadingMode, hiddenMeshUuids, solidMat, normalMat, wireMat]);

  // Attach wireframe overlay geometry to each mesh
  useEffect(() => {
    const createdLines: THREE.LineSegments[] = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          try {
            const wireGeom = new THREE.WireframeGeometry(mesh.geometry);
            const line = new THREE.LineSegments(
              wireGeom,
              new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.35,
                depthTest: true,
              })
            );
            line.name = '__meshhub_wireframe_overlay__';
            line.visible = wireframeOverlay && shadingMode !== 'wireframe';
            mesh.add(line);
            createdLines.push(line);
          } catch {
            // Geometry without indices or incompatible
          }
        }
      }
    });

    return () => {
      createdLines.forEach((line) => {
        line.parent?.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    };
  }, [scene, wireframeOverlay, shadingMode]);

  // Update wireframe overlay visibility dynamically
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const wf = child.getObjectByName('__meshhub_wireframe_overlay__');
        if (wf) {
          wf.visible = wireframeOverlay && shadingMode !== 'wireframe';
        }
      }
    });
  }, [scene, wireframeOverlay, shadingMode]);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      solidMat.dispose();
      normalMat.dispose();
      wireMat.dispose();
    };
  }, [solidMat, normalMat, wireMat]);

  return (
    <>
      <primitive object={scene} />
      {showBounds && <boxHelper args={[scene, '#f59e0b']} />}
    </>
  );
}

function CameraController({
  cameraCommand,
  onCommandHandled,
  controlsRef,
}: {
  cameraCommand: CameraView;
  onCommandHandled: () => void;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!cameraCommand || !controlsRef.current) return;

    const target = controlsRef.current.target || new THREE.Vector3(0, 0, 0);
    const dist = camera.position.distanceTo(target) || 4;

    if (cameraCommand === 'reset') {
      controlsRef.current.reset();
    } else if (cameraCommand === 'front') {
      camera.position.set(target.x, target.y, target.z + dist);
      camera.lookAt(target);
      controlsRef.current.update();
    } else if (cameraCommand === 'top') {
      camera.position.set(target.x, target.y + dist, target.z + 0.0001);
      camera.lookAt(target);
      controlsRef.current.update();
    } else if (cameraCommand === 'side') {
      camera.position.set(target.x + dist, target.y, target.z);
      camera.lookAt(target);
      controlsRef.current.update();
    }

    onCommandHandled();
  }, [cameraCommand, camera, controlsRef, onCommandHandled]);

  return null;
}

export default function ModelViewer({
  url,
  fileName,
}: {
  url: string;
  fileName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  // States
  const [shadingMode, setShadingMode] = useState<ShadingMode>('material');
  const [wireframeOverlay, setWireframeOverlay] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1);
  const [cameraCommand, setCameraCommand] = useState<CameraView>(null);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hiddenMeshUuids, setHiddenMeshUuids] = useState<string[]>([]);
  const [selectedAnimIndex, setSelectedAnimIndex] = useState(0);
  const [animPlaying, setAnimPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'stats' | 'outliner' | 'materials'>('stats');

  const handleStatsExtracted = useCallback((extracted: ModelStats) => {
    setStats(extracted);
  }, []);

  const toggleMeshVisibility = (uuid: string) => {
    setHiddenMeshUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const isolateMesh = (uuid: string) => {
    if (!stats) return;
    const otherUuids = stats.meshes.filter((m) => m.uuid !== uuid).map((m) => m.uuid);
    // If already isolated, reset all
    const isCurrentlyIsolated =
      hiddenMeshUuids.length === otherUuids.length &&
      !hiddenMeshUuids.includes(uuid);

    if (isCurrentlyIsolated) {
      setHiddenMeshUuids([]);
    } else {
      setHiddenMeshUuids(otherUuids);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleCopyStats = () => {
    if (!stats) return;
    const text = `Model Statistics:
• Vertices: ${stats.vertices.toLocaleString()}
• Faces: ${stats.faces.toLocaleString()}
• Triangles: ${stats.triangles.toLocaleString()}
• Edges: ${stats.edges.toLocaleString()}
• Objects / Meshes: ${stats.objects}
• Materials: ${stats.materials.join(', ')}
• Dimensions: ${stats.dimensions.x}m × ${stats.dimensions.y}m × ${stats.dimensions.z}m
• Normals: ${stats.hasNormals ? 'Available' : 'None'}
• UVs: ${stats.hasUvs ? 'Available' : 'None'}`;
    navigator.clipboard.writeText(text);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`group relative h-full w-full overflow-hidden select-none bg-[#09090b] ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : ''
      }`}
    >
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [0, 1.5, 4] }}>
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.8} shadows adjustCamera>
            <InnerModel
              url={url}
              shadingMode={shadingMode}
              wireframeOverlay={wireframeOverlay}
              showBounds={showBounds}
              hiddenMeshUuids={hiddenMeshUuids}
              onStatsExtracted={handleStatsExtracted}
              animPlaying={animPlaying}
              selectedAnimIndex={selectedAnimIndex}
            />
          </Stage>
        </Suspense>

        {showGrid && (
          <gridHelper
            args={[30, 30, '#3f3f46', '#1e1e24']}
            position={[0, -0.01, 0]}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          enableDamping
          dampingFactor={0.05}
        />

        <CameraController
          cameraCommand={cameraCommand}
          onCommandHandled={() => setCameraCommand(null)}
          controlsRef={controlsRef}
        />
      </Canvas>

      {/* Top Header Overlay: Stats summary & Shading modes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        {/* Left: Blender Scene Statistics HUD */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowDetailsModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/75 px-3 py-1.5 text-xs backdrop-blur-md transition-all hover:border-white/30 hover:bg-black/90 active:scale-95 shadow-lg"
            title="Click to view detailed Blender geometry statistics"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#e4e4e7]">
              {stats ? (
                <>
                  <span className="font-semibold text-white">
                    {stats.faces.toLocaleString()}
                  </span>
                  <span className="text-[#a1a1aa]">Faces</span>
                  <span className="text-white/20">|</span>
                  <span className="font-semibold text-white">
                    {stats.vertices.toLocaleString()}
                  </span>
                  <span className="text-[#a1a1aa]">Verts</span>
                  <span className="text-white/20">|</span>
                  <span className="font-semibold text-white">{stats.objects}</span>
                  <span className="text-[#a1a1aa]">Objs</span>
                </>
              ) : (
                <span className="text-[#a1a1aa]">Loading mesh stats...</span>
              )}
            </div>
            <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-[#c8c8c8]">
              Details
            </span>
          </button>
        </div>

        {/* Right: Blender Viewport Shading Modes */}
        <div className="pointer-events-auto flex items-center rounded-2xl border border-white/10 bg-black/75 p-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setShadingMode('material')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              shadingMode === 'material'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            title="Rendered (Material & Textures preview)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>Material</span>
          </button>

          <button
            onClick={() => setShadingMode('solid')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              shadingMode === 'solid'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            title="Solid (Studio clay shading)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18" />
            </svg>
            <span>Solid</span>
          </button>

          <button
            onClick={() => setShadingMode('normals')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              shadingMode === 'normals'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            title="Normals (Inspect face and vertex normal orientations)"
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-white/30"
              style={{
                background: 'conic-gradient(from 0deg, #ff0055, #00ff66, #00aaff, #ff0055)',
              }}
            />
            <span>Normals</span>
          </button>

          <button
            onClick={() => setShadingMode('wireframe')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              shadingMode === 'wireframe'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            title="Pure Wireframe mode"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <span>Wire</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Overlays & Camera navigation */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-3 p-3 sm:p-4">
        {/* Left: Viewport Overlays (Wireframe overlay, Grid, Bounding Box) */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setWireframeOverlay((prev) => !prev)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              wireframeOverlay
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            title="Toggle Wireframe topology overlay on surfaces"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>Wireframe Overlay</span>
          </button>

          <button
            onClick={() => setShowGrid((prev) => !prev)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              showGrid
                ? 'bg-white/15 text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
            title="Toggle Blender Floor Grid"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            <span>Grid</span>
          </button>

          <button
            onClick={() => setShowBounds((prev) => !prev)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              showBounds
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-[#71717a] hover:text-white'
            }`}
            title="Toggle 3D Bounding Box cage"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
            </svg>
            <span>Bounds</span>
          </button>
        </div>

        {/* Center/Right: Animations & Camera presets */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Animations controls if available */}
          {stats && stats.animations.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-lg backdrop-blur-md">
              <button
                onClick={() => setAnimPlaying((prev) => !prev)}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20 transition-all"
                title={animPlaying ? 'Pause Animation' : 'Play Animation'}
              >
                {animPlaying ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
                <span>{animPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {stats.animations.length > 1 && (
                <select
                  value={selectedAnimIndex}
                  onChange={(e) => setSelectedAnimIndex(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-black/60 px-2 py-1 text-[11px] text-white focus:outline-none"
                >
                  {stats.animations.map((name, i) => (
                    <option key={i} value={i} className="bg-neutral-900 text-white">
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Turntable / Auto-Rotate */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                autoRotate
                  ? 'bg-white text-black'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Toggle Turntable 360 rotation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Rotate</span>
            </button>
            {autoRotate && (
              <button
                onClick={() =>
                  setAutoRotateSpeed((prev) => (prev >= 2 ? 0.5 : prev + 0.5))
                }
                className="rounded-lg bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-[#c8c8c8] hover:text-white"
                title="Change rotation speed"
              >
                {autoRotateSpeed}x
              </button>
            )}
          </div>

          {/* Camera Angles (Blender Viewport Presets: Front, Top, Side) */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setCameraCommand('front')}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
              title="Front view (Blender Numpad 1)"
            >
              Front
            </button>
            <button
              onClick={() => setCameraCommand('top')}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
              title="Top view (Blender Numpad 7)"
            >
              Top
            </button>
            <button
              onClick={() => setCameraCommand('side')}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
              title="Right / Side view (Blender Numpad 3)"
            >
              Side
            </button>
            <button
              onClick={() => setCameraCommand('reset')}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
              title="Reset camera view"
            >
              Reset
            </button>
            <button
              onClick={toggleFullscreen}
              className="ml-1 rounded-xl p-1.5 text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Blender Model Details Modal / Drawer */}
      {showDetailsModal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="card max-h-[90%] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#0f0f12] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    3D Model Details &amp; Statistics
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">
                    {fileName || 'Blender Geometry Inspection'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStats}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#c8c8c8] hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
                  title="Copy statistics to clipboard"
                >
                  {copiedStats ? (
                    <>
                      <span className="text-emerald-400">✓</span> Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Stats
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-full p-1.5 text-[#a1a1aa] hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 px-6 pt-2 bg-white/[0.02]">
              <button
                onClick={() => setDetailsTab('stats')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  detailsTab === 'stats'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
                }`}
              >
                Geometry &amp; Dimensions
              </button>
              <button
                onClick={() => setDetailsTab('outliner')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  detailsTab === 'outliner'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
                }`}
              >
                Outliner &amp; Meshes ({stats?.meshes.length || 0})
              </button>
              <button
                onClick={() => setDetailsTab('materials')}
                className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                  detailsTab === 'materials'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
                }`}
              >
                Materials ({stats?.materials.length || 0})
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {stats ? (
                <>
                  {detailsTab === 'stats' && (
                    <div className="space-y-6">
                      {/* Primary Blender Stats Grid */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">
                          Mesh Statistics (Blender Viewport Overlays)
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Vertices</span>
                            <span className="mt-1 block font-mono text-xl font-bold text-white">
                              {stats.vertices.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Faces</span>
                            <span className="mt-1 block font-mono text-xl font-bold text-white">
                              {stats.faces.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Triangles</span>
                            <span className="mt-1 block font-mono text-xl font-bold text-white">
                              {stats.triangles.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Edges</span>
                            <span className="mt-1 block font-mono text-xl font-bold text-white">
                              {stats.edges.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dimensions and Bounding Extents */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">
                          Dimensions &amp; Bounding Box (Meters)
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Width (X)</span>
                            <span className="mt-1 block font-mono text-lg font-bold text-white">
                              {stats.dimensions.x} m
                            </span>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Height (Y)</span>
                            <span className="mt-1 block font-mono text-lg font-bold text-white">
                              {stats.dimensions.y} m
                            </span>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                            <span className="block text-xs text-[#a1a1aa]">Depth (Z)</span>
                            <span className="mt-1 block font-mono text-lg font-bold text-white">
                              {stats.dimensions.z} m
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#a1a1aa] font-mono flex flex-wrap justify-between gap-2">
                          <span>
                            Min: ({stats.boundingBox.min.join(', ')})
                          </span>
                          <span>
                            Max: ({stats.boundingBox.max.join(', ')})
                          </span>
                        </div>
                      </div>

                      {/* Technical Attributes */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">
                          Vertex Attributes &amp; Channels
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="text-xs text-[#a1a1aa]">Normal Vectors</span>
                            <p className="mt-1 text-sm font-semibold text-white flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${stats.hasNormals ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {stats.hasNormals ? 'Included' : 'Not Provided'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="text-xs text-[#a1a1aa]">Texture Coordinates (UV)</span>
                            <p className="mt-1 text-sm font-semibold text-white flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${stats.hasUvs ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {stats.hasUvs ? 'UV Channels Present' : 'No UVs'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <span className="text-xs text-[#a1a1aa]">Animations</span>
                            <p className="mt-1 text-sm font-semibold text-white flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${stats.animations.length > 0 ? 'bg-sky-400' : 'bg-neutral-500'}`} />
                              {stats.animations.length > 0 ? `${stats.animations.length} Action Clips` : 'Static Scene'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailsTab === 'outliner' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                        <p>
                          Inspect and toggle visibility of individual meshes in the model hierarchy.
                        </p>
                        {hiddenMeshUuids.length > 0 && (
                          <button
                            onClick={() => setHiddenMeshUuids([])}
                            className="text-xs font-semibold text-sky-400 hover:underline"
                          >
                            Show All
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
                        {stats.meshes.map((m, idx) => {
                          const isHidden = hiddenMeshUuids.includes(m.uuid);
                          return (
                            <div
                              key={m.uuid || idx}
                              className={`flex items-center justify-between gap-3 p-3 transition-colors ${
                                isHidden ? 'opacity-40 bg-black/40' : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-semibold text-white text-sm">
                                    {m.name}
                                  </span>
                                  <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-[#c8c8c8]">
                                    {m.materialName}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-[#a1a1aa]">
                                  <span>{m.faces.toLocaleString()} Faces</span>
                                  <span>•</span>
                                  <span>{m.vertices.toLocaleString()} Verts</span>
                                  <span>•</span>
                                  <span>{m.edges.toLocaleString()} Edges</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => isolateMesh(m.uuid)}
                                  className="rounded-xl border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#c8c8c8] hover:bg-white/10 hover:text-white transition-all"
                                  title="Isolate this mesh"
                                >
                                  Isolate
                                </button>
                                <button
                                  onClick={() => toggleMeshVisibility(m.uuid)}
                                  className={`rounded-full p-2 transition-all ${
                                    isHidden
                                      ? 'text-[#71717a] hover:text-white'
                                      : 'text-white hover:bg-white/10'
                                  }`}
                                  title={isHidden ? 'Show mesh' : 'Hide mesh'}
                                >
                                  {isHidden ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {detailsTab === 'materials' && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#a1a1aa]">
                        Materials and shaders utilized in this 3D model:
                      </p>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {stats.materials.map((mat, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white font-mono text-xs">
                              M{i + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">{mat}</p>
                              <p className="text-xs text-[#a1a1aa]">PBR Material</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-[#a1a1aa]">
                  Extracting 3D geometry information...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-white/[0.02] px-6 py-3 flex items-center justify-between text-xs text-[#a1a1aa]">
              <span>Tip: Use Normals shading to inspect face orientations.</span>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-light !py-1.5 !px-4 !text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
