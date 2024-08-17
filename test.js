function loadAll(){
    blinkOn();
    catBlinkOn();
    changePageColors(0);
    hideHeart();
}

function blinkOn(){
    document.getElementById("portrait_pixel_eyes").style.zIndex = "-1";
    var min = 1, max = 6;
    var rand = min + (max-min)*Math.random();
    rand *= 1000;
    setTimeout(blinkOff, rand);
}

function blinkOff(){
    document.getElementById("portrait_pixel_eyes").style.zIndex = "-2";
    var min = 0.05, max = 0.2;
    var rand = min + (max-min)*Math.random();
    rand *= 1000;
    setTimeout(blinkOn, rand);
}

function catBlinkOn(){
    document.getElementById("portrait_pixel_eyes_cat").style.zIndex = "-1";
    var min = 2, max = 10;
    var rand = min + (max-min)*Math.random();
    rand *= 1000;
    setTimeout(catBlinkOff, rand);
}

function catBlinkOff(){
    document.getElementById("portrait_pixel_eyes_cat").style.zIndex = "-2";
    var min = 0.4, max = 1.6;
    var rand = min + (max-min)*Math.random();
    rand *= 1000;
    setTimeout(catBlinkOn, rand);
}

function reloadCSS(){
    var links = document.getElementsByTagName("link");
    for (var cl in links){
        var link = links[cl];
        if (link.rel === "stylesheet"){
            link.href += "";
        }
    }
}

function changePageColors(idx){

    // Store color palettes here
    const color_palettes = [
        ['#1e201e', '#3c3d37', '#f1f1f1', '#aaaaaa', '100%'], // 0 Default (dark)
        ['#dddddd', '#f1f1f1', '#0f0f0f', '#777777',   '0%'], // 1 Default (light)
        ['#1E201E', '#3C3D37', '#ECDFCC', '#697565', '100%'], // 2 Dark green
        ['#6482AD', '#7FA1C3', '#F5EDED', '#E2DAD6', '100%'], // 3 Calm blue
        ['#201E43', '#134B70', '#EEEEEE', '#508C9B', '100%'], // 4 Dark blue / Cyan
        ['#405D72', '#758694', '#FFF8F3', '#F7E7DC', '100%'], // 5 Preppy grey-blue
        ['#f0d1c0', '#ffded6', '#2F3645', '#939185',   '0%'], // 6 Cream-brick-grey-green
        ['#f0d1c0', '#f1f1f1', '#DC5F00', '#7a746a',   '0%'], // 7 Cream-orange-grey
    ];

    if (idx >= color_palettes.length){
        idx = 0
    };

    var color_palette = color_palettes[idx];

    var wrap_color = color_palette[0];
    var core_color = color_palette[1];
    var high_color = color_palette[2];
    var low_color = color_palette[3];
    var soc_bright = 'brightness(' + color_palette[4] + ')';

    var root_theme = document.querySelector(":root");
    root_theme.style.setProperty('--color_wrap', wrap_color);
    root_theme.style.setProperty('--color_core', core_color);
    root_theme.style.setProperty('--color_highlight', high_color);
    root_theme.style.setProperty('--color_lowlight', low_color);
    root_theme.style.setProperty('--brightness_social', soc_bright);
    
    // Reload the CSS file with the newest root colors
    reloadCSS();
}