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

    let lowerThreshold;
    let upperThreshold;

    // Apply the calculation logic based on the global control state
    if (isGlobalControlTicked) {
        // If global control is ticked:
        // Lower threshold = 11% of send volume
        // Upper threshold = 1% of send volume
        lowerThreshold = sendVolume * 0.11;
        upperThreshold = sendVolume * 0.01;
    } else {
        // If global control is not ticked:
        // Lower threshold = 2% of send volume
        // Upper threshold = 1% of send volume
        lowerThreshold = sendVolume * 0.02;
        upperThreshold = sendVolume * 0.01;
    }

    // Round down the results to the nearest whole number (no decimal points)
    lowerThresholdDisplay.textContent = Math.floor(lowerThreshold);
    upperThresholdDisplay.textContent = Math.floor(upperThreshold);

    console.log('Lower Threshold (rounded down):', Math.floor(lowerThreshold));
    console.log('Upper Threshold (rounded down):', Math.floor(upperThreshold));
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
