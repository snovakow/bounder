import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

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

	new RGBELoader()
		.setPath('textures/equirectangular/')
		.load('quarry_01_1k.hdr', function (texture) {

			texture.mapping = THREE.EquirectangularReflectionMapping;

			scene.background = texture;
			scene.environment = texture;

			material.envMap = texture;
		});

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

	const floor = new THREE.Mesh(new THREE.PlaneGeometry(), material);
	floor.scale.setScalar(100);
	floor.position.y = -30;
	floor.rotation.x = -Math.PI * 0.5;
	scene.add(floor);

	controls = new OrbitControls(camera, renderer.domElement);
	// controls.autoRotate = true;

	{
		class CustomSinCurve extends THREE.Curve {

			constructor(scale = 1) {
				super();
				this.scale = scale;
			}

			getPoint(t, optionalTarget = new THREE.Vector3()) {

				const tx = t * 3 - 1.5;
				const ty = Math.sin(2 * Math.PI * t);
				const tz = 0;

				return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
			}
		}

		const path = new CustomSinCurve(10);
		const geometry = new THREE.TubeGeometry(path, 20, 2, 8, false);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);
	}
	{
		const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const torusKnot = new THREE.Mesh(geometry, material);
		scene.add(torusKnot);
		torusKnot.position.y = 30;
	}
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
