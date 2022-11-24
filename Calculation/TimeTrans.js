//UTC转儒略日
function UTC2JD(year, month, day, hour, minute, second) {
    if (month >= 3) {
        month -= 3;
    } else if (month < 3) {
        year -= 1;
        month += 9;
    }
    let JD = 1721103.5 + Math.floor(365.25 * year) + Math.floor(30.6 * month + 0.5) + day;
    JD += hour / 24 + minute / 1440 + second / 86400;
    return JD;
}

//儒略日转UTC
function JD2UTC(JD) {
    JD += 0.5;
    let Z = Math.floor(JD);
    let F = JD - Z;
    let A,a;

    if (Z < 2299161) {
        A = Z;
    } else {
        a = Math.floor((Z - 2305507.25) / 36524.25);
        A = Z + 10 + a - Math.floor(a / 4);
    }

    let k = 0;
    let year, month, day;
    let B, C, D, E;
    let date = [];

    while (true) {
        B = A + 1524;
        C = Math.floor((B - 122.1) / 365.25);
        D = Math.floor(365.25 * C);
        E = Math.floor((B - D) / 30.6001);
        day = B - D - Math.floor(30.6001 * E) + F;

        if (day >= 1) {
            break;
        }

        A -= 1;
        k += 1;
    }

    E < 14 ? month = E - 1 : month = E - 13;
    month > 2 ? year = C - 4716 : year = C - 4715;
    date.push(year, month, day);
    return date;
}