document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar Effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Scroll Animations (Intersection Observer)
    const fadeUpElements = document.querySelectorAll('.fade-up');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeUpElements.forEach(el => {
        observer.observe(el);
    });

    // 3. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 4. WebGL Noise Button Initialization
    const VERTEX_SHADER = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    const FRAGMENT_SHADER = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_amplitude;

      float hash(float n) { return fract(sin(n) * 753.5453123); }

      float noise(vec2 x) {
        vec2 p = floor(x), f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 157.0;
        return mix(mix(hash(n), hash(n+1.0), f.x),
                   mix(hash(n+157.0), hash(n+158.0), f.x), f.y);
      }

      float fbm(vec2 p, vec3 a) {
        return noise(p*a.x)*0.5 + noise(p*a.y)*1.5 + noise(p*a.z)*0.0125;
      }

      vec3 drawLines(vec2 uv, vec3 off, vec3 col, float t) {
        vec3 c = vec3(0.0);
        // Monochromatic elegant theme
        vec3 colors[4];
        colors[0]=vec3(0.3,0.3,0.3); colors[1]=vec3(0.6,0.6,0.6);
        colors[2]=vec3(0.8,0.8,0.8); colors[3]=vec3(1.0,1.0,1.0);
        for(int i=0;i<4;i++){
          float amp = u_amplitude;
          float period = 2.0+float(i)+2.0;
          float thick = mix(0.4,0.2,noise(uv*2.0));
          c += abs(1.0/(sin(uv.y+fbm(uv+t*0.1*period,off))*amp)*thick) * colors[i];
        }
        return c;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy / u_resolution.x) - 0.5;
        uv *= 1.5;
        float t = u_time * u_speed;
        vec3 c = drawLines(uv, vec3(65.2,40.0,4.0), vec3(1.0,1.0,1.0), t) * 0.15;
        c += drawLines(uv, vec3(2.5,1.05,1.0), vec3(0.8,0.8,0.8), t);
        gl_FragColor = vec4(c, 1.0);
      }
    `;

    function initNoiseButton(button) {
      const canvas = button.querySelector('.noise-canvas');
      const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
      if (!gl) return;

      function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        return s;
      }

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(prog); gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(prog, 'u_resolution');
      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uSpeed = gl.getUniformLocation(prog, 'u_speed');
      const uAmp = gl.getUniformLocation(prog, 'u_amplitude');

      let speed = 0.2, amplitude = 120; // Slower, softer for elegance

      function resize() {
        const dpr = Math.min(devicePixelRatio, 2);
        const r = button.getBoundingClientRect();
        canvas.width = r.width * dpr;
        canvas.height = r.height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      }
      resize();
      window.addEventListener('resize', resize);

      const start = Date.now();
      (function render() {
        const t = (Date.now() - start) / 1000;
        gl.uniform1f(uTime, t);
        gl.uniform1f(uSpeed, speed);
        gl.uniform1f(uAmp, amplitude);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
      })();

      button.addEventListener('mouseenter', () => { speed = 1.0; amplitude = 40; });
      button.addEventListener('mouseleave',() => { speed = 0.2; amplitude = 120; });
    }

    document.querySelectorAll('.noise-btn').forEach(initNoiseButton);

    // 5. Cinematic Scroll Background
    const scrollVideo = document.getElementById('scroll-bg-video');
    const scrollOverlay = document.getElementById('scroll-bg-overlay');
    const heroSection = document.getElementById('hero');

    if (scrollVideo && heroSection) {
        let targetTime = 0;
        let currentTime = 0;
        let isReady = false;
        let duration = 0;

        scrollVideo.addEventListener('loadedmetadata', () => {
            isReady = true;
            duration = scrollVideo.duration;
            scrollVideo.currentTime = 0.01; // Force first frame
        });

        window.addEventListener('scroll', () => {
            if (!isReady || !duration) return;
            const heroHeight = heroSection.offsetHeight;
            const scrollY = window.scrollY;
            
            if (scrollY >= heroHeight) {
                scrollVideo.classList.add('visible');
                scrollOverlay.classList.add('visible');
                
                const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight - heroHeight;
                let progress = 0;
                if (scrollableDistance > 0) {
                    progress = (scrollY - heroHeight) / scrollableDistance;
                }
                progress = Math.max(0, Math.min(1, progress));
                targetTime = progress * duration;
            } else {
                scrollVideo.classList.remove('visible');
                scrollOverlay.classList.remove('visible');
            }
        }, { passive: true });

        function renderLoop() {
            if (isReady && Math.abs(targetTime - currentTime) > 0.01) {
                currentTime += (targetTime - currentTime) * 0.08; // LERP
                scrollVideo.currentTime = currentTime;
            }
            requestAnimationFrame(renderLoop);
        }
        requestAnimationFrame(renderLoop);
    }
});
