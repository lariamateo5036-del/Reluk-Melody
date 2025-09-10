

import React, { useRef, useEffect } from 'react';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Dimensions } from 'react-native';

interface VisualizerProps {
  patternIndex: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ patternIndex }) => {
  const visualRef = useRef<any>({});
  let timeoutId: number;

  useEffect(() => {
    if (visualRef.current.material) {
      visualRef.current.material.uniforms.u_pattern.value = patternIndex;
    }
  }, [patternIndex]);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Dimensions.get('window').scale);

    const material = new THREE.ShaderMaterial({
        uniforms: { 
            u_time: { value: 0.0 }, 
            u_resolution: { value: new THREE.Vector2(width, height) }, 
            u_pattern: { value: patternIndex } 
        },
        vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
            uniform vec2 u_resolution; uniform float u_time; uniform float u_pattern;
            mat2 rotate2d(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }
            float random(vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453); }
            vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) { return a + b*cos( 6.28318*(c*t+d) ); }
            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
                vec3 color = vec3(0.0); float t = u_time * 0.3; int pattern = int(u_pattern);
                if (pattern <= 9) { // Solfeggio patterns
                    if (pattern == 0) { vec2 p=uv*rotate2d(.4); p.y*=1.2; float s=u_time*.8,d=10.,a=.3+sin(u_time*.2)*.1,s1x=sin(p.y*d+s)*a,d1=abs(p.x-s1x),d2=abs(p.x- -s1x); color+= pal(length(p), vec3(0.5,0.8,0.8),vec3(0.5,0.5,0.5),vec3(1.),vec3(0.,.1,.2)) * (.015/d1+.015/d2); float rf=d/2.,rp=pow(abs(cos(p.y*rf+s)),60.),rm=smoothstep(a*1.8,a*1.7,d1+d2); color+= pal(length(p)+.5, vec3(0.8,0.9,0.5),vec3(0.5,0.5,0.5),vec3(1.),vec3(0.,.1,.2)) * rp * rm * 1.5; float r_rand=random(floor(uv*20.)); color+=vec3(1.,1.,.8)*smoothstep(.99,1.,sin(r_rand*6.28+u_time))*.5; color*=1.-smoothstep(.8,1.,length(uv)); }
                    else if (pattern == 1) { vec2 st = uv * 4.; vec2 i_st = floor(st); vec2 f_st = fract(st); float m_dist = 1.; for (int y= -1; y <= 1; y++) { for (int x= -1; x <= 1; x++) { vec2 n = vec2(float(x), float(y)); vec2 p = vec2(random(i_st + n), random(i_st + n + vec2(1.,0.))); p = 0.5 + 0.5*sin(t*3. + 6.2831*p); float d = length(n + p - f_st); m_dist = min(m_dist, d); } } float g = 1. - m_dist; color = pal(g, vec3(0.5,0.8,0.5), vec3(0.5,0.5,0.5), vec3(1.,1.,0.8), vec3(0.1,0.2,0.3)) * g; }
                    else if (pattern == 2) { float r = length(uv); float a = atan(uv.y, uv.x); float v = r + .1 * sin(a * 10. - t * 4.); vec3 vc = pal(v * 2. - t, vec3(0.8,0.5,0.4), vec3(0.5,0.2,0.1), vec3(1.,0.9,0.8), vec3(0.1,0.2,0.3)); float n = random(uv*10.) * (1. - smoothstep(0.4, 1., r)); color = mix(vc, vec3(0.1,0.,0.05), n); }
                    else if (pattern == 3) { vec2 p = uv; p.x += .2 * sin(p.y * 5. + t * 2.); p.y += .2 * sin(p.x * 5. + t * 2.); float w = sin(p.x * 5.) * cos(p.y * 5.); color = pal(w + t, vec3(0.5,0.5,0.8), vec3(0.5,0.5,0.5), vec3(0.8,1.,0.7), vec3(0.2,0.3,0.4)); }
                    else if (pattern == 4){ float a=atan(uv.y,uv.x),r=length(uv); a=mod(a,3.14159/3.); a=abs(a-3.14159/6.); uv=r*vec2(cos(a),sin(a)); for(int i=1;i<7;i++){ uv=abs(uv)/dot(uv,uv)-vec2(.6+.2*sin(t*.5),.5+.2*cos(t*.7)); uv*=rotate2d(t*.3); } color = pal(length(uv)*.5 - t, vec3(.5), vec3(.5), vec3(1.,.7,.4), vec3(.8,1.,.3)); }
                    else if (pattern == 6){ float d = length(uv); float r = sin(d * 15. - t * 3.) * .5 + .5; r = smoothstep(.7, 1., r); color = pal(d*2. - t, vec3(.5), vec3(.5), vec3(1.), vec3(.3,.2,.2)) * r; }
                    else if (pattern == 7){ vec2 p = uv * rotate2d(t * .1); float r = length(p); float a = atan(p.y, p.x); float e = 1. - smoothstep(.25, .26, abs(r - (.4 + .1 * sin(t*2.)) )); float rays = pow(sin(a * 7. - t * 2.) * .5 + .5, 10.); vec3 ec = pal(r, vec3(.5), vec3(.8,.8,.5), vec3(.8,.9,.3), vec3(.6,.2,.4)); vec3 rc = pal(a/6.28, vec3(.5), vec3(.5), vec3(1.,.9,.8), vec3(.5,.1,.9)); color = ec * e + rc * rays * (1. - r*1.5); }
                    else if (pattern == 8){ float r = length(uv); vec2 p = uv * rotate2d(-t * .2 + r); float rays = .5 + .5 * sin(atan(p.y, p.x) * 8.); rays *= pow(1. - r, .5); vec3 cc = pal(t, vec3(.8,.9,.8), vec3(.2,.1,.2), vec3(1.), vec3(.7,.8,.9)); vec3 nc = pal(r*2. - t, vec3(.5), vec3(.5), vec3(.8,1.,1.), vec3(.1,.4,.6)); color = nc * (1. - r) + cc * rays; }
                    else { uv*=rotate2d(float(pattern)*.5+t*.2); float r=length(uv),a=atan(uv.y,uv.x); float v = sin(r*10.-t*2.+cos(a*(6.+float(pattern)))); color = pal(v + float(pattern)*.1, vec3(.5), vec3(.5), vec3(1.,.8,.5), vec3(.2,.3,.4)); }
                } else { // Binaural patterns
                    int bp = pattern - 10;
                    if(bp == 0){ vec2 p=uv*2.; float d=length(p); p=rotate2d(d*.5)*p; float c = sin(p.x*5.-u_time*0.5) + cos(p.y*5.-u_time*0.5); color = pal(c, vec3(.5),vec3(.5),vec3(1.),vec3(0.,.1,.6)); color *= (1. - smoothstep(0., 1.5, abs(c))); }
                    else if(bp == 1){ vec2 p=uv*3.; for(int i=1;i<4;i++){ p.x+=.2/float(i)*sin(float(i)*2.*p.y+t); p.y+=.2/float(i)*cos(float(i)*2.*p.x+t); } color = pal(p.x + p.y, vec3(.5),vec3(.5),vec3(1.,.7,.4),vec3(0.,.15,.2)); }
                    else if(bp == 2){ uv*=rotate2d(t*.2); vec2 g=fract(uv*5.); float d=min(g.x,1.-g.x); d=min(d,g.y); d=min(d,1.-g.y); color = pal(uv.x+uv.y, vec3(.5), vec3(.5), vec3(.4,.8,.5), vec3(.5,.4,.3)); color *= (1.-smoothstep(0.,.05,d)); }
                    else if(bp == 3){ float l=pow(sin(uv.x*20.+t*3.),2.)+pow(cos(uv.y*20.+t*3.),2.); color = pal(uv.x - uv.y, vec3(.8,.5,.4),vec3(.2,.4,.2),vec3(2.,1.,0.),vec3(.5,.8,.5)); color *= smoothstep(.05,.1,l); }
                    else { vec2 st=uv*5.; vec2 i_st=floor(st); float r=random(i_st); float p = 1.-smoothstep(0.,.5+r*.3,distance(fract(st),vec2(.5))); color = pal(r, vec3(.5),vec3(.5),vec3(1.),vec3(.8,.1,.3)); color *= p * (sin(u_time*r*5.)*.5+.5); }
                }
                gl_FragColor = vec4(color, 1.0);
            }`
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    visualRef.current = { material };

    const animate = () => {
      timeoutId = requestAnimationFrame(animate);
      material.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  useEffect(() => {
    return () => clearTimeout(timeoutId);
  }, []);

  return <GLView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} onContextCreate={onContextCreate} />;
};

export default Visualizer;
