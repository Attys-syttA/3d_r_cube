import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  moveToDefinition,
  rotateVec,
  type Axis,
  type Cubie,
  type CubeState,
  type Move,
  type MoveSymbol,
  type Vec3
} from "../engine/cube";

interface CubeSceneProps {
  cube: CubeState;
  pendingMove: Move | null;
  theme: "day" | "night";
  onMove: (move: Move, options?: { record?: boolean; startGame?: boolean }) => void;
}

interface DragStart {
  x: number;
  y: number;
  cubie: Vec3;
  normal: Vec3;
  point: THREE.Vector3;
}

const CUBIE_SIZE = 0.94;
const GAP = 1.06;
const STICKER_SIZE = 0.81;
const STICKER_HIT_SIZE = 0.9;
const DRAG_THRESHOLD = 24;
const PREVIEW_ARROW_LENGTH = 1.28;
const DRAG_PLANE_EPSILON = 0.0001;

interface DragDecision {
  move: Move;
  direction: THREE.Vector3;
}

function vecToThree(vec: Vec3): THREE.Vector3 {
  return new THREE.Vector3(vec.x * GAP, vec.y * GAP, vec.z * GAP);
}

function axisVector(axis: "x" | "y" | "z"): THREE.Vector3 {
  if (axis === "x") return new THREE.Vector3(1, 0, 0);
  if (axis === "y") return new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3(0, 0, 1);
}

function vecToUnitThree(vec: Vec3): THREE.Vector3 {
  return new THREE.Vector3(vec.x, vec.y, vec.z);
}

function vectorToUnitVec(vector: THREE.Vector3): Vec3 {
  const absX = Math.abs(vector.x);
  const absY = Math.abs(vector.y);
  const absZ = Math.abs(vector.z);
  if (absX >= absY && absX >= absZ) return { x: vector.x >= 0 ? 1 : -1, y: 0, z: 0 };
  if (absY >= absX && absY >= absZ) return { x: 0, y: vector.y >= 0 ? 1 : -1, z: 0 };
  return { x: 0, y: 0, z: vector.z >= 0 ? 1 : -1 };
}

function disposeObjectTree(object: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  object.traverse((entry) => {
    if (entry instanceof THREE.Mesh) {
      geometries.add(entry.geometry);
      const material = entry.material;
      if (Array.isArray(material)) {
        material.forEach((item) => materials.add(item));
      } else {
        materials.add(material);
      }
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function clearGroup(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    disposeObjectTree(child);
  }
}

function createSticker(normal: Vec3, color: string): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.04,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(normal.x * 0.474, normal.y * 0.474, normal.z * 0.474);

  if (normal.x !== 0) {
    mesh.rotation.y = Math.PI / 2;
  } else if (normal.y !== 0) {
    mesh.rotation.x = Math.PI / 2;
  }

  if (normal.x < 0 || normal.y < 0 || normal.z < 0) {
    mesh.rotateZ(Math.PI);
  }

  return mesh;
}

function createStickerHitArea(normal: Vec3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(STICKER_HIT_SIZE, STICKER_HIT_SIZE),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.position.set(normal.x * 0.482, normal.y * 0.482, normal.z * 0.482);

  if (normal.x !== 0) {
    mesh.rotation.y = Math.PI / 2;
  } else if (normal.y !== 0) {
    mesh.rotation.x = Math.PI / 2;
  }

  if (normal.x < 0 || normal.y < 0 || normal.z < 0) {
    mesh.rotateZ(Math.PI);
  }

  return mesh;
}

function createCubie(cubie: Cubie, pickables: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.name = cubie.id;
  group.position.copy(vecToThree(cubie.position));

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.56, metalness: 0.08 })
  );
  shell.userData = {
    blocker: true
  };
  pickables.push(shell);
  group.add(shell);

  for (const sticker of cubie.stickers) {
    const hitArea = createStickerHitArea(sticker.normal);
    hitArea.userData = {
      cubie: cubie.position,
      normal: sticker.normal
    };
    pickables.push(hitArea);
    group.add(hitArea);

    const mesh = createSticker(sticker.normal, sticker.color);
    mesh.userData = {
      cubie: cubie.position,
      normal: sticker.normal,
      color: sticker.color
    };
    pickables.push(mesh);
    group.add(mesh);
  }

  return group;
}

function createPreviewArrow(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: "#f6d32d",
    emissive: "#704d00",
    emissiveIntensity: 0.18,
    roughness: 0.3,
    metalness: 0.05
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, PREVIEW_ARROW_LENGTH, 18), material);
  shaft.position.y = PREVIEW_ARROW_LENGTH / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 24), material);
  head.position.y = PREVIEW_ARROW_LENGTH + 0.18;
  group.add(shaft, head);
  group.visible = false;
  return group;
}

function orientArrow(group: THREE.Group, direction: THREE.Vector3): void {
  const from = new THREE.Vector3(0, 1, 0);
  const to = direction.clone().normalize();
  group.quaternion.setFromUnitVectors(from, to);
}

function dragAnchor(start: DragStart): THREE.Vector3 {
  const faceOffset = new THREE.Vector3(start.normal.x, start.normal.y, start.normal.z).multiplyScalar(0.76);
  return vecToThree(start.cubie).add(faceOffset);
}

function axisLayer(cubie: Vec3, axis: Axis): -1 | 0 | 1 {
  return cubie[axis];
}

function moveForLayer(axis: Axis, layer: -1 | 0 | 1): MoveSymbol {
  if (axis === "x") {
    if (layer === -1) return "L";
    if (layer === 0) return "M";
    return "R";
  }
  if (axis === "y") {
    if (layer === -1) return "D";
    if (layer === 0) return "E";
    return "U";
  }
  if (layer === -1) return "B";
  if (layer === 0) return "S";
  return "F";
}

function suffixForTurns(face: MoveSymbol, turns: -1 | 1): Move["suffix"] {
  return moveToDefinition({ face, suffix: "" }).turns === turns ? "" : "'";
}

function candidateAxes(normal: Vec3): Axis[] {
  if (normal.x !== 0) return ["y", "z"];
  if (normal.y !== 0) return ["x", "z"];
  return ["x", "y"];
}

function decideDrag(start: DragStart, endPoint: THREE.Vector3, dx: number, dy: number): DragDecision | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return null;
  const dragDelta = endPoint.clone().sub(start.point);
  const normal = new THREE.Vector3(start.normal.x, start.normal.y, start.normal.z);
  dragDelta.addScaledVector(normal, -dragDelta.dot(normal));
  if (dragDelta.lengthSq() < DRAG_PLANE_EPSILON) return null;
  const dragDirection = dragDelta.normalize();

  let best: DragDecision | null = null;
  let bestScore = -1;
  for (const axis of candidateAxes(start.normal)) {
    const axisUnit = axisVector(axis);
    const tangent = axisUnit.clone().cross(start.point);
    if (tangent.lengthSq() < DRAG_PLANE_EPSILON) continue;
    tangent.normalize();
    const signedScore = tangent.dot(dragDirection);
    const score = Math.abs(signedScore);
    if (score <= bestScore) continue;
    const turns: -1 | 1 = signedScore >= 0 ? 1 : -1;
    const face = moveForLayer(axis, axisLayer(start.cubie, axis));
    best = {
      move: { face, suffix: suffixForTurns(face, turns) },
      direction: tangent.multiplyScalar(turns)
    };
    bestScore = score;
  }
  return best;
}

function intersectDragPlane(start: DragStart, ray: THREE.Ray): THREE.Vector3 | null {
  const normal = new THREE.Vector3(start.normal.x, start.normal.y, start.normal.z);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, start.point);
  return ray.intersectPlane(plane, new THREE.Vector3());
}

function normalFromHit(hit: THREE.Intersection<THREE.Object3D>, fallback?: Vec3): Vec3 | null {
  if (fallback) return fallback;
  if (!hit.face) return null;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return vectorToUnitVec(hit.face.normal.clone().applyNormalMatrix(normalMatrix));
}

function isVisibleFacingHit(hit: THREE.Intersection<THREE.Object3D>, normal: Vec3, ray: THREE.Ray): boolean {
  const worldNormal = vecToUnitThree(normal).normalize();
  return worldNormal.dot(ray.direction) < -0.05 && hit.distance > 0;
}

export function CubeScene({ cube, pendingMove, theme, onMove }: CubeSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubeRootRef = useRef<THREE.Group | null>(null);
  const cubieRefs = useRef(new Map<string, THREE.Group>());
  const pickablesRef = useRef<THREE.Object3D[]>([]);
  const previewArrowRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const dragStartRef = useRef<DragStart | null>(null);
  const pendingRef = useRef<Move | null>(pendingMove);
  const animationStartRef = useRef<number | null>(null);
  const cubeRef = useRef(cube);

  useEffect(() => {
    cubeRef.current = cube;
  }, [cube]);

  useEffect(() => {
    pendingRef.current = pendingMove;
    if (pendingMove) {
      animationStartRef.current = performance.now();
    }
  }, [pendingMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

      const scene = new THREE.Scene();
      scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(5.3, 4.2, 6.2);
    cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4.4;
    controls.maxDistance = 10;
    controls.enablePan = false;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#ffffff", "#7c8a9a", 2.2));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight("#d7f6ff", 1.2);
    rimLight.position.set(-4, 2, -5);
    scene.add(rimLight);

    const cubeRoot = new THREE.Group();
    cubeRootRef.current = cubeRoot;
    scene.add(cubeRoot);

    const previewArrow = createPreviewArrow();
    previewArrowRef.current = previewArrow;
    scene.add(previewArrow);

    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    const render = (now: number) => {
      controls.update();
      const currentMove = pendingRef.current;
      if (currentMove && animationStartRef.current !== null) {
        const definition = moveToDefinition(currentMove);
        const progress = Math.min((now - animationStartRef.current) / 250, 1);
        const angle = definition.turns * (Math.PI / 2) * (1 - Math.cos(progress * Math.PI)) * 0.5;
        const quaternion = new THREE.Quaternion().setFromAxisAngle(axisVector(definition.axis), angle);
        for (const cubie of cubeRef.current.cubies) {
          const group = cubieRefs.current.get(cubie.id);
          if (!group || cubie.position[definition.axis] !== definition.layer) continue;
          const base = vecToThree(cubie.position);
          group.position.copy(base.applyQuaternion(quaternion));
          group.quaternion.copy(quaternion);
        }
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      clearGroup(cubeRoot);
      if (previewArrowRef.current) {
        scene.remove(previewArrowRef.current);
        disposeObjectTree(previewArrowRef.current);
        previewArrowRef.current = null;
      }
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      cubieRefs.current.clear();
      pickablesRef.current = [];
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      cubeRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = null;
  }, [theme]);

  useEffect(() => {
    const cubeRoot = cubeRootRef.current;
    if (!cubeRoot) return;
    clearGroup(cubeRoot);
    cubieRefs.current.clear();
    pickablesRef.current = [];
    for (const cubie of cube.cubies) {
      const group = createCubie(cubie, pickablesRef.current);
      cubieRefs.current.set(cubie.id, group);
      cubeRoot.add(group);
    }
  }, [cube]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return undefined;
    const canvas = renderer.domElement;

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (event: PointerEvent) => {
      setPointer(event);
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const hit = raycasterRef.current.intersectObjects(pickablesRef.current, false)[0];
      if (!hit) {
        dragStartRef.current = null;
        if (previewArrowRef.current) previewArrowRef.current.visible = false;
        return;
      }
      if ((hit.object.userData as { blocker?: boolean }).blocker) {
        dragStartRef.current = null;
        if (previewArrowRef.current) previewArrowRef.current.visible = false;
        return;
      }
      const userData = hit.object.userData as { cubie: Vec3; normal: Vec3 };
      const normal = normalFromHit(hit, userData.normal);
      if (!normal) {
        dragStartRef.current = null;
        if (previewArrowRef.current) previewArrowRef.current.visible = false;
        return;
      }
      if (!isVisibleFacingHit(hit, normal, raycasterRef.current.ray)) {
        dragStartRef.current = null;
        if (previewArrowRef.current) previewArrowRef.current.visible = false;
        return;
      }
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        cubie: userData.cubie,
        normal,
        point: hit.point.clone()
      };
      if (controlsRef.current) controlsRef.current.enabled = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      const previewArrow = previewArrowRef.current;
      if (!start || !previewArrow) return;
      setPointer(event);
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const endPoint = intersectDragPlane(start, raycasterRef.current.ray);
      const decision = endPoint ? decideDrag(start, endPoint, event.clientX - start.x, event.clientY - start.y) : null;
      if (!decision) {
        previewArrow.visible = false;
        return;
      }
      previewArrow.position.copy(dragAnchor(start));
      orientArrow(previewArrow, decision.direction);
      previewArrow.visible = true;
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (previewArrowRef.current) previewArrowRef.current.visible = false;
      if (controlsRef.current) controlsRef.current.enabled = true;
      if (!start) return;
      setPointer(event);
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const endPoint = intersectDragPlane(start, raycasterRef.current.ray);
      const decision = endPoint ? decideDrag(start, endPoint, event.clientX - start.x, event.clientY - start.y) : null;
      if (decision) {
        onMove(decision.move, { startGame: true });
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [onMove]);

  return <div className="cube-viewport" ref={containerRef} />;
}
