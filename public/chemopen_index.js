
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
    controls: true,
    autoplay: true,
    muted: true,
    loop: true,
    preload: 'auto'
  });

  player.source('ycqx8slkb7mpmmxymrqz');

  const overlay = document.getElementById('unmuteOverlay');

  // Khi video bắt đầu phát → dừng sau 1s
  player.on('playing', () => {
    setTimeout(() => {
      player.pause(); // ✅ dùng trực tiếp player, không cần .videojs()
    }, 1000);
  });

  // Khi người dùng click overlay → bật tiếng và play lại
  overlay.addEventListener('click', () => {
    player.muted(false);        // ✅ unmute
    player.volume(1);           // ✅ chỉnh âm lượng
    player.play();              // ✅ tiếp tục phát
    overlay.classList.add('hidden');
  });
});
