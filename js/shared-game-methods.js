function getHorizontalSumItems(items) {
    return items.map(row =>
        getRowSum(row)
    );
}

function getRowSum(rowItems) {
    return rowItems.reduce((sum, item) => sum + Number(item.number || 0), 0);
}

function getVerticalSumItems(items) {
    const size = items.length;
    const result = new Array(size);

    // Calculate sum for each column
    for (let col = 0; col < size; col++) {
        result[col] = getColumnSum(items, col);
    }

    return result;
}

function getColumnSum(items, colIndex) {
    let sum = 0;

    for (let row = 0; row < items.length; row++) {
        sum += Number(items[row][colIndex]?.number || 0);
    }

    return sum;
}

function isUkrLettersType(settings) {
    return settings.imageType === 'ukr-letters';
}