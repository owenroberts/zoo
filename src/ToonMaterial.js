/*
	generate toon material 
*/
import * as THREE from 'three';

export default function getToonMaterial(params) {
	// toon material - put this somewhere else if making lots of these (of same color)
	const alpha = 5, beta = 5, gamma = 5;
	const colors = new Uint8Array( 2 );
	for ( let c = 0; c <= colors.length; c++) {
		colors[c] = 64 + (c / colors.length) * (256 - 64);
	}
	const gradientMap = new THREE.DataTexture( colors, colors.length, 1, THREE.LuminanceFormat );
	gradientMap.minFilter = THREE.NearestFilter;
	gradientMap.magFilter = THREE.NearestFilter;
	gradientMap.generateMipmaps = false;
	const material = new THREE.MeshToonMaterial({
		color: params.color || 0xffffff,
		emissive: new THREE.Color(params.emissiveColor || 0x000000),
		skinning: params.skinning || false,
		specular: new THREE.Color(0x00000),
		// gradientMap: gradientMap,
		shininess: 0,
	});
	if (params.map) material.map = params.map;
	return material;

}