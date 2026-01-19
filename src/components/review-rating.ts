export function reviewComponent(initialReview: string = '', onSubmit?: (review: string) => void) {

  const reviewContainer = document.createElement('div');
  const reviewForm = document.createElement('form');
  const nameInput = document.createElement('input')
  const reviewText = document.createElement('textarea');
  const submitReviewBtn = document.createElement('button');

  nameInput.type = 'text'
  nameInput.placeholder = 'Your name'
  nameInput.style.fontStyle = 'italic';
  nameInput.style.marginBottom = '15px'
  nameInput.style

  reviewForm.style.display = 'flex';
  reviewForm.style.flexDirection = 'column'
  reviewForm.style.justifyContent = 'space-between'
  reviewForm.style.marginTop = '10px'

  reviewText.value = initialReview
  reviewText.placeholder = 'Skriv din review här';
  reviewText.style.fontStyle = 'italic';
  reviewText.className = "w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-400/50 min-h-[100px]"


  submitReviewBtn.type = 'submit';
  submitReviewBtn.textContent = 'Spara recension';
  submitReviewBtn.style.color = '#fff';
  submitReviewBtn.style.alignSelf = 'center';
  submitReviewBtn.style.cursor = 'pointer';
  submitReviewBtn.style.marginTop = '15px'
  submitReviewBtn.className = "self-end px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"

  reviewForm.append(nameInput, reviewText, submitReviewBtn);

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(onSubmit) {
      onSubmit(reviewText.value);
    }
  })

  return reviewForm;
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
