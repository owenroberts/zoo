import * as THREE from 'three';
import C from './Constants';
import getToonMaterial from './ToonMaterial';
import PostProcessing from './PostProcessing';

export default function PortalScene(renderer, modelLoader) {
	let self = this;
	let w = window.innerWidth, h = window.innerHeight;
	const [fov, aspect, near, far] = [60, w / h, 1.0, 2000.0];

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	let mixer, post, portal, portalRotation = 0;
	
	init();

	function init() {

		scene.background = new THREE.Color( 0x000000 );
		camera.position.set(0, 0, 10);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		dirLight.color.setHSL( 0.1, 1, 0.95 );
		dirLight.position.set( 0.25, 1.75, -2 );
		dirLight.position.multiplyScalar( 30 );
		scene.add( dirLight );

		const material = getToonMaterial({
			color: 0x6e619e,
			skinning: true,
			emissiveColor: 0x1e00ff,
			texture: C.characterTexturePath(),
			repeat: 16,
		});

		const eyeMaterial = getToonMaterial({
			color: 0xffffff,
			skinning: true,
			emissiveColor: 0x1e00ff,
			texture: C.characterTexturePath(),
			repeat: 16,
		});

		const gltf = modelLoader.getGLTF('characters', 'a');
		const mesh = gltf.scene;
		mesh.scale.setScalar(0.5); // set scale in blender? -- not sure
		mesh.position.z = 1;
		mesh.position.y = -0.5;
		mesh.traverse(c => {
			if (c.constructor.name == 'SkinnedMesh') {
				c.material = c.material.name == 'EyeMaterial' ? eyeMaterial : material;
			}
		});
		scene.add(mesh);

		mixer = new THREE.AnimationMixer(mesh);
		const clip = gltf.animations.filter(action => action.name === 'JumpMid')[0];
		const action = mixer.clipAction(clip);
		action.play();

		portal = modelLoader.getModel('items', 'portal-inside');

		const materialP = getToonMaterial({
			color: 0x23630f,
			texture: C.portalTexturePath,
			repeat: 8,
		});

		const insideMaterial = getToonMaterial({
			color: 0x222421,
			texture: C.portalTexturePath,
			repeat: 8,
		});

		portal.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				child.material = child.material.name == 'Outside' ? materialP : insideMaterial;
				child.castShadow = true;
			}
		});

		scene.add(portal);

		post = new PostProcessing(renderer, scene, camera);
	}

	this.render = function() {
		// post.render(self.scene, self.camera);
		post.render();
	};

	this.reset = function() {
		portalRotation = 0;
	};

	this.update = function(timeElapsed) {
		const timeInSeconds = timeElapsed * 0.001;
		if (mixer) mixer.update(timeInSeconds);

		portalRotation += 0.01;
		portal.rotation.y = portalRotation;
	}
}