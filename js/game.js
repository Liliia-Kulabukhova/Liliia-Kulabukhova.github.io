const _table = document.getElementById('table');
const _tableCell = document.getElementById('tableCell');
const _tableCellImage = document.getElementById('tableCellImage');

const _horizontalSumContainer = document.getElementById('horizontalSums');
const _horizontalSum = document.getElementById('horizontalSum');

const _verticalSumContainer = document.getElementById('verticalSums');
const _verticalSum = document.getElementById('verticalSum');

const _answersPictureContainer = document.getElementById('answersPictures');
const _answersPicture = document.getElementById('answersPicture');

const _answersSignContainer = document.getElementById('answersSigns');
const _answersSign = document.getElementById('answersSign');

const _answersInputContainer = document.getElementById('answersInputs');
const _answersInput = document.getElementById('answersInput');

function renderTable(settings, horizontalSumItems, verticalSumItems) {
    _table.style.gridTemplateColumns = `repeat(${settings.size}, 48px)`;
    _table.style.gridTemplateRows = `repeat(${settings.size}, 48px)`;

    renderList(
        items.flat(),
        _table,
        _tableCell,
        (item, element) => _updateTableCell(item, element),

    )

    renderList(
        horizontalSumItems,
        _horizontalSumContainer,
        _horizontalSum,
        (item, element) => _updateSum(item, element),

    )

    renderList(
        verticalSumItems,
        _verticalSumContainer,
        _verticalSum,
        (item, element) => _updateSum(item, element),

    )

    renderList(
        settings.uniqueItems,
        _answersPictureContainer,
        _answersPicture,
        (item, element) => _updateTableCell(item, element),

    )

    renderList(
        settings.uniqueItems,
        _answersSignContainer,
        _answersSign,
    )

    renderList(
        settings.uniqueItems,
        _answersInputContainer,
        _answersInput,
        (item, element) => _updateAnswerInput(item, element),

    )
}

function checkAnswers() {
    const answers = Array.from(_answersInputContainer.querySelectorAll('input'))
        .map(input => input.value);

    answers.forEach((answer, index) => {
        _answersInputContainer.children[index].disabled = true;

        if (Number(answer) === settings.uniqueItems[index].number) {
            _answersInputContainer.children[index].classList.add('puzzle-board__answer-cell--correct');

            return;
        }

        _answersInputContainer.children[index].classList.add('puzzle-board__answer-cell--invalid');
    });
}
document.getElementById('check').addEventListener('click', () => {
  // невелика затримка, щоб класи --correct/--invalid встигли проставитися
  setTimeout(() => {
    const answerCells = document.querySelectorAll('.puzzle-board__answer-cell');
    const allCorrect  = Array.from(answerCells).every(cell =>
      cell.classList.contains('puzzle-board__answer-cell--correct')
    );
    const checkButton   = document.getElementById('check');
    const restartButton = document.querySelector('button[onclick="restart()"]');

    // прибираємо попередні стани
    checkButton.classList.remove('correct', 'wrong');

    // ↓— знімаємо зелений бордер із кружка, якщо він був
    if (restartButton) {
      restartButton.style.border       = '';
      restartButton.style.borderRadius = '';
    }

    if (allCorrect) {
      checkButton.classList.add('correct');
      checkButton.textContent = 'Правильно';
    } else {
      checkButton.classList.add('wrong');
      checkButton.textContent = 'Перерахуйте значення виділені червоним';

      // ↓— додаємо зелений бордер кружку «refresh»
      if (restartButton) {
        restartButton.style.border       = '2px solid #A3D76E';
        restartButton.style.borderRadius = '50%';
      }
    }
  }, 0);
});

// Функція для повернення кнопки «Перевірити» до початкового вигляду
function resetCheckButton() {
  const checkButton   = document.getElementById('check');
  const restartButton = document.querySelector('button[onclick="restart()"]');

  // прибираємо стани «вірно» / «не вірно»
  checkButton.classList.remove('correct', 'wrong');
  // відновлюємо текст
  checkButton.textContent = 'Перевірити';

  // ↓— й знімаємо зелений бордер із кружка при ресеті
  if (restartButton) {
    restartButton.style.border       = '';
    restartButton.style.borderRadius = '';
  }
}

// Після кліку на «Створити» повертаємо позицію кнопки у стартовий стан
document.getElementById('generate')
  .addEventListener('click', resetCheckButton);

// Після кліку на «refresh» (колесо) також ресетуємо кнопку
document.querySelector('button[onclick="restart()"]')
  .addEventListener('click', resetCheckButton);

/*document.getElementById('check').addEventListener('click', () => {
  // невелика затримка, щоб класи --correct/--invalid встигли проставитися
  setTimeout(() => {
    const answerCells = document.querySelectorAll('.puzzle-board__answer-cell');
    const allCorrect = Array.from(answerCells).every(cell =>
      cell.classList.contains('puzzle-board__answer-cell--correct')
    );
    const checkButton = document.getElementById('check');

    // прибираємо попередні стани
    checkButton.classList.remove('correct', 'wrong');
    
    if (allCorrect) {
      checkButton.classList.add('correct');
      checkButton.textContent = 'Правильно';
    } else {
      checkButton.classList.add('wrong');
      checkButton.textContent = 'Перерахуйте значення виділені червоним';
    }
  }, 0);
});

// Функція для повернення кнопки «Перевірити» до початкового вигляду
function resetCheckButton() {
  const checkButton = document.getElementById('check');
  // прибираємо стани «вірно» / «не вірно»
  checkButton.classList.remove('correct', 'wrong');
  // відновлюємо текст
  checkButton.textContent = 'Перевірити';
}

// Після кліку на «Створити» повертаємо позицію кнопки у стартовий стан
document.getElementById('generate')
  .addEventListener('click', resetCheckButton);  // Створити :contentReference[oaicite:0]{index=0}

// Після кліку на «refresh» (колесо) також ресетуємо кнопку
document.querySelector('button[onclick="restart()"]')
  .addEventListener('click', resetCheckButton);  // Перезапуск :contentReference[oaicite:1]{index=1}
*/

function restart() {
    renderTable(
        settings,
        getHorizontalSumItems(items),
        getVerticalSumItems(items)
    );
}

function _updateTableCell(item, element) {
    element.innerHTML = '';

    if (!item.imageNumber && !item.letter) {

        return;
    }

    if (item.letter) {
        element.innerHTML = item.letter.toUpperCase();

        return;
    }

    const image = _tableCellImage.cloneNode(true);
    updateImageSrc(image, settings.imageType, item.imageNumber);
    element.appendChild(image);
}

function _updateSum(item, element) {
    element.innerHTML = item;
}

function _updateAnswerInput(item, element) {
    if (!item.number) {
        element.disabled = true;

        return;
    }

    element.disabled = false;
}