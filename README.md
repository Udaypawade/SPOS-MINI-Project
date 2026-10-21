# SafeCare: ICU Resource Allocation & Deadlock Avoidance System
### Systems Programming & Operating Systems (SPOS) Mini-Project • B.Tech Third Year (Semester VI)

---

## 📌 Project Overview
**SafeCare** is an Operating Systems mini-project that models an **Intensive Care Unit (ICU) Critical Care Allocation System** using **Edsger W. Dijkstra's Banker's Algorithm** for deadlock avoidance and **Java Monitor Locks (`synchronized`)** for thread concurrency control.

In high-pressure clinical healthcare environments, critical medical equipment (ICU Beds, Ventilators, Oxygen Units, and Monitoring Devices) is strictly finite. Unregulated resource claiming can lead to **Circular Wait** and complete system deadlock, risking patient lives. SafeCare dynamically evaluates incoming allocation requests to ensure the hospital never leaves a **Safe State**.

---

## 🏗️ Architecture & Component Mapping
The frontend is built entirely using **HTML5, CSS3, and Vanilla JavaScript (ES6)**, directly mirroring the mathematical model and methods of `SafeCare.java` **without modifying any lines of the Java code**:

| SafeCare.java Function | Web Application Feature | Description |
| :--- | :--- | :--- |
| `displayResources()` (Option 1) | **Resource Dashboard Cards & KPI Ribbon** | Displays live Total, Allocated, and Available counts for all 4 ICU resources with visual progress gauges. |
| `displayAllocation()` (Option 2) | **Banker's Allocation Matrix Table** | Real-time interactive table showing Maximum Claim ($Max$), Current Allocation ($Alloc$), Remaining Need ($Need = Max - Alloc$), and Available Vector. |
| `requestResources()` (Option 3) | **Request Resources Manager (Tab 3)** | Interactive wizard checking: <br>1. $Request \le Need$<br>2. $Request \le Available$<br>3. Tentative allocation + `isSafe()` validation with automatic rollback on unsafe states. |
| `releaseResources()` (Option 4) | **Release Resources Manager (Tab 3)** | Frees allocated resources back into the Available pool with range validation ($0 \le Release \le Alloc$). |
| `isSafe(true)` (Option 5) | **Banker's Safety Inspector (Tab 2)** | Animated step-by-step trace of Dijkstra's algorithm, calculating Work vector progression, process evaluations, and identified Safe Sequences (e.g. $P_1 \rightarrow P_2 \rightarrow P_3 \rightarrow P_4 \rightarrow P_5$). |
| `utilizationReport()` (Option 6) | **ICU Resource Utilization Cards (Tab 1)** | Percentage utilization breakdown for each resource. |
| `simulateConcurrentRequests()` (Option 7) | **Concurrency & Mutex Simulator (Tab 4)** | Visual demonstration of two threads ($T_1$ and $T_2$) competing for the shared `SafeCare.class` monitor lock to prevent race conditions during allocation. |
| `main()` CLI Loop | **Integrated SafeCare Virtual Console (Tab 6)** | In-browser command-line interface that runs menu options 1–8 with identical terminal formatting. |

---

## 🏥 Hospital Model Specifications

### 1. Patients (Processes): 5
- $P_1$: Patient P1
- $P_2$: Patient P2
- $P_3$: Patient P3
- $P_4$: Patient P4
- $P_5$: Patient P5

### 2. ICU Resources: 4 Types
- **Resource 1 (R1):** ICU Beds (Total instances = 5)
- **Resource 2 (R2):** Ventilators (Total instances = 3)
- **Resource 3 (R3):** Oxygen Units (Total instances = 4)
- **Resource 4 (R4):** Monitoring Devices (Total instances = 6)
- **Total Vector:** `[5, 3, 4, 6]`

### 3. Maximum Claim Matrix ($Max$):
```
P1: [1, 1, 1, 2]
P2: [1, 1, 2, 2]
P3: [1, 1, 1, 1]
P4: [1, 0, 2, 1]
P5: [1, 0, 1, 2]
```

---

## 🚀 How to Run the Project

### Option A: Open Frontend Directly
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave):
```bash
# On Windows, you can double-click index.html or run in PowerShell:
start index.html
```

### Option B: Run with Python Local HTTP Server
```bash
cd c:\Users\HP\Desktop\SPOSMINI
python -m http.server 8080
```
Then navigate to: **`http://localhost:8080`** in your browser.

### Option C: Run Java CLI Program
To run the original backend Java code:
```bash
javac SafeCare.java
java SafeCare
```

---

## 🎯 Viva & Examination Highlights (B.Tech 3rd Year SPOS)

1. **What is Banker's Algorithm?**
   - A deadlock avoidance algorithm that simulates tentative resource allocations and verifies if a system remains in a safe state before granting resources.
2. **Safe State vs Unsafe State:**
   - A state is safe if there exists at least one sequence of processes $\langle P_1, P_2, \dots, P_n \rangle$ such that every process can satisfy its maximum demand using currently available units plus units freed by prior processes.
   - An unsafe state is not necessarily deadlocked, but may lead to deadlock if processes request their maximum claim simultaneously.
3. **Difference between Deadlock Avoidance and Prevention:**
   - *Prevention* statically constrains how requests can be made by breaking at least one of the 4 Coffman conditions (e.g., spooling, preemption, resource ordering).
   - *Avoidance* dynamically inspects every request at runtime using state algorithms like Banker's.
4. **Why is synchronization required?**
   - Multi-threaded environments (such as multiple wards making concurrent bed/ventilator requests) risk race conditions where two threads allocate the same available unit simultaneously. `synchronized(SafeCare.class)` ensures atomicity.
