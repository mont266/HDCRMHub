// Function to safely get and parse input values
function getInputValue(id) {
    const value = parseFloat(document.getElementById(id).value);
    return isNaN(value) ? 0 : value; // Return 0 if input is not a valid number
}

// Function to calculate percentage change (uplift/difference)
function calculatePercentageChange(control, test) {
    if (control === 0) {
        return test === 0 ? 0 : Infinity; // Handle division by zero
    }
    return ((test - control) / control) * 100;
}

// Function to format currency
function formatCurrency(value) {
    return `£${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Function to show/hide input sections based on test type
function showInputs() {
    const commercialInputs = document.getElementById('commercialInputs');
    const engagementInputs = document.getElementById('engagementInputs');
    const commercialRadio = document.getElementById('commercial');

    if (commercialRadio.checked) {
        commercialInputs.style.display = 'grid'; // Changed to grid for new layout
        engagementInputs.style.display = 'none';
    } else {
        commercialInputs.style.display = 'none';
        engagementInputs.style.display = 'grid'; // Changed to grid for new layout
    }
    // Hide results section when switching test types
    document.getElementById('resultsSection').classList.add('hidden');
}

// Main calculation function
function calculate() {
    const testType = document.querySelector('input[name="testType"]:checked').value;
    const resultsTable = document.getElementById('resultsTable');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const resultsSection = document.getElementById('resultsSection');

    // Clear previous results
    resultsTable.innerHTML = '';
    winnerDisplay.className = ''; // Clear previous winner class
    winnerDisplay.textContent = ''; // Clear previous winner text

    let tableContent = '';
    let hasPositiveUplift = false; // Flag to check if any metric has positive uplift
    let hasNegativeUplift = false; // Flag to check if any metric has negative uplift

    // Helper to add a row to the table
    function addRow(metric, controlVal, testVal, diff, uplift, isCurrency = false) {
        const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : '');
        const upliftClass = uplift > 0 ? 'positive' : (uplift < 0 ? 'negative' : '');

        // Set flags for overall winner determination based on *this* row's uplift
        // These flags will be used later to determine the overall winner,
        // with specific weighting for engagement tests.
        if (uplift > 0) {
            hasPositiveUplift = true;
        } else if (uplift < 0) {
            hasNegativeUplift = true;
        }

        let controlDisplay;
        let testDisplay;

        // Determine if the metric itself is a percentage rate (e.g., "Open Rate (%)")
        const isRatePercentage = metric.includes('(%)');

        if (isCurrency) {
            controlDisplay = formatCurrency(controlVal);
            testDisplay = formatCurrency(testVal);
        } else if (isRatePercentage) {
            controlDisplay = `${controlVal.toFixed(2)}%`;
            testDisplay = `${testVal.toFixed(2)}%`;
        } else {
            // For metrics like Unique Opens/Clicks, display as raw numbers
            controlDisplay = controlVal.toLocaleString(); // Format as number with commas
            testDisplay = testVal.toLocaleString();      // Format as number with commas
        }

        let diffDisplay = isCurrency ? formatCurrency(diff) : `${uplift.toFixed(2)}%`; // Difference column now always shows uplift percentage
        let upliftDisplay = uplift === Infinity ? 'N/A' : `${uplift.toFixed(2)}%`;

        // Special handling for IPP percentage difference in brackets
        if (metric.includes('IPP')) {
            diffDisplay = `${formatCurrency(diff)} (${uplift.toFixed(2)}%)`; // Value difference (percentage difference)
            upliftDisplay = ''; // No separate uplift column for IPP
        }

        tableContent += `
            <tr>
                <td>${metric}</td>
                <td>${controlDisplay}</td>
                <td>${testDisplay}</td>
                <td class="${diffClass}">${diffDisplay}</td>
                <td class="${upliftClass}">${upliftDisplay}</td>
            </tr>
        `;
    }

    if (testType === 'commercial') {
        // Commercial Test Calculations
        const controlSRR = getInputValue('controlSRR');
        const testSRR = getInputValue('testSRR');
        const controlMRR = getInputValue('controlMRR');
        const testMRR = getInputValue('testMRR');
        const controlIPP = getInputValue('controlIPP');
        const testIPP = getInputValue('testIPP');

        const srrDiff = testSRR - controlSRR;
        const srrUplift = calculatePercentageChange(controlSRR, testSRR);

        const mrrDiff = testMRR - controlMRR;
        const mrrUplift = calculatePercentageChange(controlMRR, testMRR);

        const ippDiffValue = testIPP - controlIPP;
        const ippUplift = calculatePercentageChange(controlIPP, testIPP); // This is the percentage difference for IPP

        tableContent += `
            <tr>
                <th>Metric</th>
                <th>Control</th>
                <th>Test</th>
                <th>Difference</th>
                <th>Uplift (%)</th>
            </tr>
        `;
        addRow('SRR (%)', controlSRR, testSRR, srrDiff, srrUplift);
        addRow('MRR (%)', controlMRR, testMRR, mrrDiff, mrrUplift);
        addRow('IPP (£)', controlIPP, testIPP, ippDiffValue, ippUplift, true); // IPP has special display

    } else { // Engagement Test
        // Engagement Test Calculations
        const controlUniqueOpens = getInputValue('controlUniqueOpens');
        const testUniqueOpens = getInputValue('testUniqueOpens');
        const controlOpenRate = getInputValue('controlOpenRate');
        const testOpenRate = getInputValue('testOpenRate');
        const controlUniqueClicks = getInputValue('controlUniqueClicks');
        const testUniqueClicks = getInputValue('testUniqueClicks');
        const controlCTR = getInputValue('controlCTR');
        const testCTR = getInputValue('testCTR');

        const uniqueOpensDiff = testUniqueOpens - controlUniqueOpens;
        const uniqueOpensUplift = calculatePercentageChange(controlUniqueOpens, testUniqueOpens);

        const openRateDiff = testOpenRate - controlOpenRate;
        const openRateUplift = calculatePercentageChange(controlOpenRate, testOpenRate);

        const uniqueClicksDiff = testUniqueClicks - controlUniqueClicks;
        const uniqueClicksUplift = calculatePercentageChange(controlUniqueClicks, testUniqueClicks);

        const ctrDiff = testCTR - controlCTR;
        const ctrUplift = calculatePercentageChange(controlCTR, testCTR);

        tableContent += `
            <tr>
                <th>Metric</th>
                <th>Control</th>
                <th>Test</th>
                <th>Difference</th>
                <th>Uplift (%)</th>
            </tr>
        `;
        addRow('Unique Opens', controlUniqueOpens, testUniqueOpens, uniqueOpensDiff, uniqueOpensUplift);
        addRow('Open Rate (%)', controlOpenRate, testOpenRate, openRateDiff, openRateUplift);
        addRow('Unique Clicks', controlUniqueClicks, testUniqueClicks, uniqueClicksDiff, uniqueClicksUplift);
        addRow('Click Through Rate (%)', controlCTR, testCTR, ctrDiff, ctrUplift);

        // --- Modified Winner Determination Logic for Engagement Tests ---
        // Reset flags for engagement test specific weighting
        hasPositiveUplift = false;
        hasNegativeUplift = false;

        // Prioritize Open Rate and Click Through Rate for winner determination
        if (openRateUplift > 0 || ctrUplift > 0) {
            hasPositiveUplift = true;
        }
        if (openRateUplift < 0 || ctrUplift < 0) {
            hasNegativeUplift = true;
        }

        // If Open Rate and CTR don't show a clear win/loss, then consider unique counts
        if (!hasPositiveUplift && !hasNegativeUplift) {
            if (uniqueOpensUplift > 0 || uniqueClicksUplift > 0) {
                hasPositiveUplift = true;
            }
            if (uniqueOpensUplift < 0 || uniqueClicksUplift < 0) {
                hasNegativeUplift = true;
            }
        }
        // --- End Modified Winner Determination Logic ---
    }

    resultsTable.innerHTML = tableContent;
    resultsSection.classList.remove('hidden'); // Show results section

    // Determine and display overall winner
    if (hasPositiveUplift && !hasNegativeUplift) {
        winnerDisplay.textContent = 'Test wins!';
        winnerDisplay.classList.add('winner-test');
    } else if (hasNegativeUplift && !hasPositiveUplift) {
        winnerDisplay.textContent = 'Control wins!';
        winnerDisplay.classList.add('winner-control');
    } else if (hasPositiveUplift && hasNegativeUplift) {
        winnerDisplay.textContent = 'Mixed results - further analysis needed!';
        winnerDisplay.classList.add('winner-neutral');
    }
    else {
        winnerDisplay.textContent = 'No significant difference.';
        winnerDisplay.classList.add('winner-neutral');
    }
}

// Initialize inputs display on page load
window.onload = showInputs;
