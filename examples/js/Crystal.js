function Crystal( height , width , numOf ){

  
  var geometry = new THREE.BufferGeometry();

  geometry.addAttribute( 'position', new Float32Array( numOf * 6 * 6 * 3 ), 3 ); 
  geometry.addAttribute( 'normal', new Float32Array( numOf * 6 * 6 * 3 ), 3 );


  var positions = geometry.getAttribute( 'position' ).array;
  var normals   = geometry.getAttribute( 'normal' ).array;

  var directionPower = [0,0,0,0,0,0];

  for( var i = 0; i < numOf; i++ ){

  
      //var newHeight = height * (Math.random()*.9 +.1);
    
    // Figure out which direction we are placing the crystal in
    var which = Math.floor(  Math.random() * 6 );

    directionPower[which] ++;

    var sqr = Math.sqrt( directionPower[which] );
    var newHeight = (height * ( Math.random() * .3 +.7)) /(sqr);
    
    var posXY = this.toCart( width * sqr , (which/6) * 2 * Math.PI );
   
    var posXYExtra = this.toCart( width / sqr, ( i / 6 ) * 2 * Math.PI );

    posXY[0] += posXYExtra[0];
    posXY[1] += posXYExtra[1];
    
    
    var z     = 0;
    
    var index = i * 6 * 12 * 3;
    
  
    //  Column

    for( var j = 0; j < 6; j++ ){

      //var newHeight = height * Math.random();

      var subPosXY1 = this.toCart( width  / (2*sqr) , (j/6) * 2 * Math.PI );
      var subPosXY2 = this.toCart( width / (2*sqr) , ((j+1)/6) * 2 * Math.PI );

      fPosX1 = posXY[0] + subPosXY1[0];
      fPosY1 = posXY[1] + subPosXY1[1];

      fPosX2 = posXY[0] + subPosXY2[0];
      fPosY2 = posXY[1] + subPosXY2[1];

      var finalIndex = index + j * 12 * 3;
     
      var h1 = 0;
      var h2 = -newHeight;

      positions[ finalIndex + 0  ] = fPosX1;
      positions[ finalIndex + 1  ] = fPosY1;
      positions[ finalIndex + 2  ] = h1;

      positions[ finalIndex + 3  ] = posXY[0];
      positions[ finalIndex + 4  ] = posXY[1];
      positions[ finalIndex + 5  ] = h1;

      positions[ finalIndex + 6  ] = fPosX2;
      positions[ finalIndex + 7  ] = fPosY2;
      positions[ finalIndex + 8  ] = h1;


     
      positions[ finalIndex + 9  ] = fPosX1;
      positions[ finalIndex + 10 ] = fPosY1;
      positions[ finalIndex + 11 ] = h1;

      positions[ finalIndex + 12 ] = fPosX2;
      positions[ finalIndex + 13 ] = fPosY2;
      positions[ finalIndex + 14 ] = h1;

      positions[ finalIndex + 15 ] = fPosX1;
      positions[ finalIndex + 16 ] = fPosY1;
      positions[ finalIndex + 17 ] = h2;

      positions[ finalIndex + 18 ] = fPosX1;
      positions[ finalIndex + 19 ] = fPosY1;
      positions[ finalIndex + 20 ] = h2;
     
      positions[ finalIndex + 21 ] = fPosX2;
      positions[ finalIndex + 22 ] = fPosY2;
      positions[ finalIndex + 23 ] = h1;

      positions[ finalIndex + 24 ] = fPosX2;
      positions[ finalIndex + 25 ] = fPosY2;
      positions[ finalIndex + 26 ] = h2;



      // Top
      positions[ finalIndex + 27 ] = fPosX2;
      positions[ finalIndex + 28 ] = fPosY2;
      positions[ finalIndex + 29 ] = h2;

      positions[ finalIndex + 30 ] = posXY[0];
      positions[ finalIndex + 31 ] = posXY[1];
      positions[ finalIndex + 32 ] = h2 - (height/20);
      positions[ finalIndex + 33 ] = fPosX1;
      positions[ finalIndex + 34 ] = fPosY1;
      positions[ finalIndex + 35 ] = h2;


    }


    // Top
    

  }


  geometry.computeFaceNormals();
  geometry.computeVertexNormals();



  var material = new THREE.MeshLambertMaterial({ color: 0xcccccc , side: THREE.DoubleSide });
  var mesh = new THREE.Mesh( geometry , material );


  return mesh;

}

Crystal.prototype.createBufferGeo = function(){


}

Crystal.prototype.toCart = function( r , t ){

  var x = r * Math.cos( t );
  var y = r * Math.sin( t );

  return [ x , y ];

}
