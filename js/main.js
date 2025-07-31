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
    const baseNumber    = settings.uniqueItems[baseItemIndex].number;
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

    // Цикл: поки не "накриємо" всі remainingNums і є вільні слоти
    while (applied.size < remainingNums.length && freeSlots.length > 0) {
    // Рандомно вибрати і видалити слот із масиву
    const slotIdx = Math.floor(Math.random() * freeSlots.length);
    const slot    = freeSlots.splice(slotIdx, 1)[0];

    // Які типи включаємо цього разу: базовий + (step+1) нових
    const typesToInclude = [
        baseNumber,
        ...remainingNums.slice(0, step + 1)
    ];

  // Згенерити унікальний pattern
  let pattern;
  do {
    pattern = Array.from({ length: settings.size }, () => {
      const r = Math.floor(Math.random() * typesToInclude.length);
      return typesToInclude[r];
    });
    // Гарантуємо, що кожен тип присутній хоча б раз
    typesToInclude.forEach(n => {
      if (!pattern.includes(n)) {
        pattern[Math.floor(Math.random() * settings.size)] = n;
      }
    });
  } while (seen.has(JSON.stringify(pattern)));

  // Вставити pattern у вибраний слот
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

  // Позначити цей шаблон як використаний
  seen.add(JSON.stringify(pattern));
  // Додати всі нові цифри до applied
  pattern.forEach(n => {
    if (n !== baseNumber && remainingNums.includes(n)) {
      applied.add(n);
    }
  });

  // Наступного разу додаємо ще один “новий” тип (до максимуму)
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

    // 5.1) Гарантуємо появу всіх типів елементів
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

    // 5.2) Перевірка на зайві моно-рядки/стовпці
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

    // 6) Фінальна перевірка на наявність хоча б одного моно-рядка/стовпця
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

    // 7) Повертаємо остаточний заповнений квадрат
    return newItems;
}


function _getMediumItems(settings) {
  const size = settings.size;
  const numbers = settings.uniqueItems.map(u => u.number);
  if (numbers.length < 2) throw new Error("Недостаточно уникальных элементов для medium");

  // Базові значення
  const value1 = numbers[0];
  const value2 = numbers[1];
  const extra = numbers.slice(2);

  // Вибір рядків або стовпців
  const isRow = Math.random() < 0.5;
  const idx1 = _getRandomNumberExcluding(0, size - 1);
  let idx2;
  do {
    idx2 = _getRandomNumberExcluding(0, size - 1, [idx1]);
  } while (idx2 === idx1);

  //Допоміжна функція: тасування Фішера–Йетса
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Генерація шаблону з a×value1 і b×value2
  function makePattern(a, b, vA, vB) {
    const arr = Array(a).fill(vA).concat(Array(b).fill(vB));
    shuffle(arr);
    return arr;
  }

  // Вибираємо два різних «розділення» (кількість value1)
  const splits = Array.from({ length: size - 1 }, (_, i) => i + 1);
  let countA1 = splits[Math.floor(Math.random() * splits.length)];
  let countA2 = splits[Math.floor(Math.random() * splits.length)];
  while (countA2 === countA1) {
    countA2 = splits[Math.floor(Math.random() * splits.length)];
  }
  let countB1 = size - countA1;
  let countB2 = size - countA2;

  // Перевіряємо, що кількість відрізняється
  if (countA1 === countA2) {
    countA2 = countA2 > 1 ? countA2 - 1 : countA2 + 1;
    countB2 = size - countA2;
  }

  let pattern1 = makePattern(countA1, countB1, value1, value2);
  let pattern2 = makePattern(countA2, countB2, value1, value2);

  // Перевірка на різні суми
  const sumArr = arr => arr.reduce((s, x) => s + x, 0);
  if (sumArr(pattern1) === sumArr(pattern2)) {
    countA2 = countA2 > 1 ? countA2 - 1 : countA2 + 1;
    countB2 = size - countA2;
    pattern2 = makePattern(countA2, countB2, value1, value2);
  }

  // Ініціалізація матриці чисел

  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  if (isRow) {
    matrix[idx1] = pattern1;
    matrix[idx2] = pattern2;
  } else {
    for (let r = 0; r < size; r++) {
      matrix[r][idx1] = pattern1[r];
      matrix[r][idx2] = pattern2[r];
    }
  }

  // Заповнення інших ліній новими типами

  const usedIdx = [idx1, idx2];
  const usedVals = [value1, value2];
  for (let step = 2; step < size; step++) {
    let idx;
    do {
      idx = _getRandomNumberExcluding(0, size - 1, usedIdx);
    } while (usedIdx.includes(idx));
    usedIdx.push(idx);

    const nextVal = extra[step - 2] ?? extra[extra.length - 1];
    const types = [...usedVals, nextVal];

    // Створюємо масив випадкових типів і гарантуємо наявність кожного
    let arr = Array.from({ length: size }, () => types[Math.floor(Math.random() * types.length)]);
    types.forEach(v => {
      if (!arr.includes(v)) arr[Math.floor(Math.random() * size)] = v;
    });
    shuffle(arr);

    if (isRow) {
      matrix[idx] = arr;
    } else {
      for (let r = 0; r < size; r++) matrix[r][idx] = arr[r];
    }
    usedVals.push(nextVal);
  }

  // Перетворюємо числа в об'єкти uniqueItems
  let newItems = matrix.map(row =>
    row.map(n => settings.uniqueItems.find(u => u.number === n))
  );

  // Перевіряємо, що всі числа трапляються принаймні один раз
  const allNums = new Set(numbers);
  const usedNums = new Set(newItems.flat().map(item => item.number));
  [...allNums].filter(n => !usedNums.has(n)).forEach(miss => {
    const i = Math.floor(Math.random() * size);
    const j = Math.floor(Math.random() * size);
    newItems[i][j] = settings.uniqueItems.find(u => u.number === miss);
  });

  // Заповнюємо решту порожніх клітинок
  newItems = _fillEmptyCells(
    newItems,
    isRow ? usedIdx : [],
    isRow ? [] : usedIdx,
    [],
    settings
  );
  // ————— БЛОК: фікс моно-ліній з лімітом спроб —————
  const numToItem = Object.fromEntries(
    settings.uniqueItems.map(u => [u.number, u])
  );

  let hasMono, fixIter = 0;
  const MAX_FIX_ITER = 5;

  do {
    hasMono = false;
    fixIter++;

    // 1) збираємо початкові номери, щоб не підміняти перші дві лінії
    const initialNums = new Set();
    if (isRow) {
      newItems[idx1].forEach(u => initialNums.add(u.number));
      newItems[idx2].forEach(u => initialNums.add(u.number));
    } else {
      for (let r = 0; r < size; r++) {
        initialNums.add(newItems[r][idx1].number);
        initialNums.add(newItems[r][idx2].number);
      }
    }

    // 2) формуємо список кандидатів (всі числа в квадраті мінус initialNums)
    const allNumsInSquare = new Set(newItems.flat().map(u => u.number));
    const candidates = [...allNumsInSquare].filter(n => !initialNums.has(n));

    // якщо кандидатів менше двох — нічого не міняємо й виходимо
    if (candidates.length < 2) break;

    // допоміжна: генерує «немоно» масив з candidates
    function makeMixedLine() {
      const arr = Array.from({ length: size },
        () => candidates[Math.floor(Math.random() * candidates.length)]);
      // гарантуємо хоча б дві різні цифри
      if (new Set(arr).size === 1) {
        const other = candidates.find(n => n !== arr[0]);
        arr[Math.floor(Math.random() * size)] = other;
      }
      return arr;
    }

    // 3) фіксмо рядки
    for (let r = 0; r < size; r++) {
      const rowNums = newItems[r].map(u => u.number);
      if (rowNums.every(n => n === rowNums[0])) {
        hasMono = true;
        const mix = makeMixedLine();
        for (let c = 0; c < size; c++) {
          newItems[r][c] = numToItem[mix[c]];
        }
      }
    }

    // 4) фіксмо стовпці
    for (let c = 0; c < size; c++) {
      const colNums = newItems.map(row => row[c].number);
      if (colNums.every(n => n === colNums[0])) {
        hasMono = true;
        const mix = makeMixedLine();
        for (let r = 0; r < size; r++) {
          newItems[r][c] = numToItem[mix[r]];
        }
      }
    }

    // якщо за MAX_FIX_ITER спроб не вдалось, теж виходимо, щоб уникнути зависання
  } while (hasMono && fixIter < MAX_FIX_ITER);
  // ————— кінець блоку фікса —————


  return newItems;
}



 function _getHardItems(settings) {
    const MAX_ATTEMPTS = 1_25_000;

    if (settings.size === 4) {
        const items = settings.uniqueItems;
        const matrix4 = [];
        for (let shift = 0; shift < 4; shift++) {
            matrix4.push(
                items.slice(shift).concat(items.slice(0, shift))
            );
        }
        return matrix4;
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const size = settings.size;
            const uniqueNumbers = settings.uniqueItems.map(u => u.number);
            if (uniqueNumbers.length < 3) {
                throw new Error("Недостатньо цнікальних елементів hard");
            }

            // Допоміжна функція безпечного вибору індекса
            function pickIndex(min, max, excluded = []) {
                const candidates = [];
                for (let i = min; i <= max; i++) {
                    if (!excluded.includes(i)) candidates.push(i);
                }
                if (candidates.length === 0) {
                    throw new Error(`_getHardItems: немає доступних індексів у діапазоні [${min}–${max}], виключені: [${excluded.join(",")}]`);
                }
                return candidates[Math.floor(Math.random() * candidates.length)];
            }

            let found = false;
            let pattern1, pattern2, pattern3, sum1, sum2;
            let A, B, C;

            // Шукаємо A, B, C і три початкові патерни
            outer: for (let i = 0; i < uniqueNumbers.length - 2; i++) {
                for (let j = i + 1; j < uniqueNumbers.length - 1; j++) {
                    for (let k = j + 1; k < uniqueNumbers.length; k++) {
                        A = uniqueNumbers[i];
                        B = uniqueNumbers[j];
                        C = uniqueNumbers[k];

                        const sumMap = new Map();
                        for (let a = 1; a < size; a++) {
                            const b = size - a;
                            const s = A * a + B * b;
                            if (!sumMap.has(s)) sumMap.set(s, []);
                            sumMap.get(s).push([a, b]);
                        }

                        for (let a2 = 1; a2 < size; a2++) {
                            const c2 = size - a2;
                            const s2 = A * a2 + C * c2;
                            if (!sumMap.has(s2)) continue;
                            for (let [a1, b1] of sumMap.get(s2)) {
                                // випадковий рядок із {A,B,C}, але забезпечуємо наявність усіх трьох
                                const temp = Array.from(
                                    { length: size },
                                    () => [A, B, C][Math.floor(Math.random() * 3)]
                                );
                                [A, B, C].forEach(val => {
                                    if (!temp.includes(val)) {
                                        temp[Math.floor(Math.random() * size)] = val;
                                    }
                                });
                                const sumABC = temp.reduce((acc, n) => acc + n, 0);
                                if (sumABC !== s2) {
                                    pattern1 = shuffle(
                                        Array(a1).fill(A)
                                            .concat(Array(b1).fill(B))
                                    );
                                    pattern2 = shuffle(
                                        Array(a2).fill(A)
                                            .concat(Array(c2).fill(C))
                                    );
                                    pattern3 = temp;
                                    sum1 = s2;
                                    sum2 = sumABC;
                                    found = true;
                                    break outer;
                                }
                            }
                        }
                    }
                }
            }

            if (!found) {
                throw new Error("Не вийшло знайти трійку з потрібними умовами (AB vs AC)");
            }

            // Вибір випадкової орієнтації для перших трьох ліній
            const isRow = Math.random() < 0.5;
            const usedIndices = [];
            const matrix = Array.from(
                { length: size },
                () => Array(size).fill(null)
            );

            // Розміщуємо перші 3 патерни
            [pattern1, pattern2, pattern3].forEach(pat => {
                const idx = pickIndex(0, size - 1, usedIndices);
                usedIndices.push(idx);
                if (isRow) {
                    matrix[idx] = pat;
                } else {
                    for (let r = 0; r < size; r++) {
                        matrix[r][idx] = pat[r];
                    }
                }
            });

            // Додаємо «фейкову» лінію з новим елементом
            const usedValues = [A, B, C];
            const nextValue = uniqueNumbers.find(n => !usedValues.includes(n));
            if (nextValue !== undefined) {
                const MAX_FAKE_TRIES = 500;
                let fakeLine = null;
                for (let t = 0; t < MAX_FAKE_TRIES; t++) {
                    const candidate = Array.from(
                        { length: size },
                        () => {
                            const pool = [A, B, C, nextValue];
                            return pool[Math.floor(Math.random() * pool.length)];
                        }
                    );
                    const s = candidate.reduce((sum, v) => sum + v, 0);
                    if (s === sum1 && candidate.includes(nextValue)) {
                        fakeLine = candidate;
                        break;
                    }
                }
                if (fakeLine) {
                    const fakeIdx = pickIndex(0, size - 1, usedIndices);
                    usedIndices.push(fakeIdx);
                    if (isRow) {
                        matrix[fakeIdx] = fakeLine;
                    } else {
                        for (let r = 0; r < size; r++) {
                            matrix[r][fakeIdx] = fakeLine[r];
                        }
                    }
                    usedValues.push(nextValue);
                }
            }

            // Заповнюємо решту ліній
            while (usedValues.length < size) {
                const idx = pickIndex(0, size - 1, usedIndices);
                usedIndices.push(idx);

                const nextVal = uniqueNumbers.find(n => !usedValues.includes(n));
                const elements = [...usedValues, nextVal];
                let line = Array.from(
                    { length: size },
                    () => elements[Math.floor(Math.random() * elements.length)]
                );
                elements.forEach(val => {
                    if (!line.includes(val)) {
                        line[Math.floor(Math.random() * size)] = val;
                    }
                });
                shuffle(line);

                if (isRow) {
                    matrix[idx] = line;
                } else {
                    for (let r = 0; r < size; r++) {
                        matrix[r][idx] = line[r];
                    }
                }

                usedValues.push(nextVal);
            }

            // Конвертуємо в об’єкти uniqueItems
            const toItemsRow = arr =>
                arr.map(n =>
                    settings.uniqueItems.find(u => u.number === n)
                );
            let newItems = matrix.map(row => toItemsRow(row));

            // Вставляємо відсутні елементи
            const allNums = settings.uniqueItems.map(u => u.number);
            const usedNums = new Set(
                newItems.flat().map(item => item.number)
            );
            const missing = allNums.filter(n => !usedNums.has(n));
            missing.forEach(num => {
                const i = Math.floor(Math.random() * size);
                const j = Math.floor(Math.random() * size);
                newItems[i][j] = settings.uniqueItems.find(
                    u => u.number === num
                );
            });

            // Заповнюємо пусті клітинки
            newItems = _fillEmptyCells(
                newItems,
                isRow ? usedIndices : [],
                isRow ? [] : usedIndices,
                [],
                settings
            );

            // ————— БЛОК: «фікс» моно-ліній для hard —————
            const numToItem = Object.fromEntries(
                settings.uniqueItems.map(u => [u.number, u])
            );
            const allNumsList = settings.uniqueItems.map(u => u.number);
            let hasMono;
            let fixIter = 0;
            const MAX_FIX_ITER = 5;

            function makeMixedLine(excludeVal) {
                const pool = allNumsList.filter(n => n !== excludeVal);
                const line = Array.from(
                    { length: size },
                    () => pool[Math.floor(Math.random() * pool.length)]
                );
                if (new Set(line).size === 1) {
                    const other = pool.find(n => n !== line[0]);
                    line[Math.floor(Math.random() * size)] = other;
                }
                return line;
            }

            do {
                hasMono = false;
                fixIter++;

                // Фіксимо моно-рядки
                for (let r = 0; r < size; r++) {
                    const rowNums = newItems[r].map(u => u.number);
                    if (rowNums.every(n => n === rowNums[0])) {
                        hasMono = true;
                        const mix = makeMixedLine(rowNums[0]);
                        for (let c = 0; c < size; c++) {
                            newItems[r][c] = numToItem[mix[c]];
                        }
                    }
                }

                // Фіксимо моно-стовпці
                for (let c = 0; c < size; c++) {
                    const colNums = newItems.map(row => row[c].number);
                    if (colNums.every(n => n === colNums[0])) {
                        hasMono = true;
                        const mix = makeMixedLine(colNums[0]);
                        for (let r = 0; r < size; r++) {
                            newItems[r][c] = numToItem[mix[r]];
                        }
                    }
                }

            } while (hasMono && fixIter < MAX_FIX_ITER);
            // ————— кінець блоку «фікс» —————

            // Успішно згенеровано — повертаємо результат
            return newItems;

        } catch (err) {
            if (attempt === MAX_ATTEMPTS) {
                console.error(
                    `❌ Не вдалося згенерувати за ${MAX_ATTEMPTS} спроб. Натисніть кнопку "Спробувати ще раз".`
                );
                throw err;
            }
            // інакше — пробуємо ще раз
        }
    }
}



function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
        console.warn('_getItemsWithCheckedSum: не вдалося знайти унікальну суму за ${MAX_OUTER * MAX_INNER} спроб, повертаю останню згенеровану комбінацію.');
        newItems = lastGenerated;
    }

    return newItems;
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

    // ─────── ДОДАЄМО ЦІ ДВА РЯДКИ ───────
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