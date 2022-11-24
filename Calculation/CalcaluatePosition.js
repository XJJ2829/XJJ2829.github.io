let intervalJD

//轨道六根数计算卫星位置
function Calculate(almanac, orbitPoint) {
    const GM = 3986004.418e8;   //地球引力常数GM
    let a = Math.pow(almanac.sqrtA, 2);    //长半轴a
    let n0 = Math.sqrt(GM / Math.pow(a, 3));   //计算平均角速度n0
    let tk = orbitPoint.toc - (almanac.a0 + almanac.a1 * (orbitPoint.toc - almanac.toe)) - almanac.toe;    //规划时刻tk
    let Mk = almanac.M0 + n0 * tk;    //计算观测时刻的平近点角Mk
    let Ek = Mk;    //偏近点角

    //迭代计算偏近点角
    do {
        let Ek1 = Mk + almanac.e * Math.sin(Ek);

        if (Ek1 - Ek <= 1e-5) {
            Ek = Ek1;
            break;
        }

        Ek = Ek1;
    } while (true);

    //计算真近点角
    // let vk = Math.atan2(Math.sqrt(1 - Math.pow(almanac.e, 2)) * Math.sin(Ek),
    //     Math.cos(Ek) - almanac.e);

    let vk = 2 * Math.atan(Math.sqrt((1 + almanac.e) / (1 - almanac.e)) * Math.tan(Ek / 2));
    if (vk < 0) {
        vk += Math.PI * 2;
    }


    //计算参考时刻升交角距
    let phik = vk + almanac.omega;

    //计算uk,rk,ik
    let uk = phik;
    let rk = a * (1 - almanac.e * Math.cos(Ek));
    let ik = almanac.I0;

    //计算卫星轨道平面坐标
    let xk = rk * Math.cos(uk);
    let yk = rk * Math.sin(uk);

    //改正升交点经度
    const OMEGAe = 7.29211567e-5; //地球自转角速度
    let OMEGAk = almanac.OMEGA0 + (almanac.OMEGA0Dot - OMEGAe) * tk - OMEGAe * almanac.toe;

    //计算卫星ECEF坐标
    orbitPoint.ECEF_X = xk * Math.cos(OMEGAk) - yk * Math.cos(ik) * Math.sin(OMEGAk);
    orbitPoint.ECEF_Y = xk * Math.sin(OMEGAk) + yk * Math.cos(ik) * Math.cos(OMEGAk);
    orbitPoint.ECEF_Z = yk * Math.sin(ik);
}

//初始位置计算（历书基准时刻）
function CalPosi(almanaces, satellites) {

    let almType = document.getElementById("almSelector").value;
    let baseJD = 0, almJD = 0;

    //根据文件类型选择起始UTC时间
    if (almType === "conv1780.21alc") {
        baseJD = UTC2JD(2006, 1, 1, 0, 0, 0);
    } else if (almType === "almanac.alm") {
        baseJD = UTC2JD(1980, 1, 6, 0, 0, 0);
    }

    //计算距离初始时刻的天数
    almJD = baseJD + almanaces[0].week * 7;
    let selectDay = document.getElementById("dateSelector").value;
    let selectDayArray = selectDay.split("-");
    let selectJD = UTC2JD(+selectDayArray[0], +selectDayArray[1], +selectDayArray[2], 0, 0, 0);
    intervalJD = selectJD - almJD;
    let startTime = document.getElementById("startTimeSelector").value;

    for (let i = 0; i < almanaces.length; i++) {

        let orbitPoint = new OrbitPoint();
        let almanac = almanaces[i];

        //设定坐标点起始UTC
        orbitPoint.week = almanac.week;
        orbitPoint.toc = intervalJD * 86400 + startTime * 3600;

        Calculate(almanac, orbitPoint);
        satellites[i].orbitPoints.push(orbitPoint);
    }
}

//轨道加密计算 interval-时间间隔(min) time-外推时长(hour)
function Extrapolation(almanaces, satellites, interval, time) {
    let number = Math.floor(time * 60 / interval);  //外推点数
    let satellite, almanac;

    for (let i = 0; i < satellites.length; i++) {
        satellite = satellites[i];
        almanac = almanaces[i];

        for (let j = 0; j < number; j++) {
            let orbitPoint = new OrbitPoint();
            orbitPoint.toc = satellite.orbitPoints[0].toc + (j + 1) * 5 * 60;
            orbitPoint.week = almanac.week;
            Calculate(almanac, orbitPoint);
            satellite.orbitPoints.push(orbitPoint);
        }
    }
}

//计算卫星天空图坐标
function CalcSkyPlotCoor(station, satellites) {
    //若未读取测站信息，则抛出异常
    if (station === undefined) {
        throw stationError;
    }

    BLH2XYZ(station);

    let B = station.B * d2a;
    let L = station.L * d2a;

    for (let i = 0; i < satellites.length; i++) {
        let sat = satellites[i];

        for (let j = 0; j < sat.orbitPoints.length; j++) {
            let point = sat.orbitPoints[j];

            //计算ECEF坐标差
            let deltaXYZ = math.ones(3, 1);
            ClacDeltaXYZ(station, point, deltaXYZ);

            //计算旋转矩阵
            let T = math.zeros(3, 3);
            ClacTransMatrix(B, L, T);

            //将坐标差转到站心坐标系
            CalcEA(T, deltaXYZ, point);

            //计算天空图坐标
            CalcCoor(point);
        }
    }

    if(control==="true"){
        for (let i = 0; i < elevPoints.length; i++) {
            CalcCoor(elevPoints[i]);
        }
        console.log(elevPoints);
    }

}

//计算两点在空间直角坐标系下的坐标差
function ClacDeltaXYZ(station, point, deltaXYZ) {
    if (point.ECEF_X !== undefined) {
        deltaXYZ.subset(math.index(0, 0), point.ECEF_X - station.X);
        deltaXYZ.subset(math.index(1, 0), point.ECEF_Y - station.Y);
        deltaXYZ.subset(math.index(2, 0), point.ECEF_Z - station.Z);
    } else if (point.X !== undefined) {
        deltaXYZ.subset(math.index(0, 0), point.X - station.X);
        deltaXYZ.subset(math.index(1, 0), point.Y - station.Y);
        deltaXYZ.subset(math.index(2, 0), point.Z - station.Z);
    }
}

//计算空间直角坐标系到站心坐标系的旋转矩阵
function ClacTransMatrix(B, L, T) {
    T.subset(math.index(0, 0), -Math.sin(B) * Math.cos(L));
    T.subset(math.index(0, 1), -Math.sin(B) * Math.sin(L));
    T.subset(math.index(0, 2), Math.cos(B));
    T.subset(math.index(1, 0), -Math.sin(L));
    T.subset(math.index(1, 1), Math.cos(L));
    T.subset(math.index(2, 0), Math.cos(B) * Math.cos(L));
    T.subset(math.index(2, 1), Math.cos(B) * Math.sin(L));
    T.subset(math.index(2, 2), Math.sin(B));
}

//计算高度角与方位角
function CalcEA(T, deltaXYZ, point) {
    //将坐标差转到站心坐标系
    let satXYZ = math.multiply(T, deltaXYZ);
    let satX = satXYZ.subset(math.index(0, 0));
    let satY = satXYZ.subset(math.index(1, 0));
    let satZ = satXYZ.subset(math.index(2, 0));

    //计算卫星高度角与方位角
    point.E = Math.atan(satZ / Math.sqrt(satX * satX + satY * satY));
    point.A = Math.atan(satY / satX);

    if (satX < 0) {
        point.A += Math.PI;
    } else if (satX > 0 && satY < 0) {
        point.A += 2 * Math.PI;
    }
}

//计算天空图坐标
function CalcCoor(point) {
    let skyPlotRadius = 180;
    let len = skyPlotRadius * Math.cos(point.E);
    point.skyPlotX = len * Math.sin(point.A);
    point.skyPlotY = len * Math.cos(point.A);
}

//计算点在多边形内部
function CalcPointInPolygon(orbitPoint,elevPoints){
    let flag = false;
    let q = new Point(orbitPoint.skyPlotX,orbitPoint.skyPlotY);

    for(let i=0;i<elevPoints.length;i++){
        let p1 = new Point(elevPoints[i].skyPlotX,elevPoints[i].skyPlotY);
        let p2;
        if(i!==elevPoints.length-1){
            p2 = new Point(elevPoints[i+1].skyPlotX,elevPoints[i+1].skyPlotY);
        }else{
            p2 = new Point(elevPoints[0].skyPlotX,elevPoints[0].skyPlotY);
        }

        //经过多边形顶点
        if(dcmp(q.y-p1.y)===0&&p1.y>p2.y) return flag=!flag;

        if(dcmp(q.y-p2.y)===0&&p2.y>p1.y) return flag=!flag;

        //判断是否位于p1,p2上
        if(OneSegment(p1,p2,q)) return true;

        //前一个判断被测点是否位于p1,p2之间 第二个判断被测点是否位于边的左边
        if((dcmp(p1.y-q.y)>0!==dcmp(p2.y-q.y)>0)&&dcmp(q.x-(q.y-p1.y)*(p1.x-p2.x)/(p1.y-p2.y)-p1.x)<0) flag=!flag;
    }
    return flag;
}

//判断点Q是否在p1,p2连线上（非延长线）
function OneSegment(q,p1,p2){
    return dcmp(Vcross(Vsub(p1,q),Vsub(p2,q)))===0&&dcmp(Vdot(Vsub(p1,q),Vsub(p2,q)))<=0;
}

//向量相加
function Vadd(p1,p2){
    return new Point(p1.x+p2.x,p1.y+p2.y);
}

//向量相减
function Vsub(p1,p2){
    return new Point(p1.x-p2.x,p1.y-p2.y);
}

//向量点乘
function Vdot(p1,p2){
    return p1.x*p2.x+p1.y*p2.y;
}

//向量叉乘
function Vcross(p1,p2){
    return p1.x*p2.y-p1.y*p2.x;
}

//在固定精度指标下的大小判断
function dcmp(number){
    if(Math.abs(number)<1e-6){
        return 0;
    }else{
        return number<0?-1:1;
    }
}
