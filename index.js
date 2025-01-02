
var map = L.map('map')
var objectsOnLayer = new L.LayerGroup();
// html thingies
const calendar = document.getElementById('calendar');
const hourSelector = document.getElementById('hourSelector');
const api = "https://plofski.pythonanywhere.com"

traffic_arr = ['rustig','gemiddeld','druk']

var file = null

//icons
var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


console.log(`${api}/predict?`)
async function loadAllCounters() {
    const queryParams = new URLSearchParams();

    queryParams.append("date", calendar.value);
    queryParams.append("hour", hourSelector.value);

    const prediction_cntrs = await (await fetch(api+"/predict?"+ queryParams.toString())).json();

    const table_tbody = document.getElementById("tbody_counters")
    table_tbody.innerHTML = ''

    prediction_cntrs['predictions'].forEach(element => {

        var marker = L.marker([element["lat"], element["long"]]).addTo(objectsOnLayer);

        marker.on('click', function () {
            marker.unbindPopup();
            // Create a popup with custom content
            let popupContent = `<b>${element.name}</b><br> Voorspelde aantal fietsers ${element.predicted_traffic}`;
            marker.bindPopup(popupContent).openPopup();  // Show the popup on click
        })

        fill_counters(element, element, table_tbody)

    })
    





}


document.addEventListener('DOMContentLoaded', async function () {
    // Initialize the map
    map.setView([51.049999, 3.733333], 13); // Center map on the given coordinates

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    objectsOnLayer.addTo(map)
    const today = new Date();
    

    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() +5);

    calendar.min = today.toISOString().split('T')[0];
    calendar.max = oneWeekLater.toISOString().split('T')[0];

    calendar.value = today.toISOString().split('T')[0];





    for (let i = 0; i < 24; i++) {
        
        const option = document.createElement('option');

        option.value = `${i}`;
        option.textContent = `${i}u`;

        
        hourSelector.appendChild(option);
    }

    hourSelector.value = today.getHours()
    await loadAllCounters()




});


document.getElementById("updateBtn").onclick = updatePredictions




async function updatePredictions() {
    objectsOnLayer.clearLayers()

    if (file != null) {
       await loadGPX()
    } else {

        await loadAllCounters()
    }
}


async function loadGPX() {
    if (file && file.name.endsWith('.gpx')) {
        var reader = new FileReader();
        reader.onload = async function (e) {
            var gpx = e.target.result;
            // Create a new GPX layer
            var gpxLayer = new L.GPX(gpx, {
                async: false,
                marker_options: {
                    startIconUrl: 'https://mpetazzoni.github.io/leaflet-gpx/pin-icon-start.png',  // Start marker
                    endIconUrl: 'https://mpetazzoni.github.io/leaflet-gpx/pin-icon-end.png',    // End marker
                    shadowUrl: null,
                    wptIconUrls: null    // No waypoint markers
                }
            }).addTo(objectsOnLayer);

            // Zoom to the GPX layer bounds
            map.fitBounds(gpxLayer.getBounds());

            await load_bike_counters(gpxLayer)

        };
        reader.readAsText(file);
    } else {
        file = null
        alert('Please upload a valid GPX file.');
    }
}

document.getElementById('gpxFile').addEventListener('change', function (event) {


    objectsOnLayer.clearLayers();

    file = event.target.files[0];
    loadGPX()

});

async function plan_route() {


    var gpxL = new L.GPX("./New route.gpx", {
        async: false,

        marker_options: {
            startIconUrl: 'https://mpetazzoni.github.io/leaflet-gpx/pin-icon-start.png',  // Remove start marker
            endIconUrl: 'https://mpetazzoni.github.io/leaflet-gpx/pin-icon-end.png',    // Remove end marker
            shadowUrl: null,
            wptIconUrls: null    // Remove waypoint markers

        }


    }).on('loaded', function (e) {
        map.fitBounds(e.target.getBounds());
    }).addTo(map);



}



async function load_bike_counters(gpxLayer) {

    console.log(gpxLayer)
    var bounds = gpxLayer.getBounds()

    const counters = await (await fetch(`${api}/sites`)).json()



    const needed_counters = counters
        .filter(element => {
            if (element.lat && element.long) {
                let counterLatLng = L.latLng(element.lat, element.long);

                // Check if the counter is within the route bounds
                if (bounds.contains(counterLatLng)) {
                    return true;
                }

                let isWithin10m = false;
                gpxLayer.getLayers().forEach(layer => {
                    if (layer instanceof L.Polyline) {

                        isWithin10m = layer.getLatLngs().some((latlng) => counterLatLng.distanceTo(latlng) <= 10);
                        if (isWithin10m) return;
                    }
                });

                return isWithin10m;
            }
            return false;
        })
        ;


    const queryParams = new URLSearchParams();
    needed_counters.map(element => element.id).forEach(id => queryParams.append("id", id));

    queryParams.append("date", calendar.value);
    queryParams.append("hour", hourSelector.value);

    const prediction_cntrs = await (await fetch( `${api}/predict?` + queryParams.toString()

    )).json()




    const table_tbody = document.getElementById("tbody_counters")
    table_tbody.innerHTML = ''



    
    needed_counters.forEach(element => {

        console.log(element)
        prediction = prediction_cntrs["predictions"].filter(pred => pred.site_id == element.id)[0]
        fill_counters(element, prediction, table_tbody)

    });

    


}


function traffic_intensity(amount){
    if( amount < 60){
        return 0
    }else if (amount >=60 && amount<=120){

        return 1
    }else{
        return 2
    }
}


function fill_counters(element, prediction, table_tbody) {
    var marker = L.marker([element["lat"], element["long"]]).addTo(objectsOnLayer);

    marker.on('click', function () {
        marker.unbindPopup();
        // Create a popup with custom content
        let popupContent = `<b>${element.name}</b><br> Het voorspelde aantal fietsers: ${prediction.predicted_traffic}`;
        marker.bindPopup(popupContent).openPopup();  // Show the popup on click
    })

    const counter_tr = document.createElement("tr");
    counter_tr.classList.add("row")
    const counter_td = document.createElement("td");


    const counter_title = document.createElement("p");
    counter_title.classList.add("mx-sm-3", "mb-2", "font-weight-bold")
    counter_title.innerText = element.name


    const counter_city = document.createElement("p");
    counter_city.classList.add("mx-sm-3", "mb-2")
    counter_city.innerHTML = "<b>stad:</b> " + element.city


    const counter_traffic = document.createElement("p");
    counter_traffic.classList.add("mx-sm-3", "mb-2")
    counter_traffic.innerText = `Voorspelde drukte om ${hourSelector.value}u: ${traffic_arr[traffic_intensity(prediction.predicted_traffic)]}
                                Voorspeld aantal fietsers: ${prediction.predicted_traffic} `  
    counter_td.appendChild(counter_title)
    counter_td.appendChild(counter_city)
    counter_td.appendChild(counter_traffic)

    counter_tr.appendChild(counter_td)
    table_tbody.appendChild(counter_tr)

    
}
//#class="row"
