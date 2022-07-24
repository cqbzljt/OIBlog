window.onload = () => {
    // 添加 相册壁纸拖拽（电脑）和长按（手机）切换背景 监听 没相册可删除，或者看下面创建相册教程
    try {
        let time = ''
        let imgbox = document.querySelector('.fj-gallery')
        imgbox.addEventListener('contextmenu', (e) => {
            e.preventDefault()
        })
        imgbox.addEventListener('dragend', (e) => {
            let bg = 'url(' + e.target.src + ')'
            changeBg(bg)
        })
        imgbox.addEventListener('touchstart', (e) => {
            time = setTimeout(() => {
                let bg = 'url(' + e.target.src + ')'
                changeBg(bg);
            }, 500);
        })
        imgbox.addEventListener('touchend', (e) => {
            clearTimeout(time);
        })
    } catch (error) {}
}

// 背景localstorage
try {
    s = localStorage.getItem('blogbg');
    if (s != 'null') {
        changeBg(s)
    }
} catch (error) {}


// 添加 拾色器 监听
try {
    document.getElementById('color').addEventListener('change', (e) => {
        changeBg(e.path[0].value);
    })
} catch (error) {}

// 切换背景函数
function changeBg(s) {
    let bg = document.getElementById('web_bg')
    // 纯色
    if (s.charAt(0) == '#') {
        bg.style.backgroundColor = s
        bg.style.backgroundImage = 'none'
        // 换回网站原来的背景
    } else if (s == 'null') {
        localStorage.setItem('blogbg', null);
        location.reload()
        // 渐变和图片
    } else {
        bg.style.backgroundImage = s
    }
    localStorage.setItem('blogbg', s);
}