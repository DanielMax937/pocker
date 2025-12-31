import { NextRequest } from 'next/server'

export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Request {
  const { method = 'GET', body, headers = {} } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new Request(new URL(url, 'http://localhost:3000'), requestInit)
}

export async function parseResponse(response: Response) {
  const data = await response.json()
  return {
    status: response.status,
    data,
  }
}

export function mockOpenAI() {
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    action: 'CALL',
                    reason: 'Test AI decision',
                    amount: 100,
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  }))
}

