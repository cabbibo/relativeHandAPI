/**
 * @author Slayvin / http://slayvin.net
 */


var snoise =  [
        'vec3 mod289(vec3 x) {',
            '\treturn x - floor(x * (1.0 / 289.0)) * 289.0;',
        '}',
        '',
        'vec2 mod289(vec2 x) {',
            '\treturn x - floor(x * (1.0 / 289.0)) * 289.0;',
        '}',
        '',
        'vec3 permute(vec3 x) {',
            '\treturn mod289(((x*34.0)+1.0)*x);',
        '}',
        '',
        'float snoise(vec2 v) {',
            '\tconst vec4 C = vec4(0.211324865405187,  0.366025403784439, -0.577350269189626, 0.024390243902439);',
            '',
            '\tvec2 i  = floor(v + dot(v, C.yy));',
            '\tvec2 x0 = v -   i + dot(i, C.xx);',
            '',
            '\tvec2 i1;',
            '\ti1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
            '\tvec4 x12 = x0.xyxy + C.xxzz;',
            '\tx12.xy -= i1;',
            '',
            '\ti = mod289(i);',
            '\tvec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));',
            '',
            '\tvec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
            '\tm = m*m;',
            '\tm = m*m;',
            '',
            '\tvec3 x = 2.0 * fract(p * C.www) - 1.0;',
            '\tvec3 h = abs(x) - 0.5;',
            '\tvec3 ox = floor(x + 0.5);',
            '\tvec3 a0 = x - ox;',
            '',
            '\tm *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );',
            '',
            '\tvec3 g;',
            '\tg.x  = a0.x  * x0.x  + h.x  * x0.y;',
            '\tg.yz = a0.yz * x12.xz + h.yz * x12.yw;',
            '\treturn 130.0 * dot(m, g);',
        '}',
    ].join('\n');

THREE.ShaderLib['mirror'] = {

	uniforms: { "mirrorColor": { type: "c", value: new THREE.Color(0x7F7F7F) },
				"mirrorSampler": { type: "t", value: null },
				"textureMatrix" : { type: "m4", value: new THREE.Matrix4() },
                "time":{type:"f" , value: 0 }
	},

	vertexShader: [

		"uniform mat4 textureMatrix;",
  
        "uniform float time;",
		"varying vec4 mirrorCoord;",

        snoise,

		"void main() {",

            "vec2 lookup = vec2(position.x / 10000. , position.y / 10000. ) + vec2( time * .000001 , time * .000002 );",
            "float noise = snoise( lookup * 2000. );",
            "vec3 newPos = position + vec3( 0. , 0. , noise * 10. );",
			"vec4 mvPosition = modelViewMatrix * vec4( newPos , 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( newPos, 1.0 );",
			"mirrorCoord = textureMatrix * worldPosition;",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform vec3 mirrorColor;",
		"uniform sampler2D mirrorSampler;",

		"varying vec4 mirrorCoord;",

		"float blendOverlay(float base, float blend) {",
			"return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
		"}",
		
		"void main() {",

			"vec4 color = texture2DProj(mirrorSampler, mirrorCoord);",
			"color = vec4(blendOverlay(mirrorColor.r, color.r), blendOverlay(mirrorColor.g, color.g), blendOverlay(mirrorColor.b, color.b), 1.0);",

			"gl_FragColor = color*vec4( .4 , .9 , .6 , 1.0 );",

		"}"

	].join("\n")

};

THREE.Mirror = function ( renderer, camera, options ) {

	THREE.Object3D.call( this );

	this.name = 'mirror_' + this.id;

	options = options || {};

	this.matrixNeedsUpdate = true;

	var width = options.textureWidth !== undefined ? options.textureWidth : 512;
	var height = options.textureHeight !== undefined ? options.textureHeight : 512;

	this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;

	var mirrorColor = options.color !== undefined ? new THREE.Color(options.color) : new THREE.Color(0x7F7F7F);

	this.renderer = renderer;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3(0, 0, -1);
	this.clipPlane = new THREE.Vector4();
	
	// For debug only, show the normal and plane of the mirror
	var debugMode = options.debugMode !== undefined ? options.debugMode : false;

	if ( debugMode ) {

		var arrow = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 10, 0xffff80 );
		var planeGeometry = new THREE.Geometry();
		planeGeometry.vertices.push( new THREE.Vector3( -10, -10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, -10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, 10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( -10, 10, 0 ) );
		planeGeometry.vertices.push( planeGeometry.vertices[0] );
		var plane = new THREE.Line( planeGeometry, new THREE.LineBasicMaterial( { color: 0xffff80 } ) );

		this.add(arrow);
		this.add(plane);

	}

	if ( camera instanceof THREE.PerspectiveCamera ) {

		this.camera = camera;

	} else {

		this.camera = new THREE.PerspectiveCamera();
		console.log( this.name + ': camera is not a Perspective Camera!' );

	}

	this.textureMatrix = new THREE.Matrix4();

	this.mirrorCamera = this.camera.clone();

	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );

	var mirrorShader = THREE.ShaderLib[ "mirror" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: mirrorUniforms

	} );

	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.mirrorColor.value = mirrorColor;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;

	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo( height ) ) {

		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;

	}

	this.updateTextureMatrix();
	this.render();

};

THREE.Mirror.prototype = Object.create( THREE.Object3D.prototype );

THREE.Mirror.prototype.renderWithMirror = function ( otherMirror ) {

	// update the mirror matrix to mirror the current view
	this.updateTextureMatrix();
	this.matrixNeedsUpdate = false;

	// set the camera of the other mirror so the mirrored view is the reference view
	var tempCamera = otherMirror.camera;
	otherMirror.camera = this.mirrorCamera;

	// render the other mirror in temp texture
	otherMirror.renderTemp();
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.tempTexture;

	// render the current mirror
	this.render();
	this.matrixNeedsUpdate = true;

	// restore material and camera of other mirror
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.texture;
	otherMirror.camera = tempCamera;

	// restore texture matrix of other mirror
	otherMirror.updateTextureMatrix();
};

THREE.Mirror.prototype.updateTextureMatrix = function () {

	var sign = THREE.Math.sign;

	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );

	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );

	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate();
	target.add( this.mirrorWorldPosition );

	this.up.set( 0, -1, 0 );
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse( this.mirrorCamera.matrixWorld );

	// Update the texture matrix
	this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );
	this.textureMatrix.multiply( this.mirrorCamera.projectionMatrix );
	this.textureMatrix.multiply( this.mirrorCamera.matrixWorldInverse );

	// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.mirrorPlane.applyMatrix4( this.mirrorCamera.matrixWorldInverse );

	this.clipPlane.set( this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;

	q.x = ( sign(this.clipPlane.x) + projectionMatrix.elements[8] ) / projectionMatrix.elements[0];
	q.y = ( sign(this.clipPlane.y) + projectionMatrix.elements[9] ) / projectionMatrix.elements[5];
	q.z = - 1.0;
	q.w = ( 1.0 + projectionMatrix.elements[10] ) / projectionMatrix.elements[14];

	// Calculate the scaled plane vector
	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot(q) );

	// Replacing the third row of the projection matrix
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
	projectionMatrix.elements[14] = c.w;

};

THREE.Mirror.prototype.render = function () {

    
    this.material.uniforms.time.value += 1;
	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== undefined ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene) {

		this.renderer.render( scene, this.mirrorCamera, this.texture, true );

	}

};

THREE.Mirror.prototype.renderTemp = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== undefined ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene) {

		this.renderer.render( scene, this.mirrorCamera, this.tempTexture, true );

	}

};
