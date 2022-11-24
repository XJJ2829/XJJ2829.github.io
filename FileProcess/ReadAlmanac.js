let selectDate; //选择日期
let startTime;  //开始时间
let periodHour; //时长
let timeTextStamp;  //时间戳
let timeTextArray;  //时间文本集合
let initTimeText;   //初始时间文本

//通过AJAX读取本地txt文件
function fileRead() {
    try {
        if (searching) {
            throw incompleteError;
        }

        selectDate = document.getElementById("dateSelector").value;
        startTime = document.getElementById("startTimeSelector").value;
        periodHour = document.getElementById("periodSelector").value;

        //创建时间数组
        timeTextStamp = Math.floor(30000 / ((+periodHour) * 3600) * 1000) / 1000;
        let timeTextNumber = periodHour * 3600 / 300;
        timeTextArray = [];
        let hour = (+startTime) < 10 ? "0" + startTime : startTime.toString();
        let minute = "00";
        let second = "00";
        initTimeText = selectDate + " " + hour + ":" + minute + ":" + second;
        document.getElementById("timeText").innerHTML = initTimeText;
        timeTextArray.push(initTimeText);

        for (let i = 1; i <= timeTextNumber; i++) {
            hour = Math.floor(5 * i / 60);
            let changeDate = "";

            if ((+startTime) + hour >= 24) {
                let dateArray = selectDate.split('-');
                let selectJD = UTC2JD(+dateArray[0], +dateArray[1], +dateArray[2], 0, 0, 0);
                selectJD += 1;
                let changeDateArray = JD2UTC(selectJD);
                changeDate = changeDateArray[0];
                changeDate += changeDateArray[1] < 10 ? "-0" + changeDateArray[1] : "-" + changeDateArray[1];
                changeDate += changeDateArray[2] < 10 ? "-0" + changeDateArray[2] : "-" + changeDateArray[2];
            }

            let minuteNumber = 5 * i;
            if (minuteNumber % 60 === 0) {
                minute = "00";
            } else if (minuteNumber > 60) {
                minuteNumber = 5 * i - Math.floor(5 * i / 60) * 60;
                minute = minuteNumber < 10 ? "0" + minuteNumber : minuteNumber.toString();
            } else if (minuteNumber < 60) {
                minute = minuteNumber < 10 ? "0" + minuteNumber : minuteNumber.toString();
            }

            let timeText = "";

            if (changeDate !== "") {
                let changeHour = (+startTime) + hour - 24;
                changeDate += changeHour < 10 ? " 0" + changeHour.toString() : " " + changeHour.toString();
                timeText = changeDate + ":" + minute + ":00";
                timeTextArray.push(timeText);
            } else {
                let Hour = (+startTime) + hour;
                let hourString = Hour < 10 ? " 0" + Hour.toString() : " " + Hour.toString();
                timeText = selectDate + hourString + ":" + minute + ":00";
                timeTextArray.push(timeText);
            }
        }

        //根据星历类型选择解析函数
        let almType = document.getElementById("almSelector").value;
        let text = load("Almanacs/" + almType);

        if (almType === "conv1780.21alc") {
            dataParse_21c(text);
        } else if (almType === "almanac.alm") {
            dataParse_alm(text);
        }

        ClearRepeatDate(scene); //读取完毕清除已有模型
        scene.add(earthMesh);

        //若存在未停止动画，则停止
        if (action !== undefined) {
            action.stop();
        }

        if (document.getElementById("3dView").style.display === "block") {
            document.getElementById("playAndPause").style.display = "none";
        }

        CalPosi(almanaces, satellites); //基准时刻位置计算
        Extrapolation(almanaces, satellites, 5, periodHour);    //轨道外推计算
        CoorTrans(satellites, almType); //坐标转换计算
        EarthInitPos(satellites[0].orbitPoints[0].toc); //地球初始旋转角计算
        DisableSatSelect();
        alert("历书数据已导入，卫星位置计算已完成.");

        //写入GEO坐标
        // let coorString = "";
        // for (let i = 0; i < satellites[0].orbitPoints.length; i++) {
        //     let timeText = timeTextArray[i];
        //
        //     for (let j = 0; j < satellites.length; j++) {
        //         let satellite = satellites[j];
        //         let satType = "C" + satellite.prn;
        //
        //         if (almType === "almanac.alm" && satellite.prn < 10) {
        //             satType = "C0" + satellite.prn;
        //         }
        //
        //         if (GEO.includes(satType)) {
        //             let orbitPoint = satellite.orbitPoints[i];
        //             coorString += satType + ", " + timeText + ", " + orbitPoint.ECEF_X.toString() + ", " +
        //                 orbitPoint.ECEF_Y.toString() + ", " + orbitPoint.ECEF_Z.toString() + "\n";
        //         }
        //     }
        //
        //     coorString += "\n";
        // }

        //WriteGEOCoor(coorString);


        //更新当前内容页
        if (document.getElementById("Charts").style.display === "block") {
            DrawCharts(satellites);
        } else if (document.getElementById("TOSPDiv").style.display === "block") {
            DrawTOSP(satellites);
        } else if (document.getElementById("SkyPlotDiv").style.display === "block") {
            DrawSkyPlot(station, satellites);
        }
    }catch (error){
        if(error===incompleteError){
            alert(error);
        }
    }
}

//AJAX加载数据
function load(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    return xhr.responseText;
}

//写入GEO坐标到txt文件
// function WriteGEOCoor(coor) {
//     let blob = new Blob([coor], {type: "text/plain;charset=utf-8"});
//     saveAs(blob, "GEO_Coor.txt");
// }
