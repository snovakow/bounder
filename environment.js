import {
    Vector3,
    Scene, WebGLRenderer, PerspectiveCamera,
    NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping,
} from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stats = new Stats();

const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.3, 1000);

const scene = new Scene();

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = NeutralToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;

renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

const controls = new OrbitControls(camera, renderer.domElement);

document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom);

const windowResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', windowResize);

const render = (deltaTime) => {
    if (renderer.getPixelRatio() !== window.devicePixelRatio) renderer.setPixelRatio(window.devicePixelRatio);

    controls.update(deltaTime);

    renderer.render(scene, camera);

    stats.update();
}

export {
    camera, scene, renderer, controls, render
};