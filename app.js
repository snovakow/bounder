import * as THREE from 'three';
import { Vector3 } from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, stats;

let controls;

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
	camera.position.z = 5;
	camera.position.y = 20;
	camera.lookAt(new Vector3(0, 0, 0));

	scene = new THREE.Scene();

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

	light.position.set(50, 100, 50);
	scene.add(light);

	const material = new THREE.MeshNormalMaterial();
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
	new GLTFLoader()
		.setPath('include/models/gltf/')
		.load('collision-world.glb', function (gltf) {
			room = gltf.scene;
			// room.position.y = -10;
			// room.scale.setScalar(10);
			room.traverse((node) => {
				if (node.material?.map) node.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();

				if (node.isMesh) {
					node.castShadow = true;
					node.receiveShadow = true;
				}
			});

			// room.receiveShadow = true;
			// room.castShadow = true;

			scene.add(room);

			initPhysics(room);

			for (let i = 0; i < 1000; i++) {
				const position = positions[i];
				physicsBodies[i] = generateObject(position);
			}
		});

	new RGBELoader()
		.setPath('include/textures/equirectangular/')
		.load('quarry_01_1k.hdr', function (texture) {

			texture.mapping = THREE.EquirectangularReflectionMapping;

			scene.background = texture;
			scene.environment = texture;

			// material.envMap = texture;
		});

	controls = new OrbitControls(camera, renderer.domElement);
	// controls.autoRotate = true;

	const geometry = new THREE.SphereGeometry(0.4, 24, 12);

	const mesh = new THREE.InstancedMesh(geometry, material, 1000);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
	scene.add(mesh);

	const dummy = new THREE.Object3D();

	for (let i = 0; i < 1000; i++) {
		const x = i % 25;
		const y = 5 + Math.random() * 10;
		const z = Math.floor(i / 25);

		const position = new Vector3(x * 1, y, z * 1);

		positions[i] = position;


		dummy.position.copy(position);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);

	}

	const down = new Vector3(0, -1, 0);

	const raycaster = new THREE.Raycaster();
	const updateCollision = () => {
		if (!room) return;
		for (let i = 0; i < 1000; i++) {
			const position = positions[i];

			dummy.position.copy(position);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);


			// raycaster.set(position, down);
			// const intersects = raycaster.intersectObject(room);

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

	gui.add(light.shadow.camera, 'left', -1000, 0).name('left');
	// gui.add(light.shadow.camera, 'right', 0, 1000).name('right');
	// gui.add(light.shadow.camera, 'top',  0, 1000).name('top');
	// gui.add(light.shadow.camera, 'bottom', -1000, 0).name('bottom');
	// light.shadow.camera.near = 1;
	// light.shadow.camera.far = 1000;
	// light.shadow.mapSize.x = 4096;
	// light.shadow.mapSize.y = 4096;

	gui.add(light.position, 'x', -1000, 1000).name('Light X');
	gui.add(light.position, 'y', -1000, 1000).name('Light Y');
	gui.add(light.position, 'z', -1000, 1000).name('Light Z');

	gui.add(light, 'intensity', 0, 1).name('intensity');

	gui.add(light.shadow, 'bias', -0.001, 0).name('bias');
	gui.add(light.shadow.camera, 'near', 0, 2).name('near');
	gui.add(renderer, 'toneMappingExposure', 0, 1).name('exposure');

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

	renderer.toneMapping = THREE.ReinhardToneMapping; //ReinhardToneMapping  LinearToneMapping ACESFilmicToneMapping
	renderer.toneMappingExposure = 1;


	let previousTime = 0;
	const animate = (msTime) => {
		if (previousTime === 0) {
			previousTime = msTime;
			return;
		}
		const deltaTime = msTime - previousTime;
		previousTime = msTime;

		controls.update();

		// updatePhysics(deltaTime);
		// updateCollision();

		renderer.render(scene, camera);

		stats.update();

	}
	renderer.setAnimationLoop(animate);
}

const script = document.createElement('script');
script.onload = function () {
	Ammo().then(function (AmmoLib) {
		// Ammo = AmmoLib;

		init();

	});

	// init();
};
script.src = './include/ammo.wasm.js';

document.head.appendChild(script); //or something of the likes
