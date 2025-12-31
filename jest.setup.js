// Jest setup for API tests
// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      })
    },
  },
  NextRequest: jest.fn(),
}))

