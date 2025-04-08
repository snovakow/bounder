import * as THREE from 'three';
import { Vector3 } from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as Framing from './framing.js';
import * as Env from './environment.js';

import * as Util from './util.js';

const BALL_COUNT = 1000;
const ENABLE_AMMO = false;

function init() {
	const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
	let room = null;

	let transformAux1;
	let physicsWorld;
	function initPhysics() {

		// Physics configuration

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new Ammo.btDbvtBroadphase();
		const solver = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -6, 0)); // -6

		// Create the terrain body
		const terrainMinHeight = 0;
		const terrainMaxHeight = 10;

		// const groundTransform = new Ammo.btTransform();
		// groundTransform.setIdentity();
		// Shifts the terrain, since bullet re-centers it on its bounding box.
		// groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
		// const groundMass = 0;
		// const groundLocalInertia = new Ammo.btVector3(0, 0, 0);
		// const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
		// const groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, groundLocalInertia));

		transformAux1 = new Ammo.btTransform();
	}

	const sphereRadius = 0.3;
	const positions = [];
	const physicsBodies = [];
	function generateObject(position) {
		// let threeObject = null;
		let shape = null;

		const margin = 0.0;

		// let radius, height;

		// 		// Sphere
		// 		radius = 1 + Math.random() * objectSize;
		// 		threeObject = new THREE.Mesh( new THREE.SphereGeometry( radius, 20, 20 ), createObjectMaterial() );
		shape = new Ammo.btSphereShape(sphereRadius);
		shape.setMargin(margin);

		// threeObject.position.set( ( Math.random() - 0.5 ) * terrainWidth * 0.6, terrainMaxHeight + objectSize + 2, ( Math.random() - 0.5 ) * terrainDepth * 0.6 );

		const mass = sphereRadius * sphereRadius;
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

	// scene.environment = cubeRenderTarget.texture;

	material.envMap = Env.cubeRenderTarget.texture;

	const down = new Vector3(0, -1, 0);
	Object.freeze(down);

	const meshAdd = (mesh) => {
		mesh.updateMatrixWorld();
		mesh.geometry.applyMatrix4(mesh.matrixWorld);
		mesh.position.set(0, 0, 0);
		mesh.rotation.set(0, 0, 0);
		mesh.scale.set(1, 1, 1);
		mesh.updateMatrixWorld();
		mesh.geometry.computeBoundingBox();
		mesh.geometry.computeBoundingSphere();

		mesh.userData.framing = {
			base: true
		}

		const useQuantizedAabbCompression = false;
		const buildBvh = true; // default = true
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		// const position0 = new Vector3(0, 0, 0);
		// transform.setOrigin(new Ammo.btVector3(position0.x, position0.y, position0.z));
		// transform.setRotaion(new Ammo.btQuaternion(0,0,0,1));
		const motionState = new Ammo.btDefaultMotionState(transform);
		const mass = 0;
		const localInertia = new Ammo.btVector3(0, 0, 0);
		const trimesh = new Ammo.btTriangleMesh();

		// const position = new Vector3(7.67926025390625, -5.592729568481445, 26.37653923034668);

		// node.position.setScalar(0);
		// node.scale.setScalar(1);

		// const position = node.position;
		// const scale = node.scale;
		// const quaternion = node.quaternion;
		// console.log(node)
		// node.updateMatrix();
		// node.geometry.applyMatrix4(node.matrixWorld);

		const points = mesh.geometry.attributes.position.array;
		const index = geometry.index.array;
		const v0 = new Vector3();
		const v1 = new Vector3();
		const v2 = new Vector3();
		for (let i = 0, len = index.length; i < len; i += 3) {
			const i0 = index[i] * 3;
			const i1 = index[i + 1] * 3;
			const i2 = index[i + 2] * 3;
			v0.set(points[i0], points[i0 + 1], points[i0 + 2]);
			v1.set(points[i1], points[i1 + 1], points[i1 + 2]);
			v2.set(points[i2], points[i2 + 1], points[i2 + 2]);

			// v0.applyMatrix4(node.matrixWorld);
			// v1.applyMatrix4(node.matrixWorld);
			// v2.applyMatrix4(node.matrixWorld);
			// v0.add(position);
			// v1.add(position);
			// v2.add(position);
			// v0.multiply(scale);
			// v1.multiply(scale);
			// v2.multiply(scale);

			const p0 = new Ammo.btVector3(v0.x, v0.y, v0.z);
			const p1 = new Ammo.btVector3(v1.x, v1.y, v1.z);
			const p2 = new Ammo.btVector3(v2.x, v2.y, v2.z);
			trimesh.addTriangle(p0, p1, p2);
		}

		const trimeshShape = new Ammo.btBvhTriangleMeshShape(trimesh, useQuantizedAabbCompression, buildBvh);
		trimeshShape.setMargin(0);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, trimeshShape, localInertia);
		const roomBody = new Ammo.btRigidBody(rbInfo);
		physicsWorld.addRigidBody(roomBody);
	}

	const localForward = new Vector3(0, 0, -1);
	new GLTFLoader()
		.setPath('include/models/gltf/')
		.load('collision-world.glb', function (gltf) {
			room = gltf.scene.children[0];
			// room.position.y = -10;
			// room.scale.setScalar(1);
			const node = room;
			node.userData.framing = {
				base: true
			}
			if (node.material) {
				if (node.material.map) node.material.map.anisotropy = Env.renderer.capabilities.getMaxAnisotropy();
				node.material.envMapIntensity = 0.3;
				node.material.envMap = Env.cubeRenderTarget.texture;
			}

			if (node.isMesh) {
				node.castShadow = true;
				node.receiveShadow = true;
			}

			node.updateMatrixWorld();
			node.geometry.applyMatrix4(node.matrixWorld);

			node.position.set(0, 0, 0);
			node.rotation.set(0, 0, 0);
			node.scale.set(1, 1, 1);
			node.updateMatrix();
			node.geometry.computeBoundingBox();
			node.geometry.computeBoundingSphere();

			Env.scene.add(room);

			if (ENABLE_AMMO) {
				initPhysics();
				// physicsWorld.addRigidBody(groundBody);
				for (let i = 0; i < BALL_COUNT; i++) {
					const position = positions[i];
					physicsBodies[i] = generateObject(position);
				}

				meshAdd(room);

				/*
				const groundMass = 0;
				const groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
				const groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
				const groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
				physicsWorld.addRigidBody( groundBody );
				*/

				const triScale = 5;
				// const roomBody = meshAdd(room);
				const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
				const material = new THREE.MeshBasicMaterial({ color: 0x7f7f00, side: THREE.FrontSide });
				const plane = new THREE.Mesh(geometry, material);

				plane.scale.multiplyScalar(triScale);
				plane.position.y = 0;
				plane.rotation.x = -90 * Util.degToRad;

				// Env.scene.add(plane);
				// meshAdd(plane);
			}

			Env.camera.position.x = 0;
			Env.camera.position.y = 10;
			Env.camera.position.z = 0;

			const raycaster = new THREE.Raycaster(Env.camera.position, down);
			const intersects = raycaster.intersectObject(room);
			const hit = intersects[0];
			if (hit) {
				Env.camera.position.copy(hit.point);
				Env.camera.position.y += 1.6;
			}
			Env.controls.target.copy(localForward);
		});

	const geometry = new THREE.SphereGeometry(sphereRadius, 24, 12);

	const mesh = new THREE.InstancedMesh(geometry, material, BALL_COUNT);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
	Env.scene.add(mesh);

	const dummy = new THREE.Object3D();

	const sqRoot = Math.pow(BALL_COUNT, 0.5);
	for (let i = 0; i < BALL_COUNT; i++) {
		const x = i % sqRoot - sqRoot * 0.5;
		const y = 17 + Math.random() * 10;
		const z = Math.floor(i / sqRoot) - sqRoot * 0.5;

		const position = new Vector3(x * 1, y, z * 1);

		positions[i] = position;


		dummy.position.copy(position);
		dummy.updateMatrixWorld();
		mesh.setMatrixAt(i, dummy.matrixWorld);
	}

	const updateCollision = () => {
		if (!room) return;
		for (let i = 0; i < BALL_COUNT; i++) {
			const position = positions[i];

			dummy.position.copy(position);
			dummy.updateMatrixWorld();
			mesh.setMatrixAt(i, dummy.matrixWorld);
		}
		mesh.instanceMatrix.needsUpdate = true;
		mesh.computeBoundingBox();
		mesh.computeBoundingSphere();
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

	gui.add(Env.light.shadow, 'radius', 0, 2).name('shadow radius');
	gui.add(Env.light.shadow, 'normalBias', 0, 0.1).name('shadow normalBias');

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
	gui.add(Env.sunAngle, 'phi', -90, 90).name('Sun phi');
	gui.add(Env.sunAngle, 'theta', -180, 180).name('Sun theta');

	gui.add(Env.sky.material.uniforms.turbidity, 'value', 0, 20).name('turbidity').onChange(() => {
		Env.cubeCamera.update(Env.renderer, skyScene);
	});
	gui.add(Env.sky.material.uniforms.rayleigh, 'value', 0, 4).name('rayleigh').onChange(() => {
		Env.cubeCamera.update(Env.renderer, skyScene);
	});
	gui.add(Env.sky.material.uniforms.mieCoefficient, 'value', 0, 0.1).name('mieCoefficient').onChange(() => {
		Env.cubeCamera.update(Env.renderer, skyScene);
	});
	gui.add(Env.sky.material.uniforms.mieDirectionalG, 'value', 0, 1).name('mieDirectionalG').onChange(() => {
		Env.cubeCamera.update(Env.renderer, skyScene);
	});

	gui.add(Env.light, 'intensity', 0, 1).name('intensity');

	gui.add(Env.light.shadow, 'bias', -0.001, 0).name('bias');
	gui.add(Env.renderer, 'toneMappingExposure', 0, 1).name('toneMappingExposure');

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
	gui.add(Env.renderer, 'toneMapping', toneMappingFormats).name('toneMapping');

	let previousTime = 0;
	const animate = (msTime) => {
		if (previousTime === 0) {
			previousTime = msTime;
		}
		const deltaTime = msTime - previousTime;
		previousTime = msTime;

		if (ENABLE_AMMO) {
			updatePhysics(deltaTime * 0.001);
			updateCollision();
		}

		Env.render(deltaTime);
	}
	Env.renderer.setAnimationLoop(animate);

	const floorArea = new Framing.FrameArray();
	const addPoint = (position) => {
		const radius = 0.1;
		const lineRadius = radius * 0.25;
		const geometry = new THREE.SphereGeometry(radius, 18, 9);

		const sphere = new THREE.Mesh(geometry, material);
		sphere.userData.framing = {
			node: true,
			rep: sphere,
		}

		sphere.position.copy(position);
		// sphere.castShadow = true;
		sphere.receiveShadow = true;
		Env.scene.add(sphere);

		if (floorArea.length > 0) {
			const previous = floorArea[floorArea.length - 1];

			const cylinderGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, 1, 9, 1, true);
			const cylinder = new THREE.Mesh(cylinderGeometry, material);
			cylinder.userData.framing = {
				link: true,
				node: false,
			};
			cylinder.receiveShadow = true;

			Framing.placeLink(cylinder, previous, sphere);

			Env.scene.add(cylinder);
			floorArea.push(cylinder);
		}
		floorArea.push(sphere);
	}

	const moveFramingNode = (framingNode, position) => {
		const focused = floorArea.focusNode(framingNode);
		if (!focused) return;

		framingNode.position.copy(position);
		const prevNode = floorArea.prevNode();
		if (prevNode) Framing.placeLink(floorArea.prevLink(), prevNode, framingNode);
		const nextNode = floorArea.nextNode();
		if (nextNode) Framing.placeLink(floorArea.nextLink(), framingNode, nextNode);
	}

	const collisionDetect = (event) => {
		const pointer = new THREE.Vector2();
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(pointer, Env.camera);
		const intersects = raycaster.intersectObjects(Env.scene.children);
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
				let triggered = false;
				if (hit.object.userData.framing.node) {
					triggered = true;
				}
				if (hit.object.userData.framing.link) {
					const intersects = collisionDetect(event);
					const hit = intersects[0];
					if (hit) {
						addPoint(hit.point, hit.object.userData.framing.rep);
						triggered = true;
					}
				}
				if (triggered) {
					selectedFrameNode = hit.object.userData.framing.rep;
					Env.controls.enabled = false;
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
		Env.controls.enabled = true;
		selectedFrameNode = null;
		mouseDown = false;
		dragging = false;
	}
	Env.renderer.domElement.addEventListener('mousedown', mousedownEvent);
	window.addEventListener('mousemove', mousemoveEvent);
	window.addEventListener('mouseup', mouseupEvent);

	const keydown = (event) => {
		const dir = new Vector3();
		const speed = 1;
		if (event.code === "KeyW") {
			dir.z -= speed;
		}
		else if (event.code === "KeyS") {
			dir.z += speed;
		}
		else if (event.code === "KeyA") {
			dir.x -= speed;
		}
		else if (event.code === "KeyD") {
			dir.x += speed;
		} else {
			return;
		}

		Env.camera.localToWorld(dir);
		dir.y = Env.camera.position.y;

		Env.camera.position.copy(dir);

		const raycaster = new THREE.Raycaster(Env.camera.position, down);
		const intersects = raycaster.intersectObject(room);
		const hit = intersects[0];
		if (hit) {
			Env.camera.position.y = 1.6 + hit.point.y + 10;
			// camera.rotation.x=1;
			// camera.rotation.y=1;
			// camera.rotation.z=1;
			// controls.update();
		}

		const direction = new Vector3();
		Env.camera.getWorldDirection(direction);
		direction.y = 0;
		direction.add(Env.camera.position);

		Env.controls.target.copy(direction);
	}
	window.addEventListener('keydown', keydown);
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
} else {
	init();
}
