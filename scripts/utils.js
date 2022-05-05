Array.prototype.shuffle = function () {
  var i = this.length,
    j,
    temp;
  if (i == 0) return this;
  while (--i) {
    j = Math.floor(Math.random() * (i + 1));
    temp = this[i];
    this[i] = this[j];
    this[j] = temp;
  }
  return this;
};

function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: (rect.left + window.scrollX + rect.right) / 2,
    top: (rect.top + window.scrollY + rect.bottom) / 2,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function handleCardPreview(event) {
  const hoveredElement = event.srcElement;
  if (!hoveredElement) return;

  const cardPreview = document.querySelector('.card-preview');
  const hoveredCard = gameCards.find((card) => card.id.toString() === hoveredElement.dataset.id);
  cardPreview.style.backgroundImage = `url(images/${hoveredCard.imageName}.jpg)`;
}

function handlePreviewToggle() {
  const cardPreview = document.querySelector('.card-preview');
  cardPreview.classList.toggle('hidden');
}
