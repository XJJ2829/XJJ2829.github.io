let Theta;  //ECEF到ECI的旋转角

const d2a = Math.PI / 180; //弧度->角度转换常数（degree to arc)
const a2d = 180 / Math.PI;    //角度->弧度转换常数（arc to degree）

//计算格林尼治平恒星时
function JD2GMST(JD) {
    let JDmin = Math.floor(JD) - 0.5;
    let JDmax = Math.floor(JD) + 0.5;
    let JD0;

    if (JD > JDmin) {
        JD0 = JDmin;
    }

    if (JD > JDmax) {
        JD0 = JDmax;
    }

    let H = (JD - JD0) * 24;
    let D = JD - 2451545.0;
    let D0 = JD0 - 2451545.0;
    let T = D / 36525;
    let GMST = (6.697374558 + 0.06570982441908
        * D0 + 1.00273790935 * H + 0.000026 * T * T) % 24 * 15;
    return GMST;
}

//计算格林尼治视恒星时
function JD2GAST(JD) {
    let THETAm = JD2GMST(JD);
    let T = (JD - 2451545.0) / 36525;
    let EPSILONm = 84381448 - 46.8150 * T - .00059 * T * T + .001813 * T * T * T;
    let L = 280.4665 + 36000.7698 * T;
    let dL = 218.3165 + 481267.8813 * T;
    let OMEGA = 125.04452 - 1934.136261 * T;
    let dPSI = -17.20 * Math.sin(OMEGA * d2a) - 1.32 * Math.sin(2 * L * d2a)
        - 0.23 * Math.sin(2 * dL * d2a) + 0.21 * Math.sin(2 * OMEGA * d2a);
    let dEPSILON = 9.20 * Math.cos(OMEGA * d2a) + 0.57 * Math.cos(2 * L * d2a)
        + 0.10 * Math.cos(2 * dL * d2a) - 0.09 * Math.cos(2 * OMEGA * d2a);
    dPSI = dPSI * (1 / 3600);
    dEPSILON = dEPSILON * (1 / 3600);
    let GAST = (THETAm + dPSI * Math.cos((EPSILONm + dEPSILON) * d2a)) % 360;
    return GAST;
}

//ECEF转ECI
function ECEF2ECI(JD, orbitPoint) {
    let THETA = JD2GAST(JD);
    let theta = THETA * d2a;

    let ECEF = math.ones(3, 1);
    ECEF.subset(math.index(0, 0), orbitPoint.ECEF_X);
    ECEF.subset(math.index(1, 0), orbitPoint.ECEF_Y);
    ECEF.subset(math.index(2, 0), orbitPoint.ECEF_Z);

    let T = T3D(THETA);
    let ECI = math.multiply(T, ECEF);

    function T3D(THETA) {
        let T = math.zeros(3, 3);
        T.subset(math.index(0, 0), Math.cos(THETA * d2a));
        T.subset(math.index(0, 1), -1 * Math.sin(THETA * d2a));
        T.subset(math.index(1, 0), -1 * T.subset(math.index(0, 1)));
        T.subset(math.index(1, 1), T.subset(math.index(0, 0)));
        T.subset(math.index(2, 2), 1);
        return T;
    }

    return [ECI, theta];
}

//坐标转换
function CoorTrans(satellites, almType) {
    let satellite, orbitPoint, pastDay, JD, ECI_theta, baseJD;

    if (almType === "conv1780.21alc") {
        baseJD = UTC2JD(2006, 1, 1, 0, 0, 0);
    } else if (almType === "almanac.alm") {
        baseJD = UTC2JD(1980, 1, 6, 0, 0, 0);
    }


    for (let i = 0; i < satellites.length; i++) {
        satellite = satellites[i];

        for (let j = 0; j < satellite.orbitPoints.length; j++) {
            orbitPoint = satellite.orbitPoints[j];
            pastDay = orbitPoint.week * 7;
            pastDay += orbitPoint.toc / 86400;
            JD = baseJD + pastDay;
            ECI_theta = ECEF2ECI(JD, orbitPoint);
            let ECI = ECI_theta[0];
            let theta = ECI_theta[1];
            if (j === 0) {
                Theta = theta;
            }
            orbitPoint.JD = JD;
            orbitPoint.ECI_X = ECI.subset(math.index(0, 0));
            orbitPoint.ECI_Y = ECI.subset(math.index(1, 0));
            orbitPoint.ECI_Z = ECI.subset(math.index(2, 0));
        }
    }
}

//大地坐标转空间直角坐标
let a, f, b, e2, e2_, W, np2, t, M, M0, N;

function BLH2XYZ(station) {

    let B = station.B * d2a;
    let L = station.L * d2a;
    let H = station.H;

    //计算地球椭球基本量
    CalcBaseEllipsoidPram();
    CalcAsisEllipsoidPram(B);

    station.X = (N + H) * Math.cos(B) * Math.cos(L);
    station.Y = (N + H) * Math.cos(B) * Math.sin(L);
    station.Z = (N * (1 - e2) + H) * Math.sin(B);
}

//计算年积日
function CalcDayOfYear(year, month, day) {
    let dayofMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        dayofMonth[1] = 29;
    }

    let dayOfYear = 0;

    for (let i = 0; i < month - 1; i++) {
        dayOfYear += dayofMonth[i];
    }

    dayOfYear += day;
    return dayOfYear;
}

//计算辅助量
let A, B, C, D, E, F, X, deltaL;
let alpha, beta, gamma, sigma, ipso, yita;
let a0, a1, a2, a3, a4, a5, a6;

//高斯投影正算
function BL2XY(L0, point) {
    let lat = point.B*d2a;
    let lon = point.L*d2a;
    L0*=d2a;
    CalcBaseEllipsoidPram();
    CalcAsisEllipsoidPram(lat);
    CalcMeridianArc(lat);
    CalcAsisNumber(lat);
    deltaL = lon - L0;
    point.x = a0 + a2 * Math.pow(deltaL, 2) + a4 * Math.pow(deltaL, 4) + a6 * Math.pow(deltaL, 6);
    point.y = a1 * deltaL + a3 * Math.pow(deltaL, 3) + a5 * Math.pow(deltaL, 5);
}

//计算子午弧长
function CalcMeridianArc(lat) {
    CalcA2F_a2y();
    X = alpha * lat + beta * Math.sin(2 * lat) + gamma * Math.sin(4 * lat) + sigma * Math.sin(6 * lat) + ipso * Math.sin(8 * lat) + yita * Math.sin(10 * lat);
}

//计算子午弧长所需的量
function CalcA2F_a2y(){
    A = 1 + 3 / 4 * e2 + 45 / 64 * Math.pow(e2, 2) + 175 / 256 * Math.pow(e2, 3) + 11025 / 16384 * Math.pow(e2, 4) + 43659 / 65536 * Math.pow(e2, 5)
    B = 3 / 4 * e2 + 15 / 16 * Math.pow(e2, 2) + 525 / 512 * Math.pow(e2, 3) + 2205 / 2048 * Math.pow(e2, 4) + 72765 / 65536 * Math.pow(e2, 5);
    C = 15 / 64 * Math.pow(e2, 2) + 105 / 256 * Math.pow(e2, 3) + 2205 / 4096 * Math.pow(e2, 4) + 10395 / 16384 * Math.pow(e2, 5);
    D = 35 / 512 * Math.pow(e2, 3) + 315 / 2048 * Math.pow(e2, 4) + 31185 / 131072 * Math.pow(e2, 5);
    E = 315 / 16384 * Math.pow(e2, 4) + 3465 / 65536 * Math.pow(e2, 5);
    F = 693 / 131072 * Math.pow(e2, 5)

    alpha = A * M0;
    beta = -1 / 2 * B * M0;
    gamma = 1 / 4 * C * M0;
    sigma = -1 / 6 * D * M0;
    ipso = 1 / 8 * E * M0;
    yita = -1 / 10 * F * M0;
}

//计算辅助量
function CalcAsisNumber(lat) {
    a0 = X;
    a1 = N * Math.cos(lat);
    a2 = 1 / 2 * N * Math.pow(Math.cos(lat), 2) * t;
    a3 = 1 / 6 * N * Math.pow(Math.cos(lat), 3) * (1 - t * t + np2);
    a4 = 1 / 24 * N * Math.pow(Math.cos(lat), 4) * (5 - t * t + 9 * np2 + 4 * np2 * np2) * t;
    a5 = 1 / 120 * N * Math.pow(Math.cos(lat), 5) * (5 - 18 * t * t + Math.pow(t, 4) + 14 * np2 - 58 * np2 * t * t);
    a6 = 1 / 720 * N * Math.pow(Math.cos(lat), 6) * (61 - 58 * t * t + Math.pow(t, 4) + 270 * np2 - 330 * np2 * t * t) * t;
}

//地球椭球基本公式
function CalcBaseEllipsoidPram(){
    a = 6378137.000;    //椭球长半轴
    f = 1 / 298.3;    //椭球扁率
    b = a * (1 - f);    //椭球短半轴
    e2 = (a * a - b * b) / (a * a);   //椭球第一偏心率平方
    e2_ = e2 / (1 - e2);    //椭球第二偏心率平方
    M0 = a * (1 - e2);  //子午圈赤道处的曲率半径
}

//辅助计算公式
function CalcAsisEllipsoidPram(lat) {
    W = Math.sqrt(1 - e2 * Math.pow(Math.sin(lat), 2));
    np2 = e2_ * Math.pow(Math.cos(lat), 2);
    t = Math.tan(lat);
    N = a / W;  //卯酉圈曲率半径
    M = a*(1-e2)/Math.pow(W,3);
}

//高斯投影反算
let b0,b1,b2,b3,b4,b5,b6;

function XY2BL(L0,point){
    CalcBaseEllipsoidPram();
    CalcA2F_a2y();
    CalcBottomLat(point);
    b0 = Bf;
    b1 = 1/(N*Math.cos(Bf));
    b2 = -t/(2*M*N);
    b3 = -(1+2*t*t+np2)/(6*N*N)*b1;
    b4 = -(5+3*t*t+np2-9*np2*t*t)/(12*N*N)*b2;
    b5 = -(5+28*t*t+24*Math.pow(t,4)+6*np2+8*np2*t*t)/(120*Math.pow(N,4))*b1;
    b6 = (61+90*t*t+45*Math.pow(t,4))/(360*Math.pow(N,4))*b2;
    let y = point.y;
    point.B = b0+b2*y*y+b4*Math.pow(y,4)+b6*Math.pow(y,6);
    point.L = b1*y + b2*Math.pow(y,3)+b5*Math.pow(y,5)+L0*d2a;
}

//计算底点纬度
let Bf;

function CalcBottomLat(point){
    let X = point.x;
    let B0 = X/alpha;
    Bf=0;
    let delta = 0;

    while (true){
        delta = beta*Math.sin(2*B0)+gamma*Math.sin(4*B0)+sigma*Math.sin(6*B0)+ipso*Math.sin(8*B0)+yita*Math.sin(10*B0);
        Bf = (X-delta)/alpha;
        if(Math.abs(Bf-B0)<=1e-8){
            break;
        }else{
            B0=Bf;
        }
    }
    CalcAsisEllipsoidPram(Bf);
}