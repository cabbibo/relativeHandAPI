function Crystal(){

  var 

  var geo = new THREE.BufferGeometry();

  geo.addAttribute( 'position', new Float32Array( subSize * 6 * 3 ), 3 ); 
  geo.addAttribute( 'normal', new Float32Array( subSize * 6 * 3 ), 3 );


  var positions = geo.getAttribute( 'position' ).array;
  var normals   = geo.getAttribute( 'normal' ).array;


  for( var i = 0; i < 6; i++ ){


    var posXY = this.toCart( 100 , (i/6 ) * 2 * Math.PI );
    var z     = 0;

    var index = i





  }



}

Crystal.prototype.createBufferGeo = function(){


}

Crystal.prototype.toCart = function( r , t ){

  var x = r * Math.cos( t );
  var y = r * Math.sin( t );

  return [ x , y ];

}
