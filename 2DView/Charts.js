//绘制图表
function DrawCharts(satellites) {
    try {
        if (times !== 0 && times !== samplingPram.divide) {
            throw incompleteError;
        }

        if (satellites === undefined) {
            try {
                throw almanacError;
            } catch {
                alert(almanacError);
            }
        } else {
            try {
                coorType = "";
                CalcSkyPlotCoor(station, satellites);
                //隐藏其余视窗
                document.getElementById("3dView").style.display = "none";
                document.getElementById("TOSPDiv").style.display = "none";
                document.getElementById("SkyPlotDiv").style.display = "none";
                document.getElementById("content").style.background = "#ffffff";
                document.getElementById("Charts").style.display = "block";
                document.getElementById("playAndPause").style.display = "none";
                document.getElementById("Charts").innerHTML = null;
                DisableSatSelect();

                //创建图表块
                let SatNumber = document.createElement("div");
                SatNumber.id = "SatNumber";
                SatNumber.style.width = "100%";
                SatNumber.style.height = "50%";
                document.getElementById("Charts").appendChild(SatNumber);

                let DOP = document.createElement("div");
                DOP.id = "DOP";
                DOP.style.width = "100%";
                DOP.style.height = "50%";
                document.getElementById("Charts").appendChild(DOP);

                //绘制卫星可见数与DOPs时序图
                DrawNumber(satellites);
                DrawDOP(satellites);
            } catch (error) {
                if (error === stationError) {
                    alert(stationError);
                }
            }
        }
    } catch (error) {
        if (error === incompleteError) {
            alert(incompleteError);
        }
    }
}

//绘制卫星可见数
function DrawNumber(satellites) {
    //创建图表
    let SatNumberChart = echarts.init(document.getElementById("SatNumber"), null, {renderer: 'svg'});

    //图表数据
    let data = [];

    if (control === "true") {
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

    //计算卫星可见数
    for (let i = 0; i < satellites[0].orbitPoints.length; i += 2) {
        let point;
        let number = 0;
        let time_value = [];

        for (let j = 0; j < satellites.length; j++) {
            let sat = satellites[j];
            point = sat.orbitPoints[i];

            if (control === "true") {
                let flag = CalcPointInPolygon(point, newElevPoints);
                point.flag = flag;
                if (point.E * a2d >= station.elevationCutOff && flag) {
                    number++;
                }
            } else if (control === "false") {
                if (point.E * a2d >= station.elevationCutOff) {
                    number++;
                }
            }

        }

        time_value.push(timeTextArray[i]);
        time_value.push(number);
        data.push(time_value);
    }

    //绘制图表
    let option = {
        title: {
            text: 'BDS星座卫星可见数'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['可见数']
        },
        xAxis: {
            type: 'time',
            axisLabel: {
                interval: 0,
                showMaxLabel: true,
                rotate: -30,
                formatter: function (value) {
                    return XAxisFormate(value);
                }
            }
        },
        yAxis: {},
        series: [{
            name: '可见数',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            itemStyle: {
                normal: {
                    color: '#ff5050',
                    borderColor: '#ff5050',
                    areaStyle: {
                        type: 'default',
                        opacity: 0.5
                    }
                }
            },
            data: data
        }]
    };

    SatNumberChart.setOption(option);
}

//绘制DOP图
function DrawDOP(satellites) {
    //创建图表
    let DOPChart = echarts.init(document.getElementById("DOP"), null, {renderer: 'svg'});

    //图表数据
    let data_GDOP = [], data_PDOP = [], data_HDOP = [], data_VDOP = [], data_TDOP = [];

    //计算DOP值
    for (let i = 0; i < satellites[0].orbitPoints.length; i += 2) {
        let point;
        let Q = math.ones(1, 4);
        let number = 0;
        let time_GDOP = [], time_PDOP = [], time_HDOP = [], time_VDOP = [], time_TDOP = [];

        //计算观测卫星的星座矩阵
        for (let j = 0; j < satellites.length; j++) {
            let sat = satellites[j];
            point = sat.orbitPoints[i];

            if (control === "true") {
                if (point.E * a2d >= station.elevationCutOff && point.flag) {
                    number++;

                    Q.resize([number, 4]);
                    let deltaX = point.ECEF_X - station.X;
                    let deltaY = point.ECEF_Y - station.Y;
                    let deltaZ = point.ECEF_Z - station.Z;

                    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

                    let cosA = deltaX / distance;
                    let cosB = deltaY / distance;
                    let cosC = deltaZ / distance;

                    Q.subset(math.index(number - 1, 0), cosA);
                    Q.subset(math.index(number - 1, 1), cosB);
                    Q.subset(math.index(number - 1, 2), cosC);
                    Q.subset(math.index(number - 1, 3), 1);
                }
            } else if (control === "false") {
                if (point.E * a2d >= station.elevationCutOff) {
                    number++;

                    Q.resize([number, 4]);
                    let deltaX = point.ECEF_X - station.X;
                    let deltaY = point.ECEF_Y - station.Y;
                    let deltaZ = point.ECEF_Z - station.Z;

                    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

                    let cosA = deltaX / distance;
                    let cosB = deltaY / distance;
                    let cosC = deltaZ / distance;

                    Q.subset(math.index(number - 1, 0), cosA);
                    Q.subset(math.index(number - 1, 1), cosB);
                    Q.subset(math.index(number - 1, 2), cosC);
                    Q.subset(math.index(number - 1, 3), 1);
                }
            }
        }

        //求DOP矩阵的逆
        let tpQ = math.transpose(Q);
        let inv_DOP = math.multiply(tpQ, Q);

        let size = math.size(inv_DOP);
        let row = size.subset(math.index(0));
        let column = size.subset(math.index(1));

        //求伴随矩阵
        let Adjugate = math.ones(row, column);

        for (let i = 0; i < row; i++) {

            for (let j = 0; j < column; j++) {
                let coe = math.pow(-1, (i + j + 2)); //系数

                let rowSub = [];
                let colSub = [];

                for (let k = 0; k < row; k++) {
                    if (k !== i) {
                        rowSub.push(k);
                    }

                    if (k !== j) {
                        colSub.push(k);
                    }
                }

                let Mij = inv_DOP.subset(math.index(rowSub, colSub));    //余子式
                let Aij = coe * math.det(Mij);    //代数余子式
                Adjugate.subset(math.index(j, i), Aij);
            }
        }

        let det = math.det(inv_DOP);    //求行列式的值
        let DOP = math.multiply(Adjugate, 1 / det);    //求DOP

        let a = DOP.subset(math.index(0, 0));
        let b = DOP.subset(math.index(1, 1));
        let c = DOP.subset(math.index(2, 2));
        let d = DOP.subset(math.index(3, 3));

        let GDOP = Math.floor(Math.sqrt(a + b + c + d) * 100) / 100;    //几何精度因子 GDOP
        time_GDOP.push(timeTextArray[i], GDOP);
        data_GDOP.push(time_GDOP);

        let PDOP = Math.floor(Math.sqrt(a + b + c) * 100) / 100;    //空间位置精度因子 PDOP
        time_PDOP.push(timeTextArray[i], PDOP);
        data_PDOP.push(time_PDOP);

        let HDOP = Math.floor(Math.sqrt(a + b) * 100) / 100;    //平面位置精度因子 HDOP
        time_HDOP.push(timeTextArray[i], HDOP);
        data_HDOP.push(time_HDOP);

        let VDOP = Math.floor(Math.sqrt(c) * 100) / 100;   //垂直位置精度因子 VDOP
        time_VDOP.push(timeTextArray[i], VDOP);
        data_VDOP.push(time_VDOP);

        let TDOP = Math.floor(Math.sqrt(d) * 100) / 100;    //时间精度因子 TDOP
        time_TDOP.push(timeTextArray[i], TDOP);
        data_TDOP.push(time_TDOP);
    }

    //绘制图表
    let option = {
        title: {
            text: 'DOP值'
        },
        tooltip: {
            trigger: 'axis',
        },
        legend: {
            data: ['GDOP', 'PDOP', 'HDOP', 'VDOP', 'TDOP'],
            symbol: 'circle',
            symbolSize: 0
        },
        xAxis: {
            type: 'time',
            axisLabel: {
                interval: 0,
                showMaxLabel: true,
                rotate: -30,
                formatter: function (value) {
                    return XAxisFormate(value);
                }
            }
        },
        yAxis: {},
        series: [{
            name: 'GDOP',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            data: data_GDOP
        }, {
            name: 'PDOP',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            data: data_PDOP
        }, {
            name: 'HDOP',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            data: data_HDOP
        }, {
            name: 'VDOP',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            data: data_VDOP
        }, {
            name: 'TDOP',
            type: 'line',
            symbol: 'circle',
            symbolSize: 0,
            data: data_TDOP
        }]
    };

    DOPChart.setOption(option);
}

//格式化时间文本
function FormateTimeText(timeText) {
    return timeText < 10 ? "0" + timeText : timeText.toString();
}

//X轴时间刻度格式化
function XAxisFormate(value) {
    let t_date = new Date(value);
    let year = t_date.getFullYear();
    let month = FormateTimeText(t_date.getMonth() + 1);
    let day = FormateTimeText(t_date.getDate());
    let hour = FormateTimeText(t_date.getHours());
    let minute = FormateTimeText(t_date.getMinutes());
    let second = FormateTimeText(t_date.getMinutes());
    return [year, month, day].join('-') + "\n  " + [hour, minute, second].join(':');
}