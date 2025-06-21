const _imagesQuantity = 10;

const _fullscreenIcon = document.getElementById('fullscreen');
const _fullscreenExitIcon = document.getElementById('fullscreenExit');

const _radioButtonSelector = 'input[type="radio"]';
const _validationErrorSelector = 'div.form-error';

const _typeRadioButtonContainer = document.getElementById('radioButtonsSection');
const _imagesTypeRadioButtonLabels = _typeRadioButtonContainer.querySelectorAll('label');
const _previewPicturesBlock = document.getElementById('picturesBlock');
const _previewPicturesContainer = document.getElementById('pictures');
const _previewPicture = document.getElementById('picturePreview');

const _lettersInputContainerId = 'ukrLettersInput';
const _lettersInputContainer = document.getElementById(_lettersInputContainerId);

const _complexityRadioButtonContainer = document.getElementById('complexityLevel')
const _complexityRadioButtonLabels = _complexityRadioButtonContainer.querySelectorAll('label')

const _sizeControlContainer = document.getElementById('size')
const _sizeControlInput = document.getElementById('sizeInput')

const _generateButton = document.getElementById('generate')

function toggleFullScreen() {
    // відразу оновлюємо іконки під поточний стан
    toggleFullscreenHandler();

    if (document.fullscreenElement) {
        // виходимо з FS і після завершення ще раз оновлюємо іконки
        document.exitFullscreen().then(toggleFullscreenHandler);
        return;
    }

    // входимо в FS і після завершення ще раз оновлюємо іконки
    document.documentElement.requestFullscreen().then(toggleFullscreenHandler);
}


function toggleFullscreenHandler() {
    // Перевіряємо наявність повноекранного елементу з урахуванням вендор-префіксів
    const isFullScreen = document.fullscreenElement 
        || document.webkitFullscreenElement 
        || document.mozFullScreenElement 
        || document.msFullscreenElement;

    if (isFullScreen) {
        updateElementVisibility(_fullscreenIcon, false);
        updateElementVisibility(_fullscreenExitIcon, true);
    } else {
        updateElementVisibility(_fullscreenIcon, true);
        updateElementVisibility(_fullscreenExitIcon, false);
    }
}


function selectImagesType(imageType) {
    settings.imageType = imageType;

    if (imageType !== 'ukr-letters') {
        const numbersArray = new Array(_imagesQuantity).fill(0).map((_, index) => index + 1);

        renderList(
            numbersArray,
            _previewPicturesContainer,
            _previewPicture,
            (item, element) => {
                toggleElementVisibility(element);
                updateImageSrc(element, imageType, item);
            })
    } else {
        renderList(
            [1],
            _previewPicturesContainer,
            _lettersInputContainer,
            )

    }

    _validateSettings();
    animateImagesPreview();
    _showTogglePreviewButton();
}

function animateImagesPreview() {
    if (_typeRadioButtonContainer.classList.contains('pictures__block--preview')) {
        _typeRadioButtonContainer.classList.remove('pictures__block--preview');
        _previewPicturesBlock.classList.remove('pictures__block--preview');

        return;
    }

    _typeRadioButtonContainer.classList.add('pictures__block--preview')
    _previewPicturesBlock.classList.add('pictures__block--preview')
}

function selectComplexity(complexity) {
    settings.complexity = complexity;
    _validateSettings();
}

function updateLetters(input) {
    settings.letters = input.value.split(/[,\s]+/).filter(letter => letter);
    input.dataset.touched = 'true';

    _checkInput(
        input,
        (input) => _isUkrLettersInputValid(input),
        // had to get input container element again because when we render the preview template we clone a base element and cashed link is incorrect
        document.getElementById(_lettersInputContainerId)
    );
    _validateSettings();
}

function changeSize(input) {
    settings.size = input.value;

    _checkInput(
        input,
        () => _isSizeInputValid(input),
        _sizeControlContainer
    );
    _validateSettings();

}

function generate() {
    setupInputTouchedTracking('true');
    _validateSettings();

    if (!_generateButton.disabled) {
        start();
    }
}

function _isUkrLettersInputValid(input) {
    if (input.dataset.touched === 'false') {
        return true;
    }

    const value = input.value.trim();

    // Split by commas or spaces and filter out empty entries
    const letters = value.split(/[,\s]+/).filter(letter => letter);

    // Check if all entries are valid lowercase Ukrainian letters
    const isValidLetters =  letters.every(letter => {
        // Each entry must be a single Ukrainian letter
        return letter.length === 1 && /^[а-щьюяіїєґ]$/.test(letter);
    });

    // Check for uniqueness - make sure there are no duplicate letters
    const areLettersUnique = new Set(letters).size === letters.length;

    return letters.length === 10
        && isValidLetters
        && areLettersUnique
}

function _isSizeInputValid(input) {
    if (input.dataset.touched === 'false') {
        return true;
    }

    return Number(input.value) >= 4 && Number(input.value) <= 10;
}

function _showTogglePreviewButton() {
    toggleElementVisibility(_typeRadioButtonContainer.querySelector('button'));
}

function _checkRadioButtonsControlValidation(value, formControlContainer) {
    if (allInputsPristine(formControlContainer) || !!value) {
        _toggleValidationErrorMessage(formControlContainer, false);

        return true;
    }

    _toggleValidationErrorMessage(formControlContainer, true);

    return false;
}

function _checkInput(input, validationFunction, validationContainer) {
    if (validationFunction(input)) {
        input.classList.remove('wrong-input');
        _toggleValidationErrorMessage(validationContainer, false);

        return true;
    }

    input.classList.add('wrong-input');
    _toggleValidationErrorMessage(validationContainer, true);

    return false;
}

function _validateSettings() {
    if (_isSettingsValid()) {
        _generateButton.disabled = false;

        return;
    }

    _generateButton.disabled = true;
}

function _isSettingsValid() {
    const isTypeValid = _checkRadioButtonsControlValidation(settings.imageType, _typeRadioButtonContainer);
    const isComplexityValid = _checkRadioButtonsControlValidation(settings.complexity, _complexityRadioButtonContainer);
    const isSizeValid = _checkInput(
        _sizeControlInput,
        () => _isSizeInputValid(_sizeControlInput),
        _sizeControlContainer
    );

    let isUkrLettersValid = true;

    if (settings.imageType === 'ukr-letters') {
        isUkrLettersValid = _checkInput(
            document.getElementById(_lettersInputContainerId).querySelector('input'),
            (input) => _isUkrLettersInputValid(input),
            document.getElementById(_lettersInputContainerId)
        );
    }

    return isTypeValid && isComplexityValid && isUkrLettersValid && isSizeValid;
}

function _toggleValidationErrorMessage(container, isShown) {
    const validationErrorElement = container.querySelector(_validationErrorSelector);

    if (isShown) {
        validationErrorElement.classList.add('form-error--visible');

        return;
    }

    validationErrorElement.classList.remove('form-error--visible');
}

document.addEventListener('fullscreenchange', toggleFullscreenHandler)
document.addEventListener('webkitfullscreenchange', toggleFullscreenHandler); // Chrome, Safari
document.addEventListener('mozfullscreenchange', toggleFullscreenHandler);    // Firefox
document.addEventListener('MSFullscreenChange', toggleFullscreenHandler);     // IE/Edge
// Handles case when user clicks F11 to manage fullscreen mode
window.addEventListener('resize', toggleFullscreenHandler);

// Handle radio button selection from keyboard
_imagesTypeRadioButtonLabels.forEach((label) => {
    label.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            const selectedRadioButton = label.querySelector(_radioButtonSelector);
            selectedRadioButton.checked = true;
            selectImagesType(selectedRadioButton.value);
        }
    });
});

// миттєво ховаємо fullscreen і показуємо exit-іконку при уведенні в повноекран
_fullscreenIcon.addEventListener('click', () => {
    updateElementVisibility(_fullscreenIcon, false);
    updateElementVisibility(_fullscreenExitIcon, true);
});

// при виході з повноекран (або кліку по exit-іконці) повертаємо все назад
_fullscreenExitIcon.addEventListener('click', () => {
    updateElementVisibility(_fullscreenIcon, true);
    updateElementVisibility(_fullscreenExitIcon, false);
});

/* === ДОПОВНЕННЯ: початок === */
// Ті самі елементи запускають toggleFullScreen() — 
// розгортання/згортання екрану та автоматичну зміну іконок:
_fullscreenIcon.addEventListener('click', toggleFullScreen);
_fullscreenExitIcon.addEventListener('click', toggleFullScreen);

