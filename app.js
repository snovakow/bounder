import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer, stats;
let material;

let controls;

init();

function init() {

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	document.body.appendChild(renderer.domElement);

	renderer.domElement.style.position = 'fixed';
	renderer.domElement.style.top = '0px';
	renderer.domElement.style.left = '0px';
	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';

	window.addEventListener('resize', onWindowResized);

	stats = new Stats();
	document.body.appendChild(stats.dom);

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.z = 75;

	scene = new THREE.Scene();
	scene.rotation.y = 0.5; // avoid flying objects occluding the sun

	material = new THREE.MeshPhysicalMaterial({
		transmission: 1.0,
		thickness: 1.0,
		ior: 1.0,
		roughness: 0.0,
		metalness: 0.0,
		transparent: true
	});

	const gui = new GUI();
	gui.add(material, 'transmission', 0, 1);
	gui.add(material, 'metalness', 0, 1);
	gui.add(material, 'roughness', 0, 1);
	gui.add(material, 'ior', 0, 2);
	gui.add(material, 'thickness', 0, 5);
	gui.add(renderer, 'toneMappingExposure', 0, 2).name('exposure');

	controls = new OrbitControls(camera, renderer.domElement);
	// controls.autoRotate = true;
}

function onWindowResized() {

	renderer.setSize(window.innerWidth, window.innerHeight);

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

}

function animate(msTime) {
	controls.update();

	renderer.render(scene, camera);

	stats.update();

}
