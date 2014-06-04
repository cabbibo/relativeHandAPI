  
  uniform samplerCube tReflection;
  uniform sampler2D   tIri;
  uniform sampler2D   tNoise;
  uniform sampler2D tNormal;
 
  uniform float time;

  varying vec3 vPos;
  varying float fr;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  varying float vDisplacement;

  varying vec3 vLightDir;
  varying mat3 vNormalMat;

  const float noise_strength = .2;
  
  $simplex
  
  float fractNoise( vec2 v ){

    vec2 value = vec2( abs(v.x - .5 ) * 2. , abs( v.y - .5 ) * 2. );
    
    float s1 = snoise( value * .9  + vec2(  time * 3. , time * .2 ));
    float s2 = snoise( value * 2.9 + vec2( time * .4  , time * .9 ))*.5;
    float s3 = snoise( value * 5.9 + vec2(  time * 1. , time * .56 ))*.2;
    float s4 = snoise( value * 20.09+ vec2( time * .8 , time * 1.1 ) )*.01;
    float s5 = snoise( value * 10.9 + vec2(  time * 2., time * 4.0 ))*.04;


    return s1+s2+s3+s4+s5;

  }

  

  void main(void)  {


    vec3 tNorm = texture2D( tNormal , vUv ).xyz;

    tNorm = normalize( tNorm  );
    
    vec3 xLess  = vec3( vPos.xy - vec2(.0001, 0.) , fractNoise( vec2( vUv.x - .0001 , vUv.y )) );
    vec3 xMore  = vec3( vPos.xy + vec2(.0001, 0.) , fractNoise( vec2( vUv.x + .0001 , vUv.y )) );
    vec3 yLess  = vec3( vPos.xy - vec2( 0. , .0001), fractNoise( vec2( vUv.x , vUv.y - .0001 )) );
    vec3 yMore  = vec3( vPos.xy + vec2( 0. , .0001), fractNoise( vec2( vUv.x , vUv.y + .0001 )) );

    vec3 xDif = xMore - xLess;
    vec3 yDif = yMore - yLess;

   
  					
    vec3 crossNorm = normalize( cross( xDif , yDif ));
    vec3 newNormal = normalize( crossNorm + tNorm * 20.);

     vec3 nNormal = normalize( vNormalMat * newNormal  );
     vec3 nWiew = normalize(vView);
     vec3 nReflection = normalize( reflect( vView , nNormal )); 

    float s1 = snoise( vUv * 50.1);
    float s2 = snoise( vUv * 240.1);
    float s3 = snoise( vUv * 100.9 );
    vec3 noise_vector = ( vec3( s1 , s2 , s3 ) ) * noise_strength ;

      //fr = dot(vNormal, vWiew);							    //facing ratio

     vec3 refl = reflect( vLightDir , nNormal );
    float facingRatio = abs( dot(  nNormal, refl) );

     float newDot = dot( normalize( nNormal + noise_vector ), nWiew );
     float inverse_dot_view = 1.0 - max( newDot  , 0.0);
     vec3 lookup_table_color = texture2D( tIri , vec2( inverse_dot_view * facingRatio , 0.0)).rgb;

    vec3 colorRefl = abs(nReflection * .5 + vec3( .5 ));
    vec3 colorNorm =abs( nNormal * .5 + vec3( .5 ));
     gl_FragColor.rgb = textureCube( tReflection , nReflection ).rgb * textureCube( tReflection , nReflection ).rgb *textureCube( tReflection , nReflection ).rgb * 1.5 * lookup_table_color ;
     gl_FragColor.a = 1.;//vDisplacement*.1 + .9;

     /*gl_FragColor += texture2D( tNormal , vUv );

     gl_FragColor = normalize( gl_FragColor );*/

     //gl_FragColor.rgb = nNormal;//abs(nNormal);
  } 
