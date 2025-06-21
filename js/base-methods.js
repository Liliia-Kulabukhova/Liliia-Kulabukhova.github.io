function updateElementVisibility(element, condition) {
    if (condition) {
        // Add element to DOM if it's not there
        if (!element.parentNode) {
            element.originalParent.appendChild(element);
        }

        return;
    }

    // Remove element from DOM but keep a reference
    if (element.parentNode) {
        element.originalParent = element.parentNode;
        element.parentNode.removeChild(element);
    }
}

function renderList(items, container, element, itemHandler) {
    // Get container element if a selector was provided
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }

    // Clear container
    container.innerHTML = '';

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Iterate through items
    items.forEach((item, index) => {
        // Clone the element for each item
        const elementClone = element.cloneNode(true);

        if (itemHandler) {
            itemHandler(item, elementClone, index);
        }
        // Add to fragment
        fragment.appendChild(elementClone);
    });

    // Add all elements to DOM at once (more efficient)
    container.appendChild(fragment);
}

function toggleElementVisibility(element) {
    if (element.classList.contains('is--hidden')) {
        element.classList.remove('is--hidden');

        return;
    }

    element.classList.add('is--hidden');
}

function allInputsPristine(container) {
    return Array.from(container.querySelectorAll('input')).every(input => input.dataset.touched === "false");
}

// Then set up event listeners for all inputs to track when they're touched
function setupInputTouchedTracking(value = 'false', container = document) {
    container.querySelectorAll('input').forEach(input => {
        // Set initial state
        input.dataset.touched = value;

        // Add event listeners for various interaction events
        ['focus', 'input', 'change'].forEach(eventType => {
            input.addEventListener(eventType, () => {
                input.dataset.touched = 'true';
            });
        });
    });
}

function updateImageSrc(imageElement, imageType, imageNumber) {
    const src = imageElement.getAttribute('src');

    imageElement.setAttribute(
        'src',
        src.replace('{type}', imageType).replace('{number}', imageNumber)
    );
}

// Call this function when the page loads to add a custom property to inputs and track when they're touched
window.addEventListener('DOMContentLoaded', () => setupInputTouchedTracking());