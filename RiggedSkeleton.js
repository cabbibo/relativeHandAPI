  
  function RiggedSkeleton( controller , params ){

    var params = params || {};

    this.size = params.size || 1;

    this.controller   = controller;
    
    // A flat array of all bones
    this.bones = [];

    this.hand         = new THREE.Object3D();
    this.fingers      = this.createFingers();
     
    this.baseMatrixLeft = new THREE.Matrix4(
       0 ,  0 , 1 , 0,
       0 , -1 , 0 , 0,
      -1 ,  0 , 0 , 0, 
       0 ,  0 , 0 , 1
    );

    this.baseMatrixRight = new THREE.Matrix4(
       0 ,  0 , -1 , 0,
       0 , -1 ,  0 , 0,
      -1 ,  0 ,  0 , 0, 
       0 ,  0 ,  0 , 1
    );

    this.tmpMatrix    = new THREE.Matrix4();
    this.tmpQuat      = new THREE.Quaternion();
   


  }


  /*
  
     API

  */

  RiggedSkeleton.prototype.addToScene = function( scene ){

    scene.add( this.hand );

  }

  RiggedSkeleton.prototype.removeFromScene = function( scene ){

    scene.remove( this.hand );

  }


  RiggedSkeleton.prototype.addHandMesh = function( mesh ){

    this.hand.add( mesh.clone() );

  }






  /*
  
     Initialization Functions

  */

  RiggedSkeleton.prototype.createFingers = function(){


    var fingers = [];

    for( var i = 0; i < 5; i++ ){

      var finger = this.createFinger();
      fingers.push( finger );

    }

    return fingers;


  }

  /*

     Creates a finger by recursively placing 
     each joint on the one above it

  */
  RiggedSkeleton.prototype.createFinger = function(){

    var metacarpal    = new THREE.Object3D();
    var proximal      = new THREE.Object3D();
    var intermediate  = new THREE.Object3D();
    var distal        = new THREE.Object3D();
    var tip           = new THREE.Object3D();

    // push all the bones!
    this.bones.push( metacarpal     );
    this.bones.push( proximal       );
    this.bones.push( intermediate   );
    this.bones.push( distal         );
    this.bones.push( tip            );

    this.hand.add(    metacarpal    );
    metacarpal.add(   proximal      );
    proximal.add(     intermediate  );
    intermediate.add( distal        );
    distal.add(       tip           );

    var finger = {

      metacarpal    : metacarpal,
      proximal      : proximal,
      intermediate  : intermediate,
      distal        : distal,
      tip           : tip

    }

    return finger;

  }

  RiggedSkeleton.prototype.addJointMesh = function( mesh ){

    for( var i = 0; i < this.fingers.length; i++ ){

      var finger = this.fingers[i];

      finger.metacarpal.add(    mesh.clone() );
      finger.proximal.add(      mesh.clone() );
      finger.intermediate.add(  mesh.clone() );
      finger.distal.add(        mesh.clone() );
      finger.tip.add(           mesh.clone() );


    }

  }


  /*
  

     UPDATE


  */

  RiggedSkeleton.prototype.updateFingerRig = function( frameHand , frameFinger , ourFinger ){



    // Setting references to all of the leap.js bones
    
    var m = frameFinger.bones[0];
    var p = frameFinger.bones[1];
    var i = frameFinger.bones[2];
    var d = frameFinger.bones[3];



    // To position the metal carpal, 
    // we compare its position to the palm position
    // and apply the palms rotation to that position
    
    ourFinger.metacarpal.position = this.threeDif( frameHand.palmPosition , m.prevJoint );

    var quat = new THREE.Quaternion();
    quat.setFromRotationMatrix( this.hand.matrix.clone().transpose() );
    
    ourFinger.metacarpal.position.applyQuaternion( quat ); 


    // The remaining fingers can just be placed using z
    
    ourFinger.proximal.position.z     = -m.length;
    ourFinger.intermediate.position.z = -p.length;
    ourFinger.distal.position.z       = -i.length;
    ourFinger.tip.position.z          = -d.length;


    // Saving our hand matrix for easy access
    var hMatrix = this.hand.matrix;


    /*
     
      To rotate each finger properly, 
     
      we first get the proper matrix from the basis
      that leap.js provides,
    
      than get a relative rotation by comparing 
      that with the previous rotation

    */


    // METACARPAL ROTATION
    
    var mMatrix = this.matrixFromBasis( m.basis , frameHand.type );
    
    var mRelRot = new THREE.Matrix4();
    mRelRot.multiplyMatrices( hMatrix.clone().transpose() , mMatrix );
    
    ourFinger.metacarpal.rotation.setFromRotationMatrix(mRelRot);




    // PROXIMAL ROTATION
    
    var pMatrix = this.matrixFromBasis( p.basis , frameHand.type );
    
    var pRelRot = new THREE.Matrix4();
    pRelRot.multiplyMatrices( mMatrix.clone().transpose() , pMatrix );
    
    ourFinger.proximal.rotation.setFromRotationMatrix(pRelRot);



    // INTERMEDIATE ROTATION
    
    var iMatrix = this.matrixFromBasis( i.basis , frameHand.type );

    var iRelRot = new THREE.Matrix4();
    iRelRot.multiplyMatrices( pMatrix.clone().transpose() , iMatrix );
    
    ourFinger.intermediate.rotation.setFromRotationMatrix(iRelRot);




    // DISTAL ROTATION
    
    var dMatrix = this.matrixFromBasis( d.basis , frameHand.type );

    var dRelRot = new THREE.Matrix4();
    dRelRot.multiplyMatrices( iMatrix.clone().transpose() , dMatrix );
    
    ourFinger.distal.rotation.setFromRotationMatrix(dRelRot);

    
    
    // NOTE: the tip should not be rotated, or it will lead to 
    // streching in the mesh! ( or other general weirdness );

  }

  RiggedSkeleton.prototype.update = function(){

    this.frame = this.controller.frame();

    if( this.frame.hands[0] ){

      var frameHand     = this.frame.hands[0];
      var frameFingers  = this.orderFingers( frameHand );

      // Rotates our hand according to the proper basis
      this.handBasis    =  this.getHandBasis( frameHand );
      this.hand.rotation.setFromRotationMatrix( this.handBasis );

      for( var i = 0; i < this.fingers.length; i++ ){

        var frameFinger = frameFingers[i];
        var finger      = this.fingers[i];

        // Updates each finger to have the proper rotations
        this.updateFingerRig( frameHand ,  frameFinger , finger );


      }

    }

  }



  /*
   
     UTILS

  */

  RiggedSkeleton.prototype.getHandBasis = function( hand  ){


    var rotationMatrix  = this.handRotationMatrix( hand );


    // Corrector 'corrects' for which basis
    var corrector;

    if( hand.type === 'left' ){
      corrector = this.baseMatrixLeft;
    }else{
      corrector = this.baseMatrixRight;
    }

    rotationMatrix.multiply( corrector.clone().transpose() );

    return rotationMatrix;


  }

  // need to know if basis is left or right handed
  RiggedSkeleton.prototype.matrixFromBasis = function( b , type ){
   
    var m = new THREE.Matrix4()
      
    if( type == 'left'){
      
      m.set(

        -b[0][0] , b[1][0] , b[2][0] , 0 ,
        -b[0][1] , b[1][1] , b[2][1] , 0 ,
        -b[0][2] , b[1][2] , b[2][2] , 0 ,
              0  ,      0  ,      0  , 1

      );

    }else{
      
      m.set(

        b[0][0] , b[1][0] , b[2][0] , 0 ,
        b[0][1] , b[1][1] , b[2][1] , 0 ,
        b[0][2] , b[1][2] , b[2][2] , 0 ,
             0  ,      0  ,      0  , 1

      );

    }

    return m;

  }

 
  // Gets our hand rotation matrix
  
  RiggedSkeleton.prototype.handRotationMatrix = function( hand ){

    var a1 = new THREE.Vector3().fromArray( hand.direction  );
    var a2 = new THREE.Vector3().fromArray( hand.palmNormal );
    var a3;
    
    if( hand.type == 'left' ){
      a3 = a2.clone().cross( a1 );
    }else{
      a3 = a1.clone().cross( a2 );
    }

    var matrix = new THREE.Matrix4( 
      a1.x , a2.x , a3.x, 0,
      a1.y , a2.y , a3.y, 0,
      a1.z , a2.z , a3.z, 0,
      0    , 0    , 0   , 1
    )

    return matrix; 

  }
 


  // Gets a difference between two leap vectors, in three
  
  RiggedSkeleton.prototype.threeDif = function( pos1 , pos2 ){

    var p1 = this.leapToScene( pos1 );
    var p2 = this.leapToScene( pos2 );

    return p2.sub( p1 );

  }



  // Converts from leap position to scene position
  
  RiggedSkeleton.prototype.leapToScene = function( position ){

    var p = this.frame.interactionBox.normalizePoint( position );

    var size = this.frame.interactionBox.size;

    p[0] -= .5;
    p[1] -= .5;
    p[2] -= .5;

    p[0] *= size[0];
    p[1] *= size[1];
    p[2] *= size[2];

    var pos = new THREE.Vector3().fromArray( p );

    return pos;

  }


  // Makes sure our fingers are properly ordered
  
  RiggedSkeleton.prototype.orderFingers = function( hand ){

    var fingers = hand.fingers.sort( function( f1 , f2 ){ 
      return f1.type < f2.type ? -1 : 1 
    });

    return fingers

  }



