/**
 * ===================================================================
 * SafeCare - Core Engine & Interactive Matrix Calculator
 * Implements Dijkstra's Banker's Algorithm and Concurrency Control
 * Logic directly matching SafeCare.java
 * ===================================================================
 */

// ================= STATE & CONFIGURATION =================
const RESOURCES = 4;
const resourceNames = [
    "ICU Beds", "Ventilators", "Oxygen Units", "Monitoring Devices"
];

// Total resource capacity vector (default from SafeCare.java line 19)
let total = [5, 3, 4, 6];

// Active patient names (dynamic array)
let patientNames = [
    "Patient P1", "Patient P2", "Patient P3",
    "Patient P4", "Patient P5"
];

// Maximum resource requirements matrix (default from SafeCare.java line 22)
let max = [
    [1, 1, 1, 2],
    [1, 1, 2, 2],
    [1, 1, 1, 1],
    [1, 0, 2, 1],
    [1, 0, 1, 2]
];

// Current resource allocation matrix (default from SafeCare.java line 31)
let allocation = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];

// Available vector
let available = new Array(RESOURCES).fill(0);

// Concurrency demonstration state
let concurrencyTimer = null;
let threadStep = 0;

// ================= BANKER'S ALGORITHM CORE LOGIC (SafeCare.java) =================

/**
 * Calculates available resources: Available[j] = Total[j] - Sum(Allocation[i][j])
 * Directly matching SafeCare.calculateAvailable() (Line 41)
 */
function calculateAvailable() {
    const numPatients = max.length;
    for (let j = 0; j < RESOURCES; j++) {
        let allocatedTotal = 0;
        for (let i = 0; i < numPatients; i++) {
            allocatedTotal += allocation[i][j];
        }
        available[j] = total[j] - allocatedTotal;
    }
}

/**
 * Calculates remaining need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 * Directly matching SafeCare.calculateNeed() (Line 51)
 */
function calculateNeed() {
    const numPatients = max.length;
    const need = [];
    for (let i = 0; i < numPatients; i++) {
        need[i] = [];
        for (let j = 0; j < RESOURCES; j++) {
            need[i][j] = max[i][j] - allocation[i][j];
        }
    }
    return need;
}

/**
 * Formats vector as string, matching SafeCare.arrayToString() (Line 61)
 */
function arrayToString(values) {
    return "[" + values.join(", ") + "]";
}

/**
 * Formats sequence as string, matching SafeCare.sequenceToString() (Line 202)
 */
function sequenceToString(sequence, length) {
    const parts = [];
    for (let i = 0; i < length; i++) {
        parts.push("P" + (sequence[i] + 1));
    }
    return parts.join(" -> ");
}

/**
 * Banker's Safety Algorithm
 * Directly matching SafeCare.isSafe(boolean showCalculation) (Line 112)
 */
function isSafe(showCalculation = true) {
    calculateAvailable();
    const need = calculateNeed();
    const numPatients = max.length;

    // Check if available vector has negative numbers (overallocation)
    const hasNegativeAvailable = available.some(val => val < 0);

    const work = [...available];
    const finish = new Array(numPatients).fill(false);
    const safeSequence = new Array(numPatients).fill(0);
    let count = 0;

    const logLines = [];
    const traceSteps = [];

    if (showCalculation) {
        logLines.push("========== BANKER'S SAFETY CALCULATION ==========");
        logLines.push("Step 0: Work = Available = " + arrayToString(work));
        logLines.push("Need = Max - Allocation");
        for (let i = 0; i < numPatients; i++) {
            logLines.push("P" + (i + 1) + ": " + arrayToString(max[i])
                + " - " + arrayToString(allocation[i])
                + " = " + arrayToString(need[i]));
        }
    }

    if (hasNegativeAvailable) {
        logLines.push("\nUNSAFE STATE: Total allocated resources exceed Total capacity!");
        return {
            safe: false,
            safeSequence: [],
            count: 0,
            logs: logLines,
            steps: [],
            finalWork: work,
            finish: finish,
            reason: "Total allocated units exceed hospital capacity."
        };
    }

    while (count < numPatients) {
        let found = false;

        for (let i = 0; i < numPatients; i++) {
            if (finish[i]) {
                continue;
            }

            let canFinish = true;
            for (let j = 0; j < RESOURCES; j++) {
                if (need[i][j] > work[j]) {
                    canFinish = false;
                    break;
                }
            }

            if (showCalculation) {
                logLines.push("");
                logLines.push("Checking P" + (i + 1) + ": Need "
                    + arrayToString(need[i]) + " <= Work "
                    + arrayToString(work) + " ?");
            }

            const stepRecord = {
                iteration: count,
                patientIndex: i,
                workBefore: [...work],
                need: [...need[i]],
                allocation: [...allocation[i]],
                canFinish: canFinish
            };

            if (canFinish) {
                if (showCalculation) {
                    logLines.push("Result: YES. P" + (i + 1) + " can finish.");
                    logLines.push("Release its current Allocation " + arrayToString(allocation[i]));
                }

                for (let j = 0; j < RESOURCES; j++) {
                    work[j] += allocation[i][j];
                }

                finish[i] = true;
                safeSequence[count] = i;
                count++;
                found = true;

                stepRecord.workAfter = [...work];
                stepRecord.sequenceSoFar = safeSequence.slice(0, count);

                if (showCalculation) {
                    logLines.push("New Work = Previous Work + Allocation");
                    logLines.push("         = " + arrayToString(work)
                        + " (after releasing P" + (i + 1) + "'s resources)");
                    logLines.push("Safe sequence so far: " + sequenceToString(safeSequence, count));
                }
            } else if (showCalculation) {
                logLines.push("Result: NO. At least one Need value is greater than Work; check another process.");
                stepRecord.workAfter = [...work];
                stepRecord.sequenceSoFar = safeSequence.slice(0, count);
            }

            traceSteps.push(stepRecord);
        }

        if (!found) {
            if (showCalculation) {
                logLines.push("");
                logLines.push("UNSAFE STATE: no unfinished process can satisfy Need <= Work.");
                logLines.push("No complete safe sequence exists.");
            }
            return {
                safe: false,
                safeSequence: safeSequence.slice(0, count),
                count: count,
                logs: logLines,
                steps: traceSteps,
                finalWork: work,
                finish: finish,
                reason: "Deadlock risk: No safe sequence found."
            };
        }
    }

    if (showCalculation) {
        logLines.push("");
        logLines.push("========== FINAL RESULT ==========");
        logLines.push("System is in a SAFE STATE.");
        logLines.push("Safe sequence: " + sequenceToString(safeSequence, count));
    }

    return {
        safe: true,
        safeSequence: safeSequence.slice(0, count),
        count: count,
        logs: logLines,
        steps: traceSteps,
        finalWork: work,
        finish: finish
    };
}

/**
 * Request Resources logic from SafeCare.requestResources() (Line 213)
 */
function handleRequestResources(patient, request) {
    const logs = [];
    logs.push(`Initiating resource request for ${patientNames[patient]} (P${patient + 1}):`);
    logs.push(`Requested: ${arrayToString(request)}`);

    for (let j = 0; j < RESOURCES; j++) {
        if (request[j] < 0) {
            logs.push("Request cancelled: quantities cannot be negative.");
            return { success: false, reason: "Negative quantity entered.", logs };
        }
    }

    // Condition 1: Request <= Need
    const need = calculateNeed();
    for (let j = 0; j < RESOURCES; j++) {
        if (request[j] > need[patient][j]) {
            logs.push("Request rejected: request exceeds remaining Need.");
            logs.push("Current Need: " + arrayToString(need[patient]));
            return {
                success: false,
                reason: `Request exceeds remaining Need for ${resourceNames[j]} (${request[j]} > ${need[patient][j]})`,
                logs
            };
        }
    }

    // Condition 2: Request <= Available
    calculateAvailable();
    for (let j = 0; j < RESOURCES; j++) {
        if (request[j] > available[j]) {
            logs.push("Request rejected: insufficient Available resources.");
            logs.push("Available: " + arrayToString(available));
            return {
                success: false,
                reason: `Insufficient Available units for ${resourceNames[j]} (${request[j]} requested, only ${available[j]} available)`,
                logs
            };
        }
    }

    logs.push("Request passed Need and Available checks.");
    logs.push("Temporarily allocating " + arrayToString(request) + " to P" + (patient + 1) + "...");

    // Tentative allocation
    for (let j = 0; j < RESOURCES; j++) {
        allocation[patient][j] += request[j];
    }

    // Run Safety Algorithm on tentative state
    const safetyResult = isSafe(true);
    logs.push(...safetyResult.logs);

    if (safetyResult.safe) {
        logs.push("REQUEST ACCEPTED: resulting state is safe.");
        return {
            success: true,
            safeSequence: safetyResult.safeSequence,
            reason: "Safe state verified. Resources successfully allocated.",
            logs
        };
    } else {
        // Rollback
        for (let j = 0; j < RESOURCES; j++) {
            allocation[patient][j] -= request[j];
        }
        logs.push("REQUEST REJECTED: resulting state is unsafe.");
        logs.push("Rollback completed; previous allocation restored.");
        return {
            success: false,
            rollback: true,
            reason: "Unsafe state detected. Automatic rollback completed to avoid deadlock.",
            logs
        };
    }
}

/**
 * Release Resources logic from SafeCare.releaseResources() (Line 277)
 */
function handleReleaseResources(patient, release) {
    const logs = [];
    logs.push(`Initiating resource release for ${patientNames[patient]} (P${patient + 1}):`);
    logs.push(`Releasing: ${arrayToString(release)}`);

    for (let j = 0; j < RESOURCES; j++) {
        if (release[j] < 0 || release[j] > allocation[patient][j]) {
            logs.push("Invalid release. It cannot be negative or exceed allocation.");
            return {
                success: false,
                reason: `Invalid release quantity for ${resourceNames[j]}. Held: ${allocation[patient][j]}, requested release: ${release[j]}`,
                logs
            };
        }
    }

    for (let j = 0; j < RESOURCES; j++) {
        allocation[patient][j] -= release[j];
    }

    logs.push("Resources released successfully.");
    calculateAvailable();
    return {
        success: true,
        reason: "Resources successfully released and returned to Available pool.",
        logs
    };
}

/**
 * Resource utilization calculations matching SafeCare.utilizationReport() (Line 312)
 */
function getUtilizationData() {
    calculateAvailable();
    const reports = [];
    for (let j = 0; j < RESOURCES; j++) {
        const used = total[j] - available[j];
        const percent = total[j] > 0 ? (used * 100.0) / total[j] : 0;
        reports.push({
            name: resourceNames[j],
            used: used,
            total: total[j],
            available: available[j],
            percent: Math.min(Math.max(percent, 0), 100)
        });
    }
    return reports;
}

// ================= DYNAMIC UI RENDERING & CALCULATOR =================

/**
 * Re-renders the entire editable matrix table and updates all calculated values.
 */
function renderMatrixTable() {
    calculateAvailable();
    const need = calculateNeed();
    const tbody = document.getElementById("bankersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    const numPatients = max.length;

    for (let i = 0; i < numPatients; i++) {
        const tr = document.createElement("tr");

        const isFinished = need[i].every(val => val === 0);
        const statusBadgeHtml = isFinished
            ? `<span class="status-badge status-satisfied">Satisfied</span>`
            : `<span class="status-badge status-pending">In Care</span>`;

        // Patient column with dynamic name
        let rowHtml = `
            <td class="patient-cell">
                <span class="p-code">P${i + 1}</span> ${patientNames[i]}
            </td>
        `;

        // 4 Editable Max cells
        for (let j = 0; j < RESOURCES; j++) {
            rowHtml += `
                <td>
                    <input type="number" min="0" max="99" value="${max[i][j]}" 
                           class="matrix-input max-in" data-patient="${i}" data-resource="${j}" data-type="max"
                           title="Max required for ${resourceNames[j]}">
                </td>
            `;
        }

        // 4 Editable Allocation cells
        for (let j = 0; j < RESOURCES; j++) {
            const isInvalid = allocation[i][j] > max[i][j];
            const invalidClass = isInvalid ? "invalid-cell" : "";
            rowHtml += `
                <td>
                    <input type="number" min="0" max="99" value="${allocation[i][j]}" 
                           class="matrix-input alloc-in ${invalidClass}" data-patient="${i}" data-resource="${j}" data-type="alloc"
                           title="Allocated ${resourceNames[j]} (Held: ${allocation[i][j]}, Max: ${max[i][j]})">
                </td>
            `;
        }

        // 4 Calculated Need cells
        for (let j = 0; j < RESOURCES; j++) {
            const needVal = need[i][j];
            const needDisplay = needVal < 0 ? `⚠️ ${needVal}` : needVal;
            rowHtml += `
                <td class="matrix-cell cell-need" id="need-${i}-${j}">${needDisplay}</td>
            `;
        }

        // Status & Delete action
        rowHtml += `
            <td>${statusBadgeHtml}</td>
            <td>
                <button class="del-row-btn" data-patient="${i}" title="Remove Patient P${i + 1}">✖</button>
            </td>
        `;

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    }

    // Attach event listeners to all matrix inputs
    const inputs = tbody.querySelectorAll(".matrix-input");
    inputs.forEach(input => {
        input.addEventListener("input", handleMatrixInputChange);
    });

    // Attach delete button listeners
    const delButtons = tbody.querySelectorAll(".del-row-btn");
    delButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const pIdx = parseInt(e.currentTarget.getAttribute("data-patient"), 10);
            removePatient(pIdx);
        });
    });

    updateSummaryRows();
}

/**
 * Handles real-time input change inside the Banker's Matrix table
 */
function handleMatrixInputChange(e) {
    const input = e.target;
    const p = parseInt(input.getAttribute("data-patient"), 10);
    const r = parseInt(input.getAttribute("data-resource"), 10);
    const type = input.getAttribute("data-type");
    let val = parseInt(input.value || 0, 10);
    if (isNaN(val) || val < 0) val = 0;

    if (type === "max") {
        max[p][r] = val;
    } else if (type === "alloc") {
        allocation[p][r] = val;
    }

    // Check if allocation > max
    if (allocation[p][r] > max[p][r]) {
        input.classList.add("invalid-cell");
    } else {
        input.classList.remove("invalid-cell");
    }

    // Live update calculations
    updateCalculatedState();
}

/**
 * Updates summary rows: Total Allocated and Available
 */
function updateSummaryRows() {
    calculateAvailable();
    const numPatients = max.length;
    let anyOverallocation = false;

    for (let j = 0; j < RESOURCES; j++) {
        let allocSum = 0;
        for (let i = 0; i < numPatients; i++) {
            allocSum += allocation[i][j];
        }

        const totAllocEl = document.getElementById(`tot-alloc-${j}`);
        const curAvailEl = document.getElementById(`cur-avail-${j}`);

        if (totAllocEl) totAllocEl.textContent = allocSum;
        if (curAvailEl) {
            curAvailEl.textContent = available[j];
            if (available[j] < 0) {
                curAvailEl.style.color = "var(--danger)";
                anyOverallocation = true;
            } else {
                curAvailEl.style.color = "var(--col-avail)";
            }
        }
    }

    const capBadge = document.getElementById("capacityCheckBadge");
    const availChip = document.getElementById("availStateChip");

    if (anyOverallocation) {
        if (capBadge) {
            capBadge.textContent = "Overallocated!";
            capBadge.className = "badge-foot danger-chip";
        }
        if (availChip) {
            availChip.textContent = "Exceeds Capacity";
            availChip.className = "badge-foot danger-chip";
        }
    } else {
        if (capBadge) {
            capBadge.textContent = "Capacity Normal";
            capBadge.className = "badge-foot safe-chip";
        }
        if (availChip) {
            availChip.textContent = "All Resources Ready";
            availChip.className = "badge-foot safe-chip";
        }
    }
}

/**
 * Master calculation update: recalculates Need, Available, Safety status, KPI bars, and UI indicators
 */
function updateCalculatedState() {
    calculateAvailable();
    const need = calculateNeed();
    const numPatients = max.length;

    // Update Need cells in matrix table directly without re-rendering inputs (preserves input focus)
    for (let i = 0; i < numPatients; i++) {
        for (let j = 0; j < RESOURCES; j++) {
            const cell = document.getElementById(`need-${i}-${j}`);
            if (cell) {
                const nVal = need[i][j];
                cell.textContent = nVal < 0 ? `⚠️ ${nVal}` : nVal;
                cell.style.color = nVal < 0 ? "var(--danger)" : "var(--col-need)";
            }
        }
    }

    updateSummaryRows();

    // Run safety evaluation
    const safetyAudit = isSafe(false);

    // Update Global Header State
    const stateText = document.getElementById("systemStateText");
    const statusCard = document.getElementById("systemStatusCard");
    if (safetyAudit.safe) {
        stateText.textContent = "SAFE STATE";
        stateText.className = "status-value safe-text";
        statusCard.classList.remove("unsafe-card");
    } else {
        stateText.textContent = "UNSAFE STATE";
        stateText.className = "status-value unsafe-text";
        statusCard.classList.add("unsafe-card");
    }

    // Update KPI Ribbon
    const utilData = getUtilizationData();
    for (let j = 0; j < RESOURCES; j++) {
        const kpiVal = document.getElementById(`kpi-res-${j}`);
        const kpiBar = document.getElementById(`kpi-bar-${j}`);
        if (kpiVal) kpiVal.textContent = `${available[j]} / ${total[j]} Avail`;
        if (kpiBar) kpiBar.style.width = `${utilData[j].percent}%`;
    }

    const safeSeqDisplay = document.getElementById("activeSafeSeqDisplay");
    if (safeSeqDisplay) {
        safeSeqDisplay.textContent = safetyAudit.safe
            ? sequenceToString(safetyAudit.safeSequence, safetyAudit.safeSequence.length)
            : "No Safe Sequence (Deadlock Risk)";
        safeSeqDisplay.style.color = safetyAudit.safe ? "var(--safe)" : "var(--danger)";
    }

    // Update Resource Dashboard Cards
    for (let j = 0; j < RESOURCES; j++) {
        const cAlloc = document.getElementById(`card-alloc-${j}`);
        const cAvail = document.getElementById(`card-avail-${j}`);
        const cUtil = document.getElementById(`card-util-${j}`);
        const cBar = document.getElementById(`card-bar-${j}`);
        const cBadge = document.getElementById(`card-badge-${j}`);

        if (cAlloc) cAlloc.textContent = total[j] - available[j];
        if (cAvail) cAvail.textContent = available[j];
        if (cUtil) cUtil.textContent = `${utilData[j].percent.toFixed(1)}%`;
        if (cBar) cBar.style.width = `${utilData[j].percent}%`;
        if (cBadge) cBadge.textContent = `Total: ${total[j]}`;
    }

    // Update Vectors in Table Header
    const availVecEl = document.getElementById("availVectorText");
    if (availVecEl) availVecEl.textContent = arrayToString(available);
    const totVecEl = document.getElementById("totalVectorDisplay");
    if (totVecEl) totVecEl.textContent = arrayToString(total);

    // Update Utilization Section
    const utilContainer = document.getElementById("utilReportContainer");
    if (utilContainer) {
        utilContainer.innerHTML = "";
        utilData.forEach(item => {
            const row = document.createElement("div");
            row.className = "util-bar-row";
            row.innerHTML = `
                <div class="util-row-top">
                    <span class="util-name">${item.name}</span>
                    <span class="util-calc">${item.used}/${item.total} allocated (${item.percent.toFixed(2)}%)</span>
                </div>
                <div class="util-track">
                    <div class="util-fill" style="width: ${item.percent}%"></div>
                </div>
            `;
            utilContainer.appendChild(row);
        });
    }

    // Update Request/Release Select Dropdowns and Patient Overview
    refreshPatientDropdowns();
    updateRequestFormOverview();
    updateReleaseFormOverview();
}

/**
 * Adds a new patient/process dynamically
 */
function addPatient() {
    const nextIdx = max.length + 1;
    patientNames.push(`Patient P${nextIdx}`);
    max.push([1, 1, 1, 1]); // default claim
    allocation.push([0, 0, 0, 0]); // initially zero allocation

    renderMatrixTable();
    updateCalculatedState();
    appendTerminalLine(`Added new process: Patient P${nextIdx} (Total: ${max.length} patients)`, "term-sys");
}

/**
 * Removes a patient/process by index
 */
function removePatient(index) {
    if (max.length <= 1) {
        alert("You must have at least one patient in the hospital model.");
        return;
    }
    const removedName = patientNames[index];
    patientNames.splice(index, 1);
    max.splice(index, 1);
    allocation.splice(index, 1);

    // Rename patients P1..Pn consistently
    for (let i = 0; i < max.length; i++) {
        patientNames[i] = `Patient P${i + 1}`;
    }

    renderMatrixTable();
    updateCalculatedState();
    appendTerminalLine(`Removed ${removedName}. (Remaining: ${max.length} patients)`, "term-sys");
}

/**
 * Refreshes options in the Request and Release patient select dropdowns
 */
function refreshPatientDropdowns() {
    const reqSel = document.getElementById("reqPatientSelect");
    const relSel = document.getElementById("relPatientSelect");

    const buildOptions = (sel) => {
        if (!sel) return;
        const currentVal = parseInt(sel.value || 0, 10);
        sel.innerHTML = "";
        for (let i = 0; i < max.length; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = `${patientNames[i]}`;
            sel.appendChild(opt);
        }
        if (currentVal < max.length) {
            sel.value = currentVal;
        } else {
            sel.value = 0;
        }
    };

    buildOptions(reqSel);
    buildOptions(relSel);
}

// ================= REQUEST & RELEASE FORMS LOGIC =================

function updateRequestFormOverview() {
    const sel = document.getElementById("reqPatientSelect");
    if (!sel || max.length === 0) return;
    const p = Math.min(parseInt(sel.value || 0, 10), max.length - 1);
    const need = calculateNeed();

    document.getElementById("pstatName").textContent = patientNames[p];
    document.getElementById("pstatMax").textContent = arrayToString(max[p]);
    document.getElementById("pstatAlloc").textContent = arrayToString(allocation[p]);
    document.getElementById("pstatNeed").textContent = arrayToString(need[p]);
    document.getElementById("pstatAvail").textContent = arrayToString(available);

    document.getElementById("limitBeds").textContent = `Need: ${need[p][0]} | Avail: ${available[0]}`;
    document.getElementById("limitVent").textContent = `Need: ${need[p][1]} | Avail: ${available[1]}`;
    document.getElementById("limitOxy").textContent = `Need: ${need[p][2]} | Avail: ${available[2]}`;
    document.getElementById("limitMon").textContent = `Need: ${need[p][3]} | Avail: ${available[3]}`;

    validateLiveRequest();
}

function validateLiveRequest() {
    const sel = document.getElementById("reqPatientSelect");
    if (!sel || max.length === 0) return;
    const p = Math.min(parseInt(sel.value || 0, 10), max.length - 1);
    const need = calculateNeed();

    const req = [
        parseInt(document.getElementById("reqBeds").value || 0, 10),
        parseInt(document.getElementById("reqVent").value || 0, 10),
        parseInt(document.getElementById("reqOxy").value || 0, 10),
        parseInt(document.getElementById("reqMon").value || 0, 10)
    ];

    let cond1Valid = true;
    let cond2Valid = true;

    for (let j = 0; j < RESOURCES; j++) {
        if (req[j] > need[p][j]) cond1Valid = false;
        if (req[j] > available[j]) cond2Valid = false;
    }

    const c1 = document.getElementById("checkNeedBanner");
    const c2 = document.getElementById("checkAvailBanner");

    if (c1) {
        if (cond1Valid) {
            c1.className = "check-item";
            c1.innerHTML = `<span class="check-icon">✓</span> <span class="check-text">Condition 1: Request ≤ Need (Satisfied)</span>`;
        } else {
            c1.className = "check-item invalid";
            c1.innerHTML = `<span class="check-icon">✗</span> <span class="check-text">Condition 1: Request EXCEEDS declared Need!</span>`;
        }
    }

    if (c2) {
        if (cond2Valid) {
            c2.className = "check-item";
            c2.innerHTML = `<span class="check-icon">✓</span> <span class="check-text">Condition 2: Request ≤ Available (Satisfied)</span>`;
        } else {
            c2.className = "check-item invalid";
            c2.innerHTML = `<span class="check-icon">✗</span> <span class="check-text">Condition 2: Request EXCEEDS Available pool!</span>`;
        }
    }
}

function updateReleaseFormOverview() {
    const sel = document.getElementById("relPatientSelect");
    if (!sel || max.length === 0) return;
    const p = Math.min(parseInt(sel.value || 0, 10), max.length - 1);
    const need = calculateNeed();

    document.getElementById("relPstatName").textContent = patientNames[p];
    document.getElementById("relPstatAlloc").textContent = arrayToString(allocation[p]);
    document.getElementById("relPstatMax").textContent = arrayToString(max[p]);
    document.getElementById("relPstatAvail").textContent = arrayToString(available);
    document.getElementById("relPstatNeed").textContent = arrayToString(need[p]);

    document.getElementById("relLimitBeds").textContent = `Held: ${allocation[p][0]}`;
    document.getElementById("relLimitVent").textContent = `Held: ${allocation[p][1]}`;
    document.getElementById("relLimitOxy").textContent = `Held: ${allocation[p][2]}`;
    document.getElementById("relLimitMon").textContent = `Held: ${allocation[p][3]}`;
}

// ================= SAFETY INSPECTOR VISUALIZER =================

function renderSafetyVisualizer(audit) {
    const statusPill = document.getElementById("safetyStatusPill");
    const seqTokens = document.getElementById("safetySeqTokens");
    const auditLog = document.getElementById("safetyAuditLog");

    if (statusPill) {
        if (audit.safe) {
            statusPill.textContent = "STATE: SAFE";
            statusPill.className = "result-badge safe-badge";
        } else {
            statusPill.textContent = "STATE: UNSAFE";
            statusPill.className = "result-badge unsafe-badge";
        }
    }

    if (seqTokens) {
        seqTokens.innerHTML = "";
        if (audit.safe && audit.safeSequence.length > 0) {
            audit.safeSequence.forEach((pIdx, idx) => {
                const token = document.createElement("span");
                token.className = "seq-token";
                token.textContent = `P${pIdx + 1}`;
                seqTokens.appendChild(token);

                if (idx < audit.safeSequence.length - 1) {
                    const arrow = document.createElement("span");
                    arrow.className = "seq-arrow";
                    arrow.textContent = "→";
                    seqTokens.appendChild(arrow);
                }
            });
        } else {
            seqTokens.innerHTML = `<span style="color: var(--danger); font-family: var(--font-mono); font-size: 0.85rem;">No complete sequence satisfies Work >= Need</span>`;
        }
    }

    document.getElementById("traceWorkVector").textContent = arrayToString(audit.finalWork || available);
    document.getElementById("traceFinishVector").textContent = "[" + audit.finish.map(f => f ? "T" : "F").join(", ") + "]";
    document.getElementById("traceCount").textContent = `${audit.count} / ${max.length} Patients`;

    const cardsGrid = document.getElementById("safetyProcessCards");
    if (cardsGrid) {
        cardsGrid.innerHTML = "";
        const need = calculateNeed();

        for (let i = 0; i < max.length; i++) {
            const isFin = audit.finish[i];
            const card = document.createElement("div");
            card.className = `p-check-card ${isFin ? "finished" : "blocked"}`;
            card.id = `p-card-${i}`;

            card.innerHTML = `
                <div class="pcc-top">
                    <span class="pcc-pid">Patient P${i + 1}</span>
                    <span class="pcc-status-dot" title="${isFin ? 'Can finish' : 'Blocked'}"></span>
                </div>
                <div class="pcc-data">
                    <span>Alloc: <code>${arrayToString(allocation[i])}</code></span>
                    <span>Need: <code>${arrayToString(need[i])}</code></span>
                    <span>Status: <strong>${isFin ? 'Finished (T)' : 'Unsatisfied (F)'}</strong></span>
                </div>
            `;
            cardsGrid.appendChild(card);
        }
    }

    if (auditLog) {
        auditLog.textContent = audit.logs.join("\n");
    }
}

// Step-by-step visual simulation
let safetyStepIndex = 0;
let safetyStepData = null;

function startStepSafetySimulation() {
    safetyStepData = isSafe(true);
    safetyStepIndex = 0;
    document.getElementById("safetyStepCounter").textContent = "Step: Initialized";

    const cardsGrid = document.getElementById("safetyProcessCards");
    cardsGrid.innerHTML = "";
    const need = calculateNeed();
    for (let i = 0; i < max.length; i++) {
        const card = document.createElement("div");
        card.className = "p-check-card";
        card.id = `p-card-${i}`;
        card.innerHTML = `
            <div class="pcc-top">
                <span class="pcc-pid">Patient P${i + 1}</span>
                <span class="pcc-status-dot"></span>
            </div>
            <div class="pcc-data">
                <span>Alloc: <code>${arrayToString(allocation[i])}</code></span>
                <span>Need: <code>${arrayToString(need[i])}</code></span>
                <span id="p-status-${i}">Status: Pending</span>
            </div>
        `;
        cardsGrid.appendChild(card);
    }

    document.getElementById("traceWorkVector").textContent = arrayToString(available);
    document.getElementById("traceFinishVector").textContent = "[" + new Array(max.length).fill("F").join(", ") + "]";
    document.getElementById("traceCount").textContent = `0 / ${max.length} Patients`;
    document.getElementById("safetyAuditLog").textContent = "Starting step-by-step trace...\n";

    stepSafetySimulationNext();
}

function stepSafetySimulationNext() {
    if (!safetyStepData || safetyStepIndex >= safetyStepData.steps.length) {
        if (safetyStepData) {
            renderSafetyVisualizer(safetyStepData);
            document.getElementById("safetyStepCounter").textContent = "Step: Complete";
        }
        return;
    }

    const step = safetyStepData.steps[safetyStepIndex];
    document.getElementById("safetyStepCounter").textContent = `Step ${safetyStepIndex + 1} of ${safetyStepData.steps.length}: Evaluating P${step.patientIndex + 1}`;

    for (let i = 0; i < max.length; i++) {
        const c = document.getElementById(`p-card-${i}`);
        if (c) c.classList.remove("evaluating");
    }

    const currentCard = document.getElementById(`p-card-${step.patientIndex}`);
    if (currentCard) currentCard.classList.add("evaluating");

    document.getElementById("traceWorkVector").textContent = arrayToString(step.workAfter);

    if (step.canFinish) {
        if (currentCard) {
            currentCard.classList.remove("evaluating");
            currentCard.classList.add("finished");
            document.getElementById(`p-status-${step.patientIndex}`).textContent = "Status: FINISHED (Released Alloc)";
        }
    } else {
        if (currentCard) {
            currentCard.classList.add("blocked");
            document.getElementById(`p-status-${step.patientIndex}`).textContent = "Status: Need > Work (Skipped)";
        }
    }

    const auditLog = document.getElementById("safetyAuditLog");
    auditLog.textContent += `\n[Step ${safetyStepIndex + 1}] Checking P${step.patientIndex + 1}: Need ${arrayToString(step.need)} <= Work ${arrayToString(step.workBefore)}? `
        + (step.canFinish ? `YES -> New Work: ${arrayToString(step.workAfter)}` : `NO (Wait)`);
    auditLog.scrollTop = auditLog.scrollHeight;

    safetyStepIndex++;
}

// ================= CONCURRENCY SIMULATION =================

const threadEvents = [
    { t1: "RUNNING", t2: "RUNNING", lock: "UNLOCKED", cs: "None", log: "Both threads active and competing for SafeCare monitor lock." },
    { t1: "HOLDING_LOCK", t2: "BLOCKED_WAITING", lock: "LOCKED_BY_T1", cs: "Thread 1", log: "Thread 1 acquired synchronized(SafeCare.class) lock! Thread 2 is blocked waiting on lock acquisition." },
    { t1: "HOLDING_LOCK", t2: "BLOCKED_WAITING", lock: "LOCKED_BY_T1", cs: "Thread 1", log: "Thread 1 executing inside Critical Section: safely verifying ICU resources & tentative state." },
    { t1: "RELEASED", t2: "HOLDING_LOCK", lock: "LOCKED_BY_T2", cs: "Thread 2", log: "Thread 1 released lock. Thread 2 wakes up and acquires the monitor lock!" },
    { t1: "TERMINATED", t2: "HOLDING_LOCK", lock: "LOCKED_BY_T2", cs: "Thread 2", log: "Thread 2 executing inside Critical Section: safely verifying second patient request." },
    { t1: "TERMINATED", t2: "TERMINATED", lock: "UNLOCKED", cs: "None", log: "Thread 2 released lock and terminated. Mutex demonstration completed with zero race conditions!" }
];

function resetThreadArena() {
    if (concurrencyTimer) clearInterval(concurrencyTimer);
    threadStep = 0;

    const t1Pod = document.getElementById("threadPod1");
    const t2Pod = document.getElementById("threadPod2");
    t1Pod.className = "thread-pod";
    t2Pod.className = "thread-pod";

    document.getElementById("t1State").textContent = "IDLE";
    document.getElementById("t2State").textContent = "IDLE";
    document.getElementById("t1StatusText").textContent = "Not Started";
    document.getElementById("t2StatusText").textContent = "Not Started";
    document.getElementById("t1LockStatus").textContent = "None";
    document.getElementById("t2LockStatus").textContent = "None";

    const lockBox = document.getElementById("mutexLockBox");
    lockBox.className = "mutex-lock-box";
    document.getElementById("lockIcon").textContent = "🔓";
    document.getElementById("lockOwnerText").textContent = "STATUS: UNLOCKED";
    document.getElementById("csActiveThread").textContent = "Active: None (Free)";

    document.getElementById("threadTimelineLog").innerHTML = `<div class="timeline-empty">Click "Launch Concurrent Threads" to view synchronized mutex execution.</div>`;
}

function runThreadStep() {
    if (threadStep >= threadEvents.length) {
        resetThreadArena();
        return;
    }

    const ev = threadEvents[threadStep];
    const t1Pod = document.getElementById("threadPod1");
    const t2Pod = document.getElementById("threadPod2");
    const lockBox = document.getElementById("mutexLockBox");

    if (ev.t1 === "RUNNING") {
        t1Pod.className = "thread-pod running";
        document.getElementById("t1State").textContent = "RUNNING";
        document.getElementById("t1StatusText").textContent = "Active in Thread Scheduler";
        document.getElementById("t1LockStatus").textContent = "Attempting to acquire lock...";
    } else if (ev.t1 === "HOLDING_LOCK") {
        t1Pod.className = "thread-pod holding-lock";
        document.getElementById("t1State").textContent = "CRITICAL_SECTION";
        document.getElementById("t1StatusText").textContent = "Inside synchronized block";
        document.getElementById("t1LockStatus").textContent = "Holding SafeCare Monitor Lock";
    } else {
        t1Pod.className = "thread-pod";
        document.getElementById("t1State").textContent = "DONE";
        document.getElementById("t1StatusText").textContent = "Execution completed";
        document.getElementById("t1LockStatus").textContent = "Released";
    }

    if (ev.t2 === "RUNNING") {
        t2Pod.className = "thread-pod running";
        document.getElementById("t2State").textContent = "RUNNING";
        document.getElementById("t2StatusText").textContent = "Active in Thread Scheduler";
        document.getElementById("t2LockStatus").textContent = "Attempting to acquire lock...";
    } else if (ev.t2 === "BLOCKED_WAITING") {
        t2Pod.className = "thread-pod blocked-waiting";
        document.getElementById("t2State").textContent = "BLOCKED";
        document.getElementById("t2StatusText").textContent = "Waiting on Lock Monitor";
        document.getElementById("t2LockStatus").textContent = "Blocked (Lock owned by T1)";
    } else if (ev.t2 === "HOLDING_LOCK") {
        t2Pod.className = "thread-pod holding-lock";
        document.getElementById("t2State").textContent = "CRITICAL_SECTION";
        document.getElementById("t2StatusText").textContent = "Inside synchronized block";
        document.getElementById("t2LockStatus").textContent = "Holding SafeCare Monitor Lock";
    } else {
        t2Pod.className = "thread-pod";
        document.getElementById("t2State").textContent = "DONE";
        document.getElementById("t2StatusText").textContent = "Execution completed";
        document.getElementById("t2LockStatus").textContent = "Released";
    }

    if (ev.lock === "UNLOCKED") {
        lockBox.className = "mutex-lock-box";
        document.getElementById("lockIcon").textContent = "🔓";
        document.getElementById("lockOwnerText").textContent = "STATUS: UNLOCKED";
    } else {
        lockBox.className = "mutex-lock-box locked";
        document.getElementById("lockIcon").textContent = "🔒";
        document.getElementById("lockOwnerText").textContent = ev.lock.replace("_", " ");
    }

    document.getElementById("csActiveThread").textContent = `Active: ${ev.cs}`;

    const logList = document.getElementById("threadTimelineLog");
    if (threadStep === 0) logList.innerHTML = "";
    const entry = document.createElement("div");
    entry.className = "timeline-entry";
    entry.textContent = `[T+${threadStep * 200}ms] ${ev.log}`;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;

    appendTerminalLine(`[Concurrency] ${ev.log}`, "term-sys");
    threadStep++;
}

function launchConcurrentThreads() {
    resetThreadArena();
    runThreadStep();
    concurrencyTimer = setInterval(() => {
        if (threadStep >= threadEvents.length) {
            clearInterval(concurrencyTimer);
        } else {
            runThreadStep();
        }
    }, 1100);
}

// ================= THEME TOGGLE (DARK / LIGHT) =================

function initTheme() {
    const savedTheme = localStorage.getItem("safecare-theme") || "dark";
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(newTheme);
            localStorage.setItem("safecare-theme", newTheme);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const themeIcon = document.getElementById("themeIcon");
    const themeText = document.getElementById("themeText");

    if (theme === "light") {
        if (themeIcon) themeIcon.textContent = "🌙";
        if (themeText) themeText.textContent = "Dark Mode";
    } else {
        if (themeIcon) themeIcon.textContent = "☀️";
        if (themeText) themeText.textContent = "Light Mode";
    }
}

// ================= PRESETS & SCENARIOS =================

function resetToJavaDefaults() {
    total = [5, 3, 4, 6];
    document.getElementById("totalBeds").value = total[0];
    document.getElementById("totalVent").value = total[1];
    document.getElementById("totalOxy").value = total[2];
    document.getElementById("totalMon").value = total[3];

    patientNames = ["Patient P1", "Patient P2", "Patient P3", "Patient P4", "Patient P5"];
    max = [
        [1, 1, 1, 2],
        [1, 1, 2, 2],
        [1, 1, 1, 1],
        [1, 0, 2, 1],
        [1, 0, 1, 2]
    ];
    allocation = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    renderMatrixTable();
    updateCalculatedState();
    renderSafetyVisualizer(isSafe(true));
    appendTerminalLine("Loaded SafeCare.java baseline initial state.", "term-success");
}

function loadSampleSafeAllocation() {
    total = [5, 3, 4, 6];
    document.getElementById("totalBeds").value = 5;
    document.getElementById("totalVent").value = 3;
    document.getElementById("totalOxy").value = 4;
    document.getElementById("totalMon").value = 6;

    allocation = [
        [1, 0, 1, 1],
        [1, 1, 0, 0],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 0, 1, 1]
    ];

    renderMatrixTable();
    updateCalculatedState();
    renderSafetyVisualizer(isSafe(true));
    appendTerminalLine("Loaded Sample Safe Allocation state.", "term-success");
}

function triggerUnsafeRequestTest() {
    allocation = [
        [1, 1, 0, 1],
        [1, 1, 1, 1],
        [1, 0, 1, 1],
        [1, 0, 1, 1],
        [0, 0, 0, 1]
    ];
    renderMatrixTable();
    updateCalculatedState();

    const patientIndex = 4; // P5
    const unsafeRequest = [1, 0, 1, 1];

    appendTerminalLine("\n--- TRIGGERING UNSAFE REQUEST TEST TO OBSERVE BANKER'S DEADLOCK AVOIDANCE ---", "term-err");
    const result = handleRequestResources(patientIndex, unsafeRequest);

    const dfBox = document.getElementById("requestDecisionBox");
    dfBox.style.display = "flex";
    if (result.success) {
        dfBox.className = "decision-feedback-box feedback-accepted";
        document.getElementById("dfTitle").textContent = "REQUEST ACCEPTED";
        document.getElementById("dfMessage").textContent = result.reason;
    } else {
        dfBox.className = "decision-feedback-box feedback-rejected";
        document.getElementById("dfTitle").textContent = "REQUEST REJECTED (DEADLOCK AVOIDED)";
        document.getElementById("dfMessage").textContent = result.reason;
        document.getElementById("dfSeq").textContent = "Resulting State: Unsafe. Automatic rollback completed.";
    }

    result.logs.forEach(l => appendTerminalLine(l, l.includes("REJECTED") ? "term-err" : ""));
    renderMatrixTable();
    updateCalculatedState();
    renderSafetyVisualizer(isSafe(true));
}

function clearAllAllocations() {
    for (let i = 0; i < allocation.length; i++) {
        allocation[i] = [0, 0, 0, 0];
    }
    renderMatrixTable();
    updateCalculatedState();
    renderSafetyVisualizer(isSafe(true));
    appendTerminalLine("Cleared all allocations to zero.", "term-sys");
}

// ================= TERMINAL CLI COMMANDS =================

function appendTerminalLine(text, cssClass = "") {
    const termBody = document.getElementById("terminalOutput");
    if (!termBody) return;
    const line = document.createElement("div");
    line.className = `term-line ${cssClass}`;
    line.textContent = text;
    termBody.appendChild(line);
    termBody.scrollTop = termBody.scrollHeight;
}

function sprintf(format, ...args) {
    let argIndex = 0;
    return format.replace(/%-?(\d+)?([sdf])/g, (match, width, type) => {
        let val = args[argIndex++];
        if (val === undefined) return match;
        val = String(val);
        if (width) {
            const w = parseInt(width, 10);
            if (match.startsWith("%-")) {
                while (val.length < w) val += " ";
            } else {
                while (val.length < w) val = " " + val;
            }
        }
        return val;
    });
}

function executeTerminalCommand(input) {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    appendTerminalLine(`SafeCare> ${input}`, "term-header");

    switch (cmd) {
        case "1":
        case "resources":
            appendTerminalLine("\n========== ICU RESOURCES ==========", "term-header");
            appendTerminalLine(sprintf("%-24s %-8s %-10s %-10s", "Resource", "Total", "Allocated", "Available"));
            for (let j = 0; j < RESOURCES; j++) {
                const allocatedTotal = total[j] - available[j];
                appendTerminalLine(sprintf("%-24s %-8d %-10d %-10d", resourceNames[j], total[j], allocatedTotal, available[j]));
            }
            break;

        case "2":
        case "table":
        case "allocation":
            const need = calculateNeed();
            calculateAvailable();
            appendTerminalLine("\n========== BANKER'S ALLOCATION TABLE ==========", "term-header");
            appendTerminalLine("Resource order: " + arrayToString(total));
            appendTerminalLine("Order: [ICU Beds, Ventilators, Oxygen Units, Monitoring Devices]\n");
            appendTerminalLine(sprintf("%-12s %-20s %-20s %-20s", "Patient", "Maximum", "Allocation", "Need"));
            for (let i = 0; i < max.length; i++) {
                appendTerminalLine(sprintf("%-12s %-20s %-20s %-20s", "P" + (i + 1), arrayToString(max[i]), arrayToString(allocation[i]), arrayToString(need[i])));
            }
            appendTerminalLine("\nAvailable = " + arrayToString(available), "term-success");
            break;

        case "5":
        case "safe":
        case "safety":
            const audit = isSafe(true);
            audit.logs.forEach(l => appendTerminalLine(l, l.includes("SAFE STATE") ? "term-success" : (l.includes("UNSAFE") ? "term-err" : "")));
            renderSafetyVisualizer(audit);
            break;

        case "6":
        case "utilization":
            const util = getUtilizationData();
            appendTerminalLine("\n========== RESOURCE UTILIZATION ==========", "term-header");
            util.forEach(u => {
                appendTerminalLine(`${u.name}: ${u.used}/${u.total} allocated (${u.percent.toFixed(2)}%)`);
            });
            break;

        case "7":
        case "concurrency":
            launchConcurrentThreads();
            break;

        case "clear":
        case "cls":
            document.getElementById("terminalOutput").innerHTML = "";
            break;

        case "reset":
            resetToJavaDefaults();
            break;

        case "help":
            appendTerminalLine("\nSafeCare Commands:", "term-header");
            appendTerminalLine("1 / resources   : View resources table");
            appendTerminalLine("2 / table       : Banker's state matrix");
            appendTerminalLine("5 / safe        : Run Banker's safety verification");
            appendTerminalLine("6 / utilization : Resource utilization report");
            appendTerminalLine("7 / concurrency : Mutex simulation");
            appendTerminalLine("reset           : Reset to Java defaults");
            appendTerminalLine("clear           : Clear terminal output");
            break;

        default:
            appendTerminalLine(`Unknown command: '${cmd}'. Type 'help' for options.`, "term-err");
            break;
    }
}

// ================= EVENT LISTENERS & INITIALIZATION =================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Theme (Dark / Light)
    initTheme();

    // 2. Initial Matrix Render
    renderMatrixTable();
    updateCalculatedState();
    renderSafetyVisualizer(isSafe(true));

    // 3. Tab Navigation
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetEl = document.getElementById(targetTab);
            if (targetEl) targetEl.classList.add("active");

            if (targetTab === "tab-safety") {
                renderSafetyVisualizer(isSafe(true));
            }
        });
    });

    // 4. Capacity Vector Input Listeners
    const capInputs = ["totalBeds", "totalVent", "totalOxy", "totalMon"];
    capInputs.forEach((id, idx) => {
        const inp = document.getElementById(id);
        if (inp) {
            inp.addEventListener("input", (e) => {
                let v = parseInt(e.target.value || 0, 10);
                if (v < 0) v = 0;
                total[idx] = v;
                updateCalculatedState();
            });
        }
    });

    // 5. Add Patient Button
    document.getElementById("btn-add-patient").addEventListener("click", addPatient);

    // 6. Action and Scenario Buttons
    document.getElementById("btn-recalculate-all").addEventListener("click", () => {
        renderMatrixTable();
        updateCalculatedState();
        renderSafetyVisualizer(isSafe(true));
        appendTerminalLine("Recalculated state and safety verification.", "term-success");
    });

    document.getElementById("scenario-initial").addEventListener("click", resetToJavaDefaults);
    document.getElementById("scenario-moderate").addEventListener("click", loadSampleSafeAllocation);
    document.getElementById("scenario-deadlock-attempt").addEventListener("click", triggerUnsafeRequestTest);
    document.getElementById("btn-clear-alloc").addEventListener("click", clearAllAllocations);

    // 7. Safety Inspector Buttons
    document.getElementById("btn-run-safety-audit").addEventListener("click", () => {
        const audit = isSafe(true);
        renderSafetyVisualizer(audit);
        appendTerminalLine("\nRunning full Banker's Safety Audit...", "term-header");
        audit.logs.forEach(l => appendTerminalLine(l));
    });

    document.getElementById("btn-step-safety-audit").addEventListener("click", startStepSafetySimulation);
    document.getElementById("btn-reset-safety-audit").addEventListener("click", () => {
        renderSafetyVisualizer(isSafe(true));
    });

    document.getElementById("btn-copy-safety-log").addEventListener("click", () => {
        const logText = document.getElementById("safetyAuditLog").textContent;
        navigator.clipboard.writeText(logText).then(() => {
            alert("Banker's mathematical proof copied to clipboard!");
        });
    });

    // 8. Request Form Listeners
    const reqPatientSel = document.getElementById("reqPatientSelect");
    if (reqPatientSel) {
        reqPatientSel.addEventListener("change", updateRequestFormOverview);
    }

    ["reqBeds", "reqVent", "reqOxy", "reqMon"].forEach(id => {
        const inp = document.getElementById(id);
        if (inp) {
            inp.addEventListener("input", validateLiveRequest);
        }
    });

    document.getElementById("btn-fill-max-need").addEventListener("click", () => {
        const p = parseInt(reqPatientSel.value, 10);
        const need = calculateNeed();
        document.getElementById("reqBeds").value = need[p][0];
        document.getElementById("reqVent").value = need[p][1];
        document.getElementById("reqOxy").value = need[p][2];
        document.getElementById("reqMon").value = need[p][3];
        validateLiveRequest();
    });

    document.getElementById("btn-submit-request").addEventListener("click", () => {
        const p = parseInt(reqPatientSel.value, 10);
        const req = [
            parseInt(document.getElementById("reqBeds").value || 0, 10),
            parseInt(document.getElementById("reqVent").value || 0, 10),
            parseInt(document.getElementById("reqOxy").value || 0, 10),
            parseInt(document.getElementById("reqMon").value || 0, 10)
        ];

        appendTerminalLine(`\n--- REQUEST INITIATED VIA MANAGER ---`, "term-header");
        const res = handleRequestResources(p, req);

        const dfBox = document.getElementById("requestDecisionBox");
        dfBox.style.display = "flex";

        if (res.success) {
            dfBox.className = "decision-feedback-box feedback-accepted";
            document.getElementById("dfTitle").textContent = "REQUEST ACCEPTED: State is safe";
            document.getElementById("dfMessage").textContent = res.reason;
            document.getElementById("dfSeq").textContent = "Identified Safe Sequence: " + sequenceToString(res.safeSequence, res.safeSequence.length);
        } else {
            dfBox.className = "decision-feedback-box feedback-rejected";
            document.getElementById("dfTitle").textContent = res.rollback ? "REQUEST REJECTED: State is unsafe" : "REQUEST REJECTED";
            document.getElementById("dfMessage").textContent = res.reason;
            document.getElementById("dfSeq").textContent = res.rollback ? "Rollback completed; previous allocation restored." : "No change made.";
        }

        res.logs.forEach(l => appendTerminalLine(l, res.success ? "term-success" : "term-err"));
        renderMatrixTable();
        updateCalculatedState();
    });

    // 9. Release Form Listeners
    const relPatientSel = document.getElementById("relPatientSelect");
    if (relPatientSel) {
        relPatientSel.addEventListener("change", updateReleaseFormOverview);
    }

    document.getElementById("btn-release-all").addEventListener("click", () => {
        const p = parseInt(relPatientSel.value, 10);
        document.getElementById("relBeds").value = allocation[p][0];
        document.getElementById("relVent").value = allocation[p][1];
        document.getElementById("relOxy").value = allocation[p][2];
        document.getElementById("relMon").value = allocation[p][3];
    });

    document.getElementById("btn-submit-release").addEventListener("click", () => {
        const p = parseInt(relPatientSel.value, 10);
        const rel = [
            parseInt(document.getElementById("relBeds").value || 0, 10),
            parseInt(document.getElementById("relVent").value || 0, 10),
            parseInt(document.getElementById("relOxy").value || 0, 10),
            parseInt(document.getElementById("relMon").value || 0, 10)
        ];

        appendTerminalLine(`\n--- RELEASE INITIATED VIA MANAGER ---`, "term-header");
        const res = handleReleaseResources(p, rel);

        const relBox = document.getElementById("releaseDecisionBox");
        relBox.style.display = "flex";

        if (res.success) {
            relBox.className = "decision-feedback-box feedback-accepted";
            document.getElementById("relDfTitle").textContent = "RESOURCES RELEASED SUCCESSFULLY";
            document.getElementById("relDfMessage").textContent = res.reason;
            document.getElementById("relBeds").value = 0;
            document.getElementById("relVent").value = 0;
            document.getElementById("relOxy").value = 0;
            document.getElementById("relMon").value = 0;
        } else {
            relBox.className = "decision-feedback-box feedback-rejected";
            document.getElementById("relDfTitle").textContent = "RELEASE REJECTED";
            document.getElementById("relDfMessage").textContent = res.reason;
        }

        res.logs.forEach(l => appendTerminalLine(l, res.success ? "term-success" : "term-err"));
        renderMatrixTable();
        updateCalculatedState();
    });

    // 10. Concurrency Listeners
    document.getElementById("btn-start-threads").addEventListener("click", launchConcurrentThreads);
    document.getElementById("btn-step-threads").addEventListener("click", runThreadStep);
    document.getElementById("btn-reset-threads").addEventListener("click", resetThreadArena);

    // 11. Terminal Listeners
    const termInput = document.getElementById("terminalInput");
    const termExecBtn = document.getElementById("btn-terminal-exec");

    if (termInput) {
        termInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                executeTerminalCommand(termInput.value);
                termInput.value = "";
            }
        });
    }

    if (termExecBtn) {
        termExecBtn.addEventListener("click", () => {
            executeTerminalCommand(termInput.value);
            termInput.value = "";
        });
    }

    document.getElementById("btn-clear-terminal").addEventListener("click", () => {
        document.getElementById("terminalOutput").innerHTML = "";
    });

    document.getElementById("btn-copy-terminal").addEventListener("click", () => {
        const text = document.getElementById("terminalOutput").innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Terminal console output copied to clipboard!");
        });
    });
});
