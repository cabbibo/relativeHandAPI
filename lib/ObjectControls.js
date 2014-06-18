
  function ObjectControls( eye , hand1 , hand2 , controller , params ){

    this.controller   = controller;
    this.eye          = eye;
  
    this.hand           = hand1;
    this.handSecondary  = hand2;
    this.position       = this.hand.position;
    
    this.objects      = [];

    var params = params || {};

    var indicator = new THREE.Mesh( 
      new THREE.IcosahedronGeometry( 10 , 2 ),
      new THREE.MeshBasicMaterial({ color:0x0000ff })
    );

    this.selectionStrength  = params.selectionStrength  || .5;
    this.indicator          = params.indicator || indicator; 

    this.pinchStrength  = 0;
    this.oPinchStrength = 0;

    this.intersected;
    this.selected;
    this.oFrame;
    this.frame;
    this.selectedFrame;
    this.dFromSelected;


    this.rotating = false;

    
    this.raycaster    = new THREE.Raycaster();

    this.raycaster.near   = this.eye.near;
    this.raycaster.far    = this.eye.far;


  }

  /*

     EVENTS

  */

  ObjectControls.prototype._hoverOut =  function( object ){

    this.objectHovered = false;
    
    if( object.hoverOut ) object.hoverOut();
  
    this.hoverOut();

  };

  ObjectControls.prototype.hoverOut = function(){};


  ObjectControls.prototype._hoverOver = function( object ){
     
    this.objectHovered = true;
    
    if( object.hoverOver ) object.hoverOver();

    this.hoverOver();
  
  };

  ObjectControls.prototype.hoverOver = function(){}


  ObjectControls.prototype._select = function( object , intersectionPoint ){
      
    this.selected       = object;
    this.selectFrame    = this.frame;
    this.dFromSelected  = this.hand.position.clone().sub( this.selected.position.clone().add( intersectionPoint ) ).length();
    this.intersectionPoint = intersectionPoint;
   
    if( object.select ) object.select();

    this.select();

  };

  ObjectControls.prototype.select = function(){}

  
  ObjectControls.prototype._deselect = function( object ){
     
    this.selected = undefined;
    this.selectFrame = undefined;
    this.dFromSelected = undefined;
    this.intersectionPoint = undefined;
    this.rotating     = false;

    console.log( object );
    if( object.deselect ) object.deselect();
    this.deselect();

  };

  ObjectControls.prototype.deselect = function(){}


  /*

     Visual feedback

  */

  ObjectControls.prototype.linkToHand = function( object ){
   
    this.hand.add( object );

  };

  

  ObjectControls.prototype.addIndicator = function(){

    this.hand.add( this.indicator );
  
  };





  /*
  
    Changing what objects we are controlling 

  */

  ObjectControls.prototype.add = function( object ){

    this.objects.push( object );

  };

  ObjectControls.prototype.remove = function( object ){

    for( var i = 0; i < this.objects.length; i++ ){

      if( this.objects[i] == object ){
    
        this.objects.splice( i , 1 );

      }

    }

  };


  
  
  /*

     Update Loop

  */

  ObjectControls.prototype.update = function(){

    this.oFrame = this.frame;
    this.frame = this.controller.frame();

    if( this.frame.hands[1] && this.oFrame.hands[1] ){

      if( this.selected ){

        this.checkForRotation( this.frame.hands[1] , this.oFrame.hands[1] );

      }

    }else{

      this.rotating = false;

    }

    if( this.frame.hands[0] && this.oFrame.hands[0] ){

      this.checkForSelection( this.frame.hands[0] , this.oFrame.hands[0] );
      
      if( !this.selected ){
    
        this.checkForIntersections();

      }else{

        this.updateSelected( this.frame.hands[0] );

      }


    }





  };

  ObjectControls.prototype.updateSelected = function( hand ){


    var dif = this.hand.position.clone().sub( this.eye.position ).normalize();

      
    var pos = this.hand.position.clone().add( dif.clone().multiplyScalar( this.dFromSelected ) );


    pos.sub( this.intersectionPoint );

    this.selected.position.copy( pos );

    if( this.rotating === true ){

      this.updateRotation( 
        this.frame.hands[0].palmPosition, 
        this.frame.hands[1].palmPosition, 
        this.oFrame.hands[1].palmPosition
      );

    }


  };
 
  ObjectControls.prototype.updateRotation = function( o , v1 , v2 ){
  
    var o   = new THREE.Vector3().fromArray( o );
    var v1  = new THREE.Vector3().fromArray( v1 );
    var v2  = new THREE.Vector3().fromArray( v2 );

    var d1 = v1.sub( o ); d1.normalize();
    var d2 = v2.sub( o ); d2.normalize();

    var angle = d1.angleTo( d2 );

    var axis  = d2.cross( d1 );
    axis.normalize();

    var quat = new THREE.Quaternion();
    quat.setFromAxisAngle( axis , angle );

    var toRotate = new THREE.Quaternion().setFromEuler( this.selected.rotation );

   // quat.multiply( toRotate.clone() );

    quat.multiply( toRotate );
   // toRotate.multiply( quat );

   // console.log( this.selected.rotation );
    this.selected.rotation.setFromQuaternion( quat );

    //this.selected.

  }
  
  /*
   
    Checks 

  */

  ObjectControls.prototype.checkForIntersections = function(){

    var origin    = this.hand.position;
    var direction = origin.clone()
   
    direction.sub( this.eye.position.clone() );
    direction.normalize();

    this.raycaster.set( origin , direction );

    var intersected =  this.raycaster.intersectObjects( this.objects );

    if( intersected.length > 0 ){

      this.objectIntersected( intersected );

    }else{

      this.noObjectIntersected();

    }

  };

  ObjectControls.prototype.checkForSelection = function( hand , oHand ){

    var sS = this.selectionStrength;  // thats a long variable name ;)

    this.pinchStrength = hand.pinchStrength;
    this.oPinchStrength = oHand.pinchStrength

    if( this.pinchStrength  > sS && this.oPinchStrength <= sS ){

      this.indicator.material.color = new THREE.Color( 1 , 0 , 0 );
      if( this.intersected ){
        this.indicator.material.color = new THREE.Color( .1 , 1. , .3 );

        var intersectionPoint = this.getIntersectionPoint( this.intersected );
        
        this._select( this.intersected , intersectionPoint );
      }

    }else if( this.pinchStrength  <= sS && this.oPinchStrength  > sS ){

      this.indicator.material.color = new THREE.Color( 0 , 0 , 1 );
      
      if( this.selected ){

        this._deselect( this.selected );

      }


    }


  };

  ObjectControls.prototype.getIntersectionPoint = function( i ){

    var intersected =  this.raycaster.intersectObjects( this.objects );
   
    console.log( intersected );
    return intersected[0].point.sub( i.position );

  }


  ObjectControls.prototype.checkForRotation = function( hand , oHand ){

    var sS = this.selectionStrength;

    var pS = hand.pinchStrength;
    var oPS = oHand.pinchStrength;

    if( pS > sS && oPS < sS ){

      this.rotating = true;

    }else if( pS <= sS && oPS > sS ){

      this.rotating = false;

    }

    

  }




  /*
   
     Raycast Events

  */
  ObjectControls.prototype.objectIntersected = function( intersected ){

    // Assigning out first intersected object
    // so we don't get changes everytime we hit 
    // a new face
    var firstIntersection = intersected[0].object;

    if( !this.intersected ){

      this.intersected = firstIntersection;

      this._hoverOver( this.intersected );


    }else{

      if( this.intersected != firstIntersection ){

        this._hoverOut( this.intersected );

        this.intersected = firstIntersection;

        this._hoverOver( this.intersected );

      }

    }

  };

  ObjectControls.prototype.noObjectIntersected = function(){

    if( this.intersected  ){

      this._hoverOut( this.intersected );
      this.intersected = undefined;

    }


  };





  /*

     Utils

  */

  ObjectControls.prototype.leapToScene = function( frame , position , size ){

    var nPoint = frame.interactionBox.normalizePoint( position );
    
    nPoint[0] -= .5;
    nPoint[1] -= .5;
    nPoint[2] -= .5;

    var v = new THREE.Vector3().fromArray( nPoint );
    
    v.multiplyScalar( size );

    return v;

  };

  ObjectControls.prototype.leapToCamera = function( frame , position , size ){

    var v = this.leapToScene( frame , position , size );

    v.z -= size;
    v.applyMatrix4( this.eye.matrix );

    return v;

  };

