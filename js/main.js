const _MEDIUM_COMPLEXITY_BASE_ITEMS_QUANTITY = 2;
const _HARD_COMPLEXITY_BASE_ITEMS_QUANTITY = 3;

let settings = {
    uniqueItems: [],
    imageType: '',
    complexity: 0,
    size: 5,
    letters: [],
};

let _emptyItem = {
    imageNumber: 0,
    letter: '',
    number: 0,
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
        index: _getRandomNumberExcluding(1, settings.size - 1)
    };
    const baseItemIndex = _getRandomNumberExcluding(0, settings.size - 1);

    let filledRowIndexes = [];
    let filledColumnIndexes = [];
    let sums = [];

    // 1) Створюємо порожню матрицю й відмічаємо, скільки разів використовуємо базовий елемент
    let newItems = _getEmptyItems(settings);
    settings.uniqueItems[baseItemIndex].usageCount = settings.size;

    // 2) Заповнюємо цей моно­рядок/стовпець
    if (baseIndex.isRow) {
        newItems[baseIndex.index] = newItems[baseIndex.index]
            .map(() => settings.uniqueItems[baseItemIndex]);
        sums.push(getRowSum(newItems[baseIndex.index]));
        filledRowIndexes.push(baseIndex.index);
    } else {
        newItems = newItems.map((row, r) => {
            const copy = [...row];
            copy[baseIndex.index] = settings.uniqueItems[baseItemIndex];
            return copy;
        });
        sums.push(getColumnSum(newItems, baseIndex.index));
        filledColumnIndexes.push(baseIndex.index);
    }

    // 3) Підготуємо списки індексів для подальших нових елементів
    const allIndices = settings.uniqueItems.map((_, i) => i);
    const remaining = allIndices.filter(i => i !== baseItemIndex);
    // Для перевірки унікальності шаблонів
    const seen = new Set();

    // Занесемо патерн базового рядка/стовпця
    if (baseIndex.isRow) {
        seen.add(JSON.stringify(
            newItems[baseIndex.index].map(i => i.number)
        ));
    } else {
        seen.add(JSON.stringify(
            newItems.map(row => row[baseIndex.index].number)
        ));
    }

    // 4) Для кожного іншого ряду/стовпця ступінь «легкий»
    for (let step = 0; step < remaining.length; step++) {
        const newIdx = remaining[step];
        const baseNumber = settings.uniqueItems[baseItemIndex].number;
        const newNumber  = settings.uniqueItems[newIdx].number;

        let pattern;
        do {
            // 4.1) Згенеруємо випадковий патерн довжини size,
            //      беручи значення або baseNumber, або newNumber (тільки два варіанти)
            pattern = Array.from({length: settings.size}, () => {
                return Math.random() < 0.5 ? baseNumber : newNumber;
            });
            // 4.2) Гарантуємо хоча б одне входження baseNumber і newNumber
            if (!pattern.includes(baseNumber)) {
                const pos = Math.floor(Math.random() * settings.size);
                pattern[pos] = baseNumber;
            }
            if (!pattern.includes(newNumber)) {
                const pos = Math.floor(Math.random() * settings.size);
                pattern[pos] = newNumber;
            }
            // 4.3) Повторюємо, якщо вже такий патерн був
        } while (seen.has(JSON.stringify(pattern)));

        // 5) Записуємо цей рядок/стовпець у матрицю й у списки заповнених
        if (baseIndex.isRow) {
            // визначаємо індекс нового рядка
            const rowIdx = [ ...Array(settings.size).keys() ]
                .filter(i => !filledRowIndexes.includes(i))[step];
            newItems[rowIdx] = pattern.map(num =>
                settings.uniqueItems.find(u => u.number === num)
            );
            filledRowIndexes.push(rowIdx);
            sums.push(getRowSum(newItems[rowIdx]));
        } else {
            const colIdx = [ ...Array(settings.size).keys() ]
                .filter(i => !filledColumnIndexes.includes(i))[step];
            // оновлюємо кожен рядок у колонці colIdx
            newItems = newItems.map((row, r) => {
                const copy = [...row];
                copy[colIdx] = settings.uniqueItems
                    .find(u => u.number === pattern[r]);
                return copy;
            });
            filledColumnIndexes.push(colIdx);
            sums.push(getColumnSum(newItems, colIdx));
        }

        // Заносимо в баґ seen
        seen.add(JSON.stringify(pattern));
    }

    // 6) Додаємо залишкові клітинки як раніше
    return _fillEmptyCells(
        [...newItems],
        filledRowIndexes,
        filledColumnIndexes,
        sums,
        settings
    );
}

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
    const size = Number(settings.size);

    // 1) За основу беремо саме числові значення
    //    (якщо потрібно, можна також згенерувати заново, але тут беремо з uniqueItems)
    let allPossibleValues = settings.uniqueItems.map(u => u.number);

    // 2) Якщо з якоїсь причини менше size унікальних — доповнюємо випадковими з [0..9]
    while (allPossibleValues.length < size) {
        const v = Math.floor(Math.random() * 10);
        if (!allPossibleValues.includes(v)) {
            allPossibleValues.push(v);
        }
    }

    // 3) Переконаємося, що перші три (v1,v2,v3) різні, якщо size >=3
    let [v1, v2, v3] = allPossibleValues;
    if (size >= 3) {
        let distinct = [v1];
        for (let i = 1; distinct.length < 3 && i < allPossibleValues.length; i++) {
            if (!distinct.includes(allPossibleValues[i])) {
                distinct.push(allPossibleValues[i]);
            }
        }
        [v1, v2, v3] = distinct;
    }

    // 4) Підготувати порожню матрицю чисел
    const matrix = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => 0)
    );

    // 5) Згенерувати перші два рядки (або стовпці) по ваших правилах
    const shared = v1;
    const row1Vals = [shared, v2];
    const row2Vals = [shared, v3];

    // обираємо: це будуть рядки чи стовпці
    const isRow = Math.random() < 0.5;
    const idx1  = Math.floor(Math.random() * size);
    let idx2;
    do { idx2 = Math.floor(Math.random() * size); } while (idx2 === idx1);

    // Функція для обчислення суми рядка в матриці
    const sumRow = arr => arr.reduce((a,b) => a+b, 0);

    // 6) Заповнюємо перші дві «лінії»
    if (isRow) {
        for (let j = 0; j < size; j++) {
            matrix[idx1][j] = row1Vals[j % 2];
            matrix[idx2][j] = row2Vals[j % 2];
        }
    } else {
        for (let i = 0; i < size; i++) {
            matrix[i][idx1] = row1Vals[i % 2];
            matrix[i][idx2] = row2Vals[i % 2];
        }
    }

    // 7) Вирівнюємо їхні суми
    let sum1 = isRow
        ? sumRow(matrix[idx1])
        : matrix.reduce((s, row) => s + row[idx1], 0);
    let sum2 = isRow
        ? sumRow(matrix[idx2])
        : matrix.reduce((s, row) => s + row[idx2], 0);
    let diff = sum1 - sum2;

    if (diff !== 0) {
        // намагаємося знайти ідеальне значення для вирівнювання
        for (let k = 0; k < size; k++) {
            const current = isRow ? matrix[idx2][k] : matrix[k][idx2];
            // ідеальне нове значення
            const ideal = current + diff;
            if (allPossibleValues.includes(ideal)) {
                if (isRow) matrix[idx2][k] = ideal;
                else      matrix[k][idx2] = ideal;
                break;
            }
            // якщо не знайшли ідеал — мінімізуємо різницю
            let best = current, minD = Math.abs(diff);
            for (const pv of allPossibleValues) {
                const newSum = sum2 - current + pv;
                const curD = Math.abs(sum1 - newSum);
                if (curD < minD) {
                    minD = curD;
                    best = pv;
                }
            }
            if (isRow) matrix[idx2][k] = best;
            else      matrix[k][idx2] = best;
            // далі продовжимо перевіряти в наступних стовпцях/рядках
        }
    }

    // 8) Заповнюємо решту комірок випадковими значеннями
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if ( (isRow && (i === idx1 || i === idx2))
              || (!isRow && (j === idx1 || j === idx2)) ) {
                continue; // перші дві лінії вже є
            }
            matrix[i][j] = allPossibleValues[
                Math.floor(Math.random() * allPossibleValues.length)
            ];
        }
    }

    // 9) Постобробка: переконаємося, що є size унікальних значень і немає монохромних рядків/стовпців
    let changed = true, iter = 0, maxIter = 20;
    while (changed && iter++ < maxIter) {
        changed = false;
        // унікальні значення
        const present = new Set(matrix.flat());
        if (present.size < size) {
            // додаємо відсутнє
            const missing = allPossibleValues.filter(v => !present.has(v));
            const v = missing[0];
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            matrix[r][c] = v;
            changed = true;
        }
        // перевірка рядків
        for (let i = 0; i < size; i++) {
            const rowSet = new Set(matrix[i]);
            if (rowSet.size <= 1) {
                const c = Math.floor(Math.random() * size);
                let newV;
                do { newV = allPossibleValues[Math.floor(Math.random()*allPossibleValues.length)]; }
                while (newV === matrix[i][c]);
                matrix[i][c] = newV;
                changed = true;
            }
        }
        // перевірка стовпців
        for (let j = 0; j < size; j++) {
            const colSet = new Set(matrix.map(r => r[j]));
            if (colSet.size <= 1) {
                const r = Math.floor(Math.random() * size);
                let newV;
                do { newV = allPossibleValues[Math.floor(Math.random()*allPossibleValues.length)]; }
                while (newV === matrix[r][j]);
                matrix[r][j] = newV;
                changed = true;
            }
        }
    }

    // 10) Перетворюємо матрицю чисел у матрицю об’єктів із settings.uniqueItems
    const lookup = num => settings.uniqueItems.find(u => u.number === num);
    const newItems = matrix.map(row =>
        row.map(num => lookup(num))
    );

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
    return newItems.flat().some(item => !item.number);
}

function _emptyCellsQuantity(newItems) {
    return newItems.flat().filter(item => !item.number).length;
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
