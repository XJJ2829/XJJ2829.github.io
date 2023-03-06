//轨道与卫星对象组
let eciSatGroup;
let ecefSatGroup;
let eciOrbitGroup;
let ecefOrbitGroup;
let ecefPrnGroup;
let eciPrnGroup;

//北斗卫星类型
let GEO = ["C01", "C02", "C03", "C04", "C05", "C59", "C60", "C61"];    //8颗
let MEO = ["C11", "C12", "C14", "C19", "C20", "C21", "C22", "C23", "C24", "C25", "C26", "C27", "C28",
    "C29", "C30", "C32", "C33", "C34", "C35", "C36", "C37", "C41", "C42", "C43", "C44", "C45", "C46", "C57", "C58"]; //29颗
let IGSO = ["C06", "C07", "C08", "C09", "C10", "C13", "C16", "C31", "C38", "C39", "C40", "C56"];   //12颗

//异常消息
let almanacError = "请进行历书设置并读取.";
let stationError = "请进行测站设置并读取.";
let coorError = "请先选择轨道类型.";

//轨道类型
let coorType = "";

//动画时间轴
let TOSPTimeLine, SkyPlotTimeLine;

//创建精灵文本
function createSpriteText(PRN, x, y) {
    //先用画布将文字画出
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffff00";
    ctx.font = "Bold 100px Arial";
    ctx.fillText(PRN, x, y);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    //使用Sprite显示文字
    let material = new THREE.SpriteMaterial({map: texture, transparent: true});
    let textObj = new THREE.Sprite(material);
    textObj.scale.set(0.5 * 100, 0.25 * 100, 0.75 * 100);
    return textObj;
}

//绘制轨道与、卫星、PRN号模型
function DrawOrbit(satellites, orbitType) {
    try {
        //若未进行历书参数设定，则抛出异常
        if (satellites === undefined) {
            throw almanacError;
        }

        document.getElementById("3dView").style.display = "block";
        document.getElementById("SkyPlotDiv").style.display = "none";
        document.getElementById("TOSPDiv").style.display = "none";
        document.getElementById("Charts").style.display = "none";
        document.getElementById("playAndPause").style.display = "block";
        document.getElementById("range").value = "0";
        document.getElementById("timeText").style.display = "block";
        document.getElementById("GEOOn").checked = true;
        document.getElementById("MEOOn").checked = true;
        document.getElementById("IGSOOn").checked = true;
        EnableSatSelect();

        //若存在未停止动画（2D、3D），则停止
        if (action !== undefined) {
            action.stop();
        }

        if (SkyPlotTimeLine !== undefined) {
            SkyPlotTimeLine.pause();
            SkyPlotTimeLine.seek(0);
        }

        if (TOSPTimeLine !== undefined) {
            TOSPTimeLine.pause();
            TOSPTimeLine.seek(0);
        }

        //读取当前轨道类型
        currentOrbit = orbitType;
        coorType = orbitType;

        //组对象初始化
        ecefSatGroup = new THREE.Group();
        ecefSatGroup.name = "ecefSatGroup";

        eciSatGroup = new THREE.Group();
        eciSatGroup.name = "eciSatGroup";

        ecefOrbitGroup = new THREE.Group();
        ecefOrbitGroup.name = "ecefOrbitGroup";

        eciOrbitGroup = new THREE.Group();
        eciOrbitGroup.name = "eciOrbitGroup";

        ecefPrnGroup = new THREE.Group();
        ecefPrnGroup.name = "ecefPrnGroup";

        eciPrnGroup = new THREE.Group();
        eciPrnGroup.name = "eciPrnGroup";

        //清除重复对象
        ClearRepeatDate(scene);

        //建立卫星、轨道、PRN标识模型
        for (let i = 0; i < satellites.length; i++) {
            let satellite = satellites[i];
            let satGeomerty = new THREE.BoxGeometry(5, 5, 5);
            let satMaterial = new THREE.MeshLambertMaterial({
                color: 0x0000ff,
            });
            let satMesh = new THREE.Mesh(satGeomerty, satMaterial);
            satMesh.name = "C" + satellite.prn;
            let almType = document.getElementById("almSelector").value;

            if (almType === "almanac.alm" && satellite.prn < 10) {
                satMesh.name = "C0" + satellite.prn;
            }

            //创建PRN标识对象
            let textSprite = createSpriteText(satMesh.name, 40, 75);
            textSprite.name = "PRN" + satMesh.name;

            //卫星初始坐标设定
            if (orbitType === "ECEF") {
                let X = satellite.orbitPoints[0].ECEF_X / 1e5;
                let Y = satellite.orbitPoints[0].ECEF_Y / 1e5;
                let Z = satellite.orbitPoints[0].ECEF_Z / 1e5;
                satMesh.position.set(Y, Z, X);
                satMesh.class = "ECEFSat";
                ecefSatGroup.add(satMesh);
                textSprite.position.set(Y, Z + 10, X);
                textSprite.class = "ECEFPrn"
                ecefPrnGroup.add(textSprite);
            } else if (orbitType === "ECI") {
                let X = satellite.orbitPoints[0].ECI_X / 1e5;
                let Y = satellite.orbitPoints[0].ECI_Y / 1e5;
                let Z = satellite.orbitPoints[0].ECI_Z / 1e5;
                satMesh.position.set(Y, Z, X);
                satMesh.class = "ECISat";
                eciSatGroup.add(satMesh, textSprite);
                textSprite.position.set(Y, Z + 10, X);
                textSprite.class = "ECIPrn";
                eciPrnGroup.add(textSprite);
            }

            //轨道绘制
            let lineGeometry = new THREE.Geometry();
            for (let j = 0; j < satellite.orbitPoints.length; j++) {
                let orbitPoint = satellite.orbitPoints[j];
                if (orbitType === "ECEF") {
                    lineGeometry.vertices.push(new THREE.Vector3(orbitPoint.ECEF_Y / 1e5, orbitPoint.ECEF_Z / 1e5, orbitPoint.ECEF_X / 1e5));
                } else if (orbitType === "ECI") {
                    lineGeometry.vertices.push(new THREE.Vector3(orbitPoint.ECI_Y / 1e5, orbitPoint.ECI_Z / 1e5, orbitPoint.ECI_X / 1e5));
                }
            }

            let material;

            if (MEO.includes(satMesh.name)) {
                material = new THREE.LineBasicMaterial({
                    color: 0xB0C4DE,
                });
            } else if (GEO.includes(satMesh.name)) {
                material = new THREE.LineBasicMaterial({
                    color: 0x6495ED,
                });
            } else if (IGSO.includes(satMesh.name)) {
                material = new THREE.LineBasicMaterial({
                    color: 0xFF8C00,
                });
            } else {
                material = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                });
            }

            let line = new THREE.LineSegments(lineGeometry, material);
            line.name = "Orbit" + satMesh.name;

            //添加进Scene以显示模型
            if (orbitType === "ECEF") {
                line.class = "ECEF";
                ecefOrbitGroup.add(line);
            } else if (orbitType === "ECI") {
                line.class = "ECI";
                eciOrbitGroup.add(line);
            }

        }

        //计算太阳直射点纬度
        let date = document.getElementById("dateSelector").value;
        let dateArray = date.split("-");
        let year = +dateArray[0];
        let month = +dateArray[1];
        let day = +dateArray[2];
        let keyDays = [];
        keyDays.push(CalcDayOfYear(year, 1, 1), CalcDayOfYear(year, 3, 21),
            CalcDayOfYear(year, 6, 22), CalcDayOfYear(year, 9, 23),
            CalcDayOfYear(year, 12, 22), CalcDayOfYear(year, 12, 31));
        let tropic = (23 + 26 / 60) * d2a;
        let keyPhis = [80 / 90 * -tropic, 0, tropic, 0, -tropic, 80 / 90 * -tropic];
        let selectDays = CalcDayOfYear(year, month, day);
        let phi = 0;

        for (let i = 0; i < keyDays.length; i++) {
            let keyDay = keyDays[i];
            let keyPhi = keyPhis[i];
            let nextKeyDay = keyDays[i + 1];
            let nextKeyPhi = keyPhis[i + 1];

            if (selectDays >= keyDay && selectDays <= nextKeyDay) {
                let angle = (selectDays - keyDay) / (nextKeyDay - keyDay) * (nextKeyPhi - keyPhi);
                phi = keyPhi + angle;
                break;
            }
        }

        //设定光照方向，设定坐标轴朝向
        if (orbitType === "ECEF") {
            ecefSatGroup.add(earthMesh);
            earthMesh.rotation.y = earthRotateY;
            directionalLight.position.set(-10000 * Math.sin(-initRotateAngle), 10000 * Math.tan(phi),
                -10000 * Math.cos(-initRotateAngle));
            scene.add(ecefSatGroup);
            scene.add(ecefOrbitGroup);
            scene.add(ecefPrnGroup);
        } else if (orbitType === "ECI") {
            earthMesh.rotation.y = earthRotateY + Theta;
            directionalLight.position.set(-10000 * Math.sin(-initRotateAngle + Theta), 10000 * Math.tan(phi),
                -10000 * Math.cos(-initRotateAngle + Theta));
            eciSatGroup.add(earthMesh);
            scene.add(eciSatGroup);
            scene.add(eciOrbitGroup);
            scene.add(eciPrnGroup);
        }

        //动画设定
        ModelMove(satellites, orbitType);

    } catch {
        alert(almanacError);
    }
}

//控制模型显示
function DisplayOrNot(satArray,id) {
    for (let i = 0; i < satArray.length; i++) {
        let satName = satArray[i];
        let satMesh = scene.getObjectByName(satName);

        if(satMesh===undefined) continue;

        let orbit = scene.getObjectByName("Orbit" + satName);
        let prn = scene.getObjectByName("PRN" + satName);
        let checked = document.getElementById(id).checked;

        if (checked) {
            satMesh.visible = true;
            orbit.visible = true;
            prn.visible = true;
        } else{
            satMesh.visible = false;
            orbit.visible = false;
            prn.visible = false;
        }
    }
}

//清除重复模型
function ClearRepeatDate(scene) {
    for (let i = 0; i < scene.children.length; i++) {
        let element = scene.children[i];

        if (element.name === "ecefSatGroup" || element.name === "eciSatGroup"
            || element.name === "ecefOrbitGroup" || element.name === "eciOrbitGroup"
            || element.name === "ecefGroup" || element.name === "eciGroup"
            || element.name === "ecefPrnGroup" || element.name === "eciPrnGroup"
            || element.name === "equator_Tropic_Group") {
            scene.remove(element);
            i -= 1;
        }
    }
}

//禁用卫星选择
function DisableSatSelect(){
    document.getElementById("GEOOn").disabled=true;
    document.getElementById("MEOOn").disabled=true;
    document.getElementById("IGSOOn").disabled=true;
}

//启用卫星选择
function EnableSatSelect(){
    document.getElementById("GEOOn").disabled=false;
    document.getElementById("MEOOn").disabled=false;
    document.getElementById("IGSOOn").disabled=false;
}

//绘制星下点轨迹(Track of Subsatellite Point)
function DrawTOSP(satellites) {
    try {
        //重置当前轨道类型
        coorType = "";

        //时间缩放因子
        let timeScale = 864;

        //路径动画对象
        let duration = satellites[0].orbitPoints[satellites[0].orbitPoints.length - 1].toc - satellites[0].orbitPoints[0].toc;
        duration /= timeScale;
        let range = document.getElementById("range");

        //隐藏其余视窗
        document.getElementById("3dView").style.display = "none";
        document.getElementById("SkyPlotDiv").style.display = "none";
        document.getElementById("Charts").style.display = "none";
        document.getElementById("playAndPause").style.display = "block";
        document.getElementById("timeText").style.display = "block";
        document.getElementById("range").value = "0";
        DisableSatSelect();

        //若存在未停止动画（2D、3D），则停止
        if (action !== undefined) {
            action.stop();
        }

        if (SkyPlotTimeLine !== undefined) {
            SkyPlotTimeLine.pause();
            SkyPlotTimeLine.seek(0);
        }

        //清除重复SVG
        if (document.getElementById("svgTOSP") !== null && document.getElementById("annotationTOSP") !== null) {
            document.getElementById("background").removeChild(document.getElementById("svgTOSP"));
            document.getElementById("TOSPDiv").removeChild(document.getElementById("annotationTOSP"));
            TOSPTimeLine.pause();
            TOSPTimeLine.seek(0);
        }

        //坐标缩放因子
        let scale = 3;

        //创建SVG对象
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "1080");   //设置宽度
        svg.setAttribute("height", "540");  //设置高度
        svg.setAttribute("viewBox", "-540,-270,1080,540");  //设置视窗
        svg.id = "svgTOSP";

        let annotationSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        annotationSvg.setAttribute("width", "1218");
        annotationSvg.setAttribute("height", "630");
        annotationSvg.setAttribute("viewBox", "-590,-330,1218,630");
        annotationSvg.id = "annotationTOSP";

        //绘制经纬线
        DrawLB(svg, annotationSvg);

        //将SVG添加进div
        let backgroundDiv = document.getElementById("background");
        backgroundDiv.appendChild(svg);

        let TOSPdiv = document.getElementById("TOSPDiv");
        TOSPdiv.appendChild(annotationSvg);
        TOSPdiv.style.display = "block";

        //动画时间轴
        TOSPTimeLine = anime.timeline({
            duration: duration * 1000,
            easing: 'linear',
            autoplay: false,
            loop: true,
            update: function () {
                range.value = TOSPTimeLine.progress;
                let index = Math.floor(TOSPTimeLine.progress / timeTextStamp);
                document.getElementById("timeText").innerHTML = timeTextArray[index];
            }
        });

        //组对象，控制SVG绘制顺序
        let sbuTracks = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let s_p_Groups = document.createElementNS("http://www.w3.org/2000/svg", "g");

        //创建轨迹、星下点、PRN号对象并设定各自动画
        for (let i = 0; i < satellites.length; i++) {
            let sat = satellites[i];
            let r = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            let almType = document.getElementById("almSelector").value;
            let prn = "C" + sat.prn;

            if (almType === "almanac.alm" && sat.prn < 10) {
                prn = "C0" + sat.prn;
            }

            SetTrackColor(r, prn);
            r.setAttribute("fill", "none");
            r.setAttribute("stroke-width", "1.5");

            let points = "";
            let p1x = 0, p2x = 0;
            let sliceIndexes = [];

            for (let j = 0; j < sat.orbitPoints.length; j++) {
                let point = sat.orbitPoints[j];
                let x = point.ECEF_X;
                let y = point.ECEF_Y;
                let z = point.ECEF_Z;

                //计算星下点经纬度
                let phi = -Math.atan(z / Math.sqrt(x * x + y * y)) * a2d;
                let theta = Math.atan2(y, x) * a2d;
                point.phi = phi;
                point.theta = theta;
                phi *= scale;
                theta *= scale;

                if (j === 0) {
                    p1x = theta;
                } else {
                    p2x = theta;
                }

                //判断轨迹是都需要分段
                if (j !== 0 && Math.abs(p2x - p1x) > 180 * scale) {
                    sliceIndexes.push(j);
                    //若需要分段，将当前轨道添加进视窗，并重置轨道点集
                    let r = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                    SetTrackColor(r, prn);
                    r.setAttribute("fill", "none");
                    r.setAttribute("stroke-width", "1.5");
                    r.setAttribute("points", points);
                    svg.appendChild(r);
                    points = "";
                    p1x = p2x;
                } else if (j !== 0 && Math.abs(p2x - p1x) < 180) {
                    p1x = p2x;
                }

                points += theta.toString() + "," + phi.toString();
                points += " ";
            }

            r.setAttribute("points", points);
            sbuTracks.appendChild(r);

            //路径动画设定
            let s_p_Group;
            let cx = sat.orbitPoints[0].theta * scale;
            let cy = sat.orbitPoints[0].phi * scale;

            let sub = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            sub.setAttribute("cx", cx.toString());
            sub.setAttribute("cy", cy.toString());
            sub.setAttribute("stroke", "black");
            sub.setAttribute("r", "5");
            sub.setAttribute("fill", "#ADFF2F");

            let sub_Prn = document.createElementNS("http://www.w3.org/2000/svg", "text");
            sub_Prn.setAttribute("x", (cx + 5).toString());
            sub_Prn.setAttribute("y", (cy + 5).toString());
            sub_Prn.setAttribute("fill", "black");
            sub_Prn.setAttribute("stroke", "black")
            sub_Prn.setAttribute("stroke-width", "1");
            sub_Prn.textContent = "C" + sat.prn;

            if (almType === "almanac.alm" && sat.prn < 10) {
                sub_Prn.textContent = "C0" + sat.prn;
            }

            s_p_Group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            s_p_Group.appendChild(sub);
            s_p_Group.appendChild(sub_Prn);
            s_p_Groups.appendChild(s_p_Group);

            //路径
            let d = "M ";

            for (let j = 0; j < sat.orbitPoints.length; j++) {
                let point = sat.orbitPoints[j];
                let theta = point.theta * scale;
                let phi = point.phi * scale;

                if (sliceIndexes.includes(j)) {
                    d += "M ";
                } else if (j !== 0) {
                    d += "L "
                }

                d += (theta - cx).toString() + " " + (phi - cy).toString();
                d += " ";
            }

            let subPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            subPath.setAttribute("d", d);
            subPath.style.display = "none";
            document.getElementById("PathCollection").appendChild(subPath);
            let path = anime.path(subPath);

            TOSPTimeLine.add({
                targets: s_p_Group,
                translateX: path('x'),
                translateY: path('y'),
            }, 0);
        }

        svg.appendChild(sbuTracks);
        svg.appendChild(s_p_Groups);

        //链接动画控制按钮
        document.getElementById("playButton").onclick = null;
        document.getElementById("pauseButton").onclick = null;
        document.getElementById("playButton").onclick = TOSPTimeLine.play;
        document.getElementById("pauseButton").onclick = TOSPTimeLine.pause;
        range.oninput = function () {

            if (TOSPTimeLine.progress === 0) {
                let index = Math.floor(range.value / timeTextStamp);
                document.getElementById("timeText").innerHTML = timeTextArray[index];
            }

            TOSPTimeLine.seek(TOSPTimeLine.duration * (range.value / 100));
            TOSPTimeLine.pause();
        };
    } catch {
        alert(almanacError);
    }
}

//轨迹颜色设置
function SetTrackColor(r, prn) {
    if (MEO.includes(prn)) {
        r.setAttribute("stroke", "#B0C4DE");
    } else if (GEO.includes(prn)) {
        r.setAttribute("stroke", "#6495ED");
    } else if (IGSO.includes(prn)) {
        r.setAttribute("stroke", "#FF8C00")
    }
}

//绘制天空图（Sky Plot）
function DrawSkyPlot(station, satellites) {
    try {
        if (searching) {
            throw incompleteError;
        }

        if (satellites === undefined) {
            //未进行历书参数设定，则抛出异常
            try {
                throw almanacError;
            } catch {
                alert(almanacError);
            }
        } else {
            try {
                coorType = "";
                CalcSkyPlotCoor(station, satellites);   //计算天空图坐标
                TrackSegment(station, satellites);   //天空图轨道分段
                DrawPlot(satellites)    //绘制天空图内容
            } catch {
                alert(stationError);
            }
        }
    } catch (error) {
        if (error === incompleteError) {
            alert(incompleteError);
        }
    }
}

//轨迹分段
let newElevPoints = [];

function TrackSegment(station, satellites) {

    if (contorl2 == true){
        newElevPoints = stations
    }
    else if (control === "true") {
        newElevPoints = [];
        //将点集按方位角顺序排列
        for (let i = 0; i < elevPoints.length; i++) {
            for (let j = 0; j < elevPoints.length; j++) {
                let elevPoint = elevPoints[j];
                if (i * 360 / completeIndex * d2a === elevPoint.A) {
                    newElevPoints.push(elevPoint);
                    break;
                }
            }
        }
    }

    for (let i = 0; i < satellites.length; i++) {
        let sat = satellites[i];
        sat.tracks = [];
        let TrackPoints = [];

        //根据截止高度角计算轨迹
        for (let j = 0; j < sat.orbitPoints.length; j++) {
            let point = sat.orbitPoints[j];
            if (control === "true") {
                let flag = CalcPointInPolygon(point, newElevPoints);
                point.flag = flag;
                if (point.E >= station.elevationCutOff * d2a && flag) {
                    TrackPoints.push(point);
                }
            } else if (control === "false") {
                if (point.E >= station.elevationCutOff * d2a) {
                    TrackPoints.push(point);
                }
            }

        }

        //记录分段点索引号
        let segmentPosi = [0];

        for (let j = 0; j < TrackPoints.length - 1; j++) {
            let prePoint = TrackPoints[j];
            let nextPoint = TrackPoints[j + 1];
            if (nextPoint.toc - prePoint.toc > 300) {
                segmentPosi.push(j + 1);
            }
        }

        segmentPosi.push(TrackPoints.length);

        //对轨迹进行分段
        if (segmentPosi.length > 2) {
            for (let j = 0; j < segmentPosi.length - 1; j++) {
                let start = segmentPosi[j];
                let end = segmentPosi[j + 1];
                sat.tracks.push(TrackPoints.slice(start, end));
            }
        } else {
            sat.tracks.push(TrackPoints);
        }
    }
}

//绘制天空图内容
function DrawPlot(satellites) {
    let timeScale = 864;
    let coorScale = 3;

    //隐藏其余内容
    document.getElementById("3dView").style.display = "none";
    document.getElementById("TOSPDiv").style.display = "none";
    document.getElementById("Charts").style.display = "none";
    document.getElementById("playAndPause").style.display = "block";
    document.getElementById("range").value = "0";
    document.getElementById("timeText").style.display = "block";
    document.getElementById("content").style.background = "#00aaff";
    DisableSatSelect();

    let range = document.getElementById("range");

    //若存在未停止动画（2D、3D），则停止
    if (action !== undefined) {
        action.stop();
    }

    if (TOSPTimeLine !== undefined) {
        TOSPTimeLine.pause();
        TOSPTimeLine.seek(0);
    }

    //清除已有SVG
    if (document.getElementById("svgSkyPlot") !== null) {
        document.getElementById("SkyPlot").removeChild(document.getElementById("svgSkyPlot"));
        SkyPlotTimeLine.pause();
        SkyPlotTimeLine.seek(0);
    }

    //创建svg视窗
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); //创建svg标签
    svg.setAttribute("width", "640");   //设置宽度
    svg.setAttribute("height", "640");  //设置高度
    svg.setAttribute("viewBox", "-320,-320,640,640");
    svg.id = "svgSkyPlot";

    let skyPlot = document.getElementById("SkyPlot");
    skyPlot.appendChild(svg);
    document.getElementById("SkyPlotDiv").style.display = "block";

    //天空图初始化
    InitSkyPlot(svg);

    //动画时间轴
    SkyPlotTimeLine = anime.timeline({
        easing: 'linear',
        autoplay: false,
        loop: true,
        update: function () {
            range.value = SkyPlotTimeLine.progress;
            let index = Math.floor(SkyPlotTimeLine.progress / timeTextStamp);
            document.getElementById("timeText").innerHTML = timeTextArray[index];
        }
    });

    let baseToc = satellites[0].orbitPoints[0].toc;
    //轨迹、卫星及PRN号编组
    let satTracks = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let s_p_Groups = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(satTracks);
    svg.appendChild(s_p_Groups);

    for (let i = 0; i < satellites.length; i++) {
        let sat = satellites[i];

        for (let j = 0; j < sat.tracks.length; j++) {
            let track = sat.tracks[j];
            if (track.length !== 0) {

                //卫星、prn编组
                let s_p_Group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                let cx = track[0].skyPlotX * coorScale / 2;
                let cy = -track[0].skyPlotY * coorScale / 2;

                let r = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                r.setAttribute("cx", cx.toString());
                r.setAttribute("cy", cy.toString());
                r.setAttribute("stroke", "black");
                r.setAttribute("r", "5");
                r.setAttribute("fill", "#adff2f");
                s_p_Group.appendChild(r);

                let prn = document.createElementNS("http://www.w3.org/2000/svg", "text");
                prn.setAttribute("x", (cx + 5).toString());
                prn.setAttribute("y", (cy + 5).toString());
                prn.setAttribute("stroke", "black");
                prn.setAttribute("stroke-width", "1");
                prn.textContent = "C" + sat.prn;

                let almType = document.getElementById("almSelector").value;
                if (almType === "almanac.alm" && sat.prn < 10) {
                    prn.textContent = "C0" + sat.prn;
                }
                s_p_Group.appendChild(prn);

                let satTrack = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                SetTrackColor(satTrack, prn.textContent);
                satTrack.setAttribute("fill", "none");
                satTrack.setAttribute("stroke-width", "2");

                let trackPoints = "";   //轨道点集
                let d = "M "; //路径参数d

                for (let k = 0; k < track.length; k++) {
                    let point = track[k];
                    let x = point.skyPlotX * coorScale / 2;
                    let y = -point.skyPlotY * coorScale / 2;

                    //记录第一个点的坐标，作为运动起始位，以及计算坐标偏移量
                    if (k !== 0) {
                        d += "L ";
                    }

                    d += (x - cx).toString() + "," + (y - cy).toString();
                    d += " ";

                    trackPoints += x.toString() + "," + y.toString();
                    trackPoints += " ";
                }

                //绘制轨道
                satTrack.setAttribute("points", trackPoints);

                //轨迹、卫星及PRN消失
                function DisPlay() {
                    satTrack.style.display = "block";
                    s_p_Group.style.display = "block";
                }

                //轨迹、卫星及PRN出现
                function Disappear() {
                    satTrack.style.display = "none";
                    s_p_Group.style.display = "none";
                }

                //天空图起始时刻图形可视条件
                if (track[0].toc === sat.orbitPoints[0].toc) {
                    DisPlay();
                } else {
                    Disappear();
                }

                satTracks.appendChild(satTrack);
                s_p_Groups.appendChild(s_p_Group);

                //动画路径
                let subPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                subPath.setAttribute("d", d);
                subPath.style.display = "none";
                document.getElementById("PathCollection").appendChild(subPath);
                let path = anime.path(subPath);

                let delayTime = track[0].toc - baseToc;
                delayTime /= timeScale;
                let duration = track[track.length - 1].toc - track[0].toc;
                duration /= timeScale;

                //设定各动画参数
                SkyPlotTimeLine.add({
                    targets: s_p_Group,
                    translateX: path('x'),
                    translateY: path('y'),
                    duration: duration * 1000,
                    update: function () {
                        if (this.progress > 0 && this.progress < 100) {
                            DisPlay();
                        }

                        if (this.progress === 0) {
                            if (track[0].toc === sat.orbitPoints[0].toc) {
                                DisPlay();
                            } else {
                                Disappear();
                            }
                        }

                        if (this.progress === 100) {
                            if (track[track.length - 1].toc === sat.orbitPoints[sat.orbitPoints.length - 1].toc) {
                                DisPlay();
                            } else {
                                Disappear();
                            }
                        }
                    },
                }, delayTime * 1000);
            }
        }
    }

    //将动画链接到动画控制按钮
    document.getElementById("playButton").onclick = null;
    document.getElementById("pauseButton").onclick = null;
    document.getElementById("playButton").onclick = SkyPlotTimeLine.play;
    document.getElementById("pauseButton").onclick = SkyPlotTimeLine.pause;
    range.oninput = function () {

        if (SkyPlotTimeLine.progress === 0) {
            let index = Math.floor(range.value / timeTextStamp);
            document.getElementById("timeText").innerHTML = timeTextArray[index];
        }

        SkyPlotTimeLine.seek(SkyPlotTimeLine.duration * (range.value / 100));
        //SkyPlotTimeLine.play();
        SkyPlotTimeLine.pause();
    };
}

//初始化天空图
function InitSkyPlot(svg) {
    //绘制坐标轴
    DrawDashLine(-270, 0, 270, 0, svg, "");
    DrawDashLine(0, -270, 0, 270, svg, "");

    //绘制外圈
    DrawCircle(0, 0, 270, "black", "none", svg);
    DrawOutCircleAnnotation(svg);

    //绘制内圈
    let cutOffRadius = [];
    let cutOffCircleRadius = 270 * Math.cos(station.elevationCutOff * Math.PI / 180);
    let thirtyCircleRadius = 270 * Math.cos(30 * Math.PI / 180);
    let sixtyCircleRadius = 270 * Math.cos(60 * Math.PI / 180);

    cutOffRadius.push(thirtyCircleRadius, sixtyCircleRadius, cutOffCircleRadius);

    for (let i = 0; i < cutOffRadius.length; i++) {
        if (i === 2) {
            DrawCircle(0, 0, cutOffRadius[i], "blue", "none", svg);
        } else {
            DrawCircle(0, 0, cutOffRadius[i], "black", "none", svg);
            //绘制内圈注释
            DrawInnerCircleAnnotation(svg, cutOffRadius[i], i);
        }
    }

    if (contorl2 == true) {
        //绘制环视障碍物
        DrawObstacle(cutOffCircleRadius, stations, svg);
    }
    else if (control === "true") {
            //绘制环视障碍物
            DrawObstacle(cutOffCircleRadius, newElevPoints, svg);
        }

}

//绘制天空图外圈注释
function DrawOutCircleAnnotation(svg) {
    DrawText(0, -255, "N", svg, "");
    DrawText(0, 268, "S", svg, "");
    DrawText(-268, 0, "W", svg, "");
    DrawText(260, 0, "E", svg, "");
}

//绘制天空图内圈注释
function DrawInnerCircleAnnotation(svg, r, i) {
    DrawText(r - 30, 0, ((i + 1) * 30).toString() + "°", svg, "");
}

//绘制经纬线
function DrawLB(svg, annotationSvg) {
    for (let i = 0; i < 7; i++) {
        let rowX1 = -540;
        let rowY1 = 90 * (i - 3);
        let rowX2 = 540;
        let rowY2 = 90 * (i - 3);

        if (!(i === 0 || i === 6)) {
            DrawDashLine(rowX1, rowY1, rowX2, rowY2, svg, "3 2");
        }

        let textContent = "";

        if ((-rowY1 / 3) > 0) {
            textContent = "+" + (-rowY1 / 3).toString() + "°";
        } else {
            textContent = (-rowY1 / 3).toString() + "°";
        }

        DrawText(rowX1, rowY1 + 5, textContent, annotationSvg, "end");
        DrawText(-rowX1, rowY1 + 5, textContent, annotationSvg, "start");
    }

    for (let j = 0; j < 13; j++) {

        let columnX1 = 90 * (j - 6);
        let columnY1 = -270;
        let columnX2 = 90 * (j - 6);
        let columnY2 = 270;

        if (!(j === 0 || j === 12)) {
            DrawDashLine(columnX1, columnY1, columnX2, columnY2, svg, "3 2");
        }

        let textContent = "";

        if ((columnX1 / 3) < 0) {
            textContent = (columnX1 / 3).toString() + "°";
        } else {
            textContent = "+" + (columnX1 / 3).toString() + "°";
        }

        DrawText(columnX1, columnY1 - 15, textContent, annotationSvg, "middle");
        DrawText(columnX1, -columnY1 + 27, textContent, annotationSvg, "middle");
    }
}

//绘制虚线
function DrawDashLine(x1, y1, x2, y2, svg, dashArray) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());

    if (dashArray !== "") {
        line.setAttribute("stroke-dasharray", dashArray);
    }

    line.setAttribute("stroke", "black");
    svg.appendChild(line);
}

//绘制文本
function DrawText(x, y, textContent, svg, textAnchor) {
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x.toString());
    text.setAttribute("y", y.toString());

    if (svg.id === "annotationTOSP" && textAnchor !== "") {
        text.setAttribute("text-anchor", textAnchor);
    }

    text.textContent = textContent;
    svg.appendChild(text);

    return text;
}

//绘制圆
function DrawCircle(cx, cy, r, stroke, fill, svg) {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx.toString());
    circle.setAttribute("cy", cy.toString());
    circle.setAttribute("r", r.toString());
    circle.setAttribute("stroke", stroke);
    circle.setAttribute("fill", fill);
    svg.appendChild(circle);
}

function DrawObstacle(cutOffCircleRadius, elevPoints, svg) {
    let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = "";
    let points = "";
    let coorScale = 3;
    let ox = elevPoints[0].skyPlotX * coorScale / 2;
    let oy = -elevPoints[0].skyPlotY * coorScale / 2;
    d += "M" + ox.toString() + "," + oy.toString() + " ";

    for (let i = 0; i < elevPoints.length; i++) {
        let elevPoint = elevPoints[i];
        let x = elevPoint.skyPlotX * coorScale / 2;
        let y = -elevPoint.skyPlotY * coorScale / 2;
        points += x.toString() + "," + y.toString() + " ";
        d += "L" + x.toString() + "," + y.toString() + " ";
    }

    points += ox.toString() + "," + oy.toString();
    d += "z";
    d += "M0" + "," + cutOffCircleRadius.toString() + " ";

    for (let i = 1; i < 360; i++) {
        let px = cutOffCircleRadius * Math.sin(i * d2a);
        let py = cutOffCircleRadius * Math.cos(i * d2a);
        d += "L" + px.toString() + "," + py.toString() + " ";
    }
    d += "z";

    path.setAttribute("d", d);
    path.setAttribute("fill", "#696969");
    path.setAttribute("fill-opacity", "0.3");

    polyline.setAttribute("points", points);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "black");
    svg.appendChild(polyline);
    svg.appendChild(path);
}
