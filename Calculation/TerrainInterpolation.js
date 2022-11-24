let times = 0;  //获取高程计数
let elevPoints = [];    //障碍物环视图点集
let completeIndex = 0;  //径向划分数

//高程插值，寻找单个方向上的最大高度角
function ElevInterpolation(station, endPoint, radius, divide, interval) {
    let start = Cesium.Cartesian3.fromDegrees(station.L, station.B);
    let end = Cesium.Cartesian3.fromDegrees(endPoint.L, endPoint.B);
    let positions = [];
    let count = radius * 1000 / interval;

    for (let i = 0; i < count; i++) {
        let cart = Cesium.Cartesian3.lerp(start, end, i / count, new Cesium.Cartesian3());
        positions.push(Cesium.Cartographic.fromCartesian(cart));
    }
    positions.push(Cesium.Cartographic.fromCartesian(end));

    let terrainProvider = Cesium.createWorldTerrain();
    let promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);

    Cesium.when(promise, function (updatedPositions) {
            station.H = updatedPositions[0].height;
            let maxElevPoint = new Station();
            maxElevPoint.E = station.elevationCutOff * d2a;

            for (let i = 1; i < updatedPositions.length; i++) {

                let elevPoint = new Station();
                elevPoint.L = updatedPositions[i].longitude * a2d;
                elevPoint.B = updatedPositions[i].latitude * a2d;
                elevPoint.H = updatedPositions[i].height;
                BL2XY(station.L, elevPoint);
                let distance = Math.sqrt(Math.pow(elevPoint.x - station.x, 2) + Math.pow(elevPoint.y - station.y, 2));
                elevPoint.E = Math.atan((elevPoint.H - station.H) / distance);

                if (elevPoint.E > maxElevPoint.E) {
                    maxElevPoint = elevPoint;
                }

            }
            maxElevPoint.A = endPoint.number * 360 / divide * d2a;
            elevPoints.push(maxElevPoint);
            times += 1; //当前完成数
            console.log(times);
        }
    );
}

let searching = false;  //是否正在进行高程采样计算

//高程采样计算
function CalcElevation(station, samplingPram) {
    elevPoints = [];
    let radius = samplingPram.radius;
    let divide = samplingPram.divide;
    let interval = samplingPram.interval;
    completeIndex = divide;
    let earthRadius = 6371.393;
    times = 0;
    searching = true;

    for (let i = 0; i < divide; i++) {

        let theta = i * 360 / divide * d2a;
        let end_lon = station.L + radius * Math.sin(theta) / (2 * Math.PI * earthRadius * Math.cos(station.B * d2a)) * 360;
        let end_lat = station.B + radius * Math.cos(theta) / (2 * Math.PI * earthRadius) * 360;   //未处理南北纬或者东西经下的不同情况
        let endPoint = new Station();

        endPoint.L = end_lon;
        endPoint.B = end_lat;
        endPoint.number = i;

        ElevInterpolation(station, endPoint, radius, divide, interval);
    }
}

//获取测站高
let getHeightTimeout;
let heights;
let getHeightComplete = undefined;

function GetHeight(lon, lat) {
    getHeightComplete = false;
    let point = Cesium.Cartesian3.fromDegrees(lon, lat);
    let positions = [];
    positions.push(Cesium.Cartographic.fromCartesian(point));
    let terrainProvider = Cesium.createWorldTerrain();
    let promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
    heights = [];
    getHeightTimeout = setInterval("CompleteGetHeight()", 1000)
    Cesium.when(promise, function (updatedPositions) {
        heights.push(updatedPositions[0].height);
        getHeightComplete = true;
    });
}

//成功获取到测站高时
function CompleteGetHeight() {
    if (getHeightComplete) {
        document.getElementById("stationH").value = Math.floor(heights[0] * 1000) / 1000;
        clearInterval(getHeightTimeout);
    }
}