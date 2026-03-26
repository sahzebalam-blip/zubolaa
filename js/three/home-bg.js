import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("siteBgCanvas");

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const uniforms = {
    u_time: { value: 0 },
    u_resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) +
               (c - a) * u.y * (1.0 - u.x) +
               (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return value;
      }

      vec3 blendSoft(vec3 base, vec3 tint, float amount) {
        return mix(base, base + tint, amount);
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv - 0.5;
        p.x *= u_resolution.x / max(u_resolution.y, 1.0);

        float t = u_time * 0.028;

        vec2 flowA = p * 1.6 + vec2(t * 0.50, -t * 0.22);
        vec2 flowB = p * 2.2 + vec2(-t * 0.18, t * 0.35);
        vec2 flowC = p * 3.1 + vec2(t * 0.10, t * 0.14);

        float fieldA = fbm(flowA + fbm(flowB));
        float fieldB = fbm(flowB - fbm(flowC));
        float fieldC = fbm(flowC + fieldA * 0.7);

        float hazeA = smoothstep(0.34, 0.92, fieldA) * 0.44;
        float hazeB = smoothstep(0.40, 0.95, fieldB) * 0.28;
        float hazeC = smoothstep(0.54, 0.98, fieldC) * 0.18;

        float glowCenter = exp(-length(p * vec2(0.95, 1.25)) * 2.0) * 0.12;
        float glowRight = exp(-length((p - vec2(0.34, -0.08)) * vec2(1.1, 1.45)) * 3.0) * 0.08;
        float glowLeft  = exp(-length((p + vec2(0.28, 0.14)) * vec2(1.25, 1.55)) * 3.3) * 0.05;

        vec3 col = vec3(0.010, 0.016, 0.032);

        vec3 indigo = vec3(0.11, 0.14, 0.34);
        vec3 blue   = vec3(0.06, 0.23, 0.52);
        vec3 cyan   = vec3(0.05, 0.34, 0.45);
        vec3 gold   = vec3(0.30, 0.21, 0.10);

        col = blendSoft(col, indigo, hazeA);
        col = blendSoft(col, blue, hazeB);
        col = blendSoft(col, cyan, hazeC * 0.9);
        col = blendSoft(col, gold, (fieldA * fieldC) * 0.06 + glowLeft * 0.4);

        col += blue * glowCenter;
        col += cyan * glowRight;
        col += indigo * glowLeft;

        float vignette = smoothstep(1.15, 0.16, length((uv - 0.5) * vec2(1.04, 1.22)));
        col *= vignette;

        col = pow(col, vec3(1.05));
        gl_FragColor = vec4(col, 0.95);
      }
    `,
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  const render = () => {
    uniforms.u_time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}
