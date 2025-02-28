const prevBtn = document.getElementsByClassName('prev-btn')[0];
const nextBtn = document.getElementsByClassName('next-btn')[0];
const cardHolder = document.getElementsByClassName('card-holder')[0];

const cardAmt = cardHolder.children.length;
var cardWidth = cardHolder.clientWidth;
var currentChild = 0;

nextBtn.addEventListener('click', () => { 
    if (currentChild < cardAmt - 1){
        currentChild = currentChild + 1;
        cardHolder.scroll({
            left: currentChild * cardWidth,
            behavior: "smooth"
        });
    }
});

prevBtn.addEventListener('click', () => { 
    if (currentChild > 0){
        currentChild = currentChild - 1;
        cardHolder.scroll({
            left: currentChild * cardWidth,
            behavior: "smooth"
        });
    }
});

onresize = event => {
    cardWidth = cardHolder.clientWidth;
    cardHolder.scroll({
        left: currentChild * cardWidth,
        behavior: "smooth"
    });
};
