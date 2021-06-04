import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js';

export default function PostProcessing(renderer, scene, camera) {

	let w = window.innerWidth, h = window.innerHeight;

	const target1 = new THREE.WebGLRenderTarget( w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat} );
	const target2 = new THREE.WebGLRenderTarget( w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat } );

	const renderPass = new RenderPass( scene, camera );
	const effectComposer = new EffectComposer( renderer, target1 );
	effectComposer.renderToScreen = false;
	effectComposer.addPass(renderPass);

	const effectSobel = new ShaderPass( SobelOperatorShader );
	effectSobel.uniforms[ 'resolution' ].value.x = w * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = h * window.devicePixelRatio;
	effectComposer.addPass(effectSobel);

	const gammaCorrection = new ShaderPass( GammaCorrectionShader );
	effectComposer.addPass(gammaCorrection);

	const renderComposer = new EffectComposer(renderer, target2);
	renderComposer.renderToScreen = false;
	renderComposer.addPass(renderPass);

	const blender = new ShaderPass(BlendShader);
	blender.uniforms.tDiffuse1.value = renderComposer.readBuffer.texture;
	blender.uniforms.tDiffuse2.value = effectComposer.readBuffer.texture;
	blender.uniforms['mixRatio'].value = 0.5;

	const composer = new EffectComposer(renderer);
	composer.renderToScreen = true;
	composer.addPass(blender);

	this.render = function() {
		effectComposer.render();
		renderComposer.render();
		composer.render();
		// renderer.render(scene, camera);
	};	
}