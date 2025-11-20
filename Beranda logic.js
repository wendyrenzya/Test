const API = "https://api.bigmotor.biz.id";

window.onload = () => {
  loadUser();
  loadMore();
  startClock();
};

// Ambil user dari localStorage
function loadUser() {
  const u = localStorage.getItem("bmt_user");
  if (!u) return;

  const user = JSON.parse(u);
  document.getElementById("greeting").innerText = "Halo, " + user.name;
}

// Jam realtime
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").innerHTML = 
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }, 1000);
}

// Load custom / sticky / welcome image
async function loadMore() {
  try {
    const res = await fetch(API + "/more");
    const json = await res.json();
    console.log("MORE:", json);

    if (!json.ok) return;

    document.getElementById("customMessage").innerText = json.result.custom_message || "";
    document.getElementById("stickyMessage").innerText = json.result.sticky_message || "";

    // Welcome floating image
    if (json.result.welcome_image_url) {
      const img = document.getElementById("floatingImage");
      img.src = json.result.welcome_image_url;

      document.getElementById("floatingImageContainer").style.display = "block";
    }

    document.getElementById("closeFloating").onclick = () => {
      document.getElementById("floatingImageContainer").style.display = "none";
    };

  } catch (e) {
    console.log("MORE ERROR:", e);
  }
}
