
console.log("✅ breadcum_confetti.js loaded");

// ===============================
// 🧭 BREADCRUMB SYSTEM
// ===============================
function updateBreadcrumbOnScroll() {
  const breadcrumbHouse =
    document.getElementById("breadcrumbHouse");

  if (!breadcrumbHouse) return;

  const sections = document.querySelectorAll(".house-section");
  let current = "All Houses";

  sections.forEach(sec => {
    const r = sec.getBoundingClientRect();
    if (r.top <= 130 && r.bottom >= 130) {
      const title =
        sec.querySelector(".house-title span");
      if (title) {
        current = title.textContent.replace("House: ", "");
      }
    }
  });

  breadcrumbHouse.textContent = current;
}

window.addEventListener("scroll", updateBreadcrumbOnScroll);

// ===============================
// 🎉 CONFETTI SYSTEM
// ===============================
window.startConfetti = function () {

  const confettiCount = 120;
  const canvas = document.createElement("canvas");

  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const w = canvas.width = window.innerWidth;
  const h = canvas.height = window.innerHeight;

  const conf = [];
  for (let i = 0; i < confettiCount; i++) {
    conf.push({
      x: Math.random() * w,
      y: Math.random() * h - h,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: `hsl(${Math.random() * 360},100%,60%)`
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    conf.forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      c.y += Math.cos(c.d) + 1 + c.r / 2;
      c.x += Math.sin(c.d);

      if (c.y > h) {
        conf[i] = { ...c, y: -10, x: Math.random() * w };
      }
    });
    requestAnimationFrame(draw);
  }

  draw();

  setTimeout(() => canvas.remove(), 2000);
};