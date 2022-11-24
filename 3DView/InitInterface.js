//当前显示轨道类型
let currentOrbit = "";

//场景
let scene = new THREE.Scene();

//地球
let earth = new THREE.SphereGeometry(63.71, 50, 50);
let textureLoader = new THREE.TextureLoader();
let texture = textureLoader.load("./Texture/Earth.jpg");
let material = new THREE.MeshLambertMaterial({
    map: texture,
});
let earthMesh = new THREE.Mesh(earth, material);
earthMesh.name = "Earth";
earthMesh.rotateY(Math.PI / 2 * 3);
let earthRotateY = earthMesh.rotation.y;
scene.add(earthMesh);

//坐标轴指示
// let axesHelp = new THREE.AxesHelper(100);
// scene.add(axesHelp);

let indicateGroup = new THREE.Group();

//旋转轴指示
let rotateAxisGeometry = new THREE.Geometry();
rotateAxisGeometry.vertices.push(new THREE.Vector3(0,-120,0),new THREE.Vector3(0,120,0));
let rotateAxisMaterial = new THREE.LineBasicMaterial({
    color:0xffffff,
});
let rotateAxis = new THREE.Line(rotateAxisGeometry,rotateAxisMaterial);
indicateGroup.add(rotateAxis);

let axisSprite_S = createSpriteText("S",110,100);
axisSprite_S.position.set(0,-130,0);
indicateGroup.add(axisSprite_S);

let axisSprite_N = createSpriteText("N",110,100);
axisSprite_N.position.set(0,130,0);
indicateGroup.add(axisSprite_N);

//赤道
let equator_Geometry = new THREE.Geometry();

for(let i=0;i<128;i++){
    let angle = Math.PI*2/128*i;
    equator_Geometry.vertices.push(new THREE.Vector3(63.8*Math.sin(angle),0,63.8*Math.cos(angle)));
}

let equator_Material = new THREE.LineBasicMaterial({
        color:0xffff00,
    });
let equator = new THREE.LineLoop(equator_Geometry,equator_Material);
indicateGroup.add(equator);
scene.add(indicateGroup);


//天空盒
scene.background = new THREE.CubeTextureLoader()
    .setPath('./skybox/')
    .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

//光源
let ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);
let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10000, 0, 10000);
scene.add(directionalLight);

//相机
let height = document.getElementById("content").clientHeight;
let width = document.getElementById("content").clientWidth;
let camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20000);
camera.position.set(200, 300, 200);
camera.lookAt(scene.position);
scene.add(camera);

//渲染器
let renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
document.getElementById("3dView").appendChild(renderer.domElement);

let clock = new THREE.Clock();

//循环渲染
function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    controls.update();

    //更新时间文本
    if (mixer !== undefined&&document.getElementById("3dView").style.display==="block") {
        mixer.update(clock.getDelta());
        document.getElementById("range").value = action.time/duration*100;
        let index = Math.floor(action.time/300);
        document.getElementById("timeText").innerHTML = timeTextArray[index];
    }
}

//视角控制器-Trackball
let controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 2;// 旋转速度
controls.zoomSpeed = 1;// 缩放速度
controls.panSpeed = 0.1;// 平移速度
controls.dynamicDampingFactor = 0.2;// 阻尼系数 越小 则滑动越大
controls.minDistance = 64;
controls.maxDistance = 3000;
render();