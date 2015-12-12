var RPYeti = RPYeti || {};

RPYeti.Dialog = function (controls, camera, stereoCamera) {
	var dialogCanvas = document.createElement('canvas');
	dialogCanvas.width = RPYeti.config.dialog.canvasWidth;
	dialogCanvas.height = RPYeti.config.dialog.canvasHeight;

	// save context
	this.dialog = dialogCanvas.getContext('2d');
	this.dialogTexture = new THREE.Texture( dialogCanvas );

	this.camera = camera;
	this.stereoCamera = stereoCamera;
	this.controls = controls;
	this.visible = true;

	var material = new THREE.MeshBasicMaterial({ map: this.dialogTexture });
	material.transparent = true;

	var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
	var plane = new THREE.Mesh( planeGeometry, material );

	plane.name = 'Dialog';
	plane.position.set( 0, 0, -1 );

	this.dialog.clearRect(0, 0, RPYeti.config.dialog.canvasWidth, RPYeti.config.dialog.canvasHeight);

	if (this.stereoCamera !== undefined) {
		var plane2 = plane.clone();

		this.stereoCamera.left.add(plane);
		this.dialogPlaneL = plane;

		this.stereoCamera.right.add(plane2);
		this.dialogPlaneR = plane2;

		this.updateFocus();
	} else {
		this.camera.add(plane);
	}
};

RPYeti.Dialog.prototype.constructor = RPYeti.Dialog;

RPYeti.Dialog.prototype.show = function (text, dismissCallback) {
	if (text !== undefined) {
		this.dismissCallback = dismissCallback;
		this.visible = true;
		this.currentSection = -1;

		if (Array.isArray(text)) {
			this.text = text;
			this.totalSections = text.length;
		} else {
			this.text = [ text ];
			this.totalSections = 1;
		}

		(function (self) {
			self.controls.setHook(function () {
				self.next();
			});
		})(this);

		this.next();
	}
};

RPYeti.Dialog.prototype.next = function () {
	if (this.currentSection + 1 < this.totalSections) {
		this.reveal(this.currentSection + 1);
	} else {
		this.dismiss();
	}
}

RPYeti.Dialog.prototype.reveal = function (section) {
	var width = RPYeti.config.dialog.canvasWidth,
		height = RPYeti.config.dialog.canvasHeight;

	this.dialogTexture.needsUpdate = true;

	if (!this.visible) {
		this.dialog.clearRect(0, 0, width, height);
		return;
	}

	var textSize = RPYeti.config.dialog.textSize,
		topOffset = 0,
		outerPadding = RPYeti.config.dialog.outerPadding,
		innerPadding = RPYeti.config.dialog.innerPadding,
		parts = this.text[section].split('\n'),
		lineWidth = RPYeti.config.dialog.lineWidth;

	if (this.stereoCamera !== undefined) {
		topOffset = RPYeti.config.dialog.topStereoOffset;
	}

	var dlgWidth = width - lineWidth - (outerPadding * 2);
		dlgHeight = (parts.length * textSize) + (innerPadding * 2) + (lineWidth * 2),
		dlgOffsetX = innerPadding + lineWidth + outerPadding;
		dlgOffsetY = dlgOffsetX + topOffset

	this.dialog.clearRect(0, 0, width, height);

	this.dialog.beginPath();
	this.dialog.lineWidth = lineWidth;
	this.dialog.rect(outerPadding + (lineWidth / 2), topOffset + outerPadding + (lineWidth / 2), dlgWidth, dlgHeight);
	this.dialog.strokeStyle = RPYeti.config.dialog.borderColor;
	this.dialog.fillStyle = RPYeti.config.dialog.baseColor;
	this.dialog.fill();
	this.dialog.stroke();

	this.dialog.font = 'bold ' + textSize + 'px ' + RPYeti.config.dialog.textFont;
	this.dialog.textAlign = 'left';
	this.dialog.shadowColor = 'transparent',
	this.dialog.shadowOffsetX = 1;
	this.dialog.shadowOffsetY = 1;
	this.dialog.shadowBlur = 1;
	this.dialog.fillStyle = RPYeti.config.dialog.textStyle;

	for (var i in parts) {
		this.dialog.fillText(parts[i], dlgOffsetX, dlgOffsetY + (i * textSize) + textSize);
	}

	if (section !== undefined) {
		this.currentSection = section;
	}
};

RPYeti.Dialog.prototype.setVisibility = function (visibility) {
	this.visible = visibility;
	this.reveal();
};

RPYeti.Dialog.prototype.dismiss = function () {
	this.setVisibility(false);
	this.controls.setHook();
	if (typeof this.dismissCallback === 'function') {
		this.dismissCallback();
	}
};

RPYeti.Dialog.prototype.updateFocus = function () {
	console.log(this.stereoCamera)
	if (this.stereoCamera === undefined) {
		return;
	}

	var f = RPYeti.config.dialog.focalPoint
	this.dialogPlaneL.position.x = f;
	this.dialogPlaneR.position.x = -(f);
};
