// Non-game related setups
const playerButtonElement = document.querySelector('#board--player_button');
const cardPreviewElement = document.querySelector('.card-preview');
const aiDecisionsElement = document.querySelector('.ai-decisions');

cardPreviewElement.addEventListener('mouseenter', () => handlePreviewToggle());
cardPreviewElement.addEventListener('mouseleave', () => handlePreviewToggle());
aiDecisionsElement.addEventListener('mouseenter', () => handlePreviewToggle(true));
aiDecisionsElement.addEventListener('mouseleave', () => handlePreviewToggle(true));

function createCard(cardObject) {
  const cardElement = document.createElement('article');
  const cardImageElement = document.createElement('img');
  const cardValuesElement = document.createElement('div');

  // Add Attack and Health values to card
  if (cardObject.type === 'monster') {
    const cardAttackValueElement = document.createElement('span');
    cardAttackValueElement.classList.add('card--attack_value');
    const cardHealthValueElement = document.createElement('span');
    cardHealthValueElement.classList.add('card--health_value');
    cardAttackValueElement.textContent = cardObject.value;
    cardHealthValueElement.textContent = cardObject.health;
    cardValuesElement.appendChild(cardAttackValueElement);
    cardValuesElement.appendChild(cardHealthValueElement);
  } else if (cardObject.type === 'spell') {
    const cardAttackValueElement = document.createElement('span');
    cardAttackValueElement.classList.add('card--attack_value');
    cardAttackValueElement.textContent = cardObject.value;
    cardValuesElement.appendChild(cardAttackValueElement);
  } else {
    const cardHealthValueElement = document.createElement('span');
    cardHealthValueElement.classList.add('card--health_value');
    cardHealthValueElement.textContent = cardObject.value;
    cardValuesElement.appendChild(cardHealthValueElement);
  }

  // Add card values to card
  cardValuesElement.classList.add('card_info', 'card_info--values');

  cardImageElement.setAttribute('src', cardObject.image);
  cardImageElement.setAttribute('alt', cardObject.name);
  cardImageElement.classList.add('card_info');

  cardElement.setAttribute('title', cardObject.name);
  cardElement.setAttribute('data-id', cardObject.id);
  Object.assign(cardImageElement.style, { maxWidth: '100%', height: 'auto', borderRadius: '10px' });
  cardElement.appendChild(cardImageElement);
  cardElement.appendChild(cardValuesElement);

  // Preview card
  cardElement.addEventListener('mouseenter', (event) => handleCardPreview(event));
  return cardElement;
}

class FieldZone {
  constructor(type) {
    this.type = type;
    this.deck = [];
    this.hand = [];
    this.graveyard = [];

    // Game State information
    this.cardsOnField = [];
    this.handActiveCard = null;
    this.selectedHealCardElement = null;
    this.selectedOpponentElement = null;
    this.selectedPlayerCardElement = null;
    this.currentPhase = gamePhaseState.draw;
    this.attackArrow = null;
    this.healthValue = 20;
    this.tempHealthValue = this.healthValue;

    this.rippleElement = document.querySelector(`.board--${this.type}_hp`);
    this.field = document.querySelector(`.field-zone[data-id="${type}-side"]`);
    if (this.type === gameValues.player) {
      // Player card field element
      this.cardZone = this.field.querySelectorAll('.card-field');
      this.cardZone.forEach((card) => {
        card.addEventListener('click', this.cardClick.bind(this));
      });
      // Opponent card field element
      this.aiCardZone = document.querySelectorAll('.field-zone[data-id="ai-side"] .card-field');
      this.aiCardZone.forEach((card) => {
        card.addEventListener('click', this.aiCardClick.bind(this));
      });
      // Opponent health element for selection
      this.aiHealthElement = document.querySelector('.board--ai_hp');
      this.aiHealthElement.addEventListener('click', this.aiCardClick.bind(this));

      this.playerHealthElement = document.querySelector('.board--player_hp');
      this.playerHealthElement.addEventListener('click', this.playerHealthClick.bind(this));
    }
  }
  updateHealth(action, value) {
    switch (action) {
      case 'add':
        this.healthValue = Math.max(0, this.healthValue + value);
        this.rippleElement.style.setProperty(
          '--ripple-color',
          this.healthValue > 80 ? '#ff9c9d' : this.healthValue > 50 ? '#de7a7c' : '#910127'
        );
        break;
      case 'subtract':
        this.healthValue = Math.max(0, this.healthValue - value);
        this.rippleElement.style.setProperty(
          '--ripple-color',
          this.healthValue > 80 ? '#ff9c9d' : this.healthValue > 50 ? '#de7a7c' : '#910127'
        );
        break;
      default:
        break;
    }
  }
  // hightlightAvailableSpace() {
  //   this.cardZone.forEach((space) => {
  //     const spaceNumber = space.getAttribute('data-no');
  //     if (space.classList.contains('card-field--available')) {
  //       space.classList.remove('card-field--available');
  //       space.innerText = '';
  //     } else {
  //       space.classList.add('card-field--available');
  //       space.innerText = parseInt(spaceNumber, 10) + 1;
  //     }
  //   });
  // }
  removeHighlight(heal = false) {
    this.field.childNodes.forEach((element) => {
      if (element.nodeName === 'DIV') {
        const placedCard = element.firstChild || element;
        if (placedCard.classList.contains('card-field--highlight' + (heal ? '-heal' : ''))) {
          placedCard.classList.remove('card-field--highlight' + (heal ? '-heal' : ''));
        }
      }
    });
  }

  hightlightCard(card, nonUserInput = false) {
    // Only attack phase is allowed
    if (this.currentPhase !== gamePhaseState.attack && !nonUserInput) return;

    // Highlight card on the player card field
    this.removeHighlight();
    card.classList.toggle('card-field--highlight');
  }
  hightlightHealElement(card) {
    console.log('Highlight heal card', card.dataset.id === this.selectedPlayerCardElement.dataset.id);
    // Only attack phase is allowed
    if (this.currentPhase !== gamePhaseState.attack || card.dataset.id === this.selectedPlayerCardElement.dataset.id)
      return;

    // Highlight card on the player card field
    this.removeHighlight(true);
    card.classList.toggle('card-field--highlight-heal');
  }

  highlightAttackMove(playerCard, opponentCard) {
    if (this.currentPhase === gamePhaseState.end) return;

    if (this.attackArrow) this.attackArrow.remove();
    this.attackArrow = arrowLine(
      { x: getOffset(playerCard).left, y: getOffset(playerCard).top },
      { x: getOffset(opponentCard).left, y: getOffset(opponentCard).top },
      {
        thickness: 3,
        color: 'red',
      }
    );
  }
  // NOTIFIKACIJE -> awesome-notifications - npm
  aiCardClick(e) {
    console.log('Selected', e.srcElement);
    if (this.currentPhase === gamePhaseState.end) return;
    this.selectedOpponentElement = e.srcElement;

    // Player and Opponent Cards are picked
    if (this.selectedPlayerCardElement.nodeName === 'ARTICLE') {
      const selectedCard = this.getSelectedPlayerCardInformation();
      if ((selectedCard && selectedCard.type === gameValues.monster) || selectedCard.type === gameValues.spell) {
        if (this.selectedOpponentElement) {
          this.highlightAttackMove(this.selectedPlayerCardElement, this.selectedOpponentElement);
        }
      }
    }
  }
  playerHealthClick(e) {
    if (this.currentPhase === gamePhaseState.end) return;
    if (this.selectedPlayerCardElement.nodeName === 'ARTICLE') {
      const selectedCard = this.getSelectedPlayerCardInformation();
      if (selectedCard.type === gameValues.heal) {
        this.selectedOpponentElement = e.srcElement;
        this.highlightAttackMove(this.selectedPlayerCardElement, this.selectedOpponentElement);
      }
    }
  }

  getCardInformation(card) {
    return [...gameCards].find((c) => c.id.toString() === card.dataset.id);
  }

  getSelectedPlayerCardInformation() {
    if (this.selectedPlayerCardElement.nodeName === 'ARTICLE') {
      return [...gameCards].find((card) => this.selectedPlayerCardElement.dataset.id === card.id.toString());
    } else {
      return [...gameCards].find((card) => this.selectedPlayerCardElement.firstChild.dataset.id === card.id.toString());
    }
  }
  getSelectedAttackCardInformation() {
    if (this.selectedOpponentElement.nodeName === 'ARTICLE') {
      return [...gameCards].find((card) => this.selectedOpponentElement.dataset.id === card.id.toString());
    } else {
      return [...gameCards].find((card) => this.selectedOpponentElement.firstChild.dataset.id === card.id.toString());
    }
  }
  cardClick(e) {
    if (
      this.currentPhase !== gamePhaseState.attack ||
      (this.selectedPlayerCardElement && this.getSelectedPlayerCardInformation().type === gameValues.spell)
    )
      return;

    const selectedCard = this.getCardInformation(e.srcElement);
    console.log('Selected card', selectedCard);

    const isHealPlayed =
      this.selectedPlayerCardElement && this.getSelectedPlayerCardInformation().type === gameValues.heal;
    if (isHealPlayed) this.hightlightHealElement(e.srcElement);
    else this.hightlightCard(e.srcElement);

    if (e.srcElement.nodeName === 'ARTICLE') {
      if (isHealPlayed) {
        this.selectedHealCardElement = e.srcElement;
        playerButtonElement.innerText = buttonValues.heal;
        return;
      }
      if (selectedCard && selectedCard.type === gameValues.heal) {
        console.log('Heal');
        playerButtonElement.innerText = buttonValues.heal;
        this.selectedPlayerCardElement = e.srcElement;
      } else {
        console.log('Attack');
        playerButtonElement.innerText = buttonValues.attack;
        // ATTACK MONSTER
        this.selectedPlayerCardElement = e.srcElement;
        this.selectedOpponentElement = null;
      }
    }
  }

  updateDeckGraveyard() {
    const deckElement = document.querySelector(`.board--${this.type}_deck`);
    if (deckElement) {
      deckElement.textContent = `${this.deck.length} | ${this.graveyard.length}`;
      deckElement.setAttribute('title', `Deck: ${this.deck.length}\nGraveyard: ${this.graveyard.length}`);
    }
  }

  setGameField() {
    this.deck = [...gameCards].shuffle();
    this.hand = this.deck.splice(0, 5);

    const deckElement = document.querySelector(`.board--${this.type}_deck`);
    if (deckElement) {
      deckElement.textContent = `${this.deck.length} | ${this.graveyard.length}`;
      deckElement.setAttribute('title', `Deck: ${this.deck.length}\nGraveyard: ${this.graveyard.length}`);
    }
  }
  updateHand() {
    const handField = document.querySelector(`.hand-zone[data-side="${this.type}"]`);
    handField.innerHTML = '';
    this.hand.forEach((card, index) => {
      const cardElement = createCard(card);
      cardElement.setAttribute('data-no', index);
      if (this.type === gameValues.player)
        cardElement.addEventListener('click', this.togglePlayerCardActive.bind(this));
      cardElement.classList.add('hand-zone--card');
      handField.appendChild(cardElement);
    });
  }

  togglePlayerCardActive(e) {
    const handField = document.querySelector(`.hand-zone[data-side="player"]`);
    const cardNumber = e.srcElement.getAttribute('data-no');
    console.log(e.srcElement);

    handField.childNodes.forEach((card) => {
      if (card.classList.contains('hand-zone--card_active') && cardNumber !== card.getAttribute('data-no')) {
        card.classList.remove('hand-zone--card_active');
      }
      e.srcElement.classList.toggle('hand-zone--card_active');

      if (e.srcElement.classList.contains('hand-zone--card_active')) {
        this.handActiveCard = cardNumber;
        // this.playHand(); // TODO nakon klika igra
      }
    });
  }

  drawCard() {
    this.hand = [...this.hand, this.deck.pop()];
    console.log(this.type, 'drawCard', this.hand);
    const deckElement = document.querySelector(`.board--${this.type}_deck`);
    if (deckElement) {
      deckElement.textContent = `${this.deck.length} | ${this.graveyard.length}`;
      deckElement.setAttribute('title', `Deck: ${this.deck.length}\nGraveyard: ${this.graveyard.length}`);
    }
    this.updateHand();
  }

  updateField() {
    this.field.querySelectorAll('.card-field').forEach((field) => {
      field.innerHTML = '';
    });
    this.cardsOnField.forEach((cardObject, index) => {
      const cardElement = createCard(cardObject);
      cardElement.classList.add('hand-zone--card');
      const cardZoneElement = this.field.querySelector(`.card-field[data-no="${index}"]`);
      cardZoneElement.appendChild(cardElement);
    });
  }

  playCardOnField(cardObject) {
    this.cardsOnField = JSON.parse(JSON.stringify([...this.cardsOnField, cardObject]));
    const cardElement = createCard(cardObject);
    cardElement.classList.add('hand-zone--card');

    const cardZoneElement = this.field.querySelector(`.card-field[data-no="${this.cardsOnField.length - 1}"]`);
    cardZoneElement.appendChild(cardElement);

    if (cardObject.type === gameValues.spell) {
      this.selectedPlayerCardElement = cardElement;
      this.hightlightCard(cardElement, true);
    } else if (cardObject.type === gameValues.heal) {
      this.selectedPlayerCardElement = cardElement;
      this.hightlightCard(cardElement, true);
    }
  }
  reloadDeckFromGraveyard() {
    if (this.graveyard.length === 0) return;
    this.deck = [...this.deck, ...this.graveyard];
    this.deck.shuffle();
    this.graveyard = [];
  }

  // AI FUNCTIONS
  chooseCardFromHand() {
    const randomCard = this.hand[Math.floor(Math.random() * this.hand.length)]; // TODO MINIMAX
    this.hand.splice(this.hand.indexOf(randomCard), 1);

    return randomCard;
  }
}

class Game {
  constructor() {
    this.playerField = new FieldZone(gameValues.player);
    this.aiField = new FieldZone(gameValues.ai);
    this.currentPlayer = gameValues.player;
    this.currentStage = gamePhaseState.draw;
    this.roundNumber = 0;

    this.aiHealthElement = document.querySelector('.board--ai_hp');
    this.playerHealthElement = document.querySelector('.board--player_hp');
    this.aiDecisionsConsole = document.querySelector('#console');

    playerButtonElement.addEventListener('click', () => this.playHand());
  }
  initialize() {
    this.playerField.setGameField();
    this.currentPlayer = gameValues.player;
    this.getCurrentField().updateHand();
    this.aiField.setGameField();
    this.currentPlayer = gameValues.ai;
    this.getCurrentField().updateHand();

    // Set health
    this.aiHealthElement.firstChild.textContent = this.aiField.healthValue;
    this.playerHealthElement.firstChild.textContent = this.playerField.healthValue;

    this.currentPlayer = gameValues.player;
  }
  getCurrentField() {
    if (this.currentPlayer === gameValues.player) return this.playerField;
    return this.aiField;
  }
  getOpponentField() {
    if (this.currentPlayer === gameValues.player) return this.aiField;
    return this.playerField;
  }
  changeCurrentPlayer() {
    if (this.currentPlayer === gameValues.player) {
      this.currentPlayer = gameValues.ai;
    } else {
      this.currentPlayer = gameValues.player;
    }
  }
  async playHand() {
    if (this.getCurrentField().currentPhase === gamePhaseState.draw && this.getCurrentField().handActiveCard !== null) {
      const selectedCard = this.getCurrentField().hand[this.getCurrentField().handActiveCard];
      this.getCurrentField().hand.splice(this.getCurrentField().handActiveCard, 1);
      this.getCurrentField().updateHand();
      this.getCurrentField().playCardOnField(selectedCard);

      // Start second phase
      if (selectedCard.type === gameValues.heal) playerButtonElement.innerText = buttonValues.heal;
      else playerButtonElement.innerText = buttonValues.attack;
      this.currentStage = gamePhaseState.attack;
      this.getCurrentField().currentPhase = this.currentStage;
    } else if (this.getCurrentField().currentPhase === gamePhaseState.attack) {
      // Attack phase
      if (
        this.getCurrentField().selectedPlayerCardElement &&
        (this.getCurrentField().selectedOpponentElement || this.getCurrentField().selectedHealCardElement)
      ) {
        // Check if the selected card is a monster
        switch (this.getCurrentField().getSelectedPlayerCardInformation().type) {
          case gameValues.monster:
            console.log(
              'Monster attack log',
              JSON.parse(JSON.stringify(this.getCurrentField().getSelectedPlayerCardInformation()))
            );
            // Attacking health
            if (this.getCurrentField().selectedOpponentElement.dataset.id === 'hp') {
              this.handleHealthAttack();
            } else {
              // Attacking a monster card
              this.handleMonsterAttack();
            }
            break;
          case gameValues.spell:
            if (this.getCurrentField().selectedOpponentElement.dataset.id === 'hp') {
              this.handleHealthAttack();
            } else {
              this.handleSpellAttack();
            }
            break;
          case gameValues.heal:
            if (this.getCurrentField().selectedOpponentElement.dataset.id === 'hp') {
              this.getCurrentField().updateHealth(
                'add',
                this.getCurrentField().getSelectedPlayerCardInformation().value
              );
              this.aiHealthElement.firstChild.textContent = this.aiField.healthValue;
              this.playerHealthElement.firstChild.textContent = this.playerField.healthValue;
            } else {
              const playerCard = this.getCurrentField().getSelectedPlayerCardInformation();
              const cardToHeal = this.getCurrentField().getCardInformation(
                this.getCurrentField().selectedHealCardElement
              );
              const healCardIndex = this.getCurrentField().cardsOnField.findIndex((obj) => obj.id === cardToHeal.id);
              this.getCurrentField().cardsOnField[healCardIndex].health += playerCard.value;
              this.getCurrentField().updateField();
            }
            // Remove heal card from field
            this.getCurrentField().cardsOnField.splice(
              this.getCurrentField().cardsOnField.indexOf(this.getCurrentField().getSelectedPlayerCardInformation()),
              1
            );
            this.getCurrentField().updateField();
            break;
          default:
            console.log('Handle default');
            break;
        }

        // Update game state TODO function
        if (this.getCurrentField().deck.length === 0) this.getCurrentField().reloadDeckFromGraveyard();
        if (this.getCurrentField().attackArrow) this.getCurrentField().attackArrow.remove();
        this.currentStage = gamePhaseState.end;
        this.getCurrentField().removeHighlight();
        this.getCurrentField().attackArrow = null;
        this.getCurrentField().currentPhase = this.currentStage;
        this.getCurrentField().selectedPlayerCardElement = null;
        this.getCurrentField().selectedOpponentElement = null;
        this.getCurrentField().handActiveCard = null;
        if (this.currentPlayer === gameValues.player) playerButtonElement.innerText = buttonValues.endRound;
      }
    } else if (this.getCurrentField().currentPhase === gamePhaseState.end) {
      // this.currentStage = gamePhaseState.draw;
      // this.getCurrentField().currentPhase = this.currentStage;
      // playerButtonElement.innerText = buttonValues.draw;
      playerButtonElement.disabled = true;
      playerButtonElement.innerText = buttonValues.opponentRound;
      this.changeCurrentPlayer();
      await this.runAI();
    }
  }

  handleHealthAttack() {
    const playerCard = this.getCurrentField().getSelectedPlayerCardInformation();
    console.log('Health is directly targeted', playerCard);
    this.getOpponentField().updateHealth('subtract', playerCard.value);
    this.aiHealthElement.firstChild.textContent = this.aiField.healthValue;
    this.playerHealthElement.firstChild.textContent = this.playerField.healthValue;

    if (playerCard.type === gameValues.spell) {
      // Remove card after attacking
      const playerCardIndex = this.getCurrentField().cardsOnField.findIndex((obj) => obj.id === playerCard.id);
      this.getCurrentField().cardsOnField.splice(playerCardIndex, 1);
      this.getCurrentField().updateDeckGraveyard();
      this.getCurrentField().updateField();
    }
  }

  handleMonsterAttack() {
    console.log('Monster is targeted', this.getCurrentField().getSelectedAttackCardInformation());
    // Get cards information (deep copy)
    const playerCard = JSON.parse(JSON.stringify(this.getCurrentField().getSelectedPlayerCardInformation()));
    const opponentCard = JSON.parse(JSON.stringify(this.getCurrentField().getSelectedAttackCardInformation()));
    console.log('Attacking cards', playerCard, opponentCard);
    const playerCardIndex = this.getCurrentField().cardsOnField.findIndex((obj) => obj.id === playerCard.id);
    const opponentCardIndex = this.getOpponentField().cardsOnField.findIndex((obj) => obj.id === opponentCard.id);
    // Upate hp values
    this.getCurrentField().cardsOnField[playerCardIndex].health -= opponentCard.value;
    this.getOpponentField().cardsOnField[opponentCardIndex].health -= playerCard.value;

    if (this.getCurrentField().cardsOnField[playerCardIndex].health <= 0) {
      this.getCurrentField().cardsOnField.splice(playerCardIndex, 1);
      // Reset hp
      playerCard.health = playerCard.value;
      this.getCurrentField().graveyard.push(playerCard);
      this.getCurrentField().updateDeckGraveyard();
    }
    if (this.getOpponentField().cardsOnField[opponentCardIndex].health <= 0) {
      this.getOpponentField().cardsOnField.splice(opponentCardIndex, 1);
      // Reset hp
      opponentCard.health = opponentCard.value;
      this.getOpponentField().graveyard.push(opponentCard);
      this.getOpponentField().updateDeckGraveyard();
    }
    this.getCurrentField().updateField();
    this.getOpponentField().updateField();
  }

  handleSpellAttack() {
    const playerCard = this.getCurrentField().getSelectedPlayerCardInformation();
    const opponentCard = this.getCurrentField().getSelectedAttackCardInformation();
    const opponentCardIndex = this.getOpponentField().cardsOnField.findIndex((obj) => obj.id === opponentCard.id);
    const playerCardIndex = this.getCurrentField().cardsOnField.findIndex((obj) => obj.id === playerCard.id);
    this.getOpponentField().cardsOnField[opponentCardIndex].health -= playerCard.value;
    this.getCurrentField().cardsOnField.splice(playerCardIndex, 1);
    this.getCurrentField().graveyard.push(playerCard);
    if (this.getOpponentField().cardsOnField[opponentCardIndex].health <= 0) {
      this.getOpponentField().cardsOnField.splice(opponentCardIndex, 1);
      // Reset hp
      opponentCard.health = opponentCard.value;
      this.getOpponentField().graveyard.push(opponentCard);
      this.getOpponentField().updateDeckGraveyard();
    }
    this.getCurrentField().updateDeckGraveyard();
    this.getCurrentField().updateField();
    this.getOpponentField().updateField();
  }

  // AI Functions
  chooseAIFieldCard() {
    const pickedCardIndex = Math.floor(Math.random() * this.aiField.cardsOnField.length);
    this.aiField.selectedPlayerCardElement = this.aiField.field.querySelector(
      `.card-field[data-no="${pickedCardIndex}"]`
    );
  }
  chooseAttackTarget(pickedCard, attackTarget) {
    const currentPlayerField = this.getCurrentField();
    const playerFieldCards = this.getOpponentField().cardsOnField;
    console.log('Attacking', pickedCard, attackTarget);

    // Attack health
    if (!attackTarget) {
      if (pickedCard.type === gameValues.heal && currentPlayerField.cardsOnField.length === 1) {
        console.log('No cards on field', currentPlayerField);
        this.aiField.selectedOpponentElement = this.getOpponentField().aiHealthElement;
        return;
      } else if (pickedCard.type !== gameValues.heal && playerFieldCards.length === 1) {
        this.aiField.selectedOpponentElement = this.getOpponentField().playerHealthElement;
        return;
      }
    }

    const pickedPlayerCardIndex = attackTarget
      ? playerFieldCards.findIndex((playerCard) => attackTarget.id === playerCard.id)
      : Math.floor(Math.random() * (playerFieldCards.length + 1));
    if (pickedPlayerCardIndex < playerFieldCards.length) {
      this.aiField.selectedOpponentElement = this.playerField.field.querySelector(
        `.card-field[data-no="${pickedPlayerCardIndex}"]`
      );
    } else this.aiField.selectedOpponentElement = this.playerHealthElement;
  }
  async runAI() {
    console.log('Round', this.roundNumber);
    if (this.currentPlayer !== gameValues.ai) return;
    if (this.roundNumber > 0) {
      this.getCurrentField().drawCard();
    }
    // Play Card From Hand
    await sleep(1000);
    //const pickedCard = this.getCurrentField().chooseCardFromHand();
    const [pickedCard, pickedMove] = this.chooseCardUsingExpectiminimax();
    this.getCurrentField().updateHand();
    this.aiField.playCardOnField(pickedCard);
    await sleep(1000);
    this.currentStage = gamePhaseState.attack;
    this.getCurrentField().currentPhase = this.currentStage;
    // Decide Attack Pattern and Play
    await sleep(1000);
    this.chooseAIFieldCard();
    this.chooseAttackTarget(pickedCard, pickedMove);
    this.aiField.highlightAttackMove(this.aiField.selectedPlayerCardElement, this.aiField.selectedOpponentElement);
    await sleep(1000);
    this.playHand();
    // End Round
    this.currentStage = gamePhaseState.end;
    this.getCurrentField().currentPhase = this.currentStage;
    await sleep(1000);
    this.roundNumber++;
    this.changeCurrentPlayer();

    // Setup player round
    playerButtonElement.disabled = false;
    playerButtonElement.innerText = buttonValues.startRound;
    this.currentStage = gamePhaseState.draw;
    this.getCurrentField().currentPhase = this.currentStage;
    this.getCurrentField().drawCard();
    this.playHand();
  }

  // Expectiminimax Algorithm
  chooseCardUsingExpectiminimax() {
    // AI Maximizes the score of the best possible move
    let bestScore = -Infinity;
    let bestCard = null;
    let bestMove = null;

    const availableMinCards = [...this.getOpponentField().hand, ...this.getOpponentField().deck];

    this.getCurrentField().hand.forEach((card, index) => {
      console.log('Checking card', card.name);
      this.getCurrentField().hand.splice(index, 1); // Remove card
      this.getCurrentField().cardsOnField.push(card); // Add card to field

      const availableMaxCards = [...this.getCurrentField().hand, ...this.getCurrentField().deck];
      let [score, move] = this.expectiminimax(availableMaxCards, availableMinCards, false, 3);

      this.getCurrentField().hand.splice(index, 0, card); // Insert back card
      this.getCurrentField().cardsOnField.splice(this.getCurrentField().cardsOnField.length - 1, 1); // Remove card from field

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
        bestMove = move;
      }
    });

    console.log('Best card', bestCard, 'with score', bestScore, 'and move', bestMove);
    const listItem = document.createElement('li');
    listItem.innerText = `Best card: ${bestCard.name} with score: ${bestScore} and move: ${bestMove?.name || 'HP'}`;
    this.aiDecisionsConsole.appendChild(listItem);

    this.getCurrentField().hand.splice(this.getCurrentField().hand.indexOf(bestCard), 1);
    return [bestCard, bestMove];
  }

  expectiminimax(availableMaxCards, availableMinCards, isMaxPlayer, depthLimit) {
    let scores = {
      [gameValues.ai]: 50,
      [gameValues.player]: -50,
    };

    // Terminal state
    const [result, bestMove, heuristicResult, heuristicMove] = this.calculateWinner(isMaxPlayer);
    if (bestMove !== null || depthLimit === 0) {
      return [scores[result] || heuristicResult, bestMove || heuristicMove];
    }

    if (isMaxPlayer) {
      let bestScore = -Infinity;
      let bestCard = null;
      let bestMove = null;
      availableMaxCards.forEach((maxCard, index) => {
        availableMaxCards.splice(index, 1); // Remove card
        this.getCurrentField().cardsOnField.push(maxCard); // Add card to field
        let [score, move] = this.expectiminimax(availableMaxCards, availableMinCards, false, depthLimit - 1);
        availableMaxCards.splice(index, 0, maxCard); // Insert back card
        this.getCurrentField().cardsOnField.splice(this.getCurrentField().cardsOnField.length - 1, 1); // Remove card from field
        // Chance node
        score *= this.checkProbability(maxCard, availableMaxCards);
        if (score > bestScore) {
          bestScore = score;
          bestCard = maxCard;
          bestMove = move;
        }
      });
      return [bestScore, bestMove, bestCard];
    } else {
      let bestScore = Infinity;
      let bestCard = null;
      let bestMove = null;
      availableMinCards.forEach((minCard, index) => {
        availableMinCards.splice(index, 1); // Remove card
        this.getOpponentField().cardsOnField.push(minCard); // Add card to field
        let [score, move] = this.expectiminimax(availableMaxCards, availableMinCards, true, depthLimit - 1);
        availableMinCards.splice(index, 0, minCard); // Insert back card
        this.getOpponentField().cardsOnField.splice(this.getOpponentField().cardsOnField.length - 1, 1); // Remove card from field
        // Chance node
        score *= this.checkProbability(minCard, availableMinCards);
        if (score < bestScore) {
          bestScore = score;
          bestCard = minCard;
          bestMove = move;
        }
      });
      return [bestScore, bestMove, bestCard];
    }
  }

  resetTempValues = () => {
    const playerOneField = this.getCurrentField();
    const playerTwoField = this.getOpponentField();

    playerOneField.tempHealthValue = playerOneField.healthValue;
    playerTwoField.tempHealthValue = playerTwoField.healthValue;

    playerOneField.cardsOnField.map((card) => (card.defeated = card.type === gameValues.monster ? false : null));
    playerTwoField.cardsOnField.map((card) => (card.defeated = card.type === gameValues.monster ? false : null));
    playerOneField.cardsOnField.map(
      (card) => (card.tempHealth = card.type === gameValues.monster ? card.health : null)
    );
    playerTwoField.cardsOnField.map(
      (card) => (card.tempHealth = card.type === gameValues.monster ? card.health : null)
    );
  };

  checkProbability = (card, availableCards) => {
    const probabilities = {
      [gameValues.monster]:
        availableCards.reduce((acc, cur) => acc + (cur.type === gameValues.monster ? 1 : 0), 0) / availableCards.length,
      [gameValues.spell]:
        availableCards.reduce((acc, cur) => acc + (cur.type === gameValues.spell ? 1 : 0), 0) / availableCards.length,
      [gameValues.heal]:
        availableCards.reduce((acc, cur) => acc + (cur.type === gameValues.heal ? 1 : 0), 0) / availableCards.length,
    };
    const probability = probabilities[card.type];
    return probability;
  };

  calculateWinner = (maxPlayer) => {
    const currentPlayerField = maxPlayer ? this.getCurrentField() : this.getOpponentField();
    const opponentPlayerField = maxPlayer ? this.getOpponentField() : this.getCurrentField();

    let heuristicMove = null;
    let heuristicResult = 0;

    currentPlayerField.cardsOnField.forEach((card) => {
      const { bestScore, bestMove } = this.calculateScore(card, currentPlayerField, opponentPlayerField);
      if (bestScore > heuristicResult) {
        heuristicResult = bestScore;
        heuristicMove = bestMove;
      }

      if (bestMove.type === gameValues.monster)
        bestMove.defeated = card.value >= (bestMove.tempHealth || bestMove.health);

      if (
        card.type !== gameValues.heal &&
        (opponentPlayerField.cardsOnField.every(
          (opponentCard) => opponentCard.defeated || opponentCard.tempHealth <= 0
        ) ||
          opponentPlayerField.cardsOnField.length === 0)
      ) {
        // console.log('Usao', card, opponentPlayerField);
        if (card.value >= opponentPlayerField.tempHealthValue) {
          this.resetTempValues();
          console.log(currentPlayerField.type, 'won');
          return [currentPlayerField.type, opponentPlayerField, null, null];
        } else {
          opponentPlayerField.tempHealthValue = Math.max(0, opponentPlayerField.tempHealthValue - card.value);
          // console.log('Nije prosao', opponentPlayerField);
        }
      }
    });
    return [null, null, heuristicResult, heuristicMove];
  };

  calculateScore = (card, playerField, opponentField) => {
    let score = 0;
    let bestScore = 0;
    let move = null;
    let bestMove = null;

    // Only do attacks if the card is chosen
    const tempPlayerField = JSON.parse(JSON.stringify(playerField));
    const tempOpponentField = JSON.parse(JSON.stringify(opponentField));

    // Check if player card can win and survive
    if (card.type === gameValues.monster || card.type === gameValues.spell) {
      const checkOpponentField = tempOpponentField.cardsOnField.every(
        (opponentCard) =>
          opponentCard.defeated || opponentCard.tempHealth <= 0 || opponentCard.type !== gameValues.monster
      );

      if (tempOpponentField.cardsOnField.length === 0 || checkOpponentField) {
        bestMove = opponentField;
        bestScore = (card.value / 12) * cardTypeValues[card.type];
        console.log('USAO OVDJE', bestScore, bestMove);
        return { bestScore, bestMove };
      }

      tempOpponentField.cardsOnField.forEach((opponentCard) => {
        // If player card is stronger than opponent card
        if (opponentCard.type === gameValues.monster) {
          if (opponentCard.tempHealth <= 0 || opponentCard.health <= 0 || opponentCard.defeated) return;
          score += card.value >= (opponentCard.tempHealth || opponentCard.health) ? 3 : 1;
          if (card.type === gameValues.spell) score += (card.tempHealth || card.health) <= opponentCard.value ? -2 : 1;
          move = opponentCard;
        }
        console.log(card, score, bestScore);
        if (score > bestScore) {
          // Remove previous defeated and set current
          if (bestMove) {
            bestMove.defeated = false;
            bestMove.tempHealth = bestMove.health;
          }
          move.defeated = card.value >= (opponentCard.tempHealth || opponentCard.health);
          bestMove = move;

          if (move.type === gameValues.monster) move.tempHealth = Math.max(0, opponentCard.tempHealth - card.value);
          bestScore = score;
        }
        // Reset values
        score = 0;
        move = null;
      });
    } else {
      // Heal the highest damage monster
      bestMove = tempPlayerField.cardsOnField.length
        ? tempPlayerField.cardsOnField.reduce(
            (prev, current) => (prev.health > current.picked && current.health ? prev : current),
            {
              health: 0,
              value: 0,
            }
          )
        : tempPlayerField;
      bestMove = bestMove.health ? bestMove : tempPlayerField;
      if (bestMove === tempPlayerField) {
        bestMove.tempHealthValue = bestMove.tempHealthValue + card.value;
      } else {
        bestMove.tempHealth = bestMove.health + card.value;
      }
      // Calculate score
      bestScore = +((bestMove.value || 1) / 6).toFixed(2) * cardTypeValues[card.type];
    }
    console.log('SCORE', card, bestScore, bestMove, playerField, opponentField);
    return { bestScore, bestMove };
  };
}
