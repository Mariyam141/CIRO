import { create } from 'zustand';

export type AgentState = "idle" | "thinking" | "done" | "error";

export type Crisis = {
  crisis_id: string;
  type: string;
  location: string;
  coordinates: { lat: number; lng: number };
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  affected_population: number;
  expected_duration_hours: number;
};

export type Action = {
  id: string;
  type: string;
  description: string;
  priority: number;
  crisis_id: string;
  estimated_impact: string;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  status: "info" | "success" | "warning" | "error";
};

interface CrisisStore {
  // Signal state
  inputText: string;
  setInputText: (text: string) => void;

  // Agent states
  agentStates: {
    fusion: AgentState;
    detection: AgentState;
    allocation: AgentState;
    execution: AgentState;
    verification: AgentState;
  };
  setAgentState: (agent: keyof CrisisStore['agentStates'], state: AgentState) => void;

  // Agent outputs
  fusionOutput: any | null;
  detectionOutput: any | null;
  allocationOutput: any | null;
  executionOutput: any | null;
  verificationOutput: any | null;
  setAgentOutput: (agent: string, output: any) => void;

  // Agent logs
  agentLogs: { [agent: string]: string[] };
  appendAgentLog: (agent: string, line: string) => void;
  clearAgentLogs: () => void;

  // Crises
  activeCrises: Crisis[];
  setActiveCrises: (crises: Crisis[]) => void;

  // Actions
  actions: Action[];
  setActions: (actions: Action[]) => void;
  executedActions: string[];
  markActionExecuted: (id: string) => void;

  // Full execution logs
  executionLogs: LogEntry[];
  appendLog: (entry: LogEntry) => void;
  clearLogs: () => void;

  // Demo mode
  isDemoRunning: boolean;
  setDemoRunning: (val: boolean) => void;

  // False alarm
  falseAlarmDetected: boolean;
  setFalseAlarm: (val: boolean) => void;

  // Degraded mode
  isDegradedMode: boolean;
  setDegradedMode: (val: boolean) => void;

  // Reset everything
  resetAll: () => void;
}

const initialAgentStates = {
  fusion: "idle" as AgentState,
  detection: "idle" as AgentState,
  allocation: "idle" as AgentState,
  execution: "idle" as AgentState,
  verification: "idle" as AgentState,
};

export const useCrisisStore = create<CrisisStore>((set, get) => ({
  inputText: "",
  setInputText: (text) => set({ inputText: text }),

  agentStates: { ...initialAgentStates },
  setAgentState: (agent, state) => set((prev) => ({
    agentStates: { ...prev.agentStates, [agent]: state }
  })),

  fusionOutput: null,
  detectionOutput: null,
  allocationOutput: null,
  executionOutput: null,
  verificationOutput: null,
  setAgentOutput: (agent, output) => {
    switch(agent) {
      case 'fusion': set({ fusionOutput: output }); break;
      case 'detection': set({ detectionOutput: output }); break;
      case 'allocation': set({ allocationOutput: output }); break;
      case 'execution': set({ executionOutput: output }); break;
      case 'verification': set({ verificationOutput: output }); break;
    }
  },

  agentLogs: {},
  appendAgentLog: (agent, line) => set((prev) => {
    const logs = prev.agentLogs[agent] || [];
    return {
      agentLogs: {
        ...prev.agentLogs,
        [agent]: [...logs, line]
      }
    };
  }),
  clearAgentLogs: () => set({ agentLogs: {} }),

  activeCrises: [],
  setActiveCrises: (crises) => set({ activeCrises: crises }),

  actions: [],
  setActions: (actions) => set({ actions }),
  executedActions: [],
  markActionExecuted: (id) => set((prev) => ({
    executedActions: [...prev.executedActions, id]
  })),

  executionLogs: [],
  appendLog: (entry) => set((prev) => ({
    executionLogs: [...prev.executionLogs, entry]
  })),
  clearLogs: () => set({ executionLogs: [] }),

  isDemoRunning: false,
  setDemoRunning: (val) => set({ isDemoRunning: val }),

  falseAlarmDetected: false,
  setFalseAlarm: (val) => set({ falseAlarmDetected: val }),

  isDegradedMode: false,
  setDegradedMode: (val) => set({ isDegradedMode: val }),

  resetAll: () => set({
    inputText: "",
    agentStates: { ...initialAgentStates },
    fusionOutput: null,
    detectionOutput: null,
    allocationOutput: null,
    executionOutput: null,
    verificationOutput: null,
    agentLogs: {},
    activeCrises: [],
    actions: [],
    executedActions: [],
    executionLogs: [],
    isDemoRunning: false,
    falseAlarmDetected: false,
    isDegradedMode: false,
  }),
}));
