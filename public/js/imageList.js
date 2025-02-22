const imageCarousel = document.getElementsByClassName('image-carousel')[0];
const prevBtn = imageCarousel.children[0];
const imgHolder = imageCarousel.children[1];
const nextBtn = imageCarousel.children[2];
const imageNumber = imageCarousel.children[3];

const imgAmt = imgHolder.children.length;
var imgWidth = imgHolder.clientWidth;
var currentChild = 0;

imageNumber.innerHTML = '<p>'+ (currentChild + 1) +'/' + imgAmt + '<p>';

nextBtn.addEventListener('click', () => { 
    if (currentChild < imgAmt - 1){
        currentChild = currentChild + 1;
        imageNumber.innerHTML = '<p>'+ (currentChild + 1) +'/' + imgAmt + '<p>';
        imgHolder.scroll({
            left: currentChild * imgWidth,
            behavior: "smooth"
        });
    }
});

prevBtn.addEventListener('click', () => { 
    if (currentChild > 0){
        currentChild = currentChild - 1;
        imageNumber.innerHTML = '<p>'+ (currentChild + 1) +'/' + imgAmt + '<p>';
        imgHolder.scroll({
            left: currentChild * imgWidth,
            behavior: "smooth"
        });
    }
});

onresize = event => {
    imgWidth = imgHolder.clientWidth;
    imgHolder.scroll({
        left: currentChild * imgWidth,
        behavior: "smooth"
    });
};
