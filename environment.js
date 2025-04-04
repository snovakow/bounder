import {
    Vector3,
    WebGLRenderer, PerspectiveCamera,
    NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping,
} from 'three';

const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);

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

document.body.appendChild(renderer.domElement);

const windowResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', windowResize);

const updatePixelRatio = () => {
    if (renderer.getPixelRatio() !== window.devicePixelRatio) console.log(window.devicePixelRatio);
    if (renderer.getPixelRatio() !== window.devicePixelRatio) renderer.setPixelRatio(window.devicePixelRatio);
}
export { camera, renderer, updatePixelRatio };