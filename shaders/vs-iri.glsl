
  uniform vec3 lightPos;
  uniform sampler2D tNormal;
  uniform float time;

  varying vec3 vView;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vPos;

  varying float fr;

  varying mat3 vNormalMat;
  varying vec3 vLightDir;
  varying float vDisplacement;

  $simplex

  float fractNoise( vec3 value ){

    float s1 = snoise( value * .9  + vec3(  time * 3. , time * .2  , time * .4));
    float s2 = snoise( value * 2.9 + vec3( time * .4  , time * .9 , time * 3.223))*.5;
    float s3 = snoise( value * 5.9 + vec3(  time * 1. , time * .56, time * .91 ))*.2;
    float s4 = snoise( value * 20.9+ vec3( time * .8 , time * 1.1, time * 4.34 ) )*.01;
    float s5 = snoise( value * 10.9 + vec3(  time * 2., time * 4.0, time * 1.42 ))*.04;


    return s1+s2+s3+s4+s5;

  }



  
  void main(void)
  {

    vPos = position;
    vUv = uv;

    
    //vec3 actual = newCoord( position , vUv );

    vec3 nPos = normalize( position );



    //normal = nPos;

    vDisplacement = fractNoise( normalize( position ) ) * 4.;
    vPos = vec3( position.xyz ) + normalize( position ) * vDisplacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( vPos , 1.0 );
    vUv = uv;
    vPos = position;
    vView = modelViewMatrix[3].xyz;
    vNormal = normalMatrix *  normal ;
    vNormalMat = normalMatrix;

    vec3 lightDir = normalize( lightPos -  (modelViewMatrix * vec4( vPos , 1.0 )).xyz );

    vLightDir = lightDir;
    vec3 refl = reflect( lightDir , vNormal );
    fr = dot(  vNormal, refl);							    //facing ratio
    
  }

