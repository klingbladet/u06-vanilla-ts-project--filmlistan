export function reviewComponent() {
  const reviewForm = document.createElement('form');
  const reviewInput = document.createElement('input');
  const submitReviewBtn = document.createElement('button');

  reviewInput.type = 'text';
  reviewInput.placeholder = 'Write your review';
  submitReviewBtn.type = 'submit';

  reviewForm.append(reviewInput, submitReviewBtn);
  return reviewForm;
}

export function ratingComponent() {
  const starsContainer = document.createElement('div');
  const scoreText = document.createElement('p');
  const scoreNumber = document.createElement('p')
  scoreText.textContent = 'Your score'
  starsContainer.style.display = 'inline-block';

  starsContainer.className = 'flex col'


  for (let i = 1; i <= 10; i++) {
    const starElement = document.createElement('span');
    starElement.textContent = '★';
    starElement.classList.add('star');
    starElement.style.cursor = 'pointer';
    starElement.style.color = 'gray';
    starElement.dataset.value = i.toString();

    starsContainer.append(starElement, scoreNumber);
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
    scoreNumber.textContent = `${currentRating}` // show the number of stars as a number
  });

  return starsContainer;
}

