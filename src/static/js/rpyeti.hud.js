var RPYeti = RPYeti || {};

RPYeti.HUD = function (player, camera, stereoCamera) {
	var hudCanvas = document.createElement('canvas');
	hudCanvas.width = RPYeti.config.hud.canvasWidth;
	hudCanvas.height = RPYeti.config.hud.canvasHeight;

	// save context
	this.hud = hudCanvas.getContext('2d');
	this.hudTexture = new THREE.Texture( hudCanvas );

	this.player = player;
	this.camera = camera;
	this.stereoCamera = stereoCamera;
	this.text = '';

	// draw reticle
	this.updateReticle();

	var material = new THREE.MeshBasicMaterial({ map: this.hudTexture });
	material.transparent = true;

	var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
	var plane = new THREE.Mesh( planeGeometry, material );

	plane.name = 'HUD';
	plane.position.set( 0, 0, -1 );

	if (this.stereoCamera !== undefined) {
		var plane2 = plane.clone();

		this.stereoCamera.left.add(plane);
		this.hudPlaneL = plane;

		this.stereoCamera.right.add(plane2);
		this.hudPlaneR = plane2;

		(function (self) {
			// add tweening and focal adjustment for HUD
			self.focalRaycaster = new THREE.Raycaster();
			self.focalPoint = new THREE.Vector2(0, 0);
			self.focalTween = new TWEEN.Tween({ x: 0, y: 0 })
				.easing(RPYeti.config.hud.easing)
				.onUpdate(function () {
					self.hudPlaneL.position.x = this.x;
					self.hudPlaneR.position.x = -(this.x);
				});
			self.focalTween.end = 0;
		})(this);
	} else {
		this.camera.add( plane );
	}
};

RPYeti.HUD.prototype.constructor = RPYeti.HUD;

RPYeti.HUD.prototype.addText = function (text, duration) {
	this.text = text;

	if( typeof duration == "undefined" ) {
		duration = 5000;
	}

	if (this.textClear) {
		clearTimeout(this.textClear);
	}

	this.updateReticle();

	if( duration > 0 ) {
		(function (self) {
			self.textClear = setTimeout(function () {
				self.text = '';
				self.updateReticle();
			}, duration);
		})(this);
	}
};

RPYeti.HUD.prototype.updateReticle = function() {
	var healthPercent = 0.0,
		width = RPYeti.config.hud.canvasWidth,
		height = RPYeti.config.hud.canvasHeight,
		arcInitial = (1 * Math.PI),
		arcFull = (2 * Math.PI);

	healthPercent = Math.min( Math.max( this.player.health / RPYeti.config.player.health, 0.0), 1.0 );
	healthPercent = (1.0 - healthPercent) * arcFull + arcInitial;

	this.hud.clearRect(0, 0, width, height);

	this.hud.shadowBlur = 0;

	this.hud.beginPath();
	this.hud.arc( width/2, height/2, RPYeti.config.hud.size, 0, arcFull, false );
	this.hud.lineWidth = 10;
	this.hud.strokeStyle = RPYeti.config.hud.baseColor;
	this.hud.stroke();

	this.hud.beginPath();
	this.hud.arc( width/2, height/2, RPYeti.config.hud.size, arcInitial, healthPercent, false );
	this.hud.lineWidth = 10;
	this.hud.strokeStyle = RPYeti.config.hud.damageColor;
	this.hud.stroke();

	if (this.text !== '') {
		var textPos = RPYeti.config.hud.textPos,
			textSize = RPYeti.config.hud.textSize;

		if (this.stereoCamera !== undefined) {
			textPos *= 1.15;
			textSize *= 1.25;
		}

		this.hud.font = 'normal ' + textSize + 'px GameFont';
		this.hud.shadowColor = 'black',
		this.hud.shadowOffsetX = 0;
		this.hud.shadowOffsetY = 0;
		this.hud.shadowBlur = 10;
		this.hud.textAlign = 'center';
		this.hud.fillStyle = RPYeti.config.hud.textStyle;

		var parts = this.text.split('\n');
		for (var i in parts) {
			this.hud.fillText(parts[i], RPYeti.config.hud.canvasWidth / 2, RPYeti.config.hud.canvasHeight / 2 + textPos + (i * textSize));
		}
	}

	this.hudTexture.needsUpdate = true;
};

RPYeti.HUD.prototype.updateReticleFocus = function (scene) {
	if (this.stereoCamera === undefined) {
		return;
	}

	var points = this.getClosestFocalPoints(scene),
		diff = (Math.abs(points[0].x) + Math.abs(points[1].x)) / 2.0;

	if (diff > RPYeti.config.hud.innerFocalMax) {
		diff = RPYeti.config.hud.innerFocalMax;
	}

	if (this.focalTween.end != diff) {
		this.focalTween.stop();
		this.focalTween.end = diff;
		this.focalTween.to({ x: diff, y: 0 }, RPYeti.config.hud.easeDuration).start();
	}
};

RPYeti.HUD.prototype.getClosestFocalPoints = function(scene) {
	if (this.stereoCamera === undefined) {
		return;
	}

	this.focalRaycaster.setFromCamera( this.focalPoint, this.camera );

	var intersects = this.focalRaycaster.intersectObjects( scene.children, true ),
		closest = null;

	for (var i in intersects) {
		if (intersects[i].object.name != 'HUD' && intersects[i].distance < this.stereoCamera.focalLength) {
			closest = intersects[i];
			break;
		} else if (intersects[i].distance > this.stereoCamera.focalLength) {
			break;
		}
	}

	if (closest != null) {
		var p = closest.point,
			p2 = p.clone(),
			v = p.project(this.stereoCamera.left),
			v2 = p2.project(this.stereoCamera.right);

		return [ v, v2 ];
	} else {
		return [ new THREE.Vector3(), new THREE.Vector3() ];
	}
};