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
