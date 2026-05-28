/**
 * scene.js — Three.js 3D Scene (Layer 0)
 *
 * Renders a procedural Formula Student Upright (Al 6061-T6 suspension
 * component) at z-index 0 as a persistent WebGL canvas.
 *
 * Public API:
 *   ThreeScene.init()
 *   ThreeScene.morphTopology(targetState)  0=baseline, 1=optimized
 *
 * Architecture note:
 *   The render loop (rAF) never blocks the Event Loop. All heavy
 *   geometry is built once at init(); the loop only updates uniforms,
 *   rotates objects and runs renderer.render().
 */

window.ThreeScene = (function () {

  /* ──────────────────────────────────────────────────────────────
     Module state — all renderer objects live here
  ────────────────────────────────────────────────────────────── */
  var renderer, scene, camera, clock;
  var baseGroup, optGroup, wireGroup, particles, bgGroup;
  var mouse = { x: 0, y: 0 };
  var cameraTarget = { x: 0, y: 0.4 };

  /* Shader uniforms shared across all stress meshes */
  var stressUniforms = {
    uTime:      { value: 0.0 },
    uIntensity: { value: 0.0 },
  };

  /* ──────────────────────────────────────────────────────────────
     MATERIALS
  ────────────────────────────────────────────────────────────── */

  function darkMetalMat() {
    return new THREE.MeshPhysicalMaterial({
      color:         0x1e2234,
      metalness:     0.95,
      roughness:     0.18,
      clearcoat:     0.6,
      clearcoatRoughness: 0.12,
    });
  }

  /* Custom GLSL stress-heat-map shader — animates Von Mises colour */
  function stressMat() {
    return new THREE.ShaderMaterial({
      uniforms: stressUniforms,
      vertexShader: [
        'varying vec3 vPos;',
        'varying vec3 vNrm;',
        'void main(){',
        '  vPos = position;',
        '  vNrm = normalize(normalMatrix * normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uIntensity;',
        'varying vec3 vPos;',
        'varying vec3 vNrm;',
        /* Heat-map: dark-blue → cyan → yellow → red */
        'vec3 heatmap(float t){',
        '  t = clamp(t,0.0,1.0);',
        '  if(t<0.33) return mix(vec3(0.08,0.10,0.22), vec3(0.0,0.52,1.0),  t*3.0);',
        '  if(t<0.66) return mix(vec3(0.0,0.52,1.0),  vec3(1.0,0.80,0.0), (t-0.33)*3.0);',
        '  return mix(vec3(1.0,0.80,0.0), vec3(1.0,0.23,0.19), (t-0.66)*3.0);',
        '}',
        'void main(){',
        '  float r   = length(vPos.xy) * 0.85;',
        '  float s   = sin(r*3.14 - uTime*0.7)*0.5+0.5;',
        '  s          = pow(s,1.4) * uIntensity;',
        '  vec3 base  = vec3(0.12,0.13,0.20);',
        '  vec3 col   = mix(base, heatmap(s), uIntensity);',
        /* Fresnel rim accent in cyan */
        '  float rim  = 1.0-abs(dot(vNrm, vec3(0,0,1)));',
        '  col       += vec3(0.0,0.52,1.0)*rim*0.12*uIntensity;',
        '  gl_FragColor = vec4(col,1.0);',
        '}',
      ].join('\n'),
    });
  }

  /* ──────────────────────────────────────────────────────────────
     GEOMETRY: Formula Student Upright
     Procedural assembly of BoxGeometry, CylinderGeometry, TorusGeometry
     shaped to resemble a real aluminium suspension upright.
  ────────────────────────────────────────────────────────────── */

  function buildMount(mat) {
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.10, 0.20), mat));
    var eye = mesh(new THREE.TorusGeometry(0.10, 0.032, 8, 16), mat);
    eye.rotation.y = Math.PI / 2;
    eye.position.x = 0.29;
    g.add(eye);
    return g;
  }

  function buildUpright(stressed) {
    var g  = new THREE.Group();
    var m  = stressed ? stressMat() : darkMetalMat();

    /* Central vertical plate */
    g.add(mesh(new THREE.BoxGeometry(1.10, 2.40, 0.14), m));

    /* Hub bearing ring + bore */
    var ring = mesh(new THREE.TorusGeometry(0.38, 0.075, 12, 32), m);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 0.22;
    g.add(ring);
    var bore = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.46, 24), m);
    bore.rotation.x = Math.PI / 2;
    bore.position.z = 0.22;
    g.add(bore);

    /* Upper A-arm mounts */
    [-0.55, 0.55].forEach(function (sx) {
      var mt = buildMount(m);
      mt.position.set(sx, 1.0, 0);
      mt.rotation.z = sx < 0 ? -0.3 : 0.3;
      g.add(mt);
    });

    /* Lower A-arm mounts */
    [-0.55, 0.55].forEach(function (sx) {
      var mt = buildMount(m);
      mt.position.set(sx, -0.85, 0);
      mt.rotation.z = sx < 0 ? 0.3 : -0.3;
      g.add(mt);
    });

    /* Brake caliper mount */
    g.add(posMesh(new THREE.BoxGeometry(0.28, 0.48, 0.24), m, [-0.50, 0.12, 0.16]));

    /* Steering arm */
    var steer = mesh(new THREE.BoxGeometry(0.65, 0.09, 0.17), m);
    steer.position.set(0.30, -0.55, 0.13);
    steer.rotation.z = -0.15;
    g.add(steer);

    /* Structural ribs — baseline has more material */
    var ribCount = stressed ? 3 : 6;
    for (var i = 0; i < ribCount; i++) {
      var x = -0.45 + i * (0.9 / ribCount);
      g.add(posMesh(new THREE.BoxGeometry(0.055, 1.75, 0.11), m, [x, 0.05, 0]));
    }

    return g;
  }

  /* ──────────────────────────────────────────────────────────────
     WIREFRAME overlay for the optimised state
  ────────────────────────────────────────────────────────────── */

  function buildWireframe(sourceGroup) {
    var wg = new THREE.Group();
    sourceGroup.traverse(function (child) {
      if (!child.isMesh) return;
      var wGeo = new THREE.WireframeGeometry(child.geometry);
      var wMat = new THREE.LineBasicMaterial({
        color: 0xFF3B30,
        transparent: true,
        opacity: 0.0,
      });
      var ws = new THREE.LineSegments(wGeo, wMat);
      ws.position.copy(child.getWorldPosition(new THREE.Vector3()));
      ws.rotation.copy(child.rotation);
      ws.scale.copy(child.scale);
      wg.add(ws);
    });
    return wg;
  }

  /* ──────────────────────────────────────────────────────────────
     PARTICLES — "material dissolution" effect during transition
  ────────────────────────────────────────────────────────────── */

  function buildParticles() {
    var count = 800;
    var pos   = new Float32Array(count * 3);
    var vels  = [];
    for (var i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*2.2;
      pos[i*3+1] = (Math.random()-0.5)*4.2;
      pos[i*3+2] = (Math.random()-0.5)*0.8;
      vels.push({
        x: (Math.random()-0.5)*0.025,
        y: (Math.random()-0.5)*0.018 - 0.006,
        z: Math.random()*0.022,
      });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0x0A84FF,
      size: 0.05,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    var pts = new THREE.Points(geo, mat);
    pts.userData.vels = vels;
    return pts;
  }

  /* ──────────────────────────────────────────────────────────────
     BACKGROUND — grid + ambient micro-particles
  ────────────────────────────────────────────────────────────── */

  function buildBackground() {
    var bg = new THREE.Group();

    /* Horizon grid */
    var grid = new THREE.GridHelper(40, 50, 0x0A84FF, 0x070A14);
    grid.position.y = -3.5;
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    bg.add(grid);

    /* Ambient floating dots */
    var count = 300;
    var pos = new Float32Array(count*3);
    for (var i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*22;
      pos[i*3+1] = (Math.random()-0.5)*14;
      pos[i*3+2] = (Math.random()-0.5)*12 - 4;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    bg.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x0A84FF,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    })));

    return bg;
  }

  /* ──────────────────────────────────────────────────────────────
     LIGHTING
  ────────────────────────────────────────────────────────────── */

  function setupLights() {
    scene.add(new THREE.AmbientLight(0x1a1a2e, 4.0));

    var key = new THREE.DirectionalLight(0xffffff, 5.0);
    key.position.set(3, 5, 5);
    scene.add(key);

    var fill = new THREE.DirectionalLight(0x0A84FF, 2.5);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    var rim = new THREE.PointLight(0x32D74B, 3.0, 12);
    rim.position.set(0, -3, 2.5);
    scene.add(rim);

    var top = new THREE.PointLight(0x0A84FF, 2.0, 10);
    top.position.set(0, 5, 0);
    scene.add(top);
  }

  /* ──────────────────────────────────────────────────────────────
     UTILITY HELPERS
  ────────────────────────────────────────────────────────────── */

  function mesh(geo, mat) { return new THREE.Mesh(geo, mat); }

  function posMesh(geo, mat, pos) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    return m;
  }

  function setGroupOpacity(group, opacity) {
    group.traverse(function (child) {
      if (child.isMesh || child.isLineSegments) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    });
  }

  function setWireOpacity(group, opacity) {
    group.traverse(function (child) {
      if (child.isLineSegments) {
        child.material.opacity = opacity;
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────
     PUBLIC: init()
  ────────────────────────────────────────────────────────────── */

  function init() {
    var canvas = document.getElementById('bg-3d-scene');

    /* Renderer — ACES tonemapping for cinematic look */
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0A0A0C, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    scene  = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A0C, 0.048);

    camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.4, 7.5);

    clock  = new THREE.Clock();

    /* Build scene objects */
    baseGroup = buildUpright(false);
    baseGroup.position.y = 0.4;
    scene.add(baseGroup);

    optGroup = buildUpright(true);
    optGroup.position.y = 0.4;
    optGroup.visible = false;
    scene.add(optGroup);

    wireGroup = buildWireframe(optGroup);
    wireGroup.position.y = 0.4;
    wireGroup.visible = false;
    scene.add(wireGroup);

    particles = buildParticles();
    scene.add(particles);

    bgGroup = buildBackground();
    scene.add(bgGroup);

    setupLights();

    /* Events */
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize',    onResize);

    /* Start render loop */
    animate();
  }

  function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2.0;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2.0;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ──────────────────────────────────────────────────────────────
     PUBLIC: morphTopology(target)
     Called by the state machine when transitions fire.
     Uses anime.js for smooth tweening of shader uniforms and opacity.
  ────────────────────────────────────────────────────────────── */

  function morphTopology(target) {

    if (target === 1) {
      /* ── BASELINE → OPTIMIZED ─────────────────────────── */
      optGroup.visible  = true;
      wireGroup.visible = true;
      setGroupOpacity(optGroup,  0);
      setWireOpacity(wireGroup,  0);

      /* Particle burst — signals material removal */
      particles.material.opacity = 0.9;

      /* Fade out baseline */
      anime({
        targets: { o: 1 },
        o: 0,
        duration: 700,
        easing: 'easeInCubic',
        update: function (a) {
          setGroupOpacity(baseGroup, a.animations[0].currentValue);
        },
        complete: function () { baseGroup.visible = false; },
      });

      /* Ramp stress shader */
      anime({
        targets: stressUniforms.uIntensity,
        value: 1.0,
        duration: 2200,
        delay: 300,
        easing: 'easeInOutCubic',
        update: function () {
          var v = stressUniforms.uIntensity.value;
          setGroupOpacity(optGroup,  Math.min(v * 1.2, 1));
          setWireOpacity(wireGroup,  v * 0.65);
        },
      });

      /* Dissolve particles */
      anime({ targets: particles.material, opacity: 0, duration: 1800, delay: 600, easing: 'easeOutCubic' });

    } else {
      /* ── OPTIMIZED → BASELINE ─────────────────────────── */
      baseGroup.visible = true;
      setGroupOpacity(baseGroup, 0);

      /* Fade in baseline */
      anime({
        targets: { o: 0 },
        o: 1,
        duration: 900,
        delay: 200,
        easing: 'easeOutCubic',
        update: function (a) {
          setGroupOpacity(baseGroup, a.animations[0].currentValue);
        },
      });

      /* Ramp down stress shader */
      anime({
        targets: stressUniforms.uIntensity,
        value: 0.0,
        duration: 900,
        easing: 'easeInCubic',
        update: function () {
          var v = stressUniforms.uIntensity.value;
          setGroupOpacity(optGroup,  Math.max(v, 0));
          setWireOpacity(wireGroup,  v * 0.65);
        },
        complete: function () {
          optGroup.visible  = false;
          wireGroup.visible = false;
        },
      });
    }
  }

  /* ──────────────────────────────────────────────────────────────
     ANIMATION LOOP
     Target: 60 FPS. Budget: ~16 ms per frame.
     All calculations are O(1) or bounded by particle count.
  ────────────────────────────────────────────────────────────── */

  function animate() {
    requestAnimationFrame(animate);
    var delta   = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    /* Update stress shader time */
    stressUniforms.uTime.value = elapsed;

    /* Slow rotation — gives cinematic weight to the component */
    var rot = delta * 0.28;
    if (baseGroup)  baseGroup.rotation.y  += rot;
    if (optGroup)   optGroup.rotation.y   += rot;
    if (wireGroup)  wireGroup.rotation.y  += rot;

    /* Breathing scale — subtle life */
    var breathe = 1 + Math.sin(elapsed * 0.6) * 0.003;
    if (baseGroup)  baseGroup.scale.setScalar(breathe);
    if (optGroup)   optGroup.scale.setScalar(breathe);

    /* Smooth camera parallax from mouse — adds depth perception */
    cameraTarget.x += (mouse.x * 1.8 - cameraTarget.x) * 0.04;
    cameraTarget.y += (mouse.y * 1.1 + 0.4 - cameraTarget.y) * 0.04;
    camera.position.x = cameraTarget.x;
    camera.position.y = cameraTarget.y;
    camera.lookAt(0, 0.3, 0);

    /* Particle drift animation */
    if (particles && particles.geometry) {
      var pos  = particles.geometry.attributes.position.array;
      var vels = particles.userData.vels;
      for (var i = 0; i < vels.length; i++) {
        pos[i*3]   += vels[i].x;
        pos[i*3+1] += vels[i].y;
        pos[i*3+2] += vels[i].z;
        if (pos[i*3+1] < -4.5) pos[i*3+1] = 4.5;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  return { init: init, morphTopology: morphTopology };

}());
