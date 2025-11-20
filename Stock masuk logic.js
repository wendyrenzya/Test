const API = "https://api.bigmotor.biz.id";

let BARANG = [];
let SELECTED_ID = null;

window.onload = loadBarang;

async function loadBarang() {
  const res = await fetch(API + "/barang");
  const json = await res.json();

  console.log("STOK MASUK BARANG:", json);

  BARANG = json.results;
  renderList();
}

function renderList() {
  stockSummary.innerHTML = "";

  BARANG.forEach(b => {
    stockSummary.innerHTML += `
      <div class="item" onclick="openForm(${b.id})">
        <strong>${b.nama}</strong><br>
        Stok: ${b.stock}
      </div>
    `;
  });
}

function openForm(id) {
  SELECTED_ID = id;
  const b = BARANG.find(x => x.id == id);

  selectedBarangName.innerText = b.nama;

  stockForm.classList.remove("hidden");
}

btnCancelMasuk.onclick = () => {
  stockForm.classList.add("hidden");
};

// SAVE
btnSaveMasuk.onclick = async () => {
  const body = {
    barang_id: SELECTED_ID,
    jumlah: Number(qtyMasuk.value),
    harga_modal: Number(hargaModalMasuk.value),
    catatan: descMasuk.value,
  };

  console.log("STOK MASUK BODY:", body);

  const res = await fetch(API + "/stok_masuk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User": getUser(),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  console.log("STOK MASUK SAVE:", json);

  if (!json.ok) return alert("Gagal: " + json.error);

  alert("Berhasil");
  location.reload();
};

function getUser() {
  const u = localStorage.getItem("bmt_user");
  if (!u) return "";
  return JSON.parse(u).username;
}
