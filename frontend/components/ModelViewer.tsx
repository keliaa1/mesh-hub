"use client";

import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { getAuthToken } from '@/lib/api/client';

function Model({ url }: { url: string }) {
  // Pass auth token if needed, but useGLTF doesn't easily support custom headers for fetch natively.
  // Actually, useGLTF takes a URL. For authenticated blobs, it's better to fetch as blob first.
  // We'll assume the URL passed is a blob URL created by the parent component.
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }: { url: string }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
      <color attach="background" args={['#0b0b0c']} />
      <Suspense fallback={null}>
        {/* environment={null} avoids fetching an HDRI from the drei-assets CDN at runtime,
            which was causing 503 errors. Lighting comes from Stage's built-in lights. */}
        <Stage environment={null} intensity={0.8} shadows>
          <Model url={url} />
        </Stage>
      </Suspense>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
