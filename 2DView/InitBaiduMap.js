// 百度地图API功能
let map = new BMapGL.Map("allmap");
map.centerAndZoom(new BMapGL.Point(116.331398, 39.897445), 11);
map.enableScrollWheelZoom(true);

//点击获取经纬度
map.addEventListener('click', function(e) {
    try {
        if (searching) {
            throw incompleteError;
        }

        //清除地图上所有的覆盖物
        map.clearOverlays();
        let pt = e.latlng;

        document.getElementById("stationL").value = DegreeToDMS(pt.lng);
        document.getElementById("stationB").value = DegreeToDMS(pt.lat);
        GetHeight(pt.lng, pt.lat);

        let point = new BMapGL.Point(pt.lng, pt.lat);
        let marker = new BMapGL.Marker(point);
        map.addOverlay(marker);

        station = undefined;
    }catch (error){

        if(error===incompleteError){
            alert(incompleteError);
        }
    }
});

// 用经纬度设置地图中心点
function Location(station){

    if (station.L !== undefined) {

        map.clearOverlays();
        let point = new BMapGL.Point(station.L,station.B);
        //创建标注
        let marker = new BMapGL.Marker(point)
        //将标注添加到地图中
        map.addOverlay(marker);
        map.panTo(point);
    }
}
