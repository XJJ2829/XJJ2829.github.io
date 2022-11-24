//卫星
function Satellite() {
    this.prn = "";    //卫星PRN号
    this.orbitPoints = [];  //轨道点集
    this.tracks = [];   //天空图轨迹集
}

//历书
function Almanac() {
    this.prn = "";    //卫星PRN号
    this.health = 0;  //卫星健康状况
    this.e = 0;       //轨道偏心率
    this.toe = 0;     //参考时间
    this.I0 = 0;      //轨道倾角
    this.OMEGA0Dot = 0;   //升交点赤经变化率
    this.sqrtA = 0;   //轨道长半径平方根
    this.OMEGA0 = 0;  //升交点赤经
    this.omega = 0;   //近地点角距
    this.M0 = 0;      //平近点角
    this.a0 = 0;      //钟差
    this.a1 = 0;      //钟漂
    this.week = 0;    //北斗周
}