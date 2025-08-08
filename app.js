// URL Web App Google Apps Script - Ganti dengan milikmu
const API_URL = 'https://script.google.com/macros/s/AKfycbzQM25ji6WzYsb9OFLvb5JcvALnwcQLaTiRYRmgodiuxHgiDkQpGAH4-Y8YPnW1CaITMg/exec';

// Cek login dan role
const role = localStorage.getItem('role');
const email = localStorage.getItem('email');

if (!role || !email) {
  window.location.href = 'index.html';
}

// Init Leaflet map
const map = L.map('map').setView([-7.250445, 112.768845], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Tampilkan info user di UI
document.getElementById('userRole').textContent = role;
document.getElementById('userEmail').textContent = email;

// Logout
document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'index.html';
});

// Profil
document.getElementById('btnProfile').addEventListener('click', () => {
  alert(`Email: ${email}\nRole: ${role}`);
});

// Tampilkan menu tambah data hanya untuk teknisi
const menuTeknisi = document.getElementById('menuTeknisi');
if (role === 'teknisi') {
  menuTeknisi.style.display = 'block';
} else {
  menuTeknisi.style.display = 'none';
}

let networkData = { odc: [], odp: [], kabel: [] };

async function loadNetworkData() {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getNetworkData' }),
    });
    const data = await res.json();

    if (!data.odc || !data.odp || !data.kabel) {
      alert('Data jaringan tidak lengkap!');
      return;
    }
    networkData = data;
    renderMap(data);
  } catch (error) {
    alert('Gagal ambil data jaringan, cek koneksi & API_URL');
    console.error(error);
  }
}

function renderMap(data) {
  // Hapus semua layer marker dan polyline kecuali tile layer
  map.eachLayer(layer => {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });

  // ODC
  data.odc.forEach(odc => {
    const terpakai = Number(odc.Terpakai);
    const totalPort = Number(odc['Total Port']);
    const sisa = totalPort - terpakai;

    let color = 'green';
    if (terpakai >= 2 && terpakai <= 3) color = 'yellow';
    else if (terpakai >= 4) color = 'red';

    const marker = L.circleMarker([+odc.Latitude, +odc.Longitude], {
      color,
      radius: 10,
      fillOpacity: 0.7,
    }).addTo(map);

    marker.bindPopup(
      `<b>ODC:</b> ${odc.Nama}<br>` +
      `<b>Total Port:</b> ${totalPort}<br>` +
      `<b>Terpakai:</b> ${terpakai}<br>` +
      `<b>Sisa:</b> ${sisa}<br>` +
      `<b>Keterangan:</b> ${odc.Keterangan}`
    );
  });

  // ODP
  data.odp.forEach(odp => {
    const terpakai = Number(odp.Terpakai);
    const totalPort = Number(odp['Total Port']);
    const sisa = totalPort - terpakai;

    let color = 'green';
    if (terpakai >= 5 && terpakai <= 7) color = 'yellow';
    else if (terpakai >= totalPort) color = 'red';

    const marker = L.circleMarker([+odp.Latitude, +odp.Longitude], {
      color,
      radius: 8,
      fillOpacity: 0.7,
    }).addTo(map);

    marker.bindPopup(
      `<b>ODP:</b> ${odp.Nama}<br>` +
      `<b>Total Port:</b> ${totalPort}<br>` +
      `<b>Terpakai:</b> ${terpakai}<br>` +
      `<b>Sisa:</b> ${sisa}<br>` +
      `<b>Keterangan:</b> ${odp.Keterangan}`
    );
  });

  // Kabel
  data.kabel.forEach(kabel => {
    const from = findCoord(kabel.Dari, data.odc.concat(data.odp));
    const to = findCoord(kabel.Ke, data.odc.concat(data.odp));
    if (!from || !to) return;

    const line = L.polyline([from, to], { color: 'darkblue', weight: 4 }).addTo(map);

    line.bindPopup(
      `<b>Kabel:</b> ${kabel['Nama Kabel']}<br>` +
      `<b>Jumlah Core:</b> ${kabel['Jumlah Core']}<br>` +
      `<b>Core Terpakai:</b> ${kabel['Core Terpakai']}<br>` +
      `<b>Dari:</b> ${kabel.Dari}<br>` +
      `<b>Ke:</b> ${kabel.Ke}<br>` +
      `<b>Keterangan:</b> ${kabel.Keterangan}`
    );
  });
}

function findCoord(id, list) {
  const item = list.find(i => i.ID === id);
  if (!item) return null;
  return [+item.Latitude, +item.Longitude];
}

// Form tambah data
const formContainer = document.getElementById('formContainer');
const dataForm = document.getElementById('dataForm');
const formTitle = document.getElementById('formTitle');
let currentAddType = null;

document.getElementById('btnTambahODC').addEventListener('click', () => {
  currentAddType = 'ODC';
  showForm('ODC');
});
document.getElementById('btnTambahODP').addEventListener('click', () => {
  currentAddType = 'ODP';
  showForm('ODP');
});
document.getElementById('btnTambahKabel').addEventListener('click', () => {
  currentAddType = 'KABEL';
  showForm('KABEL');
});

function showForm(type) {
  formContainer.classList.remove('hidden');
  formTitle.textContent = `Tambah ${type}`;

  let html = '';
  if (type === 'ODC' || type === 'ODP') {
    html += `
      <label>ID (unik): <input type="text" name="ID" required /></label>
      <label>Nama: <input type="text" name="Nama" required /></label>
      <label>Latitude: <input type="number" step="any" name="Latitude" required /></label>
      <label>Longitude: <input type="number" step="any" name="Longitude" required /></label>
      <label>Total Port: <input type="number" name="Total Port" required /></label>
      <label>Terpakai: <input type="number" name="Terpakai" required /></label>
      <label>Keterangan: <input type="text" name="Keterangan" /></label>
    `;
  } else if (type === 'KABEL') {
    let options = networkData.odc.concat(networkData.odp)
      .map(n => `<option value="${n.ID}">${n.Nama} (${n.ID})</option>`).join('');
    html += `
      <label>ID (unik): <input type="text" name="ID" required /></label>
      <label>Nama Kabel: <input type="text" name="Nama Kabel" required /></label>
      <label>Jumlah Core: <input type="number" name="Jumlah Core" required /></label>
      <label>Core Terpakai: <input type="number" name="Core Terpakai" required /></label>
      <label>Dari: <select name="Dari" required>${options}</select></label>
      <label>Ke: <select name="Ke" required>${options}</select></label>
      <label>Keterangan: <input type="text" name="Keterangan" /></label>
    `;
  }
  html += `<button type="submit">Simpan</button>`;
  dataForm.innerHTML = html;
}

dataForm.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(dataForm);
  const obj = {};
  formData.forEach((v, k) => obj[k] = v);

  // Cek ID unik
  const listKey = currentAddType.toLowerCase();
  const exists = networkData[listKey]?.some(d => d.ID === obj.ID);
  if (exists) {
    alert('ID sudah ada, gunakan ID lain.');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addData',
        sheetName: currentAddType,
        data: obj,
      }),
    });
    const result = await res.json();
    if (result.success) {
      alert(`${currentAddType} berhasil ditambahkan!`);
      formContainer.classList.add('hidden');
      loadNetworkData();
    } else {
      alert('Gagal tambah data: ' + result.msg);
    }
  } catch (error) {
    alert('Error tambah data: ' + error.message);
  }
});

// Load data pertama kali
loadNetworkData();
