const _MEDIUM_COMPLEXITY_BASE_ITEMS_QUANTITY = 2;
const _HARD_COMPLEXITY_BASE_ITEMS_QUANTITY = 3;

let settings = {
    uniqueItems: [],
    imageType: '',
    complexity: 0,
    size: 5,
    letters: [],
};
// позначимо як null, щоб значення 0 було валідним
let _emptyItem = {
    imageNumber: null,
    letter: '',
    number: null,
};

let items = [
    [
        {..._emptyItem },
    ],
];

window.onload = _onInit

function start() {
    settings = _getUpdatedSettings(settings);
    items = _getUpdatedItems(settings);

    renderTable(
        settings,
        getHorizontalSumItems(items),
        getVerticalSumItems(items)
    );
}

function _onInit() {
    toggleFullscreenHandler();
    start();
}

function _getUpdatedSettings(settings) {
    if (!settings.uniqueItems.length) {
        const emptyUniqueItems = new Array(Number(settings.size)).fill(0).map(() => _emptyItem);

        return { ...settings, uniqueItems: emptyUniqueItems };
    }

    return { ...settings, uniqueItems: _getUniqueItems(settings) };
}

function _getUpdatedItems(settings) {
    if (items.length === 1) {
        return [..._getEmptyItems()];
    }

    return [..._getItems(settings)];
}

function _getEmptyItems() {
    return new Array(Number(settings.size)).fill(
            new Array(Number(settings.size)).fill(0).map(() => _emptyItem)
        );
}

function _getUniqueItems(settings) {
    // Create an array of the required length
    const result = new Array(settings.size);

    // Generate unique random numbers between 0 and 9
    const uniqueNumbers = _generateRandomUniqueArray(0, 9);

    // For ukr-letters type, we need unique random letters
    let uniqueLetters = [];

    if (isUkrLettersType(settings)) {
        // Shuffle the letters array to get random order
        uniqueLetters = [...settings.letters]
            .sort(() => Math.random() - 0.5)
            .slice(0, settings.size);
    }

    // For non-ukr-letters type, we need unique image numbers
    let uniqueImageNumbers = [];
    if (!isUkrLettersType(settings)) {
        uniqueImageNumbers = _generateRandomUniqueArray(1, 10)
            .slice(0, settings.size);
    }

    // Create each item with appropriate properties
    for (let i = 0; i < settings.size; i++) {
        result[i] = {
            imageNumber: isUkrLettersType(settings) ? 0 : uniqueImageNumbers[i],
            letter: isUkrLettersType(settings) ? uniqueLetters[i] : '',
            number: uniqueNumbers[i],
            usageCount: 0,
        };
    }

    return result;
}

function _generateRandomUniqueArray(min, max) {
    // Create an array with all numbers in the range
    const numbers = [];
    for (let i = min; i <= max; i++) {
        numbers.push(i);
    }

    // Shuffle the array using Fisher-Yates algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap elements
    }

    return numbers;
}

function _getItems(settings) {
    if (settings.complexity === 1) {
        return _getEasyItems(settings);
    }

    if (settings.complexity === 2) {
        return _getMediumItems(settings);
    }

    if (settings.complexity === 3) {
        return _getHardItems(settings);
    }
}

function _getEasyItems(settings) {
    const baseIndex = {
        isRow: !!_getBinaryNumber(),                          // 1 – рядок, 0 – стовпець
        index: _getRandomNumberExcluding(0, settings.size - 1)
    };
    const baseItemIndex = _getRandomNumberExcluding(0, settings.size - 1);

    let filledRowIndexes    = [];
    let filledColumnIndexes = [];
    let sums                = [];

    // 1) Створюємо порожню матрицю й маркуємо використання базового елемента
    let newItems = _getEmptyItems(settings);
    settings.uniqueItems[baseItemIndex].usageCount = settings.size;

    // 2) Заповнюємо базовий моно-рядок/стовпець
    if (baseIndex.isRow) {
        newItems[baseIndex.index] = newItems[baseIndex.index].map(
            () => settings.uniqueItems[baseItemIndex]
        );
        sums.push(getRowSum(newItems[baseIndex.index]));
        filledRowIndexes.push(baseIndex.index);
    } else {
        newItems = newItems.map(row => {
            const copy = [...row];
            copy[baseIndex.index] = settings.uniqueItems[baseItemIndex];
            return copy;
        });
        sums.push(getColumnSum(newItems, baseIndex.index));
        filledColumnIndexes.push(baseIndex.index);
    }

    // 2.1) Перевірка чистоти базової лінії
    const baseLine = baseIndex.isRow
        ? newItems[baseIndex.index]
        : newItems.map(row => row[baseIndex.index]);
    if (!baseLine.every(item => item.number === settings.uniqueItems[baseItemIndex].number)) {
        return _getEasyItems(settings);
    }

    // 3) Готуємо індекси решти елементів та трекер шаблонів
    const allIndices = settings.uniqueItems.map((_, i) => i);
    const remaining  = allIndices.filter(i => i !== baseItemIndex);
    const seen       = new Set();
    // Заносимо шаблон базової лінії
    if (baseIndex.isRow) {
        seen.add(JSON.stringify(
            newItems[baseIndex.index].map(i => i.number)
        ));
    } else {
        seen.add(JSON.stringify(
            newItems.map(row => row[baseIndex.index].number)
        ));
    }
// 4) Генерація "легких" рядків/стовпців — поки не застосовані всі нові елементи
const baseNumber = settings.uniqueItems[baseItemIndex].number;
const remainingNums = remaining.map(i => settings.uniqueItems[i].number);

// Множина цифр, які вже з’явилися в згенерованих лініях (окрім baseNumber)
const applied = new Set();

// Вказівник, скільки нових типів (крім базового) зараз задіяно
let step = 0;

// Ітератор рядів/стовпців, які ще не заповнені
const freeSlots = [];
if (baseIndex.isRow) {
  for (let i = 0; i < settings.size; i++) {
    if (i !== baseIndex.index) freeSlots.push({ isRow: true, idx: i });
  }
} else {
  for (let c = 0; c < settings.size; c++) {
    if (c !== baseIndex.index) freeSlots.push({ isRow: false, idx: c });
  }
}
let slotPtr = 0;

// Крутимо, доки не “покриємо” всі remainingNums
while (applied.size < remainingNums.length && slotPtr < freeSlots.length) {
  // скільки “нових” типів додаємо цього разу: від 1 до remainingNums.length
  const typesToInclude = [
    baseNumber,
    ...remainingNums.slice(0, step + 1)
  ];

  // згенерити шаблон лінії
  let pattern;
  do {
    pattern = Array.from({ length: settings.size }, () => {
      const idx = Math.floor(Math.random() * typesToInclude.length);
      return typesToInclude[idx];
    });
    // переконатися, що всі typesToInclude зустрілися хоча б раз
    typesToInclude.forEach(n => {
      if (!pattern.includes(n)) {
        pattern[Math.floor(Math.random() * settings.size)] = n;
      }
    });
  } while (seen.has(JSON.stringify(pattern)));

  // вставити pattern у наступний вільний слот
  const slot = freeSlots[slotPtr++];
  if (slot.isRow) {
    newItems[slot.idx] = pattern.map(num =>
      settings.uniqueItems.find(u => u.number === num)
    );
    filledRowIndexes.push(slot.idx);
    sums.push(getRowSum(newItems[slot.idx]));
  } else {
    const col = slot.idx;
    newItems = newItems.map((row, r) => {
      const copy = [...row];
      copy[col] = settings.uniqueItems.find(u => u.number === pattern[r]);
      return copy;
    });
    filledColumnIndexes.push(col);
    sums.push(getColumnSum(newItems, col));
  }

  // позначити, що цей шаблон уже використано
  seen.add(JSON.stringify(pattern));

  // додати всі нові цифри з цього pattern до applied
  pattern.forEach(n => {
    if (n !== baseNumber && remainingNums.includes(n)) {
      applied.add(n);
    }
  });

  // наступного разу додамо ще один “новий” тип (до максимуму)
  if (step < remainingNums.length - 1) step++;
}

    // 5) Дозаповнюємо всі порожні клітинки через _fillEmptyCells
    newItems = _fillEmptyCells(
        [...newItems],
        filledRowIndexes,
        filledColumnIndexes,
        sums,
        settings
    );

    // 5.5) Гарантуємо появу всіх типів елементів
    const allNums  = settings.uniqueItems.map(u => u.number);
    const usedNums = new Set(newItems.flat().map(item => item.number));
    const missing  = allNums.filter(n => !usedNums.has(n));
    missing.forEach(num => {
        let i, j;
        if (baseIndex.isRow) {
            i = [...Array(settings.size).keys()]
                .filter(r => r !== baseIndex.index)[
                    Math.floor(Math.random() * (settings.size - 1))
                ];
            j = Math.floor(Math.random() * settings.size);
        } else {
            j = [...Array(settings.size).keys()]
                .filter(c => c !== baseIndex.index)[
                    Math.floor(Math.random() * (settings.size - 1))
                ];
            i = Math.floor(Math.random() * settings.size);
        }
        newItems[i][j] = settings.uniqueItems.find(u => u.number === num);
    });

    // 5.6) Перевірка на зайві моно-рядки/стовпці
    for (let r = 0; r < settings.size; r++) {
        if (baseIndex.isRow && r === baseIndex.index) continue;
        const rowNums = newItems[r].map(item => item.number);
        if (new Set(rowNums).size === 1) {
            const otherNums = Array.from(
                new Set(newItems.flat().map(i => i.number))
            ).filter(n => n !== rowNums[0]);
            for (let k = 0; k < 2; k++) {
                const j = Math.floor(Math.random() * settings.size);
                const rep = otherNums[Math.floor(
                    Math.random() * otherNums.length
                )];
                newItems[r][j] = settings.uniqueItems.find(
                    u => u.number === rep
                );
            }
        }
    }
    for (let c = 0; c < settings.size; c++) {
        if (!baseIndex.isRow && c === baseIndex.index) continue;
        const colNums = newItems.map(row => row[c].number);
        if (new Set(colNums).size === 1) {
            const otherNums = Array.from(
                new Set(newItems.flat().map(i => i.number))
            ).filter(n => n !== colNums[0]);
            for (let k = 0; k < 2; k++) {
                const i = Math.floor(Math.random() * settings.size);
                const rep = otherNums[Math.floor(
                    Math.random() * otherNums.length
                )];
                newItems[i][c] = settings.uniqueItems.find(
                    u => u.number === rep
                );
            }
        }
    }

    // 7) Фінальна перевірка на наявність хоча б одного моно-рядка/стовпця
    let monoExists = false;
    for (let i = 0; i < settings.size; i++) {
        const rowSet = new Set(newItems[i].map(it => it.number));
        const colSet = new Set(newItems.map(r => r[i].number));
        if (rowSet.size === 1 || colSet.size === 1) {
            monoExists = true;
            break;
        }
    }
    if (!monoExists) {
        return _getEasyItems(settings);
    }

    // 8) Повертаємо остаточний заповнений квадрат
    return newItems;
}





/*
function _generateEasySequential(settings, minSize = 4, maxSize = 10) {
  const results = [];

  for (let size = minSize; size <= maxSize; size++) {
    // 1) Клонуємо settings і ставимо новий розмір
    const cfg = { ...settings, size };

    // 2) Викликаємо ваш алгоритм (без жодних змін усередині нього)
    const matrix = _getEasyItems(cfg);

    results.push({ size, matrix });
  }

  return results;
}
*/

function _getMediumItems(settings) {
    // 1) Отримуємо два базові індекси для чергування із uniqueItems
    const firstBaseItemIndexes = _getBaseItemIndexes(_MEDIUM_COMPLEXITY_BASE_ITEMS_QUANTITY, settings);
    const value1 = settings.uniqueItems[firstBaseItemIndexes[0]].number;
    const value2 = settings.uniqueItems[firstBaseItemIndexes[1]].number;

    // 2) Випадковий вибір типу (два рядки, два стовпці або змішаний) і їх індексів
    const idx1 = _getRandomNumberExcluding(0, settings.size - 1);
    let idx2;
    do {
        idx2 = _getRandomNumberExcluding(0, settings.size - 1);
    } while (idx2 === idx1);

    const type = Math.random();
    const baseIndexes = [];
    if (type < 0.33) {
        baseIndexes.push({ isRow: true,  index: idx1 });
        baseIndexes.push({ isRow: true,  index: idx2 });
    } else if (type < 0.66) {
        baseIndexes.push({ isRow: false, index: idx1 });
        baseIndexes.push({ isRow: false, index: idx2 });
    } else {
        baseIndexes.push({ isRow: true,  index: idx1 });
        baseIndexes.push({ isRow: false, index: idx2 });
    }

    // 3) Ініціалізація
    let filledRowIndexes    = [];
    let filledColumnIndexes = [];
    let sums                 = [];
    let newItems             = _getEmptyItems(settings);
    _updateUniqueItemsUsageCount(firstBaseItemIndexes, settings.uniqueItems);

    // 4) Заповнюємо «спеціальні» лінії чергуванням value1/value2
    baseIndexes.forEach((baseIndex, i) => {
        const firstLine = (i === 0);
        if (baseIndex.isRow) {
            filledRowIndexes.push(baseIndex.index);
            newItems[baseIndex.index] = newItems[baseIndex.index].map((_, j) => {
                const num = (j % 2 === 0)
                    ? (firstLine ? value1 : value2)
                    : (firstLine ? value2 : value1);
                return settings.uniqueItems.find(u => u.number === num);
            });
        } else {
            filledColumnIndexes.push(baseIndex.index);
            newItems = newItems.map((row, r) => {
                const copy = [...row];
                const num = (r % 2 === 0)
                    ? (firstLine ? value1 : value2)
                    : (firstLine ? value2 : value1);
                copy[baseIndex.index] = settings.uniqueItems.find(u => u.number === num);
                return copy;
            });
        }
// 4.1) Якщо дві “спеціальні” лінії мають однаковий розподіл value1/value2 — змінюємо k клітинок
if (baseIndexes.length === 2) {
  const [first, second] = baseIndexes;

  // Допоміжна: витягує масив чисел із рядка або стовпця
  function getNums(line) {
    return line.isRow
      ? newItems[line.index].map(u => u.number)
      : newItems.map(r => r[line.index].number);
  }

  const numsA = getNums(first);
  const numsB = getNums(second);
  const cntA1 = numsA.filter(n => n === value1).length;
  const cntB1 = numsB.filter(n => n === value1).length;
  // якщо кількість value1 (і, відповідно, value2) збігається — виправляємо другу лінію
  if (cntA1 === cntB1) {
    // обчислимо максимально можливу кількість замін для даного size
    // 4×4 → 1, 6×6 → 2, 8×8 → 3, 10×10 → 4
    const maxReplaces = settings.size/2 - 1;
    const k = 1 + Math.floor(Math.random() * maxReplaces);

    // згенеруємо масив усіх індексів [0,1,…,size-1] та перемішаємо його
    const idxs = Array.from({length: settings.size}, (_,i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    const toFlip = idxs.slice(0, k);

    // виконуємо «перевертання» k клітинок у другій лінії
    if (second.isRow) {
      const row = newItems[second.index];
      toFlip.forEach(pos => {
        const cur = row[pos].number;
        const nxt = cur === value1 ? value2 : value1;
        row[pos] = settings.uniqueItems.find(u => u.number === nxt);
      });
    } else {
      const col = second.index;
      toFlip.forEach(r => {
        const cur = newItems[r][col].number;
        const nxt = cur === value1 ? value2 : value1;
        newItems[r][col] = settings.uniqueItems.find(u => u.number === nxt);
      });
    }
  }
}

    });

    // 5) Перевірка: жодного моно-рядка серед тих, що вже заповнені,
    //    та жодних дублікатів патерну
    const seenRows = new Set();
    const randomItem = () =>
        settings.uniqueItems[Math.floor(Math.random() * settings.uniqueItems.length)];

    filledRowIndexes.forEach(rowIdx => {
        let row = newItems[rowIdx];
        let key = row.map(item => item.number).join(',');
        while (new Set(row.map(item => item.number)).size === 1 || seenRows.has(key)) {
            row = row.map(() => randomItem());
            key = row.map(item => item.number).join(',');
        }
        newItems[rowIdx] = row;
        seenRows.add(key);
    });

    // 6) Повертаємо результат через той самий заповнювач, що й раніше
    return _fillEmptyCells(
        [...newItems],
        filledRowIndexes,
        filledColumnIndexes,
        sums,
        settings
    );
}


/*
function _getMediumItems(settings) {
    const baseIndexes = _getBaseIndexes();
    const firstBaseItemIndexes = _getBaseItemIndexes(_MEDIUM_COMPLEXITY_BASE_ITEMS_QUANTITY, settings);

    let filledRowIndexes = [];
    let filledColumnIndexes = [];
    let sums = [];

    let newItems = _getEmptyItems(settings);
    _updateUniqueItemsUsageCount(firstBaseItemIndexes, settings.uniqueItems);

    baseIndexes.forEach((baseIndex) => {
        if (baseIndex.isRow) {
            filledRowIndexes.push(baseIndex.index);
            newItems[baseIndex.index] = newItems[baseIndex.index].map(
                () => settings.uniqueItems[firstBaseItemIndexes[_getBinaryNumber()]]
            );
            return;
        }

        filledColumnIndexes.push(baseIndex.index);
        newItems = newItems.map((itemsRow) => {
            const newItemRow = [...itemsRow];
            newItemRow[baseIndex.index] = settings.uniqueItems[firstBaseItemIndexes[_getBinaryNumber()]];
            return newItemRow;
        });
    });

    // ——————————————————————————————————————————
    // Додаємо перевірку: жодного моно-рядка та жодних повторювань рядків
    const seenRows = new Set();
    const randomItem = () =>
        settings.uniqueItems[Math.floor(Math.random() * settings.uniqueItems.length)];

    filledRowIndexes.forEach((rowIdx) => {
        let row = newItems[rowIdx];
        let key = row.join(',');

        // Якщо весь рядок однаковий або такий рядок уже був — генеруємо заново
        while (new Set(row).size === 1 || seenRows.has(key)) {
            row = row.map(() => randomItem());
            key = row.join(',');
        }
        newItems[rowIdx] = row;
        seenRows.add(key);
    });

    return _fillEmptyCells([...newItems], filledRowIndexes, filledColumnIndexes, sums, settings);
}
*/


/*
function _getEasyItems(settings) {
    const baseIndex = {
        // Use get binary to select row or column to fill. 1 - row, 0 - column
        isRow: !!_getBinaryNumber(),
        index: _getRandomNumberExcluding(1, settings.size - 1),
    };
    const baseItemIndex = _getRandomNumberExcluding(0, settings.size - 1);

    let filledRowIndexes = [];
    let filledColumnIndexes = [];
    let sums = [];

    let newItems = _getEmptyItems(settings);
    settings.uniqueItems[baseItemIndex].usageCount = Number(settings.size);

    if (baseIndex.isRow) {
        newItems[baseIndex.index] = newItems[baseIndex.index].map(() => settings.uniqueItems[baseItemIndex]);
        sums.push(getRowSum(newItems[baseIndex.index]))
        filledRowIndexes.push(baseIndex.index);
    } else {
        newItems = newItems.map((itemsRow) => {
            const newItemRow = [...itemsRow];
            newItemRow[baseIndex.index] = settings.uniqueItems[baseItemIndex];

            return newItemRow
        })
        sums.push(getColumnSum(newItems, baseIndex.index));
        filledColumnIndexes.push(baseIndex.index);
    }

    return _fillEmptyCells([...newItems], filledRowIndexes, filledColumnIndexes, sums, settings);
}*/
// Обновленная версия _getMediumItems: никаких строк или столбцов из одного элемента



/*
function _getMediumItems(settings) {
    const baseIndexes = _getBaseIndexes();
    const firstBaseItemIndexes = _getBaseItemIndexes(_MEDIUM_COMPLEXITY_BASE_ITEMS_QUANTITY, settings);

    let filledRowIndexes = [];
    let filledColumnIndexes = [];
    let sums = [];

    let newItems = _getEmptyItems(settings);
    _updateUniqueItemsUsageCount(firstBaseItemIndexes, settings.uniqueItems);

    baseIndexes.forEach((baseIndex) => {
        if (baseIndex.isRow) {
            filledRowIndexes.push(baseIndex.index);
            newItems[baseIndex.index] = newItems[baseIndex.index].map(
                () => settings.uniqueItems[firstBaseItemIndexes[_getBinaryNumber()]]
            );

            return;
        }

        filledColumnIndexes.push(baseIndex.index);

        newItems = newItems.map((itemsRow) => {
            const newItemRow = [...itemsRow];
            newItemRow[baseIndex.index] = settings.uniqueItems[firstBaseItemIndexes[_getBinaryNumber()]];

            return newItemRow
        })
    });

    return _fillEmptyCells([...newItems], filledRowIndexes, filledColumnIndexes, sums, settings);
}
*/
/*
function _getHardItems(settings) {
    const baseIndexes = _getBaseIndexes();
    const firstBaseItemIndexes = _getBaseItemIndexes(_HARD_COMPLEXITY_BASE_ITEMS_QUANTITY, settings);
    const baseUniqueItems = settings.uniqueItems.filter((item, index) =>
        firstBaseItemIndexes.includes(index)
    );

    let filledRowIndexes = [];
    let filledColumnIndexes = [];
    let sums = [];

    let newItems = _getEmptyItems(settings);

    // ——————————————————————————————————————————
    // Доповнення: перші два рядки/стовпці — по два елементи,
    // один спільний, один різний
    const [commonItem, distinctItem1, distinctItem2] = baseUniqueItems;

    function genLine(common, distinct) {
        // Генерує лінію з двох типів, обов’язково має обидва
        let line;
        do {
            line = Array(settings.size)
                .fill(null)
                .map(() => (Math.random() < 0.5 ? common : distinct));
        } while (!(line.includes(common) && line.includes(distinct)));
        return line;
    }

    const firstItems = genLine(commonItem, distinctItem1);

    let secondItems;
    do {
        secondItems = genLine(commonItem, distinctItem2);
    } while (secondItems.join(',') === firstItems.join(','));

    // Призначаємо перший набір
    if (baseIndexes[0].isRow) {
        newItems[baseIndexes[0].index] = firstItems;
        filledRowIndexes.push(baseIndexes[0].index);
    } else {
        newItems = newItems.map((row, rowIndex) => {
            const newRow = [...row];
            newRow[baseIndexes[0].index] = firstItems[rowIndex];
            return newRow;
        });
        filledColumnIndexes.push(baseIndexes[0].index);
    }

    // Призначаємо другий набір
    if (baseIndexes[1].isRow) {
        newItems[baseIndexes[1].index] = secondItems;
        filledRowIndexes.push(baseIndexes[1].index);
    } else {
        newItems = newItems.map((row, rowIndex) => {
            const newRow = [...row];
            newRow[baseIndexes[1].index] = secondItems[rowIndex];
            return newRow;
        });
        filledColumnIndexes.push(baseIndexes[1].index);
    }

    // ——————————————————————————————————————————
    // Перевірка: жодного моно-рядка та жодних повторів (для безпеки)
    const seenRows = new Set();
    const randomItem = () =>
        settings.uniqueItems[Math.floor(Math.random() * settings.uniqueItems.length)];

    filledRowIndexes.forEach((rowIdx) => {
        let row = newItems[rowIdx].slice();
        let key = row.join(',');

        while (new Set(row).size === 1 || seenRows.has(key)) {
            row = row.map(() => randomItem());
            key = row.join(',');
        }

        newItems[rowIdx] = row;
        seenRows.add(key);
    });

    return _fillEmptyCells([...newItems], filledRowIndexes, filledColumnIndexes, sums, settings);
}

 function _getHardItems(settings) {
    // 1) Беремо індекси для двох «базових» елементів
    const baseIndexes = _getBaseIndexes();
    const firstBaseItemIndexes = _getBaseItemIndexes(
        _HARD_COMPLEXITY_BASE_ITEMS_QUANTITY,
        settings
    );

    // 2) Витягуємо з uniqueItems саме ці елементи
    const baseUniqueItems = settings.uniqueItems.filter((item, index) =>
        firstBaseItemIndexes.includes(index)
    );

    // 3) Ініціалізуємо змінні
    let filledRowIndexes    = [];
    let filledColumnIndexes = [];
    let sums                = [];
    let newItems            = _getEmptyItems(settings);

    // ——————————————————————————————————————————
    // 4) Генеруємо дві збалансовані лінії чисел (arr1 та arr2) однакової суми
    const result = generateBalancedArrays(settings.size, 100);
    if (!result) {
        throw new Error("Не вдалося згенерувати збалансовані лінії");
    }
    const { arr1, arr2 } = result;

    // 5) Випадково обираємо: це будуть рядки чи стовпці
    const isRow = Math.random() < 0.5;
    const idx1  = _getRandomNumberExcluding(0, settings.size - 1);
    let idx2;
    do {
        idx2 = _getRandomNumberExcluding(0, settings.size - 1);
    } while (idx2 === idx1);

    // 6) Призначаємо першу лінію (arr1) у newItems
    if (isRow) {
        // заповнюємо увесь рядок idx1
        newItems[idx1] = arr1.map(num =>
            settings.uniqueItems.find(u => u.number === num)
        );
        filledRowIndexes.push(idx1);
        sums.push(getRowSum(newItems[idx1]));
    } else {
        // заповнюємо стовпець idx1
        newItems = newItems.map((row, r) => {
            const copy = [...row];
            copy[idx1] = settings.uniqueItems.find(u => u.number === arr1[r]);
            return copy;
        });
        filledColumnIndexes.push(idx1);
        sums.push(getColumnSum(newItems, idx1));
    }

    // 7) Призначаємо другу лінію (arr2)
    if (isRow) {
        newItems[idx2] = arr2.map(num =>
            settings.uniqueItems.find(u => u.number === num)
        );
        filledRowIndexes.push(idx2);
        sums.push(getRowSum(newItems[idx2]));
    } else {
        newItems = newItems.map((row, r) => {
            const copy = [...row];
            copy[idx2] = settings.uniqueItems.find(u => u.number === arr2[r]);
            return copy;
        });
        filledColumnIndexes.push(idx2);
        sums.push(getColumnSum(newItems, idx2));
    }

    // ——————————————————————————————————————————
    // 8) Перевірка: серед тих заповнених рядків не повинно бути монохромних або дублікатів
    const seenRows = new Set();
    const randomItem = () =>
        settings.uniqueItems[
            Math.floor(Math.random() * settings.uniqueItems.length)
        ];

    filledRowIndexes.forEach(rowIdx => {
        // витягуємо числа в рядку
        let row = newItems[rowIdx].map(item => item.number).slice();
        let key = row.join(",");

        // якщо весь рядок однаковий або такий ключ уже був — «ламаємо» його випадковими елементами
        while (new Set(row).size === 1 || seenRows.has(key)) {
            row = row.map(() => randomItem().number);
            key = row.join(",");
        }

        // перекладаємо назад у об’єкти uniqueItems
        newItems[rowIdx] = row.map(num =>
            settings.uniqueItems.find(u => u.number === num)
        );
        seenRows.add(key);
    });

    // 9) Повертаємо остаточний результат через стандартний «заповнювач» порожніх клітинок
    return _fillEmptyCells(
        [...newItems],
        filledRowIndexes,
        filledColumnIndexes,
        sums,
        settings
    );
}*/

function _getHardItems(settings) {
    const size = settings.size;

    // 1) Діапазон допустимих значень
    const allPossibleValues = settings.uniqueItems.map(u => u.number);

    // 2) Беремо три різні елементи e1, e2, e3
    const distinct = Array.from(new Set(allPossibleValues));
    let [e1, e2, e3] = distinct;
    if (distinct.length < 3) {
        // якщо менше 3 різних унікальних — доповнюємо з першого ж
        while (distinct.length < 3) distinct.push(distinct[0]);
        [e1, e2, e3] = distinct;
    }

    // Патерни для перших трьох рядків
    const row1Vals = [e1, e2];
    const row2Vals = [e1, e3];
    const row3Vals = [e2, e3];

    // 3) Створюємо чисту числову матрицю
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));

    // 4) Заповнюємо перші три рядки
    for (let j = 0; j < size; j++) {
        matrix[0][j] = row1Vals[j % 2];
        matrix[1][j] = row2Vals[j % 2];
        if (size > 2) {
            matrix[2][j] = row3Vals[j % 2];
        }
    }

    // 5) Вирівнюємо суму другого рядка під суму першого
    const sumRow = arr => arr.reduce((a, b) => a + b, 0);
    const targetSum = sumRow(matrix[0]);
    let currentSum2 = sumRow(matrix[1]);

    if (currentSum2 !== targetSum) {
        let diff = targetSum - currentSum2;
        for (let j = 0; j < size && diff !== 0; j++) {
            const orig = matrix[1][j];
            // 5.1) Спроба точного вирівнювання
            let fixed = false;
            for (const cand of allPossibleValues) {
                matrix[1][j] = cand;
                if (sumRow(matrix[1]) === targetSum) {
                    fixed = true;
                    break;
                }
            }
            if (fixed) break;
            // 5.2) Мінімізуємо залишкову різницю
            matrix[1][j] = orig;
            let best = orig, bestDelta = Math.abs(diff);
            for (const cand of allPossibleValues) {
                const newSum = currentSum2 - orig + cand;
                const d = Math.abs(targetSum - newSum);
                if (d < bestDelta) {
                    bestDelta = d;
                    best = cand;
                }
            }
            matrix[1][j] = best;
            currentSum2 = sumRow(matrix[1]);
            diff = targetSum - currentSum2;
        }
    }

    // 6) Решту рядків (з i=3) заповнюємо випадково
    for (let i = 3; i < size; i++) {
        for (let j = 0; j < size; j++) {
            matrix[i][j] = allPossibleValues[
                Math.floor(Math.random() * allPossibleValues.length)
            ];
        }
    }

    // 7) Перетворюємо числову матрицю на об’єкти uniqueItems
    const newItems = _getEmptyItems(settings);
    const toItemsRow = arr => arr.map(n =>
        settings.uniqueItems.find(u => u.number === n)
    );
    newItems[0] = toItemsRow(matrix[0]);
    newItems[1] = toItemsRow(matrix[1]);
    const filledRowIndexes = [0, 1];
    const sums = [targetSum, sumRow(matrix[1])];

    if (size > 2) {
        newItems[2] = toItemsRow(matrix[2]);
        filledRowIndexes.push(2);
        sums.push(sumRow(matrix[2]));
    }

    const filledColIndexes = [];

    // 8) Передаємо в заповнювач пустих клітинок
    // він сховає всі ряди/стовпці, які вказані в filledRowIndexes/filledColIndexes,
    // залишивши їхнім паттернам недоторканими.
    return _fillEmptyCells(
        newItems,
        filledRowIndexes,
        filledColIndexes,
        sums,
        settings
    );
}




function _getItemsWithCheckedSum(
    size,
    uniqueItems,
    currentItems,
    isRow,
    currentIndex,
    sums,
    emptyCellsQuantity,
    isSameSum,
) {
    const neverUsedUniqueItemIndexes = uniqueItems
        .map((item, index) => item.usageCount === 0 ? index : -1)
        .filter(index => index !== -1);

    let newItems = [];
    let uniqueSumFound = false;

    const MAX_OUTER = 1000;
    const MAX_INNER = 1000;
    let lastGenerated = [];

    // ЗОВНІШНІЙ ЦИКЛ: по MAX_OUTER разів
    outer: for (let outer = 0; outer < MAX_OUTER; outer++) {
        let attempts = 0;

        // ВНУТРІШНІЙ ЦИКЛ: до MAX_INNER спроб
        while (!uniqueSumFound && attempts < MAX_INNER) {
            attempts++;
            // зберігаємо останню згенеровану навіть якщо не унікальна
            lastGenerated = [];

            // Generate random items
            const tempItems = [];
            for (let i = 0; i < size; i++) {
                const randomItemIndex = neverUsedUniqueItemIndexes.length < emptyCellsQuantity
                    ? _getRandomNumberExcluding(0, uniqueItems.length - 1)
                    : neverUsedUniqueItemIndexes[0];
                tempItems.push(uniqueItems[randomItemIndex]);
            }

            const emptyCellItems = [];
            newItems = tempItems.map((item, idx) => {
                if (isRow && currentItems[currentIndex][idx].number) {
                    return currentItems[currentIndex][idx];
                }
                if (!isRow && currentItems[idx][currentIndex].number) {
                    return currentItems[idx][currentIndex];
                }
                emptyCellItems.push(item);
                return item;
            });

            lastGenerated = newItems.slice();  // копіюємо для fallback
            const sum = getRowSum(newItems);

            if ((isSameSum && sums.includes(sum)) || (!isSameSum && !sums.includes(sum))) {
                uniqueSumFound = true;
                sums.push(sum);
                _updateUniqueItemsUsageCount(
                    emptyCellItems.map(item =>
                        uniqueItems.findIndex(ui => ui.number === item.number)
                    ),
                    uniqueItems
                );
                break outer;  // вийти з обох циклів
            }
        }
        // якщо внутрішній цикл завершився без успіху — спробуємо ще раз
    }

    // Якщо після MAX_OUTER×MAX_INNER спроб не знайшли — graceful fallback
    if (!uniqueSumFound) {
        console.warn(`_getItemsWithCheckedSum: не вдалося знайти унікальну суму за ${MAX_OUTER * MAX_INNER} спроб, повертаю останню згенеровану комбінацію.`);
        newItems = lastGenerated;
    }

    return newItems;
}



// В _fillEmptyCells обгорнемо виклик у try/catch:
function _fillEmptyCells(newItems, filledRowIndexes, filledColumnIndexes, sums, settings) {
  while (_hasEmptyCells(newItems)) {
    const isRow = !!_getBinaryNumber();
    const index = _getRandomNumberExcluding(
      0,
      settings.size - 1,
      isRow ? filledRowIndexes : filledColumnIndexes,
    );

    let itemsWithUniqueSum = [];
    const emptyCellsQuantity = _emptyCellsQuantity(newItems);

    try {
      itemsWithUniqueSum = _getItemsWithCheckedSum(
        settings.size,
        settings.uniqueItems,
        newItems,
        isRow,
        index,
        sums,
        emptyCellsQuantity
      );
    } catch (e) {
      console.error('Fallback in _fillEmptyCells:', e);
      // якщо навіть тут помилка — просто заповнимо весь рядок/стовпець випадковими елементами
      itemsWithUniqueSum = Array(settings.size)
        .fill(0)
        .map(() => settings.uniqueItems[
           Math.floor(Math.random() * settings.uniqueItems.length)
         ]);
    }

    if (isRow) {
      newItems[index] = [...itemsWithUniqueSum];
      filledRowIndexes.push(index);
    } else {
      newItems = newItems.map((row, ri) => {
        const newRow = [...row];
        newRow[index] = itemsWithUniqueSum[ri];
        return newRow;
      });
      filledColumnIndexes.push(index);
    }
  }
  return newItems;
}




function _hasEmptyCells(newItems) {
    return newItems.flat().some(item => item.number === null);
}

function _emptyCellsQuantity(newItems) {
    return newItems.flat().filter(item => item.number === null).length;
}

function _getBinaryNumber() {
    return Math.random() < 0.5 ? 0 : 1;
}

function _getRandomNumberExcluding(min, max, excludedNumbers = []) {
    // Визначаємо первинні межі
    let low = min, high = max;
    if (excludedNumbers.length >= (max - min + 1)) {
        // коли виключено всі у [min..max] — спочатку даємо глобальний діапазон
        low = 0;
        high = 9;
    }

    // ─────── ДОДАЄМО ЦІ ДВОА РЯДКИ ───────
    // Затискаємо low/high назад у [min..max]
    low  = Math.max(low,  min);
    high = Math.min(high, max);
    // ──────────────────────────────────────

    // Збираємо кандидатів
    const candidates = [];
    for (let i = low; i <= high; i++) {
        if (!excludedNumbers.includes(i)) {
            candidates.push(i);
        }
    }

    // Якщо після цього кандидатів немає, 
    // просто повертаємо випадкове число у [min..max] (ігноруємо excludedNumbers)
    if (candidates.length === 0) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Інакше — випадковий із candidates
    const randIdx = Math.floor(Math.random() * candidates.length);
    return candidates[randIdx];
}






// У main.js, знайдіть свою функцію _fillEmptyCells і замініть її цілком на цей фрагмент:
function _fillEmptyCells(newItems, filledRowIndexes, filledColumnIndexes, sums, settings) {
    while (_hasEmptyCells(newItems)) {
        // Use get binary to select row or column to fill. 1 - row, 0 - column
        const isRow = !!_getBinaryNumber();
        const index = _getRandomNumberExcluding(
            0,
            settings.size - 1,
            isRow ? filledRowIndexes : filledColumnIndexes,
        );

        let itemsWithUniqueSum = [];
        let emptyCellsQuantity = _emptyCellsQuantity(newItems);

        if (isRow) {
            itemsWithUniqueSum = _getItemsWithCheckedSum(settings.size, settings.uniqueItems, newItems, isRow, index, sums, emptyCellsQuantity);
            newItems[index] = [...itemsWithUniqueSum];
            filledRowIndexes.push(index);
        } else {
            itemsWithUniqueSum = _getItemsWithCheckedSum(settings.size, settings.uniqueItems, newItems, isRow, index, sums, emptyCellsQuantity);

            newItems = newItems.map((row, rowIndex) => {
                const newRow = [...row];
                newRow[index] = itemsWithUniqueSum[rowIndex];

                return newRow;
            });

            filledColumnIndexes.push(index);
        }
    }

    return newItems;
}

function _getBaseIndexes() {
    const firstIndex = _getRandomNumberExcluding(0, settings.uniqueItems.length - 1);

    return [
        {
            // Use get binary to select row or column to fill. 1 - row, 0 - column
            isRow: !!_getBinaryNumber(),
            index: firstIndex,
            sum: 0,
        },
        {
            // Use get binary to select row or column to fill. 1 - row, 0 - column
            isRow: !_getBinaryNumber(),
            index: _getRandomNumberExcluding(0, settings.uniqueItems.length - 1, [firstIndex]),
            sum: 0,
        },
    ];
}

function _getBaseItemIndexes(quantity, settings) {
    const usedIndexes = [];

    for (let i = 0; i < quantity; i++) {
        usedIndexes.push(
            _getRandomNumberExcluding(1, settings.uniqueItems.length - 1, usedIndexes)
        );
    }

    return usedIndexes;
}

function _updateUniqueItemsUsageCount(firstBaseItemIndexes, uniqueItems) {
    firstBaseItemIndexes.forEach(baseItemIndex => {
        uniqueItems[baseItemIndex].usageCount++
    });
}
