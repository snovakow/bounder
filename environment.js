import {
    Vector3, MeshStandardMaterial,
    Scene, WebGLRenderer, PerspectiveCamera, DirectionalLight, WebGLCubeRenderTarget, CubeCamera,
    NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping,
    BasicShadowMap, PCFShadowMap, PCFSoftShadowMap, VSMShadowMap,
    FloatType, HalfFloatType,
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

const lightArea = 30;
const sunDistance = lightArea;
const sunAngle = {
    phi: 45,
    theta: 90,
};
const sunAnglePrev = { ...sunAngle };
const sky = new Sky();
sky.scale.setScalar(sunDistance);
const sunPosition = new Vector3().setFromSphericalCoords(sunDistance, sunAngle.phi * Util.degToRad, sunAngle.theta * Util.degToRad);
sky.material.uniforms.sunPosition.value = sunPosition;
sky.material.uniforms.turbidity.value = 10;
sky.material.uniforms.rayleigh.value = 0.5;
const skyScene = new Scene();
skyScene.add(sky);

const light = new DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.shadow.blurSamples = 5;

light.shadow.camera.left = - lightArea;
light.shadow.camera.right = lightArea;
light.shadow.camera.top = lightArea;
light.shadow.camera.bottom = - lightArea;

light.shadow.camera.near = 1;
light.shadow.camera.far = lightArea * 1.5;

light.shadow.bias = -0.0001;
light.shadow.normalBias = 0.1;
light.shadow.radius = 5;
light.shadow.mapSize.x = 4096;
light.shadow.mapSize.y = 4096;

light.position.copy(sunPosition);
scene.add(light);

const cubeRenderTarget = new WebGLCubeRenderTarget(2048);
cubeRenderTarget.texture.type = FloatType;

const cubeCamera = new CubeCamera(camera.near, camera.far, cubeRenderTarget);
cubeCamera.update(renderer, skyScene);
scene.background = cubeRenderTarget.texture;

const material = new MeshStandardMaterial({ color: 0x0000ff });
material.envMap = cubeRenderTarget.texture;

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
        sunPosition.setFromSphericalCoords(sunDistance, sunAngle.phi * Util.degToRad, sunAngle.theta * Util.degToRad);
        light.position.copy(sunPosition);

        sunAnglePrev.phi = sunAngle.phi;
        sunAnglePrev.theta = sunAngle.theta;

        cubeCamera.update(renderer, skyScene);
    }

    renderer.render(scene, camera);

    stats.update();
}

export {
    sunAngle, sky, skyScene, light, cubeRenderTarget, cubeCamera,
    material, camera, scene, renderer, controls, render,
};