import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera as OrthoCam, OrbitControls } from '@react-three/drei';
import { OrthographicCamera } from 'three';
import { FlapModule } from './FlapModule';

export const FLAP_W = 1.08;
export const FLAP_H = 1.72;
export const BEZEL_SIZE = 0.5; // Thick, realistic casing frame

const CameraAutoFit = ({ rows, cols, isFlat }: { rows: number; cols: number; isFlat?: boolean }) => {
  const { camera, size } = useThree();
  useEffect(() => {
    // Exact sizing of the entire physical board, counting the thick casing
    const boardWidth = cols * FLAP_W + (isFlat ? 0 : BEZEL_SIZE * 2);
    const boardHeight = rows * FLAP_H + (isFlat ? 0 : BEZEL_SIZE * 2);
    
    const aspect = size.width / size.height;
    const boardAspect = boardWidth / boardHeight;
    
    const cam = camera as OrthographicCamera;
    
    // Tight fullscreen edge fit
    const PADDING = 1.02;
    
    let zoom;
    if (aspect > boardAspect) {
      // Screen is wider than board -> height dictates zoom
      zoom = size.height / (boardHeight * PADDING);
    } else {
      // Screen is taller than board -> width dictates zoom
      zoom = size.width / (boardWidth * PADDING);
    }
    
    cam.zoom = zoom;
    cam.updateProjectionMatrix();
  }, [camera, size, rows, cols]);

  return null;
};

interface SplitFlapBoardProps {
  text: string;
  rows: number;
  cols: number;
  onAllDone?: () => void;
  theme?: 'light' | 'dark';
  viewMode?: '3d' | 'flat';
  flipSpeed?: number;
  stagger?: number;
  textColor?: string;
  autoRotateSpeed?: number;
}

export const SplitFlapBoard: React.FC<SplitFlapBoardProps> = ({ text, rows, cols, onAllDone, theme = 'dark', viewMode = '3d', flipSpeed = 1.0, stagger = 0.15, textColor, autoRotateSpeed = 0 }) => {
  const [targetChars, setTargetChars] = useState<string[]>([]);
  const doneCountRef = useRef(0);
  
  useEffect(() => {
    const padded = text.padEnd(rows * cols, ' ').toUpperCase();
    setTargetChars(padded.split(''));
    doneCountRef.current = 0; // Reset
  }, [text, rows, cols]);

  const handleFlapDone = () => {
    doneCountRef.current += 1;
    if (doneCountRef.current === rows * cols && onAllDone) {
      onAllDone();
    }
  };

  const isFlat = viewMode === 'flat';
  const ambientInt = isFlat ? (theme === 'light' ? 3.0 : 2.0) : (theme === 'light' ? 1.0 : 0.8);
  const dirInt = isFlat ? 0 : (theme === 'light' ? 1.5 : 2.5);

  return (
    <Canvas shadows={!isFlat} dpr={[1, 2]}>
      <color attach="background" args={[theme === 'light' ? (isFlat ? '#ffffff' : '#f4f4f5') : (isFlat ? '#000000' : '#080808')]} />
      
      <CameraAutoFit rows={rows} cols={cols} isFlat={isFlat} />
      <OrthoCam makeDefault position={[0, 0, 15]} />
      
      {!isFlat && autoRotateSpeed > 0 && (
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={autoRotateSpeed} 
          enablePan={false} 
          enableZoom={false} 
          enableRotate={true}
        />
      )}
      
      <ambientLight intensity={ambientInt} />
      
      {dirInt > 0 && (
        <directionalLight 
          position={[4, 8, 12]} 
          intensity={dirInt} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-30, 30, 20, -20, 0.1, 50]} />
        </directionalLight>
      )}

      <group>
        {!isFlat && <BoardCasing rows={rows} cols={cols} theme={theme} isFlat={isFlat} />}
        
        <group position={[
          -(cols * FLAP_W) / 2 + FLAP_W / 2, 
          (rows * FLAP_H) / 2 - FLAP_H / 2, 
          0
        ]}>
          {targetChars.map((char, index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            return (
              <FlapModule
                key={`${index}-${rows}-${cols}`}
                targetChar={char}
                position={[c * FLAP_W, -r * FLAP_H, 0]}
                isGlobalFlipping={true}
                onDone={handleFlapDone}
                theme={theme}
                isFlat={isFlat}
                flipSpeed={flipSpeed}
                stagger={stagger}
                textColor={textColor}
              />
            );
          })}
        </group>
      </group>
    </Canvas>
  );
};

const BoardCasing = ({ rows, cols, theme, isFlat }: { rows: number, cols: number, theme: string, isFlat: boolean }) => {
  const boardWidth = cols * FLAP_W;
  const boardHeight = rows * FLAP_H;
  const P = BEZEL_SIZE; 
  // Frame Extrusion
  const Z_DEPTH = isFlat ? 0.05 : 1.4;

  const matColor = theme === 'light' ? '#d4d4d8' : '#050505';
  const bgMatColor = theme === 'light' ? '#e4e4e7' : '#020202';

  return (
    <group position={[0,0,0]}>
      {/* Deep Backplate */}
      <mesh position={[0, 0, -0.6]} receiveShadow={!isFlat}>
        <boxGeometry args={[boardWidth + P*2, boardHeight + P*2, 0.4]} />
        <meshStandardMaterial color={bgMatColor} roughness={0.9} />
      </mesh>
      
      {/* Top Bezel */}
      <mesh position={[0, boardHeight/2 + P/2, Z_DEPTH/2 - 0.4]} receiveShadow={!isFlat} castShadow={!isFlat}>
        <boxGeometry args={[boardWidth + P*2, P, Z_DEPTH]} />
        <meshStandardMaterial color={matColor} roughness={0.8} />
      </mesh>
      
      {/* Bottom Bezel */}
      <mesh position={[0, -boardHeight/2 - P/2, Z_DEPTH/2 - 0.4]} receiveShadow={!isFlat} castShadow={!isFlat}>
        <boxGeometry args={[boardWidth + P*2, P, Z_DEPTH]} />
        <meshStandardMaterial color={matColor} roughness={0.8} />
      </mesh>
      
      {/* Left Bezel */}
      <mesh position={[-boardWidth/2 - P/2, 0, Z_DEPTH/2 - 0.4]} receiveShadow={!isFlat} castShadow={!isFlat}>
        <boxGeometry args={[P, boardHeight + P*2, Z_DEPTH]} />
        <meshStandardMaterial color={matColor} roughness={0.8} />
      </mesh>
      
      {/* Right Bezel */}
      <mesh position={[boardWidth/2 + P/2, 0, Z_DEPTH/2 - 0.4]} receiveShadow={!isFlat} castShadow={!isFlat}>
        <boxGeometry args={[P, boardHeight + P*2, Z_DEPTH]} />
        <meshStandardMaterial color={matColor} roughness={0.8} />
      </mesh>
    </group>
  );
};
