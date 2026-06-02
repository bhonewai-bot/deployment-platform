import { vi } from "vitest";

// Mock Next.js server-only guard so test files can import server modules
vi.mock("server-only", () => ({}));
