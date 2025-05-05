document.addEventListener('DOMContentLoaded', function () {
    let slideIndex = 0;
    const slides = document.querySelectorAll(".mySlides");
    if (!slides.length) return; // Exit if no slides are found

    function showSlides() {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[slideIndex].classList.add('active');
        slideIndex = (slideIndex + 1) % slides.length;
        setTimeout(showSlides, 5000); // 5 seconds per slide
    }

    showSlides();
});

document.addEventListener('DOMContentLoaded', function () {
    var swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 10,
        loop: true, // Cho phép vòng lặp
        autoplay: {
            delay: 5000, // Thời gian chuyển đổi giữa các slide (3 giây)
            disableOnInteraction: false, // Nếu người dùng tương tác, autoplay vẫn tiếp tục
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 3, // Hiển thị 3 slide trên màn hình rộng
                slidesPerGroup: 3,
            },
            1024: {
                slidesPerView: 5, // Hiển thị 5 slide trên màn hình lớn
                slidesPerGroup: 5,
            }
        }
    });
});
const swiperContainer = document.querySelector('.swiper-container');
    
    swiperContainer.addEventListener('mouseenter', function () {
        swiper.autoplay.stop(); // Dừng autoplay khi hover
    });

    swiperContainer.addEventListener('mouseleave', function () {
        swiper.autoplay.start(); // Bắt đầu autoplay khi rời khỏi hover
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Lắng nghe sự kiện click vào menu "Hoạt động"
        document.getElementById('activities').addEventListener('click', function (event) {
            event.preventDefault(); // Ngừng hành vi mặc định của liên kết
    
            // Lấy vị trí của phần tử cần cuộn
            const targetElement = document.getElementById('title-swiper');
            
            // Cuộn mượt mà với tốc độ chậm hơn
            smoothScroll(targetElement);
        });
    });
    
    // Hàm cuộn mượt mà với thời gian chậm hơn
    function smoothScroll(target) {
        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 1000; // Tốc độ cuộn (1 giây)
        let startTime = null;
    
        // Hàm cuộn
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const scrollAmount = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            
            window.scrollTo(0, scrollAmount);
    
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
    
        // Để cuộn mượt mà, sử dụng easing function
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
    
        // Bắt đầu cuộn
        requestAnimationFrame(animation);
    }





