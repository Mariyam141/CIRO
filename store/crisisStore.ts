import { create } from 'zustand';

export type AgentState = "idle" | "thinking" | "done" | "error";

export type UserRole = "admin" | "user";

export type CurrentUser = {
  role: UserRole;
  name: string;
  email: string;
};

const CREDENTIALS: Record<string, { password: string; user: CurrentUser }> = {
  "admin@ciro.pk": { password: "admin123", user: { role: "admin", name: "Admin", email: "admin@ciro.pk" } },
  "user@ciro.pk":  { password: "user123",  user: { role: "user",  name: "User",  email: "user@ciro.pk"  } },
};

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

  // Auth
  currentUser: CurrentUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

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

const buildOperationalResetState = () => ({
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
});

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
    executedActions: prev.executedActions.includes(id)
      ? prev.executedActions
      : [...prev.executedActions, id]
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

  currentUser: null,
  login: (email, password) => {
    const entry = CREDENTIALS[email.toLowerCase().trim()];
    if (entry && entry.password === password) {
      const update: Partial<CrisisStore> = { currentUser: entry.user };
      if (entry.user.role === 'user') {
        // Pre-seed live situation for field officer on login
        (update as any).activeCrises = [
          { crisis_id: 'C001', type: 'urban_flooding',  location: 'Surjani Town',   coordinates: { lat: 24.9801, lng: 67.0359 }, severity: 'critical', confidence: 91, affected_population: 45000,  expected_duration_hours: 4 },
          { crisis_id: 'C002', type: 'heatwave',        location: 'North Karachi',  coordinates: { lat: 24.9924, lng: 67.0637 }, severity: 'high',     confidence: 84, affected_population: 120000, expected_duration_hours: 8 },
        ];
      }
      set(update as any);
      return true;
    }
    return false;
  },
  logout: () => set({
    ...buildOperationalResetState(),
    currentUser: null,
  }),

  resetAll: () => set(buildOperationalResetState()),
}));
