  
  function AbsRiggedSkeleton( controller , params ){

    var params = params || {};

    this.size = params.size || 1;

    this.controller   = controller;
    this.hand         = new THREE.Object3D();
    this.fingers      = this.createFingers();

    /*
     * IMPORTANT: Basis vectors are columns
     */
    this.leapBasis = new THREE.Matrix4(
        1  , 0  , 0 , 0,
        0  , 1  , 0 , 0,
        0  , 0  , 1 , 0, 
        0  , 0  , 0 , 1
    );
    /*THREE.Matrix4 applyRelativeRotation(Matrix4 myBasis, Matrix4 leapRelativeRotation) {

    }*/

    this.baseMatrix = new THREE.Matrix4(
         0 ,  0 , -1 , 0,
         0 , -1 ,  0 , 0,
        -1 ,  0 ,  0 , 0, 
         0 ,  0 ,  0 , 1
    );



    
    /*this.baseMatrix = new THREE.Matrix4(
        1  , 0  , 0 , 0,
        0  , 1  , 0 , 0,
        0  , 0  , 1 , 0, 
        0  , 0  , 0 , 1
    );*/

    this.tmpMatrix    = new THREE.Matrix4();
    this.tmpQuat      = new THREE.Quaternion();
   


  }


  //1. draw each piece of a right hand using global terms
  //2. do the same thing but use relative terms.

  AbsRiggedSkeleton.prototype.applyRelativeRotation = function( myBasis , leapRelativeRotation ){


  }

  AbsRiggedSkeleton.prototype.addToScene = function( scene ){

    scene.add( this.hand );

  }

 AbsRiggedSkeleton.prototype.removeFromScene = function( scene ){

    scene.remove( this.hand );

  }

  AbsRiggedSkeleton.prototype.createFingers = function(){


    var fingers = [];

    for( var i = 0; i < 5; i++ ){

      var finger = this.createFinger();
      fingers.push( finger );

    }

    return fingers;


  }

  AbsRiggedSkeleton.prototype.createFinger = function(){

    var metacarpal    = new THREE.Object3D();
    var proximal      = new THREE.Object3D();
    var intermediate  = new THREE.Object3D();
    var distal        = new THREE.Object3D();
    var tip           = new THREE.Object3D();

    this.hand.add( metacarpal );
    this.hand.add( proximal );
    this.hand.add( intermediate );
    this.hand.add( distal );
    this.hand.add( tip );

    var finger = {

      m:metacarpal,
      p:proximal,
      i:intermediate,
      d:distal,
      t:tip

    }

    return finger;

  }

  AbsRiggedSkeleton.prototype.addJointMesh = function( mesh ){

    for( var i = 0; i < this.fingers.length; i++ ){

      var finger = this.fingers[i];

      finger.m.add( mesh.clone() );
      finger.p.add( mesh.clone() );
      finger.i.add( mesh.clone() );
      finger.d.add( mesh.clone() );
      finger.t.add( mesh.clone() );


    }

  }


  AbsRiggedSkeleton.prototype.addHandMesh = function( mesh ){

    this.hand.add( mesh.clone() );

  }

  AbsRiggedSkeleton.prototype.updateFingerRig = function( frameHand , frameFinger , ourFinger ){

    var m = frameFinger.bones[0];
    var p = frameFinger.bones[1];
    var i = frameFinger.bones[2];
    var d = frameFinger.bones[3];

    ourFinger.m.position = this.threeDif( frameHand.palmPosition , m.prevJoint );    
    ourFinger.m.position.applyMatrix4( this.hand.matrix.clone().transpose() ); 

    ourFinger.p.position = this.threeDif( frameHand.palmPosition , p.prevJoint );
    ourFinger.p.position.applyMatrix4( this.hand.matrix.clone().transpose() ); 
    
    ourFinger.i.position = this.threeDif( frameHand.palmPosition , i.prevJoint );
    ourFinger.i.position.applyMatrix4( this.hand.matrix.clone().transpose() ); 
    
    
    ourFinger.d.position = this.threeDif( frameHand.palmPosition , d.prevJoint );
    ourFinger.d.position.applyMatrix4( this.hand.matrix.clone().transpose() ); 
    
    ourFinger.t.position = this.threeDif( frameHand.palmPosition , d.nextJoint );
    ourFinger.t.position.applyMatrix4( this.hand.matrix.clone().transpose() ); 
    


    //ourFinger.m.rotation.setFromQuaternion( quat );
    abs = this.baseMatrix;
    abs = this.hand.matrix;
   
    /*
     
       Gabe Sudo Code ( GSC )

    //(1) Derive relative rotation from frameHand.Basis to frameHand.m.Basis
    var relative = this.relativeRotationMatrix( frameHand.Basis, frameHand.m.basis );
    //(2) Apply relative rotation to this.Basis
    var this.m.Basis = this.Basis * relative;
    //(3) Derive global rotation from this.Basis to this.m.Basis
    var global = this.m.Basis * this.Basis.transpose;
    //(4) Use global transformation in dependency tree
    this.m.rotation.setFromRotationMatrix(global);
  */

    var r = frameHand._rotation;
    
      var handBasis = [
        [ r[0] , r[3] , r[6] ],
        [ r[1] , r[4] , r[7] ],
        [ r[2] , r[5] , r[8] ]
      ];

    var frameHandBasis = this.matrixFromBasis( handBasis ).transpose();
    var mHandBasis     = this.matrixFromBasis( m.basis );


    var relative = this.relativeRotationMatrix( frameHandBasis , mHandBasis );

    var ourMBasis = this.hand.matrix.clone().multiply( relative );

    var global = ourMBasis.multiply( this.hand.matrix.clone().transpose() );

   // ourFinger.m.rotation.setFromRotationMatrix( frameHandBasis.clone().transpose() );



    var relative = this.relativeRotationMatrix( frameHandBasis , this.hand.matrix );

    //ourFinger.m.rotation.setFromRotationMatrix( relative );


    //HERE: Try using absolute rotation for setting TODO
    //ourFinger.m.absoluteMatrix.multiply( this.baseMatrix.transpose() );
    //ourFinger.m.rotation.setFromRotationMatrix( abs );
//    ourFinger.m.rotation.setFromRotationMatrix( relative );

   /* abs = this.matrixFromBasis( p.basis );
    var relative = this.relativeRotationMatrix( abs , this.hand.matrix );
    //ourFinger.p.rotation.setFromRotationMatrix( abs );
    ourFinger.p.rotation.setFromRotationMatrix( relative );

    abs = this.matrixFromBasis( i.basis );
    var relative = this.relativeRotationMatrix( abs , this.hand.matrix );
    //ourFinger.i.rotation.setFromRotationMatrix( abs );
    ourFinger.i.rotation.setFromRotationMatrix( relative );

    abs = this.matrixFromBasis( d.basis );
    var relative = this.relativeRotationMatrix( abs , this.hand.matrix );
    //ourFinger.d.rotation.setFromRotationMatrix( abs );
    ourFinger.d.rotation.setFromRotationMatrix( relative );

    //ourFinger.t.rotation.setFromRotationMatrix( abs );
    ourFinger.t.rotation.setFromRotationMatrix( relative );*/
    




   /* ourFinger.i.absoluteMatrix = this.matrixFromBasis( i.basis );
    ourFinger.i.rotation.setFromRotationMatrix( ourFinger.i.absoluteMatrix );
    
    ourFinger.d.absoluteMatrix = this.matrixFromBasis( d.basis );
    ourFinger.d.rotation.setFromRotationMatrix( ourFinger.d.absoluteMatrix );

    ourFinger.t.rotation.setFromRotationMatrix( ourFinger.d.absoluteMatrix );*/

    

   /* ourFinger.i.absoluteMatrix = this.matrixFromBasis( i.basis );
    ourFinger.i.relativeMatrix = this.relativeRotationMatrix( ourFinger.i.absoluteMatrix , ourFinger.p.absoluteMatrix);
*/
    //ourFinger.i.rotation.setFromRotationMatrix( ourFinger.i.relativeMatrix );


    //ourFinger.d.absoluteMatrix = this.matrixFromBasis( d.basis );

    //ourFinger.d.relativeMatrix = this.relativeRotationMatrix( ourFinger.d.absoluteMatrix , ourFinger.i.absoluteMatrix );
    //ourFinger.d.rotation.setFromRotationMatrix( ourFinger.i.relativeMatrix );

  }


  AbsRiggedSkeleton.prototype.relativeToHand = function( matrix ){

    var m = this.relativeRotationMatrix( matrix , this.hand.matrix );

    return m;

  }

  AbsRiggedSkeleton.prototype.update = function(){

    this.frame = this.controller.frame();

    if( this.frame.hands[0] ){

      //console.log( this.frame );
      var frameHand = this.frame.hands[0];

      var frameFingers = this.orderFingers( frameHand );

      var r = frameHand._rotation;
    
      var handBasis = [
        [ r[0] , r[3] , r[6] ],
        [ r[1] , r[4] , r[7] ],
        [ r[2] , r[5] , r[8] ]
      ];

     this.hand.rotation.setFromRotationMatrix( this.getHandBasis( frameHand ) );


      for( var i = 0; i < this.fingers.length; i++ ){

        var frameFinger = frameFingers[i];
        var finger      = this.fingers[i];

        this.updateFingerRig( frameHand ,  frameFinger , finger );


      }

    }

  }

  AbsRiggedSkeleton.prototype.getHandBasis = function( hand ){

    var rotationMatrix  = this.rotationMatrixFromVectors( hand.direction, hand.palmNormal );

      //rotationMatrix.multiply( this.baseMatrix );
    rotationMatrix.multiply( this.baseMatrix.clone().transpose() );

    return rotationMatrix;


  }


  AbsRiggedSkeleton.prototype.rotFromBasis = function( rotation , b , oB ){

   
    var m1 = this.matrixFromBasis( b );
    var m2 = this.matrixFromBasis( oB );

    var mat = this.relativeRotationMatrix( m1 , m2 );

    rotation.setFromRotationMatrix( mat );

  }

  AbsRiggedSkeleton.prototype.matrixFromBasis = function( b ){
   
    var m = new THREE.Matrix4(

      b[0][0] , b[1][0] , b[2][0] , 0 ,
      b[0][1] , b[1][1] , b[2][1] , 0 ,
      b[0][2] , b[1][2] , b[2][2] , 0 ,
           0  ,      0  ,      0  , 1

    );

    return m;

  }

  AbsRiggedSkeleton.prototype.relativeRotationMatrix = function( m1 , m2 ){
      
   return m1.clone().transpose().multiply(m2);
  
  }



  AbsRiggedSkeleton.prototype.globalRotationMatrix = function( m1 , m2 ){
      
   return m2.clone().multiply(m1.clone().transpose());
  
  }

  AbsRiggedSkeleton.prototype.threeDif = function( pos1 , pos2 ){

    var p1 = this.leapToScene( pos1 );
    var p2 = this.leapToScene( pos2 );

    return p2.sub( p1 );

  }

  AbsRiggedSkeleton.prototype.leapToScene = function( position ){

    var p = this.frame.interactionBox.normalizePoint( position );

    var size = this.frame.interactionBox.size;

    //console.log( size );
    p[0] -= .5;
    p[1] -= .5;
    p[2] -= .5;

    p[0] *= size[0];
    p[1] *= size[1];
    p[2] *= size[2];

    var pos = new THREE.Vector3().fromArray( p );

    return pos;

  }


  AbsRiggedSkeleton.prototype.orderFingers = function( hand ){

    var fingers = hand.fingers.sort( function( f1 , f2 ){ 
      return f1.type < f2.type ? -1 : 1 
    });

    return fingers

  }

  AbsRiggedSkeleton.prototype.rotationMatrixFromVectors = function( vec1 , vec2 ){

    var a1 = new THREE.Vector3().fromArray( vec1 );
    var a2 = new THREE.Vector3().fromArray( vec2 );
    var a3 = a1.clone().cross( a2 );

    var matrix = new THREE.Matrix4( 
      a1.x , a2.x , a3.x, 0,
      a1.y , a2.y , a3.y, 0,
      a1.z , a2.z , a3.z, 0,
      0    , 0    , 0   , 1
    )

    return matrix; 

  }

