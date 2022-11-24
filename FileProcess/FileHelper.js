//历书参数集合
let almanaces;
//卫星集合
let satellites;
//测站对象
let station;

//错误信息
let latitudeError = "测站纬度填写错误.";
let longitudeError = "测站经度填写错误.";
let heightError = "测站高填写错误.";
let cutOffError = "截止高度角填写错误.";
let preStation;
let preStationH;
let stationH;
let stationConsitent = false;

//解析北斗官网历书数据
function dataParse_21c(allLines) {
    almanaces = [];
    satellites = [];
    let lines = allLines.trim().split("********");

    let line, lineArray, param, paramArray;
    let params = [];

    for (let i = 0; i < lines.length; i++) {
        line = lines[i];
        lineArray = line.trim().split("\r\n");

        if (lineArray.length === 13) {
            let almanac = new Almanac();
            let satellite = new Satellite();

            for (let j = 0; j < lineArray.length; j++) {
                param = lineArray[j];
                paramArray = param.trim().split(/\s+/);
                params[j] = paramArray[paramArray.length - 1];
            }

            satellite.prn = params[0];
            almanac.prn = params[0];
            almanac.health = params[1];
            almanac.e = parseFloat(params[2]);
            almanac.toe = parseFloat(params[3]);
            almanac.I0 = parseFloat(params[4]);
            almanac.OMEGA0Dot = parseFloat(params[5]);
            almanac.sqrtA = parseFloat(params[6]);
            almanac.OMEGA0 = parseFloat(params[7]);
            almanac.omega = parseFloat(params[8]);
            almanac.M0 = parseFloat(params[9]);
            almanac.a0 = parseFloat(params[10]);
            almanac.a1 = parseFloat(params[11]);
            almanac.week = parseFloat(params[12]);

            almanaces.push(almanac);
            satellites.push(satellite);
        }
    }

}

//读取Trimble官网历书数据
function dataParse_alm(alllines) {
    almanaces = [];
    satellites = [];
    let lines = alllines.trim().split("\r\n");
    for (let i = 0; i < lines.length; i += 14) {
        //将每一组每行数据分割成字符串输组
        let line1 = sliceStringByLength(lines[i], 10);
        let line2 = sliceStringByLength(lines[i + 1], 10);
        let line3 = sliceStringByLength(lines[i + 2], 10);
        let line4 = sliceStringByLength(lines[i + 3], 10);
        let line5 = sliceStringByLength(lines[i + 4], 10);
        let line6 = sliceStringByLength(lines[i + 5], 10);
        let line7 = sliceStringByLength(lines[i + 6], 10);
        let line8 = sliceStringByLength(lines[i + 7], 10);
        let line9 = sliceStringByLength(lines[i + 8], 10);
        let line10 = sliceStringByLength(lines[i + 9], 10);
        let line11 = sliceStringByLength(lines[i + 10], 10);
        let line12 = sliceStringByLength(lines[i + 11], 10);
        let line13 = sliceStringByLength(lines[i + 12], 10);
        //最后一行空白行，不进行操作

        //每一组星历数据统一处理
        for (let j = 0; j < line1.length; j++) {
            //选出每一组第一行PNC号最大值
            let max_line = Math.max(...line1);

            //根据PNC号筛选出北斗卫星数据,小于264的全部剔除
            if (max_line < 264)
                break;

            //处理特例（PNC号最大值为264）
            if (max_line === 264) {
                let almanace = new Almanac();
                let satellite = new Satellite();

                let index = -1;
                index = getIndexByNumber(line1, max_line);
                satellite.prn = +line1[index] - 263;
                almanace.prn = +line1[index] - 263;
                almanace.health = +line2[index];
                almanace.e = +line3[index];
                almanace.sqrtA = +line4[index];
                almanace.OMEGA0 = +line5[index] * d2a;
                almanace.omega = +line6[index] * d2a;
                almanace.M0 = +line7[index] * d2a;
                almanace.toe = +line8[index];
                almanace.I0 = ((+line9[index]) + 54) * d2a;
                almanace.OMEGA0Dot = (+line10[index]) * d2a / 1000;
                almanace.a0 = +line11[index];
                almanace.a1 = +line12[index];
                almanace.week = +line13[index];
                almanaces.push(almanace);
                satellites.push(satellite);
                break;
            }
            let almanace = new Almanac();
            let satellite = new Satellite();
            satellite.prn = +line1[j] - 263;
            almanace.prn = +line1[j] - 263;
            almanace.health = +line2[j];
            almanace.e = +line3[j];
            almanace.sqrtA = +line4[j];
            almanace.OMEGA0 = +line5[j] * d2a;
            almanace.omega = +line6[j] * d2a;
            almanace.M0 = +line7[j] * d2a;
            almanace.toe = +line8[j];
            almanace.I0 = ((+line9[j]) + 54) * d2a;
            almanace.OMEGA0Dot = (+line10[j]) * d2a / 1000;
            almanace.a0 = +line11[j];
            almanace.a1 = +line12[j];
            almanace.week = +line13[j];
            almanaces.push(almanace);
            satellites.push(satellite);
        }
    }
}

//读取测站信息
function ParseStation_B_L() {
    try {
        if (searching) {
            throw incompleteError;
        }

        if (getHeightComplete !== undefined && getHeightComplete === false) {
            throw incompleteGetHeightError;
        }

        station = new Station();

        //验证各信息是否输入完整
        try {

            station.L = IsLCorrect()    //验证测站经度
            station.B = IsBCorrect();   //验证测站纬度
            station.H = IsHCorrect();   //验证测站高
            station.elevationCutOff = IsCutOffCorrect();  //验证截止高度角

            //测站信息是否改变
            stationConsitent = preStation !== undefined && preStation.B === station.B && preStation.L === station.L &&
                preStationH === stationH &&
                preStation.elevationCutOff === station.elevationCutOff;

            preStation = station;
            preStationH = stationH;

            alert("测站信息已保存.");
            //显示输入用户输入位置
            Location(station);
            getHeightComplete = undefined;    //重置测站高采集指示

            //关闭地形采样，重置采样进度条
            control = "false";
            document.getElementById("OnOff").value = "false";
            document.querySelector(".progress").style.strokeDashoffset = 377;
            document.querySelector(".indexText").textContent = "0%";

            if (document.getElementById("Charts").style.display === "block") {
                DrawCharts(satellites);
            } else if (document.getElementById("SkyPlotDiv").style.display === "block") {
                DrawSkyPlot(station, satellites);
            }
        } catch (error) {
            if (error === longitudeError) {
                alert(longitudeError);
                document.getElementById("stationL").value = "";
            } else if (error === latitudeError) {
                alert(latitudeError);
                document.getElementById("stationB").value = "";
            } else if (error === cutOffError) {
                alert(cutOffError);
                document.getElementById("ElevationCutOff").value = "";
            } else if (error === heightError) {
                alert(heightError);
                document.getElementById("stationH").value = "";
            }
        } finally {
            if (document.getElementById("SkyPlotDiv").style.display === "block") {
                DrawSkyPlot(station, satellites);
            } else if (document.getElementById("Charts").style.display === "block") {
                DrawCharts(satellites);
            }
        }
    } catch (error) {
        if (error === incompleteError) {
            alert(error);
        } else if (error === incompleteGetHeightError) {
            alert(error);
        }
    }
}

//根据元素值返回索引值
function getIndexByNumber(line, number) {
    let i = line.length;
    while (i--) {
        if (number === (+line[i]))
            return i;
    }
    return -1;
}

//截取字符串
function sliceStringByLength(lines, number) {
    let line = [];
    for (let i = 0; i < lines.length / 10; i++) {
        let s = lines.slice(number * i, number * (i + 1));
        line.push(s);
    }
    return line;
}

//十进制转度分秒
function DegreeToDMS(d) {
    let symbol = 1;

    if (d < 0) {
        symbol = -1;
    } else {
        d = Math.abs(d);
    }

    let degree = Math.floor(d);
    let minute = Math.floor((d - degree) * 60);
    let second = Math.floor(((d - degree) * 60 - minute) * 60 * 100) / 100;

    let dms = symbol * degree.toString() + " " + minute.toString() + " " + second.toString();
    return dms;
}

//读取DEM采样参数，并得出障碍物环视图点集
let control;
let radiusError = "采样半径填写错误，请输入 0 到 150 之间的整数.";
let divideError = "径向划分数填写错误,请输入 36 到 360 之间的整数.";
let intervalError = "采样间隔填写错误，请输入 1 到 采样半径 之间的实数.";
let incompleteError = "地形采样未完成，请勿进行其他操作.";
let incompleteGetHeightError = "当前高程未更新，请稍后进行操作."
let pramConsistent = false;
let samplingPram;
let preSamplingPram;

function ParseSamplingPram() {
    try {
        //未进行测站读取的情况
        if (station === undefined) {
            throw stationError;
        }

        control = document.getElementById("OnOff").value
        if (control === "true") {

            //验证采样半径输入正确与否
            let stringRadius = document.getElementById("radius").value.trim();
            let arrayRadius = stringRadius.split(/\s+/);
            let radius = parseFloat(arrayRadius[0]);

            if (arrayRadius.length !== 1 || isNaN(radius) ||
                Math.floor(radius) !== radius || radius < 1 || radius > 150) {
                throw radiusError;
            }

            //验证径向划分数输入正确与否
            let stringDivide = document.getElementById("divide").value.trim();
            let arrayDivide = stringDivide.split(/\s+/);
            let divide = parseFloat(arrayDivide[0]);

            if (arrayDivide.length !== 1 || isNaN(divide) ||
                Math.floor(divide) !== divide || divide < 36 || divide > 360) {
                throw divideError;
            }

            //验证采样间隔输入正确与否
            let stringInterval = document.getElementById("interval").value.trim();
            let arrayInterval = stringInterval.split(/\s+/);
            let interval = parseFloat(arrayInterval[0]);

            if (arrayInterval.length !== 1 || isNaN(interval) || interval < 1 || interval > radius * 1000) {
                throw intervalError;
            }

            samplingPram = new SamplingPram(radius, divide, interval);

            //采样参数是否改变
            pramConsistent = preSamplingPram !== undefined && samplingPram.radius === preSamplingPram.radius &&
                samplingPram.divide === preSamplingPram.divide &&
                samplingPram.interval === preSamplingPram.interval;

            preSamplingPram = samplingPram;

            if (searching) {
                throw incompleteError;
            }
            //坐标转换
            BL2XY(station.L, station);

            if (!(stationConsitent && pramConsistent)) {
                alert("正在进行地形采样计算，请耐心等待.");
                //进度条动画
                ProgressAnimation();

                //计算障碍物环视图点集
                CalcElevation(station, samplingPram);

                //测站信息是否改变
                stationConsitent = preStation !== undefined && preStation.B === station.B && preStation.L === station.L &&
                    preStationH === stationH &&
                    preStation.elevationCutOff === station.elevationCutOff;

            } else {

                document.querySelector(".progress").style.strokeDashoffset = 0;
                document.querySelector(".indexText").textContent = "100%";
                alert("地形影响已添加.");

                if (document.getElementById("SkyPlotDiv").style.display === "block") {
                    DrawSkyPlot(station, satellites);
                } else if (document.getElementById("Charts").style.display === "block") {
                    DrawCharts(satellites);
                }

            }
        } else if (control === "false") {

            alert("地形影响已关闭.");
            document.querySelector(".indexText").textContent = "0%";
            document.querySelector(".progress").style.strokeDashoffset = 377;

            if (document.getElementById("SkyPlotDiv").style.display === "block") {
                DrawSkyPlot(station, satellites);
            } else if (document.getElementById("Charts").style.display === "block") {
                DrawCharts(satellites);
            }

        }
    } catch (error) {

        if (error === stationError || error === radiusError ||
            error === divideError || error === intervalError) {
            alert(error);
        }

        if (error === incompleteError) {
            alert(error);
        }
    }
}

let LCorrrect = false;
let BCorrect = false;

let correctL;

//测站经度是否正确
function IsLCorrect() {
    let stringL = document.getElementById("stationL").value.trim();
    let arrayL = stringL.split(/\s+/);

    if (arrayL.length === 3) {
        let degreeL = parseFloat(arrayL[0]);
        let minuteL = parseFloat(arrayL[1]);
        let secondL = parseFloat(arrayL[2]);

        //验证测站经度是否超限
        if (degreeL < (-180) || degreeL > 180 || isNaN(degreeL)) {
            throw longitudeError;
        } else if (minuteL < 0 || minuteL > 60 || isNaN(minuteL)) {
            throw longitudeError;
        } else if (secondL < 0 || secondL > 60 || isNaN(secondL)) {
            throw longitudeError;
        } else {
            LCorrrect = true;

            if (degreeL >= 0) {
                correctL = degreeL + minuteL / 60 + secondL / 3600;
                return correctL;
            } else if (degreeL < 0) {
                correctL = -(-degreeL + minuteL / 60 + secondL / 3600);
                return correctL;
            }
        }
    } else {
        LCorrrect = false;
        throw longitudeError;
    }
}

let correctB;

//测站纬度是否正确
function IsBCorrect() {
    let stringB = document.getElementById("stationB").value.trim();
    let arrayB = stringB.split(/\s+/);

    if (arrayB.length === 3) {
        let degreeB = parseFloat(arrayB[0]);
        let minuteB = parseFloat(arrayB[1]);
        let secondB = parseFloat(arrayB[2]);

        //验证测站纬度是否超限
        if (degreeB < (-90) || degreeB > 90 || isNaN(degreeB)) {
            throw latitudeError;
        } else if (minuteB < 0 || minuteB > 60 || isNaN(minuteB)) {
            throw latitudeError;
        } else if (secondB < 0 || secondB > 60 || isNaN(secondB)) {
            throw latitudeError;
        } else {
            BCorrect = true;

            if (degreeB >= 0) {
                correctB = degreeB + minuteB / 60 + secondB / 3600;
                if (LCorrrect && BCorrect) {
                    GetHeight(correctL, correctB);
                }
                return correctB;
            } else if (degreeB < 0) {
                correctB = -(-degreeB + minuteB / 60 + secondB / 3600);
                if (LCorrrect && BCorrect) {
                    GetHeight(correctL, correctB);
                }
                return correctB;
            }

        }
    } else {
        BCorrect = false;
        throw latitudeError;
    }
}

//测站高是否正确
function IsHCorrect() {
    let stringH = document.getElementById("stationH").value.trim();
    let arrayH = stringH.split(/\s+/);

    if (arrayH.length === 1) {
        let H = parseFloat(stringH);

        //验证测站高是否为数字
        if (isNaN(H)) {
            throw heightError;
        } else {
            stationH = H;
            return H;
        }
    } else {
        throw heightError;
    }
}

//戒指高度角是否正确
function IsCutOffCorrect() {
    let stringEleCutOff = document.getElementById("ElevationCutOff").value.trim();
    let arrayCutOff = stringEleCutOff.split(/\s+/);

    if (arrayCutOff.length === 1) {
        let elevationCutOff = parseFloat(stringEleCutOff);

        //验证截止高度角是否超限
        if (elevationCutOff < 0 || elevationCutOff > 90 || isNaN(elevationCutOff)) {
            throw cutOffError;
        } else {
            return elevationCutOff;
        }
    } else {
        throw cutOffError;
    }
}