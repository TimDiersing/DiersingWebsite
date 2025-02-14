const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const cardList = document.getElementById('card-list');

const cardAmt = cardList.children.length;
var cardWidth = cardList.clientWidth;
var currentChild = 0;

nextBtn.addEventListener('click', () => { 
    console.log(cardAmt, currentChild);
    if (currentChild < cardAmt - 1){
        currentChild = currentChild + 1;
        cardList.scroll({
            left: currentChild * cardWidth,
            behavior: "smooth"
        });
    }
});

prevBtn.addEventListener('click', () => { 
    if (currentChild > 0){
        currentChild = currentChild - 1;
        cardList.scroll({
            left: currentChild * cardWidth,
            behavior: "smooth"
        });
    }
});

onresize = event => {
    cardWidth = cardList.clientWidth;
    cardList.scroll({
        left: currentChild * cardWidth,
        behavior: "smooth"
    });
};
