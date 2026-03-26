import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, CanvasTexture, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry } from 'three';
import { createFlapTexture, FLAP_CHARS } from './flapTexture';
import * as THREE from 'three';
import { playFlapSound } from './audio';

const WIDTH = 1;
const HEIGHT = 1.6;
const DEPTH = 0.04;

let sharedTextures: Record<string, { texture: CanvasTexture, cols: number, rows: number }> = {};

function getSharedTexture(theme: 'light' | 'dark', isFlat: boolean) {
  const key = `${theme}-${isFlat}`;
  if (!sharedTextures[key]) {
    const { canvas, cols, rows } = createFlapTexture(theme, isFlat);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    sharedTextures[key] = { texture: tex, cols, rows };
  }
  return sharedTextures[key];
}

function setMatUV(mat: MeshStandardMaterial | MeshBasicMaterial, charIndex: number, isTop: boolean, theme: 'light' | 'dark', isFlat: boolean) {
  const { cols, rows, texture } = getSharedTexture(theme, isFlat);
  const col = charIndex % cols;
  const row = Math.floor(charIndex / cols);
  
  const webglRow = rows - 1 - row; 
  const repeatX = 1 / cols;
  const repeatY = 0.5 / rows;

  const offsetX = col / cols;
  const yOffsetFromBottomCell = isTop ? (0.5 / rows) : 0;
  const offsetY = webglRow / rows + yOffsetFromBottomCell;

  if (!mat.map) {
    mat.map = texture.clone();
    mat.map.needsUpdate = true;
  }
  mat.map.repeat.set(repeatX, repeatY);
  mat.map.offset.set(offsetX, offsetY);
}

export function FlapModule({ targetChar, position, isGlobalFlipping, onDone, theme = 'dark', isFlat = false }: { targetChar: string, position: [number, number, number], isGlobalFlipping: boolean, onDone: () => void, theme?: 'light' | 'dark', isFlat?: boolean }) {
  const targetIndex = useMemo(() => {
    let i = FLAP_CHARS.indexOf(targetChar.toUpperCase());
    return i === -1 ? 0 : i; 
  }, [targetChar]);

  const groupRef = useRef<Group>(null);
  const flapPivotRef = useRef<Group>(null);
  
  const mats = useMemo(() => {
    const tex = getSharedTexture(theme, isFlat).texture; 
    const isLight = theme === 'light';
    const edgeColor = isLight ? 0xdddddd : 0x161616;

    if (isFlat) {
      return {
        bgTop: new MeshBasicMaterial({ color: 0xffffff, map: tex.clone() }),
        bgBtm: new MeshBasicMaterial({ color: 0xffffff, map: tex.clone() }),
        flapFront: new MeshBasicMaterial({ color: 0xffffff, map: tex.clone() }),
        flapBack: new MeshBasicMaterial({ color: 0xffffff, map: tex.clone() }),
        dark: new MeshBasicMaterial({ color: theme === 'light' ? 0xffffff : 0x111111 }) // invisible side walls
      };
    }

    return {
      bgTop: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: tex.clone() }),
      bgBtm: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: tex.clone() }),
      flapFront: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: tex.clone() }),
      flapBack: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: tex.clone() }),
      dark: new MeshStandardMaterial({ color: edgeColor, roughness: 0.9 })
    };
  }, [theme, isFlat]);

  const flapBackGeom = useMemo(() => {
    const geom = new PlaneGeometry(WIDTH, HEIGHT/2);
    const uvs = geom.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
       uvs.setXY(i, 1 - uvs.getX(i), 1 - uvs.getY(i));
    }
    geom.attributes.uv.needsUpdate = true;
    return geom;
  }, []);

  const state = useRef({
    currentIndex: 0,
    nextIndex: 0,
    progress: 0,
    isFlipping: false,
    staggerDelay: Math.random() * 0.15
  });

  const updateUVs = () => {
    const s = state.current;
    setMatUV(mats.bgTop, s.nextIndex, true, theme, isFlat);
    setMatUV(mats.bgBtm, s.currentIndex, false, theme, isFlat);
    setMatUV(mats.flapFront, s.currentIndex, true, theme, isFlat);
    setMatUV(mats.flapBack, s.nextIndex, false, theme, isFlat);
  };

  useEffect(() => {
    updateUVs();
  }, [mats]);

  useEffect(() => {
    state.current.currentIndex = 0; 
    state.current.nextIndex = 0;
    updateUVs();
  }, []);

  useEffect(() => {
    if (state.current.currentIndex === targetIndex) {
      onDone();
    }
  }, [targetIndex, onDone]);

  useFrame((_, delta) => {
    const s = state.current;
    
    if (isGlobalFlipping && !s.isFlipping && s.currentIndex !== targetIndex) {
      if (s.staggerDelay > 0) {
        s.staggerDelay -= delta;
      } else {
        s.isFlipping = true;
        s.nextIndex = (s.currentIndex + 1) % FLAP_CHARS.length;
        s.progress = 0;
        updateUVs();
      }
    }

    if (s.isFlipping) {
      let distance = (targetIndex - s.currentIndex + FLAP_CHARS.length) % FLAP_CHARS.length;
      if (distance === 0 && s.currentIndex !== targetIndex) distance = FLAP_CHARS.length; 
      
      const dynSpeed = distance > 2 ? 6.5 + Math.min(distance, 15) * 0.9 : 6.5; 
      
      s.progress += delta * dynSpeed; 
      let flipCompleted = false;

      if (s.progress >= 1) {
        s.progress = 1;
        flipCompleted = true;
      }
      
      // Physically realistic snap animation!
      const rotation = Math.PI * Math.pow(s.progress, 4); 

      if (flapPivotRef.current) {
        flapPivotRef.current.rotation.x = -rotation;
      }

      if (flipCompleted) {
        // Only play sound if NOT flat mode for a cleaner digital feel? Let's leave sound.
        playFlapSound();
        s.progress = 0;
        s.currentIndex = s.nextIndex;
        
        if (s.currentIndex === targetIndex) {
           s.isFlipping = false;
           s.staggerDelay = Math.random() * 0.15; 
           updateUVs();
           if (flapPivotRef.current) flapPivotRef.current.rotation.x = 0;
           onDone(); 
        } else {
           s.nextIndex = (s.currentIndex + 1) % FLAP_CHARS.length;
           updateUVs(); 
        }
      }
    }
  });

  const gap = 0.04;

  const createMaterials = (frontMat: MeshStandardMaterial | MeshBasicMaterial) => [
    mats.dark, mats.dark, mats.dark, mats.dark, frontMat, mats.dark
  ];

  return (
    <group position={position} ref={groupRef}>
      
      {/* Top Half Background */}
      <mesh position={[0, HEIGHT/4 + gap/2, -DEPTH]} receiveShadow={!isFlat}>
        <boxGeometry args={[WIDTH, HEIGHT/2, DEPTH * 0.5]} />
        {createMaterials(mats.bgTop).map((m, i) => <primitive object={m} attach={`material-${i}`} key={`bgTop-${i}`} />)}
      </mesh>

      {/* Bottom Half Background */}
      <mesh position={[0, -HEIGHT/4 - gap/2, -DEPTH]} receiveShadow={!isFlat}>
        <boxGeometry args={[WIDTH, HEIGHT/2, DEPTH * 0.5]} />
        {createMaterials(mats.bgBtm).map((m, i) => <primitive object={m} attach={`material-${i}`} key={`bgBtm-${i}`} />)}
      </mesh>

      <group position={[0, 0, 0]} ref={flapPivotRef}>
        <mesh position={[0, HEIGHT/4 + gap/2, 0]} castShadow={!isFlat} receiveShadow={!isFlat}>
          <boxGeometry args={[WIDTH, HEIGHT/2, 0.005]} />
          {createMaterials(mats.flapFront).map((m, i) => <primitive object={m} attach={`material-${i}`} key={`flap-${i}`} />)}
        </mesh>
        
        <mesh position={[0, HEIGHT/4 + gap/2, -0.003]} rotation={[Math.PI, 0, 0]} geometry={flapBackGeom} castShadow={!isFlat} receiveShadow={!isFlat}>
          <primitive object={mats.flapBack} attach="material" />
        </mesh>
      </group>
      
      {/* Structural Physical Elements (Cases, Axle, Stacks) */}
      {!isFlat && (
        <>
          <mesh position={[-WIDTH/2 - 0.02, 0, -DEPTH]} receiveShadow castShadow>
            <boxGeometry args={[0.04, HEIGHT + 0.1, DEPTH * 4]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          
          <mesh position={[WIDTH/2 + 0.02, 0, -DEPTH]} receiveShadow castShadow>
            <boxGeometry args={[0.04, HEIGHT + 0.1, DEPTH * 4]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>

          <mesh position={[0, 0, -DEPTH]} rotation={[0, 0, Math.PI / 2]} receiveShadow castShadow>
            <cylinderGeometry args={[0.015, 0.015, WIDTH, 8]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>

          {/* Realistic Paper Flap Stacks Limits (Louvers) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`top-stack-${i}`} position={[0, HEIGHT/2 - i * 0.04, -DEPTH * 1.5 - i * 0.02]} rotation={[-0.05 * i, 0, 0]} receiveShadow>
               <boxGeometry args={[WIDTH - 0.04, 0.005, DEPTH * 2]} />
               <meshStandardMaterial color={theme === 'light' ? 0xdddddd : 0x111111} roughness={0.9} />
            </mesh>
          ))}

          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`btm-stack-${i}`} position={[0, -HEIGHT/2 + i * 0.04, -DEPTH * 1.5 - i * 0.02]} rotation={[0.05 * i, 0, 0]} receiveShadow>
               <boxGeometry args={[WIDTH - 0.04, 0.005, DEPTH * 2]} />
               <meshStandardMaterial color={theme === 'light' ? 0xdddddd : 0x111111} roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
