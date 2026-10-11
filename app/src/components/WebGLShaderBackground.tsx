import { useEffect, useRef } from 'react';

export function WebGLShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let isMounted = true;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth || 1280;
      const h = canvas.clientHeight || window.innerHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', syncSize);
    }

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;
    const ctx: WebGLRenderingContext = gl;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// Simplex-style smooth noise & fluid gradient distortion
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626, // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.22;
    
    // Slow, organic multi-frequency waves for subtle fluid drift
    float n1 = snoise(p * 0.75 + vec2(t * 0.35, -t * 0.25));
    float n2 = snoise(p * 1.4 - vec2(t * 0.2, t * 0.4) + vec2(n1 * 0.6));
    float n3 = snoise(vec2(p.y * 1.1 + t * 0.15, p.x * 0.9 - t * 0.3) + vec2(n2 * 0.4));
    
    // Sophisticated deep studio palette: velvet graphite (#0b0c10), deep indigo/slate (#111726), subtle warm violet (#1f162b), and deep midnight teal (#0b1f24)
    vec3 cDeep = vec3(0.039, 0.043, 0.055);      // #0a0b0e ultra dark base
    vec3 cSlate = vec3(0.063, 0.094, 0.145);     // Deep midnight slate
    vec3 cIndigo = vec3(0.118, 0.086, 0.165);    // Muted rich aubergine/indigo
    vec3 cTeal = vec3(0.047, 0.125, 0.141);      // Deep oceanic teal accent
    vec3 cWarmAura = vec3(0.180, 0.110, 0.200);  // Velvet plum glow

    // Blend layers based on organic fluid fields
    vec3 col = mix(cDeep, cSlate, smoothstep(-0.6, 0.7, n1));
    col = mix(col, cIndigo, smoothstep(-0.3, 0.8, n2) * 0.75);
    col = mix(col, cTeal, smoothstep(0.0, 0.9, n3) * 0.55);
    col = mix(col, cWarmAura, smoothstep(0.3, 1.1, n1 * n2 + 0.3) * 0.4);

    // Subtle vignette
    float vig = 1.0 - smoothstep(0.6, 1.6, length(uv - 0.5) * 1.3);
    col *= (0.7 + 0.3 * vig);

    gl_FragColor = vec4(col, 1.0);
}
`;

    function cs(type: number, src: string) {
      const s = ctx.createShader(type);
      if (!s) return null;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      return s;
    }

    const prog = ctx.createProgram();
    if (!prog) return;

    const vertShader = cs(ctx.VERTEX_SHADER, vs);
    const fragShader = cs(ctx.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    ctx.attachShader(prog, vertShader);
    ctx.attachShader(prog, fragShader);
    ctx.linkProgram(prog);
    ctx.useProgram(prog);

    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);

    const pos = ctx.getAttribLocation(prog, 'a_position');
    ctx.enableVertexAttribArray(pos);
    ctx.vertexAttribPointer(pos, 2, ctx.FLOAT, false, 0, 0);

    const uTime = ctx.getUniformLocation(prog, 'u_time');
    const uRes = ctx.getUniformLocation(prog, 'u_resolution');
    const uMouse = ctx.getUniformLocation(prog, 'u_mouse');

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    function render(t: number) {
      if (!isMounted || !canvas) return;
      ctx.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) ctx.uniform1f(uTime, t * 0.001);
      if (uRes) ctx.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) ctx.uniform2f(uMouse, mouse.x, mouse.y);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', syncSize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ display: 'block' }}>
      <canvas
        id="shader-canvas-ANIMATION_4"
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
