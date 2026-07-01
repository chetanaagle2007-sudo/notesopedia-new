import { UserNote } from "./types";

export interface UniversalSubject {
  name: string;
  code: string;
  category: string;
  description: string;
}

export const UNIVERSAL_SUBJECTS: UniversalSubject[] = [
  {
    name: "Data Structures & Algorithms",
    code: "CS-201",
    category: "Computer Science",
    description: "Fundamental abstractions, analysis of algorithms, tree structures, graph networks, and sorting strategies."
  },
  {
    name: "Advanced Quantum Mechanics",
    code: "PHYS-402",
    category: "Applied Physics",
    description: "Wave-particle duality, Schrödinger wave equation, quantum operators, spin systems, and perturbation theory."
  },
  {
    name: "Linear Algebra & Vector Spaces",
    code: "MATH-301",
    category: "Mathematics",
    description: "Systems of linear equations, matrices, eigenvalues and eigenvectors, inner product spaces, and transformations."
  },
  {
    name: "Macroeconomic Theory",
    code: "ECON-101",
    category: "Economics & Business",
    description: "National income determination, fiscal and monetary policies, inflation, aggregate demand, and economic growth."
  },
  {
    name: "Creative Writing & Literature Critique",
    code: "LIT-215",
    category: "Humanities",
    description: "Exploring rhetorical structures, literary devices, poetry composition, and contemporary critique methodology."
  },
  {
    name: "Human Anatomy & Physiology",
    code: "MED-110",
    category: "Medical Sciences",
    description: "Systemic overview of the human body, nervous control, cardiovascular pathways, and metabolic regulation."
  }
];

export const DEFAULT_UNIVERSAL_NOTES: UserNote[] = [
  {
    id: "univ-note-1",
    title: "Understanding Graph Traversal: BFS vs DFS Algorithms",
    content: "Graph traversal forms the core of network analysis, routing, and search space discovery.\n\n### Breadth-First Search (BFS)\n- **Strategy**: Explores level-by-level, visiting all neighbor vertices of a node before moving to deeper levels.\n- **Data Structure**: Uses a **Queue** (First-In, First-Out).\n- **Complexity**: $O(V + E)$ where $V$ is vertices and $E$ is edges.\n- **Key Use Case**: Finding the absolute shortest path on unweighted graphs.\n\n### Depth-First Search (DFS)\n- **Strategy**: Plunges as deep as possible along each branch before backtracking.\n- **Data Structure**: Uses a **Stack** (implicitly via recursion or explicitly).\n- **Complexity**: $O(V + E)$.\n- **Key Use Case**: Topological sorting, checking for cycles, and solving mazes.\n\n```python\n# Basic recursive DFS representation in Python\ndef dfs(graph, node, visited=None):\n    if visited is None:\n        visited = set()\n    if node not in visited:\n        print(f'Visiting vertex: {node}')\n        visited.add(node)\n        for neighbor in graph[node]:\n            dfs(graph, neighbor, visited)\n    return visited\n```",
    subjectName: "Data Structures & Algorithms",
    subjectCode: "CS-201",
    topicName: "Graph Algorithms",
    uploaderName: "Dr. Alisha Vance",
    uploaderRole: "Professor",
    uploaderEmail: "alisha.vance@university.edu",
    uploadedAt: "2026-06-29T10:30:00.000Z",
    likes: 42
  },
  {
    id: "univ-note-2",
    title: "The Schrödinger Equation & Wave Functions Demystified",
    content: "The Schrödinger Equation represents the cornerstone of modern quantum mechanics, describing how the quantum state of a physical system changes over time.\n\n### Time-Independent Schrödinger Equation\n$$\\hat{H}\\psi = E\\psi$$\n- $\\hat{H}$ is the Hamiltonian Operator (representing total energy).\n- $\\psi$ is the Wave Function (describes spatial probability amplitude).\n- $E$ is the total energy eigenvalue.\n\n### Interpretations of the Wave Function\nMax Born proposed that the square of the magnitude of the wave function, $|\\psi(x)|^2$, represents the probability density of finding a particle at a given coordinate $x$ at a specific time.\n\n- **Normalisation**: The probability of finding the particle *somewhere* in the universe must sum to 1.\n$$\\int_{-\\infty}^{\\infty} |\\psi(x)|^2 dx = 1$$",
    subjectName: "Advanced Quantum Mechanics",
    subjectCode: "PHYS-402",
    topicName: "Quantum Foundations",
    uploaderName: "Chetana Agle",
    uploaderRole: "Lead TA",
    uploaderEmail: "chetanaagle2007@gmail.com",
    uploadedAt: "2026-06-30T04:15:00.000Z",
    likes: 38
  },
  {
    id: "univ-note-3",
    title: "Key Macroeconomic Indicators & Policy Impacts",
    content: "How governments manipulate variables to direct national markets:\n\n1. **Gross Domestic Product (GDP)**:\n   $$GDP = C + I + G + (X - M)$$\n   - $C$: Private Consumption\n   - $I$: Capital Investments\n   - $G$: Government Spending\n   - $(X-M)$: Net Exports (Exports minus Imports)\n\n2. **Fiscal Policy Tools**:\n   - **Taxation Changes**: Adjusts consumer disposable income and spending power.\n   - **Government Investment**: Directly stimulates target industries and increases public employment.\n\n3. **Monetary Policy Tools** (Managed by Central Banks):\n   - **Reserve Requirements**: Minimum liquid cash reserves banks must hold.\n   - **Discount Rate**: The lending rate charged to commercial entities.\n   - **Open Market Operations**: Buying/selling treasury bills to influence cash liquidity.",
    subjectName: "Macroeconomic Theory",
    subjectCode: "ECON-101",
    topicName: "Economic Indicators",
    uploaderName: "Amit Sharma",
    uploaderRole: "Student",
    uploaderEmail: "amit.sharma99@student.edu",
    uploadedAt: "2026-06-30T07:45:00.000Z",
    likes: 19
  }
];
