//测站
function Station(){

    this.number=0;
    //大地坐标
    this.B=undefined;
    this.L=undefined;
    this.H=undefined;

    //截止高度角
    this.elevationCutOff = undefined;

    //空间直角坐标
    this.X=0;
    this.Y=0;
    this.Z=0;

    //高度角、方位角
    this.E=0;
    this.A=0;

    //平面投影坐标
    this.x=0;
    this.y=0;

    //天空图坐标
    this.skyPlotX=0;
    this.skyPlotY=0;

    //高程点最大值索引
    this.maxIndex = 0;
}