
  function ObjectControls( eye , hand1 , hand2 , controller , params ){

    this.intersected;
    this.selected;
    this.oFrame;
    this.frame;
    this.selectedFrame;
    this.dFromSelected;

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
    this.indicator          = params.indicator          || indicator; 

    this.neutralColor       = params.neutralColor       || new THREE.Color( .5 , .5 , .5 );
    this.hoverColor         = params.hoverColor         || new THREE.Color( 1 , .6 , 0 );
    this.downColor          = params.downColor          || new THREE.Color( 1 , 0 , 0 );
    this.selectColor        = params.selectColor        || new THREE.Color( 0 , 1 , 0 );

    this.upDownEvent        = params.upDownEvent        || this.pinchEvent
    this.selectedUpdate     = params.selectedUpdate     || this.translateSelected
      
    
    this.raycaster          = new THREE.Raycaster();

    this.raycaster.near     = this.eye.near;
    this.raycaster.far      = this.eye.far;


  }

  /*

     EVENTS

  */

  

  // You can think of _up and _down as mouseup and mouse down

  ObjectControls.prototype._down = function(){

    this.down();
    this.indicator.material.color = this.downColor;

    if( this.intersected ){
      
      this._select( this.intersected  );

    }

  }

  ObjectControls.prototype.down = function(){}



  ObjectControls.prototype._up = function(){

    this.up();

    this.indicator.material.color = this.neutralColor;
      
    if( this.selected ){

      this._deselect( this.selected );

    }

  }

  ObjectControls.prototype.up = function(){}



  ObjectControls.prototype._hoverOut =  function( object ){

    this.hoverOut();
    
    this.objectHovered = false;
    
    this.indicator.material.color = this.neutralColor;
    
    if( object.hoverOut ){
      object.hoverOut( this );
    }
  
  };

  ObjectControls.prototype.hoverOut = function(){};




  ObjectControls.prototype._hoverOver = function( object ){
     
    this.hoverOver();
    
    this.objectHovered = true;
    
    this.indicator.material.color = this.hoverColor;

    if( object.hoverOver ){
      object.hoverOver( this );
    }
  
  };

  ObjectControls.prototype.hoverOver = function(){}



  ObjectControls.prototype._select = function( object ){
   
    console.log('SELECT');

    this.select();
                
    this.indicator.material.color = this.selectColor;
    
    var intersectionPoint = this.getIntersectionPoint( this.intersected );

    this.selected       = object;
    this.selectFrame    = this.frame;
    this.dFromSelected  = this.hand.position.clone().sub( this.selected.position.clone().add( intersectionPoint ) ).length();
    this.intersectionPoint = intersectionPoint;
   
    if( object.select ){
      object.select( this );
    }

  };

  ObjectControls.prototype.select = function(){}


  
  ObjectControls.prototype._deselect = function( object ){
    
    console.log('DESELECT');

    this.selected = undefined;
    this.selectFrame = undefined;
    this.dFromSelected = undefined;
    this.intersectionPoint = undefined;
    this.rotating     = false;

    if( object.deselect ){
      object.deselect( this );
    }

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

    if( this.frame.hands[0] && this.oFrame.hands[0] ){

      this.checkForUpDown( this.frame.hands[0] , this.oFrame.hands[0] );
      
      if( !this.selected ){
    
        this.checkForIntersections();

      }else{

        this._updateSelected( this.frame.hands[0] );

      }


    }


  };

  ObjectControls.prototype._updateSelected = function( hand ){

    this.updateSelected( hand );

    this.selectedUpdate();


    if( this.selected.update ){

      this.selected.update( this );

    }

  }
  
  ObjectControls.prototype.updateSelected = function( hand ){};
  
  /*
   
    Checks 

  */

  ObjectControls.prototype.checkForIntersections = function(){

    var origin    = this.hand.position;
    var direction = origin.clone()
   
    direction.sub( this.eye.position );
    direction.normalize();

    this.raycaster.set( origin , direction );

    var intersected =  this.raycaster.intersectObjects( this.objects );

    if( intersected.length > 0 ){

      this.objectIntersected( intersected );

    }else{

      this.noObjectIntersected();

    }

  };

  ObjectControls.prototype.checkForUpDown = function( hand , oHand ){

    if( this.upDownEvent( this.selectionStrength , hand , oHand ) === true ){
    
      this._down();
    
    }else if( this.upDownEvent( this.selectionStrength , hand , oHand ) === false ){
    
      this._up();
    
    }
  
  };




  ObjectControls.prototype.getIntersectionPoint = function( i ){

    var intersected =  this.raycaster.intersectObjects( this.objects );
   
    return intersected[0].point.sub( i.position );

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
  
     Default Up Down Functions

  */

  ObjectControls.prototype.pinchEvent = function( cutoff , hand , oHand ){

    var pinchStrength = hand.pinchStrength;
    var oPinchStrength = oHand.pinchStrength

    if( pinchStrength  > cutoff && oPinchStrength <= cutoff ){

      return true;

    }else if( pinchStrength  <= cutoff && oPinchStrength  > cutoff ){

      return false;

    }

  }

  // TODO
  ObjectControls.prototype.thumbTriggerEvent = function(){


  }



  /*
  
     Default Update Functions

  */

  ObjectControls.prototype.translateSelected = function(){

    var dif = this.hand.position.clone().sub( this.eye.position ).normalize();
      
    var pos = this.hand.position.clone().add( dif.clone().multiplyScalar( this.dFromSelected ) );

    pos.sub( this.intersectionPoint );

    this.selected.position.copy( pos );
  
  }



