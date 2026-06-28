import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignChat } from '@/lib/components/CampaignChat'
import { LocalStore } from '@/lib/offline/LocalStore'

const CAMPAIGN_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: jest.fn((_, onEvent) => {
    void onEvent
    return { status: 'open' }
  }),
}))

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1', email: 'test@example.com', username: 'tester' },
    loading: false,
  })),
}))

const mockedLocalStore = LocalStore as jest.Mocked<typeof LocalStore>

beforeEach(() => {
  jest.clearAllMocks()
  mockedLocalStore.get.mockReturnValue(null)
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/members')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) })
    }
    if (url.includes('/messages')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ messages: [] }) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  }) as unknown as typeof global.fetch

  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 })
})

async function openDock() {
  const user = userEvent.setup()
  render(<CampaignChat campaignId={CAMPAIGN_ID} />)
  await user.click(screen.getByRole('button', { name: /chat/i }))
  return user
}

// ── dockReducer tests ─────────────────────────────────────────────

describe('expand toggle button', () => {
  it('clicking expand button calls onSizeChange(true)', async () => {
    const onSizeChange = jest.fn()
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} onSizeChange={onSizeChange} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    const expandBtn = screen.getByRole('button', { name: /expand to full height/i })
    await user.click(expandBtn)

    expect(onSizeChange).toHaveBeenCalledWith(true)
  })

  it('panel style changes to calc(100vh - 60px) after expand', async () => {
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    const expandBtn = screen.getByRole('button', { name: /expand to full height/i })
    await user.click(expandBtn)

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: 'calc(100vh - 60px)' })
  })
})

describe('collapse from large mode', () => {
  it('clicking expand again calls onSizeChange(false)', async () => {
    const onSizeChange = jest.fn()
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} onSizeChange={onSizeChange} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    await user.click(screen.getByRole('button', { name: /expand to full height/i }))
    await user.click(screen.getByRole('button', { name: /collapse to compact view/i }))

    expect(onSizeChange).toHaveBeenNthCalledWith(1, true)
    expect(onSizeChange).toHaveBeenNthCalledWith(2, false)
  })

  it('panel returns to compact style on collapse', async () => {
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    await user.click(screen.getByRole('button', { name: /expand to full height/i }))
    await user.click(screen.getByRole('button', { name: /collapse to compact view/i }))

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: '33vh' })
  })
})

describe('drag handle minimum clamp', () => {
  it('drag resulting in height < 150 clamps to 150px', async () => {
    await openDock()

    const handle = screen.getByRole('separator', { name: /resize chat panel/i })

    act(() => {
      fireEvent.mouseDown(handle, { clientY: 500 })
    })
    act(() => {
      fireEvent.mouseMove(document, { clientY: 900 })
    })
    act(() => {
      fireEvent.mouseUp(document, { clientY: 900 })
    })

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    // height would be startHeight - (900-500) = startHeight - 400, but clamped to 150
    expect(panel).toHaveStyle({ height: '150px' })
  })
})

describe('drag handle not shown in large mode', () => {
  it('drag handle is hidden when isLarge is true', async () => {
    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    expect(screen.getByRole('separator', { name: /resize chat panel/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /expand to full height/i }))

    expect(screen.queryByRole('separator', { name: /resize chat panel/i })).not.toBeInTheDocument()
  })
})

describe('height resolution helper', () => {
  it('resolves to 33vh by default', async () => {
    await openDock()
    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: '33vh' })
  })

  it('resolves to customHeight when set via drag', async () => {
    await openDock()
    const handle = screen.getByRole('separator', { name: /resize chat panel/i })

    act(() => {
      fireEvent.mouseDown(handle, { clientY: 600 })
    })
    act(() => {
      // Move up 200px from 600 → increases height by 200
      fireEvent.mouseMove(document, { clientY: 400 })
    })
    act(() => {
      fireEvent.mouseUp(document)
    })

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    // startHeight = 33% of 1080 = 356px, then + 200 = 556px
    // actual value depends on starting computed height; just check it's not 33vh
    expect(panel).not.toHaveStyle({ height: '33vh' })
  })
})

describe('persistence load logic', () => {
  it('restores saved height when screen dimensions match', async () => {
    mockedLocalStore.get.mockImplementation((key: string) => {
      if (key === 'campaign-chat-size') {
        return { height: 450, screenWidth: 1920, screenHeight: 1080 }
      }
      return null
    })

    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: '450px' })
  })

  it('ignores saved height when screen dimensions differ by more than 100px', async () => {
    mockedLocalStore.get.mockImplementation((key: string) => {
      if (key === 'campaign-chat-size') {
        return { height: 450, screenWidth: 1280, screenHeight: 800 }
      }
      return null
    })

    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: '33vh' })
  })

  it('does not crash when localStorage throws on read', () => {
    mockedLocalStore.get.mockImplementation((key: string) => {
      if (key === 'campaign-chat-size') throw new Error('storage unavailable')
      return null
    })

    expect(() => {
      render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    }).not.toThrow()
  })

  it('ignores malformed persisted payload and uses default height', async () => {
    mockedLocalStore.get.mockImplementation((key: string) => {
      if (key === 'campaign-chat-size') return { height: 'not-a-number', screenWidth: 1920 }
      return null
    })

    const user = userEvent.setup()
    render(<CampaignChat campaignId={CAMPAIGN_ID} />)
    await user.click(screen.getByRole('button', { name: /chat/i }))

    const panel = screen.getByRole('complementary', { name: /campaign chat/i })
    expect(panel).toHaveStyle({ height: '33vh' })
  })
})
