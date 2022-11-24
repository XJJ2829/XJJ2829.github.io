//地形采样进度条动画
function ProgressAnimation(){
    let progress = document.querySelector('.progress');
    let text = document.querySelector('.indexText');
    let totalLength = progress.getTotalLength();

    let timer = setInterval(function () {
        if (samplingPram !== undefined) {

            progress.style.strokeDashoffset = totalLength - (times / samplingPram.divide) * totalLength;
            text.textContent = Math.floor(times/samplingPram.divide*100).toString()+"%";

            if (times === samplingPram.divide) {

                setTimeout(function () {
                    alert("地形影响已添加.")

                    if (document.getElementById("SkyPlotDiv").style.display === "block") {
                        DrawSkyPlot(station, satellites);
                    } else if (document.getElementById("Charts").style.display === "block") {
                        DrawCharts(satellites);
                    }

                }, 500);

                times=0;
                searching=false;
                clearInterval(timer);
            }
        }
    }, 100);
}