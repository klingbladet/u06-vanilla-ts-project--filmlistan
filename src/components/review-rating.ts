export function reviewComponent(): {
  const reviewForm = document.createElement('form');
  const reviewInput = document.createElement('input');
  const submitReviewBtn = document.createElement('button');

  reviewInput.type = 'text';
  reviewInput.placeholder = 'Write your review';
  submitReviewBtn.type = 'submit';

  reviewForm.append(reviewInput, submitReviewBtn)
}

export function ratingComponent() {
  const starsContainer = document.createElement('div');

  for (let i = 1; i <= 10; i++) {
    const starElement = document.createElement('span');
    starElement.textContent = '*';
    starElement.classList.add('star');

    starsContainer.appendChild(starElement);
  }

  let currentRating = 0;
  starsContainer.addEventListener('click', (e) => {
    const clickedElement = e.target;

    if(clickedElement.classList.contains('star')) {
      const ratingValue = parseInt(clickedElement.dataset.value);
      currentRating = ratingValue;

      console.log(`Du valde betyget: ${currentRating}`);
    }
  });
  return starsContainer;

}

