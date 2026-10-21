import java.util.Scanner;

public class SafeCare {
    static final Scanner sc = new Scanner(System.in);

    static final int PATIENTS = 5;
    static final int RESOURCES = 4;

    static String[] patientNames = {
        "Patient P1", "Patient P2", "Patient P3",
        "Patient P4", "Patient P5"
    };

    static String[] resourceNames = {
        "ICU Beds", "Ventilators", "Oxygen Units", "Monitoring Devices"
    };

    // Total instances of each resource type
    static final int[] total = {5, 3, 4, 6};

    // Maximum resource requirements for each patient/process
    static final int[][] max = {
        {1, 1, 1, 2},
        {1, 1, 2, 2},
        {1, 1, 1, 1},
        {1, 0, 2, 1},
        {1, 0, 1, 2}
    };

    // Current resource allocation; initially all zero
    static final int[][] allocation = {
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0}
    };

    static int[] available = new int[RESOURCES];

    static void calculateAvailable() {
        for (int j = 0; j < RESOURCES; j++) {
            int allocatedTotal = 0;
            for (int i = 0; i < PATIENTS; i++) {
                allocatedTotal += allocation[i][j];
            }
            available[j] = total[j] - allocatedTotal;
        }
    }

    static int[][] calculateNeed() {
        int[][] need = new int[PATIENTS][RESOURCES];
        for (int i = 0; i < PATIENTS; i++) {
            for (int j = 0; j < RESOURCES; j++) {
                need[i][j] = max[i][j] - allocation[i][j];
            }
        }
        return need;
    }

    static String arrayToString(int[] values) {
        StringBuilder result = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            result.append(values[i]);
            if (i < values.length - 1) {
                result.append(", ");
            }
        }
        result.append("]");
        return result.toString();
    }

    static void displayResources() {
        calculateAvailable();
        System.out.println("\n========== ICU RESOURCES ==========");
        System.out.printf("%-24s %-8s %-10s %-10s%n",
                "Resource", "Total", "Allocated", "Available");

        for (int j = 0; j < RESOURCES; j++) {
            int allocatedTotal = total[j] - available[j];
            System.out.printf("%-24s %-8d %-10d %-10d%n",
                    resourceNames[j], total[j], allocatedTotal, available[j]);
        }
    }

    static void displayAllocation() {
        int[][] need = calculateNeed();
        calculateAvailable();

        System.out.println("\n========== BANKER'S ALLOCATION TABLE ==========");
        System.out.println("Resource order: " + arrayToString(total));
        System.out.println("Order: [ICU Beds, Ventilators, Oxygen Units, Monitoring Devices]\n");
        System.out.printf("%-12s %-20s %-20s %-20s%n",
                "Patient", "Maximum", "Allocation", "Need");

        for (int i = 0; i < PATIENTS; i++) {
            System.out.printf("%-12s %-20s %-20s %-20s%n",
                    "P" + (i + 1),
                    arrayToString(max[i]),
                    arrayToString(allocation[i]),
                    arrayToString(need[i]));
        }

        System.out.println("\nAvailable = " + arrayToString(available));
    }

    /*
     * Banker's safety algorithm.
     * When showCalculation is true, print every Work/Need comparison
     * and the resources released by each process in the simulated sequence.
     */
    static synchronized boolean isSafe(boolean showCalculation) {
        calculateAvailable();
        int[][] need = calculateNeed();

        int[] work = available.clone();
        boolean[] finish = new boolean[PATIENTS];
        int[] safeSequence = new int[PATIENTS];
        int count = 0;

        if (showCalculation) {
            System.out.println("\n========== BANKER'S SAFETY CALCULATION ==========");
            System.out.println("Step 0: Work = Available = " + arrayToString(work));
            System.out.println("Need = Max - Allocation");
            for (int i = 0; i < PATIENTS; i++) {
                System.out.println("P" + (i + 1) + ": " + arrayToString(max[i])
                        + " - " + arrayToString(allocation[i])
                        + " = " + arrayToString(need[i]));
            }
        }

        while (count < PATIENTS) {
            boolean found = false;

            for (int i = 0; i < PATIENTS; i++) {
                if (finish[i]) {
                    continue;
                }

                boolean canFinish = true;
                for (int j = 0; j < RESOURCES; j++) {
                    if (need[i][j] > work[j]) {
                        canFinish = false;
                        break;
                    }
                }

                if (showCalculation) {
                    System.out.println("\nChecking P" + (i + 1) + ": Need "
                            + arrayToString(need[i]) + " <= Work "
                            + arrayToString(work) + " ?");
                }

                if (canFinish) {
                    if (showCalculation) {
                        System.out.println("Result: YES. P" + (i + 1)
                                + " can finish.");
                        System.out.println("Release its current Allocation "
                                + arrayToString(allocation[i]));
                    }

                    for (int j = 0; j < RESOURCES; j++) {
                        work[j] += allocation[i][j];
                    }

                    finish[i] = true;
                    safeSequence[count] = i;
                    count++;
                    found = true;

                    if (showCalculation) {
                        System.out.println("New Work = Previous Work + Allocation");
                        System.out.println("         = " + arrayToString(work)
                                + " (after releasing P" + (i + 1) + "'s resources)");
                        System.out.println("Safe sequence so far: "
                                + sequenceToString(safeSequence, count));
                    }
                } else if (showCalculation) {
                    System.out.println("Result: NO. At least one Need value "
                            + "is greater than Work; check another process.");
                }
            }

            if (!found) {
                if (showCalculation) {
                    System.out.println("\nUNSAFE STATE: no unfinished process "
                            + "can satisfy Need <= Work.");
                    System.out.println("No complete safe sequence exists.");
                }
                return false;
            }
        }

        if (showCalculation) {
            System.out.println("\n========== FINAL RESULT ==========");
            System.out.println("System is in a SAFE STATE.");
            System.out.println("Safe sequence: " + sequenceToString(safeSequence, count));
        }
        return true;
    }

    static String sequenceToString(int[] sequence, int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            if (i > 0) {
                result.append(" -> ");
            }
            result.append("P").append(sequence[i] + 1);
        }
        return result.toString();
    }

    static synchronized void requestResources() {
        System.out.println("\nSelect patient/process (1-5):");
        for (int i = 0; i < PATIENTS; i++) {
            System.out.println((i + 1) + ". " + patientNames[i]);
        }
        System.out.print("Enter patient number: ");
        int patient = readInt();

        if (patient < 1 || patient > PATIENTS) {
            System.out.println("Invalid patient number.");
            return;
        }
        patient--;

        int[] request = new int[RESOURCES];
        System.out.println("Enter requested quantities in this order:");
        System.out.println("[ICU Beds, Ventilators, Oxygen Units, Monitoring Devices]");
        for (int j = 0; j < RESOURCES; j++) {
            System.out.print(resourceNames[j] + ": ");
            request[j] = readInt();
            if (request[j] < 0) {
                System.out.println("Request cancelled: quantities cannot be negative.");
                return;
            }
        }

        int[][] need = calculateNeed();
        for (int j = 0; j < RESOURCES; j++) {
            if (request[j] > need[patient][j]) {
                System.out.println("Request rejected: request exceeds remaining Need.");
                System.out.println("Current Need: " + arrayToString(need[patient]));
                return;
            }
        }

        calculateAvailable();
        for (int j = 0; j < RESOURCES; j++) {
            if (request[j] > available[j]) {
                System.out.println("Request rejected: insufficient Available resources.");
                System.out.println("Available: " + arrayToString(available));
                return;
            }
        }

        System.out.println("\nRequest passed Need and Available checks.");
        System.out.println("Temporarily allocating " + arrayToString(request)
                + " to P" + (patient + 1) + "...");

        for (int j = 0; j < RESOURCES; j++) {
            allocation[patient][j] += request[j];
        }

        // Print the full safety calculation for the tentative state.
        if (isSafe(true)) {
            System.out.println("\nREQUEST ACCEPTED: resulting state is safe.");
        } else {
            for (int j = 0; j < RESOURCES; j++) {
                allocation[patient][j] -= request[j];
            }
            System.out.println("\nREQUEST REJECTED: resulting state is unsafe.");
            System.out.println("Rollback completed; previous allocation restored.");
        }
    }

    static synchronized void releaseResources() {
        System.out.println("\nSelect patient/process (1-5):");
        for (int i = 0; i < PATIENTS; i++) {
            System.out.println((i + 1) + ". " + patientNames[i]);
        }
        System.out.print("Enter patient number: ");
        int patient = readInt();

        if (patient < 1 || patient > PATIENTS) {
            System.out.println("Invalid patient number.");
            return;
        }
        patient--;

        int[] release = new int[RESOURCES];
        System.out.println("Enter quantities to release in this order:");
        System.out.println("[ICU Beds, Ventilators, Oxygen Units, Monitoring Devices]");
        for (int j = 0; j < RESOURCES; j++) {
            System.out.print(resourceNames[j] + ": ");
            release[j] = readInt();

            if (release[j] < 0 || release[j] > allocation[patient][j]) {
                System.out.println("Invalid release. It cannot be negative or exceed allocation.");
                return;
            }
        }

        for (int j = 0; j < RESOURCES; j++) {
            allocation[patient][j] -= release[j];
        }

        System.out.println("Resources released successfully.");
        displayResources();
    }

    static void utilizationReport() {
        calculateAvailable();
        System.out.println("\n========== RESOURCE UTILIZATION ==========");
        for (int j = 0; j < RESOURCES; j++) {
            int used = total[j] - available[j];
            double percent = used * 100.0 / total[j];
            System.out.printf("%s: %d/%d allocated (%.2f%%)%n",
                    resourceNames[j], used, total[j], percent);
        }
    }

    static void simulateConcurrentRequests() {
        System.out.println("\nConcurrency demonstration: two threads share a lock.");

        Thread t1 = new Thread(() -> {
            synchronized (SafeCare.class) {
                System.out.println("Thread 1 acquired the resource-manager lock.");
                System.out.println("Thread 1 is simulating a request.");
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (SafeCare.class) {
                System.out.println("Thread 2 acquired the resource-manager lock.");
                System.out.println("Thread 2 is simulating a request.");
            }
        });

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.out.println("Concurrency demonstration interrupted.");
        }

        System.out.println("Concurrency demonstration completed.");
        System.out.println("Note: these threads demonstrate locking only; they do not allocate resources.");
    }

    static int readInt() {
        while (!sc.hasNextInt()) {
            System.out.print("Please enter a whole number: ");
            sc.next();
        }
        return sc.nextInt();
    }

    public static void main(String[] args) {
        int choice;

        do {
            System.out.println("\n========== SafeCare Menu ==========");
            System.out.println("1. View ICU Resources");
            System.out.println("2. Display Allocation / Need Table");
            System.out.println("3. Request Resources (with safety calculation)");
            System.out.println("4. Release Resources");
            System.out.println("5. Check Safe State (show all calculations)");
            System.out.println("6. Resource Utilization Report");
            System.out.println("7. Simulate Concurrent Requests");
            System.out.println("8. Exit");
            System.out.print("Enter your choice: ");

            choice = readInt();

            switch (choice) {
                case 1:
                    displayResources();
                    break;
                case 2:
                    displayAllocation();
                    break;
                case 3:
                    requestResources();
                    break;
                case 4:
                    releaseResources();
                    break;
                case 5:
                    isSafe(true);
                    break;
                case 6:
                    utilizationReport();
                    break;
                case 7:
                    simulateConcurrentRequests();
                    break;
                case 8:
                    System.out.println("Exiting SafeCare. Goodbye!");
                    break;
                default:
                    System.out.println("Invalid choice. Please select 1-8.");
            }
        } while (choice != 8);

        // Do not close the class-level Scanner before the program exits.
    }
}
