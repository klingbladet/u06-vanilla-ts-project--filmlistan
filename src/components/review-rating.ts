export function reviewComponent(isLoggedIn: boolean, initialReview: string = '', onSubmit?: (review: string) => void, userName: string = 'Du') {

  const reviewContainer = document.createElement('div');
  const reviewForm = document.createElement('form');
  const nameInput = document.createElement('input')
  const reviewText = document.createElement('textarea');
  const submitReviewBtn = document.createElement('button');

  // Om man är inloggad behöver man inte skriva namn
  if (!isLoggedIn) {
    nameInput.type = 'text'
    nameInput.placeholder = 'Ditt namn (valfritt)';
    nameInput.style.fontStyle = 'italic';
    nameInput.className = "w-full bg-black/20 mb-3 border border-white/10 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-400/50";
    reviewForm.appendChild(nameInput);
  }

  reviewForm.style.display = 'flex';
  reviewForm.style.flexDirection = 'column'
  reviewForm.style.justifyContent = 'space-between'
  reviewForm.style.marginTop = '10px'

  reviewText.value = initialReview
  reviewText.placeholder = 'Skriv din review här';
  reviewText.style.fontStyle = 'italic';
  reviewText.className = "w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-400/50 min-h-[100px]";

  submitReviewBtn.innerText = 'Spara recension'
  submitReviewBtn.type = 'submit';
  submitReviewBtn.style.color = '#fff';
  submitReviewBtn.style.alignSelf = 'center';
  submitReviewBtn.style.cursor = 'pointer';
  submitReviewBtn.style.marginTop = '15px'
  submitReviewBtn.className = "self-end px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"

  reviewForm.append(reviewText, submitReviewBtn);

  const reviewsList = document.createElement('div');
  reviewsList.className = "mt-4 space-y-3 border-t border-white/10 pt-4";

  const renderReviewItem = (text: string, author: string = "Anonym") => {
    if(!text) return;

    const item = document.createElement('div');
    item.className = "bg-white/5 p-3 rounded-x1 border border-white/5 animate-in fade-in slite-in-from-bottom-2";
    item.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
     <div class="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">
       ${author.charAt(0).toUpperCase()}
     </div>
     <span class="text-xs font-bold text-zinc-300">${author}</span>
     <span class="text-[10px] text-zinc-500 ml-auto">Just nu</span>
    </div>
    <p class="text-sm text-zinc-300 leading-relaxed">${text}</p>
    `;

    reviewsList.innerHTML = '';
    reviewsList.appendChild(item);
  };

  if(initialReview) {
    renderReviewItem(initialReview, isLoggedIn ? userName : "Anonym");
  }

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = reviewText.value;
    // Om inloggad, använd userName, annars input-värdet
    const author = isLoggedIn ? userName : (nameInput.value || "Anonym");
    
    if (!text.trim()) return;
    renderReviewItem(text, author);

    if(onSubmit) {
      onSubmit(reviewText.value);
    }
  });

  reviewContainer.append(reviewForm, reviewsList)
  return reviewContainer;
}

export function ratingComponent(initialRating: number = 0, onRate?: (rating: number) => void) {
  const ratingWrapper = document.createElement('div');
  const starsContainer = document.createElement('div');
  const scoreText = document.createElement('p');
  const scoreNumber = document.createElement('p')

  ratingWrapper.style.display = 'flex';
  ratingWrapper.style.alignItems = 'center';
  ratingWrapper.style.flexDirection = 'column';
  ratingWrapper.style.gap = '5';

  scoreText.textContent = 'Ditt betyg';
  scoreText.className = "text-xs text-zinc-400 mb-1";
  
  scoreNumber.textContent = initialRating > 0 ? `${initialRating}/5` : '-';
  scoreNumber.className = "text-sm font-bold text-amber-400 mt-1";
  
  starsContainer.style.display = 'inline-block';

  let currentRating = initialRating;

  function renderStars() {
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const starElement = document.createElement('span');
      starElement.textContent = '★';
      starElement.classList.add('star');
      starElement.style.cursor = 'pointer';
      starElement.style.fontSize = '1.2rem';
      starElement.style.color = i <= currentRating ? '#fbbf24' : '#52525b'; // amber-400 vs zinc-600
      starElement.dataset.value = i.toString();
      starsContainer.append(starElement);
    }
  }

  renderStars();

  starsContainer.addEventListener('click', (e) => {
    const clickedElement = e.target;
    if (clickedElement instanceof HTMLElement && clickedElement.classList.contains('star')) {
      const ratingValue = parseInt(clickedElement.dataset.value as string);
      currentRating = ratingValue;
      
      renderStars();
      scoreNumber.textContent = `${currentRating}/5`;
      
      if (onRate) {
        onRate(currentRating);
      }
    }
  });

  ratingWrapper.append(scoreText, starsContainer, scoreNumber)

  return ratingWrapper
}
