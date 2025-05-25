
window.addEventListener("load", () => {
  setTimeout(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 1000); // 1s khớp với thời gian fade
    }
  }, 10000); // ⏱️ đợi 10 giây rồi mới bắt đầu fade
});

const tips = [
  "Chào mừng bạn đến với Chem-Open 2025!",
  "Đây là một hoạt động của Liên chi Hội khoa Hoá học",
  "Đợi một chút nhé! Chúng mình đang chuẩn bị mọi thứ",
  "Xong rồi nè! Bắt đầu thôii"
];

let index = 0;
  const text = document.querySelector(".loading-text");
  if (text) {
    text.textContent = tips[0];
    setInterval(() => {
      index = (index + 1) % tips.length;
      text.textContent = tips[index];
    }, 2500);
  }
document.addEventListener("DOMContentLoaded", () => {
  const cld = cloudinary.Cloudinary.new({ cloud_name: 'dbmhmxsat', secure: true });

  const player = cld.videoPlayer('promo', {
    autoplay: true,
    muted: true,
    loop: true,
    controls: false,
    preload: 'auto',
    posterOptions: {
      transformation: { width: 960, crop: "scale" }
    }
  });

  player.source('ycqx8slkb7mpmmxymrqz');

  const overlay = document.getElementById('unmuteOverlay');

  let pausedOnce = false;

  // Khi bắt đầu phát → dừng sau 1 giây
  player.on('play', () => {
    if (!pausedOnce) {
      pausedOnce = true;
      setTimeout(() => {
        const videoEl = document.querySelector('#promo video');
        if (videoEl) {
          videoEl.pause(); // dừng lại sau 1s
        }
      }, 1000);
    }
  });

  // Khi click overlay → bật tiếng và play lại
  overlay.addEventListener('click', () => {
    const videoEl = document.querySelector('#promo video');
    if (videoEl) {
      videoEl.muted = false;
      videoEl.volume = 1;
      videoEl.play();
      overlay.classList.add('hidden');
    }
  });
});



