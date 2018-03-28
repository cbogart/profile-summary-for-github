function donutChart(objectName, data) {
    let canvas = document.getElementById(objectName);
    if (canvas === null) {
        return;
    }
    let userId = document.body.getAttribute("data-user-id");
    let labels = Object.keys(data[objectName]);
    let values = Object.values(data[objectName]);
    let colors = createColorArray(labels.length);
    let tooltipInfo = null;
    window.languageColors = window.languageColors || {};
    if ("langRepoCount" === objectName) {
        // when the first language-set is loaded, set a color-profile for all languages
        labels.forEach((language, i) => languageColors[language] = colors[i]);
    }
    if (["langRepoCount", "langStarCount", "langCommitCount"].indexOf(objectName) > -1) {
        // if the dataset is language-related, load color-profile
        labels.forEach((language, i) => colors[i] = languageColors[language]);
    }
    if (objectName === "repoCommitCount") {
        tooltipInfo = data[objectName + "Descriptions"]; // high quality programming
        arrayRotate(colors, 4); // change starting color
    }
    if (objectName === "repoStarCount") {
        tooltipInfo = data[objectName + "Descriptions"]; // high quality programming
        arrayRotate(colors, 2); // change starting color
    }
    new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            animation: false,
            rotation: (-0.40 * Math.PI),
            legend: { // todo: fix duplication ?
                position: window.innerWidth < 600 ? "bottom" : "left",
                labels: {
                    fontSize: window.innerWidth < 600 ? 10 : 12,
                    padding: window.innerWidth < 600 ? 8 : 10,
                    boxWidth: window.innerWidth < 600 ? 10 : 12
                }
            },
            tooltips: {
                callbacks: {
                    afterLabel: function (tooltipItem, data) {
                        if (tooltipInfo !== null) {
                            return wordWrap(tooltipInfo[data["labels"][tooltipItem["index"]]], 45);
                        }
                    }
                },
            },
            onClick: function (e, data) {
                try {
                    let label = labels[data[0]._index];
                    let canvas = data[0]._chart.canvas.id;
                    if (canvas === "repoStarCount" || canvas === "repoCommitCount") {
                        window.open("https://github.com/" + userId + "/" + label, "_blank");
                        window.focus();
                    } else {
                        window.open("https://github.com/" + userId + "?utf8=%E2%9C%93&tab=repositories&q=&type=source&language=" + encodeURIComponent(label), "_blank");
                        window.focus();
                    }
                } catch (ignored) {
                }
            },
            onResize: function (instance) { // todo: fix duplication ?
                instance.chart.options.legend.position = window.innerWidth < 600 ? "bottom" : "left";
                instance.chart.options.legend.labels.fontSize = window.innerWidth < 600 ? 10 : 12;
                instance.chart.options.legend.labels.padding = window.innerWidth < 600 ? 8 : 10;
                instance.chart.options.legend.labels.boxWidth = window.innerWidth < 600 ? 10 : 12;
            }
        }
    });

    function createColorArray(length) {

        const colors = [
            "#54ca76",
            "#f5c452",
            "#f2637f",
            "#9261f3",
            "#31a4e6",
            "#55cbcb"
        ];

        let array = [...Array(length).keys()].map(i => colors[i % colors.length]);

        // avoid first and last colors being the same
        if (length % colors.length === 1)
            array[length - 1] = colors[1];

        return array;
    }

    function arrayRotate(arr, n) {
        for (let i = 0; i < n; i++) {
            arr.push(arr.shift());
        }
        return arr
    }

    function wordWrap(str, n) {
        if (str === null) {
            return null;
        }
        let currentLine = [];
        let resultLines = [];
        str.split(" ").forEach(word => {
            currentLine.push(word);
            if (currentLine.join(" ").length > n) {
                resultLines.push(currentLine.join(" "));
                currentLine = [];
            }
        });
        if (currentLine.length > 0) {
            resultLines.push(currentLine.join(" "));
        }
        return resultLines
    }
}

// String hash from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery

function stringHash (s) {
  var hash = 0, i, chr, len;
  if (s.length === 0) return hash;
  for (i = 0, len = s.length; i < len; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

//Return a color unique for this key, brigher if selected.
//Of course the color can't really be unique because there are more keys
//in the world than colors; but the algorithm tries to make similar strings
//come out different colors so they can be distinguished in a chart or graph"""
function hashColor(key, selected) {

    function tw(t) { return t ^ (t << (t % 5)) ^ (t << (6 + (t % 7))) ^ (t << (13 + (t % 11))); }
    function hex2(t) { return ("00"+t.toString(16)).substr(-2); }
    var theHash = tw(stringHash(key) % 5003)
    var ifsel = selected?0x80:0x00;
    r = ifsel | (theHash & 0x7f);
    g = ifsel | ((theHash >> 8) & 0x7F);
    b = ifsel | ((theHash >> 16) & 0x7F);
    return "#" + hex2(r) + hex2(g) + hex2(b);
}

function multiLineChart(objectName, data) {
    new Chart(document.getElementById(objectName).getContext("2d"), {
        type: "line",
        data: {
            // The year-quarter labels from any of the datasets (they're all the same)
            labels: Object.keys(data[objectName][Object.keys(data[objectName])[0]]),
            datasets: Object.keys(data[objectName]).map(function(key, index) {
              return {
                label: key,
                pointRadius: 0,
                data: Object.values(data[objectName][key]),
                borderColor: hashColor(key),
                backgroundColor: hashColor(key,true),
                lineTension: 0
              } } )
        },
        options: {
            maintainAspectRatio: false,
            animation: false,
            scales: {
                xAxes: [{
                    display: false,
                    stacked: true
                }],
                yAxes: [{
                    position: "right",
                    stacked: true
                }]
            },
            legend: {
                display: true
            },
            tooltips: {
                intersect: false
            }
        }
    });
}

function lineChart(objectName, data) {
    new Chart(document.getElementById(objectName).getContext("2d"), {
        type: "line",
        data: {
            labels: Object.keys(data[objectName]),
            datasets: [{
                label: "Commits",
                data: Object.values(data[objectName]),
                backgroundColor: "rgba(67, 142, 233, 0.2)",
                borderColor: "rgba(67, 142, 233, 1)",
                lineTension: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            animation: false,
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    position: "right"
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                intersect: false
            }
        }
    });
}
