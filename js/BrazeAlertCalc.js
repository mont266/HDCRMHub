// Get references to the input elements, output display elements, and the calculate button
const sendVolumeInput = document.getElementById('sendVolume');
const globalControlCheckbox = document.getElementById('globalControl');
const lowerThresholdDisplay = document.getElementById('lowerThreshold');
const upperThresholdDisplay = document.getElementById('upperThreshold');
const calculateButton = document.getElementById('calculateButton');

// New elements for send limit feature
const hasSendLimitCheckbox = document.getElementById('hasSendLimit');
const dailySendLimitContainer = document.getElementById('dailySendLimitContainer');
const dailySendLimitInput = document.getElementById('dailySendLimit');

/**
 * Calculates and displays the lower and upper thresholds based on send volume and global control.
 * It now also considers a daily send limit if specified.
 */
function calculateThresholds() {
    console.log('Calculating thresholds...');

    // Determine the base volume for calculation
    let baseVolume = parseFloat(sendVolumeInput.value) || 0;
    console.log('Initial Send Volume:', baseVolume);

    // Check if a send limit is active and use it as the base volume if valid
    if (hasSendLimitCheckbox.checked) {
        const dailySendLimit = parseFloat(dailySendLimitInput.value) || 0;
        if (dailySendLimit > 0) { // Only use send limit if it's a positive number
            baseVolume = dailySendLimit;
            console.log('Using Daily Send Limit as base volume:', baseVolume);
        } else {
            console.log('Send limit checkbox ticked, but daily send limit is invalid or zero. Using initial send volume.');
        }
    }

    console.log('Base Volume for calculation:', baseVolume);

    const isGlobalControlTicked = globalControlCheckbox.checked;
    console.log('Global Control Ticked:', isGlobalControlTicked);

    let lowerThresholdPercentage;
    let upperThresholdPercentage;

    // Determine the percentage rates based on the global control state
    if (isGlobalControlTicked) {
        lowerThresholdPercentage = 0.11; // 11%
        upperThresholdPercentage = 0.01;  // 1%
    } else {
        lowerThresholdPercentage = 0.02;  // 2%
        upperThresholdPercentage = 0.01;  // 1%
    }

    // Calculate the actual threshold amounts based on the determined baseVolume
    const lowerThresholdAmount = baseVolume * lowerThresholdPercentage;
    let upperThresholdAmount = baseVolume * upperThresholdPercentage; // Changed to 'let' as it might be modified

    // Calculate the final displayed values:
    // Lower threshold: base volume MINUS threshold amount
    const displayedLowerThreshold = baseVolume - lowerThresholdAmount;

    // Calculate upper threshold: base volume PLUS threshold amount (pre-adjustment)
    let displayedUpperThreshold = baseVolume + upperThresholdAmount;

    // Apply the new rule for Upper Threshold:
    // It should always be at least 1 more than the send volume,
    // handling cases where 1% of send volume is less than 1 (e.g., 1% of 50 is 0.5).
    // We check if the *floored* result is less than baseVolume + 1.
    // If it is, we ensure the displayed value is exactly baseVolume + 1.
    if (Math.floor(displayedUpperThreshold) < (baseVolume + 1)) {
        displayedUpperThreshold = baseVolume + 1; // Ensure it's at least +1 from the base volume
        console.log('Adjusted Upper Threshold to ensure it is at least +1 from base volume.');
    }


    // Round down the results to the nearest whole number and format with commas
    lowerThresholdDisplay.textContent = Math.floor(displayedLowerThreshold).toLocaleString();
    upperThresholdDisplay.textContent = Math.floor(displayedUpperThreshold).toLocaleString();

    console.log('Lower Threshold Percentage:', lowerThresholdPercentage * 100 + '%');
    console.log('Upper Threshold Percentage:', upperThresholdPercentage * 100 + '%');
    console.log('Lower Threshold Amount:', lowerThresholdAmount.toFixed(2));
    console.log('Upper Threshold Amount:', upperThresholdAmount.toFixed(2));
    console.log('Displayed Lower Threshold (rounded down and formatted):', Math.floor(displayedLowerThreshold).toLocaleString());
    console.log('Displayed Upper Threshold (rounded down and formatted):', Math.floor(displayedUpperThreshold).toLocaleString());
}

/**
 * Toggles the visibility of the daily send limit input field.
 */
function toggleDailySendLimitInput() {
    if (hasSendLimitCheckbox.checked) {
        dailySendLimitContainer.classList.remove('hidden');
    } else {
        dailySendLimitContainer.classList.add('hidden');
        dailySendLimitInput.value = ''; // Clear the input when hidden
    }
    // No calculateThresholds() call here, as we only want updates on button click
}

// Event Listeners
calculateButton.addEventListener('click', calculateThresholds);

// Listen for 'Enter' key press on the original send volume input
sendVolumeInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculateThresholds();
    }
});

// Listen for 'Enter' key press on the new daily send limit input
dailySendLimitInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculateThresholds();
    }
});

// Listen for changes on the 'Is there a send limit?' checkbox
hasSendLimitCheckbox.addEventListener('change', toggleDailySendLimitInput);

// Removed: dailySendLimitInput.addEventListener('input', calculateThresholds);
// The thresholds will now only update when the 'Calculate' button is clicked
// or 'Enter' is pressed in either input field.

// Initial setup and calculation when the page loads
toggleDailySendLimitInput(); // Set initial visibility of send limit input
calculateThresholds(); // Perform initial calculation
