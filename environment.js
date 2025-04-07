import {
    Vector3,
    Scene, WebGLRenderer, PerspectiveCamera, DirectionalLight, WebGLCubeRenderTarget, HalfFloatType, CubeCamera,
    NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping,
} from 'three';
import * as Util from './util.js';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

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

const sunAngle = {
    phi: 45,
    theta: 90,
};
const sunAnglePrev = { ...sunAngle };
const sky = new Sky();
sky.scale.setScalar(100);
const sunPosition = new Vector3().setFromSphericalCoords(1, sunAngle.phi * Util.degToRad, sunAngle.theta * Util.degToRad);
sky.material.uniforms.sunPosition.value = sunPosition;
const skyScene = new Scene();
skyScene.add(sky);

const light = new DirectionalLight(0xffffff, 1);
light.castShadow = true;
const dLight = 1000;
const sLight = dLight * 0.25;
light.shadow.camera.left = - sLight;
light.shadow.camera.right = sLight;
light.shadow.camera.top = sLight;
light.shadow.camera.bottom = - sLight;

// light.shadow.camera.near = dLight / 30;
// light.shadow.camera.far = dLight;
light.shadow.camera.near = 0.3;
light.shadow.camera.far = 1000;

light.shadow.bias = -0.0001;
light.shadow.mapSize.x = 4096;
light.shadow.mapSize.y = 4096;

light.position.copy(sunPosition);
light.position.setLength(10);
scene.add(light);

const cubeRenderTarget = new WebGLCubeRenderTarget(2048);
cubeRenderTarget.texture.type = HalfFloatType;

const cubeCamera = new CubeCamera(camera.near, camera.far, cubeRenderTarget);
cubeCamera.update(renderer, skyScene);
scene.background = cubeRenderTarget.texture;

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

    if (sunAngle.phi !== sunAnglePrev.phi || sunAngle.theta !== sunAnglePrev.theta) {
        sunPosition.setFromSphericalCoords(1, sunAngle.phi * Util.degToRad, sunAngle.theta * Util.degToRad);
        light.position.copy(sunPosition);
        light.position.setLength(10);
        // sky.material.uniforms.sunPosition.value.copy(sunPosition);

        sunAnglePrev.phi = sunAngle.phi;
        sunAnglePrev.theta = sunAngle.theta;

        cubeCamera.update(renderer, skyScene);
    }

    renderer.render(scene, camera);

    stats.update();
}

export {
    sunAngle, sky, skyScene, light, cubeRenderTarget, cubeCamera,
    camera, scene, renderer, controls, render,
};