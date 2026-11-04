/**
 * Test Data Fixtures
 * Mock users, clients, and seed data
 */

import { CONFIG } from '../config';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  id?: string;
  token?: string;
}

export interface TestClient {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: 'activo' | 'inactivo';
  id?: string;
  userId?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: CONFIG.TEST_USERS.admin.email,
    password: CONFIG.TEST_USERS.admin.password,
    role: CONFIG.TEST_USERS.admin.role,
  },
  agent: {
    email: CONFIG.TEST_USERS.agent.email,
    password: CONFIG.TEST_USERS.agent.password,
    role: CONFIG.TEST_USERS.agent.role,
  },
  viewer: {
    email: CONFIG.TEST_USERS.viewer.email,
    password: CONFIG.TEST_USERS.viewer.password,
    role: CONFIG.TEST_USERS.viewer.role,
  },
};

export const TEST_CLIENTS: TestClient[] = CONFIG.TEST_CLIENTS;

export function createTestClient(overrides: Partial<TestClient> = {}): TestClient {
  const timestamp = Date.now();
  return {
    nombre: `Cliente ${timestamp}`,
    email: `cliente${timestamp}@test.local`,
    telefono: `555-${String(timestamp).slice(-4)}`,
    direccion: `Test Address ${timestamp}`,
    estado: 'activo',
    ...overrides,
  };
}

export function createBulkTestClients(count: number): TestClient[] {
  return Array.from({ length: count }, (_, i) => ({
    nombre: `Bulk Cliente ${i + 1}`,
    email: `bulk${i}@test.local`,
    telefono: `555-${String(1000 + i).slice(-4)}`,
    direccion: `Bulk Address ${i + 1}`,
    estado: i % 2 === 0 ? 'activo' : 'inactivo',
  }));
}

export function createNewClientForm(): Record<string, string> {
  const timestamp = Date.now();
  return {
    nombre: `New Cliente ${timestamp}`,
    email: `new${timestamp}@test.local`,
    telefono: `555-9${String(timestamp).slice(-3)}`,
    direccion: `New Test Address ${timestamp}`,
  };
}

export function getAdminUser(): TestUser {
  return TEST_USERS.admin;
}

export function getAgentUser(): TestUser {
  return TEST_USERS.agent;
}

export function getViewerUser(): TestUser {
  return TEST_USERS.viewer;
}
