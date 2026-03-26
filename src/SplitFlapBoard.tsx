import { useCallback, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { FlapModule } from './FlapModule';
import * as THREE from 'three';

const FLAP_WIDTH = 1.05;
const FLAP_HEIGHT = 1.8;

function CameraAutoFit({ cols, rows }: { cols: number, rows: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    // 1.2 is a padding multiplier
    const boardW = cols * FLAP_WIDTH * 1.1; 
    const boardH = rows * FLAP_HEIGHT * 1.1;
    const aspect = size.width / size.height;
    
    // camera fov is 40
    const tanFov = Math.tan((40 / 2) * THREE.MathUtils.DEG2RAD);
    const distH = boardH / (2 * tanFov);
    const distW = boardW / (aspect * 2 * tanFov);
    
    camera.position.z = Math.max(distH, distW);
    // Give it a slightly dynamic Y position so we view exactly at board level
    camera.position.y = 0;
    camera.updateProjectionMatrix();
  }, [cols, rows, size, camera]);
  return null;
}

export function SplitFlapBoard({ 
  text, 
  rows = 6, 
  cols = 20, 
  onAllDone,
  theme = 'dark'
}: { 
  text: string, 
  rows?: number, 
  cols?: number, 
  onAllDone: () => void,
  theme?: 'light' | 'dark'
}) {
  const totalChars = rows * cols;
  const fullText = text.toUpperCase().padEnd(totalChars, ' ').substring(0, totalChars);

  const [globalFlipping, setGlobalFlipping] = useState(true);
  
  const doneRef = useRef<boolean[]>(new Array(totalChars).fill(true));
  const previousTextRef = useRef(fullText);

  useEffect(() => {
    if (fullText !== previousTextRef.current) {
      previousTextRef.current = fullText;
      doneRef.current = new Array(totalChars).fill(false);
      setGlobalFlipping(true);
    }
  }, [fullText, totalChars]);

  const handleModuleDone = useCallback((index: number) => {
    doneRef.current[index] = true;
    if (doneRef.current.every(Boolean)) {
       setGlobalFlipping(false);
       onAllDone();
    }
  }, [onAllDone]);

  const modules = [];
  const startX = -(cols * FLAP_WIDTH) / 2 + FLAP_WIDTH / 2;
  const startY = (rows * FLAP_HEIGHT) / 2 - FLAP_HEIGHT / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const char = fullText[index];
      const posX = startX + c * FLAP_WIDTH;
      const posY = startY - r * FLAP_HEIGHT;
      
      modules.push(
        <FlapModule
          key={`${r}-${c}`}
          targetChar={char}
          position={[posX, posY, 0]}
          isGlobalFlipping={globalFlipping}
          onDone={() => handleModuleDone(index)}
          theme={theme}
        />
      );
    }
  }

  return (
    <Canvas shadows camera={{ position: [0, 0, 18], fov: 40 }} dpr={[1, 2]}>
      <CameraAutoFit cols={cols} rows={rows} />
      <ambientLight intensity={theme === 'light' ? 2.5 : 1.5} />
      
      <directionalLight 
        position={[5, 10, 15]} 
        intensity={theme === 'light' ? 2.0 : 3.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-bias={-0.0005}
      />
      <pointLight position={[-10, -10, 20]} intensity={1.0} color="#ffaa00" />
      
      <group position={[0, 0, 0]}>
        {modules}
      </group>

      <Environment preset="city" />
      <ContactShadows position={[0, -6, 0]} opacity={0.5} scale={40} blur={2} far={10} />
      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
      />
    </Canvas>
  );
}
