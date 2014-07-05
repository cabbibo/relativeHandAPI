Rigged Skeleton For Three.js and Leap Motion
=====

Hey Friends!

This Repo is a first attempt at making a tool to help you easily
create Hands using leap motion data. It attempts to decouple the 
creation of the visual parts of the hand with all the math involved
in properly placing the parts of the hand.

There is still working being done on this repo, so if you have any 
questions / comments, please let me know at 
icohen@leapmotion.com || @cabbibo .



Whats in this Readme?
-----

  - Links to Useful Resources
  - Basic Implementation
  - A full example from start to finish!
  - Different Methods for adding objects

Useful Resources
=====


- [ The github page for this repo ]( http://leapmotion.github.io/Leap-Three-Rigged-Skeleton/ )
- [ three.js library ]( http://threejs.org/ )



Basic Implementation
=====

Include Scripts
------

Like Any other javascript program, the first thing we need to 
do is include the proper files. In our case we use three.js
leap.js , and the main file 'RiggedSkeleton.js':

```javascript
<script src="path/to/three.js"></script>
<script src="path/to/leap.js"></script>
<script src="path/to/RiggedSkeleton.js"></script>
```

Setting Up Scene
------

After including the proper scripts, we set up our three.js scene, 
the way we would every other time we set up a scene. The only difference
is that we will add a few extra lines in, in order to set up our leap 
controller and the rigged skeleton. Additionally, in our animate loop,
we will make sure to update our skeleton

```javascript
// our leap controller
var controller;

// our rigged skeleton
var riggedSkeleton;

function init(){

  // Whatever function you use to initialize 
  // your three.js scene, add your code here

  
  // Our Leap Controller
  var controller = new Leap.controller();
  controller.connect();

  riggedSkeleton = new RiggedSkeleton( controller , {

    movementSize: 500,  // size that our hand moves
    handSize: 100       // size of our hand
    
  });

  // Adding our rigged skeleton to the scene
  // We could add it to any object that we want to though
  riggedSkeleton.addToScene( scene );
  


}

function animate(){

  // add all our three.js calls here

  riggedSkeleton.update();


}
```

Adding objects to our skeleton
------

Once our skeleton is set up, the only thing we need to do is
add some objects to our skeleton. We will show the most basic 
method here, but next we'll examine a few different methods
for adding objects to the skeleton

```javascript
var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 30 , 30  , 100 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addScaledMeshToAll( mesh )
``` 

And thats it! You should see a rainbow hand made of boxes on 
your screen.



Full Code Example
=====

```javascript
<html>
  <head>
    <style>
      
        #container{
        position   : absolute;
        top        : 0px;
        left       : 0px;
        background : #000;
      }

    </style>
  </head>
  <body>

  
    <script src = "../lib/leap.js"       ></script>
    <script src = "../lib/three.js"      ></script>
    <script src = "../RiggedSkeleton.js" ></script>


    <script>

      var container , camera , scene, renderer;

      // Global variable for leap
      var controller;

      // our rigged skeleton
      var riggedSkeleton;

      var sceneSize = 100;

      init();
      animate();

      function init(){

        controller = new Leap.Controller();

        scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera( 
          50 ,
          window.innerWidth / window.innerHeight,
          sceneSize / 100 ,
          sceneSize * 40
        );

        camera.position.z = sceneSize *4;

        container     = document.createElement( 'div' );
        container.id  = 'container';
        
        document.body.appendChild( container );

        renderer = new THREE.WebGLRenderer();

        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        window.addEventListener( 'resize', onWindowResize , false );

        riggedSkeleton = new RiggedSkeleton( controller , {
              
          movementSize: 500,
          handSize: 100
          
        });

        riggedSkeleton.addToScene( scene );
        
        var mesh = new THREE.Mesh(
          new THREE.BoxGeometry( 30 , 30  , 100 ),
          new THREE.MeshNormalMaterial()
        );

        riggedSkeleton.addScaledMeshToAll( mesh )
       
        controller.connect();
      
      }

      function animate(){

        riggedSkeleton.update();

        renderer.render( scene , camera );

        requestAnimationFrame( animate );

      }

      function onWindowResize(){

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

      }

    </script>
  </body>
</html>
```


Different Methods for Adding Objects
========

Because the goal of this API is to be as simple as possible,
there are certain shortcuts that are taken to get you up and
running right away. However for the more curious coder, its
easy to get deeper into creating custom Skeletons

The Way it works
-----

The first thing that the curious coder may want to know is how
exactly the skeleton works. Basically what happens is the following:

- First the bounding box of a mesh is calculated, to find its length
- Second, the mesh is cloned and added to Object3d's for each joint
- Third, when the riggedSkeleton is updated, the positions / rotations 
  of each Object3D is updated.


Some Important Notes
-----

- When a mesh is added, is by default thought of as pointing in the Z direction. 
  This means that the mesh will be measured, scaled and rotated so that the Z direction
  is pointed down the length of the joint. You can have it point in the X and Y by passing
  it through in the parameters

  To add a mesh pointing in another directions, check out the example:
  [ Non Z Mesh ]( http://leapmotion.github.io/Leap-Three-Rigged-Skeleton/examples/nonZMesh.html )

- When a mesh is added, its length is automatically calculated. 
  When it is scaled to fit the joint, it will use this length as the length that reaches 
  from joint to joint. If you want your mesh to reach past the next joint, you can simply change the 
  mesh length

  To add a mesh and define your own length, check out the example:
  [ Own Length Mesh ]( http://leapmotion.github.io/Leap-Three-Rigged-Skeleton/examples/ownLengthMesh.html )

- When a mesh is added, it is considered to be centered around 0, and will move 0 to the center of the joint.
  however, if you want 0 to be at the bas of the joint rather than the center, 
  you can pass it through as a parameter

  To add a non centered mesh , check out the examples:
  [ Non Centered Mesh ]( http://leapmotion.github.io/Leap-Three-Rigged-Skeleton/examples/nonCenteredMesh.html )


Adding Meshes to Certain Fingers
------

Sometimes you may want to a different mesh to each individual
finger. There's a function call for that!

```javascript

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 30 , 30  , 100 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addScaledFingerMesh( mesh , 'thumb' )

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 3 , 3  , 100 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addScaledFingerMesh( mesh , 'index' )


```

Adding Meshes to Certain Joint Types
------

Sometimes you may want to a different mesh to each individual
joint type. There's a function call for that!

```javascript

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 30 , 30  , 100 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addScaledJointMesh( mesh , 'proximal' )

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 3 , 3  , 100 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addScaledJointMesh( mesh , 'metacarpal' )

```

Adding Meshes that Aren't Scaled
------

Sometimes you may want to add a mesh that isn't scaled.
There's a function call for that!

```javascript

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 30 , 30  , 30 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addMeshToAll( mesh );

```

You can do the same thing for join types and finger types as well

```javascript

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 30 , 30  , 30 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addJointMesh( mesh , 'proximal' );

var mesh = new THREE.Mesh(
  new THREE.BoxGeometry( 3 , 3  , 3 ),
  new THREE.MeshNormalMaterial()
);

riggedSkeleton.addFingerMesh( mesh , 'thumb' );

```


Contact
======

icohen@leapmotion.com || @cabbibo
