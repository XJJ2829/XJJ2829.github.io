let mixer, action, initRotateAngle, clip, duration, timeScale;

//模型动画播放
function ModelMove(satellites, orbitType) {
    try {

        if (satellites === undefined) {
            throw almanacError; //未读取历书，抛出异常
        } else if (coorType === "") {
            throw coorError;    //未选择轨道类型，抛出异常
        }

        //时间缩放因子
        timeScale = 864;

        let posTracks = []; //关键帧轨道集

        let startTime = document.getElementById("startTimeSelector").value;

        //卫星移动关键帧
        for (let i = 0; i < satellites.length; i++) {
            let sat = satellites[i];
            let times = [];
            let ecefValues = [];
            let eciValues = [];
            let ecefPrnValues = [];
            let eciPrnValues = [];

            for (let j = 0; j < sat.orbitPoints.length; j++) {
                let orbitPoint = sat.orbitPoints[j];
                times.push(orbitPoint.toc - startTime * 3600 - intervalJD * 86400);
                ecefValues.push(orbitPoint.ECEF_Y / 1e5, orbitPoint.ECEF_Z / 1e5, orbitPoint.ECEF_X / 1e5);
                eciValues.push(orbitPoint.ECI_Y / 1e5, orbitPoint.ECI_Z / 1e5, orbitPoint.ECI_X / 1e5);
                ecefPrnValues.push(orbitPoint.ECEF_Y / 1e5, orbitPoint.ECEF_Z / 1e5 + 10, orbitPoint.ECEF_X / 1e5);
                eciPrnValues.push(orbitPoint.ECI_Y / 1e5, orbitPoint.ECI_Z / 1e5 + 10, orbitPoint.ECI_X / 1e5);
            }

            let posTrack, satMesh, prnTrack, textSprite;

            if (orbitType === "ECEF") {
                satMesh = ecefSatGroup.children[i];
                textSprite = ecefPrnGroup.children[i];
                posTrack = new THREE.KeyframeTrack(satMesh.name + ".position", times, ecefValues);
                prnTrack = new THREE.KeyframeTrack(textSprite.name + ".position", times, ecefPrnValues);
                posTracks.push(posTrack, prnTrack);
            } else if (orbitType === "ECI") {
                satMesh = eciSatGroup.children[i];
                textSprite = eciPrnGroup.children[i];
                posTrack = new THREE.KeyframeTrack(satMesh.name + ".position", times, eciValues);
                prnTrack = new THREE.KeyframeTrack(textSprite.name + ".position", times, eciPrnValues);
                posTracks.push(posTrack, prnTrack);
            }
        }

        //动画持续时间（卫星实际运行时长，未快进）
        let length = satellites[0].orbitPoints.length;
        duration = satellites[0].orbitPoints[length - 1].toc - satellites[0].orbitPoints[0].toc;
        let periodHour = document.getElementById("periodSelector").value;
        let group = new THREE.Group();

        //ECEF轨道整体旋转，ECI轨道绕地旋转
        if (orbitType === "ECI") {
            group.add(eciSatGroup, eciPrnGroup);
            group.name = "eciGroup";
            scene.add(group, eciOrbitGroup);
            earthMesh = eciSatGroup.children[eciSatGroup.children.length - 1];
            let angle = earthMesh.rotation.y;

            let rotateTrack = new THREE.KeyframeTrack(earthMesh.name + ".rotation[y]",
                [0, duration], [angle, angle + Math.PI * 2 * periodHour / 24]);
            posTracks.push(rotateTrack);

            clip = new THREE.AnimationClip("satMove", duration, posTracks);
            mixer = new THREE.AnimationMixer(group);
            action = mixer.clipAction(clip);
        } else if (orbitType === "ECEF") {
            group.add(ecefSatGroup, ecefOrbitGroup, ecefPrnGroup);
            group.name = "ecefGroup";
            scene.add(group);

            let rotateTrack = new THREE.KeyframeTrack("group.rotation[y]", [0, duration], [0, Math.PI * 2 * periodHour / 24]);
            posTracks.push(rotateTrack);

            clip = new THREE.AnimationClip("orbitMove", duration, posTracks);
            mixer = new THREE.AnimationMixer(group);
            action = mixer.clipAction(clip);
        }

        //播放设定
        action.timeScale = 0;
        action.loop = THREE.LoopRepeat;
        action.play();

        //将动画链接到动画控制按钮
        let range = document.getElementById("range");
        range.oninput = function () {
            action.time = duration * (range.value / 100);
            action.timeScale = 0;
        }

        document.getElementById("playButton").onclick = Play;
        document.getElementById("pauseButton").onclick = Pause;
    } catch (error) {
        if (error === almanacError) {
            alert(error);
        } else if (error === coorError) {
            alert(error);
        }
    }
}

//3D动画播放
function Play() {
    action.timeScale = timeScale;
    if (action.paused === true) {
        action.paused = false;
    }
}

//3D动画暂停
function Pause() {
    if (action.paused === false) {
        action.paused = true;
    }
}

//初始TOC时刻，本初子午线与Threejs坐标系Z轴夹角
function EarthInitPos(toc) {
    let daySecond = toc % 86400;
    initRotateAngle = Math.PI * 2 / 86400 * daySecond;
}
