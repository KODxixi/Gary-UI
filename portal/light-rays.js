(() => {
  "use strict";

  const options = Object.freeze({
    raysOrigin: "top-center",
    raysColor: "#ffffff",
    raysSpeed: 1,
    lightSpread: 0.5,
    rayLength: 3,
    pulsating: false,
    fadeDistance: 1,
    saturation: 1,
    followMouse: true,
    mouseInfluence: 0.1,
    noiseAmount: 0,
    distortion: 0
  });

  const vertexSource = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

  const fragmentSource = `#version 300 es
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
out vec4 fragColor;

float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float rayStrength(vec2 source,vec2 referenceDir,vec2 coord,float seedA,float seedB,float speed){
  vec2 sourceToCoord=coord-source;
  vec2 dirNorm=normalize(sourceToCoord);
  float cosAngle=dot(dirNorm,referenceDir);
  float distortedAngle=cosAngle+distortion*sin(iTime*2.0+length(sourceToCoord)*0.01)*0.2;
  float spreadFactor=pow(max(distortedAngle,0.0),1.0/max(lightSpread,0.001));
  float distance=length(sourceToCoord);
  float maxDistance=iResolution.x*rayLength;
  float lengthFalloff=clamp((maxDistance-distance)/maxDistance,0.0,1.0);
  float fadeFalloff=clamp((iResolution.x*fadeDistance-distance)/(iResolution.x*fadeDistance),0.5,1.0);
  float pulse=pulsating>0.5?(0.8+0.2*sin(iTime*speed*3.0)):1.0;
  float baseStrength=clamp((0.45+0.15*sin(distortedAngle*seedA+iTime*speed))+(0.3+0.2*cos(-distortedAngle*seedB+iTime*speed)),0.0,1.0);
  return baseStrength*lengthFalloff*fadeFalloff*spreadFactor*pulse;
}
void main(){
  vec2 coord=vec2(gl_FragCoord.x,iResolution.y-gl_FragCoord.y);
  vec2 finalDir=rayDir;
  if(mouseInfluence>0.0){
    vec2 mouseDirection=normalize(mousePos*iResolution.xy-rayPos);
    finalDir=normalize(mix(rayDir,mouseDirection,mouseInfluence));
  }
  vec4 color=vec4(1.0)*rayStrength(rayPos,finalDir,coord,36.2214,21.11349,1.5*raysSpeed)*0.5;
  color+=vec4(1.0)*rayStrength(rayPos,finalDir,coord,22.3991,18.0234,1.1*raysSpeed)*0.4;
  if(noiseAmount>0.0){float n=noise(coord*0.01+iTime*0.1);color.rgb*=1.0-noiseAmount+noiseAmount*n;}
  float brightness=1.0-(coord.y/iResolution.y);
  color.r*=0.1+brightness*0.8;
  color.g*=0.3+brightness*0.6;
  color.b*=0.5+brightness*0.5;
  float gray=dot(color.rgb,vec3(0.299,0.587,0.114));
  color.rgb=mix(vec3(gray),color.rgb,saturation)*raysColor;
  fragColor=color;
}`;

  const scene = document.querySelector('[data-gary-scene-engine="light-rays"]');
  if (!scene) return;

  let sceneStatus = "loading";
  const setStatus = (value) => {
    sceneStatus = value;
    scene.dataset.sceneStatus = sceneStatus;
  };
  setStatus(sceneStatus);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let motionOverride = scene.dataset.motionOverride === "on";

  const canvas = document.createElement("canvas");
  canvas.className = "portal-scene-canvas";
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) {
    sceneStatus = "fallback";
    setStatus("fallback");
    return;
  }

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn("Light Rays scene unavailable", error);
    sceneStatus = "fallback";
    setStatus("fallback");
    return;
  }

  scene.append(canvas);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = Object.fromEntries([
    "iTime","iResolution","rayPos","rayDir","raysColor","raysSpeed","lightSpread","rayLength","pulsating","fadeDistance","saturation","mousePos","mouseInfluence","noiseAmount","distortion"
  ].map((name) => [name, gl.getUniformLocation(program, name)]));
  const rgb = options.raysColor.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16) / 255);
  gl.uniform3fv(uniforms.raysColor, rgb);
  gl.uniform1f(uniforms.raysSpeed, options.raysSpeed);
  gl.uniform1f(uniforms.lightSpread, options.lightSpread);
  gl.uniform1f(uniforms.rayLength, options.rayLength);
  gl.uniform1f(uniforms.pulsating, Number(options.pulsating));
  gl.uniform1f(uniforms.fadeDistance, options.fadeDistance);
  gl.uniform1f(uniforms.saturation, options.saturation);
  gl.uniform1f(uniforms.mouseInfluence, options.mouseInfluence);
  gl.uniform1f(uniforms.noiseAmount, options.noiseAmount);
  gl.uniform1f(uniforms.distortion, options.distortion);

  let width = 1;
  let height = 1;
  let visible = true;
  let frame = 0;
  const mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(scene.clientWidth * dpr));
    height = Math.max(1, Math.round(scene.clientHeight * dpr));
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uniforms.iResolution, width, height);
    gl.uniform2f(uniforms.rayPos, width * 0.5, -height * 0.2);
    gl.uniform2f(uniforms.rayDir, 0, 1);
  };

  const render = (time) => {
    frame = 0;
    if (!visible || document.hidden) return;
    mouse.sx = mouse.sx * 0.92 + mouse.x * 0.08;
    mouse.sy = mouse.sy * 0.92 + mouse.y * 0.08;
    gl.uniform1f(uniforms.iTime, time * 0.001);
    gl.uniform2f(uniforms.mousePos, mouse.sx, mouse.sy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduceMotion.matches && !motionOverride) {
      sceneStatus = "reduced-motion";
      setStatus(sceneStatus);
      return;
    }
    setStatus("ready");
    frame = requestAnimationFrame(render);
  };
  const start = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };

  addEventListener("gary:scene-motion-change", (event) => {
    motionOverride = event.detail?.mode === "on" || scene.dataset.motionOverride === "on";
    stop();
    start();
  });
  reduceMotion.addEventListener?.("change", () => {
    if (!motionOverride) {
      stop();
      start();
    }
  });

  addEventListener("resize", resize, { passive: true });
  addEventListener("mousemove", (event) => {
    if (!options.followMouse) return;
    const rect = scene.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width;
    mouse.y = (event.clientY - rect.top) / rect.height;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0.01 }).observe(scene);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    sceneStatus = "fallback";
    setStatus("fallback");
  });

  resize();
  start();
})();
