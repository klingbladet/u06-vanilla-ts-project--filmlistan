export function reviewComponent() {
  const reviewForm = document.createElement('form');
  const reviewInput = document.createElement('input');
  const submitReviewBtn = document.createElement('button');

  reviewInput.type = 'text';
  reviewInput.placeholder = 'Write your review';
  submitReviewBtn.type = 'submit';

  reviewForm.append(reviewInput, submitReviewBtn)
}