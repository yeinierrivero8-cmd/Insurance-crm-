/**
 * E2E Test Configuration
 * Global URLs, timeouts, and test user credentials
 */

export const CONFIG = {
  // URLs
  BASE_URL: 'http://localhost:5173',
  API_BASE: 'http://localhost:5000/api',

  // Timeouts
  FETCH_TIMEOUT: 10000,
  PAGE_LOAD_TIMEOUT: 30000,
  ACTION_TIMEOUT: 5000,

  // Test Users - MUST exist in the test database
  TEST_USERS: {
    admin: {
      email: 'admin@insuraflow.com',
      password: 'Admin@123',
      role: 'admin',
    },
    agent: {
      email: 'agent@insuraflow.com',
      password: 'Agent@123',
      role: 'agent',
    },
    viewer: {
      email: 'viewer@insuraflow.com',
      password: 'Viewer@123',
      role: 'viewer',
    },
  },

  // Test Clients - for seeding
  TEST_CLIENTS: [
    {
      nombre: 'Cliente Test 1',
      email: 'cliente1@test.local',
      telefono: '555-0001',
      direccion: 'Test Address 1',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 2',
      email: 'cliente2@test.local',
      telefono: '555-0002',
      direccion: 'Test Address 2',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 3',
      email: 'cliente3@test.local',
      telefono: '555-0003',
      direccion: 'Test Address 3',
      estado: 'inactivo',
    },
    {
      nombre: 'Cliente Test 4',
      email: 'cliente4@test.local',
      telefono: '555-0004',
      direccion: 'Test Address 4',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 5',
      email: 'cliente5@test.local',
      telefono: '555-0005',
      direccion: 'Test Address 5',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 6',
      email: 'cliente6@test.local',
      telefono: '555-0006',
      direccion: 'Test Address 6',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 7',
      email: 'cliente7@test.local',
      telefono: '555-0007',
      direccion: 'Test Address 7',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 8',
      email: 'cliente8@test.local',
      telefono: '555-0008',
      direccion: 'Test Address 8',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 9',
      email: 'cliente9@test.local',
      telefono: '555-0009',
      direccion: 'Test Address 9',
      estado: 'activo',
    },
    {
      nombre: 'Cliente Test 10',
      email: 'cliente10@test.local',
      telefono: '555-0010',
      direccion: 'Test Address 10',
      estado: 'activo',
    },
  ],
};
