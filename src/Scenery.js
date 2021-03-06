/*
	scenery that needs ground etc
*/

import * as THREE from 'three';
import getToonMaterial from './ToonMaterial';
import { choice, random, chance, map, distance } from './Cool';
import C from './Constants';

export default function Scenery(scene, ground, modelLoader) {

	let removables = [];

	this.addTrees = function() {

		const dummy = new THREE.Object3D();

		let b = C.sceneWidth / 3; // bound
		let long = distance(0, 0, b, b);
		let inside = distance(0, 0, b/2, b/2);
		for (let x = -b; x < b; x += 8) {
			for (let z = -b; z < b; z += 8) {
				let d = distance(0, 0, x, z);
				let pct = map(d, 0, long, 0, 0.25);
				if (chance(pct)) {
					const y = ground.getHeight(x, z).point.y - 0.25;
					dummy.position.set(x, y, z);
					dummy.rotation.y = random(Math.PI * 2);
					dummy.updateMatrix();
					modelLoader.addInstance('trees', 'random', dummy.matrix);
					if (d < inside) addGrass(x, y, z);

				}
			}
		}
	}

	function addGrass(_x, _y, _z) {

		const dummy = new THREE.Object3D();

		let b = 10; // bound
		let u = 2; // unit
		let long = distance(0, 0, b, b);
		for (let x = -b; x < b; x += u) {
			for (let z = -b; z < b; z += u) {
				let d = distance(0, 0, x, z);
				let pct = map(d, 0, long, 0.05, 0);
				if (chance(pct)) {
					const { point, face } = ground.getHeight(_x + x, _z + z);
					dummy.position.set(0, 0, 0);
					dummy.lookAt(face.normal);
					dummy.position.copy(point);
					dummy.rotation.y = random(Math.PI * 2);
					dummy.translateY(-0.25);
					dummy.updateMatrix();

					modelLoader.addInstance('grass', 'random', dummy.matrix);
					
				}
			}
		}
	}

	function addBuildings() {

		const dummy = new THREE.Object3D();
		const startRow = -C.sceneWidth / 2;
		const rowDepth = -C.buildingSize / 2;
		const rowWidth = C.sceneWidth - C.buildingSize / 2;
		for (let i = 0; i < C.buildingRows; i++) {
			let z = startRow + rowDepth * i;
			// four quadrants
			for (let j = 0; j < 4; j++) {
				const r = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][j];
				z *= j % 1 == 0 ? -1 : 1;

				for (let x = C.buildingSize / 2; x <= rowWidth; x += C.buildingSize / 2) {
					let _x = j > 1 ? z + C.sceneWidth / 2 : x;
					let _z = j > 1 ? x - C.sceneWidth / 2 : z;
					dummy.position.set(_x - C.sceneWidth / 2, C.buildingY, _z);
					dummy.rotation.y = r;
					dummy.updateMatrix();
					modelLoader.addInstance('buildings', 'random', dummy.matrix);
				}
			}
		}
	}

	this.addObservationDeck = function(hexMap) {

		const start = hexMap.observationDeskStartHex;
		const middle = choice(...hexMap.getHexNeighbors(start));
		const neighbors = hexMap.getHexNeighbors(middle);
		const y = 15;
		let end = choice(...neighbors);
		while (end.compareTo(start)) {
			end = choice(...neighbors);
		}

		const wallIndexes = { 'SE': 0, 'S': 1, 'SW': 2, 'NW': 3, 'N': 4, 'NE': 5 };
		const startPosition = start.calculatePosition(C.sideLength);
		const startWalls = hexMap.getWalls(start, C.sideLength, true);
		const startWall = choice(...startWalls.filter(wall => wall.hasWall));

		// get shared wall between start and middle
		const middlePosition = middle.calculatePosition(C.sideLength);
		const middleDirection = start.getDirection(middle);
		const middleWalls = hexMap.getWalls(middle, C.sideLength, true);
		const middleWall = startWalls[wallIndexes[middleDirection]];

		const endPosition = end.calculatePosition(C.sideLength);
		const endDirection = middle.getDirection(end);
		const endWall = middleWalls[wallIndexes[endDirection]];

		const dummy = new THREE.Object3D();
		const zVector = new THREE.Vector3(0, 0, 1);

		const segment1 = [startWall, startPosition, middleWall];
		const segment2 = [middleWall, middlePosition, endWall];
		const segment3 = [endWall, endPosition];

		const allPoints = [];

		[segment1, segment2].forEach(segment => {
			const curve = new THREE.QuadraticBezierCurve3(
				new THREE.Vector3(segment[0].x, y, segment[0].z),
				new THREE.Vector3(segment[1].x, y, segment[1].y),
				new THREE.Vector3(segment[2].x, y, segment[2].z),
			);

			const points = curve.getPoints(20);
			for (let i = 0; i < points.length; i++) {
				const point = new THREE.Object3D();
				point.position.copy(points[i]);
				const axis = new THREE.Vector3();
				const tangent = curve.getTangent(i / points.length);
				axis.crossVectors(zVector, tangent).normalize();
				const radians = Math.acos(zVector.dot(tangent));
				point.quaternion.setFromAxisAngle(axis, radians);
				addPoint(point);
			}
		});

		const d = new THREE.Vector3(endWall.x, y, endWall.z)
			.distanceTo(new THREE.Vector3(endPosition.x, y, endPosition.y));
		for (let i = 0; i < 10; i++) {
			const point = new THREE.Object3D();
			point.position.copy(new THREE.Vector3(endWall.x, y, endWall.z));
			point.quaternion.copy(new THREE.Quaternion());
			point.lookAt(new THREE.Vector3(endPosition.x, y, endPosition.y));
			point.translateZ(i / 10 * d);
			addPoint(point, i == 9);
		}

		function addPoint(point, isLast) {
			const p = new THREE.AxesHelper(1);
			p.position.copy(point.position);
			p.quaternion.copy(point.quaternion);

			dummy.position.copy(p.position);
			dummy.quaternion.copy(p.quaternion);
			allPoints.push(dummy.clone()); // save point origin

			dummy.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
			dummy.translateX(-2);
			dummy.updateMatrix();
			modelLoader.addInstance('cross', 'random', dummy.matrix);

			if (isLast) {
				dummy.translateZ(-1.4);
				dummy.updateMatrix();
				modelLoader.addInstance('cross', 'random', dummy.matrix);
				dummy.translateZ(-1.4);
				dummy.updateMatrix();
				modelLoader.addInstance('cross', 'random', dummy.matrix);
			}
		}

		// add railing
		[-2, 2].forEach(side => {

			let idx = allPoints.length - 1;
			let currentPostPoint = allPoints[idx].clone();
			let finishedSide = false;

			while (!finishedSide) {
				dummy.position.copy(currentPostPoint.position);
				dummy.quaternion.copy(currentPostPoint.quaternion);
				dummy.translateX(side);
				dummy.updateMatrix();
				modelLoader.addInstance('post', 'random', dummy.matrix);

				// get next 
				let gotNext = false;
				for (let i = idx - 1; i >= 0; i--) {
					const nextPostPoint = new THREE.Object3D();
					nextPostPoint.position.copy(allPoints[i].position);
					nextPostPoint.quaternion.copy(allPoints[i].quaternion);
					nextPostPoint.translateX(side);
					const d = dummy.position.distanceTo(nextPostPoint.position);

					if (d > 3.9 || (i == 0 && (idx > 4))) {

						dummy.lookAt(nextPostPoint.position);
						dummy.translateY(2.5);
						dummy.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI / 2);
						dummy.updateMatrix();
						modelLoader.addInstance('cross', 'random', dummy.matrix);

						currentPostPoint = allPoints[i].clone();
						idx = i;
						gotNext = true;
						break;
					}
				}
				finishedSide = !gotNext;
			}
		});

		const viewer = modelLoader.getModel('items', 'viewer');
		viewer.position.copy(allPoints[allPoints.length - 1].position);
		viewer.quaternion.copy(allPoints[allPoints.length - 1].quaternion);
		viewer.translateZ(-0.5);
		viewer.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);

		const material = getToonMaterial({
			color: 0xc7e0ed,
			texture: C.viewerTexturePath,
			repeat: 8,
		});
		viewer.traverse(child => {
			if (child.constructor.name == 'Mesh') {
				child.material = material;
				child.castShadow = true;
			}
		});
		removables.push(viewer);
		scene.add(viewer);
	}

	this.addWall = function(x, y, z, h, postHeight, rotation, isRock, isLabelWall, arrowDirection) {
		const dummy = new THREE.Object3D();
		const origin = new THREE.Object3D();
		origin.position.set(x, y, z);
		origin.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), rotation - Math.PI / 2);

		function addFence() {
			for (let j = 0; j < h; j++) {

				dummy.position.set(x, y, z);
				dummy.quaternion.copy(origin.quaternion);
				dummy.translateX(-C.sideLength / 2);
				dummy.translateY(j * postHeight);
				
				for (let i = 0; i < 3; i++) {

					dummy.updateMatrix();
					modelLoader.addInstance('post', 'random', dummy.matrix);
					
					if (i < 2) {
						dummy.translateY(0.2);
						for (let i = 0; i < 8; i++) {
							dummy.updateMatrix();
							if (chance(0.9)) modelLoader.addInstance('cross', 'random', dummy.matrix);
							dummy.translateY(0.33);
						}
					}

					dummy.translateX(C.sideLength / 2);
					dummy.position.y = y + j * postHeight;
				}
			}
		}

		function addRock() {
			for (let j = 0; j < h; j++) {
				dummy.position.set(x, y, z);
				dummy.quaternion.copy(origin.quaternion);
				dummy.translateY(j * postHeight);
				dummy.updateMatrix();
				modelLoader.addInstance('rocks', 'random', dummy.matrix);
			}
		}

		function addLabel(_y, letter) {
			const str = `zoo${letter}s`;
			const ny = _y > 0 ? _y : ground.getHeight(x, z).point.y;
			dummy.position.set(x, ny, z);
			dummy.quaternion.copy(origin.quaternion);
			dummy.translateX(-4);
			for (let i = 0; i < str.length; i++) {
				dummy.updateMatrix();
				modelLoader.addInstance('letters', str[i], dummy.matrix);
				dummy.translateX(2);
			}
		}

		function addArrow(direction, _y) {
			const arrow = modelLoader.getModel('items', `arrow-${direction}`);
			arrow.position.set(x, y, z);
			arrow.quaternion.copy(origin.quaternion);
			arrow.translateY(_y);

			const material = getToonMaterial({
				color: 0x6f6c82,
				texture: C.letterTexturePath,
				repeat: 8,
			});

			arrow.traverse(child => {
				if (child.constructor.name == 'Mesh') {
					child.material = material;
					child.receiveShadow = true;
				}
			});

			removables.push(arrow);
			scene.add(arrow);
		}

		if (arrowDirection) {
			addArrow(arrowDirection, arrowDirection == 'left' ? 12 : 14);
			addLabel(arrowDirection == 'left' ? 17 : 15, arrowDirection == 'left' ? 'b' : 'c');
		}

		if (isLabelWall) addLabel(0, 'a');
		else if (isRock || arrowDirection) addRock();
		else addFence();
	};

	this.addPortal = function(params) {
		const { x, z, rotation } = params;
		const y = ground.getHeight(x, z).point.y;
		const portal = modelLoader.getModel('items', 'portal-3');
		portal.position.set(x, y, z);

		portal.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), rotation - Math.PI / 2);
		portal.translateZ(1.5);
		portal.translateY(2.5);


		const material = getToonMaterial({
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
				child.material = child.material.name == 'Outside' ? material : insideMaterial;
				child.castShadow = true;
			}
		});
		
		removables.push(portal);
		scene.add(portal);
		return portal.position;
	};

	this.setup = function() {
		addBuildings();
	};

	this.reset = function() {
		for (let i = removables.length; i >= 0; i--) {
			scene.remove(removables[i]);
		}
		removables = [];
	};
	
}