// Get references to the input elements, output display elements, and the calculate button
const sendVolumeInput = document.getElementById('sendVolume');
const globalControlCheckbox = document.getElementById('globalControl');
const lowerThresholdDisplay = document.getElementById('lowerThreshold');
const upperThresholdDisplay = document.getElementById('upperThreshold');
const calculateButton = document.getElementById('calculateButton'); // Reference to the calculate button

/**
 * Calculates and displays the lower and upper thresholds based on send volume and global control.
 */
function calculateThresholds() {
    // Log to console to confirm this function is being called
    console.log('Calculating thresholds...');

    // Get the numerical value from the send volume input.
    // Use parseFloat to ensure it's a number. If the input is empty or not a valid number,
    // parseFloat will return NaN (Not-a-Number), which defaults to 0 using the || operator.
    const sendVolume = parseFloat(sendVolumeInput.value) || 0;
    console.log('Send Volume:', sendVolume);

    // Get the checked state of the global control checkbox
    const isGlobalControlTicked = globalControlCheckbox.checked;
    console.log('Global Control Ticked:', isGlobalControlTicked);

    let lowerThresholdPercentage; // These will store the percentage rates (e.g., 0.11, 0.01)
    let upperThresholdPercentage;

    // Determine the percentage rates based on the global control state
    if (isGlobalControlTicked) {
        // If global control is ticked:
        // Lower threshold = 11%
        // Upper threshold = 1%
        lowerThresholdPercentage = 0.11;
        upperThresholdPercentage = 0.01;
    } else {
        // If global control is not ticked:
        // Lower threshold = 2%
        // Upper threshold = 1%
        lowerThresholdPercentage = 0.02;
        upperThresholdPercentage = 0.01;
    }

    // Calculate the actual threshold amounts
    const lowerThresholdAmount = sendVolume * lowerThresholdPercentage;
    const upperThresholdAmount = sendVolume * upperThresholdPercentage;

    // Calculate the final displayed values: send volume + threshold amount
    const displayedLowerThreshold = sendVolume + lowerThresholdAmount;
    const displayedUpperThreshold = sendVolume + upperThresholdAmount;

    // Round down the results to the nearest whole number (no decimal points)
    // Then, format the numbers with comma separators for thousands
    lowerThresholdDisplay.textContent = Math.floor(displayedLowerThreshold).toLocaleString();
    upperThresholdDisplay.textContent = Math.floor(displayedUpperThreshold).toLocaleString();

    console.log('Lower Threshold Percentage:', lowerThresholdPercentage * 100 + '%');
    console.log('Upper Threshold Percentage:', upperThresholdPercentage * 100 + '%');
    console.log('Lower Threshold Amount:', lowerThresholdAmount.toFixed(2));
    console.log('Upper Threshold Amount:', upperThresholdAmount.toFixed(2));
    console.log('Displayed Lower Threshold (rounded down and formatted):', Math.floor(displayedLowerThreshold).toLocaleString());
    console.log('Displayed Upper Threshold (rounded down and formatted):', Math.floor(displayedUpperThreshold).toLocaleString());
}

// Attach an event listener to the "Calculate" button.
// The 'click' event will trigger the calculateThresholds function.
calculateButton.addEventListener('click', calculateThresholds);

// Add an event listener to the sendVolume input field to detect 'Enter' key presses.
sendVolumeInput.addEventListener('keydown', function(event) {
    // Check if the pressed key is 'Enter' (key code 13 for older browsers, 'Enter' for modern).
    if (event.key === 'Enter') {
        // Prevent the default action (e.g., form submission if it were part of a form)
        event.preventDefault();
        // Trigger the calculation
        calculateThresholds();
    }
});

// Initial calculation when the page loads.
// This ensures that default values (0.00) are displayed even before the user interacts.
calculateThresholds();
