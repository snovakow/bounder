import * as THREE from 'three';
import { Vector3 } from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { Sky } from 'three/addons/objects/Sky.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BALL_COUNT = 100;
const degToRad = Math.PI / 180;
const radToDeg = 180 / Math.PI;

let camera, scene, stats, controls;

const ENABLE_AMMO = false;

function init() {
	const onWindowResized = () => {
		renderer.setSize(window.innerWidth, window.innerHeight);

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.toneMappingExposure = 1;

	document.body.appendChild(renderer.domElement);

	renderer.domElement.style.position = 'fixed';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';

	renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.BasicShadowMap;

	window.addEventListener('resize', onWindowResized);

	stats = new Stats();
	document.body.appendChild(stats.dom);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);

	scene = new THREE.Scene();

	const sunAngle = {
		phi: 45,
		theta: 180,
	};
	const sunAnglePrev = { ...sunAngle };
	const sky = new Sky();
	sky.scale.setScalar(100);

	const sunPosition = new Vector3().setFromSphericalCoords(1, sunAngle.phi * degToRad, sunAngle.theta * degToRad);
	sky.material.uniforms.sunPosition.value = sunPosition;

	scene.add(sky);

	// const hemisphereLight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
	// scene.add( hemisphereLight );

	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.castShadow = true;
	const dLight = 1000;
	const sLight = dLight * 0.25;
	light.shadow.camera.left = - sLight;
	light.shadow.camera.right = sLight;
	light.shadow.camera.top = sLight;
	light.shadow.camera.bottom = - sLight;

	// light.shadow.camera.near = dLight / 30;
	// light.shadow.camera.far = dLight;
	light.shadow.camera.near = 1;
	light.shadow.camera.far = 1000;

	light.shadow.bias = -0.0001;
	light.shadow.mapSize.x = 4096;
	light.shadow.mapSize.y = 4096;

	light.position.copy(sunPosition);
	light.position.setLength(10);

	scene.add(light);

	const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
	let room = null;

	let transformAux1;
	let physicsWorld;
	function initPhysics(groundShape) {

		// Physics configuration

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new Ammo.btDbvtBroadphase();
		const solver = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -6, 0));

		// Create the terrain body
		const terrainMinHeight = 0;
		const terrainMaxHeight = 10;

		const groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		// Shifts the terrain, since bullet re-centers it on its bounding box.
		groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
		const groundMass = 0;
		const groundLocalInertia = new Ammo.btVector3(0, 0, 0);
		const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
		const groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, groundLocalInertia));
		physicsWorld.addRigidBody(groundBody);

		transformAux1 = new Ammo.btTransform();

	}

	const positions = [];
	const physicsBodies = [];
	function generateObject(position) {
		// let threeObject = null;
		let shape = null;

		const objectSize = 0.4;
		const margin = 0.05;

		// let radius, height;

		// 		// Sphere
		// 		radius = 1 + Math.random() * objectSize;
		// 		threeObject = new THREE.Mesh( new THREE.SphereGeometry( radius, 20, 20 ), createObjectMaterial() );
		shape = new Ammo.btSphereShape(0.4);
		shape.setMargin(margin);

		// threeObject.position.set( ( Math.random() - 0.5 ) * terrainWidth * 0.6, terrainMaxHeight + objectSize + 2, ( Math.random() - 0.5 ) * terrainDepth * 0.6 );

		const mass = objectSize * 5;
		const localInertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
		const motionState = new Ammo.btDefaultMotionState(transform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		const body = new Ammo.btRigidBody(rbInfo);
		physicsBodies.push(body);
		// threeObject.userData.physicsBody = body;

		// threeObject.receiveShadow = true;
		// threeObject.castShadow = true;

		// scene.add(threeObject);
		// dynamicObjects.push(threeObject);

		physicsWorld.addRigidBody(body);
		return body;
	}

	const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(2048);
	cubeRenderTarget.texture.type = THREE.HalfFloatType;

	const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
	cubeCamera.update(renderer, scene);
	scene.background = cubeRenderTarget.texture;
	// scene.environment = cubeRenderTarget.texture;

	material.envMap = cubeRenderTarget.texture;

	scene.remove(sky);

	const down = new Vector3(0, -1, 0);
	const up = new Vector3(0, 1, 0);
	new GLTFLoader()
		.setPath('include/models/gltf/')
		.load('collision-world.glb', function (gltf) {
			room = gltf.scene;
			// room.position.y = -10;
			room.scale.setScalar(1);
			room.traverse((node) => {
				node.userData.framing = {
					base: true
				}
				if (node.material) {
					if (node.material.map) node.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
					node.material.envMapIntensity = 0.3;
					node.material.envMap = cubeRenderTarget.texture;
				}

				if (node.isMesh) {
					node.castShadow = true;
					node.receiveShadow = true;
				}
			});

			scene.add(room);

			if (ENABLE_AMMO) {
				initPhysics(room);
				for (let i = 0; i < BALL_COUNT; i++) {
					const position = positions[i];
					physicsBodies[i] = generateObject(position);
				}
			}

			camera.position.x = 0;
			camera.position.y = 20;
			camera.position.z = 0;

			controls = new OrbitControls(camera, renderer.domElement);

			const raycaster = new THREE.Raycaster(camera.position, down);
			const intersects = raycaster.intersectObject(room);
			const hit = intersects[0];
			if (hit) {
				camera.position.copy(hit.point);
				camera.position.y += 1.6;
				// camera.rotation.x=1;
				// camera.rotation.y=1;
				// camera.rotation.z=1;
				// controls.update();
			}
			controls.target.set(0, 0, -1);

		});

	const geometry = new THREE.SphereGeometry(0.4, 24, 12);

	const mesh = new THREE.InstancedMesh(geometry, material, BALL_COUNT);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
	scene.add(mesh);

	const dummy = new THREE.Object3D();

	const sqRoot = Math.pow(BALL_COUNT, 0.5);
	for (let i = 0; i < BALL_COUNT; i++) {
		const x = i % sqRoot;
		const y = 5 + Math.random() * 10;
		const z = Math.floor(i / sqRoot);

		const position = new Vector3(x * 1, y, z * 1);

		positions[i] = position;


		dummy.position.copy(position);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);

	}

	const updateCollision = () => {
		if (!room) return;
		for (let i = 0; i < BALL_COUNT; i++) {
			const position = positions[i];

			dummy.position.copy(position);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}

	function updatePhysics(deltaTime) {
		if (!physicsWorld) return;
		if (!room) return;

		physicsWorld.stepSimulation(deltaTime, 10);

		// Update objects
		for (let i = 0, il = positions.length; i < il; i++) {

			const position = positions[i];
			const objPhys = physicsBodies[i];
			const ms = objPhys.getMotionState();
			if (ms) {

				ms.getWorldTransform(transformAux1);
				const p = transformAux1.getOrigin();
				const q = transformAux1.getRotation();
				position.set(p.x(), p.y(), p.z());

				// objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

			}

		}

	}

	const gui = new GUI();

	gui.add(light.shadow, 'radius', 0, 2).name('shadow radius');
	gui.add(light.shadow, 'normalBias', 0, 0.1).name('shadow normalBias');

	// gui.add(light.shadow.camera, 'left', -1000, 0).name('left');
	// gui.add(light.shadow.camera, 'right', 0, 1000).name('right');
	// gui.add(light.shadow.camera, 'top',  0, 1000).name('top');
	// gui.add(light.shadow.camera, 'bottom', -1000, 0).name('bottom');
	// light.shadow.camera.near = 1;
	// light.shadow.camera.far = 1000;
	// light.shadow.mapSize.x = 4096;
	// light.shadow.mapSize.y = 4096;

	// gui.add(light.position, 'x', -1000, 1000).name('Light X');
	// gui.add(light.position, 'y', -1000, 1000).name('Light Y');
	// gui.add(light.position, 'z', -1000, 1000).name('Light Z');
	gui.add(sunAngle, 'phi', -90, 90).name('Sun phi');
	gui.add(sunAngle, 'theta', -180, 180).name('Sun theta');

	gui.add(sky.material.uniforms.turbidity, 'value', 0, 20).name('turbidity');
	gui.add(sky.material.uniforms.rayleigh, 'value', 0, 4).name('rayleigh');
	gui.add(sky.material.uniforms.mieCoefficient, 'value', 0, 0.1).name('mieCoefficient');
	gui.add(sky.material.uniforms.mieDirectionalG, 'value', 0, 1).name('mieDirectionalG');

	gui.add(light, 'intensity', 0, 1).name('intensity');

	gui.add(light.shadow, 'bias', -0.001, 0).name('bias');
	gui.add(renderer, 'toneMappingExposure', 0, 1).name('toneMappingExposure');

	// const shadowMapTypes = {
	// 	BasicShadowMap: THREE.BasicShadowMap,
	// 	PCFShadowMap: THREE.PCFShadowMap,
	// 	PCFSoftShadowMap: THREE.PCFSoftShadowMap,
	// 	VSMShadowMap: THREE.VSMShadowMap,
	// };
	// gui.add(renderer.shadowMap, 'type', shadowMapTypes).name('shadowMap').onChange = ()=>{
	// 	renderer.shadowMap.needsUpdate = true;
	// };

	const toneMappingFormats = {
		NoToneMapping: THREE.NoToneMapping,
		LinearToneMapping: THREE.LinearToneMapping,
		ReinhardToneMapping: THREE.ReinhardToneMapping,
		CineonToneMapping: THREE.CineonToneMapping,
		ACESFilmicToneMapping: THREE.ACESFilmicToneMapping,
		AgXToneMapping: THREE.AgXToneMapping,
		NeutralToneMapping: THREE.NeutralToneMapping,
	};
	gui.add(renderer, 'toneMapping', toneMappingFormats).name('toneMapping');

	let previousTime = 0;
	const animate = (msTime) => {
		if (previousTime === 0) {
			previousTime = msTime;
			return;
		}
		const deltaTime = msTime - previousTime;
		previousTime = msTime;

		if (controls) controls.update(deltaTime);

		if (sunAngle.phi !== sunAnglePrev.phi || sunAngle.theta !== sunAnglePrev.theta) {
			sunPosition.setFromSphericalCoords(1, sunAngle.phi * degToRad, sunAngle.theta * degToRad);
			light.position.copy(sunPosition);
			light.position.setLength(10);
			// sky.material.uniforms.sunPosition.value.copy(sunPosition);

			sunAnglePrev.phi = sunAngle.phi;
			sunAnglePrev.theta = sunAngle.theta;
		}

		if (ENABLE_AMMO) {
			updatePhysics(deltaTime);
			updateCollision();
		}

		renderer.render(scene, camera);

		stats.update();

	}
	renderer.setAnimationLoop(animate);

	const placeLink = (link, node1, node2) => {
		const ray = node1.node.position.clone();
		ray.sub(node2.node.position);

		const unitRay = ray.clone().normalize();
		ray.multiplyScalar(0.5);

		link.quaternion.setFromUnitVectors(up, unitRay);
		link.position.copy(node2.node.position);
		link.position.add(ray);

		link.scale.y = node2.node.position.distanceTo(node1.node.position);
	}

	class FrameSeg {
		constructor(object, link) {
			this.node = object;
			this.link = link;
			Object.freeze(this);
		}
	}
	class FrameNode {
		constructor(object) {
			this.node = object;
			this.nextSeg = null;
			this.prevSeg = null;
			Object.seal(this);
		}
	}
	class FrameData {
		constructor(node) {
			this.node = true;
			this.rep = node;
			Object.freeze(this);
		}
	}

	const floorArea = [];
	const addPoint = (position) => {
		const radius = 0.1;
		const lineRadius = radius * 0.25;
		const geometry = new THREE.SphereGeometry(radius, 18, 9);

		const sphere = new THREE.Mesh(geometry, material);
		const add = new FrameNode(sphere);
		sphere.userData.framing = new FrameData(add);

		sphere.position.copy(position);
		// sphere.castShadow = true;
		sphere.receiveShadow = true;
		scene.add(sphere);

		if (floorArea.length > 0) {
			const previous = floorArea[floorArea.length - 1];
			const previousPoint = previous.node.position;

			const cylinderGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, 1, 9, 1, true);
			const cylinder = new THREE.Mesh(cylinderGeometry, material);
			cylinder.userData.framing = {
				node: false,
			};
			cylinder.receiveShadow = true;

			placeLink(cylinder, previous, add);
			previous.nextSeg = new FrameSeg(add.node, cylinder);
			add.prevSeg = new FrameSeg(previous.node, cylinder);

			scene.add(cylinder);
		}
		floorArea.push(add);
	}

	const moveFramingNode = (framingNode, position) => {
		framingNode.node.position.copy(position);
		if (framingNode.prevSeg) {
			placeLink(framingNode.prevSeg.link, framingNode.prevSeg, framingNode);
		}
		if (framingNode.nextSeg) {
			placeLink(framingNode.nextSeg.link, framingNode, framingNode.nextSeg);
		}
		if (framingNode.prevSeg && framingNode.nextSeg) {
			placeLink(framingNode.prevSeg.link, framingNode.prevSeg, framingNode);
			placeLink(framingNode.nextSeg.link, framingNode, framingNode.nextSeg);
		}
	}

	const collisionDetect = (event) => {
		const pointer = new THREE.Vector2();
		const raycaster = new THREE.Raycaster(camera.position, down);

		pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		const framingHits = [];
		for (const hit of intersects) {
			if (hit.object.userData.framing) framingHits.push(hit);
		}

		return framingHits;
	}
	let dragging = false;
	let mouseDown = false;
	let selectedFrameNode = null;
	const mousedownEvent = (event) => {
		mouseDown = true;
		dragging = false;

		const intersects = collisionDetect(event);
		const hit = intersects[0];
		if (hit) {
			if (hit.object.userData.framing) {
				if (hit.object.userData.framing.node) {
					selectedFrameNode = hit.object.userData.framing.rep;
					controls.enabled = false;
				}
			}
		}
	}
	const mousemoveEvent = (event) => {
		if (mouseDown) dragging = true;
		event.stopPropagation();

		if (selectedFrameNode) {
			const intersects = collisionDetect(event);
			for (const hit of intersects) {
				if (hit.object.userData.framing.base) {
					moveFramingNode(selectedFrameNode, hit.point);
					break;
				}
			}
		}
	}
	const mouseupEvent = (event) => {
		if (!dragging) {
			const intersects = collisionDetect(event);
			const hit = intersects[0];
			if (hit) {
				addPoint(hit.point);
			}
		}
		controls.enabled = true;
		selectedFrameNode = null;
		mouseDown = false;
		dragging = false;
	}
	renderer.domElement.addEventListener('mousedown', mousedownEvent);
	window.addEventListener('mousemove', mousemoveEvent);
	window.addEventListener('mouseup', mouseupEvent);
}

if (ENABLE_AMMO) {
	const script = document.createElement('script');
	script.onload = function () {
		Ammo().then(function (AmmoLib) {
			// Ammo = AmmoLib;
			init();
		});
	};
	script.src = './include/ammo.wasm.js';
	document.head.appendChild(script); //or something of the likes
}

init();
