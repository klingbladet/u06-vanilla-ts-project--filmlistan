export function reviewComponent() {
  const reviewForm = document.createElement('form');
  const nameInput = document.createElement('input')
  const reviewText = document.createElement('textarea');
  const submitReviewBtn = document.createElement('button');

  nameInput.type = 'text'
  nameInput.placeholder = 'Your name'
  nameInput.style.marginBottom = '15px'
  reviewForm.style.display = 'flex';
  reviewForm.style.flexDirection = 'column'
  reviewForm.style.justifyContent = 'space-between'
  reviewForm.style.marginTop = '10px'
  reviewText.placeholder = 'Write your review';
  submitReviewBtn.type = 'submit';
  submitReviewBtn.textContent = 'Submit';
  submitReviewBtn.style.backgroundColor = 'gray';
  submitReviewBtn.style.color = '#fff';
  submitReviewBtn.style.alignSelf = 'center';
  submitReviewBtn.style.cursor = 'pointer';
  submitReviewBtn.style.borderRadius = '10px';
  submitReviewBtn.style.padding = '1px';
  submitReviewBtn.style.width = '70px';
  submitReviewBtn.style.marginTop = '15px'

  reviewForm.append(nameInput, reviewText, submitReviewBtn);
  return reviewForm;
  
}

export function ratingComponent() {
  const ratingWrapper = document.createElement('div');
  const starsContainer = document.createElement('div');
  const scoreText = document.createElement('p');
  const scoreNumber = document.createElement('p')
  ratingWrapper.style.display = 'flex';
  ratingWrapper.style.alignItems = 'center';
  ratingWrapper.style.flexDirection = 'column';
  ratingWrapper.style.gap = '5';

  scoreText.textContent = 'Your score';
  scoreNumber.textContent = '';
  starsContainer.style.display = 'inline-block';


  for (let i = 1; i <= 10; i++) {
    const starElement = document.createElement('span');
    starElement.textContent = '★';
    starElement.classList.add('star');
    starElement.style.cursor = 'pointer';
    starElement.style.color = 'gray';
    starElement.dataset.value = i.toString();

    starsContainer.append(starElement);
  }

  let currentRating = 0;
  starsContainer.addEventListener('click', (e) => {
    const clickedElement = e.target;
    if (clickedElement instanceof HTMLElement && clickedElement.classList.contains('star')) {
      const ratingValue = parseInt(clickedElement.dataset.value as string);
      currentRating = ratingValue;

      // Visuell feedback
      Array.from(starsContainer.children).forEach((child, index) => {
        if (child instanceof HTMLElement) {
          child.style.color = index < currentRating ? 'gold' : 'gray';
        }
      });
      console.log(`Du valde betyget: ${currentRating}`);
    }
    scoreNumber.textContent = `${currentRating}` // Visa stjärnorna i form av siffra
  });

  ratingWrapper.append(scoreText, starsContainer, scoreNumber)

  return ratingWrapper
}

