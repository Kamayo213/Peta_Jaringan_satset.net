// Logout dan pengecekan login
function logout() {
  localStorage.removeItem("loginStatus");
  window.location.href = "index.html";
}

if (localStorage.getItem("loginStatus") !== "loggedIn") {
  window.location.href = "index.html";
}

// Inisialisasi Leaflet map
const map = L.map('map').setView([-7.250445, 112.768845], 13); // Surabaya
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Ambil data dari Google Apps Script
google.script.run.withSuccessHandler(renderMap).getAllData();

// Fungsi utama render map
function renderMap(data) {
  // Tampilkan ODC
  data.odc.forEach(odc => {
    const marker = L.marker([parseFloat(odc.Latitude), parseFloat(odc.Longitude)]).addTo(map);
    const status = parseInt(odc.Terpakai) >= parseInt(odc["Total Port"]) ? 'Penuh' : 'Tersedia';
    marker.bindPopup(`
      <b>ODC:</b> ${odc.Nama}<br>
      <b>Status:</b> ${status}<br>
      <b>Total Port:</b> ${odc["Total Port"]}<br>
      <b>Terpakai:</b> ${odc.Terpakai}<br>
      <b>Keterangan:</b> ${odc.Keterangan}
    `);
  });

  // Tampilkan ODP
  data.odp.forEach(odp => {
    const marker = L.circleMarker([parseFloat(odp.Latitude), parseFloat(odp.Longitude)], {
      radius: 6,
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.8
    }).addTo(map);
    marker.bindPopup(`
      <b>ODP:</b> ${odp.Nama}<br>
      <b>Total Port:</b> ${odp["Total Port"]}<br>
      <b>Terpakai:</b> ${odp.Terpakai}<br>
      <b>Keterangan:</b> ${odp.Keterangan}
    `);
  });

  // Tampilkan Kabel
  data.kabel.forEach(kabel => {
    const from = findCoord(kabel.Dari, data.odc.concat(data.odp));
    const to = findCoord(kabel.Ke, data.odc.concat(data.odp));
    if (from && to) {
      const line = L.polyline([from, to], { color: 'darkblue' }).addTo(map);
      line.bindPopup(`
        <b>Kabel:</b> ${kabel["Nama Kabel"]}<br>
        <b>Jumlah Core:</b> ${kabel["Jumlah Core"]}<br>
        <b>Core Terpakai:</b> ${kabel["Core Terpakai"]}<br>
        <b>Dari:</b> ${kabel.Dari}<br>
        <b>Ke:</b> ${kabel.Ke}<br>
        <b>Keterangan:</b> ${kabel.Keterangan}
      `);
    }
  });
}

// Fungsi bantu: cari koordinat berdasarkan nama
function findCoord(nama, list) {
  const item = list.find(i => i.Nama === nama);
  if (!item) return null;
  return [parseFloat(item.Latitude), parseFloat(item.Longitude)];
}
