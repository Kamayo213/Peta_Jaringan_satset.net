function logout() {
  localStorage.removeItem("loginStatus");
  window.location.href = "index.html";
}

if (localStorage.getItem("loginStatus") !== "loggedIn") {
  window.location.href = "index.html";
}

const map = L.map('map').setView([-7.250445, 112.768845], 13); // Surabaya

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

google.script.run.withSuccessHandler(renderMap).getAllData();

function renderMap(data) {
  data.odc.forEach(odc => {
    const marker = L.marker([odc.Latitude, odc.Longitude]).addTo(map);
    let status = parseInt(odc.Terpakai) >= parseInt(odc['Total Port']) ? 'Penuh' : 'Tersedia';
    marker.bindPopup(`<b>ODC:</b> ${odc.Nama}<br>Status: ${status}<br>${odc.Keterangan}`);
  });

  data.odp.forEach(odp => {
    const marker = L.circleMarker([odp.Latitude, odp.Longitude], {
      radius: 6,
      color: 'orange'
    }).addTo(map);
    marker.bindPopup(`<b>ODP:</b> ${odp.Nama}<br>${odp.Keterangan}`);
  });

  data.kabel.forEach(kabel => {
    const from = findCoord(kabel.Dari, data.odc.concat(data.odp));
    const to = findCoord(kabel.Ke, data.odc.concat(data.odp));
    if (from && to) {
      L.polyline([from, to], { color: 'darkblue' }).addTo(map)
        .bindPopup(`<b>Kabel:</b> ${kabel['Nama Kabel']}<br>${kabel.Keterangan}`);
    }
  });
}

function findCoord(nama, list) {
  const item = list.find(i => i.Nama === nama);
  return item ? [item.Latitude, item.Longitude] : null;
}
