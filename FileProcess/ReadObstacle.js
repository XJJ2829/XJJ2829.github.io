let stations=new Array()
let contorl2=false;

window.onload=function (){
    var stationArray=new Array()
    var input = document.querySelector('#fileInput')
     input.addEventListener('change', function() {
         if(this.files.length){
             contorl2=true;
             let file = this.files[0];
             let reader = new FileReader();
             reader.onload = function(){
                 var ObatacleArray=new Array();
                 ObatacleArray=this.result;
                 var _ObatacleArray=ObatacleArray.split("\n");
                 _ObatacleArray.forEach(function (item){
                     var _item=new Array()
                     _item=item.replace(/\s+/ig," ");
                     _item=_item.split(' ');
                     var _station=new Station();
                     _station.A=_item[0]/180*3.1415;
                     _station.E=_item[1]/180*3.1415;
                     stations.push(_station);
                 });
                 stations.forEach(function (item){
                     CalcCoor(item);
                 });
             };
             reader.readAsText(file);
         }
     }, false);
 }
