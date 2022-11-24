//轨道坐标点
function OrbitPoint() {
    this.toc = 0; //观测时刻 toc周内秒
    this.week = 0;    //北斗周
    this.JD = 0;    //儒略日

    //ECEF坐标
    this.ECEF_X = 0;
    this.ECEF_Y = 0;
    this.ECEF_Z = 0;

    //ECI坐标
    this.ECI_X = 0;
    this.ECI_Y = 0;
    this.ECI_Z = 0;

    //经纬度
    this.phi = 0;
    this.theta = 0;

    //测站观测到的高度角和方位角
    this.E=0;
    this.A=0;

    //天空图坐标
    this.skyPlotX = 0;
    this.skyPlotY = 0;

    //是否可见
    this.flag = false;
}