const API = "https://api.bigmotor.biz.id";

let BARANG_CACHE = [];
let EDIT_ID = null;

// Load barang saat halaman dibuka
window.onload = loadBarang;

async function loadBarang() {
  try {
    const res = await fetch(API + "/barang");
    const json = await res.json();

    console.log("BARANG LIST:", json);

    if (!json.ok) return alert("Gagal load barang");

    BARANG_CACHE = json.results;
    renderBarang(BARANG_CACHE);
  } catch (e) {
    console.log("LOAD BARANG ERR:", e);
  }
}

function renderBarang(list) {
  const box = document.getElementById("barangList");
  box.innerHTML = "";

  list.forEach(b => {
    box.innerHTML += `
      <div class="item">
        <strong>${b.nama}</strong><br>
        Stok: ${b.stock}<br>
        Harga: ${b.harga}<br>
        <button onclick="editBarang(${b.id})">Edit</button>
      </div>
    `;
  });
}

document.getElementById("searchBarang").addEventListener("input", () => {
  const key = searchBarang.value.toLowerCase();
  const f = BARANG_CACHE.filter(b => b.nama.toLowerCase().includes(key));
  renderBarang(f);
});

document.getElementById("btnAddBarang").onclick = () => {
  EDIT_ID = null;
  openForm();
};

function editBarang(id) {
  EDIT_ID = id;

  const b = BARANG_CACHE.find(x => x.id == id);
  if (!b) return;

  openForm(b);
}

function openForm(b = null) {
  document.getElementById("barangForm").classList.remove("hidden");

  document.getElementById("namaBarang").value = b ? b.nama : "";
  document.getElementById("hargaBarang").value = b ? b.harga : "";
  document.getElementById("hargaModal").value = b ? b.harga_modal : "";
  document.getElementById("kategoriBarang").value = b ? b.kategori : "";
  document.getElementById("deskripsiBarang").value = b ? b.deskripsi : "";
  document.getElementById("fotoBarang").value = b ? b.foto : "";
}

document.getElementById("btnCancelBarang").onclick = () => {
  document.getElementById("barangForm").classList.add("hidden");
};

// SAVE
document.getElementById("btnSaveBarang").onclick = saveBarang;

async function saveBarang() {
  const body = {
    nama: namaBarang.value,
    harga: Number(hargaBarang.value),
    harga_modal: Number(hargaModal.value),
    kategori: kategoriBarang.value,
    deskripsi: deskripsiBarang.value,
    foto: fotoBarang.value,
  };

  try {
    let url = API + "/barang";
    let method = "POST";

    if (EDIT_ID) {
      url = API + "/barang/" + EDIT_ID;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-User": getUser(),
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    console.log("SAVE BARANG:", json);

    if (!json.ok) return alert("Gagal simpan: " + json.error);

    alert("Sukses");
    window.location.reload();
  } catch (e) {
    console.log("SAVE ERR:", e);
  }
}

// FETCH IMAGE
document.getElementById("btnFetchImage").onclick = fetchImage;

async function fetchImage() {
  const q = namaBarang.value;
  if (!q) return alert("Isi nama barang dulu!");

  fetchResult.innerHTML = "Loading gambar...";

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&client_id=YOUR_KEY`;
  // NOTE: kamu akan memasukkan key atau worker yang handle fetch ini nanti.

  const res = await fetch(url);
  const json = await res.json();
  
  fetchResult.innerHTML = "";

  json.results.slice(0, 6).forEach(img => {
    const url = img.urls.small;
    fetchResult.innerHTML += `
      <img src="${url}" onclick="fotoBarang.value='${url}'">
    `;
  });
}

function getUser() {
  const u = localStorage.getItem("bmt_user");
  if (!u) return "";
  return JSON.parse(u).username;
}
